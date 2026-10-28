(() => {
  'use strict';
  if (window.hwAcroAiBannerInit) { window.hwAcroAiBannerInit(); return; }
  const states = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const off = section => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
  const play = (section,state) => {
    if (state.played || off(section)) return;
    state.played = true;
    const ease = getComputedStyle(section).getPropertyValue('--ease').trim() || 'cubic-bezier(.22,1,.36,1)';
    const sequence = [
      ['h1',[{clipPath:'inset(-10px 0 100%)',transform:'translateY(20px)'},{clipPath:'inset(-10px 0 -20px)',transform:'translateY(0)'}],0],
      ['.hw-acroai-banner__field',[{transform:'scaleY(0)'},{transform:'scaleY(1)'}],400],
      ['.hw-acroai-banner__cta',[{transform:'translateY(100%)'},{transform:'translateY(0)'}],1200]
    ];
    sequence.forEach(([selector,frames,delay]) => {
      const target=section.querySelector(selector); if(!target || !target.animate)return;
      const animation=target.animate(frames,{duration:650,delay,easing:ease,fill:'backwards'});
      state.animations.add(animation);
      animation.onfinish=animation.oncancel=()=>state.animations.delete(animation);
    });
  };
  const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    const state=states.get(entry.target); if(!state)return; state.visible=entry.isIntersecting;
    if(state.visible)play(entry.target,state);
  }),{threshold:0}) : null;
  const refresh=()=>{
    states.forEach((state,section)=>{if(!section.isConnected){state.animations.forEach(a=>a.cancel());if(observer)observer.unobserve(section);states.delete(section);}});
    document.querySelectorAll('.hw-acroai-banner').forEach(section=>{
      if(states.has(section))return;const state={played:false,visible:false,animations:new Set()};states.set(section,state);
      if(observer)observer.observe(section);
    });
  };
  const sync=()=>states.forEach((state,section)=>{if(off(section)){state.animations.forEach(a=>a.cancel());state.played=false;}else if(state.visible)play(section,state);});
  window.hwAcroAiBannerInit=refresh;
  reduced.addEventListener('change',sync);
  const init=()=>{refresh();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refresh();if(records.some(r=>r.type==='attributes'))sync();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion','data-animate']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
