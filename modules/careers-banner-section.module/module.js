(() => {
  const init = () => document.querySelectorAll('.hw-careers-banner').forEach(section => {
    if (section.dataset.bannerReady || section.querySelector('[data-careers-editor]')) return;
    section.dataset.bannerReady = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const title = section.querySelector('.hw-careers-banner__title');
    if (title && !motionOff() && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          title.classList.add('is-visible');
          observer.disconnect();
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      section.classList.add('is-motion-ready');
      observer.observe(title);
    }
    const media = section.querySelector('.hw-careers-banner__media');
    const photo = media?.querySelector('img');
    if (!photo) return;
    const canvas = document.createElement('canvas');
    const buffer = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const source = buffer.getContext('2d');
    if (!context || !source) return;
    canvas.className = 'hw-careers-banner__pixels';
    canvas.setAttribute('aria-hidden', 'true');
    media.appendChild(canvas);
    let frame = 0, point = null, lastX = -1, lastY = -1;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      point = null;
      lastX = lastY = -1;
      canvas.style.visibility = 'hidden';
    };
    const draw = () => {
      frame = 0;
      if (!point || motionOff() || !photo.complete || !photo.naturalWidth) { clear(); return; }
      const rect = photo.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const cols = Math.ceil(rect.width / 26), rows = Math.ceil(rect.height / 26);
      canvas.width = buffer.width = cols;
      canvas.height = buffer.height = rows;
      const style = getComputedStyle(photo);
      const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(rect.width / photo.naturalWidth, rect.height / photo.naturalHeight);
      const [x, y] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const width = photo.naturalWidth * scale, height = photo.naturalHeight * scale;
      source.drawImage(photo, (rect.width - width) * (x || 0) * cols / rect.width, (rect.height - height) * (y || 0) * rows / rect.height, width * cols / rect.width, height * rows / rect.height);
      const cx = Math.floor((point.x - rect.left) / rect.width * cols);
      const cy = Math.floor((point.y - rect.top) / rect.height * rows);
      const radius = 3 + Math.floor(2 * Math.random());
      for (let row = Math.max(0, cy - radius); row <= Math.min(rows - 1, cy + radius); row++) {
        for (let col = Math.max(0, cx - radius); col <= Math.min(cols - 1, cx + radius); col++) {
          const distance = Math.max(Math.abs(col - cx), Math.abs(row - cy));
          if (distance <= 2 || (distance < radius && Math.random() < .9 * (1 - (distance - 2) / (radius - 2)))) {
            context.drawImage(buffer, col, row, 1, 1, col, row, 1, 1);
          }
        }
      }
      canvas.style.visibility = 'visible';
    };
    media.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || motionOff()) { clear(); return; }
      if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < 6) return;
      lastX = event.clientX; lastY = event.clientY;
      point = { x: lastX, y: lastY };
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    media.addEventListener('pointerleave', clear);
    document.addEventListener('scroll', clear, { capture: true, passive: true });
    window.addEventListener('blur', clear);
    window.addEventListener('resize', clear);
    reduced.addEventListener('change', clear);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
