(function () {
  function startIndustriesHeroAnimation() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.hw-industries-hero').forEach(function (hero) {
      var heading = hero.querySelector('.moduleTitle h1');
      if (!heading) return;

      hero.classList.add('hw-industries-hero--motion-ready');

      if (!('IntersectionObserver' in window)) {
        heading.classList.add('is-visible');
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1 });

      observer.observe(heading);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIndustriesHeroAnimation, { once: true });
  } else {
    startIndustriesHeroAnimation();
  }
})();
