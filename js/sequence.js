/* Taqdeer — scroll-driven image-sequence hero
   Plays the frame folders on a <canvas> as the visitor scrolls through .hero.
   Works without any library. Exposes window.TQSeq for the intro loader. */
(function () {
  "use strict";
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var canvas = hero.querySelector(".hero__canvas");
  var ctx = canvas.getContext("2d");

  var isMobile = window.matchMedia("(max-width: 767px)").matches;
  var total = parseInt(hero.dataset.frames || "240", 10);
  var base = isMobile ? hero.dataset.mobile : hero.dataset.desktop;
  var step = parseInt((isMobile ? hero.dataset.stepMobile : hero.dataset.stepDesktop) || "1", 10);

  /* frame numbers to use, always including the last one */
  var nums = [];
  for (var n = 1; n <= total; n += step) nums.push(n);
  if (nums[nums.length - 1] !== total) nums.push(total);
  var COUNT = nums.length;

  function src(i) { return base + ("00" + nums[i]).slice(-3) + ".jpg"; }

  var frames = new Array(COUNT), ok = new Array(COUNT);
  var loadedCount = 0, readyCbs = [], firstReady = false;

  /* load order: first frame, then coarse-to-fine passes */
  var order = [0], seen = { 0: true };
  [16, 8, 4, 2, 1].forEach(function (gap) {
    for (var i = 0; i < COUNT; i += gap) if (!seen[i]) { seen[i] = true; order.push(i); }
  });
  if (!seen[COUNT - 1]) order.push(COUNT - 1);

  var q = 0, active = 0, MAX = isMobile ? 4 : 6;
  function pump() {
    while (active < MAX && q < order.length) load(order[q++]);
  }
  function load(i) {
    active++;
    var im = new Image();
    im.decoding = "async";
    im.onload = function () {
      frames[i] = im; ok[i] = true; loadedCount++; active--;
      if (i === 0 && !firstReady) { firstReady = true; resize(); readyCbs.forEach(function (cb) { cb(); }); }
      needsDraw = true; pump();
    };
    im.onerror = function () { active--; pump(); };
    im.src = src(i);
  }
  pump();

  /* nearest loaded frame to the one we want */
  function nearest(i) {
    if (ok[i]) return i;
    for (var d = 1; d < COUNT; d++) {
      if (i - d >= 0 && ok[i - d]) return i - d;
      if (i + d < COUNT && ok[i + d]) return i + d;
    }
    return -1;
  }

  /* canvas sizing (object-fit: cover) */
  var cw = 0, ch = 0, dpr = 1, needsDraw = true;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    cw = Math.round(r.width * dpr); ch = Math.round(r.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    needsDraw = true;
  }
  window.addEventListener("resize", resize);

  var drawn = -1;
  function draw(i) {
    var k = nearest(i);
    if (k < 0) return;
    if (k === drawn && !needsDraw) return;
    var im = frames[k];
    var s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = k; needsDraw = false;
  }

  /* scroll progress through the hero (0 → 1) */
  var progress = 0, current = 0;
  function measure() {
    var r = hero.getBoundingClientRect();
    var len = hero.offsetHeight - window.innerHeight;
    progress = len > 0 ? Math.min(1, Math.max(0, -r.top / len)) : 0;
    return r;
  }

  function loop() {
    var r = measure();
    if (r.bottom > -50 && r.top < window.innerHeight + 50) {
      var target = progress * (COUNT - 1);
      current += (target - current) * 0.22;            // smooth catch-up
      if (Math.abs(target - current) < 0.01) current = target;
      draw(Math.round(current));
    }
    requestAnimationFrame(loop);
  }
  resize(); requestAnimationFrame(loop);

  window.TQSeq = {
    count: COUNT,
    progress: function () { return progress; },
    loaded: function () { return loadedCount; },
    onFirst: function (cb) { firstReady ? cb() : readyCbs.push(cb); }
  };
})();
