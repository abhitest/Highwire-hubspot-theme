(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-industry-pillars:not([data-ready])').forEach(section => {
    section.dataset.ready = 'true';
    const off = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    if (off() || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    let root = null;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
        root = parent;
        break;
      }
    }
    const bottom = root ? Math.min(innerHeight, root.getBoundingClientRect().bottom) : innerHeight;
    const animations = new Map();
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, index) => {
        const animation = animations.get(entry.target);
        observer.unobserve(entry.target);
        if (!animation) return;
        if (off()) { finish(); return; }
        animation.effect.updateTiming({ delay:index * 120 });
        animation.play();
      });
    }, { root, threshold:0, rootMargin:'0px 0px -24px 0px' });
    const motionObserver = new MutationObserver(() => { if (off()) finish(); });
    const sync = () => { if (off()) finish(); };
    function finish() {
      observer.disconnect();
      motionObserver.disconnect();
      reduced.removeEventListener('change', sync);
      section.removeEventListener('focusin', finish);
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
    section.querySelectorAll('.hw-industry-pillars__card').forEach(card => {
      // Never hide content that has already been painted in the viewport.
      if (card.getBoundingClientRect().top < bottom) return;
      const animation = card.animate([
        { opacity:0, transform:'translate3d(0,24px,0)' },
        { opacity:1, transform:'translate3d(0,0,0)' }
      ], { duration:700, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' });
      animation.pause();
      animation.currentTime = 0;
      animations.set(card, animation);
      animation.finished.then(() => {
        animation.cancel();
        animations.delete(card);
        if (!animations.size) finish();
      }).catch(() => {});
      observer.observe(card);
    });
    if (!animations.size) { finish(); return; }
    reduced.addEventListener('change', sync);
    motionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    motionObserver.observe(section, { attributes:true, attributeFilter:['data-animate'] });
    section.addEventListener('focusin', finish);
  });
  const start = () => {
    init();
    new MutationObserver(init).observe(document.documentElement, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
