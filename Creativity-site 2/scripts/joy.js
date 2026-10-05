/* joy.js — interacciones globales: magnetismo, etiqueta de cursor, gotas líquidas
   de fondo del inicio, titulares, dado 3D, destellos al hacer clic y un huevo de
   pascua ("eureka").
   Expone helpers en window.JOY para el resto de scripts. */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGsap = typeof gsap !== 'undefined';

  JOY.reducedMotion = () => reduced.matches;
  JOY.finePointer = () => finePointer.matches;
  JOY.motionOK = () => hasGsap && !reduced.matches;
  JOY.sfx = JOY.sfx || (() => {});
  JOY.buzz = JOY.buzz || (() => {});

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  JOY.rand = rand;
  JOY.pick = pick;

  /* ---------------- confeti ----------------
     Envoltorio de canvas-confetti con los colores de marca; x/y en píxeles de pantalla. */
  JOY.burst = (x, y, opts) => {
    if (typeof confetti !== 'function' || reduced.matches) return;
    confetti(Object.assign({
      particleCount: 60, spread: 75, startVelocity: 30, gravity: 1.1, ticks: 130, scalar: 0.9,
      colors: ['#0A46FF', '#7DB7FF', '#F7F8FA', '#0B0B0D'],
      disableForReducedMotion: true, zIndex: 60,
    }, opts || {}, { origin: { x: x / window.innerWidth, y: y / window.innerHeight } }));
  };
  JOY.burstFrom = (el, opts) => {
    const r = el.getBoundingClientRect();
    JOY.burst(r.left + r.width / 2, r.top + 20, opts);
  };

  /* ---------------- magnetismo ----------------
     Los elementos [data-magnetic] se acercan al cursor dentro de un radio y
     vuelven con un muelle al salir. */
  const magnets = [];
  function initMagnetic(scope) {
    if (!hasGsap || !finePointer.matches || reduced.matches) return;
    (scope || document).querySelectorAll('[data-magnetic]:not([data-magnetic-ready])').forEach((el) => {
      el.setAttribute('data-magnetic-ready', '');
      magnets.push({
        el,
        scene: el.closest('.scene'),
        strength: parseFloat(el.dataset.magnetic) || 0.35,
        active: false,
        xTo: gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' }),
        yTo: gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' }),
      });
    });
  }
  JOY.initMagnetic = initMagnetic;

  // un solo repaso por fotograma, y sólo con los imanes de la escena visible
  // (las escenas ocultas siguen maquetadas en la misma zona de la pantalla)
  let magnetPoint = null;
  let magnetRaf = 0;
  function onMagnetMove(e) {
    magnetPoint = { x: e.clientX, y: e.clientY };
    if (!magnetRaf) magnetRaf = requestAnimationFrame(runMagnets);
  }
  function runMagnets() {
    magnetRaf = 0;
    const e = { clientX: magnetPoint.x, clientY: magnetPoint.y };
    for (let i = magnets.length - 1; i >= 0; i--) {
      const m = magnets[i];
      if (!m.el.isConnected) { magnets.splice(i, 1); continue; }
      if (m.scene && !m.scene.classList.contains('is-active')) {
        if (m.active) { m.active = false; m.xTo(0); m.yTo(0); }
        continue;
      }
      const r = m.el.getBoundingClientRect();
      if (!r.width) continue;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const pad = 36;
      const inside = Math.abs(dx) < r.width / 2 + pad && Math.abs(dy) < r.height / 2 + pad;
      if (inside) {
        m.active = true;
        m.xTo(dx * m.strength);
        m.yTo(dy * m.strength);
      } else if (m.active) {
        m.active = false;
        gsap.to(m.el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      }
    }
  }

  /* ---------------- etiqueta de cursor ----------------
     Sigue al ratón y muestra el texto de data-cursor del elemento bajo él. */
  function initCursorLabel() {
    const label = document.querySelector('.cursor-label');
    if (!label || !hasGsap || !finePointer.matches) {
      JOY.setCursorLabel = () => {};
      JOY.refreshCursorLabel = () => {};
      return;
    }
    const xTo = gsap.quickTo(label, 'x', { duration: 0.22, ease: 'power3.out' });
    const yTo = gsap.quickTo(label, 'y', { duration: 0.22, ease: 'power3.out' });
    let current = null;
    let override = null;

    const show = (text) => { label.textContent = text; label.classList.add('is-on'); };
    const hide = () => label.classList.remove('is-on');

    document.addEventListener('mousemove', (e) => { xTo(e.clientX + 18); yTo(e.clientY + 20); }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (el === current) return;
      current = el;
      if (override) return;
      if (el) show(el.dataset.cursor); else hide();
    });
    document.addEventListener('mouseleave', () => { if (!override) hide(); });

    JOY.setCursorLabel = (text) => {
      override = text || null;
      if (text) show(text);
      else if (current && current.isConnected) show(current.dataset.cursor);
      else hide();
    };
    JOY.refreshCursorLabel = () => {
      if (override) return;
      if (current && current.isConnected && current.dataset.cursor) show(current.dataset.cursor); else hide();
    };
  }

  /* ---------------- dado 3D ----------------
     Un cubo CSS con puntos. rollDice lo hace dar vueltas hasta caer en una cara al azar. */
  const PIPS = { 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
  // cómo está colocada cada cara en el cubo, y por tanto qué giro la pone de frente
  const FACE_POSE = { 1: [0, 0], 2: [0, 90], 3: [0, 180], 4: [0, -90], 5: [90, 0], 6: [-90, 0] };
  JOY.makeDice = (size) => {
    const d = document.createElement('span');
    d.className = 'dice3d';
    d.setAttribute('aria-hidden', 'true');
    if (size) d.style.setProperty('--size', size + 'px');
    let faces = '';
    for (let f = 1; f <= 6; f++) {
      const [rx, ry] = FACE_POSE[f];
      faces += '<span class="dice3d__face" style="transform: rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(calc(var(--size) / 2))">' +
        PIPS[f].map((p) => '<i class="pip pip--' + p + '"></i>').join('') + '</span>';
    }
    d.innerHTML = '<span class="dice3d__tilt"><span class="dice3d__cube">' + faces + '</span></span>';
    d._rot = { x: 0, y: 0 };
    return d;
  };
  JOY.rollDice = (d, duration) => {
    if (!d || !hasGsap || reduced.matches) return;
    const cube = d.querySelector('.dice3d__cube');
    const face = 1 + Math.floor(Math.random() * 6);
    const [rx, ry] = FACE_POSE[face];
    const turn = (from, target, spins) => {
      // siguiente ángulo equivalente a target, con varias vueltas completas más
      const base = Math.ceil((from + spins * 360 - target) / 360) * 360 + target;
      return base;
    };
    d._rot.x = turn(d._rot.x, -rx, 2);
    d._rot.y = turn(d._rot.y, -ry, 1 + Math.round(Math.random()));
    gsap.to(cube, { rotationX: d._rot.x, rotationY: d._rot.y, duration: duration || 0.9, ease: 'back.out(1.1)' });
    gsap.fromTo(d, { y: 0 }, { y: -14, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
  };

  /* ---------------- titulares ----------------
     [data-split="section"]: las palabras suben cada vez que se entra en su escena. */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  // el titular del inicio no espera a la fuente más de un momento: mejor verlo ya que tarde
  const fontsOrSoon = Promise.race([fontsReady, new Promise((ok) => setTimeout(ok, 400))]);
  function revealTitle(el) {
    if (!hasGsap || typeof SplitText === 'undefined' || reduced.matches) return;
    // SplitText debe medir con la fuente final
    if (document.fonts && document.fonts.status !== 'loaded') { fontsReady.then(() => revealTitle(el)); return; }
    if (!el._split) {
      el._split = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'split-word', aria: 'auto' });
    }
    gsap.fromTo(el._split.words, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.75, ease: 'power4.out', stagger: 0.07, overwrite: true });
  }
  JOY.revealTitle = revealTitle;

  /* ---------------- titular del inicio ----------------
     Las letras reaccionan al puntero con HoverText (scripts/hover-text.js).
     Aquí sólo va la entrada propia del sitio: las palabras suben y
     "CREA SIN BLOQUEOS" aparece tapado por bloques que se agrietan y caen. */
  /* ---------------- botón "Dame un reto" del dock de navegación ----------------
     Mismo dado 3D que usan los botones de "tirar el dado" en las fases,
     para que se lea como el mismo gesto en todo el sitio. */
  function initHeroRetoButton() {
    const btn = document.querySelector('.journey-dock__reto');
    if (!btn || !JOY.makeDice) return;
    const dice = JOY.makeDice(20);
    btn.prepend(dice);
  }

  function initHeroHeadline() {
    const h1 = document.querySelector('[data-split="hero"]');
    if (!h1 || !window.HoverText) return null;
    // el texto accesible queda en el h1; las letras visibles son aria-hidden
    const said = h1.textContent.replace(/\s+/g, ' ').trim();
    h1.innerHTML = '<span class="visually-hidden">' + said + '</span><span class="hero__hover"></span>';
    const ht = window.HoverText.mount(h1.querySelector('.hero__hover'), {
      lines: [['PIENSA', 'DISTINTO.'], ['CREA', 'SIN', 'BLOQUEOS.']],
      lineClasses: [null, 'hero__headline-accent'],
    });
    if (!hasGsap || reduced.matches) return null;

    const words = ht.words();
    const accent = h1.querySelector('.hero__headline-accent');
    const accentWords = words.filter((w) => accent && accent.contains(w));
    gsap.set(words, { opacity: 0 });

    function bricks(delay) {
      const box = h1.getBoundingClientRect();
      const layer = document.createElement('span');
      layer.className = 'brick-layer';
      layer.setAttribute('aria-hidden', 'true');
      const els = [];
      accentWords.forEach((w) => {
        const r = w.getBoundingClientRect();
        const rows = 2;
        const cols = Math.max(2, Math.round(r.width / 48));
        for (let row = 0; row < rows; row++) {
          // hilada alterna desplazada media pieza, como un muro de verdad
          const off = row % 2 ? 0.5 : 0;
          for (let c = -off; c < cols; c++) {
            const x0 = Math.max(0, c) * (r.width / cols);
            const x1 = Math.min(cols, c + 1) * (r.width / cols);
            if (x1 - x0 < 4) continue;
            const b = document.createElement('span');
            b.className = 'brick';
            b.style.left = (r.left - box.left + x0 - 2) + 'px';
            b.style.top = (r.top - box.top + row * (r.height / rows) - 2) + 'px';
            b.style.width = (x1 - x0 + 3) + 'px';
            b.style.height = (r.height / rows + 3) + 'px';
            layer.appendChild(b);
            els.push(b);
          }
        }
      });
      h1.appendChild(layer);
      return gsap.timeline({ delay: delay || 0, onComplete: () => layer.remove() })
        .from(els, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(2)', stagger: { each: 0.015, from: 'random' } })
        .to(els, { x: () => rand(-2.5, 2.5), duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }, '+=0.35')
        .add(() => { JOY.sfx('clack'); })
        .to(els, {
          y: () => rand(220, 520), x: () => rand(-90, 90), rotation: () => rand(-120, 120), opacity: 0,
          duration: () => rand(0.7, 1.1), ease: 'power2.in', stagger: { each: 0.02, from: 'random' },
        });
    }

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      fontsOrSoon.then(() => {
        // los bloques se colocan donde quedarán las palabras (medimos antes de moverlas)
        const b = bricks(0.35);
        // clearProps: sin transform en la palabra, así las letras sostenidas se ven nítidas
        gsap.timeline({ delay: 0.15 })
          .fromTo(words, { y: 50, opacity: 0, rotation: () => rand(-6, 6) },
            { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07, clearProps: 'transform,opacity' })
          .add(b, 0.2);
      });
    };

    if (accent) {
      accent.addEventListener('click', () => { if (!h1.querySelector('.brick-layer')) bricks(0); });
    }
    return play;
  }

  /* ---------------- gotas líquidas de fondo ----------------
     Los mismos círculos grandes del diseño original, ahora líquidos (liquid.js):
     derivan despacio, se estiran un cuello al acercarse, se inclinan hacia el
     cursor y se pueden lanzar. Son decoración: quedan detrás del texto.
     Sin WebGL (o con movimiento reducido) se quedan los círculos difuminados. */
  function initHeroBlobs() {
    const hero = document.querySelector('.hero');
    const motif = hero && hero.querySelector('.hero__motif');
    if (!hero || !motif || !hasGsap || reduced.matches || !JOY.createLiquid) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero__liquid';
    // las gotas son suaves: a 0.75 px por px CSS no se nota y el shader trabaja mucho menos
    const liquid = JOY.createLiquid(canvas, { alpha: 0.62, soft: 0.14, maxScale: 0.75 });
    if (!liquid) return;
    motif.innerHTML = '';
    motif.classList.add('is-liquid');
    motif.appendChild(canvas);

    // [x, y] del centro (fracción de la escena), diámetro (fracción del ancho, mín., máx.), tono 0 cielo … 1 cobalto
    const WIDE = [
      [0.86, 0.26, 0.32, 260, 440, 0],
      [0.74, 0.8, 0.2, 180, 300, 1],
      [0.03, 0.36, 0.28, 230, 400, 0],
      [0.22, 0.94, 0.12, 120, 190, 1],
    ];
    const NARROW = [
      [0.92, 0.1, 0.62, 180, 300, 0],
      [0.06, 0.9, 0.5, 150, 260, 1],
      [0.02, 0.36, 0.42, 130, 220, 0],
      [0.9, 0.8, 0.3, 100, 160, 1],
    ];
    let W = 0;
    let H = 0;
    const blobs = WIDE.map((s, i) => ({
      tone: s[5], px: 0, py: 0, vx: 0, vy: 0, homeX: 0, homeY: 0, r: 100, k: 0, hover: 1,
      phase: i * 1.9, freq: 0.11 + (i % 3) * 0.025, ampX: 0, ampY: 0, pull: null, pullAmt: 0,
      jiggle: 0, stretch: 0, angle: 0, grabbed: false, offX: 0, offY: 0, pointerX: 0, pointerY: 0,
      el: null,
    }));

    function layout() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      const specs = W < 700 ? NARROW : WIDE;
      blobs.forEach((b, i) => {
        const s = specs[i];
        b.homeX = s[0] * W;
        b.homeY = s[1] * H;
        b.r = gsap.utils.clamp(s[3], s[4], s[2] * W) / 2;
        b.ampX = b.r * 0.22;
        b.ampY = b.r * 0.26;
        if (!b.px) { b.px = b.homeX; b.py = b.homeY; }
        if (b.el) b.el.style.width = b.el.style.height = b.r * 2 + 'px';
      });
      liquid.resize(W, H);
    }

    let box = hero.getBoundingClientRect();
    const rel = (e) => ({ x: e.clientX - box.left, y: e.clientY - box.top });
    let cursor = null;

    // cada gota tiene un área invisible para agarrarla
    blobs.forEach((b) => {
      const el = document.createElement('span');
      el.className = 'hero-blob';
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-journey-ignore', '');
      motif.appendChild(el);
      b.el = el;
      el.addEventListener('pointerenter', () => { gsap.to(b, { hover: 1.04, duration: 1.4, ease: 'sine.inOut', overwrite: 'auto' }); b.jiggle += 0.03; });
      el.addEventListener('pointerleave', () => { gsap.to(b, { hover: 1, duration: 1.6, ease: 'sine.inOut', overwrite: 'auto' }); });
      el.addEventListener('pointerdown', (e) => {
        box = hero.getBoundingClientRect();
        const p = rel(e);
        b.grabbed = true;
        b.offX = p.x - b.px; b.offY = p.y - b.py;
        b.pointerX = p.x; b.pointerY = p.y;
        b.jiggle += 0.08;
        el.classList.add('is-grabbed');
        gsap.to(b, { hover: 0.95, duration: 0.15, ease: 'power2.out' });
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* puntero ya liberado */ }
        e.preventDefault();
      });
      el.addEventListener('pointermove', (e) => {
        if (!b.grabbed) return;
        const p = rel(e);
        b.pointerX = p.x; b.pointerY = p.y;
      });
      const release = () => {
        if (!b.grabbed) return;
        b.grabbed = false;
        el.classList.remove('is-grabbed');
        b.vx = gsap.utils.clamp(-30, 30, b.vx * 0.9);
        b.vy = gsap.utils.clamp(-30, 30, b.vy * 0.9);
        b.jiggle += Math.min(0.1, Math.hypot(b.vx, b.vy) * 0.004);
        gsap.to(b, { hover: 1, duration: 1.4, ease: 'elastic.out(1, 0.6)' });
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
    });

    if (finePointer.matches) {
      hero.addEventListener('pointermove', (e) => { cursor = rel(e); });
      hero.addEventListener('pointerleave', () => { cursor = null; });
    }
    // con el inicio oculto no hace falta: enter() vuelve a medir
    let active = true;
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (!active || resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; box = hero.getBoundingClientRect(); layout(); });
    });
    layout();

    const balls = [];
    gsap.ticker.add((time, deltaTime) => {
      if (!active) return;
      const k = gsap.utils.clamp(0.5, 2, deltaTime / 16.7);
      blobs.forEach((b) => {
        if (b.grabbed) {
          const tx = b.pointerX - b.offX;
          const ty = b.pointerY - b.offY;
          b.vx = (tx - b.px) / k; b.vy = (ty - b.py) / k;
          b.px = tx; b.py = ty;
          return;
        }
        // deriva lenta: dos ondas de periodos distintos para que el camino no se repita
        let tx = b.homeX + Math.sin(time * b.freq + b.phase) * b.ampX + Math.sin(time * b.freq * 0.43 + b.phase * 1.3) * b.ampX * 0.5;
        let ty = b.homeY + Math.cos(time * b.freq * 0.8 + b.phase) * b.ampY + Math.cos(time * b.freq * 0.37 + b.phase * 0.7) * b.ampY * 0.5;
        // se inclinan un poco hacia el cursor cuando pasa cerca
        if (cursor) {
          const dx = cursor.x - b.px;
          const dy = cursor.y - b.py;
          const d = Math.hypot(dx, dy);
          const reach = b.r * 2.2;
          if (d < reach) { const f = (1 - d / reach) * 0.12; tx += dx * f; ty += dy * f; }
        }
        // "beso": dos gotas se buscan hasta tender un cuello entre ellas
        if (b.pull) { tx += (b.pull.px - b.px) * b.pullAmt; ty += (b.pull.py - b.py) * b.pullAmt; }
        b.vx += (tx - b.px) * 0.0022 * k;
        b.vy += (ty - b.py) * 0.0022 * k;
        blobs.forEach((o) => {
          if (o === b || b.pull === o) return;
          const dx = b.px - o.px;
          const dy = b.py - o.py;
          const d = Math.hypot(dx, dy) || 1;
          const min = (b.r + o.r) * 0.9;
          if (d < min) {
            const f = ((min - d) / min) * 0.12 * k;
            b.vx += (dx / d) * f;
            b.vy += (dy / d) * f;
          }
        });
        b.vx *= Math.pow(0.955, k);
        b.vy *= Math.pow(0.955, k);
        b.px += b.vx * k;
        b.py += b.vy * k;
        const m = b.r * 0.2;
        const hit = (v) => { b.jiggle += Math.min(0.06, Math.abs(v) * 0.006); };
        if (b.px < m) { hit(b.vx); b.px = m; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.px > W - m) { hit(b.vx); b.px = W - m; b.vx = -Math.abs(b.vx) * 0.6; }
        if (b.py < m) { hit(b.vy); b.py = m; b.vy = Math.abs(b.vy) * 0.6; }
        if (b.py > H - m) { hit(b.vy); b.py = H - m; b.vy = -Math.abs(b.vy) * 0.6; }
      });

      balls.length = 0;
      blobs.forEach((b) => {
        const speed = Math.hypot(b.vx, b.vy);
        b.stretch += (Math.min(speed * 0.008, 0.25) - b.stretch) * 0.08;
        if (speed > 0.5) {
          const diff = Math.atan2(Math.sin(Math.atan2(b.vy, b.vx) - b.angle), Math.cos(Math.atan2(b.vy, b.vx) - b.angle));
          b.angle += diff * 0.08;
        }
        b.jiggle *= Math.pow(0.985, k);
        const breathe = 1 + Math.sin(time * 0.45 + b.phase * 2) * 0.03;
        const rr = b.r * b.k * b.hover * breathe;
        balls.push({ x: b.px, y: b.py, r: rr, tone: b.tone, angle: b.angle, stretch: b.stretch, wobble: 0.055 + Math.min(b.jiggle, 0.2), phase: b.phase });
        gsap.set(b.el, { x: b.px - b.r, y: b.py - b.r, scale: Math.max(0.001, b.k * b.hover) });
      });
      liquid.render(balls, time * 0.5);
    });

    /* -------- movimiento propio: avisa de que se pueden tocar -------- */
    const grabbing = () => blobs.some((b) => b.grabbed);
    let beat = 0;
    function idle() {
      if (active && !grabbing()) {
        // las dos gotas más cercanas se buscan despacio, se tocan y se vuelven a separar
        let best = null;
        blobs.forEach((x, i) => blobs.slice(i + 1).forEach((c) => {
          const d = Math.hypot(x.px - c.px, x.py - c.py) - x.r - c.r;
          if (!best || d < best.d) best = { a: x, c, d };
        }));
        if (best) {
          const pair = [best.a, best.c];
          best.a.pull = best.c; best.c.pull = best.a;
          gsap.timeline({ onComplete: () => pair.forEach((x) => { x.pull = null; }) })
            .to(pair, { pullAmt: 0.38, duration: 3.2, ease: 'sine.inOut' })
            .to(pair, { pullAmt: 0, duration: 3.6, ease: 'sine.inOut' }, '+=0.8')
            .add(() => pair.forEach((x) => { x.jiggle += 0.06; }), '-=3.4');
        }
      }
      gsap.delayedCall(rand(9, 13), idle);
    }

    let born = false;
    const intro = () => {
      if (born) return;
      born = true;
      blobs.forEach((b, i) => {
        gsap.fromTo(b, { k: 0 }, { k: 1, duration: 2.4, delay: 0.2 + i * 0.18, ease: 'power3.out' });
        gsap.delayedCall(0.3 + i * 0.18, () => { b.jiggle += 0.08; });
      });
      gsap.delayedCall(4, idle);
    };

    // sólo animamos mientras el inicio está en pantalla
    if (window.JOURNEY && window.JOURNEY.register) {
      window.JOURNEY.register('inicio', {
        enter: () => { active = true; box = hero.getBoundingClientRect(); layout(); intro(); },
        leave: () => { setTimeout(() => { active = false; }, 900); },
      });
    } else {
      intro();
    }
  }

  /* ---------------- destellos al hacer clic ---------------- */
  function initSparkles() {
    if (!hasGsap || reduced.matches) return;
    const layer = document.createElement('div');
    layer.className = 'sparkle-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || (e.target.closest && e.target.closest('.hero-blob, .carousel__track'))) return;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'sparkle';
        const a = (i / n) * 360 + rand(-12, 12);
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        s.style.rotate = a + 'deg';
        layer.appendChild(s);
        gsap.fromTo(s, { scaleX: 0.2, x: 0, opacity: 1 },
          { scaleX: 1, x: rand(14, 26), opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => s.remove() });
      }
    });
  }

  /* ---------------- huevo de pascua: escribe "eureka" ---------------- */
  function initEureka() {
    let buf = '';
    document.addEventListener('keydown', (e) => {
      if (e.key.length !== 1) return;
      const t = e.target;
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf !== 'eureka') return;
      buf = '';
      JOY.sfx('ding');
      JOY.sfx('spark');
      const flash = document.createElement('div');
      flash.className = 'eureka-flash';
      flash.innerHTML = '<span>💡 ¡Eureka!</span>';
      document.body.appendChild(flash);
      if (hasGsap) {
        gsap.timeline({ onComplete: () => flash.remove() })
          .fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.12 })
          .fromTo(flash.firstChild, { scale: 0.4, rotation: -10 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.5)' }, 0)
          .to(flash, { opacity: 0, duration: 0.6 }, '+=0.7');
      } else {
        setTimeout(() => flash.remove(), 1400);
      }
      if (typeof confetti === 'function' && !reduced.matches) {
        const bulb = confetti.shapeFromText ? confetti.shapeFromText({ text: '💡', scalar: 2 }) : null;
        [0.1, 0.9].forEach((x) => confetti({
          particleCount: 90, angle: x < 0.5 ? 60 : 120, spread: 70, startVelocity: 55, origin: { x, y: 0.9 },
          colors: ['#0A46FF', '#7DB7FF', '#F7F8FA', '#0B0B0D'], zIndex: 300, disableForReducedMotion: true,
        }));
        if (bulb) confetti({ particleCount: 24, spread: 120, startVelocity: 40, scalar: 2, shapes: [bulb], origin: { x: 0.5, y: 0.5 }, zIndex: 300 });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCursorLabel();
    initMagnetic();
    initHeroBlobs();
    initHeroRetoButton();
    const playHero = initHeroHeadline();
    initSparkles();
    initEureka();
    if (finePointer.matches && !reduced.matches) {
      document.addEventListener('mousemove', onMagnetMove, { passive: true });
    }
    if (window.JOURNEY && window.JOURNEY.register) {
      if (playHero) window.JOURNEY.register('inicio', { enter: playHero });
      // los titulares de sección suben cada vez que se entra en su escena
      window.JOURNEY.register('*', {
        enter: ({ scene }) => scene.querySelectorAll('[data-split="section"]').forEach(revealTitle),
      });
    } else if (playHero) {
      playHero();
    }
  });
})();
