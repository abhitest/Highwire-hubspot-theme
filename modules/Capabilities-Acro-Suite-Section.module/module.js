(function () {
  function init() {
    document.querySelectorAll('.hw-cap-acro:not([data-motion-init])').forEach(function (section) {
      section.dataset.motionInit = 'true';
      var intro = section.querySelector('[data-reveal]');
      if (!intro) return;

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
      if (section.dataset.animate !== 'true' || reduced || !('IntersectionObserver' in window)) {
        intro.classList.add('is-visible');
        return;
      }

      section.classList.add('hw-cap-acro--motion-ready');
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      observer.observe(intro);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
