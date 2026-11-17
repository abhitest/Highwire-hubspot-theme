(function () {
  function initPixelHover(section) {
    if (section.dataset.pixelHoverReady === 'true') return;
    section.dataset.pixelHoverReady = 'true';

    var motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
    if (motionReduced) return;

    var overlays = new Map();
    var sourceCanvas = document.createElement('canvas');
    var sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    var frame = 0;
    var pointer = null;
    var previousX = -1;
    var previousY = -1;

    function hideOverlays() {
      overlays.forEach(function (canvas) { canvas.style.visibility = 'hidden'; });
    }

    function renderPixelHover() {
      frame = 0;
      hideOverlays();
      if (!pointer || !sourceContext) return;

      var hovered = document.elementFromPoint(pointer.clientX, pointer.clientY);
      var media = hovered && hovered.closest('[data-pixel-media="true"]');
      if (!media || !section.contains(media)) return;

      media.querySelectorAll('img').forEach(function (image) {
        if (!image.complete || !image.naturalWidth || !image.naturalHeight || /\.svg(?:[?&]|$)/i.test(image.src)) return;
        var rect = image.getBoundingClientRect();
        if (pointer.clientX < rect.left || pointer.clientX > rect.right || pointer.clientY < rect.top || pointer.clientY > rect.bottom || !rect.width || !rect.height) return;

        var parent = image.parentElement;
        if (!parent) return;
        var overlay = overlays.get(image);
        if (!overlay) {
          overlay = document.createElement('canvas');
          overlay.className = 'hw-cap-disciplines__pixel-canvas';
          overlay.setAttribute('aria-hidden', 'true');
          parent.appendChild(overlay);
          overlays.set(image, overlay);
        }

        var width = image.offsetWidth;
        var height = image.offsetHeight;
        var gridWidth = Math.max(1, Math.ceil(width / 26));
        var gridHeight = Math.max(1, Math.ceil(height / 26));
        var style = window.getComputedStyle(image);
        overlay.width = gridWidth;
        overlay.height = gridHeight;
        overlay.style.left = image.offsetLeft + 'px';
        overlay.style.top = image.offsetTop + 'px';
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        overlay.style.filter = style.filter;
        overlay.style.transform = style.transform;
        overlay.style.transformOrigin = style.transformOrigin;
        overlay.style.visibility = 'visible';

        var context = overlay.getContext('2d');
        if (!context) return;
        sourceCanvas.width = gridWidth;
        sourceCanvas.height = gridHeight;

        var fit = style.objectFit === 'contain'
          ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
          : Math.max(width / image.naturalWidth, height / image.naturalHeight);
        var positions = style.objectPosition.split(' ').map(function (value) { return parseFloat(value) / 100; });
        var scaledWidth = image.naturalWidth * fit;
        var scaledHeight = image.naturalHeight * fit;
        sourceContext.drawImage(
          image,
          (width - scaledWidth) * (positions[0] || 0) * gridWidth / width,
          (height - scaledHeight) * (positions[1] || 0) * gridHeight / height,
          scaledWidth * gridWidth / width,
          scaledHeight * gridHeight / height
        );

        var cellX = Math.floor((pointer.clientX - rect.left) / rect.width * gridWidth);
        var cellY = Math.floor((pointer.clientY - rect.top) / rect.height * gridHeight);
        var radius = 3 + Math.floor(2 * Math.random());
        for (var y = Math.max(0, cellY - radius); y <= Math.min(gridHeight - 1, cellY + radius); y++) {
          for (var x = Math.max(0, cellX - radius); x <= Math.min(gridWidth - 1, cellX + radius); x++) {
            var distance = Math.max(Math.abs(x - cellX), Math.abs(y - cellY));
            var probability = 0.9 * (1 - (distance - 2) / (radius - 2));
            if (distance <= 2 || (distance < radius && Math.random() < probability)) {
              context.drawImage(sourceCanvas, x, y, 1, 1, x, y, 1, 1);
            }
          }
        }
      });
    }

    function onPointerMove(event) {
      if (event.pointerType === 'touch') return;
      if (Math.hypot(event.clientX - previousX, event.clientY - previousY) < 6) return;
      previousX = event.clientX;
      previousY = event.clientY;
      pointer = event;
      if (!frame) frame = window.requestAnimationFrame(renderPixelHover);
    }

    function clearPixelHover() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      previousX = -1;
      previousY = -1;
      hideOverlays();
    }

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', clearPixelHover);
    document.addEventListener('scroll', clearPixelHover, true);
    window.addEventListener('blur', clearPixelHover);
    window.addEventListener('resize', clearPixelHover);
  }

  function init() {
    document.querySelectorAll('.hw-cap-disciplines:not([data-reveal-ready])').forEach(function (section) {
      section.dataset.revealReady = 'true';
      var intro = section.querySelector('[data-reveal]');
      var mediaItems = Array.prototype.slice.call(section.querySelectorAll('[data-image-reveal]'));
      if (!intro && !mediaItems.length) return;
      initPixelHover(section);

      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
      if (section.dataset.animate !== 'true' || reduced || !('IntersectionObserver' in window)) {
        if (intro) intro.classList.add('is-visible');
        mediaItems.forEach(function (media) { media.classList.add('is-visible'); });
        return;
      }

      section.classList.add('hw-cap-disciplines--motion-ready');

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      if (intro) observer.observe(intro);
      mediaItems.forEach(function (media) { observer.observe(media); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
