# Kelvin — The Absolute Scale

An interactive site about **William Thomson, 1st Baron Kelvin (1824–1907)**, built
for an AP Physics research project.

**Live:** https://caiomsi.github.io/Lord-Kelvin/

11 short chapters in four parts — his life, his science, where he was wrong and right,
and the man himself — with five experiments you can drive, and a presenter mode for a
timed 3–5 minute talk.

## The experiments

| # | Experiment | What you do |
|---|---|---|
| 1 | Freeze a gas | Drag from 0 K to 100 million K. Nitrogen molecules stop dead at absolute zero, then move faster — and glow red, yellow, then white-hot — as it heats up |
| 2 | Build a perfect engine | Try to reach 100% efficiency. You can't: it needs a cold side at 0 K |
| 3 | Predict the tides | Add six tidal waves together, like Kelvin's brass machine. Spring and neap tides appear from just the Moon and Sun |
| 4 | Redo Kelvin's calculation | Change his assumptions about the age of the Earth — he still lands far short of 4.5 billion years |
| 5 | See cloud 2 | Watch the old theory of hot objects shoot off to infinity, and Planck's curve fix it |

## Presenter mode

Press **P**. Seven stops totalling **4:00**, `←`/`→` to move, a clock that warns when
you run over, and **Q** for a Q&A sheet covering every question in the assignment.
**Esc** leaves.

## Running it

No build step. Open `index.html`, or:

```sh
python3 -m http.server
# http://localhost:8000
```

Tests (every physics formula the page uses):

```sh
node test/physics.test.js
```

## Accuracy

Every number on the page comes from `js/physics.js`, covered by 63 unit tests. The
content follows `RESEARCH.md`, which documents where the popular story of Kelvin is
wrong — for example, his age-of-the-Earth mistake was assuming heat escapes only
through solid rock (John Perry showed this in 1895, before radioactivity was
discovered), and the famous "nothing new to be discovered in physics" quote has no
source.

## Images

All four images are genuine public-domain historical images, credited in the
bibliography and in `images/README.md`.
