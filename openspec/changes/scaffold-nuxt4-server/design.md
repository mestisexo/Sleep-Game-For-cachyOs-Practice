# Design

## Context

El repositorio solo contiene `openspec/` y `.opencode/`; no hay `package.json` ni código de aplicación. El entorno detectado es Linux con Node.js 26.11.1, npm 12.2.1 y sin pnpm instalado. El scaffold debe convivir con la carpeta `openspec/` ya existente en la raíz. Ver `proposal.md` para la motivación y `specs/` para el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**

- Un proyecto Nuxt 4 mínimo, reproducible con `npm`, que arranque en desarrollo y en producción.
- Verificación objetiva y repetible de la página inicial y del endpoint de salud.
- Estructura y configuración que sirvan de base para funcionalidad futura sin rehacer el scaffold.

**Non-Goals:**

- Despliegue, contenedores, CI/CD o configuración de infraestructura.
- Autenticación, base de datos, capa de API de negocio o UI más allá de la página de verificación.
- Soporte multi-paquete (monorepo) o elección de un gestor distinto de npm.

## Decisions

### Scaffold manual en lugar de `create-nuxt`

Se crearán a mano `package.json`, `nuxt.config.ts`, `tsconfig.json` y los archivos de `app/` y `server/`, en vez de ejecutar `npm create nuxt`. Motivos: el generador es interactivo por defecto, añade plantillas y assets no deseados, y puede rechazar o mezclar contenido en un directorio no vacío (ya existe `openspec/`). El scaffold manual deja un árbol mínimo y auditable.

Alternativa descartada: `npx nuxi init .` dentro de la raíz; menos control sobre el contenido y sobre la estructura `app/` de Nuxt 4.

### Estructura Nuxt 4 por defecto

Se usa la estructura de Nuxt 4: `app/app.vue` como raíz de la aplicación (srcDir `app/`), `server/api/health.get.ts` para el endpoint y `public/` solo si hace falta. No se personaliza `srcDir`, para mantener compatibilidad con la documentación y las convenciones del framework.

### Versión y metadatos desde `package.json`

`package.json` declara `nuxt` en la línea 4.x y `engines.node >= 20.19.0`. La versión de la aplicación y el nombre del servicio se leen de `package.json` en `nuxt.config.ts` y se exponen al servidor mediante `runtimeConfig.appVersion`; el handler de salud los consume con `useRuntimeConfig()`. Así se evita duplicar la versión en el código.

Alternativa descartada: hardcodear la versión en el handler; obliga a recordar dos sitios en cada release.

### Verificación mediante script bash con `curl`

Se añade `scripts/verify-server.sh`, que acepta `dev` o `prod`, arranca el servidor en un puerto libre, espera con reintentos acotados, comprueba `/` y `/api/health`, y termina el proceso con `trap` en cualquier salida. Se prefiere a un framework de tests porque el objetivo de esta tarea es verificar el arranque real del servidor, no cubrir lógica de aplicación; además no añade dependencias.

Alternativa descartada: Vitest + `@nuxt/test-utils`; útil más adelante, pero añade peso y tiempo de configuración sin cubrir mejor el arranque de producción.

### Scripts npm estándar y puerto configurable

`package.json` expone `dev`, `build`, `preview` y `verify:dev` / `verify:prod` como atajos del script. El puerto se toma de `PORT` con 3000 por defecto, coherente con Nuxt/Nitro, y el script de verificación elige un puerto libre para no chocar con procesos existentes.

### Instalación con npm y lockfile versionado

Se usa npm (ya disponible) y se versiona `package-lock.json`. No se instala pnpm ni se asume un gestor alternativo.

## Risks / Trade-offs

- **Node 26 es más nuevo que la matriz probada por Nuxt** → si `npm install` o `nuxt build` fallan por incompatibilidad, ejecutar la verificación con Node 22 LTS y registrar la versión usada; `engines` documenta el mínimo, no un máximo.
- **El scaffold manual puede omitir configuración que `create-nuxt` genera** (por ejemplo, `.npmrc` o `app.config.ts`) → el script de verificación detecta fallos de arranque y el build de producción valida el resultado; añadir solo lo que el build requiera.
- **Puertos ocupados en la máquina** → el script selecciona un puerto libre y lo pasa por `PORT`; nunca asume que 3000 está disponible.
- **El servidor de producción depende de que `.output/` esté actualizado** → la tarea de verificación de producción siempre ejecuta `build` antes de arrancar; no se reutiliza un `.output` previo.
- **`runtimeConfig` con la versión no es público** → solo el servidor lo lee; si más adelante el cliente necesita la versión, se moverá a `runtimeConfig.public` de forma explícita.

## Migration Plan

No aplica: no hay sistema previo ni datos que migrar. Para revertir, basta con eliminar los archivos añadidos por este cambio; `openspec/` no se modifica.
