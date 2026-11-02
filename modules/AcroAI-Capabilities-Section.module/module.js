(function(){
  function init(){document.querySelectorAll('.hw-cap:not([data-ready])').forEach(function(section){
    section.dataset.ready='true';
    var accentIndex=0,accents=['var(--cap-accent_color,#4bb7ff)','#fa9bff','#ff7042'];
    section.querySelectorAll('.hw-cap__card').forEach(function(card){
      function cycle(){card.style.setProperty('--cap-card-accent',accents[accentIndex++%accents.length]);}
      card.addEventListener('pointerenter',cycle);
      card.addEventListener('focus',function(){if(!card.matches(':hover'))cycle();});
    });
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    function isReduced(){return reduced.matches||document.documentElement.dataset.motion==='reduced';}
    if('IntersectionObserver' in window){
      if(section.dataset.animate!=='false'&&!isReduced()){
        var reveal=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.remove('is-pending');reveal.unobserve(entry.target);}});},{threshold:.15});
        section.querySelectorAll('.hw-cap__card').forEach(function(card){card.classList.add('is-pending');reveal.observe(card);card.addEventListener('focus',function(){card.classList.remove('is-pending');});});
      }
    }
  });}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
  new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
})();
