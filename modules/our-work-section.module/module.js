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
  const init = () => document.querySelectorAll('[data-work-module]').forEach(section => {
    if (section.dataset.ready) return;
    const cases = [...section.querySelectorAll('.hw-work__case')];
    const panels = [...section.querySelectorAll('.hw-work__panel')];
    if (!cases.length) return;
    const stage = section.querySelector('.hw-work__stage');
    const scene = section.querySelector('.hw-work__layout');
    const intro = section.querySelector('.hw-work__intro');
    const media = section.querySelector('.hw-work__media');
    const status = section.querySelector('.hw-work__status');
    const mediaHome = document.createComment('Work media desktop position');
    media.before(mediaHome);
    const mobileViewport = matchMedia('(max-width: 767px)');
    const placeMedia = () => mediaHome.after(media);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scroller = window, active = -1, frame = 0, mode = '', layoutNeeded = true;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) { scroller = parent; break; }
    }
    const select = index => {
      if (index === active) return;
      delete media.dataset.pointer;
      active = index;
      placeMedia(index);
      section.dataset.active = String(index);
      section.style.setProperty('--work-offset', -cases[index].offsetTop + 'px');
      cases.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      panels.forEach((panel, i) => {
        panel.dataset.active = String(i === index);
        panel.inert = !mobileViewport.matches && i !== index;
        panel.setAttribute('aria-hidden', String(!mobileViewport.matches && i !== index));
        panel.setAttribute('aria-labelledby', mobileViewport.matches
          ? panel.querySelector('.hw-work__mobile-copy h3').id : cases[i].id);
      });
      intro.inert = mode === 'pinned' && index !== 0;
      intro.setAttribute('aria-hidden', String(mode === 'pinned' && index !== 0));
      status.textContent = mobileViewport.matches ? '' : cases[index].querySelector('.hw-work__case-title').textContent;
    };
    const topOfViewport = () => scroller === window ? 0 : scroller.getBoundingClientRect().top;
    const update = () => {
      frame = 0;
      if (!section.isConnected) return;
      if (layoutNeeded) {
        layoutNeeded = false;
        const motionOff = reduced.matches || document.documentElement.dataset.motion === 'reduced';
        section.dataset.reduced = String(motionOff);
        mode = !mobileViewport.matches && section.clientWidth >= 768 && !motionOff && cases.length > 1 && !intro.querySelector('.moduleCTA') ? 'pinned' : 'static';
        section.dataset.mode = mode;
        // Restore the media before measuring the desktop case track.
        if (section.clientWidth >= 768) mediaHome.after(media);
        // Grow the row to accommodate longer editor copy without truncation.
        section.style.setProperty('--work-row','240px');
        scene.style.removeProperty('width');
        scene.style.removeProperty('height');
        scene.style.removeProperty('transform');
        scene.style.removeProperty('top');
        scene.style.removeProperty('transform-origin');
        section.style.removeProperty('--work-height');
        section.style.removeProperty('--work-top');
        if (mode === 'pinned') {
          const viewportHeight = scroller === window ? innerHeight : scroller.clientHeight;
          const header = document.querySelector('.hw-header');
          const headerHeight = section.clientWidth <= 1024 && header ? header.querySelector('.hw-header__bar')?.getBoundingClientRect().height || 0 : 0;
          const viewport = Math.max(1, viewportHeight - headerHeight);
          section.style.setProperty('--work-top', headerHeight + 'px');
          const tablet = section.clientWidth <= 1024;
          const width = Math.max(1342, Math.min(section.clientWidth, 1440));
          scene.style.width = width + 'px';
          const row = Math.max(240, ...cases.map(button => button.querySelector('.hw-work__case-content').offsetHeight + 40));
          section.style.setProperty('--work-row', row + 'px');
          const baseHeight = section.clientWidth <= 1300 ? 700 : 850;
          const height = Math.max(baseHeight, row / .42, (intro.offsetHeight + row / 2 + 32) / .4106);
          const scale = Math.min(section.clientWidth / width, viewport / height, 1);
          // Use one coordinate system for the title, case track and media.
          const sceneHeight = height;
          scene.style.height = sceneHeight + 'px';
          scene.style.top = '0';
          scene.style.transformOrigin = 'top center';
          scene.style.transform = 'translateX(-50%) scale(' + scale + ')';
          // Match the sticky stage to the scaled scene, so smaller screens do not retain empty viewport space.
          section.style.setProperty('--work-height', Math.ceil(sceneHeight * scale) + 'px');
        }
        section.style.height = mode === 'pinned' ? `calc(var(--work-height) + ${(cases.length - 1) * Math.min(850, stage.offsetHeight)}px)` : '';
        const previous = Math.max(0, active); active = -1; select(previous);
      }
      if (mode !== 'pinned') return;
      const distance = Math.max(1,section.offsetHeight - stage.offsetHeight);
      const progress = Math.min(1,Math.max(0,(topOfViewport()+(parseFloat(getComputedStyle(stage).top)||0)-section.getBoundingClientRect().top)/distance));
      const position = progress * (cases.length - 1);
      let next = active;
      while (next < cases.length - 1 && position >= next + .65) next++;
      while (next > 0 && position <= next - .65) next--;
      select(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const layout = () => { layoutNeeded = true; schedule(); };
    const activate = index => {
      if (mobileViewport.matches) return;
      if (mode === 'pinned') {
        const scroll = scroller === window ? window.scrollY : scroller.scrollTop;
        const top = section.getBoundingClientRect().top - topOfViewport() + scroll;
        const distance = Math.max(1,section.offsetHeight-stage.offsetHeight);
        scroller.scrollTo({top:top - (parseFloat(getComputedStyle(stage).top)||0) + distance * index / (cases.length - 1),behavior:'instant'});
      }
      select(index);
    };
    cases.forEach((button,i) => {
      button.addEventListener('click',()=>activate(i));
      button.addEventListener('keydown',event=>{
        if (mobileViewport.matches) return;
        let next;
        if(event.key==='ArrowDown'||event.key==='ArrowRight') next=(i+1)%cases.length;
        if(event.key==='ArrowUp'||event.key==='ArrowLeft') next=(i+cases.length-1)%cases.length;
        if(event.key==='Home') next=0;
        if(event.key==='End') next=cases.length-1;
        if(next!==undefined){event.preventDefault();activate(next);cases[next].focus({preventScroll:true});}
      });
    });
    let pixelFrame = 0, lastPixelPointer = null;
    media.addEventListener('pointermove',event=>{
      if(mobileViewport.matches||event.pointerType!=='mouse'||reduced.matches||document.documentElement.dataset.motion==='reduced') { hideCursor(); return; }
      const rect=media.getBoundingClientRect();
      media.style.setProperty('--cursor-x',(event.clientX-rect.left)*media.clientWidth/rect.width+'px');
      media.style.setProperty('--cursor-y',(event.clientY-rect.top)*media.clientHeight/rect.height+'px');
      if (media.dataset.pointer && lastPixelPointer && Math.hypot(event.clientX-lastPixelPointer.x,event.clientY-lastPixelPointer.y)<6) return;
      lastPixelPointer = {x:event.clientX,y:event.clientY};
      cancelAnimationFrame(pixelFrame);
      pixelFrame = requestAnimationFrame(() => {
        pixelFrame = 0;
        const panel = panels[active];
        const image = panel.querySelector('.hw-work__image');
        const canvas = panel.querySelector('.hw-work__pixels');
        if (!canvas || !image.complete || !image.naturalWidth) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        // Sample the image's layout grid, then map the pointer through its actual transform.
        const width = image.offsetWidth, height = image.offsetHeight;
        const imageRect = image.getBoundingClientRect();
        if (!width || !height || !imageRect.width || !imageRect.height) return;
        canvas.width = Math.max(1, Math.ceil(width / pixelSize(width)));
        canvas.height = Math.max(1, Math.ceil(height / pixelSize(width)));
        const style = getComputedStyle(image);
        canvas.style.filter = style.filter;
        const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(width / image.naturalWidth, height / image.naturalHeight);
        const [positionX, positionY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
        const drawnWidth = image.naturalWidth * scale, drawnHeight = image.naturalHeight * scale;
        context.drawImage(image,
          (width-drawnWidth)*(positionX || 0)*canvas.width/width,
          (height-drawnHeight)*(positionY || 0)*canvas.height/height,
          drawnWidth*canvas.width/width, drawnHeight*canvas.height/height);
        maskPixels(context, canvas,
          (event.clientX-imageRect.left)*width/imageRect.width,
          (event.clientY-imageRect.top)*height/imageRect.height, width, height);
        media.dataset.pointer='true';
      });
    });
    const hideCursor=()=>{cancelAnimationFrame(pixelFrame);pixelFrame=0;lastPixelPointer=null;delete media.dataset.pointer;};
    media.addEventListener('pointerleave',hideCursor);
    media.addEventListener('pointercancel',hideCursor);
    window.addEventListener('blur',hideCursor);
    scroller.addEventListener('scroll',()=>{hideCursor();schedule();},{passive:true});
    window.addEventListener('resize',()=>{hideCursor();layout();},{passive:true});
    reduced.addEventListener('change',()=>{hideCursor();layout();});
    let width=section.clientWidth;
    new ResizeObserver(()=>{if(section.clientWidth!==width){width=section.clientWidth;layout();}}).observe(section);
    new MutationObserver(()=>{hideCursor();layout();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
    section.dataset.ready='true';
    section.dataset.entered='false';
    const reveal = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        section.dataset.entered='true';
        reveal.disconnect();
      }
    }, { root: scroller === window ? null : scroller, rootMargin: '0px 0px -18% 0px', threshold: .08 });
    reveal.observe(stage);
    update();
    if(document.fonts) document.fonts.ready.then(layout);
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
