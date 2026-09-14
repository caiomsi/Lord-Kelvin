/* =================================================================
   KELVIN — thermometer.js
   Chapter 03 — the absolute thermometer: drag 0 K -> 10^8 K (log
   scale), live K/°C/°F readout, landmark temperatures, and a canvas
   of nitrogen molecules whose speed tracks KelvinPhysics.vRms and
   visibly stops at 0 K.

   The slider itself moves along a "position" domain 0..1000, mapped
   to temperature on a log curve (position<->temperature is a display
   mapping, not a physical formula, so it lives here rather than in
   physics.js — every genuine physical quantity below still comes
   from KelvinPhysics).
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch03');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#therm-canvas');
  var range = root.querySelector('#therm-range');
  var kOut = root.querySelector('#therm-k');
  var cOut = root.querySelector('#therm-c');
  var fOut = root.querySelector('#therm-f');
  var vOut = root.querySelector('#therm-vrms');
  var landmarkWrap = root.querySelector('#therm-landmarks');
  if (!canvas || !range) return;

  var state = Engine.setupCanvas(canvas);
  if (!state) return;

  // ---------------------------------------------------------------
  // Position <-> temperature log mapping. p=0 is an exact special
  // case for absolute zero; p in [1,1000] spans 10^-2 K .. 10^8 K.
  // ---------------------------------------------------------------
  var POS_MAX = 1000, LOG_MIN = -2, LOG_MAX = 8;

  function posToTemp(p) {
    p = Physics.clamp(p, 0, POS_MAX);
    if (p <= 0) return 0;
    var log10T = LOG_MIN + (LOG_MAX - LOG_MIN) * (p - 1) / (POS_MAX - 1);
    return Math.pow(10, log10T);
  }
  function tempToPos(T) {
    if (T <= 0) return 0;
    var log10T = Math.log(T) / Math.LN10;
    var p = 1 + (POS_MAX - 1) * (log10T - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.round(Physics.clamp(p, 0, POS_MAX));
  }

  var LANDMARKS = [
    { label: 'Absolute zero', short: '0 K', k: 0 },
    { label: 'Cosmic microwave background', short: 'CMB', k: 2.725 },
    { label: 'Helium boils', short: 'He boils', k: 4.2 },
    { label: 'Nitrogen boils', short: 'N₂ boils', k: 77 },
    { label: 'Coldest recorded on Earth', short: 'Coldest on Earth', k: 184 },
    { label: 'Water freezes', short: 'Water freezes', k: 273.15 },
    { label: 'Human body', short: 'Body heat', k: 310 },
    { label: 'Water boils', short: 'Water boils', k: 373.15 },
    { label: 'Iron melts', short: 'Iron melts', k: 1811 },
    { label: "Sun's surface", short: 'Sun’s surface', k: 5772 },
    { label: "Sun's core", short: 'Sun’s core', k: 1.57e7 }
  ];

  function fmt(v) {
    if (!isFinite(v)) return '—';
    var av = Math.abs(v);
    if (av >= 1e6) return v.toExponential(2);
    if (av >= 100) return v.toFixed(0);
    if (av >= 1) return v.toFixed(1);
    return v.toFixed(3);
  }

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = v && v.trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function hexToRgb(hex) {
    hex = (hex || '').replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    if (isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lerpColor(c1, c2, t) {
    t = Physics.clamp(t, 0, 1);
    var a = hexToRgb(c1), b = hexToRgb(c2);
    return 'rgb(' + Math.round(Physics.lerp(a[0], b[0], t)) + ',' +
      Math.round(Physics.lerp(a[1], b[1], t)) + ',' + Math.round(Physics.lerp(a[2], b[2], t)) + ')';
  }

  var colorCold = cssVar('--cyan', '#6fd3e8');
  var colorWarm = cssVar('--brass', '#e8c979');
  var inkColor = cssVar('--ink', '#070a0e');

  // ---------------------------------------------------------------
  // Molecule field — nitrogen, M = 0.028 kg/mol, same gas as the
  // vRms tests. Speed is sqrt-damped against a 300 K reference so
  // the full 0 K -> 10^8 K range stays legible in pixels; it still
  // reads exactly zero at T = 0.
  // ---------------------------------------------------------------
  var M = 0.028;
  var V_REF = Physics.vRms(300, M);
  var PARTICLE_COUNT = 60;
  var particles = [];
  var currentK = 300;

  function speedFactor(T) {
    if (T <= 0 || V_REF <= 0) return 0;
    var ratio = Physics.vRms(T, M) / V_REF;
    return Math.sqrt(Physics.clamp(ratio, 0, 1e6));
  }

  function seedParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var angle = Math.random() * Math.PI * 2;
      var mag = 12 + Math.random() * 22;
      particles.push({
        x: Math.random() * state.w,
        y: Math.random() * state.h,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        r: 1.1 + Math.random() * 1.5
      });
    }
  }

  function draw(dtSec) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var factor = speedFactor(currentK);
    ctx.fillStyle = inkColor;
    ctx.fillRect(0, 0, w, h);
    var col = lerpColor(colorCold, colorWarm, Math.min(1, factor / 3));
    ctx.fillStyle = col;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (dtSec > 0) {
        p.x += p.vx * factor * dtSec;
        p.y += p.vy * factor * dtSec;
        if (p.x < 0) { p.x = 0; p.vx *= -1; } else if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; } else if (p.y > h) { p.y = h; p.vy *= -1; }
      }
      ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, factor / 4 + 0.1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function updateReadouts(T) {
    if (kOut) kOut.textContent = fmt(T);
    if (cOut) cOut.textContent = fmt(Physics.kToC(T));
    if (fOut) fOut.textContent = fmt(Physics.kToF(T));
    if (vOut) vOut.textContent = fmt(Physics.vRms(T, M));
  }

  function setTemp(T) {
    currentK = Physics.clamp(T, 0, 1e8);
    if (range) range.value = String(tempToPos(currentK));
    updateReadouts(currentK);
    draw(0); // manual redraw so reduced-motion users see the change immediately
  }

  if (range) {
    range.addEventListener('input', function () {
      currentK = posToTemp(parseFloat(range.value));
      updateReadouts(currentK);
      draw(0);
    });
  }

  if (landmarkWrap) {
    var btns = landmarkWrap.querySelectorAll('[data-k]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var k = parseFloat(btn.getAttribute('data-k'));
          if (!isNaN(k)) setTemp(k);
        });
      })(btns[i]);
    }
  }

  function init() {
    seedParticles();
    currentK = posToTemp(parseFloat(range.value || '0'));
    updateReadouts(currentK);
  }
  function resize() {
    for (var i = 0; i < particles.length; i++) {
      particles[i].x = Math.min(particles[i].x, state.w);
      particles[i].y = Math.min(particles[i].y, state.h);
    }
    draw(0);
  }
  function frame(dt) {
    draw((dt || 0) / 1000);
  }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
