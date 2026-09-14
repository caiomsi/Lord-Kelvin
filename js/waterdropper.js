/* =================================================================
   KELVIN — waterdropper.js
   Chapter 07 — the Kelvin water dropper: two streams of droplets
   fall through inductor rings that are cross-connected to the
   OPPOSITE collecting can, so any small charge imbalance induces a
   larger one — positive feedback. Voltage climbs
   (KelvinPhysics.dropperVoltage) until a spark jumps the gap, then
   resets. "Voltage" is a dimensionless proxy for accumulated charge,
   not real volts.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch07');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#dropper-canvas');
  var rateInput = root.querySelector('#dropper-rate');
  var rateValue = root.querySelector('#dropper-rate-value');
  var voltageOut = root.querySelector('#dropper-voltage');
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
  var brass = cssVar('--brass', '#c9a14a');
  var brassBright = cssVar('--brass-bright', '#e8c979');
  var ivory = cssVar('--ivory', '#f0ece3');
  var stone = cssVar('--stone', '#8b8579');
  var ink = cssVar('--ink', '#070a0e');
  var cyan = cssVar('--cyan', '#6fd3e8');
  var lineColor = cssVar('--line', 'rgba(240,236,227,.12)');
  var inkSurface = inkSurface;

  var TAU_MAX = 3.5, TAU_MIN = 0.9, V_THRESHOLD = 9, SPARK_MS = 220;
  var simTime = 0, sparkRemaining = 0;
  var spawnAccL = 0, spawnAccR = 0;
  var drops = [];

  function tau() {
    var r = rateInput ? parseFloat(rateInput.value) : 5;
    if (isNaN(r)) r = 5;
    return Physics.lerp(TAU_MAX, TAU_MIN, Physics.clamp((r - 1) / 9, 0, 1));
  }

  function layout(w, h) {
    return {
      leftX: w * 0.3, rightX: w * 0.7,
      nozzleY: h * 0.1, ringY: h * 0.34, canTopY: h * 0.72, canBotY: h * 0.92
    };
  }

  function draw(dtMs) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var dtSec = (dtMs || 0) / 1000;
    var t = tau();

    if (rateValue) rateValue.textContent = (rateInput ? rateInput.value : '5') + ' / 10';

    if (sparkRemaining > 0) {
      sparkRemaining -= (dtMs || 0);
    } else if (dtMs) {
      simTime += dtSec;
      var v = Physics.dropperVoltage(simTime, t);
      if (v >= V_THRESHOLD) { sparkRemaining = SPARK_MS; simTime = 0; }
    }
    var Vd = Physics.dropperVoltage(simTime, t);
    if (voltageOut) voltageOut.textContent = Vd.toFixed(2);

    var L = layout(w, h);

    // spawn + advance droplets (only while time is actually passing)
    if (dtMs) {
      var interval = (t * 1000) / 5;
      spawnAccL += dtMs; spawnAccR += dtMs;
      if (spawnAccL >= interval) { spawnAccL = 0; drops.push({ x: L.leftX, y: L.nozzleY, side: 'L' }); }
      if (spawnAccR >= interval) { spawnAccR = 0; drops.push({ x: L.rightX, y: L.nozzleY, side: 'R' }); }
      var fallSpeed = (L.canTopY - L.nozzleY) / 1.1; // px/s, ~1.1s trip
      for (var i = drops.length - 1; i >= 0; i--) {
        drops[i].y += fallSpeed * dtSec;
        if (drops[i].y > L.canTopY) drops.splice(i, 1);
      }
    }

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    // voltage bar
    var barW = w - 24, barFrac = Physics.clamp(Vd / V_THRESHOLD, 0, 1);
    ctx.strokeStyle = lineColor;
    ctx.strokeRect(12, 8, barW, 6);
    ctx.fillStyle = sparkRemaining > 0 ? brassBright : cyan;
    ctx.fillRect(12, 8, barW * barFrac, 6);

    // cross-connecting wires (ring -> OPPOSITE can)
    ctx.strokeStyle = brass;
    ctx.lineWidth = 1;
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(L.leftX, L.ringY);
    ctx.lineTo(L.rightX - 16, L.canTopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(L.rightX, L.ringY);
    ctx.lineTo(L.leftX + 16, L.canTopY);
    ctx.stroke();
    ctx.restore();

    // nozzles, rings, cans
    [L.leftX, L.rightX].forEach(function (x) {
      ctx.fillStyle = stone;
      ctx.fillRect(x - 6, L.nozzleY - 6, 12, 6);
      ctx.strokeStyle = ivory;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, L.ringY, 15, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = inkSurface;
      ctx.strokeStyle = brass;
      ctx.fillRect(x - 20, L.canTopY, 40, L.canBotY - L.canTopY);
      ctx.strokeRect(x - 20, L.canTopY, 40, L.canBotY - L.canTopY);
    });

    // droplets
    ctx.fillStyle = cyan;
    for (var d = 0; d < drops.length; d++) {
      ctx.beginPath();
      ctx.arc(drops[d].x, drops[d].y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // spark
    if (sparkRemaining > 0) {
      var midX = (L.leftX + L.rightX) / 2, gapY = L.canTopY - 14;
      ctx.strokeStyle = brassBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX - 22, gapY);
      ctx.lineTo(midX - 6, gapY - 9);
      ctx.lineTo(midX + 4, gapY + 6);
      ctx.lineTo(midX + 22, gapY - 4);
      ctx.stroke();
    }

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.textAlign = 'center';
    ctx.fillText('RING', L.leftX, L.ringY - 12);
    ctx.fillText('RING', L.rightX, L.ringY - 12);
    ctx.fillText('CAN', L.leftX, L.canBotY + 14);
    ctx.fillText('CAN', L.rightX, L.canBotY + 14);
    ctx.textAlign = 'left';
  }

  if (rateInput) rateInput.addEventListener('input', function () {
    /* under reduced motion nothing advances on its own, so re-seed the
       still life at the new rate — otherwise the slider only changes a
       label */
    if (Engine.reducedMotion()) seedStatic();
    draw(0);
  });

  function init() {
    /* Under reduced motion the engine calls frame(0) exactly once, and
       draw() only advances anything when dtMs is truthy — so without
       this the whole apparatus sits at zero charge with no droplets
       forever. Seed a representative mid-charge state instead, and let
       the drop-rate slider keep re-seeding it so the control still does
       something visible. */
    if (Engine.reducedMotion()) seedStatic();
    draw(0);
  }

  /* a still life: charge most of the way to the spark, with the two
     streams populated down their fall */
  function seedStatic() {
    simTime = tau() * Math.log(1 + V_THRESHOLD * 0.72);
    sparkRemaining = 0;
    drops.length = 0;
    if (!state) return;
    var L = layout(state.w, state.h);
    for (var i = 0; i < 7; i++) {
      var f = i / 7;
      var y = L.nozzleY + f * (L.canTopY - L.nozzleY);
      drops.push({ x: L.leftX, y: y, side: 'L' });
      drops.push({ x: L.rightX, y: y, side: 'R' });
    }
  }
  function resize() { draw(0); }
  function frame(dt) { draw(dt || 0); }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
