/* dot-art.js — pictogramas de trama de puntos (halftone) dibujados en canvas.
   Dos capas:
     · fondo tenue: la textura de la fase (reunir, ondas, destello, rejilla)
     · figura: un pictograma que explica la técnica (5 porqués = 5 nodos que
       bajan hasta la raíz, 6-3-5 = 6 personas con 3 ideas que se pasan…).
       Los puntos "clave" (en cobalto) marcan la parte que importa.
   La figura se dibuja punto a punto, como con un lápiz.

   JOY.dotArt(canvas, { motif: fase, art: id, seed, interactive }) → { play(opts), set(t), accent(on) }
   interactive: una lupa sigue al puntero; los puntos cercanos crecen y se apartan. */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const PI = Math.PI;
  const TAU = PI * 2;

  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeOut = (v) => 1 - Math.pow(1 - v, 3);

  /* =========================================================================
     Fondo de cada fase (coordenadas -1..1, y hacia abajo)
     ========================================================================= */
  const FIELDS = {
    // espiral de girasol: puntos que llegan dispersos y se reúnen
    preparacion(r) {
      const dots = [];
      const count = 360;
      const golden = PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const rad = Math.sqrt((i + 0.5) / count) * 0.94;
        const a = i * golden;
        const fa = r() * TAU;
        const far = 0.6 + r() * 0.5;
        dots.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, fx: Math.cos(fa) * far, fy: Math.sin(fa) * far, d: r() * 0.5 });
      }
      return dots;
    },
    // anillos concéntricos que se expanden despacio
    incubacion() {
      const dots = [];
      const rings = 9;
      for (let k = 1; k <= rings; k++) {
        const rad = (k / rings) * 0.94;
        const n = Math.max(6, Math.round((TAU * rad) / 0.07));
        for (let j = 0; j < n; j++) {
          const a = (j / n) * TAU + k * 0.3;
          const x = Math.cos(a) * rad;
          const y = Math.sin(a) * rad;
          dots.push({ x, y, fx: x * 0.2, fy: y * 0.2, d: (k / rings) * 0.5 });
        }
      }
      return dots;
    },
    // rayos que salen del centro
    iluminacion() {
      const dots = [];
      const rays = 48;
      const per = 11;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * TAU;
        for (let j = 1; j <= per; j++) {
          const rad = 0.12 + Math.sin((j / per) * PI / 2) * 0.82;
          dots.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, fx: 0, fy: 0, d: rad * 0.5 });
        }
      }
      return dots;
    },
    // rejilla que se construye de abajo arriba
    implementacion() {
      const dots = [];
      const n = 15;
      for (let c = 0; c < n; c++) {
        for (let row = 0; row < n; row++) {
          const x = -0.9 + (c / (n - 1)) * 1.8;
          const y = 0.9 - (row / (n - 1)) * 1.8;
          dots.push({ x, y, fx: x, fy: y + 0.15, d: Math.floor((row / n) * 5) / 10 });
        }
      }
      return dots;
    },
  };

  /* =========================================================================
     Lápiz: primitivas que dejan puntos a intervalos regulares
     ========================================================================= */
  function Pen() {
    const pts = [];
    const SP = 0.072;
    const add = (x, y, o) => pts.push({ x, y, s: (o && o.s) || 2.2, key: !!(o && o.key) });
    const sp = (o) => (o && o.sp) || SP;
    const p = {
      pts,
      dot(x, y, o) { add(x, y, o); return p; },
      line(x1, y1, x2, y2, o) {
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / sp(o)));
        for (let i = 0; i <= n; i++) add(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, o);
        return p;
      },
      arc(cx, cy, r, a0, a1, o) {
        const full = Math.abs(a1 - a0) >= TAU - 1e-6;
        const n = Math.max(1, Math.round((Math.abs(a1 - a0) * r) / sp(o)));
        for (let i = 0; i < (full ? n : n + 1); i++) {
          const a = a0 + ((a1 - a0) * i) / n;
          add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, o);
        }
        return p;
      },
      ring(cx, cy, r, o) { return p.arc(cx, cy, r, 0, TAU, o); },
      disc(cx, cy, r, o) {
        const s = sp(o);
        // un disco pequeño se vería hexagonal: mejor un solo punto redondo del mismo tamaño
        if (r < 0.11) return p.dot(cx, cy, Object.assign({}, o, { s: Math.min(r / 0.0085 * 0.85, 11) }));
        add(cx, cy, o);
        for (let rr = s; rr <= r + 1e-6; rr += s) {
          const n = Math.max(5, Math.round((TAU * rr) / s));
          for (let j = 0; j < n; j++) add(cx + Math.cos((j / n) * TAU) * rr, cy + Math.sin((j / n) * TAU) * rr, o);
        }
        return p;
      },
      rect(x, y, w, h, o) {
        return p.line(x, y, x + w, y, o).line(x + w, y, x + w, y + h, o).line(x + w, y + h, x, y + h, o).line(x, y + h, x, y, o);
      },
      fill(x, y, w, h, o) {
        const s = sp(o);
        const nx = Math.max(1, Math.round(w / s));
        const ny = Math.max(1, Math.round(h / s));
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) add(x + (w * i) / nx, y + (h * j) / ny, o);
        return p;
      },
      // curva paramétrica fn(t) → [x, y], t de 0 a 1, con puntos equidistantes
      curve(fn, o) {
        let prev = fn(0);
        add(prev[0], prev[1], o);
        let acc = 0;
        for (let i = 1; i <= 600; i++) {
          const q = fn(i / 600);
          acc += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
          if (acc >= sp(o)) { add(q[0], q[1], o); acc = 0; }
          prev = q;
        }
        return p;
      },
      arrow(x, y, ang, o) {
        const l = (o && o.len) || 0.12;
        p.line(x, y, x - Math.cos(ang - 0.6) * l, y - Math.sin(ang - 0.6) * l, o);
        return p.line(x, y, x - Math.cos(ang + 0.6) * l, y - Math.sin(ang + 0.6) * l, o);
      },
      // una persona: cabeza + hombros
      person(x, y, sc, o) {
        const k = sc || 1;
        p.disc(x, y - 0.1 * k, 0.07 * k, Object.assign({ sp: 0.05 }, o));
        return p.arc(x, y + 0.17 * k, 0.15 * k, PI, TAU, Object.assign({ sp: 0.055 }, o));
      },
    };
    return p;
  }

  const at = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

  /* =========================================================================
     Pictogramas: uno por técnica, una sola idea cada uno (2–3 elementos)
     ========================================================================= */
  const DOT = { sp: 0.055 };
  const LINE = { s: 1.4, sp: 0.07 };
  const FIGURES = {
    /* ---------- Preparación ---------- */

    // la persona en el centro de sus cuatro cuadrantes
    empathy(p) {
      p.line(-0.8, 0, -0.36, 0, LINE).line(0.36, 0, 0.8, 0, LINE).line(0, -0.8, 0, -0.36, LINE).line(0, 0.36, 0, 0.8, LINE);
      p.person(0, 0, 1.2, { key: true });
    },

    // cinco preguntas que bajan del síntoma a la raíz
    whys(p) {
      [-0.72, -0.38, -0.04, 0.3, 0.66].forEach((y, i) => {
        if (i < 4) p.disc(0, y, 0.04 + i * 0.02, DOT);
        else p.disc(0, y, 0.15, Object.assign({ key: true }, DOT));
      });
    },

    // un problema se abre en tres preguntas; eliges una
    hmw(p) {
      p.disc(-0.66, 0, 0.12, DOT);
      [[0.62, -0.58], [0.7, 0], [0.62, 0.58]].forEach(([x, y], i) => {
        const a = Math.atan2(y, x + 0.66);
        p.line(-0.66 + Math.cos(a) * 0.22, Math.sin(a) * 0.22, x - Math.cos(a) * 0.18, y - Math.sin(a) * 0.18, LINE);
        p.disc(x, y, i === 1 ? 0.12 : 0.07, Object.assign({ key: i === 1 }, DOT));
      });
    },

    // referencias dispares, juntas y sin filtrar
    moodboard(p) {
      p.fill(-0.7, -0.62, 0.42, 0.34, { s: 1.8, sp: 0.085 });
      p.disc(0.4, -0.42, 0.2, DOT);
      p.disc(-0.42, 0.42, 0.14, DOT);
      p.fill(0.08, 0.14, 0.5, 0.42, { s: 1.8, sp: 0.085, key: true });
    },

    // tres productos que ya existen; de cada uno, solo la parte que brilla
    lightningDemos(p) {
      [[0.14, -0.2], [0.34, 0.1], [0.18, 0.24]].forEach(([hx, hy], k) => {
        const x0 = -0.86 + k * 0.6;
        p.rect(x0, -0.44, 0.52, 0.88, { s: 1.4, sp: 0.075 });
        p.disc(x0 + hx + 0.02, hy, 0.07, Object.assign({ key: true }, DOT));
      });
    },

    // el problema en el centro, los 7 verbos alrededor: aplica dos
    scamperReframe(p) {
      p.disc(0, 0, 0.14, DOT);
      for (let k = 0; k < 7; k++) {
        const a = -PI / 2 + (k * TAU) / 7;
        const key = k === 1 || k === 4;
        if (key) p.line(...at(a, 0.24), ...at(a, 0.56), LINE);
        p.disc(...at(a, 0.7), key ? 0.09 : 0.05, Object.assign({ key }, DOT));
      }
    },

    /* ---------- Incubación ---------- */

    // un paseo sin rumbo fijo, con una vuelta, que acaba en una idea
    walk(p) {
      const fn = (t) => [-0.78 + 1.56 * t - 0.42 * Math.sin(TAU * t + PI), 0.22 - 0.46 * Math.cos(TAU * t + PI)];
      p.curve(fn, { s: 2, sp: 0.075 });
      p.disc(...fn(1), 0.12, Object.assign({ key: true }, DOT));
    },

    // un recorrido entre carteles, dejando una nota en cada uno
    brainwalk(p) {
      p.curve((t) => [-0.84 + 1.68 * t, 0.46 + 0.16 * Math.sin(TAU * t * 1.5)], { s: 2, sp: 0.075 });
      [-0.56, 0, 0.56].forEach((x, i) => {
        p.rect(x - 0.17, -0.7, 0.34, 0.46, { s: 1.4, sp: 0.075 });
        p.fill(x - 0.06, -0.52, 0.12, 0.12, { s: 2.2, sp: 0.06, key: i === 2 });
      });
    },

    // tu idea y tú, separados por distancia
    distance(p) {
      p.disc(-0.62, -0.1, 0.18, DOT);
      p.disc(0.62, -0.1, 0.1, Object.assign({ key: true }, DOT));
      p.line(-0.62, 0.34, 0.62, 0.34, LINE).line(-0.62, 0.24, -0.62, 0.44, LINE).line(0.62, 0.24, 0.62, 0.44, LINE);
    },

    // tres páginas escritas de un tirón
    pages(p) {
      for (let pg = 0; pg < 3; pg++) {
        const x0 = -0.78 + pg * 0.56;
        p.rect(x0, -0.6, 0.44, 1.2, { s: 1.4, sp: 0.075 });
        [-0.36, -0.14, 0.08, 0.3].forEach((y, k) => {
          const len = k === 3 ? 0.16 : 0.3;
          p.line(x0 + 0.07, y, x0 + 0.07 + len, y, { s: 2, sp: 0.075, key: pg === 2 && k === 3 });
        });
      }
    },

    // dejar el problema a un lado y pasar a algo distinto
    context(p) {
      p.fill(-0.8, -0.26, 0.5, 0.5, { s: 1.5, sp: 0.1 });
      p.disc(0.44, 0, 0.3, Object.assign({ key: true }, DOT));
    },

    // de noche la mente une puntos que de día no veías
    sleep(p) {
      const s = 0.065;
      for (let x = -0.9; x <= 0.2; x += s) {
        for (let y = -0.75; y <= 0.55; y += s) {
          const inA = Math.hypot(x + 0.28, y + 0.1) < 0.52;
          const inB = Math.hypot(x + 0.06, y + 0.3) < 0.44;
          if (inA && !inB) p.dot(x, y, { s: 2 });
        }
      }
      const stars = [[0.46, -0.5], [0.72, -0.08], [0.42, 0.34]];
      p.line(...stars[0], ...stars[1], LINE).line(...stars[1], ...stars[2], LINE);
      stars.forEach(([x, y]) => p.dot(x, y, { key: true, s: 4 }));
    },

    /* ---------- Iluminación ---------- */

    // del problema brotan ideas en todas direcciones
    brainstorm(p) {
      p.disc(0, 0, 0.12, Object.assign({ key: true }, DOT));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const L = i % 2 ? 0.62 : 0.8;
        p.line(...at(a, 0.24), ...at(a, L - 0.1), LINE);
        p.dot(...at(a, L), { s: 3.2 });
      }
    },

    // seis personas con tres ideas cada una
    brainwriting(p) {
      for (let k = 0; k < 6; k++) {
        const a = -PI / 2 + (k * PI) / 3;
        [0.76, 0.56, 0.36].forEach((r) => p.dot(...at(a, r), { s: 3.2, key: k === 0 }));
      }
    },

    // una idea vista desde seis perspectivas; empieza por tres
    hats(p) {
      p.disc(0, 0, 0.14, DOT);
      for (let k = 0; k < 6; k++) {
        const a = -PI / 2 + (k * PI) / 3;
        p.disc(...at(a, 0.64), 0.12, Object.assign({ key: k < 3 }, DOT));
      }
    },

    // una idea de partida y tres variaciones
    scamperVariations(p) {
      p.disc(-0.62, 0, 0.16, DOT);
      [[0.5, -0.56], [0.5, 0], [0.5, 0.56]].forEach(([x, y]) => p.line(-0.4, y * 0.35, x - 0.2, y, LINE));
      const k = Object.assign({ key: true }, DOT);
      p.disc(0.48, -0.56, 0.09, k).disc(0.66, -0.56, 0.09, k);
      p.fill(0.44, -0.12, 0.24, 0.24, { key: true, s: 2, sp: 0.08 });
      p.disc(0.56, 0.56, 0.13, k);
    },

    // ideas escritas por separado, sin nombre, que se votan
    nominal(p) {
      const votes = [1, 0, 3, 1, 0];
      [-0.72, -0.36, 0, 0.36, 0.72].forEach((x, i) => {
        p.rect(x - 0.12, -0.66, 0.24, 0.3, { s: 1.4, sp: 0.06 });
        for (let v = 0; v < votes[i]; v++) p.dot(x, 0.5 - v * 0.2, { s: 3.4, key: votes[i] === 3 });
      });
      p.line(-0.86, 0.68, 0.86, 0.68, LINE);
    },

    // un centro con ocho ideas alrededor; una de ellas abre otra flor
    lotus(p) {
      p.disc(0, 0, 0.13, Object.assign({ key: true }, DOT));
      for (let gx = -1; gx <= 1; gx++) {
        for (let gy = -1; gy <= 1; gy++) {
          if (!gx && !gy) continue;
          const bloom = gx === 1 && gy === -1;
          p.dot(gx * 0.52, gy * 0.52, { s: bloom ? 4.4 : 3.4, key: bloom });
          if (bloom) for (let k = 0; k < 8; k++) p.dot(0.52 + Math.cos((k / 8) * TAU) * 0.2, -0.52 + Math.sin((k / 8) * TAU) * 0.2, { s: 1.8, key: true });
        }
      }
    },

    // tu reto y tres cosas que no tienen nada que ver
    randomStimuli(p) {
      p.disc(0, 0.04, 0.12, Object.assign({ key: true }, DOT));
      p.rect(-0.8, -0.72, 0.3, 0.3, { s: 1.8, sp: 0.07 });
      p.ring(0.64, -0.56, 0.16, { s: 1.8, sp: 0.07 });
      p.line(-0.16, 0.86, 0.16, 0.86, { s: 1.8, sp: 0.07 }).line(0.16, 0.86, 0, 0.58, { s: 1.8, sp: 0.07 }).line(0, 0.58, -0.16, 0.86, { s: 1.8, sp: 0.07 });
      p.line(-0.46, -0.4, -0.18, -0.12, LINE).line(0.48, -0.42, 0.18, -0.1, LINE).line(0, 0.48, 0, 0.26, LINE);
    },

    // el objetivo arriba, los recursos abajo y un camino que los une
    brainswarm(p) {
      p.disc(0, -0.72, 0.11, Object.assign({ key: true }, DOT));
      const subs = [[-0.42, -0.02], [0.42, -0.02]];
      subs.forEach(([x, y], i) => {
        p.dot(x, y, { s: 4, key: i === 1 });
        p.line(x * 0.8, y - 0.14, x * 0.2, -0.6, Object.assign({}, LINE, { key: i === 1 }));
      });
      [-0.76, -0.38, 0, 0.38, 0.76].forEach((x, i) => {
        p.dot(x, 0.74, { s: 3.4, key: i === 3 });
        if (i !== 2) {
          const [sx] = subs[x < 0 ? 0 : 1];
          p.line(x + (sx - x) * 0.15, 0.62, x + (sx - x) * 0.85, 0.12, Object.assign({}, LINE, { key: i === 3 }));
        }
      });
    },

    // un folio doblado en ocho, una idea por recuadro
    crazy8(p) {
      p.rect(-0.86, -0.52, 1.72, 1.04, { s: 1.8, sp: 0.08 });
      p.line(-0.86, 0, 0.86, 0, LINE);
      [-0.43, 0, 0.43].forEach((x) => p.line(x, -0.52, x, 0.52, LINE));
      [-0.645, -0.215, 0.215, 0.645].forEach((x, c) => {
        [-0.26, 0.26].forEach((y, r) => {
          if (c === 2 && r === 1) p.disc(x, y, 0.08, Object.assign({ key: true }, DOT));
          else p.dot(x, y, { s: 2.8 });
        });
      });
    },

    // ideas terribles... y una aprovechable entre ellas
    worstIdea(p) {
      [-0.72, -0.36, 0, 0.36, 0.72].forEach((x, i) => {
        if (i === 3) { p.disc(x, 0, 0.1, Object.assign({ key: true }, DOT)); return; }
        const h = 0.11;
        p.line(x - h, -h, x + h, h, { s: 2, sp: 0.055 }).line(x - h, h, x + h, -h, { s: 2, sp: 0.055 });
      });
    },

    /* ---------- Implementación ---------- */

    // una pantalla bocetada rápido
    sprint(p) {
      p.rect(-0.36, -0.8, 0.72, 1.6, { s: 1.8, sp: 0.08 });
      p.line(-0.22, -0.4, 0.22, -0.4, LINE).line(-0.22, -0.2, 0.1, -0.2, LINE);
      p.fill(-0.22, 0.4, 0.44, 0.16, { key: true, s: 2.2, sp: 0.08 });
    },

    // viñetas: alguien vive la idea de principio a fin
    storyboard(p) {
      for (let k = 0; k < 3; k++) {
        const x0 = -0.86 + k * 0.6;
        p.rect(x0, -0.28, 0.52, 0.56, { s: 1.4, sp: 0.075 });
        p.disc(x0 + 0.12 + k * 0.14, 0, 0.07, Object.assign({ key: k === 2 }, DOT));
      }
    },

    // empieza por la versión más pequeña
    mvp(p) {
      p.rect(-0.76, -0.76, 1.52, 1.52, { s: 1.4, sp: 0.1 });
      p.fill(-0.76, 0.28, 0.48, 0.48, { key: true, s: 2.4, sp: 0.08 });
    },

    // tres críticas sobre el trabajo
    critique(p) {
      p.rect(-0.34, -0.34, 0.68, 0.68, { s: 2, sp: 0.075 });
      [[0, -0.8, 0, -0.44], [0.8, 0.2, 0.44, 0.2], [-0.8, 0.2, -0.44, 0.2]].forEach(([x, y, tx, ty]) => {
        p.line(x, y, tx, ty, LINE);
        p.disc(x, y, 0.08, Object.assign({ key: true }, DOT));
      });
    },

    // una persona real usa tu prototipo, vuelta tras vuelta
    userTest(p) {
      p.person(0, 0.02, 1, {});
      p.ring(0, 0, 0.66, { s: 1.6, sp: 0.075 });
      p.disc(...at(-PI / 4, 0.66), 0.11, Object.assign({ key: true }, DOT));
    },
  };

  // la geometría sólo depende de fase, técnica y semilla: la tarjeta y la ficha la comparten
  const GEOMETRY = new Map();
  function geometry(motif, art, seed) {
    const key = motif + '|' + art + '|' + seed;
    let g = GEOMETRY.get(key);
    if (g) return g;
    const r = rng(seed);
    const field = (FIELDS[motif] || FIELDS.preparacion)(r);
    const pen = Pen();
    if (FIGURES[art]) FIGURES[art](pen, r);
    const fig = pen.pts;
    // el pictograma se dibuja en orden, como un trazo; el fondo se aparta a su alrededor
    fig.forEach((q, i) => { q.d = 0.3 + (i / Math.max(1, fig.length - 1)) * 0.7; });
    const bg = fig.length
      ? field.filter((q) => !fig.some((f) => Math.abs(f.x - q.x) < 0.075 && Math.abs(f.y - q.y) < 0.075))
      : field;
    g = { fig, bg };
    GEOMETRY.set(key, g);
    return g;
  }

  JOY.dotArt = (canvas, opts) => {
    const o = opts || {};
    const { fig, bg } = geometry(o.motif, o.art, o.seed || 1);

    const ctx = canvas.getContext('2d');
    const state = { t: o.start == null ? 1 : o.start, mix: 0 };
    // lupa: posición suavizada (lx, ly) hacia el puntero (tx, ty) y fuerza 0..1
    const lens = { on: false, tx: 0, ty: 0, lx: 0, ly: 0, k: 0 };
    const LENS_R = 0.42;
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return false;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    // desplazamiento y aumento de un punto por la lupa
    function magnify(x, y) {
      if (lens.k < 0.001) return [x, y, 1];
      const dx = x - lens.lx;
      const dy = y - lens.ly;
      const d = Math.hypot(dx, dy);
      if (d >= LENS_R) return [x, y, 1];
      const f = Math.pow(1 - d / LENS_R, 2) * lens.k;
      const push = f * 0.12 / Math.max(d, 0.02);
      return [x + dx * push, y + dy * push, 1 + f * 1.4];
    }

    function draw() {
      if (!w && !resize()) return;
      ctx.clearRect(0, 0, w, h);
      const unit = Math.min(w, h) / 2;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.max(0.65, unit * 0.0085);
      const t = state.t;
      const m = state.mix;
      // fondo: gris tenue, que vira a cobalto cuando la técnica está activa
      const fr = Math.round(11 - 1 * m);
      const fg = Math.round(11 + 59 * m);
      const fb = Math.round(13 + 242 * m);
      const fa = 0.26 + 0.08 * m;
      for (let i = 0; i < bg.length; i++) {
        const q = bg[i];
        const l = easeOut(clamp01((t - q.d * 0.6) / 0.4));
        if (l <= 0) continue;
        ctx.fillStyle = 'rgba(' + fr + ',' + fg + ',' + fb + ',' + (fa * l).toFixed(3) + ')';
        const g = magnify(q.fx + (q.x - q.fx) * l, q.fy + (q.y - q.fy) * l);
        ctx.beginPath();
        ctx.arc(cx + g[0] * unit, cy + g[1] * unit, base * g[2], 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < fig.length; i++) {
        const q = fig[i];
        const l = easeOut(clamp01((t - q.d * 0.75) / 0.25));
        if (l <= 0) continue;
        const g = magnify(q.x, q.y);
        ctx.fillStyle = q.key ? 'rgba(10,70,255,' + l + ')' : 'rgba(11,11,13,' + (0.9 * l).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(cx + g[0] * unit, cy + g[1] * unit, base * q.s * (0.4 + 0.6 * l) * g[2], 0, TAU);
        ctx.fill();
        // los puntos clave bajo la lupa se encienden con un halo
        if (q.key && g[2] > 1.05) {
          ctx.fillStyle = 'rgba(125,183,255,' + ((g[2] - 1) * 0.35 * l).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(cx + g[0] * unit, cy + g[1] * unit, base * q.s * g[2] * 1.9, 0, TAU);
          ctx.fill();
        }
      }
    }

    // el observer ya avisa una vez al empezar a observar: no hace falta otro primer dibujo
    let ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => { if (resize()) draw(); });
      ro.observe(canvas);
    } else {
      requestAnimationFrame(() => { resize(); draw(); });
    }

    const hasGsap = typeof gsap !== 'undefined';
    let raf = 0;

    if (o.interactive && !(JOY.reducedMotion && JOY.reducedMotion())) {
      const tick = () => {
        raf = 0;
        lens.lx += (lens.tx - lens.lx) * 0.18;
        lens.ly += (lens.ty - lens.ly) * 0.18;
        lens.k += ((lens.on ? 1 : 0) - lens.k) * 0.12;
        draw();
        const moving = Math.abs(lens.tx - lens.lx) + Math.abs(lens.ty - lens.ly) > 0.001;
        if (lens.on ? moving || lens.k < 0.99 : lens.k > 0.002) raf = requestAnimationFrame(tick);
        else if (!lens.on) { lens.k = 0; draw(); }
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        const unit = Math.min(r.width, r.height) / 2;
        return [(e.clientX - r.left - r.width / 2) / unit, (e.clientY - r.top - r.height / 2) / unit];
      };
      canvas.addEventListener('pointerenter', (e) => {
        [lens.tx, lens.ty] = toLocal(e);
        if (!lens.on && lens.k < 0.01) { lens.lx = lens.tx; lens.ly = lens.ty; }
        lens.on = true;
        kick();
      });
      canvas.addEventListener('pointermove', (e) => { [lens.tx, lens.ty] = toLocal(e); lens.on = true; kick(); });
      canvas.addEventListener('pointerleave', () => { lens.on = false; kick(); });
      canvas.addEventListener('pointercancel', () => { lens.on = false; kick(); });
      canvas.style.cursor = 'crosshair';
      canvas.style.touchAction = 'pan-y';
    }

    return {
      set(t) { state.t = t; draw(); },
      play(p) {
        const q = p || {};
        if (!hasGsap || (JOY.motionOK && !JOY.motionOK())) { state.t = 1; draw(); return; }
        gsap.killTweensOf(state, 't');
        state.t = q.from == null ? 0 : q.from;
        draw();
        gsap.to(state, { t: 1, duration: q.duration || 1.4, delay: q.delay || 0, ease: 'none', onUpdate: draw });
      },
      accent(on) {
        const to = on ? 1 : 0;
        if (!hasGsap) { state.mix = to; draw(); return; }
        gsap.to(state, { mix: to, duration: 0.35, ease: 'power2.out', overwrite: 'auto', onUpdate: draw });
      },
      // suelta el observer, la lupa y los tweens (antes de tirar el canvas)
      destroy() {
        if (ro) ro.disconnect();
        if (raf) cancelAnimationFrame(raf);
        if (hasGsap) gsap.killTweensOf(state);
      },
    };
  };
})();
