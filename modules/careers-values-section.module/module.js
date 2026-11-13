(() => {
  const init = () => document.querySelectorAll('[data-career-values]').forEach(section => {
    if (section.dataset.valuesReady) return;
    section.dataset.valuesReady = 'true';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const heading = section.querySelector('[data-values-reveal]');
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
    const colors = ['var(--values-accent_one)', 'var(--values-accent_two)', 'var(--values-accent_three)'];
    let previous = -1;
    const changeColor = row => {
      if (motionOff()) return;
      const choices = colors.map((_, index) => index).filter(index => index !== previous);
      previous = choices[Math.floor(Math.random() * choices.length)];
      row.style.setProperty('--value-accent', colors[previous]);
    };
    section.querySelectorAll('.hw-career-values__row').forEach(row => {
      row.addEventListener('pointerenter', () => changeColor(row));
      row.addEventListener('focus', () => { if (!row.matches(':hover')) changeColor(row); });
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
