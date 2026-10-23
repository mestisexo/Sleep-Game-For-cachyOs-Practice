# Spec Delta

## Purpose

Proporciona una comprobación HTTP de salud del servidor que permite verificar de forma automática que la aplicación está en ejecución y responde, sin depender de la página visual.

## ADDED Requirements

### Requirement: Endpoint de salud

El sistema SHALL exponer `GET /api/health` sin autenticación, devolviendo estado HTTP 200 y un cuerpo JSON que indique que el servicio está operativo.

#### Scenario: Servicio operativo

- **WHEN** un cliente solicita `GET /api/health` con el servidor en ejecución
- **THEN** la respuesta tiene estado HTTP 200
- **AND** el `Content-Type` es `application/json`
- **AND** el cuerpo es un objeto JSON con `status` igual a `"ok"`
- **AND** el cuerpo incluye un identificador del servicio y la versión de la aplicación

#### Scenario: Respuesta verificable de forma automática

- **WHEN** un script comprueba el endpoint con una petición HTTP simple
- **THEN** puede decidir el éxito usando únicamente el código de estado y el campo `status`
- **AND** no necesita interpretar HTML ni ejecutar JavaScript en el cliente

### Requirement: Salud consistente entre modos de ejecución

El endpoint de salud SHALL devolver el mismo contrato de respuesta en el servidor de desarrollo y en el servidor de producción construido.

#### Scenario: Desarrollo y producción equivalentes

- **WHEN** se consulta `GET /api/health` en el servidor de desarrollo y en el servidor de producción
- **THEN** ambas respuestas tienen estado HTTP 200
- **AND** ambas incluyen los campos `status`, servicio y versión
- **AND** solo pueden diferir en valores variables como la marca de tiempo

### Requirement: La salud no revela datos sensibles

La respuesta de salud SHALL limitarse a información operativa no sensible.

#### Scenario: Contenido limitado

- **WHEN** un cliente lee la respuesta de `GET /api/health`
- **THEN** el cuerpo no incluye secretos, rutas del sistema de archivos, variables de entorno ni detalles de stack
