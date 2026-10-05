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
      'Guíame fase por fase, una a la vez, empezando por Preparación. En cada fase, parte de esta técnica ' +
      'y después profundiza conmigo con preguntas antes de pasar a la siguiente:\n\n' + steps +
      '\n\nAl cerrar cada fase, resúmeme en una frase la idea o decisión a la que llegamos.';
  }

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

  function init() {
    const hero = document.querySelector('.hero-plan');
    const scene = document.getElementById('plan');
    if (!hero || !scene || !window.PHASES) return;
    const input = hero.querySelector('.hero-plan__input');
    const generateBtn = hero.querySelector('.hero-plan__generate');
    const ideaLine = scene.querySelector('#hero-plan-idea');
    const steps = scene.querySelector('.hero-plan__steps');
    const result = scene.querySelector('.hero-plan__result');
    const copyBtn = scene.querySelector('.hero-plan__copy');
    const hint = scene.querySelector('.hero-plan__hint');
    if (!input || !generateBtn) return;

    const picks = window.PHASES.map((phase) => {
      const technique = findTechnique(phase);
      return technique ? { phase, technique } : null;
    }).filter(Boolean);

    input.addEventListener('input', () => { generateBtn.disabled = !input.value.trim(); });

    initVoiceInput(hero, input);

    generateBtn.addEventListener('click', () => {
      const idea = input.value.trim();
      if (!idea) return;
      ideaLine.textContent = 'Tu idea: «' + idea + '»';
      steps.innerHTML = picks.map((p) =>
        '<li><span class="hero-plan__phase">' + p.phase.index + ' ' + esc(p.phase.name) + '</span>' +
        '<strong>' + esc(p.technique.name) + '</strong>' +
        '<span class="hero-plan__exercise">' + esc(p.technique.exercise) + '</span></li>'
      ).join('');
      result.value = buildPrompt(idea, picks);
      hint.hidden = true;
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
