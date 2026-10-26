(() => {
  const init = () => document.querySelectorAll('[data-footer-module]').forEach(footer => {
    const container = footer.querySelector('.hw-footer__form');
    if (!container || container.dataset.initialized) return;
    container.dataset.initialized = 'true';
    // HubSpot inserts fields asynchronously. Preserve accessible labels while
    // matching the reference's placeholder presentation for text inputs only.
    const enhance = () => container.querySelectorAll('.hs-form-field').forEach(field => {
      const input = field.querySelector('input[type="text"], input[type="email"], input[type="tel"]');
      if (!input) return;
      const label = [...field.querySelectorAll('label')].find(label => input.id && label.htmlFor === input.id);
      if (!label || !label.textContent.trim()) return;
      if (!input.placeholder) input.placeholder = label.textContent.trim();
      label.classList.add('hw-footer__input-label');
    });
    enhance();
    new MutationObserver(enhance).observe(container, { childList: true, subtree: true });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
