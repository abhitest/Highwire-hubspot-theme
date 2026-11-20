(()=>{'use strict';if(window.hwCaseStudyInit){window.hwCaseStudyInit();return;}const reduced=matchMedia('(prefers-reduced-motion: reduce)');const off=()=>reduced.matches||document.documentElement.dataset.motion==='reduced';const show=el=>{el.classList.remove('case-pending');el.classList.add('case-visible');};const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){show(entry.target);observer.unobserve(entry.target);}}),{threshold:0,rootMargin:'0px 0px -8% 0px'}):null;const init=()=>document.querySelectorAll('.hw-case [data-case-reveal]:not([data-case-ready])').forEach(el=>{el.dataset.caseReady='true';if(!observer||off()){show(el);return;}el.classList.add('case-pending');observer.observe(el);});const sync=()=>{if(off())document.querySelectorAll('.hw-case .case-pending').forEach(el=>{show(el);if(observer)observer.unobserve(el);});};window.hwCaseStudyInit=init;reduced.addEventListener('change',sync);const start=()=>{init();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))init();if(records.some(r=>r.type==='attributes'))sync();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion']});};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();

/* Shared interactions. Each section owns its animation in its module.js. */
(() => {
  'use strict';
  // Reuse each module's static/reduced-motion behavior on mobile.
  const mobileMotion = matchMedia('(max-width: 767px)');
  const root = document.documentElement;
  let desktopMotion = root.getAttribute('data-motion');
  const syncMobileMotion = () => {
    if (mobileMotion.matches) {
      desktopMotion = root.getAttribute('data-motion');
      root.dataset.motion = 'reduced';
    } else if (desktopMotion === null) root.removeAttribute('data-motion');
    else root.setAttribute('data-motion', desktopMotion);
  };
  if (mobileMotion.matches) syncMobileMotion();
  mobileMotion.addEventListener('change', syncMobileMotion);
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const href = link.getAttribute('href');
    if (!href || href.length < 2) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (_) { return; }
    if (!target) return;
    event.preventDefault();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
    const header = document.querySelector('[data-hw-header]');
    const offset = header ? header.getBoundingClientRect().height : 0;
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: reduced ? 'auto' : 'smooth' });
  });
})();


