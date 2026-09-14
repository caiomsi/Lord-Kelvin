/* =================================================================
   KELVIN — main.js
   Chapter rail active-state + scroll progress, scroll-reveal via
   IntersectionObserver, smooth anchor scrolling, and the hero
   particle field (speed driven by KelvinPhysics.vRms, freezing as
   the readout falls 300 K -> 0 K). Vanilla JS, no dependencies.
   Guarded — every DOM lookup checked so a missing section can
   never throw.
   ================================================================= */

(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var Engine = window.KelvinEngine || null;
  var Physics = window.KelvinPhysics || null;

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = v && v.trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function hexToRgb(hex) {
    hex = (hex || '').replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    if (isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function lerpColor(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    var a = hexToRgb(c1), b = hexToRgb(c2);
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* ---------------------------------------------------------------
     Chapter rail — scroll progress fill + active-tick tracking.
     --------------------------------------------------------------- */
  (function railSetup() {
    var rail = document.querySelector('.rail');
    if (!rail) return;

    var fill = document.getElementById('rail-fill');
    var ticks = rail.querySelectorAll('.rail-tick');
    var tickMap = {};
    for (var i = 0; i < ticks.length; i++) {
      var href = ticks[i].getAttribute('href');
      if (href) tickMap[href.replace('#', '')] = ticks[i];
    }

    function updateProgress() {
      if (!fill) return;
      var doc = document.documentElement;
      var scrollable = (doc.scrollHeight - doc.clientHeight) || 1;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var p = scrollTop / scrollable;
      p = Math.max(0, Math.min(1, p));
      fill.style.setProperty('--progress', p.toFixed(4));
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();

    var chapters = document.querySelectorAll('.chapter[data-chapter]');
    if (chapters.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          for (var key in tickMap) {
            if (tickMap.hasOwnProperty(key)) {
              tickMap[key].classList.toggle('active', key === id);
            }
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      chapters.forEach(function (ch) { io.observe(ch); });
    }
  })();

  /* ---------------------------------------------------------------
     Scroll reveal.
     --------------------------------------------------------------- */
  (function revealSetup() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    var reduced = Engine && Engine.reducedMotion ? Engine.reducedMotion() : false;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------
     Smooth in-page anchor scrolling (belt-and-suspenders alongside
     the CSS scroll-behavior:smooth — also closes the gap on browsers
     that ignore it, and keeps history in sync).
     --------------------------------------------------------------- */
  (function anchorSetup() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = null;
        try { target = document.querySelector(id); } catch (err) { target = null; }
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.history && history.pushState) history.pushState(null, '', id);
      });
    });
  })();

  /* ---------------------------------------------------------------
     Hero particle field — molecular speed tracks KelvinPhysics.vRms
     across a 300 K -> 0 K -> 300 K cycle; the live readout tracks
     the same clock. Registered with KelvinEngine so it lazily inits,
     runs only while the hero is on screen, and renders a single
     correct static frame under prefers-reduced-motion.
     --------------------------------------------------------------- */
  (function heroSetup() {
    var canvas = document.getElementById('hero-canvas');
    var valueEl = document.getElementById('hero-temp-value');
    if (!canvas || !Engine || !Physics || !Engine.setupCanvas) return;

    var state = Engine.setupCanvas(canvas);
    if (!state) return;

    var MOLAR_MASS = 0.028;              // N2, kg/mol — same gas as the vRms tests
    var V300 = Physics.vRms(300, MOLAR_MASS);
    var PARTICLE_COUNT = 70;
    var particles = [];
    var startTime = 0;

    var colorWarm = cssVar('--brass', '#c9a14a');
    var colorCold = cssVar('--cyan', '#6fd3e8');
    var inkColor = cssVar('--ink', '#070a0e');

    // Temperature schedule, in ms: hold at 300 K, cool to 0 K, hold
    // at 0 K (the "freeze"), warm back up, repeat.
    var HOLD_HOT = 2600, COOL = 7200, HOLD_COLD = 2200, WARM = 4200;
    var PERIOD = HOLD_HOT + COOL + HOLD_COLD + WARM;

    function smoothstep(f) { return f * f * (3 - 2 * f); }

    function temperatureAt(elapsedMs) {
      var t = elapsedMs % PERIOD;
      if (t < HOLD_HOT) return 300;
      t -= HOLD_HOT;
      if (t < COOL) return 300 * (1 - smoothstep(t / COOL));
      t -= COOL;
      if (t < HOLD_COLD) return 0;
      t -= HOLD_COLD;
      return 300 * smoothstep(Math.min(1, t / WARM));
    }

    function now() {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function seedParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var angle = Math.random() * Math.PI * 2;
        var mag = 18 + Math.random() * 26;
        particles.push({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          r: 1 + Math.random() * 1.6
        });
      }
    }

    function init() {
      seedParticles();
      startTime = now();
    }

    function resize() {
      // Keep existing particles inside the (possibly new) bounds —
      // frame() also re-clamps every tick, so this is just a tidy-up.
      for (var i = 0; i < particles.length; i++) {
        particles[i].x = Math.min(particles[i].x, state.w);
        particles[i].y = Math.min(particles[i].y, state.h);
      }
    }

    function frame(dt) {
      var elapsed = now() - startTime;
      var T = temperatureAt(elapsed);
      var speedScale = V300 > 0 ? (Physics.vRms(T, MOLAR_MASS) / V300) : 0;

      var ctx = state.ctx, w = state.w, h = state.h;
      ctx.fillStyle = inkColor;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = lerpColor(colorCold, colorWarm, speedScale);
      var dtSec = (dt || 16.67) / 1000;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx * speedScale * dtSec;
        p.y += p.vy * speedScale * dtSec;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > h) { p.y = h; p.vy *= -1; }

        ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, speedScale + 0.15);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (valueEl) valueEl.textContent = T.toFixed(1);
    }

    Engine.register(canvas, { init: init, frame: frame, resize: resize });
  })();

})();
