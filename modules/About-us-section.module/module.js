(() => {
  'use strict';
  const clamp = n => Math.min(1, Math.max(0, n));
  const segment = (p, start, end) => clamp((p - start) / (end - start));
  const init = () => document.querySelectorAll('[data-about-module]').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    const stage = section.querySelector('.hw-about__stage');
    const scene = section.querySelector('.hw-about__scene');
    const intro = section.querySelector('.hw-about__intro');
    const final = section.querySelector('.hw-about__final');
    const cards = [...section.querySelectorAll('.hw-about__card')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scroller = window, frame = 0, needsLayout = true, mode = '';
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
    }
    const paint = progress => {
      const p = progress;
      const introProgress = segment(p, .10, .28);
      section.style.setProperty('--about-intro-opacity', 1 - introProgress);
      section.style.setProperty('--about-intro-y', -32 * introProgress + 'px');
      intro.setAttribute('aria-hidden', String(mode === 'pinned' && p >= .28));
      final.setAttribute('aria-hidden', String(mode === 'pinned' && p < .28));
      const heading = segment(p, .38, .58);
      section.style.setProperty('--about-black', segment(p, .28, .58));
      section.style.setProperty('--about-heading', heading);
      section.style.setProperty('--about-heading-y', (1 - heading) * 110 + '%');
      cards.forEach((card, i) => {
        const amount = segment(p, .46 + i * .05, .70 + i * .05);
        section.style.setProperty('--about-card-' + (i + 1), amount);
        section.style.setProperty('--about-card-' + (i + 1) + '-y', (1 - amount) * 100 + '%');
      });
    };
    const update = () => {
      frame = 0;
      if (!section.isConnected) return;
      if (needsLayout) {
        needsLayout = false;
        mode = section.clientWidth >= 768 && !reduced.matches && document.documentElement.dataset.motion !== 'reduced' ? 'pinned' : 'static';
        section.dataset.mode = mode;
        section.style.removeProperty('--about-scroll-distance');
        if (mode === 'pinned') {
          // Keep the reference height and scroll timing while filling the section width.
          const viewportHeight = scroller === window ? innerHeight : scroller.clientHeight;
          const scale = Math.min(section.clientWidth / 1440, viewportHeight / 850);
          section.style.setProperty('--about-height', 850 * scale + 'px');
          section.style.setProperty('--about-scroll-distance', 1350 * scale + 'px');
          scene.style.width = section.clientWidth / scale + 'px';
          scene.style.height = '850px';
          scene.style.left = '0px';
          scene.style.transform = 'scale(' + scale + ')';
        }
      }
      if (mode !== 'pinned') {
        section.style.removeProperty('--about-height');
        scene.removeAttribute('style');
        paint(1); return;
      }
      const top = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const bounds = section.getBoundingClientRect();
      const visualScale = bounds.width / section.offsetWidth;
      const distance = Math.max(1, (section.offsetHeight - stage.offsetHeight) * visualScale);
      const inset = parseFloat(getComputedStyle(stage).top) || 0;
      paint(clamp((top + inset * visualScale - bounds.top) / distance));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const layout = () => { needsLayout = true; schedule(); };
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', layout, { passive: true });
    reduced.addEventListener('change', layout);
    let width = section.clientWidth;
    new ResizeObserver(() => {
      if (section.clientWidth !== width) { width = section.clientWidth; layout(); }
    }).observe(section);
    new MutationObserver(layout).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    if (document.fonts) document.fonts.ready.then(layout);
    section.dataset.entered = 'false';
    // Match the reference's one-time intro entrance, separate from scroll scrubbing.
    const entrance = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        section.dataset.entered = 'true';
        entrance.disconnect();
      }
    }, { root: scroller === window ? null : scroller, rootMargin: '0px 0px -18% 0px', threshold: .08 });
    entrance.observe(section);
    update();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
