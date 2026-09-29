/* sound.js — efectos sintetizados con Web Audio (sin archivos) y vibración en móvil.
   El sonido está apagado por defecto; la preferencia se recuerda en este navegador.
   Expone JOY.sfx(nombre) y JOY.buzz(patrón). */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const AC = window.AudioContext || window.webkitAudioContext;
  const KEY = 'lab-creatividad-sound';

  // encendido por defecto (como el portfolio); si alguien lo apagó, se respeta
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (_) { /* almacenamiento bloqueado */ }

  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function audio() {
    if (!AC) return null;
    if (!ctx) {
      // el mismo contexto que el piano del titular (hover-text.js): un solo hilo de audio
      const shared = window.HoverText && window.HoverText.audio ? window.HoverText.audio() : null;
      ctx = shared ? shared.ac : new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // envolvente corta de ataque/caída sobre un nodo de ganancia
  function env(t, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(master);
    return g;
  }

  function tone(type, f0, f1, t, dur, peak) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(env(t, peak, 0.005, dur));
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(t, dur, peak, filterType, f0, f1) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    src.connect(f);
    f.connect(env(t, peak, 0.01, dur));
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    tick(t) { tone('square', 1500, 1500, t, 0.018, 0.12); },
    rattle(t) { for (let i = 0; i < 5; i++) noise(t + i * 0.045 + Math.random() * 0.02, 0.035, 0.5, 'bandpass', 2400 + Math.random() * 1400); },
    pop(t) { tone('sine', 380, 980, t, 0.09, 0.6); noise(t, 0.04, 0.25, 'highpass', 3000); },
    whoosh(t) { noise(t, 0.38, 0.35, 'bandpass', 300, 1800); },
    ding(t) { tone('sine', 880, 880, t, 0.9, 0.35); tone('sine', 1320, 1320, t + 0.02, 0.7, 0.18); },
    tape(t) { noise(t, 0.07, 0.45, 'highpass', 1800); noise(t + 0.06, 0.05, 0.3, 'highpass', 2600); },
    spark(t) { tone('triangle', 1200, 2600, t, 0.14, 0.25); tone('triangle', 1800, 3400, t + 0.07, 0.12, 0.15); },
    hum(t) { tone('sine', 110, 90, t, 1.2, 0.2); },
    clack(t) { tone('square', 220, 160, t, 0.05, 0.25); noise(t, 0.03, 0.3, 'bandpass', 1200); },
  };

  JOY.sfx = (name) => {
    if (!enabled || !SOUNDS[name]) return;
    const c = audio();
    if (!c) return;
    SOUNDS[name](c.currentTime + 0.01);
  };

  // vibración corta en móviles que la soportan
  const coarse = window.matchMedia('(pointer: coarse)');
  JOY.buzz = (pattern) => {
    if (!coarse.matches || !navigator.vibrate) return;
    try { navigator.vibrate(pattern || 12); } catch (_) { /* no soportado */ }
  };

  JOY.soundOn = () => enabled;

  const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>';
  const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + SPEAKER +
    '<path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + SPEAKER +
    '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/></svg>';

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.sound-toggle');
    if (!btn || !AC) return;
    btn.hidden = false;
    const icon = btn.querySelector('.sound-toggle__icon');
    const sync = () => {
      // el mismo interruptor silencia el piano de las letras del titular
      if (window.HoverText) window.HoverText.setMuted(!enabled);
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      btn.setAttribute('aria-label', enabled ? 'Silenciar sonido' : 'Activar sonido');
      btn.setAttribute('data-cursor', enabled ? 'Sonido: sí' : 'Sonido: no');
      icon.innerHTML = enabled ? ICON_ON : ICON_OFF;
    };
    sync();
    btn.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (_) { /* almacenamiento bloqueado */ }
      sync();
      if (JOY.refreshCursorLabel) JOY.refreshCursorLabel();
      JOY.sfx('pop');
    });
  });
})();
