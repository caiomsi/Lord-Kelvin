/* =================================================================
   KELVIN — necessity.js
   Chapter 02 — "Necessity or happenstance?" Kelvin's major works
   placed on a curiosity <-> commerce axis. Plain DOM (no canvas):
   it stays keyboard-operable and reflows to a list on small screens.
   ================================================================= */
(function () {
  'use strict';

  var lab = document.getElementById('necessity-lab');
  if (!lab) return;

  var track = document.getElementById('necessity-track');
  var kindOut = document.getElementById('necessity-kind');
  var verdictOut = document.getElementById('necessity-verdict');
  var items = lab.querySelectorAll('.necessity-item');
  if (!track || !kindOut || !verdictOut || !items.length) return;

  /* pos: 0 = pure curiosity, 100 = pure commercial necessity */
  var WORKS = [
    { pos: 6, kind: 'Pure theory', name: 'Absolute temperature scale',
      verdict: 'Nobody asked for it and nobody could sell it. It came straight out of reading Carnot: if an ideal engine’s efficiency depends only on two temperatures, temperature itself can be defined from the engine. The most permanent thing he ever did, worth nothing at the time.' },
    { pos: 14, kind: 'Pure theory', name: 'The Second Law',
      verdict: 'A statement about what the universe will not let you do, written while the caloric theory was still being buried. Its commercial value in 1851 was zero; its consequence — that usable energy runs down everywhere, forever — is still reshaping cosmology.' },
    { pos: 23, kind: 'Pure theory', name: 'Age of the Earth',
      verdict: 'Driven by an argument, not a market. He wanted to put a physical bound on geological time and, in doing so, on Darwin. It made him no money and he was wrong — see chapter 08 for why, and why the usual explanation of his error is also wrong.' },
    { pos: 39, kind: 'Happenstance', name: 'Joule–Thomson effect',
      verdict: 'Pure luck of the room. He met James Prescott Joule — a brewer’s son the establishment was ignoring — at the 1847 British Association meeting, and the friendship produced an effect that now underpins every refrigerator, air liquefier and MRI magnet on Earth.' },
    { pos: 64, kind: 'Commercial', name: 'Tide-predicting machine',
      verdict: 'Harbours, shipping and the Admiralty needed tide tables faster than humans could compute them. He answered with a brass analogue computer that summed sine waves mechanically — commerce paying for an idea he had absorbed from Fourier at sixteen.' },
    { pos: 76, kind: 'Commercial', name: 'Sounding machine',
      verdict: 'Ships needed to measure depth without stopping. His piano-wire sounder let a vessel take soundings at speed — a straightforwardly commercial instrument, straightforwardly patented.' },
    { pos: 84, kind: 'Commercial', name: 'Mariner’s compass',
      verdict: 'Iron ships had made existing compasses unreliable. His redesign was adopted by the Royal Navy and sold widely. Invented because a fleet full of steel hulls was a market, not because magnetism puzzled him.' },
    { pos: 94, kind: 'Commercial', name: 'Cable theory & mirror galvanometer',
      verdict: 'The purest case of necessity in his career. Investors had sunk fortunes into a cable that did not work; he produced the theory explaining why and the instrument sensitive enough to rescue it. It earned him a knighthood in 1866 and made him rich.' }
  ];

  /* ---------- plot the markers on the axis ---------- */
  var marks = [];
  for (var i = 0; i < WORKS.length; i++) {
    var m = document.createElement('span');
    m.className = 'necessity-mark';
    m.style.left = WORKS[i].pos + '%';
    track.appendChild(m);
    marks.push(m);
  }

  var selected = -1;

  function select(idx) {
    if (idx < 0 || idx >= WORKS.length) return;
    selected = idx;
    var w = WORKS[idx];

    for (var i = 0; i < items.length; i++) {
      var on = (i === idx);
      items[i].classList.toggle('is-on', on);
      items[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      if (marks[i]) marks[i].classList.toggle('is-on', on);
    }

    kindOut.textContent = w.kind;
    kindOut.setAttribute('data-kind', w.kind.toLowerCase().split(' ')[0]);
    verdictOut.textContent = w.name + ' — ' + w.verdict;
  }

  for (var k = 0; k < items.length; k++) {
    items[k].setAttribute('aria-pressed', 'false');
    (function (btn) {
      btn.addEventListener('click', function () {
        select(parseInt(btn.getAttribute('data-i'), 10) || 0);
      });
    })(items[k]);
  }

  /* left/right arrows walk the axis once something is selected */
  lab.addEventListener('keydown', function (e) {
    if (selected < 0) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    /* presenter mode binds the same keys on document to move between
       stops — don't let one press both change the selection and jump
       the talk */
    e.stopPropagation();
    var next = selected + (e.key === 'ArrowRight' ? 1 : -1);
    if (next < 0 || next >= WORKS.length) return;
    e.preventDefault();
    select(next);
    if (items[next]) items[next].focus();
  });
})();
