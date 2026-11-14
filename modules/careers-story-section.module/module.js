(() => {
  const init = () => document.querySelectorAll('[data-career-story]').forEach(section => {
    if (section.dataset.storyReady) return;
    section.dataset.storyReady = 'true';
    const panels = [...section.querySelectorAll('[data-story-panel]')];
    const images = [...section.querySelectorAll('.hw-career-story__image')];
    const wipe = section.querySelector('.hw-career-story__wipe');
    if (!panels.length || !wipe) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scroller = window;
    for (let node = section.parentElement; node; node = node.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) { scroller = node; break; }
    }
    const colors = ['var(--story-accent_one)', 'var(--story-accent_two)', 'var(--story-accent_three)'];
    let active = -1, frame = 0, animations = [];
    // The editor canvas can be taller than the visible viewport. Keep all
    // chapters visible there instead of sizing and revealing them on scroll.
    const motionOff = () => section.dataset.editor === 'true' || reduced.matches || section.dataset.animate === 'false' || document.documentElement.dataset.motion === 'reduced';
    const cancel = () => { animations.forEach(animation => animation.cancel()); animations = []; };
    const activate = index => {
      const previous = active < 0 ? index : active;
      active = index;
      cancel();
      images.forEach((image, i) => {
        image.dataset.active = String(i === index);
        image.dataset.previous = String(i === previous);
      });
      section.dataset.scene = String(index);
      wipe.style.background = colors[index % colors.length];
      if (!wipe.animate || motionOff()) return;
      // Reference: .65s expressive + .22s fast, with the image switch at 41%.
      const timing = { duration: 870, easing: 'linear', fill: 'both' };
      animations = [
        images[index].animate([
          { clipPath: 'inset(0 0 100%)', offset: 0, easing: 'cubic-bezier(.22,1,.36,1)' },
          { clipPath: 'inset(0 0 100%)', offset: .40, easing: 'cubic-bezier(.22,1,.36,1)' },
          { clipPath: 'inset(0)', offset: .41, easing: 'cubic-bezier(.22,1,.36,1)' },
          { clipPath: 'inset(0)', offset: 1, easing: 'cubic-bezier(.22,1,.36,1)' }
        ], timing),
        wipe.animate([
          { transform: 'scaleY(0)', offset: 0, easing: 'cubic-bezier(.22,1,.36,1)' },
          { transform: 'scaleY(1)', offset: .40, easing: 'cubic-bezier(.22,1,.36,1)' },
          { transform: 'scaleY(1)', offset: .48, easing: 'cubic-bezier(.22,1,.36,1)' },
          { transform: 'scaleY(0)', offset: 1, easing: 'cubic-bezier(.22,1,.36,1)' }
        ], timing)
      ];
    };
    const update = () => {
      frame = 0;
      if (!section.isConnected) { cleanup(); return; }
      const animated = !motionOff() && section.clientWidth >= 768;
      section.dataset.motionMode = animated ? 'animated' : 'static';
      if (!animated) { cancel(); active = -1; panels.forEach(panel => panel.dataset.entered = 'true'); return; }
      const viewport = scroller === window ? { top: 0, height: innerHeight, bottom: innerHeight } : scroller.getBoundingClientRect();
      section.style.setProperty('--story-viewport', viewport.height + 'px');
      const trigger = viewport.top + viewport.height * .55;
      let next = 0;
      panels.forEach((panel, i) => {
        const rect = panel.getBoundingClientRect();
        if (rect.top <= trigger) next = i;
        panel.dataset.entered = String(rect.top < viewport.bottom - viewport.height * .15 && rect.bottom > viewport.top);
      });
      if (next !== active) activate(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    let lastColor = -1;
    section.querySelectorAll('.hw-career-story__checklist li').forEach(item => {
      const color = () => {
        if (motionOff()) return;
        const choices = colors.map((_, i) => i).filter(i => i !== lastColor);
        lastColor = choices[Math.floor(Math.random() * choices.length)];
        item.style.setProperty('--benefit-accent', colors[lastColor]);
      };
      item.addEventListener('pointerenter', color);
      item.addEventListener('focus', () => { if (!item.matches(':hover')) color(); });
    });
    const settings = new MutationObserver(schedule);
    settings.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    settings.observe(section, { attributes: true, attributeFilter: ['data-animate', 'data-editor'] });
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resize?.observe(section);
    const cleanup = () => {
      cancel(); cancelAnimationFrame(frame); settings.disconnect(); resize?.disconnect();
      scroller.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule);
    };
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    update();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
