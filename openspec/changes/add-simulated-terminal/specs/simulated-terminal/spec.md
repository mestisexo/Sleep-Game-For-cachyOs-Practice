# Spec Delta

## Purpose

Permite al jugador operar una terminal Linux simulada cuyos aciertos y errores se reflejan en la postura del personaje, sin ejecutar nada del sistema real.

## ADDED Requirements

### Requirement: Simulación aislada del sistema

La terminal SHALL interpretar cada comando exclusivamente contra un sistema de archivos virtual en memoria y SHALL NOT ejecutar procesos, leer archivos reales, acceder a la red ni invocar APIs del sistema operativo.

#### Scenario: Eliminar un archivo virtual

- **WHEN** el usuario ejecuta `rm notas.txt` sobre un archivo del sistema virtual
- **THEN** la entrada desaparece del sistema virtual
- **AND** ningún archivo fuera de la aplicación se modifica

#### Scenario: Sin tráfico de red por comando

- **WHEN** el usuario ejecuta cualquier comando
- **THEN** la ejecución del comando no realiza peticiones de red

### Requirement: Entrada tratada como datos

Los operadores de shell (`|`, `>`, `;`, `&&`, `$()` y comillas invertidas) SHALL tratarse como texto literal de los argumentos y nunca como código ejecutable.

#### Scenario: Sustitución de comando literal

- **WHEN** el usuario ejecuta `echo "$(whoami)"`
- **THEN** la salida contiene el texto `$(whoami)`
- **AND** no se ejecuta el comando `whoami`

#### Scenario: Tubería literal

- **WHEN** el usuario ejecuta `echo "hola | rm"` entre comillas dobles
- **THEN** la salida contiene `hola | rm`
- **AND** no se elimina ningún archivo

### Requirement: Contrato de ejecución

Cada línea enviada SHALL producir una salida con `stdout`, `stderr` y un código de salida entero; los resultados normales SHALL ir a `stdout` y los errores a `stderr`.

#### Scenario: Comando correcto

- **WHEN** el usuario envía un comando válido que puede completarse
- **THEN** la salida normal se muestra en la pantalla
- **AND** el código de salida es `0`

#### Scenario: Comando con error

- **WHEN** el usuario envía un comando válido que no puede completarse
- **THEN** el mensaje de error se muestra en la pantalla
- **AND** el código de salida es distinto de `0`

### Requirement: Comandos disponibles

La terminal SHALL reconocer `help`, `clear`, `pwd`, `cd`, `ls`, `cat`, `echo`, `mkdir`, `touch`, `rm`, `rmdir` y `whoami`; cualquier otro nombre SHALL responder con un error de comando no encontrado y código `127`.

#### Scenario: Ayuda

- **WHEN** el usuario ejecuta `help`
- **THEN** la salida enumera los comandos disponibles con una descripción breve
- **AND** el código de salida es `0`

#### Scenario: Comando desconocido

- **WHEN** el usuario ejecuta `git status`
- **THEN** la salida indica que `git` no se encontró
- **AND** el código de salida es `127`

#### Scenario: Identidad simulada

- **WHEN** el usuario ejecuta `whoami`
- **THEN** la salida muestra el usuario simulado de la sesión
- **AND** el código de salida es `0`

### Requirement: Sistema de archivos virtual

La terminal SHALL mantener un árbol virtual de directorios y archivos, resolver rutas absolutas y relativas incluyendo `.` y `..`, y comenzar cada carga en `/home/guest`.

#### Scenario: Listar el directorio inicial

- **WHEN** el usuario ejecuta `ls` sin argumentos al abrir la página
- **THEN** la salida enumera el contenido de `/home/guest`

#### Scenario: Cambiar de directorio

- **WHEN** el usuario ejecuta `cd sueno` y después `pwd`
- **THEN** `pwd` muestra `/home/guest/sueno`
- **AND** ambos comandos devuelven código `0`

#### Scenario: Reinicio de sesión

- **WHEN** el usuario recarga la página después de modificar el sistema virtual
- **THEN** el sistema vuelve a su contenido inicial
- **AND** el directorio actual vuelve a ser `/home/guest`

### Requirement: Errores del sistema de archivos

Los comandos SHALL fallar con un código distinto de cero y un mensaje en `stderr` cuando la ruta no existe, no es un directorio, es un directorio, ya existe o el directorio no está vacío.

#### Scenario: Ruta inexistente

- **WHEN** el usuario ejecuta `cat /noexiste.txt`
- **THEN** la salida informa que el archivo no existe
- **AND** el código de salida es distinto de `0`

#### Scenario: Directorio en lugar de archivo

- **WHEN** el usuario ejecuta `cat sueno`
- **THEN** la salida informa que es un directorio
- **AND** el código de salida es distinto de `0`

#### Scenario: Directorio no vacío

- **WHEN** el usuario ejecuta `rmdir sueno` sobre un directorio con contenido
- **THEN** la salida informa que el directorio no está vacío
- **AND** el código de salida es distinto de `0`

### Requirement: Postura ligada al resultado

La página SHALL mostrar al personaje en `de-pie` tras un comando con código `0` y en `acostado` tras un comando con código distinto de `0`; las posturas `semi-de-pie` y `semi-acostado` SHALL ser únicamente pasos transicionales.

#### Scenario: Acierto estando de pie

- **WHEN** el usuario ejecuta un comando correcto estando el personaje en `de-pie`
- **THEN** el personaje permanece en `de-pie`

#### Scenario: Error

- **WHEN** el usuario ejecuta un comando con código distinto de `0`
- **THEN** el personaje termina en `acostado`
- **AND** la transición recorre las posturas intermedias

#### Scenario: Acierto estando acostado

- **WHEN** el usuario ejecuta un comando correcto con el personaje en `acostado`
- **THEN** el personaje termina en `de-pie`
- **AND** la transición recorre las posturas intermedias

#### Scenario: Posturas intermedias no persistentes

- **WHEN** termina cualquier transición
- **THEN** el personaje está en `de-pie` o en `acostado`
- **AND** no queda detenido en una postura `semi-*`

### Requirement: Entrada vacía

Enviar una línea vacía o compuesta solo por espacios SHALL NOT ejecutar ningún comando ni alterar la postura, y SHALL añadir una nueva línea de prompt.

#### Scenario: Enter sin texto

- **WHEN** el usuario pulsa Enter con el campo de entrada vacío
- **THEN** no se añade salida de comando
- **AND** la postura no cambia
- **AND** aparece un nuevo prompt

### Requirement: Historial de comandos

Las flechas arriba y abajo SHALL recorrer los comandos no vacíos enviados en la sesión, sin ejecutarlos hasta que el usuario pulse Enter.

#### Scenario: Recuperar el comando anterior

- **WHEN** el usuario pulsa la flecha arriba después de enviar `pwd`
- **THEN** el campo de entrada muestra `pwd`
- **AND** no se ejecuta hasta pulsar Enter

#### Scenario: Volver al borrador

- **WHEN** el usuario recorre el historial hacia abajo hasta el final
- **THEN** el campo de entrada queda vacío

### Requirement: Limpieza de pantalla

El comando `clear` SHALL vaciar la pantalla, dejar un nuevo prompt y devolver código `0`.

#### Scenario: Limpiar la terminal

- **WHEN** el usuario ejecuta `clear` después de varios comandos
- **THEN** desaparecen las líneas anteriores
- **AND** queda un prompt nuevo
- **AND** el personaje permanece o vuelve a `de-pie`

### Requirement: Scroll acotado

La terminal SHALL conservar como máximo 500 líneas y SHALL desplazarse al final después de cada salida.

#### Scenario: Salida larga

- **WHEN** la terminal supera las 500 líneas
- **THEN** las líneas más antiguas dejan de mostrarse
- **AND** el número de líneas visibles no supera 500

#### Scenario: Nueva salida

- **WHEN** se añade una línea de salida
- **THEN** la vista se desplaza hasta la última línea

### Requirement: Accesibilidad de la terminal

El área de salida SHALL exponerse como registro accesible que anuncia las líneas nuevas, y el campo de entrada SHALL tener etiqueta accesible y foco visible.

#### Scenario: Anuncio de salida

- **WHEN** un comando produce una línea nueva
- **THEN** la región de salida la anuncia a tecnologías de asistencia
- **AND** no vuelve a anunciar todo el historial

#### Scenario: Operación con teclado

- **WHEN** el usuario navega con Tab hasta el campo de entrada
- **THEN** el foco se ve claramente
- **AND** puede escribir y enviar el comando sin usar el ratón

### Requirement: Renderizado en servidor

`GET /terminal` SHALL responder `200` con el texto de arranque y el prompt en el HTML inicial, sin fechas ni valores aleatorios que provoquen diferencias de hidratación.

#### Scenario: Carga directa de la ruta

- **WHEN** se solicita `GET /terminal`
- **THEN** la respuesta es `200` y contiene el texto de arranque
- **AND** el HTML inicial es determinista entre solicitudes

### Requirement: Página con terminal y personaje

La página SHALL mostrar la terminal y el personaje de forma simultánea, con el personaje iniciando en `de-pie`, y SHALL mantener el área del personaje sin cambios de tamaño al alternar posturas.

#### Scenario: Estado inicial de la página

- **WHEN** el usuario abre `/terminal`
- **THEN** ve la terminal y el personaje en `de-pie`
- **AND** el selector de posturas de `/personaje` no se muestra

#### Scenario: Sin saltos de tamaño

- **WHEN** el personaje cambia entre `de-pie` y `acostado`
- **THEN** el área que ocupa no cambia de ancho ni de alto
