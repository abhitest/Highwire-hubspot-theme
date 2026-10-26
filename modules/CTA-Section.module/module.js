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

  const init = () => document.querySelectorAll('[data-closing]').forEach(section => {
    if (section.dataset.ready) return;
    section.dataset.ready = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    let visible = false, timer;
    const schedule = () => {
      clearTimeout(timer);
      if (!visible || document.hidden || reduced.matches || !['true', '1'].includes((section.dataset.animate || '').toLowerCase())) return;
      timer = setTimeout(() => {
        section.dataset.mask = section.dataset.mask === '1' ? '0' : '1';
        schedule();
      }, (4000 + 4000 * Math.random()) / 3);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2;
        if (visible) section.dataset.visible = 'true';
        schedule();
      }, { threshold: [0, .2] }).observe(section);
    } else { visible = true; section.dataset.visible = 'true'; schedule(); }
    const media = section.querySelector('.hw-closing__media');
    const layers = [...media.querySelectorAll('.hw-closing__mask')].map(mask => {
      const canvas = document.createElement('canvas');
      canvas.className = 'hw-closing__pixels';
      canvas.setAttribute('aria-hidden', 'true');
      mask.appendChild(canvas);
      return { mask, canvas, image: mask.querySelector('img') };
    });
    let frame = 0, pointer;
    const hide = () => {
      cancelAnimationFrame(frame); frame = 0; pointer = null;
      layers.forEach(({canvas}) => canvas.style.visibility = 'hidden');
    };
    const draw = () => {
      frame = 0;
      if (!pointer || mobile.matches || reduced.matches) return;
      layers.forEach(({canvas, image}) => {
        if (!image.complete || !image.naturalWidth) return;
        const rect = image.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (pointer.x - rect.left) / rect.width * image.offsetWidth;
        const y = (pointer.y - rect.top) / rect.height * image.offsetHeight;
        canvas.width = Math.ceil(image.offsetWidth / pixelSize(media.clientWidth));
        canvas.height = Math.ceil(image.offsetHeight / pixelSize(media.clientWidth));
        const context = canvas.getContext('2d');
        if (!context) return;
        const scale = Math.max(image.offsetWidth / image.naturalWidth, image.offsetHeight / image.naturalHeight);
        const sw = image.offsetWidth / scale, sh = image.offsetHeight / scale;
        context.drawImage(image, (image.naturalWidth-sw)/2, (image.naturalHeight-sh)/2, sw, sh, 0, 0, canvas.width, canvas.height);
        maskPixels(context, canvas, x, y, image.offsetWidth, image.offsetHeight);
        canvas.style.visibility = 'visible';
      });
    };
    media.addEventListener('pointermove', event => {
      if (mobile.matches || event.pointerType !== 'mouse' || reduced.matches) return;
      pointer = {x:event.clientX, y:event.clientY};
      if (!frame) frame = requestAnimationFrame(draw);
    });
    media.addEventListener('pointerleave', hide);
    media.addEventListener('pointercancel', hide);
    window.addEventListener('resize', hide, {passive:true});
    window.addEventListener('scroll', hide, {passive:true});
    reduced.addEventListener('change', hide);
    document.addEventListener('visibilitychange', hide);
    section.addEventListener('focusin', () => { section.dataset.visible = 'true'; });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    mobile.addEventListener('change', () => { hide(); schedule(); });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
