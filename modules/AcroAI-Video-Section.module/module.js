(() => {
  'use strict';
  if(window.hwAcroVideoInit){window.hwAcroVideoInit();return;}
  const sections=new Map();
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    const state=sections.get(entry.target);if(!state)return;
    const visible=entry.isIntersecting;
    if(visible===state.visible)return;
    state.visible=visible;
    if(visible)entry.target.style.setProperty('--video-cover',`var(--video-${['purple','blue','orange'][state.count++%3]})`);
    entry.target.dataset.coverVisible=String(visible);
  }),{threshold:.18}):null;
  const refresh=()=>{
    sections.forEach((state,section)=>{if(!section.isConnected){state.video.pause();if(observer)observer.unobserve(section);sections.delete(section);}});
    document.querySelectorAll('.hw-acro-video').forEach(section=>{
      if(sections.has(section))return;
      const video=section.querySelector('video'),button=section.querySelector('.hw-acro-video__play'),poster=section.querySelector('.hw-acro-video__poster'),status=section.querySelector('.hw-acro-video__status');
      if(!video||!poster)return;
      sections.set(section,{count:0,visible:false,video});
      if(observer){section.dataset.coverReady='true';observer.observe(section);}
      if(!button)return;
      let hover=0;
      const colour=()=>button.style.setProperty('--play-accent',`var(--video-${['blue','purple','orange'][hover++%3]})`);
      button.addEventListener('pointerenter',colour);
      button.addEventListener('focus',()=>{if(!button.matches(':hover'))colour();});
      const fail=()=>{poster.hidden=false;status.hidden=false;status.textContent='The video could not be played. Please try again.';};
      video.addEventListener('error',fail);
      button.addEventListener('click',()=>{
        if(!video.dataset.src)return;
        status.hidden=true;
        if(!video.getAttribute('src'))video.src=video.dataset.src;
        poster.hidden=true;video.controls=true;video.focus({preventScroll:true});
        const promise=video.play();if(promise)promise.catch(fail);
      });
    });
  };
  window.hwAcroVideoInit=refresh;
  const init=()=>{refresh();new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
