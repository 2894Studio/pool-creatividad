/* reto.js — escena final "Dame un reto": una técnica al azar de cualquier fase
   más una condición inesperada, con dos rodillos que paran uno tras otro. */
(function () {
  const JOY = window.JOY || {};

  function init() {
    const stage = document.getElementById('reto-stage');
    if (!stage || !window.PHASES || !JOY.createPicker) return;
    const challenges = window.CHALLENGES && window.CHALLENGES.length ? window.CHALLENGES : ['en 5 minutos'];

    // todas las técnicas en una sola lista, recordando de qué fase vienen
    const all = [];
    window.PHASES.forEach((phase) => phase.techniques.forEach((t) => all.push({ t, phase })));

    stage.innerHTML = '<div class="technique-stage__controls"></div><div class="technique-slot reto__slot" aria-live="polite"></div>';
    const controls = stage.firstChild;
    const slot = stage.lastChild;
    let last = -1;

    JOY.createPicker({
      controls, slot,
      label: 'Dame un reto',
      againLabel: 'Otro reto',
      emptyTitle: '¿Listo para un reto?',
      emptyText: 'Tira el dado: técnica + condición.',
      diceSize: 72,
      personality: {
        reelSpeed: 1.1,
        confetti(card) {
          if (JOY.burstFrom) JOY.burstFrom(card, { particleCount: 60, spread: 90, colors: ['#0A46FF', '#7DB7FF', '#F7F8FA', '#0B0B0D'] });
        },
      },
      draw() {
        let i = Math.floor(Math.random() * all.length);
        if (all.length > 1 && i === last) i = (i + 1) % all.length;
        last = i;
        const c = Math.floor(Math.random() * challenges.length);
        return {
          reels: [
            { label: 'Técnica', names: all.map((x) => x.t.name), index: i },
            { label: 'Condición', names: challenges, index: c },
          ],
          data: { item: all[i], challenge: challenges[c], i },
        };
      },
      render({ item, challenge, i }) {
        return JOY.makeTechniqueNote(item.t, i, 'article', true, {
          top: '<span class="reto-note__tag">' + item.phase.index + ' · ' + item.phase.name + '</span>',
          afterHeader: '<p class="reto-note__challenge">…' + challenge + '</p>',
          bottom: '<button class="reto-note__go" type="button" data-journey-go="' + item.phase.id + '">Ver su fase →</button>',
        });
      },
    });
    if (JOY.initMagnetic) JOY.initMagnetic(stage);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
