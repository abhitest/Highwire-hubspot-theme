/* Acro owns its state; it does not depend on the legacy #acro theme runtime. */
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
  const init = () => document.querySelectorAll('[data-acro-module]').forEach(section => {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    const stage = section.querySelector('.hw-acro__stage');
    const scene = section.querySelector('.hw-acro__scene');
    const header = document.querySelector('[data-hw-header]');
    const headerLogo = header && header.querySelector('.hw-header__logo');
    let fittedWidth = 0, fittedHeight = 0;
    const intro = section.querySelector('.hw-acro__intro');
    const products = section.querySelector('.hw-acro__products');
    const cards = [...products.querySelectorAll('.hw-acro__product')];
    const triggers = cards.map(card => card.querySelector('.hw-acro__trigger'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    let mode = '', system = false, active = null, frame = 0;
    let scroller = window;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
    }
    const select = index => {
      active = index;
      if (index === null) delete section.dataset.active;
      else section.dataset.active = String(index);
      products.dataset.expanded = String(index !== null);
      cards.forEach((card, i) => {
        const expanded = mobile.matches || i === index;
        card.dataset.active = String(expanded);
        triggers[i].disabled = mobile.matches;
        triggers[i].setAttribute('aria-expanded', String(expanded));
        const detail = card.querySelector('.hw-acro__detail');
        detail.hidden = mode === 'static' && !expanded;
        detail.inert = !expanded;
        detail.setAttribute('aria-hidden', String(!expanded));
      });
    };
    const showSystem = value => {
      system = value;
      section.dataset.system = String(value);
      products.inert = mode === 'pinned' && !value;
      products.setAttribute('aria-hidden', String(mode === 'pinned' && !value));
      intro.setAttribute('aria-hidden', String(mode === 'pinned' && value));
      if (!value && products.contains(document.activeElement)) document.activeElement.blur();
      select(mode === 'static' ? 0 : null);
    };
    const update = () => {
      frame = 0;
      if (!section.isConnected) return;
      const next = !mobile.matches && section.clientWidth >= 768 && !reduced.matches && document.documentElement.dataset.motion !== 'reduced' ? 'pinned' : 'static';
      if (next !== mode) {
        mode = next;
        section.dataset.mode = mode;
        showSystem(mode === 'static');
      }
      if (mode !== 'pinned') {
        scene.removeAttribute('style');
        section.style.removeProperty('--acro-height');
        section.style.removeProperty('--acro-top');
        section.style.removeProperty('--acro-viewport');
        fittedWidth = fittedHeight = 0;
        return;
      }
      // Reserve space only while the header is visible.
      const headerHeight = headerLogo && header.dataset.hidden !== 'true' ? headerLogo.getBoundingClientRect().height : 0;
      section.style.setProperty('--acro-top', headerHeight + 'px');
      const fullViewport = scroller === window ? innerHeight : scroller.clientHeight;
      section.style.setProperty('--acro-viewport', fullViewport + 'px');
      const viewport = Math.max(1, fullViewport - headerHeight);
      if (fittedWidth !== section.clientWidth || fittedHeight !== viewport) {
        fittedWidth = section.clientWidth; fittedHeight = viewport;
        const width = Math.max(1440, section.clientWidth);
        const height = 850;
        const scale = Math.min(section.clientWidth / width, viewport / height);
        // Fill the viewport with a scaled scene without cropping either dimension.
        scene.style.width = section.clientWidth / scale + 'px';
        scene.style.height = viewport / scale + 'px';
        scene.style.transform = 'scale(' + scale + ')';
        section.style.setProperty('--acro-height', viewport + 'px');
      }
      const rect = section.getBoundingClientRect();
      const top = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const viewportHeight = scroller === window ? innerHeight : scroller.clientHeight;
      if (rect.top - top < viewportHeight * .75) section.dataset.entered = 'true';
      const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const progress = Math.min(1, Math.max(0, (top + (parseFloat(getComputedStyle(stage).top) || 0) - rect.top) / distance));
      // Hysteresis matches the demo and prevents jitter around the boundary.
      if (!system && progress >= .24) showSystem(true);
      else if (system && progress <= .10) showSystem(false);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    section.dataset.entered = 'false';
    cards.forEach((card, i) => {
      card.addEventListener('pointerenter', event => {
        if (mobile.matches) return;
        if ((mode === 'static' || system) && event.pointerType === 'mouse') select(i);
      });
      card.addEventListener('click', event => {
        if (mobile.matches) return;
        // Keep the CTA's navigation independent of the accordion trigger.
        if (event.target.closest('a')) return;
        if (mode !== 'static' && !system) return;
        select(i);
        triggers[i].focus({ preventScroll: true });
      });
      triggers[i].addEventListener('focus', () => select(i));
      triggers[i].addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowDown') next = (i + 1) % cards.length;
        if (event.key === 'ArrowUp') next = (i + cards.length - 1) % cards.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = cards.length - 1;
        if (next !== undefined) { event.preventDefault(); triggers[next].focus(); }
      });
    });
    products.addEventListener('pointerleave', () => {
      if (mode === 'pinned' && !products.contains(document.activeElement)) select(null);
    });
    products.addEventListener('focusout', event => {
      if (mode === 'pinned' && !products.contains(event.relatedTarget)) select(null);
    });
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reduced.addEventListener('change', schedule);
    mobile.addEventListener('change', () => { select(active); schedule(); });
    new ResizeObserver(schedule).observe(section);
    if (headerLogo) new ResizeObserver(schedule).observe(headerLogo);
    if (header) new MutationObserver(schedule).observe(header, { attributes: true, attributeFilter: ['data-hidden'] });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    update();

    // Keep the pixel grid in the same coordinate system as the animated image.
    const media = section.querySelector('.hw-acro__media');
    const image = media.querySelector('img');
    const canvas = media.querySelector('canvas');
    image.after(canvas);
    const context = canvas.getContext('2d');
    let pixelFrame = 0, pointer = null;
    const hidePixels = () => {
      cancelAnimationFrame(pixelFrame);
      pixelFrame = 0;
      pointer = null;
      canvas.dataset.visible = 'false';
    };
    stage.addEventListener('pointermove', event => {
      if (!context || reduced.matches || document.documentElement.dataset.motion === 'reduced' || event.pointerType !== 'mouse') { hidePixels(); return; }
      const x = event.clientX, y = event.clientY;
      const box = media.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) { hidePixels(); return; }
      if (pointer && Math.hypot(x-pointer.x,y-pointer.y)<6) return;
      pointer = {x,y};
      cancelAnimationFrame(pixelFrame);
      pixelFrame = requestAnimationFrame(() => {
        pixelFrame = 0;
        if (!image.complete || !image.naturalWidth) return;
        const rect = image.getBoundingClientRect();
        const width = image.offsetWidth, height = image.offsetHeight;
        if (!width || !height || !rect.width || !rect.height) return;
        const size = pixelSize(media.clientWidth);
        canvas.width = Math.max(1, Math.ceil(width / size));
        canvas.height = Math.max(1, Math.ceil(height / size));
        const style = getComputedStyle(image);
        canvas.style.filter = style.filter;
        const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(width / image.naturalWidth, height / image.naturalHeight);
        const [positionX, positionY] = style.objectPosition.split(' ').map(value => parseFloat(value)/100);
        const drawnWidth = image.naturalWidth*scale, drawnHeight = image.naturalHeight*scale;
        context.drawImage(image,
          (width-drawnWidth)*(positionX || 0)*canvas.width/width,
          (height-drawnHeight)*(positionY || 0)*canvas.height/height,
          drawnWidth*canvas.width/width, drawnHeight*canvas.height/height);
        maskPixels(context, canvas, (x-rect.left)*width/rect.width, (y-rect.top)*height/rect.height, width, height);
        canvas.dataset.visible = 'true';
      });
    });
    stage.addEventListener('pointercancel', hidePixels);
    image.parentElement.addEventListener('transitionstart', hidePixels);
    new MutationObserver(hidePixels).observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    stage.addEventListener('pointerleave', hidePixels);
    scroller.addEventListener('scroll', hidePixels, { passive: true });
    window.addEventListener('resize', hidePixels, { passive: true });
    window.addEventListener('blur', hidePixels);
    reduced.addEventListener('change', hidePixels);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
