# Sleepgame

Aplicación Nuxt 4 con renderizado en el servidor y un endpoint de salud para verificar el despliegue.

## Requisitos

- Node.js `>= 20.19.0` (probado con Node.js 26.11.1)
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor queda disponible en <http://localhost:3000>. Se puede cambiar el puerto:

```bash
PORT=3100 npm run dev
```

## Build y producción

```bash
npm run build
node .output/server/index.mjs
```

`npm run build` genera el servidor autocontenido en `.output/`. Para previsualizarlo con el comando de Nuxt:

```bash
npm run preview
```

## Verificación del servidor

El script `scripts/verify-server.sh` arranca el servidor en un puerto libre, espera a que responda y comprueba:

- `GET /` → 200 con HTML que incluye el nombre del proyecto.
- `GET /api/health` → 200 con JSON `{ status, service, version, timestamp }`.
- `GET /personaje` → 200 con HTML que incluye las cuatro posturas del personaje.
- `GET /terminal` → 200 con HTML que incluye el texto de arranque y el sprite `de-pie`.
- Una ruta inexistente → 404 con página de error HTML.

```bash
npm run verify:dev    # servidor de desarrollo
npm run verify:prod   # build de producción + servidor construido
```

También se puede ejecutar directamente:

```bash
./scripts/verify-server.sh dev
./scripts/verify-server.sh prod
```

Variables opcionales del script:

- `PORT`: puerto a usar (por defecto, uno libre).
- `VERIFY_TIMEOUT_SECONDS`: espera máxima en segundos (por defecto, 120).

El script termina el servidor que arranca, incluso si la verificación falla.

## Endpoint de salud

```
GET /api/health
```

Respuesta:

```json
{
  "status": "ok",
  "service": "sleepgame",
  "version": "0.1.0",
  "timestamp": "2026-10-23T18:55:01.141Z"
}
```

No requiere autenticación y no expone secretos ni rutas del sistema.

## Personaje

La ruta <http://localhost:3000/personaje> muestra un personaje pixelado en cuatro posturas y permite cambiar entre ellas con un selector. Las transiciones son un fundido cruzado; cuando el salto no es entre posturas contiguas, el personaje recorre las intermedias en orden.

Posturas, en orden: `de-pie`, `semi-de-pie`, `semi-acostado`, `acostado`.

### Arte

Los sprites viven en `public/characters/` con nombres fijos y dimensiones de 48x48 píxeles:

```
public/characters/personaje-de-pie.png
public/characters/personaje-semi-de-pie.png
public/characters/personaje-semi-acostado.png
public/characters/personaje-acostado.png
```

Para sustituir el arte, reemplaza cada archivo por otro con el mismo nombre y 48x48 píxeles; no hace falta tocar componentes ni configuración. El juego de sprites actual es provisional y se puede regenerar con:

```bash
node scripts/generate-character-sprites.mjs
```

## Terminal

La ruta <http://localhost:3000/terminal> muestra una terminal Linux simulada junto al personaje. No ejecuta comandos reales: cada línea se interpreta contra un sistema de archivos virtual en memoria, sin acceder al sistema operativo, a la red ni a procesos.

### Comandos

| Comando | Efecto |
| --- | --- |
| `help` | Enumera los comandos disponibles. |
| `clear` | Limpia la pantalla y deja un prompt nuevo. |
| `pwd` | Muestra el directorio actual. |
| `cd [ruta]` | Cambia de directorio. Sin argumento, vuelve a `/home/guest`. |
| `ls [ruta]` | Lista el contenido de un directorio. |
| `cat <ruta>` | Muestra el contenido de un archivo. |
| `echo [args]` | Escribe los argumentos separados por un espacio. |
| `mkdir <ruta>` | Crea un directorio. |
| `touch <ruta>` | Crea un archivo vacío. |
| `rm <ruta>` | Elimina un archivo. |
| `rmdir <ruta>` | Elimina un directorio vacío. |
| `whoami` | Muestra el usuario simulado (`guest`). |

Los operadores de shell (`|`, `>`, `;`, `&&`, `$()` y backticks) son texto literal: no hay pipes, redirecciones ni expansión de variables. Un nombre desconocido responde con código `127`; una comilla sin cerrar, con código `2`.

### Postura y sesión

La postura depende del último código de salida: `0` → `de-pie`, cualquier otro valor → `acostado`. Las posturas `semi-de-pie` y `semi-acostado` son solo pasos de la transición. Una línea vacía no ejecuta nada y no cambia la postura; `clear` limpia la pantalla y deja al personaje en `de-pie`.

El sistema virtual, el directorio actual y el historial viven en la sesión del navegador: recargar la página vuelve al estado inicial (`/home/guest`). La terminal conserva como máximo 500 líneas y 100 comandos de historial.

### Pruebas

La lógica pura (rutas, sistema de archivos, comandos, tokenizador y estado de sesión) se prueba sin navegador:

```bash
npm run test:terminal
```

Requiere Node.js `>= 22.6` por `--experimental-strip-types`; la aplicación sigue ejecutándose con Node.js `>= 20.19`.

## Estructura

```
app/
  app.vue                      # raíz de la aplicación con <NuxtPage />
  components/
    PixelCharacter.vue         # sprites apilados y transición de posturas
    SimulatedTerminal.vue      # pantalla, prompt, historial y auto-scroll
  composables/
    useTerminal.ts             # estado reactivo de la sesión simulada
  pages/
    index.vue                  # página inicial renderizada en el servidor
    personaje.vue              # demo del personaje con selector de postura
    terminal.vue               # terminal simulada junto al personaje
  utils/
    posture.ts                 # posturas, orden y cálculo de secuencias
    terminal/
      vfs.ts                   # árbol virtual y resolución de rutas
      commands.ts              # registro de los doce comandos
      shell.ts                 # tokenizador y despacho de líneas
public/
  characters/                  # sprites PNG 48x48 del personaje
server/
  api/health.get.ts            # endpoint de salud
scripts/
  generate-character-sprites.mjs # genera los sprites provisionales
  verify-server.sh             # verificación de dev y producción
tests/
  terminal.test.ts             # pruebas de la simulación sin navegador
nuxt.config.ts                 # configuración de Nuxt y runtimeConfig
```
