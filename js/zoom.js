// Zoom, pan and full screen for [data-zoomable] viewports.
//  kind "svg":   the SVG width is scaled, the viewport scrolls.
//  kind "stage": a fixed-width stage is scaled with a CSS transform, so the network layout and its arrows stay intact.
// At 100% the diagram fits the viewport width. Ctrl or Cmd with the wheel zooms around the pointer; dragging pans.
(() => {
  'use strict';
  const MIN = 0.4, MAX = 3, STEP = 1.2;
  document.querySelectorAll('[data-zoomable]').forEach(setup);

  function setup(vp) {
    const kind = vp.dataset.zoomable;
    const label = vp.dataset.zoomLabel || 'Diagram';
    const sizer = vp.querySelector('.zoom-sizer');
    const stage = vp.querySelector('.zoom-stage');
    const svg = vp.querySelector(':scope > svg');
    const target = vp.closest('[role=tabpanel]');
    let z = 1;

    const button = (text, name, onClick, cls = '') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn zoom-btn ' + cls;
      b.textContent = text;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', onClick);
      return b;
    };
    const level = document.createElement('output');
    level.className = 'zoom-level';
    level.setAttribute('aria-live', 'polite');
    const hint = document.createElement('span');
    hint.className = 'zoom-hint';
    hint.textContent = 'Ctrl and scroll to zoom. Drag to move.';

    const bar = document.createElement('div');
    bar.className = 'zoom-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', label + ' zoom');
    bar.append(
      button('−', 'Zoom out', () => set(z / STEP)),
      level,
      button('+', 'Zoom in', () => set(z * STEP)),
      button('Fit', 'Fit to width', () => set(1, null, null, true)),
      hint
    );
    let fullBtn = null;
    if (target && document.fullscreenEnabled) {
      fullBtn = button('Full screen', 'Enter full screen', toggleFull, 'zoom-full');
      bar.append(fullBtn);
    }
    vp.before(bar);

    vp.tabIndex = 0;
    vp.setAttribute('role', 'group');
    vp.setAttribute('aria-label', label + '. Press plus or minus to zoom, zero to fit.');

    function apply() {
      const w = vp.clientWidth;
      if (!w) return;
      if (kind === 'svg') {
        svg.style.width = Math.round(Math.max(w, 720) * z) + 'px';
      } else {
        stage.style.width = w + 'px';
        stage.style.transform = 'scale(' + z + ')';
        sizer.style.width = Math.round(w * z) + 'px';
        sizer.style.height = Math.round(stage.offsetHeight * z) + 'px';
        vp.classList.add('is-ready');
      }
      level.textContent = Math.round(z * 100) + '%';
      vp.classList.toggle('is-pannable', vp.scrollWidth > vp.clientWidth + 1);
    }

    function set(next, ax, ay, reset) {
      next = Math.min(MAX, Math.max(MIN, next));
      if (Math.abs(next - z) < 0.001 && !reset) return;
      const f = next / z;
      const r = vp.getBoundingClientRect();
      const cx = ax == null ? vp.clientWidth / 2 : ax - r.left;
      const cy = ay == null ? vp.clientHeight / 2 : ay - r.top;
      const sl = vp.scrollLeft, st = vp.scrollTop;
      z = next;
      apply();
      if (reset) { vp.scrollLeft = 0; vp.scrollTop = 0; }
      else { vp.scrollLeft = (sl + cx) * f - cx; vp.scrollTop = (st + cy) * f - cy; }
    }

    function toggleFull() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else target.requestFullscreen().catch(() => {});
    }
    document.addEventListener('fullscreenchange', () => {
      if (!fullBtn) return;
      const on = document.fullscreenElement === target;
      fullBtn.textContent = on ? 'Exit full screen' : 'Full screen';
      fullBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Enter full screen');
      apply();
    });

    vp.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      set(z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    }, { passive: false });

    vp.addEventListener('keydown', e => {
      if (e.target !== vp || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); set(z * STEP); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); set(z / STEP); }
      else if (e.key === '0') { e.preventDefault(); set(1, null, null, true); }
    });

    let drag = null;
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, a, input, select, summary')) return;
      if (vp.scrollWidth <= vp.clientWidth + 1) return;
      drag = { x: e.clientX, l: vp.scrollLeft };
      vp.setPointerCapture(e.pointerId);
      vp.classList.add('is-dragging');
    });
    vp.addEventListener('pointermove', e => { if (drag) vp.scrollLeft = drag.l - (e.clientX - drag.x); });
    const endDrag = () => { drag = null; vp.classList.remove('is-dragging'); };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);

    // Re-fit when the viewport changes size or a hidden tab becomes visible.
    const ro = new ResizeObserver(apply);
    ro.observe(vp);
    if (stage) ro.observe(stage);
    apply();
  }
})();
