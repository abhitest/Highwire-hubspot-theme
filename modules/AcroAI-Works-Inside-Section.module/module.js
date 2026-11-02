(() => {
  'use strict';
  if (window.hwAcroStackInit) { window.hwAcroStackInit(); return; }
  const states=new Map(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const off=section=>reduced.matches||document.documentElement.dataset.motion==='reduced'||section.dataset.animate==='false';
  const cancel=state=>{state.animations.forEach(a=>a.cancel());state.animations.clear();};
  const animate=(target,frames,delay,state)=>{
    if(!target.animate)return;
    const a=target.animate(frames,{duration:650,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    state.animations.add(a);a.onfinish=a.oncancel=()=>state.animations.delete(a);
  };
  const reveal=(section,state)=>{
    if(state.played||off(section))return;state.played=true;
    const map=section.querySelector('.hw-acro-stack__map');
    if(!map)return;
    map.querySelectorAll('.hw-acro-stack__tile,.hw-acro-stack__block').forEach(target=>{
      const css=getComputedStyle(target);
      animate(target,[{transform:`translate(${css.getPropertyValue('--from-x')},${css.getPropertyValue('--from-y')})`},{transform:'translate(0,0)'}],parseFloat(css.getPropertyValue('--arrival'))||0,state);
    });
    animate(map.querySelector('.hw-acro-stack__lines'),[{transform:'scale(0)'},{transform:'scale(1)'}],0,state);
  };
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    const section=entry.target.closest('.hw-acro-stack'),state=states.get(section);if(!state)return;
    if(entry.intersectionRatio>=.2){state.visible=true;reveal(section,state);}
    else if(!entry.isIntersecting){state.visible=false;state.played=false;cancel(state);}
  }),{threshold:[0,.2]}):null;
  const copySeen=new WeakSet();
  const copyObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;const section=entry.target.closest('.hw-acro-stack'),state=states.get(section);
    if(!state||off(section)||copySeen.has(entry.target))return;
    copySeen.add(entry.target);animate(entry.target,[{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],0,state);
  }),{threshold:0}):null;
  const refresh=()=>{
    states.forEach((state,section)=>{if(!section.isConnected){cancel(state);if(observer&&state.map)observer.unobserve(state.map);if(copyObserver)section.querySelectorAll('[data-stack-copy]').forEach(e=>copyObserver.unobserve(e));states.delete(section);}});
    document.querySelectorAll('.hw-acro-stack').forEach(section=>{
      if(states.has(section))return;const map=section.querySelector('.hw-acro-stack__map');
      states.set(section,{map,played:false,visible:false,animations:new Set()});
      if(observer&&map)observer.observe(map);if(copyObserver)section.querySelectorAll('[data-stack-copy]').forEach(e=>copyObserver.observe(e));
    });
  };
  const sync=()=>states.forEach((state,section)=>{if(off(section)){cancel(state);state.played=false;}else if(state.visible)reveal(section,state);});
  window.hwAcroStackInit=refresh;reduced.addEventListener('change',sync);
  const init=()=>{refresh();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refresh();if(records.some(r=>r.type==='attributes'))sync();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion','data-animate']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
