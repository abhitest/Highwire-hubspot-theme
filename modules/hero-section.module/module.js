/* A cursor-sized mosaic, sampled with the same cover crop as the hero image. */
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

  const init = () => document.querySelectorAll('[data-hero-module]').forEach(hero => {
    if (hero.dataset.heroInitialized) return;
    hero.dataset.heroInitialized = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    const motionOff = () => mobile.matches || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    const finish = () => {
      clearTimeout(hero.heroBootTimeout);
      hero.dataset.heroMotion = 'done';
      hero.dispatchEvent(new Event('hero:ready'));
    };
    const video = hero.querySelector('.hero__video');
    if (video) {
      const connection = navigator.connection;
      let visible = false, pageLoaded = document.readyState === 'complete';
      let idleReady = false, scheduled = false, failed = false, playPending = false;
      const allowed = () => !failed && !reduced.matches &&
        document.documentElement.dataset.motion !== 'reduced' &&
        !(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)));
      const syncVideo = () => {
        if (!allowed() || !visible || document.hidden) {
          video.pause();
          video.classList.remove('is-playing');
          return;
        }
        // Do not compete with the poster, fonts or opening animation.
        if (!pageLoaded || hero.dataset.heroMotion !== 'done') return;
        if (!idleReady) {
          if (!scheduled) {
            scheduled = true;
            const ready = () => { idleReady = true; syncVideo(); };
            if ('requestIdleCallback' in window) requestIdleCallback(ready, { timeout: 2000 });
            else setTimeout(ready, 200);
          }
          return;
        }
        if (!video.hasAttribute('src')) {
          video.muted = true;
          video.src = video.dataset.src;
        }
        if (video.paused && !playPending) {
          playPending = true;
          Promise.resolve(video.play()).catch(error => {
            // Pausing during a pending play is normal when scrolling away.
            if (error.name !== 'AbortError') failed = true;
            video.classList.remove('is-playing');
          }).finally(() => {
            playPending = false;
            if (!failed && visible && !document.hidden && video.paused) syncVideo();
          });
        }
      };
      video.addEventListener('playing', () => {
        if (allowed() && visible && !document.hidden) video.classList.add('is-playing');
        else syncVideo();
      });
      video.addEventListener('error', () => {
        failed = true;
        video.classList.remove('is-playing');
      });
      if (!pageLoaded) window.addEventListener('load', () => {
        pageLoaded = true;
        syncVideo();
      }, { once: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
          syncVideo();
        }).observe(hero);
      } else {
        visible = true;
      }
      hero.addEventListener('hero:ready', syncVideo);
      document.addEventListener('visibilitychange', syncVideo);
      reduced.addEventListener('change', syncVideo);
      if (connection && connection.addEventListener) connection.addEventListener('change', syncVideo);
      new MutationObserver(syncVideo).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-motion']
      });
      syncVideo();
    }
    // Animation is owned by this module, independent of the theme runtime.
    if (!motionOff() && hero.dataset.heroMotion === 'preparing') {
      const start = async () => {
        const photo = hero.querySelector('.hero__camera img');
        // Resolve the poster and font metrics before moving the composition.
        // A late font swap otherwise shifts the text/CTA halfway through entry.
        await Promise.allSettled([
          photo && photo.decode ? photo.decode() : Promise.resolve(),
          document.fonts ? document.fonts.ready : Promise.resolve()
        ]);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (motionOff() || hero.dataset.heroMotion === 'done') return finish();
          clearTimeout(hero.heroBootTimeout);
          hero.dataset.heroMotion = 'running';
          // Release fill styles only once the rendered animations actually end,
          // including when the tab is throttled or the main thread is busy.
          Promise.allSettled(hero.getAnimations({ subtree: true }).map(animation => animation.finished))
            .then(finish);
        }));
      };
      // Only the hero image gates its entrance; analytics and other page assets
      // must not leave the opening frame waiting for the window load event.
      start();
    } else finish();
    reduced.addEventListener('change', () => { if (motionOff()) finish(); });
    mobile.addEventListener('change', () => { if (motionOff()) finish(); });
    const cta = hero.querySelector('.hero__cta');
    if (cta) cta.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const href = cta.getAttribute('href');
      if (!href || !href.startsWith('#') || href.length < 2) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (_) { return; }
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const work = target.matches('[data-work-module]') ? target : target.querySelector('[data-work-module]');
      const destination = work || target;
      let scroller = window;
      for (let parent = destination.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
      }
      const header = work ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 0;
      const viewportTop = scroller === window ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop;
      const scrollTop = scroller === window ? window.scrollY : scroller.scrollTop;
      scroller.scrollTo({ top: destination.getBoundingClientRect().top - viewportTop + scrollTop - header, behavior: motionOff() ? 'auto' : 'smooth' });
    }, true);
    const camera = hero.querySelector('.hero__camera');
    const image = camera && camera.querySelector('img');
    const canvas = camera && camera.querySelector('.hero__pixels');
    if (!image || !canvas || canvas.dataset.initialized) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.dataset.initialized = 'true';



    let pointer = null;
    let frame = 0;
    let lastVideoDraw = 0;

    const hide = () => {
      pointer = null;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.classList.remove('is-active');
    };

    const draw = (timestamp = 0) => {
      frame = 0;
      if (video && !document.hidden && !video.paused && pointer && timestamp - lastVideoDraw < 50) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastVideoDraw = timestamp;
      const media = video && video.classList.contains('is-playing') && video.readyState >= 2 ? video : image;
      const mediaWidth = media === video ? video.videoWidth : image.naturalWidth;
      const mediaHeight = media === video ? video.videoHeight : image.naturalHeight;
      if (!pointer || !mediaWidth || !mediaHeight) return;
      const rect = media.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      if (!rect.width || !rect.height || x < 0 || y < 0 || x > rect.width || y > rect.height) {
        hide();
        return;
      }

      // Use image layout coordinates, exactly as the reference does before scaling.
      const width = media.offsetWidth, height = media.offsetHeight;
      if (!width || !height) return;
      const cols = Math.max(1, Math.ceil(width / 26));
      const rows = Math.max(1, Math.ceil(height / 26));
      canvas.width = cols;
      canvas.height = rows;
      const style = getComputedStyle(media);
      canvas.style.filter = style.filter;
      const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(width / mediaWidth, height / mediaHeight);
      const [positionX, positionY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const drawnWidth = mediaWidth * scale, drawnHeight = mediaHeight * scale;
      // Default canvas sampling preserves the reference's block colors.
      context.drawImage(media,
        (width - drawnWidth) * (positionX || 0) * cols / width,
        (height - drawnHeight) * (positionY || 0) * rows / height,
        drawnWidth * cols / width, drawnHeight * rows / height);
      maskPixels(context, canvas, x, y, rect.width, rect.height);
      canvas.classList.add('is-active');
      if (media === video && !video.paused && !document.hidden) frame = requestAnimationFrame(draw);
    };

    hero.addEventListener('pointermove', event => {
      if (innerWidth <= 767 || event.pointerType !== 'mouse' || reduced.matches || document.documentElement.dataset.motion === 'reduced') {
        hide();
        return;
      }
      // The stage's transparent top padding sits above the photo in the hit-test stack.
      const bounds = hero.querySelector('.hero__frame').getBoundingClientRect();
      const copy = hero.querySelector('.hero__copy');
      const bottom = copy ? Math.min(bounds.bottom, copy.getBoundingClientRect().top) : bounds.bottom;
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY >= bottom) { hide(); return; }
      if (pointer && Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(draw);
    });
    hero.addEventListener('pointerleave', hide);
    hero.addEventListener('pointercancel', hide);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide, { passive: true });
    window.addEventListener('blur', hide);
    reduced.addEventListener('change', hide);
    new MutationObserver(() => {
      hide();
      if (motionOff()) finish();
    }).observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
