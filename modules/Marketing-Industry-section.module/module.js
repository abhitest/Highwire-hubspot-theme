(() => {
  'use strict';
  const init = () => document.querySelectorAll('[data-marketing-industry]').forEach(section => {
    if (section.dataset.industryReady) return;
    section.dataset.industryReady = 'true';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const rows = section.querySelectorAll('.hw-marketing-industry__item');
    let colorIndex = 0;
    const colors = ['var(--industry-accent_one)', 'var(--industry-accent_two)', 'var(--industry-accent_three)'];
    rows.forEach(row => {
      const cycle = () => row.style.setProperty('--item-accent', colors[colorIndex++ % colors.length]);
      row.addEventListener('pointerenter', cycle);
      row.addEventListener('focus', () => { if (!row.matches(':hover')) cycle(); });
    });
    let observer;
    if (!motionOff() && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-motion-active');
        observer.unobserve(entry.target);
      }), { rootMargin: '0px 0px -18% 0px', threshold: .08 });
      section.classList.add('is-motion-ready');
      rows.forEach(row => observer.observe(row));
    }
    reduced.addEventListener('change', () => {
      if (!motionOff()) return;
      section.classList.remove('is-motion-ready');
      observer?.disconnect();
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
