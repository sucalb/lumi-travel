/* ==========================================================
   Lumi Travel — Tour listing with filters
   ========================================================== */
(async () => {
  const { $, $$, esc, money, api, CAT, tourCard, reduce } = TS;
  gsap.registerPlugin(Flip);

  let site;
  try { site = await api('api/site'); } catch (e) { TS.toast(e.message, true); return; }
  const { settings, tours, destinations } = site;
  TS.boot(settings, { solid: true });

  const params = new URLSearchParams(location.search);
  const maxPrice = Math.ceil(Math.max(...tours.map(t => t.price), 10000000) / 1e6) * 1e6;
  const state = {
    q: params.get('q') || '',
    cat: params.get('cat') || '',
    from: params.get('from') || '',
    dest: params.get('dest') || '',
    days: params.get('days') || '',
    price: +params.get('price') || maxPrice,
    sort: params.get('sort') || 'pop',
  };
  const daysOf = t => parseInt(t.days) || 0;
  const DAY_BUCKETS = [['1-3', '1–3 ngày', d => d <= 3], ['4-5', '4–5 ngày', d => d >= 4 && d <= 5], ['6+', 'Từ 6 ngày', d => d >= 6]];

  // Build filter chips
  const chip = (group, value, label) => `<button class="chip" data-group="${group}" data-value="${esc(value)}">${esc(label)}</button>`;
  $('#fCat').innerHTML = chip('cat', '', 'Tất cả') + Object.entries(CAT).filter(([k]) => tours.some(t => t.category === k)).map(([k, v]) => chip('cat', k, v)).join('');
  $('#fFrom').innerHTML = chip('from', '', 'Tất cả') + [...new Set(tours.map(t => t.departFrom))].map(f => chip('from', f, f)).join('');
  const destList = [...new Set([...destinations.map(d => d.name), ...tours.map(t => t.destination)])].filter(d => tours.some(t => t.destination === d));
  $('#fDest').innerHTML = chip('dest', '', 'Tất cả') + destList.map(d => chip('dest', d, d)).join('');
  $('#fDays').innerHTML = chip('days', '', 'Tất cả') + DAY_BUCKETS.map(([k, l]) => chip('days', k, l)).join('');
  const range = $('#fPrice');
  range.max = maxPrice;
  $('#fQ').value = state.q;
  $('#fSort').value = state.sort;

  // Hero
  const heroImg = (state.dest && destinations.find(d => d.name === state.dest)?.image) || (state.cat === 'china' || !state.cat ? settings.heroImages?.[0] : tours.find(t => t.category === state.cat)?.image) || tours[0]?.image;
  $('#pageHeroBg').style.backgroundImage = `url('${heroImg}')`;
  const heading = state.dest ? `Tour ${state.dest}` : state.cat ? `Tour ${CAT[state.cat] || ''}` : 'Tất cả tour du lịch';
  $('#listTitle').textContent = heading;
  $('#crumbCur').textContent = heading;
  document.title = heading + ' — Lumi Travel';
  $('#listSub').textContent = state.cat === 'china' || /trung|bắc kinh|hồng kông/i.test(state.dest)
    ? 'Tour Trung Quốc trọn gói: visa, vé máy bay, khách sạn 4 sao, HDV tiếng Việt suốt tuyến.'
    : 'Giá tốt mỗi ngày — giữ chỗ bây giờ, thanh toán sau.';

  function syncUI() {
    $$('.chip').forEach(c => c.classList.toggle('is-active', state[c.dataset.group] === c.dataset.value));
    range.value = state.price;
    $('#fPriceVal').textContent = state.price >= maxPrice ? 'Không giới hạn' : money(state.price);
    range.style.setProperty('--p', (state.price / maxPrice * 100) + '%');
  }
  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = tours.filter(t =>
      (!state.cat || t.category === state.cat) &&
      (!state.from || t.departFrom === state.from) &&
      (!state.dest || t.destination === state.dest) &&
      t.price <= state.price &&
      (!state.days || DAY_BUCKETS.find(b => b[0] === state.days)[2](daysOf(t))) &&
      (!q || [t.title, t.destination, t.highlights, t.code].join(' ').toLowerCase().includes(q)));
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'days') list.sort((a, b) => daysOf(a) - daysOf(b));
    if (state.sort === 'pop') list.sort((a, b) => (b.featured - a.featured));
    return list;
  }
  const grid = $('#results');
  let first = true;
  function render() {
    syncUI();
    const list = filtered();
    $('#resultCount').innerHTML = `Tìm thấy <b>${list.length}</b> tour cho Quý khách`;
    $('#empty').hidden = list.length > 0;
    const state0 = !first && !reduce ? Flip.getState($$('.tcard', grid)) : null;
    const prev = new Map($$('.tcard', grid).map(el => [el.getAttribute('href'), el]));
    grid.innerHTML = '';
    list.forEach(t => {
      const el = prev.get('tour/' + t.slug) || document.createRange().createContextualFragment(tourCard(t)).firstElementChild;
      grid.appendChild(el);
    });
    TS.initTilt(grid, '.tcard', 6);
    if (first) {
      first = false;
      if (!reduce) gsap.from(grid.children, { y: 70, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, delay: .2 });
    } else if (state0) {
      Flip.from(state0, { duration: .7, ease: 'power3.inOut', stagger: .03, absolute: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, scale: .85, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: .6, ease: 'expo.out', stagger: .04 }) });
    }
    // URL sync
    const p = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => { if (v && !(k === 'price' && v >= maxPrice) && !(k === 'sort' && v === 'pop')) p.set(k, v); });
    history.replaceState(null, '', 'tours' + (p.toString() ? '?' + p : ''));
    ScrollTrigger.refresh();
  }

  document.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    state[c.dataset.group] = c.dataset.value;
    if (!reduce) gsap.fromTo(c, { scale: .9 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    render();
  });
  let qTimer;
  $('#fQ').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; render(); }, 250); });
  range.addEventListener('input', () => { state.price = +range.value; syncUI(); });
  range.addEventListener('change', render);
  $('#fSort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#resetFilters').addEventListener('click', () => { Object.assign(state, { q: '', cat: '', from: '', dest: '', days: '', price: maxPrice }); $('#fQ').value = ''; render(); });
  $('#filtersToggle').addEventListener('click', () => document.body.classList.toggle('filters-open'));
  document.addEventListener('click', e => { if (document.body.classList.contains('filters-open') && !e.target.closest('#filtersPanel, #filtersToggle')) document.body.classList.remove('filters-open'); });

  render();

  if (!reduce) {
    TS.splitWords($('#listTitle'));
    gsap.timeline()
      .from('.page-hero__bg', { scale: 1.3, duration: 2, ease: 'expo.out' }, 0)
      .from('#listTitle .word', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06 }, .1)
      .from('.crumbs, .page-hero__sub', { y: 20, opacity: 0, duration: .8, ease: 'power3.out', stagger: .1 }, .3)
      .from('.filters-panel > *', { x: -30, opacity: 0, duration: .8, ease: 'power3.out', stagger: .06 }, .3);
    gsap.to('.page-hero__bg', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
})();
