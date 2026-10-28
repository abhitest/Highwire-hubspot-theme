(() => {
  'use strict';
  if (window.hwClientLogos) { window.hwClientLogos(); return; }
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  const off = section => media.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
  const cancel = state => { state.animations.forEach(animation => animation.cancel()); state.animations.clear(); };
  const reveal = (section, state) => {
    if (off(section) || state.played) return;
    state.played = true;
    const style = getComputedStyle(section);
    section.querySelectorAll('.hw-client-logos__cell').forEach((cell, index) => {
      if (!cell.animate) return;
      // Animate the logo, leaving the grid lines and cell backgrounds stationary.
      const target = cell.firstElementChild;
      if (!target) return;
      const opacity = getComputedStyle(target).opacity;
      const animation = target.animate([{ opacity:0, transform:'translateY(16px)' }, { opacity, transform:'translateY(0)' }], {
        duration:parseFloat(style.getPropertyValue('--clients-duration')) || 0,
        delay:index * (parseFloat(style.getPropertyValue('--clients-stagger')) || 0),
        easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards'
      });
      state.animations.add(animation);
      animation.onfinish = animation.oncancel = () => state.animations.delete(animation);
    });
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    const state = states.get(entry.target);
    if (!state) return;
    state.visible = entry.isIntersecting;
    if (state.visible) reveal(entry.target, state);
    else { cancel(state); state.played = false; }
  }), { threshold:0 }) : null;
  const refresh = () => {
    states.forEach((state, section) => {
      if (!section.isConnected) { cancel(state); if (observer) observer.unobserve(section); states.delete(section); }
    });
    document.querySelectorAll('.hw-client-logos').forEach(section => {
      if (states.has(section)) return;
      states.set(section, { visible:false, played:false, animations:new Set() });
      if (observer) observer.observe(section);
    });
  };
  const sync = () => states.forEach((state, section) => {
    if (off(section)) { cancel(state); state.played = false; }
    else if (state.visible) reveal(section, state);
  });
  window.hwClientLogos = refresh;
  media.addEventListener('change', sync);
  const init = () => {
    refresh();
    new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) refresh();
      if (records.some(record => record.type === 'attributes')) sync();
    }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['data-motion','data-animate'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
