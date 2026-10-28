(() => {
  'use strict';
  if (window.hwInfoSectionInit) { window.hwInfoSectionInit(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  const off = target => reduced.matches || document.documentElement.dataset.motion === 'reduced' || target.closest('.hw-info-section').dataset.animate === 'false';
  const play = (target,state) => {
    if (state.played || off(target) || !target.animate) return;
    state.played=true;
    const style=getComputedStyle(target);
    state.animation=target.animate([{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],{duration:parseFloat(style.getPropertyValue('--m-exp'))*1000||650,easing:style.getPropertyValue('--ease').trim()||'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    state.animation.onfinish=state.animation.oncancel=()=>{state.animation=null;};
  };
  const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    const state=states.get(entry.target); if(!state)return;
    state.visible=entry.isIntersecting; if(state.visible)play(entry.target,state);
  }),{threshold:0}) : null;
  const refresh=()=>{
    states.forEach((state,target)=>{if(!target.isConnected){if(state.animation)state.animation.cancel();if(observer)observer.unobserve(target);states.delete(target);}});
    document.querySelectorAll('.hw-info-section__title,.hw-info-section__copy').forEach(target=>{
      if(states.has(target))return;states.set(target,{played:false,visible:false,animation:null});if(observer)observer.observe(target);
    });
  };
  const sync=()=>states.forEach((state,target)=>{
    if(!target.isConnected)return;
    if(off(target)){if(state.animation)state.animation.cancel();state.played=false;}
    else if(state.visible)play(target,state);
  });
  window.hwInfoSectionInit=refresh;
  reduced.addEventListener('change',sync);
  const init=()=>{refresh();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refresh();if(records.some(r=>r.type==='attributes'))sync();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion','data-animate']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
