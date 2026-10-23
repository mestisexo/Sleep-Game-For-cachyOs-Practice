# Spec Delta

## Purpose

Presenta un personaje pixelado en cuatro posturas y permite cambiarlas mediante un control de selección, manteniendo continuidad visual y comportamiento reversible en cualquier dirección.

## ADDED Requirements

### Requirement: Cuatro posturas distintas

El sistema SHALL mostrar el personaje en exactamente cuatro posturas identificadas como `de-pie`, `semi-de-pie`, `semi-acostado` y `acostado`, cada una con una silueta claramente distinguible de las demás.

#### Scenario: Estado inicial

- **WHEN** un usuario abre la página del personaje
- **THEN** el personaje se muestra en la postura `de-pie`
- **AND** el control de selección marca `de-pie` como la opción activa

#### Scenario: Las cuatro posturas son alcanzables

- **WHEN** el usuario recorre las cuatro opciones del control de selección
- **THEN** el personaje muestra una silueta distinta para cada una de las cuatro posturas
- **AND** ninguna postura se repite visualmente con otra

### Requirement: Control de selección

El sistema SHALL ofrecer un control visible con una opción por postura, SHALL indicar cuál está activa y SHALL cambiar la postura mostrada al seleccionar otra opción.

#### Scenario: Selección directa

- **WHEN** el usuario selecciona una opción distinta de la activa
- **THEN** el personaje pasa a la postura correspondiente
- **AND** el control marca esa opción como activa
- **AND** la opción anterior deja de estar marcada

#### Scenario: Selección de la opción ya activa

- **WHEN** el usuario selecciona la opción que ya está activa
- **THEN** el personaje permanece en esa postura sin reiniciar la animación ni parpadear

#### Scenario: Etiquetas legibles

- **WHEN** el control de selección se muestra en pantalla
- **THEN** cada opción tiene una etiqueta en español que nombra su postura
- **AND** la opción activa es distinguible sin depender únicamente del color

### Requirement: Transición fluida y reversible

El sistema SHALL animar cada cambio de postura durante un intervalo perceptible y acotado, sin recargar la página, sin saltos de layout y sin dejar la animación a medias.

#### Scenario: Transición entre posturas contiguas

- **WHEN** el usuario cambia de `de-pie` a `semi-de-pie`
- **THEN** la postura anterior se desvanece mientras la nueva aparece
- **AND** la transición dura entre 200 y 600 ms
- **AND** el contenedor del personaje conserva su tamaño y posición

#### Scenario: Salto entre posturas no contiguas

- **WHEN** el usuario cambia de `de-pie` a `acostado`
- **THEN** el personaje pasa por `semi-de-pie` y `semi-acostado` antes de llegar a `acostado`
- **AND** la secuencia respeta el orden de las posturas, sin saltarse ninguna

#### Scenario: Transición en sentido inverso

- **WHEN** el usuario cambia de `acostado` a `de-pie`
- **THEN** el personaje recorre las posturas intermedias en orden inverso
- **AND** el resultado final es la postura `de-pie`

#### Scenario: Cambios rápidos y repetidos

- **WHEN** el usuario selecciona varias posturas en rápida sucesión
- **THEN** el personaje termina en la última postura seleccionada
- **AND** no queda ninguna animación en curso ni una postura intermedia visible al detenerse

### Requirement: Sin parpadeo al cambiar de postura

El sistema SHALL evitar frames en blanco, imágenes sin cargar y cambios de tamaño durante los cambios de postura.

#### Scenario: Primera transición tras cargar la página

- **WHEN** el usuario cambia de postura por primera vez después de abrir la página
- **THEN** no aparece un frame vacío ni un salto de tamaño
- **AND** las cuatro imágenes ya están disponibles antes de que el usuario interactúe

#### Scenario: Sprites de igual tamaño

- **WHEN** el sistema alterna entre dos posturas cualesquiera
- **THEN** el área ocupada por el personaje no cambia de ancho ni de alto

### Requirement: Accesibilidad del control y del movimiento

El sistema SHALL permitir operar el control con teclado, SHALL anunciar la postura activa a tecnologías de asistencia y SHALL respetar la preferencia de movimiento reducido.

#### Scenario: Operación con teclado

- **WHEN** el usuario navega el control con Tab y las flechas
- **THEN** puede enfocar cada opción
- **AND** puede activar la opción enfocada con Enter o Espacio

#### Scenario: Movimiento reducido

- **WHEN** el sistema operativo declara `prefers-reduced-motion: reduce`
- **THEN** el cambio de postura se aplica sin secuencia intermedia
- **AND** la duración de la transición no supera 100 ms

#### Scenario: Anuncio del estado

- **WHEN** un lector de pantalla consulta el control
- **THEN** identifica el grupo de opciones y cuál está seleccionada

### Requirement: Assets reemplazables

El sistema SHALL cargar las cuatro posturas desde archivos con nombres fijos y dimensiones homogéneas, de forma que sustituir el arte no requiera cambios de código.

#### Scenario: Sustitución de un sprite

- **WHEN** se reemplaza el archivo de una postura por otro de igual nombre y dimensiones
- **THEN** la página muestra el nuevo arte en esa postura sin modificar componentes ni configuración

#### Scenario: Renderizado nítido

- **WHEN** el personaje se muestra a un tamaño mayor que su resolución nativa
- **THEN** los píxeles se ven como bloques definidos y no se suavizan ni se interpolan
