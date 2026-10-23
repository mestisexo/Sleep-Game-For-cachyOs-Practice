# Spec Delta

## MODIFIED Requirements

### Requirement: Comandos disponibles

La terminal SHALL reconocer `help`, `clear`, `pwd`, `cd`, `ls`, `cat`, `echo`, `mkdir`, `touch`, `rm`, `rmdir`, `whoami`, `cp`, `mv`, `grep`, `which`, `nano`, `sudo` y `apt`; cualquier otro nombre SHALL responder con un error de comando no encontrado y código `127`. `help` SHALL enumerar solo los nombres disponibles, sin descripciones.

#### Scenario: Ayuda

- **WHEN** el usuario ejecuta `help`
- **THEN** la salida enumera los nombres de los comandos disponibles
- **AND** no incluye descripciones de lo que hace cada comando
- **AND** el código de salida es `0`

#### Scenario: Comando desconocido

- **WHEN** el usuario ejecuta `git status`
- **THEN** la salida indica que `git` no se encontró
- **AND** el código de salida es `127`

#### Scenario: Identidad simulada

- **WHEN** el usuario ejecuta `whoami`
- **THEN** la salida muestra el usuario simulado de la sesión
- **AND** el código de salida es `0`

## ADDED Requirements

### Requirement: Opciones de listado

`ls` SHALL aceptar `-a` para incluir las entradas cuyo nombre empieza por punto y `-l` para mostrar un formato largo con permisos, propietario, tamaño en bytes y nombre. Las opciones SHALL poder combinarse (`-la`, `-al`).

#### Scenario: Listar entradas ocultas

- **WHEN** el usuario ejecuta `ls -a` en un directorio que contiene una entrada oculta
- **THEN** la salida incluye esa entrada
- **AND** el código de salida es `0`

#### Scenario: Formato largo

- **WHEN** el usuario ejecuta `ls -l` sobre un archivo con contenido
- **THEN** la línea muestra permisos, propietario, tamaño en bytes y nombre
- **AND** el tamaño coincide con el número de bytes del contenido

#### Scenario: Opciones combinadas

- **WHEN** el usuario ejecuta `ls -la`
- **THEN** la salida combina el formato largo y las entradas ocultas
- **AND** el código de salida es `0`

### Requirement: Creación de jerarquías

`mkdir -p` SHALL crear los directorios intermedios que falten y SHALL terminar con código `0` cuando el directorio final ya existe.

#### Scenario: Directorios anidados

- **WHEN** el usuario ejecuta `mkdir -p proyectos/sueno/noche1`
- **THEN** existen los tres directorios
- **AND** el código de salida es `0`

#### Scenario: Directorio ya existente

- **WHEN** el usuario ejecuta `mkdir -p sueno` sobre un directorio existente
- **THEN** no se modifica el sistema de archivos
- **AND** el código de salida es `0`

### Requirement: Borrado recursivo y forzado

`rm` SHALL aceptar `-r` para eliminar directorios con contenido y `-f` para ignorar rutas inexistentes. Sin `-r`, `rm` SHALL rechazar un directorio con código distinto de cero.

#### Scenario: Borrar un directorio con contenido

- **WHEN** el usuario ejecuta `rm -r sueno`
- **THEN** el directorio y su contenido desaparecen
- **AND** el código de salida es `0`

#### Scenario: Ignorar una ruta inexistente

- **WHEN** el usuario ejecuta `rm -f noexiste.txt`
- **THEN** no se muestra error
- **AND** el código de salida es `0`

#### Scenario: Directorio sin recursividad

- **WHEN** el usuario ejecuta `rm sueno`
- **THEN** la salida informa que es un directorio
- **AND** el código de salida es distinto de `0`

### Requirement: Concatenación con cat

`cat` SHALL aceptar varios archivos y SHALL escribir su contenido en el orden de los argumentos.

#### Scenario: Varios archivos

- **WHEN** el usuario ejecuta `cat notas.txt sueno/diario.txt`
- **THEN** la salida contiene el contenido del primer archivo seguido del segundo
- **AND** el código de salida es `0`

#### Scenario: Un archivo intermedio no existe

- **WHEN** el usuario ejecuta `cat notas.txt noexiste.txt`
- **THEN** la salida muestra el contenido de `notas.txt`
- **AND** el error de la ruta inexistente aparece en `stderr`
- **AND** el código de salida es distinto de `0`

### Requirement: Copia y movimiento

`cp` SHALL copiar archivos y `mv` SHALL mover archivos y directorios. `cp -r` SHALL copiar directorios con su contenido. Copiar sobre un archivo existente SHALL sobrescribirlo.

#### Scenario: Copiar un archivo

- **WHEN** el usuario ejecuta `cp notas.txt copia.txt`
- **THEN** `copia.txt` existe con el mismo contenido que `notas.txt`
- **AND** el código de salida es `0`

#### Scenario: Copiar un directorio sin recursividad

- **WHEN** el usuario ejecuta `cp sueno copia`
- **THEN** la salida informa que se omite un directorio
- **AND** el código de salida es distinto de `0`

#### Scenario: Mover un archivo

- **WHEN** el usuario ejecuta `mv notas.txt sueno/notas.txt`
- **THEN** el archivo deja de existir en el origen y aparece en el destino
- **AND** el código de salida es `0`

### Requirement: Búsqueda de texto

`grep <patrón> [archivo...]` SHALL buscar el patrón como expresión regular en el contenido de los archivos indicados y SHALL escribir las líneas que coinciden. Sin coincidencias SHALL devolver código `1`; un archivo ilegible SHALL devolver código `2`.

#### Scenario: Línea coincidente

- **WHEN** el usuario ejecuta `grep diario sueno/diario.txt`
- **THEN** la salida incluye la línea que contiene `diario`
- **AND** el código de salida es `0`

#### Scenario: Sin coincidencias

- **WHEN** el usuario ejecuta `grep dinosaurio notas.txt`
- **THEN** la salida no muestra líneas
- **AND** el código de salida es `1`

#### Scenario: Archivo inexistente

- **WHEN** el usuario ejecuta `grep hola noexiste.txt`
- **THEN** el error aparece en `stderr`
- **AND** el código de salida es `2`

### Requirement: Opciones no reconocidas

Cuando un comando recibe una opción que no admite, SHALL escribir una línea de uso en `stderr` y SHALL devolver código `2`, sin ejecutar la operación.

#### Scenario: Opción inválida

- **WHEN** el usuario ejecuta `ls -z`
- **THEN** `stderr` muestra la línea de uso de `ls`
- **AND** el código de salida es `2`
- **AND** no se lista ningún directorio
