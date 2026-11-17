(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionIsReduced = () => reducedMotion.matches || document.documentElement.dataset.motion === 'reduced';

  const initReveal = (section) => {
    const heading = section.querySelector('[data-reveal]');
    if (!heading) return;

    if (section.dataset.animate !== 'true' || motionIsReduced() || !('IntersectionObserver' in window)) {
      heading.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    observer.observe(heading);
  };

  const initPixelHover = (section) => {
    if (section.dataset.animate !== 'true') return;

    section.querySelectorAll('[data-pixel-media="true"]').forEach((media) => {
      const image = media.querySelector('img');
      if (!image) return;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const source = document.createElement('canvas');
      const sourceContext = source.getContext('2d');
      if (!context || !sourceContext) return;

      canvas.className = 'pixel-hover-layer';
      canvas.setAttribute('aria-hidden', 'true');
      media.appendChild(canvas);

      let pointer = null;
      let lastX = -1;
      let lastY = -1;
      let frame = 0;

      const hide = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        pointer = null;
        lastX = -1;
        lastY = -1;
        canvas.classList.remove('is-visible');
        context.clearRect(0, 0, canvas.width, canvas.height);
      };

      const draw = () => {
        frame = 0;
        if (!pointer || !image.complete || !image.naturalWidth || motionIsReduced()) return;

        const rect = image.getBoundingClientRect();
        const x = pointer.x - rect.left;
        const y = pointer.y - rect.top;
        const width = image.offsetWidth;
        const height = image.offsetHeight;
        if (!rect.width || !rect.height || !width || !height || x < 0 || y < 0 || x > rect.width || y > rect.height) {
          hide();
          return;
        }

        const columns = Math.max(1, Math.ceil(width / 26));
        const rows = Math.max(1, Math.ceil(height / 26));
        canvas.width = columns;
        canvas.height = rows;
        source.width = columns;
        source.height = rows;
        Object.assign(canvas.style, {
          left: `${image.offsetLeft}px`,
          top: `${image.offsetTop}px`,
          width: `${width}px`,
          height: `${height}px`
        });

        const style = getComputedStyle(image);
        const scale = style.objectFit === 'contain'
          ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
          : Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const [rawX, rawY] = style.objectPosition.split(' ').map((value) => Number.parseFloat(value) / 100);
        const positionX = Number.isFinite(rawX) ? rawX : 0.5;
        const positionY = Number.isFinite(rawY) ? rawY : 0.5;
        const drawnWidth = image.naturalWidth * scale;
        const drawnHeight = image.naturalHeight * scale;

        sourceContext.clearRect(0, 0, columns, rows);
        sourceContext.drawImage(
          image,
          (width - drawnWidth) * positionX * columns / width,
          (height - drawnHeight) * positionY * rows / height,
          drawnWidth * columns / width,
          drawnHeight * rows / height
        );

        const column = Math.floor((x / rect.width) * columns);
        const row = Math.floor((y / rect.height) * rows);
        const spread = 3 + Math.floor(2 * Math.random());
        context.clearRect(0, 0, columns, rows);
        for (let pixelY = Math.max(0, row - spread); pixelY <= Math.min(rows - 1, row + spread); pixelY += 1) {
          for (let pixelX = Math.max(0, column - spread); pixelX <= Math.min(columns - 1, column + spread); pixelX += 1) {
            const distance = Math.max(Math.abs(pixelX - column), Math.abs(pixelY - row));
            const chance = 0.9 * (1 - (distance - 2) / (spread - 2));
            if (distance <= 2 || (distance < spread && Math.random() < chance)) {
              context.drawImage(source, pixelX, pixelY, 1, 1, pixelX, pixelY, 1, 1);
            }
          }
        }
        canvas.classList.add('is-visible');
      };

      media.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse' || window.innerWidth <= 767 || motionIsReduced()) {
          hide();
          return;
        }
        if (pointer && Math.hypot(event.clientX - lastX, event.clientY - lastY) < 6) return;
        lastX = event.clientX;
        lastY = event.clientY;
        pointer = { x: event.clientX, y: event.clientY };
        if (!frame) frame = window.requestAnimationFrame(draw);
      });
      media.addEventListener('pointerleave', hide);
      media.addEventListener('pointercancel', hide);
      image.addEventListener('load', () => {
        if (media.matches(':hover') && pointer && !frame) frame = window.requestAnimationFrame(draw);
      }, { once: true });
    });
  };

  const init = () => {
    document.querySelectorAll('.hw-industry-directory').forEach((section) => {
      if (section.dataset.directoryInitialized) return;
      section.dataset.directoryInitialized = 'true';
      initReveal(section);
      initPixelHover(section);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
