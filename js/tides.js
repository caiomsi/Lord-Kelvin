/* =================================================================
   KELVIN — tides.js
   Chapter 07 — the tide-predicting machine: six real harmonic
   constituents (KelvinPhysics.TIDAL_CONSTITUENTS), each with an
   amplitude slider, drive small rotating wheels (one per constituent,
   spinning at a rate set by its own period — a nod to the machine's
   pulleys) and a summed curve (KelvinPhysics.tideSum) traced over
   ~30 days below. With only M2 and S2 raised, the spring/neap beat
   emerges on its own; KelvinPhysics.beatPeriod names it exactly.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch07');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#tides-canvas');
  var beatOut = root.querySelector('#tide-beat');
  if (!canvas || !Physics.TIDAL_CONSTITUENTS) return;

  var state = Engine.setupCanvas(canvas);
  if (!state) return;

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = v && v.trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  var brass = cssVar('--brass', '#c9a14a');
  var brassBright = cssVar('--brass-bright', '#e8c979');
  var ivory = cssVar('--ivory', '#f0ece3');
  var stone = cssVar('--stone', '#8b8579');
  var ink = cssVar('--ink', '#070a0e');
  var line = cssVar('--line', 'rgba(240,236,227,.12)');

  // IDs of the six constituent sliders, in display order — must match
  // the ids KelvinPhysics.TIDAL_CONSTITUENTS entries by their `id` field.
  var SLIDER_IDS = { M2: 'tide-m2', S2: 'tide-s2', N2: 'tide-n2', K1: 'tide-k1', O1: 'tide-o1', P1: 'tide-p1' };
  var inputs = {}, valueEls = {};
  Object.keys(SLIDER_IDS).forEach(function (id) {
    inputs[id] = root.querySelector('#' + SLIDER_IDS[id]);
    valueEls[id] = root.querySelector('#' + SLIDER_IDS[id] + '-value');
  });

  var M2 = Physics.TIDAL_CONSTITUENTS.filter(function (c) { return c.id === 'M2'; })[0];
  var S2 = Physics.TIDAL_CONSTITUENTS.filter(function (c) { return c.id === 'S2'; })[0];
  var beatDays = (M2 && S2) ? Physics.beatPeriod(M2.period, S2.period) / 24 : 0;
  if (beatOut) beatOut.textContent = beatDays.toFixed(2);

  var DAYS = 30;
  var wheelPhase = 0; // accumulated simulated hours, decorative only
  var WHEEL_HOURS_PER_SEC = 3;

  function activeConstituents() {
    var list = [];
    for (var i = 0; i < Physics.TIDAL_CONSTITUENTS.length; i++) {
      var base = Physics.TIDAL_CONSTITUENTS[i];
      var input = inputs[base.id];
      var amp = input ? parseFloat(input.value) : base.amp;
      if (isNaN(amp)) amp = 0;
      list.push({ id: base.id, period: base.period, amp: amp, phase: 0 });
    }
    return list;
  }

  function draw(dtSec) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    wheelPhase += (dtSec || 0) * WHEEL_HOURS_PER_SEC;

    var cons = activeConstituents();
    Object.keys(SLIDER_IDS).forEach(function (id) {
      if (valueEls[id] && inputs[id]) valueEls[id].textContent = parseFloat(inputs[id].value).toFixed(2);
    });

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    // -- wheels strip --
    var wheelH = Math.max(56, h * 0.24);
    var n = cons.length;
    var slotW = w / n;
    var wheelR = Math.min(slotW, wheelH) * 0.32;
    var wheelY = wheelH * 0.48;

    ctx.font = '9px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (var i = 0; i < n; i++) {
      var c = cons[i];
      var cx = slotW * (i + 0.5);
      var ampFrac = Physics.clamp(c.amp / 1.5, 0, 1);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, wheelY, wheelR, 0, Math.PI * 2);
      ctx.stroke();

      var ang = (wheelPhase / c.period) * Math.PI * 2;
      var spokeLen = wheelR * (0.25 + 0.75 * ampFrac);
      ctx.strokeStyle = ampFrac > 0.02 ? brassBright : stone;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx, wheelY);
      ctx.lineTo(cx + Math.cos(ang) * spokeLen, wheelY + Math.sin(ang) * spokeLen);
      ctx.stroke();

      ctx.fillStyle = ampFrac > 0.02 ? ivory : stone;
      ctx.fillText(c.id, cx, wheelY + wheelR + 12);
    }
    ctx.textAlign = 'left';

    // -- summed curve --
    var plotT = wheelH + 14, plotB = h - 22, plotL = 32, plotR = w - 12;
    var N = 180;
    var vMax = 0.001, samples = [];
    for (var s = 0; s <= N; s++) {
      var day = DAYS * s / N;
      var v = Physics.tideSum(cons, day * 24);
      samples.push(v);
      if (Math.abs(v) > vMax) vMax = Math.abs(v);
    }
    vMax *= 1.18;

    function xPix(day) { return plotL + (day / DAYS) * (plotR - plotL); }
    function yPix(v) { return (plotT + plotB) / 2 - (v / vMax) * ((plotB - plotT) / 2); }

    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(plotL, yPix(0) + 0.5);
    ctx.lineTo(plotR, yPix(0) + 0.5);
    ctx.stroke();

    // beat markers — multiples of the M2/S2 beat period
    if (beatDays > 0) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = brass;
      ctx.globalAlpha = 0.7;
      for (var mult = 0; mult * beatDays <= DAYS + 0.01; mult++) {
        var bx = xPix(mult * beatDays);
        ctx.beginPath();
        ctx.moveTo(bx, plotT);
        ctx.lineTo(bx, plotB);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = stone;
      ctx.font = '9px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('spring/neap beat ≈ ' + beatDays.toFixed(1) + ' d', xPix(0) + 4, plotT + 10);
    }

    ctx.beginPath();
    for (s = 0; s <= N; s++) {
      var px = xPix(DAYS * s / N), py = yPix(samples[s]);
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = brassBright;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.font = '9px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.textAlign = 'center';
    [0, 5, 10, 15, 20, 25, 30].forEach(function (d) {
      ctx.fillText(String(d), xPix(d), plotB + 12);
    });
    ctx.textAlign = 'right';
    ctx.fillText('days ->', plotR, plotT + 10);
    ctx.textAlign = 'left';
  }

  Object.keys(inputs).forEach(function (id) {
    var el = inputs[id];
    if (el) el.addEventListener('input', function () { draw(0); });
  });

  function init() { draw(0); }
  function resize() { draw(0); }
  function frame(dt) { draw((dt || 0) / 1000); }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
