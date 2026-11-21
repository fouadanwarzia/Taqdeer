# Taqdeer Manpower — Website

Static website (plain HTML/CSS/JS, no build step) for **Taqdeer Manpower Human Resources Consultancies Co. L.L.C**.

## Run locally
Double-click `index.html` (works offline), or serve the folder:
```
python -m http.server 8000
```

## Put it live
Upload everything in this folder (`index.html`, `css/`, `js/`, `vendor/`, `img/`, `images/`) to your hosting's `public_html/`.

## Structure
```
index.html        page content
css/style.css     design (colours at the top: --blue, --gold)
js/main.js        scroll animations (GSAP + ScrollTrigger + Lenis)
img/              brand photography + 3D icons (img/icons/)
images/           logo, favicon, client logos
vendor/           libraries (bundled, offline)
```
To swap a photo, replace the file in `img/` with one of the same name.
