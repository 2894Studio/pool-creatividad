/* technique-modal.js — modal de lectura para una técnica puntual, usado por
   los links de técnica del plan generado (scripts/hero-plan.js,
   data-open-technique-modal="fase:art"). Reutiliza las mismas clases
   .tech-detail__* / .tech-stat* que la ficha de técnica de cada fase
   (scripts/phases.js, renderDetail), pero sin el bloque interactivo de
   prompt por LLM — sólo lectura — y sin navegar de escena: se abre encima
   de donde esté el usuario (pensado para la escena #plan) y "volver al
   plan" es sencillamente cerrarlo. */
(function () {
  const JOY = window.JOY || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function init() {
    const modal = document.querySelector('.tech-modal');
    const detail = modal && modal.querySelector('.tech-modal__detail');
    if (!modal || !detail || !window.PHASES) return;

    let art = null; // instancia activa de JOY.dotArt, para destruirla al cerrar/cambiar
    let lastFocused = null;

    function render(phase, t) {
      if (art) { art.destroy(); art = null; }
      const source = t.link
        ? '<a class="tech-stat__value tech-stat__link" href="' + t.link + '" target="_blank" rel="noreferrer noopener">' + esc(t.source) + ' <span aria-hidden="true">↗</span></a>'
        : '<span class="tech-stat__value">' + esc(t.source) + '</span>';
      detail.innerHTML =
        '<figure class="tech-detail__art">' +
        '<canvas role="img" aria-label="' + esc(t.artCaption || t.name) + '"></canvas>' +
        (t.artCaption ? '<figcaption class="tech-detail__caption">' + esc(t.artCaption) + '</figcaption>' : '') +
        '</figure>' +
        '<div class="tech-detail__body">' +
        '<p class="tech-detail__kicker">Técnica · ' + esc(phase.name) + '</p>' +
        '<h3 class="tech-detail__name" id="tech-modal-name" tabindex="-1">' + esc(t.name) + '</h3>' +
        '<p class="tech-detail__desc">' + esc(t.description) + '</p>' +
        '<div class="tech-stats">' +
        '<div class="tech-stat tech-stat--wide"><span class="tech-stat__label">Ejercicio</span><p class="tech-stat__value">' + esc(t.exercise) + '</p></div>' +
        '<div class="tech-stat"><span class="tech-stat__label">Duración</span><span class="tech-stat__value tech-stat__value--big">' + esc(t.duration) + '</span></div>' +
        '<div class="tech-stat"><span class="tech-stat__label">Fuente</span>' + source + '</div>' +
        (t.insight ? '<div class="tech-stat tech-stat--wide tech-stat--insight"><span class="tech-stat__label">Por qué funciona</span><p class="tech-stat__value">' + esc(t.insight) + '</p></div>' : '') +
        '</div>' +
        '</div>';
      if (JOY.dotArt) {
        art = JOY.dotArt(detail.querySelector('canvas'), { motif: phase.id, art: t.art, seed: Math.floor(Math.random() * 1000), start: 0, interactive: true });
        art.accent(true);
        art.play({ duration: phase.id === 'incubacion' ? 2 : 1.3 });
      }
    }

    function open(phaseId, techArt) {
      const phase = window.PHASES.find((p) => p.id === phaseId);
      const t = phase && phase.techniques.find((x) => x.art === techArt);
      if (!phase || !t) return;
      lastFocused = document.activeElement;
      render(phase, t);
      modal.hidden = false;
      const journey = document.getElementById('journey');
      if (journey) journey.setAttribute('inert', '');
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        const name = detail.querySelector('#tech-modal-name');
        if (name) { try { name.focus({ preventScroll: true }); } catch (_) { name.focus(); } }
      });
    }

    function close() {
      if (modal.hidden) return;
      modal.classList.remove('is-open');
      const journey = document.getElementById('journey');
      if (journey) journey.removeAttribute('inert');
      setTimeout(() => {
        modal.hidden = true;
        if (art) { art.destroy(); art = null; }
      }, 250);
      if (lastFocused && lastFocused.isConnected) { try { lastFocused.focus({ preventScroll: true }); } catch (_) { lastFocused.focus(); } }
      lastFocused = null;
    }

    document.addEventListener('click', (e) => {
      const opener = e.target.closest ? e.target.closest('[data-open-technique-modal]') : null;
      if (opener) {
        const [phaseId, techArt] = opener.dataset.openTechniqueModal.split(':');
        open(phaseId, techArt);
        return;
      }
      if (e.target.closest && e.target.closest('[data-tech-modal-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
