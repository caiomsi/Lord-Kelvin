/* =================================================================
   KELVIN — cable.js
   Chapter 06 — signal retardation: press "Send" and a step signal
   travels down a cable of adjustable length, visibly smearing and
   flattening the farther it has to go (KelvinPhysics.cableStepResponse
   / cableDelay — Kelvin's "law of squares": delay is proportional to
   length squared, so doubling the cable quadruples the delay).

   r (resistance/metre) and c (capacitance/metre) below are
   representative mid-19th-century submarine-cable values used for a
   readable, illustrative delay number — not a claim to reproduce a
   specific historical measurement.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch06');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#cable-canvas');
  var lengthInput = root.querySelector('#cable-length');
  var lengthValue = root.querySelector('#cable-length-value');
  var sendBtn = root.querySelector('#cable-send');
  var delayOut = root.querySelector('#cable-delay');
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
  var lineColor = cssVar('--line', 'rgba(240,236,227,.12)');

  var R_PER_M = 0.002;   // ohm/m  (~2 ohm/km)
  var C_PER_M = 4e-10;   // F/m    (~0.4 uF/km)
  var SIM_WALL_MS = 3000; // animation always plays over ~3s of wall clock

  /* The simulated physical time span is deliberately FIXED — set by the
     longest cable the slider offers — instead of being scaled by the
     selected length. Scaling it by the length was a bug: with x measured
     as a fraction of L and t scaled by L^2, the length cancels out of
     erfc(x*sqrt(rc/4t)) exactly, so every cable drew an identical curve
     and the law of squares was invisible. Holding the window fixed means
     a short cable saturates almost at once while a long one is still
     crawling — which is the whole point. */
  var L_MAX_M = 6000 * 1000;
  var SIM_T_MAX = 3 * Physics.cableDelay(L_MAX_M, R_PER_M, C_PER_M);

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  var phaseState = 'idle'; // idle | sending | arrived
  var tStart = 0;

  function lengthMeters() {
    var km = lengthInput ? parseFloat(lengthInput.value) : 3000;
    if (isNaN(km)) km = 3000;
    return km * 1000;
  }

  function delaySeconds() {
    return Physics.cableDelay(lengthMeters(), R_PER_M, C_PER_M);
  }

  function fmtSeconds(s) {
    if (s < 1) return (s * 1000).toFixed(0) + ' ms';
    return s.toFixed(s < 10 ? 2 : 1) + ' s';
  }

  function draw(simT) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var Lm = lengthMeters();
    var delay = Physics.cableDelay(Lm, R_PER_M, C_PER_M);

    if (lengthValue) lengthValue.textContent = (Lm / 1000).toFixed(0) + ' km';
    if (delayOut) delayOut.textContent = fmtSeconds(delay);

    var marginL = 34, marginR = 14, marginT = 20, marginB = 26;
    var plotL = marginL, plotR = w - marginR, plotT = marginT, plotB = h - marginB;
    var baseline = plotB;
    var amp = (plotB - plotT) * 0.88;

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotL, baseline + 0.5);
    ctx.lineTo(plotR, baseline + 0.5);
    ctx.stroke();

    var N = 120;
    ctx.beginPath();
    ctx.moveTo(plotL, baseline);
    for (var i = 0; i <= N; i++) {
      var xFrac = i / N;
      var xM = xFrac * Lm;
      var resp = simT > 0 ? Physics.cableStepResponse(xM, simT, R_PER_M, C_PER_M) : 0;
      var px = plotL + xFrac * (plotR - plotL);
      var py = baseline - resp * amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(plotR, baseline);
    ctx.closePath();
    ctx.fillStyle = 'rgba(201,161,74,.18)';
    ctx.fill();

    ctx.beginPath();
    for (i = 0; i <= N; i++) {
      xFrac = i / N;
      xM = xFrac * Lm;
      resp = simT > 0 ? Physics.cableStepResponse(xM, simT, R_PER_M, C_PER_M) : 0;
      px = plotL + xFrac * (plotR - plotL);
      py = baseline - resp * amp;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = brassBright;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.textAlign = 'left';
    ctx.fillText('SEND', plotL, plotT - 6);
    ctx.textAlign = 'right';
    ctx.fillText('RECEIVE', plotR, plotT - 6);
    ctx.textAlign = 'left';

    ctx.fillStyle = brass;
    ctx.beginPath(); ctx.arc(plotL, baseline, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ivory;
    ctx.beginPath(); ctx.arc(plotR, baseline, 3, 0, Math.PI * 2); ctx.fill();

    if (phaseState === 'arrived') {
      ctx.fillStyle = ivory;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('arrived — delay ' + fmtSeconds(delay), plotL, plotT + 10);
    }
  }

  function resetIdle() {
    phaseState = 'idle';
    if (sendBtn) sendBtn.disabled = false;
    draw(0);
  }

  function send() {
    if (Engine.reducedMotion()) {
      phaseState = 'arrived';
      draw(SIM_T_MAX);
      return;
    }
    phaseState = 'sending';
    tStart = now();
    if (sendBtn) sendBtn.disabled = true;
  }

  if (sendBtn) sendBtn.addEventListener('click', send);
  if (lengthInput) lengthInput.addEventListener('input', resetIdle);

  function init() { draw(0); }
  function resize() { draw(0); }
  function frame() {
    /* nothing moves unless a pulse is in flight — idle and arrived are
       already on screen, so don't repaint them 60x a second */
    if (phaseState !== 'sending') return;
    var elapsed = now() - tStart;
    var simT = (elapsed / SIM_WALL_MS) * SIM_T_MAX;
    if (elapsed >= SIM_WALL_MS) {
      phaseState = 'arrived';
      if (sendBtn) sendBtn.disabled = false;
      simT = SIM_T_MAX;
    }
    draw(simT);
  }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
