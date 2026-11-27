(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-insights-events').forEach(section => {
    if (section.dataset.eventsReady) return;
    section.dataset.eventsReady = 'true';
    const title = section.querySelector('.hw-insights-events__title');
    const off = () => reduced.matches || section.dataset.animate === 'false' || document.documentElement.dataset.motion === 'reduced';
    if (!title || off() || !('IntersectionObserver' in window)) return;
    const reveal = () => {
      title.classList.remove('hw-insights-events__title--pending');
      title.classList.add('hw-insights-events__title--visible');
      observer.disconnect(); reduced.removeEventListener('change',changed);
    };
    const changed = () => { if (off()) reveal(); };
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) reveal(); },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    title.classList.add('hw-insights-events__title--pending');
    observer.observe(title); reduced.addEventListener('change',changed);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
