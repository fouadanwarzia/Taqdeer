# Taqdeer Manpower — 3D Animated Website

A modern, single-page marketing website for **Taqdeer Manpower – Human Resources
Consultancies Co. L.L.C**, built to the brand and content from the official
company profile.

![Brand](https://img.shields.io/badge/brand-Taqdeer%20Manpower-274798)
![Accent](https://img.shields.io/badge/accent-Gold%20%23EEBE0D-EEBE0D)

## Highlights

- **Interactive 3D globe** (Three.js) — a gold point-globe with navy/gold
  location markers and animated great-circle "deployment" arcs flowing from the
  ten recruitment nations to the deployment markets. Appears in the hero and the
  Global Reach section. No external textures or assets required.
- **Brand-accurate identity** — royal blue `#274798` (TAQDEER) and gold
  `#EEBE0D` (MANPOWER), recreated as a crisp SVG wordmark; deep-navy sections
  throughout.
- **Scroll storytelling** — GSAP hero intro, reveal-on-scroll, animated stat
  counters (150+, 15,000+, 7,000+, 100+), 3D-tilt cards, marquees and a process
  timeline.
- **All profile content** — About, Mission/Vision/Values, Global footprint,
  Landmark projects (Burj Khalifa, Burj Al Arab, Ferrari World, NEOM, Walmart),
  Industries, Trades, Differentiators, Trade Test Center, Recruitment process and
  full corporate contact details.
- **Responsive & accessible** — mobile menu, `prefers-reduced-motion` support,
  graceful WebGL fallback (the CSS gradient hero remains if 3D is unavailable).

## Tech

Pure static site — **no build step required**. Three.js and GSAP load from CDN
in the visitor's browser via an import map. Just serve the folder.

```
.
├── index.html
├── css/styles.css
├── js/
│   ├── globe.js   # Three.js 3D globe
│   └── main.js    # loader, nav, scroll animations, counters
└── assets/        # favicon + extracted logo reference
```

## Run locally

Because the page uses ES modules, open it through a local server (not `file://`):

```bash
# any one of these from the project root
python3 -m http.server 8000
#   → http://localhost:8000
npx serve .
```

## Deploy

Drop the folder onto any static host — GitHub Pages, Netlify, Vercel,
Cloudflare Pages or an S3 bucket. No server-side code.

---

*Content and branding © Taqdeer Manpower — Human Resources Consultancies Co. L.L.C.*
