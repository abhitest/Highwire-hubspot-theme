(() => {
 const init=()=>document.querySelectorAll('[data-careers-module]').forEach(section=>{
  if(section.dataset.ready)return;section.dataset.ready='true';
  const stage=section.querySelector('.hw-careers__stage'),scene=section.querySelector('.hw-careers__scene'),wipe=section.querySelector('.hw-careers__wipe'),slides=[...section.querySelectorAll('.hw-careers__slide')],reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let scroller=window;for(let p=section.parentElement;p;p=p.parentElement){if(/auto|scroll/.test(getComputedStyle(p).overflowY)){scroller=p;break;}}
  let frame=0,progress=0,visible=false,index=0,tone=0,timer=0,mode='';
  const motionOff=()=>reduced.matches||document.documentElement.dataset.motion==='reduced';
  // Mobile's page-wide static layout must not disable the Careers slideshow.
  const sliderMotionOff=()=>reduced.matches||(!matchMedia('(max-width: 767px)').matches&&document.documentElement.dataset.motion==='reduced');
  const media=section.querySelector('.hw-careers__media'),canvas=media.querySelector('canvas'),context=canvas.getContext('2d');
  let pixelFrame=0,pointer=null;
  const hidePixels=()=>{cancelAnimationFrame(pixelFrame);pixelFrame=0;pointer=null;delete media.dataset.pointer;};
  const drawPixels=()=>{
   pixelFrame=0;
   const image=slides[index];
   if(!pointer||!context||motionOff()||!image?.complete||!image.naturalWidth)return;
   const rect=media.getBoundingClientRect(),width=media.clientWidth,height=media.clientHeight;
   if(!rect.width||!rect.height||!width||!height)return;
   const x=(pointer.x-rect.left)*width/rect.width,y=(pointer.y-rect.top)*height/rect.height;
   if(x<0||y<0||x>width||y>height){hidePixels();return;}
   // Keep the lens proportional on phones instead of covering most of the photo.
   const blockSize=innerWidth<767?Math.max(8,Math.min(26,width/32)):26;
   canvas.width=Math.max(1,Math.ceil(width/blockSize));canvas.height=Math.max(1,Math.ceil(height/blockSize));
   const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight),sw=width/scale,sh=height/scale;
   const position=getComputedStyle(image).objectPosition.split(' ').map(value=>parseFloat(value)/100);
   context.drawImage(image,(image.naturalWidth-sw)*(Number.isFinite(position[0])?position[0]:.5),(image.naturalHeight-sh)*(Number.isFinite(position[1])?position[1]:.5),sw,sh,0,0,canvas.width,canvas.height);
   // Match the reference's whole-cell square and scattered outer pixels.
   const col=Math.floor(x/width*canvas.width),row=Math.floor(y/height*canvas.height),spread=4+Math.floor(2*Math.random());
   context.globalCompositeOperation='destination-in';
   context.beginPath();
   for(let cy=Math.max(0,row-spread);cy<=Math.min(canvas.height-1,row+spread);cy++){
    for(let cx=Math.max(0,col-spread);cx<=Math.min(canvas.width-1,col+spread);cx++){
     const distance=Math.max(Math.abs(cx-col),Math.abs(cy-row)),chance=.9*(1-(distance-3)/(spread-3));
     if(distance<=3||(distance<spread&&Math.random()<chance))context.rect(cx,cy,1,1);
    }
   }
   context.fill();context.globalCompositeOperation='source-over';
   media.dataset.pointer='true';
  };
  media.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||motionOff()){hidePixels();return;}if(pointer&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6)return;pointer={x:event.clientX,y:event.clientY};if(!pixelFrame)pixelFrame=requestAnimationFrame(drawPixels);});
  media.addEventListener('pointerleave',hidePixels);media.addEventListener('pointercancel',hidePixels);window.addEventListener('blur',hidePixels);window.addEventListener('resize',hidePixels,{passive:true});scroller.addEventListener('scroll',hidePixels,{passive:true});reduced.addEventListener('change',hidePixels);document.addEventListener('visibilitychange',hidePixels);new MutationObserver(hidePixels).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  slides.forEach(image=>image.addEventListener('load',()=>{if(pointer)drawPixels();}));
  let phaseTimer=0,wipeAnimation=null;
  const stop=()=>{clearTimeout(timer);clearTimeout(phaseTimer);wipeAnimation?.cancel();wipeAnimation=null;timer=0;phaseTimer=0;wipe.dataset.phase='idle';};
  const eligible=()=>section.isConnected&&visible&&progress>=.98&&!document.hidden&&!sliderMotionOff()&&section.dataset.autoplay==='true'&&slides.length>1;
  const setPhase=phase=>{
   clearTimeout(phaseTimer);wipeAnimation?.cancel();wipe.dataset.phase=phase;
   // Use the same wipe on desktop and mobile, independent of CSS animation resets.
   wipeAnimation=wipe.animate(
    phase==='cover'
     ? [{transform:'translateX(-101%)'},{transform:'translateX(0)'}]
     : [{transform:'translateX(0)'},{transform:'translateX(101%)'}],
    {duration:360,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}
   );
   const animation=wipeAnimation;
   animation.finished.then(()=>{if(wipeAnimation===animation)finishPhase(phase);},()=>{});
   // A fallback prevents autoplay from stalling if completion is interrupted.
   phaseTimer=setTimeout(()=>finishPhase(phase),450);
  };
  const finishPhase=phase=>{
   if(wipe.dataset.phase!==phase)return;
   clearTimeout(phaseTimer);phaseTimer=0;
   if(!eligible()){stop();return;}
   if(phase==='cover'){
    index=(index+1)%slides.length;
    slides.forEach((s,i)=>{s.dataset.active=String(i===index);s.setAttribute('aria-hidden',String(i!==index));});
    drawPixels();setPhase('reveal');
   }else if(phase==='reveal'){wipeAnimation?.cancel();wipeAnimation=null;wipe.dataset.phase='idle';queue();}
  };
  const queue=()=>{
   if(timer||wipe.dataset.phase!=='idle'||!eligible())return;
   // Hidden lazy slides may otherwise remain unloaded until they become active.
   slides.forEach(image=>{image.loading='eager';});
   timer=setTimeout(()=>{timer=0;if(!eligible())return;wipe.style.background='var(--color-'+['quinary','quaternary','tertiary'][tone++%3]+')';setPhase('cover');},4000);
  };
  const update=()=>{frame=0;const rect=section.getBoundingClientRect(),vh=scroller===window?innerHeight:scroller.clientHeight,top=scroller===window?0:scroller.getBoundingClientRect().top;visible=rect.top<top+vh&&rect.bottom>top;
   const tablet=innerWidth>=767&&innerWidth<=991;
   section.dataset.layout=tablet?'stacked':'default';
   mode=!motionOff()&&(tablet||section.clientWidth>=768)?(tablet?'stacked':'pinned'):'static';section.dataset.mode=mode;
   if(mode==='pinned'){const scale=Math.min(section.clientWidth/1440,vh/856);section.style.setProperty('--careers-height',vh+'px');scene.style.width=section.clientWidth/scale+'px';scene.style.height=vh/scale+'px';scene.style.transform='scale('+scale+')';progress=Math.max(0,Math.min(1,(top-rect.top)/700));}
   else if(mode==='stacked'){
    scene.removeAttribute('style');
    const imageHeight=Math.min(section.clientWidth*560/608,vh*.55);
    // Copy height already includes bottom padding; fit the final scene to its content.
    const gap=parseFloat(getComputedStyle(scene).rowGap)||0;
    const height=imageHeight+section.querySelector('.hw-careers__copy').offsetHeight+gap;
    section.style.setProperty('--careers-height',height+'px');
    section.style.setProperty('--careers-image-start-height',Math.max(vh,height)+'px');
    section.style.setProperty('--careers-image-height',imageHeight+'px');
    progress=Math.max(0,Math.min(1,(top-rect.top)/700));
   }
   else{scene.removeAttribute('style');section.style.removeProperty('--careers-height');progress=1;}
   section.style.setProperty('--careers-progress',progress);section.querySelector('.hw-careers__copy').inert=progress<.66;
   if(!eligible())stop();else queue();
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  scroller.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});new ResizeObserver(schedule).observe(section);reduced.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  slides.forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==0)));update();
 });if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
