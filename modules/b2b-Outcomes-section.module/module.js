(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced';
  reduced.addEventListener('change', () => { if (motionOff()) active.forEach(animation => animation.cancel()); });
  const init = () => document.querySelectorAll('.hw-b2b-outcomes').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    if (motionOff() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (motionOff() || !entry.target.animate) return;
      const animation = entry.target.animate([
        { opacity:0, transform:'translateY(16px)' },
        { opacity:1, transform:'translateY(0)' }
      ], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
      active.add(animation);
      animation.onfinish = animation.oncancel = () => active.delete(animation);
    }), { threshold:0 });
    section.querySelectorAll('.hw-b2b-outcomes__item p').forEach(item => observer.observe(item));
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
