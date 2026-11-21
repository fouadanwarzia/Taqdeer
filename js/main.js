/* Taqdeer Manpower — interactions & animation */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  if (!hasGsap || reduce) {
    document.body.classList.remove("is-loading");
    var l = document.querySelector(".loader"); if (l) l.remove();
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = format(+el.dataset.count) + (el.dataset.suffix || "");
    });
    setupMenu();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var target = id === "#top" ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      document.body.classList.remove("menu-open");
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: "smooth" });
    });
  });

  /* ---------- Split text helpers ---------- */
  function splitWords(el) {
    var html = el.innerHTML;
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var out = [];
    tmp.childNodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) out.push(" ");
          else out.push('<span class="word"><span>' + w + "</span></span>");
        });
      } else {
        out.push('<span class="word"><span>' + node.outerHTML + "</span></span>");
      }
    });
    el.innerHTML = out.join("");
    return el.querySelectorAll(".word > span");
  }
  function splitChars(el) {
    var text = el.textContent; el.textContent = "";
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.style.display = "inline-block";
      s.textContent = text[i] === " " ? " " : text[i];
      el.appendChild(s); chars.push(s);
    }
    return chars;
  }

  /* ---------- Preloader ---------- */
  var heroChars = [];
  document.querySelectorAll(".hero__title .split").forEach(function (el) {
    heroChars.push(splitChars(el));
  });
  gsap.set(heroChars.flat(), { yPercent: 110, rotate: 6 });
  gsap.set([".hero__eyebrow", ".hero__sub", ".hero__ctas", ".hero__stats > div", ".hero__scroll"], { autoAlpha: 0, y: 30 });
  gsap.set(".nav", { yPercent: -100 });

  var count = { v: 0 };
  var countEl = document.querySelector(".loader__count span");
  var imgs = Array.prototype.slice.call(document.images).slice(0, 12);
  var loaded = 0;
  var loadTl = gsap.timeline();
  loadTl.to(".loader__logo", { autoAlpha: 1, y: 0, duration: .9, ease: "expo.out" });

  function progressTo(p, dur) {
    gsap.to(count, { v: p, duration: dur, ease: "power2.out", onUpdate: function () {
      countEl.textContent = Math.round(count.v);
      gsap.set(".loader__bar span", { width: count.v + "%" });
    } });
  }
  imgs.forEach(function (im) {
    if (im.complete) tick();
    else { im.addEventListener("load", tick); im.addEventListener("error", tick); }
  });
  function tick() { loaded++; progressTo(Math.min(95, (loaded / imgs.length) * 100), .4); }
  var finished = false;
  function finish() {
    if (finished) return; finished = true;
    progressTo(100, .5);
    gsap.delayedCall(.6, intro);
  }
  window.addEventListener("load", finish);
  setTimeout(finish, 4500);

  function intro() {
    var tl = gsap.timeline();
    tl.to(".loader__inner", { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" })
      .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=.1")
      .add(function () { document.body.classList.remove("is-loading"); if (lenis) lenis.start(); }, "-=.6")
      .to(".hero__img.is-active", { scale: 1.08, duration: 2.4, ease: "expo.out" }, "-=.9")
      .to(heroChars.flat(), { yPercent: 0, rotate: 0, duration: 1.2, ease: "expo.out", stagger: .025 }, "-=2.1")
      .to(".nav", { yPercent: 0, duration: 1, ease: "expo.out" }, "-=1.2")
      .to([".hero__eyebrow", ".hero__sub", ".hero__ctas", ".hero__stats > div", ".hero__scroll"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .08 }, "-=1")
      .add(function () { document.querySelector(".loader").remove(); countUp(".hero__stats [data-count]"); }, "-=.6");
  }

  /* ---------- Hero slideshow ---------- */
  (function () {
    var slides = document.querySelectorAll(".hero__img");
    var dots = document.querySelectorAll(".hero__dots span");
    if (window.innerWidth < 700) {
      slides.forEach(function (sl) { if (sl.dataset.mobile) sl.src = sl.dataset.mobile; });
    }
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active"); dots[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      gsap.fromTo(slides[i], { scale: 1.2 }, { scale: 1.06, duration: 7, ease: "power1.out" });
      slides[i].classList.add("is-active");
      void dots[i].offsetWidth; dots[i].classList.add("is-active");
    }, 6000);
  })();

  /* ---------- Hero scroll parallax ---------- */
  gsap.to(".hero__media", { yPercent: 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__content", { yPercent: -18, autoAlpha: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Nav state ---------- */
  var nav = document.querySelector(".nav");
  var lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 60);
      nav.classList.toggle("is-hidden", y > lastY && y > 600 && !document.body.classList.contains("menu-open"));
      lastY = y;
      gsap.set(".progress", { scaleX: self.progress });
    }
  });

  /* ---------- Ticker ---------- */
  marquee(".ticker__track", 1, 40);
  marquee(".marquee--left .marquee__track", 1, 55);
  marquee(".marquee--right .marquee__track", -1, 55);
  marquee(".logos--left .logos__track", 1, 45);
  marquee(".logos--right .logos__track", -1, 45);

  function marquee(sel, dir, speed) {
    var track = document.querySelector(sel); if (!track) return;
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    var tween;
    function build() {
      if (tween) tween.kill();
      var w = track.scrollWidth / 2;
      gsap.set(track, { x: dir > 0 ? 0 : -w });
      tween = gsap.to(track, { x: dir > 0 ? -w : 0, duration: w / speed, ease: "none", repeat: -1 });
    }
    build();
    window.addEventListener("load", build);
    // speed up while scrolling
    ScrollTrigger.create({
      trigger: track, start: "top bottom", end: "bottom top",
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 300, 4);
        gsap.to(tween, { timeScale: 1 + v, duration: .3, overwrite: true, onComplete: function () { gsap.to(tween, { timeScale: 1, duration: 1 }); } });
      }
    });
    track.parentElement.addEventListener("mouseenter", function () { gsap.to(tween, { timeScale: .2, duration: .5 }); });
    track.parentElement.addEventListener("mouseleave", function () { gsap.to(tween, { timeScale: 1, duration: .5 }); });
  }

  /* ---------- Word reveals ---------- */
  document.querySelectorAll(".reveal-words").forEach(function (el) {
    var words = splitWords(el);
    gsap.from(words, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: .05, scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  gsap.utils.toArray(".eyebrow:not(.hero__eyebrow), .reveal").forEach(function (el) {
    gsap.from(el, { autoAlpha: 0, y: 30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  /* ---------- Image clip reveals + parallax ---------- */
  gsap.utils.toArray(".clip-reveal").forEach(function (el) {
    gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 80%" } });
    var im = el.querySelector("img");
    if (im) gsap.fromTo(im, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%" } });
  });
  gsap.utils.toArray("[data-speed]").forEach(function (im) {
    var s = parseFloat(im.dataset.speed);
    gsap.fromTo(im, { yPercent: (1 - s) * -40 }, { yPercent: (1 - s) * 40, ease: "none", scrollTrigger: { trigger: im.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- Years counter + pillars ---------- */
  gsap.from(".years", { autoAlpha: 0, x: -40, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".years", start: "top 90%" } });
  gsap.from(".badge-spin", { scale: 0, rotate: -180, duration: 1.4, ease: "back.out(1.6)", scrollTrigger: { trigger: ".about__media", start: "top 60%" } });
  gsap.from(".pillar", { y: 80, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".pillars", start: "top 85%" } });

  /* ---------- Counters ---------- */
  function format(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }
  function countUp(sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = 1;
      var o = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || "";
      gsap.to(o, { v: end, duration: 2.2, ease: "expo.out", onUpdate: function () { el.textContent = format(Math.round(o.v)) + suf; } });
    });
  }
  ScrollTrigger.batch(".stat", {
    start: "top 88%",
    onEnter: function (batch) {
      gsap.from(batch, { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1 });
      batch.forEach(function (s) { countUp(".stat:nth-child(" + (Array.prototype.indexOf.call(s.parentNode.children, s) + 1) + ") [data-count]"); });
    }
  });
  ScrollTrigger.create({ trigger: ".center__chip", start: "top 90%", onEnter: function () { countUp(".center__chip [data-count]"); } });

  /* ---------- Projects: horizontal pinned scroll ---------- */
  var track = document.querySelector(".projects__track");
  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", function () {
    var dist = function () { return track.scrollWidth - window.innerWidth; };
    var tw = gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: ".projects", start: "top top", end: function () { return "+=" + dist(); }, pin: ".projects__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.utils.toArray(".proj__img, .proj__cut").forEach(function (im) {
      gsap.fromTo(im, { xPercent: im.classList.contains("proj__cut") ? -50 : -8 }, {
        xPercent: im.classList.contains("proj__cut") ? -50 : 8, ease: "none",
        scrollTrigger: { trigger: im.parentElement, containerAnimation: tw, start: "left right", end: "right left", scrub: true }
      });
    });
    gsap.utils.toArray(".proj__cap").forEach(function (cap) {
      gsap.from(cap.children, { y: 40, autoAlpha: 0, stagger: .08, duration: .9, ease: "expo.out",
        scrollTrigger: { trigger: cap.parentElement, containerAnimation: tw, start: "left 80%" } });
    });
  });
  mm.add("(max-width: 767px)", function () {
    track.style.overflowX = "auto";
    track.style.width = "100%";
    track.style.scrollSnapType = "x mandatory";
  });

  /* ---------- Industries stagger ---------- */
  ScrollTrigger.batch(".ind", {
    start: "top 92%",
    onEnter: function (b) {
      gsap.fromTo(b, { clipPath: "inset(30% 30% 30% 30% round 18px)", autoAlpha: 0 }, { clipPath: "inset(0% 0% 0% 0% round 18px)", autoAlpha: 1, duration: 1.3, ease: "expo.out", stagger: .08 });
    }
  });

  /* ---------- Global pills ---------- */
  gsap.utils.toArray(".pills").forEach(function (ul) {
    gsap.from(ul.children, { y: 30, autoAlpha: 0, scale: .8, duration: .8, ease: "back.out(2)", stagger: .05, scrollTrigger: { trigger: ul, start: "top 88%" } });
  });

  /* ---------- Differentiators ---------- */
  gsap.utils.toArray(".diff__body").forEach(function (b) {
    gsap.from(b.children, { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: b, start: "top 85%" } });
  });
  gsap.from(".feat li", { x: 60, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: ".feat", start: "top 85%" } });

  /* ---------- Process ---------- */
  var steps = document.querySelectorAll(".step");
  ScrollTrigger.create({
    trigger: ".steps", start: "top 75%", end: "bottom 45%", scrub: true,
    onUpdate: function (self) {
      document.querySelector(".steps").style.setProperty("--p", self.progress);
      steps.forEach(function (s, i) { s.classList.toggle("is-on", self.progress >= i / (steps.length - 1) - .02); });
    }
  });
  gsap.from(".step", { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".steps", start: "top 85%" } });

  /* ---------- Contact title ---------- */
  var cChars = [];
  document.querySelectorAll(".contact__title .split").forEach(function (el) { cChars.push(splitChars(el)); });
  gsap.from(cChars.flat(), { yPercent: 110, rotate: 6, duration: 1.2, ease: "expo.out", stagger: .025, scrollTrigger: { trigger: ".contact__title", start: "top 80%" } });
  gsap.from(".ccard", { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".contact__cards", start: "top 90%" } });
  gsap.from(".footer__big", { yPercent: 60, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 95%" } });

  /* ---------- Cursor + magnetic + tilt (desktop only) ---------- */
  if (fine) {
    var cur = document.querySelector(".cursor");
    var cx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3" });
    var cy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3" });
    window.addEventListener("mousemove", function (e) { cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll("a, button, .trade, .ind").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: .6, ease: "elastic.out(1,.4)" });
      var my = gsap.quickTo(el, "y", { duration: .6, ease: "elastic.out(1,.4)" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener("mouseleave", function () { mx(0); my(0); });
    });
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: .6, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { rotateX: 0, rotateY: 0, duration: .8, ease: "elastic.out(1,.5)" }); });
    });
    // hero mouse parallax
    var hero = document.querySelector(".hero");
    var hx = gsap.quickTo(".hero__media", "x", { duration: 1.2, ease: "power3" });
    var hy = gsap.quickTo(".hero__media", "y", { duration: 1.2, ease: "power3" });
    hero.addEventListener("mousemove", function (e) {
      hx((e.clientX / window.innerWidth - .5) * -30); hy((e.clientY / window.innerHeight - .5) * -20);
    });
  }

  setupMenu();
  function setupMenu() {
    var burger = document.querySelector(".nav__burger");
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
      document.querySelector(".menu").setAttribute("aria-hidden", !open);
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", false);
        if (lenis) lenis.start();
      });
    });
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
