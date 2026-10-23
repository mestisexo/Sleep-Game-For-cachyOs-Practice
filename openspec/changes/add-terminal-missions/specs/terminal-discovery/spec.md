# Spec Delta

## Purpose

Permite descubrir y completar comandos desde la propia terminal mediante líneas de uso, autocompletado y resolución de nombres, sin exponer descripciones que resuelvan el reto por el jugador.

## ADDED Requirements

### Requirement: Ayuda de uso sin descripciones

Todo comando del catálogo SHALL aceptar `--help` y SHALL responder con una única línea de uso que muestre su nombre, opciones y argumentos, sin explicar qué hace. El código de salida SHALL ser `0`.

#### Scenario: Uso de un comando

- **WHEN** el usuario ejecuta `ls --help`
- **THEN** la salida muestra una línea que empieza por `uso: ls`
- **AND** incluye las opciones `-a` y `-l`
- **AND** no incluye una descripción en prosa
- **AND** el código de salida es `0`

#### Scenario: Uso de un comando sin opciones

- **WHEN** el usuario ejecuta `pwd --help`
- **THEN** la salida muestra `uso: pwd`
- **AND** el código de salida es `0`

#### Scenario: Uso a través de sudo

- **WHEN** el usuario ejecuta `sudo apt --help`
- **THEN** la salida muestra la línea de uso de `apt`
- **AND** el código de salida es `0`

### Requirement: Autocompletado con TAB

El campo de entrada SHALL completar nombres de comando con TAB a partir del catálogo disponible, incluyendo los comandos aportados por paquetes instalados. Con una sola coincidencia SHALL completar el nombre; con varias SHALL mostrar las coincidencias sin ejecutar nada.

#### Scenario: Coincidencia única

- **WHEN** el usuario escribe `who` y pulsa TAB
- **THEN** el campo de entrada contiene `whoami `
- **AND** no se ejecuta ningún comando

#### Scenario: Varias coincidencias

- **WHEN** el usuario escribe `c` y pulsa TAB
- **THEN** la terminal muestra los nombres disponibles que empiezan por `c`
- **AND** el campo de entrada no se envía

#### Scenario: Sin coincidencias

- **WHEN** el usuario escribe `zzz` y pulsa TAB
- **THEN** el campo de entrada conserva `zzz`
- **AND** no se muestra ningún error

#### Scenario: Comando instalado

- **WHEN** el usuario instala un paquete que aporta un comando y después escribe su prefijo y pulsa TAB
- **THEN** el autocompletado incluye ese comando

### Requirement: Resolución de nombres

La terminal SHALL resolver el nombre de comando de forma exacta y sensible a mayúsculas, y SHALL responder con código `127` cuando no exista ni en el catálogo ni entre los comandos de paquetes instalados.

#### Scenario: Nombre exacto

- **WHEN** el usuario ejecuta `LS`
- **THEN** la salida informa que `LS` no se encontró
- **AND** el código de salida es `127`

#### Scenario: Comando de paquete no instalado

- **WHEN** el usuario ejecuta `cowsay hola` sin haber instalado el paquete
- **THEN** la salida informa que `cowsay` no se encontró
- **AND** el código de salida es `127`

#### Scenario: Comando de paquete instalado

- **WHEN** el usuario ejecuta `cowsay hola` después de instalar el paquete
- **THEN** la salida contiene `hola`
- **AND** el código de salida es `0`

### Requirement: Consulta de resolución con which

`which <nombre>` SHALL indicar la ruta simulada del comando cuando se resuelve y SHALL devolver código `1` cuando no existe.

#### Scenario: Comando existente

- **WHEN** el usuario ejecuta `which ls`
- **THEN** la salida muestra `/usr/bin/ls`
- **AND** el código de salida es `0`

#### Scenario: Comando inexistente

- **WHEN** el usuario ejecuta `which git`
- **THEN** la salida no muestra ninguna ruta
- **AND** el código de salida es `1`

### Requirement: Sin descripciones en la terminal

Ninguna salida de ayuda, error o consulta SHALL incluir una descripción en prosa de para qué sirve un comando. Solo se permiten nombres, líneas de uso, rutas y mensajes de error.

#### Scenario: Ayuda general

- **WHEN** el usuario ejecuta `help`
- **THEN** la salida contiene únicamente nombres de comando
- **AND** ninguna línea describe el propósito de un comando

#### Scenario: Error de uso

- **WHEN** el usuario ejecuta un comando con una opción inválida
- **THEN** el mensaje contiene la línea de uso y el error
- **AND** no contiene una explicación del propósito del comando
