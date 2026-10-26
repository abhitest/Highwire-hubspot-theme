(() => {
  const init = () => document.querySelectorAll('[data-logo-grid]').forEach(section => {
    if (section.dataset.ready) return;
    section.dataset.ready = 'true';
    const reveal = () => { section.dataset.visible = 'true'; };
    if (!('IntersectionObserver' in window)) { reveal(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { reveal(); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(section);
    section.addEventListener('focusin', reveal);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
