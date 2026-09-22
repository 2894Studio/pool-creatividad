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
scripts/phases.js         # renderiza los 4 paneles de fases y la lógica de "probar al azar"
scripts/carousel.js       # renderiza el carrusel y su navegación
assets/phases/            # fotos de fondo de los 4 paneles de fases (ver abajo)
```

## Editar contenido

- Para agregar o cambiar técnicas, edita `data/techniques.js`.
- Para agregar o cambiar referencias, edita `data/references.js`.
- Los colores y tipografía salen de `styles/tokens.css` (paleta de marca AZ: cloud white, sky blue, deep cobalt, soft gray, ink black; DM Sans).

## Nota sobre las referencias

Las tarjetas usan fotos reales alojadas en Wikimedia Commons bajo licencias Creative Commons (CC BY), con crédito visible en cada tarjeta (`credit` en `data/references.js`). Cuando no existe una foto libre de la pieza exacta (documental/entrevista), se usa una foto de la persona protagonista (autor/a) en su lugar; esto está indicado en el campo `credit` de esa entrada. Si sumas nuevas referencias, verifica que la imagen tenga una licencia reutilizable y añade el crédito correspondiente.

## Imágenes de los paneles de fases

Cada uno de los 4 paneles de `#fases` usa una foto de fondo propia, en este orden fijo:

```
assets/phases/preparacion.jpg
assets/phases/incubacion.jpg
assets/phases/iluminacion.jpg
assets/phases/implementacion.jpg
```

Si falta alguno de estos archivos, ese panel cae automáticamente a un degradado de marca en su lugar.
