/* =================================================================
   KELVIN — joulethomson.js
   Chapter 05 — porous-plug throttling: nitrogen (N2) modelled as a
   van der Waals gas (a = 0.1408 Pa·m^6/mol^2, b = 3.913e-5 m^3/mol,
   Cp ~= 29.1 J/(mol·K)). A temperature slider drives
   KelvinPhysics.jouleThomsonCoefficient / inversionTemperature so
   the sign of DeltaT genuinely flips at the inversion temperature —
   particles visibly slow (cooling) or speed up (heating) as they
   cross the plug, matching the displayed COOLING / HEATING state.

   Particle motion is a stylized, visually-amplified read of the true
   (tiny, real-units) DeltaT so the effect is legible on a canvas —
   see VISUAL_GAIN below. The displayed numbers are never amplified;
   they come straight from physics.js.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch05');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#jt-canvas');
  var tempInput = root.querySelector('#jt-temp');
  var tempValue = root.querySelector('#jt-temp-value');
  var dtOut = root.querySelector('#jt-dt');
  var stateOut = root.querySelector('#jt-state');
  var tinvOuts = root.querySelectorAll('.jt-tinv-out');
  if (!canvas) return;

  var state = Engine.setupCanvas(canvas);
  if (!state) return;

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = v && v.trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  var cyan = cssVar('--cyan', '#6fd3e8');
  var ember = cssVar('--ember', '#d9673f');
  var ivory = cssVar('--ivory', '#f0ece3');
  var stone = cssVar('--stone', '#8b8579');
  var ink = cssVar('--ink', '#070a0e');
  var line = cssVar('--line', 'rgba(240,236,227,.12)');
  var inkSurface = cssVar('--ink-surface', '#141b24');

  // Nitrogen, van der Waals constants (SI).
  var A = 0.1408, B = 3.913e-5, CP = 29.1;
  var TINV = Physics.inversionTemperature(A, B);
  var DELTA_P = 5e6; // Pa — representative throttle-valve pressure drop (illustrative)
  var VISUAL_GAIN = 18; // amplifies the (real but tiny) DeltaT/T ratio for legible motion

  var PARTICLE_COUNT = 46;
  var particles = [];
  var BASE_VX = 70;

  function computeDT(T) {
    var mu = Physics.jouleThomsonCoefficient(T, A, B, CP);
    return mu * (-DELTA_P);
  }

  function seed(w, h) {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: (Math.random() - 0.5) * 14,
        crossed: false
      });
    }
  }

  function draw(dtSec) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var T = tempInput ? parseFloat(tempInput.value) : 300;
    if (isNaN(T)) T = 300;
    var dT = computeDT(T);
    var cooling = dT < -1e-9, heating = dT > 1e-9;

    if (tempValue) tempValue.textContent = T.toFixed(0) + ' K';
    if (dtOut) dtOut.textContent = (dT >= 0 ? '+' : '') + dT.toFixed(2);
    if (tinvOuts && tinvOuts.length) {
      for (var ti = 0; ti < tinvOuts.length; ti++) tinvOuts[ti].textContent = TINV.toFixed(0);
    }
    if (stateOut) {
      stateOut.textContent = cooling ? 'COOLING' : heating ? 'HEATING' : 'NO CHANGE';
      stateOut.classList.toggle('jt-cooling', cooling);
      stateOut.classList.toggle('jt-heating', heating);
    }

    var plugX = w * 0.52;
    var mult = 1 + Physics.clamp((dT / Math.max(1, T)) * VISUAL_GAIN, -0.75, 0.75);

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    // chambers
    ctx.fillStyle = 'rgba(240,236,227,.03)';
    ctx.fillRect(0, 0, plugX, h);

    // plug
    ctx.strokeStyle = ivory;
    ctx.lineWidth = 1;
    ctx.save();
    ctx.globalAlpha = 0.8;
    var plugW = Math.max(10, w * 0.02);
    ctx.fillStyle = inkSurface;
    ctx.fillRect(plugX - plugW / 2, 0, plugW, h);
    ctx.strokeRect(plugX - plugW / 2, 0, plugW, h);
    ctx.fillStyle = stone;
    for (var gy = 6; gy < h; gy += 12) {
      ctx.beginPath();
      ctx.arc(plugX, gy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.fillText('HIGH PRESSURE', 10, 14);
    ctx.textAlign = 'right';
    ctx.fillText('LOW PRESSURE', w - 10, 14);
    ctx.textAlign = 'left';

    var dotColor = cooling ? cyan : heating ? ember : ivory;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (dtSec > 0) {
        var vx = p.crossed ? BASE_VX * mult : BASE_VX;
        p.x += vx * dtSec;
        p.y += p.vy * dtSec;
        if (!p.crossed && p.x >= plugX) {
          p.crossed = true;
          p.vy *= 1.3;
        }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > h) { p.y = h; p.vy *= -1; }
        if (p.x > w) { p.x = -4; p.crossed = false; p.y = Math.random() * h; p.vy = (Math.random() - 0.5) * 14; }
      }
      ctx.fillStyle = p.crossed ? dotColor : ivory;
      ctx.globalAlpha = p.crossed ? 0.9 : 0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (tempInput) {
    tempInput.addEventListener('input', function () { draw(0); });
  }

  function init() { seed(state.w, state.h); draw(0); }
  function resize() { draw(0); }
  function frame(dt) { draw((dt || 0) / 1000); }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
