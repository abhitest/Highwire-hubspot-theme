(function(){
  function init(){document.querySelectorAll('.hw-cap:not([data-ready])').forEach(function(section){
    section.dataset.ready='true';
    var video=section.querySelector('video'),button=section.querySelector('.hw-cap__pause');
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),visible=false,paused=false;
    function isReduced(){return reduced.matches||document.documentElement.dataset.motion==='reduced';}
    function sync(){
      if(!section.isConnected){video.pause();return;}
      if(!visible||document.hidden||paused||isReduced()){video.pause();return;}
      if(!video.src&&video.dataset.src){video.src=video.dataset.src;video.load();}
      if(video.src){video.muted=true;video.play().catch(function(){button.hidden=false;button.textContent='Play';button.setAttribute('aria-label','Play video');});}
    }
    video.addEventListener('playing',function(){button.hidden=false;button.textContent='Pause';button.setAttribute('aria-label','Pause video');});
    button.addEventListener('click',function(){paused=!video.paused;button.textContent=paused?'Play':'Pause';button.setAttribute('aria-label',paused?'Play video':'Pause video');sync();});
    if('IntersectionObserver' in window){
      var mediaObserver=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();},{threshold:.05});mediaObserver.observe(video);
      if(section.dataset.animate!=='false'&&!isReduced()){
        var reveal=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.remove('is-pending');reveal.unobserve(entry.target);}});},{threshold:.15});
        section.querySelectorAll('.hw-cap__card').forEach(function(card){card.classList.add('is-pending');reveal.observe(card);card.addEventListener('focus',function(){card.classList.remove('is-pending');});});
      }
    }else{visible=true;sync();}
    document.addEventListener('visibilitychange',sync);
    reduced.addEventListener('change',sync);
    new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  });}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
  new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
})();
