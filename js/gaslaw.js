/* =================================================================
   KELVIN — gaslaw.js
   Chapter 03 — Charles's-law chart: several gas lines of different
   slope (KelvinPhysics.charlesVolume), all extrapolating (dashed)
   to the same -273.15 °C intercept. A single control scales every
   slope at once — the intercept never moves. That shared intercept
   is the punchline of the chart.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch03');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#gaslaw-canvas');
  var scaleInput = root.querySelector('#gaslaw-scale');
  var scaleValue = root.querySelector('#gaslaw-scale-value');
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

  var COLORS = [cssVar('--cyan', '#6fd3e8'), cssVar('--brass-bright', '#e8c979'),
    cssVar('--brass', '#c9a14a'), cssVar('--parchment', '#c7c2b6')];
  var lineColor = cssVar('--line', 'rgba(240,236,227,.12)');
  var stoneColor = cssVar('--stone', '#8b8579');
  var ivoryColor = cssVar('--ivory', '#f0ece3');

  var BASE_SLOPES = [0.55, 0.85, 1.15, 1.5];
  var T_MIN = -300, T_MAX = 400, T_SOLID_FROM = -50, T_ZERO = Physics.ABS_ZERO_C;
  var MARGIN = { left: 20, right: 18, top: 18, bottom: 30 };

  function scaleFactor() {
    var v = scaleInput ? parseFloat(scaleInput.value) : 1;
    return isNaN(v) ? 1 : v;
  }

  function vMaxAcross(mult) {
    var maxV = 0;
    for (var i = 0; i < BASE_SLOPES.length; i++) {
      var v = Physics.charlesVolume(T_MAX, BASE_SLOPES[i] * mult);
      if (v > maxV) maxV = v;
    }
    return maxV * 1.1;
  }

  function draw() {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var mult = scaleFactor();
    if (scaleValue) scaleValue.textContent = '×' + mult.toFixed(2);

    var vMax = vMaxAcross(mult) || 1;
    var plotL = MARGIN.left, plotR = w - MARGIN.right;
    var plotT = MARGIN.top, plotB = h - MARGIN.bottom;

    function xPix(t) { return plotL + (t - T_MIN) / (T_MAX - T_MIN) * (plotR - plotL); }
    function yPix(v) { return plotB - (v / vMax) * (plotB - plotT); }

    ctx.fillStyle = cssVar('--ink', '#070a0e');
    ctx.fillRect(0, 0, w, h);

    // axis (V = 0 line) + intercept guide
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotL, yPix(0) + 0.5);
    ctx.lineTo(plotR, yPix(0) + 0.5);
    ctx.stroke();

    var xZero = xPix(T_ZERO);
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = ivoryColor;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(xZero + 0.5, plotT);
    ctx.lineTo(xZero + 0.5, plotB);
    ctx.stroke();
    ctx.restore();

    // tick labels
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stoneColor;
    ctx.textAlign = 'center';
    [-200, -100, 0, 100, 200, 300, 400].forEach(function (t) {
      ctx.fillText(String(t), xPix(t), plotB + 14);
    });

    // gas lines
    BASE_SLOPES.forEach(function (base, i) {
      var slope = base * mult;
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.lineWidth = 1.8;

      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(xPix(T_ZERO), yPix(0));
      ctx.lineTo(xPix(T_SOLID_FROM), yPix(Physics.charlesVolume(T_SOLID_FROM, slope)));
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(xPix(T_SOLID_FROM), yPix(Physics.charlesVolume(T_SOLID_FROM, slope)));
      ctx.lineTo(xPix(T_MAX), yPix(Physics.charlesVolume(T_MAX, slope)));
      ctx.stroke();
    });

    // shared intercept marker
    ctx.fillStyle = ivoryColor;
    ctx.beginPath();
    ctx.arc(xZero, yPix(0), 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = ivoryColor;
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    var labelX = Math.min(xZero + 6, plotR - 118);
    ctx.fillText('−273.15°C — every line', labelX, plotT + 12);
    ctx.fillText('meets here', labelX, plotT + 24);
  }

  if (scaleInput) {
    scaleInput.addEventListener('input', draw);
  }

  function init() { draw(); }
  function resize() { draw(); }
  function frame() { draw(); }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
