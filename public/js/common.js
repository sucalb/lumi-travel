/* ==========================================================
   Lumi Travel — shared site logic (header, footer, cursor,
   smooth scroll, page transitions, reveal helpers, tour cards)
   ========================================================== */
window.TS = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  const nl2br = s => esc(s).replace(/\n/g, '<br>');
  const tel = s => String(s || '').replace(/[^\d+]/g, '');
  const CAT = { china: 'Trung Quốc', asia: 'Châu Á', domestic: 'Trong nước', other: 'Khác' };

  gsap.registerPlugin(ScrollTrigger);
  if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);

  // Bản tĩnh (GitHub Pages): đọc dữ liệu từ file JSON, không có máy chủ để nhận đơn.
  const STATIC = !!window.TS_STATIC;
  let siteSettings = {};
  async function api(url, opts = {}) {
    if (STATIC) {
      if (opts.method && opts.method !== 'GET') throw Object.assign(new Error('static'), { isStatic: true });
      url = url.replace(/^api\/site$/, 'data/site.json').replace(/^api\/(tours|posts)\/(.+)$/, 'data/$1/$2.json');
    }
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
    return data;
  }

  /* ---------- Icons ---------- */
  const ICON = {
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm-2 8h14v10H5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3z"/></svg>',
    plane: '<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 2 3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4L1.5 9.6 9 8.9z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>',
  };

  /* ---------- Tour card (dùng chung) ---------- */
  function tourCard(t) {
    const off = t.oldPrice > t.price ? Math.round((1 - t.price / t.oldPrice) * 100) : 0;
    return `
    <a class="tcard" href="tour/${esc(t.slug)}" data-cursor="Xem tour" data-cat="${esc(t.category)}" data-from="${esc(t.departFrom)}">
      <div class="tcard__img">
        <img src="${esc(t.image)}" alt="${esc(t.title)}" loading="lazy" />
        ${t.tag ? `<span class="tcard__tag">${esc(t.tag)}</span>` : ''}
        ${off ? `<span class="tcard__off">-${off}%</span>` : ''}
        <span class="tcard__days">${ICON.clock}${esc(t.days)}</span>
      </div>
      <div class="tcard__body">
        <div class="tcard__meta"><span>${ICON.pin}${esc(t.destination)}</span><span class="tcard__rate">${ICON.star}${Number(t.rating || 5).toFixed(1)}</span></div>
        <h3 class="tcard__title">${esc(t.title)}</h3>
        <div class="tcard__sched">${ICON.cal}Khởi hành: <b>${esc(t.departFrom)}</b> · ${esc(t.schedule)}</div>
        <div class="tcard__foot">
          <div class="tcard__price">${t.oldPrice > t.price ? `<s>${money(t.oldPrice)}</s>` : ''}<b>${money(t.price)}</b></div>
          <span class="tcard__btn">Đặt tour ${ICON.arrow}</span>
        </div>
      </div>
    </a>`;
  }

  /* ---------- Header & footer ---------- */
  function renderChrome(settings, opts = {}) {
    const s = settings;
    // Logo chữ lấy theo tên thương hiệu trong Cài đặt: từ đầu in đậm, phần còn lại in nhỏ
    const [bMain = '', ...bRest] = String(s.brand || '').trim().split(/\s+/);
    const brandText = `<span class="brand__text"><b>${esc(bMain.toUpperCase())}</b><small>${esc(bRest.join(' ').toUpperCase())}</small></span>`;
    $$('.pt__brand').forEach(el => { el.innerHTML = `${esc(bMain.toUpperCase())} <span>${esc(bRest.join(' ').toUpperCase())}</span>`; });
    // Không có hotline (bản demo) → nút liên hệ trỏ về form tư vấn
    const callBtn = s.hotline
      ? `<a href="tel:${tel(s.hotline)}" class="header__call" data-magnetic><span class="ring-icon">${ICON.phone}</span><span>${esc(s.hotline)}</span></a>`
      : `<a href="./#contact" class="header__call" data-magnetic><span class="ring-icon ring-icon--still">${ICON.mail}</span><span>Nhận tư vấn</span></a>`;
    const hdr = $('#siteHeader');
    if (hdr) {
      hdr.className = 'header' + (opts.solid ? ' header--solid is-scrolled' : '');
      hdr.innerHTML = `
        <a href="./" class="brand" aria-label="${esc(s.brand)}">
          <img src="assets/logo.svg" alt="" class="brand__mark" />
          ${brandText}
        </a>
        <nav class="nav" id="nav">
          <a href="tours?cat=china" data-magnetic>Tour Trung Quốc</a>
          <a href="tours?cat=asia" data-magnetic>Châu Á</a>
          <a href="tours?cat=domestic" data-magnetic>Trong nước</a>
          <a href="./#visa" data-magnetic>Visa</a>
          <a href="./#blog" data-magnetic>Cẩm nang</a>
          <a href="./#contact" data-magnetic>Liên hệ</a>
        </nav>
        ${callBtn}
        <button class="burger" id="burger" aria-label="Mở menu"><i></i><i></i></button>`;
      $('#burger').addEventListener('click', () => document.documentElement.classList.toggle('nav-open'));
      $$('.nav a', hdr).forEach(a => { if (a.href === location.href) a.classList.add('is-active'); });
    }
    const ftr = $('#siteFooter');
    if (ftr) {
      ftr.innerHTML = `
      <div class="container footer__news">
        <div><h3>Nhận ưu đãi tour Trung Quốc mới nhất</h3><p>Deal giảm đến 40% được gửi đến bạn mỗi tuần.</p></div>
        ${STATIC ? ((s.zalo || s.hotline) ? `<a class="btn btn--gold" href="https://zalo.me/${tel(s.zalo || s.hotline)}" target="_blank" rel="noopener" data-magnetic>Nhắn Zalo nhận ưu đãi</a>` : '<a class="btn btn--gold" href="./#contact" data-magnetic>Nhận tư vấn</a>') : '<form class="news-form" id="newsForm"><input type="email" name="email" placeholder="Email của bạn" required /><button class="btn btn--gold" data-magnetic>Đăng ký</button></form>'}
      </div>
      <div class="container footer__grid">
        <div class="footer__brand">
          <a href="./" class="brand brand--light"><img src="assets/logo.svg" alt="" class="brand__mark" />${brandText}</a>
          <p><b>${esc(s.companyName)}</b><br/>${esc(s.slogan)}</p>
          ${s.license ? `<p class="footer__license">${nl2br(s.license)}</p>` : ''}
        </div>
        <div><h4>Tour Trung Quốc</h4>
          ${['Trương Gia Giới', 'Phượng Hoàng Cổ Trấn', 'Bắc Kinh - Thượng Hải', 'Lệ Giang', 'Cửu Trại Câu', 'Trùng Khánh'].map(d => `<a href="tours?dest=${encodeURIComponent(d)}">${d}</a>`).join('')}
        </div>
        <div><h4>Dịch vụ</h4>
          <a href="tours?cat=asia">Tour Châu Á</a><a href="tours?cat=domestic">Tour trong nước</a><a href="./#visa">Visa Trung Quốc</a><a href="./#blog">Cẩm nang du lịch</a><a href="./#contact">Thiết kế tour riêng</a>
        </div>
        <div class="footer__contact"><h4>Liên hệ</h4>
          ${s.hotline ? `<a href="tel:${tel(s.hotline)}" class="footer__hot">${ICON.phone}<span>${esc(s.hotline)}<small>${esc(s.hotlineName)}</small></span></a>` : ''}
          ${(s.addresses || []).map(a => `<p class="footer__addr">${ICON.pin}<span><b>${esc(a.label)}:</b> ${esc(a.text)}</span></p>`).join('')}
          ${s.email ? `<a href="mailto:${esc(s.email)}" class="footer__addr">${ICON.mail}<span>${esc(s.email)}</span></a>` : ''}
        </div>
      </div>
      <div class="footer__big" aria-hidden="true"><span>${esc(bMain.toUpperCase())}</span></div>
      <div class="container footer__bottom">
        <span>© ${new Date().getFullYear()} ${esc(s.brand)}. All rights reserved.</span>
        ${s.reportPhone ? `<span>Phản ánh chất lượng dịch vụ: <a href="tel:${tel(s.reportPhone)}">${esc(s.reportPhone)}</a></span>` : ''}
        <a href="#top" class="to-top" data-magnetic>Lên đầu trang ↑</a>
      </div>`;
      if (!STATIC) $('#newsForm').addEventListener('submit', async e => {
        e.preventDefault();
        try { await api('api/subscribe', { method: 'POST', body: { email: e.target.email.value } }); e.target.reset(); toast('Đăng ký thành công! Ưu đãi sẽ sớm đến hộp thư của bạn.'); }
        catch (err) { toast(err.message, true); }
      });
      if (!reduce) gsap.to('.footer__big span', { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: '.footer__big', start: 'top 95%', end: 'bottom 75%', scrub: true } });
      else gsap.set('.footer__big span', { clipPath: 'inset(0 0% 0 0)' });
    }
    // Floating buttons
    const fab = $('#fab');
    if (fab) {
      fab.innerHTML = `
        ${s.zalo ? `<a href="https://zalo.me/${tel(s.zalo)}" target="_blank" rel="noopener" class="fab fab--zalo" aria-label="Chat Zalo">Zalo</a>` : ''}
        ${s.hotline
          ? `<a href="tel:${tel(s.hotline)}" class="fab" aria-label="Gọi ${esc(s.hotline)}"><span class="fab__pulse"></span><span class="fab__pulse d2"></span>${ICON.phone}</a>`
          : `<a href="./#contact" class="fab" aria-label="Nhận tư vấn"><span class="fab__pulse"></span><span class="fab__pulse d2"></span>${ICON.mail}</a>`}`;
      gsap.from('#fab .fab', { scale: 0, duration: .7, ease: 'back.out(2)', stagger: .1, delay: 1 });
    }
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  function initScroll() {
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const header = $('#siteHeader');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        if (header && !header.classList.contains('header--solid')) header.classList.toggle('is-scrolled', y > 60);
        header && header.classList.toggle('is-hidden', self.direction === 1 && y > 600 && !document.documentElement.classList.contains('nav-open'));
        gsap.set('.progress i', { scaleX: self.progress });
        gsap.set('.progress__plane', { x: self.progress * (innerWidth - 16) });
      },
    });
    // anchor links on same page
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      const url = new URL(a.href, location.href);
      const samePage = href.startsWith('#') || (url.pathname === location.pathname && url.search === location.search);
      if (url.hash && samePage) {
        const target = url.hash === '#top' ? document.body : $(url.hash);
        if (!target) return;
        e.preventDefault();
        document.documentElement.classList.remove('nav-open');
        scrollTo(target);
        return;
      }
      // page transition for internal navigation
      if (url.origin === location.origin && !a.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:') && !url.pathname.includes('/admin')) {
        e.preventDefault();
        leave(url.href);
      }
    });
  }
  function scrollTo(target, offset = -80) {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.5 });
    else (target === document.body ? window.scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* ---------- Page transitions ---------- */
  function leave(href) {
    if (reduce) { location.href = href; return; }
    try { sessionStorage.setItem('ts-pt', '1'); } catch {}
    const pt = $('.pt');
    gsap.timeline({ onComplete: () => { location.href = href; } })
      .set(pt, { visibility: 'visible' })
      .fromTo('.pt__layer', { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: .55, ease: 'power3.inOut', stagger: .08 })
      .fromTo('.pt__plane', { x: '-20vw', y: '20vh', rotate: -15, opacity: 1 }, { x: '120vw', y: '-30vh', rotate: -15, duration: .9, ease: 'power2.in' }, .1)
      .fromTo('.pt__brand', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .3 }, .35);
  }
  function enter() {
    const pt = $('.pt');
    if (!pt) return;
    let flagged = false;
    try { flagged = sessionStorage.getItem('ts-pt') === '1'; sessionStorage.removeItem('ts-pt'); } catch {}
    if (!flagged || reduce) { gsap.set(pt, { visibility: 'hidden' }); document.documentElement.classList.remove('pt-in'); return; }
    gsap.timeline({ onComplete: () => { gsap.set(pt, { visibility: 'hidden' }); document.documentElement.classList.remove('pt-in'); } })
      .set('.pt__layer', { scaleY: 1 })
      .to('.pt__brand', { opacity: 0, duration: .2 })
      .to('.pt__layer', { scaleY: 0, transformOrigin: 'top', duration: .7, ease: 'power3.inOut', stagger: { each: .08, from: 'end' } });
  }
  addEventListener('pageshow', e => { if (e.persisted) { gsap.set('.pt', { visibility: 'hidden' }); document.documentElement.classList.remove('pt-in'); } });

  /* ---------- Plane cursor ---------- */
  function initCursor() {
    if (!finePointer || reduce) return;
    document.documentElement.classList.add('has-plane-cursor');
    const wrap = document.createElement('div');
    wrap.className = 'pcursor';
    wrap.innerHTML = `
      <canvas class="pcursor__trail"></canvas>
      <div class="pcursor__plane"><div class="pcursor__ring"></div>
        <svg viewBox="0 0 32 32"><path class="pc-body" d="M30 15.2 19.4 14 12.6 3.4c-.2-.3-.5-.4-.8-.4h-1.6l3.8 10.7-6.6-.5-2.8-3.4H2.5l1.7 6.2-1.7 6.2h2.1l2.8-3.4 6.6-.5-3.8 10.7h1.6c.3 0 .6-.2.8-.4L19.4 18 30 16.8a.8.8 0 0 0 0-1.6z"/></svg>
      </div>
      <div class="pcursor__label"></div>`;
    document.body.appendChild(wrap);
    const plane = $('.pcursor__plane', wrap), label = $('.pcursor__label', wrap), canvas = $('canvas', wrap);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 }, pos = { x: mouse.x, y: mouse.y };
    let angle = 0, visible = false, hovering = false;
    const trail = [];
    addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!visible) { visible = true; pos.x = mouse.x; pos.y = mouse.y; wrap.classList.add('is-on'); }
    });
    document.addEventListener('mouseleave', () => { visible = false; wrap.classList.remove('is-on'); });
    document.addEventListener('mouseover', e => {
      const t = e.target;
      const text = t.closest('input:not([type=checkbox]):not([type=radio]):not([type=submit]), textarea, select, [contenteditable]');
      wrap.classList.toggle('is-text', !!text);
      wrap.classList.toggle('is-dark', !!t.closest('.hero, .hot, .visa, .contact, .footer, .page-hero, .lightbox, .book__total, .article__cta, .header:not(.is-scrolled)') && !t.closest('.search, .form, .tcard, .header.is-scrolled'));
      const view = t.closest('[data-cursor]');
      hovering = !!t.closest('a, button, label, [role=button], [data-cursor]');
      wrap.classList.toggle('is-hover', hovering);
      wrap.classList.toggle('is-view', !!view);
      if (view) label.textContent = view.dataset.cursor;
    });
    addEventListener('mousedown', () => {
      wrap.classList.add('is-down');
      gsap.fromTo(plane.querySelector('svg'), { scale: 1 }, { scale: .7, duration: .12, yoyo: true, repeat: 1 });
      // small burst of puffs
      for (let i = 0; i < 6; i++) trail.push({ x: pos.x, y: pos.y, t: performance.now(), puff: true, a: Math.random() * Math.PI * 2, v: 1 + Math.random() * 2 });
    });
    addEventListener('mouseup', () => wrap.classList.remove('is-down'));

    gsap.ticker.add(() => {
      const dx = mouse.x - pos.x, dy = mouse.y - pos.y;
      pos.x += dx * 0.2; pos.y += dy * 0.2;
      const speed = Math.hypot(dx, dy);
      if (speed > 1.2) {
        const target = Math.atan2(dy, dx) * 180 / Math.PI;
        let diff = ((target - angle + 540) % 360) - 180;
        angle += diff * 0.18;
      }
      const bank = gsap.utils.clamp(-25, 25, dx * 0.6);
      plane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${angle}deg) rotateX(${bank}deg)`;
      label.style.transform = `translate3d(${pos.x + 22}px, ${pos.y + 18}px, 0)`;

      const now = performance.now();
      if (visible && speed > 0.6) trail.push({ x: pos.x - Math.cos(angle * Math.PI / 180) * 12, y: pos.y - Math.sin(angle * Math.PI / 180) * 12, t: now });
      while (trail.length && now - trail[0].t > 700) trail.shift();
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      // contrail
      ctx.lineCap = 'round';
      const pts = trail.filter(p => !p.puff);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i], q = pts[i - 1];
        const life = 1 - (now - p.t) / 700;
        ctx.strokeStyle = `rgba(47,107,255,${life * 0.45})`;
        ctx.lineWidth = 1 + life * 2.5;
        ctx.setLineDash(i % 2 ? [] : [2, 4]);
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      trail.filter(p => p.puff).forEach(p => {
        const age = (now - p.t) / 700;
        ctx.fillStyle = `rgba(244,182,62,${(1 - age) * .6})`;
        ctx.beginPath(); ctx.arc(p.x + Math.cos(p.a) * age * 30 * p.v, p.y + Math.sin(p.a) * age * 30 * p.v, 3 * (1 - age) + 1, 0, Math.PI * 2); ctx.fill();
      });
    });
  }

  /* ---------- Micro interactions ---------- */
  function initMagnetic(root = document) {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]', root).forEach(el => {
      if (el._mag) return; el._mag = true;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }
  function initTilt(root = document, sel = '.tilt', max = 10) {
    if (!finePointer || reduce) return;
    $$(sel, root).forEach(el => {
      if (el._tilt) return; el._tilt = true;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        gsap.to(el, { rotateY: (px - .5) * max, rotateX: (.5 - py) * max, transformPerspective: 1000, duration: .6, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, .5)' }));
    });
  }

  /* ---------- Split + reveal ---------- */
  function splitWords(el) {
    if (el._split) return $$('.word', el);
    el._split = true;
    const wrapStyle = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em;margin-bottom:-.12em';
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.style.cssText = wrapStyle;
          const i = document.createElement('span'); i.className = 'word'; i.style.display = 'inline-block'; i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
      } else if (node.nodeName === 'BR') { frag.appendChild(node.cloneNode()); }
      else {
        const w = document.createElement('span'); w.style.cssText = wrapStyle;
        const c = node.cloneNode(true); c.classList.add('word'); c.style.display = 'inline-block';
        w.appendChild(c); frag.appendChild(w);
      }
    });
    el.innerHTML = ''; el.appendChild(frag);
    return $$('.word', el);
  }
  function reveal(root = document) {
    if (reduce) return;
    $$('[data-reveal]', root).forEach(el => {
      if (el._rv) return; el._rv = true;
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    $$('[data-reveal-words]', root).forEach(el => {
      if (el._rv) return; el._rv = true;
      gsap.from(splitWords(el), { yPercent: 110, rotate: 3, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-stagger]', root).forEach(el => {
      if (el._rv) return; el._rv = true;
      gsap.from(el.children, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-clip]', root).forEach(el => {
      if (el._rv) return; el._rv = true;
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  }
  function counters(root = document) {
    $$('.counter', root).forEach(el => {
      const to = parseFloat(el.dataset.to), dec = String(el.dataset.to).includes('.') ? 1 : 0, o = { v: 0 };
      const fmt = v => dec ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('vi-VN');
      if (reduce) { el.textContent = fmt(to); return; }
      gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => { el.textContent = fmt(o.v); } });
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg, isError) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.toggle('is-error', !!isError);
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 4500);
  }

  /* ---------- Lead form helper ---------- */
  function bindLeadForm(form, extra = () => ({})) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      ['name', 'phone'].forEach(n => {
        const input = form.elements[n]; if (!input) return;
        const field = input.closest('.field');
        field && field.classList.remove('is-error'); void (field && field.offsetWidth);
        const bad = !input.value.trim() || (n === 'phone' && !/^[0-9 +().-]{8,20}$/.test(input.value.trim()));
        if (bad) { field && field.classList.add('is-error'); ok = false; }
      });
      if (!ok) return toast('Vui lòng nhập họ tên và số điện thoại hợp lệ.', true);
      const btn = form.querySelector('button[type=submit]');
      if (STATIC) return staticLead(form, extra(), btn);
      btn.disabled = true; btn.classList.add('is-loading');
      try {
        const data = Object.fromEntries(new FormData(form));
        await api('api/bookings', { method: 'POST', body: { ...data, ...extra() } });
        btn.classList.remove('is-loading'); btn.classList.add('is-sent');
        toast(`Cảm ơn ${data.name.trim()}! ${siteSettings.brand || 'Chúng tôi'} sẽ gọi lại cho bạn trong 15 phút.`);
        setTimeout(() => { form.reset(); btn.classList.remove('is-sent'); btn.disabled = false; form.dispatchEvent(new Event('reset-done')); }, 2600);
      } catch (err) {
        btn.disabled = false; btn.classList.remove('is-loading');
        toast(err.message, true);
      }
    });
  }

  // Bản tĩnh: gom thông tin thành tin nhắn, sao chép và mở Zalo để khách gửi cho Lumi Travel.
  function staticLead(form, extra, btn) {
    const d = Object.fromEntries(new FormData(form));
    const lines = ['Xin chào Lumi Travel, tôi muốn được tư vấn:', `- Họ tên: ${d.name}`, `- SĐT: ${d.phone}`];
    if (extra.tourTitle || d.tourTitle) lines.push(`- Tour: ${extra.tourTitle || d.tourTitle}`);
    if (d.date) lines.push(`- Ngày đi: ${d.date}`);
    if (d.adults) lines.push(`- Số khách: ${d.adults} người lớn, ${d.children || 0} trẻ em`);
    if (d.note) lines.push(`- Ghi chú: ${d.note}`);
    const zalo = tel(siteSettings.zalo || siteSettings.hotline);
    btn.classList.add('is-sent');
    if (!zalo) { toast('Đây là bản demo — form sẽ gửi đơn về trang quản trị khi chạy bản đầy đủ.'); setTimeout(() => btn.classList.remove('is-sent'), 2600); return; }
    window.open('https://zalo.me/' + zalo, '_blank', 'noopener');
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    toast('Đã sao chép thông tin — dán vào Zalo để gửi cho ' + siteSettings.brand + (siteSettings.hotline ? ', hoặc gọi ' + siteSettings.hotline : ''));
    setTimeout(() => btn.classList.remove('is-sent'), 2600);
  }

  /* ---------- Boot shared bits ---------- */
  function boot(settings, opts = {}) {
    siteSettings = settings;
    renderChrome(settings, opts);
    initScroll();
    initCursor();
    initMagnetic();
    enter();
    addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return { STATIC, $, $$, esc, money, nl2br, tel, api, ICON, CAT, tourCard, boot, reveal, counters, splitWords, initMagnetic, initTilt, toast, bindLeadForm, scrollTo, reduce, finePointer, get lenis() { return lenis; } };
})();
