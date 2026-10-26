/* A cursor-sized mosaic, sampled with the same cover crop as the hero image. */
(() => {
  // Careers-style whole-cell pixel lens, shared behavior across image modules.
  const pixelSize = width => innerWidth < 767 ? Math.max(8, Math.min(26, width / 32)) : 26;
  const maskPixels = (context, canvas, x, y, width, height) => {
    const col = Math.floor(x / width * canvas.width), row = Math.floor(y / height * canvas.height);
    const spread = 4 + Math.floor(2 * Math.random());
    context.globalCompositeOperation = 'destination-in';
    context.beginPath();
    for (let cy = Math.max(0, row - spread); cy <= Math.min(canvas.height - 1, row + spread); cy++) {
      for (let cx = Math.max(0, col - spread); cx <= Math.min(canvas.width - 1, col + spread); cx++) {
        const distance = Math.max(Math.abs(cx - col), Math.abs(cy - row));
        const chance = .9 * (1 - (distance - 3) / (spread - 3));
        if (distance <= 3 || (distance < spread && Math.random() < chance)) context.rect(cx, cy, 1, 1);
      }
    }
    context.fill();
    context.globalCompositeOperation = 'source-over';
  };

  'use strict';

  const init = () => document.querySelectorAll('[data-hero-module]').forEach(hero => {
    if (hero.dataset.heroInitialized) return;
    hero.dataset.heroInitialized = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    const motionOff = () => mobile.matches || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const finish = () => { hero.dataset.heroMotion = 'done'; };
    // Animation is owned by this module, independent of the theme runtime.
    if (!motionOff()) {
      hero.dataset.heroMotion = 'preparing';
      const start = async () => {
        const photo = hero.querySelector('.hero__camera img');
        // The first frame needs the decoded image, including on an uncached reload.
        if (photo && photo.decode) {
          try { await photo.decode(); } catch (_) { /* Keep content available if the image fails. */ }
        }
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (motionOff() || hero.dataset.heroMotion === 'done') return finish();
          hero.dataset.heroMotion = 'running';
          // Release animation fill styles so hover/focus transforms can work.
          setTimeout(finish, 2300);
        }));
      };
      if (document.readyState === 'complete') start();
      else window.addEventListener('load', start, { once: true });
    }
    reduced.addEventListener('change', () => { if (motionOff()) finish(); });
    mobile.addEventListener('change', () => { if (motionOff()) finish(); });
    const cta = hero.querySelector('.hero__cta');
    if (cta) cta.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const href = cta.getAttribute('href');
      if (!href || !href.startsWith('#') || href.length < 2) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (_) { return; }
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const work = target.matches('[data-work-module]') ? target : target.querySelector('[data-work-module]');
      const destination = work || target;
      let scroller = window;
      for (let parent = destination.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
      }
      const header = work ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 0;
      const viewportTop = scroller === window ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop;
      const scrollTop = scroller === window ? window.scrollY : scroller.scrollTop;
      scroller.scrollTo({ top: destination.getBoundingClientRect().top - viewportTop + scrollTop - header, behavior: motionOff() ? 'auto' : 'smooth' });
    }, true);
    const camera = hero.querySelector('.hero__camera');
    const image = camera && camera.querySelector('img');
    const canvas = camera && camera.querySelector('.hero__pixels');
    if (!image || !canvas || canvas.dataset.initialized) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.dataset.initialized = 'true';



    let pointer = null;
    let frame = 0;

    const hide = () => {
      pointer = null;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.classList.remove('is-active');
    };

    const draw = () => {
      frame = 0;
      if (!pointer || !image.complete || !image.naturalWidth) return;
      const rect = image.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      if (!rect.width || !rect.height || x < 0 || y < 0 || x > rect.width || y > rect.height) {
        hide();
        return;
      }

      // Use image layout coordinates, exactly as the reference does before scaling.
      const width = image.offsetWidth, height = image.offsetHeight;
      if (!width || !height) return;
      const cols = Math.max(1, Math.ceil(width / 26));
      const rows = Math.max(1, Math.ceil(height / 26));
      canvas.width = cols;
      canvas.height = rows;
      const style = getComputedStyle(image);
      canvas.style.filter = style.filter;
      const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(width / image.naturalWidth, height / image.naturalHeight);
      const [positionX, positionY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const drawnWidth = image.naturalWidth * scale, drawnHeight = image.naturalHeight * scale;
      // Default canvas sampling preserves the reference's block colors.
      context.drawImage(image,
        (width - drawnWidth) * (positionX || 0) * cols / width,
        (height - drawnHeight) * (positionY || 0) * rows / height,
        drawnWidth * cols / width, drawnHeight * rows / height);
      maskPixels(context, canvas, x, y, rect.width, rect.height);
      canvas.classList.add('is-active');
    };

    hero.addEventListener('pointermove', event => {
      if (innerWidth <= 767 || event.pointerType !== 'mouse' || reduced.matches || document.documentElement.dataset.motion === 'reduced') {
        hide();
        return;
      }
      // The stage's transparent top padding sits above the photo in the hit-test stack.
      const bounds = hero.querySelector('.hero__frame').getBoundingClientRect();
      const copy = hero.querySelector('.hero__copy');
      const bottom = copy ? Math.min(bounds.bottom, copy.getBoundingClientRect().top) : bounds.bottom;
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY >= bottom) { hide(); return; }
      if (pointer && Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
    });
    hero.addEventListener('pointerleave', hide);
    hero.addEventListener('pointercancel', hide);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide, { passive: true });
    window.addEventListener('blur', hide);
    reduced.addEventListener('change', hide);
    new MutationObserver(hide).observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
