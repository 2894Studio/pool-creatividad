/* hover-text.js — texto que reacciona al puntero letra a letra.
   Portado del hero del portfolio de Julio (packages/lab/src: greeting.tsx,
   motion.tsx, boil.tsx, sound.tsx; spec en docs/handoff/hero-text-hover).

   Al mover el puntero por una línea, las letras cercanas se "estampan"
   (un golpe corto de stop-motion), se quedan inclinadas con un contorno
   fino y un temblor dibujado a mano ("boil"), y vuelven a su sitio cuando
   el puntero pasa. Cada letra que se enciende toca una nota de piano de
   fieltro en una escala pentatónica, y un "lecho" lento de notas graves
   suena mientras el puntero está sobre el texto.

   Uso:
     HoverText.mount(elemento, {
       lines: [['PIENSA', 'DISTINTO.'], ['CREA', 'SIN', 'BLOQUEOS.']],
       lineClasses: [null, 'mi-clase'],   // opcional, una por línea
     });
     HoverText.setMuted(true | false);    // el interruptor de sonido

   Todos los números están en CONFIG, justo debajo. */
(function () {
  /* =========================================================================
     CONFIG — los mandos, con los valores por defecto del portfolio (spec §8).
     ========================================================================= */
  const CONFIG = {
    /** La onda del puntero y la pose sostenida (greeting.tsx). */
    greeting: {
      reach: 2,        // em: hasta dónde, a lo largo de la línea, se encienden letras
      falloff: 1,      // cuota por cada ancho de letra de distancia (1 = todas a tope)
      tilt: 15,        // deg: inclinación de la pose sostenida
      scatter: 0.6,    // cuánto se aparta la inclinación de cada letra de `tilt`
      hair: 0.03,      // em: grosor total del contorno fino
      beat: 1,         // duración del estampado, como cuota de motion.duration
      back: 0.5,       // duración de la vuelta, como cuota del estampado
      lift: 0.5,       // cuota del desplazamiento del estampado
      grow: 0.3,       // cuota del cambio de tamaño
      swing: 0.49,     // cuota del giro
      catch: 0.12,     // em: cuánto se estira la celda arriba y abajo para atrapar el puntero
      quantum: 0.1,    // paso en que se cuantiza la cuota de cada letra
    },
    /** El reloj y las poses del "stamp" de stop-motion (motion.tsx). */
    motion: { duration: 0.38, cuts: 3, distance: 48, startScale: 0.82, overshoot: 1.08, tilt: 7 },
    /** El temblor y el contorno (boil.tsx). */
    boil: {
      fps: 5,          // fotogramas del temblor por segundo
      shove: 2.5,      // % del span que se desplazan los bordes
      floor: 3,        // px: desplazamiento mínimo
      wave: 1.5,       // ondulaciones de ruido a lo ancho del span
      grain: 1,        // octavas de ruido
      span: 71 / 20,   // em: el ancho sobre el que se miden wave y shove
      seeds: [7, 41, 14, 33, 21, 58, 3, 47, 26, 11, 52, 19, 38, 61, 29, 44],
    },
    /** El piano y el lecho (sound.tsx). */
    sound: {
      master: 0.6,     // volumen general
      letter: 0.15,    // volumen de las letras
      ring: 1,         // s: cuánto suena una nota (el lecho 2.5×)
      gap: 120,        // ms mínimos entre dos notas principales
      company: 0.1,    // volumen de las letras vecinas, como cuota de la principal
      whimsy: 0.35,    // frecuencia de saltos, notas de adorno y segundas
      room: 0.7,       // cuánto se oye la sala (reverberación)
      bed: 0.25,       // volumen del lecho
      pace: 2,         // s: espera media entre notas del lecho
      strum: 0.014,    // s entre notas encendidas en el mismo movimiento (rasgueo)
      bedLinger: 1500, // ms que el lecho sigue tras salir el puntero
      bedSettle: 250,  // ms antes de la primera nota del lecho
      maxVoices: 6,    // notas a la vez; la más vieja se apaga en voiceFade
      voiceFade: 0.12,
      letterRoot: 246.94, // Hz, B3
      bedRoot: 123.47,    // Hz, B2
      roomSeconds: 1.6,
      startMuted: false,
    },
    /** Separación entre palabras, em. */
    wordGap: 0.26,
  };

  const n = (v, d = 3) => Number(v.toFixed(d)).toString();
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     Hoja de estilos: el estampado, la pose sostenida, la vuelta y el boil
     ========================================================================= */

  /** Las cinco poses del "stamp" (motion.tsx `poses("stamp")`), cada una
   *  escalada por la cuota de la onda y con la inclinación propia de la letra. */
  function stampPoses() {
    const m = CONFIG.motion;
    const g = CONFIG.greeting;
    const d = m.distance;
    const over = m.overshoot - 1;
    const dip = (v, unit) => `calc(${n(v)}${unit} * var(--dip))`;
    const pose = (x, y, r, scale) =>
      `transform: translate(${dip(x * g.lift, 'px')}, ${dip(y * g.lift, 'px')}) ` +
      `rotate(calc(${n(r * g.swing)}deg * var(--dip) - ${n(g.tilt)}deg * var(--way) * var(--dip))) ` +
      `scale(calc(1 + ${dip((scale - 1) * g.grow, '')}));`;
    return {
      all: [
        pose(-d * 0.17, -d * 0.25, -m.tilt * 0.3, 1 / m.startScale), // entra grande, arriba a la izquierda
        pose(d * 0.04, d * 0.06, m.tilt * 0.15, 1 - over * 0.6),      // aterriza apretada, abajo a la derecha
        pose(-d * 0.02, -d * 0.02, -m.tilt * 0.06, 1 + over * 0.25),  // se asienta
        pose(0, 0, 0, 1 - over * 0.2),                                // segundo aterrizaje (sólo con cuts 4)
        pose(0, 0, 0, 1),                                             // reposo: sólo la inclinación
      ],
      rest: pose(0, 0, 0, 1),
    };
  }

  /** La pose inicial, las primeras `cuts - 1` intermedias y el reposo (motion.tsx `cutPoses`). */
  function cutPoses(all, cuts) {
    const c = Math.min(4, Math.max(1, Math.round(cuts)));
    const [start, land, settle, land2, rest] = all;
    return [start, ...[land, settle, land2].slice(0, c - 1), rest];
  }

  /** Un bloque @keyframes con las poses repartidas por igual (motion.tsx `keyframes`). */
  function keyframes(name, all, cuts) {
    const steps = cutPoses(all, cuts);
    const total = steps.length - 1;
    return `@keyframes ${name} {\n` +
      steps.map((pose, i) => `  ${n((i / total) * 100, 1)}% { ${pose} }`).join('\n') + '\n}';
  }

  function stylesheet() {
    const g = CONFIG.greeting;
    const m = CONFIG.motion;
    const over = m.overshoot - 1;
    const { all, rest } = stampPoses();
    const stampMs = m.duration * 1000 * g.beat;
    return `
.ht-line { display: block; }
.ht-word { display: inline-block; }
.ht-word + .ht-word { margin-left: ${n(CONFIG.wordGap)}em; }
/* Cada letra es una celda (zona de impacto y filtro) alrededor de un glifo (lo que se mueve).
   La celda se estira arriba y abajo para atrapar un barrido algo fuera de la línea. */
.ht-letter {
  position: relative; display: inline-block; --dip: 1;
  --way: calc(${n(1 - g.scatter)} + ${n(g.scatter)} * var(--stray, 0));
  padding: ${n(g.catch)}em 0; margin: -${n(g.catch)}em 0;
}
.ht-glyph { display: inline-block; transform-origin: 50% 50%; animation-fill-mode: both; animation-timing-function: steps(1, end); }
/* El boil y el contorno van en la celda, no en el glifo: el glifo ya está girado cuando se
   dibuja la celda, así que se remuestrea una sola vez. Cuatro filtros repartidos por letra. */
.ht-letter:nth-child(4n+1) { --boil-filter: var(--boil-1); }
.ht-letter:nth-child(4n+2) { --boil-filter: var(--boil-2); }
.ht-letter:nth-child(4n+3) { --boil-filter: var(--boil-3); }
.ht-letter:nth-child(4n) { --boil-filter: var(--boil-4); }
.ht-letter.is-on, .ht-letter.is-held { filter: var(--boil-filter, none); }
.ht-letter.is-on .ht-glyph { animation-name: ht-stamp; animation-duration: ${n(stampMs, 0)}ms; }
/* Sostenida: la pose de reposo como transform estático, no como relleno de una animación
   (una animación deja el glifo en una capa que el navegador remuestrea y se ve borroso). */
.ht-letter.is-held .ht-glyph { ${rest} }
.ht-letter.is-off .ht-glyph { animation-name: ht-back; animation-duration: ${n(stampMs * g.back, 0)}ms; }
${keyframes('ht-stamp', all, m.cuts)}
@keyframes ht-back { 0% { transform: scale(calc(1 - calc(${n(over * 0.5 * g.grow)} * var(--dip)))); } 50%, 100% { transform: none; } }
.ht-boil { position: absolute; width: 0; height: 0; overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  .ht-letter.is-on .ht-glyph, .ht-letter.is-off .ht-glyph { animation-delay: 0ms; animation-duration: 1ms; }
}
`;
  }

  let styled = false;
  function ensureStyles() {
    if (styled) return;
    styled = true;
    const style = document.createElement('style');
    style.setAttribute('data-hover-text', '');
    style.textContent = stylesheet();
    document.head.appendChild(style);
  }

  /* =========================================================================
     Boil + contorno: un filtro SVG (boil.tsx)
     ========================================================================= */

  /** φ, la densidad de la normal estándar. */
  const normalPdf = (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  /** Φ, la función de distribución de la normal estándar (Abramowitz y Stegun 7.1.26). */
  function normalCdf(x) {
    const z = Math.abs(x) / Math.SQRT2;
    const q = 1 / (1 + 0.3275911 * z);
    const poly = q * (0.254829592 + q * (-0.284496736 + q * (1.421413741 + q * (-1.453152027 + q * 1.061405429))));
    const erf = 1 - poly * Math.exp(-z * z);
    return 0.5 * (1 + (x < 0 ? -erf : erf));
  }
  /** Engordar un glifo `outset` px dentro del filtro: desenfoque y re-umbral del alfa.
   *  Así el contorno y el relleno son una sola forma (un text-stroke se separaría). */
  function thicken(outset) {
    const sigma = Math.max(outset, 0.75); // los navegadores omiten desenfoques menores
    const level = normalCdf(-outset / sigma);
    const slope = sigma / normalPdf(outset / sigma);
    return { sigma, slope, intercept: 0.5 - level * slope };
  }

  /** Un filtro de boil para texto a `em` px, con contorno de `hair` px. */
  function filterMarkup(id, em, seeds, hair) {
    const b = CONFIG.boil;
    const span = b.span * em;
    const { sigma, slope, intercept } = thicken(hair / 2);
    return (
      `<filter id="${id}" x="-0.3" y="-0.3" width="1.6" height="1.6" color-interpolation-filters="sRGB">` +
      (hair > 0
        ? `<feGaussianBlur in="SourceGraphic" stdDeviation="${n(sigma, 4)}" result="haze"/>` +
          `<feComponentTransfer in="haze" result="haired"><feFuncA type="linear" slope="${n(slope, 4)}" intercept="${n(intercept, 4)}"/></feComponentTransfer>`
        : '') +
      `<feTurbulence type="fractalNoise" baseFrequency="${n(b.wave / span, 5)} ${n((b.wave * 1.33) / (span * 0.8), 5)}" numOctaves="${b.grain}" seed="${seeds[0]}" result="noise">` +
      `<animate attributeName="seed" values="${seeds.join(';')}" calcMode="discrete" dur="${n(seeds.length / b.fps, 3)}s" begin="indefinite" repeatCount="indefinite"/>` +
      `</feTurbulence>` +
      `<feDisplacementMap in="${hair > 0 ? 'haired' : 'SourceGraphic'}" in2="noise" scale="${n(Math.max(b.floor, (b.shove / 100) * span), 2)}" xChannelSelector="R" yChannelSelector="G"/>` +
      // endurecer el borde tras el desplazamiento: se lee como una curva, no como un desenfoque
      `<feComponentTransfer><feFuncA type="linear" slope="2.2" intercept="-0.6"/></feComponentTransfer>` +
      `</filter>`
    );
  }

  /* =========================================================================
     Sonido: piano de fieltro sintetizado, melodía pentatónica y lecho (sound.tsx)
     ========================================================================= */
  const S = CONFIG.sound;
  const AC = window.AudioContext || window.webkitAudioContext;
  const FLOOR = 0.0001;
  /** Si mayor pentatónica en dos octavas: cualquier par de notas combina. */
  const PENTATONIC = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3, 10 / 3];
  const DEGREES = PENTATONIC.length;
  const onScale = (d) => Math.min(DEGREES - 1, Math.max(0, d));
  const vary = (spread) => 1 + (Math.random() * 2 - 1) * spread;

  let engine = null;
  let armed = false;
  let muted = !!S.startMuted;
  let melodyAt = 4;
  let voices = [];

  function makeNoise(ac) {
    const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** La cola de la sala: ruido estéreo filtrado que decae (1−t)^1.5·e^(−2.5t), energía unitaria. */
  function makeTail(ac, seconds) {
    const len = Math.floor(ac.sampleRate * seconds);
    const buffer = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      let lp = 0;
      let energy = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += (Math.random() * 2 - 1 - lp) * 0.22;
        const v = lp * (1 - t) ** 1.5 * Math.exp(-2.5 * t);
        data[i] = v;
        energy += v * v;
      }
      const k = 1 / Math.sqrt(energy || 1);
      for (let i = 0; i < len; i++) data[i] *= k;
    }
    return buffer;
  }

  function create() {
    if (engine) return engine;
    if (!AC) return null;
    const ac = new AC();
    const master = ac.createGain();
    master.gain.value = muted ? 0 : S.master;
    master.connect(ac.destination);
    const room = ac.createGain();
    room.gain.value = S.room;
    const tail = ac.createConvolver();
    tail.buffer = makeTail(ac, S.roomSeconds);
    room.connect(tail);
    tail.connect(master);
    engine = { ac, master, room, noise: makeNoise(ac) };
    return engine;
  }

  function aimMaster() {
    if (!engine) return;
    const { ac, master } = engine;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(muted ? 0 : S.master, ac.currentTime, 0.05);
  }

  function unlock() {
    const e = create();
    if (!e) return;
    if (e.ac.state !== 'running') e.ac.resume().catch(() => {});
    aimMaster();
  }

  /** El audio sólo arranca tras un gesto: el primer pointerdown / keydown / touchend lo desbloquea.
   *  Los listeners se quedan (son baratos) para reanudar un contexto que el navegador suspenda. */
  function arm() {
    if (armed) return;
    armed = true;
    ['pointerdown', 'keydown', 'touchend'].forEach((type) =>
      window.addEventListener(type, unlock, { capture: true, passive: true }));
  }

  /** Crea el contexto al primer hover (no al cargar: sintetizar la sala cuesta unos ms):
   *  si el navegador ya confía en la página, suena desde ese hover. */
  function prime() {
    arm();
    const e = create();
    if (e && e.ac.state !== 'running') e.ac.resume().catch(() => {});
  }

  const live = () => (engine && engine.ac.state === 'running' ? engine : null);

  /** Una nota de piano de fieltro: cuatro parciales con su propio decaimiento, algo estirados
   *  como una cuerda rígida, y un martillo de ruido grave que se apaga en 30 ms. */
  function piano(e, t0, f, level, ring) {
    const { ac } = e;
    const out = ac.createGain();
    out.connect(e.master);
    out.connect(e.room);
    [[1, 1], [2, 0.45], [3, 0.18], [4, 0.08]].forEach(([ratio, share], k) => {
      const dur = ring / (1 + 0.7 * k);
      const attack = 0.004 + 0.002 * k;
      const g = ac.createGain();
      g.gain.setValueAtTime(FLOOR, t0);
      g.gain.linearRampToValueAtTime(Math.max(level * share, FLOOR), t0 + attack);
      g.gain.exponentialRampToValueAtTime(FLOOR, t0 + attack + dur);
      g.connect(out);
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * ratio * (1 + 0.0006 * k * k);
      osc.connect(g);
      osc.start(t0);
      osc.stop(t0 + attack + dur + 0.05);
    });
    const hammer = ac.createGain();
    hammer.gain.setValueAtTime(FLOOR, t0);
    hammer.gain.linearRampToValueAtTime(Math.max(level * 0.35, FLOOR), t0 + 0.003);
    hammer.gain.exponentialRampToValueAtTime(FLOOR, t0 + 0.03);
    hammer.connect(out);
    const src = ac.createBufferSource();
    src.buffer = e.noise;
    src.loop = true;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(f * 3, 1800);
    lp.Q.value = 0.7;
    src.connect(lp);
    lp.connect(hammer);
    src.start(t0, Math.random() * (e.noise.duration - 0.2));
    src.stop(t0 + 0.05);
    return out;
  }

  /** Como mucho maxVoices a la vez: un barrido rápido es un arpegio, nunca un borrón. */
  function takeVoice(e, out, t0, ring) {
    const now = e.ac.currentTime;
    voices = voices.filter((v) => v.at + ring + 0.3 > now);
    voices.push({ out, at: t0 });
    while (voices.length > S.maxVoices) {
      const old = voices.shift();
      old.out.gain.cancelScheduledValues(now);
      old.out.gain.setTargetAtTime(0, now, S.voiceFade / 3);
    }
  }

  /** Un paso de la melodía: uno o dos grados casi siempre, un salto de 3 a 5 con `whimsy`,
   *  tirando hacia el centro desde los extremos. */
  function walk(from, whimsy) {
    const mid = (DEGREES - 1) / 2;
    const up = 0.5 - ((from - mid) / mid) * 0.3;
    const dir = Math.random() < up ? 1 : -1;
    const size = Math.random() < whimsy ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    const to = from + dir * size;
    return onScale(to < 0 || to >= DEGREES ? from - dir * size : to);
  }

  /** Una armonía de `at` para las vecinas: a 2–3 grados, o a 1 con una parte del whimsy. */
  function harmony(at, whimsy) {
    const off = Math.random() < whimsy * 0.3 ? 1 : 2 + Math.floor(Math.random() * 2);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const to = at + dir * off;
    return onScale(to < 0 || to >= DEGREES ? at - dir * off : to);
  }

  /** Una letra que se enciende. La principal mueve la melodía; a veces con una nota de adorno
   *  un grado arriba. Las vecinas (`soft`) tocan una armonía, más corta. */
  function playLetter(level, opts) {
    arm();
    const e = live();
    if (!e || muted) return;
    const t0 = e.ac.currentTime + ((opts && opts.delay) || 0);
    const lvl = level * S.letter;
    if (opts && opts.soft) {
      const ring = S.ring * 0.6;
      const f = S.letterRoot * PENTATONIC[harmony(melodyAt, S.whimsy)];
      takeVoice(e, piano(e, t0, f, lvl * vary(0.15), ring), t0, ring);
      return;
    }
    melodyAt = walk(melodyAt, S.whimsy);
    const f = S.letterRoot * PENTATONIC[melodyAt];
    takeVoice(e, piano(e, t0, f, lvl * vary(0.1), S.ring), t0, S.ring);
    if (Math.random() < S.whimsy * 0.4) {
      const at = t0 + 0.07;
      const ring = S.ring * 0.6;
      takeVoice(e, piano(e, at, S.letterRoot * PENTATONIC[onScale(melodyAt + 1)], lvl * 0.45, ring), at, ring);
    }
  }

  /* ---------- el lecho: notas graves y lentas mientras el puntero está encima ---------- */
  let bedWanted = 0;
  let bedHidden = false;
  let bedTimer = null;
  let bedAt = 4;

  function bedTick() {
    bedTimer = null;
    if (!bedWanted || bedHidden) return;
    const e = live();
    if (e && !muted && S.bed > 0) {
      bedAt = walk(bedAt, S.whimsy * 0.5);
      piano(e, e.ac.currentTime, S.bedRoot * PENTATONIC[bedAt], S.bed * 0.5 * vary(0.15), S.ring * 2.5);
    }
    // hasta que el audio esté desbloqueado, sólo mira de vez en cuando
    const wait = e ? S.pace * 1000 * (0.5 + Math.random()) : 400;
    bedTimer = window.setTimeout(bedTick, wait);
  }
  function startBed() { if (bedTimer === null) bedTimer = window.setTimeout(bedTick, S.bedSettle); }
  function stopBed() { if (bedTimer !== null) { window.clearTimeout(bedTimer); bedTimer = null; } }
  function onBedVisibility() {
    bedHidden = document.visibilityState === 'hidden';
    if (bedHidden) stopBed(); else startBed();
  }
  /** Pide el lecho; devuelve la función que lo suelta. Suena mientras alguien lo pida. */
  function wantBed() {
    arm();
    bedWanted++;
    if (bedWanted === 1) {
      bedHidden = document.visibilityState === 'hidden';
      document.addEventListener('visibilitychange', onBedVisibility);
      startBed();
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      bedWanted--;
      if (bedWanted > 0) return;
      document.removeEventListener('visibilitychange', onBedVisibility);
      stopBed();
    };
  }

  /* =========================================================================
     El componente
     ========================================================================= */

  /** El número propio de una letra en -1..1, fijo por qué es y dónde está en su palabra,
   *  así una palabra siempre se inclina igual. */
  function stray(ch, i) {
    const seed = ((i + 1) * 9301 + (ch.codePointAt(0) || 0) * 49297) % 233280;
    return (seed / 233280) * 2 - 1;
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let uid = 0;

  function mount(root, options) {
    const opts = options || {};
    const lines = opts.lines || [];
    const lineClasses = opts.lineClasses || [];
    ensureStyles();
    arm();

    const id = 'ht' + (++uid);
    const FIELDS = [0, 1, 2, 3];
    root.classList.add('ht');
    root.setAttribute('aria-hidden', 'true');
    FIELDS.forEach((k) => root.style.setProperty('--boil-' + (k + 1), `url(#${id}-${k})`));

    root.innerHTML =
      '<svg class="ht-boil" width="0" height="0" aria-hidden="true" focusable="false"></svg>' +
      lines.map((line, l) =>
        `<span class="ht-line${lineClasses[l] ? ' ' + lineClasses[l] : ''}">` +
        line.map((word) =>
          '<span class="ht-word">' +
          Array.from(word).map((ch, i) =>
            `<span class="ht-letter" style="--stray: ${n(stray(ch, i))}"><span class="ht-glyph">${esc(ch)}</span></span>`).join('') +
          '</span>').join('') +
        '</span>').join('');

    const svg = root.querySelector('.ht-boil');
    const letters = Array.from(root.querySelectorAll('.ht-letter')).map((el) => ({
      el, glyph: el.firstChild, pose: 'rest', wasLit: false, dip: 0,
    }));
    const byGlyph = new Map(letters.map((L) => [L.glyph, L]));

    /* ---------- las celdas no se mueven: medimos de vez en cuando, no en cada movimiento ---------- */
    let rects = null;
    let rectsAt = 0;
    function measure(now) {
      rects = letters.map((L) => L.el.getBoundingClientRect());
      rectsAt = now;
    }

    /* ---------- los filtros, a la medida del em del texto ---------- */
    let em = 16;
    let hovered = false;
    const anims = () => Array.from(svg.querySelectorAll('animate'));
    let built = 0;
    function buildFilters() {
      rects = null;
      const size = parseFloat(getComputedStyle(root).fontSize) || 16;
      // los filtros sólo dependen del tamaño de letra
      if (size === built) return;
      built = em = size;
      const seeds = CONFIG.boil.seeds;
      // cada filtro empieza su lista de semillas rotada 4k, para que las vecinas no tiemblen igual
      svg.innerHTML = '<defs>' + FIELDS.map((k) =>
        filterMarkup(`${id}-${k}`, em, [...seeds.slice(k * 4), ...seeds.slice(0, k * 4)], CONFIG.greeting.hair * em)).join('') + '</defs>';
      if (hovered) boilOn();
    }
    // el temblor sólo cicla mientras el puntero está encima; con movimiento reducido, nunca
    function boilOn() {
      if (reducedMotion()) return;
      anims().forEach((a) => { try { a.beginElement(); } catch (_) { /* sin SMIL */ } });
    }
    function boilOff() {
      anims().forEach((a) => { try { a.endElement(); } catch (_) { /* sin SMIL */ } });
    }
    buildFilters();
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; buildFilters(); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildFilters);

    /* ---------- la máquina de estados de cada letra ---------- */
    function setPose(L, pose) {
      if (L.pose === pose) return;
      L.el.classList.remove('is-' + L.pose);
      L.pose = pose;
      if (pose !== 'rest') L.el.classList.add('is-' + pose);
    }
    function setDip(L, dip) {
      L.dip = dip;
      L.el.style.setProperty('--dip', String(dip || 1)); // la vuelta siempre a tope
      const lit = dip > 0;
      if (lit !== L.wasLit) {
        L.wasLit = lit;
        setPose(L, lit ? 'on' : (L.pose === 'on' || L.pose === 'held' ? 'off' : L.pose));
      }
    }
    root.addEventListener('animationend', (e) => {
      const L = byGlyph.get(e.target);
      if (!L) return;
      if (e.animationName === 'ht-stamp' && L.pose === 'on') setPose(L, 'held');
      if (e.animationName === 'ht-back' && L.pose === 'off') setPose(L, 'rest');
    });

    /* ---------- la onda del puntero ---------- */
    let lit = [];
    let lastMain = -Infinity;
    let onLetter = -1;

    function wave(x, y) {
      const { reach, falloff, quantum } = CONFIG.greeting;
      const prev = lit;
      const next = [];
      const struck = [];
      let under = -1;
      const now = performance.now();
      // la entrada del titular aún puede estar moviendo las palabras: remedimos cada 300 ms
      if (!rects || now - rectsAt > 300) measure(now);
      letters.forEach((L, i) => {
        const r = rects[i];
        // sólo la línea del puntero
        if (y < r.top || y > r.bottom) { next[i] = 0; return; }
        // distancia al lado más cercano de la celda (0 encima)
        const d = Math.max(r.left - x, 0, x - r.right);
        if (d === 0) under = i;
        const dip = d > reach * em ? 0
          : Math.min(1, Math.round(Math.ceil(falloff ** (d / r.width) / quantum) * quantum * 100) / 100);
        next[i] = dip;
        if (dip > 0 && !prev[i]) struck.push({ i, d, dip });
      });
      lit = next;

      // la nota principal: el puntero entra en una letra nueva y ya pasó el `gap`
      let lead = -1;
      if (under >= 0 && under !== onLetter) {
        if (now - lastMain >= S.gap) {
          lead = under;
          lastMain = now;
          onLetter = under;
        }
      } else if (under < 0) {
        onLetter = -1;
      }
      if (lead >= 0) playLetter(1);
      // las vecinas recién encendidas, de la más cercana a la más lejana, como un rasgueo
      struck.sort((a, b) => a.d - b.d);
      let j = lead >= 0 ? 1 : 0;
      struck.forEach(({ i, dip }) => {
        if (i === lead) return;
        const level = S.company * dip;
        if (level > 0) playLetter(level, { delay: j++ * S.strum, soft: true });
      });

      // sólo se toca el DOM si alguna cuota cambió
      letters.forEach((L, i) => { if (next[i] !== L.dip) setDip(L, next[i]); });
    }

    /* ---------- el lecho sigue el hover, con un rato de cortesía al salir ---------- */
    let releaseBed = null;
    let bedLinger = null;
    function bedHover(on) {
      if (on) {
        if (bedLinger) { clearTimeout(bedLinger); bedLinger = null; }
        if (!releaseBed) releaseBed = wantBed();
      } else if (releaseBed && !bedLinger) {
        bedLinger = setTimeout(() => { bedLinger = null; if (releaseBed) { releaseBed(); releaseBed = null; } }, S.bedLinger);
      }
    }

    // el táctil no tiene hover: un toque no hace nada
    root.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      prime();
      rects = null;
      hovered = true;
      boilOn();
      bedHover(true);
    });
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      wave(e.clientX, e.clientY);
    });
    root.addEventListener('pointerleave', () => {
      letters.forEach((L) => { if (L.dip) setDip(L, 0); });
      lit = [];
      onLetter = -1;
      hovered = false;
      boilOff();
      bedHover(false);
    });

    return {
      root,
      words: () => Array.from(root.querySelectorAll('.ht-word')),
      lines: () => Array.from(root.querySelectorAll('.ht-line')),
    };
  }

  window.HoverText = {
    mount,
    config: CONFIG,
    setMuted(next) { muted = !!next; aimMaster(); },
    /** El motor de audio compartido ({ ac, … }), para que sound.js use el mismo contexto. */
    audio: () => create(),
    isMuted: () => muted,
  };
})();
