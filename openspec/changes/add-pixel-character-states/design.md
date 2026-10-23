# Design

## Context

El proyecto es Nuxt 4 con estructura `app/` y una única página SSR (`app/pages/index.vue`) que no tiene componentes reutilizables ni carpeta `public/`. No hay framework de tests ni dependencias de animación. Ver `proposal.md` para la motivación y `specs/character-postures/spec.md` para el contrato de comportamiento.

La restricción principal es que el arte definitivo todavía no existe: el cambio debe entregar el mecanismo y un arte provisional reemplazable.

## Goals / Non-Goals

**Goals:**

- Un componente reutilizable que reciba una postura y la muestre con transición fluida.
- Un modelo de estados ordenado que permita calcular secuencias intermedias.
- Assets y convenciones que sobrevivan al reemplazo del arte.
- Cero dependencias nuevas de ejecución.

**Non-Goals:**

- Lógica de energía, sueño o terminal.
- Animación esqueletal o interpolación entre posturas: el contrato es fundido cruzado entre imágenes.
- Tests automatizados de UI: no existe infraestructura y añadirla excede este cambio.
- Persistencia de la postura seleccionada.

## Decisions

### Página nueva en lugar de modificar `/`

Se añade `app/pages/personaje.vue` y se deja `index.vue` intacta. La página existente es la verificación de despliegue del scaffold y no debe mezclarse con una demo de personaje. Además permite eliminar el cambio completo sin tocar la portada.

Alternativa descartada: sustituir el contenido de `/`; rompe la verificación existente y mezcla responsabilidades.

### PNG de píxeles generado por script

Cada postura es un PNG de 48x48 con transparencia, generado por `scripts/generate-character-sprites.mjs` con `zlib` y un codificador PNG mínimo, sin dependencias, y versionado en `public/characters/`. Se elige PNG porque:

- Es el formato definitivo del arte: sustituir un archivo no obliga a tocar código ni la extensión del mapa de sprites.
- `image-rendering: pixelated` sobre un PNG garantiza bloques definidos, cosa que un SVG escalado no ofrece.
- El script deja el arte provisional reproducible y revisable, sin depender de una herramienta de imagen instalada.

El lienzo es 48x48 y no 32x48 para que la figura completa quepa al rotarla 90° en la postura `acostado`, manteniendo las cuatro imágenes con el mismo tamaño.

El script dibuja la figura base en una rejilla de píxeles, ajusta la apertura de ojos según la postura y aplica rotación con muestreo al vecino más cercano (0°, 30°, 60° y 90°). Así las cuatro posturas son coherentes entre sí y la progresión se lee como un desplome.

Alternativa descartada: SVG de rectángulos; obligaría a cambiar la extensión al recibir el arte definitivo y no reproduce el aspecto de pixel art.

### Cuatro `<img>` apiladas en lugar de un `<canvas>`

El componente renderiza las cuatro imágenes siempre, superpuestas en un contenedor de tamaño fijo, y anima `opacity` con transiciones CSS. Ventajas:

- Funciona en SSR sin `ClientOnly`: el HTML inicial ya contiene las cuatro imágenes.
- El navegador descarga las cuatro al parsear el HTML, lo que cumple el requisito de "disponibles antes de interactuar".
- El fundido cruzado es una transición de compositor, barata y sin JS por frame.
- No hay parpadeo por cambio de `src`.

Alternativa descartada: un solo `<img>` cuyo `src` cambia; produce un frame vacío y no permite fundido. Descartado también `<canvas>`: requiere cliente, gestión manual de frames y no aporta nada aquí.

### Secuencia intermedia para saltos no contiguos

Un fundido directo de `de-pie` a `acostado` se lee como un dissolve, no como un desplome. El componente calcula la ruta entre índices y avanza un paso cada `STEP_MS`, de modo que se ve la progresión completa.

```
de-pie (0) --> semi-de-pie (1) --> semi-acostado (2) --> acostado (3)

  [0]====fade====>[1]====fade====>[2]====fade====>[3]
      180ms            180ms            180ms
```

Parámetros: `FADE_MS = 260`, `STEP_MS = 180`. El fundido dura más que el paso, así que las opacidades se solapan y nunca hay un instante con ambas imágenes invisibles.

Alternativa descartada: fundido simultáneo de las cuatro imágenes; se ve como un cross-dissolve y pierde la sensación de movimiento.

### Cancelación por token

Cada selección incrementa un contador de transición. El programador de pasos comprueba el token antes de aplicar el siguiente; si cambió, aborta. Así, selecciones rápidas terminan siempre en la última postura elegida y no queda ninguna animación huérfana.

Alternativa descartada: `clearTimeout` suelto; es fácil dejar timers vivos en rutas de error y no cubre el caso de cambios durante el fundido.

### Estado en la página, animación en el componente

`PixelCharacter` recibe `posture` como prop y anima internamente hacia ella. El control marca inmediatamente la postura objetivo, aunque el dibujo tarde en llegar. Esto mantiene una única fuente de verdad (la página) y deja la secuencia visual como responsabilidad del componente.

### Grupo de radios nativo en lugar de ARIA manual

El selector usa `<fieldset>` con cuatro `<input type="radio">` visualmente ocultos y sus `<label>` estilizados. Se obtiene gratis: navegación con flechas, anuncio del grupo y de la opción activa, y activación con Enter/Espacio. La opción activa se distingue por color más un indicador de forma, no solo por color.

Alternativa descartada: `role="radiogroup"` con botones y `aria-checked`; más código y más formas de equivocarse.

### Movimiento reducido aplicado también en JavaScript

No basta con acortar la transición CSS: la secuencia intermedia debe omitirse. El componente consulta `matchMedia('(prefers-reduced-motion: reduce)')` y, si está activo, aplica la postura final directamente. Se escucha el cambio del media query para no quedar con un valor obsoleto.

### Escala entera y sin suavizado

El sprite nativo mide 48x48. Se renderiza a un múltiplo entero (6x = 288x288 por defecto) para que cada píxel caiga en un bloque exacto. La imagen se marca con `image-rendering: pixelated`. Un contenedor con ancho fijo evita saltos de layout entre posturas.

Alternativa descartada: escalar al 100% del contenedor; produce bordes borrosos y escalas fraccionarias.

### Verificación mediante el script existente

Se extiende `scripts/verify-server.sh` para comprobar `GET /personaje` (200, HTML con las cuatro etiquetas) y se mantienen las comprobaciones actuales. Es coherente con la convención del repositorio y no introduce un framework de tests.

Alternativa descartada: Vitest + `@vue/test-utils`; útil más adelante, pero añade configuración y dependencias para una lógica de ~30 líneas.

## Risks / Trade-offs

- **El arte generado por script se vea pobre** → es provisional y se reemplaza por archivos PNG del mismo nombre y 48x48; el script queda como referencia reproducible.
- **Escala fraccionaria por responsive** → el contenedor usa múltiplos enteros y `max-width`; se revisa a 320, 768 y 1280 px.
- **Saltos largos se sientan lentos** (3 pasos × 180 ms) → parámetros centralizados en `app/utils/posture.ts` para ajustarlos en un solo lugar.
- **Cambios rápidos durante la secuencia** → token de cancelación y comprobación antes de cada paso; se prueba manualmente con clics repetidos.
- **Imágenes en `public/` sin dimensiones explícitas** → se declaran `width`/`height` en el `<img>` para reservar espacio y evitar layout shift.
- **Sin tests automatizados de la secuencia** → la función de ruta es pura y se puede cubrir con Vitest en un cambio posterior; mientras tanto, el escenario de cambios rápidos se verifica a mano.

## Migration Plan

Cambio aditivo: no hay migración de datos ni de rutas existentes. Para revertir, se eliminan `app/pages/personaje.vue`, `app/components/PixelCharacter.vue`, `app/utils/posture.ts`, el directorio `public/characters/`, el script `scripts/generate-character-sprites.mjs` y las líneas añadidas a `scripts/verify-server.sh`.
