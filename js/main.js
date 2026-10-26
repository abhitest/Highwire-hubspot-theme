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

