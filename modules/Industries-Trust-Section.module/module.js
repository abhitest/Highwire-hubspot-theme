(() => {
  const motionIsReduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.motion === 'reduced';

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
    const media = section.querySelector('[data-pixel-media="true"]');
    const image = media?.querySelector('img');
    if (!media || !image) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.className = 'pixel-hover-layer';
    canvas.setAttribute('aria-hidden', 'true');
    media.appendChild(canvas);

    let pointer = null;
    let frame = 0;

    const hidePixels = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      canvas.classList.remove('is-visible');
    };

    const drawPixels = () => {
      frame = 0;
      if (!pointer || !image.complete || !image.naturalWidth || motionIsReduced()) return;
      const imageBounds = image.getBoundingClientRect();
      const x = pointer.x - imageBounds.left;
      const y = pointer.y - imageBounds.top;
      const width = image.offsetWidth;
      const height = image.offsetHeight;
      if (!width || !height || !imageBounds.width || !imageBounds.height || x < 0 || y < 0 || x > imageBounds.width || y > imageBounds.height) {
        hidePixels();
        return;
      }

      canvas.width = Math.max(1, Math.ceil(width / 26));
      canvas.height = Math.max(1, Math.ceil(height / 26));
      Object.assign(canvas.style, {
        left: `${image.offsetLeft}px`,
        top: `${image.offsetTop}px`,
        width: `${width}px`,
        height: `${height}px`
      });

      const style = getComputedStyle(image);
      const fitScale = style.objectFit === 'contain'
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const [positionX = 0.5, positionY = 0.5] = style.objectPosition
        .split(' ')
        .map((value) => Number.parseFloat(value) / 100);
      const renderedWidth = image.naturalWidth * fitScale;
      const renderedHeight = image.naturalHeight * fitScale;
      const sourceWidth = Math.min(image.naturalWidth, width / fitScale);
      const sourceHeight = Math.min(image.naturalHeight, height / fitScale);
      const sourceX = Math.min(
        image.naturalWidth - sourceWidth,
        Math.max(0, ((renderedWidth - width) * (Number.isFinite(positionX) ? positionX : 0.5)) / fitScale)
      );
      const sourceY = Math.min(
        image.naturalHeight - sourceHeight,
        Math.max(0, ((renderedHeight - height) * (Number.isFinite(positionY) ? positionY : 0.5)) / fitScale)
      );

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const column = Math.floor((x / imageBounds.width) * canvas.width);
      const row = Math.floor((y / imageBounds.height) * canvas.height);
      const spread = 3 + Math.floor(2 * Math.random());
      context.globalCompositeOperation = 'destination-in';
      context.beginPath();
      for (let pixelY = Math.max(0, row - spread); pixelY <= Math.min(canvas.height - 1, row + spread); pixelY += 1) {
        for (let pixelX = Math.max(0, column - spread); pixelX <= Math.min(canvas.width - 1, column + spread); pixelX += 1) {
          const distance = Math.max(Math.abs(pixelX - column), Math.abs(pixelY - row));
          const chance = 0.9 * (1 - (distance - 2) / (spread - 2));
          if (distance <= 2 || (distance < spread && Math.random() < chance)) {
            context.rect(pixelX, pixelY, 1, 1);
          }
        }
      }
      context.fill();
      context.globalCompositeOperation = 'source-over';
      canvas.classList.add('is-visible');
    };

    const queueDraw = (event) => {
      if (event.pointerType !== 'mouse' || window.innerWidth <= 767 || motionIsReduced()) {
        hidePixels();
        return;
      }
      if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 6) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = window.requestAnimationFrame(drawPixels);
    };

    media.addEventListener('pointermove', queueDraw);
    media.addEventListener('pointerleave', hidePixels);
    media.addEventListener('pointercancel', hidePixels);
    window.addEventListener('scroll', hidePixels, { passive: true, capture: true });
    window.addEventListener('resize', hidePixels, { passive: true });
    window.addEventListener('blur', hidePixels);
  };

  const init = () => {
    document.querySelectorAll('.hw-industries-trust').forEach((section) => {
      if (section.dataset.trustInitialized) return;
      section.dataset.trustInitialized = 'true';
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
