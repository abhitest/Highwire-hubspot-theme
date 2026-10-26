(() => {
'use strict';
const init = () => document.querySelectorAll('.hw-b2b-work').forEach(section => {
 if(section.dataset.initialized) return; section.dataset.initialized='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mobile=matchMedia('(max-width:767px)');
 const motionOff=()=>reduced.matches||mobile.matches||document.documentElement.dataset.motion==='reduced';
 // Content stays visible until the observer actually starts a finite animation.
 if(!motionOff() && 'IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  observer.unobserve(entry.target);
  if(motionOff() || typeof entry.target.animate!=='function')return;
  const visual=entry.target.querySelector('.hw-b2b-work__visual');
  const copy=entry.target.querySelector('.hw-b2b-work__copy') || entry.target.querySelector('h2');
  if(visual)visual.animate([{clipPath:'inset(0 0 100%)'},{clipPath:'inset(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
  if(copy)copy.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
 }),{threshold:0});
 section.querySelectorAll('.hw-b2b-work__header,.hw-b2b-work__case').forEach(el=>observer.observe(el));
 }
 section.querySelectorAll('.hw-b2b-work__visual').forEach(media=>{
 const photo=media.querySelector('img');if(!photo)return;
 if(media.tagName==='A'){
  const hide=()=>{delete media.dataset.cursor;};
  media.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||motionOff())return hide();const r=media.getBoundingClientRect();media.style.setProperty('--cursor-x',(event.clientX-r.left)+'px');media.style.setProperty('--cursor-y',(event.clientY-r.top)+'px');media.dataset.cursor='true';},{passive:true});
  ['pointerleave','pointercancel'].forEach(type=>media.addEventListener(type,hide));
  document.addEventListener('scroll',hide,{passive:true,capture:true}); window.addEventListener('blur',hide);reduced.addEventListener('change',hide);mobile.addEventListener('change',hide);
 }
    const canvas = document.createElement('canvas');
    canvas.className = 'hw-b2b-work__pixels';
    canvas.setAttribute('aria-hidden', 'true');
    media.appendChild(canvas);
    const sample = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const sampleContext = sample.getContext('2d');
    if (!context || !sampleContext) { canvas.remove(); return; }
    let frame = 0;
    let pointer = null;
    let lastX = -Infinity;
    let lastY = -Infinity;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      lastX = lastY = -Infinity;
      canvas.style.visibility = 'hidden';
    };
    const draw = () => {
      frame = 0;
      if (!pointer || motionOff() || !photo.complete || !photo.naturalWidth) return clear();
      const rect = photo.getBoundingClientRect();
      if (!rect.width || !rect.height) return clear();
      const width = photo.offsetWidth;
      const height = photo.offsetHeight;
      const cols = Math.max(1, Math.ceil(width / 26));
      const rows = Math.max(1, Math.ceil(height / 26));
      canvas.width = sample.width = cols;
      canvas.height = sample.height = rows;
      const style = getComputedStyle(photo);
      canvas.style.transform = style.transform;
      canvas.style.transformOrigin = style.transformOrigin;
      const scale = style.objectFit === 'contain'
        ? Math.min(width / photo.naturalWidth, height / photo.naturalHeight)
        : Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
      const [px, py] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
      const imageWidth = photo.naturalWidth * scale;
      const imageHeight = photo.naturalHeight * scale;
      // Drawing only (no pixel reads) also supports cross-origin HubSpot images.
      sampleContext.drawImage(photo, (width - imageWidth) * (px || 0) * cols / width,
        (height - imageHeight) * (py || 0) * rows / height,
        imageWidth * cols / width, imageHeight * rows / height);
      const col = Math.floor((pointer.x - rect.left) / rect.width * cols);
      const row = Math.floor((pointer.y - rect.top) / rect.height * rows);
      const spread = 3 + Math.floor(2 * Math.random());
      for (let y = Math.max(0, row - spread); y <= Math.min(rows - 1, row + spread); y++) {
        for (let x = Math.max(0, col - spread); x <= Math.min(cols - 1, col + spread); x++) {
          const distance = Math.max(Math.abs(x - col), Math.abs(y - row));
          const chance = .9 * (1 - (distance - 2) / (spread - 2));
          if (distance <= 2 || (distance < spread && Math.random() < chance)) {
            context.drawImage(sample, x, y, 1, 1, x, y, 1, 1);
          }
        }
      }
      canvas.style.visibility = 'visible';
    };
    media.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || motionOff()) return clear();
      if (Math.hypot(event.clientX - lastX, event.clientY - lastY) < 6) return;
      lastX = event.clientX;
      lastY = event.clientY;
      pointer = { x: lastX, y: lastY };
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    ['pointerleave', 'pointercancel'].forEach(type => media.addEventListener(type, clear));
    window.addEventListener('blur', clear);
    window.addEventListener('resize', clear, { passive: true });
    document.addEventListener('scroll', clear, { passive: true, capture: true });

 reduced.addEventListener('change',clear);mobile.addEventListener('change',clear);
 });
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();