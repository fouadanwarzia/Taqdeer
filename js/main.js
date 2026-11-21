/* Taqdeer — interactions & scroll animation (v5) */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobile = window.innerWidth < 700;
  $("#year").textContent = new Date().getFullYear();
  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }

  /* mobile portrait images for the hero */
  if (mobile) $$(".slide img[data-m]").forEach(function (im) { im.src = im.dataset.m; });

  /* ----- menu ----- */
  var lenis = null, burger = $(".nav__burger");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    $(".menu").setAttribute("aria-hidden", String(!open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });

  /* ----- nav colour over hero (works without GSAP) ----- */
  var nav = $(".nav"), hero = $(".hero");
  function navState() { nav.classList.toggle("is-light", window.scrollY < hero.offsetHeight - 90); }
  window.addEventListener("scroll", navState, { passive: true }); navState();

  /* ----- fallback ----- */
  if (typeof window.gsap === "undefined") {
    document.body.classList.remove("is-loading");
    var l = $(".loader"); if (l) l.remove();
    $$("[data-count]").forEach(function (el) { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ""); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ----- smooth scroll ----- */
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"), target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault(); e.stopPropagation(); setMenu(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    });
  });

  /* ----- helpers ----- */
  function countUp(el, d) {
    if (el.dataset.done) return; el.dataset.done = 1;
    var o = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
    gsap.to(o, { v: end, duration: d || 2.2, ease: "expo.out", onUpdate: function () { el.textContent = fmt(Math.round(o.v)) + suf; } });
  }
  function splitWords(el) {
    var html = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          html.push(/^\s+$/.test(w) ? " " : '<span class="w"><span>' + w + "</span></span>");
        });
      } else if (n.tagName === "BR") html.push("<br>");
      else {
        var cls = n.className ? ' class="' + n.className + '"' : "";
        html.push(n.textContent.split(/\s+/).filter(Boolean).map(function (w) { return '<span class="w"><span><em' + cls + ">" + w + "</em></span></span>"; }).join(" "));
      }
    });
    el.innerHTML = html.join("");
    return $$(".w > span", el);
  }

  /* =================== HERO =================== */
  var slides = $$(".slide"), thumbs = $$(".thumb"), labelTxt = $(".hero__labeltxt"), labelNum = $(".hero__label b");
  var cur = 0, busy = false, timer = null, DUR = 6.5;
  gsap.set(".slide img", { scale: 1.12 });

  function runProgress() {
    if (timer) timer.kill();
    thumbs.forEach(function (t) { gsap.set($("i", t), { scaleX: 0 }); });
    timer = gsap.to($("i", thumbs[cur]), { scaleX: 1, duration: DUR, ease: "none", onComplete: function () { go((cur + 1) % slides.length); } });
  }
  function go(n, x, y) {
    if (busy || n === cur) return;
    busy = true;
    var r = hero.getBoundingClientRect();
    var px = x === undefined ? "50%" : ((x - r.left) / r.width * 100).toFixed(1) + "%";
    var py = y === undefined ? "50%" : ((y - r.top) / r.height * 100).toFixed(1) + "%";
    var from = slides[cur], to = slides[n];
    to.classList.add("is-entering");
    gsap.set(to, { clipPath: "circle(0% at " + px + " " + py + ")" });
    gsap.timeline({ onComplete: function () {
        from.classList.remove("is-active"); gsap.set(from, { clipPath: "circle(0% at 50% 50%)" });
        to.classList.remove("is-entering"); to.classList.add("is-active");
        busy = false;
      } })
      .to(to, { clipPath: "circle(150% at " + px + " " + py + ")", duration: 1.5, ease: "expo.inOut" }, 0)
      .fromTo($("img", to), { scale: 1.4 }, { scale: 1.12, duration: 2, ease: "expo.out" }, 0)
      .to($("img", from), { scale: 1.02, duration: 1.5, ease: "expo.inOut" }, 0);
    cur = n;
    thumbs.forEach(function (t, i) { t.classList.toggle("is-active", i === n); });
    gsap.to(".hero__label", { y: 12, autoAlpha: 0, duration: .3, onComplete: function () {
      labelTxt.textContent = to.dataset.label; labelNum.textContent = "0" + (n + 1);
      gsap.to(".hero__label", { y: 0, autoAlpha: 1, duration: .6, ease: "expo.out" });
    } });
    runProgress();
  }
  hero.addEventListener("click", function (e) {
    if (e.target.closest("a, button")) return;
    go((cur + 1) % slides.length, e.clientX, e.clientY);
  });
  thumbs.forEach(function (t) {
    t.addEventListener("click", function (e) { e.stopPropagation(); var r = t.getBoundingClientRect(); go(+t.dataset.i, r.left + r.width / 2, r.top + r.height / 2); });
  });
  // swipe on touch
  var sx = null;
  hero.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) go((cur + (dx < 0 ? 1 : slides.length - 1)) % slides.length, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });

  if (fine) {
    var glow = $(".hero__glow");
    var gx = gsap.quickTo(glow, "x", { duration: .6, ease: "power3" }), gy = gsap.quickTo(glow, "y", { duration: .6, ease: "power3" });
    var px = gsap.quickTo(".hero__slides", "x", { duration: 1.4, ease: "power3" }), py = gsap.quickTo(".hero__slides", "y", { duration: 1.4, ease: "power3" });
    var tx = gsap.quickTo(".hero__title", "x", { duration: 1.4, ease: "power3" });
    hero.addEventListener("mousemove", function (e) {
      gx(e.clientX); gy(e.clientY);
      var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      px(nx * -26); py(ny * -16); tx(nx * 12);
    });
  }

  /* ----- loader + intro ----- */
  var heroLines = $$(".hero__title .ln > span");
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set([".hero__kicker", ".hero__row > *", ".thumb", ".hero__label", ".hero__scroll"], { autoAlpha: 0, y: 30 });
  gsap.set(".nav", { yPercent: -160 });
  gsap.set(".slide.is-active img", { scale: 1.45 });

  var p = { v: 0 }, bar = $(".loader__bar span");
  var imgs = $$(".slide img, .thumb img"), n = 0;
  function bump() { n++; gsap.to(p, { v: Math.min(.9, n / imgs.length), duration: .5, onUpdate: function () { bar.style.width = (p.v * 100) + "%"; } }); }
  imgs.forEach(function (im) { if (im.complete) bump(); else { im.addEventListener("load", bump); im.addEventListener("error", bump); } });
  var started = false;
  function start() {
    if (started) return; started = true;
    gsap.timeline()
      .to(p, { v: 1, duration: .35, onUpdate: function () { bar.style.width = (p.v * 100) + "%"; } })
      .to(".loader > *", { autoAlpha: 0, y: -20, duration: .45, stagger: .05, ease: "power2.in" })
      .to(".loader", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=.1")
      .add(function () { document.body.classList.remove("is-loading"); if (lenis) lenis.start(); $(".loader").remove(); })
      .to(".slide.is-active img", { scale: 1.12, duration: 2.4, ease: "expo.out" }, "-=.9")
      .to(heroLines, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: .12 }, "-=2.1")
      .to(".nav", { yPercent: 0, duration: 1, ease: "expo.out" }, "-=1.4")
      .to([".hero__kicker", ".hero__row > *", ".thumb", ".hero__label", ".hero__scroll"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .07 }, "-=1.3")
      .add(runProgress, "-=.4");
  }
  window.addEventListener("load", start); setTimeout(start, 4000);

  /* hero leaves: frame rounds into a card, content lifts */
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
    .to(".hero__frame", { clipPath: "inset(4% 3% 4% 3% round 32px)", ease: "none" }, 0)
    .to(".hero__content", { yPercent: -30, autoAlpha: 0, ease: "none" }, 0)
    .to([".hero__nav", ".hero__label"], { autoAlpha: 0, ease: "none" }, 0);

  /* ----- nav hide on scroll down + progress ----- */
  var last = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (s) {
    var y = s.scroll();
    if (y > last + 4 && y > 700 && !document.body.classList.contains("menu-open")) nav.classList.add("is-hidden");
    else if (y < last - 4) nav.classList.remove("is-hidden");
    last = y;
    gsap.set(".progress", { scaleX: s.progress });
  } });

  /* ----- headings ----- */
  $$(".split").forEach(function (el) {
    gsap.from(splitWords(el), { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: .06, scrollTrigger: { trigger: el, start: "top 86%" } });
  });
  $$(".eyebrow").forEach(function (el) {
    gsap.from(el, { x: -20, autoAlpha: 0, duration: .9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ----- band marquee ----- */
  (function () {
    var track = $(".band__track"); track.innerHTML += track.innerHTML + track.innerHTML;
    var w = track.scrollWidth / 3;
    var tw = gsap.to(track, { x: -w, duration: w / 60, ease: "none", repeat: -1 });
    ScrollTrigger.create({ trigger: ".band", start: "top bottom", end: "bottom top", onUpdate: function (s) {
      gsap.to(tw, { timeScale: (1 + Math.min(Math.abs(s.getVelocity()) / 250, 5)) * (s.direction || 1), duration: .2, overwrite: true });
      gsap.to(tw, { timeScale: 1, duration: 1, delay: .3 });
    } });
  })();

  /* ----- bento ----- */
  ScrollTrigger.batch(".tile", { start: "top 88%", onEnter: function (b) {
    gsap.from(b, { y: 70, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .08 });
    b.forEach(function (t) { $$("[data-count]", t).forEach(function (e) { countUp(e); }); });
  } });
  $$(".tile--photo img").forEach(function (im) {
    gsap.fromTo(im, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: im.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ----- industries ----- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", function () {
    var rail = $(".rail");
    var dist = function () { return rail.scrollWidth - innerWidth; };
    var tw = gsap.to(rail, { x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: ".industries", start: "top top", end: function () { return "+=" + dist(); }, pin: ".industries__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { gsap.set(".hbar span", { scaleX: s.progress }); } } });
    $$(".icard__img img").forEach(function (im) {
      gsap.fromTo(im, { xPercent: -5, scale: 1.15 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: im.closest(".icard"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
    });
    gsap.from(".icard", { y: 90, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .07, scrollTrigger: { trigger: ".industries", start: "top 70%" } });
  });
  mm.add("(max-width: 767px)", function () {
    gsap.from(".icard", { x: 60, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".rail", start: "top 85%" } });
  });

  /* ----- process ----- */
  var steps = $$(".step"), pics = $$(".sv__stack img"), cnt = $(".sv__count b");
  steps.forEach(function (s, i) {
    ScrollTrigger.create({ trigger: s, start: "top 60%", end: "bottom 40%", onToggle: function (self) {
      if (!self.isActive) return;
      steps.forEach(function (o, k) { o.classList.toggle("is-on", k === i); });
      pics.forEach(function (o, k) { o.classList.toggle("is-on", k === i); });
      if (cnt) cnt.textContent = "0" + (i + 1);
    } });
  });
  mm.add("(max-width: 900px)", function () {
    $$(".step").forEach(function (s) { gsap.from(s, { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%" } }); });
  });

  /* ----- reach ----- */
  gsap.fromTo(".reach__bg", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".reach", start: "top bottom", end: "bottom top", scrub: true } });
  ScrollTrigger.create({ trigger: ".reach__nums", start: "top 85%", onEnter: function () { $$(".reach [data-count]").forEach(function (e) { countUp(e, 1.8); }); } });
  gsap.from(".reach__nums > *", { y: 70, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".reach__nums", start: "top 88%" } });
  $$(".cloud").forEach(function (c) {
    gsap.from(c.children, { y: 24, scale: .7, autoAlpha: 0, duration: .7, ease: "back.out(2)", stagger: .035, scrollTrigger: { trigger: c, start: "top 92%" } });
  });

  /* ----- why ----- */
  gsap.from(".why__card", { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".why__grid", start: "top 85%" } });

  /* ----- clients ----- */
  gsap.from(".logo-grid img", { y: 30, autoAlpha: 0, duration: .8, ease: "expo.out", stagger: { each: .025, from: "center" }, scrollTrigger: { trigger: ".logo-grid", start: "top 88%" } });

  /* ----- contact ----- */
  gsap.from(".cta", { y: 80, autoAlpha: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".cta", start: "top 88%" } });
  gsap.fromTo(".cta__bg", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".cta__btns > *, .info > div", { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .07, scrollTrigger: { trigger: ".cta__btns", start: "top 92%" } });

  /* ----- desktop: cursor, magnetic, tilt ----- */
  if (fine) {
    var c = $(".cursor"), ct = $(".cursor__txt");
    var cx = gsap.quickTo(c, "x", { duration: .25, ease: "power3" }), cy = gsap.quickTo(c, "y", { duration: .25, ease: "power3" });
    window.addEventListener("mousemove", function (e) { c.classList.add("is-live"); cx(e.clientX); cy(e.clientY); });
    $$("a, button, .icard, .tile, .why__card").forEach(function (el) {
      el.addEventListener("mouseenter", function () { c.classList.add("is-hover"); c.classList.remove("has-txt"); });
      el.addEventListener("mouseleave", function () { c.classList.remove("is-hover"); if (el.closest(".hero")) c.classList.add("has-txt"); });
    });
    hero.addEventListener("mouseenter", function () { ct.textContent = "Next"; c.classList.add("has-txt"); });
    hero.addEventListener("mouseleave", function () { c.classList.remove("has-txt"); });
    $$(".magnetic").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: .8, ease: "elastic.out(1,.35)" }), my = gsap.quickTo(el, "y", { duration: .8, ease: "elastic.out(1,.35)" });
      el.addEventListener("mousemove", function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3); });
      el.addEventListener("mouseleave", function () { mx(0); my(0); });
    });
    $$(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: x * 10, rotateX: -y * 10, transformPerspective: 900, duration: .5, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1,.4)" }); });
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
