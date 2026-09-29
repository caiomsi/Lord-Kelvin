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
  var root = document.getElementById('carnot-lab');
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
  /* Hot is drawn warm and cold is drawn cold — the first version had
     them the other way round, which fought every reader's intuition. */
  var hotColor = cssVar('--ember', '#d9673f');
  var coldColor = cssVar('--cyan', '#6fd3e8');
  var parchment = cssVar('--parchment', '#c7c2b6');
  var brassBright = cssVar('--brass-bright', '#e8c979');
  var ivory = cssVar('--ivory', '#f0ece3');
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

    var F = function (scale, weight) { return Engine.font(state, scale, weight); };
    /* phones: shorter words, labels under the arrows instead of over them */
    var narrow = w < 560;
    var workPct = Math.round(eta * 100);
    var wastePct = 100 - workPct;

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    var boxW = w * 0.17, boxH = h * 0.40;
    var hotX = w * 0.05, coldX = w * 0.95 - boxW;
    var boxY = h * 0.54 - boxH / 2;
    var engineCx = w * 0.5, engineCy = h * 0.54, engineR = Math.min(w * 0.11, h * 0.2);

    // reservoirs
    ctx.lineWidth = 2;
    ctx.fillStyle = inkSurface;
    ctx.fillRect(hotX, boxY, boxW, boxH);
    ctx.strokeStyle = hotColor;
    ctx.strokeRect(hotX, boxY, boxW, boxH);
    ctx.fillRect(coldX, boxY, boxW, boxH);
    ctx.strokeStyle = coldColor;
    ctx.strokeRect(coldX, boxY, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = F(0.95, 600);
    ctx.fillStyle = hotColor;
    ctx.fillText(narrow ? 'HOT' : 'HOT SIDE', hotX + boxW / 2, boxY - 12);
    ctx.fillStyle = coldColor;
    ctx.fillText(narrow ? 'COLD' : 'COLD SIDE', coldX + boxW / 2, boxY - 12);
    ctx.font = F(narrow ? 0.95 : 1.35, 600);
    ctx.fillStyle = ivory;
    ctx.fillText(T.th.toFixed(0) + ' K', hotX + boxW / 2, boxY + boxH / 2 + 8);
    ctx.fillText(T.tc.toFixed(0) + ' K', coldX + boxW / 2, boxY + boxH / 2 + 8);

    // flows: heat in (hot -> engine), useful work (engine -> up), wasted heat (engine -> cold)
    var maxThick = Math.min(30, engineR * 0.9);
    var qhThick = maxThick;
    var wThick = maxThick * eta;
    var qcThick = maxThick * (1 - eta);
    var workTop = Math.max(Engine.textPx(state, 1) * (narrow ? 2.2 : 1.4), boxY - h * 0.2);

    drawArrow(ctx, hotX + boxW + 6, engineCy, engineCx - engineR - 6, engineCy, qhThick, hotColor);
    flowDots(ctx, hotX + boxW + 6, engineCy, engineCx - engineR - 6, engineCy, 6, ivory, phase);

    if (qcThick > 0.5) {
      drawArrow(ctx, engineCx + engineR + 6, engineCy, coldX - 6, engineCy, qcThick, parchment, 0.75);
      flowDots(ctx, engineCx + engineR + 6, engineCy, coldX - 6, engineCy, 6, ivory, phase);
    }
    if (wThick > 0.5) {
      drawArrow(ctx, engineCx, engineCy - engineR - 4, engineCx, workTop, wThick, brassBright);
      flowDots(ctx, engineCx, engineCy - engineR - 4, engineCx, workTop, 4, ink, phase);
    }

    // engine
    ctx.fillStyle = inkSurface;
    ctx.strokeStyle = ivory;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(engineCx, engineCy, engineR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = parchment;
    ctx.font = F(0.72, 500);
    ctx.fillText('ENGINE', engineCx, engineCy - engineR * 0.32);
    ctx.fillStyle = ivory;
    ctx.font = F(1.6, 600);
    ctx.fillText(workPct + '%', engineCx, engineCy + engineR * 0.18);
    ctx.fillStyle = parchment;
    ctx.font = F(0.72, 500);
    ctx.fillText('efficient', engineCx, engineCy + engineR * 0.52);

    // flow labels, in plain words, with each share of the heat
    var midIn = (hotX + boxW + engineCx - engineR) / 2;
    var midOut = (engineCx + engineR + coldX) / 2;
    var above = narrow ? engineCy + maxThick / 2 + Engine.textPx(state, 2.1) : engineCy - maxThick / 2 - 14;
    ctx.font = F(narrow ? 0.78 : 0.9, 600);
    ctx.fillStyle = hotColor;
    ctx.fillText('Heat in', midIn, above - Engine.textPx(state, 1.05));
    ctx.fillStyle = ivory;
    ctx.fillText('100%', midIn, above);
    ctx.fillStyle = parchment;
    ctx.fillText(narrow ? 'Wasted' : 'Wasted heat', midOut, above - Engine.textPx(state, 1.05));
    ctx.fillStyle = ivory;
    ctx.fillText(wastePct + '%', midOut, above);
    if (narrow) {
      /* one line, above the work arrow */
      ctx.fillStyle = brassBright;
      ctx.fillText('Work ' + workPct + '%', engineCx, Math.max(Engine.textPx(state, 0.9), workTop - 6));
    } else {
      ctx.textAlign = 'left';
      ctx.fillStyle = brassBright;
      var workLabelX = engineCx + Math.max(wThick, 8) / 2 + 12;
      var workLabelY = (engineCy - engineR + workTop) / 2;
      ctx.fillText('Useful work', workLabelX, workLabelY);
      ctx.fillStyle = ivory;
      ctx.fillText(workPct + '%', workLabelX, workLabelY + Engine.textPx(state, 1.05));
    }

    // the point, spelled out at the extremes
    var msg = null, msgColor = ivory;
    if (T.tc >= T.th) { msg = 'No useful work: the cold side must be colder than the hot side'; msgColor = hotColor; }
    else if (T.tc <= 0) { msg = '100% only at 0 K \u2014 and nothing can ever reach 0 K'; msgColor = coldColor; }
    if (msg) {
      ctx.textAlign = 'center';
      ctx.font = F(narrow ? 0.7 : 0.95, 600);
      if (narrow) msg = (T.tc >= T.th) ? 'No work: cold must be colder' : '100% only at 0 K \u2014 impossible';
      ctx.fillStyle = msgColor;
      ctx.fillText(msg, w / 2, h - Engine.textPx(state, 1) * 0.9);
    }
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
