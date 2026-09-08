(() => {
  'use strict';

  const layer = document.getElementById('hotspotLayer');
  const actionSelect = document.getElementById('actionSelect');
  const scale = document.getElementById('overlayScale');
  const scaleRow = document.getElementById('overlayScaleRow');

  if (!layer || !actionSelect) return;

  // The original builder creates a new hotspot as "popup".
  // Convert newly-created hotspots to area replacement automatically.
  const forceAreaModeForNewHotspot = () => {
    if (actionSelect.disabled) return;
    if (actionSelect.value === 'popup') {
      actionSelect.value = 'overlay';
      actionSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (scale) {
      scale.value = '100';
      scale.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const observer = new MutationObserver(() => {
    queueMicrotask(forceAreaModeForNewHotspot);
  });

  observer.observe(layer, { childList: true });

  // Keep area replacement exactly inside the dragged rectangle.
  if (scaleRow) scaleRow.style.display = 'none';
  if (scale) {
    scale.min = '100';
    scale.max = '100';
    scale.value = '100';
  }

  // When a user selects an existing hotspot in Edit mode, keep 100% scale.
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('.hotspot')) return;
    queueMicrotask(() => {
      if (scale && !scale.disabled) {
        scale.value = '100';
        scale.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
})();
