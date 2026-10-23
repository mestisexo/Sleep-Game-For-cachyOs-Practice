# Design

## Context

La terminal actual es un núcleo puro y testeable en Node: `vfs.ts` mantiene un árbol en memoria, `commands.ts` registra doce handlers sobre `{ vfs, cwd }`, `shell.ts` tokeniza y despacha, y `useTerminal.ts` aplica `stdout`/`stderr`/código a estado reactivo. El HTML inicial es determinista y hay una suite con `node:test` sin DOM.

Ese núcleo no puede crecer dentro de un solo archivo ni puede depender de Vue: las misiones, los paquetes y el editor necesitan estado y eventos, pero la lógica debe seguir siendo probable sin navegador. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Mantener el núcleo de terminal (VFS, catálogo, comandos, shell, misiones) puro y ejecutable en Node.
- Un único contrato de ejecución que transporte salida, código y efectos estructurados.
- Progreso de misiones derivado de hechos, no de texto ni de diffs del árbol.
- Descubrimiento sin descripciones, con una sola fuente de verdad para nombres, uso y flags.
- Editor y paquetes simulados sin romper el renderizado determinista ni el aislamiento.

**Non-Goals:**

- Redirecciones, tuberías, globs, variables de entorno o `man` con prosa.
- Dependencias, versiones, descargas o repositorios reales en `apt`.
- Autocompletado de rutas (solo nombres de comando).
- Persistir el sistema de archivos virtual entre recargas.
- Permisos por archivo, fechas de modificación o usuarios múltiples reales.

## Decisions

### D1. Capas con núcleo puro y orquestación reactiva

```
+-------------------------------------------------------------+
|  UI Vue                                                     |
|  SimulatedTerminal | NanoEditor | MissionsPanel             |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|  useTerminal (sesión reactiva)                              |
|  aplica salida | evalúa misiones | guarda progreso | editor |
+--------------+-------------------------------+--------------+
               |                               |
+--------------v--------------+  +-------------v--------------+
|  shell.ts                   |  |  missions/evaluate.ts      |
|  tokenize | runCommand      |  |  puro: evento -> ids       |
|  --help | efectos           |  +----------------------------+
+--------------+--------------+
               |
+--------------v--------------+  +----------------------------+
|  commands/ (catálogo)       |->|  vfs.ts (árbol puro)       |
|  handlers -> ExecResult     |  +----------------------------+
+-----------------------------+
```

La UI nunca importa `vfs` ni `commands` directamente. `useTerminal` es el único punto que convierte una interacción (línea enviada o guardado del editor) en un `CommandEvent` y lo entrega al evaluador.

**Alternativa descartada:** poner la lógica de misiones dentro de los handlers. Acopla el juego a cada comando, impide reutilizar comandos y obliga a tocar doce handlers por cada misión nueva.

### D2. Catálogo de especificaciones y resolución en dos niveles

`commands.ts` se convierte en `commands/` con un catálogo de `CommandSpec`:

```ts
interface CommandSpec {
  name: string
  usage: string                      // "uso: ls [-a] [-l] [ruta...]"
  flags?: readonly FlagSpec[]
  run: CommandHandler
  origin: 'builtin' | { package: string }
}
```

`resolveCommand(name, packages)` consulta primero los builtins y después los comandos aportados por paquetes instalados. `help` deriva la lista de nombres del catálogo resuelto, sin texto descriptivo. `--help` se intercepta en `runCommand` antes de llamar al handler, de modo que ningún comando implementa su propia ayuda.

**Por qué:** una sola fuente para ayuda, TAB, `which` y errores de opción. **Alternativa descartada:** mantener `HELP_LINES` y añadir metadatos aparte; vuelve a permitir desincronización.

### D3. Efectos estructurados en el contrato de ejecución

`ExecResult` gana `effects?: TerminalEffect[]`. Los efectos se emiten solo cuando la operación tuvo éxito y describen el hecho, no el texto:

| Comando | Efecto |
| --- | --- |
| `mkdir`, `touch` (nuevo), `cp` | `fs.create` con `kind` |
| `nano` al guardar | `fs.write` con `created` y `changed` |
| `rm`, `rmdir` | `fs.remove` con `kind` |
| `mv` | `fs.move` |
| `cd` | `cwd.change` |
| `clear` | `screen.clear` |
| `apt install` | `pkg.install` |
| `apt update` | `pkg.index.update` |

Reglas: un `rm -r` emite un solo efecto para el objetivo de nivel superior; un `touch` sobre un archivo existente no emite nada; los comandos de lectura no emiten efectos. `cp` emite `fs.create` (nunca `fs.write`) para que copiar no complete la misión de edición.

**Alternativas descartadas:** comparar el VFS antes y después (no distingue un `mkdir` fallido de uno idempotente y es costoso); analizar `stdout` (frágil ante cambios de mensajes).

### D4. Evaluador de misiones declarativo y puro

```ts
interface CommandEvent {
  name: string          // comando efectivo, sin `sudo`
  args: string[]
  cwd: string
  code: number
  effects: TerminalEffect[]
}

interface MissionGoal {
  command?: string
  effect?: TerminalEffect['type']
  kind?: 'file' | 'dir'
  changed?: boolean
  package?: string
  requiresArgs?: boolean
}
```

`matches(goal, event)` exige `code === 0` y que todos los campos presentes en el objetivo coincidan (AND). `evaluate(event, progress)` devuelve los identificadores de misiones recién completadas; el llamador aplica XP y deduplica contra el conjunto persistido. El evaluador no conoce Vue, ni el DOM, ni el almacenamiento.

**Por qué declarativo:** el catálogo es serializable, testeable como datos y no ejecuta código arbitrario. **Alternativa descartada:** predicados `(event) => boolean`; más flexibles, pero imposibles de validar y de serializar.

### D5. Experiencia, niveles y catálogo inicial

Umbrales: nivel 1 en 0 XP, nivel 2 en 30, nivel 3 en 60, nivel 4 en 100. El nivel se deriva del XP; nunca se guarda por separado ni baja.

| id | XP | Nivel | Objetivo | Pista (sin nombre de comando) |
| --- | --- | --- | --- | --- |
| `crear-carpeta` | 10 | 1 | `fs.create` de tipo `dir` | Necesitas un sitio donde guardar tus cosas. |
| `borrar-archivo` | 15 | 1 | `fs.remove` de tipo `file` | Sobra algo en tu escritorio. |
| `leer-archivo` | 15 | 1 | `cat` con código 0 y argumentos | Hay una nota que no has leído. |
| `editar-archivo` | 25 | 2 | `fs.write` con `changed: true` | Tu diario sigue en blanco. |
| `instalar-paquete` | 35 | 3 | `pkg.install` | Te falta una herramienta para dibujar. |

Total 100 XP: completar las tres primeras desbloquea el nivel 2 (40 XP), la edición lleva a nivel 3 (65 XP) y la instalación cierra en nivel 4. Una misión solo está disponible si `level >= minLevel`; el panel muestra la primera misión incompleta disponible.

El XP se otorga una sola vez por misión. Los comandos sueltos no dan XP, para que `ls` no se pueda farmear. Completar una misión es histórico: borrar la carpeta creada después no la des-completa.

### D6. Persistencia local e hidratación sin romper SSR

```ts
type Progress = { version: 1; xp: number; completed: string[] }
```

Clave `sleepgame.progress`. Se valida al leer: `version` exacta, `xp` finito y no negativo, `completed` como array de identificadores conocidos y sin duplicados. Versión desconocida, JSON corrupto o almacenamiento inaccesible reinician el progreso en memoria sin mostrar errores. `localStorage` se lee en `onMounted`; el estado inicial del render (nivel 1, 0 XP) es constante en servidor y cliente, y un flag `hydrated` evita que el panel anuncie progreso antes de cargarlo.

El VFS no se persiste: cada carga parte de `createInitialVfs()`. El progreso y el mundo son independientes, así que recargar no pierde misiones ni des-completa nada.

**Alternativas descartadas:** persistir el VFS (rompe el requisito de reinicio y complica el determinismo); guardar el progreso en servidor (no hay backend ni cuentas).

### D7. Editor `nano` como diálogo modal

`nano` devuelve `editor: { path: string | null; content: string }` en su `ExecResult`. `useTerminal` abre el diálogo y pausa el procesamiento de líneas. El guardado no pasa por `executeLine`: llama a `saveBuffer`, que escribe el VFS, emite `fs.write` y evalúa la misión con un evento `{ name: 'nano', args: [path], code: 0, effects }`. Así el editor comparte el camino de efectos y misiones con el resto.

Estados:

```
closed --nano ruta--> open --^O--> guardar --> open
                        |  ^X sin cambios --> closed
                        |  ^X con cambios --> confirmar --S--> guardar + closed
                                                   --N--> closed
                                                   --C--> open
```

El diálogo usa `<dialog>` nativo con `showModal()` para contener el foco; se intercepta `cancel` para que Escape no cierre (nano no lo hace) y se restaura el foco al input al cerrar. Los botones Guardar/Salir cubren el uso táctil.

**Alternativas descartadas:** `ed` (fiel pero críptico para el jugador) y redirecciones `>` (obligan a reescribir el tokenizador y contradicen el requisito vigente de operadores literales).

### D8. Paquetes simulados y `sudo`

`ShellState` pasa a `{ vfs, cwd, packages, elevated }`, con `packages = { indexReady: boolean; installed: Set<string> }`. `sudo` ejecuta el comando destino con `elevated: true` mediante el mismo despachador, con un límite de profundidad para evitar recursión. `apt` exige `elevated` para `update` e `install`; sin él responde código `100`.

`apt install` actualiza `packages.installed`, habilita el comando en el resolvedor y reescribe el espejo `/var/lib/dpkg/status` del VFS, con una entrada por paquete. El catálogo es estático: `cowsay`, `fortune` y `figlet`, sin dependencias ni versiones. `which` sintetiza `/usr/bin/<nombre>` para cualquier nombre resoluble y devuelve `1` si no existe.

**Por qué el espejo en VFS:** el estado se vuelve observable con `cat`/`grep` sin inventar comandos nuevos. **Riesgo aceptado:** el espejo puede desincronizarse del `Set`; se regenera por completo en cada instalación y las pruebas lo cubren.

### D9. Opciones con un parser compartido

`parseFlags(args, spec)` devuelve `{ flags, operands }`, admite opciones cortas combinadas (`-la`), `--` como terminador y rechaza opciones desconocidas con una línea de uso en `stderr` y código `2`. Los comandos sin flags también rechazan argumentos que empiezan por `-`. `--help` se resuelve antes del parser.

**Alternativa descartada:** que cada handler interprete sus flags; hoy `ls -la` se trata como una ruta y produce `ENOENT`, un comportamiento engañoso.

### D10. Contenido inicial y formato largo

El VFS inicial gana `misiones/` con un archivo por encargo, `/etc/apt/sources.list` y `/var/lib/dpkg/status` vacío. `ls -l` deriva permisos fijos (`drwxr-xr-x` o `-rw-r--r--`), propietario `guest`, tamaño en bytes del contenido (4096 para directorios) y nombre; se omite la fecha para no introducir valores no deterministas. `grep` usa `RegExp` de JavaScript y distingue `0` (coincidencias), `1` (ninguna) y `2` (error).

### D11. Interfaz

La rejilla ancha pasa a tres columnas: personaje (192 px), terminal (flexible) y panel de misiones (220-280 px). Por debajo de 1100 px el panel baja debajo de la terminal y el personaje conserva su tamaño. El panel muestra nivel, barra de XP, misión actual, pista y estado de completadas, con `aria-live="polite"` para anunciar el progreso. La finalización también se refleja como línea de sistema en la terminal.

El autocompletado con TAB se resuelve en el `keydown` del input, solo sobre el primer token; si hay una coincidencia, completa con un espacio final; si hay varias, escribe la lista en la terminal sin ejecutar.

### D12. Pruebas

La suite se divide por módulos (`tests/vfs.test.ts`, `commands.test.ts`, `shell.test.ts`, `missions.test.ts`, `packages.test.ts`, `editor.test.ts`, `useTerminal.test.ts`) y `test:terminal` pasa a ejecutar el directorio. Todo el núcleo se prueba sin DOM; solo el foco, el diálogo y el TAB quedan para verificación manual o de integración. `verify-server.sh` comprueba que `/terminal` sigue respondiendo con el panel y sin descripciones de comandos en el HTML.

## Risks / Trade-offs

- **El delta de `simulated-terminal` no se puede archivar sin la especificación base** → primera tarea: archivar `add-simulated-terminal`; `openspec validate` ya avisa de que `MODIFIED` requiere un spec existente.
- **Flash de progreso al hidratar** → el panel usa el estado inicial hasta `onMounted`; se acepta un cambio visual breve a cambio de HTML determinista.
- **El editor escribe fuera de `executeLine` y podría saltarse las misiones** → `saveBuffer` es el único camino de guardado y emite el mismo `CommandEvent` que el shell.
- **Duplicación o deriva de efectos entre handlers** → tabla de efectos en D3 y pruebas por comando; un efecto solo se emite tras éxito.
- **`localStorage` lleno o bloqueado** → se captura el error y se continúa en memoria; el juego no se bloquea.
- **Escape y foco del diálogo** → `cancel` interceptado y restauración explícita del foco; prueba manual con teclado y táctil.
- **`ls -l` no es fiel del todo** (sin fechas, permisos fijos) → se documenta como simplificación; no afecta a ninguna misión.
- **`fortune` no es determinista entre invocaciones** → se prueba que la frase pertenece a la lista fija; no participa del SSR.
- **Falsos positivos históricos** (crear y borrar una carpeta completa la misión) → aceptado: la misión premia la acción, no el estado final.
- **`sudo` recursivo** → límite de profundidad y error de uso si se supera.
- **Alcance de flags y comandos nuevos** → lista cerrada en el spec; cualquier opción adicional queda fuera y se rechaza con código `2`.

## Migration Plan

1. Archivar `add-simulated-terminal` para materializar `openspec/specs/simulated-terminal/`.
2. Implementar el núcleo nuevo detrás del mismo contrato público de `executeLine`, de modo que la UI siga funcionando durante la migración.
3. Introducir misiones y progreso con el catálogo inicial; después el editor y los paquetes.
4. No hay datos que migrar: la clave `sleepgame.progress` es nueva y una versión desconocida se descarta.
5. Reversión: eliminar la clave de almacenamiento y restaurar los módulos anteriores; el VFS nunca se persiste, así que no quedan datos huérfanos.
