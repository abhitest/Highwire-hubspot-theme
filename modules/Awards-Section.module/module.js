(() => {
 const init=()=>document.querySelectorAll('.hw-awards').forEach(section=>{
  if(section.dataset.ready)return;
  const title=section.querySelector('.hw-awards__title');
  if(!title)return;
  const reveal=()=>section.dataset.visible='true';
  section.dataset.ready='true';
  section.addEventListener('focusin',reveal);
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){reveal();observer.disconnect();}
   },{threshold:.1});
   observer.observe(title);
  }else reveal();
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
