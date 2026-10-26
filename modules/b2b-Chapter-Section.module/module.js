(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-b2b-chapter').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    const buttons = Array.from(section.querySelectorAll('.hw-b2b-chapter__list button'));
    const panels = Array.from(section.querySelectorAll('.hw-b2b-chapter__panel'));
    const tones = ['#4bb7ff', '#fa9bff', '#ff7042'];
    let tone = 1;
    const activate = index => {
      section.style.setProperty('--chapter-tone', tones[tone++ % tones.length]);
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      panels.forEach((panel, i) => {
        const active = i === index;
        panel.dataset.active = String(active);
        panel.setAttribute('aria-hidden', String(!active));
        panel.inert = !active;
      });
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(index));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        buttons[next].focus();
        activate(next);
      });
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
