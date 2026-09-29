/* =================================================================
   KELVIN — thermometer.js
   Experiment 1 — "Freeze a gas". A box of nitrogen molecules whose
   motion is driven by the temperature on the slider, from 0 K to
   10^8 K on a log scale.

   What is physics and what is display:
   - The average speed shown in the readout is KelvinPhysics.vRms —
     the real root-mean-square speed of N2 at that temperature.
   - Each molecule's share of that speed is drawn from the Maxwell-
     Boltzmann distribution, and molecules exchange speed through
     elastic collisions, so the spread of speeds stays realistic.
   - Pixels per second is a COMPRESSED display scale (proportional to
     the square root of v_rms, i.e. T^1/4). Real speeds span five orders
     of magnitude across the slider; drawn linearly, the Sun's core
     would be a blur and room temperature would barely move. The
     compression keeps motion visibly faster at every step up the scale.
   - Colour follows how real hot matter glows: frozen blue, cold cyan,
     neutral at room temperature, then red, yellow, white and
     blue-white as it heats — glow starting near the Draper point.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('therm-lab');
  if (!lab) return;
  var Engine = window.KelvinEngine, Physics = window.KelvinPhysics;
  if (!Engine || !Physics || !Engine.setupCanvas) return;

  var canvas = document.getElementById('therm-canvas');
  var range = document.getElementById('therm-range');
  var kOut = document.getElementById('therm-k');
  var cOut = document.getElementById('therm-c');
  var fOut = document.getElementById('therm-f');
  var vOut = document.getElementById('therm-vrms');
  var markOut = document.getElementById('therm-landmark');
  var chipWrap = document.getElementById('therm-landmarks');
  if (!canvas || !range) return;

  var M = 0.028;              /* nitrogen, kg/mol */
  var stage = null;
  var particles = [];
  var currentK = 300;

  /* ---------------- slider position <-> temperature (display) ---------------- */
  var POS_MAX = 1000, LOG_MIN = -2, LOG_MAX = 8;

  function posToTemp(p) {
    p = Physics.clamp(p, 0, POS_MAX);
    if (p <= 0) return 0;
    return Math.pow(10, LOG_MIN + (LOG_MAX - LOG_MIN) * (p - 1) / (POS_MAX - 1));
  }
  function tempToPos(T) {
    if (T <= 0) return 0;
    var p = 1 + (POS_MAX - 1) * (Math.log(T) / Math.LN10 - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.round(Physics.clamp(p, 0, POS_MAX));
  }

  /* ---------------- landmarks ---------------- */
  var chips = chipWrap ? chipWrap.querySelectorAll('[data-k]') : [];
  function nearestLandmark(T) {
    var best = null, bestD = 1e9;
    for (var i = 0; i < chips.length; i++) {
      var k = parseFloat(chips[i].getAttribute('data-k'));
      var d;
      if (k === 0 || T === 0) d = (k === T) ? 0 : 1e9;
      else d = Math.abs(Math.log(T / k) / Math.LN10);
      if (d < bestD) { bestD = d; best = i; }
    }
    return bestD < 0.05 ? best : null;   /* within about ±12% */
  }

  /* ---------------- number formatting (no scientific notation) ---------------- */
  var NF = {};
  function nf(digits) {
    if (!NF[digits]) {
      try { NF[digits] = new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }); }
      catch (e) { NF[digits] = { format: function (v) { return v.toFixed(digits); } }; }
    }
    return NF[digits];
  }
  function fmt(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v), s;
    if (a >= 1e6) s = nf(1).format(v / 1e6) + ' million';
    else if (a >= 1000) s = nf(0).format(v);
    else if (a >= 10) s = nf(2).format(v);
    else s = nf(3).format(v);
    return s.replace('-', '−');          /* a real minus sign */
  }

  /* ---------------- colour by temperature ---------------- */
  var STOPS = [                 /* [log10 T, colour] */
    [-2.0, [39, 80, 106]],      /* frozen blue */
    [0.44, [59, 127, 163]],     /* ~3 K */
    [2.0, [111, 211, 232]],     /* 100 K, cold cyan */
    [2.48, [212, 226, 230]],    /* ~300 K, neutral */
    [3.0, [224, 112, 62]],      /* ~1000 K, red-hot */
    [3.5, [240, 185, 79]],      /* ~3000 K, yellow */
    [3.8, [251, 238, 221]],     /* ~6000 K, white-hot */
    [4.6, [238, 244, 255]],     /* blue-white */
    [8.0, [226, 236, 255]]
  ];
  var FROZEN = [70, 92, 108];
  function tempRGB(T) {
    if (T <= 0) return FROZEN;
    var L = Math.log(T) / Math.LN10;
    if (L <= STOPS[0][0]) return STOPS[0][1];
    for (var i = 1; i < STOPS.length; i++) {
      if (L <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i], t = (L - a[0]) / (b[0] - a[0]);
        return [0, 1, 2].map(function (j) { return Math.round(Physics.lerp(a[1][j], b[1][j], t)); });
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  /* visible glow begins near the Draper point (~798 K) */
  function glowAmount(T) {
    if (T < 798) return 0;
    return Physics.clamp((Math.log(T / 798) / Math.LN10) / 0.9, 0, 1);
  }

  var inkColor = (function () {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--ink');
      return (v && v.trim()) || '#070a0e';
    } catch (e) { return '#070a0e'; }
  })();

  /* ---------------- molecules ---------------- */
  function gauss() {              /* Box-Muller standard normal */
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function seed() {
    particles = [];
    if (!stage || !stage.w) return;
    var n = Math.round(Physics.clamp(stage.w * stage.h / 5200, 45, 120));
    for (var i = 0; i < n; i++) {
      /* speed factor ~ Maxwell-Boltzmann, normalised so mean(s^2) = 1 */
      var gx = gauss(), gy = gauss(), gz = gauss();
      var s = Math.sqrt((gx * gx + gy * gy + gz * gz) / 3);
      var ang = Math.random() * Math.PI * 2;
      particles.push({
        x: Math.random() * stage.w, y: Math.random() * stage.h,
        vx: Math.cos(ang) * s, vy: Math.sin(ang) * s,
        r: 1.5 + Math.random() * 1.3
      });
    }
  }

  /* pixels per second for an average molecule — compressed display scale */
  function pxSpeed(T) {
    if (T <= 0 || !stage) return 0;
    var scale = Physics.clamp(stage.w / 900, 0.6, 1.35);
    return 3.6 * Math.sqrt(Physics.vRms(T, M)) * scale;
  }

  var COLLIDE = 6;               /* px — collision diameter */

  function step(dt) {
    var w = stage.w, h = stage.h, sp = pxSpeed(currentK);
    if (sp <= 0) return;
    var i, p;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx * sp * dt;
      p.y += p.vy * sp * dt;
      if (p.x < 0) { p.x = -p.x; p.vx = Math.abs(p.vx); }
      else if (p.x > w) { p.x = 2 * w - p.x; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = -p.y; p.vy = Math.abs(p.vy); }
      else if (p.y > h) { p.y = 2 * h - p.y; p.vy = -Math.abs(p.vy); }
      p.x = Physics.clamp(p.x, 0, w); p.y = Physics.clamp(p.y, 0, h);
    }
    /* elastic collisions between equal masses: swap the velocity
       components along the line joining the centres */
    var min2 = COLLIDE * COLLIDE;
    for (i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= min2 || d2 === 0) continue;
        var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        var rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) {
          a.vx -= rel * nx; a.vy -= rel * ny;
          b.vx += rel * nx; b.vy += rel * ny;
        }
        var push = (COLLIDE - d) / 2;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
      }
    }
  }

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    if (!w || !h) return;

    ctx.fillStyle = inkColor;
    ctx.fillRect(0, 0, w, h);

    var rgb = tempRGB(currentK);
    var col = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    var sp = pxSpeed(currentK);
    var glow = glowAmount(currentK);
    /* motion streak: how far a molecule travels in ~45 ms, capped */
    var streakT = 0.055;
    var i, p;

    /* halo pass (incandescent matter only) */
    if (glow > 0) {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.10 + 0.16 * glow;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (2.2 + 1.8 * glow), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* streaks */
    if (sp > 0) {
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.34 + 0.26 * glow;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var tx = p.vx * sp * streakT, ty = p.vy * sp * streakT;
        var len = Math.sqrt(tx * tx + ty * ty);
        if (len < 1.5) continue;
        if (len > 60) { tx *= 60 / len; ty *= 60 / len; }
        ctx.lineWidth = p.r * 1.3;
        ctx.beginPath();
        ctx.moveTo(p.x - tx, p.y - ty);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    /* heads */
    ctx.globalAlpha = currentK <= 0 ? 0.55 : 1;
    ctx.fillStyle = col;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + 0.35 * glow), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawKey(ctx, w, h);
  }

  /* Colour key, bottom-left: what each glow colour means. The band the
     current temperature falls in is drawn bright; the rest are dimmed. */
  var KEY = [
    { name: 'frozen', T: 0, max: 0 },
    { name: 'cold', T: 20, max: 200 },
    { name: 'room', T: 300, max: 700 },
    { name: 'red-hot', T: 1000, max: 3000 },
    { name: 'white-hot', T: 6000, max: Infinity }
  ];
  function keyBand(T) {
    for (var i = 0; i < KEY.length; i++) if (T <= KEY[i].max) return i;
    return KEY.length - 1;
  }
  function drawKey(ctx, w, h) {
    var fontPx = Engine.textPx(stage, 0.82);
    ctx.font = Engine.font(stage, 0.82, 600);
    var r = Math.max(4, fontPx * 0.36), gap = fontPx * 0.9, pad = fontPx * 0.6;
    var widths = KEY.map(function (k) { return r * 2 + 6 + ctx.measureText(k.name).width; });
    var total = widths.reduce(function (a, b) { return a + b + gap; }, 0) - gap + pad * 2;
    if (total > w - 16) return;                 /* too narrow to fit: leave it out */
    var bh = fontPx * 1.9, x = 10, y = h - bh - 10;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = inkColor;
    ctx.fillRect(x, y, total, bh);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(240,236,227,.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, total - 1, bh - 1);
    ctx.globalAlpha = 1;
    var on = keyBand(currentK);
    var cx = x + pad, cy = y + bh / 2;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (var i = 0; i < KEY.length; i++) {
      var c = tempRGB(KEY[i].T);
      ctx.globalAlpha = (i === on) ? 1 : 0.7;
      ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
      ctx.beginPath();
      ctx.arc(cx + r, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = (i === on) ? '#f0ece3' : '#c7c2b6';
      ctx.fillText(KEY[i].name, cx + r * 2 + 6, cy + 1);
      cx += widths[i] + gap;
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  /* ---------------- readouts + state ---------------- */
  function updateReadouts() {
    var T = currentK;
    if (kOut) kOut.textContent = fmt(T);
    if (cOut) cOut.textContent = fmt(Physics.kToC(T));
    if (fOut) fOut.textContent = fmt(Physics.kToF(T));
    if (vOut) vOut.textContent = nf(0).format(Math.round(Physics.vRms(T, M)));
    range.setAttribute('aria-valuetext', fmt(T) + ' kelvin');

    var near = nearestLandmark(T);
    for (var i = 0; i < chips.length; i++) {
      var on = (i === near);
      chips[i].classList.toggle('is-on', on);
      chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (markOut) markOut.textContent = fmt(T) + ' K' + (near === null ? '' : '  \u00b7  ' + (T === 0 ? '' : '\u2248 ') + chips[near].textContent);
  }

  function setTemp(T) {
    currentK = Physics.clamp(T, 0, 1e8);
    range.value = String(tempToPos(currentK));
    if (Engine.syncRange) Engine.syncRange(range);   /* moved in code: no input event */
    updateReadouts();
    draw();
  }

  range.addEventListener('input', function () {
    currentK = posToTemp(parseFloat(range.value));
    updateReadouts();
    draw();
  });

  for (var c = 0; c < chips.length; c++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var k = parseFloat(btn.getAttribute('data-k'));
        if (!isNaN(k)) setTemp(k);
      });
    })(chips[c]);
  }

  /* ---------------- engine wiring ---------------- */
  function init() {
    stage = Engine.setupCanvas(canvas);
    if (!stage) return;
    /* the ResizeObserver's first refit clears the bitmap after init —
       repaint so the reduced-motion single frame survives it */
    stage.onFit = draw;
    seed();
    /* start from an exact temperature, not the slider's integer
       position (posToTemp(448) is 298.18 K, not 300) */
    setTemp(300);
  }
  function resize() {
    if (!stage) return;
    if (stage.refit) stage.refit();
    for (var i = 0; i < particles.length; i++) {
      particles[i].x = Physics.clamp(particles[i].x, 0, stage.w);
      particles[i].y = Physics.clamp(particles[i].y, 0, stage.h);
    }
    draw();
  }
  function frame(dt) {
    if (!stage) return;
    var s = Math.min((dt || 0) / 1000, 0.05);
    if (s > 0) step(s);
    draw();
  }

  Engine.register(lab, { init: init, frame: frame, resize: resize });
})();
