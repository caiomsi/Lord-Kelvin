/* =================================================================
   KELVIN — peers.js
   Chapter 12 — his circle, as a radial network. Nodes are real
   <button>s positioned by JS (so the whole thing stays keyboard
   operable and screen-reader legible); the canvas behind them draws
   only the connecting lines and is aria-hidden.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('peers-lab');
  if (!lab) return;

  var Engine = window.KelvinEngine;
  if (!Engine) return;

  var net = document.getElementById('peers-net');
  var canvas = document.getElementById('peers-canvas');
  var host = lab.querySelector('.peers-nodes');
  var kindOut = document.getElementById('peer-kind');
  var nameOut = document.getElementById('peer-name');
  var textOut = document.getElementById('peer-text');
  if (!net || !canvas || !host || !kindOut || !nameOut || !textOut) return;

  var PEERS = [
    { s: 'Joule', n: 'James Prescott Joule', k: 'Collaborator',
      t: 'A Manchester brewer’s son the establishment was ignoring when Kelvin met him at the 1847 British Association meeting. Kelvin took him seriously, and the partnership produced the Joule–Thomson effect in 1852 — the basis of modern refrigeration.' },
    { s: 'Maxwell', n: 'James Clerk Maxwell', k: 'Fellow Scot',
      t: 'The other titan of Victorian British physics. They corresponded and respected each other, but Kelvin never fully accepted Maxwell’s electromagnetic field — it was abstract, and Kelvin wanted a mechanical model he could build.' },
    { s: 'Helmholtz', n: 'Hermann von Helmholtz', k: 'Close friend',
      t: 'A genuine friendship across the North Sea, sustained by visits and letters. Helmholtz’s own estimate of the Sun’s age by gravitational contraction sat alongside Kelvin’s Earth calculation — both later undone by physics neither man knew.' },
    { s: 'Stokes', n: 'George Gabriel Stokes', k: 'Correspondent',
      t: 'His closest scientific correspondent: roughly 650 letters over a lifetime, arguing through problems in real time. If you want to watch Victorian physics being done rather than published, it is in that correspondence.' },
    { s: 'Tait', n: 'Peter Guthrie Tait', k: 'Co-author',
      t: 'Co-author of the <em>Treatise on Natural Philosophy</em> — known to a generation of students simply as "T&amp;T′" — which reorganised physics teaching around energy. Tait also built the knot tables that Kelvin’s wrong vortex-atom theory inspired.' },
    { s: 'Faraday', n: 'Michael Faraday', k: 'Elder',
      t: 'The previous generation’s great experimentalist, and the source of the field concept Kelvin helped make mathematical. Kelvin’s early work translating Faraday’s intuitions into equations is part of what made Maxwell’s synthesis possible.' },
    { s: 'Clausius', n: 'Rudolf Clausius', k: 'Rival',
      t: 'Arrived at the second law of thermodynamics independently and very nearly simultaneously. Their two statements of it — Kelvin’s about engines, Clausius’s about heat flow — are logically equivalent, and both are still taught.' },
    { s: 'Darwin', n: 'Charles Darwin', k: 'Antagonist',
      t: 'Kelvin’s short age for the Earth was a direct threat to natural selection, which needed far more time. Darwin could not answer the physics and privately called Kelvin "an odious spectre." Darwin was right, for reasons nobody yet understood.' },
    { s: 'Field', n: 'Cyrus West Field', k: 'Financier',
      t: 'The American entrepreneur who kept raising money for a transatlantic cable through repeated, expensive failure. Kelvin sailed on the expeditions; Field’s persistence is why there was a cable for Kelvin’s physics to rescue.' },
    { s: 'Whitehouse', n: 'Wildman Whitehouse', k: 'Opponent',
      t: 'Chief electrician of the 1858 cable, who rejected Kelvin’s theory of signal retardation and drove the line with enormous voltages to force signals through. He destroyed the cable’s insulation within weeks. The 1866 cable used Kelvin’s approach instead.' },
    { s: 'Perry', n: 'John Perry', k: 'Student who was right',
      t: 'Kelvin’s own former assistant. In 1894–95 — before radioactivity was discovered — he showed that a convecting interior invalidates the cooling calculation, and produced an age of two to three billion years. He was largely ignored. See chapter 08.' },
    { s: 'Rutherford', n: 'Ernest Rutherford', k: 'The next generation',
      t: 'Spoke on radium and the age of rocks at the Royal Institution in 1904 with Kelvin, then eighty, in the audience — and talked his way out of the confrontation. The anecdote is genuine; the moral usually drawn from it is not.' }
  ];

  /* ---------- build the nodes ---------- */
  var nodes = [];
  for (var i = 0; i < PEERS.length; i++) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'peer-node';
    b.textContent = PEERS[i].s;
    b.setAttribute('data-i', i);
    b.setAttribute('aria-pressed', 'false');
    host.appendChild(b);
    nodes.push(b);
  }

  var stage = null;
  var selected = -1;

  function layout() {
    var w = net.clientWidth, h = net.clientHeight;
    if (!w || !h) return;
    var stacked = w < 700;
    for (var i = 0; i < nodes.length; i++) {
      if (stacked) { nodes[i].style.left = ''; nodes[i].style.top = ''; continue; }
      var a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      nodes[i].style.left = (50 + Math.cos(a) * 37) + '%';
      nodes[i].style.top = (50 + Math.sin(a) * 36) + '%';
    }
    net.classList.toggle('is-stacked', stacked);
    drawLines();
  }

  function drawLines() {
    if (!stage) return;
    var ctx = stage.ctx, w = stage.w, h = stage.h;
    ctx.clearRect(0, 0, w, h);
    if (net.classList.contains('is-stacked')) return;

    var accent = 'rgba(201,161,74,.30)';
    try {
      var v = getComputedStyle(lab).getPropertyValue('--chapter-accent');
      if (v && v.trim()) accent = v.trim();
    } catch (e) { /* keep fallback */ }

    for (var i = 0; i < nodes.length; i++) {
      var a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      var x = w / 2 + Math.cos(a) * w * 0.37;
      var y = h / 2 + Math.sin(a) * h * 0.36;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = (i === selected) ? 0.75 : 0.16;
      ctx.lineWidth = (i === selected) ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function select(idx) {
    if (idx < 0 || idx >= PEERS.length) return;
    selected = idx;
    var p = PEERS[idx];
    for (var i = 0; i < nodes.length; i++) {
      var on = (i === idx);
      nodes[i].classList.toggle('is-on', on);
      nodes[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    kindOut.textContent = p.k;
    nameOut.textContent = p.n;
    textOut.innerHTML = p.t;
    drawLines();
  }

  for (var k = 0; k < nodes.length; k++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        select(parseInt(btn.getAttribute('data-i'), 10) || 0);
      });
    })(nodes[k]);
  }

  lab.addEventListener('keydown', function (e) {
    if (selected < 0) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var next = (selected + (e.key === 'ArrowRight' ? 1 : -1) + PEERS.length) % PEERS.length;
    e.preventDefault();
    select(next);
    if (nodes[next]) nodes[next].focus();
  });

  Engine.register(lab, {
    init: function () {
      stage = Engine.setupCanvas(canvas);
      if (stage) stage.onFit = drawLines;
      layout();
    },
    resize: function () { if (stage && stage.refit) stage.refit(); layout(); }
  });
})();
