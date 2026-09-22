window.PHASES = [
  {
    id: 'preparacion',
    index: '01',
    name: 'Preparación',
    description: 'Reunir información, entender el problema y explorarlo desde todos los ángulos antes de generar ideas.',
    techniques: [
      {
        name: 'Mapa de empatía',
        source: 'Stanford d.school',
        description: 'Pon en el centro a la persona para la que estás diseñando y explora qué piensa, siente, ve, dice y hace.',
        exercise: 'Dibuja un mapa de empatía en 4 cuadrantes (piensa/siente, ve, dice/hace, oye) para tu usuario o interlocutor principal.',
        duration: '15 min',
        link: 'https://www.nngroup.com/articles/empathy-mapping/'
      },
      {
        name: '5 Porqués',
        source: 'Toyota / IDEO',
        description: 'Pregunta "¿por qué?" cinco veces seguidas para llegar de un síntoma a la causa raíz de un problema.',
        exercise: 'Elige un problema que quieras resolver y pregúntate "¿por qué?" cinco veces, anotando cada respuesta.',
        duration: '10 min',
        link: 'https://en.wikipedia.org/wiki/Five_whys'
      },
      {
        name: '"¿Cómo podríamos...?"',
        source: 'IDEO / d.school',
        description: 'Reformula el problema como una pregunta abierta que invite a explorar soluciones, no una sola respuesta.',
        exercise: 'Convierte tu problema en 3 preguntas que empiecen con "¿Cómo podríamos...?" y elige la que más te inspire.',
        duration: '10 min',
        link: 'https://designthinking.ideo.com/'
      },
      {
        name: 'Investigación divergente / mood board',
        source: 'Práctica habitual en agencias creativas',
        description: 'Recopila referencias visuales, textos y ejemplos dispares antes de definir una dirección.',
        exercise: 'Junta 10 referencias (imágenes, frases, productos) que te resuenen con el tema, sin filtrar todavía.',
        duration: '20 min',
        link: 'https://www.interaction-design.org/literature/topics/mood-board'
      },
      {
        name: 'Reformulación con SCAMPER',
        source: 'Bob Eberle, basado en Alex Osborn',
        description: 'Usa los verbos de SCAMPER (Sustituir, Combinar, Adaptar, Modificar, Proponer otros usos, Eliminar, Reordenar) para mirar el problema desde otro ángulo.',
        exercise: 'Toma tu problema y aplica 2 verbos de SCAMPER para reformularlo de una manera distinta.',
        duration: '15 min',
        link: 'https://www.interaction-design.org/literature/article/scamper'
      },
    ],
  },
  {
    id: 'incubacion',
    index: '02',
    name: 'Incubación',
    description: 'Dejar reposar el problema para que la mente inconsciente conecte ideas sin presión ni foco directo.',
    techniques: [
      {
        name: 'Paseo creativo',
        source: 'Hábito documentado de Steve Jobs y muchos diseñadores',
        description: 'Caminar sin pantallas ayuda a que la mente divague y conecte ideas de forma no lineal.',
        exercise: 'Sal a caminar 15 minutos sin el móvil, pensando apenas en el problema, dejando que la mente vague.',
        duration: '15 min',
        link: 'https://www.nature.com/articles/s41598-020-64822-1'
      },
      {
        name: 'Regla de la distancia',
        source: 'Práctica clásica de incubación creativa',
        description: 'Aléjate del problema al menos un día antes de evaluarlo o decidir; la distancia mejora el juicio.',
        exercise: 'Guarda tu boceto o idea y no lo mires hasta mañana. Anota qué cambia tu percepción al volver a verlo.',
        duration: '1 día',
        link: 'https://www.psychologytoday.com/us/basics/incubation'
      },
      {
        name: 'Morning pages',
        source: 'Julia Cameron, "El camino del artista"',
        description: 'Escritura libre de tres páginas a mano nada más despertarte, sin editar ni corregir.',
        exercise: 'Escribe 3 páginas a mano sin parar ni corregir, nada más levantarte, dejando salir lo que aparezca.',
        duration: '20 min',
        link: 'https://juliacameronlive.com/basic-tools/morning-pages/'
      },
      {
        name: 'Cambio de contexto',
        source: 'Práctica habitual en estudios de diseño',
        description: 'Hacer algo completamente distinto (cocinar, dibujar, hacer deporte) libera la mente del foco directo.',
        exercise: 'Dedica 20 minutos a una actividad manual que no tenga nada que ver con tu problema.',
        duration: '20 min',
        link: 'https://www.psychologytoday.com/us/blog/the-athletes-way/201709/how-changing-your-environment-can-improve-creativity'
      },
      {
        name: 'Dormir sobre el problema',
        source: 'Investigación sobre incubación y sueño',
        description: 'El sueño consolida conexiones y suele producir asociaciones nuevas al despertar.',
        exercise: 'Anota tu problema antes de dormir y, al despertar, escribe lo primero que se te ocurra al respecto.',
        duration: '1 noche',
        link: 'https://www.sleepfoundation.org/sleep-habits/creative-sleep'
      },
    ],
  },
  {
    id: 'iluminacion',
    index: '03',
    name: 'Iluminación',
    description: 'El momento en que las ideas emergen: generar la mayor cantidad y variedad posible de opciones.',
    techniques: [
      {
        name: 'Brainstorming clásico',
        source: 'Alex Osborn',
        description: 'Generación grupal de ideas sin juzgar, priorizando cantidad sobre calidad en una primera ronda.',
        exercise: 'Dedica 10 minutos a anotar todas las ideas posibles para tu problema, sin descartar ninguna.',
        duration: '10 min',
        link: 'https://www.ideou.com/blogs/inspiration/brainstorming'
      },
      {
        name: 'Brainwriting 6-3-5',
        source: 'Bernd Rohrbach',
        description: '6 personas escriben 3 ideas cada una en 5 minutos y se las pasan a la siguiente para construir sobre ellas.',
        exercise: 'Escribe 3 ideas en 5 minutos, luego toma las ideas de otra persona y suma una variación a cada una.',
        duration: '25 min',
        link: 'https://www.ideou.com/blogs/inspiration/brainwriting-6-3-5'
      },
      {
        name: 'Seis Sombreros para Pensar',
        source: 'Edward de Bono',
        description: 'Analizar una idea desde 6 perspectivas distintas (datos, emoción, riesgos, beneficios, creatividad, proceso).',
        exercise: 'Toma una idea y evalúala desde 3 "sombreros": el de los datos, el de las emociones y el de los riesgos.',
        duration: '15 min',
        link: 'https://www.debonogroup.com/services/core-programmes/six-thinking-hats/'
      },
      {
        name: 'SCAMPER generativo',
        source: 'Bob Eberle, basado en Alex Osborn',
        description: 'Usar los verbos de SCAMPER para crear variaciones nuevas a partir de una idea existente.',
        exercise: 'Toma tu mejor idea y genera 3 variaciones aplicando "Combinar", "Adaptar" y "Reordenar".',
        duration: '15 min',
        link: 'https://www.interaction-design.org/literature/article/scamper'
      },
      {
        name: '"La peor idea posible"',
        source: 'Técnica habitual en agencias creativas',
        description: 'Generar deliberadamente ideas malas o absurdas para bajar la autocrítica y destrabar ideas mejores.',
        exercise: 'Anota 5 ideas terribles a propósito para tu problema; después revisa si alguna esconde algo aprovechable.',
        duration: '10 min',
        link: 'https://www.designkit.org/methods/65'
      },
    ],
  },
  {
    id: 'implementacion',
    index: '04',
    name: 'Implementación',
    description: 'Prototipar, probar y refinar la idea hasta convertirla en algo real y funcional.',
    techniques: [
      {
        name: 'Design Sprint / prototipado rápido',
        source: 'Google Ventures',
        description: 'Construir un prototipo simple y testeable en poco tiempo, priorizando aprender rápido sobre pulir.',
        exercise: 'Haz un prototipo básico (papel, boceto o mockup) de tu idea en 30 minutos, sin pulir detalles.',
        duration: '30 min',
        link: 'https://www.gv.com/sprint/'
      },
      {
        name: 'Storyboarding',
        source: 'Técnica clásica de estudios de animación (Disney/Pixar)',
        description: 'Contar la idea como una secuencia de viñetas para detectar huecos narrativos o de experiencia.',
        exercise: 'Dibuja 4 a 6 viñetas simples que muestren cómo alguien usaría o viviría tu idea de principio a fin.',
        duration: '20 min',
        link: 'https://www.nngroup.com/articles/storyboarding/'
      },
      {
        name: 'MVP (producto mínimo viable)',
        source: 'Eric Ries, "The Lean Startup"',
        description: 'Definir la versión más simple de la idea que permita aprender algo real de la gente.',
        exercise: 'Escribe qué es lo mínimo que necesitas construir o mostrar para saber si tu idea funciona.',
        duration: '15 min',
        link: 'https://www.startuplessonslearned.com/2009/08/minimum-viable-product-guide.html'
      },
      {
        name: 'Crítica de diseño',
        source: 'Pixar Braintrust',
        description: 'Mostrar el trabajo en progreso a otros para recibir feedback honesto centrado en el problema, no en la persona.',
        exercise: 'Comparte tu prototipo con un compañero y pídele 3 críticas concretas: qué no entiende, qué le falta, qué sobra.',
        duration: '20 min',
        link: 'https://www.pixar.com/our-story/braintrust'
      },
      {
        name: 'Iteración con test de usuario',
        source: 'Práctica estándar de investigación UX',
        description: 'Observar a alguien real usando tu idea revela problemas que uno mismo no puede ver.',
        exercise: 'Pide a una persona que use tu prototipo mientras piensa en voz alta y anota dónde se atasca.',
        duration: '20 min',
        link: 'https://www.nngroup.com/articles/usability-testing-101/'
      },
    ],
  },
];
