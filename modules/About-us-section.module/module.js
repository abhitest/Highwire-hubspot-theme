(() => {
  'use strict';
  const clamp = n => Math.min(1, Math.max(0, n));
  const segment = (p, start, end) => clamp((p - start) / (end - start));
  const init = () => document.querySelectorAll('[data-about-module]').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    const stage = section.querySelector('.hw-about__stage');
    const cards = [...section.querySelectorAll('.hw-about__card')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scroller = window, frame = 0, needsLayout = true, mode = '';
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
    }
    const paint = progress => {
      const p = progress;
      const intro = segment(p, .10, .28);
      section.style.setProperty('--about-intro-opacity', 1 - intro);
      section.style.setProperty('--about-intro-y', -32 * intro + 'px');
      section.querySelector('.hw-about__intro').setAttribute('aria-hidden', String(mode === 'pinned' && p >= .28));
      section.querySelector('.hw-about__final').setAttribute('aria-hidden', String(mode === 'pinned' && p < .28));
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
        section.dataset.compact = String(mode === 'pinned' && section.clientWidth >= 768 && section.clientWidth <= 991);
        section.style.removeProperty('--about-scroll-distance');
        if (mode === 'pinned') {
          // Fit the complete composition in the scroll viewport, including tablets.
          const viewportHeight = scroller === window ? innerHeight : scroller.clientHeight;
          const compactTablet = section.clientWidth >= 768 && section.clientWidth <= 991;
          // Keep the desktop composition proportional instead of stretching it to a portrait viewport.
          const height = compactTablet ? Math.min(viewportHeight, section.clientWidth * 850 / 1200) : viewportHeight;
          let scale = Math.min(1, section.clientWidth / 1200, height / 850);
          const scene = section.querySelector('.hw-about__scene');
          section.style.setProperty('--about-height', height + 'px');
          if (compactTablet) section.style.setProperty('--about-scroll-distance', '0px');
          const fit = () => {
            scene.style.width = section.clientWidth / scale + 'px';
            scene.style.height = height / scale + 'px';
            scene.style.transform = 'scale(' + scale + ')';
          };
          fit();
          const heading = section.querySelector('.hw-about__heading');
          const description = section.querySelector('.hw-about__intro-description');
          const fractions = [.423529, .505882, .4];
          const required = Math.max(scene.clientHeight,
            (heading.offsetHeight + 24) / (1 - fractions[0]),
            (description.offsetHeight + 24) / (1 - .752941),
            ...cards.map((card, i) => (card.scrollHeight + 4) / fractions[i]));
          scale = Math.min(scale, height / required);
          fit();
        }
      }
      if (mode !== 'pinned') {
        section.style.removeProperty('--about-height');
        section.querySelector('.hw-about__scene').removeAttribute('style');
        paint(1); return;
      }
      const top = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const viewportHeight = scroller === window ? innerHeight : scroller.clientHeight;
      if (section.getBoundingClientRect().top - top < viewportHeight * .75) section.dataset.entered = 'true';
      const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const inset = parseFloat(getComputedStyle(stage).top) || 0;
      const progress = clamp((top + inset - section.getBoundingClientRect().top) / distance);
      // The last card finishes as the compact section releases, without a completed-animation tail.
      const compactTablet = section.clientWidth >= 768 && section.clientWidth <= 991;
      if (compactTablet) {
        // Hold the intro until the complete compact composition is in view.
        // Then transition while it travels toward the top, not while entering below the fold.
        const sectionTop = section.getBoundingClientRect().top - top;
        const start = Math.max(1, viewportHeight - stage.offsetHeight);
        const entry = clamp((start - sectionTop) / start);
        paint(entry * .8);
      } else paint(progress);
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
    update();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
