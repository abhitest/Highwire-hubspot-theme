(() => {
 const init=()=>document.querySelectorAll('[data-hw-header]').forEach(header=>{
  if(header.dataset.ready)return;
  header.dataset.ready='true';
  const toggle=header.querySelector('.hw-header__toggle'),logo=header.querySelector('.hw-header__logo');
  const menus=[...header.querySelectorAll('.hw-header__dropdown')];
  const desktop=matchMedia('(min-width:901px)'),timers=new Map();
  const nav=header.querySelector('.hw-header__nav');
  const syncNav=()=>{nav.inert=!desktop.matches&&header.dataset.open!=='true';header.style.setProperty('--header-menu-height',nav.scrollHeight+'px');};
  const setMenu=(menu,open)=>{
   clearTimeout(timers.get(menu));
   menu.dataset.open=String(open);
   menu.querySelector('button').setAttribute('aria-expanded',String(open));
   const panel=menu.querySelector('.hw-header__panel');panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
   if(open){header.dataset.hidden='false';menus.filter(m=>m!==menu).forEach(m=>setMenu(m,false));}
   syncNav();
  };
  const close=()=>{toggle.setAttribute('aria-expanded','false');header.dataset.open='false';menus.forEach(m=>setMenu(m,false));syncNav();};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';close();toggle.setAttribute('aria-expanded',String(open));header.dataset.open=String(open);header.dataset.hidden='false';syncNav();});
  syncNav();
  menus.forEach(menu=>{
   const trigger=menu.querySelector('button');
   trigger.addEventListener('click',()=>setMenu(menu,menu.dataset.open!=='true'));
   menu.addEventListener('pointerenter',e=>{if(desktop.matches&&e.pointerType==='mouse')setMenu(menu,true);});
   menu.addEventListener('pointerleave',()=>{if(desktop.matches&&!menu.contains(document.activeElement))timers.set(menu,setTimeout(()=>setMenu(menu,false),180));});
   menu.addEventListener('focusout',e=>{if(desktop.matches&&!menu.contains(e.relatedTarget))setMenu(menu,false);});
   menu.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setMenu(menu,false);trigger.focus();}
    if(e.key==='ArrowDown'&&e.target===trigger){e.preventDefault();setMenu(menu,true);menu.querySelector('a').focus();}
   });
  });
  header.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
  header.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))close();});
  header.addEventListener('focusin',()=>{header.dataset.hidden='false';});
  header.addEventListener('focusout',e=>{if(desktop.matches&&!header.contains(e.relatedTarget))close();});
  desktop.addEventListener('change',close);
  // Cycle across dropdown links, skipping each link's previous color.
  const hoverColors=['tertiary','quaternary','quinary'];
  let nextHoverColor=0;
  header.querySelectorAll('.hw-header__panel li a').forEach(link=>{
   let lastColor=-1;
   const changeColor=()=>{
    let index=nextHoverColor;
    if(index===lastColor)index=(index+1)%hoverColors.length;
    link.style.setProperty('--header-link-hover','var(--color-'+hoverColors[index]+')');
    lastColor=index;nextHoverColor=(index+1)%hoverColors.length;
   };
   link.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')changeColor();});
   link.addEventListener('focus',()=>{if(!link.matches(':hover'))changeColor();});
  });
  let color=0;
  const colorize=()=>logo.dataset.tone=['quaternary','tertiary','quinary'][color++%3];
  logo.addEventListener('pointerenter',colorize);logo.addEventListener('focus',colorize);
  logo.addEventListener('pointerleave',()=>{if(document.activeElement!==logo)delete logo.dataset.tone;});
  logo.addEventListener('blur',()=>delete logo.dataset.tone);
  // Fixed inside a measured slot so HubSpot module wrappers do not limit sticky travel.
  const slot=document.createElement('div');slot.className='hw-header-slot';header.before(slot);slot.append(header);
  let scroller=window;
  for(let parent=slot.parentElement;parent;parent=parent.parentElement){if(/auto|scroll/.test(getComputedStyle(parent).overflowY)){scroller=parent;break;}}
  const position=()=>{const r=slot.getBoundingClientRect();header.style.setProperty('--header-left',r.left+'px');header.style.setProperty('--header-width',r.width+'px');header.style.setProperty('--header-top',(scroller===window?0:scroller.getBoundingClientRect().top)+'px');slot.style.height=header.querySelector('.hw-header__logo').offsetHeight+'px';};
  position();header.dataset.fixed='true';
  let last=scroller===window?scrollY:scroller.scrollTop;
  scroller.addEventListener('scroll',()=>{const y=scroller===window?scrollY:scroller.scrollTop,delta=y-last;if(header.dataset.anchorScrolling==='true'){last=y;return;}const open=header.dataset.open==='true'||menus.some(m=>m.dataset.open==='true');if(y<=4||open||header.contains(document.activeElement))header.dataset.hidden='false';else if(Math.abs(delta)>6)header.dataset.hidden=String(delta>0);last=y;},{passive:true});
  window.addEventListener('resize',()=>{syncNav();position();},{passive:true});
  new ResizeObserver(position).observe(slot);
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
