# Tasks

## 1. Simulación pura

- [x] 1.1 Crear `app/utils/terminal/vfs.ts` con `VfsNode`, `createInitialVfs()`, `resolvePath(cwd, input)`, las operaciones de lectura y escritura del árbol y errores tipados (`ENOENT`, `ENOTDIR`, `EISDIR`, `EEXIST`, `ENOTEMPTY`). Añadir a `package.json` el script `test:terminal` (`node --experimental-strip-types --test tests/terminal.test.ts`) y crear `tests/terminal.test.ts` con rutas absolutas, relativas, `.`, `..`, intento de escapar de `/` y cada error. Verificar con `npm run test:terminal` que todos los casos pasan.
- [x] 1.2 Crear `app/utils/terminal/commands.ts` con un `Map` de los doce comandos, sus mensajes en español y los códigos de salida de la tabla de `design.md`; ampliar `tests/terminal.test.ts` con el caso de éxito y los errores de cada comando y con nombres heredados (`constructor`, `__proto__`) que deben devolver `127`. Verificar con `npm run test:terminal`.
- [x] 1.3 Crear `app/utils/terminal/shell.ts` con `tokenize` (comillas simples y dobles, escape con `\`, comilla sin cerrar → código `2`) y `executeLine` (devuelve `ExecResult | null`, donde `null` es una línea vacía); ampliar los tests con metacaracteres literales (`echo "$(whoami)"`, `echo "hola | rm"`), comando desconocido `127`, línea vacía y `rm -rf /` fallando con `EISDIR`. Verificar con `npm run test:terminal`.

## 2. Estado de sesión

- [x] 2.1 Crear `app/composables/useTerminal.ts` como envoltorio reactivo de `executeLine`: expone `lines`, `cwd`, `history`, `lastExitCode`, `prompt`, `submit(raw)`, `navigateHistory(direction)` y aplica los límites de 500 líneas y 100 comandos. Usar imports explícitos de `vue` y extensiones `.ts` en los imports relativos para que sea ejecutable en Node. Ampliar `tests/terminal.test.ts` con línea vacía (no altera `lastExitCode`), historial arriba/abajo, `clear` y recorte de líneas. Verificar con `npm run test:terminal` y `npm run build`.

## 3. Componente y página

- [x] 3.1 Crear `app/components/SimulatedTerminal.vue` con la pantalla (`role="log"`, `aria-live="polite"`, `aria-relevant="additions"`, `white-space: pre-wrap`), el formulario con `<input>` real y etiqueta visualmente oculta, el historial con flechas, el auto-scroll con `nextTick` y el foco al pulsar la pantalla. Verificar con `npm run build` que compila sin errores.
- [x] 3.2 Crear `app/pages/terminal.vue` que componga `SimulatedTerminal` y `PixelCharacter`, derive la postura con `computed` a partir de `lastExitCode` (`null` o `0` → `de-pie`, resto → `acostado`) y use una rejilla de dos columnas que se apila en pantallas estrechas. Verificar con `npm run build` y, con `npm run dev`, que `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/terminal` devuelve `200` y el HTML contiene `Sleepgame Terminal` y `/characters/personaje-de-pie.png`.
- [x] 3.3 Ajustar los estilos del terminal (fuente monoespaciada, contraste de `stdout`/`stderr`, altura acotada con scroll interno, foco visible) y comprobar el layout a 360, 768 y 1280 px con `npm run dev`. Verificar que el área del personaje no cambia de tamaño al alternar entre `de-pie` y `acostado`.

## 4. Render en servidor, accesibilidad y documentación

- [x] 4.1 Comprobar que el HTML inicial es determinista: con `npm run dev` activo, comparar dos respuestas con `diff <(curl -s http://localhost:3000/terminal) <(curl -s http://localhost:3000/terminal)` y revisar en el navegador que la consola no muestra errores de hidratación. Verificar que no hay `Date`, `Math.random` ni identificadores aleatorios en el bloque de arranque.
- [x] 4.2 Verificar la accesibilidad de la terminal: Tab llega al input con foco visible, Enter envía, las flechas recorren el historial, `grep -F 'role="log"'` encuentra la región de salida en el HTML y el input tiene etiqueta asociada. Comprobar con la emulación de `prefers-reduced-motion: reduce` que el personaje cambia sin secuencia intermedia.
- [x] 4.3 Documentar en `README.md` la ruta `/terminal`, la tabla de comandos, la regla de postura (código `0` → `de-pie`, distinto de `0` → `acostado`), el reinicio de la sesión al recargar, la ausencia de ejecución real y el comando `npm run test:terminal` con su requisito de Node. Verificar que los comandos y rutas documentados coinciden con `help` y con los archivos reales.

## 5. Integración y aceptación

- [x] 5.1 Extender `scripts/verify-server.sh` con `check_terminal_page()` (`GET /terminal` → 200, texto de arranque y referencia al sprite `de-pie`) y ejecutar `./scripts/verify-server.sh dev` verificando que termina con código 0.
- [x] 5.2 Ejecutar `npm run build && ./scripts/verify-server.sh prod` y verificar que termina con código 0 y que `package.json` sigue sin dependencias de ejecución nuevas (`node -p "Object.keys(require('./package.json').dependencies).join(',')"` debe devolver solo `nuxt`).
- [x] 5.3 Recorrer la aceptación manual en `/terminal`: un comando correcto mantiene `de-pie`, un error lleva a `acostado` pasando por las intermedias, un acierto estando acostado devuelve a `de-pie`, una línea vacía no cambia la postura, `clear` limpia y deja el prompt, `git status` da `127`, `echo "$(whoami)"` imprime el texto literal y el teclado móvil no impide ver la salida.

## Workflow follow-up

- Archivar el cambio tras la revisión.
- Verificar el resultado archivado.
