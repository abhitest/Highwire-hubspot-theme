(() => {
  const init = () => document.querySelectorAll('[data-career-residents]').forEach(section => {
    if (section.dataset.valuesReady) return;
    section.dataset.valuesReady = 'true';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    section.querySelectorAll('.hw-career-residents__extended').forEach(details => {
      const summary = details.querySelector('summary');
      let animation;
      let expanded = details.open;
      const finish = () => {
        if (animation) {
          animation.onfinish = null;
          animation.cancel();
          animation = null;
        }
        details.open = expanded;
        details.style.removeProperty('height');
        details.style.removeProperty('overflow');
      };
      summary.addEventListener('click', event => {
        if (!details.animate) return;
        event.preventDefault();
        const start = details.getBoundingClientRect().height;
        expanded = !expanded;
        if (animation) {
          animation.onfinish = null;
          animation.cancel();
        }
        if (motionOff()) { finish(); return; }
        details.style.removeProperty('height');
        details.open = expanded;
        const end = details.getBoundingClientRect().height;
        // Keep content rendered until the closing animation completes.
        details.open = true;
        details.style.height = `${start}px`;
        details.style.overflow = 'hidden';
        animation = details.animate(
          [{ height:`${start}px` }, { height:`${end}px` }],
          { duration:360, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards' }
        );
        animation.onfinish = finish;
      });
      reduced.addEventListener('change', () => { if (motionOff()) finish(); });
      window.addEventListener('resize', () => { if (animation) finish(); });
    });
    const heading = section.querySelector('[data-residents-reveal]');
    let observer;
    if (heading && !motionOff() && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      section.classList.add('is-motion-ready');
      observer.observe(heading);
    }
    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        section.classList.remove('is-motion-ready');
        observer?.disconnect();
      }
    });
    const colors = ['var(--residents-accent_one)', 'var(--residents-accent_two)', 'var(--residents-accent_three)'];
    let previous = -1;
    const changeColor = row => {
      if (motionOff()) return;
      const choices = colors.map((_, index) => index).filter(index => index !== previous);
      previous = choices[Math.floor(Math.random() * choices.length)];
      row.style.setProperty('--profile-accent', colors[previous]);
    };
    section.querySelectorAll('.hw-career-residents__profile').forEach(row => {
      row.addEventListener('pointerenter', () => changeColor(row));
      row.addEventListener('focus', () => { if (!row.matches(':hover')) changeColor(row); });
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
