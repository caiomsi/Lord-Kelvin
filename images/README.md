# Image provenance

Two kinds of image are used on this site, and the distinction is deliberate and
load-bearing. **It must be preserved in every caption and in the ch. 15 credits.**

## Rule
- A **photograph or historical document** of Lord Kelvin, a real person, a real
  instrument, or a real event is **always a genuine public-domain image**, credited
  with its source.
- An **AI-generated image** is only ever used as **atmosphere** — a mood plate behind a
  chapter opener. It never depicts a real person, and it is never presented as a
  historical record. Every one is captioned **"Illustration"** on the page.

Never generate a fake archival photograph. Beyond being dishonest, this is a graded
research project: a fabricated "historical photo" would undermine the whole thing.

---

## Public domain — genuine historical images
All sourced from Wikimedia Commons, all in the public domain (Kelvin died 1907).

| File | What it is | Source |
|---|---|---|
| `kelvin-portrait.jpg` | Photographic portrait of Lord Kelvin, by Messrs. Dickinson, London | [Commons: Lord Kelvin photograph.jpg](https://commons.wikimedia.org/wiki/File:Lord_Kelvin_photograph.jpg) |
| `kelvin-vanity-fair-1897.jpg` | *Vanity Fair* caricature, 29 Apr. 1897, by Leslie Ward ("Spy") | [Commons: Lord Kelvin Vanity Fair 1897-04-29.jpg](https://commons.wikimedia.org/wiki/File:Lord_Kelvin_Vanity_Fair_1897-04-29.jpg) |
| `mirror-galvanometer.jpg` | Thomson's mirror galvanometer | [Commons: Thomson mirror galvanometer.jpg](https://commons.wikimedia.org/wiki/File:Thomson_mirror_galvanometer.jpg) |
| `siphon-recorder.jpg` | Kelvin's early siphon recorder (*Encyclopædia Britannica*, 1911) | [Commons: EB1911 Telegraph – Lord Kelvin's early Siphon Recorder.jpg](https://commons.wikimedia.org/wiki/File:EB1911_Telegraph_-_Lord_Kelvin%27s_early_Siphon_Recorder.jpg) |
| `great-eastern-1866.jpg` | The *Great Eastern*, the ship that laid the successful 1866 cable | [Commons: Great Eastern 1866.jpg](https://commons.wikimedia.org/wiki/File:Great_Eastern_1866.jpg) |
| `tide-predicting-machine.jpg` | Contemporary illustration of Kelvin's tide-predicting machine (four-constituent form) | [Commons: FMIB 36872 Appareil Combinateur d'Ondes](https://commons.wikimedia.org/wiki/File:FMIB_36872_Appereil_Combinateur_d%27Ondes_(Tide_Predicter_de_Lord_Kelvin,_Reduit_au_Cas_de_Quatre_Ondes_Seulement).jpeg) |

## AI-generated — atmosphere only
Generated with Higgsfield (`gpt_image_2_5`), Sept 2026. **Not historical records.**
None depicts a real person or a documented event. Caption each as "Illustration".

| File | Used for | Subject |
|---|---|---|
| `hero-frozen-particles.jpg` | source of the social card (the hero itself is a live canvas) | Frozen crystalline particles in a void |
| `frost-crystals.jpg` | ch. 03 absolute zero | Frost on dark glass |
| `steam-engine-detail.jpg` | ch. 04 second law | Victorian steam engine detail |
| `cable-ocean-floor.jpg` | ch. 06 the cable | A cable across an abyssal plain |
| `instrument-workbench.jpg` | ch. 07 instruments | Victorian instrument-maker's bench |
| `brass-gear-mechanism.jpg` | ch. 07 tide machine | Brass geared mechanism |
| `earth-strata-heat.jpg` | ch. 08 age of the Earth | Geological strata with deep heat |
| `two-clouds-sea.jpg` | ch. 09 two clouds | Two clouds over a dusk sea |
| `victorian-industrial-city.jpg` | ch. 02 the world | Victorian industrial city at dusk |
| `lecture-theatre.jpg` | ch. 01 education | Empty Victorian lecture theatre |
| `cathedral-interior.jpg` | ch. 13 legacy | Gothic cathedral interior |
| `social-share.jpg` | Open Graph / Twitter card only — never rendered on the page | Derived from `hero-frozen-particles.jpg`, resized to 1200×630 |

## Processing
All images resized to ≤ 1600 px on the long edge and saved as JPEG via `sips`.
Total folder weight is kept under ~5 MB so the page stays fast on a school network.
