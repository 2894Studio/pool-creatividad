# Laboratorio de Creatividad

Sitio interno para compartir con el equipo: técnicas de ideación organizadas por las 4 fases del pensamiento creativo (Graham Wallas), más una selección de referencias inspiradoras.

## Cómo abrirlo

No requiere instalación ni servidor. Abre `index.html` directamente en el navegador (doble clic, o `open index.html` desde la terminal).

## Estructura

```
index.html              # 7 escenas: inicio → 4 fases → referencias → reto
data/techniques.js       # contenido de las 4 fases y sus técnicas (window.PHASES), con el pictograma y su pie
data/references.js       # contenido de la estantería de referencias (window.REFERENCES)
data/challenges.js       # condiciones del reto final ("en 5 minutos", "sin usar palabras"…)
styles/tokens.css         # paleta y tipografía de marca (DM Sans, cobalto, etc.)
styles/base.css           # reset, botones "blanditos", selección
styles/journey.css        # escenas a pantalla completa, camino de fases, tema por escena
styles/hero.css           # inicio: gotas líquidas de fondo, bloques del titular
styles/phases.css         # escenas de fase: rejilla de 5 columnas, tarjetas de técnica y ficha de detalle
styles/references.css     # estantería de referencias (inclinación 3D, brillo)
styles/joy.css            # piezas compartidas: dado 3D, notas con cinta, rodillo, reto, destellos
scripts/sound.js          # sonidos sintetizados (Web Audio) y vibración en móvil
scripts/hover-text.js     # HoverText: letras que se estampan, inclinan y suenan bajo el puntero (CONFIG arriba)
scripts/joy.js            # magnetismo, cursor, gotas de fondo, titulares, dado 3D, destellos, "eureka"
scripts/liquid.js         # gotas líquidas (metaballs) en WebGL para el fondo del inicio
scripts/dot-art.js        # pictogramas de trama de puntos, uno por técnica
scripts/journey.js        # motor del recorrido: transiciones, rueda/gestos/teclado, #hash por escena
scripts/picker.js         # dado → rodillo → nota con cinta (lo usa el reto final)
scripts/phases.js         # construye las 4 escenas de fase: tarjetas, dado-ruleta y ficha de detalle
scripts/carousel.js       # estantería infinita arrastrable + "Sorpréndeme"
scripts/reto.js           # escena final "Dame un reto"
assets/tape-1.png, tape-2.png  # cinta azul que sujeta las notas
```

## Interacciones

El sitio carga GSAP 3.13 (con Draggable, InertiaPlugin y SplitText) y canvas-confetti desde jsDelivr. Si el CDN no está disponible, todo degrada: el recorrido cambia de escena sin animación, el carrusel vuelve a scroll nativo y el dado muestra el resultado al instante. Sin JavaScript, las escenas se apilan como una página normal.

### El recorrido
El sitio no se "scrollea": se avanza escena a escena, como se avanza por las fases del proceso creativo.
Inicio → 01 Preparación → 02 Incubación → 03 Iluminación → 04 Implementación → Referencias → Reto.

- Se avanza con la rueda o el trackpad, deslizando en el móvil, con las flechas / AvPág / espacio / Inicio / Fin, con los botones "Siguiente fase" o con el camino de puntos de abajo.
- Si una escena es más alta que la pantalla, primero se desplaza por dentro y después pasa a la siguiente.
- Cada escena tiene su dirección (`#incubacion`, `#reto`…), así que se puede enlazar directamente y el botón "atrás" funciona.
- Una línea fina arriba marca el progreso del recorrido. El logo se encoge fuera del inicio.

### Lenguaje visual
Todas las escenas comparten el diseño del inicio: fondo claro, DM Sans, cobalto y cielo, y los mismos círculos difuminados como único elemento decorativo. La personalidad de cada fase está en el movimiento, no en la decoración.

### Inicio: "Combina ideas"
- Los círculos difuminados del inicio llevan palabras. Arrastra uno sobre otro: se juntan, estallan y aparece una pregunta que mezcla las dos ideas. Salen palabras nuevas.
- "Combinar al azar" hace lo mismo sin arrastrar (teclado y táctil).
- "CREA SIN BLOQUEOS" aparece tapado por bloques que se agrietan y caen; haz clic para volver a romperlos.
- El titular reacciona al puntero letra a letra (`scripts/hover-text.js`, portado del portfolio): las letras cercanas en la misma línea se estampan en stop-motion, se quedan inclinadas con un contorno fino que tiembla y vuelven cuando el puntero pasa. Cada letra toca una nota de piano (Si pentatónica) y un lecho grave suena mientras el puntero está encima. Todos los números están en `CONFIG`, al principio del archivo.

### Las 4 fases, cada una con su movimiento
En todas: tira el dado (dado 3D → rodillo de tragaperras → nota con cinta y confeti) o "Ver las 5 técnicas".
- **Preparación:** los círculos y el texto llegan dispersos y se reúnen; se apartan suavemente del cursor.
- **Incubación:** todo va más lento: los círculos derivan despacio, el texto aparece desenfocado, el rodillo gira más lento y las notas "respiran".
- **Iluminación:** un círculo parpadea y se enciende detrás del título, y sigue al cursor como una lámpara.
- **Implementación:** tres círculos iguales encajan en fila "a golpes"; las notas no se inclinan y bajo la nota aparece una cota con la duración de la técnica.

### Referencias
Estantería arrastrable con inercia y bucle infinito. Las tarjetas se inclinan en 3D hacia el cursor con un brillo encima. "Sorpréndeme" hace girar la estantería hasta caer en una al azar.

### Dame un reto
El final: dos rodillos eligen una técnica de cualquier fase + una condición inesperada. "Ver su fase" lleva a la fase de esa técnica.

### Detalles
- Sonido (botón arriba a la derecha; encendido por defecto, si lo apagas se recuerda en este navegador). Un solo interruptor para todo, incluido el piano del titular. Todo sintetizado, sin archivos de audio; los navegadores lo desbloquean con el primer clic o tecla.
- Vibración corta en móviles compatibles al tirar el dado o combinar ideas.
- Destellos al hacer clic, botones que se aplastan al pulsarlos, etiquetas de cursor según el contexto.
- Huevo de pascua: escribe **eureka** en cualquier parte.

Con `prefers-reduced-motion` activo, las escenas cambian sin animación y se desactivan la física, las partículas y el confeti; el contenido es el mismo.

## Probarlo en local

Abre `index.html` directamente, o sirve la carpeta (por ejemplo `python3 -m http.server 8000 --directory "Creativity-site 2"` desde la raíz del repo) y ve a `http://localhost:8000`.

## Editar contenido

- Para agregar o cambiar técnicas, edita `data/techniques.js`.
- Para agregar o cambiar referencias, edita `data/references.js`.
- Cada técnica tiene `art` (qué pictograma dibuja, definido en `scripts/dot-art.js`) y `artCaption` (el pie que lo explica).
- Para cambiar las condiciones del reto final, edita `data/challenges.js`.
- Los colores y tipografía salen de `styles/tokens.css` (paleta de marca AZ: cloud white, sky blue, deep cobalt, soft gray, ink black; DM Sans).

## Nota sobre las referencias

Las tarjetas usan fotos reales alojadas en Wikimedia Commons bajo licencias Creative Commons (CC BY), con crédito visible en cada tarjeta (`credit` en `data/references.js`). Cuando no existe una foto libre de la pieza exacta (documental/entrevista), se usa una foto de la persona protagonista (autor/a) en su lugar; esto está indicado en el campo `credit` de esa entrada. Si sumas nuevas referencias, verifica que la imagen tenga una licencia reutilizable y añade el crédito correspondiente.

## Imágenes de las fases

Las fotos `assets/preparacion.jpg`, `incubacion.jpg`, `iluminacion.jpg` e `implementacion.jpg` eran el fondo de los antiguos paneles de fase y ya no se usan. Se conservan por si se quieren recuperar.
