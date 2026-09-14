/* =================================================================
   KELVIN — engine.js
   Shared runtime for every interactive chapter module: canvas setup
   (DPR-aware, resize-aware), a single shared requestAnimationFrame
   loop that only ticks modules currently on screen, and the
   prefers-reduced-motion contract every chapter module follows.

   Vanilla JS, no dependencies. Guarded IIFE — never throws even if
   a section or canvas is missing. Attaches window.KelvinEngine.
   ================================================================= */

(function (root) {
  'use strict';

  if (!root || typeof root.document === 'undefined') return;

  var doc = root.document;

  // ---------------------------------------------------------------
  // Reduced motion
  // ---------------------------------------------------------------
  var _rmQuery = null;
  function reducedMotion() {
    try {
      if (!root.matchMedia) return false;
      if (!_rmQuery) _rmQuery = root.matchMedia('(prefers-reduced-motion: reduce)');
      return !!(_rmQuery && _rmQuery.matches);
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Canvas setup — DPR capped at 2, sized to its container, refits
  // on resize. Returns a persistent state object; consumers should
  // read state.w / state.h fresh each frame rather than caching them,
  // since a resize mutates this same object in place.
  // ---------------------------------------------------------------
  function setupCanvas(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var container = canvas.parentElement || canvas;
    var state = { canvas: canvas, ctx: ctx, w: 0, h: 0, dpr: 1, onFit: null };

    function fit() {
      var rect = container.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
      var dpr = Math.min(2, root.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch (e) { /* older browsers */ }
      state.w = w; state.h = h; state.dpr = dpr;

      /* Resizing a canvas clears it. The ResizeObserver below fires
         its first callback AFTER init has already drawn, so without
         this hook that initial frame is silently wiped and — for a
         module with no rAF loop, or under reduced motion — never
         comes back. Modules that draw on demand set stage.onFit. */
      if (typeof state.onFit === 'function') {
        try { state.onFit(); } catch (e) { /* ignore */ }
      }
    }

    fit();
    state.refit = fit;

    if ('ResizeObserver' in root) {
      try {
        var ro = new root.ResizeObserver(function () { fit(); });
        ro.observe(container);
        state._resizeObserver = ro;
      } catch (e) {
        root.addEventListener('resize', fit, { passive: true });
      }
    } else {
      root.addEventListener('resize', fit, { passive: true });
    }

    return state;
  }

  // ---------------------------------------------------------------
  // Shared rAF loop + lazy, visibility-gated module registration.
  //
  // register(el, { init, frame, resize }):
  //   - init()   called once, the first time `el` nears the viewport.
  //   - frame(dt) called every animation frame while `el` is on
  //               screen; NEVER called while off-screen (mandatory —
  //               there are ~12 canvases on this page).
  //   - resize()  called once right after init, and again whenever
  //               the window resizes (after init has happened).
  //
  // With prefers-reduced-motion, no continuous loop ever starts:
  // frame() is invoked exactly once (dt=0) right after init, so every
  // module still renders a single correct static frame.
  // ---------------------------------------------------------------
  var modules = [];
  var loopHandle = null;
  var lastTime = 0;
  var rm = reducedMotion();

  function tickAll(now) {
    loopHandle = root.requestAnimationFrame(tickAll);
    var dt = lastTime ? (now - lastTime) : 16.67;
    if (dt > 100) dt = 100; // clamp huge gaps (tab switch, devtools pause)
    lastTime = now;
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      if (m.active && m.inited && m.frame) {
        try { m.frame(dt); } catch (e) { /* one bad module shouldn't kill the loop */ }
      }
    }
  }

  function ensureLoop() {
    if (loopHandle !== null || rm) return;
    if (!root.requestAnimationFrame) return;
    loopHandle = root.requestAnimationFrame(tickAll);
  }

  function register(el, opts) {
    if (!el || !opts) return null;
    var mod = {
      el: el,
      init: typeof opts.init === 'function' ? opts.init : null,
      frame: typeof opts.frame === 'function' ? opts.frame : null,
      resize: typeof opts.resize === 'function' ? opts.resize : null,
      inited: false,
      active: false
    };
    modules.push(mod);

    function activate() {
      if (!mod.inited) {
        mod.inited = true;
        try { if (mod.init) mod.init(); } catch (e) { /* ignore */ }
        try { if (mod.resize) mod.resize(); } catch (e) { /* ignore */ }
        if (rm) {
          // reduced motion: one correct static frame, never a loop
          try { if (mod.frame) mod.frame(0); } catch (e) { /* ignore */ }
        }
      }
      mod.active = true;
      if (!rm) ensureLoop();
    }
    function deactivate() {
      mod.active = false;
    }

    if ('IntersectionObserver' in root) {
      try {
        var io = new root.IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) activate();
            else deactivate();
          });
        }, { rootMargin: '250px 0px 250px 0px', threshold: 0.01 });
        io.observe(el);
        mod._io = io;
      } catch (e) {
        activate();
      }
    } else {
      // No IntersectionObserver support: fall back to always-on.
      activate();
    }

    if (mod.resize) {
      root.addEventListener('resize', function () {
        if (mod.inited) {
          try { mod.resize(); } catch (e) { /* ignore */ }
        }
      }, { passive: true });
    }

    return mod;
  }

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function onVisible(el, cb, opts) {
    if (!el || typeof cb !== 'function') return null;
    if (!('IntersectionObserver' in root)) { cb(); return null; }
    var io = new root.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) cb(entry);
      });
    }, opts || { threshold: 0.15 });
    io.observe(el);
    return io;
  }

  function raf(cb) {
    if (root.requestAnimationFrame) return root.requestAnimationFrame(cb);
    return root.setTimeout(cb, 16);
  }

  root.KelvinEngine = {
    reducedMotion: reducedMotion,
    setupCanvas: setupCanvas,
    register: register,
    onVisible: onVisible,
    raf: raf
  };

})(typeof window !== 'undefined' ? window : this);
