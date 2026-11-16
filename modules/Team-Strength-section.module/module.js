(() => {
  'use strict';
  const init = () => document.querySelectorAll('[data-team-strength]').forEach(section => {
    if (section.dataset.teamStrengthReady) return;
    section.dataset.teamStrengthReady = 'true';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    let observer;
    if (!motionOff() && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      section.classList.add('is-motion-ready');
      section.querySelectorAll('[data-team-strength-reveal]').forEach(target => observer.observe(target));
    }
    const media = section.querySelector('[data-team-strength-pixels]');
    let clearPixels = () => {};
    if (media) {
      const image = media.querySelector('img');
      const canvas = media.querySelector('canvas');
      const sample = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const sampleCtx = sample.getContext('2d');
      let frame = 0, point = null, lastX = -Infinity, lastY = -Infinity;
      clearPixels = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        point = null;
        lastX = lastY = -Infinity;
        canvas.style.visibility = 'hidden';
      };
      const draw = () => {
        frame = 0;
        if (motionOff() || !point || !ctx || !sampleCtx || !image.complete || !image.naturalWidth) { canvas.style.visibility = 'hidden'; return; }
        const rect = image.getBoundingClientRect();
        const width = image.offsetWidth, height = image.offsetHeight;
        if (!width || !height || !rect.width || !rect.height) return;
        const cols = Math.max(1, Math.ceil(width / 26)), rows = Math.max(1, Math.ceil(height / 26));
        canvas.width = sample.width = cols;
        canvas.height = sample.height = rows;
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const scaledWidth = image.naturalWidth * scale, scaledHeight = image.naturalHeight * scale;
        const focalX = parseFloat(getComputedStyle(image).objectPosition) / 100;
        sampleCtx.drawImage(image, (width - scaledWidth) * (Number.isFinite(focalX) ? focalX : .5) * cols / width, (height - scaledHeight) / 2 * rows / height, scaledWidth * cols / width, scaledHeight * rows / height);
        const cx = Math.floor((point.x - rect.left) / rect.width * cols);
        const cy = Math.floor((point.y - rect.top) / rect.height * rows);
        const radius = 3 + Math.floor(Math.random() * 2);
        for (let y = Math.max(0, cy - radius); y <= Math.min(rows - 1, cy + radius); y++) {
          for (let x = Math.max(0, cx - radius); x <= Math.min(cols - 1, cx + radius); x++) {
            const distance = Math.max(Math.abs(x - cx), Math.abs(y - cy));
            if (distance <= 2 || (distance < radius && Math.random() < .9 * (1 - (distance - 2) / (radius - 2)))) {
              ctx.drawImage(sample, x, y, 1, 1, x, y, 1, 1);
            }
          }
        }
        canvas.style.visibility = 'visible';
      };
      media.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || motionOff()) { clearPixels(); return; }
        if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < 6) return;
        lastX = event.clientX; lastY = event.clientY;
        point = { x: lastX, y: lastY };
        if (!frame) frame = requestAnimationFrame(draw);
      }, { passive: true });
      media.addEventListener('pointerleave', clearPixels);
      document.addEventListener('scroll', clearPixels, { capture: true, passive: true });
      window.addEventListener('resize', clearPixels);
      window.addEventListener('blur', clearPixels);
    }
    reduced.addEventListener('change', () => {
      if (!motionOff()) return;
      section.classList.remove('is-motion-ready');
      observer?.disconnect();
      clearPixels();
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
