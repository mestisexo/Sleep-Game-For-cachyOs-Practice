# Spec Delta

## Purpose

Simula la instalación de paquetes con `apt` y `sudo` para que el jugador practique la gestión de software y desbloquee comandos nuevos sin acceso real a la red ni al sistema operativo.

## ADDED Requirements

### Requirement: Privilegios simulados

`sudo <comando>` SHALL ejecutar el comando con privilegios de superusuario simulado y SHALL propagar su salida, código de salida y efectos. `sudo` SHALL NOT solicitar contraseña. Sin `sudo`, las operaciones de `apt` que modifican el sistema SHALL fallar con código `100` y no SHALL cambiar el estado.

#### Scenario: Instalar con privilegios

- **WHEN** el usuario ejecuta `sudo apt install cowsay`
- **THEN** el comando se ejecuta con privilegios simulados
- **AND** el código de salida es `0`

#### Scenario: Instalar sin privilegios

- **WHEN** el usuario ejecuta `apt install cowsay` sin `sudo`
- **THEN** la salida informa de que se requieren privilegios
- **AND** el código de salida es `100`
- **AND** el paquete no queda instalado

#### Scenario: Comando desconocido con sudo

- **WHEN** el usuario ejecuta `sudo inexistente`
- **THEN** la salida informa que `inexistente` no se encontró
- **AND** el código de salida es `127`

### Requirement: Actualización del índice

`sudo apt update` SHALL marcar el índice de paquetes como disponible y SHALL devolver código `0`. La operación SHALL ser idempotente y SHALL NOT acceder a la red.

#### Scenario: Actualizar el índice

- **WHEN** el usuario ejecuta `sudo apt update`
- **THEN** la salida informa de que el índice se actualizó
- **AND** el código de salida es `0`

#### Scenario: Actualización repetida

- **WHEN** el usuario ejecuta `sudo apt update` dos veces
- **THEN** ambas terminan con código `0`
- **AND** no se duplican paquetes en el estado

### Requirement: Instalación de paquetes

`sudo apt install <paquete>...` SHALL instalar los paquetes del catálogo indicados, SHALL habilitar sus comandos y SHALL devolver código `0`. Un paquete desconocido SHALL devolver código `100` y un paquete ya instalado SHALL informarse sin error.

#### Scenario: Instalar un paquete del catálogo

- **WHEN** el usuario ejecuta `sudo apt install cowsay`
- **THEN** `cowsay` aparece como instalado
- **AND** el comando `cowsay` queda disponible
- **AND** el código de salida es `0`

#### Scenario: Paquete desconocido

- **WHEN** el usuario ejecuta `sudo apt install paquete-inexistente`
- **THEN** la salida informa de que no se pudo localizar el paquete
- **AND** el código de salida es `100`
- **AND** el estado de paquetes no cambia

#### Scenario: Paquete ya instalado

- **WHEN** el usuario instala dos veces el mismo paquete
- **THEN** la segunda ejecución informa de que ya está instalado
- **AND** el código de salida es `0`

#### Scenario: Instalar sin actualizar el índice

- **WHEN** el usuario ejecuta `sudo apt install cowsay` sin haber ejecutado `apt update`
- **THEN** la salida indica que el índice no está disponible
- **AND** el código de salida es `100`
- **AND** el paquete no queda instalado

### Requirement: Listado de paquetes instalados

`apt list --installed` SHALL enumerar los nombres de los paquetes instalados, uno por línea, y SHALL devolver código `0`.

#### Scenario: Sin paquetes instalados

- **WHEN** el usuario ejecuta `apt list --installed` al inicio de la sesión
- **THEN** no se enumera ningún paquete
- **AND** el código de salida es `0`

#### Scenario: Con paquetes instalados

- **WHEN** el usuario ejecuta `apt list --installed` después de instalar `cowsay`
- **THEN** la salida incluye `cowsay`
- **AND** el código de salida es `0`

### Requirement: Estado observable en el sistema virtual

El estado de paquetes SHALL reflejarse en `/var/lib/dpkg/status`, con una entrada legible por paquete instalado, de modo que `cat` y `grep` puedan consultarlo.

#### Scenario: Estado inicial vacío

- **WHEN** el usuario ejecuta `cat /var/lib/dpkg/status` al inicio de la sesión
- **THEN** el archivo existe
- **AND** no contiene paquetes instalados

#### Scenario: Estado tras instalar

- **WHEN** el usuario instala `cowsay` y ejecuta `grep cowsay /var/lib/dpkg/status`
- **THEN** la salida contiene la entrada de `cowsay`
- **AND** el código de salida es `0`

### Requirement: Catálogo fijo de paquetes

El catálogo SHALL contener `cowsay`, `fortune` y `figlet`, sin dependencias, versiones ni acceso a repositorios reales. Cada paquete SHALL aportar exactamente un comando con el mismo nombre.

#### Scenario: Catálogo conocido

- **WHEN** el usuario intenta instalar un nombre que no está en el catálogo
- **THEN** la instalación falla con código `100`

#### Scenario: Sin dependencias

- **WHEN** el usuario instala un paquete del catálogo
- **THEN** no se instala ningún otro paquete de forma implícita

### Requirement: Comandos aportados por paquetes

Los comandos de los paquetes SHALL existir solo cuando el paquete está instalado y SHALL comportarse de forma simulada y determinista.

#### Scenario: cowsay

- **WHEN** el usuario ejecuta `cowsay hola` con el paquete instalado
- **THEN** la salida contiene `hola` dentro de un dibujo ASCII
- **AND** el código de salida es `0`

#### Scenario: fortune

- **WHEN** el usuario ejecuta `fortune` con el paquete instalado
- **THEN** la salida contiene una frase de la lista fija
- **AND** el código de salida es `0`

#### Scenario: figlet

- **WHEN** el usuario ejecuta `figlet hola` con el paquete instalado
- **THEN** la salida contiene un dibujo ASCII formado con las letras de `hola`
- **AND** el código de salida es `0`

#### Scenario: Comando sin el paquete

- **WHEN** el usuario ejecuta `figlet hola` sin el paquete instalado
- **THEN** la salida informa que `figlet` no se encontró
- **AND** el código de salida es `127`

### Requirement: Aislamiento de paquetes

`apt` y los comandos de paquetes SHALL NOT acceder a la red, al gestor de paquetes real, a procesos del sistema ni a archivos fuera de la aplicación.

#### Scenario: Sin red

- **WHEN** el usuario ejecuta cualquier operación de `apt`
- **THEN** no se realiza ninguna petición de red

#### Scenario: Sin instalación real

- **WHEN** el usuario instala un paquete simulado
- **THEN** solo cambia el estado de la sesión y el sistema de archivos virtual
- **AND** el sistema operativo real no se modifica
