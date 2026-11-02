(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-faq__index').forEach(nav => {
    if (nav.dataset.faqInitialized) return;
    nav.dataset.faqInitialized = 'true';
    const header = document.querySelector('[data-hw-header]');
    const section = nav.closest('.hw-faq');
    const sidebar = section.querySelector('.hw-faq__sidebar');
    const content = section.querySelector('.hw-faq__content');
    const groups = section.querySelectorAll('.hw-faq__group');
    const lastGroup = groups[groups.length - 1];
    const reserveSidebarSpace = () => {
      if (!sidebar || !content || !lastGroup) return;
      const style = getComputedStyle(sidebar);
      // The final group must leave enough track for the entire sticky sidebar.
      // Padding on the content column extends the grid row, not just its outer box.
      const space = style.position === 'sticky'
        ? Math.max(0, sidebar.offsetHeight + (parseFloat(style.top) || 0) - lastGroup.offsetHeight - 24)
        : 0;
      content.style.setProperty('--faq-sidebar-space', Math.ceil(space) + 'px');
    };
    reserveSidebarSpace();
    if ('ResizeObserver' in window && sidebar && lastGroup) {
      const resize = new ResizeObserver(reserveSidebarSpace);
      resize.observe(sidebar);
      resize.observe(lastGroup);
    }
    window.addEventListener('resize', reserveSidebarSpace, { passive:true });
    let scroller = window;
    for (let parent = nav.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) { scroller = parent; break; }
    }
    let frame = 0;
    const cancel = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (header) delete header.dataset.anchorScrolling;
    };
    window.addEventListener('wheel', cancel, { passive:true });
    window.addEventListener('touchstart', cancel, { passive:true });
    window.addEventListener('keydown', event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancel();
    });
    nav.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      cancel();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
      target.focus({ preventScroll:true });
      const viewportTop = scroller === window ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop;
      const start = scroller === window ? window.scrollY : scroller.scrollTop;
      const targetTop = target.getBoundingClientRect().top - viewportTop;
      let offset = 0;
      if (header) {
        const style = getComputedStyle(header);
        if (['fixed', 'sticky'].includes(style.position) && style.display !== 'none' && style.visibility !== 'hidden') {
          const height = Math.max(0, (parseFloat(style.top) || 0) + header.offsetHeight - viewportTop);
          const currentOffset = header.dataset.hidden === 'true' ? 0 : height;
          const distance = targetTop - currentOffset - 24;
          // Match normal scrolling: down hides the header; up reveals it.
          // Resolve the final state before calculating the destination so the heading
          // lands below the revealed header without a second corrective jump.
          const menuOpen = header.dataset.open === 'true' || header.querySelector('[data-open="true"]');
          if (menuOpen) header.dataset.hidden = 'false';
          else if (Math.abs(distance) > 1) header.dataset.hidden = String(distance > 0);
          offset = header.dataset.hidden === 'true' ? 0 : height;
        }
      }
      // Keep the gap smaller than the 64px group spacing so earlier FAQs are offscreen.
      if (sidebar) sidebar.style.setProperty('--faq-header-offset', offset + 24 + 'px');
      reserveSidebarSpace();
      const top = Math.max(0, start + targetTop - offset - 24);
      nav.querySelectorAll('a').forEach(item => {
        if (item === link) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
      if (header) header.dataset.anchorScrolling = 'true';
      const started = performance.now();
      const tick = now => {
        const progress = reduced ? 1 : Math.min(1, (now - started) / 450);
        const eased = 1 - Math.pow(1 - progress, 3);
        scroller.scrollTo({ top:start + (top - start) * eased, behavior:'instant' });
        if (progress < 1) frame = requestAnimationFrame(tick);
        else frame = requestAnimationFrame(cancel);
      };
      frame = requestAnimationFrame(tick);
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
