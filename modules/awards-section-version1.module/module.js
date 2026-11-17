(() => {
  const seen = new WeakSet();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced';
  const active = new Set();
  const reveal = image => {
    if (!image.complete || !image.naturalWidth || motionOff()) return;
    const cell = image.closest('.hw-awards-v1__cell');
    if (!cell?.animate) return;
    const delay = Math.min(Array.from(cell.parentElement.children).indexOf(cell) * 40, 920);
    const animations = [
      cell.animate([{opacity:0},{opacity:1}], {duration:360, delay, fill:'backwards'}),
      cell.animate([{transform:'translateY(16px)'},{transform:'none'}], {duration:650, delay, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards'})
    ];
    animations.forEach(animation => {
      active.add(animation);
      animation.finished.catch(() => {}).finally(() => active.delete(animation));
    });
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (entry.target.complete) reveal(entry.target);
      else entry.target.addEventListener('load', () => reveal(entry.target), {once:true});
    });
  }, {threshold:.1}) : null;
  const init = () => document.querySelectorAll('.hw-awards-v1__cell img').forEach(image => {
    if (seen.has(image)) return;
    seen.add(image);
    observer?.observe(image);
  });
  const start = () => {
    init();
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes' && record.target.matches('.hw-awards-v1__cell img')) seen.delete(record.target);
      });
      init();
    }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  };
  reduced.addEventListener('change', () => { if (motionOff()) active.forEach(animation => animation.cancel()); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();