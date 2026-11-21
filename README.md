# Taqdeer Manpower — Website

Static website (plain HTML/CSS/JS, no build step) for **Taqdeer Manpower Human Resources Consultancies Co. L.L.C**.
Brand, logo and content come from the official company profile PDF.

## Run it locally
Double-click `index.html`, or for best results serve the folder:

```
python -m http.server 8000
```
then open http://localhost:8000

## Put it live
Upload **everything in this folder** (`index.html`, `css/`, `js/`, `vendor/`, `images/`) to your hosting's
public folder (usually `public_html/`). Nothing else is needed.

## Your new images
Copy your images into `images/new/` using the names listed in `images/new/PUT-YOUR-IMAGES-HERE.txt`.
Any missing image automatically falls back to a photo from the company profile.

## Structure
```
index.html          all page content
css/style.css       design (colors at the top: --navy, --gold)
js/main.js          animations (GSAP + ScrollTrigger + Lenis smooth scroll)
vendor/             animation libraries (bundled, work offline)
images/             logo, PDF photos, client logos
images/new/         your new images
```
