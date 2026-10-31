/* Pejović apartmani — shared motion + behaviour (GSAP, ScrollTrigger, Flip, Lenis). Auto-runs on every page. */
(function () {
  if (window.PJ) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const C = { bg: '#F2EFE8', dark: '#101915', acc: '#1F5A50', gold: '#C2A273' };
  const LIBS = [
    'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js',
    'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js',
  ];
  const load = (src) => new Promise((r) => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s); });
  const q = (s) => [...document.querySelectorAll(s)];
  const once = (el, k) => { if (el['__pj' + k]) return false; el['__pj' + k] = 1; return true; };
  const lang = () => 'sr';
  let revealResolve; const revealed = new Promise((r) => (revealResolve = r));
  const PJ = (window.PJ = { RM, lang, revealed, lenis: null });

  /* ---------- overlay (preloader + page curtain) ---------- */
  function overlay(html) {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'fixed', inset: '0', zIndex: '9999', background: C.dark, color: C.bg, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 'clamp(24px,4vw,56px)', fontFamily: '"Instrument Serif", Georgia, serif', boxSizing: 'border-box' });
    d.innerHTML = html;
    (document.body || document.documentElement).appendChild(d);
    return d;
  }
  const small = (t) => `<div style="font:500 12px/1.4 'Inter Tight',sans-serif;letter-spacing:.18em;text-transform:uppercase;opacity:.7">${t}</div>`;
  function lift(d) {
    const done = () => { d.remove(); revealResolve(); };
    if (window.gsap) gsap.to(d, { yPercent: -100, duration: 1.1, ease: 'expo.inOut', onComplete: done });
    else done();
  }
  function intro() {
    const first = !sessionStorage.getItem('pj-seen');
    const label = sessionStorage.getItem('pj-trans');
    sessionStorage.setItem('pj-seen', '1');
    sessionStorage.removeItem('pj-trans');
    if (RM) return revealResolve();
    if (first) {
      const d = overlay(`${small('Pejović apartmani · Mojkovac')}<div data-n style="font-size:clamp(96px,22vw,320px);line-height:.8;font-variant-numeric:tabular-nums">0</div>`);
      const n = d.querySelector('[data-n]'); const t0 = performance.now();
      const tick = (t) => { const p = Math.min(1, (t - t0) / 1700); n.textContent = Math.round(100 * (1 - Math.pow(1 - p, 3))); p < 1 ? requestAnimationFrame(tick) : PJ.ready.then(() => setTimeout(() => lift(d), 150)); };
      requestAnimationFrame(tick);
    } else if (label) {
      const d = overlay(`${small('Pejović')}<div style="font-size:clamp(56px,10vw,160px);line-height:.9;font-style:italic">${label}</div>`);
      PJ.ready.then(() => setTimeout(() => lift(d), 120));
    } else revealResolve();
  }

  /* ---------- page transitions ---------- */
  const NAMES = { Home: 'Dobrodošli', Apartment: 'Apartman', Location: 'Lokacija', Gallery: 'Galerija', Book: 'Rezervacija', index: 'Dobrodošli', apartman: 'Apartman', lokacija: 'Lokacija', galerija: 'Galerija', rezervacija: 'Rezervacija' };
  PJ.go = function (href, label) {
    const name = decodeURIComponent(href.split('?')[0].split('/').pop()).replace(/(\.dc)?\.html$/, '');
    label = label || NAMES[name] || name;
    if (RM || !window.gsap) return (location.href = href);
    sessionStorage.setItem('pj-trans', label);
    const d = overlay(`${small('Pejović')}<div style="font-size:clamp(56px,10vw,160px);line-height:.9;font-style:italic">${label}</div>`);
    gsap.fromTo(d, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'expo.inOut', onComplete: () => (location.href = href) });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const h = a.getAttribute('href');
    if (!/\.html(\?|$)/.test(h) || /^(https?:|#|mailto:|tel:|viber:)/.test(h)) return;
    e.preventDefault();
    PJ.go(h, a.dataset.label);
  }, true);
  PJ.toggleLang = () => { localStorage.setItem('pj-lang', lang() === 'en' ? 'sr' : 'en'); PJ.go(location.pathname.split('/').pop() + location.search, lang() === 'sr' ? 'Srpski' : 'English'); };

  /* ---------- language ---------- */
  function applyLang() {
    if (lang() !== 'sr') return;
    q('[data-sr]').forEach((el) => {
      if (!once(el, 'sr')) return;
      const em = el.querySelector('em'); const st = em ? em.getAttribute('style') : '';
      el.innerHTML = el.dataset.sr.replace(/\*(.+?)\*/g, `<em style="${st || 'font-style:italic'}">$1</em>`);
    });
    q('[data-sr-ph]').forEach((el) => { if (once(el, 'ph')) el.placeholder = el.dataset.srPh; });
    document.documentElement.lang = 'sr';
  }

  /* ---------- splitting ---------- */
  function split(el, chars) {
    const out = [];
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) return f.appendChild(document.createTextNode(' '));
          const s = document.createElement('span'); s.style.display = 'inline-block';
          if (chars) { [...w].forEach((c) => { const i = document.createElement('span'); i.textContent = c; i.style.display = 'inline-block'; s.appendChild(i); out.push(i); }); }
          else { s.textContent = w; out.push(s); }
          f.appendChild(s);
        });
        n.replaceWith(f);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return out;
  }

  /* ---------- scan: wire up every data-* behaviour, idempotent ---------- */
  let refreshT;
  function scan() {
    applyLang();
    if (!window.gsap) return;
    const ST = { start: 'top 86%', once: true };
    q('[data-split]').forEach((el) => {
      if (!once(el, 'split')) return;
      const w = split(el); if (RM) return;
      gsap.set(w, { opacity: 0, yPercent: 35, filter: 'blur(14px)' });
      const play = () => gsap.to(w, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: 0.07 });
      el.hasAttribute('data-hero') ? revealed.then(play) : ScrollTrigger.create({ trigger: el, ...ST, onEnter: play });
    });
    q('[data-reveal]').forEach((el) => {
      if (!once(el, 'rev') || RM) return;
      gsap.set(el, { opacity: 0, y: 36 });
      const play = () => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: +el.dataset.reveal || 0 });
      el.hasAttribute('data-hero') ? revealed.then(play) : ScrollTrigger.create({ trigger: el, ...ST, onEnter: play });
    });
    q('[data-fill]').forEach((el) => {
      if (!once(el, 'fill')) return;
      const c = split(el, true); if (RM) return;
      gsap.fromTo(c, { opacity: 0.14 }, { opacity: 1, stagger: 0.02, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: true } });
    });
    q('[data-count]').forEach((el) => {
      if (!once(el, 'cnt')) return;
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), o = { v: 0 };
      const fmt = () => (el.textContent = o.v.toFixed(dec));
      if (RM) return (o.v = to), fmt();
      fmt();
      ScrollTrigger.create({ trigger: el, ...ST, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'expo.out', onUpdate: fmt }) });
    });
    q('[data-hero-img]').forEach((el) => {
      if (!once(el, 'hero') || RM) return;
      gsap.set(el, { scale: 1.15 }); revealed.then(() => gsap.to(el, { scale: 1, duration: 2.4, ease: 'expo.out' }));
    });
    q('[data-clip-grow]').forEach((el) => {
      if (!once(el, 'grow') || RM) return;
      gsap.fromTo(el, { clipPath: 'inset(16% 20% 16% 20% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top 85%', end: 'center center', scrub: true } });
    });
    q('[data-clip-reveal]').forEach((el) => {
      if (!once(el, 'clip') || RM) return;
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' }) });
    });
    q('[data-parallax]').forEach((el) => {
      if (!once(el, 'par') || RM) return;
      gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    q('[data-draw]').forEach((el) => {
      if (!once(el, 'draw') || RM) return;
      gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(el, { scaleX: 1, duration: 1.4, ease: 'expo.out', delay: +el.dataset.draw || 0 }) });
    });
    q('[data-video]').forEach((box) => {
      if (!once(box, 'vid')) return;
      const v = box.querySelector('video'), b = box.querySelector('[data-snd]');
      new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.35 }).observe(v);
      b.addEventListener('click', (e) => { e.stopPropagation(); v.muted = !v.muted; if (!v.muted) { v.currentTime = 0; v.play(); } b.textContent = v.muted ? 'Uključi zvuk' : 'Isključi zvuk'; });
      v.style.cursor = 'zoom-in';
      v.addEventListener('click', () => {
        v.pause();
        const o = document.createElement('div');
        Object.assign(o.style, { position: 'fixed', inset: '0', zIndex: '9990', background: 'rgba(16,25,21,.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 12px 24px' });
        o.innerHTML = `<video src="${v.getAttribute('src')}" controls autoplay playsinline style="max-width:100%;max-height:100%;border-radius:18px;background:#000"></video><button type="button" aria-label="Zatvori" style="position:absolute;top:14px;right:14px;width:48px;height:48px;border-radius:50%;border:1px solid rgba(242,239,232,.3);background:transparent;color:#F2EFE8;font-size:18px;cursor:pointer">✕</button>`;
        const big = o.querySelector('video'); big.currentTime = v.currentTime;
        const close = () => { big.pause(); o.remove(); removeEventListener('keydown', esc); PJ.lenis && PJ.lenis.start(); v.play().catch(() => {}); };
        const esc = (e) => e.key === 'Escape' && close();
        o.addEventListener('click', (e) => e.target !== big && close());
        addEventListener('keydown', esc);
        document.body.appendChild(o); PJ.lenis && PJ.lenis.stop();
        gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.4 }); gsap.fromTo(big, { scale: 0.9 }, { scale: 1, duration: 0.8, ease: 'expo.out' });
      });
    });
    q('[data-marquee]').forEach((el) => {
      if (!once(el, 'mq') || RM) return;
      const rev = el.dataset.marquee === 'right';
      gsap.fromTo(el, { xPercent: rev ? -50 : 0 }, { xPercent: rev ? 0 : -50, duration: 60, ease: 'none', repeat: -1 });
    });
    q('[data-letters]').forEach((el) => {
      if (!once(el, 'let')) return;
      const c = split(el, true); if (RM) return;
      gsap.fromTo(c, { yPercent: 105 }, { yPercent: 0, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 98%', end: 'bottom 92%', scrub: 1 } });
    });
    q('[data-hscroll]').forEach((sec) => {
      if (!once(sec, 'hs') || RM) return;
      const vp = sec.querySelector('[data-viewport]'), tr = sec.querySelector('[data-track]');
      vp.style.overflow = 'hidden'; vp.style.scrollSnapType = 'none';
      const dist = () => Math.max(0, tr.scrollWidth - vp.clientWidth);
      const st = gsap.to(tr, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: innerWidth < 900 ? 0.6 : 1, invalidateOnRefresh: true, anticipatePin: 1 } }).scrollTrigger;
      // touch: a horizontal swipe on the cards scrolls the page, which drives the pinned track
      let x0 = 0, y0 = 0, horiz = null;
      sec.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; horiz = null; }, { passive: true });
      sec.addEventListener('touchmove', (e) => {
        const x = e.touches[0].clientX, y = e.touches[0].clientY, dx = x - x0, dy = y - y0;
        if (horiz === null && Math.abs(dx) + Math.abs(dy) > 6) horiz = Math.abs(dx) > Math.abs(dy);
        if (!horiz || !st.isActive) return;
        e.preventDefault(); window.scrollBy(0, -dx * 1.4); x0 = x; y0 = y;
      }, { passive: false });
    });
    q('[data-magnetic]').forEach((el) => {
      if (!once(el, 'mag') || !FINE || RM) return;
      const ar = el.querySelector('[data-arrow]');
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.8, ease: 'power3.out' }); });
      el.addEventListener('mouseenter', () => ar && gsap.timeline().to(ar, { x: 14, opacity: 0, duration: 0.25, ease: 'power3.in' }).set(ar, { x: -14 }).to(ar, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }));
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,0.4)' }));
    });
    clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 250);
  }
  PJ.scan = scan;

  /* ---------- globals: grain, cursor, nav hide, smooth scroll ---------- */
  function globals() {
    const g = document.createElement('div');
    Object.assign(g.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9998', opacity: '.05', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` });
    document.body.appendChild(g);

    if (!RM) {
      PJ.lenis = new Lenis({ lerp: 0.1 });
      PJ.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => PJ.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    let lastY = scrollY;
    addEventListener('scroll', () => {
      const nav = document.querySelector('[data-nav]'); const y = scrollY;
      if (nav && Math.abs(y - lastY) > 6) gsap.to(nav, { yPercent: y > lastY && y > 140 ? -170 : 0, duration: 0.8, ease: 'power3.out' });
      lastY = y;
    }, { passive: true });

    if (FINE && !RM) {
      const c = document.createElement('div');
      Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: '12px', height: '12px', margin: '-6px 0 0 -6px', borderRadius: '50%', background: C.gold, zIndex: '9997', pointerEvents: 'none', display: 'grid', placeItems: 'center', font: "500 12px/1 'Inter Tight',sans-serif", letterSpacing: '.08em', color: C.dark, overflow: 'hidden' });
      document.body.appendChild(c);
      const xTo = gsap.quickTo(c, 'x', { duration: 0.5, ease: 'power3.out' }), yTo = gsap.quickTo(c, 'y', { duration: 0.5, ease: 'power3.out' });
      let mode = '';
      addEventListener('mousemove', (e) => {
        xTo(e.clientX); yTo(e.clientY);
        const t = e.target.closest ? e.target : null;
        const m = t && t.closest('[data-cursor]') ? 'view' : t && t.closest('a,button,input,select,textarea,label') ? 'link' : '';
        if (m === mode) return; mode = m;
        const s = m === 'view' ? 7.5 : m === 'link' ? 0.5 : 1;
        c.textContent = m === 'view' ? (lang() === 'sr' ? 'Pogledaj' : 'View') : '';
        c.style.fontSize = '1.6px';
        gsap.to(c, { scale: s, duration: 0.6, ease: 'expo.out' });
      });
    }
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  PJ.ready = (async () => {
    await load(LIBS[0]);
    await Promise.all(LIBS.slice(1).map(load));
    gsap.registerPlugin(ScrollTrigger, Flip);
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: 'power3.out', duration: 1 });
    return PJ;
  })();

  const start = () => {
    intro();
    applyLang();
    PJ.ready.then(() => {
      globals(); scan();
      let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 60); }).observe(document.body, { childList: true, subtree: true });
    });
  };
  document.body ? start() : addEventListener('DOMContentLoaded', start);
})();
