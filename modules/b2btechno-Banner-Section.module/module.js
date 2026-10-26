/* Reference entrance choreography and pointer-sized pixel mosaic. */
(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-b2b-banner').forEach(section => {
    if (section.dataset.b2bInitialized) return;
    section.dataset.b2bInitialized = 'true';
    // Headerless previews and non-sticky headers need no reserved top space.
    let headerFrame = 0;
    let previousOffset = -1;
    const syncHeaderOffset = () => {
      headerFrame = 0;
      let offset = 0;
      document.querySelectorAll('[data-hw-header], .hw-header, header[role="banner"], body > header').forEach(header => {
        const rect = header.getBoundingClientRect();
        const style = getComputedStyle(header);
        if (!rect.height || style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return;
        let pinned = null;
        for (let node = header; node && node !== document.body; node = node.parentElement) {
          const position = getComputedStyle(node).position;
          if (position === 'sticky' || position === 'fixed') { pinned = node; break; }
        }
        // Use layout dimensions, not scroll/transform-dependent rect.bottom.
        // A header sliding in/out must not resize or move the pinned headline.
        if (pinned) {
          const top = parseFloat(getComputedStyle(pinned).top);
          if (Number.isFinite(top) && top >= 0) offset = Math.max(offset, top + pinned.offsetHeight);
        }
      });
      offset = Math.round(offset);
      if (offset !== previousOffset) {
        section.style.setProperty('--b2b-sticky-top', offset + 'px');
        previousOffset = offset;
      }
    };
    const scheduleHeaderOffset = () => {
      if (!headerFrame) headerFrame = requestAnimationFrame(syncHeaderOffset);
    };
    syncHeaderOffset();
    window.addEventListener('resize', scheduleHeaderOffset, { passive: true });
    window.addEventListener('load', scheduleHeaderOffset, { once: true });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    const motionOff = () => reduced.matches || mobile.matches || document.documentElement.dataset.motion === 'reduced';
    const media = section.querySelector('.hw-b2b-banner__media');
    const photo = media && media.querySelector('img');
    let observer;
    let started = false;
    const finish = () => { section.dataset.b2bMotion = 'done'; };
    const start = () => {
      if (started) return;
      started = true;
      if (observer) observer.disconnect();
      if (motionOff()) return finish();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (motionOff()) return finish();
        section.dataset.b2bMotion = 'running';
        setTimeout(finish, 1200);
      }));
    };
    const ready = () => {
      if (motionOff()) return finish();
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) start();
        }, { threshold: 0 });
        observer.observe(section);
      } else start();
    };
    if (motionOff()) finish();
    else {
      section.dataset.b2bMotion = 'preparing';
      // Wait for the page loader and image before revealing the banner.
      if (document.readyState === 'complete') ready();
      else window.addEventListener('load', ready, { once: true });
      // Failed or stalled assets must not leave content hidden indefinitely.
      setTimeout(() => { if (!started) { if (observer) observer.disconnect(); finish(); } }, 5000);
    }

    if (!media || !photo) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'hw-b2b-banner__pixels';
    canvas.setAttribute('aria-hidden', 'true');
    media.appendChild(canvas);
    const sample = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const sampleContext = sample.getContext('2d');
    if (!context || !sampleContext) { canvas.remove(); return; }
    let frame = 0;
    let pointer = null;
    let lastX = -Infinity;
    let lastY = -Infinity;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      lastX = lastY = -Infinity;
      canvas.style.visibility = 'hidden';
    };
    const draw = () => {
      frame = 0;
      if (!pointer || motionOff() || !photo.complete || !photo.naturalWidth) return clear();
      const rect = photo.getBoundingClientRect();
      if (!rect.width || !rect.height) return clear();
      const width = photo.offsetWidth;
      const height = photo.offsetHeight;
      const cols = Math.max(1, Math.ceil(width / 26));
      const rows = Math.max(1, Math.ceil(height / 26));
      canvas.width = sample.width = cols;
      canvas.height = sample.height = rows;
      const style = getComputedStyle(photo);
      const scale = style.objectFit === 'contain'
        ? Math.min(width / photo.naturalWidth, height / photo.naturalHeight)
        : Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
      const [px, py] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const imageWidth = photo.naturalWidth * scale;
      const imageHeight = photo.naturalHeight * scale;
      // Drawing only (no pixel reads) also supports cross-origin HubSpot images.
      sampleContext.drawImage(photo, (width - imageWidth) * (px || 0) * cols / width,
        (height - imageHeight) * (py || 0) * rows / height,
        imageWidth * cols / width, imageHeight * rows / height);
      const col = Math.floor((pointer.x - rect.left) / rect.width * cols);
      const row = Math.floor((pointer.y - rect.top) / rect.height * rows);
      const spread = 3 + Math.floor(2 * Math.random());
      for (let y = Math.max(0, row - spread); y <= Math.min(rows - 1, row + spread); y++) {
        for (let x = Math.max(0, col - spread); x <= Math.min(cols - 1, col + spread); x++) {
          const distance = Math.max(Math.abs(x - col), Math.abs(y - row));
          const chance = .9 * (1 - (distance - 2) / (spread - 2));
          if (distance <= 2 || (distance < spread && Math.random() < chance)) {
            context.drawImage(sample, x, y, 1, 1, x, y, 1, 1);
          }
        }
      }
      canvas.style.visibility = 'visible';
    };
    media.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || motionOff()) return clear();
      if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < 6) return;
      lastX = event.clientX;
      lastY = event.clientY;
      pointer = { x: lastX, y: lastY };
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    ['pointerleave', 'pointercancel'].forEach(type => media.addEventListener(type, clear));
    window.addEventListener('blur', clear);
    window.addEventListener('resize', clear, { passive: true });
    document.addEventListener('scroll', clear, { passive: true, capture: true });
    const syncMotion = () => { clear(); if (motionOff()) finish(); };
    reduced.addEventListener('change', syncMotion);
    mobile.addEventListener('change', syncMotion);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
