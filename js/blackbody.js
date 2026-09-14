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

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    var T = parseFloat(tempEl.value);

    var accent = css('--chapter-accent', '#6fd3e8');
    var ivory = css('--ivory', '#f0ece3');
    var stone = css('--stone', '#8b8579');
    var line = css('--line-soft', 'rgba(240,236,227,.06)');

    ctx.clearRect(0, 0, w, h);

    var padL = 44, padR = 16, padT = 18, padB = 30;
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
    var yMax = Physics.planck(peak, T) * 1.12;
    if (!isFinite(yMax) || yMax <= 0) return;

    var X = function (lam) { return padL + ((lam - lamMin) / (lamMax - lamMin)) * plotW; };
    var Y = function (v) { return padT + plotH - Math.max(0, Math.min(1, v / yMax)) * plotH; };

    /* axes */
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    /* Rayleigh-Jeans — dashed, clipped at the top edge */
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT - 2, plotW, plotH + 2);
    ctx.clip();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = css('--ember', '#d9673f');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var i = 0; i <= SAMPLES; i++) {
      var lam = lamMin + (lamMax - lamMin) * (i / SAMPLES);
      var v = Physics.rayleighJeans(lam, T);
      var px = X(lam), py = Y(v);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Planck */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j <= SAMPLES; j++) {
      var lam2 = lamMin + (lamMax - lamMin) * (j / SAMPLES);
      var v2 = Physics.planck(lam2, T);
      var px2 = X(lam2), py2 = Y(v2);
      if (j === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    /* Wien peak marker */
    var pxPeak = X(peak);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.45;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(pxPeak, padT); ctx.lineTo(pxPeak, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    /* labels */
    ctx.font = '400 10.5px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.fillText('intensity', 6, padT + 10);
    ctx.fillText('wavelength →', padL, h - 8);
    ctx.fillStyle = accent;
    ctx.fillText('Planck', padL + plotW - 108, padT + 14);
    ctx.fillStyle = css('--ember', '#d9673f');
    ctx.fillText('Rayleigh–Jeans', padL + plotW - 108, padT + 30);

    ctx.fillStyle = ivory;
    ctx.fillText(Math.round(peak * 1e9) + ' nm', Math.min(pxPeak + 6, padL + plotW - 60), padT + plotH - 6);
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
