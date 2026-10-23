# Proposal

## Why

La aplicación solo tiene una página de verificación y todavía no tiene ninguna pieza visual del juego. Antes de construir el terminal y el bucle de energía, hace falta validar la pieza central de identidad: un personaje pixelado que pueda mostrarse en cuatro posturas (de pie, semi de pie, semi acostado, acostado) y que cambie entre ellas de forma fluida. Este cambio entrega esa pieza aislada, con un control de selección, para poder revisar el arte y las transiciones sin depender del resto del juego.

## What Changes

- Añadir una página `/personaje` que muestra el personaje pixelado y un control de selección de estado.
- Modelar cuatro estados de postura: `de-pie`, `semi-de-pie`, `semi-acostado` y `acostado`.
- Permitir cambiar de estado con el control de selección, en cualquier dirección, sin recargar la página.
- Animar la transición entre estados con un fundido cruzado entre sprites, incluyendo una secuencia intermedia cuando el salto no es entre estados contiguos, para que el cambio se perciba como movimiento y no como un corte.
- Incluir cuatro sprites de pixel art como assets iniciales, con una convención de nombres estable que permita sustituirlos por arte definitivo sin tocar código.
- Respetar `prefers-reduced-motion` y ofrecer navegación por teclado en el selector.

Fuera de alcance: el terminal, la energía, el bucle de sueño, el audio y cualquier lógica de juego. Este cambio es únicamente la pieza visual y su control.

## Capabilities

### New Capabilities

- `character-postures`: muestra un personaje pixelado en cuatro posturas y permite cambiarlas mediante un control de selección, con transiciones animadas y reversibles.

### Modified Capabilities

Ninguna: no existen capacidades previas en `openspec/specs/`.

## Impact

- Nuevos archivos de aplicación: `app/components/PixelCharacter.vue`, `app/pages/personaje.vue` y los assets en `public/characters/`.
- Nueva ruta pública: `GET /personaje`.
- No se modifica `/`, ni `/api/health`, ni la configuración de Nuxt.
- No se añaden dependencias de ejecución: la animación se resuelve con CSS y Vue.
- No hay cambios de contrato HTTP, persistencia ni seguridad.
