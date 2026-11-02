(() => {
'use strict';
const init = () => document.querySelectorAll('.hw-b2b-work').forEach(section => {
 if(section.dataset.initialized) return; section.dataset.initialized='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mobile=matchMedia('(max-width:767px)');
 const motionOff=()=>reduced.matches||mobile.matches||document.documentElement.dataset.motion==='reduced';
 // Measure stationary tracks so the translated cards never feed back into scroll progress.
 const tracks=Array.from(section.querySelectorAll('.hw-b2b-work__caseTrack'));
 let scrollFrame=0;
 const updateParallax=()=>{
  scrollFrame=0;
  if(motionOff()){
   tracks.forEach(track=>track.style.removeProperty('--work-parallax'));
   return;
  }
  const height=document.documentElement.clientHeight;
  const offsets=tracks.map((track,index)=>{
   const rect=track.getBoundingClientRect();
   const progress=Math.max(-1,Math.min(1,(height/2-rect.top-rect.height/2)/((height+rect.height)/2)));
   return progress*(index%2===0?-32:-88);
  });
  tracks.forEach((track,index)=>track.style.setProperty('--work-parallax',offsets[index].toFixed(2)+'px'));
 };
 const scheduleParallax=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateParallax);};
 document.addEventListener('scroll',scheduleParallax,{passive:true,capture:true});
 window.addEventListener('resize',scheduleParallax,{passive:true});
 if('ResizeObserver' in window)new ResizeObserver(scheduleParallax).observe(section);
 const revealTargets=section.querySelectorAll('.hw-b2b-work__header,.hw-b2b-work__case');
 let revealObserver;
 if('IntersectionObserver' in window){
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   entry.target.removeAttribute('data-work-pending');
   revealObserver.unobserve(entry.target);
  }),{rootMargin:'0px 0px -18% 0px',threshold:.08});
  if(!motionOff())revealTargets.forEach(target=>{
   target.setAttribute('data-work-pending','');
   revealObserver.observe(target);
  });
 }
 const syncMotion=()=>{
  if(motionOff())revealTargets.forEach(target=>{
   target.removeAttribute('data-work-pending');
   if(revealObserver)revealObserver.unobserve(target);
  });
  scheduleParallax();
 };
 reduced.addEventListener('change',syncMotion);
 mobile.addEventListener('change',syncMotion);
 new MutationObserver(syncMotion).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
 updateParallax();
 section.querySelectorAll('.hw-b2b-work__visual').forEach(media=>{
 const photo=media.querySelector('img');if(!photo)return;
 if(media.tagName==='A'){
  const accents=['#4bb7ff','#fa9bff','#ff7042'];
  let accentIndex=0;
  const cycleAccent=()=>media.style.setProperty('--media-accent',accents[accentIndex++%accents.length]);
  const hide=()=>{delete media.dataset.cursor;};
  const move=event=>{if(event.pointerType!=='mouse'||motionOff())return hide();const r=media.getBoundingClientRect();if(!r.width||!r.height)return hide();media.style.setProperty('--cursor-x',((event.clientX-r.left)*media.offsetWidth/r.width)+'px');media.style.setProperty('--cursor-y',((event.clientY-r.top)*media.offsetHeight/r.height)+'px');media.dataset.cursor='true';};
  media.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')cycleAccent();move(event);},{passive:true});
  media.addEventListener('pointermove',move,{passive:true});
  media.addEventListener('focus',()=>{if(!media.matches(':hover'))cycleAccent();});
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
