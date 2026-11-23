# Taqdeer Manpower · V8

A split-stage scroll site, built with the
[scroll-craft](https://github.com/nateherkai/scroll-craft) skill. The left column is
**Source** (where workers are found and trained). The right column is **Site** (where they
build). The divider is the navigation. Scroll moves the divider, carries the trades
across it, and finally collapses it so the project side takes the whole page.

See `BRIEF.md` for the creative brief and feeling curve, and `FINGERPRINTS.md` for the
structural fingerprint.

## Files
```
index.html          semantic page, data-sc-* hooks
scrollcraft.css/js  scroll-craft engine, copied unmodified
css/taqdeer.css     tokens and this page's layout
js/seam.js          split, seam chrome, the crossing, the collapse
js/globe.js         two-tone Three.js globe (scissor at the seam)
vendor/three.module.js
```

## Run
The globe uses ES modules, so serve the folder over HTTP rather than opening it from disk:
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000. No build step, so any static host works.

Phones (≤860px) turn the split by ninety degrees: Source on top, Site below.
`prefers-reduced-motion` keeps every beat, but swaps movement for crossfades.
