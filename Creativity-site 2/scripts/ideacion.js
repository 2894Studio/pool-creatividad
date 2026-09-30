/* ideacion.js — escena "Idear no es hacer brainstorming", antes de las fases.
   · El equilibrio: un deslizador de formal a informal mueve una curva de calidad
     en trama de puntos; la creatividad sube, la viabilidad baja y en el centro
     (equilibrio) la idea "suena".
   · La idea de calidad: tres círculos (única, viable, encaja) que se juntan al
     entrar; cada uno explica su parte y el centro celebra la intersección.
   · Gestión de ideas: los cinco pasos aparecen uno tras otro sobre una línea.
   · Buenas prácticas: se pueden marcar (hazlo) o tachar (evita). */
(function () {
  const JOY = window.JOY || {};
  const motionOK = () => (JOY.motionOK ? JOY.motionOK() : false);
  const sfx = (n) => { if (JOY.sfx) JOY.sfx(n); };

  /* ---------------- el equilibrio ---------------- */
  const ZONE = [0.34, 0.66];
  // calidad: alta en el centro, cae hacia los dos extremos
  const quality = (x) => Math.pow(4 * x * (1 - x), 1.4);

  function initBalance(card) {
    const canvas = card.querySelector('canvas');
    const input = card.querySelector('input[type="range"]');
    const verdict = card.querySelector('.idea-balance__verdict');
    const creative = card.querySelector('[data-meter="creative"]');
    const viable = card.querySelector('[data-meter="viable"]');
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let zone = null;
    let lastTick = -1;

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

    function draw(v) {
      if (!w && !resize()) return;
      ctx.clearRect(0, 0, w, h);
      const step = 10;
      const top = 14;
      const base = h - 6;
      const span = base - top;
      const cols = Math.floor((w - 4) / step);
      const pad = (w - cols * step) / 2;
      // banda del equilibrio
      ctx.fillStyle = 'rgba(125,183,255,0.12)';
      ctx.fillRect(ZONE[0] * w, 0, (ZONE[1] - ZONE[0]) * w, h);
      for (let c = 0; c <= cols; c++) {
        const px = pad + c * step;
        const x = px / w;
        const q = quality(x);
        const inZone = x >= ZONE[0] && x <= ZONE[1];
        const near = Math.abs(x - v) * w < step / 2;
        for (let y = base; y >= base - q * span; y -= step) {
          ctx.fillStyle = near ? 'rgba(10,70,255,1)' : inZone ? 'rgba(10,70,255,0.3)' : 'rgba(11,11,13,0.2)';
          ctx.beginPath();
          ctx.arc(px, y, near ? 2.2 : 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // el punto que sigue al deslizador, sobre la curva
      const mx = v * w;
      const my = base - quality(v) * span;
      const balanced = v >= ZONE[0] && v <= ZONE[1];
      if (balanced) {
        ctx.fillStyle = 'rgba(125,183,255,0.45)';
        ctx.beginPath();
        ctx.arc(mx, my, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = balanced ? '#0A46FF' : '#0B0B0D';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const TEXTS = {
      formal: ['Demasiado formal.', 'Las ideas son viables, pero poco creativas.', 'Muy formal'],
      balance: ['En equilibrio.', 'Novedad, viabilidad y ajuste al negocio: aquí nacen las mejores ideas.', 'En equilibrio'],
      informal: ['Demasiado informal.', 'Las ideas son muy creativas, pero imposibles de ejecutar.', 'Muy informal'],
    };

    function update(fromUser) {
      const v = input.value / 100;
      const z = v < ZONE[0] ? 'formal' : v > ZONE[1] ? 'informal' : 'balance';
      creative.style.width = Math.round(8 + v * 88) + '%';
      viable.style.width = Math.round(96 - v * 88) + '%';
      card.classList.toggle('is-balanced', z === 'balance');
      if (z !== zone) {
        verdict.innerHTML = '<strong>' + TEXTS[z][0] + '</strong> ' + TEXTS[z][1];
        input.setAttribute('aria-valuetext', TEXTS[z][2]);
        if (fromUser && z === 'balance') { sfx('ding'); if (JOY.buzz) JOY.buzz([8, 30, 10]); }
        zone = z;
      }
      // un clic suave cada pocas unidades mientras se arrastra
      const tick = Math.round(input.value / 6);
      if (fromUser && tick !== lastTick) sfx('tick');
      lastTick = tick;
      draw(v);
    }

    input.addEventListener('input', () => update(true));
    input.setAttribute('data-cursor', 'Arrastra');
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { if (resize()) draw(input.value / 100); }).observe(canvas);
    }
    update(false);
  }

  /* ---------------- la idea de calidad ---------------- */
  const VENN = {
    unique: '<strong>Única.</strong> Aporta novedad: no es más de lo mismo.',
    viable: '<strong>Viable.</strong> Se puede hacer con los recursos, la tecnología y el tiempo que hay.',
    fit: '<strong>Encaja con el negocio.</strong> Responde a la estrategia y a los objetivos de la empresa.',
    core: 'Solo en la intersección exacta de las tres hay una idea de calidad.',
  };

  function initVenn(card) {
    const note = card.querySelector('.idea-venn__note');
    const sets = Array.from(card.querySelectorAll('.idea-venn__set'));
    const core = card.querySelector('.idea-venn__core');
    let shown = 'core';
    const show = (key) => {
      if (key === shown) return;
      shown = key;
      note.innerHTML = VENN[key];
      sets.forEach((s) => s.classList.toggle('is-on', s.dataset.venn === key));
    };
    sets.forEach((s) => {
      s.addEventListener('pointerenter', () => show(s.dataset.venn));
      s.addEventListener('focus', () => show(s.dataset.venn));
      s.addEventListener('click', () => { show(s.dataset.venn); sfx('pop'); });
    });
    card.querySelector('.idea-venn').addEventListener('pointerleave', () => show('core'));
    core.addEventListener('click', () => {
      show('core');
      sfx('ding');
      if (JOY.burstFrom) JOY.burstFrom(core, { particleCount: 40, spread: 70, startVelocity: 22 });
      if (motionOK()) {
        gsap.fromTo(sets, { scale: 1.06 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)', stagger: 0.05, clearProps: 'scale' });
      }
    });

    return function enter() {
      if (!motionOK()) return;
      // los tres círculos llegan separados y se juntan
      const from = [[-40, -30], [40, -30], [0, 44]];
      gsap.timeline()
        .fromTo(sets, { x: (i) => from[i][0], y: (i) => from[i][1], opacity: 0 },
          { x: 0, y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity' }, 0.3)
        .add(() => sfx('clack'), 1.2)
        .fromTo(core, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.4)', clearProps: 'transform,opacity' }, 1.15);
    };
  }

  /* ---------------- entrada de la escena ---------------- */
  function init() {
    const scene = document.getElementById('ideacion');
    if (!scene) return;
    const balance = scene.querySelector('.idea-balance');
    const venn = scene.querySelector('.idea-quality');
    if (balance) initBalance(balance);
    const vennEnter = venn ? initVenn(venn) : null;

    // buenas prácticas: marcar lo que ya haces, tachar lo que ya evitas
    scene.querySelectorAll('.idea-list button').forEach((b) => {
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        sfx(on ? 'pop' : 'tick');
        if (on && motionOK()) gsap.fromTo(b, { x: -3 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
      });
    });

    const steps = scene.querySelector('.idea-flow__steps');
    const num = scene.querySelector('.idea-models__num');
    let flowShown = false;

    // los pasos aparecen cuando llegan a la vista (la escena se desplaza por dentro)
    function showFlow() {
      if (flowShown || !steps) return;
      flowShown = true;
      const items = Array.from(steps.children);
      gsap.fromTo(steps, { '--p': 0 }, { '--p': 1, duration: 1.1, ease: 'power2.inOut' });
      gsap.fromTo(items, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.18, clearProps: 'transform,opacity',
      });
      items.forEach((_, i) => gsap.delayedCall(0.18 * i, () => sfx('tick')));
    }

    if (!window.JOURNEY || !window.JOURNEY.register) return;
    const head = [scene.querySelector('.phase__eyebrow'), scene.querySelector('.phase__title'), scene.querySelector('.phase__intro')];
    let io = null;

    window.JOURNEY.register('ideacion', {
      enter() {
        if (!motionOK()) return;
        gsap.fromTo(head, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' });
        gsap.fromTo(scene.querySelectorAll('.idea-card:not(.idea-list)'), { y: 24, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.25, clearProps: 'transform,opacity',
        });
        if (vennEnter) vennEnter();
        if (num) {
          const c = { v: 0 };
          gsap.to(c, { v: 25, duration: 1.4, delay: 0.5, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(c.v); } });
        }
        if (!flowShown && !io && steps && 'IntersectionObserver' in window) {
          gsap.set(steps, { '--p': 0 });
          gsap.set(steps.children, { opacity: 0 });
          io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { io.disconnect(); showFlow(); }
          }, { root: scene, threshold: 0.4 });
          io.observe(steps);
        }
      },
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
