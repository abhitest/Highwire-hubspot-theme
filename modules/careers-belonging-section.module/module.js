(() => {
 const init=()=>document.querySelectorAll('[data-career-belonging]').forEach(section=>{
  if(section.dataset.ready)return;section.dataset.ready='true';
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const off=()=>reduced.matches||section.dataset.animate==='false'||document.documentElement.dataset.motion==='reduced';
  const title=section.querySelector('.hw-career-belonging__heading');
  if(title&&!off()&&'IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){title.classList.add('is-visible');observer.disconnect();}}),{rootMargin:'0px 0px -8% 0px',threshold:.12});
   section.classList.add('is-ready');observer.observe(title);
  }
  const photo=section.querySelector('.hw-career-belonging__photo'),img=photo?.querySelector('img'),canvas=photo?.querySelector('canvas'),ctx=canvas?.getContext('2d');
  if(!ctx)return;
  const hide=()=>{canvas.style.visibility='hidden';};
  photo.addEventListener('pointermove',event=>{
   if(off()||event.pointerType!=='mouse'||!img.complete||!img.naturalWidth){hide();return;}
   const rect=photo.getBoundingClientRect(),size=12;
   canvas.width=Math.ceil(rect.width/size);canvas.height=Math.ceil(rect.height/size);
   const scale=Math.max(rect.width/img.naturalWidth,rect.height/img.naturalHeight);
   const pos=getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
   const dx=(rect.width-img.naturalWidth*scale)*(pos[0]/100),dy=(rect.height-img.naturalHeight*scale)*(pos[1]/100);
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(img,dx/rect.width*canvas.width,dy/rect.height*canvas.height,img.naturalWidth*scale/rect.width*canvas.width,img.naturalHeight*scale/rect.height*canvas.height);
   const col=Math.floor((event.clientX-rect.left)/rect.width*canvas.width),row=Math.floor((event.clientY-rect.top)/rect.height*canvas.height),spread=4+Math.floor(Math.random()*2);
   ctx.globalCompositeOperation='destination-in';ctx.beginPath();
   for(let y=Math.max(0,row-spread);y<=Math.min(canvas.height-1,row+spread);y++)for(let x=Math.max(0,col-spread);x<=Math.min(canvas.width-1,col+spread);x++){const distance=Math.max(Math.abs(x-col),Math.abs(y-row));if(distance<=3||Math.random()<.4)ctx.rect(x,y,1,1);}
   ctx.fill();ctx.globalCompositeOperation='source-over';canvas.style.visibility='visible';
  });
  photo.addEventListener('pointerleave',hide);photo.addEventListener('pointercancel',hide);window.addEventListener('blur',hide);document.addEventListener('scroll',hide,true);reduced.addEventListener('change',hide);
  new MutationObserver(hide).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
 });if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
