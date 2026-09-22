(function () {
  function renderPhases() {
    const panelsContainer = document.getElementById('phase-split');
    const detailContainer = document.getElementById('phase-detail');
    if (!panelsContainer || !detailContainer || !window.PHASES) return;

    function renderDetail(phase) {
      detailContainer.innerHTML = '';

      const desc = document.createElement('p');
      desc.className = 'phase-detail__desc';
      desc.textContent = phase.description;
      detailContainer.appendChild(desc);

      const shuffleBtn = document.createElement('button');
      shuffleBtn.type = 'button';
      shuffleBtn.className = 'phase-card__shuffle';
      shuffleBtn.textContent = '🎲 Probar una técnica al azar';
      detailContainer.appendChild(shuffleBtn);

      const result = document.createElement('div');
      result.className = 'phase-card__result';
      result.hidden = true;
      result.setAttribute('aria-live', 'polite');
      detailContainer.appendChild(result);

      shuffleBtn.addEventListener('click', () => {
        const pick = phase.techniques[Math.floor(Math.random() * phase.techniques.length)];
        result.hidden = false;
        result.innerHTML = '<strong>' + pick.name + '</strong> (' + pick.source + ') — ' + pick.exercise;
      });

      const list = document.createElement('ul');
      list.className = 'technique-list';
      phase.techniques.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'technique-card';

        const sourceMarkup = t.link
          ? '<a class="technique-card__source-link" href="' + t.link + '" target="_blank" rel="noreferrer noopener">' + t.source + '</a>'
          : '<span class="technique-card__source">' + t.source + '</span>';

        li.innerHTML =
          '<div class="technique-card__header"><h4>' + t.name + '</h4>' +
          sourceMarkup + '</div>' +
          '<p class="technique-card__desc">' + t.description + '</p>' +
          '<p class="technique-card__exercise"><strong>Ejercicio:</strong> ' + t.exercise + '</p>' +
          '<span class="technique-card__duration">⏱ ' + t.duration + '</span>';
        list.appendChild(li);
      });
      detailContainer.appendChild(list);
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
      panel.innerHTML =
        '<span class="phase-split-panel__bg" aria-hidden="true"></span>' +
        '<span class="phase-split-panel__overlay" aria-hidden="true"></span>' +
        '<span class="phase-split-panel__label">' +
        '<span class="phase-split-panel__index">' + phase.index + '</span>' +
        '<span class="phase-split-panel__name">' + phase.name + '.</span>' +
        '</span>';
      panel.addEventListener('click', () => selectPhase(i));
      panelsContainer.appendChild(panel);
      panels.push(panel);
    });

    function selectPhase(i) {
      panels.forEach((p, idx) => {
        p.classList.toggle('phase-split-panel--active', idx === i);
        p.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
      renderDetail(window.PHASES[i]);
    }

    selectPhase(0);
  }

  document.addEventListener('DOMContentLoaded', renderPhases);
})();

