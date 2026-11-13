(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const init = () => document.querySelectorAll('.hw-podcast-episodes:not([data-ready])').forEach(section => {
    section.dataset.ready = 'true';
    const off = () => section.dataset.animate === 'false' || reduced.matches || document.documentElement.dataset.motion === 'reduced';
    if (off() || !('IntersectionObserver' in window)) return;
    const targets = Array.from(section.querySelectorAll('[data-podcast-reveal]'));
    if (!targets.length) return;
    let root = null;
    for (let parent = section.parentElement; parent; parent = parent.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) { root = parent; break; }
    }
    const pending = new Set(targets);
    const observer = new IntersectionObserver(entries => {
      if (off()) { finish(); return; }
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('pod-is-visible');
        pending.delete(entry.target);
        observer.unobserve(entry.target);
      });
      if (!pending.size) cleanup();
    }, { root, rootMargin:'0px 0px -8% 0px', threshold:0.12 });
    const motionObserver = new MutationObserver(() => { if (off()) finish(); });
    const sync = () => { if (off()) finish(); };
    function cleanup() {
      observer.disconnect();
      motionObserver.disconnect();
      reduced.removeEventListener('change', sync);
      section.removeEventListener('focusin', finish);
    }
    function finish() {
      section.classList.remove('pod-motion-ready');
      targets.forEach(target => target.classList.add('pod-is-visible'));
      pending.clear();
      cleanup();
    }
    section.classList.add('pod-motion-ready');
    targets.forEach(target => observer.observe(target));
    reduced.addEventListener('change', sync);
    motionObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-motion'] });
    motionObserver.observe(section, { attributes:true, attributeFilter:['data-animate'] });
    section.addEventListener('focusin', finish);
  });
  const start = () => {
    init();
    new MutationObserver(init).observe(document.documentElement, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
// Each module instance owns its filter and derives topics from its editable episodes.
(() => {
  'use strict';
  const init = () => document.querySelectorAll('.hw-podcast-episodes:not([data-filter-ready])').forEach(section => {
    section.dataset.filterReady = 'true';
    const select = section.querySelector('[data-topic-filter]');
    const status = section.querySelector('[data-results]');
    const reset = section.querySelector('[data-reset]');
    const empty = section.querySelector('[data-empty]');
    const rows = Array.from(section.querySelectorAll('[data-episode]')).map(element => ({
      element,
      topics: Array.from(element.querySelectorAll('[data-topic]'), topic => topic.textContent.trim())
    }));
    const topics = [...new Set(rows.flatMap(row => row.topics))];
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      select.appendChild(option);
    });
    const update = () => {
      let count = 0;
      rows.forEach(row => {
        row.element.hidden = Boolean(select.value && !row.topics.includes(select.value));
        if (!row.element.hidden) count++;
      });
      status.textContent = `${count} ${count === 1 ? status.dataset.singular : status.dataset.plural}`;
      empty.hidden = count > 0;
      reset.hidden = !select.value;
    };
    select.addEventListener('change', update);
    reset.addEventListener('click', () => {
      select.value = '';
      update();
      select.focus();
    });
    section.querySelector('.pod-filter').hidden = topics.length === 0;
    update();
  });
  const start = () => {
    init();
    new MutationObserver(init).observe(document.documentElement, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
