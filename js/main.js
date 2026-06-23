/* ============================================================
   TAQDEER MANPOWER — interactions
   Loader · nav · reveal-on-scroll · counters · hero intro ·
   card tilt · cursor glow
   ============================================================ */
(function () {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('done');
      playHeroIntro();
    }, 700);
  });

  /* ---------- Year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  const progress = document.getElementById('progress');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setOpen(false))
    );
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (prefersReduced) {
    reveals.forEach(r => r.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          const el = e.target;
          const delay = (el.style.getPropertyValue('--i') || 0) * 60;
          setTimeout(() => el.classList.add('in'), Math.min(delay, 400));
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(r => io.observe(r));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('.stat__num');
  const cIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const fmt = (n) => n >= 1000 ? Math.round(n).toLocaleString('en-US') : Math.round(n);
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      cIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cIO.observe(c));

  /* ---------- Hero intro (GSAP if present) ---------- */
  function playHeroIntro() {
    const lines = document.querySelectorAll('.reveal-line > span');
    const others = document.querySelectorAll('.hero .reveal');
    if (window.gsap && !prefersReduced) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to(lines, { y: 0, duration: 1, stagger: 0.12 })
        .to(others, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, '-=0.5');
      others.forEach(o => gsap.set(o, { y: 24 }));
      // Parallax hero content on scroll
      if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to('.hero__content', {
          y: 120, opacity: 0.2, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    } else {
      lines.forEach(l => l.style.transform = 'translateY(0)');
      others.forEach(o => o.classList.add('in'));
    }
  }

  /* ---------- Card 3D tilt + glow tracking ---------- */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 9}deg) rotateX(${(0.5 - py) * 9}deg) translateY(-6px)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; });
    (function follow() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
  }
})();
