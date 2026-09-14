# Kelvin — The Absolute Scale

An immersive, interactive site about **William Thomson, 1st Baron Kelvin
(1824–1907)**, built for an AP Physics research project.

**Live:** https://caiomsi.github.io/Lord-Kelvin/

Fifteen chapters in four acts, with twelve simulations you can actually drive — and
a presenter mode built for a timed 3–5 minute talk.

## The interactives

| Chapter | What you can do |
|---|---|
| 03 · The scale with a bottom | Drag from 0 K to 10⁸ K and watch nitrogen molecules slow to a stop; jump to eleven landmark temperatures. A Charles's-law chart whose lines all extrapolate to the same −273.15 °C |
| 04 · The Second Law | Drive a Carnot engine's hot and cold reservoirs and watch η = 1 − T_c/T_h — reaching 100% only at the unreachable absolute zero |
| 05 · Joule–Thomson | Throttle nitrogen through a porous plug; the state flips from cooling to heating at its real inversion temperature |
| 06 · 3,000 km of copper | Send a pulse down a cable and watch it smear — double the length, quadruple the delay. Then read a Morse message off a mirror galvanometer |
| 07 · The instruments | A Kelvin water dropper charging itself to a spark, and a working tide-predicting machine where the spring/neap beat emerges from two sine waves |
| 08 · Where Kelvin was wrong | Run his own 1862 age-of-the-Earth calculation, then compare it to scale against 4.54 billion years |
| 09 · Two clouds | Watch the classical Rayleigh–Jeans curve run off the top of the chart — the ultraviolet catastrophe, live |
| 12 · His circle | A network of the twelve people who shaped his work, or were shaped by it |
| 14 · Timeline | His life against what the rest of the world was doing |

## Presenter mode

Press **P**. Seven stops totalling **4:20**, `←`/`→` to move, a run clock that warns
when you are over, and **Q** for a Q&A cheat sheet covering every question the
assignment asks. **Esc** leaves.

## Running it

No build step. Open `index.html`, or:

```sh
python3 -m http.server
# http://localhost:8000
```

Tests (every formula the page draws):

```sh
node test/physics.test.js
```

## A note on accuracy

Every number on the page is computed by `js/physics.js`, which is covered by 63
unit tests — the Carnot efficiency, the rms molecular speed, Wien's displacement law,
the 14.77-day spring/neap tidal beat, and Kelvin's own cooling-Earth formula are all
verified rather than asserted.

The content follows `RESEARCH.md`, which documents where the popular account of
Kelvin is wrong. In particular: his age-of-the-Earth error was assuming the Earth
cools by conduction alone — **John Perry showed this in 1894–95, before radioactivity
was discovered** — and the famous "there is nothing new to be discovered in physics"
quotation has no primary source and is almost certainly not his.

## Images

Six are genuine public-domain historical images, credited individually in the
bibliography. Eleven are AI-generated illustrations — ten captioned "Illustration"
where they appear, plus the social-sharing card, which never appears on the page.
None depicts a real person or a documented event. See `images/README.md`.
