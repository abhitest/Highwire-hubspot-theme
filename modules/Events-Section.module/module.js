(() => {
  'use strict';
  if (window.hwEventsInit) { window.hwEventsInit(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = new Map();
  const backgrounds = new Map();
  let backgroundFrame = 0;
  const updateBackgrounds = () => {
    backgroundFrame = 0;
    backgrounds.forEach((image, section) => {
      if (!section.isConnected) { backgrounds.delete(section); return; }
      // HubSpot previews can scroll inside a wrapper rather than the window.
      let root = section.parentElement;
      while (root && root !== document.body && root !== document.documentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(root).overflowY) && root.scrollHeight > root.clientHeight) break;
        root = root.parentElement;
      }
      const nestedRoot = root && root !== document.body && root !== document.documentElement;
      const scroll = nestedRoot ? root.scrollTop : window.scrollY;
      const style = getComputedStyle(section);
      const opacity = parseFloat(style.getPropertyValue('--event-image_opacity')) || 0;
      const distance = Math.max(1, parseFloat(style.getPropertyValue('--event-fade_distance')) || 180);
      const disabled = section.dataset.animate === 'false';
      const motionReduced = reduced.matches || document.documentElement.dataset.motion === 'reduced';
      // Reference uses an immediate change instead of a gradual fade in reduced motion.
      const progress = disabled ? 0 : motionReduced ? Number(scroll > 0) : Math.min(Math.max(scroll / distance, 0), 1);
      image.style.opacity = String(opacity * (1 - progress));
    });
  };
  const scheduleBackgrounds = () => {
    if (!backgroundFrame) backgroundFrame = requestAnimationFrame(updateBackgrounds);
  };
  const off = element => reduced.matches || document.documentElement.dataset.motion === 'reduced' || element.closest('.hw-events').dataset.animate === 'false';
  const play = (element, state) => {
    if (off(element) || state.played) return;
    state.played = true;
    element.classList.add('is-event-visible');
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    const state = targets.get(entry.target);
    if (!state) return;
    state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.12;
    if (state.visible) play(entry.target,state);
  }),{threshold:0.12,rootMargin:'0px 0px -8% 0px'}) : null;
  const measuredRails = new WeakSet();
  const updateRail = rail => {
    if (!rail.isConnected) return;
    let root = rail.parentElement;
    while (root && root !== document.body && root !== document.documentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(root).overflowY) && root.scrollHeight > root.clientHeight) break;
      root = root.parentElement;
    }
    const viewport = root && root !== document.body && root !== document.documentElement ? root.clientHeight : innerHeight;
    const top = parseFloat(getComputedStyle(rail).getPropertyValue('--event-sticky_top')) || 0;
    // Tall forms scroll until their bottom is visible, then stay pinned.
    rail.style.setProperty('--event-rail-top', Math.min(top, viewport - rail.offsetHeight - 24) + 'px');
    delete rail.dataset.eventStatic;
  };
  const railResize = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(entry => updateRail(entry.target))) : null;
  const refresh = () => {
    document.querySelectorAll('.hw-events').forEach(section => {
      const image = section.querySelector('.hw-events__background img');
      if (image) backgrounds.set(section, image);
      else backgrounds.delete(section);
    });
    scheduleBackgrounds();
    targets.forEach((state,element) => { if (!element.isConnected) { if (observer) observer.unobserve(element); targets.delete(element); } });
    document.querySelectorAll('.hw-events [data-event-reveal]').forEach(element => {
      if (targets.has(element)) return;
      targets.set(element,{visible:false,played:false});
      if (observer) {
        element.classList.add('is-event-ready');
        // Commit the hidden starting state before an already-visible target reveals.
        getComputedStyle(element).opacity;
        observer.observe(element);
      }
    });
    document.querySelectorAll('.hw-events__rail').forEach(rail => {
      updateRail(rail);
      if (railResize && !measuredRails.has(rail)) { measuredRails.add(rail); railResize.observe(rail); }
    });
  };
  const sync = () => {
    scheduleBackgrounds();
    targets.forEach((state,element) => {
    if (!element.isConnected) return;
    if (off(element)) { element.classList.remove('is-event-visible'); state.played=false; }
    else if (state.visible) play(element,state);
    });
  };
  window.hwEventsInit = refresh;
  reduced.addEventListener('change',sync);
  window.addEventListener('resize',refresh,{passive:true});
  document.addEventListener('scroll',scheduleBackgrounds,{passive:true,capture:true});
  window.addEventListener('pageshow',scheduleBackgrounds);
  const init = () => {
    refresh();
    new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) refresh();
      if (records.some(record => record.type === 'attributes')) sync();
    }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion','data-animate']});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
