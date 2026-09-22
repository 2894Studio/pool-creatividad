(function () {
  var PLATFORM_LOGOS = {
    netflix: 'assets/logos/netflix%20logo.png',
    primevideo: 'assets/logos/prime%20video.png',
    youtube: 'assets/logos/Youtube_logo.png',
    vimeo: 'assets/logos/vimeo.webp',
  };

  function renderReferences() {
    const track = document.getElementById('carousel-track');
    if (!track || !window.REFERENCES) return;

    window.REFERENCES.forEach((ref) => {
      const card = document.createElement('article');
      card.className = 'ref-card ref-card--' + ref.accent;
      card.tabIndex = 0;
      card.setAttribute('aria-label', ref.title + '. ' + ref.description);
      const logoSrc = PLATFORM_LOGOS[ref.platform];
      const platformBadge = '<img class="ref-card__platform ref-card__platform--' + ref.platform + '" src="' + logoSrc + '" alt="' + ref.platform + '" />';
      card.innerHTML =
        '<img class="ref-card__img" src="' + ref.imageUrl + '" alt="' + ref.title + '" loading="lazy" decoding="async" />' +
        platformBadge +
        '<div class="ref-card__overlay">' +
        '<span class="ref-card__category">' + ref.category + '</span>' +
        '<h3 class="ref-card__title">' + ref.title + '</h3>' +
        '<p class="ref-card__desc">' + ref.description + '</p>' +
        '<p class="ref-card__credit">' + ref.credit + '</p>' +
        '</div>';
      // hover revela la info; clic o Enter/Espacio abren la plataforma donde ver el contenido
      card.addEventListener('click', () => window.open(ref.sourceUrl, '_blank', 'noopener,noreferrer'));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(ref.sourceUrl, '_blank', 'noopener,noreferrer');
        }
      });
      track.appendChild(card);
    });
  }

  function setupControls() {
    const track = document.getElementById('carousel-track');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!track) return;

    const scrollAmount = () => track.clientWidth * 0.8;
    let hasMovedByNavigation = false;
    const updatePreviousControl = () => {
      if (prev && hasMovedByNavigation) prev.hidden = track.scrollLeft <= 1;
    };
    const moveTrack = (distance) => {
      if (distance > 0) {
        hasMovedByNavigation = true;
        if (prev) prev.hidden = false;
      }
      track.scrollBy({ left: distance, behavior: 'smooth' });
    };

    track.scrollLeft = 0;
    if (prev) prev.addEventListener('click', () => moveTrack(-scrollAmount()));
    if (next) next.addEventListener('click', () => moveTrack(scrollAmount()));
    track.addEventListener('scroll', updatePreviousControl, { passive: true });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { moveTrack(scrollAmount()); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { moveTrack(-scrollAmount()); e.preventDefault(); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderReferences();
    setupControls();
  });
})();
