# Laboratorio de Creatividad

Sitio interno para compartir con el equipo: técnicas de ideación organizadas por las 4 fases del pensamiento creativo (Graham Wallas), más una selección de referencias inspiradoras.

## Cómo abrirlo

No requiere instalación ni servidor. Abre `index.html` directamente en el navegador (doble clic, o `open index.html` desde la terminal).

## Estructura

```
index.html              # página única: hero + fases + referencias
data/techniques.js       # contenido de las 4 fases y sus técnicas (window.PHASES)
data/references.js       # contenido del carrusel de referencias (window.REFERENCES)
styles/tokens.css         # paleta y tipografía de marca (DM Sans, cobalto, etc.)
styles/base.css           # reset y estilos base
styles/hero.css           # banner principal
styles/phases.css         # panel-row de fases (full-width) + selector aleatorio de técnicas
styles/references.css     # carrusel horizontal de referencias
styles/joy.css            # interacciones: notas con cinta, cursor, burbujas, paneles de fase
scripts/joy.js            # interacciones globales (magnetismo, cursor, burbujas físicas, revelado de títulos)
scripts/phases.js         # renderiza los 4 paneles de fases, la tragaperras de "probar al azar" y las notas
scripts/carousel.js       # carrusel infinito arrastrable con inercia
assets/*.jpg              # fotos de fondo de los 4 paneles de fases (ver abajo)
assets/tape-1.png, tape-2.png  # cinta azul recortada y plana que sujeta las notas (generada a partir de Tape1.png y Tape2.png)
```

## Interacciones

El sitio carga GSAP 3.13 (con Draggable, InertiaPlugin, SplitText y ScrollTrigger) y canvas-confetti desde jsDelivr. Si el CDN no está disponible, todo degrada a la versión estática: el carrusel vuelve a scroll nativo, el dado muestra el resultado al instante y los titulares aparecen sin animación.

- **Hero:** las tres burbujas se pueden agarrar y lanzar; rebotan en los bordes y vuelven a su sitio. Se funden entre sí con un filtro SVG (`#goo`).
- **Titulares:** el H1 y los H2 se revelan palabra a palabra, una sola vez.
- **Paneles de fase ("cuarto oscuro"):** en reposo las fotos están en duotono cobalto. El cursor funciona como una lámpara que revela la foto real dentro de un círculo que cruza de un panel a otro y crece con la velocidad. Los anchos siguen al cursor de forma continua, sin saltos. Al elegir una fase, la luz se expande desde el clic hasta iluminar todo el panel. Al entrar en pantalla, los paneles suben uno a uno y se enciende la fase activa. También: etiqueta "Elegir →", barra activa que se desliza y flechas del teclado.
- **Tirar el dado:** cada fase muestra una sola técnica a la vez. El dado gira, los nombres pasan por un rodillo de tragaperras y la técnica elegida cae como una nota con cinta, con confeti. Nunca repite la misma dos veces seguidas.
- **Ver todas:** el enlace "Ver las N técnicas" despliega todas las notas a la vez, marcando la que te tocó con "Tu técnica". "Volver a una técnica" regresa a la vista individual.
- **Técnicas:** cada nota cuelga ligeramente torcida con un trozo de cinta pequeño sobre el borde superior; al pasar el ratón se endereza.
- **Referencias:** arrastra la tira (con inercia y bucle infinito); las tarjetas se inclinan en la dirección del movimiento.
- **Magnetismo:** el botón principal, el dado y las flechas del carrusel se acercan al cursor.

Con `prefers-reduced-motion` activo se desactivan la física, los revelados y las transiciones; el contenido se muestra igual.

## Editar contenido

- Para agregar o cambiar técnicas, edita `data/techniques.js`.
- Para agregar o cambiar referencias, edita `data/references.js`.
- Los colores y tipografía salen de `styles/tokens.css` (paleta de marca AZ: cloud white, sky blue, deep cobalt, soft gray, ink black; DM Sans).

## Nota sobre las referencias

Las tarjetas usan fotos reales alojadas en Wikimedia Commons bajo licencias Creative Commons (CC BY), con crédito visible en cada tarjeta (`credit` en `data/references.js`). Cuando no existe una foto libre de la pieza exacta (documental/entrevista), se usa una foto de la persona protagonista (autor/a) en su lugar; esto está indicado en el campo `credit` de esa entrada. Si sumas nuevas referencias, verifica que la imagen tenga una licencia reutilizable y añade el crédito correspondiente.

## Imágenes de los paneles de fases

Cada uno de los 4 paneles de `#fases` usa una foto de fondo propia, en este orden fijo:

```
assets/preparacion.jpg
assets/incubacion.jpg
assets/iluminacion.jpg
assets/implementacion.jpg
```

Si falta alguno de estos archivos, ese panel cae automáticamente a un degradado de marca en su lugar.
