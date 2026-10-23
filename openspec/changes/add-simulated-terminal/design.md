# Design

## Context

Ver `proposal.md` para la motivación y `specs/simulated-terminal/spec.md` para el contrato. El punto de partida relevante:

- Nuxt 4 con SSR y estructura `app/`; sin dependencias de ejecución más allá de Nuxt.
- `PixelCharacter.vue` ya recibe una prop `posture`, apila los cuatro sprites y anima internamente los saltos no contiguos con `posturePath()`; no hace falta modificarlo.
- No hay store, framework de tests ni endpoints que ejecuten código del usuario.
- `scripts/verify-server.sh` es la verificación reproducible del proyecto y ya comprueba `/` y `/personaje`.

La restricción central es de seguridad: la terminal debe *parecer* Linux sin serlo. Nada de `fs`, `child_process`, `eval` ni peticiones de red.

## Goals / Non-Goals

**Goals:**

- Separar la simulación (datos y lógica pura) de la interfaz Vue, para poder probarla sin navegador.
- Un contrato de comando único (`stdout`, `stderr`, código) del que dependan tanto la pantalla como la postura.
- Render inicial determinista que funcione en SSR sin hidratación divergente.
- Cero dependencias nuevas y cero superficie de ejecución real.

**Non-Goals:**

- Emular Bash completo: sin pipes, redirecciones, globs, expansión de variables, `&&`/`||`, permisos, enlaces simbólicos ni `mtime`.
- Persistir el sistema virtual o el historial entre recargas.
- Autocompletado, `Tab`, `Ctrl+C`/`Ctrl+L` o selección de texto avanzada.
- Conectar el resultado con energía, reloj o narrativa; eso será otro cambio.

## Decisions

### Simulación en el cliente, sin endpoint de servidor

Los comandos se interpretan en el navegador contra un objeto en memoria. No hay ruta de API que reciba la línea y la ejecute.

Por qué:

- La seguridad deja de depender de validar entrada: no existe un proceso al que inyectar nada.
- Sin latencia ni contrato HTTP que versionar; el `stdout` aparece en el mismo tick.
- El estado de sesión (cwd, archivos, historial) vive cerca de la UI que lo muestra.

Alternativas descartadas:

- **Endpoint `/api/terminal`**: añade un contrato, latencia y una superficie donde un fallo de validación sí podría tocar el sistema. No aporta nada a un juego de un solo jugador.
- **WebContainer / shell WASM**: emula Linux de verdad, pero introduce una dependencia pesada y un modelo de arranque asíncrono desproporcionado para 12 comandos.
- **`xterm.js` + PTY falso**: mucho peso para renderizar líneas de texto; además fuerza render solo en cliente.

Consecuencia aceptada: recargar la página reinicia el sistema virtual (la spec lo exige).

### Tres módulos puros y una capa Vue

```
app/utils/terminal/
  vfs.ts        arbol + resolucion de rutas + operaciones
  commands.ts   Map<string, Command> y mensajes de error
  shell.ts      tokenize + dispatch -> ExecResult
app/composables/useTerminal.ts   estado reactivo de la sesion
app/components/SimulatedTerminal.vue   pantalla + input
app/pages/terminal.vue           composicion con PixelCharacter
```

`vfs.ts`, `commands.ts` y `shell.ts` no importan Vue ni Nuxt. Eso permite ejecutarlos con `node --test` y evita que la lógica dependa del ciclo de vida del componente.

Contrato:

```ts
interface ExecResult {
  stdout: string[]
  stderr: string[]
  code: number
  clearScreen?: boolean
}
```

Alternativa descartada: lógica dentro del componente. Es más corta de escribir, pero mezcla parsing, estado y render, y obliga a probar todo desde el navegador.

### Sistema de archivos virtual como árbol inmutable por operación

```ts
type VfsNode =
  | { type: 'dir'; children: Record<string, VfsNode> }
  | { type: 'file'; content: string }
```

La resolución de rutas es una función pura: parte de `cwd` si la ruta no empieza por `/`, normaliza `.` y `..`, y nunca escapa de `/` (un `..` en la raíz se queda en la raíz). Las operaciones devuelven un resultado o un error tipado (`ENOENT`, `ENOTDIR`, `EISDIR`, `EEXIST`, `ENOTEMPTY`); los comandos traducen ese error a mensaje y código.

Contenido inicial determinista:

```
/
  home/
    guest/
      notas.txt          "Recuerda apagar la luz antes de dormir."
      sueno/
        diario.txt       "Noche 1: todavia no puedo dormir."
      vacio/
```

Se siembra con una factoría (`createInitialVfs()`) que se ejecuta igual en servidor y cliente. No hay fechas ni identificadores aleatorios.

Alternativa descartada: arrays de rutas planas (`/home/guest/notas.txt`). El árbol hace triviales `ls`, `cd` y `rmdir`, y evita mantener índices paralelos.

### Tokenizador mínimo con comillas

Se separa por espacios, se agrupan argumentos entre comillas dobles o simples y se permite `\` para escapar el carácter siguiente dentro de comillas. Una comilla sin cerrar produce un error de sintaxis con código `2`.

Lo importante es lo que **no** hace: no expande variables, no interpreta `|`, `>`, `;`, `$()` ni backticks. Esos caracteres llegan al comando como texto. Así `echo "$(whoami)"` imprime literalmente y `rm -rf /` solo intenta borrar la ruta `/` del árbol falso (y falla con `EISDIR`).

Alternativa descartada: dividir con `line.split(/\s+/)`. No soporta rutas con espacios y no permite distinguir una comilla sin cerrar.

### Registro con `Map`, no con objeto

Los comandos viven en un `Map<string, Command>`. Un objeto literal permitiría que nombres como `constructor`, `toString` o `__proto__` resolvieran a propiedades heredadas y se comportaran como comandos. Con `Map`, solo existe lo registrado; el resto responde `orden no encontrada` y código `127`.

### Códigos de salida y mensajes

| Comando | Éxito | Errores principales |
|---|---|---|
| `help` | `0` | — |
| `clear` | `0` + `clearScreen` | — |
| `pwd` | `0` | — |
| `whoami` | `0` | — |
| `ls [ruta]` | `0` | `ENOENT`/`ENOTDIR` → `2` |
| `cd [ruta]` | `0` | `ENOENT`/`ENOTDIR` → `1` |
| `cat <ruta>` | `0` | falta operando, `ENOENT`, `EISDIR` → `1` |
| `echo [args]` | `0` | — |
| `mkdir <ruta>` | `0` | falta operando, `EEXIST`, `ENOENT` → `1` |
| `touch <ruta>` | `0` | falta operando, `ENOENT` → `1` |
| `rm <ruta>` | `0` | falta operando, `ENOENT`, `EISDIR` → `1` |
| `rmdir <ruta>` | `0` | falta operando, `ENOENT`, `ENOTDIR`, `ENOTEMPTY` → `1` |
| desconocido | — | siempre `127` |

Los mensajes van en español y con formato de coreutils (`ls: no se puede acceder a 'x': No existe el archivo o el directorio`), coherentes con el resto de la interfaz. Los códigos imitan a Linux lo suficiente para que la regla de postura sea comprensible, no para ser un contrato POSIX.

### Postura derivada del último código de salida

`useTerminal` expone `lastExitCode: number | null`. La página calcula:

```ts
const posture = computed<Posture>(() =>
  lastExitCode.value === null || lastExitCode.value === 0 ? 'de-pie' : 'acostado',
)
```

- Estado inicial `null` → `de-pie`.
- Una línea vacía no ejecuta nada y no toca `lastExitCode`.
- Un acierto estando acostado pone el código en `0` y `PixelCharacter` recorre las intermedias al volver.
- Nunca se asigna `semi-*` directamente: son estados de paso del componente.

Alternativa descartada: guardar la postura como estado independiente y actualizarla en cada `submit`. Duplica la fuente de verdad y permite que pantalla y personaje discrepen.

### Render en servidor con estado determinista

La página renderiza en SSR el banner, la ayuda inicial y el prompt `guest@sleepgame:~$`. La factoría del VFS y los textos son constantes; el contador de líneas es incremental. Nada de `Date.now()`, `Math.random()` ni `crypto.randomUUID()` en el HTML inicial.

No se envuelve la terminal en `<ClientOnly>`: el HTML inicial ya muestra la pantalla y el input se hidrata normalmente. Un `curl` debe devolver el mismo bloque de arranque en dos peticiones.

### Pantalla e input

- `SimulatedTerminal.vue` agrupa la salida y el formulario; el `<form>` con `@submit.prevent` evita recargas.
- La salida es un `div` con `role="log"`, `aria-live="polite"` y `aria-relevant="additions"`, `white-space: pre-wrap` y fuente monoespaciada. Las líneas `stderr` usan un color distinto con contraste suficiente.
- Se guardan como máximo 500 líneas (`slice(-500)`). Tras cada salida, `nextTick` y `scrollTop = scrollHeight`; sin `smooth` para no añadir movimiento innecesario.
- El input es un `<input>` real con etiqueta visualmente oculta, `autocomplete="off"`, `autocapitalize="off"`, `spellcheck="false"` y `enterkeyhint="send"`. No usa `autofocus`; el foco se pone al pulsar la pantalla, lo que evita robar foco al cargar y funciona mejor en móvil.
- Historial: array de comandos no vacíos (máximo 100), índice `null` para el borrador. Arriba/abajo solo rellenan el input; ejecutar sigue requiriendo Enter.
- `clear` vacía las líneas y deja el prompt; como devuelve `0`, la postura vuelve a `de-pie`.

### Composición de la página

`/terminal` usa una rejilla de dos columnas: personaje a la izquierda (192 px = 4x el sprite de 48 px) y terminal a la derecha con altura acotada y scroll interno. En pantallas estrechas se apila: personaje arriba (144 px = 3x) y terminal debajo. El contenedor del personaje mantiene tamaño fijo, así que el cambio de postura no mueve el layout.

### Verificación

- Lógica pura: `tests/terminal.test.ts` con `node:test` y `node:assert/strict`; cubre códigos de salida, errores del VFS, resolución de rutas, comillas, metacaracteres literales y comando desconocido. Se ejecuta con `node --experimental-strip-types --test tests/terminal.test.ts` (Node 26 en este entorno).
- Integración: `verify-server.sh` añade `GET /terminal` → `200`, texto de arranque y referencia a los sprites; no puede simular teclas, así que los escenarios interactivos quedan como comprobación manual.
- Documentación: README con ruta, comandos, regla de postura, reinicio de sesión y nota de seguridad.

## Risks / Trade-offs

- **Divergencia de hidratación por datos dinámicos** → textos y VFS constantes; el HTML inicial se compara entre dos `curl` y la consola se revisa sin errores de hidratación.
- **Expectativa de una shell real (pipes, globs)** → el contrato es explícito en la spec y en `help`; los metacaracteres se muestran literales en lugar de fallar de forma confusa.
- **Teclado móvil tapando la salida** → altura de terminal relativa a `dvh`, scroll interno y prueba a 360 px; el foco se activa al tocar, no automáticamente.
- **Lector de pantalla releyendo todo el historial** → `aria-live` con `aria-relevant="additions"`; si algún lector se comporta mal, se puede mover el anuncio a una región oculta con solo la última línea.
- **Pérdida de contexto al recortar a 500 líneas** → suficiente para una sesión de juego; el límite es una constante easy de ajustar.
- **Tests con `--experimental-strip-types`** → requieren Node 22.6+; la aplicación sigue funcionando desde Node 20.19 porque el flag solo se usa en el script de tests. Se documenta en el README.
- **Mensajes en español frente a coreutils en inglés** → se elige coherencia con la interfaz; los códigos de salida, que son lo que mueve al personaje, se mantienen fieles.

## Migration Plan

Cambio aditivo. No hay datos ni rutas que migrar.

- Despliegue: añadir los archivos nuevos, la comprobación en `verify-server.sh` y la sección del README.
- Reversión: eliminar `app/pages/terminal.vue`, `app/components/SimulatedTerminal.vue`, `app/composables/useTerminal.ts`, `app/utils/terminal/`, `tests/terminal.test.ts`, el script `test:terminal` si se añade, y las líneas nuevas de `verify-server.sh` y `README.md`. El resto del sitio no depende de este cambio.
