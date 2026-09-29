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

  /* plain units — "96 million years", not "96 My" */
  function fmt(my) {
    if (my >= 1000) {
      var gy = my / 1000;
      return (gy >= 10 ? gy.toFixed(0) : gy.toFixed(2).replace(/0$/, '')) + ' billion years';
    }
    return Math.round(my) + ' million years';
  }

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    var accent = css('--chapter-accent', '#d9673f');
    var ivory = css('--ivory', '#f0ece3');
    var parchment = css('--parchment', '#c7c2b6');
    var line = css('--line', 'rgba(240,236,227,.12)');
    var F = function (scale, weight, fam) { return Engine.font(stage, scale, weight, fam); };
    var px = function (scale) { return Engine.textPx(stage, scale); };

    ctx.clearRect(0, 0, w, h);

    var kMy = kelvinMy();
    /* All four rows are always drawn, so the layout never jumps; an
       unticked row is a faint placeholder pointing at its tick-box. */
    var rows = [
      { label: 'Kelvin (1862): heat escapes only through solid rock', my: kMy, key: 'kelvin', on: true },
      { label: 'Kelvin + radioactive heat', my: kMy * RADIO_FACTOR, key: 'radio', on: !!(radioEl && radioEl.checked) },
      { label: 'Perry (1895): the hot interior flows', my: PERRY_MY, key: 'perry', on: !!(perryEl && perryEl.checked) },
      { label: 'The real age (radioactive dating)', my: MODERN_MY, key: 'modern', on: true }
    ];

    var padL = Math.max(12, Math.min(28, w * 0.04));
    var padR = padL;
    var avail = w - padL - padR;

    /* the headline, computed from the bars below */
    var pct = kMy / MODERN_MY * 100;
    var pctTxt = (pct < 1 ? pct.toFixed(1) : Math.round(pct).toString()) + '%';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    var headY = px(1.6);
    ctx.font = F(1.05, 600);
    var a1 = 'Kelvin\u2019s answer is only ', a3 = ' of the real age';
    ctx.fillStyle = ivory;
    ctx.fillText(a1, padL, headY);
    var x2 = padL + ctx.measureText(a1).width;
    ctx.fillStyle = accent;
    ctx.fillText(pctTxt, x2, headY);
    ctx.fillStyle = ivory;
    ctx.fillText(a3, x2 + ctx.measureText(pctTxt).width, headY);

    var top = headY + px(2.6);
    var footer = px(1.3);
    var rowH = Math.min(px(4.4), (h - top - footer) / rows.length);
    var barH = Math.max(12, Math.min(px(1.5), rowH * 0.4));

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var y = top + i * rowH;
      var frac = Math.max(0, Math.min(1, r.my / MODERN_MY));
      var bw = Math.max(3, avail * frac);
      var isK = (r.key === 'kelvin');

      ctx.font = F(0.82, isK ? 600 : 500);
      ctx.fillStyle = isK ? ivory : parchment;
      ctx.globalAlpha = r.on ? 1 : 0.45;
      ctx.fillText(r.label, padL, y - px(0.45));
      ctx.globalAlpha = 1;

      ctx.fillStyle = line;
      ctx.fillRect(padL, y, avail, barH);

      if (!r.on) {
        ctx.font = F(0.72, 500);
        ctx.fillStyle = parchment;
        ctx.globalAlpha = 0.7;
        ctx.fillText('\u2193 tick the box below to add this bar', padL + 10, y + barH / 2 + px(0.28));
        ctx.globalAlpha = 1;
        continue;
      }

      ctx.globalAlpha = isK ? 1 : (r.key === 'modern' ? 0.65 : 0.5);
      ctx.fillStyle = accent;
      ctx.fillRect(padL, y, bw, barH);
      ctx.globalAlpha = 1;

      /* value — inside the bar if it fits, otherwise just past its end */
      ctx.font = F(0.82, 600, 'mono');
      var txt = fmt(r.my);
      var tw = ctx.measureText(txt).width;
      var ty = y + barH / 2 + px(0.3);
      if (bw > tw + 20) {
        ctx.fillStyle = css('--ink', '#070a0e');
        ctx.fillText(txt, padL + bw - tw - 10, ty);
      } else {
        /* a small pointer so Kelvin's sliver can't be missed */
        ctx.fillStyle = isK ? accent : ivory;
        ctx.beginPath();
        ctx.moveTo(padL + bw + 6, ty - px(0.3));
        ctx.lineTo(padL + bw + 14, ty - px(0.3) - 5);
        ctx.lineTo(padL + bw + 14, ty - px(0.3) + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillText(txt, padL + bw + 20, ty);
      }
    }

    ctx.font = F(0.68, 500);
    ctx.fillStyle = parchment;
    ctx.fillText('Bars drawn to scale: the full width is 4.54 billion years', padL, h - px(0.4));
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
