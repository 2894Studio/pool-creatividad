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
      '<img class="ref-card__img" src="' + ref.imageUrl + '" alt="' + ref.title + '" loading="eager" decoding="async" draggable="false" />' +
      platformBadge +
      '<div class="ref-card__overlay">' +
      '<span class="ref-card__category">' + ref.category + '</span>' +
      '<h3 class="ref-card__title">' + ref.title + '</h3>' +
      '<p class="ref-card__desc">' + ref.description + '</p>' +
      '<p class="ref-card__credit">' + ref.credit + '</p>' +
      '</div>';
    const open = () => { if (!dragging) window.open(ref.sourceUrl, '_blank', 'noopener,noreferrer'); };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    return card;
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

  function setupNativeControls(track, prev, next) {
    track.classList.add('is-native');
    const scrollAmount = () => track.clientWidth * 0.8;
    const move = (d) => track.scrollBy({ left: d, behavior: 'smooth' });
    if (prev) prev.addEventListener('click', () => move(-scrollAmount()));
    if (next) next.addEventListener('click', () => move(scrollAmount()));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { move(scrollAmount()); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { move(-scrollAmount()); e.preventDefault(); }
    });
  }

  function setupDragControls(track, strip, prev, next) {
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

    // inclinación según la velocidad: las tarjetas se "tumban" hacia donde van
    const skewTo = gsap.quickTo(strip, 'skewX', { duration: 0.45, ease: 'power3.out' });
    let last = state.x;
    gsap.ticker.add(() => {
      const v = state.x - last;
      last = state.x;
      skewTo(gsap.utils.clamp(-7, 7, v * 0.22));
    });

    const go = (dir) => {
      if (drag.tween) drag.tween.kill();
      const target = Math.round(state.x / step) * step - dir * step * 2;
      gsap.to(state, {
        x: target, duration: 0.65, ease: 'power3.out', overwrite: true,
        onUpdate: apply,
        onComplete: () => { gsap.set(proxy, { x: state.x }); drag.update(); },
      });
    };
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
    });

    window.addEventListener('resize', () => { measure(); apply(); });
  }

  function setupControls() {
    const track = document.getElementById('carousel-track');
    const strip = document.getElementById('carousel-strip');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!track || !strip) return;
    if (prev) prev.hidden = false;
    if (canDrag()) setupDragControls(track, strip, prev, next);
    else setupNativeControls(track, prev, next);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderReferences();
    setupControls();
  });
})();
