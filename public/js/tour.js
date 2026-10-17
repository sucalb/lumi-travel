/* ==========================================================
   Lumi Travel — Tour detail page
   ========================================================== */
(async () => {
  const { $, $$, esc, money, nl2br, tel, api, ICON, CAT, tourCard, reduce } = TS;
  const slug = location.pathname.split('/').filter(Boolean).pop();
  const root = $('#tourRoot');

  let data;
  try { data = await api('api/tours/' + encodeURIComponent(slug)); }
  catch (e) {
    const site = await api('api/site').catch(() => null);
    if (site) TS.boot(site.settings, { solid: true });
    root.innerHTML = `<section class="notfound"><h1>404</h1><p>Tour này không tồn tại hoặc đã ngừng mở bán.</p><a class="btn btn--gold" href="tours">Xem các tour khác</a></section>`;
    return;
  }
  const { tour: t, related, settings: s } = data;
  document.title = t.title + ' — Lumi Travel';
  const imgs = t.images.length ? t.images : ['assets/placeholder.svg'];
  const places = t.highlights.split(/\s+-\s+|,\s*/).map(x => x.trim()).filter(Boolean);
  const off = t.oldPrice > t.price ? Math.round((1 - t.price / t.oldPrice) * 100) : 0;

  root.innerHTML = `
  <section class="td-head container">
    <nav class="crumbs crumbs--dark"><a href="./">Trang chủ</a><span>/</span><a href="tours?cat=${esc(t.category)}">Tour ${esc(CAT[t.category] || '')}</a><span>/</span><b>${esc(t.destination)}</b></nav>
    <h1 class="td-title" id="tdTitle">${esc(t.title)}</h1>
    <div class="td-badges">
      ${t.code ? `<span class="badge">Mã: ${esc(t.code)}</span>` : ''}
      <span class="badge badge--gold">${ICON.star} ${Number(t.rating).toFixed(1)}/5</span>
      <span class="badge">${ICON.cal} ${esc(t.schedule)}</span>
      ${t.tag ? `<span class="badge badge--red">${esc(t.tag)}</span>` : ''}
    </div>
  </section>

  <section class="gallery container" data-count="${Math.min(imgs.length, 4)}">
    ${imgs.slice(0, 4).map((src, i) => `<button class="gallery__item g${i}" data-idx="${i}" data-cursor="Phóng to"><img src="${esc(src)}" alt="${esc(t.title)} - ảnh ${i + 1}" /></button>`).join('')}
    ${imgs.length > 1 ? `<button class="gallery__all" data-idx="0">${imgs.length} ảnh</button>` : ''}
  </section>

  <div class="td-layout container">
    <div class="td-main">
      <div class="td-facts" data-stagger>
        <div class="fact">${ICON.pin}<span><small>Khởi hành từ</small><b>${esc(t.departFrom)}</b></span></div>
        <div class="fact">${ICON.clock}<span><small>Thời gian</small><b>${esc(t.days)}</b></span></div>
        <div class="fact"><svg viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13h-6v-6H9v6z"/></svg><span><small>Khách sạn</small><b>${esc(t.hotel)}</b></span></div>
        <div class="fact">${ICON.plane}<span><small>Phương tiện</small><b>${esc(t.transport)}</b></span></div>
      </div>

      <p class="td-summary" data-reveal>${esc(t.summary)}</p>
      ${places.length ? `<div class="td-places" data-reveal><h4>Điểm tham quan</h4><div>${places.map(p => `<span>${esc(p)}</span>`).join('')}</div></div>` : ''}

      <nav class="td-tabs" id="tdTabs">
        <a href="#lich-trinh" class="is-active">Lịch trình</a><a href="#lich-khoi-hanh">Lịch & giá</a><a href="#thong-tin">Thông tin cần biết</a>${related.length ? '<a href="#tour-lien-quan">Tour liên quan</a>' : ''}
        <i class="td-tabs__ink"></i>
      </nav>

      <section class="td-sec" id="lich-trinh">
        <h2 class="td-h" data-reveal-words>Lộ trình <em class="script">chi tiết</em></h2>
        <div class="timeline" id="timeline">
          <div class="timeline__line"><i></i></div>
          ${t.itinerary.map((d, i) => `
          <article class="day${i === 0 ? ' is-open' : ''}">
            <span class="day__dot">${i + 1}</span>
            <button class="day__head"><span>${esc(d.title)}</span><i class="day__chev"></i></button>
            <div class="day__body"><div class="day__inner">${nl2br(d.content)}</div></div>
          </article>`).join('')}
        </div>
        <button class="link-btn" id="toggleAll">Mở tất cả các ngày</button>
      </section>

      <section class="td-sec" id="lich-khoi-hanh">
        <h2 class="td-h" data-reveal-words>Lịch khởi hành <em class="script">& giá</em></h2>
        <p class="muted">Giá áp dụng cho khách lẻ ghép đoàn. Trẻ em 2–11 tuổi: 75% giá người lớn.</p>
        ${t.departures.length ? `
        <div class="dep-table" data-stagger>
          <div class="dep-row dep-row--head"><span>Ngày khởi hành</span><span>Hãng / phương tiện</span><span>Chỗ trống</span><span>Giá tour</span><span></span></div>
          ${t.departures.map(d => `
          <div class="dep-row" data-date="${esc(d.date)}">
            <span class="dep-date">${ICON.cal}<b>${esc(d.date)}</b></span>
            <span>${esc(d.airline)}</span>
            <span class="dep-seats ${d.seats <= 5 ? 'is-low' : ''}"><i style="--w:${Math.min(100, d.seats / 20 * 100)}%"></i>${d.seats > 0 ? `Còn ${d.seats} chỗ` : 'Hết chỗ'}</span>
            <b class="dep-price">${money(d.price)}</b>
            <button class="btn btn--sm btn--gold dep-pick" ${d.seats > 0 ? '' : 'disabled'}>Chọn</button>
          </div>`).join('')}
        </div>` : `<p>Lịch khởi hành: <b>${esc(t.schedule)}</b>. Vui lòng liên hệ hotline để được báo ngày gần nhất.</p>`}
      </section>

      <section class="td-sec" id="thong-tin">
        <h2 class="td-h" data-reveal-words>Thông tin <em class="script">cần biết</em></h2>
        ${[['Giá tour bao gồm', t.includes, 'ok'], ['Giá tour chưa bao gồm', t.excludes, 'no'], ['Điều khoản trẻ em', t.childPolicy, 'dot'], ['Quy định & lưu ý', t.notes, 'dot']]
          .filter(([, l]) => l && l.length).map(([h, l, type], i) => `
          <div class="acc${i === 0 ? ' is-open' : ''}">
            <button class="acc__head">${esc(h)}<i class="day__chev"></i></button>
            <div class="acc__body"><ul class="ticks ticks--${type}">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          </div>`).join('')}
      </section>
    </div>

    <aside class="td-aside">
      <form class="book" id="bookForm" novalidate>
        <div class="book__price">
          ${off ? `<span class="book__off">-${off}%</span>` : ''}
          <small>Giá chỉ từ</small>
          <div>${t.oldPrice > t.price ? `<s>${money(t.oldPrice)}</s>` : ''}<b>${money(t.price)}</b><span>/khách</span></div>
        </div>
        <p class="book__note">✓ Giữ chỗ bây giờ — thanh toán sau</p>
        <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <label class="field field--select"><small>Ngày khởi hành</small>
          <select name="date" id="bookDate">
            ${t.departures.length ? t.departures.filter(d => d.seats > 0).map(d => `<option value="${esc(d.date)}" data-price="${d.price}">${esc(d.date)} — ${money(d.price)}</option>`).join('') : '<option value="">Liên hệ để chọn ngày</option>'}
          </select>
        </label>
        <div class="book__pax">
          <div class="stepper"><span><b>Người lớn</b><small>Từ 12 tuổi</small></span><div><button type="button" data-step="adults" data-d="-1">−</button><input name="adults" value="2" readonly /><button type="button" data-step="adults" data-d="1">+</button></div></div>
          <div class="stepper"><span><b>Trẻ em</b><small>2–11 tuổi</small></span><div><button type="button" data-step="children" data-d="-1">−</button><input name="children" value="0" readonly /><button type="button" data-step="children" data-d="1">+</button></div></div>
        </div>
        <div class="book__total"><span>Tạm tính</span><b id="bookTotal">0đ</b></div>
        <label class="field"><input type="text" name="name" required placeholder=" " /><span>Họ và tên</span></label>
        <label class="field"><input type="tel" name="phone" required placeholder=" " /><span>Số điện thoại</span></label>
        <label class="field"><input type="email" name="email" placeholder=" " /><span>Email (không bắt buộc)</span></label>
        <label class="field"><textarea name="note" rows="2" placeholder=" "></textarea><span>Ghi chú</span></label>
        <button type="submit" class="btn btn--gold btn--block" data-magnetic><span class="btn__text">Đặt tour ngay</span><svg class="btn__plane" viewBox="0 0 24 24"><path d="M2 21 23 12 2 3v7l15 2-15 2z"/></svg></button>
        ${s.hotline ? `<a href="tel:${tel(s.hotline)}" class="book__call">${ICON.phone}<span>Hoặc gọi <b>${esc(s.hotline)}</b> để được tư vấn</span></a>` : ''}
      </form>
    </aside>
  </div>

  ${related.length ? `
  <section class="section related" id="tour-lien-quan">
    <div class="container">
      <div class="section-head"><p class="eyebrow" data-reveal>Có thể bạn thích</p><h2 class="section-title" data-reveal-words>Tour <em class="script">liên quan</em></h2></div>
      <div class="grid-tours" data-stagger>${related.map(tourCard).join('')}</div>
    </div>
  </section>` : ''}

  <div class="mbar"><div><small>Giá từ</small><b>${money(t.price)}</b></div><a href="#bookForm" class="btn btn--gold">Đặt tour</a></div>

  <div class="lightbox" id="lightbox" aria-hidden="true">
    <button class="lightbox__close" aria-label="Đóng">✕</button>
    <button class="lightbox__nav prev" aria-label="Ảnh trước">←</button>
    <div class="lightbox__stage"><img alt="" /></div>
    <button class="lightbox__nav next" aria-label="Ảnh sau">→</button>
    <div class="lightbox__count"></div>
  </div>`;

  TS.boot(s, { solid: true });

  /* ---------- Booking ---------- */
  const form = $('#bookForm');
  const dateSel = $('#bookDate');
  let shownTotal = 0;
  function calcTotal() {
    const opt = dateSel.selectedOptions[0];
    const unit = opt && opt.dataset.price ? +opt.dataset.price : t.price;
    const a = +form.adults.value, c = +form.children.value;
    const total = unit * a + Math.round(unit * .75 / 1000) * 1000 * c;
    const o = { v: shownTotal };
    gsap.to(o, { v: total, duration: reduce ? 0 : .6, ease: 'power2.out', onUpdate: () => { $('#bookTotal').textContent = money(Math.round(o.v / 1000) * 1000); } });
    shownTotal = total;
  }
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    const input = form.elements[b.dataset.step];
    const min = b.dataset.step === 'adults' ? 1 : 0;
    input.value = Math.max(min, Math.min(30, +input.value + +b.dataset.d));
    if (!reduce) gsap.fromTo(input, { y: b.dataset.d > 0 ? 10 : -10, opacity: 0 }, { y: 0, opacity: 1, duration: .3 });
    calcTotal();
  });
  dateSel.addEventListener('change', calcTotal);
  form.addEventListener('reset-done', () => { form.adults.value = 2; form.children.value = 0; calcTotal(); });
  calcTotal();
  TS.bindLeadForm(form, () => ({ tourId: t.id, tourTitle: t.title, source: 'Trang tour' }));

  $$('.dep-pick').forEach(btn => btn.addEventListener('click', () => {
    const date = btn.closest('.dep-row').dataset.date;
    dateSel.value = date; calcTotal();
    $$('.dep-row').forEach(r => r.classList.toggle('is-picked', r.dataset.date === date));
    if (innerWidth < 1080) TS.scrollTo(form);
    if (!reduce) gsap.fromTo(form, { boxShadow: '0 0 0 0 rgba(244,182,62,.9)' }, { boxShadow: '0 0 0 14px rgba(244,182,62,0)', duration: 1, ease: 'power2.out', clearProps: 'boxShadow' });
    TS.toast(`Đã chọn ngày khởi hành ${date}`);
  }));

  /* ---------- Itinerary accordion ---------- */
  function toggle(el, open) {
    const body = el.querySelector('.day__body, .acc__body');
    const isOpen = el.classList.contains('is-open');
    open = open ?? !isOpen;
    if (open === isOpen) return;
    el.classList.toggle('is-open', open);
    if (reduce) { body.style.height = open ? 'auto' : '0px'; return; }
    gsap.fromTo(body, { height: open ? 0 : body.scrollHeight }, { height: open ? body.scrollHeight : 0, duration: .55, ease: 'power3.inOut', onComplete: () => { body.style.height = open ? 'auto' : '0px'; ScrollTrigger.refresh(); } });
    if (open) gsap.from(body.querySelectorAll('.day__inner, li'), { y: 14, opacity: 0, duration: .5, stagger: .04, delay: .1 });
  }
  $$('.day, .acc').forEach(el => {
    el.querySelector('.day__body, .acc__body').style.height = el.classList.contains('is-open') ? 'auto' : '0px';
    el.querySelector('.day__head, .acc__head').addEventListener('click', () => toggle(el));
  });
  let allOpen = false;
  $('#toggleAll').addEventListener('click', e => { allOpen = !allOpen; $$('.day').forEach(d => toggle(d, allOpen)); e.target.textContent = allOpen ? 'Thu gọn' : 'Mở tất cả các ngày'; });

  /* ---------- Sticky tabs ink ---------- */
  const tabs = $$('#tdTabs a'), ink = $('.td-tabs__ink');
  const moveInk = a => { ink.style.width = a.offsetWidth + 'px'; ink.style.transform = `translateX(${a.offsetLeft}px)`; };
  requestAnimationFrame(() => moveInk(tabs[0]));
  tabs.forEach(a => {
    const sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 40%', end: 'bottom 40%', onToggle: st => { if (st.isActive) { tabs.forEach(x => x.classList.toggle('is-active', x === a)); moveInk(a); } } });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb);
  let idx = 0;
  function show(i, dir = 1) {
    idx = (i + imgs.length) % imgs.length;
    $('.lightbox__count', lb).textContent = `${idx + 1} / ${imgs.length}`;
    if (reduce) { lbImg.src = imgs[idx]; return; }
    gsap.timeline().to(lbImg, { x: -60 * dir, opacity: 0, duration: .2, ease: 'power2.in' })
      .call(() => { lbImg.src = imgs[idx]; })
      .fromTo(lbImg, { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'expo.out' });
  }
  function openLb(i) {
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    TS.lenis && TS.lenis.stop();
    lbImg.src = imgs[i]; idx = i; show(i, 0);
    if (!reduce) gsap.fromTo(lb, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: .8, ease: 'expo.inOut' });
  }
  function closeLb() {
    const done = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); TS.lenis && TS.lenis.start(); };
    reduce ? done() : gsap.to(lb, { clipPath: 'circle(0% at 50% 50%)', duration: .6, ease: 'expo.inOut', onComplete: done });
  }
  $$('.gallery [data-idx]').forEach(b => b.addEventListener('click', () => openLb(+b.dataset.idx)));
  $('.lightbox__close', lb).addEventListener('click', closeLb);
  $('.prev', lb).addEventListener('click', () => show(idx - 1, -1));
  $('.next', lb).addEventListener('click', () => show(idx + 1, 1));
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(idx - 1, -1);
    if (e.key === 'ArrowRight') show(idx + 1, 1);
  });

  TS.initTilt(document, '.tcard', 6);
  TS.reveal();
  TS.initMagnetic();
  if (reduce) return;

  /* ---------- Animations ---------- */
  gsap.timeline()
    .from('.crumbs', { y: 20, opacity: 0, duration: .6 }, .1)
    .from(TS.splitWords($('#tdTitle')), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .03 }, .15)
    .from('.td-badges > *', { y: 20, opacity: 0, duration: .6, stagger: .06, ease: 'back.out(2)' }, .5)
    .fromTo('.gallery__item', { clipPath: 'inset(100% 0 0 0 round 22px)' }, { clipPath: 'inset(0% 0 0 0 round 22px)', duration: 1.3, ease: 'expo.inOut', stagger: .1 }, .3)
    .from('.gallery__item img', { scale: 1.4, duration: 1.8, ease: 'expo.out', stagger: .1 }, .5)
    .from('.book', { x: 60, opacity: 0, duration: 1, ease: 'expo.out' }, .7);
  gsap.from('.td-places span', { scale: .6, opacity: 0, duration: .5, stagger: .04, ease: 'back.out(2)', scrollTrigger: { trigger: '.td-places', start: 'top 88%' } });
  // timeline line grows with scroll
  gsap.fromTo('.timeline__line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  $$('.day').forEach(d => {
    gsap.from(d, { x: 50, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: d, start: 'top 90%' } });
    ScrollTrigger.create({ trigger: d, start: 'top 65%', onEnter: () => d.classList.add('is-lit'), onLeaveBack: () => d.classList.remove('is-lit') });
  });
  gsap.from('.dep-seats i', { scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.dep-table', start: 'top 85%' } });
  gsap.from('.mbar', { yPercent: 120, duration: .8, ease: 'expo.out', delay: 1 });
})();
