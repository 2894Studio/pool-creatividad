/* carousel.js — estantería de referencias: tira infinita arrastrable con inercia,
   tarjetas que se inclinan en 3D con un brillo que sigue al cursor, y un botón
   "Sorpréndeme" que la hace girar hasta caer en una al azar. */
(function () {
  var PLATFORM_LOGOS = {
    netflix: 'assets/logos/netflix%20logo.png',
    primevideo: 'assets/logos/prime%20video.png',
    youtube: 'assets/logos/Youtube_logo.png',
    vimeo: 'assets/logos/vimeo.webp',
  };

  const JOY = window.JOY || {};
  const canDrag = () =>
    typeof gsap !== 'undefined' && typeof Draggable !== 'undefined' && !(JOY.reducedMotion && JOY.reducedMotion());
  const finePointer = () => (JOY.finePointer ? JOY.finePointer() : false);

  let dragging = false; // evita que un arrastre termine abriendo la tarjeta

  function makeCard(ref, isClone) {
    const card = document.createElement('article');
    card.className = 'ref-card ref-card--' + ref.accent;
    card.tabIndex = isClone ? -1 : 0;
    card.setAttribute('aria-label', ref.title + '. ' + ref.description);
    if (isClone) card.setAttribute('aria-hidden', 'true');
    card.setAttribute('data-cursor', 'Ver ↗');
    const logoSrc = PLATFORM_LOGOS[ref.platform];
    const platformBadge = '<img class="ref-card__platform ref-card__platform--' + ref.platform + '" src="' + logoSrc + '" alt="' + ref.platform + '" draggable="false" />';
    card.innerHTML =
      // la foto se pide más tarde (loadImages): no compite con el inicio por la red
      '<img class="ref-card__img" data-src="' + ref.imageUrl + '" alt="' + ref.title + '" decoding="async" draggable="false" />' +
      platformBadge +
      '<div class="ref-card__overlay">' +
      '<span class="ref-card__category">' + ref.category + '</span>' +
      '<h3 class="ref-card__title">' + ref.title + '</h3>' +
      '<p class="ref-card__desc">' + ref.description + '</p>' +
      '</div>' +
      '<span class="ref-card__glare" aria-hidden="true"></span>';
    const open = () => { if (!dragging) window.open(ref.sourceUrl, '_blank', 'noopener,noreferrer'); };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(); }
    });
    return card;
  }

  // las fotos se cargan cuando el inicio ya terminó de cargar (en un rato libre) o al entrar
  // en Referencias, lo que llegue antes; las copias reutilizan la misma petición
  let imagesLoaded = false;
  function loadImages() {
    if (imagesLoaded) return;
    imagesLoaded = true;
    document.querySelectorAll('.ref-card__img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
  function scheduleImages() {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const later = () => idle(loadImages, { timeout: 4000 });
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
    if (window.JOURNEY && window.JOURNEY.register) window.JOURNEY.register('referencias', { enter: loadImages });
    else loadImages();
  }

  function renderReferences() {
    const strip = document.getElementById('carousel-strip');
    if (!strip || !window.REFERENCES) return;
    // con arrastre infinito duplicamos el set tres veces y envolvemos la posición
    const copies = canDrag() ? 3 : 1;
    for (let c = 0; c < copies; c++) {
      window.REFERENCES.forEach((ref) => strip.appendChild(makeCard(ref, c > 0)));
    }
  }

  // tarjetas en 3D: se inclinan hacia el cursor y un brillo recorre la superficie
  function initTilt(strip) {
    if (!canDrag() || !finePointer()) return;
    const tilts = new WeakMap();
    const get = (card) => {
      let t = tilts.get(card);
      if (!t) {
        gsap.set(card, { transformPerspective: 900 });
        t = {
          rx: gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' }),
          ry: gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' }),
        };
        tilts.set(card, t);
      }
      return t;
    };
    strip.addEventListener('pointermove', (e) => {
      if (dragging || e.pointerType !== 'mouse') return;
      const card = e.target.closest('.ref-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const t = get(card);
      t.ry((x - 0.5) * 16);
      t.rx(-(y - 0.5) * 12);
      card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    strip.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.ref-card');
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      gsap.to(card, { scale: 1.04, y: -8, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    });
    strip.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.ref-card');
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      const t = get(card);
      t.rx(0); t.ry(0);
      gsap.to(card, { scale: 1, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    });
  }

  // la tarjeta elegida por "Sorpréndeme" salta y suelta confeti
  function celebrate(card) {
    if (!card) return;
    card.classList.add('is-picked');
    setTimeout(() => card.classList.remove('is-picked'), 2200);
    if (typeof gsap !== 'undefined' && !(JOY.reducedMotion && JOY.reducedMotion())) {
      gsap.fromTo(card, { y: 0, scale: 1 }, { y: -18, scale: 1.07, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 });
    }
    if (JOY.burstFrom) JOY.burstFrom(card, { particleCount: 50, startVelocity: 26 });
    if (JOY.sfx) JOY.sfx('ding');
    if (JOY.buzz) JOY.buzz([10, 30, 10]);
  }

  function setupNativeControls(track, prev, next, surprise) {
    track.classList.add('is-native');
    const scrollAmount = () => track.clientWidth * 0.8;
    const move = (d) => track.scrollBy({ left: d, behavior: 'smooth' });
    if (prev) prev.addEventListener('click', () => move(-scrollAmount()));
    if (next) next.addEventListener('click', () => move(scrollAmount()));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { move(scrollAmount()); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { move(-scrollAmount()); e.preventDefault(); }
    });
    if (surprise) {
      surprise.addEventListener('click', () => {
        const cards = track.querySelectorAll('.ref-card');
        const card = cards[Math.floor(Math.random() * cards.length)];
        track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
        setTimeout(() => celebrate(card), 500);
      });
    }
  }

  function setupDragControls(track, strip, prev, next, surprise) {
    gsap.registerPlugin(Draggable, InertiaPlugin);
    track.classList.add('is-drag');

    const n = window.REFERENCES.length;
    const cards = strip.children;
    let setWidth = 0;
    let step = 0;
    const measure = () => {
      setWidth = cards[n].offsetLeft - cards[0].offsetLeft;
      step = cards[1].offsetLeft - cards[0].offsetLeft;
    };
    measure();

    const state = { x: 0 };
    const wrap = (x) => gsap.utils.wrap(-setWidth, 0, x);
    const apply = () => gsap.set(strip, { x: wrap(state.x) });
    apply();

    // arrastramos un proxy invisible: su x crece sin límite y la tira se envuelve al aplicarlo
    const proxy = document.createElement('div');
    const drag = Draggable.create(proxy, {
      type: 'x',
      trigger: track,
      inertia: true,
      dragClickables: true,
      snap: { x: (v) => Math.round(v / step) * step },
      onPress() { dragging = false; },
      onDragStart() {
        dragging = true;
        track.classList.add('is-dragging');
        if (JOY.setCursorLabel) JOY.setCursorLabel('⟵  ⟶');
      },
      onDrag() { state.x = this.x; apply(); },
      onThrowUpdate() { state.x = this.x; apply(); },
      onDragEnd() {
        track.classList.remove('is-dragging');
        if (JOY.setCursorLabel) JOY.setCursorLabel(null);
      },
      onRelease() { setTimeout(() => { dragging = false; }, 60); },
    })[0];

    // inclinación según la velocidad: las tarjetas se "tumban" hacia donde van.
    // Sólo mientras Referencias está en pantalla, y sólo se retoca si la inclinación cambia.
    const skewTo = gsap.quickTo(strip, 'skewX', { duration: 0.45, ease: 'power3.out' });
    let last = state.x;
    let lastTick = 0;
    let lastSkew = 0;
    const skewTick = () => {
      const v = state.x - last;
      last = state.x;
      const skew = gsap.utils.clamp(-7, 7, v * 0.22);
      if (skew !== lastSkew) { lastSkew = skew; skewTo(skew); }
      // un "tic" cada vez que pasa una tarjeta, como un rodillo
      const slot = Math.round(state.x / step);
      if (slot !== lastTick) { lastTick = slot; if (Math.abs(v) > 1 && JOY.sfx) JOY.sfx('tick'); }
    };
    let skewing = false;
    const startSkew = () => {
      if (skewing) return;
      skewing = true;
      last = state.x;
      gsap.ticker.add(skewTick);
    };
    const stopSkew = () => {
      if (!skewing) return;
      skewing = false;
      gsap.ticker.remove(skewTick);
      lastSkew = 0;
      skewTo(0);
    };

    const settle = () => { gsap.set(proxy, { x: state.x }); drag.update(); };
    const go = (dir) => {
      if (drag.tween) drag.tween.kill();
      const target = Math.round(state.x / step) * step - dir * step * 2;
      gsap.to(state, { x: target, duration: 0.65, ease: 'power3.out', overwrite: true, onUpdate: apply, onComplete: settle });
    };
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
    });

    if (surprise) {
      let spinning = false;
      surprise.addEventListener('click', () => {
        if (spinning) return;
        if (drag.tween) drag.tween.kill();
        spinning = true;
        surprise.disabled = true;
        measure();
        const k = Math.floor(Math.random() * n);
        const cw = cards[0].offsetWidth;
        // x en la que la tarjeta k (copia central) queda centrada en la pista
        const centered = track.clientWidth / 2 - (cards[n + k].offsetLeft - cards[0].offsetLeft) - cw / 2;
        const base = state.x - 2 * setWidth; // al menos dos vueltas completas
        const target = centered + Math.floor((base - centered) / setWidth) * setWidth;
        if (JOY.sfx) JOY.sfx('whoosh');
        gsap.to(state, {
          x: target, duration: 2.6, ease: 'power4.out', overwrite: true, onUpdate: apply,
          onComplete: () => {
            settle();
            spinning = false;
            surprise.disabled = false;
            // la copia visible más cercana al centro
            const mid = track.getBoundingClientRect();
            const cx = mid.left + mid.width / 2;
            let best = null;
            let bestD = Infinity;
            Array.from(cards).forEach((c) => {
              const r = c.getBoundingClientRect();
              const d = Math.abs(r.left + r.width / 2 - cx);
              if (d < bestD) { bestD = d; best = c; }
            });
            celebrate(best);
          },
        });
      });
    }

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (!resizeRaf) resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; measure(); apply(); });
    });
    // la escena estaba oculta al medir: remedimos al entrar
    if (window.JOURNEY && window.JOURNEY.register) {
      window.JOURNEY.register('referencias', {
        enter: () => { measure(); apply(); startSkew(); },
        leave: stopSkew,
      });
    } else {
      startSkew();
    }
  }

  function setupControls() {
    const track = document.getElementById('carousel-track');
    const strip = document.getElementById('carousel-strip');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    const surprise = document.getElementById('carousel-surprise');
    if (!track || !strip) return;
    if (prev) prev.hidden = false;
    if (canDrag()) setupDragControls(track, strip, prev, next, surprise);
    else setupNativeControls(track, prev, next, surprise);
    initTilt(strip);
    if (JOY.initMagnetic) JOY.initMagnetic(track.closest('.references'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderReferences();
    setupControls();
    scheduleImages();
  });
})();
