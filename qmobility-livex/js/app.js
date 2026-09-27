/* Q Mobility · LIVEX 2026 — kiosk app controller */
(() => {
  'use strict';

  const STAGE_W = 1920;
  const STAGE_H = 1080;
  const IDLE_MS = 75000;        // return to home after this long without a touch
  const IDLE_WARN_MS = 10000;   // show the countdown bar for the final stretch

  const SLIDES = ['home', 'network', 'technology', 'closing'];

  const GATES = [
    { id: 'saadiyat', name: 'Al Saadiyat Toll Gate', ar: 'بوابة السعديات للتعرفة المرورية', x: .3040, y: .100 },
    { id: 'qurm',     name: 'Al Qurm Toll Gate',     ar: 'بوابة القرم للتعرفة المرورية',   x: .5400, y: .566, photo: 'assets/img/gate-al-qurm.jpg' },
    { id: 'maqta',    name: "Al Maqta' Toll Gate",   ar: 'بوابة المقطع للتعرفة المرورية',  x: .5685, y: .583 },
    { id: 'sasalnakhl', name: 'Sas Al Nakhl Toll Gate', ar: 'بوابة ساس النخل للتعرفة المرورية', x: .5945, y: .545 },
    { id: 'rabdan',   name: 'Rabdan Toll Gate',      ar: 'بوابة ربدان للتعرفة المرورية',   x: .6070, y: .670 },
    { id: 'ghantout', name: 'Ghantout Toll Gate',    ar: 'بوابة غنتوت للتعرفة المرورية',   x: .8890, y: .200, photo: 'assets/img/gate-ghantout.jpg' },
  ];

  const DETAILS = {
    darb: {
      icon: 'i-gate', eyebrow: 'DARB toll gates',
      title: 'Integrated tolling across Abu Dhabi.',
      text: 'Six DARB toll gates keep traffic flowing on the capital’s key corridors.',
      facts: ['<b>6</b> toll gates across Abu Dhabi', '<b>4</b> intercity gates · <b>2</b> city peripheral gates', 'Al Qurm · Al Maqta’ · Sas Al Nakhl · Rabdan · Al Saadiyat · Ghantout'],
      media: [{ src: 'assets/img/gate-al-qurm.jpg', cap: 'Al Qurm Toll Gate' }, { src: 'assets/img/gate-ghantout.jpg', cap: 'Ghantout Toll Gate' }],
      stacked: true,
      action: { label: 'View toll gate map', go: 'explore' },
    },
    ai: {
      icon: 'i-camera', eyebrow: 'AI-enabled devices',
      title: 'Smarter sensing and real-time guidance.',
      text: 'Camera-equipped SmartPark units bring intelligent sensing to the kerbside.',
      facts: ['AI-enabled cameras on solar-powered units', 'Real-time guidance for drivers', 'Part of one integrated mobility network'],
      media: [{ src: 'assets/img/smartpark-02.jpg', cap: 'SmartPark · AI camera', pos: 'center 40%' }],
    },
    smartpark: {
      icon: 'i-park', eyebrow: 'SmartPark',
      title: 'Intelligent parking touchpoints across the city.',
      text: 'SmartPark connects drivers to parking across Abu Dhabi — with automatic deduction through DARB.',
      facts: ['<b>250,000+</b> parking spaces', 'Public and private parking across the city', 'Automatic deduction'],
      media: [{ src: 'assets/img/smartpark-01.jpg', cap: 'SmartPark unit', pos: 'center 45%' }, { src: 'assets/img/smartpark-02.jpg', cap: 'SmartPark · Downtown', pos: 'center 50%' }],
      cols: 2,
    },
    app: {
      icon: 'i-wallet', eyebrow: 'App + Wallet',
      title: 'Seamless access, payment and account management.',
      text: 'Tolling and parking brought together in one place, on your phone.',
      facts: ['One account for tolling and parking', 'Wallet for fast, seamless payment', 'Manage your account on the go'],
      phone: true,
    },
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const stage = $('#stage');
  const nav = $('#nav');
  const progress = $('#progress');
  const idleBar = $('#idleBar');
  const screens = Object.fromEntries($$('.screen').map(el => [el.dataset.screen, el]));

  let current = null;
  let exploreOrigin = 'home';

  /* ---------- scale the 1920×1080 stage to any display ---------- */
  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.setProperty('--scale', s);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- screen routing ---------- */
  function show(name, { instant = false } = {}) {
    if (!screens[name] || name === current) return;
    closeSheet();
    if (name === 'explore' && current !== 'explore') exploreOrigin = current || 'home';

    const prev = current && screens[current];
    if (prev) {
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-leaving'), 800);
    }
    const next = screens[name];
    if (instant) next.style.transition = 'none';
    // force a reflow so staggered reveals replay every visit
    void next.offsetWidth;
    next.classList.add('is-active');
    if (instant) requestAnimationFrame(() => (next.style.transition = ''));

    current = name;
    updateNav();
    if (name === 'network') runCounters(next);
    if (name === 'explore') resetMap();
    try { history.replaceState(null, '', '#' + name); } catch (_) { /* file:// */ }
    poke();
  }

  function neighbours() {
    if (current === 'explore') {
      const i = SLIDES.indexOf(exploreOrigin);
      return { prev: exploreOrigin, next: SLIDES[Math.min(i + 1, SLIDES.length - 1)] };
    }
    const i = SLIDES.indexOf(current);
    return { prev: SLIDES[i - 1] || null, next: SLIDES[i + 1] || null };
  }

  function updateNav() {
    const onHome = current === 'home';
    nav.classList.toggle('is-hidden', onHome);
    const { prev, next } = neighbours();
    const nextBtn = $('[data-nav="next"]', nav);
    const homeBtn = $('[data-nav="home"]', nav);
    nextBtn.style.display = next && next !== current ? '' : 'none';
    nextBtn.classList.toggle('nav-btn--active', !!next);
    homeBtn.classList.toggle('nav-btn--active', current === 'closing');
    $('[data-nav="prev"]', nav).disabled = !prev;

    const idx = ['network', 'technology', 'closing'].indexOf(current);
    progress.classList.toggle('is-hidden', idx < 0);
    $$('i', progress).forEach((dot, i) => dot.classList.toggle('on', i === idx));
  }

  function go(dir) {
    const { prev, next } = neighbours();
    if (dir === 'home') return show('home');
    const target = dir === 'next' ? next : prev;
    if (target) show(target);
  }

  /* ---------- counters ---------- */
  function runCounters(root) {
    $$('[data-count]', root).forEach(el => {
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = end > 100 ? 1800 : 900;
      const delay = 650;
      const t0 = performance.now() + delay;
      el.textContent = '0' + suffix;
      const tick = now => {
        const p = Math.min(Math.max((now - t0) / dur, 0), 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * eased).toLocaleString('en-US') + suffix;
        if (p < 1 && current === 'network') requestAnimationFrame(tick);
        else el.textContent = end.toLocaleString('en-US') + suffix;
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- toll gate map ---------- */
  const mapFrame = $('.map-frame');
  const mapCanvas = $('#mapCanvas');
  const pinsLayer = $('#mapPins');
  const gateList = $('#gateList');
  const gateCard = $('#gateCard');
  let selectedGate = null;

  GATES.forEach((g, i) => {
    const pin = document.createElement('button');
    pin.className = 'map-pin';
    pin.style.left = g.x * 100 + '%';
    pin.style.top = g.y * 100 + '%';
    pin.dataset.gate = g.id;
    pin.setAttribute('aria-label', g.name);
    pinsLayer.appendChild(pin);

    const li = document.createElement('li');
    li.style.transitionDelay = 0.35 + i * 0.07 + 's';
    li.innerHTML = `<button data-gate="${g.id}"><span class="num">${i + 1}</span><span><span class="name">${g.name.replace(' Toll Gate', '')}</span><span class="ar" lang="ar" dir="rtl">${g.ar.replace(' للتعرفة المرورية', '')}</span></span></button>`;
    gateList.appendChild(li);
  });

  function selectGate(id) {
    const g = GATES.find(x => x.id === id);
    if (!g) return;
    selectedGate = id;
    $$('[data-gate]').forEach(el => el.classList.toggle('is-selected', el.dataset.gate === id));

    // zoom toward the gate, clamped inside the frame
    const W = mapFrame.clientWidth, H = mapFrame.clientHeight, s = 1.55;
    let tx = W / 2 - g.x * W * s;
    let ty = H / 2 - g.y * H * s;
    tx = Math.min(0, Math.max(W - W * s, tx));
    ty = Math.min(0, Math.max(H - H * s, ty));
    mapCanvas.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;

    // card on the side opposite the pin
    const pinX = g.x * W * s + tx;
    gateCard.style.left = pinX > W * 0.55 ? '24px' : 'auto';
    gateCard.style.right = pinX > W * 0.55 ? 'auto' : '24px';

    const photo = $('#gateCardPhoto');
    photo.classList.toggle('is-empty', !g.photo);
    photo.style.backgroundImage = g.photo ? `url(${g.photo})` : '';
    $('#gateCardName').textContent = g.name;
    $('#gateCardAr').textContent = g.ar;
    gateCard.hidden = false;
    // replay the entrance animation
    gateCard.style.animation = 'none'; void gateCard.offsetWidth; gateCard.style.animation = '';
  }

  function resetMap() {
    selectedGate = null;
    gateCard.hidden = true;
    mapCanvas.style.transform = '';
    $$('[data-gate]').forEach(el => el.classList.remove('is-selected'));
  }

  $('.gate-card__close').addEventListener('click', resetMap);

  /* ---------- technology detail sheet ---------- */
  const sheet = $('#sheet');

  function openSheet(key) {
    const d = DETAILS[key];
    if (!d) return;
    $('#sheetIcon use').setAttribute('href', '#' + d.icon);
    $('#sheetEyebrow').textContent = d.eyebrow;
    $('#sheetTitle').textContent = d.title;
    $('#sheetText').textContent = d.text;
    $('#sheetFacts').innerHTML = d.facts.map(f => `<li><span>${f}</span></li>`).join('');

    const media = $('#sheetMedia');
    media.className = 'sheet__media' + (d.cols === 2 ? ' cols-2' : '');
    if (d.phone) {
      media.innerHTML = '<div class="phone"><div class="phone__body"><div class="phone__screen"><span class="phone__notch"></span><div class="phone__ring">P</div></div></div></div>';
    } else {
      media.innerHTML = d.media.map(m =>
        `<figure class="is-active-img" style="background-image:url(${m.src});background-position:${m.pos || 'center'}"><figcaption>${m.cap}</figcaption></figure>`
      ).join('');
    }

    const action = $('#sheetAction');
    if (d.action) {
      action.hidden = false;
      action.innerHTML = `${d.action.label} <b>&gt;</b>`;
      action.onclick = () => show(d.action.go);
    } else {
      action.hidden = true;
      action.onclick = null;
    }
    sheet.hidden = false;
  }

  function closeSheet() { sheet.hidden = true; }

  /* ---------- input ---------- */
  stage.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-nav],[data-detail],[data-gate],[data-close]');
    if (!t) return;
    if (t.dataset.go) show(t.dataset.go);
    else if (t.dataset.nav) go(t.dataset.nav);
    else if (t.dataset.detail) openSheet(t.dataset.detail);
    else if (t.dataset.gate) (selectedGate === t.dataset.gate ? resetMap() : selectGate(t.dataset.gate));
    else if (t.hasAttribute('data-close')) closeSheet();
  });

  // pressed-state feedback that also works on touch screens
  stage.addEventListener('pointerdown', e => {
    const b = e.target.closest('.glass-btn');
    if (b) { b.classList.add('is-pressed'); setTimeout(() => b.classList.remove('is-pressed'), 350); }
  });

  // horizontal swipe between slides
  let sx = 0, sy = 0, st = 0;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  stage.addEventListener('pointerup', e => {
    if (!sheet.hidden || current === 'home' || current === 'explore') return;
    const scale = parseFloat(getComputedStyle(stage).getPropertyValue('--scale')) || 1;
    const dx = (e.clientX - sx) / scale, dy = (e.clientY - sy) / scale;
    if (Date.now() - st < 700 && Math.abs(dx) > 160 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 'next' : 'prev');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') go('next');
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go('prev');
    else if (e.key === 'Home' || e.key.toLowerCase() === 'h') show('home');
    else if (e.key === 'Escape') { if (!sheet.hidden) closeSheet(); else if (current === 'explore') go('prev'); }
    else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    else if (e.key.toLowerCase() === 'm') show('explore');
    else return;
    e.preventDefault();
    poke();
  });

  // kiosk hygiene
  ['contextmenu', 'dragstart', 'selectstart', 'gesturestart'].forEach(ev =>
    document.addEventListener(ev, e => e.preventDefault()));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd < 300) e.preventDefault(); // block double-tap zoom
    lastTouchEnd = now;
  }, { passive: false });

  function toggleFullscreen() {
    const d = document;
    if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen)?.call(d.documentElement).catch?.(() => {});
    else (d.exitFullscreen || d.webkitExitFullscreen)?.call(d);
  }
  // ?kiosk=1 → first touch goes fullscreen and hides the cursor
  const params = new URLSearchParams(location.search);
  if (params.has('kiosk')) {
    document.body.classList.add('hide-cursor');
    document.addEventListener('pointerdown', () => { if (!document.fullscreenElement) toggleFullscreen(); }, { once: true });
  }

  /* ---------- idle → home ---------- */
  let idleTimer = 0, warnTimer = 0;
  function poke() {
    clearTimeout(idleTimer); clearTimeout(warnTimer);
    idleBar.classList.remove('is-running');
    idleBar.style.transition = 'opacity .4s'; idleBar.style.transform = 'scaleX(0)';
    if (current === 'home') return;
    warnTimer = setTimeout(() => {
      idleBar.classList.add('is-running');
      idleBar.style.transform = 'scaleX(1)';
      void idleBar.offsetWidth;
      idleBar.style.transition = `opacity .4s, transform ${IDLE_WARN_MS}ms linear`;
      idleBar.style.transform = 'scaleX(0)';
    }, IDLE_MS - IDLE_WARN_MS);
    idleTimer = setTimeout(() => show('home'), IDLE_MS);
  }
  ['pointerdown', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, poke, { passive: true }));

  /* ---------- preload imagery, then start ---------- */
  ['abu-dhabi-aerial.jpg', 'technology-scene.jpg', 'toll-gates-map.jpg', 'gate-al-qurm.jpg', 'gate-ghantout.jpg', 'smartpark-01.jpg', 'smartpark-02.jpg']
    .forEach(f => { const i = new Image(); i.src = 'assets/img/' + f; });

  const start = (location.hash || '').slice(1);
  const begin = () => show(screens[start] ? start : 'home', { instant: false });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(begin));
})();
