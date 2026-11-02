(() => {
  'use strict';
  if (window.hwContactMotion) { window.hwContactMotion.refresh(); return; }
  const sections = new Set();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.dataset.coverVisible = String(entry.isIntersecting); });
  }, { root:document.getElementById('presentation-scroll'), rootMargin:'0px 0px -12% 0px', threshold:0 }) : null;
  const refresh = () => {
    sections.forEach(section => { if (!section.isConnected) { if (observer) observer.unobserve(section); sections.delete(section); } });
    document.querySelectorAll('.hw-contact').forEach(section => {
      if (sections.has(section)) return;
      sections.add(section);
      section.dataset.animate = (section.dataset.animate || 'true').toLowerCase();
      if (observer) { section.dataset.coverReady = 'true'; observer.observe(section); }
    });
  };
  window.hwContactMotion = { refresh };
  const init = () => { refresh(); new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
