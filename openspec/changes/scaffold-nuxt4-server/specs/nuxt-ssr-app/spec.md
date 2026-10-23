# Spec Delta

## Purpose

Define la aplicación Nuxt 4 que compila, arranca y sirve una página inicial renderizada en el servidor, tanto en desarrollo como en un build de producción.

## ADDED Requirements

### Requirement: Página inicial renderizada en el servidor

La aplicación SHALL responder `GET /` con estado HTTP 200 y un documento HTML que incluya el nombre del proyecto, generado en el servidor y no solo en el cliente.

#### Scenario: Acceso a la página inicial

- **WHEN** un cliente solicita `GET /` al servidor en ejecución
- **THEN** la respuesta tiene estado HTTP 200
- **AND** el cuerpo es HTML con `Content-Type` que incluye `text/html`
- **AND** el HTML contiene el nombre del proyecto en el marcado entregado por el servidor

#### Scenario: Ruta inexistente

- **WHEN** un cliente solicita una ruta que no existe
- **THEN** la respuesta tiene estado HTTP 404
- **AND** el cuerpo es una página de error HTML

### Requirement: Arranque en modo desarrollo

El proyecto SHALL ofrecer un comando de desarrollo que arranca el servidor y queda escuchando en el puerto configurado, de forma que un cliente pueda conectarse sin pasos manuales adicionales.

#### Scenario: Servidor de desarrollo disponible

- **WHEN** se ejecuta el comando de desarrollo en una instalación limpia con dependencias instaladas
- **THEN** el proceso queda escuchando en `http://localhost:3000` en menos de 120 segundos
- **AND** el puerto puede sobreescribirse con la variable de entorno `PORT`
- **AND** `GET /` responde 200 mientras el proceso sigue en ejecución

### Requirement: Build y ejecución de producción

El proyecto SHALL producir un artefacto de servidor autocontenido mediante un comando de build y SHALL poder ejecutarse con Node.js sin dependencias de desarrollo.

#### Scenario: Build de producción correcto

- **WHEN** se ejecuta el comando de build sobre una instalación con dependencias instaladas
- **THEN** el comando termina con código de salida 0
- **AND** genera el servidor de producción en `.output/server/index.mjs`

#### Scenario: Servidor de producción responde

- **WHEN** se inicia `.output/server/index.mjs` con Node.js y `PORT` libre
- **THEN** `GET /` responde 200 con la página inicial renderizada
- **AND** el proceso no requiere variables de entorno adicionales para arrancar

### Requirement: Runtime de Node declarado

El proyecto SHALL declarar la versión mínima de Node.js soportada para que la instalación y la ejecución fallen de forma explícita en entornos incompatibles.

#### Scenario: Entorno compatible

- **WHEN** se instalan las dependencias con una versión de Node.js igual o superior a la declarada
- **THEN** la instalación termina correctamente
- **AND** los comandos de desarrollo y build están disponibles en `package.json`
