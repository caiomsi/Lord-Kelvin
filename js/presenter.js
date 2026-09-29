/* =================================================================
   KELVIN — presenter.js
   Presenter mode: a curated ~4:20 route through the site for a timed
   3-5 minute talk, plus a Q&A sheet for the questions afterwards.

   P      toggle presenter mode
   < >    previous / next stop
   Q      Q&A cheat sheet
   Esc    close the sheet, or leave presenter mode
   ================================================================= */
(function () {
  'use strict';

  var toggleBtn = document.getElementById('presenter-toggle');
  var body = document.body;
  if (!body) return;

  /* ---------------- the run ---------------- */
  var STOPS = [
    { id: 'ch03', secs: 30, title: 'Hook — absolute zero',
      points: [
        'Every temperature has a floor: absolute zero, −273.15 °C. Kelvin worked it out in 1848, aged 23.',
        'Drag the slider down — the molecules slow down and stop at 0 K.',
        'Now drag it up — faster and faster, until they glow like the Sun.'
      ] },
    { id: 'ch01', secs: 30, title: 'Who he was',
      points: [
        'Born in Belfast in 1824. His father, a maths professor, taught him at home.',
        'At university at 10. First physics paper at 16. Professor at 22 — for 53 years.',
        'Later made Lord Kelvin, named after the river beside his university.'
      ] },
    { id: 'ch02', secs: 25, title: 'His world',
      points: [
        'Britain’s Industrial Revolution: steam, iron ships, empire and the telegraph.',
        'Science was expected to be useful. The word “scientist” was only invented in 1833.',
        'Necessity or happenstance? Both — his money came from necessity, his best physics from curiosity.'
      ] },
    { id: 'ch04', secs: 40, title: 'The Second Law',
      points: [
        'Before him, heat was thought to be a fluid called “caloric”.',
        'His law: no engine can turn all of its heat into work.',
        'Drag the cold side toward 0 K — 100% efficiency needs absolute zero, which is impossible.',
        'It sets the limit on every engine, power station and fridge today.'
      ] },
    { id: 'ch05', secs: 35, title: 'The Atlantic cable',
      points: [
        '1858: the first Atlantic cable burned out within weeks.',
        'Kelvin showed the delay grows with the square of the length — double the cable, 4× the delay.',
        'His fix: small currents plus a super-sensitive detector. The 1866 cable worked — knighted, and rich.'
      ] },
    { id: 'ch07', secs: 40, title: 'Where he was wrong',
      points: [
        'He said the Earth was 20–40 million years old. It is 4.5 billion.',
        'Most books blame radioactivity. The real flaw: he assumed heat only soaks out through solid rock.',
        'His own former assistant, John Perry, showed in 1895 that a flowing interior gives billions of years.',
        'His maths was right. One assumption was wrong.'
      ] },
    { id: 'ch08', secs: 40, title: 'Where he was right',
      points: [
        'In 1900 he named two problems physics could not explain.',
        'They became relativity and quantum physics within 5 years.',
        'On the chart, the old theory shoots off to infinity — that is cloud number 2.',
        'He never said “there is nothing new to discover” — no source exists.',
        'Buried next to Isaac Newton. Every scientist measures temperature in kelvin.'
      ] }
  ];

  var TOTAL = 0;
  for (var s0 = 0; s0 < STOPS.length; s0++) TOTAL += STOPS[s0].secs;

  /* ---------------- Q&A sheet ---------------- */
  var QA = [
    { h: 'Biographical', items: [
      ['Born?', 'Belfast, 26 June 1824. Died at Largs, Scotland, 17 December 1907.'],
      ['Family?', 'Father James Thomson, a farmer’s son turned maths professor, taught his children at home. Mother died when William was six.'],
      ['Education?', 'University of Glasgow from age ten; Peterhouse, Cambridge 1841–45 — Second Wrangler but Smith’s Prize winner; then a year in Regnault’s lab in Paris.'],
      ['Early interest?', 'Read Fourier’s heat theory at sixteen and published a paper defending it that year, under the pseudonym "P.Q.R."'],
      ['Career?', 'Professor of Natural Philosophy at Glasgow at twenty-two, for fifty-three years. Founded Britain’s first physics teaching lab.']
    ] },
    { h: 'World context', items: [
      ['What was happening?', 'Peak Victorian industry — steam, iron, railways, empire — plus a global telegraph boom. Great Exhibition 1851; Irish famine 1845–52; Darwin’s Origin 1859.'],
      ['View of science then?', 'Science was expected to be useful; prestige came from the machinery it improved. The word "scientist" was coined in 1833.'],
      ['Necessity or happenstance?', 'Both. Cable, compass, sounder and tide predictor were commercial. The absolute scale and the Second Law were pure theory. Joule–Thomson came from meeting Joule at an 1847 meeting.']
    ] },
    { h: 'Science', items: [
      ['Famous for?', 'The absolute temperature scale (the kelvin), his statement of the Second Law, and making the transatlantic telegraph work.'],
      ['Believed before him?', 'Heat was "caloric," a fluid. Temperature had no agreed lower bound. Telegraph signals were assumed effectively instant.'],
      ['Effect today?', 'Every scientific temperature is in kelvin; Joule–Thomson underlies refrigeration, liquid nitrogen and MRI magnets; undersea cables still carry the internet.'],
      ['How did it change physics?', 'Temperature became substance-independent; the Second Law got its engine formulation; and his 1900 "two clouds" named the problems that became relativity and quantum mechanics.'],
      ['Awards?', 'FRS 1851, Royal Medal 1856, knighted 1866, Copley Medal 1883, President of the Royal Society 1890–95, Baron Kelvin of Largs 1892, Order of Merit 1902. Never a Nobel — they began in 1901.']
    ] },
    { h: 'Personal', items: [
      ['What was he like?', 'A restless, digressive lecturer who abandoned his own syllabus mid-course. Devout, stubborn, and gracious when finally proved wrong.'],
      ['Hobbies?', 'Sailing — he owned the 126-ton yacht Lalla Rookh and worked aboard her. Played the French horn. Won the Colquhoun Sculls at Cambridge in 1843.'],
      ['Peers?', 'Joule (collaborator), Maxwell, Helmholtz (close friend), Stokes (~650 letters), Tait (co-author), Faraday, Clausius (rival), Darwin (antagonist), Perry, Rutherford.'],
      ['Philosophy of science?', 'Two things: if you cannot measure it in numbers your knowledge is "meagre and unsatisfactory"; and nothing is understood until you can build a mechanical model of it.'],
      ['Anything unusual?', 'He got rich from ~70 patents while holding a chair. In 1881 his Glasgow house became one of the first in the world lit entirely by electric light. First British scientist raised to the House of Lords.']
    ] },
    { h: 'The hard questions', items: [
      ['Was he wrong about anything?', 'Badly — the age of the Earth. He said 20–40 million years; it is 4.54 billion.'],
      ['So radioactivity proved him wrong?', 'No — that is the myth. John Perry showed in 1894–95, before radioactivity was discovered, that a convecting interior gives billions of years. Radiogenic heat is only about half of present surface heat loss; convection does the heavy lifting.'],
      ['Didn’t he say physics was finished?', 'No. There is no primary source for that quote. The nearest real one is Michelson, 1894. In 1900 Kelvin publicly said the opposite — the "two clouds" lecture.'],
      ['Why is the unit named after a river?', 'His title, Baron Kelvin of Largs, came from the River Kelvin beside the University of Glasgow.']
    ] }
  ];

  /* ---------------- build the UI ---------------- */
  var bar = document.createElement('div');
  bar.className = 'pres-bar';
  bar.setAttribute('hidden', '');
  bar.innerHTML =
    '<div class="pres-left">' +
      '<span class="pres-step" id="pres-step">1/' + STOPS.length + '</span>' +
      '<span class="pres-title" id="pres-title"></span>' +
    '</div>' +
    '<ul class="pres-points" id="pres-points"></ul>' +
    '<div class="pres-right">' +
      '<span class="pres-clock" id="pres-clock">0:00</span>' +
      '<span class="pres-target" id="pres-target">/ ' + Math.floor(TOTAL / 60) + ':' + ('0' + (TOTAL % 60)).slice(-2) + '</span>' +
      '<div class="pres-nav">' +
        '<button type="button" id="pres-prev" aria-label="Previous stop">&larr;</button>' +
        '<button type="button" id="pres-next" aria-label="Next stop">&rarr;</button>' +
        '<button type="button" id="pres-qa" aria-label="Q and A sheet">Q&amp;A</button>' +
        '<button type="button" id="pres-exit" aria-label="Leave presenter mode">Esc</button>' +
      '</div>' +
    '</div>';
  body.appendChild(bar);

  var sheet = document.createElement('div');
  sheet.className = 'pres-sheet';
  sheet.setAttribute('hidden', '');
  var sheetHtml = '<div class="pres-sheet-inner"><h2>Q&amp;A — everything the assignment asked</h2>';
  for (var q = 0; q < QA.length; q++) {
    sheetHtml += '<h3>' + QA[q].h + '</h3><dl>';
    for (var r = 0; r < QA[q].items.length; r++) {
      sheetHtml += '<dt>' + QA[q].items[r][0] + '</dt><dd>' + QA[q].items[r][1] + '</dd>';
    }
    sheetHtml += '</dl>';
  }
  sheetHtml += '<p class="pres-sheet-hint">Q or Esc to close</p></div>';
  sheet.innerHTML = sheetHtml;
  body.appendChild(sheet);

  var stepEl = document.getElementById('pres-step');
  var titleEl = document.getElementById('pres-title');
  var pointsEl = document.getElementById('pres-points');
  var clockEl = document.getElementById('pres-clock');

  /* ---------------- state ---------------- */
  var on = false, idx = 0, t0 = 0, tick = null;

  function mmss(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + ('0' + s).slice(-2);
  }

  function cumulativeTo(i) {
    var c = 0;
    for (var k = 0; k <= i && k < STOPS.length; k++) c += STOPS[k].secs;
    return c;
  }

  function updateClock() {
    if (!on) return;
    var el = (Date.now() - t0) / 1000;
    clockEl.textContent = mmss(el);
    clockEl.classList.toggle('is-warn', el > cumulativeTo(idx) && el <= TOTAL + 40);
    clockEl.classList.toggle('is-over', el > TOTAL + 40);
  }

  function show(i) {
    if (i < 0 || i >= STOPS.length) return;
    idx = i;
    var st = STOPS[i];
    stepEl.textContent = (i + 1) + '/' + STOPS.length;
    titleEl.textContent = st.title + '  ·  ' + st.secs + 's';
    pointsEl.innerHTML = '';
    for (var p = 0; p < st.points.length; p++) {
      var li = document.createElement('li');
      li.textContent = st.points[p];
      pointsEl.appendChild(li);
    }
    var target = document.getElementById(st.id);
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    updateClock();
  }

  function start() {
    on = true;
    body.classList.add('presenting');
    bar.removeAttribute('hidden');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'true');
    t0 = Date.now();
    if (tick) clearInterval(tick);
    tick = setInterval(updateClock, 500);
    try { sessionStorage.setItem('kelvin-presenting', '1'); } catch (e) { /* private mode */ }
    show(0);
  }

  function stop() {
    on = false;
    body.classList.remove('presenting');
    bar.setAttribute('hidden', '');
    sheet.setAttribute('hidden', '');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'false');
    if (tick) { clearInterval(tick); tick = null; }
    try { sessionStorage.removeItem('kelvin-presenting'); } catch (e) { /* private mode */ }
  }

  function toggleSheet(force) {
    var open = (force === undefined) ? sheet.hasAttribute('hidden') : force;
    if (open) sheet.removeAttribute('hidden'); else sheet.setAttribute('hidden', '');
  }

  /* ---------------- wiring ---------------- */
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleBtn.addEventListener('click', function () { on ? stop() : start(); });
  }
  var byId = function (id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); };
  byId('pres-prev', function () { show(idx - 1); });
  byId('pres-next', function () { show(idx + 1); });
  byId('pres-qa', function () { toggleSheet(); });
  byId('pres-exit', stop);

  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;

    if (k === 'p' || k === 'P') { e.preventDefault(); on ? stop() : start(); return; }
    if (!on) return;
    if (k === 'Escape') {
      e.preventDefault();
      if (!sheet.hasAttribute('hidden')) toggleSheet(false); else stop();
      return;
    }
    if (k === 'q' || k === 'Q') { e.preventDefault(); toggleSheet(); return; }
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); show(idx + 1); return; }
    if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); show(idx - 1); return; }
  });

  /* survive a reload right before presenting */
  try {
    if (sessionStorage.getItem('kelvin-presenting') === '1') start();
  } catch (e) { /* private mode: just don't restore */ }
})();
