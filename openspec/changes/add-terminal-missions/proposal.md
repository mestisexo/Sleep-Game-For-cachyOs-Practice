# Proposal

## Why

La terminal simulada ya funciona, pero no da un objetivo: el jugador escribe comandos y ve la postura del personaje, sin progresión ni razón para aprender comandos nuevos. Además, la ayuda actual enumera y describe los doce comandos, de modo que la exploración se reduce a leer una lista. El juego necesita misiones que suban de nivel y un terminal más fiel a Linux, donde descubrir qué hacer forme parte del reto.

## What Changes

- **Misiones y niveles**: catálogo de misiones declarativas que se completan al observar hechos concretos del terminal (crear una carpeta, borrar un archivo, leer con `cat`, editar con `nano`, instalar un paquete), con XP, umbrales de nivel, panel de misión actual y progreso persistente.
- **Evaluación por eventos**: cada comando devuelve, además de `stdout`/`stderr`/código, una lista de efectos estructurados (`fs.create`, `fs.write`, `fs.remove`, `pkg.install`, `cwd.change`). Las misiones evalúan esos efectos y el comando ejecutado, nunca el texto de la salida ni un diff del sistema de archivos.
- **Descubrimiento sin descripciones**: `help` deja de describir comandos y pasa a listar solo nombres; cada comando admite `--help` con una línea de uso (`uso: ls [-a] [-l] [ruta...]`), sin prosa. Se añade autocompletado con TAB de nombres de comando desde el catálogo. **BREAKING** para quien dependa del texto de ayuda actual.
- **Catálogo de comandos con metadatos**: `commands.ts` se divide en un catálogo de especificaciones (`name`, `run`, `usage`, flags, categoría) y un resolvedor en dos niveles: builtin → comando aportado por un paquete instalado → `127`.
- **Comandos más fieles**: se añaden `cp`, `mv`, `grep`, `which`, `nano`, `sudo` y `apt`; se implementan opciones reales en los existentes (`ls -a/-l`, `mkdir -p`, `rm -r/-f`, `cat` con varios archivos). Las redirecciones (`>`, `>>`, `|`) siguen siendo texto literal: queda fuera de alcance.
- **Editor `nano` modal**: abre un archivo existente o un buffer vacío, guarda con `^O` y sale con `^X`, con botones visibles equivalentes para táctil. Guardar emite `fs.write` con `created` y `changed`.
- **Paquetes simulados**: `sudo apt update`, `sudo apt install <paquete>`, `apt list --installed`; catálogo fijo de paquetes sin dependencias ni versiones que, al instalarse, habilitan su comando (`cowsay`, `fortune`, `figlet`) y quedan reflejados en `/var/lib/dpkg/status`.
- **Progreso persistente y mundo efímero**: nivel, XP y misiones completadas se guardan en `localStorage` con versión de esquema; el sistema de archivos virtual sigue reiniciándose en cada carga. El HTML inicial no lee el almacenamiento, para conservar el renderizado determinista.

## Capabilities

### New Capabilities

- `terminal-missions`: catálogo de misiones, evaluación por eventos, XP y niveles, panel de progreso y persistencia del avance sin romper el renderizado en servidor.
- `terminal-discovery`: `--help` con uso sin prosa, autocompletado con TAB, `which` y resolución de nombres contra el catálogo y los paquetes instalados.
- `terminal-editor`: editor `nano` modal, guardado y salida, accesibilidad y emisión de efectos de escritura.
- `terminal-packages`: `sudo`, `apt update`, `apt install`, `apt list --installed`, catálogo fijo de paquetes y estado observable en el sistema de archivos virtual.

### Modified Capabilities

- `simulated-terminal`: cambia el conjunto de comandos reconocidos y el comportamiento de `help`; se añade compatibilidad de opciones (`-a`, `-l`, `-p`, `-r`, `-f`) y la exigencia de que `--help` no describa comandos.

## Impact

- **Prerrequisito de proceso**: archivar el cambio completado `add-simulated-terminal` antes de archivar este, para que exista la especificación base `simulated-terminal` que este delta modifica.
- **Código**: `app/utils/terminal/commands.ts` pasa a `app/utils/terminal/commands/` (catálogo, familias de comandos, flags, resolución); se amplían `shell.ts` (efectos y `--help`) y `vfs.ts` (contenido inicial con `misiones/`, `/etc/apt/sources.list` y `/var/lib/dpkg/status`); nuevos módulos de misiones, progreso y paquetes; `useTerminal.ts` orquesta ejecución, efectos, misiones y persistencia.
- **Interfaz**: `SimulatedTerminal.vue` gana autocompletado y pausa de entrada; nuevos `MissionsPanel.vue` y `NanoEditor.vue`; `terminal.vue` reordena la rejilla para el panel de misiones.
- **Pruebas y documentación**: `tests/terminal.test.ts` se amplía y se añaden pruebas de misiones, catálogo, paquetes y editor; `README.md` y `scripts/verify-server.sh` se actualizan. Sin dependencias nuevas de ejecución.
