# CLAUDE.md

Guidance for Claude Code when working in this repository. See the root
`../CLAUDE.md` for shared workspace conventions.

## What this is

**Kelvin — The Absolute Scale**: an immersive, interactive single-page site about
**William Thomson, 1st Baron Kelvin (1824–1907)**, built as an AP Physics class
research project. It is a *school deliverable*, not a marketing site, and it doubles
as the instrument the talk is given from.

Two things make it different from the other sites in this workspace:
1. **It has a real test suite + CI** (like `Contour` and `pac-game`). Every formula
   the page draws lives in `js/physics.js` and is covered by `test/physics.test.js`.
2. **It has a presenter mode** — the assignment caps the talk at 3–5 minutes.

## How it runs

Plain static HTML/CSS/vanilla JS, no build step. Open `index.html`, or serve the
folder (`python3 -m http.server`) and visit `http://localhost:8000`.

Tests: `node test/physics.test.js` — zero dependencies, prints PASS/FAIL, exits
non-zero on failure. `.github/workflows/ci.yml` runs it on push to `master` and on PRs.

## Structure

```
index.html              one page, 11 chapters in four parts + hero + summary card
css/style.css           tokens first; per-chapter accent switching; presenter + print
js/physics.js           ★ PURE + TESTED: every formula the site draws
js/engine.js            shared canvas/rAF runtime; pauses modules when off-screen
js/main.js              chapter rail, scroll progress, reveal, hero particle field
js/presenter.js         presenter mode: timed run, talking points, Q&A sheet
js/sources.js           the "print reference page" button
js/<topic>.js           one module per experiment: thermometer, carnot, tides,
                        earthage, blackbody
test/physics.test.js    63 zero-dep assertions
images/                 4 public-domain historical images + the social card
RESEARCH.md             verified facts + bibliography — the content's source of truth
```

## The rules that matter

**No formula inline in a rendering module.** Everything numeric goes through
`KelvinPhysics`. That is what makes the page's numbers testable, and the tests are
the reason to trust them. If you need a new formula, add it to `js/physics.js` *and*
add assertions.

**Register every animation with `KelvinEngine.register(el, {init, frame, resize})`.**
There are 5 experiment canvases plus the hero; loops must pause when off-screen. Under
reduced motion the engine calls `frame(0)` exactly once, so that single frame has to
draw a *correct static state*, never a blank canvas.

**If a module draws on demand rather than every frame, set `stage.onFit = draw`.**
Resizing a canvas clears it, and `setupCanvas`'s ResizeObserver fires *after* `init`
has already drawn — without the hook that first frame is silently wiped.

**Resolve `--chapter-accent` from the section, not the root.** It is set per-chapter
via `[data-accent]`; reading it off `document.documentElement` silently returns the
page default and every chart comes out brass.

**`RESEARCH.md` is the source of truth for content, not general recall.** Several of
the most-repeated Kelvin stories are wrong, and the corrections are the most valuable
part of the project:
- The age-of-the-Earth error was **conduction-only**, not missing radioactivity.
  **John Perry showed this in 1894–95, before radioactivity was discovered.**
- The Rutherford 1904 anecdote is genuine, but his "no new source of heat" caveat was
  about the age of the **Sun**, not the Earth's cooling.
- **"There is nothing new to be discovered in physics" is apocryphal** — no primary
  source; nearest real statement is Michelson, 1894.
- His **Glasgow** house (1881) was one of the first in the world lit *entirely* by
  electric light — not "first in Britain" (Cragside was earlier), and not Netherhall.
- He gave absolute zero as −273 °C in 1848 (aged 23); −273.15 is the modern value.
  Second marriage: 24 June 1874, two days *before* his 50th birthday. See the
  fact-check log at the end of `RESEARCH.md`.

**Imagery integrity.** Every image on the site is a genuine public-domain historical
image, credited in ch. 11 and `images/README.md`. The site deliberately uses **no
AI-generated images** — they were removed in the Sept 2026 simplification as filler.
Don't add decorative images back; add a picture only when it shows something real
the text is talking about.

**No personal names anywhere** — not in the page, the `<head>`, the JSON-LD, the
README, or commit messages. This is deliberate and was requested.

## Content structure (keep it simple)

The site was deliberately simplified in Sept 2026: plain language, numerals, short
paragraphs, and **one experiment per big idea**. Four parts map to the rubric's four
research categories — Part 1 *His life* (ch01 biography, ch02 world context),
Part 2 *His science* (ch03–06), Part 3 *Wrong and right* (ch07–08), Part 4 *The man*
(ch09–10) — plus ch11 sources with a rubric map. Science chapters use two recurring
cards: `.before-card` ("Before Kelvin, people believed") and `.today-card` ("Why it
matters today"), because both are graded questions.

Cut on purpose, because they didn't earn their place: Charles's-law chart,
Joule–Thomson, cable chart, galvanometer, water dropper, and the interactive
necessity axis / peer network / timeline canvas (now plain lists). Don't re-add
experiments unless they're as clear as the thermometer.

## Experiments

All five use one layout: `.exp` > `.exp-head` (number, title, one-line hint) →
`.exp-stage` (full-width canvas) → `.exp-readouts` → `.exp-controls` → `.exp-note`.
Each module finds itself by its lab id (`therm-lab`, `carnot-lab`, `tides-lab`,
`earthage-lab`, `blackbody-lab`), **never by chapter number** — chapters get
renumbered.

**Legibility rules (the site is presented on a projector):**
- Canvas text always goes through `KelvinEngine.font(stage, scale, weight, family)` /
  `textPx(stage, scale)` — sized to the stage, never below 13px. No fixed 9–11px labels.
- Labels are plain English on the visual itself ("Heat in", "Useful work",
  "Spring tide", "Wavelength (nm)", "96 million years") — no `Qh`, `My`, "beat".
  The key result is annotated on the chart (e.g. "only 2% of the real age").
- Each experiment header has a **Try:** line (`.exp-hint`) and a **Look for:** line
  (`.exp-look`) naming the one thing to notice.
- Sliders show a filled track via `--fill`; `main.js` keeps it in sync on input, and
  any module that sets `input.value` in code must call `KelvinEngine.syncRange(el)`.
- Narrow stages (`w < 560`) get shorter labels (Carnot, tides) — check at 390px.
- Hot is drawn warm (ember) and cold is drawn cold (cyan) — never the reverse.

The thermometer's pixel speed is a *display* compression (∝ √v_rms, i.e. T^¼) so
motion keeps visibly increasing across a log slider spanning 0 K–10⁸ K; the readout
is the real v_rms. Molecule speeds are Maxwell–Boltzmann distributed and exchange
energy through elastic collisions. Colour follows incandescence (glow from ~798 K).

## Presenter mode

`P` toggles, `Esc` leaves, `←`/`→` move between stops, `Q` opens the Q&A sheet.
Seven stops totalling **4:00**, each with a target time and talking points; the clock
goes amber past the current stop's budget and red past 5:00. Editing the run means
editing `STOPS` in `js/presenter.js` — keep the total inside the 3–5 minute window.

## Verifying visually

The Chrome extension is often not connected; use headless Chrome instead. Two traps
on this machine, both hit during the build:
- **Tall full-page screenshots tile incorrectly.** Capture through a wrapper page
  with the site in an offset iframe instead.
- **A `100vh` hero becomes as tall as the capture window**, pushing every measured
  offset far down the page. Inject `#hero{height:700px!important}` before measuring
  or capturing.
- **Virtual-time headless runs give animations one frame.** To judge motion, drive
  real-time headless Chrome over CDP (Node's built-in WebSocket; `Page.captureScreenshot`
  after real waits). `Emulation.setDeviceMetricsOverride` gives a true 390px viewport.

## Print

`@media print` must force `.reveal{opacity:1}` — printing never scrolls, so
scroll-revealed content otherwise prints blank (this bug shipped once: the
"Print reference page" button printed only a heading). Verify with
`--print-to-pdf` and read the PDF.
