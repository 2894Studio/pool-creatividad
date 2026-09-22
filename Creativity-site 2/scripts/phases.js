(function () {
  const JOY = window.JOY || {};
  const motionOK = () => (JOY.motionOK ? JOY.motionOK() : false);

  // confeti en colores de marca desde el centro de un elemento
  function burstFrom(el) {
    if (typeof confetti !== 'function') return;
    const r = el.getBoundingClientRect();
    confetti({
      particleCount: 60,
      spread: 75,
      startVelocity: 30,
      gravity: 1.1,
      ticks: 130,
      scalar: 0.9,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + 20) / window.innerHeight },
      colors: ['#0A46FF', '#7DB7FF', '#F7F8FA', '#0B0B0D'],
      disableForReducedMotion: true,
      zIndex: 60,
    });
  }

  const rand = (min, max) => Math.random() * (max - min) + min;

  // una nota con cinta: tilt, posición y giro de la cinta aleatorios
  function makeCard(t, idx, tag, featured) {
    const card = document.createElement(tag);
    card.className = 'technique-card technique-card--tape-' + ((idx % 2) + 1) + (featured ? ' technique-card--featured' : '');
    card.style.setProperty('--tilt', rand(featured ? -1.2 : -1.8, featured ? 1.2 : 1.8).toFixed(2) + 'deg');
    card.style.setProperty('--tape-x', Math.round(rand(14, 62)) + '%');
    card.style.setProperty('--tape-rot', rand(-7, 7).toFixed(1) + 'deg');

    const sourceMarkup = t.link
      ? '<a class="technique-card__source-link" href="' + t.link + '" target="_blank" rel="noreferrer noopener">' + t.source + '</a>'
      : '<span class="technique-card__source">' + t.source + '</span>';

    card.innerHTML =
      '<div class="technique-card__header"><h4>' + t.name + '</h4>' +
      sourceMarkup + '</div>' +
      '<p class="technique-card__desc">' + t.description + '</p>' +
      '<p class="technique-card__exercise"><strong>Ejercicio:</strong> ' + t.exercise + '</p>' +
      '<span class="technique-card__duration">⏱ ' + t.duration + '</span>';
    return card;
  }

  function renderPhases() {
    const panelsContainer = document.getElementById('phase-split');
    const detailContainer = document.getElementById('phase-detail');
    if (!panelsContainer || !detailContainer || !window.PHASES) return;

    let pendingOut = null;

    function buildDetail(phase) {
      detailContainer.innerHTML = '';
      const n = phase.techniques.length;
      let lastPick = -1;
      let rolling = false;
      let showingAll = false;

      const desc = document.createElement('p');
      desc.className = 'phase-detail__desc';
      desc.textContent = phase.description;
      detailContainer.appendChild(desc);

      const stage = document.createElement('div');
      stage.className = 'technique-stage';
      detailContainer.appendChild(stage);

      const controls = document.createElement('div');
      controls.className = 'technique-stage__controls';
      stage.appendChild(controls);

      const shuffleBtn = document.createElement('button');
      shuffleBtn.type = 'button';
      shuffleBtn.className = 'phase-card__shuffle';
      shuffleBtn.setAttribute('data-magnetic', '0.25');
      shuffleBtn.innerHTML = '<span class="dice" aria-hidden="true">🎲</span><span class="label">Tirar el dado</span>';
      controls.appendChild(shuffleBtn);

      const listId = 'technique-list-' + phase.id;
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'technique-stage__toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-controls', listId);
      controls.appendChild(toggleBtn);
      const setToggleLabel = () => {
        toggleBtn.innerHTML = showingAll
          ? 'Volver a una técnica<span class="arrow" aria-hidden="true">↓</span>'
          : 'Ver las ' + n + ' técnicas<span class="arrow" aria-hidden="true">↓</span>';
      };
      setToggleLabel();

      const slot = document.createElement('div');
      slot.className = 'technique-slot';
      slot.setAttribute('aria-live', 'polite');
      stage.appendChild(slot);

      const empty = document.createElement('button');
      empty.type = 'button';
      empty.className = 'technique-slot__empty';
      empty.innerHTML =
        '<span class="dice" aria-hidden="true">🎲</span>' +
        '<strong>¿Qué técnica te toca?</strong>' +
        '<span>Tira el dado y prueba una de las ' + n + ' técnicas de esta fase.</span>';
      slot.appendChild(empty);

      const list = document.createElement('ul');
      list.className = 'technique-list';
      list.id = listId;
      list.hidden = true;
      phase.techniques.forEach((t, idx) => list.appendChild(makeCard(t, idx, 'li', false)));
      stage.appendChild(list);

      function markPicked() {
        list.querySelectorAll('.technique-card').forEach((c, idx) => {
          c.classList.toggle('technique-card--picked', idx === lastPick);
          const old = c.querySelector('.technique-card__badge');
          if (old) old.remove();
          if (idx === lastPick) {
            const b = document.createElement('span');
            b.className = 'technique-card__badge';
            b.textContent = 'Tu técnica';
            c.appendChild(b);
          }
        });
      }

      function setShowAll(on) {
        showingAll = on;
        toggleBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
        setToggleLabel();
        slot.hidden = on;
        list.hidden = !on;
        if (on) {
          markPicked();
          if (motionOK()) {
            const cards = list.querySelectorAll('.technique-card');
            gsap.fromTo(
              cards,
              { opacity: 0, y: 30, rotation: () => gsap.utils.random(-7, 7) },
              {
                opacity: 1, y: 0,
                rotation: (_, el) => parseFloat(el.style.getPropertyValue('--tilt')) || 0,
                duration: 0.55, ease: 'back.out(1.5)', stagger: 0.055, clearProps: 'transform,opacity',
              }
            );
          }
        } else if (motionOK()) {
          gsap.from(slot, { opacity: 0, y: 14, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
        }
      }

      function land(pickIdx) {
        const card = makeCard(phase.techniques[pickIdx], pickIdx, 'article', true);
        slot.innerHTML = '';
        slot.appendChild(card);
        slot.style.minHeight = '';
        if (!motionOK()) return;
        card.classList.add('is-slapped');
        const tilt = parseFloat(card.style.getPropertyValue('--tilt')) || 0;
        gsap.fromTo(
          card,
          { opacity: 0, y: -40, scale: 0.9, rotation: gsap.utils.random(-8, 8) },
          { opacity: 1, y: 0, scale: 1, rotation: tilt, duration: 0.6, ease: 'back.out(2)', clearProps: 'transform,opacity' }
        );
        gsap.delayedCall(0.3, () => burstFrom(card));
      }

      function roll() {
        if (rolling) return;
        let pick = Math.floor(Math.random() * n);
        if (n > 1 && pick === lastPick) pick = (pick + 1 + Math.floor(Math.random() * (n - 1))) % n;
        lastPick = pick;
        shuffleBtn.querySelector('.label').textContent = 'Otra técnica';
        if (showingAll) setShowAll(false);

        if (!motionOK()) { land(pick); return; }

        // tragaperras: el dado gira y los nombres pasan por el rodillo cada vez más despacio
        rolling = true;
        shuffleBtn.disabled = true;
        const dice = shuffleBtn.querySelector('.dice');
        gsap.fromTo(dice, { rotation: 0 }, { rotation: 360, duration: 0.75, ease: 'back.out(1.6)' });
        gsap.fromTo(dice, { y: 0 }, { y: -8, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' });

        slot.style.minHeight = slot.offsetHeight + 'px';
        slot.innerHTML = '<div class="technique-reel" aria-hidden="true"><span class="technique-reel__name"></span></div>';
        const nameEl = slot.querySelector('.technique-reel__name');
        gsap.from(slot.firstChild, { scaleY: 0.85, opacity: 0, duration: 0.2, ease: 'power2.out' });

        const names = phase.techniques.map((t) => t.name);
        const delays = [55, 55, 60, 65, 75, 90, 110, 135, 170, 215];
        // arrancamos de modo que el último nombre del rodillo sea justo el elegido
        let i = (pick - delays.length) % n;
        if (i < 0) i += n;
        let elapsed = 0;
        delays.forEach((d) => {
          elapsed += d;
          gsap.delayedCall(elapsed / 1000, () => {
            i = (i + 1) % n;
            nameEl.textContent = names[i];
            gsap.fromTo(nameEl, { yPercent: -120, opacity: 0.35 }, { yPercent: 0, opacity: 1, duration: d / 1000, ease: 'power2.out' });
          });
        });
        gsap.delayedCall((elapsed + 260) / 1000, () => {
          land(pick);
          rolling = false;
          shuffleBtn.disabled = false;
        });
      }

      shuffleBtn.addEventListener('click', roll);
      empty.addEventListener('click', roll);
      toggleBtn.addEventListener('click', () => setShowAll(!showingAll));

      if (JOY.initMagnetic) JOY.initMagnetic(detailContainer);

      if (motionOK()) {
        gsap.from([desc, controls, slot], { opacity: 0, y: 12, duration: 0.4, ease: 'power2.out', stagger: 0.06, clearProps: 'all' });
      }
    }

    function renderDetail(phase) {
      if (pendingOut) { pendingOut.kill(); pendingOut = null; }
      const old = detailContainer.children;
      if (!motionOK() || !old.length) { buildDetail(phase); return; }
      // lo anterior se despega y cae antes de que entre la nueva fase
      pendingOut = gsap.to(old, {
        opacity: 0, y: 20, duration: 0.22, ease: 'power2.in', stagger: 0.03,
        onComplete: () => { pendingOut = null; buildDetail(phase); },
      });
    }

    const panels = [];
    window.PHASES.forEach((phase, i) => {
      const panel = document.createElement('button');
      panel.type = 'button';
      panel.className = 'phase-split-panel';
      panel.id = 'phase-tab-' + phase.id;
      panel.setAttribute('role', 'tab');
      panel.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      panel.setAttribute('aria-controls', 'phase-detail');
      panel.setAttribute('tabindex', i === 0 ? '0' : '-1');
      panel.setAttribute('data-cursor', 'Elegir →');
      panel.innerHTML =
        '<span class="phase-split-panel__base" aria-hidden="true"><span class="phase-split-panel__img"></span></span>' +
        '<span class="phase-split-panel__tint" aria-hidden="true"></span>' +
        '<span class="phase-split-panel__reveal" aria-hidden="true"><span class="phase-split-panel__img"></span></span>' +
        '<span class="phase-split-panel__overlay" aria-hidden="true"></span>' +
        '<span class="phase-split-panel__bar" aria-hidden="true"></span>' +
        '<span class="phase-split-panel__label">' +
        '<span class="phase-split-panel__title">' +
        '<span class="phase-split-panel__index">' + phase.index + '</span>' +
        '<span class="phase-split-panel__name">' + phase.name + '.</span>' +
        '</span>' +
        '<span class="phase-split-panel__hint">' + phase.description + '</span>' +
        '</span>';
      panel.addEventListener('click', (e) => selectPhase(i, e));
      panelsContainer.appendChild(panel);
      panels.push(panel);
    });

    const fx = initPanelFX(panelsContainer, panels);
    let current = 0;

    // flechas del teclado para recorrer las fases (patrón de tabs)
    panelsContainer.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
      if (!(e.key in keys)) return;
      e.preventDefault();
      let next = current + keys[e.key];
      if (next === -Infinity) next = 0;
      if (next === Infinity) next = panels.length - 1;
      next = (next + panels.length) % panels.length;
      panels[next].focus();
      selectPhase(next);
    });

    function selectPhase(i, evt) {
      const changed = i !== current;
      panelsContainer.dataset.dir = i >= current ? 'right' : 'left';
      current = i;
      panels.forEach((p, idx) => {
        p.classList.toggle('phase-split-panel--active', idx === i);
        p.setAttribute('aria-selected', idx === i ? 'true' : 'false');
        p.setAttribute('tabindex', idx === i ? '0' : '-1');
      });
      fx.setActive(i, evt);
      if (changed || !detailContainer.children.length) renderDetail(window.PHASES[i]);
    }

    selectPhase(0);
  }

  /* ---------------------------------------------------------------------------
     Paneles de fase como "cuarto oscuro":
     - en reposo cada foto está en duotono cobalto (una idea sin revelar)
     - el cursor es una lámpara: dentro de su círculo aparece la foto real, y el
       círculo cruza de un panel a otro sin cortes porque todos comparten el centro
     - los anchos siguen al cursor de forma continua (ojo de pez), sin saltos
     - elegir una fase la "ilumina": el círculo crece desde el clic hasta llenarla
     ------------------------------------------------------------------------- */
  function initPanelFX(container, panels) {
    const hasGsap = typeof gsap !== 'undefined';
    const motion = motionOK();
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const wide = window.matchMedia('(min-width: 801px)');
    const lensOn = () => motion && fine.matches;
    const fisheyeOn = () => motion && fine.matches && wide.matches;

    const state = panels.map((panel) => ({
      panel,
      reveal: panel.querySelector('.phase-split-panel__reveal'),
      imgs: panel.querySelectorAll('.phase-split-panel__img'),
      mx: 0, my: 0, lens: 0, lit: 0, px: 0, py: 0, grow: 1,
    }));
    let active = 0;

    // sin GSAP: el panel activo simplemente se muestra a color
    if (!hasGsap) {
      return {
        setActive(i) {
          active = i;
          state.forEach((s, idx) => s.reveal.style.setProperty('--r', idx === i ? '4000px' : '0px'));
        },
      };
    }

    state.forEach((s) => {
      s.mxTo = gsap.quickTo(s, 'mx', { duration: 0.3, ease: 'power3.out' });
      s.myTo = gsap.quickTo(s, 'my', { duration: 0.3, ease: 'power3.out' });
      s.lensTo = gsap.quickTo(s, 'lens', { duration: 0.55, ease: 'power3.out' });
      s.pxTo = gsap.quickTo(s, 'px', { duration: 0.8, ease: 'power3.out' });
      s.pyTo = gsap.quickTo(s, 'py', { duration: 0.8, ease: 'power3.out' });
      s.growTo = gsap.quickTo(s, 'grow', { duration: 0.7, ease: 'power3.out' });
      s.mx = s.panel.offsetWidth / 2;
      s.my = s.panel.offsetHeight * 0.62;
    });
    if (fisheyeOn()) container.classList.add('is-fisheye');

    // cada frame: pasar el estado a variables CSS y estilos
    gsap.ticker.add(() => {
      const fisheye = container.classList.contains('is-fisheye');
      state.forEach((s) => {
        const w = s.panel.offsetWidth, h = s.panel.offsetHeight;
        // radio que cubre todo el panel desde el centro actual del círculo
        const far = Math.max(
          Math.hypot(s.mx, s.my), Math.hypot(w - s.mx, s.my),
          Math.hypot(s.mx, h - s.my), Math.hypot(w - s.mx, h - s.my)
        );
        const full = far / 0.55 + 40;
        const r = Math.max(s.lens, s.lit * full);
        s.reveal.style.setProperty('--mx', s.mx.toFixed(1) + 'px');
        s.reveal.style.setProperty('--my', s.my.toFixed(1) + 'px');
        s.reveal.style.setProperty('--r', r.toFixed(1) + 'px');
        const t = 'translate3d(' + s.px.toFixed(2) + 'px,' + s.py.toFixed(2) + 'px,0)';
        s.imgs[0].style.transform = t;
        s.imgs[1].style.transform = t;
        s.panel.style.flexGrow = fisheye ? s.grow.toFixed(4) : '';
      });
    });

    const restWidths = () => state.forEach((s, idx) => s.growTo(idx === active ? 1.3 : 1));
    restWidths();

    let lastX = 0, lastY = 0, speed = 0;
    container.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (!lensOn()) return;
      container.classList.add('is-hovering');
      const v = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX; lastY = e.clientY;
      speed += (Math.min(v, 60) - speed) * 0.25;
      const lensR = 150 + speed * 1.6; // cuanto más rápido, más grande la lámpara

      const box = container.getBoundingClientRect();
      const x = e.clientX - box.left;
      const W = box.width, n = state.length;
      const hovered = e.target.closest ? e.target.closest('.phase-split-panel') : null;

      state.forEach((s, idx) => {
        const r = s.panel.getBoundingClientRect();
        // todos los paneles comparten el mismo centro: el círculo cruza los bordes sin cortes
        s.mxTo(e.clientX - r.left);
        s.myTo(e.clientY - r.top);
        s.lensTo(lensR);
        const isHovered = s.panel === hovered;
        s.panel.classList.toggle('is-near', isHovered);
        s.pxTo(isHovered ? ((e.clientX - r.left) / r.width - 0.5) * -22 : 0);
        s.pyTo(isHovered ? ((e.clientY - r.top) / r.height - 0.5) * -14 : 0);
        if (fisheyeOn()) {
          // centros fijos (reparto igual) para que el ancho no se retroalimente
          const cx = (idx + 0.5) * W / n;
          const d = (x - cx) / (W * 0.2);
          s.growTo(1 + 0.9 * Math.exp(-d * d) + (idx === active ? 0.1 : 0));
        }
      });
    });

    container.addEventListener('pointerleave', () => {
      container.classList.remove('is-hovering');
      speed = 0;
      state.forEach((s) => {
        s.panel.classList.remove('is-near');
        s.lensTo(0);
        s.pxTo(0);
        s.pyTo(0);
      });
      restWidths();
    });

    const onMQ = () => {
      container.classList.toggle('is-fisheye', fisheyeOn());
      restWidths();
    };
    if (wide.addEventListener) wide.addEventListener('change', onMQ);

    // entrada: los paneles se revelan de abajo arriba y luego "se enciende" el activo
    let entered = !(motion && typeof ScrollTrigger !== 'undefined');
    if (!entered) {
      gsap.registerPlugin(ScrollTrigger);
      const titles = container.querySelectorAll('.phase-split-panel__title');
      gsap.set(panels, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(titles, { yPercent: 120, opacity: 0 });
      ScrollTrigger.create({
        trigger: container,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.timeline({ onComplete: () => { entered = true; } })
            .to(panels, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut', stagger: 0.1, clearProps: 'clipPath' })
            .to(titles, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, clearProps: 'all' }, '-=0.55')
            .add(() => light(active, null), '-=0.2');
        },
      });
    }

    function light(i, evt) {
      const s = state[i];
      if (evt && evt.clientX) {
        const r = s.panel.getBoundingClientRect();
        s.mx = evt.clientX - r.left;
        s.my = evt.clientY - r.top;
      } else if (!container.classList.contains('is-hovering')) {
        s.mx = s.panel.offsetWidth / 2;
        s.my = s.panel.offsetHeight * 0.62;
      }
      gsap.fromTo(s, { lit: 0 }, { lit: 1, duration: 1.15, ease: 'expo.out', overwrite: 'auto' });
    }

    return {
      setActive(i, evt) {
        const prev = active;
        active = i;
        if (!motion) {
          state.forEach((s, idx) => { s.lit = idx === i ? 1 : 0; });
          return;
        }
        if (prev !== i) gsap.to(state[prev], { lit: 0, duration: 0.7, ease: 'power3.inOut', overwrite: 'auto' });
        if (!entered) return; // la animación de entrada encenderá el activo
        if (prev !== i || state[i].lit < 1) light(i, evt);
        if (!container.classList.contains('is-hovering')) restWidths();
      },
    };
  }

  document.addEventListener('DOMContentLoaded', renderPhases);
})();
