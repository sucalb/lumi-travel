/* ==========================================================
   Lumi Travel — Home page
   ========================================================== */
(async () => {
  const { $, $$, esc, money, tel, api, ICON, tourCard, reduce, finePointer } = TS;

  /* ---------- Preloader (chỉ lần đầu trong phiên) ---------- */
  let firstVisit = true;
  try { firstVisit = !sessionStorage.getItem('ts-visited') && !document.documentElement.classList.contains('pt-in'); sessionStorage.setItem('ts-visited', '1'); } catch {}
  const pre = $('#preloader');
  let preDone;
  if (!firstVisit || reduce) { pre.remove(); preDone = Promise.resolve(); }
  else {
    document.body.classList.add('is-loading');
    const c = { v: 0 };
    const tl = gsap.timeline();
    tl.to('.pl-ring', { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' })
      .to('.pl-fin', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, .3)
      .to('.pl-fin', { fillOpacity: 1, duration: .4 }, 1.1)
      .to('.pl-wave', { strokeDashoffset: 0, duration: .6, ease: 'power2.out' }, 1)
      .to(c, { v: 90, duration: 1.5, ease: 'power1.inOut', onUpdate: () => { $('#plCount').textContent = Math.round(c.v); } }, 0)
      .to('#plBar', { width: '90%', duration: 1.5, ease: 'power1.inOut' }, 0);
    preDone = new Promise(r => tl.eventCallback('onComplete', r)).then(() => new Promise(r => {
      gsap.timeline({ onComplete: () => { pre.remove(); r(); } })
        .to(c, { v: 100, duration: .3, onUpdate: () => { $('#plCount').textContent = Math.round(c.v); } })
        .to('#plBar', { width: '100%', duration: .3 }, '<')
        .to('.preloader__inner', { y: -40, opacity: 0, duration: .45, ease: 'power3.in' })
        .to('.preloader__curtain', { scaleY: 1, duration: .55, ease: 'power3.inOut' }, '-=.15')
        .to(pre, { yPercent: -100, duration: .85, ease: 'expo.inOut' })
        .call(() => document.body.classList.remove('is-loading'), null, '-=.6')
        .call(r, null, '-=.55');
    }));
  }

  /* ---------- Data ---------- */
  let site;
  try { site = await api('api/site'); }
  catch (e) { document.body.classList.remove('is-loading'); pre && pre.remove(); TS.toast('Không tải được dữ liệu. Vui lòng tải lại trang.', true); return; }
  const { settings: s, tours, destinations, posts, reviews } = site;

  /* ---------- Render ---------- */
  // Hero
  const slides = (s.heroImages && s.heroImages.length ? s.heroImages : [tours[0]?.image]).filter(Boolean);
  $('#heroSlides').innerHTML = slides.map((src, i) => `<div class="hero__slide${i ? '' : ' is-active'}" style="background-image:url('${esc(src)}')"></div>`).join('');
  const title = String(s.heroTitle || 'Bạn đang muốn đi đâu?');
  const cut = title.lastIndexOf(' ', title.lastIndexOf(' ') - 1);
  $('#heroTitle').innerHTML = cut > 0 ? `${esc(title.slice(0, cut))} <em class="script">${esc(title.slice(cut + 1))}</em>` : esc(title);
  $('#heroSub').textContent = s.heroSubtitle || '';
  const destNames = [...new Set(tours.map(t => t.destination).filter(Boolean))];
  const fromNames = [...new Set(tours.map(t => t.departFrom).filter(Boolean))];
  $('#searchDest').insertAdjacentHTML('beforeend', destNames.map(d => `<option>${esc(d)}</option>`).join(''));
  $('#searchFrom').insertAdjacentHTML('beforeend', fromNames.map(d => `<option>${esc(d)}</option>`).join(''));
  $('#heroChips').innerHTML = '<span>Phổ biến:</span>' + destNames.slice(0, 5).map(d => `<a href="tours?dest=${encodeURIComponent(d)}">${esc(d)}</a>`).join('');

  // Marquee
  const mqHtml = destinations.map(d => `<span>${esc(d.name)}</span><i>✦</i>`).join('');
  $('#marquee').innerHTML = mqHtml + mqHtml;

  // Destinations rail
  const rail = $('#destRail');
  const renderDest = region => {
    const list = destinations.filter(d => d.region === region);
    rail.innerHTML = list.map(d => {
      const key = d.name.toLowerCase();
      const count = tours.filter(t => t.destination === d.name || t.title.toLowerCase().includes(key)).length;
      return `<a class="dcard" href="tours?dest=${encodeURIComponent(d.name)}" data-cursor="Xem tour">
        <img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" draggable="false" />
        <div class="dcard__cap"><b>${esc(d.name)}</b><span>${count ? count + ' tour' : 'Tour theo yêu cầu'}</span></div>
      </a>`;
    }).join('');
    rail.scrollLeft = 0;
    if (!reduce) gsap.from($$('.dcard', rail), { x: 120, opacity: 0, rotateY: -25, duration: 1, ease: 'expo.out', stagger: .06 });
    updateDestBar();
  };

  // Hot (featured china)
  const featured = tours.filter(t => t.featured && t.category === 'china');
  const hotList = featured.length >= 3 ? featured : tours.filter(t => t.category === 'china').slice(0, 6);
  $('#hotTrack').innerHTML = hotList.map(t => `
    <a class="hcard" href="tour/${esc(t.slug)}" data-cursor="Chi tiết">
      <div class="hcard__img"><img src="${esc(t.image)}" alt="${esc(t.title)}" loading="lazy" /></div>
      ${t.tag ? `<span class="hcard__tag">${esc(t.tag)}</span>` : ''}
      <span class="hcard__days">${esc(t.days)}</span>
      <div class="hcard__body">
        <div class="hcard__place">${ICON.pin}${esc(t.destination)} · từ ${esc(t.departFrom)}</div>
        <h3 class="hcard__name">${esc(t.title)}</h3>
        <div class="hcard__foot">
          <div class="hcard__price">${t.oldPrice > t.price ? `<small>${money(t.oldPrice)}</small>` : ''}<b>${money(t.price)}</b></div>
          <div class="hcard__rate">★ ${Number(t.rating).toFixed(1)}</div>
        </div>
        <span class="hcard__cta">Xem lịch trình <span>→</span></span>
      </div>
    </a>`).join('') + `
    <div class="hcard hcard--end">
      <h3>Chưa thấy tour ưng ý?</h3>
      <p>Hơn 35 tuyến Trung Quốc đang chờ bạn. Chúng tôi thiết kế lịch trình riêng theo yêu cầu.</p>
      <a href="#contact" class="btn btn--gold" data-magnetic>Thiết kế tour riêng</a>
    </div>`;

  // Popular grid
  $('#fromTabs').insertAdjacentHTML('afterbegin', '');
  const fromTabs = $('#fromTabs');
  fromNames.slice(0, 3).forEach(f => fromTabs.querySelector('.tabs__pill').insertAdjacentHTML('beforebegin', `<button class="tab" data-from="${esc(f)}">Từ ${esc(f.replace('TP. ', ''))}</button>`));
  const grid = $('#popularGrid');
  const renderPopular = from => {
    const list = tours.filter(t => !from || t.departFrom === from).slice(0, 8);
    grid.innerHTML = list.map(tourCard).join('');
    TS.initTilt(grid, '.tcard', 6);
  };
  renderPopular('');

  // About & stats
  $('#aboutText').textContent = s.aboutText || '';
  $('#stats').innerHTML = (s.stats || []).map(x => `<div class="stat"><b><span class="counter" data-to="${x.value}">0</span>${esc(x.suffix)}</b><small>${esc(x.label)}</small></div>`).join('');
  $('#visaText').textContent = s.visaText || '';

  // Blog
  $('#blogGrid').innerHTML = posts.slice(0, 4).map((p, i) => `
    <a class="post${i === 0 ? ' post--big' : ''}" href="cam-nang/${esc(p.slug)}" data-cursor="Đọc">
      <div class="post__img"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></div>
      <div class="post__body"><small>${new Date(p.createdAt).toLocaleDateString('vi-VN')}</small><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><span class="link-arrow">Đọc tiếp <span>→</span></span></div>
    </a>`).join('');

  // Reviews
  const reviewHTML = r => `<figure class="review"><div class="review__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><p>“${esc(r.text)}”</p>
    <figcaption class="review__who"><span class="review__av">${esc((r.name.split(' ').pop() || '?')[0])}</span><span><b>${esc(r.name)}</b><small>${esc(r.trip)}</small></span></figcaption></figure>`;
  const rows = $$('.reviews__row');
  const half = Math.ceil(reviews.length / 2);
  [reviews.slice(0, half), reviews.slice(half)].forEach((list, i) => { const h = list.map(reviewHTML).join(''); rows[i].innerHTML = h + h + h; });

  // Contact
  if (s.hotline) {
    $('#hotline').href = 'tel:' + tel(s.hotline);
    $('#hotline').innerHTML = `<span class="hotline__icon">${ICON.phone}</span><span><small>Hotline${s.hotlineName ? ` (${esc(s.hotlineName)})` : ''}</small><b>${esc(s.hotline)}</b></span>`;
  } else $('#hotline').remove();
  $('#addrList').innerHTML = (s.addresses || []).map(a => `<li data-reveal>${ICON.pin}<span><small>${esc(a.label)}</small>${esc(a.text)}</span></li>`).join('');
  $('#formTour').insertAdjacentHTML('beforeend', tours.map(t => `<option>${esc(t.title)}</option>`).join(''));
  TS.bindLeadForm($('#contactForm'), () => ({ source: 'Trang chủ' }));

  /* ---------- Boot shared ---------- */
  TS.boot(s);

  /* ---------- Tabs (pill indicator) ---------- */
  function bindTabs(wrap, onChange) {
    const pill = $('.tabs__pill', wrap);
    const move = btn => { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft - 6}px)`; };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b || b.classList.contains('is-active')) return;
      $$('.tab', wrap).forEach(x => x.classList.toggle('is-active', x === b));
      move(b); onChange(b);
    });
    requestAnimationFrame(() => move($('.tab.is-active', wrap)));
    addEventListener('resize', () => move($('.tab.is-active', wrap)));
  }
  bindTabs($('#destTabs'), b => renderDest(b.dataset.region));
  bindTabs(fromTabs, b => {
    if (reduce) return renderPopular(b.dataset.from);
    gsap.to($$('.tcard', grid), { y: 30, opacity: 0, duration: .3, stagger: .02, ease: 'power2.in', onComplete: () => {
      renderPopular(b.dataset.from);
      gsap.from($$('.tcard', grid), { y: 60, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out' });
      ScrollTrigger.refresh();
    } });
  });

  /* ---------- Destination rail: drag + buttons ---------- */
  function updateDestBar() {
    const max = rail.scrollWidth - rail.clientWidth;
    $('#destBar').style.transform = `scaleX(${max > 0 ? Math.max(.08, rail.scrollLeft / max) : 1})`;
  }
  rail.addEventListener('scroll', updateDestBar, { passive: true });
  $('#destPrev').addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * .7, behavior: 'smooth' }));
  $('#destNext').addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * .7, behavior: 'smooth' }));
  if (finePointer) {
    let down = false, startX = 0, startL = 0, moved = false;
    rail.addEventListener('pointerdown', e => { down = true; moved = false; startX = e.clientX; startL = rail.scrollLeft; rail.classList.add('is-drag'); });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('is-drag'); });
    addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - startX; if (Math.abs(d) > 5) moved = true; rail.scrollLeft = startL - d; });
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  renderDest('china');

  /* ---------- Hero slideshow ---------- */
  const slideEls = $$('.hero__slide');
  const dotsWrap = $('#heroDots');
  dotsWrap.innerHTML = slideEls.map((_, i) => `<button aria-label="Ảnh ${i + 1}"${i ? '' : ' class="is-active"'}><i></i></button>`).join('');
  const dots = $$('button', dotsWrap);
  let cur = 0, timer;
  function goSlide(n) {
    slideEls[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
    cur = (n + slideEls.length) % slideEls.length;
    void slideEls[cur].offsetWidth;
    slideEls[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
    clearTimeout(timer); timer = setTimeout(() => goSlide(cur + 1), 6000);
  }
  dots.forEach((d, i) => d.addEventListener('click', () => i !== cur && goSlide(i)));
  if (slideEls.length > 1) timer = setTimeout(() => goSlide(1), 6000);

  /* ---------- Static fallback ---------- */
  TS.counters();
  if (reduce) { $$('.step').forEach(s => s.classList.add('is-on')); return; }

  /* ---------- Animations ---------- */
  await preDone;
  const heroWords = TS.splitWords($('#heroTitle'));
  gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
    .from('.header', { y: -40, opacity: 0, duration: 1, ease: 'expo.out', clearProps: 'all' }, 0)
    .from('.hero__slides', { scale: 1.25, duration: 2.2, ease: 'expo.out' }, 0)
    .from('.hero__kicker', { y: 30, opacity: 0, duration: .8, ease: 'power3.out' }, .1)
    .from(heroWords, { yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .07 }, .15)
    .from('.hero__sub', { y: 30, opacity: 0, duration: .9, ease: 'power3.out' }, .55)
    .from('.search', { y: 50, opacity: 0, scale: .96, duration: 1, ease: 'expo.out' }, .7)
    .from('.search > *', { y: 20, opacity: 0, duration: .6, stagger: .07, ease: 'power3.out' }, .85)
    .from('.hero__chips > *', { y: 14, opacity: 0, duration: .5, stagger: .05, ease: 'power2.out' }, 1.1)
    .from('.lantern', { y: -300, opacity: 0, duration: 1.8, ease: 'elastic.out(1, .5)', stagger: .2 }, .3)
    .from('.hero__meta, .scroll-cue', { opacity: 0, y: 20, duration: .8 }, 1)
    .from('.hero__flight path', { opacity: 0, duration: 1.5 }, .6)
    .from('.usp__item', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1 }, .9)
    .call(startHeroPlane, null, .8);

  function startHeroPlane() {
    gsap.set('.hero__plane', { opacity: 1 });
    gsap.timeline({ repeat: -1, repeatDelay: 1.5 })
      .fromTo('.hero__plane', { opacity: 0 }, { opacity: 1, duration: .6 }, 0)
      .to('.hero__plane', { duration: 10, ease: 'power1.inOut', motionPath: { path: '#flightPath', align: '#flightPath', alignOrigin: [.5, .5], autoRotate: true } }, 0)
      .to('.hero__plane', { opacity: 0, duration: .6 }, 9.4);
  }

  // Hero scroll-out
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__content', { y: -120, opacity: 0, ease: 'none' }, 0)
    .to('.hero__slides', { scale: 1.12, yPercent: 12, ease: 'none' }, 0)
    .to('.lantern.l1', { y: -200, ease: 'none' }, 0)
    .to('.lantern.l2', { y: -120, ease: 'none' }, 0);
  if (finePointer) {
    const lx = gsap.quickTo('.lantern', 'x', { duration: 1.4 }), cx = gsap.quickTo('.clouds', 'x', { duration: 1.5 });
    $('.hero').addEventListener('mousemove', e => { const p = e.clientX / innerWidth - .5; lx(p * -50); cx(p * 40); });
  }

  // Marquee with scroll velocity
  const mqTween = gsap.to('#marquee', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  let boost = 1;
  ScrollTrigger.create({ onUpdate: self => { boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 250) || 1; } });
  gsap.ticker.add(() => { boost += (Math.sign(boost) - boost) * .05; mqTween.timeScale(boost); });

  // USP tilt + reveal everything else
  TS.initTilt(document, '.usp__item', 8);
  TS.reveal();
  TS.initMagnetic();
  gsap.from('#popularGrid .tcard', { y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '#popularGrid', start: 'top 85%' } });

  // About
  gsap.fromTo('.about__frame', { clipPath: 'inset(12% 30% 12% 30% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.about__frame', start: 'top 80%' } });
  gsap.fromTo('.about__frame img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__frame', start: 'top bottom', end: 'center 55%', scrub: true } });
  gsap.from('.about__badge', { scale: 0, rotate: -20, duration: 1, ease: 'back.out(1.8)', delay: .4, scrollTrigger: { trigger: '.about__frame', start: 'top 70%' } });
  gsap.from('.stat', { y: 40, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '#stats', start: 'top 90%' } });

  // Visa
  gsap.from('.visa-big, .visa-card', { y: 60, opacity: 0, rotateY: -50, transformPerspective: 800, duration: 1, ease: 'expo.out', stagger: .07,
    scrollTrigger: { trigger: '.visa__main', start: 'top 82%' }, onComplete() { gsap.set('.visa-big, .visa-card', { clearProps: 'transform' }); } });
  gsap.to('.globe', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.visa', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Blog
  gsap.from('.post', { y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '#blogGrid', start: 'top 85%' } });

  // Reviews marquee
  rows.forEach(row => {
    const dir = +row.dataset.dir;
    const tw = gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -33.333 }, { xPercent: dir > 0 ? -33.333 : 0, duration: 45, ease: 'none', repeat: -1 });
    row.addEventListener('mouseenter', () => gsap.to(tw, { timeScale: .1, duration: .6 }));
    row.addEventListener('mouseleave', () => gsap.to(tw, { timeScale: 1, duration: .6 }));
  });

  // Contact
  gsap.from('.contact .form', { y: 80, opacity: 0, rotate: 2, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.contact .form', start: 'top 85%' } });

  // Desktop pinned scenes
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('#hotTrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const h = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: '.hot', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: st => gsap.set('.hint-line i', { scaleX: st.progress }) } });
    $$('.hcard__img img', track).forEach(img => gsap.from(img, { scale: 1.4, ease: 'none', scrollTrigger: { trigger: img, containerAnimation: h, start: 'left right', end: 'left 40%', scrub: true } }));
    gsap.from('.hcard', { y: 120, opacity: 0, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.hot__viewport', start: 'top 85%' } });
    TS.initTilt(track, '.hcard', 8);

    const line = $('#journeyLine'), len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    const steps = $$('.step'), marks = [.02, .3, .6, .92];
    gsap.timeline({ scrollTrigger: { trigger: '.journey', start: 'top top', end: '+=160%', pin: '.journey__pin', scrub: 1,
      onUpdate: st => steps.forEach((x, i) => x.classList.toggle('is-on', st.progress >= marks[i])) } })
      .to(line, { strokeDashoffset: 0, ease: 'none' }, 0)
      .to('#journeyPlane', { ease: 'none', motionPath: { path: '#journeyBase', align: '#journeyBase', alignOrigin: [.5, .5], autoRotate: true } }, 0);
    return () => { gsap.set(track, { clearProps: 'x' }); steps.forEach(x => x.classList.remove('is-on')); };
  });
  mm.add('(max-width: 760px)', () => {
    gsap.from('.step', { y: 40, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.journey__steps', start: 'top 85%' } });
  });
  ScrollTrigger.refresh();
})();
