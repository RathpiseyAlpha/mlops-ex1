// A Figma-style canvas for [data-zoomable] frames.
//  - Drag any empty background to pan. Ctrl or Cmd with the wheel zooms around the pointer.
//  - Fit frames the whole diagram. Plus, minus, 0 and the arrow keys work when the frame has focus.
//  - The frame keeps one size whatever the zoom; only what is inside it moves and scales.
//  - Full screen shows only the frame (diagram and toolbar), not the rest of the page.
//  kind "stage": a fixed-width stage (the network) is moved and scaled with a CSS transform, so its layout and arrows stay intact.
//  kind "svg":   the SVG is moved and scaled the same way.
(() => {
  'use strict';
  const MIN = 0.25, MAX = 4, STEP = 1.2, KEEP = 80, TOP = 56; // TOP leaves room for the toolbar above the diagram
  document.querySelectorAll('[data-zoomable]').forEach(setup);

  function setup(vp) {
    const kind = vp.dataset.zoomable;
    const label = vp.dataset.zoomLabel || 'Diagram';
    const content = kind === 'svg' ? vp.querySelector(':scope > svg:not(.zoom-head-svg)') : vp.querySelector('.zoom-stage');
    content.classList.add('zoom-content');
    // An optional header SVG stays pinned to the top: it follows horizontal pan and zoom, but not vertical pan.
    const head = kind === 'svg' ? vp.querySelector(':scope > svg.zoom-head-svg') : null;
    let headWrap = null, headH = 0;
    if (head) {
      headWrap = document.createElement('div');
      headWrap.className = 'zoom-head-wrap';
      vp.insertBefore(headWrap, head);
      headWrap.append(head);
    }
    let z = 1, px = 0, py = 0, fitZ = 1, natW = 0, natH = 0, touched = false;

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
    const level = document.createElement('output');
    level.className = 'zoom-level';
    level.setAttribute('aria-live', 'polite');

    const bar = document.createElement('div');
    bar.className = 'zoom-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', label + ' controls');
    bar.append(
      button('zoom-out', 'Zoom out', () => zoomTo(z / STEP)),
      level,
      button('zoom-in', 'Zoom in', () => zoomTo(z * STEP)),
      button('fit', 'Fit the whole diagram', fit)
    );
    if (kind === 'stage') {
      bar.append(button('layout', 'Reset box positions', () => vp.querySelector('.network').dispatchEvent(new CustomEvent('resetlayout'))));
    }
    let fullBtn = null;
    if (document.fullscreenEnabled) {
      const sep = document.createElement('span');
      sep.className = 'zoom-sep';
      fullBtn = button('fullscreen', 'Enter full screen', toggleFull);
      bar.append(sep, fullBtn);
    }
    frame.append(bar);

    vp.tabIndex = 0;
    vp.setAttribute('role', 'group');
    vp.setAttribute('aria-label', label + '. Drag the background to move. Plus and minus zoom, zero fits, arrow keys move.');

    const isFull = () => document.fullscreenElement === frame;

    function paint() {
      content.style.transform = 'translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px) scale(' + z + ')';
      if (head) {
        head.style.transform = 'translate(' + Math.round(px) + 'px,' + TOP + 'px) scale(' + z + ')';
        headWrap.style.height = Math.round(TOP + headH * z) + 'px';
      }
      level.textContent = Math.round(z * 100) + '%';
    }

    // Keep part of the diagram in view so it cannot be lost off-screen.
    function clampPan() {
      const w = vp.clientWidth, h = vp.clientHeight;
      px = Math.min(w - KEEP, Math.max(KEEP - natW * z, px));
      const maxY = head ? TOP + headH * z : h - KEEP;
      py = Math.min(maxY, Math.max(KEEP - natH * z, py));
    }

    function layout() {
      const w = vp.clientWidth;
      if (!w) return;
      let frameH;
      if (kind === 'svg') {
        natW = Math.max(w, 720);
        const vb = content.viewBox.baseVal;
        natH = vb && vb.width ? natW * vb.height / vb.width : 600;
        content.style.width = natW + 'px';
        headH = 0;
        if (head) {
          const hv = head.viewBox.baseVal;
          headH = hv && hv.width ? natW * hv.height / hv.width : 0;
          head.style.width = natW + 'px';
        }
        frameH = isFull() ? window.innerHeight : Math.max(360, Math.min(TOP + headH + natH, window.innerHeight * 0.8));
        fitZ = 1;
      } else {
        content.style.width = w + 'px';
        natW = w;
        natH = content.offsetHeight;
        frameH = isFull() ? window.innerHeight : Math.max(480, Math.min(natH + TOP, window.innerHeight * 0.85));
        fitZ = Math.min(1, (frameH - TOP) / natH);
      }
      const h = Math.round(frameH) + 'px';
      if (vp.style.height !== h) vp.style.height = h;
      if (!touched) { z = fitZ; px = (w - natW * z) / 2; py = head ? TOP + headH * z : TOP; }
      clampPan();
      vp.classList.add('is-ready');
      paint();
    }

    function fit() { touched = false; layout(); }

    function zoomTo(next, ax, ay) {
      next = Math.min(MAX, Math.max(MIN, next));
      if (Math.abs(next - z) < 0.001) return;
      const f = next / z;
      const r = vp.getBoundingClientRect();
      const cx = ax == null ? vp.clientWidth / 2 : ax - r.left;
      const cy = ay == null ? vp.clientHeight / 2 : ay - r.top;
      px = cx - (cx - px) * f;
      py = cy - (cy - py) * f;
      z = next;
      touched = true;
      clampPan();
      paint();
    }

    function panBy(dx, dy) { px += dx; py += dy; touched = true; clampPan(); paint(); }

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
      touched = false;
      layout();
    });

    vp.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomTo(z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    }, { passive: false });

    vp.addEventListener('keydown', e => {
      if (e.target !== vp || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key, big = e.shiftKey ? 200 : 60;
      if (k === '+' || k === '=') zoomTo(z * STEP);
      else if (k === '-' || k === '_') zoomTo(z / STEP);
      else if (k === '0') fit();
      else if (k === 'ArrowLeft') panBy(big, 0);
      else if (k === 'ArrowRight') panBy(-big, 0);
      else if (k === 'ArrowUp') panBy(0, big);
      else if (k === 'ArrowDown') panBy(0, -big);
      else return;
      e.preventDefault();
    });

    // Drag any empty background to pan, as in Figma.
    let drag = null;
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.button !== 0 || e.target.closest('button, a, input, select, summary')) return;
      drag = { x: e.clientX, y: e.clientY, px, py };
      try { vp.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers have no capture */ }
      vp.classList.add('is-dragging');
    });
    vp.addEventListener('pointermove', e => {
      if (!drag) return;
      px = drag.px + (e.clientX - drag.x);
      py = drag.py + (e.clientY - drag.y);
      touched = true;
      clampPan();
      paint();
    });
    const endDrag = () => { drag = null; vp.classList.remove('is-dragging'); };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);

    // Re-lay out when the frame changes size or a hidden tab becomes visible.
    // Run on the next frame so a size change made by layout itself cannot loop inside the observer.
    let queued = false;
    const relayout = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; layout(); });
    };
    window.addEventListener('resize', relayout);
    const ro = new ResizeObserver(relayout);
    ro.observe(vp);
    if (kind === 'stage') ro.observe(content);
    layout();
  }
})();
