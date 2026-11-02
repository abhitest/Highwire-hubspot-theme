(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-comparison:not([data-ready])').forEach(section => {
    section.dataset.ready = 'true';
    const off = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const title = section.querySelector('.hw-comparison__title');
    if (!title || !title.animate || off() || !('IntersectionObserver' in window)) return;
    let root = null;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
        root = parent;
        break;
      }
    }
    const viewportBottom = root ? Math.min(innerHeight, root.getBoundingClientRect().bottom) : innerHeight;
    // Preserve headings already painted, including restored scroll positions and deep links.
    if (title.getBoundingClientRect().top < viewportBottom) return;
    const animation = title.animate([
      { opacity:0, transform:'translate3d(0,16px,0)' },
      { opacity:1, transform:'translate3d(0,0,0)' }
    ], { duration:700, easing:'cubic-bezier(.22,1,.36,1)', fill:'both' });
    // Prepare offscreen, rather than resetting a visible heading when the observer fires.
    animation.pause();
    animation.currentTime = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (off()) finish();
      else animation.play();
    }, { root, threshold:0, rootMargin:'0px 0px 32px 0px' });
    const motionObserver = new MutationObserver(() => { if (off()) finish(); });
    const sync = () => { if (off()) finish(); };
    function finish() {
      observer.disconnect();
      motionObserver.disconnect();
      reduced.removeEventListener('change', sync);
      section.removeEventListener('focusin', finish);
      animation.cancel();
    }
    animation.finished.then(finish).catch(() => {});
    reduced.addEventListener('change', sync);
    motionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    motionObserver.observe(section, { attributes:true, attributeFilter:['data-animate'] });
    section.addEventListener('focusin', finish);
    observer.observe(title);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
