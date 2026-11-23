(function () {
  function init() {
    document.querySelectorAll('.hw-acro-products:not([data-acro-products-ready])').forEach(function (section) {
      section.dataset.acroProductsReady = 'true';
      var heading = section.querySelector('.hw-acro-products__intro h2');
      if (!heading || section.dataset.animate !== 'true' || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced') return;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          heading.classList.add('is-visible');
          observer.disconnect();
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      section.classList.add('hw-acro-products--motion');
      observer.observe(heading);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('hs:module:loaded', init);
})();
