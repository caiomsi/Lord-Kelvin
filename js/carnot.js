/* =================================================================
   KELVIN — carnot.js
   Chapter 04 — Carnot engine: drag T_hot / T_cold, live
   η = 1 − Tc/Th (KelvinPhysics.carnotEfficiency) as a big readout,
   with energy-flow arrows (hot reservoir -> engine -> work + cold
   reservoir) whose widths respond to η. The point made explicit:
   η -> 1 only as Tc -> 0 K, which chapter 03 showed is unreachable.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch04');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#carnot-canvas');
  var thInput = root.querySelector('#carnot-th');
  var tcInput = root.querySelector('#carnot-tc');
  var thValue = root.querySelector('#carnot-th-value');
  var tcValue = root.querySelector('#carnot-tc-value');
  var etaOut = root.querySelector('#carnot-eta');
  var warn = root.querySelector('#carnot-warn');
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
  var accent = cssVar('--cyan', '#6fd3e8');
  var brass = cssVar('--brass', '#c9a14a');
  var brassBright = cssVar('--brass-bright', '#e8c979');
  var ivory = cssVar('--ivory', '#f0ece3');
  var stone = cssVar('--stone', '#8b8579');
  var ink = cssVar('--ink', '#070a0e');
  var inkSurface = cssVar('--ink-surface', '#141b24');

  var phase = 0;

  function readTemps() {
    var th = thInput ? parseFloat(thInput.value) : 600;
    var tc = tcInput ? parseFloat(tcInput.value) : 300;
    if (isNaN(th)) th = 600;
    if (isNaN(tc)) tc = 300;
    return { th: th, tc: tc };
  }

  function drawArrow(ctx, x1, y1, x2, y2, thickness, color, alpha) {
    thickness = Math.max(1.5, thickness);
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    var ang = Math.atan2(y2 - y1, x2 - x1);
    var headLen = 6 + thickness * 0.9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI / 7), y2 - headLen * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI / 7), y2 - headLen * Math.sin(ang + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function flowDots(ctx, x1, y1, x2, y2, count, color, ph) {
    for (var i = 0; i < count; i++) {
      var t = ((i / count) + ph) % 1;
      var x = Physics.lerp(x1, x2, t), y = Physics.lerp(y1, y2, t);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw(dtSec) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var T = readTemps();
    var eta = Physics.carnotEfficiency(T.th, T.tc);

    if (thValue) thValue.textContent = T.th.toFixed(0) + ' K';
    if (tcValue) tcValue.textContent = T.tc.toFixed(0) + ' K';
    if (etaOut) etaOut.textContent = (eta * 100).toFixed(1);
    if (warn) warn.hidden = T.tc < T.th;

    phase = (phase + dtSec * 0.35) % 1;

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    var boxW = w * 0.16, boxH = h * 0.42;
    var hotX = w * 0.06, coldX = w * 0.94 - boxW;
    var boxY = h * 0.5 - boxH / 2;
    var engineCx = w * 0.5, engineCy = h * 0.5, engineR = Math.min(w, h) * 0.13;

    // reservoirs
    ctx.fillStyle = inkSurface;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.fillRect(hotX, boxY, boxW, boxH);
    ctx.strokeRect(hotX, boxY, boxW, boxH);
    ctx.fillRect(coldX, boxY, boxW, boxH);
    ctx.strokeStyle = brass;
    ctx.strokeRect(coldX, boxY, boxW, boxH);

    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = ivory;
    ctx.fillText('HOT', hotX + boxW / 2, boxY - 10);
    ctx.fillText(T.th.toFixed(0) + ' K', hotX + boxW / 2, boxY + boxH / 2 + 4);
    ctx.fillText('COLD', coldX + boxW / 2, boxY - 10);
    ctx.fillText(T.tc.toFixed(0) + ' K', coldX + boxW / 2, boxY + boxH / 2 + 4);

    // flows: Qh (hot -> engine), W (engine -> up), Qc (engine -> cold)
    var maxThick = Math.min(24, engineR * 1.1);
    var qhThick = maxThick;
    var wThick = maxThick * eta;
    var qcThick = maxThick * (1 - eta);

    drawArrow(ctx, hotX + boxW + 4, engineCy, engineCx - engineR - 4, engineCy, qhThick, accent);
    flowDots(ctx, hotX + boxW + 4, engineCy, engineCx - engineR - 4, engineCy, 5, accent, phase);

    drawArrow(ctx, engineCx + engineR + 4, engineCy, coldX - 4, engineCy, qcThick, brass, 0.9);
    flowDots(ctx, engineCx + engineR + 4, engineCy, coldX - 4, engineCy, 5, brass, phase);

    var workY = boxY - 34;
    drawArrow(ctx, engineCx, engineCy - engineR - 2, engineCx, Math.max(14, workY), wThick, brassBright);
    flowDots(ctx, engineCx, engineCy - engineR - 2, engineCx, Math.max(14, workY), 4, brassBright, phase);

    // engine
    ctx.fillStyle = inkSurface;
    ctx.strokeStyle = ivory;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(engineCx, engineCy, engineR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ivory;
    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('ENGINE', engineCx, engineCy + 4);

    ctx.fillStyle = stone;
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('Qh', hotX + boxW + (engineCx - engineR - hotX - boxW) / 2, engineCy - qhThick / 2 - 6);
    ctx.fillText('Qc', engineCx + engineR + (coldX - engineCx - engineR) / 2, engineCy - qcThick / 2 - 6);
    ctx.fillText('W', engineCx + 14, (engineCy - engineR + Math.max(14, workY)) / 2);
    ctx.textAlign = 'left';
  }

  [thInput, tcInput].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', function () { draw(0); });
  });

  function init() { draw(0); }
  function resize() { draw(0); }
  function frame(dt) { draw((dt || 0) / 1000); }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
