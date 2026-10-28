(() => {
  'use strict';
  if (window.hwPlaybookInit) { window.hwPlaybookInit(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  const benefitLists = new WeakMap();
  const benefitItems = new WeakSet();
  const benefitAccents = ['#4bb7ff', '#fa9bff', '#ff7042'];
  const rails = new Set();
  const updateSticky = rail => {
    const top = parseFloat(getComputedStyle(rail).getPropertyValue('--playbook-sticky-top')) || 0;
    // Let tall forms scroll into view before pinning their bottom to the viewport.
    rail.style.setProperty('--playbook-sticky-offset', Math.min(top, innerHeight - rail.offsetHeight - 24) + 'px');
  };
  const railObserver = 'ResizeObserver' in window ? new ResizeObserver(entries=>entries.forEach(entry=>updateSticky(entry.target))) : null;
  const off = target => reduced.matches || document.documentElement.dataset.motion === 'reduced' || target.closest('.hw-playbook').dataset.animate === 'false';
  const play = (target,state) => {
    if (state.played || off(target) || !target.animate) return;
    state.played=true;
    const style=getComputedStyle(target);
    const title=target.hasAttribute('data-playbook-title');
    const frames=title?[{clipPath:'inset(0 0 100%)',transform:'translateY(20px)'},{clipPath:'inset(-8px 0 -16px)',transform:'translateY(0)'}]:[{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}];
    state.animation=target.animate(frames,{delay:title&&target.previousElementSibling?100:0,duration:parseFloat(style.getPropertyValue('--m-exp'))*1000||650,easing:style.getPropertyValue('--ease').trim()||'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    state.animation.onfinish=state.animation.oncancel=()=>{state.animation=null;};
  };
  const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    const state=states.get(entry.target); if(!state)return;
    state.visible=entry.isIntersecting; if(state.visible)play(entry.target,state);
  }),{threshold:0}) : null;
  const refresh=()=>{
    document.querySelectorAll('.hw-playbook__benefits').forEach(list=>{
      if(!benefitLists.has(list))benefitLists.set(list,{index:0});
      const cycle=event=>{
        const state=benefitLists.get(list);
        event.currentTarget.style.setProperty('--benefit-accent',benefitAccents[state.index++%benefitAccents.length]);
      };
      list.querySelectorAll('li').forEach(item=>{
        if(benefitItems.has(item))return;
        benefitItems.add(item);
        item.addEventListener('pointerenter',cycle,{passive:true});
        item.addEventListener('focus',event=>{if(!item.matches(':hover'))cycle(event);});
      });
    });
    rails.forEach(rail=>{if(!rail.isConnected){if(railObserver)railObserver.unobserve(rail);rails.delete(rail);}});
    document.querySelectorAll('.hw-playbook__rail').forEach(rail=>{
      if(!rails.has(rail)){rails.add(rail);if(railObserver)railObserver.observe(rail);}
      updateSticky(rail);
    });
    states.forEach((state,target)=>{if(!target.isConnected){if(state.animation)state.animation.cancel();if(observer)observer.unobserve(target);states.delete(target);}});
    document.querySelectorAll('.hw-playbook [data-playbook-reveal],.hw-playbook [data-playbook-title]').forEach(target=>{
      if(states.has(target))return;states.set(target,{played:false,visible:false,animation:null});if(observer)observer.observe(target);
    });
  };
  const sync=()=>states.forEach((state,target)=>{
    if(!target.isConnected)return;
    if(off(target)){if(state.animation)state.animation.cancel();state.played=false;}
    else if(state.visible)play(target,state);
  });
  window.hwPlaybookInit=refresh;
  window.addEventListener('resize',refresh,{passive:true});
  reduced.addEventListener('change',sync);
  const init=()=>{refresh();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refresh();if(records.some(r=>r.type==='attributes'))sync();}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion','data-animate']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
