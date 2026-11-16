(() => {
  'use strict';
  const init = () => document.querySelectorAll('[data-ambition-section]').forEach(section => {
    if (section.dataset.ambitionReady) return;
    section.dataset.ambitionReady = 'true';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer;
    const sync = () => {
      observer?.disconnect();
      delete section.dataset.coverReady;
      delete section.dataset.coverVisible;
      if (section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced' || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          section.dataset.coverVisible = String(entry.isIntersecting);
        });
      }, { root: section.closest('#presentation-scroll'), rootMargin: '0px 0px -12% 0px', threshold: 0 });
      section.dataset.coverReady = 'true';
      observer.observe(section);
    };
    reduced.addEventListener('change', sync);
    sync();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
