(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-insights-banner').forEach(section => {
    if (section.dataset.insightsInitialized) return;
    section.dataset.insightsInitialized = 'true';
    const title = section.querySelector('.hw-insights-banner__title');
    const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
    if (title && !motionOff() && 'IntersectionObserver' in window) {
      const reveal = () => {
        title.classList.remove('hw-insights-banner__title--pending');
        title.classList.add('hw-insights-banner__title--visible');
        observer.disconnect();
        reduced.removeEventListener('change', onMotionChange);
      };
      const onMotionChange = () => { if (motionOff()) reveal(); };
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) reveal();
      }, { threshold:.12, rootMargin:'0px 0px -8% 0px' });
      title.classList.add('hw-insights-banner__title--pending');
      observer.observe(title);
      reduced.addEventListener('change', onMotionChange);
    }

    const tabs = Array.from(section.querySelectorAll('.hw-insights-banner__tab'));
    const nav = section.querySelector('.hw-insights-banner__navigation');
    const mobileTabs = matchMedia('(max-width: 639px)');
    let activeIndex = 0;
    let scrollDirection = 1;
    const revealTab = (tab, smooth = true) => {
      if (!nav || !mobileTabs.matches || nav.scrollWidth <= nav.clientWidth) return;
      const viewport = nav.getBoundingClientRect();
      const bounds = tab.getBoundingClientRect();
      // Reveal the neighbour in the direction the user is navigating.
      const index = tabs.indexOf(tab);
      const neighbour = scrollDirection < 0 ? tabs[index - 1]
        : tabs[index + 1] || nav.querySelector('.hw-insights-banner__podcast');
      const neighbourBounds = neighbour?.getBoundingClientRect();
      const start = scrollDirection < 0 && neighbourBounds ? neighbourBounds.left : bounds.left;
      const end = scrollDirection > 0 && neighbourBounds ? neighbourBounds.right : bounds.right;
      const left = nav.scrollLeft + start - viewport.left;
      const right = nav.scrollLeft + end - viewport.left;
      let target = nav.scrollLeft;
      if (right - left <= nav.clientWidth - 12) {
        target = Math.max(target, right - nav.clientWidth + 6);
        target = Math.min(target, left - 6);
      } else target = nav.scrollLeft + bounds.left - viewport.left - 6;
      nav.scrollTo({ left:Math.max(0, Math.min(target, nav.scrollWidth - nav.clientWidth)), behavior:smooth && !motionOff() ? 'smooth' : 'instant' });
    };
    // Targets remain independent HubSpot modules with the base module's Section ID.
    const connections = () => tabs.filter(tab => tab.dataset.insightsTarget).map(tab => ({
      tab, panel:document.getElementById(tab.dataset.insightsTarget.trim().replace(/^#/, ''))
    })).filter(({ panel }) => panel && !panel.contains(section) && !section.contains(panel));
    const select = (tab, notify = true) => {
      const index = tabs.indexOf(tab);
      if (index !== activeIndex) scrollDirection = index < activeIndex ? -1 : 1;
      activeIndex = index;
      tabs.forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      const linked = connections();
      const all = tab.hasAttribute('data-insights-all');
      linked.forEach(({ tab:owner, panel }) => {
        owner.setAttribute('aria-controls', panel.id);
        panel.setAttribute('data-insights-panel', '');
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', all ? tab.id : owner.id);
        panel.tabIndex = 0;
        panel.hidden = !all && panel !== linked.find(item => item.tab === tab)?.panel;
      });
      const allTab = tabs.find(item => item.hasAttribute('data-insights-all'));
      if (allTab && linked.length) allTab.setAttribute('aria-controls', [...new Set(linked.map(item => item.panel.id))].join(' '));
      revealTab(tab, notify);
      if (notify) section.dispatchEvent(new CustomEvent('highwire:insights-change', {
        bubbles:true, detail:{ targetId:all ? 'all' : tab.dataset.insightsTarget, tabId:tab.id }
      }));
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
          : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus({ preventScroll:true });
        if (!mobileTabs.matches && nav && nav.scrollWidth > nav.clientWidth) {
          const bounds = tabs[next].getBoundingClientRect();
          const viewport = nav.getBoundingClientRect();
          if (bounds.left < viewport.left) nav.scrollLeft -= viewport.left - bounds.left + 6;
          else if (bounds.right > viewport.right) nav.scrollLeft += bounds.right - viewport.right + 6;
        }
      });
    });
    if (tabs.length) select(tabs[0], false);
    if (nav && 'ResizeObserver' in window) {
      const resize = new ResizeObserver(() => {
        const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
        if (active) revealTab(active, false);
      });
      resize.observe(nav);
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
