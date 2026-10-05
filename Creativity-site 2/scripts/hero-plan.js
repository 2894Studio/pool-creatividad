/* hero-plan.js — complemento del inicio: a partir del reto o idea que escribe
   el usuario, arma con lógica local (sin backend ni llamada a ningún LLM) un
   plan de ideación muy breve (una técnica por fase, ya definidas en
   data/techniques.js) y un prompt listo para pegar en una herramienta de LLM.
   No reemplaza a "Empezar el viaje" ni a "Dame un reto": es un complemento
   que vive solo en el inicio. */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // una técnica de arranque por fase: corta, sin materiales especiales, representativa de la fase
  const QUICK_PICKS = {
    preparacion: '"¿Cómo podríamos...?"',
    incubacion: 'Paseo creativo',
    iluminacion: 'Brainstorming clásico',
    implementacion: 'Design Sprint / prototipado rápido',
  };

  function findTechnique(phase) {
    const name = QUICK_PICKS[phase.id];
    return name && phase.techniques.find((t) => t.name === name);
  }

  function buildPrompt(idea, picks) {
    const steps = picks.map((p, i) =>
      (i + 1) + '. ' + p.phase.name + ' — "' + p.technique.name + '": ' + p.technique.exercise
    ).join('\n');
    return 'Actúa como facilitador de un proceso de ideación en 4 fases (Preparación, Incubación, ' +
      'Iluminación, Implementación), basado en el modelo de Graham Wallas. Mi reto o idea es: ' + idea + '.\n\n' +
      'Guiame fase por fase, una a la vez, empezando por Preparación. En cada fase, partí de esta técnica ' +
      'y después profundizá conmigo con preguntas antes de pasar a la siguiente:\n\n' + steps +
      '\n\nAl cerrar cada fase, resumime en una frase la idea o decisión a la que llegamos.';
  }

  function init() {
    const root = document.querySelector('.hero-plan');
    if (!root || !window.PHASES) return;
    const input = root.querySelector('.hero-plan__input');
    const generateBtn = root.querySelector('.hero-plan__generate');
    const output = root.querySelector('.hero-plan__output');
    const steps = root.querySelector('.hero-plan__steps');
    const result = root.querySelector('.hero-plan__result');
    const copyBtn = root.querySelector('.hero-plan__copy');
    const hint = root.querySelector('.hero-plan__hint');
    if (!input || !generateBtn) return;

    const picks = window.PHASES.map((phase) => {
      const technique = findTechnique(phase);
      return technique ? { phase, technique } : null;
    }).filter(Boolean);

    input.addEventListener('input', () => { generateBtn.disabled = !input.value.trim(); });

    generateBtn.addEventListener('click', () => {
      const idea = input.value.trim();
      if (!idea) return;
      steps.innerHTML = picks.map((p) =>
        '<li><span class="hero-plan__phase">' + p.phase.index + ' ' + esc(p.phase.name) + '</span>' +
        '<strong>' + esc(p.technique.name) + '</strong>' +
        '<span class="hero-plan__exercise">' + esc(p.technique.exercise) + '</span></li>'
      ).join('');
      result.value = buildPrompt(idea, picks);
      output.hidden = false;
      hint.hidden = true;
    });

    let hintTimer = null;
    copyBtn.addEventListener('click', () => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(result.value).then(() => {
        hint.hidden = false;
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => { hint.hidden = true; }, 1500);
      }, () => {});
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
