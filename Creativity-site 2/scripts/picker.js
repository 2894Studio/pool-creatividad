/* picker.js — el "tira el dado": dado 3D → rodillo de tragaperras → nota con cinta.
   Lo usan las cuatro fases (phases.js) y el reto final (reto.js).

   JOY.makeTechniqueNote(técnica, idx, tag, destacada, extraHTML)
   JOY.createPicker({
     controls, slot,                  // dónde van el botón y el resultado
     label, againLabel,               // textos del botón
     emptyTitle, emptyText, diceSize, // la ranura vacía antes de tirar
     draw() → { reels: [{ label?, names, index }], data },
     render(data) → elemento,         // la nota que cae
     personality: { reelSpeed, land(el, slot), confetti(el) },
     onRoll(), onLand(el, data)
   }) → { roll } */
(function () {
  const JOY = (window.JOY = window.JOY || {});
  const motionOK = () => (JOY.motionOK ? JOY.motionOK() : false);
  const rand = (min, max) => Math.random() * (max - min) + min;

  // una nota con cinta: tilt, posición y giro de la cinta aleatorios
  JOY.makeTechniqueNote = (t, idx, tag, featured, extra) => {
    const card = document.createElement(tag || 'article');
    card.className = 'technique-card technique-card--tape-' + ((idx % 2) + 1) + (featured ? ' technique-card--featured' : '');
    card.style.setProperty('--tilt', rand(featured ? -1.2 : -1.8, featured ? 1.2 : 1.8).toFixed(2) + 'deg');
    card.style.setProperty('--tape-x', Math.round(rand(14, 62)) + '%');
    card.style.setProperty('--tape-rot', rand(-7, 7).toFixed(1) + 'deg');

    const sourceMarkup = t.link
      ? '<a class="technique-card__source-link" href="' + t.link + '" target="_blank" rel="noreferrer noopener">' + t.source + '</a>'
      : '<span class="technique-card__source">' + t.source + '</span>';

    card.innerHTML =
      (extra && extra.top ? extra.top : '') +
      '<div class="technique-card__header"><h4>' + t.name + '</h4>' + sourceMarkup + '</div>' +
      (extra && extra.afterHeader ? extra.afterHeader : '') +
      '<p class="technique-card__desc">' + t.description + '</p>' +
      '<p class="technique-card__exercise"><strong>Ejercicio:</strong> ' + t.exercise + '</p>' +
      '<span class="technique-card__duration">⏱ ' + t.duration + '</span>' +
      (extra && extra.bottom ? extra.bottom : '');
    return card;
  };

  // caída por defecto: la nota se estampa desde arriba y la cinta llega después
  function defaultLand(card) {
    card.classList.add('is-slapped');
    const tilt = parseFloat(card.style.getPropertyValue('--tilt')) || 0;
    gsap.fromTo(card,
      { opacity: 0, y: -40, scale: 0.9, rotation: gsap.utils.random(-8, 8) },
      { opacity: 1, y: 0, scale: 1, rotation: tilt, duration: 0.6, ease: 'back.out(2)', clearProps: 'transform,opacity' });
  }

  JOY.createPicker = (o) => {
    const P = o.personality || {};
    const speed = P.reelSpeed || 1;
    let rolling = false;
    let rolled = false;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phase-card__shuffle';
    btn.setAttribute('data-magnetic', '0.25');
    btn.setAttribute('data-cursor', '¡Tira!');
    const btnDice = JOY.makeDice ? JOY.makeDice(22) : null;
    if (btnDice) btn.appendChild(btnDice);
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = o.label || 'Tirar el dado';
    btn.appendChild(label);
    o.controls.prepend(btn);

    const empty = document.createElement('button');
    empty.type = 'button';
    empty.className = 'technique-slot__empty';
    empty.setAttribute('data-cursor', '¡Tira!');
    const bigDice = JOY.makeDice ? JOY.makeDice(o.diceSize || 46) : null;
    if (bigDice) empty.appendChild(bigDice);
    empty.insertAdjacentHTML('beforeend', '<strong>' + (o.emptyTitle || '¿Qué te toca?') + '</strong><span>' + (o.emptyText || '') + '</span>');
    o.slot.appendChild(empty);

    function land(result) {
      const card = o.render(result.data);
      o.slot.innerHTML = '';
      o.slot.appendChild(card);
      o.slot.style.minHeight = '';
      if (o.onLand) o.onLand(card, result.data);
      JOY.buzz([8, 40, 14]);
      if (!motionOK()) return;
      if (P.land) P.land(card, o.slot); else defaultLand(card);
      gsap.delayedCall(0.26, () => JOY.sfx('tape'));
      gsap.delayedCall(0.3, () => {
        JOY.sfx('ding');
        if (P.confetti) P.confetti(card); else if (JOY.burstFrom) JOY.burstFrom(card);
      });
    }

    function roll() {
      if (rolling) return;
      const result = o.draw();
      if (!rolled) { rolled = true; label.textContent = o.againLabel || 'Otra vez'; }
      if (o.onRoll) o.onRoll();
      JOY.sfx('rattle');
      JOY.buzz(15);
      if (btnDice) JOY.rollDice(btnDice, 0.8 * speed);

      if (!motionOK()) { land(result); return; }

      // tragaperras: los nombres pasan por el rodillo cada vez más despacio; cada rodillo para después del anterior
      rolling = true;
      btn.disabled = true;
      o.slot.style.minHeight = o.slot.offsetHeight + 'px';
      const multi = result.reels.length > 1;
      o.slot.innerHTML = '<div class="technique-reel' + (multi ? ' technique-reel--multi' : '') + '" aria-hidden="true">' +
        result.reels.map((r) =>
          '<div class="technique-reel__row">' +
          (r.label ? '<span class="technique-reel__label">' + r.label + '</span>' : '') +
          '<span class="technique-reel__name"></span></div>').join('') +
        '</div>';
      const reel = o.slot.firstChild;
      gsap.from(reel, { scaleY: 0.85, opacity: 0, duration: 0.2, ease: 'power2.out' });

      const base = [55, 55, 60, 65, 75, 90, 110, 135, 170, 215];
      const extra = [260, 320, 390, 470];
      const baseTotal = base.reduce((a, b) => a + b, 0) * speed;
      let end = 0;
      result.reels.forEach((r, ri) => {
        const nameEl = reel.children[ri].querySelector('.technique-reel__name');
        const delays = base.concat(extra.slice(0, ri * 3)).map((d) => d * speed);
        const m = r.names.length;
        // arrancamos de modo que el último nombre del rodillo sea justo el elegido
        let i = (((r.index - delays.length) % m) + m) % m;
        let elapsed = 0;
        delays.forEach((d) => {
          elapsed += d;
          const at = elapsed;
          gsap.delayedCall(at / 1000, () => {
            i = (i + 1) % m;
            nameEl.textContent = r.names[i];
            // un solo "tic" a la vez: el primer rodillo, y luego los que siguen girando
            if (ri === 0 || at > baseTotal) JOY.sfx('tick');
            gsap.fromTo(nameEl, { yPercent: -120, opacity: 0.35 }, { yPercent: 0, opacity: 1, duration: d / 1000, ease: 'power2.out' });
          });
        });
        gsap.delayedCall(elapsed / 1000, () => {
          reel.children[ri].classList.add('is-stopped');
        });
        end = Math.max(end, elapsed);
      });
      gsap.delayedCall((end + 260 * speed) / 1000, () => {
        land(result);
        rolling = false;
        btn.disabled = false;
      });
    }

    btn.addEventListener('click', roll);
    empty.addEventListener('click', roll);
    return { roll, button: btn };
  };
})();
