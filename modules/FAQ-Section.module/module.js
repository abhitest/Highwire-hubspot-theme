(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-faq__index').forEach(nav => {
    if (nav.dataset.faqInitialized) return;
    nav.dataset.faqInitialized = 'true';
    nav.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
      target.focus({ preventScroll:true });
      target.scrollIntoView({ behavior:reduced ? 'instant' : 'smooth', block:'start' });
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
