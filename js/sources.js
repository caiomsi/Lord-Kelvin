/* =================================================================
   KELVIN — sources.js
   Chapter 15 — the "Print reference page" button. Adds a body class
   the print stylesheet uses to hide everything except this chapter,
   so the bibliography prints alone as a hand-in sheet.
   ================================================================= */
(function () {
  'use strict';

  var btn = document.getElementById('print-refs');
  if (!btn) return;

  function clear() { document.body.classList.remove('print-refs-only'); }

  btn.addEventListener('click', function () {
    document.body.classList.add('print-refs-only');
    /* let the class paint before the (synchronous) print dialog */
    window.setTimeout(function () {
      try { window.print(); } finally { window.setTimeout(clear, 0); }
    }, 60);
  });

  /* belt and braces: some browsers fire this instead of returning
     from print() in a useful order */
  if (window.matchMedia) {
    try {
      window.matchMedia('print').addEventListener('change', function (e) {
        if (!e.matches) clear();
      });
    } catch (e) { /* older browsers: the timeout above covers it */ }
  }
  window.addEventListener('afterprint', clear);
})();
