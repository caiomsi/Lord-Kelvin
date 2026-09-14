/* =================================================================
   KELVIN — timeline.js
   Chapter 14 — 1824-1907 on two tracks: his life above the axis,
   the wider world below it. The canvas is the visual; the same data
   is also rendered as two real lists so the content is readable
   without it.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('timeline-lab');
  if (!lab) return;

  var Engine = window.KelvinEngine;
  if (!Engine) return;

  var canvas = document.getElementById('timeline-canvas');
  var yearEl = document.getElementById('tl-year');
  var yearVal = document.getElementById('tl-year-value');
  var kindOut = document.getElementById('tl-kind');
  var eventOut = document.getElementById('tl-event');
  var listLife = document.getElementById('tl-list-life');
  var listWorld = document.getElementById('tl-list-world');
  if (!canvas || !yearEl) return;

  var Y0 = 1824, Y1 = 1907;

  var LIFE = [
    [1824, 'Born in Belfast, 26 June.'],
    [1832, 'Family moves to Glasgow; his father takes the mathematics chair.'],
    [1834, 'Matriculates at the University of Glasgow, aged ten.'],
    [1841, 'Reads Fourier at sixteen and publishes his first paper as "P.Q.R."; enters Peterhouse, Cambridge.'],
    [1845, 'Second Wrangler and Smith’s Prize winner; spends a year in Regnault’s laboratory in Paris.'],
    [1846, 'Elected Professor of Natural Philosophy at Glasgow, aged twenty-two.'],
    [1847, 'Meets James Prescott Joule at the British Association meeting.'],
    [1848, 'Proposes the absolute thermometric scale.'],
    [1851, 'States the second law of thermodynamics; elected FRS.'],
    [1852, 'The Joule–Thomson effect; "On a Universal Tendency in Nature to the Dissipation of Mechanical Energy." Marries Margaret Crum.'],
    [1858, 'First transatlantic cable fails; his mirror galvanometer is patented.'],
    [1862, 'Publishes his calculation of the age of the Earth.'],
    [1866, 'The cable succeeds. Knighted.'],
    [1867, 'Proposes the vortex-atom theory of matter.'],
    [1870, 'Buys the yacht Lalla Rookh. Margaret dies.'],
    [1874, 'Marries Frances Blandy on his fiftieth birthday; builds Netherhall at Largs.'],
    [1876, 'The tide-predicting machine; his mariner’s compass adopted by the Royal Navy.'],
    [1881, 'His Glasgow house becomes the first in Britain lit by electric light.'],
    [1883, 'The "measure it in numbers" lecture on electrical units. Copley Medal.'],
    [1890, 'Becomes President of the Royal Society.'],
    [1892, 'Created Baron Kelvin of Largs — the first British scientist in the Lords.'],
    [1896, 'Has his own hand X-rayed and congratulates Röntgen. Declines the Aeronautical Society.'],
    [1899, 'Retires from the Glasgow chair after fifty-three years.'],
    [1900, 'The "two clouds" lecture at the Royal Institution, 27 April.'],
    [1902, 'Order of Merit; Privy Counsellor.'],
    [1904, 'Rutherford lectures on radium with Kelvin in the audience.'],
    [1907, 'Dies at Netherhall, 17 December. Buried in Westminster Abbey beside Newton.']
  ];

  var WORLD = [
    [1833, 'The word "scientist" is coined by William Whewell.'],
    [1845, 'The Irish famine begins; it will kill about a million people by 1852.'],
    [1851, 'The Great Exhibition opens in London.'],
    [1859, 'Darwin publishes On the Origin of Species.'],
    [1861, 'The American Civil War begins, interrupting cable work.'],
    [1865, 'Maxwell publishes his dynamical theory of the electromagnetic field.'],
    [1869, 'Mendeleev publishes the periodic table.'],
    [1879, 'Edison demonstrates a practical incandescent lamp.'],
    [1887, 'Michelson and Morley fail to detect motion through the ether.'],
    [1895, 'Röntgen discovers X-rays.'],
    [1896, 'Becquerel discovers radioactivity.'],
    [1897, 'J. J. Thomson identifies the electron.'],
    [1900, 'Planck quantises energy to explain blackbody radiation.'],
    [1905, 'Einstein’s special relativity and light-quantum papers.']
  ];

  /* ---------- the accessible lists ---------- */
  function fill(ul, rows) {
    if (!ul) return;
    for (var i = 0; i < rows.length; i++) {
      var li = document.createElement('li');
      var b = document.createElement('b');
      b.textContent = rows[i][0];
      li.appendChild(b);
      li.appendChild(document.createTextNode(' ' + rows[i][1]));
      ul.appendChild(li);
    }
  }
  fill(listLife, LIFE);
  fill(listWorld, WORLD);

  var stage = null;

  function css(name, fallback) {
    try {
      var v = getComputedStyle(lab).getPropertyValue(name);
      return (v && v.trim()) || fallback;
    } catch (e) { return fallback; }
  }

  function nearest(year) {
    var best = null, bestD = 1e9, kind = 'His life';
    var i;
    for (i = 0; i < LIFE.length; i++) {
      var d = Math.abs(LIFE[i][0] - year);
      if (d < bestD) { bestD = d; best = LIFE[i]; kind = 'His life'; }
    }
    for (i = 0; i < WORLD.length; i++) {
      var d2 = Math.abs(WORLD[i][0] - year);
      if (d2 < bestD) { bestD = d2; best = WORLD[i]; kind = 'The world'; }
    }
    return { row: best, kind: kind };
  }

  function draw() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    var accent = css('--chapter-accent', '#c9a14a');
    var stone = css('--stone', '#8b8579');
    var ivory = css('--ivory', '#f0ece3');

    ctx.clearRect(0, 0, w, h);

    var padL = 16, padR = 16;
    var plotW = w - padL - padR;
    var axisY = h / 2;
    var X = function (y) { return padL + ((y - Y0) / (Y1 - Y0)) * plotW; };

    /* axis + decade ticks */
    ctx.strokeStyle = css('--line', 'rgba(240,236,227,.12)');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, axisY); ctx.lineTo(padL + plotW, axisY); ctx.stroke();

    ctx.font = '400 9.5px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = stone;
    for (var d = 1830; d <= 1900; d += 10) {
      var dx = X(d);
      ctx.beginPath(); ctx.moveTo(dx, axisY - 3); ctx.lineTo(dx, axisY + 3); ctx.stroke();
      ctx.fillText(String(d), dx - 12, axisY + 15);
    }

    var year = parseInt(yearEl.value, 10);

    function marks(rows, dir) {
      for (var i = 0; i < rows.length; i++) {
        var x = X(rows[i][0]);
        var on = Math.abs(rows[i][0] - year) <= 1;
        var len = on ? (h * 0.30) : (h * 0.16);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = on ? 0.95 : 0.34;
        ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + dir * len);
        ctx.stroke();
        if (on) {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(x, axisY + dir * len, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    marks(LIFE, -1);
    marks(WORLD, 1);

    /* the scrubber */
    var px = X(year);
    ctx.strokeStyle = ivory;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(px, 6); ctx.lineTo(px, h - 6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.fillStyle = stone;
    ctx.font = '400 9.5px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('his life', padL, 14);
    ctx.fillText('the world', padL, h - 6);
  }

  function sync() {
    var year = parseInt(yearEl.value, 10);
    if (yearVal) yearVal.textContent = String(year);
    var n = nearest(year);
    if (n.row) {
      if (kindOut) kindOut.textContent = n.kind;
      if (eventOut) eventOut.textContent = n.row[0] + ' — ' + n.row[1];
    }
    draw();
  }

  yearEl.addEventListener('input', sync);
  yearEl.addEventListener('change', sync);

  Engine.register(lab, {
    init: function () {
      stage = Engine.setupCanvas(canvas);
      if (stage) stage.onFit = draw;
      sync();
    },
    resize: function () { if (stage && stage.refit) stage.refit(); draw(); }
  });
})();
