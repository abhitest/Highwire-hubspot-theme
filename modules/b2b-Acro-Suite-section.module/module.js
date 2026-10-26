(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-b2b-acro').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    const list = section.querySelector('.hw-b2b-acro__products');
    const cards = Array.from(list.querySelectorAll('.hw-b2b-acro__product'));
    const activate = card => cards.forEach(item => { item.dataset.active = String(item === card); });
    cards.forEach(card => {
      card.addEventListener('pointerenter', () => activate(card));
      card.addEventListener('focusin', () => activate(card));
    });
    list.addEventListener('pointerleave', () => {
      activate(cards.find(card => card.contains(document.activeElement)));
    });
    list.addEventListener('focusout', event => {
      if (!list.contains(event.relatedTarget)) activate(null);
    });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const animations = new Set();
    reduced.addEventListener('change', () => { if (motionOff()) animations.forEach(animation => animation.cancel()); });
    if (motionOff() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (motionOff()) return;
      ['.hw-b2b-acro__overview h2', '.hw-b2b-acro__introduction', '.hw-b2b-acro__products'].forEach((selector, i) => {
        const target = section.querySelector(selector);
        if (!target || !target.animate) return;
        const animation = target.animate([
          { opacity:0, transform:'translateY(24px)' },
          { opacity:1, transform:'translateY(0)' }
        ], { duration:650, delay:[0,120,220][i], easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards' });
        animations.add(animation);
        animation.onfinish = animation.oncancel = () => animations.delete(animation);
      });
    }, { threshold:0 });
    observer.observe(section);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
