# Tasks

## 1. Scaffold del proyecto

- [x] 1.1 Crear `package.json` con `nuxt` 4.x, `engines.node >= 20.19.0`, `private: true` y los scripts `dev`, `build`, `preview`, `verify:dev` y `verify:prod`; verificar con `node -e "const p=require('./package.json'); console.log(p.scripts.dev, p.dependencies.nuxt)"` que el JSON es válido y declara Nuxt 4.
- [x] 1.2 Añadir `nuxt.config.ts` con `appVersion` leído de `package.json`, `compatibilityDate` vigente y sin módulos innecesarios; verificar con `npx nuxi info` que Nuxt carga la configuración sin errores.
- [x] 1.3 Añadir `tsconfig.json` que extienda `./.nuxt/tsconfig.json` y `.gitignore` con `node_modules`, `.nuxt`, `.output`, `.data` y logs; verificar que `git check-ignore` (o `cat`) confirma que las rutas generadas quedan ignoradas.
- [x] 1.4 Crear `app/app.vue` con la página inicial renderizada en el servidor y el nombre del proyecto en el HTML; verificar que el archivo existe y que `npm run build` lo incluye en la salida.
- [x] 1.5 Instalar dependencias con `npm install` y verificar que termina con código 0 y genera `package-lock.json` y `node_modules/nuxt`.

## 2. Endpoint de salud

- [x] 2.1 Implementar `server/api/health.get.ts` con `status: "ok"`, nombre del servicio y versión desde `runtimeConfig`, sin datos sensibles; verificar con `npm run dev` y `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health` que responde 200.
- [x] 2.2 Comprobar el contrato JSON del endpoint; verificar con `curl -s http://localhost:3000/api/health | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);if(j.status!=='ok'||!j.service||!j.version)process.exit(1);console.log(j)})"` que `status`, `service` y `version` están presentes.

## 3. Verificación reproducible

- [x] 3.1 Crear `scripts/verify-server.sh` que acepte `dev` o `prod`, elija un puerto libre, espere con reintentos acotados, compruebe `/` y `/api/health`, y limpie el proceso con `trap`; verificar con `bash -n scripts/verify-server.sh` y `chmod +x` que el script es sintácticamente válido y ejecutable.
- [x] 3.2 Ejecutar `./scripts/verify-server.sh dev` y verificar que termina con código 0 sin dejar procesos escuchando en el puerto usado.
- [x] 3.3 Ejecutar `./scripts/verify-server.sh prod` (build incluido) y verificar que `.output/server/index.mjs` existe, que la página y `/api/health` responden 200, y que el script termina con código 0.

## 4. Documentación y comprobación final

- [x] 4.1 Documentar en `README.md` requisitos (Node.js >= 20.19), instalación, comandos de desarrollo/build/preview y cómo ejecutar la verificación; verificar copiando los comandos documentados en una terminal limpia.
- [x] 4.2 Ejecutar la comprobación integral `npm install && npm run build && ./scripts/verify-server.sh prod` desde un clon limpio (sin `.nuxt`/`.output` previos) y verificar que termina con código 0.
- [x] 4.3 Ejecutar `openspec validate scaffold-nuxt4-server --strict` y verificar que el cambio planificado es válido antes de archivar.

## Workflow follow-up

- Archivar el cambio tras la revisión y verificar el resultado archivado.
