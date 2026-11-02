/* Shared pointer mosaic for featured and rich-text blog images. */
(function () {
  if (window.hwBlogImagePixelsReady) return;
  window.hwBlogImagePixelsReady = true;
  var selector = '.hw-blog-banner__image img, .hw-article__body img';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var canvas, buffer, photo, pointer, frame = 0;

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    photo = pointer = null;
    if (canvas) canvas.hidden = true;
  }

  function draw() {
    frame = 0;
    if (!photo || !photo.complete || !photo.naturalWidth) return;
    if (reduced.matches || document.documentElement.dataset.motion === 'reduced') { hide(); return; }
    var rect = photo.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      // A viewport overlay preserves rich-text spacing, links, and picture elements.
      canvas.style.cssText = 'position:fixed;pointer-events:none;image-rendering:pixelated;z-index:10;';
      document.body.appendChild(canvas);
      buffer = document.createElement('canvas');
    }
    var columns = Math.max(1, Math.ceil(rect.width / 26));
    var rows = Math.max(1, Math.ceil(rect.height / 26));
    canvas.width = buffer.width = columns;
    canvas.height = buffer.height = rows;
    var source = buffer.getContext('2d'), context = canvas.getContext('2d');
    if (!source || !context) return;
    var style = getComputedStyle(photo);
    var width = rect.width, height = rect.height;
    if (style.objectFit === 'cover' || style.objectFit === 'contain') {
      var scale = Math[style.objectFit === 'cover' ? 'max' : 'min'](width / photo.naturalWidth, height / photo.naturalHeight);
      width = photo.naturalWidth * scale;
      height = photo.naturalHeight * scale;
    }
    var position = style.objectPosition.split(' ');
    function offset(value, space) {
      return value && value.endsWith('%') ? space * parseFloat(value) / 100 : parseFloat(value) || 0;
    }
    source.drawImage(photo, offset(position[0], rect.width - width) * columns / rect.width,
      offset(position[1], rect.height - height) * rows / rect.height,
      width * columns / rect.width, height * rows / rect.height);
    var centerX = Math.floor((pointer.x - rect.left) / rect.width * columns);
    var centerY = Math.floor((pointer.y - rect.top) / rect.height * rows);
    var radius = 3 + Math.floor(Math.random() * 2);
    for (var y = Math.max(0, centerY - radius); y <= Math.min(rows - 1, centerY + radius); y++) {
      for (var x = Math.max(0, centerX - radius); x <= Math.min(columns - 1, centerX + radius); x++) {
        var distance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
        if (distance <= 2 || (distance < radius && Math.random() < .9 * (1 - (distance - 2) / (radius - 2)))) {
          context.drawImage(buffer, x, y, 1, 1, x, y, 1, 1);
        }
      }
    }
    canvas.style.left = rect.left + 'px';
    canvas.style.top = rect.top + 'px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.style.borderRadius = style.borderRadius;
    canvas.hidden = false;
  }

  // Delegation also covers images inserted later by the blog editor.
  document.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse' || reduced.matches || document.documentElement.dataset.motion === 'reduced' || !event.target.matches(selector)) { hide(); return; }
    photo = event.target;
    pointer = {x: event.clientX, y: event.clientY};
    if (!frame) frame = requestAnimationFrame(draw);
  });
  document.addEventListener('pointerout', function (event) { if (event.target === photo) hide(); });
  document.addEventListener('pointercancel', hide);
  window.addEventListener('scroll', hide, {passive: true, capture: true});
  window.addEventListener('resize', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', hide);
  reduced.addEventListener('change', hide);
  new MutationObserver(hide).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
})();
