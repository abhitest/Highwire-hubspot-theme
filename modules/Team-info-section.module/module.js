(() => {
  'use strict';
  if (window.hwTeamInfoInit) { window.hwTeamInfoInit(); return; }
  const observed = new WeakSet();
  const peopleGrids = new WeakMap();
  const peopleCards = new WeakSet();
  const accents = ['#4bb7ff', '#fa9bff', '#ff7042'];
  const fit = element => {
    const offset = parseFloat(getComputedStyle(element).getPropertyValue('--team-sticky-top')) || 0;
    element.dataset.static = String(element.offsetHeight + offset > innerHeight);
  };
  const resize = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(entry => fit(entry.target))) : null;
  const init = () => {
    document.querySelectorAll('.hw-team-info__people').forEach(grid => {
      if (!peopleGrids.has(grid)) peopleGrids.set(grid, { index: 0 });
      const cycle = card => {
        const state = peopleGrids.get(grid);
        card.style.setProperty('--profile-accent', accents[state.index++ % accents.length]);
      };
      grid.querySelectorAll('article').forEach(card => {
        if (peopleCards.has(card)) return;
        peopleCards.add(card);
        card.addEventListener('pointerenter', () => cycle(card), { passive: true });
        card.addEventListener('focusin', event => {
          if (!card.matches(':hover') && !card.contains(event.relatedTarget)) cycle(card);
        });
      });
    });
    document.querySelectorAll('.hw-team-info__identity').forEach(element => {
    fit(element);
    if (observed.has(element)) return;
    observed.add(element);
    if (resize) resize.observe(element);
    });
  };
  window.hwTeamInfoInit = init;
  window.addEventListener('resize',init,{passive:true});
  const start = () => { init(); new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
