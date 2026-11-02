(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-work-closing').forEach(section => {
    if (section.dataset.closingInitialized || !('IntersectionObserver' in window)) return;
    section.dataset.closingInitialized = 'true';
    if (section.dataset.animate === 'false') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let observer;
    const sync = () => {
      if (observer) observer.disconnect();
      delete section.dataset.coverReady;
      delete section.dataset.coverVisible;
      if (reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false') return;
      section.dataset.coverReady = 'true';
      observer = new IntersectionObserver(([entry]) => {
        section.dataset.coverVisible = String(entry.isIntersecting);
      }, { rootMargin:'0px 0px -12% 0px', threshold:0 });
      observer.observe(section);
    };
    reduced.addEventListener('change', sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    sync();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
