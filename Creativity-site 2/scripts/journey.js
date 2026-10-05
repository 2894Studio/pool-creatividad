/* journey.js — el sitio como recorrido: cada sección es una escena a pantalla
   completa y se avanza con la rueda, deslizando, con el teclado o con botones.
   Sin JS las escenas quedan apiladas como una página normal.

   API (window.JOURNEY):
     goTo(i | id), next(), prev(), current() → id
     register(id, { enter({ dir, first, scene }), leave({ dir, scene }) })
   Eventos en document: 'journey:change' con detail { from, to, dir }. */
(function () {
  const JOY = window.JOY || {};
  const motionOK = () => (JOY.motionOK ? JOY.motionOK() : false);
  const hasGsap = typeof gsap !== 'undefined';

  const JOURNEY = (window.JOURNEY = window.JOURNEY || {});
  const hooks = {};
  // varios scripts pueden escuchar la misma escena; '*' escucha todas
  JOURNEY.register = (id, h) => { (hooks[id] = hooks[id] || []).push(h); };
  const call = (id, name, arg) => {
    (hooks[id] || []).concat(hooks['*'] || []).forEach((h) => { if (h[name]) h[name](arg); });
  };

  let scenes = [];
  let current = 0;
  let busy = false;
  let navEl = null;
  let dots = [];
  const visited = new Set();

  const PHASE_IDS = ['preparacion', 'incubacion', 'iluminacion', 'implementacion'];

  function indexOf(idOrIndex) {
    if (typeof idOrIndex === 'number') return idOrIndex;
    return scenes.findIndex((s) => s.id === idOrIndex);
  }

  function indexFromHash() {
    const id = decodeURIComponent((location.hash || '').slice(1));
    const i = id ? indexOf(id) : 0;
    return i < 0 ? 0 : i;
  }

  function labelFor(i) {
    const s = scenes[i];
    const p = PHASE_IDS.indexOf(s.id);
    return p >= 0 ? '0' + (p + 1) + ' ' + s.dataset.label : s.dataset.label;
  }

  /* ---------------- cromo: camino de puntos, logo ---------------- */
  function buildNav() {
    navEl = document.querySelector('.journey-nav');
    if (!navEl) return;
    navEl.hidden = false;
    navEl.innerHTML =
      '<button class="journey-nav__arrow" type="button" data-journey-prev aria-label="Escena anterior">‹</button>' +
      '<ol class="journey-nav__path"></ol>' +
      '<button class="journey-nav__arrow" type="button" data-journey-next aria-label="Escena siguiente">›</button>';
    const path = navEl.querySelector('.journey-nav__path');
    dots = scenes.map((s, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'journey-dot';
      b.dataset.journeyGo = s.id;
      b.setAttribute('aria-label', 'Ir a ' + labelFor(i));
      b.innerHTML =
        '<span class="journey-dot__icon" aria-hidden="true">' + (s.dataset.icon || '') + '</span>' +
        '<span class="journey-dot__label" aria-hidden="true">' + labelFor(i) + '</span>';
      li.appendChild(b);
      path.appendChild(li);
      return b;
    });
  }

  function syncChrome() {
    const s = scenes[current];
    document.body.dataset.scene = s.id;
    document.body.dataset.tone = s.dataset.tone || 'light';
    visited.add(current);
    dots.forEach((d, i) => {
      d.classList.toggle('is-current', i === current);
      d.classList.toggle('is-visited', visited.has(i) && i !== current);
      if (i === current) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    if (navEl) {
      navEl.querySelector('[data-journey-prev]').disabled = current === 0;
      navEl.querySelector('[data-journey-next]').disabled = current === scenes.length - 1;
    }
    const badge = document.querySelector('.companies-badge');
    if (badge) badge.classList.toggle('is-scrolled', current > 0);

    const announce = document.getElementById('journey-announce');
    if (announce) announce.textContent = 'Paso ' + (current + 1) + ' de ' + scenes.length + ': ' + labelFor(current);
  }

  function setSceneState(s, active) {
    s.classList.toggle('is-active', active);
    if (active) { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); }
    else { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
  }

  function focusTitle(s) {
    const t = s.querySelector('[data-scene-title]');
    if (t) { try { t.focus({ preventScroll: true }); } catch (_) { t.focus(); } }
  }

  /* ---------------- transición entre escenas ---------------- */
  function goTo(target, opts) {
    const o = opts || {};
    const i = Math.max(0, Math.min(scenes.length - 1, indexOf(target)));
    if (i === current || busy || i < 0) return;
    const from = current;
    const dir = i > from ? 1 : -1;
    const outgoing = scenes[from];
    const incoming = scenes[i];
    current = i;

    if (o.push !== false) {
      const url = i === 0 ? location.pathname + location.search : '#' + incoming.id;
      try { history.pushState({ scene: i }, '', url); } catch (_) { if (i > 0) location.hash = incoming.id; }
    }

    call(outgoing.id, 'leave', { dir, scene: outgoing });
    incoming.scrollTop = 0;
    setSceneState(incoming, true);
    syncChrome();
    document.dispatchEvent(new CustomEvent('journey:change', { detail: { from: outgoing.id, to: incoming.id, dir } }));
    if (JOY.sfx) JOY.sfx('whoosh');

    const done = () => {
      setSceneState(outgoing, false);
      outgoing.classList.remove('is-leaving');
      busy = false;
    };
    const enterHook = () => {
      call(incoming.id, 'enter', { dir, first: !incoming.dataset.entered, scene: incoming });
      incoming.dataset.entered = '1';
      focusTitle(incoming);
    };

    if (!motionOK()) {
      done();
      enterHook();
      return;
    }

    busy = true;
    outgoing.classList.add('is-leaving');
    // la escena nueva entra "barriendo" desde el lado hacia el que vamos; la vieja se hunde un poco
    gsap.timeline({ onComplete: done })
      .fromTo(incoming,
        { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
      .fromTo(outgoing,
        { yPercent: 0, scale: 1, opacity: 1 },
        { yPercent: -8 * dir, scale: 0.96, opacity: 0.35, duration: 0.85, ease: 'power4.inOut', clearProps: 'transform,opacity' }, 0)
      .add(enterHook, 0.35);
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  JOURNEY.goTo = goTo;
  JOURNEY.next = next;
  JOURNEY.prev = prev;
  JOURNEY.current = () => (scenes[current] ? scenes[current].id : null);
  JOURNEY.isLive = () => scenes.length > 0;

  /* ---------------- entradas: rueda, gestos, teclado, botones ---------------- */
  // escenas con overflow:hidden (p. ej. #inicio) nunca scrollean de verdad, aunque su
  // contenido mida unos px más que el viewport — si no, ese sobrante bloquea el cambio de escena
  const canScroll = (el, d) => {
    if (getComputedStyle(el).overflowY === 'hidden') return false;
    return d > 0
      ? el.scrollTop + el.clientHeight < el.scrollHeight - 2
      : el.scrollTop > 2;
  };

  const inIgnored = (t) => !!(t && t.closest && t.closest('[data-journey-ignore]'));

  function initInputs() {
    // rueda: acumulamos, y tras cambiar de escena bloqueamos mientras siga llegando la inercia del trackpad
    let acc = 0;
    let lastWheel = 0;
    let gate = 0;
    let navAt = 0;
    window.addEventListener('wheel', (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (horizontal && inIgnored(e.target)) return;
      const d = horizontal ? e.deltaX : e.deltaY;
      if (!horizontal && canScroll(scenes[current], d)) { acc = 0; return; }
      const now = performance.now();
      if (now < gate) {
        if (now - navAt < 1400) gate = Math.max(gate, now + 160);
        return;
      }
      if (now - lastWheel > 220) acc = 0;
      lastWheel = now;
      if (busy) return;
      acc += d;
      if (Math.abs(acc) > 70) {
        const dir = acc > 0 ? 1 : -1;
        acc = 0;
        navAt = now;
        gate = now + 750;
        goTo(current + dir);
      }
    }, { passive: true });

    // deslizar en pantallas táctiles
    let t0 = null;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { t0 = null; return; }
      const t = e.touches[0];
      const s = scenes[current];
      t0 = {
        x: t.clientX, y: t.clientY, time: performance.now(), ignored: inIgnored(e.target),
        atBottom: !canScroll(s, 1), atTop: !canScroll(s, -1),
      };
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (!t0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - t0.x;
      const dy = t.clientY - t0.y;
      const start = t0;
      t0 = null;
      if (performance.now() - start.time > 900) return;
      const s = scenes[current];
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 60) {
        if (start.ignored) return;
        goTo(current + (dx < 0 ? 1 : -1));
      } else if (Math.abs(dy) > 70 && !start.ignored) {
        if (dy < 0 && start.atBottom && !canScroll(s, 1)) next();
        if (dy > 0 && start.atTop && !canScroll(s, -1)) prev();
      }
    }, { passive: true });

    // teclado
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const s = scenes[current];
      const onControl = t && t.closest && t.closest('button, a, [role="tab"]');
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); next(); break;
        case 'ArrowLeft': e.preventDefault(); prev(); break;
        case 'ArrowDown':
        case 'PageDown':
          if (canScroll(s, 1)) return;
          e.preventDefault(); next(); break;
        case 'ArrowUp':
        case 'PageUp':
          if (canScroll(s, -1)) return;
          e.preventDefault(); prev(); break;
        case ' ':
          if (onControl || canScroll(s, 1)) return;
          e.preventDefault(); next(); break;
        case 'Home': e.preventDefault(); goTo(0); break;
        case 'End': e.preventDefault(); goTo(scenes.length - 1); break;
        default:
      }
    });

    // botones declarativos: data-journey-next / -prev / -go="id", y enlaces #escena
    document.addEventListener('click', (e) => {
      const el = e.target.closest ? e.target.closest('[data-journey-next],[data-journey-prev],[data-journey-go],a[href^="#"]') : null;
      if (!el) return;
      if (el.hasAttribute('data-journey-next')) { next(); return; }
      if (el.hasAttribute('data-journey-prev')) { prev(); return; }
      const id = el.dataset.journeyGo || (el.getAttribute('href') || '').slice(1);
      const i = indexOf(id);
      if (i >= 0) { e.preventDefault(); goTo(i); }
    });

    const sync = () => { const i = indexFromHash(); if (i !== current) goTo(i, { push: false }); };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
  }

  function init() {
    const root = document.getElementById('journey');
    if (!root) return;
    scenes = Array.from(root.querySelectorAll(':scope > .scene'));
    if (!scenes.length) return;
    root.classList.add('is-live');
    document.documentElement.classList.add('journey-live');
    buildNav();
    current = indexFromHash();
    scenes.forEach((s, i) => setSceneState(s, i === current));
    syncChrome();
    initInputs();
    // la primera escena "entra" cuando todos los scripts ya registraron sus hooks
    setTimeout(() => {
      const s = scenes[current];
      call(s.id, 'enter', { dir: 0, first: true, scene: s });
      s.dataset.entered = '1';
    }, 0);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
