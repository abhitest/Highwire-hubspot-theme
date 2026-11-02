(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-acro-leverage').forEach(section => {
    if (section.dataset.leverageReady) return;
    section.dataset.leverageReady = 'true';
    const off = () => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
    if (off() || !('IntersectionObserver' in window)) return;
    const running = new Set();
    const stop = () => { if (off()) running.forEach(animation => animation.cancel()); };
    reduced.addEventListener('change', stop);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (off() || !entry.target.animate) return;
      for (const [frames,duration,easing] of [
        [[{opacity:0},{opacity:1}],360,'cubic-bezier(.4,0,.2,1)'],
        [[{transform:'translateY(28px)'},{transform:'translateY(0)'}],650,'cubic-bezier(.22,1,.36,1)']
      ]) {
        const animation = entry.target.animate(frames,{duration,easing});
        running.add(animation);
        animation.finished.catch(() => {}).finally(() => running.delete(animation));
      }
    }),{threshold:0});
    section.querySelectorAll('[data-leverage-reveal]').forEach(element => observer.observe(element));
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
