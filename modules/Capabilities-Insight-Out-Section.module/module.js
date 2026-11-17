(function () {
  function init() {
    document.querySelectorAll('.hw-cap-approach:not([data-motion-init])').forEach(function (section) {
      section.dataset.motionInit = 'true';
      var intro = section.querySelector('[data-reveal]');
      var steps = Array.prototype.slice.call(section.querySelectorAll('[data-step-reveal]'));
      var timeline = section.querySelector('.hw-cap-approach__timeline');
      var animatedItems = steps;
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
      function updateTimelineLineHeight() {
        if (!timeline || !steps.length) return;
        var lastStep = steps[steps.length - 1];
        var marker = lastStep.querySelector('.hw-cap-approach__marker');
        if (!marker) return;
        var markerCenter = lastStep.offsetTop + marker.offsetTop + (marker.offsetHeight / 2);
        timeline.style.setProperty('--timeline-line-height', Math.max(0, markerCenter - 6) + 'px');
      }

      updateTimelineLineHeight();
      window.addEventListener('resize', updateTimelineLineHeight);

      if (section.dataset.animate !== 'true' || reduced || !('IntersectionObserver' in window)) {
        if (intro) intro.classList.add('is-visible');
        animatedItems.forEach(function (item) { item.classList.add('is-visible'); });
        if (timeline) timeline.style.setProperty('--timeline-progress', '1');
        return;
      }

      section.classList.add('hw-cap-approach--motion-ready');
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          var stepIndex = steps.indexOf(entry.target);
          if (stepIndex !== -1 && timeline) {
            window.setTimeout(function () {
              timeline.style.setProperty('--timeline-progress', ((stepIndex + 1) / steps.length).toString());
            }, stepIndex * 180);
          }
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });

      if (intro) observer.observe(intro);
      animatedItems.forEach(function (item, index) {
        item.style.setProperty('--step-delay', (index * 180) + 'ms');
        observer.observe(item);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
