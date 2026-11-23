(() => {
  'use strict';
  if (window.hwCommunicationsContactMotion) { window.hwCommunicationsContactMotion.refresh(); return; }
  function initPixelHover(section) {
    if (section.dataset.pixelHoverReady === 'true') return;
    section.dataset.pixelHoverReady = 'true';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var motionOff = function () { return reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false'; };
    var mediaRoot = section.querySelector('.hw-communications-contact__team-image');
    if (!mediaRoot) return;


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
      if (!pointer || !sourceContext || motionOff()) return;

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
          overlay.className = 'hw-communications-contact__pixel-canvas';
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
      if (event.pointerType === 'touch' || motionOff()) { clearPixelHover(); return; }
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

    mediaRoot.addEventListener('pointermove', onPointerMove, { passive: true });
    mediaRoot.addEventListener('pointerleave', clearPixelHover);
    document.addEventListener('scroll', clearPixelHover, true);
    window.addEventListener('blur', clearPixelHover);
    window.addEventListener('resize', clearPixelHover);
    reduced.addEventListener('change', clearPixelHover);
    return function () {
      clearPixelHover();
      mediaRoot.removeEventListener('pointermove', onPointerMove);
      mediaRoot.removeEventListener('pointerleave', clearPixelHover);
      document.removeEventListener('scroll', clearPixelHover, true);
      window.removeEventListener('blur', clearPixelHover);
      window.removeEventListener('resize', clearPixelHover);
      reduced.removeEventListener('change', clearPixelHover);
      overlays.forEach(function (canvas) { canvas.remove(); });
      delete section.dataset.pixelHoverReady;
    };
  }

  const sections = new Set();
  const pixelCleanups = new Map();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.dataset.coverVisible = String(entry.isIntersecting); });
  }, { root:document.getElementById('presentation-scroll'), rootMargin:'0px 0px -12% 0px', threshold:0 }) : null;
  const refresh = () => {
    sections.forEach(section => { if (!section.isConnected) { if (observer) observer.unobserve(section); pixelCleanups.get(section)?.(); pixelCleanups.delete(section); sections.delete(section); } });
    document.querySelectorAll('.hw-communications-contact').forEach(section => {
      if (sections.has(section)) return;
      sections.add(section);
      section.dataset.animate = (section.dataset.animate || 'true').toLowerCase();
      pixelCleanups.set(section, initPixelHover(section));
      if (observer) { section.dataset.coverReady = 'true'; observer.observe(section); }
    });
  };
  window.hwCommunicationsContactMotion = { refresh };
  const init = () => { refresh(); new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
