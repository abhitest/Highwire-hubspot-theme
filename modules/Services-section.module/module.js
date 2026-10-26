(() => {
  const init = () => document.querySelectorAll('[data-services-module]').forEach(section => {
    if (section.dataset.ready) return;
    section.dataset.ready = 'true';
    // Share the reference's color sequence across rows, skipping a row's last color.
    const colors = ['quinary', 'quaternary', 'tertiary'];
    let nextColor = 0;
    const rows = [...section.querySelectorAll('.hw-services__row')];
    rows.forEach(row => {
      const changeColor = () => {
        if (row.classList.contains('hw-services__row--cta')) return;
        let index = nextColor;
        if (row.dataset.hoverColorIndex === String(index)) index = (index + 1) % colors.length;
        row.style.setProperty('--service-hover', 'var(--color-' + colors[index] + ')');
        row.dataset.hoverColorIndex = String(index);
        nextColor = (index + 1) % colors.length;
      };
      const activate = () => {
        rows.forEach(other => { if (other !== row) delete other.dataset.active; });
        changeColor();
        row.dataset.active = 'true';
      };
      row.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') activate(); });
      row.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') delete row.dataset.active; });
      row.addEventListener('click', activate);
      row.addEventListener('focusin', () => { if (!row.dataset.active) activate(); });
      row.addEventListener('focusout', () => { delete row.dataset.active; });
      if (!row.matches('a,button')) {
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.click(); }
        });
      }
    });
    const reveal = () => { section.dataset.visible = 'true'; };
    if (!('IntersectionObserver' in window)) { reveal(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { reveal(); observer.disconnect(); }
    }, { rootMargin: '0px 0px -18% 0px', threshold: .08 });
    observer.observe(section);
    section.addEventListener('focusin', reveal);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
