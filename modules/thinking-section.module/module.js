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

 const init=()=>document.querySelectorAll('[data-thinking-module]').forEach(section=>{
  if(section.dataset.ready)return;section.dataset.ready='true';
  const reveal=()=>section.dataset.visible='true';
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){reveal();observer.disconnect();}},{threshold:.1});observer.observe(section);}else reveal();
  section.addEventListener('focusin',reveal);
  let next=0;const colors=['quinary','quaternary','tertiary'],reduced=matchMedia('(prefers-reduced-motion:reduce)');
  section.querySelectorAll('.hw-thinking__card').forEach(card=>{
   const media=card.querySelector('.hw-thinking__media');
   const color=()=>{let index=next;if(card.dataset.color===String(index))index=(index+1)%3;card.dataset.color=String(index);card.style.setProperty('--thinking-accent','var(--color-'+colors[index]+')');next=(index+1)%3;};
   card.addEventListener('pointerenter',color);card.addEventListener('focusin',()=>{if(!card.matches(':hover'))color();});
   const canvas=media.querySelector('canvas'),image=media.querySelector('img');
   const context=canvas.getContext('2d');
   let frame=0;
   const hide=()=>{cancelAnimationFrame(frame);frame=0;delete media.dataset.pointer;};
   media.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||reduced.matches||document.documentElement.dataset.motion==='reduced')return;
    const x=e.clientX,y=e.clientY;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
     frame=0;
     const r=media.getBoundingClientRect();
     if(!r.width||!r.height)return;
     media.style.setProperty('--thinking-x',(x-r.left)*media.clientWidth/r.width+'px');
     media.style.setProperty('--thinking-y',(y-r.top)*media.clientHeight/r.height+'px');
     media.dataset.pointer='true';
     if(!context||!image.complete||!image.naturalWidth)return;
     const width=media.clientWidth,height=media.clientHeight;
     canvas.width=Math.max(1,Math.ceil(width/pixelSize(width)));canvas.height=Math.max(1,Math.ceil(height/pixelSize(width)));
     const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
     const cropWidth=width/scale,cropHeight=height/scale;
     context.drawImage(image,(image.naturalWidth-cropWidth)/2,(image.naturalHeight-cropHeight)/2,cropWidth,cropHeight,0,0,canvas.width,canvas.height);
     maskPixels(context,canvas,(x-r.left)*width/r.width,(y-r.top)*height/r.height,width,height);
    });
   });
   new MutationObserver(hide).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
   media.addEventListener('pointerleave',hide);media.addEventListener('pointercancel',hide);window.addEventListener('scroll',hide,{passive:true,capture:true});window.addEventListener('resize',hide,{passive:true});window.addEventListener('blur',hide);reduced.addEventListener('change',hide);
  });
 });if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();