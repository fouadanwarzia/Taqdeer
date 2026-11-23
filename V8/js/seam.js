/* ============================================================================
   Taqdeer V8 · the seam, the split, and the crossing
   ----------------------------------------------------------------------------
   Page code, not engine code. Reads each split act's scroll position and:
     1. drives --split on the act's stage (where the divider sits, 0..1)
     2. moves the fixed seam chrome to the active act's divider, swaps its
        labels, and fills it with page progress
     3. the signature move, THE CROSSING: in the trades act every trade word
        leaves the source column, passes through the seam (changing colour as
        it does, because each word exists once per side and each copy is
        clipped to its own half) and lands in the crew manifest on site.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phoneMQ = matchMedia('(max-width: 860px)');
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var smooth = function (x) { x = clamp01(x); return x * x * (3 - 2 * x); };
  var easeIO = function (x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var seam = document.querySelector('.seam');
  var seamL = document.querySelector('.seam__l');
  var seamR = document.querySelector('.seam__r');
  var gate = document.querySelector('.seam__gate');
  var corner = document.querySelector('.corner-cta');
  var mbar = document.querySelector('.mbar');
  var root = document.documentElement;

  var acts = Array.prototype.map.call(document.querySelectorAll('[data-split]'), function (el) {
    return {
      el: el,
      kind: el.getAttribute('data-split'),
      pinned: el.getAttribute('data-sc-act') !== 'flow',
      stage: el.querySelector('[data-sc-stage]'),
      left: el.getAttribute('data-left') || '',
      right: el.getAttribute('data-right') || '',
      p: 0, split: 0.5
    };
  });

  /* ---- split curves, one per act kind ---------------------------------- */
  function splitFor(a, p) {
    switch (a.kind) {
      // the balance tips toward SOURCE while its figures count, then toward SITE
      case 'sway': return reduce ? 0.5 : 0.5 + 0.075 * Math.sin(p * Math.PI * 2);
      // the resolve: the seam travels to the edge, SITE takes the page
      case 'collapse': return reduce ? 0 : 0.5 * (1 - smooth((p - 0.06) / 0.46));
      default: return 0.5;
    }
  }

  /* ---- hero planes: different rates are the depth ---------------------- */
  var hero = acts.filter(function (a) { return a.kind === 'hero'; })[0];
  var planes = hero ? Array.prototype.map.call(hero.el.querySelectorAll('[data-plane]'), function (el) {
    return { el: el, rate: parseFloat(el.getAttribute('data-plane')) || 1 };
  }) : [];
  var globe = document.getElementById('globe');

  /* ---- scale act: content follows its half ------------------------------ */
  function shiftEls(a) { return a.stage ? a.stage.querySelectorAll('[data-shift]') : []; }
  acts.forEach(function (a) { a.shift = shiftEls(a); });

  /* ---- close: winning column follows the seam to the edge --------------- */
  var close = acts.filter(function (a) { return a.kind === 'collapse'; })[0];
  var follow = close ? close.stage.querySelector('[data-follow]') : null;
  var fadeOut = close ? close.stage.querySelector('[data-fade-out]') : null;
  var followNat = 0, followTarget = 0;

  /* ---- THE CROSSING ------------------------------------------------------ */
  var cross = acts.filter(function (a) { return a.kind === 'cross'; })[0];
  var X = null;
  if (cross) {
    var srcItems = Array.prototype.slice.call(cross.stage.querySelectorAll('[data-cross-src] li'));
    var dstItems = Array.prototype.slice.call(cross.stage.querySelectorAll('[data-cross-dst] li'));
    var layers = cross.stage.querySelectorAll('[data-cross-layer]');
    var words = srcItems.map(function (li, i) {
      var twins = Array.prototype.map.call(layers, function (L) {
        var s = document.createElement('span');
        s.className = 'xw';
        s.textContent = li.textContent;
        L.appendChild(s);
        return s;
      });
      var n = srcItems.length;
      var start = 0.06 + i * (0.76 / n);
      return { src: li, dst: dstItems[i], twins: twins, from: start, to: start + 0.15, geo: null, state: -1 };
    });
    X = { words: words };
  }

  function measureCross() {
    if (!X) return;
    var sr = cross.stage.getBoundingClientRect();
    X.words.forEach(function (w) {
      var a = w.src.getBoundingClientRect();
      var bEl = w.dst.querySelector('span') || w.dst;
      var b = bEl.getBoundingClientRect();
      var fsA = parseFloat(getComputedStyle(w.src).fontSize);
      var fsB = parseFloat(getComputedStyle(bEl).fontSize);
      w.geo = {
        x0: a.left - sr.left, y0: a.top - sr.top,
        x1: b.left - sr.left, y1: b.top - sr.top,
        s1: fsB / fsA, h: a.height, w: a.width
      };
      w.twins.forEach(function (t) { t.style.fontSize = fsA + 'px'; });
    });
    X.stageW = sr.width; X.stageH = sr.height;
  }

  function drawCross(p) {
    if (!X) return null;
    var seamPx = phoneMQ.matches ? X.stageH * 0.5 : X.stageW * 0.5;
    var gateY = null, gateA = 0;
    for (var i = 0; i < X.words.length; i++) {
      var w = X.words[i], g = w.geo;
      if (!g) continue;
      var t = clamp01((p - w.from) / (w.to - w.from));
      var state = t <= 0 ? 0 : t >= 1 ? 2 : 1;
      if (state !== w.state) {
        w.src.classList.toggle('is-gone', state > 0);
        w.dst.classList.toggle('is-in', state === 2);
        w.state = state;
      }
      if (reduce) continue;
      var e = easeIO(t);
      var x = lerp(g.x0, g.x1, e);
      var y = lerp(g.y0, g.y1, e) - Math.sin(Math.PI * e) * (phoneMQ.matches ? 0 : 46);
      if (phoneMQ.matches) x += Math.sin(Math.PI * e) * 24;
      var s = lerp(1, g.s1, e);
      var tf = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
      var op = state === 1 ? '1' : '0';
      for (var k = 0; k < w.twins.length; k++) {
        w.twins[k].style.transform = tf;
        w.twins[k].style.opacity = op;
      }
      if (state === 1) {
        var centre = phoneMQ.matches ? y + g.h * s * 0.5 : x + g.w * s * 0.5;
        var near = 1 - Math.min(Math.abs(centre - seamPx) / 140, 1);
        if (near > gateA) { gateA = near; gateY = y + g.h * s * 0.5; }
      }
    }
    return gateA > 0 ? { y: gateY, a: gateA } : null;
  }

  /* ---- layout ------------------------------------------------------------ */
  var vh = innerHeight, vw = innerWidth;
  function layout() {
    vh = innerHeight; vw = innerWidth;
    if (follow) {
      follow.style.transform = 'none';
      if (phoneMQ.matches) {
        followNat = follow.offsetTop;
        followTarget = parseFloat(getComputedStyle(root).getPropertyValue('--bar')) + 18 || 70;
      } else {
        followNat = follow.offsetLeft;
        followTarget = parseFloat(getComputedStyle(follow.parentNode).paddingLeft) || 0;
        followTarget = Math.max(24, Math.min(vw * 0.06, 88));
      }
    }
    if (cross && cross.stage) {
      cross.stage.style.setProperty('--split', '0.5');
      // measure with the source list fully laid out
      measureCross();
    }
    dirty = true;
  }

  /* ---- frame ------------------------------------------------------------- */
  var lastY = -1, dirty = true, curL = null, curR = null, swapT = 0;
  function frame() {
    requestAnimationFrame(frame);
    var y = scrollY;
    if (y === lastY && !dirty) return;
    lastY = y; dirty = false;

    var docH = document.documentElement.scrollHeight - vh;
    var prog = docH > 0 ? clamp01(y / docH) : 0;
    if (seam) seam.style.setProperty('--prog', prog.toFixed(4));
    if (mbar) mbar.style.setProperty('--prog', prog.toFixed(4));

    var active = null, mid = vh * 0.5;
    for (var i = 0; i < acts.length; i++) {
      var a = acts[i];
      var r = a.el.getBoundingClientRect();
      if (a.pinned) {
        var travel = Math.max(r.height - vh, 1);
        a.p = clamp01(-r.top / travel);
        a.split = splitFor(a, a.p);
        // a stage that is sliding in or out still shows its resting split
        if (a.stage) a.stage.style.setProperty('--split', a.split.toFixed(4));
        if (a.shift.length) {
          var dx = (a.split - 0.5) * (phoneMQ.matches ? 0 : vw * 0.5);
          for (var s = 0; s < a.shift.length; s++) a.shift[s].style.transform = dx ? 'translate3d(' + dx.toFixed(1) + 'px,0,0)' : '';
        }
      }
      if (r.top <= mid && r.bottom >= mid) active = a;
    }

    // seam chrome
    var seamPos = active ? active.split : 0.5;
    if (seam) {
      seam.style.setProperty('--seam', seamPos.toFixed(4));
      seam.classList.toggle('is-gone', seamPos < 0.22);
      if (active && (active.left !== curL || active.right !== curR)) {
        curL = active.left; curR = active.right;
        seam.classList.add('is-swapping');
        clearTimeout(swapT);
        swapT = setTimeout(function () {
          seamL.textContent = curL; seamR.textContent = curR;
          seam.classList.remove('is-swapping');
        }, 200);
      }
    }
    if (corner) corner.classList.toggle('is-hidden', !!(close && active === close && close.p > 0.3));

    // hero planes
    if (hero && !reduce) {
      var hp = hero.p;
      for (var k = 0; k < planes.length; k++) {
        planes[k].el.style.transform = 'translate3d(0,' + (-hp * planes[k].rate * 9).toFixed(2) + 'vh,0)';
      }
      // on a phone the seam is horizontal, so the globe may scale about its centre but never shift vertically
      if (globe) globe.style.transform = 'translate3d(0,' + (phoneMQ.matches ? 0 : -hp * 5).toFixed(2) + 'vh,0) scale(' + (1 + hp * 0.16).toFixed(4) + ')';
    }

    // the crossing
    if (X) {
      var gp = drawCross(cross.p);
      if (gate) {
        if (gp && active === cross) {
          var sr = cross.stage.getBoundingClientRect();
          gate.style.setProperty('--gate-y', (sr.top + gp.y).toFixed(1) + 'px');
          gate.style.opacity = gp.a.toFixed(3);
        } else gate.style.opacity = '0';
      }
    }

    // the collapse
    if (close) {
      var t = 1 - close.split / 0.5;   // 0 at rest, 1 when SITE owns the page
      if (follow) {
        var d = (followTarget - followNat) * t;
        follow.style.transform = phoneMQ.matches ? 'translate3d(0,' + d.toFixed(1) + 'px,0)' : 'translate3d(' + d.toFixed(1) + 'px,0,0)';
      }
      if (fadeOut) fadeOut.style.opacity = (1 - smooth(t * 1.6)).toFixed(3);
    }
  }

  addEventListener('resize', function () { layout(); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  layout();
  requestAnimationFrame(frame);
})();
