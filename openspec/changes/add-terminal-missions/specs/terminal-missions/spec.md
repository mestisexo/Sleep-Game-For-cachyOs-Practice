# Spec Delta

## Purpose

Define la progresión del juego mediante misiones que se completan al operar la terminal, con experiencia, niveles y un panel que orienta al jugador sin revelar los comandos.

## ADDED Requirements

### Requirement: Catálogo de misiones declarativas

El sistema SHALL definir las misiones como datos declarativos con identificador único, nivel mínimo, experiencia otorgada, título, pista y un objetivo evaluable. El catálogo SHALL ser determinista y no SHALL depender del texto de la salida de los comandos.

#### Scenario: Catálogo determinista

- **WHEN** se carga la aplicación dos veces con el mismo código
- **THEN** el catálogo de misiones contiene los mismos identificadores en el mismo orden

#### Scenario: Identificadores únicos

- **WHEN** se construye el catálogo
- **THEN** no existen dos misiones con el mismo identificador

### Requirement: Evaluación por eventos

La evaluación de una misión SHALL basarse en el comando ejecutado, su código de salida y los efectos estructurados que produjo, y SHALL NOT basarse en `stdout`, `stderr` ni en una comparación del sistema de archivos antes y después.

#### Scenario: Misión de creación de carpeta

- **WHEN** el usuario ejecuta `mkdir refugio` y el comando termina con código `0`
- **THEN** la misión de crear una carpeta queda completada

#### Scenario: Comando fallido no completa

- **WHEN** el usuario ejecuta `mkdir /noexiste/refugio` y el comando falla
- **THEN** la misión de crear una carpeta no queda completada

#### Scenario: Misión de lectura

- **WHEN** el usuario ejecuta `cat notas.txt` con código `0`
- **THEN** la misión de leer un archivo queda completada

### Requirement: Progreso, experiencia y niveles

Cada misión SHALL otorgar su experiencia una sola vez, al completarse por primera vez. El nivel SHALL derivarse de la experiencia acumulada mediante umbrales fijos y SHALL NOT disminuir.

#### Scenario: Experiencia única

- **WHEN** el usuario completa una misión y repite la acción que la completó
- **THEN** la experiencia total no vuelve a aumentar por esa misión

#### Scenario: Subida de nivel

- **WHEN** la experiencia acumulada alcanza el umbral del siguiente nivel
- **THEN** el nivel mostrado aumenta
- **AND** se anuncia la subida de nivel

#### Scenario: Nivel estable

- **WHEN** el usuario ejecuta un comando con error
- **THEN** la experiencia y el nivel no cambian

### Requirement: Misiones iniciales

El catálogo inicial SHALL incluir misiones para crear una carpeta, borrar un archivo, leer un archivo con `cat`, editar un archivo con `nano` e instalar un paquete.

#### Scenario: Crear una carpeta

- **WHEN** el usuario crea un directorio con éxito
- **THEN** la misión correspondiente se marca como completada

#### Scenario: Borrar un archivo

- **WHEN** el usuario elimina un archivo existente con éxito
- **THEN** la misión correspondiente se marca como completada

#### Scenario: Editar un archivo

- **WHEN** el usuario guarda un cambio real de contenido desde el editor
- **THEN** la misión correspondiente se marca como completada

#### Scenario: Instalar un paquete

- **WHEN** el usuario instala un paquete del catálogo con éxito
- **THEN** la misión correspondiente se marca como completada

### Requirement: Presentación sin revelar comandos

La interfaz SHALL mostrar el nivel, la experiencia y la misión actual con su título y una pista orientada al objetivo. La pista SHALL NOT nombrar el comando que resuelve la misión ni describir su sintaxis.

#### Scenario: Pista orientada al objetivo

- **WHEN** la misión actual es crear una carpeta
- **THEN** la pista describe la necesidad de un lugar donde guardar algo
- **AND** no contiene el texto `mkdir`

#### Scenario: Progreso visible

- **WHEN** el usuario completa una misión
- **THEN** el panel muestra la misión como completada y actualiza la experiencia
- **AND** la siguiente misión disponible pasa a mostrarse

### Requirement: Misiones legibles en el sistema virtual

Cada misión SHALL tener un archivo de encargo legible dentro del sistema de archivos virtual, de modo que el jugador pueda listarlo y leerlo con los comandos existentes.

#### Scenario: Listar encargos

- **WHEN** el usuario ejecuta `ls misiones` desde el directorio inicial
- **THEN** la salida enumera los archivos de encargo

#### Scenario: Leer un encargo

- **WHEN** el usuario ejecuta `cat misiones/<archivo>`
- **THEN** la salida muestra el texto del encargo
- **AND** el código de salida es `0`

### Requirement: Persistencia del progreso

El nivel, la experiencia y las misiones completadas SHALL persistir entre recargas mediante almacenamiento local versionado. Un dato ausente, corrupto o de una versión desconocida SHALL descartarse y reiniciar el progreso sin errores visibles.

#### Scenario: Conservar el progreso

- **WHEN** el usuario completa una misión y recarga la página
- **THEN** el nivel, la experiencia y la misión completada se conservan

#### Scenario: Dato corrupto

- **WHEN** el almacenamiento local contiene un valor que no es un progreso válido
- **THEN** la aplicación comienza en el nivel inicial
- **AND** no se muestra un error al usuario

#### Scenario: Mundo efímero

- **WHEN** el usuario recarga la página después de crear archivos
- **THEN** el sistema de archivos virtual vuelve a su contenido inicial
- **AND** el progreso de misiones se conserva

### Requirement: Hidratación determinista

El HTML inicial SHALL ser idéntico con independencia del progreso almacenado, y la lectura del almacenamiento local SHALL ocurrir solo en el cliente después del montaje.

#### Scenario: Servidor sin almacenamiento

- **WHEN** se solicita `GET /terminal`
- **THEN** el HTML contiene el nivel y la experiencia iniciales
- **AND** no depende de datos del navegador

#### Scenario: Sin errores de hidratación

- **WHEN** el navegador hidrata la página con progreso guardado
- **THEN** la consola no muestra advertencias de hidratación
- **AND** el panel refleja el progreso guardado después del montaje
