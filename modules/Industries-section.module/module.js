(() => {
 const init=()=>document.querySelectorAll('[data-industries-module]').forEach(section=>{
  if(section.dataset.ready)return;
  const panels=[...section.querySelectorAll('.hw-industries__panel')];
  const mobile=window.matchMedia('(max-width: 767px)');
  let selected=Math.max(0,Math.min(panels.length-1,(Number(section.dataset.initial)||2)-1));
  const select=index=>{
   if(!mobile.matches)selected=index;
   panels.forEach((panel,i)=>{const active=i===selected;const expanded=mobile.matches||active;panel.dataset.active=String(active);panel.querySelector('button').setAttribute('aria-expanded',String(expanded));panel.querySelector('.hw-industries__copy').setAttribute('aria-hidden',String(!expanded));const link=panel.querySelector('a');if(link)link.tabIndex=expanded?0:-1;});
  };
  mobile.addEventListener('change',()=>select(selected));
  panels.forEach((panel,i)=>{panel.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')select(i);});const button=panel.querySelector('button');button.addEventListener('click',()=>select(i));panel.addEventListener('focusin',()=>select(i));button.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%panels.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+panels.length-1)%panels.length;if(e.key==='Home')next=0;if(e.key==='End')next=panels.length-1;if(next!==undefined){e.preventDefault();panels[next].querySelector('button').focus();}});});
  const accordion=section.querySelector('.hw-industries__accordion');
  let measuredWidth=-1;
  const measure=()=>{
   const width=accordion.clientWidth;
   if(!width)return;
   const stacked=window.matchMedia('(max-width:900px)').matches;
   const copyWidth=Math.max(1,(stacked?width:width*.378049)- (stacked?48:64)-1);
   section.style.setProperty('--industries-copy-width',copyWidth+'px');
   const maxCopy=Math.max(0,...panels.map(panel=>panel.querySelector('.hw-industries__copy').offsetHeight));
   section.style.setProperty('--industries-panel-height',Math.ceil(Math.max(stacked?0:520,maxCopy+(stacked?180:228)))+'px');
   measuredWidth=width;
  };
  section.dataset.ready='true';
  measure();
  if('ResizeObserver' in window)new ResizeObserver(()=>{if(accordion.clientWidth!==measuredWidth)measure();}).observe(accordion);
  window.addEventListener('resize',measure);
  if(document.fonts)document.fonts.ready.then(measure);
  select(Math.max(0,Math.min(panels.length-1,(Number(section.dataset.initial)||2)-1)));section.dataset.ready='true';
  const reveal=()=>section.dataset.visible='true';section.addEventListener('focusin',reveal);
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){reveal();observer.disconnect();}},{threshold:.1});observer.observe(section);}else reveal();
 });if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
