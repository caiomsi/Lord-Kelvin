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
index.html              one page, 15 chapters in four acts + hero + summary card
css/style.css           tokens first; per-chapter accent switching; presenter + print
js/physics.js           ★ PURE + TESTED: every formula the site draws
js/engine.js            shared canvas/rAF runtime; pauses modules when off-screen
js/main.js              chapter rail, scroll progress, reveal, hero particle field
js/presenter.js         presenter mode: timed run, talking points, Q&A sheet
js/sources.js           the "print reference page" button
js/<topic>.js           one module per interactive (thermometer, cable, tides, …)
test/physics.test.js    63 zero-dep assertions
images/                 12 AI atmosphere plates + 6 public-domain historicals
RESEARCH.md             verified facts + bibliography — the content's source of truth
```

## The rules that matter

**No formula inline in a rendering module.** Everything numeric goes through
`KelvinPhysics`. That is what makes the page's numbers testable, and the tests are
the reason to trust them. If you need a new formula, add it to `js/physics.js` *and*
add assertions.

**Register every animation with `KelvinEngine.register(el, {init, frame, resize})`.**
There are ~12 canvases; loops must pause when their section is off-screen. Under
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
- His **Glasgow** house was the first in Britain lit by electric light (1881), not
  Netherhall.

**Imagery integrity.** AI-generated images are atmosphere only, captioned
"Illustration", and never depict a real person or a documented event. Every
photograph of Kelvin or his instruments is genuine public domain and credited. See
`images/README.md`. Do not blur this line — the project is graded on sourcing.

**No personal names anywhere** — not in the page, the `<head>`, the JSON-LD, the
README, or commit messages. This is deliberate and was requested.

## Presenter mode

`P` toggles, `Esc` leaves, `←`/`→` move between stops, `Q` opens the Q&A sheet.
Seven stops totalling **4:20**, each with a target time and talking points; the clock
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
