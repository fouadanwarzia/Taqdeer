/* Taqdeer Manpower — motion engine */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile = window.innerWidth < 768;
  $("#year").textContent = new Date().getFullYear();

  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }

  /* ---------- Mobile image swaps ---------- */
  if (window.innerWidth < 700) {
    $$(".hero__img").forEach(function (im) { if (im.dataset.mobile) { im.dataset.fallback = im.src; im.src = im.dataset.mobile; } });
  }

  /* ---------- Waves canvas (gold + blue light ribbons) ---------- */
  function Waves(cv) {
    var ctx = cv.getContext("2d"), w, h, dpr = Math.min(window.devicePixelRatio || 1, 1.5), t = Math.random() * 100, on = false;
    var alpha = parseFloat(cv.dataset.alpha || 1);
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    var ribbons = [
      { y: .72, amp: .16, f: 1.4, sp: .22, col: [255, 198, 26], n: 14, spread: 26 },
      { y: .55, amp: .2, f: 1.0, sp: .16, col: [90, 140, 255], n: 12, spread: 34 },
      { y: .85, amp: .1, f: 2.1, sp: .3, col: [255, 225, 120], n: 8, spread: 18 }
    ];
    function frame() {
      if (!on) return;
      t += .006;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ribbons.forEach(function (r, ri) {
        for (var i = 0; i < r.n; i++) {
          var k = i / r.n;
          ctx.beginPath();
          for (var x = -20; x <= w + 20; x += 14) {
            var nx = x / w;
            var y = h * r.y
              + Math.sin(nx * Math.PI * r.f + t * (1 + r.sp) + k * 1.2 + ri) * h * r.amp
              + Math.sin(nx * Math.PI * 3.1 - t * 1.3 + k * 2) * h * .03
              + (k - .5) * r.spread * (1 + Math.sin(t + nx * 4) * .6);
            x < -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          var a = (1 - Math.abs(k - .5) * 1.8) * .22 * alpha;
          ctx.strokeStyle = "rgba(" + r.col[0] + "," + r.col[1] + "," + r.col[2] + "," + Math.max(a, .02) + ")";
          ctx.lineWidth = i % 4 === 0 ? 1.6 : .8;
          ctx.stroke();
        }
      });
      requestAnimationFrame(frame);
    }
    if (reduce) { on = true; frame(); on = false; return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { var was = on; on = e.isIntersecting; if (on && !was) frame(); }); }).observe(cv);
  }
  $$("canvas.waves").forEach(Waves);

  /* ---------- Menu ---------- */
  var lenis = null;
  var burger = $(".nav__burger");
  function closeMenu() { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); if (lenis) lenis.start(); }
  burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", String(open));
    $(".menu").setAttribute("aria-hidden", String(!open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });

  /* ---------- Why panels (works without GSAP) ---------- */
  $$(".panel").forEach(function (p) {
    function open() { $$(".panel").forEach(function (o) { o.classList.toggle("is-open", o === p); }); }
    p.addEventListener("mouseenter", function () { if (fine) open(); });
    p.addEventListener("click", open);
  });

  /* ---------- No-animation fallback ---------- */
  if (typeof window.gsap === "undefined" || reduce) {
    document.body.classList.remove("is-loading");
    var ld = $(".loader"); if (ld) ld.remove();
    $$("[data-count]").forEach(function (el) { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ""); });
    $$(".manifesto__text").forEach(function (el) { el.style.color = "#fff"; });
    $$(".expand__copy").forEach(function (el) { el.style.opacity = 1; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault(); closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    });
  });

  /* ---------- Split helpers ---------- */
  function splitWords(el) {
    var out = [];
    (function walk(node, wrapEm) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { out.push(" "); return; }
            out.push('<span class="w">' + (wrapEm ? "<span><em>" + w + "</em></span>" : "<span>" + w + "</span>") + "</span>");
          });
        } else if (n.tagName === "BR") { out.push("<br>"); }
        else if (n.tagName === "EM") { walk(n, true); }
        else {
          var cls = n.className ? ' class="' + n.className + '"' : "";
          var inner = n.textContent.split(/\s+/).filter(Boolean).map(function (w) { return '<span class="w"><span' + cls + ">" + w + "</span></span>"; }).join(" ");
          out.push(inner);
        }
      });
    })(el, false);
    el.innerHTML = out.join("");
    return $$(".w", el);
  }

  /* ---------- Count up ---------- */
  function countUp(el, dur) {
    if (el.dataset.done) return; el.dataset.done = 1;
    var o = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    gsap.to(o, { v: end, duration: dur || 2.4, ease: "expo.out", onUpdate: function () { el.textContent = fmt(Math.round(o.v)) + suf; } });
  }

  /* ---------- Loader + intro ---------- */
  var heroLines = $$(".hero__title .ln > span");
  gsap.set(heroLines, { yPercent: 115, skewY: 6 });
  gsap.set([".hero__kicker", ".hero__bar > *", ".hero__dots", ".hero__scroll"], { autoAlpha: 0, y: 30 });
  gsap.set(".nav", { yPercent: -130 });
  gsap.set(".hero__img.is-active", { scale: 1.35 });

  var prog = { v: 0 }, countEl = $(".loader__count span");
  function setProg(p, d) {
    gsap.to(prog, { v: p, duration: d, ease: "power2.out", overwrite: true, onUpdate: function () {
      countEl.textContent = Math.round(prog.v);
      gsap.set(".loader__fill", { clipPath: "inset(0 " + (100 - prog.v) + "% 0 0)" });
    } });
  }
  var imgs = $$("img").slice(0, 6), loaded = 0;
  imgs.forEach(function (im) {
    if (im.complete) tick(); else { im.addEventListener("load", tick); im.addEventListener("error", tick); }
  });
  function tick() { loaded++; setProg(Math.min(92, loaded / imgs.length * 100), .6); }
  var done = false;
  function finish() { if (done) return; done = true; setProg(100, .5); gsap.delayedCall(.7, intro); }
  window.addEventListener("load", finish); setTimeout(finish, 5000);

  function intro() {
    gsap.timeline()
      .to(".loader__inner", { autoAlpha: 0, scale: .94, duration: .5, ease: "power2.in" })
      .to(".loader__panel--top", { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=.1")
      .to(".loader__panel--bot", { yPercent: 100, duration: 1.2, ease: "expo.inOut" }, "<")
      .add(function () { document.body.classList.remove("is-loading"); if (lenis) lenis.start(); }, "-=.7")
      .to(".hero__img.is-active", { scale: 1.06, duration: 2.6, ease: "expo.out" }, "-=1")
      .to(heroLines, { yPercent: 0, skewY: 0, duration: 1.3, ease: "expo.out", stagger: .1 }, "-=2.3")
      .to(".nav", { yPercent: 0, duration: 1.1, ease: "expo.out" }, "-=1.2")
      .to([".hero__kicker", ".hero__bar > *", ".hero__dots", ".hero__scroll"], { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: .08 }, "-=1.1")
      .add(function () { $(".loader").remove(); $$(".hero__nums [data-count]").forEach(function (e) { countUp(e); }); startSlides(); }, "-=.6");
  }

  /* ---------- Hero slideshow ---------- */
  function startSlides() {
    var slides = $$(".hero__img"), dots = $$(".hero__dots span"), i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active"); dots[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      gsap.fromTo(slides[i], { scale: 1.25 }, { scale: 1.04, duration: 7.5, ease: "power1.out" });
      slides[i].classList.add("is-active");
      void dots[i].offsetWidth; dots[i].classList.add("is-active");
    }, 6500);
  }

  /* ---------- Hero scroll: frame shrinks into a card ---------- */
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero__frame", { clipPath: "inset(6% 4% 6% 4% round 32px)", ease: "none" }, 0)
    .to(".hero__slides", { yPercent: 18, ease: "none" }, 0)
    .to(".hero__content", { yPercent: -40, autoAlpha: 0, ease: "none" }, 0)
    .to(".hero__bar", { autoAlpha: 0, y: -40, ease: "none" }, 0);
  if (fine) {
    var hx = gsap.quickTo(".hero__slides", "x", { duration: 1.4, ease: "power3" });
    $(".hero").addEventListener("mousemove", function (e) { hx((e.clientX / innerWidth - .5) * -28); });
  }

  /* ---------- Nav state + progress ---------- */
  var nav = $(".nav"), lastY = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle("is-scrolled", y > 60);
    nav.classList.toggle("is-hidden", y > lastY + 2 && y > 700 && !document.body.classList.contains("menu-open"));
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
    gsap.set(".progress", { scaleX: s.progress });
  } });

  /* ---------- Section titles ---------- */
  $$(".split-up").forEach(function (el) {
    var w = splitWords(el);
    gsap.from($$(".w > span", el), { yPercent: 120, rotate: 4, duration: 1.2, ease: "expo.out", stagger: .07, scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  $$(".tag, .head__aside").forEach(function (el) {
    gsap.from(el, { autoAlpha: 0, x: -30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- Manifesto: words light up as you scroll ---------- */
  var mWords = splitWords($(".manifesto__text"));
  ScrollTrigger.create({
    trigger: ".manifesto", start: "top 75%", end: "bottom 60%", scrub: true,
    onUpdate: function (s) { var n = Math.round(s.progress * mWords.length); mWords.forEach(function (w, i) { w.classList.toggle("on", i < n); }); }
  });

  /* ---------- Expanding image ---------- */
  var ex = gsap.timeline({ scrollTrigger: { trigger: ".expand", start: "top top", end: "+=140%", pin: ".expand__pin", scrub: 1, anticipatePin: 1,
    onLeave: function () { countUp($(".expand__big [data-count]"), 1.6); } } });
  ex.to(".expand__media", { width: "100vw", height: "100vh", borderRadius: 0, ease: "power2.inOut" }, 0)
    .to(".expand__media img", { scale: 1, ease: "none" }, 0)
    .to(".expand__side--l", { xPercent: -140, yPercent: -40, rotate: -8, autoAlpha: 0, ease: "power2.in" }, 0)
    .to(".expand__side--r", { xPercent: 140, yPercent: 40, rotate: 8, autoAlpha: 0, ease: "power2.in" }, 0)
    .to(".expand__copy", { opacity: 1, ease: "none", onStart: function () { countUp($(".expand__big [data-count]"), 1.6); } }, .55)
    .from(".expand__big", { scale: .6, ease: "power2.out" }, .55);
  gsap.from(".expand__side", { y: 120, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .15, scrollTrigger: { trigger: ".expand", start: "top 80%" } });

  /* ---------- Stats ---------- */
  ScrollTrigger.batch(".stat", { start: "top 88%", onEnter: function (b) {
    gsap.from(b, { y: 80, autoAlpha: 0, rotateX: -30, transformPerspective: 800, duration: 1.3, ease: "expo.out", stagger: .1 });
    b.forEach(function (s) { countUp($("[data-count]", s)); });
  } });

  /* ---------- Industries: stacking cards ---------- */
  var cards = $$(".card");
  cards.forEach(function (c, i) {
    gsap.fromTo($(".card__img", c), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "top 20%", scrub: true } });
    gsap.from($$(".card__body > *", c), { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: c, start: "top 60%" } });
    var next = cards[i + 1];
    if (next) {
      gsap.to(c, { scale: .92, filter: "brightness(.55)", ease: "none", scrollTrigger: { trigger: next, start: "top 65%", end: "top 15%", scrub: true } });
    }
  });

  /* ---------- Marquees ---------- */
  function marquee(track, dir, speed) {
    if (!track) return;
    track.innerHTML += track.innerHTML;
    var tw;
    function build() {
      if (tw) tw.kill();
      var w = track.scrollWidth / 2;
      gsap.set(track, { x: dir > 0 ? 0 : -w });
      tw = gsap.to(track, { x: dir > 0 ? -w : 0, duration: w / speed, ease: "none", repeat: -1 });
    }
    build(); window.addEventListener("load", build);
    ScrollTrigger.create({ trigger: track, start: "top bottom", end: "bottom top", onUpdate: function (s) {
      var v = Math.min(Math.abs(s.getVelocity()) / 250, 5);
      gsap.to(tw, { timeScale: (1 + v) * (s.direction || 1), duration: .2, overwrite: true });
      gsap.to(tw, { timeScale: 1, duration: 1.2, delay: .25 });
    } });
    track.parentElement.addEventListener("mouseenter", function () { gsap.to(tw, { timeScale: .15, duration: .6 }); });
    track.parentElement.addEventListener("mouseleave", function () { gsap.to(tw, { timeScale: 1, duration: .6 }); });
  }
  marquee($(".more__track"), 1, 60);
  marquee($(".pills-row--l .pills-track"), 1, 50);
  marquee($(".pills-row--r .pills-track"), -1, 50);
  marquee($(".logos--l .logos__track"), 1, 45);
  marquee($(".logos--r .logos__track"), -1, 45);

  /* ---------- Horizontal sections (desktop) ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", function () {
    // Landmarks
    var track = $(".projects__track"), countB = $(".projects__count b");
    var dist = function () { return track.scrollWidth - innerWidth; };
    var tw = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: ".projects", start: "top top", end: function () { return "+=" + dist(); }, pin: ".projects__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { countB.textContent = "0" + Math.min(5, 1 + Math.floor(s.progress * 5)); } } });
    $$(".proj__img").forEach(function (im) {
      gsap.fromTo(im, { xPercent: -10 }, { xPercent: 10, ease: "none", scrollTrigger: { trigger: im.parentElement, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
    });
    $$(".proj__cut").forEach(function (im) {
      gsap.from(im, { yPercent: 30, ease: "none", scrollTrigger: { trigger: im.parentElement, containerAnimation: tw, start: "left right", end: "center center", scrub: true } });
    });
    $$(".proj__cap").forEach(function (c) {
      gsap.from(c.children, { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: c.parentElement, containerAnimation: tw, start: "left 75%" } });
    });

    // Process
    var steps = $(".steps");
    var sdist = function () { return Math.max(0, steps.scrollWidth - innerWidth); };
    var stw = gsap.to(steps, { x: function () { return -sdist(); }, ease: "none",
      scrollTrigger: { trigger: ".process", start: "top top", end: function () { return "+=" + (sdist() + innerHeight * .3); }, pin: ".process__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { gsap.set(".process__bar span", { scaleX: s.progress }); } } });
    $$(".step").forEach(function (st) {
      gsap.from(st, { rotateY: -25, y: 60, autoAlpha: 0, transformPerspective: 1000, duration: 1, ease: "expo.out", scrollTrigger: { trigger: st, containerAnimation: stw, start: "left 95%" } });
    });
  });
  mm.add("(max-width: 767px)", function () {
    gsap.from(".proj, .step", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .05, scrollTrigger: { trigger: ".projects__track", start: "top 90%" } });
  });

  /* ---------- Trades list + floating image ---------- */
  var tItems = $$(".tlist li");
  gsap.from(tItems, { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .05, scrollTrigger: { trigger: ".tlist", start: "top 85%" } });
  if (fine) {
    var fl = $(".trade-float"), inner = $(".trade-float__inner");
    var fx = gsap.quickTo(fl, "x", { duration: .6, ease: "power3" }), fy = gsap.quickTo(fl, "y", { duration: .6, ease: "power3" });
    var lastX = 0;
    var cache = {};
    tItems.forEach(function (li) {
      var src = li.dataset.img;
      var im = new Image();
      im.onerror = function () { if (li.dataset.fallback) { li.dataset.img = li.dataset.fallback; new Image().src = li.dataset.fallback; } };
      im.src = src;
    });
    $(".tlist").addEventListener("mousemove", function (e) {
      fx(e.clientX); fy(e.clientY);
      var vx = e.clientX - lastX; lastX = e.clientX;
      gsap.to(fl, { rotate: gsap.utils.clamp(-14, 14, vx * .6), duration: .5 });
    });
    tItems.forEach(function (li) {
      li.addEventListener("mouseenter", function () {
        var img = document.createElement("img"); img.src = li.dataset.img; img.alt = "";
        inner.appendChild(img);
        gsap.fromTo(img, { clipPath: "inset(100% 0 0 0)", scale: 1.3 }, { clipPath: "inset(0% 0 0 0)", scale: 1, duration: .7, ease: "expo.out" });
        while (inner.children.length > 3) inner.removeChild(inner.firstChild);
      });
    });
    $(".tlist").addEventListener("mouseenter", function () { gsap.to(fl, { scale: 1, duration: .6, ease: "expo.out" }); });
    $(".tlist").addEventListener("mouseleave", function () { gsap.to(fl, { scale: 0, duration: .5, ease: "expo.in" }); });
  }

  /* ---------- Global ---------- */
  gsap.fromTo(".global__bg img, .global__orb", { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".global", start: "top bottom", end: "bottom top", scrub: true } });
  ScrollTrigger.create({ trigger: ".global__title", start: "top 85%", onEnter: function () { $$(".global [data-count]").forEach(function (e) { countUp(e, 2); }); } });
  gsap.from(".gline", { y: 100, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .15, scrollTrigger: { trigger: ".global__title", start: "top 85%" } });
  gsap.from(".pills-row", { x: function (i) { return i ? 200 : -200; }, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".pills-row", start: "top 92%" } });

  /* ---------- Why panels entrance ---------- */
  gsap.from(".panel", { y: 120, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".panels", start: "top 85%" } });

  /* ---------- Clients ---------- */
  gsap.from(".logos", { autoAlpha: 0, y: 50, duration: 1.2, ease: "expo.out", stagger: .15, scrollTrigger: { trigger: ".logos", start: "top 92%" } });

  /* ---------- Contact ---------- */
  var cLines = $$(".contact__title .ln > span");
  gsap.from(cLines, { yPercent: 115, skewY: 6, duration: 1.3, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".contact__title", start: "top 85%" } });
  gsap.from(".contact__orb", { scale: 0, rotate: -180, duration: 1.6, ease: "back.out(1.5)", scrollTrigger: { trigger: ".contact__top", start: "top 75%" } });
  gsap.from(".ccard", { y: 70, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".contact__cards", start: "top 92%" } });

  /* ---------- Footer fill ---------- */
  gsap.fromTo(".footer__fill", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "none", scrollTrigger: { trigger: ".footer__big", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* ---------- Cursor + magnetic ---------- */
  if (fine) {
    var cur = $(".cursor"), lab = $(".cursor__label");
    var cx = gsap.quickTo(cur, "x", { duration: .3, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: .3, ease: "power3" });
    window.addEventListener("mousemove", function (e) { cx(e.clientX); cy(e.clientY); });
    $$("a, button, .tlist li").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
    [[".proj:not(.proj--cta)", "View"], [".card", "Hire"], [".panel:not(.is-open)", "Open"]].forEach(function (pair) {
      $$(pair[0]).forEach(function (el) {
        el.addEventListener("mouseenter", function () { lab.textContent = pair[1]; cur.classList.add("has-label"); });
        el.addEventListener("mouseleave", function () { cur.classList.remove("has-label"); });
      });
    });
    $$(".panel").forEach(function (p) { p.addEventListener("mouseenter", function () { setTimeout(function () { cur.classList.remove("has-label"); }, 400); }); });
    $$(".card").forEach(function (c) { c.addEventListener("click", function () { if (lenis) lenis.scrollTo("#contact", { duration: 1.8 }); }); });
    $$(".magnetic").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: .8, ease: "elastic.out(1,.35)" }), my = gsap.quickTo(el, "y", { duration: .8, ease: "elastic.out(1,.35)" });
      el.addEventListener("mousemove", function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .35); });
      el.addEventListener("mouseleave", function () { mx(0); my(0); });
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
