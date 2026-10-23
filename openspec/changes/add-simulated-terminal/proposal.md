# Proposal

## Why

La aplicación ya tiene al personaje pixelado con sus cuatro posturas, pero todavía no tiene una interfaz de juego: el cambio anterior dejó explícitamente fuera "el terminal y el bucle de energía". Hace falta una terminal que se comporte como una shell Linux sin tocar el sistema real, para que el resultado de cada comando (acierto o error) mueva al personaje entre despierto y dormido. Así se valida el bucle de interacción antes de añadir energía, tiempo o narrativa.

## What Changes

- Añadir una página `/terminal` con una terminal simulada: prompt, líneas de salida, historial de comandos y scroll.
- Modelar un sistema de archivos virtual en memoria (árbol de directorios y archivos) que nunca accede al sistema operativo, a la red ni a procesos.
- Implementar un registro de comandos Linux con contrato de salida (`stdout`, `stderr`, código de salida): `help`, `clear`, `pwd`, `cd`, `ls`, `cat`, `echo`, `mkdir`, `touch`, `rm`, `rmdir` y `whoami`.
- Sincronizar la postura del personaje con el resultado del último comando: código `0` → `de-pie`; código distinto de `0` → `acostado`. Las posturas `semi-de-pie` y `semi-acostado` no se asignan directamente: son los pasos transicionales que ya anima `PixelCharacter`.
- Mantener la postura ante una entrada vacía y devolver el personaje a `de-pie` cuando un comando correcto se ejecuta estando acostado.
- Renderizar la terminal en el servidor con un texto de arranque estático y crear el estado de simulación en el cliente, sin errores de hidratación.
- Extender `scripts/verify-server.sh` con la comprobación de `/terminal` y documentar la página en el README.
- No añadir dependencias de ejecución.

Fuera de alcance: ejecución real de comandos, pipes, redirecciones, globs, variables de entorno, permisos multiusuario, autocompletado, persistencia entre recargas, energía, reloj del juego y narrativa.

## Capabilities

### New Capabilities

- `simulated-terminal`: terminal Linux simulada en memoria que interpreta comandos, devuelve un código de salida y sincroniza la postura del personaje con el resultado.

### Modified Capabilities

Ninguna: no existen capacidades en `openspec/specs/` todavía y este cambio no altera el contrato de las posturas.

## Impact

- Nuevos archivos de aplicación: `app/pages/terminal.vue`, `app/components/SimulatedTerminal.vue`, `app/composables/useTerminal.ts` y los módulos puros de simulación en `app/utils/terminal/`.
- Reutiliza `app/components/PixelCharacter.vue` y `app/utils/posture.ts` sin modificarlos.
- Nueva ruta pública: `GET /terminal`.
- No se modifica `/`, `/personaje` ni `/api/health`.
- Se extiende `scripts/verify-server.sh` y se añade documentación al `README.md`.
- Sin cambios de contrato HTTP, persistencia, autenticación ni nuevas dependencias.
