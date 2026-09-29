/* =================================================================
   KELVIN — tides.js
   Experiment 3 — the tide-predicting machine: six real harmonic
   constituents (KelvinPhysics.TIDAL_CONSTITUENTS), each with an
   amplitude slider, drive small rotating wheels (one per constituent,
   spinning at a rate set by its own period — a nod to the machine's
   pulleys) and a summed curve (KelvinPhysics.tideSum) traced over
   ~30 days below. With only M2 and S2 raised, the spring/neap beat
   emerges on its own; KelvinPhysics.beatPeriod names it exactly.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('tides-lab');
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

    var F = function (scale, weight) { return Engine.font(state, scale, weight); };
    var narrow = w < 560;   /* phones: shorter labels, fewer ticks */
    var px = function (scale) { return Engine.textPx(state, scale); };

    // -- wheels strip: one wheel per wave, named in plain words --
    var n = cons.length;
    var slotW = w / n;
    var NAMES = slotW >= 110
      ? { M2: 'Moon', S2: 'Sun', N2: 'Moon orbit', K1: 'Daily K1', O1: 'Daily O1', P1: 'Daily P1' }
      : { M2: 'Moon', S2: 'Sun', N2: 'Orbit', K1: 'K1', O1: 'O1', P1: 'P1' };
    var wheelH = Math.max(70, h * 0.25);
    var wheelR = Math.min(slotW * 0.28, wheelH * 0.3);
    var wheelY = wheelR + 8;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (var i = 0; i < n; i++) {
      var c = cons[i];
      var cx = slotW * (i + 0.5);
      var ampFrac = Physics.clamp(c.amp / 1.5, 0, 1);
      var on = ampFrac > 0.02;
      ctx.globalAlpha = on ? 1 : 0.4;
      ctx.strokeStyle = on ? brass : line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, wheelY, wheelR, 0, Math.PI * 2);
      ctx.stroke();

      var ang = (wheelPhase / c.period) * Math.PI * 2;
      var spokeLen = wheelR * (0.25 + 0.75 * ampFrac);
      ctx.strokeStyle = on ? brassBright : stone;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, wheelY);
      ctx.lineTo(cx + Math.cos(ang) * spokeLen, wheelY + Math.sin(ang) * spokeLen);
      ctx.stroke();

      ctx.fillStyle = on ? ivory : stone;
      ctx.font = F(0.78, on ? 600 : 400);
      ctx.fillText(NAMES[c.id] || c.id, cx, wheelY + wheelR + px(0.95));
    }
    ctx.globalAlpha = 1;

    // -- summed curve --
    var plotT = wheelH + px(2.4), plotB = h - px(1.9), plotL = px(1.9), plotR = w - px(0.8);
    var N = 240;
    var vMax = 0.001, samples = [];
    for (var s = 0; s <= N; s++) {
      var day = DAYS * s / N;
      var v = Physics.tideSum(cons, day * 24);
      samples.push(v);
      if (Math.abs(v) > vMax) vMax = Math.abs(v);
    }
    vMax *= 1.1;

    function xPix(day) { return plotL + (day / DAYS) * (plotR - plotL); }
    function yPix(v) { return (plotT + plotB) / 2 - (v / vMax) * ((plotB - plotT) / 2); }

    // mean sea level
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotL, yPix(0) + 0.5);
    ctx.lineTo(plotR, yPix(0) + 0.5);
    ctx.stroke();

    // spring and neap tides, marked where they happen — only meaningful
    // when both the Moon (M2) and Sun (S2) waves are switched on
    var m2On = inputs.M2 && parseFloat(inputs.M2.value) > 0.02;
    var s2On = inputs.S2 && parseFloat(inputs.S2.value) > 0.02;
    if (beatDays > 0 && m2On && s2On) {
      ctx.font = F(0.82, 600);
      for (var k = 0; k * beatDays / 2 <= DAYS + 0.01; k++) {
        var d = k * beatDays / 2, bx = xPix(d);
        var spring = (k % 2 === 0);
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = spring ? brassBright : stone;
        ctx.globalAlpha = spring ? 0.7 : 0.5;
        ctx.beginPath();
        ctx.moveTo(bx, plotT);
        ctx.lineTo(bx, plotB);
        ctx.stroke();
        ctx.restore();
        var label = narrow ? (spring ? 'Spring' : 'Neap') : (spring ? 'Spring tide' : 'Neap tide');
        var tw = ctx.measureText(label).width;
        ctx.textAlign = 'center';
        var lx = Physics.clamp(bx, plotL + tw / 2, plotR - tw / 2);
        ctx.fillStyle = spring ? brassBright : ivory;
        ctx.fillText(label, lx, plotT - px(0.5));
      }
    }

    ctx.beginPath();
    for (s = 0; s <= N; s++) {
      var qx = xPix(DAYS * s / N), qy = yPix(samples[s]);
      if (s === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
    }
    ctx.strokeStyle = brassBright;
    ctx.lineWidth = 2;
    ctx.stroke();

    // axes, in plain words
    ctx.font = F(0.72, 500);
    ctx.fillStyle = ivory;
    ctx.textAlign = 'center';
    (narrow ? [0, 10, 20] : [0, 5, 10, 15, 20, 25]).forEach(function (dd) {
      ctx.fillText(String(dd), xPix(dd), plotB + px(1.2));
    });
    ctx.textAlign = 'right';
    ctx.fillText('30 days', plotR, plotB + px(1.2));
    ctx.save();
    ctx.translate(px(0.8), (plotT + plotB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Tide height', 0, 0);
    ctx.restore();
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
