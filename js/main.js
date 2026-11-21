/* Taqdeer — interactions & scroll animation */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  $("#year").textContent = new Date().getFullYear();
  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }

  /* ----- menu ----- */
  var lenis = null, burger = $(".nav__burger");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    $(".menu").setAttribute("aria-hidden", String(!open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });

  /* ----- fallback ----- */
  if (typeof window.gsap === "undefined" || reduce) {
    document.body.classList.remove("is-loading");
    var l = $(".loader"); if (l) l.remove();
    $$("[data-count]").forEach(function (el) { el.textContent = fmt(+el.dataset.count) + (el.dataset.suffix || ""); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ----- smooth scroll ----- */
  if (window.Lenis) {
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
      e.preventDefault(); setMenu(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: id === "#top" ? 0 : -20 });
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
          if (/^\s+$/.test(w)) html.push(" "); else html.push('<span class="w"><span>' + w + "</span></span>");
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

  /* ----- loader + hero intro ----- */
  var heroLines = $$(".hero__title .ln > span");
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(".reveal-h", { autoAlpha: 0, y: 30 });
  gsap.set(".hero__3d", { autoAlpha: 0, scale: .85 });
  gsap.set(".float-chip", { autoAlpha: 0, y: 40 });
  gsap.set(".nav", { yPercent: -160 });
  $$(".hero .hl").forEach(function (h) { h.style.setProperty("--u", 0); });

  var p = { v: 0 }, bar = $(".loader__bar span");
  var imgs = $$("img").slice(0, 8), n = 0;
  function bump() { n++; gsap.to(p, { v: Math.min(.92, n / imgs.length), duration: .5, onUpdate: function () { bar.style.width = (p.v * 100) + "%"; } }); }
  imgs.forEach(function (im) { if (im.complete) bump(); else { im.addEventListener("load", bump); im.addEventListener("error", bump); } });
  var started = false;
  function go() {
    if (started) return; started = true;
    gsap.timeline()
      .to(p, { v: 1, duration: .4, onUpdate: function () { bar.style.width = (p.v * 100) + "%"; } })
      .to(".loader > *", { y: -30, autoAlpha: 0, duration: .5, stagger: .06, ease: "power2.in" })
      .to(".loader", { clipPath: "circle(0% at 50% 50%)", duration: 1, ease: "expo.inOut" }, "-=.15")
      .add(function () { document.body.classList.remove("is-loading"); if (lenis) lenis.start(); $(".loader").remove(); })
      .to(".nav", { yPercent: 0, duration: 1, ease: "expo.out" }, "-=.6")
      .to(heroLines, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: .12 }, "-=.9")
      .to($$(".hero .hl"), { "--u": 1, duration: .9, ease: "expo.out" }, "-=.5")
      .to(".hero__3d", { autoAlpha: 1, scale: 1, duration: 1.6, ease: "expo.out" }, "-=1.3")
      .to(".reveal-h", { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .08 }, "-=1.4")
      .to(".float-chip", { autoAlpha: 1, y: 0, duration: 1, ease: "back.out(1.6)", stagger: .12 }, "-=1")
      .add(function () { $$(".hero__stats [data-count]").forEach(function (e) { countUp(e); }); }, "-=1");
  }
  window.addEventListener("load", go); setTimeout(go, 4500);

  /* ----- hero reel grows on scroll ----- */
  gsap.fromTo(".reel", { width: window.innerWidth < 900 ? "92%" : "86%", borderRadius: 32 }, {
    width: "100%", borderRadius: 0, ease: "none",
    scrollTrigger: { trigger: ".hero__reel", start: "top 85%", end: "center center", scrub: true }
  });
  gsap.fromTo(".reel__img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".hero__reel", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".reel__tag", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".reel", start: "top 60%" } });
  gsap.to(".hero__copy", { y: -80, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "40% top", scrub: true } });

  /* ----- nav ----- */
  var nav = $(".nav"), last = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (s) {
    var y = s.scroll();
    if (y > last + 4 && y > 600 && !document.body.classList.contains("menu-open")) nav.classList.add("is-hidden");
    else if (y < last - 4) nav.classList.remove("is-hidden");
    last = y;
    gsap.set(".progress", { scaleX: s.progress });
  } });

  /* ----- section headings ----- */
  $$(".split").forEach(function (el) {
    var words = splitWords(el);
    var hls = $$(".hl", el); hls.forEach(function (h) { h.style.setProperty("--u", 0); });
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
    tl.from(words, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: .06 });
    if (hls.length) tl.to(hls, { "--u": 1, duration: .8, ease: "expo.out", stagger: .05 }, "-=.5");
  });
  $$(".eyebrow").forEach(function (el) {
    if (el.closest(".hero")) return;
    gsap.from(el, { y: 20, autoAlpha: 0, scale: .9, duration: .9, ease: "back.out(2)", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ----- strip marquee ----- */
  function marquee(track, dir, speed) {
    if (!track) return;
    track.innerHTML += track.innerHTML;
    var tw;
    function build() { if (tw) tw.kill(); var w = track.scrollWidth / 2; gsap.set(track, { x: dir > 0 ? 0 : -w }); tw = gsap.to(track, { x: dir > 0 ? -w : 0, duration: w / speed, ease: "none", repeat: -1 }); }
    build(); window.addEventListener("load", build);
    ScrollTrigger.create({ trigger: track, start: "top bottom", end: "bottom top", onUpdate: function (s) {
      gsap.to(tw, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 300, 4), duration: .2, overwrite: true });
      gsap.to(tw, { timeScale: 1, duration: 1, delay: .3 });
    } });
  }
  marquee($(".strip__track"), 1, 50);
  marquee($(".show__track"), 1, 70);

  /* ----- bento ----- */
  gsap.from(".tile", { y: 80, autoAlpha: 0, scale: .94, duration: 1.2, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".bento", start: "top 80%" },
    onComplete: function () { $$(".bento [data-count]").forEach(function (e) { countUp(e); }); } });
  ScrollTrigger.create({ trigger: ".bento", start: "top 70%", onEnter: function () { $$(".bento [data-count]").forEach(function (e) { countUp(e); }); } });

  /* ----- industries: horizontal ----- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", function () {
    var rail = $(".rail");
    var dist = function () { return rail.scrollWidth - innerWidth; };
    var tw = gsap.to(rail, { x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: ".industries", start: "top top", end: function () { return "+=" + dist(); }, pin: ".industries__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { gsap.set(".hbar span", { scaleX: s.progress }); } } });
    $$(".icard").forEach(function (c, i) {
      gsap.from(c, { y: 120, rotate: 6, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: c, containerAnimation: tw, start: "left 100%" } });
      var im = $(".icard__img img", c);
      if (im) gsap.fromTo(im, { xPercent: -6, scale: 1.15 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
    });
    gsap.from(".icard", { y: 80, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".industries", start: "top 70%" } });

    /* showcase zoom */
    var st = gsap.timeline({ scrollTrigger: { trigger: ".show", start: "top top", end: "+=120%", pin: ".show__pin", scrub: 1, anticipatePin: 1 } });
    st.to(".show__frame", { width: "100vw", height: "100vh", borderRadius: 0, ease: "power2.inOut" }, 0)
      .to(".show__img", { scale: 1, ease: "none" }, 0)
      .from(".show__copy > *", { y: 80, autoAlpha: 0, stagger: .1, ease: "power2.out" }, .35);
  });
  mm.add("(max-width: 767px)", function () {
    gsap.from(".show__copy > *", { y: 60, autoAlpha: 0, duration: 1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: ".show", start: "top 60%" } });
  });

  /* ----- process: sticky split ----- */
  var steps = $$(".step"), pics = $$(".sv__stack img"), cnt = $(".sv__count b");
  steps.forEach(function (s, i) {
    ScrollTrigger.create({ trigger: s, start: "top 60%", end: "bottom 40%",
      onToggle: function (self) {
        if (!self.isActive) return;
        steps.forEach(function (o, k) { o.classList.toggle("is-on", k === i); });
        pics.forEach(function (o, k) { o.classList.toggle("is-on", k === i); });
        if (cnt) cnt.textContent = "0" + (i + 1);
      } });
  });
  gsap.from(".sv__media", { clipPath: "inset(20% 20% 20% 20% round 32px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".split-view", start: "top 75%" } });

  /* ----- reach ----- */
  gsap.fromTo(".reach__bg", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".reach", start: "top bottom", end: "bottom top", scrub: true } });
  ScrollTrigger.create({ trigger: ".reach__nums", start: "top 80%", onEnter: function () { $$(".reach [data-count]").forEach(function (e) { countUp(e, 1.8); }); } });
  gsap.from(".reach__nums > *", { y: 80, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".reach__nums", start: "top 85%" } });
  gsap.from(".reach__arrow", { scaleX: 0, transformOrigin: "left", duration: 1.2, ease: "expo.inOut", scrollTrigger: { trigger: ".reach__nums", start: "top 80%" } });
  $$(".cloud").forEach(function (c) {
    gsap.from(c.children, { y: 30, scale: .6, autoAlpha: 0, duration: .8, ease: "back.out(2)", stagger: .04, scrollTrigger: { trigger: c, start: "top 90%" } });
  });

  /* ----- why ----- */
  gsap.from(".why__photo", { clipPath: "inset(15% 15% 15% 15% round 32px)", scale: 1.05, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".why__grid", start: "top 80%" } });
  gsap.from(".why__card", { y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".why__grid", start: "top 80%" } });

  /* ----- clients ----- */
  gsap.from(".logo-grid img", { y: 40, autoAlpha: 0, scale: .9, duration: .9, ease: "expo.out", stagger: { each: .03, from: "center" }, scrollTrigger: { trigger: ".logo-grid", start: "top 85%" } });

  /* ----- contact ----- */
  gsap.from(".cta", { y: 100, scale: .94, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".cta", start: "top 85%" } });
  gsap.fromTo(".cta__bg", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".cta__btns, .info > div", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".cta__btns", start: "top 90%" } });

  /* ----- desktop: cursor, magnetic, tilt ----- */
  if (fine) {
    var cur = $(".cursor");
    var cx = gsap.quickTo(cur, "x", { duration: .25, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: .25, ease: "power3" });
    window.addEventListener("mousemove", function (e) { cur.classList.add("is-live"); cx(e.clientX); cy(e.clientY); });
    $$("a, button, .icard, .tile, .why__card").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
    $$(".magnetic").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: .8, ease: "elastic.out(1,.35)" }), my = gsap.quickTo(el, "y", { duration: .8, ease: "elastic.out(1,.35)" });
      el.addEventListener("mousemove", function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3); });
      el.addEventListener("mouseleave", function () { mx(0); my(0); });
    });
    $$(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: px * 12, rotateX: -py * 12, transformPerspective: 900, duration: .5, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1,.4)" }); });
    });
    var chips = $$(".float-chip");
    window.addEventListener("mousemove", function (e) {
      var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      chips.forEach(function (c, i) { gsap.to(c, { x: x * (20 + i * 14), y: y * (16 + i * 10), duration: 1, ease: "power3.out", overwrite: "auto" }); });
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
