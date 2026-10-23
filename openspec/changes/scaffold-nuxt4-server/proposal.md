# Proposal

## Why

El repositorio está vacío: solo existe la estructura de OpenSpec, sin aplicación ejecutable. Necesitamos una base mínima de Nuxt 4 que arranque y pueda verificarse de forma objetiva antes de construir cualquier funcionalidad del producto.

## What Changes

- Inicializar un proyecto Nuxt 4 con TypeScript en la raíz del repositorio, sin contenido de plantilla de ejemplo.
- Definir una página de inicio renderizada en el servidor con contenido propio del proyecto.
- Exponer un endpoint de salud `GET /api/health` que devuelva estado y versión de la aplicación en JSON.
- Configurar scripts de desarrollo, build y preview, y fijar el runtime de Node requerido.
- Añadir un procedimiento de verificación reproducible: arranque del servidor de desarrollo, comprobación HTTP de la página y del endpoint, y build de producción con arranque del servidor construido.
- Añadir un `.gitignore` y una configuración mínima de Nuxt ajustada al proyecto.

Fuera de alcance: autenticación, base de datos, despliegue, CI, contenido de producto y cualquier pantalla más allá de la página inicial de verificación.

## Capabilities

### New Capabilities

- `nuxt-ssr-app`: Aplicación Nuxt 4 que compila, arranca en desarrollo y en producción, y sirve una página inicial renderizada en el servidor.
- `server-health`: Endpoint HTTP de salud que reporta el estado del servidor y permite verificar el despliegue de forma automática.

### Modified Capabilities

Ninguna: no existen capacidades previas en `openspec/specs/`.

## Impact

- Nuevos archivos de proyecto en la raíz: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `.gitignore`, `app/` y `server/`.
- Nuevas dependencias: `nuxt` (4.x) y `vue`/`vue-router` provistas por Nuxt; tooling de desarrollo de Nuxt según el scaffold elegido.
- Nuevo contrato HTTP: `GET /` (HTML) y `GET /api/health` (JSON).
- No se modifican APIs ni sistemas existentes, porque el repositorio no contiene código de aplicación.
