/* phases.js — cada fase de Wallas es una escena. El lenguaje visual es el del
   inicio (fondo claro, círculos difuminados cobalto/cielo); la personalidad de
   cada fase está en cómo se mueven: Preparación reúne, Incubación flota despacio,
   Iluminación se enciende e Implementación encaja.
   Dentro de cada escena: una rejilla con las técnicas (ilustradas con dot-art.js),
   un dado que las recorre como una ruleta y la ficha de la técnica elegida. */
(function () {
  const JOY = window.JOY || {};
  const motionOK = () => (JOY.motionOK ? JOY.motionOK() : false);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const hasConfetti = () => typeof confetti === 'function' && !(JOY.reducedMotion && JOY.reducedMotion());
  const BRAND = ['#0A46FF', '#7DB7FF', '#F7F8FA', '#0B0B0D'];

  function confettiFrom(el, opts) {
    if (!hasConfetti()) return;
    const r = el.getBoundingClientRect();
    confetti(Object.assign({
      particleCount: 50, spread: 70, startVelocity: 28, gravity: 1.1, ticks: 130, scalar: 0.9,
      colors: BRAND, disableForReducedMotion: true, zIndex: 60,
    }, opts, { origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + 20) / window.innerHeight } }));
  }

  // los mismos círculos difuminados del inicio; [x%, y%] es su centro
  function softCircles(ambient, specs) {
    return specs.map(([x, y, size, tone]) => {
      const c = document.createElement('span');
      c.className = 'soft-circle soft-circle--' + (tone || 'sky');
      c.style.left = x + '%';
      c.style.top = y + '%';
      c.style.width = c.style.height = size;
      ambient.appendChild(c);
      return c;
    });
  }

  // paralaje suave: los círculos se apartan un poco del cursor
  function parallax(scene, circles, amount) {
    if (!motionOK() || !(JOY.finePointer && JOY.finePointer())) return;
    const movers = circles.map((c, i) => ({
      x: gsap.quickTo(c, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(c, 'y', { duration: 1.2, ease: 'power3.out' }),
      d: 0.6 + i * 0.35,
    }));
    scene.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(-nx * amount * m.d); m.y(-ny * amount * 0.7 * m.d); });
    });
  }

  /* =========================================================================
     Personalidades
     ========================================================================= */

  /* ---------- 01 Preparación: los círculos llegan dispersos y se reúnen ---------- */
  const preparacion = {
    build(scene, ambient) {
      this.circles = softCircles(ambient, [
        [88, 20, 'clamp(220px, 30vw, 400px)', 'sky'],
        [6, 80, 'clamp(180px, 22vw, 300px)', 'cobalt'],
        [66, 92, 'clamp(120px, 14vw, 200px)', 'sky'],
      ]);
      parallax(scene, this.circles, 30);
    },
    enter(scene, head) {
      gsap.fromTo(this.circles,
        { x: () => rand(-1, 1) * window.innerWidth * 0.35, y: () => rand(-1, 1) * window.innerHeight * 0.3, scale: 0.6, opacity: 0 },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out', stagger: 0.12 });
      // las palabras también llegan de sitios distintos y se juntan
      gsap.fromTo(head,
        { x: () => rand(-50, 50), y: () => rand(-24, 24), opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1, clearProps: 'transform,opacity' });
    },
  };

  /* ---------- 02 Incubación: todo flota, más lento y más calmado ---------- */
  const incubacion = {
    reelSpeed: 1.45,
    build(scene, ambient) {
      this.circles = softCircles(ambient, [
        [84, 28, 'clamp(260px, 34vw, 460px)', 'sky'],
        [12, 74, 'clamp(200px, 26vw, 340px)', 'sky'],
      ]);
      if (!motionOK()) return;
      // deriva lenta y continua, como una idea que reposa
      this.loops = this.circles.map((c, i) => gsap.to(c, {
        y: i ? -40 : 36, x: i ? 24 : -20, scale: i ? 1.06 : 0.95,
        duration: 9 + i * 3, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
      }));
    },
    enter(scene, head) {
      if (this.loops) this.loops.forEach((t) => t.play());
      gsap.fromTo(this.circles, { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power1.out', stagger: 0.4 });
      gsap.fromTo(head,
        { opacity: 0, y: 16, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'power2.out', stagger: 0.22, delay: 0.3, clearProps: 'all' });
    },
    leave() {
      setTimeout(() => { if (this.loops) this.loops.forEach((t) => t.pause()); }, 900);
    },
    reveal(els) {
      gsap.fromTo(els,
        { opacity: 0, y: -12, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out', stagger: 0.12, clearProps: 'transform,opacity,filter' });
    },
    confetti(card) {
      confettiFrom(card, {
        shapes: ['circle'], colors: ['#7DB7FF', '#F7F8FA', '#0A46FF'], particleCount: 30, spread: 110,
        startVelocity: 14, gravity: 0.3, ticks: 260, scalar: 0.8,
      });
    },
  };

  /* ---------- 03 Iluminación: un círculo se enciende y sigue al cursor como una lámpara ---------- */
  const iluminacion = {
    build(scene, ambient) {
      this.circles = softCircles(ambient, [
        [20, 28, 'clamp(280px, 36vw, 500px)', 'lamp'],
        [95, 56, 'clamp(160px, 18vw, 260px)', 'cobalt'],
      ]);
      this.lamp = this.circles[0];
      if (!motionOK() || !(JOY.finePointer && JOY.finePointer())) return;
      const lx = gsap.quickTo(this.lamp, 'x', { duration: 1, ease: 'power3.out' });
      const ly = gsap.quickTo(this.lamp, 'y', { duration: 1, ease: 'power3.out' });
      scene.addEventListener('pointermove', (e) => {
        const r = this.lamp.getBoundingClientRect();
        const cx = r.left + r.width / 2 - (gsap.getProperty(this.lamp, 'x') || 0);
        const cy = r.top + r.height / 2 - (gsap.getProperty(this.lamp, 'y') || 0);
        lx((e.clientX - cx) * 0.3);
        ly((e.clientY - cy) * 0.3);
      });
    },
    enter(scene, head) {
      // parpadeo breve y se enciende
      gsap.timeline()
        .set(this.lamp, { opacity: 0.08, scale: 0.9 })
        .to(this.lamp, { opacity: 0.45, duration: 0.06 }, 0.3)
        .to(this.lamp, { opacity: 0.1, duration: 0.06 }, 0.42)
        .to(this.lamp, { opacity: 0.55, duration: 0.06 }, 0.56)
        .to(this.lamp, { opacity: 0.2, duration: 0.05 }, 0.64)
        .add(() => JOY.sfx('spark'), 0.8)
        .to(this.lamp, { opacity: 0.65, scale: 1, duration: 0.9, ease: 'expo.out' }, 0.8);
      gsap.fromTo(this.circles[1], { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.9 });
      gsap.fromTo(head,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.06, delay: 0.75, clearProps: 'transform,opacity' });
    },
    onLand() {
      gsap.fromTo(this.lamp, { scale: 1.18 }, { scale: 1, duration: 1, ease: 'elastic.out(1, 0.4)' });
    },
    reveal(els) {
      gsap.fromTo(els,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.07, clearProps: 'transform,opacity' });
    },
    confetti(card) {
      confettiFrom(card, { shapes: ['circle'], particleCount: 60, spread: 90, startVelocity: 34 });
    },
  };

  /* ---------- 04 Implementación: círculos iguales que encajan en fila ---------- */
  const implementacion = {
    build(scene, ambient) {
      const size = 'clamp(110px, 11vw, 170px)';
      this.circles = softCircles(ambient, [
        [74, 14, size, 'sky'],
        [84, 14, size, 'sky'],
        [94, 14, size, 'cobalt'],
      ]);
    },
    enter(scene, head) {
      gsap.fromTo(this.circles,
        { y: () => rand(-120, -40), x: () => rand(-60, 60), opacity: 0 },
        { y: 0, x: 0, opacity: 1, duration: 0.6, ease: 'steps(6)', stagger: 0.12, delay: 0.2 });
      gsap.delayedCall(0.9, () => JOY.sfx('clack'));
      gsap.fromTo(head,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.45, ease: 'steps(5)', stagger: 0.1, delay: 0.2, clearProps: 'transform,opacity' });
    },
    reveal(els) {
      gsap.fromTo(els, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'steps(6)', stagger: 0.08, clearProps: 'transform,opacity' });
      gsap.delayedCall(0.45, () => JOY.sfx('clack'));
    },
    confetti(card) {
      confettiFrom(card, { shapes: ['square'], particleCount: 40, spread: 50, startVelocity: 26, gravity: 1.5, flat: true });
    },
  };

  const PERSONALITY = { preparacion, incubacion, iluminacion, implementacion };

  /* =========================================================================
     Escena de una fase: cabecera, rejilla de técnicas y ficha de detalle.
     La rejilla tiene tantas columnas como técnicas (hasta 6); con más, filas de 5.
     El dado recorre las tarjetas como una ruleta y se para en una.
     ========================================================================= */
  const pad = (n) => String(n).padStart(2, '0');
  const OPENERS = {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function buildPhaseScene(phase, scene, i, all) {
    const P = PERSONALITY[phase.id] || {};
    const n = phase.techniques.length;
    const nextPhase = all[i + 1];
    const speed = P.reelSpeed || 1;
    const seedBase = (i + 1) * 97;
    let current = -1;
    let rolling = false;
    scene.style.setProperty('--phase-cols', n <= 6 ? n : 5);

    const steps = all.map((_, k) => '<i class="' + (k < i ? 'is-done' : k === i ? 'is-current' : '') + '"></i>').join('');

    scene.innerHTML =
      '<div class="phase-ambient" aria-hidden="true"><div class="phase-grid"></div></div>' +
      '<div class="scene__inner phase">' +
      '<header class="phase__head">' +
      '<div class="phase__lead">' +
      '<p class="phase__eyebrow"><span class="phase__steps" aria-hidden="true">' + steps + '</span>' +
      'Fase ' + phase.index + ' <span class="phase__of">/ ' + pad(all.length) + '</span></p>' +
      '<h2 class="phase__title" data-scene-title tabindex="-1">' + phase.name + '.</h2>' +
      '</div>' +
      '<div class="phase__intro">' +
      '<p class="phase__desc">' + phase.description + '</p>' +
      '<div class="phase__controls"></div>' +
      '</div>' +
      '</header>' +
      '<ol class="tech-grid" aria-label="Técnicas de ' + phase.name + '"></ol>' +
      '<div class="tech-detail" aria-live="polite">' +
      '<p class="tech-detail__hint">Tira el dado o elige una técnica para ver su ejercicio.</p>' +
      '</div>' +
      '<footer class="phase__foot">' +
      '<span class="phase__foot-label">' +
      (nextPhase ? 'Siguiente · ' + nextPhase.index + ' ' + nextPhase.name : 'Siguiente · Referencias') +
      '</span>' +
      '<button class="pill-btn" type="button" data-journey-next>' +
      (nextPhase ? 'Siguiente fase' : 'Ver referencias') +
      ' <span aria-hidden="true">→</span></button>' +
      '</footer>' +
      '</div>';

    const ambient = scene.querySelector('.phase-ambient');
    const head = scene.querySelector('.phase__head');
    const controls = scene.querySelector('.phase__controls');
    const grid = scene.querySelector('.tech-grid');
    const detail = scene.querySelector('.tech-detail');

    /* ---------- tarjetas ---------- */
    const tiles = phase.techniques.map((t, idx) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tech-tile';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('data-cursor', 'Ver técnica');
      b.innerHTML =
        '<span class="tech-tile__art" aria-hidden="true"><canvas></canvas></span>' +
        '<span class="tech-tile__num">' + pad(idx + 1) + '</span>' +
        '<span class="tech-tile__name">' + esc(t.name) + '</span>' +
        '<span class="tech-tile__meta">' + esc(t.duration) + '</span>';
      li.appendChild(b);
      grid.appendChild(li);
      const tile = { el: b, art: null };
      b.addEventListener('pointerenter', () => { if (idx !== current && tile.art) tile.art.accent(true); });
      b.addEventListener('pointerleave', () => { if (idx !== current && tile.art) tile.art.accent(false); });
      b.addEventListener('click', () => { if (!rolling) select(idx, false); });
      return tile;
    });

    // los dibujos se crean al entrar en la fase (o en un rato libre tras la carga), no al arrancar
    function ensureArts() {
      if (tiles[0] && tiles[0].art) return;
      tiles.forEach((tile, idx) => {
        tile.art = JOY.dotArt(tile.el.querySelector('canvas'), {
          motif: phase.id, art: phase.techniques[idx].art, seed: seedBase + idx, start: motionOK() ? 0 : 1,
        });
      });
    }

    /* ---------- ficha de detalle ---------- */
    let detailArt = null;
    function renderDetail(idx, fromDice) {
      const t = phase.techniques[idx];
      if (detailArt) { detailArt.destroy(); detailArt = null; }
      const source = t.link
        ? '<a class="tech-stat__value tech-stat__link" href="' + t.link + '" target="_blank" rel="noreferrer noopener">' + esc(t.source) + ' <span aria-hidden="true">↗</span></a>'
        : '<span class="tech-stat__value">' + esc(t.source) + '</span>';
      detail.innerHTML =
        '<figure class="tech-detail__art">' +
        '<span class="tech-detail__count">' + pad(idx + 1) + ' / ' + pad(n) + '</span>' +
        '<canvas role="img" aria-label="' + esc(t.artCaption || t.name) + '"></canvas>' +
        (t.artCaption ? '<figcaption class="tech-detail__caption">' + esc(t.artCaption) + '</figcaption>' : '') +
        '</figure>' +
        '<div class="tech-detail__body">' +
        '<p class="tech-detail__kicker">' + (fromDice ? '<span class="tech-detail__badge">Te tocó</span>' : '') + 'Técnica ' + pad(idx + 1) + ' de ' + pad(n) + '</p>' +
        '<h3 class="tech-detail__name">' + esc(t.name) + '</h3>' +
        '<p class="tech-detail__desc">' + esc(t.description) + '</p>' +
        '<div class="tech-stats">' +
        '<div class="tech-stat tech-stat--wide"><span class="tech-stat__label">Ejercicio</span><p class="tech-stat__value">' + esc(t.exercise) + '</p></div>' +
        '<div class="tech-stat"><span class="tech-stat__label">Duración</span><span class="tech-stat__value tech-stat__value--big">' + esc(t.duration) + '</span></div>' +
        '<div class="tech-stat"><span class="tech-stat__label">Fuente</span>' + source + '</div>' +
        (t.insight ? '<div class="tech-stat tech-stat--wide tech-stat--insight"><span class="tech-stat__label">Por qué funciona</span><p class="tech-stat__value">' + esc(t.insight) + '</p></div>' : '') +
        '</div>' +
        (t.llmPrompt ?
          '<div class="tech-prompt">' +
          '<span class="tech-prompt__label">Prompt para tu LLM</span>' +
          '<textarea class="tech-prompt__input" placeholder="Escribe aquí tu idea o problema..." rows="2"></textarea>' +
          '<div class="tech-prompt__row">' +
          '<button type="button" class="pill-btn tech-prompt__generate">Generar prompt</button>' +
          '</div>' +
          '<div class="tech-prompt__output" hidden>' +
          '<textarea class="tech-prompt__result" readonly rows="4"></textarea>' +
          '<div class="tech-prompt__row">' +
          '<button type="button" class="pill-btn tech-prompt__copy">Copiar prompt</button>' +
          '<p class="tech-prompt__hint" aria-live="polite" hidden>Copiado ✓</p>' +
          '</div>' +
          '</div>' +
          '</div>'
          : '') +
        '</div>';
      if (t.llmPrompt) {
        const input = detail.querySelector('.tech-prompt__input');
        const generateBtn = detail.querySelector('.tech-prompt__generate');
        const output = detail.querySelector('.tech-prompt__output');
        const result = detail.querySelector('.tech-prompt__result');
        const copyBtn = detail.querySelector('.tech-prompt__copy');
        const hint = detail.querySelector('.tech-prompt__hint');
        let hintTimer = null;
        generateBtn.addEventListener('click', () => {
          const idea = input.value.trim() || '[tu idea]';
          result.value = t.llmPrompt.replace('{{idea}}', idea);
          output.hidden = false;
          hint.hidden = true;
        });
        copyBtn.addEventListener('click', () => {
          const showHint = () => {
            hint.hidden = false;
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => { hint.hidden = true; }, 1500);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(result.value).then(showHint, () => {});
          }
        });
      }
      const art = (detailArt = JOY.dotArt(detail.querySelector('canvas'), { motif: phase.id, art: t.art, seed: seedBase + idx, start: 0, interactive: true }));
      art.accent(true);
      art.play({ duration: phase.id === 'incubacion' ? 2 : 1.3 });
      if (motionOK()) {
        const els = [detail.querySelector('.tech-detail__art')].concat(Array.from(detail.querySelector('.tech-detail__body').children));
        if (P.reveal) P.reveal(els);
        else gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' });
      }
    }

    function select(idx, fromDice) {
      ensureArts();
      if (current >= 0 && current !== idx) tiles[current].art.accent(false);
      current = idx;
      tiles.forEach((t, k) => {
        t.el.classList.remove('is-scanning');
        t.el.classList.toggle('is-picked', k === idx);
        t.el.setAttribute('aria-pressed', k === idx ? 'true' : 'false');
      });
      tiles[idx].art.accent(true);
      detail.classList.add('has-technique');
      renderDetail(idx, fromDice);
      // que la ficha quede a la vista si está por debajo del pliegue
      const r = detail.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 80) {
        scene.scrollBy({ top: Math.min(r.top - 90, r.bottom - window.innerHeight + 100), behavior: motionOK() ? 'smooth' : 'auto' });
      }
      if (fromDice) {
        JOY.buzz([8, 40, 14]);
        if (P.onLand) P.onLand();
        if (motionOK()) {
          gsap.delayedCall(0.2, () => {
            JOY.sfx('ding');
            if (P.confetti) P.confetti(tiles[idx].el); else confettiFrom(tiles[idx].el);
          });
        }
      }
    }

    /* ---------- el dado: una ruleta sobre las tarjetas ---------- */
    const diceBtn = document.createElement('button');
    diceBtn.type = 'button';
    diceBtn.className = 'dice-btn';
    diceBtn.setAttribute('data-magnetic', '0.25');
    diceBtn.setAttribute('data-cursor', '¡Tira!');
    const dice = JOY.makeDice ? JOY.makeDice(22) : null;
    if (dice) diceBtn.appendChild(dice);
    const diceLabel = document.createElement('span');
    diceLabel.textContent = 'Tirar el dado';
    diceBtn.appendChild(diceLabel);
    controls.appendChild(diceBtn);

    function roll() {
      if (rolling) return;
      let p = Math.floor(Math.random() * n);
      if (n > 1 && p === current) p = (p + 1 + Math.floor(Math.random() * (n - 1))) % n;
      JOY.sfx('rattle');
      JOY.buzz(15);
      if (dice && JOY.rollDice) JOY.rollDice(dice, 0.8 * speed);
      diceLabel.textContent = 'Otra técnica';
      if (!motionOK()) { select(p, true); return; }

      rolling = true;
      diceBtn.disabled = true;
      grid.classList.add('is-rolling');
      const delays = [60, 60, 65, 70, 80, 95, 115, 140, 175, 220, 280, 350].map((d) => d * speed);
      // arrancamos de modo que la última casilla iluminada sea la elegida
      let k = (((p - delays.length) % n) + n) % n;
      let at = 0;
      delays.forEach((d) => {
        at += d;
        gsap.delayedCall(at / 1000, () => {
          k = (k + 1) % n;
          tiles.forEach((t, j) => t.el.classList.toggle('is-scanning', j === k));
          JOY.sfx('tick');
        });
      });
      gsap.delayedCall((at + 240 * speed) / 1000, () => {
        grid.classList.remove('is-rolling');
        rolling = false;
        diceBtn.disabled = false;
        select(p, true);
      });
    }
    diceBtn.addEventListener('click', roll);

    OPENERS[phase.id] = (art) => {
      const idx = phase.techniques.findIndex((t) => t.art === art);
      if (idx >= 0 && !rolling) select(idx, false);
    };

    if (P.build) P.build(scene, ambient, head);
    if (JOY.initMagnetic) JOY.initMagnetic(scene);

    if (window.JOURNEY && window.JOURNEY.register) {
      const headKids = () => [head.querySelector('.phase__eyebrow'), head.querySelector('.phase__title'), head.querySelector('.phase__intro')];
      window.JOURNEY.register(phase.id, {
        enter() {
          ensureArts();
          if (!motionOK()) { tiles.forEach((t) => t.art.set(1)); return; }
          if (P.enter) P.enter(scene, headKids());
          const slow = phase.id === 'incubacion';
          const d0 = slow ? 0.9 : 0.35;
          gsap.fromTo(tiles.map((t) => t.el), { opacity: 0, y: 24 }, {
            opacity: 1, y: 0, duration: slow ? 1.1 : 0.6,
            ease: phase.id === 'implementacion' ? 'steps(4)' : 'power3.out', stagger: 0.07,
            delay: d0, clearProps: 'transform,opacity',
          });
          tiles.forEach((t, k) => t.art.play({ delay: d0 + k * 0.07, duration: slow ? 2.2 : 1.4 }));
          gsap.fromTo([detail, scene.querySelector('.phase__foot')], { opacity: 0 }, {
            opacity: 1, duration: 0.6, delay: d0 + 0.4, clearProps: 'opacity',
          });
        },
        leave() { if (P.leave) P.leave(scene); },
      });
    } else {
      ensureArts();
    }
    return ensureArts;
  }

  // tras la carga, prepara los dibujos de cada fase de uno en uno en ratos libres
  function warmArts(builders) {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    const nextOne = () => {
      const build = builders.shift();
      if (!build) return;
      build();
      idle(nextOne, { timeout: 3000 });
    };
    const start = () => idle(nextOne, { timeout: 3000 });
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  function renderPhases() {
    if (!window.PHASES || !JOY.dotArt) return;
    const builders = [];
    window.PHASES.forEach((phase, i, all) => {
      const scene = document.getElementById(phase.id);
      if (scene) builders.push(buildPhaseScene(phase, scene, i, all));
    });
    warmArts(builders);
  }

  // abre una técnica desde otra escena: va a su fase y muestra su ficha
  JOY.openTechnique = (phaseId, art) => {
    const open = OPENERS[phaseId];
    if (!open) return;
    const J = window.JOURNEY;
    const here = J && J.current && J.current() === phaseId;
    if (J && J.goTo && !here) J.goTo(phaseId);
    setTimeout(() => open(art), here || !motionOK() ? 0 : 950);
  };
  // botones declarativos: data-open-technique="fase:arte"
  document.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-open-technique]') : null;
    if (!b) return;
    const [phaseId, art] = b.dataset.openTechnique.split(':');
    JOY.openTechnique(phaseId, art);
  });

  document.addEventListener('DOMContentLoaded', renderPhases);
})();
