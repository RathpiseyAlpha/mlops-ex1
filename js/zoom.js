// Zoom, pan and full screen for [data-zoomable] viewports.
//  kind "svg":   the SVG width is scaled, the viewport scrolls.
//  kind "stage": a fixed-width stage is scaled with a CSS transform, so the network layout and its arrows stay intact.
// The frame keeps one size whatever the zoom; zooming changes what is inside it.
// At 100% the diagram fits the frame width. Ctrl or Cmd with the wheel zooms around the pointer; dragging pans.
// Full screen shows only the frame (diagram and its toolbar), not the rest of the page.
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
    let z = 1;

    const frame = document.createElement('div');
    frame.className = 'zoom-frame';
    vp.parentNode.insertBefore(frame, vp);
    frame.append(vp);

    const button = (icon, name, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn zoom-btn';
      b.dataset.icon = icon;
      b.title = name;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', onClick);
      return b;
    };
    const sep = () => Object.assign(document.createElement('span'), { className: 'zoom-sep' });
    const level = document.createElement('output');
    level.className = 'zoom-level';
    level.setAttribute('aria-live', 'polite');

    const bar = document.createElement('div');
    bar.className = 'zoom-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', label + ' controls');
    bar.append(
      button('zoom-out', 'Zoom out', () => set(z / STEP)),
      level,
      button('zoom-in', 'Zoom in', () => set(z * STEP)),
      button('fit', 'Fit to width', () => set(1, null, null, true))
    );
    if (kind === 'stage') {
      bar.append(button('layout', 'Reset box positions', () => vp.querySelector('.network').dispatchEvent(new CustomEvent('resetlayout'))));
    }
    let fullBtn = null;
    if (document.fullscreenEnabled) {
      bar.append(sep());
      fullBtn = button('fullscreen', 'Enter full screen', toggleFull);
      bar.append(fullBtn);
    }
    frame.append(bar);

    vp.tabIndex = 0;
    vp.setAttribute('role', 'group');
    vp.setAttribute('aria-label', label + '. Press plus or minus to zoom, zero to fit.');

    const isFull = () => document.fullscreenElement === frame;

    // The frame keeps one size whatever the zoom. Zooming only changes what is inside it.
    function setFrame(h) {
      const px = Math.round(h) + 'px';
      if (vp.style.height !== px) vp.style.height = px;
    }

    function apply() {
      const w = vp.clientWidth;
      if (!w) return;
      if (kind === 'svg') {
        const base = Math.max(w, 720);
        const vb = svg.viewBox.baseVal;
        const natural = vb && vb.width ? base * vb.height / vb.width : 600;
        setFrame(isFull() ? window.innerHeight : Math.max(360, Math.min(natural, window.innerHeight * 0.8)));
        svg.style.width = Math.round(base * z) + 'px';
      } else {
        stage.style.width = w + 'px';
        stage.style.transform = 'scale(' + z + ')';
        setFrame(isFull() ? window.innerHeight : stage.offsetHeight);
        sizer.style.width = Math.round(w * z) + 'px';
        sizer.style.height = Math.round(stage.offsetHeight * z) + 'px';
        vp.classList.add('is-ready');
      }
      level.textContent = Math.round(z * 100) + '%';
      vp.classList.toggle('is-pannable', vp.scrollWidth > vp.clientWidth + 1 || vp.scrollHeight > vp.clientHeight + 1);
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
      else frame.requestFullscreen().catch(() => {});
    }
    document.addEventListener('fullscreenchange', () => {
      if (!fullBtn) return;
      const on = isFull();
      fullBtn.dataset.icon = on ? 'exit-fullscreen' : 'fullscreen';
      fullBtn.title = on ? 'Exit full screen' : 'Enter full screen';
      fullBtn.setAttribute('aria-label', fullBtn.title);
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
      if (vp.scrollWidth <= vp.clientWidth + 1 && vp.scrollHeight <= vp.clientHeight + 1) return;
      drag = { x: e.clientX, y: e.clientY, l: vp.scrollLeft, t: vp.scrollTop };
      vp.setPointerCapture(e.pointerId);
      vp.classList.add('is-dragging');
    });
    vp.addEventListener('pointermove', e => {
      if (!drag) return;
      vp.scrollLeft = drag.l - (e.clientX - drag.x);
      vp.scrollTop = drag.t - (e.clientY - drag.y);
    });
    const endDrag = () => { drag = null; vp.classList.remove('is-dragging'); };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);

    // Re-fit when the frame changes size or a hidden tab becomes visible.
    window.addEventListener('resize', apply);
    const ro = new ResizeObserver(apply);
    ro.observe(vp);
    if (stage) ro.observe(stage);
    apply();
  }
})();
