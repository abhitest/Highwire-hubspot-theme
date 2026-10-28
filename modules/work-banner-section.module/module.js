(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-work-banner').forEach(section => {
    if (section.dataset.workInitialized) return;
    section.dataset.workInitialized = 'true';
    const title = section.querySelector('h1');
    const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
    if (title && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        if (!motionOff() && title.animate) {
          const slide = title.animate([{ transform:'translateY(28px)' }, { transform:'translateY(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
          const fade = title.animate([{ opacity:0 }, { opacity:1 }], { duration:360, easing:'cubic-bezier(.4,0,.2,1)' });
          const stop = () => { if (motionOff()) { slide.cancel(); fade.cancel(); } };
          reduced.addEventListener('change', stop);
          slide.finished.catch(() => {}).finally(() => reduced.removeEventListener('change', stop));
        }
      }, { threshold:0.1 });
      observer.observe(title);
    }
    section.querySelectorAll('[data-youtube]').forEach(player => {
      player.querySelector('button').addEventListener('click', () => {
        const raw = player.dataset.youtube.trim();
        let id = /^[\w-]{11}$/.test(raw) ? raw : '';
        if (!id) {
          try {
            const url = new URL(raw);
            const host = url.hostname.replace(/^www\./, '');
            if (host === 'youtu.be') id = url.pathname.split('/')[1];
            else if (['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)) id = url.searchParams.get('v') || (/^\/(embed|shorts|live)\//.test(url.pathname) ? url.pathname.split('/')[2] : '');
          } catch (_) { /* Invalid URLs show an inline message. */ }
        }
        if (!/^[\w-]{11}$/.test(id || '')) { player.querySelector('[role=status]').hidden = false; return; }
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        iframe.title = player.dataset.title || 'Work highlight reel';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        player.replaceChildren(iframe);
        iframe.focus();
      });
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
