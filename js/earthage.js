/* =================================================================
   KELVIN — earthage.js
   Chapter 08 — the age of the Earth, drawn to scale.

   The live bar is Kelvin's OWN 1862 formula (KelvinPhysics.
   kelvinEarthAge) driven by his own assumptions. The other bars are
   cited historical/modern figures, NOT recalculations — the whole
   point of the chapter is that his method cannot reach them, so
   faking a computation that did would defeat it.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('earthage-lab');
  if (!lab) return;

  var Physics = window.KelvinPhysics;
  var Engine = window.KelvinEngine;
  if (!Physics || !Engine) return;

  var canvas = document.getElementById('earthage-canvas');
  var out = document.getElementById('earthage-out');
  var t0El = document.getElementById('earthage-t0');
  var gradEl = document.getElementById('earthage-grad');
  var kapEl = document.getElementById('earthage-kappa');
  var perryEl = document.getElementById('earthage-perry');
  var radioEl = document.getElementById('earthage-radio');
  if (!canvas || !out || !t0El || !gradEl || !kapEl) return;

  var t0Val = document.getElementById('earthage-t0-value');
  var gradVal = document.getElementById('earthage-grad-value');
  var kapVal = document.getElementById('earthage-kappa-value');

  var PERRY_MY = 2500;    /* Perry 1895: "two to three billion years" */
  var MODERN_MY = 4540;   /* modern radiometric age */
  var RADIO_FACTOR = 2;   /* illustrative only — see the caption */

  var stage = null;

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

  function kelvinMy() {
    var T0 = parseFloat(t0El.value);
    var grad = parseFloat(gradEl.value) / 1000;      /* K/km -> K/m */
    var kappa = parseFloat(kapEl.value) * 1e-6;      /* µm²/s -> m²/s */
    var seconds = Physics.kelvinEarthAge(T0, grad, kappa);
    return seconds / Physics.SECONDS_PER_YEAR / 1e6;
  }

  function fmt(my) {
    if (my >= 1000) return (my / 1000).toFixed(2) + ' Gy';
    return Math.round(my) + ' My';
  }

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    var accent = css('--chapter-accent', '#d9673f');
    var ivory = css('--ivory', '#f0ece3');
    var stone = css('--stone', '#8b8579');
    var line = css('--line', 'rgba(240,236,227,.12)');

    ctx.clearRect(0, 0, w, h);

    var rows = [{ label: 'Kelvin, 1862 — conduction only', my: kelvinMy(), key: 'kelvin' }];
    if (radioEl && radioEl.checked) {
      rows.push({ label: 'Kelvin’s method + radiogenic heat', my: kelvinMy() * RADIO_FACTOR, key: 'radio' });
    }
    if (perryEl && perryEl.checked) {
      rows.push({ label: 'Perry, 1895 — convecting interior', my: PERRY_MY, key: 'perry' });
    }
    rows.push({ label: 'Modern — radiometric dating', my: MODERN_MY, key: 'modern' });

    var padL = Math.min(28, w * 0.05);
    var padR = Math.min(28, w * 0.05);
    var top = Math.max(22, h * 0.10);
    var avail = w - padL - padR;
    var rowH = Math.min(78, (h - top - 20) / rows.length);
    var barH = Math.min(26, rowH * 0.34);
    var blockH = rowH * rows.length;
    top = Math.max(top, (h - 18 - blockH) / 2 + 14);
    var slot = rowH;

    ctx.textBaseline = 'alphabetic';

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var y = top + i * slot;
      var frac = Math.max(0, Math.min(1, r.my / MODERN_MY));
      var bw = Math.max(1.5, avail * frac);

      /* label */
      ctx.font = '500 ' + Math.max(10, Math.min(12.5, w / 52)) + 'px Inter, system-ui, sans-serif';
      ctx.fillStyle = (r.key === 'kelvin') ? ivory : stone;
      ctx.fillText(r.label, padL, y - 6);

      /* track */
      ctx.fillStyle = line;
      ctx.fillRect(padL, y, avail, barH);

      /* bar */
      ctx.globalAlpha = (r.key === 'kelvin') ? 1 : (r.key === 'modern' ? 0.58 : 0.42);
      ctx.fillStyle = accent;
      ctx.fillRect(padL, y, bw, barH);
      ctx.globalAlpha = 1;

      /* value — inside the bar if it fits, otherwise just past its end */
      ctx.font = '400 ' + Math.max(10, Math.min(12, w / 56)) + 'px "IBM Plex Mono", ui-monospace, monospace';
      var txt = fmt(r.my);
      var tw = ctx.measureText(txt).width;
      if (bw > tw + 16) {
        ctx.fillStyle = css('--ink', '#070a0e');
        ctx.fillText(txt, padL + bw - tw - 8, y + barH - (barH - 9) / 2);
      } else {
        ctx.fillStyle = (r.key === 'kelvin') ? accent : stone;
        ctx.fillText(txt, padL + bw + 8, y + barH - (barH - 9) / 2);
      }
    }

    /* footer note */
    ctx.font = '400 ' + Math.max(9.5, Math.min(11, w / 62)) + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    ctx.fillText('drawn to scale — 0 to 4.54 Gy', padL, h - 5);
  }

  function sync() {
    var my = kelvinMy();
    out.textContent = my >= 1000 ? (my / 1000).toFixed(2) : Math.round(my).toString();
    var unit = out.parentElement && out.parentElement.querySelector('.figcap');
    if (unit) unit.textContent = my >= 1000 ? 'billion years' : 'million years';
    if (t0Val) t0Val.textContent = Math.round(parseFloat(t0El.value)) + ' K';
    if (gradVal) gradVal.textContent = parseFloat(gradEl.value).toFixed(1) + ' K/km';
    if (kapVal) kapVal.textContent = parseFloat(kapEl.value).toFixed(2);
    draw();
  }

  [t0El, gradEl, kapEl, perryEl, radioEl].forEach(function (el) {
    if (el) el.addEventListener('input', sync);
    if (el) el.addEventListener('change', sync);
  });

  Engine.register(lab, {
    init: function () {
      stage = Engine.setupCanvas(canvas);
      if (stage) stage.onFit = draw;   /* repaint after any refit clears the bitmap */
      sync();
    },
    resize: function () { if (stage && stage.refit) stage.refit(); draw(); }
  });
})();
