# Tasks

## 1. Assets y modelo de posturas

- [x] 1.1 Crear `scripts/generate-character-sprites.mjs` que genere con `zlib` cuatro PNG de 48x48 en `public/characters/` (`personaje-de-pie.png`, `personaje-semi-de-pie.png`, `personaje-semi-acostado.png`, `personaje-acostado.png`) a partir de una figura pixelada base rotada 0°, 30°, 60° y 90°, con la apertura de ojos decreciente y fondo transparente. Verificar con `file public/characters/*.png` que los cuatro son `PNG image data, 48 x 48` y con `sha256sum public/characters/*.png` que los cuatro hashes son distintos.
- [x] 1.2 Crear `app/utils/posture.ts` con el tipo `Posture`, el arreglo ordenado `POSTURES`, la función pura `posturePath(from, to)` y las constantes `FADE_MS` y `STEP_MS`. Verificar con `node --experimental-strip-types -e "import('./app/utils/posture.ts').then(m=>{const a=m.posturePath('de-pie','acostado').join(',');const b=m.posturePath('acostado','de-pie').join(',');if(a!=='semi-de-pie,semi-acostado,acostado')process.exit(1);if(b!=='semi-acostado,semi-de-pie,de-pie')process.exit(1);console.log(a,'|',b)})"` que la ruta de ida y la de vuelta son correctas.

## 2. Componente y página

- [x] 2.1 Crear `app/components/PixelCharacter.vue` que reciba la prop `posture`, apile las cuatro imágenes en un contenedor de tamaño fijo (288x288, escala entera 6x), aplique `image-rendering: pixelated`, declare `width`/`height` en cada `<img>` y anime la opacidad con transición CSS de `FADE_MS`. Verificar que el componente compila ejecutando `npm run build` al terminar la tarea.
- [x] 2.2 Implementar en `PixelCharacter.vue` la secuencia de pasos con `STEP_MS` y cancelación por token, de modo que un salto no contiguo recorra las posturas intermedias y una selección rápida termine siempre en la última elegida; omitir la secuencia cuando `prefers-reduced-motion: reduce` esté activo y escuchar cambios del media query. Verificar con `npm run build` y, en el navegador, seleccionar `acostado` desde `de-pie` y luego clicar las cuatro opciones en menos de un segundo comprobando que la postura final coincide siempre con la última seleccionada.
- [x] 2.3 Crear `app/pages/personaje.vue` con un `<fieldset>` y cuatro `<input type="radio">` con etiquetas en español (`De pie`, `Semi de pie`, `Semi acostado`, `Acostado`), estado inicial `de-pie`, indicador de opción activa que no dependa solo del color, y el componente `PixelCharacter` dentro. Verificar con `npm run dev` y `curl -s http://localhost:3000/personaje | grep -c 'De pie'` que la respuesta contiene las cuatro etiquetas y con `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/personaje` que devuelve 200.

## 3. Verificación del repositorio y documentación

- [x] 3.1 Extender `scripts/verify-server.sh` para comprobar `GET /personaje` (200 y HTML con las cuatro etiquetas) manteniendo las comprobaciones actuales, y ejecutar `./scripts/verify-server.sh dev` verificando que termina con código 0.
- [x] 3.2 Documentar en `README.md` la ruta `/personaje`, la convención de nombres `public/characters/personaje-<postura>.png`, las dimensiones nativas 48x48 y cómo sustituir el arte; verificar que los comandos y rutas documentados coinciden con los archivos reales.
- [x] 3.3 Ejecutar `npm run build && ./scripts/verify-server.sh prod` y verificar que termina con código 0, que `.output/server/index.mjs` existe y que `package.json` sigue sin dependencias nuevas de ejecución.

## 4. Comprobación manual de aceptación

- [ ] 4.1 Recorrer las cuatro opciones y comprobar: transición contigua de 200-600 ms, salto `de-pie` → `acostado` pasando por las dos intermedias, salto inverso, ausencia de frame vacío en la primera transición y ausencia de salto de tamaño; revisar la consola del navegador sin errores de hidratación.
- [ ] 4.2 Comprobar accesibilidad: Tab y flechas recorren las opciones, Enter y Espacio activan, el foco es visible, la opción activa se distingue por forma además de color, y con la emulación de `prefers-reduced-motion: reduce` el cambio es inmediato (≤100 ms).

## Workflow follow-up

- Archivar el cambio tras la revisión.
- Verificar el resultado archivado.
