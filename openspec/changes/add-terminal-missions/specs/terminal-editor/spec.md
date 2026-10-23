# Spec Delta

## Purpose

Ofrece un editor de texto modal dentro de la terminal simulada para que el jugador pueda modificar archivos del sistema virtual y completar misiones de edición sin salir del juego.

## ADDED Requirements

### Requirement: Apertura del editor

`nano <archivo>` SHALL abrir un búfer con el contenido actual del archivo o un búfer vacío si el archivo no existe. El archivo nuevo SHALL NOT crearse hasta que se guarde. `nano` sin argumento SHALL abrir un búfer vacío sin ruta.

#### Scenario: Abrir un archivo existente

- **WHEN** el usuario ejecuta `nano notas.txt`
- **THEN** el editor muestra el contenido actual de `notas.txt`
- **AND** la terminal no procesa comandos mientras el editor está abierto

#### Scenario: Archivo nuevo

- **WHEN** el usuario ejecuta `nano nuevo.txt` sobre una ruta inexistente
- **THEN** el editor muestra un búfer vacío
- **AND** `nuevo.txt` no existe todavía en el sistema virtual

#### Scenario: Abrir un directorio

- **WHEN** el usuario ejecuta `nano sueno`
- **THEN** la salida informa que es un directorio
- **AND** el editor no se abre
- **AND** el código de salida es distinto de `0`

### Requirement: Edición y guardado

El editor SHALL permitir modificar el texto del búfer y guardarlo con `^O`. Al guardar SHALL escribir el contenido en la ruta indicada y SHALL emitir un efecto de escritura con la ruta, si el archivo se creó y si el contenido cambió.

#### Scenario: Guardar cambios

- **WHEN** el usuario modifica el búfer y pulsa `^O`
- **THEN** el archivo contiene el texto editado
- **AND** el efecto indica que el contenido cambió
- **AND** el editor permanece abierto

#### Scenario: Crear al guardar

- **WHEN** el usuario guarda un búfer abierto sobre una ruta inexistente
- **THEN** el archivo se crea con el contenido del búfer
- **AND** el efecto indica que el archivo se creó

#### Scenario: Guardar sin cambios

- **WHEN** el usuario guarda un búfer sin modificarlo
- **THEN** el archivo conserva su contenido
- **AND** el efecto indica que el contenido no cambió

#### Scenario: Guardar sin ruta

- **WHEN** el usuario abre `nano` sin argumento y pulsa `^O`
- **THEN** el editor solicita una ruta antes de guardar
- **AND** no escribe ningún archivo hasta recibirla

### Requirement: Salida del editor

`^X` SHALL cerrar el editor. Si hay cambios sin guardar, SHALL preguntar si se guardan, se descartan o se cancela la salida. Al cerrar SHALL devolver el foco a la terminal.

#### Scenario: Salir sin cambios pendientes

- **WHEN** el usuario pulsa `^X` sin cambios sin guardar
- **THEN** el editor se cierra
- **AND** el foco vuelve al campo de entrada de la terminal
- **AND** el código de salida es `0`

#### Scenario: Descartar cambios

- **WHEN** el usuario pulsa `^X` con cambios sin guardar y elige descartar
- **THEN** el archivo conserva su contenido anterior
- **AND** el editor se cierra
- **AND** no se emite ningún efecto de escritura

#### Scenario: Cancelar la salida

- **WHEN** el usuario pulsa `^X` con cambios sin guardar y elige cancelar
- **THEN** el editor permanece abierto con el búfer intacto

### Requirement: Aislamiento del editor

El editor SHALL operar exclusivamente sobre el sistema de archivos virtual y SHALL NOT leer ni escribir archivos reales, acceder a la red ni ejecutar procesos.

#### Scenario: Sin acceso al sistema real

- **WHEN** el usuario guarda un archivo desde el editor
- **THEN** solo cambia el sistema de archivos virtual de la sesión
- **AND** ningún archivo fuera de la aplicación se modifica

### Requirement: Accesibilidad y uso táctil

El editor SHALL exponerse como diálogo modal con etiqueta accesible, SHALL mantener el foco dentro mientras está abierto y SHALL ofrecer botones visibles de guardar y salir equivalentes a `^O` y `^X`.

#### Scenario: Uso sin teclado

- **WHEN** el usuario abre el editor en un dispositivo táctil
- **THEN** ve botones para guardar y salir
- **AND** puede completar la edición sin usar atajos de teclado

#### Scenario: Foco contenido

- **WHEN** el editor está abierto y el usuario pulsa TAB repetidamente
- **THEN** el foco permanece dentro del diálogo
- **AND** no alcanza el campo de entrada de la terminal

### Requirement: Determinismo del editor

El editor SHALL existir solo en el cliente después de una interacción y SHALL NOT alterar el HTML inicial de la página.

#### Scenario: Carga inicial

- **WHEN** se solicita `GET /terminal` sin interacción
- **THEN** el HTML no contiene el diálogo del editor
- **AND** el HTML es determinista entre solicitudes
