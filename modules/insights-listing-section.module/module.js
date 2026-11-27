(() => {
  'use strict';
  if (window.hwInsightsListingInit) { window.hwInsightsListingInit(); return; }
  const prefix = 'hw-insights-listing__';
  const initialized = new WeakMap();
  const init = () => document.querySelectorAll('.hw-insights-listing').forEach(section => {
    const find = suffix => section.querySelector('.' + prefix + suffix);
    const form = find('filters');
    const grid = find('grid');
    if (!form || !grid || initialized.get(section)?.grid === grid) return;
    initialized.get(section)?.cleanup();
    const status = find('count');
    const more = find('load-more');
    const reset = find('reset');
    const error = find('error');
    const empty = find('empty');
    const selects = Array.from(form.querySelectorAll('select'));
    const size = Math.max(1, Number(section.dataset.pageSize) || 6);
    const parameters = { type:'insight_type', sector:'sector', capability:'capability' };
    const cache = new Map();
    const safeURL = raw => {
      const url = new URL(raw, location.href);
      const blogURL = new URL(section.dataset.listingUrl || location.href, location.href);
      if (!/^https?:$/.test(url.protocol)) throw new Error('Invalid listing URL');
      // HubSpot previews can use a different host from the blog's canonical URL.
      // Keep AJAX on the page's host, accepting only this blog's canonical host.
      if (url.origin !== location.origin) {
        if (url.origin !== blogURL.origin) throw new Error('Invalid listing URL');
        url.protocol = location.protocol;
        url.host = location.host;
      }
      url.hash = '';
      Object.values(parameters).forEach(key => url.searchParams.delete(key));
      return url.href;
    };
    const readPage = node => ({
      cards:Array.from(node.querySelectorAll('.' + prefix + 'card')).map(card => card.cloneNode(true)),
      next:node.dataset.nextUrl || '', total:Number(node.dataset.total) || null
    });
    const initial = readPage(section);
    const initialURL = safeURL(section.dataset.pageUrl || location.href);
    cache.set(initialURL, initial);
    let cards = initial.cards;
    let next = initial.next;
    let total = initial.total;
    let shown = size;
    let controller;
    let version = 0;
    let retry;
    let selectedTerms = [];
    const key = card => card.dataset.postId || card.querySelector('a')?.href;
    // A low-resolution image patch follows the pointer, matching the reference's
    // 26px blocks and irregular 3–4-cell edge. No pixel readback/CORS permission needed.
    const pixelLayers = new Map();
    const sample = document.createElement('canvas');
    const reducedPixels = matchMedia('(prefers-reduced-motion: reduce)');
    let pixelFrame = 0;
    let pointer;
    let lastX = -1, lastY = -1;
    const clearPixels = () => {
      cancelAnimationFrame(pixelFrame); pixelFrame = 0; pointer = null;
      lastX = lastY = -1;
      pixelLayers.forEach(layer => { layer.style.visibility = 'hidden'; });
    };
    const releasePixels = () => {
      clearPixels();
      pixelLayers.forEach(layer => layer.remove());
      pixelLayers.clear();
    };
    const drawPixels = () => {
      pixelFrame = 0;
      pixelLayers.forEach(layer => { layer.style.visibility = 'hidden'; });
      if (!pointer || reducedPixels.matches || section.dataset.animate === 'false' || document.documentElement.dataset.motion === 'reduced') { clearPixels(); return; }
      const media = document.elementFromPoint(pointer.x,pointer.y)?.closest('.' + prefix + 'image');
      const img = media?.querySelector('img');
      if (!media || !grid.contains(media) || !img?.complete || !img.naturalWidth || /\.svg(?:[?#]|$)/i.test(img.currentSrc || img.src)) { clearPixels(); return; }
      const bounds = img.getBoundingClientRect();
      if (pointer.x < bounds.left || pointer.x > bounds.right || pointer.y < bounds.top || pointer.y > bounds.bottom) return;
      const width = img.offsetWidth, height = img.offsetHeight;
      if (!width || !height) { clearPixels(); return; }
      let pixelLayer = pixelLayers.get(img);
      if (!pixelLayer) {
        pixelLayer = document.createElement('canvas');
        pixelLayer.className = prefix + 'pixel-layer';
        pixelLayer.setAttribute('aria-hidden','true');
        media.appendChild(pixelLayer);
        pixelLayers.set(img,pixelLayer);
      }
      const cols = Math.ceil(width / 26), rows = Math.ceil(height / 26);
      sample.width = pixelLayer.width = cols;
      sample.height = pixelLayer.height = rows;
      const source = sample.getContext('2d'), target = pixelLayer.getContext('2d');
      if (!source || !target) return;
      const style = getComputedStyle(img);
      const scale = (style.objectFit === 'contain' ? Math.min : Math.max)(width/img.naturalWidth,height/img.naturalHeight);
      const [px,py] = style.objectPosition.split(' ').map(value => parseFloat(value)/100);
      const drawnWidth = img.naturalWidth*scale, drawnHeight = img.naturalHeight*scale;
      source.drawImage(img,(width-drawnWidth)*(Number.isFinite(px)?px:.5)*cols/width,(height-drawnHeight)*(Number.isFinite(py)?py:.5)*rows/height,drawnWidth*cols/width,drawnHeight*rows/height);
      const x = Math.floor((pointer.x-bounds.left)/bounds.width*cols);
      const y = Math.floor((pointer.y-bounds.top)/bounds.height*rows);
      const radius = 3 + Math.floor(Math.random()*2);
      for (let row=Math.max(0,y-radius); row<=Math.min(rows-1,y+radius); row++) {
        for (let col=Math.max(0,x-radius); col<=Math.min(cols-1,x+radius); col++) {
          const distance = Math.max(Math.abs(col-x),Math.abs(row-y));
          if (distance<=2 || (distance<radius && Math.random()<.9*(1-(distance-2)/(radius-2)))) target.drawImage(sample,col,row,1,1,col,row,1,1);
        }
      }
      Object.assign(pixelLayer.style,{left:img.offsetLeft+'px',top:img.offsetTop+'px',width:width+'px',height:height+'px',transform:style.transform,transformOrigin:style.transformOrigin,filter:style.filter,visibility:'visible'});
    };
    const movePixels = event => {
      if (event.pointerType === 'touch') { clearPixels(); return; }
      if (Math.hypot(event.clientX-lastX,event.clientY-lastY)<6) return;
      lastX=event.clientX; lastY=event.clientY;
      pointer={x:lastX,y:lastY};
      if (!pixelFrame) pixelFrame=requestAnimationFrame(drawPixels);
    };
    document.addEventListener('pointermove',movePixels,{passive:true});
    document.addEventListener('pointerleave',clearPixels);
    window.addEventListener('scroll',clearPixels,true);
    window.addEventListener('resize',clearPixels);
    window.addEventListener('blur',clearPixels);
    reducedPixels.addEventListener('change',clearPixels);
    const hoverCounts = new Map();
    const cycleAccent = event => {
      const card = event.target.closest('.' + prefix + 'card');
      if (!card || !grid.contains(card)) return;
      if (event.type === 'pointerover' && card.contains(event.relatedTarget)) return;
      if (event.type === 'focusin' && card.matches(':hover')) return;
      const count = hoverCounts.get(key(card)) || 0;
      card.style.setProperty('--insights-card-accent', ['#4bb7ff','#fa9bff','var(--insights-listing-accent,#ff7042)'][count % 3]);
      hoverCounts.set(key(card),count + 1);
    };
    grid.addEventListener('pointerover',cycleAccent);
    grid.addEventListener('focusin',cycleAccent);
    const unique = items => Array.from(new Map(items.map(card => [key(card), card])).values());
    const getValues = () => Object.fromEntries(selects.map(select => [select.name,select.value]));
    const active = values => Object.values(values).some(Boolean);
    const updateControls = () => {
      selects.forEach(select => select.classList.toggle(prefix + 'select--active', Boolean(select.value)));
      reset.hidden = !active(getValues());
    };
    const render = (focusIndex = -1) => {
      releasePixels();
      const visible = cards.slice(0,shown);
      grid.replaceChildren(...visible.map(card => card.cloneNode(true)));
      const count = total ?? (next ? null : cards.length);
      // During an incomplete unfiltered archive, avoid inventing a total.
      const countText = section.dataset.countText || 'Showing {shown} of {total} insights';
      status.textContent = (count === null ? countText.replace(' of {total}', '') : countText)
        .replace('{shown}',String(visible.length)).replace('{total}',count === null ? '…' : String(count));
      empty.hidden = visible.length > 0 || Boolean(next);
      more.hidden = visible.length >= cards.length && !next;
      if (focusIndex >= 0) grid.children[focusIndex]?.focus({ preventScroll:true });
    };
    const page = async (raw, signal) => {
      const url = safeURL(raw);
      if (cache.has(url)) return cache.get(url);
      const response = await fetch(url, { signal, credentials:'same-origin', headers:{ Accept:'text/html' } });
      if (!response.ok) throw new Error('Listing request failed');
      if (new URL(response.url || url).origin !== location.origin) throw new Error('Invalid redirect');
      const doc = new DOMParser().parseFromString(await response.text(),'text/html');
      const remote = Array.from(doc.querySelectorAll('.hw-insights-listing')).find(node => node.dataset.listingInstance === section.dataset.listingInstance);
      if (!remote || !remote.querySelector('.' + prefix + 'grid')) throw new Error('Missing listing in response');
      if (section.dataset.blogId && remote.dataset.blogId !== section.dataset.blogId) throw new Error('Response belongs to a different blog');
      const parsed = readPage(remote);
      cache.set(url,parsed);
      return parsed;
    };
    const run = async task => {
      controller?.abort();
      controller = new AbortController();
      const requestController = controller;
      const current = ++version;
      retry = task;
      error.hidden = true;
      more.disabled = true;
      grid.setAttribute('aria-busy','true');
      const timeout = setTimeout(() => requestController.abort('timeout'),30000);
      try { await task(requestController.signal, () => current === version); }
      catch (err) {
        if (current === version && (err.name !== 'AbortError' || requestController.signal.reason === 'timeout')) {
          render();
          error.hidden = false;
        }
      } finally {
        clearTimeout(timeout);
        if (current === version) { more.disabled = false; grid.removeAttribute('aria-busy'); }
      }
    };
    const matches = (card, terms) => terms.every(term => (card.dataset.postTags || '').split('|').includes(term));
    // Fetch only enough matching cards for this view (plus one to detect more).
    // A single tag uses HubSpot's archive total; intersections have an exact total
    // once the archive ends, without delaying the first visible results.
    const batch = async (start, existing, target, terms, knownTotal, signal) => {
      let collected = existing.slice();
      let url = start;
      let count = knownTotal;
      const visited = new Set();
      while (url && collected.length <= target) {
        if (signal.aborted) throw new DOMException('Aborted','AbortError');
        const normalized = safeURL(url);
        if (visited.has(normalized)) throw new Error('Repeated pagination URL');
        visited.add(normalized);
        const result = await page(url,signal);
        collected = unique([...collected,...result.cards.filter(card => matches(card,terms))]);
        if (terms.length <= 1) count = result.total ?? count;
        url = result.next;
      }
      return { cards:collected, next:url, total:url ? count : collected.length };
    };
    const apply = () => {
      updateControls();
      const terms = Object.values(getValues()).filter(Boolean);
      const selected = selects.find(select => select.value);
      const source = selected?.selectedOptions[0]?.dataset.tagUrl || section.dataset.listingUrl || initialURL;
      run(async (signal,current) => {
        const result = await batch(source,[],size,terms,null,signal);
        if (!current()) return;
        cards=result.cards; next=result.next; total=result.total;
        selectedTerms=terms; shown=size;
        render();
      });
    };
    more.addEventListener('click', () => {
      const previous = Math.min(shown,cards.length);
      const target = shown + size;
      const terms = selectedTerms.slice();
      run(async (signal,current) => {
        const result = await batch(next,cards,target,terms,total,signal);
        if (!current()) return;
        cards=result.cards; next=result.next; total=result.total; shown=target;
        render(previous);
      });
    });
    const clear = () => { form.reset(); selects.forEach(select => { select.value = ''; }); apply(); };
    reset.addEventListener('click',clear);
    find('show-all').addEventListener('click',clear);
    find('retry').addEventListener('click',() => { if (retry) run(retry); });
    form.addEventListener('submit',event => { event.preventDefault(); apply(); });
    selects.forEach(select => select.addEventListener('change',() => apply()));
    // Filters are local UI state. Clear legacy filter parameters once, while
    // preserving unrelated query parameters and the current hash.
    const cleanURL = new URL(location.href);
    const oldKeys = [...Object.values(parameters),'insight_search'];
    if (oldKeys.some(key => cleanURL.searchParams.has(key))) {
      oldKeys.forEach(key => cleanURL.searchParams.delete(key));
      history.replaceState(history.state,'',cleanURL);
    }
    initialized.set(section, { grid, cleanup:() => {
      controller?.abort(); version++;
      releasePixels();
      document.removeEventListener('pointermove',movePixels);
      document.removeEventListener('pointerleave',clearPixels);
      window.removeEventListener('scroll',clearPixels,true);
      window.removeEventListener('resize',clearPixels);
      window.removeEventListener('blur',clearPixels);
      reducedPixels.removeEventListener('change',clearPixels);
    } });
    section.dataset.listingReady = 'true';
    form.hidden = false;
    find('pagination').hidden = true;
    selects.forEach(select => { select.value = ''; });
    updateControls(); render();

    const title = find('title');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => reduced.matches || document.documentElement.dataset.motion === 'reduced' || section.dataset.animate === 'false';
    if (title && !motionOff() && 'IntersectionObserver' in window) {
      const reveal = () => { title.classList.remove(prefix + 'title--pending'); title.classList.add(prefix + 'title--visible'); observer.disconnect(); reduced.removeEventListener('change',changed); };
      const changed = () => { if (motionOff()) reveal(); };
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) reveal(); }, { threshold:.12,rootMargin:'0px 0px -8% 0px' });
      title.classList.add(prefix + 'title--pending'); observer.observe(title); reduced.addEventListener('change',changed);
    }
  });
  window.hwInsightsListingInit = init;
  const start = () => {
    init();
    // HubSpot can insert or replace a module after DOMContentLoaded in the editor.
    let scheduled = false;
    new MutationObserver(records => {
      if (scheduled || !records.some(record => record.addedNodes.length)) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; init(); });
    }).observe(document.body,{ childList:true,subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{ once:true }); else start();
})();
