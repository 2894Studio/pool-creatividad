window.PHASES = [
  {
    id: 'preparacion',
    index: '01',
    name: 'Preparación',
    description: 'Reunir información, entender el problema y explorarlo desde todos los ángulos antes de generar ideas.',
    techniques: [
      {
        name: 'Mapa de empatía',
        art: 'empathy',
        artCaption: 'La persona en el centro y sus cuatro cuadrantes: qué piensa y siente, qué ve, qué dice y hace, qué oye.',
        source: 'Stanford d.school',
        description: 'Pon en el centro a la persona para la que estás diseñando y explora qué piensa, siente, ve, dice y hace.',
        exercise: 'Dibuja un mapa de empatía en 4 cuadrantes (piensa/siente, ve, dice/hace, oye) para tu usuario o interlocutor principal.',
        duration: '15 min',
        link: 'https://www.nngroup.com/articles/empathy-mapping/'
      },
      {
        name: '5 Porqués',
        art: 'whys',
        artCaption: 'Cinco preguntas encadenadas bajan del síntoma (arriba) a la causa raíz (abajo).',
        source: 'Toyota / IDEO',
        description: 'Pregunta "¿por qué?" cinco veces seguidas para llegar de un síntoma a la causa raíz de un problema.',
        exercise: 'Elige un problema que quieras resolver y pregúntate "¿por qué?" cinco veces, anotando cada respuesta.',
        duration: '10 min',
        link: 'https://en.wikipedia.org/wiki/Five_whys'
      },
      {
        name: '"¿Cómo podríamos...?"',
        art: 'hmw',
        artCaption: 'Un problema cerrado se abre en tres preguntas; te quedas con la que más inspira.',
        source: 'IDEO / d.school',
        description: 'Reformula el problema como una pregunta abierta que invite a explorar soluciones, no una sola respuesta.',
        exercise: 'Convierte tu problema en 3 preguntas que empiecen con "¿Cómo podríamos...?" y elige la que más te inspire.',
        duration: '10 min',
        link: 'https://designthinking.ideo.com/'
      },
      {
        name: 'Investigación divergente / mood board',
        art: 'moodboard',
        artCaption: 'Referencias dispares, juntas y sin filtrar todavía.',
        source: 'Práctica habitual en agencias creativas',
        description: 'Recopila referencias visuales, textos y ejemplos dispares antes de definir una dirección.',
        exercise: 'Junta 10 referencias (imágenes, frases, productos) que te resuenen con el tema, sin filtrar todavía.',
        duration: '20 min',
        link: 'https://www.interaction-design.org/literature/topics/mood-board'
      },
      {
        name: 'Lightning Demos',
        art: 'lightningDemos',
        artCaption: 'Tres productos que ya existen; de cada uno te quedas solo con la parte que brilla.',
        source: 'Google Ventures, Design Sprint',
        description: 'Cada persona trae productos o servicios que resuelven bien algo parecido a tu reto y enseña solo lo más llamativo y diferencial. El facilitador lo captura al vuelo con un dibujo, un titular y la fuente.',
        exercise: 'Busca 3 productos (de tu sector o de otro) que resuelvan bien algo parecido a tu reto. De cada uno: un boceto rápido, un titular y de dónde sale.',
        insight: 'Fomenta la polinización cruzada entre industrias: en lugar de reinventar la rueda, el equipo se apoya en patrones de interacción y diseño ya validados por el mercado y los adapta a su reto.',
        duration: '20 min',
        link: 'https://designsprintkit.withgoogle.com/methodology/phase3-sketch/lightning-demos'
      },
      {
        name: 'Reformulación con SCAMPER',
        art: 'scamperReframe',
        artCaption: 'El problema en el centro y los siete verbos de SCAMPER alrededor: aplica dos.',
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
        art: 'walk',
        artCaption: 'Un recorrido sin rumbo fijo, con vueltas, que termina en una idea.',
        source: 'Hábito documentado de Steve Jobs y muchos diseñadores',
        description: 'Caminar sin pantallas ayuda a que la mente divague y conecte ideas de forma no lineal.',
        exercise: 'Sal a caminar 15 minutos sin el móvil, pensando apenas en el problema, dejando que la mente vague.',
        duration: '15 min',
        link: 'https://www.nature.com/articles/s41598-020-64822-1'
      },
      {
        name: 'Brainwalking',
        art: 'brainwalk',
        artCaption: 'Un recorrido entre carteles; en cada parada dejas una nota sobre las que dejaron otros.',
        source: 'Ideación colaborativa en movimiento',
        description: 'Los participantes caminan por un espacio con carteles o imágenes sobre el reto y van dejando ideas en notas adhesivas, construyendo sobre las que otros dejaron antes.',
        exercise: 'Pega 4 carteles con el reto en distintos puntos de la sala. Recorredlos en silencio y dejad al menos una nota en cada uno, sumando a lo que ya hay.',
        insight: 'El movimiento aumenta el flujo sanguíneo y la oxigenación del cerebro: rompe el letargo de las reuniones largas alrededor de una mesa y activa nuevas vías para resolver el problema.',
        duration: '20 min'
      },
      {
        name: 'Regla de la distancia',
        art: 'distance',
        artCaption: 'Tu idea y tú, separados: deja pasar al menos un día antes de volver a mirarla.',
        source: 'Práctica clásica de incubación creativa',
        description: 'Aléjate del problema al menos un día antes de evaluarlo o decidir; la distancia mejora el juicio.',
        exercise: 'Guarda tu boceto o idea y no lo mires hasta mañana. Anota qué cambia tu percepción al volver a verlo.',
        duration: '1 día',
        link: 'https://www.psychologytoday.com/us/basics/incubation'
      },
      {
        name: 'Morning pages',
        art: 'pages',
        artCaption: 'Tres páginas escritas a mano de un tirón, sin parar ni corregir.',
        source: 'Julia Cameron, "El camino del artista"',
        description: 'Escritura libre de tres páginas a mano nada más despertarte, sin editar ni corregir.',
        exercise: 'Escribe 3 páginas a mano sin parar ni corregir, nada más levantarte, dejando salir lo que aparezca.',
        duration: '20 min',
        link: 'https://juliacameronlive.com/basic-tools/morning-pages/'
      },
      {
        name: 'Cambio de contexto',
        art: 'context',
        artCaption: 'El problema queda a un lado mientras haces algo completamente distinto.',
        source: 'Práctica habitual en estudios de diseño',
        description: 'Hacer algo completamente distinto (cocinar, dibujar, hacer deporte) libera la mente del foco directo.',
        exercise: 'Dedica 20 minutos a una actividad manual que no tenga nada que ver con tu problema.',
        duration: '20 min',
        link: 'https://www.psychologytoday.com/us/blog/the-athletes-way/201709/how-changing-your-environment-can-improve-creativity'
      },
      {
        name: 'Dormir sobre el problema',
        art: 'sleep',
        artCaption: 'De noche, la mente une puntos que de día no veías.',
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
        art: 'brainstorm',
        artCaption: 'Del problema brotan ideas en todas direcciones; aquí no se descarta ninguna.',
        source: 'Alex Osborn',
        description: 'Generación grupal de ideas originales en un ambiente relajado, sin juzgar y priorizando la cantidad en una primera ronda.',
        insight: 'Combina habilidades, pero tiene trampas: quien no aporta (free-riding), el bloqueo por ir solo a por cantidad y el pensamiento de grupo, donde las voces más dominantes tapan ideas brillantes de perfiles más analíticos. Si pasa, prueba la Técnica de Grupo Nominal.',
        exercise: 'Dedica 10 minutos a anotar todas las ideas posibles para tu problema, sin descartar ninguna.',
        duration: '10 min',
        link: 'https://www.ideou.com/blogs/inspiration/brainstorming'
      },
      {
        name: 'Técnica de Grupo Nominal',
        art: 'nominal',
        artCaption: 'Ideas escritas por separado que se juntan sin nombre y se votan.',
        source: 'Delbecq y Van de Ven',
        description: 'Brainstorming iterativo: cada persona genera ideas en silencio y por escrito, el facilitador las comparte de forma anónima y el grupo las vota para desarrollar las mejores.',
        exercise: '5 minutos de ideas en silencio, una por papel. Mezcladlas, leedlas en voz alta sin decir de quién es cada una y votad las 3 que vais a desarrollar.',
        insight: 'Separar la generación silenciosa de la discusión elimina el sesgo de autoridad y la presión social: las ideas se defienden por su propio peso, no por el carisma de quien las propone. Además, los perfiles introvertidos participan igual.',
        duration: '30 min',
        link: 'https://en.wikipedia.org/wiki/Nominal_group_technique'
      },
      {
        name: 'Brainwriting 6-3-5',
        art: 'brainwriting',
        artCaption: 'Seis personas, tres ideas cada una; en cinco minutos pasan la hoja a la siguiente.',
        source: 'Bernd Rohrbach',
        description: '6 personas escriben 3 ideas cada 5 minutos durante 6 rondas, pasando la hoja a la siguiente para que construya sobre ellas.',
        insight: 'Hasta 108 ideas en media hora (6 personas × 3 ideas × 6 rondas). El límite de tiempo evita los debates prematuros y las interrupciones, y obliga al cerebro a asociar conceptos.',
        exercise: 'Escribe 3 ideas en 5 minutos, luego toma las ideas de otra persona y suma una variación a cada una.',
        duration: '30 min',
        link: 'https://www.ideou.com/blogs/inspiration/brainwriting-6-3-5'
      },
      {
        name: 'Seis Sombreros para Pensar',
        art: 'hats',
        artCaption: 'Una idea vista desde seis perspectivas; empieza por tres: datos, emociones y riesgos.',
        source: 'Edward de Bono, 1985',
        description: 'Seis roles temporales para mirar una idea desde seis perspectivas: blanco (datos), rojo (emociones e intuición), negro (riesgos), amarillo (beneficios), verde (creatividad) y azul (control del proceso).',
        insight: 'Despersonaliza el conflicto: a quien siempre es pesimista, el sombrero amarillo le obliga a defender la idea; a quien es muy idealista, el negro le obliga a aterrizar y buscar fallos de usabilidad o de negocio.',
        exercise: 'Toma una idea y evalúala desde 3 "sombreros": el de los datos, el de las emociones y el de los riesgos.',
        duration: '15 min',
        link: 'https://www.debonogroup.com/services/core-programmes/six-thinking-hats/'
      },
      {
        name: 'Flor de loto',
        art: 'lotus',
        artCaption: 'Un centro y ocho ideas alrededor; cada una puede ser el centro de otra flor.',
        source: 'Yasuo Matsumura',
        description: 'Técnica japonesa de asociación libre: un concepto central genera 8 ideas a su alrededor en una cuadrícula de 3×3, y cada una de esas 8 se convierte en el centro de una nueva flor.',
        exercise: 'Pon tu reto en el centro de una cuadrícula de 3×3 y rellena las 8 casillas. Elige 2 y haz con cada una su propia flor.',
        insight: 'Su arquitectura visual tan clara encaja con los perfiles analíticos. Obliga a explorar la amplitud antes que la profundidad y evita obsesionarse con la primera idea viable. Funciona muy bien en un lienzo digital infinito.',
        duration: '25 min',
        link: 'https://www.sessionlab.com/methods/lotus-blossom'
      },
      {
        name: 'Estímulos aleatorios',
        art: 'randomStimuli',
        artCaption: 'Tu reto y tres cosas que no tienen nada que ver; la chispa salta donde se cruzan.',
        source: 'Michael Michalko, a partir de Edward de Bono',
        description: 'Conectar el reto con objetos, palabras o imágenes que no tienen nada que ver entre sí para forzar ideas disruptivas. Por ejemplo: un globo, un libro y una lámpara para la campaña de una cafetería.',
        exercise: 'Elige 3 objetos al azar de tu alrededor y saca de cada uno al menos una idea para tu reto. (También puedes juntar dos burbujas en el inicio.)',
        insight: 'Es pensamiento lateral en estado puro: el cerebro está programado para buscar patrones conocidos, y un estímulo ajeno al sector rompe esos patrones y fuerza conexiones nuevas.',
        duration: '15 min',
        link: 'https://en.wikipedia.org/wiki/Lateral_thinking'
      },
      {
        name: 'BrainSwarming',
        art: 'brainswarm',
        artCaption: 'El objetivo arriba, los recursos abajo; la idea es el camino que los une.',
        source: 'Tony McCaffrey, psicólogo cognitivo',
        description: 'Ideación en grupo y en silencio sobre un gráfico: el objetivo arriba, los recursos disponibles abajo, y todos van trazando caminos de solución que los unen.',
        exercise: 'Escribe el objetivo arriba de una pizarra y 6 recursos que ya tenéis abajo (personas, herramientas, datos, APIs). En silencio, conectad recursos y sub-objetivos hasta que aparezca un camino completo.',
        insight: 'McCaffrey se inspiró en cómo resuelven problemas las hormigas. Sin palabra hablada no hay persuasión verbal: quienes piensan desde los objetivos (top-down) y quienes piensan desde los recursos (bottom-up) se encuentran en el mismo mapa.',
        duration: '20 min'
      },
      {
        name: 'Crazy 8s',
        art: 'crazy8',
        artCaption: 'Un folio doblado en ocho; una idea por recuadro, a contrarreloj.',
        source: 'Google Ventures, Design Sprint',
        description: 'Se dobla un folio en 8 partes y se dibujan 8 ideas distintas en 5 a 8 minutos: entre 40 segundos y 1 minuto por recuadro. Si te bloqueas, itera sobre el boceto anterior.',
        exercise: 'Dobla un A4 en 8, pon un temporizador de 8 minutos y llena cada recuadro con una idea distinta para tu reto.',
        insight: 'Apaga al editor interno: con tan poco tiempo por recuadro no da tiempo a juzgar la viabilidad ni la estética, y salen conceptos crudos, intuitivos y muy creativos.',
        duration: '8 min',
        link: 'https://designsprintkit.withgoogle.com/methodology/phase3-sketch/crazy-8s'
      },
      {
        name: 'SCAMPER generativo',
        art: 'scamperVariations',
        artCaption: 'Una idea de partida y tres variaciones: combinar, adaptar y reordenar.',
        source: 'Bob Eberle, basado en Alex Osborn',
        description: 'Usar los verbos de SCAMPER para crear variaciones nuevas a partir de una idea existente. Ejemplo clásico: una taza de café que se vuelve apilable, o que se usa como maceta.',
        insight: 'Es la herramienta por excelencia de la innovación incremental: en vez de buscar la disrupción partiendo de cero (lo que intimida a muchos equipos), sus verbos funcionan como palancas para mejorar productos o flujos que ya existen.',
        exercise: 'Toma tu mejor idea y genera 3 variaciones aplicando "Combinar", "Adaptar" y "Reordenar".',
        duration: '15 min',
        link: 'https://www.interaction-design.org/literature/article/scamper'
      },
      {
        name: '"La peor idea posible"',
        art: 'worstIdea',
        artCaption: 'Ideas terribles a propósito… y entre ellas, una aprovechable.',
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
        art: 'sprint',
        artCaption: 'Una pantalla bocetada en minutos: lo justo para poder probarla.',
        source: 'Google Ventures',
        description: 'Construir un prototipo simple y testeable en poco tiempo, priorizando aprender rápido sobre pulir.',
        exercise: 'Haz un prototipo básico (papel, boceto o mockup) de tu idea en 30 minutos, sin pulir detalles.',
        duration: '30 min',
        link: 'https://www.gv.com/sprint/'
      },
      {
        name: 'Storyboarding',
        art: 'storyboard',
        artCaption: 'Viñeta a viñeta, alguien vive tu idea de principio a fin.',
        source: 'Técnica clásica de estudios de animación (Disney/Pixar)',
        description: 'Contar la idea como una secuencia de viñetas para detectar huecos narrativos o de experiencia.',
        exercise: 'Dibuja 4 a 6 viñetas simples que muestren cómo alguien usaría o viviría tu idea de principio a fin.',
        duration: '20 min',
        link: 'https://www.nngroup.com/articles/storyboarding/'
      },
      {
        name: 'MVP (producto mínimo viable)',
        art: 'mvp',
        artCaption: 'Empieza por la versión más pequeña que te deje aprender; lo demás crece después.',
        source: 'Eric Ries, "The Lean Startup"',
        description: 'Definir la versión más simple de la idea que permita aprender algo real de la gente.',
        exercise: 'Escribe qué es lo mínimo que necesitas construir o mostrar para saber si tu idea funciona.',
        duration: '15 min',
        link: 'https://www.startuplessonslearned.com/2009/08/minimum-viable-product-guide.html'
      },
      {
        name: 'Crítica de diseño',
        art: 'critique',
        artCaption: 'Tres críticas concretas: qué no se entiende, qué falta y qué sobra.',
        source: 'Pixar Braintrust',
        description: 'Mostrar el trabajo en progreso a otros para recibir feedback honesto centrado en el problema, no en la persona.',
        exercise: 'Comparte tu prototipo con un compañero y pídele 3 críticas concretas: qué no entiende, qué le falta, qué sobra.',
        duration: '20 min',
        link: 'https://www.pixar.com/our-story/braintrust'
      },
      {
        name: 'Iteración con test de usuario',
        art: 'userTest',
        artCaption: 'Una persona real usa tu prototipo; cada atasco alimenta la siguiente vuelta.',
        source: 'Práctica estándar de investigación UX',
        description: 'Observar a alguien real usando tu idea revela problemas que uno mismo no puede ver.',
        exercise: 'Pide a una persona que use tu prototipo mientras piensa en voz alta y anota dónde se atasca.',
        duration: '20 min',
        link: 'https://www.nngroup.com/articles/usability-testing-101/'
      },
    ],
  },
];
