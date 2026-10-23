# Tasks

## 1. Catálogo, tipos y opciones

- [ ] 1.1 Crear `app/utils/terminal/commands/types.ts` con `CommandSpec`, `ExecResult` (incluyendo `effects` y `editor`), `ShellState` (`vfs`, `cwd`, `packages`, `elevated`) y una fábrica `createShellState()`. Verificar con `node --experimental-strip-types -e "import('./app/utils/terminal/commands/types.ts').then(m=>console.log(typeof m.createShellState))"` que el módulo carga y la fábrica existe.
- [ ] 1.2 Trasladar los doce handlers a `app/utils/terminal/commands/` por familias (`nav.ts`, `fs.ts`, `system.ts`), definir `CATALOG` con `name`, `usage`, `flags` y `origin`, e implementar `resolveCommand(name, packages)` con prioridad builtin. Verificar con `npm run test:terminal` que los casos existentes siguen pasando.
- [ ] 1.3 Interceptar `--help` en `runCommand` antes del handler, usando el `usage` del catálogo. Verificar con un caso de prueba para `ls --help`, `pwd --help` y `sudo apt --help` que la salida empieza por `uso: ` y el código es `0`.
- [ ] 1.4 Implementar `parseFlags(args, spec)` con opciones cortas combinadas, terminador `--` y rechazo de opciones desconocidas con línea de uso en `stderr` y código `2`. Verificar con pruebas de `-la`, `--` y `ls -z`.
- [ ] 1.5 Aplicar opciones a los comandos existentes: `ls -a/-l`, `mkdir -p`, `rm -r/-f`, `cat` con varios archivos. Verificar con pruebas de cada opción y con `npm run test:terminal`.
- [ ] 1.6 Añadir `cp`, `mv`, `grep` y `which` con sus líneas de uso y semántica de códigos `0`/`1`/`2`. Verificar con pruebas de copia, movimiento, patrón encontrado, patrón ausente y comando inexistente.
- [ ] 1.7 Actualizar la tabla de comandos y opciones del `README.md` y comprobar que coincide con `help` y con la salida de `--help` de cada comando.

## 2. Efectos estructurados

- [ ] 2.1 Definir la unión `TerminalEffect` (`fs.create`, `fs.write`, `fs.remove`, `fs.move`, `cwd.change`, `screen.clear`, `pkg.install`, `pkg.index.update`) en `commands/types.ts`. Verificar con una prueba de tipos que cada variante es asignable a `ExecResult['effects']`.
- [ ] 2.2 Emitir efectos solo tras operaciones exitosas en `mkdir`, `touch`, `cp`, `rm`, `rmdir`, `mv`, `cd` y `clear`, con un solo efecto por objetivo de nivel superior en `rm -r`. Verificar con pruebas que un comando fallido no emite efectos y que `touch` sobre un archivo existente no emite ninguno.
- [ ] 2.3 Propagar `effects` desde los handlers por `shell.ts` hasta `useTerminal`, exponiendo el último `CommandEvent` de la sesión. Verificar con una prueba que `mkdir refugio` produce un evento con `name: 'mkdir'`, `code: 0` y un efecto `fs.create`.
- [ ] 2.4 Dividir `tests/terminal.test.ts` por módulos (`vfs`, `commands`, `shell`, `useTerminal`) y cambiar `test:terminal` a `node --experimental-strip-types --test tests/`. Verificar con `npm run test:terminal` que se ejecutan todos los archivos y no hay fallos.

## 3. Misiones y progreso (núcleo puro)

- [ ] 3.1 Crear `app/utils/missions/catalog.ts` con las cinco misiones iniciales, sus XP, niveles mínimos, objetivos y pistas sin nombres de comando, y los umbrales `0/30/60/100`. Verificar con pruebas de identificadores únicos y de que ninguna pista contiene `mkdir`, `rm`, `cat`, `nano` ni `apt`.
- [ ] 3.2 Crear `app/utils/missions/evaluate.ts` con `matches(goal, event)` y `evaluate(event, progress)` de semántica AND y exigencia de `code === 0`. Verificar con pruebas de cada misión positiva y de sus casos negativos (comando fallido, efecto ausente, contenido sin cambios).
- [ ] 3.3 Crear `app/utils/progress.ts` con el esquema `{ version: 1, xp, completed }`, validación, cálculo de nivel y deduplicación de misiones. Verificar con pruebas de dato corrupto, versión desconocida, XP negativo, identificadores duplicados y subida de nivel en 30, 60 y 100.
- [ ] 3.4 Añadir `misiones/` al VFS inicial con un archivo de encargo por misión, legible y determinista. Verificar con pruebas de `ls misiones` y `cat misiones/<archivo>` que el contenido aparece y el código es `0`.
- [ ] 3.5 Integrar el evaluador en `useTerminal`: tras cada línea, construir el evento, completar misiones, sumar XP una sola vez y exponer `level`, `xp`, `completed` y `currentMission`. Verificar con pruebas de que repetir la acción no duplica XP y de que un comando fallido no altera el progreso.
- [ ] 3.6 Añadir el adaptador de persistencia (`localStorage` con clave `sleepgame.progress`) separado de la lógica pura, con lectura tolerante a errores. Verificar con pruebas de serialización, parseo y caída a memoria cuando el almacenamiento lanza una excepción.

## 4. Panel de misiones e hidratación

- [ ] 4.1 Crear `app/components/MissionsPanel.vue` con nivel, barra de XP, misión actual, pista y estado de completadas, y colocarlo en la rejilla de `terminal.vue` (tres columnas en ancho, apilado por debajo de 1100 px). Verificar con `npm run build` y con `curl -s http://localhost:3000/terminal | grep -c 'Misiones'` que el panel aparece en el HTML.
- [ ] 4.2 Cargar el progreso en `onMounted` y usar un flag `hydrated` para no anunciar progreso antes de leer el almacenamiento. Verificar con `diff <(curl -s localhost:3000/terminal) <(curl -s localhost:3000/terminal)` que el HTML sigue siendo idéntico y revisar en el navegador que no hay avisos de hidratación.
- [ ] 4.3 Mostrar la finalización de una misión como línea de sistema y anunciar la subida de nivel en el panel con `aria-live="polite"`. Verificar manualmente completando `mkdir` y comprobando la línea, el panel y el anuncio.
- [ ] 4.4 Actualizar el `README.md` con el panel, las misiones iniciales, los umbrales de nivel y la regla de que el VFS se reinicia pero el progreso no.

## 5. Descubrimiento en la interfaz

- [ ] 5.1 Implementar `completeCommand(prefix, names)` puro y conectarlo al `keydown` de TAB en `SimulatedTerminal.vue`, completando solo el primer token y sin ejecutar. Verificar con pruebas de coincidencia única, múltiple y ninguna, y con una comprobación manual en el navegador.
- [ ] 5.2 Asegurar que la lista de nombres del autocompletado incluye los comandos de paquetes instalados y se actualiza tras una instalación. Verificar con una prueba de integración de `resolveCommand` más la lista de nombres y con una comprobación manual.
- [ ] 5.3 Revisar que ninguna salida de `help`, `--help`, `which` o error contiene descripciones en prosa. Verificar con `grep -R "Muestra\|Elimina\|Crea un\|Lista el" app/` sin resultados y con un caso de prueba que compara la salida de `help` con la lista de nombres.

## 6. Editor `nano`

- [ ] 6.1 Crear `app/utils/editor/buffer.ts` con la apertura de búfer, la detección de `created`/`changed` y la escritura en el VFS como funciones puras. Verificar con pruebas de archivo existente, archivo nuevo, guardado sin cambios y ruta que es directorio.
- [ ] 6.2 Crear `app/components/NanoEditor.vue` como diálogo modal nativo con `showModal()`, foco contenido, `cancel` interceptado, botones Guardar/Salir y atajos `^O`/`^X`. Verificar con `npm run build` y manualmente con teclado y con emulación táctil.
- [ ] 6.3 Conectar `nano` al editor desde `useTerminal`, pausar la entrada mientras está abierto y guardar mediante `saveBuffer`, emitiendo `fs.write` y evaluando la misión de edición. Verificar con pruebas de que guardar completa la misión y de que descartar no emite efectos.
- [ ] 6.4 Comprobar la accesibilidad del editor: foco inicial dentro del diálogo, TAB contenido, foco devuelto al input al cerrar y etiqueta accesible. Verificar manualmente con lector de pantalla o inspección del DOM y sin errores en consola.
- [ ] 6.5 Documentar `nano` en el `README.md` con `^O`, `^X`, la creación al guardar y el comportamiento táctil.

## 7. Paquetes simulados

- [ ] 7.1 Añadir `packages` y `elevated` a `ShellState`, implementar `sudo` con despacho al mismo resolvedor y límite de profundidad, y exigir `elevated` en las operaciones de `apt` que modifican estado. Verificar con pruebas de `sudo apt ...`, `apt ...` sin privilegios (código `100`) y `sudo inexistente` (código `127`).
- [ ] 7.2 Implementar `apt update`, `apt install` y `apt list --installed` con el catálogo fijo y el requisito de índice actualizado. Verificar con pruebas de instalación correcta, paquete desconocido, paquete ya instalado, instalación sin `update` y listado vacío.
- [ ] 7.3 Regenerar `/var/lib/dpkg/status` en cada instalación y añadir `/etc/apt/sources.list` al VFS inicial. Verificar con pruebas de `cat` y `grep` sobre el estado antes y después de instalar.
- [ ] 7.4 Implementar los comandos `cowsay`, `fortune` y `figlet` como comandos de paquete, visibles solo tras la instalación y presentes en el autocompletado. Verificar con pruebas de comando ausente (código `127`), comando presente (código `0`) y contenido de la salida.
- [ ] 7.5 Documentar en el `README.md` el flujo `apt update` → `apt install`, el catálogo disponible y el estado en `/var/lib/dpkg/status`.

## 8. Integración y aceptación

- [ ] 8.1 Extender `scripts/verify-server.sh` para comprobar en `/terminal` el panel de misiones, la ausencia de descripciones de comandos y la presencia del prompt inicial. Verificar con `npm run verify:dev` y `npm run verify:prod` terminando en `0`.
- [ ] 8.2 Ejecutar `npm run test:terminal`, `npm run build` y `npm run verify:prod`, y comprobar que `package.json` no añade dependencias de ejecución. Verificar que los tres comandos terminan en `0` y que `dependencies` sigue conteniendo solo `nuxt`.
- [ ] 8.3 Recorrer las cinco misiones en el navegador: crear carpeta, borrar archivo, leer con `cat`, editar con `nano` e instalar un paquete; comprobar XP, niveles, panel, recarga con progreso conservado y VFS reiniciado. Verificar que las cinco se completan y que la recarga mantiene el nivel.
- [ ] 8.4 Comprobar la regresión visual y de accesibilidad: tres columnas en 1280 px, apilado en 768 px, personaje sin cambios de tamaño, TAB completion, foco del editor y `prefers-reduced-motion`. Verificar en el navegador sin errores de consola.

## Workflow follow-up

- Archivar primero el cambio completado `add-simulated-terminal` para materializar `openspec/specs/simulated-terminal/`, requisito del delta `MODIFIED`.
- Archivar este cambio después de la revisión.
- Verificar el resultado archivado.
