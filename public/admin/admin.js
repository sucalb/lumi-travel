/* ==========================================================
   Lumi Travel — Admin SPA
   ========================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  const fmtDate = ts => new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAT = { china: 'Trung Quốc', asia: 'Châu Á', domestic: 'Trong nước', other: 'Khác' };
  const STATUS = { new: 'Mới', contacted: 'Đã liên hệ', confirmed: 'Đã chốt', cancelled: 'Đã hủy' };
  const view = $('#view');
  const PLANE = '<svg viewBox="0 0 64 64"><path d="M60 28 40 26 24 4h-6l8 22-14-1-6-7H1l4 14-4 14h5l6-7 14-1-8 22h6l16-22 20-2a4 4 0 0 0 0-8z"/></svg>';
  const ICON_SEARCH = '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>';

  /* ---------- API ---------- */
  async function api(url, opts = {}) {
    const res = await fetch('/api/admin' + url, { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && url !== '/login') { showLogin(); throw new Error('Phiên đăng nhập đã hết hạn'); }
    if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
    return data;
  }

  /* ---------- UI helpers ---------- */
  let toastT;
  function toast(msg, err) {
    const t = $('#atoast');
    t.textContent = msg; t.classList.toggle('is-error', !!err); t.classList.add('is-show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-show'), 3200);
  }
  function setHeader(title, crumb = 'Lumi Travel', actions = '') {
    $('#pageTitle').textContent = title; $('#crumb').textContent = crumb; $('#topActions').innerHTML = actions;
    document.title = title + ' — Quản trị Lumi';
    if (!reduce) gsap.from('#pageTitle, #topActions > *', { y: 12, opacity: 0, duration: .5, stagger: .05, ease: 'power3.out' });
  }
  function enterView() {
    if (reduce) return;
    gsap.from(view.children, { y: 24, opacity: 0, duration: .6, stagger: .06, ease: 'expo.out', clearProps: 'transform,opacity' });
  }
  const loader = () => { view.innerHTML = `<div class="loader">${PLANE}</div>`; };

  function openLayer(id, html) {
    const el = $('#' + id), inner = el.querySelector('.drawer__panel, .modal__box');
    inner.innerHTML = `<button class="dclose" data-close>✕</button>` + html;
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    const scrim = el.querySelector('.drawer__scrim, .modal__scrim');
    if (reduce) { gsap.set(scrim, { opacity: 1 }); gsap.set(inner, id === 'drawer' ? { x: 0 } : { opacity: 1 }); }
    else {
      gsap.to(scrim, { opacity: 1, duration: .3 });
      if (id === 'drawer') gsap.fromTo(inner, { x: '100%' }, { x: '0%', duration: .6, ease: 'expo.out' });
      else gsap.fromTo(inner, { opacity: 0, scale: .92, xPercent: -50, yPercent: -45 }, { opacity: 1, scale: 1, yPercent: -50, duration: .5, ease: 'expo.out' });
    }
    const close = () => closeLayer(id);
    scrim.onclick = close;
    inner.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    return inner;
  }
  function closeLayer(id) {
    const el = $('#' + id), inner = el.querySelector('.drawer__panel, .modal__box'), scrim = el.querySelector('.drawer__scrim, .modal__scrim');
    const done = () => { el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true'); };
    if (reduce) return done();
    gsap.to(scrim, { opacity: 0, duration: .3 });
    if (id === 'drawer') gsap.to(inner, { x: '100%', duration: .45, ease: 'power3.in', onComplete: done });
    else gsap.to(inner, { opacity: 0, scale: .94, duration: .3, ease: 'power2.in', onComplete: done });
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#modal').classList.contains('is-open')) closeLayer('modal'); else if ($('#drawer').classList.contains('is-open')) closeLayer('drawer'); } });

  function confirmBox(msg, okText = 'Xóa') {
    return new Promise(resolve => {
      const box = openLayer('modal', `<h3>Xác nhận</h3><p>${esc(msg)}</p><div class="modal__acts"><button class="abtn" data-close>Hủy</button><button class="abtn abtn--danger" id="cfOk">${esc(okText)}</button></div>`);
      box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => resolve(false)));
      $('#cfOk', box).onclick = () => { closeLayer('modal'); resolve(true); };
    });
  }
  function countUp(el, to, fmt = v => Math.round(v).toLocaleString('vi-VN')) {
    if (reduce) { el.textContent = fmt(to); return; }
    const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } });
  }

  /* ---------- Image upload (resize client-side) ---------- */
  function fileToDataUrl(file, max = 1920) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error('Tệp không phải ảnh'));
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', .85));
      };
      img.onerror = () => reject(new Error('Không đọc được ảnh'));
      img.src = url;
    });
  }
  async function uploadFiles(files) {
    const urls = [];
    for (const f of files) {
      try { const data = await fileToDataUrl(f); const r = await api('/upload', { method: 'POST', body: { name: f.name, data } }); urls.push(r.url); }
      catch (e) { toast(e.message, true); }
    }
    return urls;
  }
  function pickFiles(multiple = true) {
    return new Promise(resolve => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = multiple;
      i.onchange = () => resolve([...i.files]); i.click();
    });
  }

  /* ---------- Auth ---------- */
  function showLogin() {
    $('#app').hidden = true; $('#login').hidden = false;
    if (reduce) return;
    gsap.from('.login__form > *', { y: 30, opacity: 0, duration: .8, stagger: .07, ease: 'expo.out' });
    gsap.from('.login__brand, .login__art p', { y: 30, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', delay: .2 });
    const path = $('.login__path path'), len = path.getTotalLength(), plane = $('.login__plane'), svg = $('.login__path');
    gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' });
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: 6, repeat: -1, ease: 'none', onUpdate: () => {
      const pt = path.getPointAtLength(o.p * len), pt2 = path.getPointAtLength(Math.min(len, o.p * len + 2));
      const box = svg.getBoundingClientRect(), art = $('.login__art').getBoundingClientRect();
      const sx = box.width / 600, sy = box.height / 600, s = Math.min(sx, sy);
      const ox = (box.width - 600 * s) / 2, oy = (box.height - 600 * s) / 2;
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      gsap.set(plane, { x: box.left - art.left + ox + pt.x * s - 27, y: box.top - art.top + oy + pt.y * s - 27, rotate: ang });
    } });
  }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
      await api('/login', { method: 'POST', body: { password: e.target.password.value } });
      e.target.reset();
      $('#login').hidden = true; $('#app').hidden = false;
      if (!reduce) gsap.from('.topbar, .view', { opacity: 0, y: 20, duration: .7, stagger: .1, ease: 'expo.out', clearProps: 'all' });
      route();
    } catch (err) {
      toast(err.message, true);
      e.target.classList.remove('shake'); void e.target.offsetWidth; e.target.classList.add('shake');
    } finally { btn.disabled = false; }
  });
  $('#logout').addEventListener('click', async () => { await api('/logout', { method: 'POST' }).catch(() => {}); showLogin(); });
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('side-open'));

  /* ---------- Sidebar ink ---------- */
  function markNav(name) {
    const links = $$('.side__nav a');
    const a = links.find(l => l.dataset.route === name);
    links.forEach(l => l.classList.toggle('is-active', l === a));
    const ink = $('.side__ink');
    // đo sau khi bố cục ổn định (sidebar vừa hiện, font vừa tải)
    const place = () => { if (a) { ink.style.opacity = 1; ink.style.height = a.offsetHeight + 'px'; ink.style.transform = `translateY(${a.offsetTop}px)`; } else ink.style.opacity = 0; };
    requestAnimationFrame(place);
    document.fonts && document.fonts.ready.then(place);
    document.body.classList.remove('side-open');
  }
  async function refreshBadge() {
    try {
      const list = await api('/bookings');
      const n = list.filter(b => b.status === 'new').length;
      const b = $('#newBadge'); b.hidden = !n; b.textContent = n;
    } catch {}
  }

  /* ---------- Router ---------- */
  let dirty = false;
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  async function route() {
    const [name = 'dashboard', id] = location.hash.replace(/^#\/?/, '').split('/');
    if (dirty && !confirm('Bạn có thay đổi chưa lưu. Rời trang?')) { dirty = false; return; }
    dirty = false;
    markNav(name);
    view.onclick = null;
    loader();
    try {
      if (name === 'dashboard') await Dashboard();
      else if (name === 'bookings') await Bookings();
      else if (name === 'tours' && id) await TourEditor(id);
      else if (name === 'tours') await Tours();
      else if (name === 'destinations') await Destinations();
      else if (name === 'posts' && id) await PostEditor(id);
      else if (name === 'posts') await Posts();
      else if (name === 'reviews') await Reviews();
      else if (name === 'subscribers') await Subscribers();
      else if (name === 'settings') await Settings();
      else location.hash = '#/dashboard';
      enterView();
    } catch (e) { if (!/hết hạn/.test(e.message)) view.innerHTML = `<div class="card">${esc(e.message)}</div>`; }
    refreshBadge();
  }
  addEventListener('hashchange', route);

  /* ==========================================================
     Dashboard
     ========================================================== */
  async function Dashboard() {
    const s = await api('/stats');
    setHeader('Tổng quan', 'Chào mừng trở lại 👋', `<a class="abtn abtn--gold" href="#/tours/new">+ Thêm tour</a>`);
    const max = Math.max(1, ...s.byDay.map(d => d.count));
    const topMax = Math.max(1, ...s.topTours.map(t => t.count));
    view.innerHTML = `
      <div class="kpis">
        <div class="kpi kpi--hot"><small>Đơn mới cần xử lý</small><b data-count="${s.newBookings}">0</b><span>trên tổng ${s.bookings} đơn</span>${PLANE}</div>
        <div class="kpi"><small>Đơn đã chốt</small><b data-count="${s.confirmed}">0</b><span>Tỷ lệ chốt ${s.bookings ? Math.round(s.confirmed / s.bookings * 100) : 0}%</span></div>
        <div class="kpi"><small>Doanh thu tạm tính (đã chốt)</small><b data-money="${s.revenue}">0đ</b><span>Theo giá niêm yết</span></div>
        <div class="kpi"><small>Tour đang mở bán</small><b data-count="${s.published}">0</b><span>${s.tours} tour · ${s.subscribers} người đăng ký tin</span></div>
      </div>
      <div class="dash">
        <div class="card"><div class="card__h"><h3>Đơn đặt 14 ngày gần nhất</h3></div>
          <div class="chart">${s.byDay.map(d => `<div class="chart__col"><div class="chart__bar" data-v="${d.count}" style="height:${d.count / max * 100}%"></div><small>${d.date.slice(8)}/${d.date.slice(5, 7)}</small></div>`).join('')}</div>
        </div>
        <div class="card"><div class="card__h"><h3>Tour được đặt nhiều</h3></div>
          ${s.topTours.length ? `<ul class="toplist">${s.topTours.map(t => `<li><span><em>${esc(t.title)}</em><b>${t.count}</b></span><i style="--w:${t.count / topMax * 100}%"></i></li>`).join('')}</ul>` : '<p class="t-sub">Chưa có dữ liệu.</p>'}
        </div>
      </div>
      <div class="card" style="margin-top:18px"><div class="card__h"><h3>Đơn mới nhất</h3><a class="abtn abtn--sm" href="#/bookings">Xem tất cả →</a></div>
        ${bookingTable(s.recent, true)}
      </div>`;
    $$('[data-count]', view).forEach(el => countUp(el, +el.dataset.count));
    $$('[data-money]', view).forEach(el => countUp(el, +el.dataset.money, v => money(Math.round(v / 1000) * 1000)));
    if (!reduce) {
      gsap.from('.chart__bar', { scaleY: 0, duration: 1, ease: 'expo.out', stagger: .04, delay: .2 });
      gsap.from('.toplist i', { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'expo.out', stagger: .08, delay: .3 });
    }
    bindBookingRows(view, s.recent, Dashboard);
  }

  /* ==========================================================
     Bookings
     ========================================================== */
  function bookingTable(list, compact) {
    if (!list.length) return `<div class="table-wrap"><table><tbody><tr><td class="empty-row">Chưa có đơn nào. Đơn từ website sẽ xuất hiện tại đây.</td></tr></tbody></table></div>`;
    return `<div class="table-wrap"><table>
      <thead><tr><th>Khách hàng</th><th>Tour</th>${compact ? '' : '<th class="hide-sm">Ngày đi</th><th class="hide-sm">Số khách</th>'}<th>Tạm tính</th><th>Trạng thái</th><th class="hide-sm">Thời gian</th></tr></thead>
      <tbody>${list.map(b => `
        <tr class="is-click" data-id="${b.id}">
          <td><b>${esc(b.name)}</b><span class="t-sub">${esc(b.phone)}</span></td>
          <td><span class="t-title">${esc(b.tourTitle || 'Tư vấn chung')}</span>${b.source ? `<span class="t-sub">Nguồn: ${esc(b.source)}</span>` : ''}</td>
          ${compact ? '' : `<td class="hide-sm">${esc(b.date || '—')}</td><td class="hide-sm">${b.adults} NL${b.children ? ` + ${b.children} TE` : ''}</td>`}
          <td class="price">${b.total ? money(b.total) : '—'}</td>
          <td><span class="pill st-${b.status}">${STATUS[b.status]}</span></td>
          <td class="hide-sm t-sub">${fmtDate(b.createdAt)}</td>
        </tr>`).join('')}</tbody></table></div>`;
  }
  function bindBookingRows(root, list, reload) {
    $$('tr[data-id]', root).forEach(tr => tr.addEventListener('click', () => bookingDrawer(list.find(b => b.id === tr.dataset.id), reload)));
  }
  function bookingDrawer(b, reload) {
    const phone = String(b.phone).replace(/[^\d+]/g, '');
    const panel = openLayer('drawer', `
      <h3>${esc(b.name)}</h3><span class="pill st-${b.status}">${STATUS[b.status]}</span>
      <div class="quick"><a class="abtn abtn--primary" href="tel:${esc(phone)}">📞 Gọi ${esc(b.phone)}</a><a class="abtn" href="https://zalo.me/${esc(phone.replace(/^\+84/, '0'))}" target="_blank" rel="noopener">Zalo</a>${b.email ? `<a class="abtn" href="mailto:${esc(b.email)}">Email</a>` : ''}</div>
      <dl class="kv">
        <dt>Tour</dt><dd>${esc(b.tourTitle || 'Tư vấn chung')}</dd>
        <dt>Ngày khởi hành</dt><dd>${esc(b.date || '—')}</dd>
        <dt>Số khách</dt><dd>${b.adults} người lớn, ${b.children} trẻ em</dd>
        <dt>Tạm tính</dt><dd class="price">${b.total ? money(b.total) : '—'}</dd>
        <dt>Email</dt><dd>${esc(b.email || '—')}</dd>
        <dt>Ghi chú khách</dt><dd>${esc(b.note || '—')}</dd>
        <dt>Nguồn</dt><dd>${esc(b.source || '—')}</dd>
        <dt>Thời gian đặt</dt><dd>${fmtDate(b.createdAt)}</dd>
      </dl>
      <label class="in"><span>Trạng thái</span><select id="bStatus">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === b.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="in"><span>Ghi chú nội bộ</span><textarea id="bNote" rows="4" placeholder="VD: Đã gọi, khách hẹn chốt thứ 6…">${esc(b.adminNote || '')}</textarea></label>
      <div class="modal__acts" style="justify-content:space-between"><button class="abtn abtn--danger" id="bDel">Xóa đơn</button><button class="abtn abtn--primary" id="bSave">Lưu thay đổi</button></div>`);
    $('#bSave', panel).onclick = async () => {
      try { await api('/bookings/' + b.id, { method: 'PUT', body: { status: $('#bStatus', panel).value, adminNote: $('#bNote', panel).value } }); toast('Đã cập nhật đơn'); closeLayer('drawer'); reload(); refreshBadge(); }
      catch (e) { toast(e.message, true); }
    };
    $('#bDel', panel).onclick = async () => {
      if (!(await confirmBox('Xóa vĩnh viễn đơn của ' + b.name + '?'))) return;
      await api('/bookings/' + b.id, { method: 'DELETE' }); toast('Đã xóa đơn'); closeLayer('drawer'); reload(); refreshBadge();
    };
  }
  async function Bookings() {
    const list = await api('/bookings');
    setHeader('Đơn đặt tour', `${list.length} đơn`, `<a class="abtn" href="/api/admin/export/bookings.csv">⬇ Xuất Excel (CSV)</a>`);
    let status = '', q = '';
    view.innerHTML = `
      <div class="toolbar">
        <div class="seg" id="seg">${[['', 'Tất cả', list.length], ...Object.entries(STATUS).map(([k, v]) => [k, v, list.filter(b => b.status === k).length])].map(([k, v, n]) => `<button data-s="${k}" class="${k === '' ? 'is-active' : ''}">${v}<em>${n}</em></button>`).join('')}</div>
        <label class="search">${ICON_SEARCH}<input id="q" placeholder="Tìm tên, SĐT, tour…" /></label>
      </div>
      <div id="tbl"></div>`;
    const draw = () => {
      const ql = q.toLowerCase();
      const rows = list.filter(b => (!status || b.status === status) && (!ql || [b.name, b.phone, b.tourTitle, b.email].join(' ').toLowerCase().includes(ql)));
      $('#tbl').innerHTML = bookingTable(rows);
      bindBookingRows($('#tbl'), rows, Bookings);
      if (!reduce) gsap.from('#tbl tbody tr', { x: -14, opacity: 0, duration: .4, stagger: .02, ease: 'power2.out' });
    };
    $('#seg').onclick = e => { const b = e.target.closest('button'); if (!b) return; status = b.dataset.s; $$('#seg button').forEach(x => x.classList.toggle('is-active', x === b)); draw(); };
    $('#q').oninput = e => { q = e.target.value; draw(); };
    draw();
  }

  /* ==========================================================
     Tours list
     ========================================================== */
  async function Tours() {
    const list = await api('/tours');
    setHeader('Tour', `${list.length} tour`, `<a class="abtn abtn--gold" href="#/tours/new">+ Thêm tour mới</a>`);
    let cat = '', q = '';
    view.innerHTML = `
      <div class="toolbar">
        <div class="seg" id="seg"><button data-c="" class="is-active">Tất cả</button>${Object.entries(CAT).map(([k, v]) => `<button data-c="${k}">${v}<em>${list.filter(t => t.category === k).length}</em></button>`).join('')}</div>
        <label class="search">${ICON_SEARCH}<input id="q" placeholder="Tìm tên tour, mã tour…" /></label>
      </div>
      <div id="tbl"></div>`;
    const draw = () => {
      const ql = q.toLowerCase();
      const rows = list.filter(t => (!cat || t.category === cat) && (!ql || [t.title, t.code, t.destination].join(' ').toLowerCase().includes(ql)));
      $('#tbl').innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th></th><th>Tour</th><th class="hide-sm">Loại</th><th>Giá</th><th class="hide-sm">Nổi bật</th><th>Hiển thị</th><th></th></tr></thead>
        <tbody>${rows.length ? rows.map(t => `
          <tr data-id="${t.id}">
            <td><img class="t-thumb" src="${esc(t.images[0] || '/assets/placeholder.svg')}" alt="" loading="lazy" /></td>
            <td><a href="#/tours/${t.id}" class="t-title">${esc(t.title)}</a><span class="t-sub">${esc(t.code || '')} · ${esc(t.departFrom)} · ${esc(t.days)} · ${t.departures.length} lịch khởi hành</span></td>
            <td class="hide-sm"><span class="cat cat--${t.category}">${CAT[t.category]}</span></td>
            <td class="price">${money(t.price)}</td>
            <td class="hide-sm"><label class="switch"><input type="checkbox" data-toggle="featured" ${t.featured ? 'checked' : ''}/><i></i></label></td>
            <td><label class="switch"><input type="checkbox" data-toggle="published" ${t.published ? 'checked' : ''}/><i></i></label></td>
            <td><div class="t-actions">
              <a class="abtn abtn--sm" href="/tour/${esc(t.slug)}" target="_blank" rel="noopener" title="Xem">↗</a>
              <a class="abtn abtn--sm" href="#/tours/${t.id}">Sửa</a>
              <button class="abtn abtn--sm" data-dup title="Nhân bản">⧉</button>
              <button class="abtn abtn--sm abtn--danger" data-del title="Xóa">✕</button>
            </div></td>
          </tr>`).join('') : '<tr><td colspan="7" class="empty-row">Không có tour phù hợp.</td></tr>'}</tbody></table></div>`;
      if (!reduce) gsap.from('#tbl tbody tr', { y: 10, opacity: 0, duration: .4, stagger: .025, ease: 'power2.out' });
    };
    $('#seg').onclick = e => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; $$('#seg button').forEach(x => x.classList.toggle('is-active', x === b)); draw(); };
    $('#q').oninput = e => { q = e.target.value; draw(); };
    $('#tbl').addEventListener('change', async e => {
      const inp = e.target.closest('[data-toggle]'); if (!inp) return;
      const t = list.find(x => x.id === inp.closest('tr').dataset.id);
      t[inp.dataset.toggle] = inp.checked;
      try { await api('/tours/' + t.id, { method: 'PUT', body: t }); toast(inp.checked ? 'Đã bật' : 'Đã tắt'); } catch (err) { toast(err.message, true); }
    });
    $('#tbl').addEventListener('click', async e => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const t = list.find(x => x.id === tr.dataset.id);
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox(`Xóa tour "${t.title}"? Thao tác không thể hoàn tác.`))) return;
        await api('/tours/' + t.id, { method: 'DELETE' }); toast('Đã xóa tour');
        if (!reduce) await gsap.to(tr, { x: 40, opacity: 0, duration: .35 });
        list.splice(list.indexOf(t), 1); draw();
      }
      if (e.target.closest('[data-dup]')) {
        const copy = await api('/tours', { method: 'POST', body: { ...t, title: t.title + ' (bản sao)', published: false } });
        toast('Đã nhân bản — bản sao đang ẩn'); location.hash = '#/tours/' + copy.id;
      }
    });
    draw();
  }

  /* ==========================================================
     Tour editor
     ========================================================== */
  const EMPTY_TOUR = { title: '', code: '', category: 'china', destination: '', departFrom: 'Hà Nội', days: '', hotel: 'Khách sạn 4 sao', transport: 'Máy bay, ô tô', highlights: '', schedule: 'Hàng tuần', tag: '', price: 0, oldPrice: 0, rating: 5, summary: '', images: [], itinerary: [{ title: 'Ngày 1: ', content: '' }], departures: [], includes: [], excludes: [], childPolicy: [], notes: [], featured: false, published: true };
  async function TourEditor(id) {
    const isNew = id === 'new';
    const [t, dests] = await Promise.all([isNew ? Promise.resolve(structuredClone(EMPTY_TOUR)) : api('/tours/' + id), api('/destinations')]);
    setHeader(isNew ? 'Thêm tour mới' : 'Sửa tour', isNew ? 'Tour' : t.code || 'Tour',
      `<a class="abtn" href="#/tours">← Danh sách</a>${isNew ? '' : `<a class="abtn" href="/tour/${esc(t.slug)}" target="_blank" rel="noopener">↗ Xem trên web</a>`}`);
    const destNames = [...new Set(dests.map(d => d.name))];
    view.innerHTML = `
      <div class="editor">
        <div>
          <div class="etabs" id="etabs">
            <button data-p="info" class="is-active">Thông tin chung</button><button data-p="imgs">Hình ảnh</button><button data-p="iti">Lịch trình</button><button data-p="deps">Lịch khởi hành & giá</button><button data-p="more">Bao gồm & lưu ý</button><i class="ink"></i>
          </div>
          <form id="tf" autocomplete="off">
            <section class="epanel card" data-panel="info">
              <label class="in"><span>Tên tour *</span><input name="title" value="${esc(t.title)}" placeholder="VD: Hà Nội - Trương Gia Giới - Phượng Hoàng Cổ Trấn 5 ngày 4 đêm" required /></label>
              <div class="grid3">
                <label class="in"><span>Mã tour</span><input name="code" value="${esc(t.code)}" placeholder="TS-CN01" /></label>
                <label class="in"><span>Loại tour</span><select name="category">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${k === t.category ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
                <label class="in"><span>Nhãn <em>(Hot, Giá tốt…)</em></span><input name="tag" value="${esc(t.tag)}" /></label>
              </div>
              <div class="grid3">
                <label class="in"><span>Điểm đến</span><input name="destination" value="${esc(t.destination)}" list="destList" placeholder="Trương Gia Giới" /><datalist id="destList">${destNames.map(d => `<option value="${esc(d)}">`).join('')}</datalist></label>
                <label class="in"><span>Khởi hành từ</span><input name="departFrom" value="${esc(t.departFrom)}" list="fromList" /><datalist id="fromList"><option value="Hà Nội"><option value="TP. Hồ Chí Minh"><option value="Hải Phòng"><option value="Đà Nẵng"></datalist></label>
                <label class="in"><span>Thời gian</span><input name="days" value="${esc(t.days)}" placeholder="5N4Đ" /></label>
              </div>
              <div class="grid3">
                <label class="in"><span>Lịch khởi hành <em>(hiển thị)</em></span><input name="schedule" value="${esc(t.schedule)}" placeholder="Thứ 5 hàng tuần" /></label>
                <label class="in"><span>Khách sạn</span><input name="hotel" value="${esc(t.hotel)}" /></label>
                <label class="in"><span>Phương tiện</span><input name="transport" value="${esc(t.transport)}" /></label>
              </div>
              <label class="in"><span>Điểm tham quan <em>(cách nhau bởi dấu " - ")</em></span><input name="highlights" value="${esc(t.highlights)}" placeholder="Thiên Môn Sơn - Cầu kính - Phượng Hoàng Cổ Trấn" /></label>
              <label class="in"><span>Mô tả ngắn</span><textarea name="summary" rows="3">${esc(t.summary)}</textarea></label>
            </section>

            <section class="epanel card" data-panel="imgs" hidden>
              <div class="card__h"><h3>Hình ảnh tour</h3><small class="t-sub">Ảnh đầu tiên là ảnh bìa. Kéo thả ảnh vào ô bên dưới để tải lên.</small></div>
              <div class="imgs" id="imgs"></div>
              <div class="grid2" style="margin-top:14px;align-items:end">
                <label class="in"><span>Hoặc dán link ảnh</span><input id="imgUrl" placeholder="https://…" /></label>
                <div class="in"><button type="button" class="abtn" id="addUrl">+ Thêm link ảnh</button></div>
              </div>
            </section>

            <section class="epanel card" data-panel="iti" hidden>
              <div class="card__h"><h3>Lịch trình theo ngày</h3><button type="button" class="abtn abtn--sm abtn--gold" id="addDay">+ Thêm ngày</button></div>
              <div class="days" id="days"></div>
            </section>

            <section class="epanel card" data-panel="deps" hidden>
              <div class="grid3">
                <label class="in"><span>Giá hiển thị (từ) *</span><input name="price" inputmode="numeric" value="${t.price || ''}" placeholder="13990000" /></label>
                <label class="in"><span>Giá gốc <em>(gạch ngang)</em></span><input name="oldPrice" inputmode="numeric" value="${t.oldPrice || ''}" /></label>
                <label class="in"><span>Đánh giá (0–5)</span><input name="rating" inputmode="decimal" value="${t.rating}" /></label>
              </div>
              <div class="gen">
                <label class="in"><span>Tạo nhanh: ngày đầu</span><input type="date" id="gStart" /></label>
                <label class="in"><span>Lặp mỗi (ngày)</span><input id="gEvery" value="7" inputmode="numeric" /></label>
                <label class="in"><span>Số chuyến</span><input id="gCount" value="8" inputmode="numeric" /></label>
                <label class="in"><span>Hãng bay</span><input id="gAir" value="Vietjet Air" /></label>
                <label class="in"><span>Số chỗ</span><input id="gSeats" value="20" inputmode="numeric" /></label>
                <button type="button" class="abtn abtn--primary" id="gRun">Tạo lịch</button>
              </div>
              <table class="deps"><thead><tr><th>Ngày (dd/mm/yyyy)</th><th>Hãng / phương tiện</th><th>Giá</th><th>Số chỗ</th><th></th></tr></thead><tbody id="depRows"></tbody></table>
              <button type="button" class="abtn abtn--sm" id="addDep" style="margin-top:8px">+ Thêm ngày khởi hành</button>
            </section>

            <section class="epanel card" data-panel="more" hidden>
              <div class="hint">Mỗi dòng là một ý. Để trống nếu không cần hiển thị.</div>
              <div class="grid2">
                <label class="in"><span>Giá tour bao gồm</span><textarea name="includes" rows="9">${esc(t.includes.join('\n'))}</textarea></label>
                <label class="in"><span>Giá tour chưa bao gồm</span><textarea name="excludes" rows="9">${esc(t.excludes.join('\n'))}</textarea></label>
                <label class="in"><span>Điều khoản trẻ em</span><textarea name="childPolicy" rows="5">${esc(t.childPolicy.join('\n'))}</textarea></label>
                <label class="in"><span>Quy định & lưu ý</span><textarea name="notes" rows="5">${esc(t.notes.join('\n'))}</textarea></label>
              </div>
            </section>
          </form>
        </div>
        <aside class="card side-card">
          <div class="preview-img"><img id="cover" src="${esc(t.images[0] || '/assets/placeholder.svg')}" alt="" /></div>
          <label class="switch" style="margin-bottom:12px"><input type="checkbox" id="pub" ${t.published ? 'checked' : ''}/><i></i>Hiển thị trên website</label>
          <label class="switch" style="margin-bottom:16px"><input type="checkbox" id="feat" ${t.featured ? 'checked' : ''}/><i></i>Tour nổi bật (trang chủ)</label>
          <button class="abtn abtn--primary abtn--block" id="save">${isNew ? 'Tạo tour' : 'Lưu thay đổi'}</button>
          ${isNew ? '' : '<button class="abtn abtn--danger abtn--block" id="del" style="margin-top:8px">Xóa tour</button>'}
        </aside>
      </div>
      <div class="savebar" id="savebar"><span>${isNew ? 'Tour mới chưa được lưu' : 'Đã lưu'}</span><button class="abtn abtn--gold" id="save2">${isNew ? 'Tạo tour' : 'Lưu'}</button></div>`;

    const form = $('#tf');
    const markDirty = () => { dirty = true; $('#savebar').classList.add('is-dirty'); $('#savebar span').textContent = 'Có thay đổi chưa lưu'; };
    form.addEventListener('input', markDirty);

    // tabs
    const tabs = $$('#etabs button'), ink = $('#etabs .ink');
    const moveInk = b => { ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; };
    requestAnimationFrame(() => moveInk(tabs[0]));
    $('#etabs').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      tabs.forEach(x => x.classList.toggle('is-active', x === b)); moveInk(b);
      $$('.epanel').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.p; });
      if (!reduce) gsap.from(`.epanel[data-panel="${b.dataset.p}"]`, { y: 16, opacity: 0, duration: .45, ease: 'expo.out' });
    };

    // images
    const imgs = [...t.images];
    const drawImgs = () => {
      $('#imgs').innerHTML = imgs.map((src, i) => `
        <div class="img-item" data-i="${i}"><img src="${esc(src)}" alt="" />
          <div class="img-item__acts"><button type="button" data-a="left" title="Lên trước">←</button><button type="button" data-a="cover" title="Đặt làm ảnh bìa">★</button><button type="button" data-a="right" title="Ra sau">→</button><button type="button" data-a="del" title="Xóa">✕</button></div>
        </div>`).join('') + `<div class="dropzone" id="drop"><b>+</b>Tải ảnh lên<small>JPG, PNG, WEBP</small></div>`;
      $('#cover').src = imgs[0] || '/assets/placeholder.svg';
      const drop = $('#drop');
      drop.onclick = async () => addFiles(await pickFiles());
      drop.ondragover = e => { e.preventDefault(); drop.classList.add('is-over'); };
      drop.ondragleave = () => drop.classList.remove('is-over');
      drop.ondrop = e => { e.preventDefault(); drop.classList.remove('is-over'); addFiles([...e.dataTransfer.files]); };
    };
    async function addFiles(files) {
      if (!files.length) return;
      toast(`Đang tải ${files.length} ảnh…`);
      const urls = await uploadFiles(files);
      imgs.push(...urls); drawImgs(); markDirty();
      if (urls.length) toast(`Đã tải ${urls.length} ảnh`);
      if (!reduce) gsap.from($$('.img-item').slice(-urls.length), { scale: .6, opacity: 0, duration: .5, stagger: .06, ease: 'back.out(2)' });
    }
    $('#imgs').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const i = +b.closest('.img-item').dataset.i;
      if (b.dataset.a === 'del') imgs.splice(i, 1);
      if (b.dataset.a === 'left' && i > 0) [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
      if (b.dataset.a === 'right' && i < imgs.length - 1) [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]];
      if (b.dataset.a === 'cover') imgs.unshift(imgs.splice(i, 1)[0]);
      drawImgs(); markDirty();
    };
    $('#addUrl').onclick = () => { const v = $('#imgUrl').value.trim(); if (!/^(https?:\/\/|\/)/.test(v)) return toast('Link ảnh không hợp lệ', true); imgs.push(v); $('#imgUrl').value = ''; drawImgs(); markDirty(); };
    drawImgs();

    // itinerary
    const days = t.itinerary.map(d => ({ ...d }));
    const syncDays = () => $$('.day-ed').forEach((el, i) => { days[i].title = $('[data-f=title]', el).value; days[i].content = $('[data-f=content]', el).value; });
    const drawDays = () => {
      $('#days').innerHTML = days.map((d, i) => `
        <div class="day-ed" data-i="${i}"><span class="day-ed__no">${i + 1}</span>
          <div class="day-ed__acts"><button type="button" class="abtn abtn--sm abtn--ghost" data-a="up">↑</button><button type="button" class="abtn abtn--sm abtn--ghost" data-a="down">↓</button><button type="button" class="abtn abtn--sm abtn--ghost abtn--danger" data-a="del">✕</button></div>
          <label class="in"><span>Tiêu đề ngày</span><input data-f="title" value="${esc(d.title)}" placeholder="Ngày ${i + 1}: Hà Nội - …" /></label>
          <label class="in"><span>Nội dung</span><textarea data-f="content" rows="4">${esc(d.content)}</textarea></label>
        </div>`).join('') || '<p class="t-sub">Chưa có ngày nào.</p>';
    };
    $('#days').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      syncDays();
      const i = +b.closest('.day-ed').dataset.i;
      if (b.dataset.a === 'del') days.splice(i, 1);
      if (b.dataset.a === 'up' && i > 0) [days[i - 1], days[i]] = [days[i], days[i - 1]];
      if (b.dataset.a === 'down' && i < days.length - 1) [days[i + 1], days[i]] = [days[i], days[i + 1]];
      drawDays(); markDirty();
    };
    $('#addDay').onclick = () => {
      syncDays(); days.push({ title: `Ngày ${days.length + 1}: `, content: '' }); drawDays(); markDirty();
      const last = $$('.day-ed').pop(); if (!reduce) gsap.from(last, { y: 20, opacity: 0, duration: .5, ease: 'expo.out' }); $('input', last).focus();
    };
    drawDays();

    // departures
    const deps = t.departures.map(d => ({ ...d }));
    const syncDeps = () => $$('#depRows tr').forEach((tr, i) => { ['date', 'airline', 'price', 'seats'].forEach(k => { deps[i][k] = $(`[data-f=${k}]`, tr).value; }); });
    const drawDeps = () => {
      $('#depRows').innerHTML = deps.map((d, i) => `<tr data-i="${i}">
        <td><input class="cell-in" data-f="date" value="${esc(d.date)}" placeholder="06/11/2026" /></td>
        <td><input class="cell-in" data-f="airline" value="${esc(d.airline)}" /></td>
        <td><input class="cell-in" data-f="price" value="${d.price || ''}" inputmode="numeric" /></td>
        <td><input class="cell-in" data-f="seats" value="${d.seats ?? ''}" inputmode="numeric" style="width:80px" /></td>
        <td><button type="button" class="abtn abtn--sm abtn--danger" data-a="del">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="t-sub">Chưa có lịch. Dùng "Tạo lịch" ở trên để tạo nhanh.</td></tr>';
    };
    $('#depRows').onclick = e => { const b = e.target.closest('[data-a=del]'); if (!b) return; syncDeps(); deps.splice(+b.closest('tr').dataset.i, 1); drawDeps(); markDirty(); };
    $('#addDep').onclick = () => { syncDeps(); deps.push({ date: '', airline: deps.at(-1)?.airline || '', price: +form.price.value || 0, seats: 20 }); drawDeps(); markDirty(); };
    $('#gRun').onclick = () => {
      const start = $('#gStart').value; if (!start) return toast('Chọn ngày khởi hành đầu tiên', true);
      syncDeps();
      const every = +$('#gEvery').value || 7, n = Math.min(52, +$('#gCount').value || 1);
      const d0 = new Date(start + 'T00:00:00');
      for (let i = 0; i < n; i++) {
        const d = new Date(d0.getTime() + i * every * 864e5);
        deps.push({ date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`, airline: $('#gAir').value, price: +String(form.price.value).replace(/\D/g, '') || 0, seats: +$('#gSeats').value || 0 });
      }
      drawDeps(); markDirty(); toast(`Đã tạo ${n} ngày khởi hành`);
      if (!reduce) gsap.from($$('#depRows tr').slice(-n), { x: -20, opacity: 0, duration: .4, stagger: .03 });
    };
    drawDeps();

    // save
    const lines = v => v.split('\n').map(x => x.trim()).filter(Boolean);
    async function save() {
      syncDays(); syncDeps();
      const f = form.elements;
      const body = {
        title: f.title.value, code: f.code.value, category: f.category.value, tag: f.tag.value, destination: f.destination.value, departFrom: f.departFrom.value,
        days: f.days.value, schedule: f.schedule.value, hotel: f.hotel.value, transport: f.transport.value, highlights: f.highlights.value, summary: f.summary.value,
        price: f.price.value, oldPrice: f.oldPrice.value, rating: f.rating.value, images: imgs, itinerary: days, departures: deps,
        includes: lines(f.includes.value), excludes: lines(f.excludes.value), childPolicy: lines(f.childPolicy.value), notes: lines(f.notes.value),
        published: $('#pub').checked, featured: $('#feat').checked,
      };
      if (!body.title.trim()) { $('#etabs button').click(); f.title.focus(); return toast('Vui lòng nhập tên tour', true); }
      try {
        const saved = isNew ? await api('/tours', { method: 'POST', body }) : await api('/tours/' + id, { method: 'PUT', body });
        dirty = false; $('#savebar').classList.remove('is-dirty'); $('#savebar span').textContent = 'Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN');
        toast(isNew ? 'Đã tạo tour mới 🎉' : 'Đã lưu thay đổi');
        if (!reduce) gsap.fromTo('#savebar', { scale: 1 }, { scale: 1.02, yoyo: true, repeat: 1, duration: .15 });
        if (isNew) location.hash = '#/tours/' + saved.id;
      } catch (e) { toast(e.message, true); }
    }
    $('#save').onclick = save; $('#save2').onclick = save;
    $('#pub').onchange = markDirty; $('#feat').onchange = markDirty;
    addEventListener('keydown', function ks(e) { if (!location.hash.startsWith('#/tours/')) return removeEventListener('keydown', ks); if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });
    if (!isNew) $('#del').onclick = async () => {
      if (!(await confirmBox(`Xóa tour "${t.title}"?`))) return;
      await api('/tours/' + id, { method: 'DELETE' }); dirty = false; toast('Đã xóa tour'); location.hash = '#/tours';
    };
  }

  /* ==========================================================
     Destinations
     ========================================================== */
  async function Destinations() {
    const list = (await api('/destinations')).sort((a, b) => a.order - b.order);
    setHeader('Điểm đến', 'Hiển thị ở mục "Điểm đến hàng đầu" trang chủ', `<button class="abtn abtn--gold" id="addD">+ Thêm điểm đến</button>`);
    let region = 'china';
    view.innerHTML = `<div class="toolbar"><div class="seg" id="seg">${Object.entries(CAT).map(([k, v]) => `<button data-r="${k}" class="${k === region ? 'is-active' : ''}">${v}<em>${list.filter(d => d.region === k).length}</em></button>`).join('')}</div></div><div class="dgrid" id="dgrid"></div>`;
    const draw = () => {
      $('#dgrid').innerHTML = list.filter(d => d.region === region).map(d => `<div class="dg ${d.featured ? '' : 'is-off'}" data-id="${d.id}"><img src="${esc(d.image)}" alt="" loading="lazy" /><div class="dg__cap"><b>${esc(d.name)}</b><small>Thứ tự ${d.order}${d.featured ? '' : ' · đang ẩn'}</small></div></div>`).join('') + `<div class="dg dg--add" data-add><b>+</b>Thêm điểm đến</div>`;
      if (!reduce) gsap.from('.dg', { y: 20, opacity: 0, scale: .95, duration: .5, stagger: .04, ease: 'expo.out' });
    };
    $('#seg').onclick = e => { const b = e.target.closest('button'); if (!b) return; region = b.dataset.r; $$('#seg button').forEach(x => x.classList.toggle('is-active', x === b)); draw(); };
    const edit = d => {
      const isNew = !d; d = d || { name: '', region, image: '', featured: true, order: list.length + 1 };
      const box = openLayer('modal', `
        <h3>${isNew ? 'Thêm điểm đến' : 'Sửa điểm đến'}</h3><p class="t-sub">Ảnh dọc (3:4) hiển thị đẹp nhất.</p>
        <div class="preview-img" style="aspect-ratio:16/9"><img id="dImg" src="${esc(d.image || '/assets/placeholder.svg')}" alt="" /></div>
        <div class="grid2"><label class="in"><span>Tên</span><input id="dName" value="${esc(d.name)}" /></label>
        <label class="in"><span>Khu vực</span><select id="dRegion">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${k === d.region ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
        <label class="in"><span>Link ảnh</span><input id="dUrl" value="${esc(d.image)}" /></label>
        <div class="grid2" style="align-items:center"><button class="abtn" id="dUp" type="button">⬆ Tải ảnh từ máy</button><label class="in" style="margin:0"><span>Thứ tự</span><input id="dOrder" value="${d.order}" inputmode="numeric" /></label></div>
        <label class="switch" style="margin-top:14px"><input type="checkbox" id="dFeat" ${d.featured ? 'checked' : ''}/><i></i>Hiển thị trên trang chủ</label>
        <div class="modal__acts" style="justify-content:space-between">${isNew ? '<span></span>' : '<button class="abtn abtn--danger" id="dDel">Xóa</button>'}<div style="display:flex;gap:8px"><button class="abtn" data-close>Hủy</button><button class="abtn abtn--primary" id="dSave">Lưu</button></div></div>`);
      $('#dUrl', box).oninput = e => { $('#dImg', box).src = e.target.value; };
      $('#dUp', box).onclick = async () => { const [u] = await uploadFiles(await pickFiles(false)); if (u) { $('#dUrl', box).value = u; $('#dImg', box).src = u; } };
      $('#dSave', box).onclick = async () => {
        const body = { name: $('#dName', box).value, region: $('#dRegion', box).value, image: $('#dUrl', box).value, order: $('#dOrder', box).value, featured: $('#dFeat', box).checked };
        try { await (isNew ? api('/destinations', { method: 'POST', body }) : api('/destinations/' + d.id, { method: 'PUT', body })); toast('Đã lưu điểm đến'); closeLayer('modal'); Destinations(); }
        catch (e) { toast(e.message, true); }
      };
      if (!isNew) $('#dDel', box).onclick = async () => { await api('/destinations/' + d.id, { method: 'DELETE' }); toast('Đã xóa'); closeLayer('modal'); Destinations(); };
    };
    $('#dgrid').onclick = e => { const c = e.target.closest('.dg'); if (!c) return; c.dataset.add !== undefined ? edit() : edit(list.find(d => d.id === c.dataset.id)); };
    $('#addD').onclick = () => edit();
    draw();
  }

  /* ==========================================================
     Posts
     ========================================================== */
  async function Posts() {
    const list = await api('/posts');
    setHeader('Cẩm nang', `${list.length} bài viết`, `<a class="abtn abtn--gold" href="#/posts/new">+ Viết bài mới</a>`);
    view.innerHTML = `<div class="table-wrap"><table><thead><tr><th></th><th>Bài viết</th><th class="hide-sm">Ngày đăng</th><th>Hiển thị</th><th></th></tr></thead><tbody>
      ${list.length ? list.map(p => `<tr data-id="${p.id}"><td><img class="t-thumb" src="${esc(p.image)}" alt="" /></td><td><a class="t-title" href="#/posts/${p.id}">${esc(p.title)}</a><span class="t-sub">${esc(p.excerpt).slice(0, 110)}</span></td>
        <td class="hide-sm t-sub">${fmtDate(p.createdAt)}</td><td><span class="pill ${p.published ? 'st-confirmed' : 'st-cancelled'}">${p.published ? 'Đang hiện' : 'Ẩn'}</span></td>
        <td><div class="t-actions"><a class="abtn abtn--sm" href="/cam-nang/${esc(p.slug)}" target="_blank" rel="noopener">↗</a><a class="abtn abtn--sm" href="#/posts/${p.id}">Sửa</a><button class="abtn abtn--sm abtn--danger" data-del>✕</button></div></td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">Chưa có bài viết.</td></tr>'}
      </tbody></table></div>`;
    view.onclick = async e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const p = list.find(x => x.id === b.closest('tr').dataset.id);
      if (!(await confirmBox(`Xóa bài "${p.title}"?`))) return;
      await api('/posts/' + p.id, { method: 'DELETE' }); toast('Đã xóa bài'); view.onclick = null; Posts();
    };
  }
  async function PostEditor(id) {
    view.onclick = null;
    const isNew = id === 'new';
    const p = isNew ? { title: '', excerpt: '', image: '', content: '', published: true } : await api('/posts/' + id);
    setHeader(isNew ? 'Viết bài mới' : 'Sửa bài viết', 'Cẩm nang', `<a class="abtn" href="#/posts">← Danh sách</a>`);
    view.innerHTML = `
      <div class="editor">
        <div class="card">
          <label class="in"><span>Tiêu đề *</span><input id="pTitle" value="${esc(p.title)}" /></label>
          <label class="in"><span>Tóm tắt</span><textarea id="pEx" rows="2">${esc(p.excerpt)}</textarea></label>
          <label class="in"><span>Nội dung <em>(cách 1 dòng trống để xuống đoạn mới)</em></span><textarea id="pContent" rows="18">${esc(p.content)}</textarea></label>
        </div>
        <aside class="card side-card">
          <div class="preview-img"><img id="pImgPrev" src="${esc(p.image || '/assets/placeholder.svg')}" alt="" /></div>
          <label class="in"><span>Link ảnh bìa</span><input id="pImg" value="${esc(p.image)}" /></label>
          <button class="abtn abtn--block" id="pUp" type="button" style="margin-bottom:12px">⬆ Tải ảnh từ máy</button>
          <label class="switch" style="margin-bottom:16px"><input type="checkbox" id="pPub" ${p.published ? 'checked' : ''}/><i></i>Hiển thị trên website</label>
          <button class="abtn abtn--primary abtn--block" id="pSave">${isNew ? 'Đăng bài' : 'Lưu thay đổi'}</button>
        </aside>
      </div>`;
    view.addEventListener('input', () => { dirty = true; }, { once: true });
    $('#pImg').oninput = e => { $('#pImgPrev').src = e.target.value; };
    $('#pUp').onclick = async () => { const [u] = await uploadFiles(await pickFiles(false)); if (u) { $('#pImg').value = u; $('#pImgPrev').src = u; dirty = true; } };
    $('#pSave').onclick = async () => {
      const body = { title: $('#pTitle').value, excerpt: $('#pEx').value, content: $('#pContent').value, image: $('#pImg').value, published: $('#pPub').checked };
      try { const saved = await (isNew ? api('/posts', { method: 'POST', body }) : api('/posts/' + id, { method: 'PUT', body })); dirty = false; toast('Đã lưu bài viết'); if (isNew) location.hash = '#/posts/' + saved.id; }
      catch (e) { toast(e.message, true); }
    };
  }

  /* ==========================================================
     Reviews
     ========================================================== */
  async function Reviews() {
    const list = await api('/reviews');
    setHeader('Đánh giá', `${list.length} đánh giá`, `<button class="abtn abtn--gold" id="addR">+ Thêm đánh giá</button>`);
    view.innerHTML = `<div class="hint">Chỉ đăng đánh giá thật của khách hàng. Đánh giá được hiển thị ở trang chủ.</div>
      <div class="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Nội dung</th><th>Sao</th><th>Hiển thị</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr data-id="${r.id}"><td><b>${esc(r.name)}</b><span class="t-sub">${esc(r.trip)}</span></td><td>${esc(r.text)}</td><td style="color:var(--gold-500);white-space:nowrap">${'★'.repeat(r.rating)}</td>
        <td><span class="pill ${r.published ? 'st-confirmed' : 'st-cancelled'}">${r.published ? 'Hiện' : 'Ẩn'}</span></td><td><div class="t-actions"><button class="abtn abtn--sm" data-edit>Sửa</button><button class="abtn abtn--sm abtn--danger" data-del>✕</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="empty-row">Chưa có đánh giá.</td></tr>'}
      </tbody></table></div>`;
    const edit = r => {
      const isNew = !r; r = r || { name: '', trip: '', text: '', rating: 5, published: true };
      const box = openLayer('modal', `<h3>${isNew ? 'Thêm đánh giá' : 'Sửa đánh giá'}</h3>
        <div class="grid2"><label class="in"><span>Tên khách</span><input id="rName" value="${esc(r.name)}" /></label><label class="in"><span>Chuyến đi</span><input id="rTrip" value="${esc(r.trip)}" /></label></div>
        <label class="in"><span>Nội dung</span><textarea id="rText" rows="4">${esc(r.text)}</textarea></label>
        <div class="grid2" style="align-items:center"><label class="in"><span>Số sao</span><select id="rRate">${[5, 4, 3, 2, 1].map(n => `<option ${n === r.rating ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="switch"><input type="checkbox" id="rPub" ${r.published ? 'checked' : ''}/><i></i>Hiển thị</label></div>
        <div class="modal__acts"><button class="abtn" data-close>Hủy</button><button class="abtn abtn--primary" id="rSave">Lưu</button></div>`);
      $('#rSave', box).onclick = async () => {
        const body = { name: $('#rName', box).value, trip: $('#rTrip', box).value, text: $('#rText', box).value, rating: +$('#rRate', box).value, published: $('#rPub', box).checked };
        try { await (isNew ? api('/reviews', { method: 'POST', body }) : api('/reviews/' + r.id, { method: 'PUT', body })); toast('Đã lưu'); closeLayer('modal'); Reviews(); } catch (e) { toast(e.message, true); }
      };
    };
    $('#addR').onclick = () => edit();
    view.onclick = async e => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const r = list.find(x => x.id === tr.dataset.id);
      if (e.target.closest('[data-edit]')) edit(r);
      if (e.target.closest('[data-del]') && await confirmBox('Xóa đánh giá của ' + r.name + '?')) { await api('/reviews/' + r.id, { method: 'DELETE' }); toast('Đã xóa'); view.onclick = null; Reviews(); }
    };
  }

  /* ==========================================================
     Subscribers
     ========================================================== */
  async function Subscribers() {
    view.onclick = null;
    const list = await api('/subscribers');
    setHeader('Đăng ký nhận tin', `${list.length} email`, list.length ? `<button class="abtn" id="copyAll">Sao chép tất cả email</button>` : '');
    view.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Email</th><th>Ngày đăng ký</th><th></th></tr></thead><tbody>
      ${list.map(s => `<tr data-id="${s.id}"><td><b>${esc(s.email)}</b></td><td class="t-sub">${fmtDate(s.createdAt)}</td><td><div class="t-actions"><button class="abtn abtn--sm abtn--danger" data-del>✕</button></div></td></tr>`).join('') || '<tr><td colspan="3" class="empty-row">Chưa có ai đăng ký.</td></tr>'}
      </tbody></table></div>`;
    const c = $('#copyAll'); if (c) c.onclick = async () => { await navigator.clipboard.writeText(list.map(s => s.email).join(', ')); toast('Đã sao chép ' + list.length + ' email'); };
    view.onclick = async e => { const b = e.target.closest('[data-del]'); if (!b) return; await api('/subscribers/' + b.closest('tr').dataset.id, { method: 'DELETE' }); toast('Đã xóa'); view.onclick = null; Subscribers(); };
  }

  /* ==========================================================
     Settings
     ========================================================== */
  async function Settings() {
    view.onclick = null;
    const s = await api('/settings');
    setHeader('Cài đặt', 'Thông tin hiển thị trên toàn website');
    const addrRow = a => `<div class="rep-row"><input class="cell-in" data-k="label" value="${esc(a.label)}" placeholder="Trụ sở" /><input class="cell-in" data-k="text" value="${esc(a.text)}" placeholder="Địa chỉ" /><input class="cell-in" data-k="phone" value="${esc(a.phone || '')}" placeholder="SĐT" /><button type="button" class="abtn abtn--sm abtn--danger" data-rm>✕</button></div>`;
    view.innerHTML = `
      <div class="card"><div class="card__h"><h3>Thông tin công ty</h3></div>
        <div class="grid2">
          <label class="in"><span>Tên công ty</span><input data-s="companyName" value="${esc(s.companyName)}" /></label>
          <label class="in"><span>Thương hiệu</span><input data-s="brand" value="${esc(s.brand)}" /></label>
          <label class="in"><span>Hotline</span><input data-s="hotline" value="${esc(s.hotline)}" /></label>
          <label class="in"><span>Người phụ trách hotline</span><input data-s="hotlineName" value="${esc(s.hotlineName)}" /></label>
          <label class="in"><span>Số Zalo</span><input data-s="zalo" value="${esc(s.zalo)}" /></label>
          <label class="in"><span>Email</span><input data-s="email" value="${esc(s.email)}" /></label>
          <label class="in"><span>SĐT phản ánh chất lượng</span><input data-s="reportPhone" value="${esc(s.reportPhone)}" /></label>
          <label class="in"><span>Slogan</span><input data-s="slogan" value="${esc(s.slogan)}" /></label>
        </div>
        <label class="in"><span>Giấy phép kinh doanh <em>(hiện ở chân trang)</em></span><textarea data-s="license" rows="2" placeholder="Giấy phép kinh doanh số …&#10;Giấy phép lữ hành quốc tế số …">${esc(s.license)}</textarea></label>
      </div>
      <div class="card"><div class="card__h"><h3>Địa chỉ văn phòng</h3><button class="abtn abtn--sm" id="addAddr" type="button">+ Thêm</button></div><div class="repeater" id="addrs">${(s.addresses || []).map(addrRow).join('')}</div></div>
      <div class="card"><div class="card__h"><h3>Trang chủ</h3></div>
        <label class="in"><span>Tiêu đề lớn</span><input data-s="heroTitle" value="${esc(s.heroTitle)}" /><small>Hai từ cuối sẽ hiển thị kiểu chữ viết tay màu vàng.</small></label>
        <label class="in"><span>Mô tả dưới tiêu đề</span><textarea data-s="heroSubtitle" rows="2">${esc(s.heroSubtitle)}</textarea></label>
        <label class="in"><span>Ảnh nền trang chủ <em>(mỗi dòng 1 link, tự chuyển sau 6 giây)</em></span><textarea id="heroImgs" rows="5">${esc((s.heroImages || []).join('\n'))}</textarea></label>
        <button class="abtn abtn--sm" id="upHero" type="button" style="margin:-6px 0 14px">⬆ Tải ảnh nền từ máy</button>
        <label class="in"><span>Giới thiệu "Về chúng tôi"</span><textarea data-s="aboutText" rows="3">${esc(s.aboutText)}</textarea></label>
        <label class="in"><span>Mô tả dịch vụ visa</span><textarea data-s="visaText" rows="2">${esc(s.visaText)}</textarea></label>
        <span class="t-sub" style="font-weight:700;margin-bottom:6px;display:block">Số liệu nổi bật</span>
        <div class="grid4" id="stats">${(s.stats || []).map(x => `<div><input class="cell-in" data-k="value" value="${x.value}" placeholder="Số" style="margin-bottom:6px" /><input class="cell-in" data-k="suffix" value="${esc(x.suffix)}" placeholder="+ / % / ★" style="margin-bottom:6px" /><input class="cell-in" data-k="label" value="${esc(x.label)}" placeholder="Nhãn" /></div>`).join('')}</div>
      </div>
      <div class="savebar"><span>Thay đổi sẽ hiển thị ngay trên website sau khi lưu</span><button class="abtn abtn--gold" id="saveS">Lưu cài đặt</button></div>
      <div class="card" style="margin-top:18px"><div class="card__h"><h3>Đổi mật khẩu quản trị</h3></div>
        <div class="grid3"><label class="in"><span>Mật khẩu hiện tại</span><input type="password" id="pw0" autocomplete="current-password" /></label><label class="in"><span>Mật khẩu mới (≥ 8 ký tự)</span><input type="password" id="pw1" autocomplete="new-password" /></label><label class="in"><span>Nhập lại mật khẩu mới</span><input type="password" id="pw2" autocomplete="new-password" /></label></div>
        <button class="abtn abtn--primary" id="savePw">Đổi mật khẩu</button>
      </div>`;
    $('#addAddr').onclick = () => { $('#addrs').insertAdjacentHTML('beforeend', addrRow({ label: '', text: '', phone: '' })); };
    $('#addrs').onclick = e => { if (e.target.closest('[data-rm]')) e.target.closest('.rep-row').remove(); };
    $('#upHero').onclick = async () => { const urls = await uploadFiles(await pickFiles()); if (urls.length) { const ta = $('#heroImgs'); ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + urls.join('\n'); toast('Đã tải ảnh, nhớ bấm Lưu'); } };
    $('#saveS').onclick = async () => {
      const body = {};
      $$('[data-s]').forEach(el => { body[el.dataset.s] = el.value; });
      body.addresses = $$('#addrs .rep-row').map(r => ({ label: $('[data-k=label]', r).value, text: $('[data-k=text]', r).value, phone: $('[data-k=phone]', r).value }));
      body.heroImages = $('#heroImgs').value;
      body.stats = $$('#stats > div').map(d => ({ value: $('[data-k=value]', d).value, suffix: $('[data-k=suffix]', d).value, label: $('[data-k=label]', d).value }));
      try { await api('/settings', { method: 'PUT', body }); toast('Đã lưu cài đặt'); } catch (e) { toast(e.message, true); }
    };
    $('#savePw').onclick = async () => {
      const [a, b, c] = ['#pw0', '#pw1', '#pw2'].map(x => $(x).value);
      if (b !== c) return toast('Mật khẩu nhập lại không khớp', true);
      try { await api('/password', { method: 'POST', body: { current: a, next: b } }); toast('Đã đổi mật khẩu'); ['#pw0', '#pw1', '#pw2'].forEach(x => { $(x).value = ''; }); } catch (e) { toast(e.message, true); }
    };
  }

  /* ---------- Boot ---------- */
  fetch('/api/admin/me', { credentials: 'same-origin' }).then(r => {
    if (r.ok) { $('#app').hidden = false; route(); } else showLogin();
  }).catch(showLogin);
})();
