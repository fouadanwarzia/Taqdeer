# Q Mobility · LIVEX 2026 — touch kiosk app

A self-contained, offline web app built from the approved *About Us* mockups.
It is designed on a fixed **1920 × 1080** stage and scales (letterboxed) to any screen.

## Run

Open `index.html` in Chrome/Edge, or serve the folder:

```bash
cd qmobility-livex && python3 -m http.server 8080
# http://localhost:8080/?kiosk=1   (first touch → fullscreen, cursor hidden)
```

For an unattended kiosk: `chrome --kiosk --app=http://localhost:8080/?kiosk=1`

## Flow

| Screen | Reached from | Notes |
| --- | --- | --- |
| Home | start / Home button / idle | Logo, **About Us**, **Touch to Explore** |
| 1 · Network | About Us | Real Abu Dhabi aerial, animated stats, **View map** |
| 2 · Technology | Next | Tap any callout for photos and details |
| 3 · Closing | Next | "Mobility for a better life" |
| Explore · Map | Touch to Explore / View map / toll card | Real toll-gate map; tap a pin or list item to zoom in and see the gate |

## Controls

- Touch: ← / Home / → buttons, swipe left/right on slides
- Keyboard: `←` `→` navigate, `H` home, `M` map, `F` fullscreen, `Esc` close
- Returns to Home after 75 s without a touch (a countdown bar shows for the last 10 s)
- Deep links: `#network`, `#technology`, `#closing`, `#explore`

## Assets

All fonts (Inter, Montserrat, JetBrains Mono, Noto Kufi Arabic) and images are bundled —
no network needed. The logo is a vector trace of the supplied white logo; the technology
scene is the approved render with the baked-in text removed so the callouts are live.
