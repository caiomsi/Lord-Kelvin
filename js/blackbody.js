/* =================================================================
   KELVIN — blackbody.js
   Chapter 09, Cloud II — Planck vs Rayleigh-Jeans over the same
   wavelengths. The classical curve is drawn until it leaves the top
   of the frame: that overshoot IS the ultraviolet catastrophe, so it
   is clipped rather than rescaled away.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('blackbody-lab');
  if (!lab) return;

  var Physics = window.KelvinPhysics;
  var Engine = window.KelvinEngine;
  if (!Physics || !Engine) return;

  var canvas = document.getElementById('blackbody-canvas');
  var tempEl = document.getElementById('bb-temp');
  var tempVal = document.getElementById('bb-temp-value');
  var peakOut = document.getElementById('bb-peak');
  if (!canvas || !tempEl) return;

  var stage = null;
  var SAMPLES = 260;

  /* Resolve against the lab element, not the root: --chapter-accent
     is set per-section via [data-accent], so reading it off
     documentElement always returns the page default instead of this
     chapter's colour. */
  function css(name, fallback) {
    try {
      var v = getComputedStyle(lab).getPropertyValue(name);
      if (!v || !v.trim()) v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return (v && v.trim()) || fallback;
    } catch (e) { return fallback; }
  }

  /* visible light, violet to red — for the rainbow band (display only) */
  var VIS_MIN = 380e-9, VIS_MAX = 750e-9;
  var RAINBOW = ['#7a3cff', '#3b5bff', '#1fb5ff', '#2fe08a', '#f5e23b', '#ff9a2e', '#ff3b2e'];

  function niceStep(rangeNm) {
    var steps = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
    for (var i = 0; i < steps.length; i++) if (rangeNm / steps[i] <= 6) return steps[i];
    return 20000;
  }

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    var T = parseFloat(tempEl.value);

    var accent = css('--chapter-accent', '#6fd3e8');
    var ember = css('--ember', '#d9673f');
    var ivory = css('--ivory', '#f0ece3');
    var parchment = css('--parchment', '#c7c2b6');
    var line = css('--line', 'rgba(240,236,227,.12)');
    var F = function (scale, weight) { return Engine.font(stage, scale, weight); };
    var px = function (scale) { return Engine.textPx(stage, scale); };

    ctx.clearRect(0, 0, w, h);

    var padL = px(2.2), padR = px(0.8), padT = px(2.2), padB = px(2.4);
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    if (plotW <= 10 || plotH <= 10) return;

    /* Window the x-axis on this temperature's own peak so the shape
       stays readable across the whole slider range. */
    var peak = Physics.wienPeak(T);              /* metres */
    var lamMax = peak * 5;
    var lamMin = peak * 0.12;

    /* Scale y to Planck's peak — the classical curve is allowed to
       run off the top, which is the entire point. */
    var yMax = Physics.planck(peak, T) * 1.15;
    if (!isFinite(yMax) || yMax <= 0) return;

    var X = function (lam) { return padL + ((lam - lamMin) / (lamMax - lamMin)) * plotW; };
    var Y = function (v) { return padT + plotH - Math.max(0, Math.min(1, v / yMax)) * plotH; };

    /* visible-light band, where it falls inside this window */
    var v0 = Math.max(VIS_MIN, lamMin), v1 = Math.min(VIS_MAX, lamMax);
    if (v1 > v0) {
      var bx0 = X(VIS_MIN), bx1 = X(VIS_MAX);
      var grad = ctx.createLinearGradient(bx0, 0, bx1, 0);
      for (var g = 0; g < RAINBOW.length; g++) grad.addColorStop(g / (RAINBOW.length - 1), RAINBOW[g]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = grad;
      ctx.fillRect(bx0, padT, bx1 - bx0, plotH);
      ctx.globalAlpha = 0.9;
      ctx.fillRect(bx0, padT + plotH - 5, bx1 - bx0, 5);
      ctx.restore();
      if (X(v1) - X(v0) > px(5)) {
        ctx.font = F(0.72, 600);
        ctx.fillStyle = ivory;
        ctx.textAlign = 'center';
        ctx.fillText('visible light', (X(v0) + X(v1)) / 2, padT + plotH - px(0.7));
      }
    }

    /* axes */
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    /* x ticks in nanometres */
    var nmMin = lamMin * 1e9, nmMax = lamMax * 1e9;
    var step = niceStep(nmMax - nmMin);
    ctx.font = F(0.7, 500);
    /* keep ticks clear of the axis title at the right-hand end */
    var titleLeft = padL + plotW - ctx.measureText('Wavelength (nm)').width - px(0.6);
    ctx.fillStyle = parchment;
    ctx.textAlign = 'center';
    for (var t = Math.ceil(nmMin / step) * step; t <= nmMax; t += step) {
      var tx = X(t * 1e-9), half = ctx.measureText(String(t)).width / 2;
      if (tx - half > padL + px(0.4) && tx + half < titleLeft) ctx.fillText(String(t), tx, padT + plotH + px(1.15));
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = ivory;
    ctx.fillText('Wavelength (nm)', padL + plotW, padT + plotH + px(1.15));
    ctx.save();
    ctx.translate(padL - px(0.8), padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Brightness', 0, 0);
    ctx.restore();

    /* the old classical curve — dashed, clipped at the top edge */
    var exitX = null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT - 2, plotW, plotH + 2);
    ctx.clip();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = ember;
    ctx.lineWidth = 2.2;
    /* Only the part inside the frame is drawn: clamping the rest to the
       top edge painted a flat dashed "ceiling" that read as a plateau
       rather than as a curve heading off to infinity. */
    ctx.beginPath();
    var started = false;
    for (var i = 0; i <= SAMPLES; i++) {
      var lam = lamMin + (lamMax - lamMin) * (i / SAMPLES);
      var v = Physics.rayleighJeans(lam, T);
      if (v > yMax) continue;
      var pxX = X(lam), pyY = Y(v);
      if (!started) { exitX = pxX; ctx.moveTo(pxX, padT); ctx.lineTo(pxX, pyY); started = true; }
      else ctx.lineTo(pxX, pyY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Planck — what really happens */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (var j2 = 0; j2 <= SAMPLES; j2++) {
      var lam2 = lamMin + (lamMax - lamMin) * (j2 / SAMPLES);
      var v2 = Physics.planck(lam2, T);
      var px2 = X(lam2), py2 = Y(v2);
      if (j2 === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    /* peak marker */
    var pxPeak = X(peak), pyPeak = Y(Physics.planck(peak, T));
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(pxPeak, pyPeak, 4.5, 0, Math.PI * 2);
    ctx.fill();

    /* direct labels, in plain words */
    ctx.textAlign = 'left';
    function backed(text, x, y, font, color) {
      ctx.font = font;
      var tw = ctx.measureText(text).width, th = Engine.textPx(stage, 1);
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = css('--ink', '#070a0e');
      ctx.fillRect(x - 4, y - th * 0.85, tw + 8, th * 1.15);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    }
    var planckLabel = 'Planck: what really happens';
    ctx.font = F(0.88, 600);
    var plx = Math.min(pxPeak + px(1.4), padL + plotW - ctx.measureText(planckLabel).width - 8);
    backed(planckLabel, plx, pyPeak + px(0.2), F(0.88, 600), accent);
    backed('brightest: ' + Math.round(peak * 1e9) + ' nm', plx, pyPeak + px(1.35), F(0.75, 500), ivory);

    if (exitX !== null) {
      /* up-arrow where the old theory leaves the chart */
      var ax = Math.max(padL + px(0.8), exitX);
      ctx.strokeStyle = ember;
      ctx.fillStyle = ember;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, padT + px(1.4));
      ctx.lineTo(ax, padT + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, padT - 3);
      ctx.lineTo(ax - 6, padT + 6);
      ctx.lineTo(ax + 6, padT + 6);
      ctx.closePath();
      ctx.fill();
      ctx.font = F(0.88, 600);
      ctx.fillText('Old theory \u2192 infinity!', ax + px(0.6), padT + px(0.6));
    }
    ctx.textAlign = 'left';
  }

  function sync() {
    var T = parseFloat(tempEl.value);
    if (tempVal) tempVal.textContent = Math.round(T) + ' K';
    if (peakOut) peakOut.textContent = Math.round(Physics.wienPeak(T) * 1e9).toString();
    draw();
  }

  tempEl.addEventListener('input', sync);
  tempEl.addEventListener('change', sync);

  Engine.register(lab, {
    init: function () {
      stage = Engine.setupCanvas(canvas);
      if (stage) stage.onFit = draw;   /* repaint after any refit clears the bitmap */
      sync();
    },
    resize: function () { if (stage && stage.refit) stage.refit(); draw(); }
  });
})();
