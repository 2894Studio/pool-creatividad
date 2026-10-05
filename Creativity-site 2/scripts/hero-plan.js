/* hero-plan.js — complemento del inicio: a partir del reto o idea que escribe
   el usuario arma dos cosas, en dos pestañas en la escena #plan:
   - "Plan": con lógica 100% local (sin red), un plan de ideación muy breve
     (una técnica por fase, de data/techniques.js) y un prompt para LLM.
   - "Ideas rápidas": pide de verdad a Claude (vía netlify/functions/ideas.js)
     una lista de variaciones concretas de la idea.
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
      'Guíame fase por fase, una a la vez, empezando por Preparación. En cada fase, parte de esta técnica ' +
      'y después profundiza conmigo con preguntas antes de pasar a la siguiente:\n\n' + steps +
      '\n\nAl cerrar cada fase, resúmeme en una frase la idea o decisión a la que llegamos.';
  }

  // prompt para una sola fase (botón de copiar por tarjeta): mismo tono que buildPrompt, pero acotado a esa fase
  function buildPhasePrompt(idea, phase, step) {
    return 'Actúa como facilitador de la fase de ' + phase.name + ' dentro de un proceso de ideación en 4 fases ' +
      '(Preparación, Incubación, Iluminación, Implementación), basado en el modelo de Graham Wallas. ' +
      'Mi reto o idea es: ' + idea + '.\n\n' +
      'Para esta fase, parte de esta técnica: "' + step.technique + '": ' + step.exercise + '\n\n' +
      'Guíame paso a paso solo en esta fase, haciéndome preguntas antes de darme conclusiones, y al cerrarla ' +
      'resúmeme en una frase la idea o decisión a la que llegamos.';
  }

  // prompt para profundizar una idea rápida concreta con un LLM (botón de copiar por tarjeta)
  function buildQuickIdeaPrompt(idea, quickIdea) {
    return 'Quiero explorar esta idea concreta: "' + quickIdea.title + '" — ' + quickIdea.pitch + '\n\n' +
      'Mi reto o idea de partida era: ' + idea + '.\n\n' +
      'Ayúdame a desarrollarla: hazme preguntas para afinarla, dime cómo la probaría rápido (en un día o ' +
      'una semana) y qué la haría diferente a lo obvio.';
  }

  const COPY_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 13V5.5C4.5 4.67157 5.17157 4 6 4H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const CHECK_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.5 10.5L8 14L15.5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const LOADING_MESSAGES = ['Leyendo tu idea…', 'Cruzando técnicas de ideación…', 'Buscando ángulos distintos…', 'Afinando las ideas…'];

  /* dictado por voz con microinteracción: mientras escucha, las barras del botón
     laten en vivo con el volumen real de la voz (AnalyserNode), como el modo
     de voz de Claude — no es solo un pulso fijo, reacciona a lo que decís. */
  function initVoiceInput(hero, input) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = hero.querySelector('.hero-plan__mic');
    if (!SpeechRecognition || !micBtn) return;
    micBtn.hidden = false;

    const bars = Array.from(micBtn.querySelectorAll('.hero-plan__mic-wave i'));
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let audioCtx = null;
    let analyser = null;
    let micStream = null;
    let rafId = null;

    function stopWave() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      bars.forEach((b) => { b.style.transform = 'scaleY(0.25)'; });
      if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
      if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
      analyser = null;
    }

    function tickWave() {
      if (!analyser) return;
      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 4); // RMS, amplificado para que se note
      bars.forEach((b, i) => {
        const jitter = 0.75 + 0.25 * Math.sin(Date.now() / 90 + i * 1.7); // cada barra respira distinto
        const scale = 0.25 + level * jitter * 1.6;
        b.style.transform = 'scaleY(' + Math.max(0.25, Math.min(1, scale)) + ')';
      });
      rafId = requestAnimationFrame(tickWave);
    }

    async function startWave() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        audioCtx.createMediaStreamSource(micStream).connect(analyser);
        tickWave();
      } catch (e) {
        // sin permiso de micrófono para el analizador: el dictado sigue andando, solo sin la animación
      }
    }

    recognition.addEventListener('result', (e) => {
      const said = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
      if (said) input.value = (input.value.trim() ? input.value.trim() + ' ' : '') + said;
      input.dispatchEvent(new Event('input'));
    });
    recognition.addEventListener('end', () => { micBtn.classList.remove('is-listening'); stopWave(); });
    recognition.addEventListener('error', () => { micBtn.classList.remove('is-listening'); stopWave(); });
    micBtn.addEventListener('click', () => {
      if (micBtn.classList.contains('is-listening')) { recognition.stop(); return; }
      micBtn.classList.add('is-listening');
      recognition.start();
      startWave();
    });
  }

  // plan local (plantilla, sin red): el mismo que se usaba antes de tener la función de Netlify
  function localPlan(idea, picks) {
    const byPhaseId = {};
    picks.forEach((p) => { byPhaseId[p.phase.id] = { technique: p.technique.name, exercise: p.technique.exercise }; });
    return Object.assign(byPhaseId, { llmPrompt: buildPrompt(idea, picks) });
  }

  // ideas rápidas reales, pedidas a Claude vía la Netlify Function (netlify/functions/ideas.js);
  // la API key vive solo en el servidor, nunca acá
  async function fetchQuickIdeas(idea) {
    const res = await fetch('/.netlify/functions/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    });
    if (!res.ok) throw new Error('ideas function respondió ' + res.status);
    const data = await res.json();
    if (!data || !Array.isArray(data.ideas) || !data.ideas.length) throw new Error('respuesta con forma inesperada');
    return data.ideas;
  }

  function init() {
    const hero = document.querySelector('.hero-plan');
    const scene = document.getElementById('plan');
    if (!hero || !scene || !window.PHASES) return;
    const input = hero.querySelector('.hero-plan__input');
    const generateBtn = hero.querySelector('.hero-plan__generate');
    const loading = document.querySelector('.hero-loading');
    const loadingText = loading && loading.querySelector('.hero-loading__text');
    const loadingOrb = loading && loading.querySelector('.hero-loading__orb');
    const ideaLine = scene.querySelector('#hero-plan-idea');
    const tabs = scene.querySelector('.hero-plan__tabs');
    const steps = scene.querySelector('.hero-plan__steps');
    const result = scene.querySelector('.hero-plan__result');
    const copyBtn = scene.querySelector('.hero-plan__copy');
    const hint = scene.querySelector('.hero-plan__hint');
    const ideasList = scene.querySelector('.hero-plan__ideas');
    if (!input || !generateBtn) return;

    const picks = window.PHASES.map((phase) => {
      const technique = findTechnique(phase);
      return technique ? { phase, technique } : null;
    }).filter(Boolean);

    input.addEventListener('input', () => { generateBtn.disabled = !input.value.trim(); });

    initVoiceInput(hero, input);

    // ---------- pestañas Plan / Ideas rápidas ----------
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.hero-plan__tab');
        if (!btn) return;
        tabs.querySelectorAll('.hero-plan__tab').forEach((t) => {
          const active = t === btn;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
          t.tabIndex = active ? 0 : -1;
        });
        scene.querySelectorAll('.hero-plan__tabpanel').forEach((panel) => {
          panel.hidden = panel.dataset.tabpanel !== btn.dataset.tab;
        });
      });
    }

    // ---------- loading de pantalla completa ----------
    let loadingTimer = null;
    function pulseOrb() {
      if (!loadingOrb) return;
      loadingOrb.classList.remove('is-splitting');
      void loadingOrb.offsetWidth; // reinicia la animación de "división" aunque la clase ya estuviera puesta
      loadingOrb.classList.add('is-splitting');
    }
    function showLoading() {
      if (!loading) return;
      document.body.classList.add('is-generating-plan');
      let i = 0;
      loadingText.textContent = LOADING_MESSAGES[0];
      pulseOrb();
      clearInterval(loadingTimer);
      loadingTimer = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length;
        loadingText.textContent = LOADING_MESSAGES[i];
        pulseOrb();
      }, 2200);
    }
    function hideLoading() {
      document.body.classList.remove('is-generating-plan');
      clearInterval(loadingTimer);
      loadingTimer = null;
    }

    // ---------- pestaña Plan (local, sin red) ----------
    let currentIdea = '';
    let currentPlan = null;

    function renderPlan(idea, plan) {
      currentIdea = idea;
      currentPlan = plan;
      ideaLine.textContent = 'Tu idea: «' + idea + '»';
      steps.innerHTML = window.PHASES.map((phase) => {
        const s = plan[phase.id];
        if (!s) return '';
        return '<li><div class="hero-plan__step-head"><span class="hero-plan__phase">' + phase.index + ' ' + esc(phase.name) + '</span>' +
          '<button type="button" class="hero-plan__step-copy" data-phase="' + esc(phase.id) + '" aria-label="Copiar prompt de esta fase" title="Copiar prompt de esta fase">' +
          '<span class="hero-plan__step-copy-icon">' + COPY_ICON + '</span><span class="hero-plan__step-check">' + CHECK_ICON + '</span></button></div>' +
          '<strong>' + esc(s.technique) + '</strong>' +
          '<span class="hero-plan__exercise">' + esc(s.exercise) + '</span></li>';
      }).join('');
      result.value = plan.llmPrompt;
      hint.hidden = true;
    }

    let stepCopyTimer = null;
    steps.addEventListener('click', (e) => {
      const btn = e.target.closest('.hero-plan__step-copy');
      if (!btn || !currentPlan || !navigator.clipboard || !navigator.clipboard.writeText) return;
      const phase = window.PHASES.find((p) => p.id === btn.dataset.phase);
      const step = currentPlan[btn.dataset.phase];
      if (!phase || !step) return;
      navigator.clipboard.writeText(buildPhasePrompt(currentIdea, phase, step)).then(() => {
        btn.classList.add('is-copied');
        clearTimeout(stepCopyTimer);
        stepCopyTimer = setTimeout(() => { btn.classList.remove('is-copied'); }, 1500);
      }, () => {});
    });

    // ---------- pestaña Ideas rápidas (IA real) ----------
    let currentIdeas = null;

    function renderIdeasError() {
      currentIdeas = null;
      ideasList.innerHTML = '';
      const wrap = document.createElement('li');
      wrap.className = 'hero-plan__ideas-error';
      wrap.innerHTML = '<p>No pudimos generar ideas rápidas ahora mismo.</p>' +
        '<button type="button" class="pill-btn hero-plan__ideas-retry">Reintentar</button>';
      ideasList.appendChild(wrap);
    }

    function renderIdeas(idea, ideas) {
      if (!ideas || !ideas.length) { renderIdeasError(); return; }
      currentIdeas = ideas;
      ideasList.innerHTML = ideas.map((quickIdea, i) =>
        '<li><div class="hero-plan__idea-head"><strong>' + esc(quickIdea.title) + '</strong>' +
        '<button type="button" class="hero-plan__idea-copy" data-idea-index="' + i + '" aria-label="Copiar prompt de esta idea" title="Copiar prompt de esta idea">' +
        '<span class="hero-plan__step-copy-icon">' + COPY_ICON + '</span><span class="hero-plan__step-check">' + CHECK_ICON + '</span></button></div>' +
        '<span class="hero-plan__idea-pitch">' + esc(quickIdea.pitch) + '</span></li>'
      ).join('');
    }

    let ideaCopyTimer = null;
    ideasList.addEventListener('click', (e) => {
      const retryBtn = e.target.closest('.hero-plan__ideas-retry');
      if (retryBtn) {
        retryBtn.disabled = true;
        retryBtn.textContent = 'Generando…';
        fetchQuickIdeas(currentIdea).then(
          (ideas) => renderIdeas(currentIdea, ideas),
          () => renderIdeasError()
        );
        return;
      }
      const btn = e.target.closest('.hero-plan__idea-copy');
      if (!btn || !currentIdeas || !navigator.clipboard || !navigator.clipboard.writeText) return;
      const quickIdea = currentIdeas[Number(btn.dataset.ideaIndex)];
      if (!quickIdea) return;
      navigator.clipboard.writeText(buildQuickIdeaPrompt(currentIdea, quickIdea)).then(() => {
        btn.classList.add('is-copied');
        clearTimeout(ideaCopyTimer);
        ideaCopyTimer = setTimeout(() => { btn.classList.remove('is-copied'); }, 1500);
      }, () => {});
    });

    // ---------- generar: plan local al instante + ideas rápidas por IA ----------
    generateBtn.addEventListener('click', async () => {
      const idea = input.value.trim();
      if (!idea) return;
      generateBtn.disabled = true;
      input.disabled = true;
      showLoading();

      renderPlan(idea, localPlan(idea, picks));
      let ideas = null;
      try {
        ideas = await fetchQuickIdeas(idea);
      } catch (e) {
        ideas = null; // sin red, límite alcanzado, o la función no está desplegada: la pestaña Ideas rápidas muestra el estado de error
      }
      renderIdeas(idea, ideas);

      hideLoading();
      generateBtn.disabled = false;
      input.disabled = false;
      if (window.JOURNEY && window.JOURNEY.goTo) window.JOURNEY.goTo('plan');
      else scene.scrollIntoView({ behavior: 'smooth' });
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
