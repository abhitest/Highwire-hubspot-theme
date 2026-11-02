(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-acro-leverage').forEach(section => {
    if (section.dataset.leverageReady) return;
    section.dataset.leverageReady = 'true';
    const off = () => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
    if (off() || !('IntersectionObserver' in window)) return;
    const animations = new Map();
    let root = null;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) { root = parent; break; }
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const animation = animations.get(entry.target);
      if (animation) {
        if (off()) animation.cancel();
        else animation.play();
      }
    }), { root, threshold:0, rootMargin:'0px 0px 32px 0px' });
    const stop = () => {
      if (!off()) return;
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    reduced.addEventListener('change', stop);
    new MutationObserver(stop).observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    section.querySelectorAll('[data-leverage-reveal]').forEach(element => {
      const rect = element.getBoundingClientRect();
      const bottom = root ? Math.min(innerHeight, root.getBoundingClientRect().bottom) : innerHeight;
      // Never hide content that has already painted in the viewport (including deep links).
      if (rect.top < bottom || !element.animate) return;
      const animation = element.animate([
        { opacity:0, transform:'translate3d(0, 16px, 0)' },
        { opacity:1, transform:'translate3d(0, 0, 0)' }
      ], { duration:700, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' });
      animation.pause();
      animation.currentTime = 0;
      animations.set(element, animation);
      animation.finished.then(() => {
        animations.delete(element);
        animation.cancel(); // Return to natural styles; do not retain a compositing layer.
      }).catch(() => {});
      observer.observe(element);
    });
    // Keyboard users must never focus an invisible form or link.
    section.addEventListener('focusin', () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
