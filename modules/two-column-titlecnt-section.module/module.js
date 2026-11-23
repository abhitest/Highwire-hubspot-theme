(function () {
  function init() {
    document.querySelectorAll('.hw-two-column-titlecnt:not([data-titlecnt-ready])').forEach(function (section) {
      section.dataset.titlecntReady = 'true';
      if (section.dataset.animate !== 'true' || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced') return;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      section.classList.add('hw-two-column-titlecnt--motion');
      section.querySelectorAll('[data-titlecnt-reveal]').forEach(function (element) { observer.observe(element); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('hs:module:loaded', init);
})();
