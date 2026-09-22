/* joy.js — interacciones globales: magnetismo, etiqueta de cursor, burbujas
   físicas del hero y revelado de titulares.
   Expone window.JOY para que phases.js y carousel.js reutilicen helpers. */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasGsap = typeof gsap !== 'undefined';

  JOY.reducedMotion = () => reduced.matches;
  JOY.finePointer = () => finePointer.matches;
  JOY.motionOK = () => hasGsap && !reduced.matches;

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
        strength: parseFloat(el.dataset.magnetic) || 0.35,
        active: false,
        xTo: gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' }),
        yTo: gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' }),
      });
    });
  }
  JOY.initMagnetic = initMagnetic;

  function onMagnetMove(e) {
    for (let i = magnets.length - 1; i >= 0; i--) {
      const m = magnets[i];
      if (!m.el.isConnected) { magnets.splice(i, 1); continue; }
      const r = m.el.getBoundingClientRect();
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
      else if (current) show(current.dataset.cursor);
      else hide();
    };
    JOY.refreshCursorLabel = () => { if (!override) { if (current) show(current.dataset.cursor); else hide(); } };
  }

  /* ---------------- burbujas del hero ----------------
     Se pueden agarrar y lanzar; rebotan en los bordes y vuelven a derivar
     alrededor de su posición original. */
  function initHeroBlobs() {
    const hero = document.querySelector('.hero');
    const motif = hero && hero.querySelector('.hero__motif');
    const circles = motif ? Array.from(motif.querySelectorAll('.hero__circle')) : [];
    if (!hero || !circles.length || !hasGsap || reduced.matches) return;

    let heroRect = hero.getBoundingClientRect();
    const blobs = circles.map((el, i) => {
      const r = el.getBoundingClientRect();
      const x = r.left - heroRect.left;
      const y = r.top - heroRect.top;
      // congelamos la posición CSS y a partir de aquí movemos con transform
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      return {
        el, w: r.width, h: r.height,
        baseX: x, baseY: y, homeX: x, homeY: y,
        px: x, py: y, vx: 0, vy: 0,
        phase: i * 2.1, freq: 0.32 + i * 0.09,
        ampX: [30, 25, 22][i % 3], ampY: [40, 35, 26][i % 3],
        grabbed: false, pointerX: 0, pointerY: 0, offX: 0, offY: 0,
      };
    });
    motif.classList.add('is-physics');
    if (!motif.classList.contains('no-goo')) motif.classList.add('is-goo');

    const relPointer = (e) => ({ x: e.clientX - heroRect.left, y: e.clientY - heroRect.top });

    blobs.forEach((b) => {
      b.el.addEventListener('pointerdown', (e) => {
        heroRect = hero.getBoundingClientRect();
        const p = relPointer(e);
        b.grabbed = true;
        b.offX = p.x - b.px; b.offY = p.y - b.py;
        b.pointerX = p.x; b.pointerY = p.y;
        b.el.classList.add('is-grabbed');
        try { b.el.setPointerCapture(e.pointerId); } catch (_) { /* eventos sintéticos o punteros ya liberados */ }
        e.preventDefault();
      });
      b.el.addEventListener('pointermove', (e) => {
        if (!b.grabbed) return;
        const p = relPointer(e);
        b.pointerX = p.x; b.pointerY = p.y;
      });
      const release = () => {
        if (!b.grabbed) return;
        b.grabbed = false;
        b.el.classList.remove('is-grabbed');
        const max = 38;
        b.vx = gsap.utils.clamp(-max, max, b.vx * 0.9);
        b.vy = gsap.utils.clamp(-max, max, b.vy * 0.9);
      };
      b.el.addEventListener('pointerup', release);
      b.el.addEventListener('pointercancel', release);
      b.el.addEventListener('lostpointercapture', release);
    });

    window.addEventListener('resize', () => { heroRect = hero.getBoundingClientRect(); });

    gsap.ticker.add((time, deltaTime) => {
      const k = gsap.utils.clamp(0.5, 2, deltaTime / 16.7);
      const W = hero.clientWidth, H = hero.clientHeight;
      blobs.forEach((b) => {
        if (b.grabbed) {
          const tx = b.pointerX - b.offX, ty = b.pointerY - b.offY;
          b.vx = (tx - b.px) / k; b.vy = (ty - b.py) / k;
          b.px = tx; b.py = ty;
        } else {
          const driftX = Math.sin(time * b.freq + b.phase) * b.ampX;
          const driftY = Math.cos(time * b.freq * 0.8 + b.phase) * b.ampY;
          const targetX = b.homeX + driftX, targetY = b.homeY + driftY;
          b.vx += (targetX - b.px) * 0.0035 * k;
          b.vy += (targetY - b.py) * 0.0035 * k;
          b.vx *= Math.pow(0.975, k);
          b.vy *= Math.pow(0.975, k);
          b.px += b.vx * k; b.py += b.vy * k;
          // rebote: el centro de la burbuja no puede salir del hero
          const minX = -b.w * 0.5, maxX = W - b.w * 0.5, minY = -b.h * 0.5, maxY = H - b.h * 0.5;
          if (b.px < minX) { b.px = minX; b.vx = Math.abs(b.vx) * 0.8; }
          if (b.px > maxX) { b.px = maxX; b.vx = -Math.abs(b.vx) * 0.8; }
          if (b.py < minY) { b.py = minY; b.vy = Math.abs(b.vy) * 0.8; }
          if (b.py > maxY) { b.py = maxY; b.vy = -Math.abs(b.vy) * 0.8; }
        }
        // aplastamiento según la dirección dominante, sin rotar (el brillo del degradado no debe girar)
        const speed = Math.hypot(b.vx, b.vy);
        const s = Math.min(speed * 0.012, 0.26);
        const dx = speed > 0.01 ? Math.abs(b.vx) / speed : 0;
        const dy = speed > 0.01 ? Math.abs(b.vy) / speed : 0;
        gsap.set(b.el, { x: b.px - b.baseX, y: b.py - b.baseY, scaleX: 1 + s * dx - s * 0.5 * dy, scaleY: 1 + s * dy - s * 0.5 * dx });
      });
    });
  }

  /* ---------------- revelado de titulares ----------------
     [data-split="hero"] anima al cargar; [data-split="section"] una sola vez al entrar en pantalla. */
  function initSplitText() {
    if (!hasGsap || typeof SplitText === 'undefined' || reduced.matches) return;
    gsap.registerPlugin(SplitText);
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
    const run = () => {
      document.querySelectorAll('[data-split]').forEach((el) => {
        const isHero = el.dataset.split === 'hero';
        const split = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'split-word', aria: 'auto' });
        const vars = { yPercent: 110, opacity: 0, duration: 0.75, ease: 'power4.out', stagger: 0.07 };
        if (isHero) {
          vars.delay = 0.1;
        } else if (typeof ScrollTrigger !== 'undefined') {
          vars.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
        }
        gsap.from(split.words, vars);
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCursorLabel();
    initMagnetic();
    initHeroBlobs();
    initSplitText();
    if (finePointer.matches && !reduced.matches) {
      document.addEventListener('mousemove', onMagnetMove, { passive: true });
    }
  });
})();
