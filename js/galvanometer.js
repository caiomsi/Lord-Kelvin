/* =================================================================
   KELVIN — galvanometer.js
   Chapter 06 — the mirror galvanometer: the optical lever. A current
   tilts a tiny suspended mirror by theta; reflection doubles that
   tilt in the outgoing beam, and a long "arm" to the scale turns the
   doubled angle into a readable swing (KelvinPhysics.galvanometerDeflection
   — armLength * tan(2*theta), theta = current * sensitivity).

   "Play message" keys the mirror on/off in real Morse code and
   decodes the transcript live, demonstrating how a signal this
   small becomes legible at all.

   sensitivity / armLength below are illustrative pixel-space
   constants chosen so a +-50 microamp slider produces a readable
   on-canvas swing — not real instrument specifications.
   ================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('ch06');
  if (!root) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = root.querySelector('#galv-canvas');
  var currentInput = root.querySelector('#galv-current');
  var currentValue = root.querySelector('#galv-current-value');
  var playBtn = root.querySelector('#galv-play');
  var transcriptEl = root.querySelector('#galv-transcript');
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

  var SENSITIVITY = 0.003;   // rad per microamp (illustrative)
  var ARM_LENGTH = 300;      // px (illustrative — the "long lever arm")
  var PLAY_CURRENT = 35;     // microamp, keying amplitude during playback

  var MORSE = { K: '-.-', E: '.', L: '.-..', V: '...-', I: '..', N: '-.' };
  var MESSAGE = 'KELVIN';
  var UNIT_MS = 160;

  function buildTimeline(message) {
    var segs = [], letterEnds = [], t = 0, li, ch, code, si, sym, units, dur;
    for (li = 0; li < message.length; li++) {
      ch = message[li];
      code = MORSE[ch] || '';
      for (si = 0; si < code.length; si++) {
        sym = code[si];
        units = sym === '-' ? 3 : 1;
        dur = units * UNIT_MS;
        segs.push({ t0: t, t1: t + dur, on: true });
        t += dur;
        if (si < code.length - 1) { segs.push({ t0: t, t1: t + UNIT_MS, on: false }); t += UNIT_MS; }
      }
      letterEnds.push({ t: t, ch: ch });
      if (li < message.length - 1) { t += 3 * UNIT_MS; }
    }
    return { segs: segs, letterEnds: letterEnds, total: t };
  }
  var TIMELINE = buildTimeline(MESSAGE);

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  var playing = false, playStart = 0, announced = 0;

  function isOnAt(elapsed) {
    for (var i = 0; i < TIMELINE.segs.length; i++) {
      var s = TIMELINE.segs[i];
      if (elapsed >= s.t0 && elapsed < s.t1) return s.on;
    }
    return false;
  }

  function manualCurrent() {
    var v = currentInput ? parseFloat(currentInput.value) : 0;
    return isNaN(v) ? 0 : v;
  }

  function draw(currentUA) {
    var ctx = state.ctx, w = state.w, h = state.h;
    if (!w || !h) return;
    var theta = currentUA * SENSITIVITY;
    var deflect = Physics.galvanometerDeflection(currentUA, SENSITIVITY, ARM_LENGTH);
    deflect = Physics.clamp(deflect, -h * 0.42, h * 0.42);

    if (currentValue) currentValue.textContent = currentUA.toFixed(1) + ' µA';

    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, w, h);

    var midY = h * 0.5;
    var lampX = w * 0.08;
    var mirrorX = w * 0.4;
    var scaleX = w * 0.92;

    // zero reference
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    ctx.moveTo(mirrorX, midY);
    ctx.lineTo(scaleX, midY);
    ctx.stroke();
    ctx.restore();

    // lamp
    ctx.fillStyle = brassBright;
    ctx.beginPath();
    ctx.arc(lampX, midY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = brass;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lampX + 6, midY);
    ctx.lineTo(mirrorX, midY);
    ctx.stroke();

    // mirror — tilts by theta
    var ml = 20;
    ctx.save();
    ctx.translate(mirrorX, midY);
    ctx.rotate(theta);
    ctx.strokeStyle = ivory;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -ml / 2);
    ctx.lineTo(0, ml / 2);
    ctx.stroke();
    ctx.restore();

    // reflected beam -> scale, deflected by 2*theta
    ctx.strokeStyle = brassBright;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mirrorX, midY);
    ctx.lineTo(scaleX, midY - deflect);
    ctx.stroke();

    // scale
    ctx.strokeStyle = stone;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scaleX, h * 0.06);
    ctx.lineTo(scaleX, h * 0.94);
    ctx.stroke();
    for (var ty = h * 0.06; ty <= h * 0.94; ty += (h * 0.88) / 10) {
      ctx.beginPath();
      ctx.moveTo(scaleX - 4, ty);
      ctx.lineTo(scaleX + 4, ty);
      ctx.stroke();
    }

    // spot
    ctx.fillStyle = currentUA === 0 ? ivory : brassBright;
    ctx.beginPath();
    ctx.arc(scaleX, midY - deflect, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.textAlign = 'center';
    ctx.fillText('LAMP', lampX, midY + 22);
    ctx.fillText('MIRROR', mirrorX, midY + 30);
    ctx.fillText('SCALE', scaleX, h * 0.06 - 8);
    ctx.textAlign = 'left';
  }

  function startPlay() {
    if (playing || !TIMELINE.total) return;
    if (transcriptEl) transcriptEl.textContent = '';
    announced = 0;
    if (Engine.reducedMotion()) {
      if (transcriptEl) transcriptEl.textContent = MESSAGE.split('').join(' ');
      draw(0);
      return;
    }
    playing = true;
    playStart = now();
    if (playBtn) playBtn.disabled = true;
    if (currentInput) currentInput.disabled = true;
  }

  function stopPlay() {
    playing = false;
    if (playBtn) playBtn.disabled = false;
    if (currentInput) currentInput.disabled = false;
    draw(0);
  }

  if (playBtn) playBtn.addEventListener('click', startPlay);
  if (currentInput) currentInput.addEventListener('input', function () {
    if (!playing) draw(manualCurrent());
  });

  function init() { draw(0); }
  function resize() { draw(playing ? 0 : manualCurrent()); }

  var lastIdleCurrent = null;
  function frame() {
    if (!playing) {
      /* idle: only repaint when the manual current actually changed */
      var cNow = manualCurrent();
      if (cNow !== lastIdleCurrent) { lastIdleCurrent = cNow; draw(cNow); }
      return;
    }
    lastIdleCurrent = null;
    var elapsed = now() - playStart;
    if (elapsed >= TIMELINE.total) { stopPlay(); return; }
    var on = isOnAt(elapsed);
    while (announced < TIMELINE.letterEnds.length && TIMELINE.letterEnds[announced].t <= elapsed) {
      if (transcriptEl) transcriptEl.textContent += TIMELINE.letterEnds[announced].ch + ' ';
      announced++;
    }
    draw(on ? PLAY_CURRENT : 0);
  }

  Engine.register(canvas, { init: init, frame: frame, resize: resize });
})();
