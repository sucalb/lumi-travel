// Lumi Travel — máy chủ web + API + trang quản trị
// Chạy: node server.js   (không cần cài thêm thư viện)
// Biến môi trường: PORT (mặc định 3000), ADMIN_PASSWORD (mật khẩu lần đầu, mặc định "lumi@2026")
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(PUBLIC, 'uploads');
const DB_FILE = path.join(ROOT, 'data', 'db.json');
const PORT = process.env.PORT || 3000;
const COLLECTIONS = ['tours', 'destinations', 'posts', 'reviews', 'bookings', 'subscribers'];
const BOOKING_STATUS = ['new', 'contacted', 'confirmed', 'cancelled'];

/* ---------------- Database (JSON file) ---------------- */
const hashPassword = (pw, salt = crypto.randomBytes(16).toString('hex')) =>
  ({ salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') });

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = require('./data/seed.js');
    seed.auth = hashPassword(process.env.ADMIN_PASSWORD || 'lumi@2026');
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    console.log('• Đã tạo dữ liệu mẫu tại data/db.json');
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  COLLECTIONS.forEach(c => { db[c] = db[c] || []; });
  return db;
}
let db = loadDb();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }, 50);
}

const uid = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const slugify = s => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || uid();
function uniqueSlug(col, base, id) {
  let slug = slugify(base), n = 2;
  while (db[col].some(x => x.slug === slug && x.id !== id)) slug = `${slugify(base)}-${n++}`;
  return slug;
}

/* ---------------- Sessions ---------------- */
const sessions = new Map(); // token -> expires
const SESSION_MS = 7 * 24 * 3600 * 1000;
const loginAttempts = new Map(); // ip -> {count, until}
function getCookie(req, name) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function isAuthed(req) {
  const t = getCookie(req, 'lumi_admin');
  const exp = t && sessions.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(t); return false; }
  return true;
}

/* ---------------- Helpers ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.csv': 'text/csv; charset=utf-8',
};
function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Dữ liệu quá lớn'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(Object.assign(new Error('JSON không hợp lệ'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
const str = (v, max = 5000) => (v == null ? '' : String(v)).trim().slice(0, max);
const num = v => { const n = Number(String(v ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0; };

function serveStatic(req, res, urlPath) {
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(urlPath)));
  if (!file.startsWith(PUBLIC)) return send(res, 403, { error: 'Forbidden' });
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    const nf = path.join(PUBLIC, '404.html');
    return fs.existsSync(nf) ? send(res, 404, fs.readFileSync(nf), { 'Content-Type': MIME['.html'] }) : send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
  }
  const ext = path.extname(file).toLowerCase();
  const cache = ['.html', '.css', '.js', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=86400';
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': cache });
  fs.createReadStream(file).pipe(res);
}

/* ---------------- Sanitizers per collection ---------------- */
const lines = v => (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => str(x, 500)).filter(Boolean);
const SANITIZE = {
  tours(b, old = {}) {
    const t = {
      title: str(b.title, 200), code: str(b.code, 40), category: ['china', 'asia', 'domestic', 'other'].includes(b.category) ? b.category : 'china',
      destination: str(b.destination, 100), departFrom: str(b.departFrom, 100), days: str(b.days, 40), hotel: str(b.hotel, 100),
      transport: str(b.transport, 150), highlights: str(b.highlights, 600), schedule: str(b.schedule, 120), tag: str(b.tag, 30),
      price: num(b.price), oldPrice: num(b.oldPrice), rating: Math.min(5, Math.max(0, num(b.rating) || 5)),
      summary: str(b.summary, 2000), images: lines(b.images).slice(0, 12),
      itinerary: (Array.isArray(b.itinerary) ? b.itinerary : []).slice(0, 30).map(d => ({ title: str(d.title, 200), content: str(d.content, 5000) })).filter(d => d.title || d.content),
      departures: (Array.isArray(b.departures) ? b.departures : []).slice(0, 60).map(d => ({ date: str(d.date, 40), airline: str(d.airline, 60), price: num(d.price), seats: num(d.seats) })).filter(d => d.date),
      includes: lines(b.includes), excludes: lines(b.excludes), childPolicy: lines(b.childPolicy), notes: lines(b.notes),
      featured: !!b.featured, published: b.published !== false,
    };
    if (!t.title) throw Object.assign(new Error('Tên tour không được để trống'), { status: 400 });
    return t;
  },
  destinations(b) {
    const d = { name: str(b.name, 100), region: ['china', 'asia', 'domestic', 'other'].includes(b.region) ? b.region : 'china', image: str(b.image, 500), featured: b.featured !== false, order: num(b.order) };
    if (!d.name) throw Object.assign(new Error('Tên điểm đến không được để trống'), { status: 400 });
    return d;
  },
  posts(b) {
    const p = { title: str(b.title, 200), excerpt: str(b.excerpt, 400), image: str(b.image, 500), content: str(b.content, 50000), published: b.published !== false };
    if (!p.title) throw Object.assign(new Error('Tiêu đề không được để trống'), { status: 400 });
    return p;
  },
  reviews(b) {
    const r = { name: str(b.name, 80), trip: str(b.trip, 120), text: str(b.text, 1000), rating: Math.min(5, Math.max(1, num(b.rating) || 5)), published: b.published !== false };
    if (!r.name || !r.text) throw Object.assign(new Error('Cần tên và nội dung đánh giá'), { status: 400 });
    return r;
  },
  bookings(b, old = {}) {
    return { ...old, status: BOOKING_STATUS.includes(b.status) ? b.status : old.status || 'new', adminNote: str(b.adminNote ?? old.adminNote, 2000) };
  },
  subscribers(b) { return { email: str(b.email, 120) }; },
};

const tourSummary = t => ({
  id: t.id, slug: t.slug, title: t.title, code: t.code, category: t.category, destination: t.destination, departFrom: t.departFrom,
  days: t.days, price: t.price, oldPrice: t.oldPrice, schedule: t.schedule, tag: t.tag, rating: t.rating, image: t.images[0] || '',
  featured: t.featured, highlights: t.highlights,
});
const publicSettings = () => { const { ...s } = db.settings; return s; };

/* ---------------- Router ---------------- */
async function handleApi(req, res, url) {
  const p = url.pathname.replace(/\/+$/, '');
  const m = req.method;

  // ----- Public -----
  if (m === 'GET' && p === '/api/site') {
    return send(res, 200, {
      settings: publicSettings(),
      tours: db.tours.filter(t => t.published).map(tourSummary),
      destinations: db.destinations.filter(d => d.featured).sort((a, b) => a.order - b.order),
      posts: db.posts.filter(x => x.published).map(({ content, ...x }) => x).sort((a, b) => b.createdAt - a.createdAt),
      reviews: db.reviews.filter(r => r.published),
    });
  }
  let mm;
  if (m === 'GET' && (mm = p.match(/^\/api\/tours\/([\w-]+)$/))) {
    const t = db.tours.find(x => x.slug === mm[1] && x.published);
    if (!t) return send(res, 404, { error: 'Không tìm thấy tour' });
    const related = db.tours.filter(x => x.published && x.id !== t.id && (x.category === t.category)).slice(0, 4).map(tourSummary);
    return send(res, 200, { tour: t, related, settings: publicSettings() });
  }
  if (m === 'GET' && (mm = p.match(/^\/api\/posts\/([\w-]+)$/))) {
    const post = db.posts.find(x => x.slug === mm[1] && x.published);
    if (!post) return send(res, 404, { error: 'Không tìm thấy bài viết' });
    return send(res, 200, { post, settings: publicSettings(), more: db.posts.filter(x => x.published && x.id !== post.id).slice(0, 3).map(({ content, ...x }) => x) });
  }
  if (m === 'POST' && p === '/api/bookings') {
    const b = await readBody(req, 20000);
    if (b.website) return send(res, 200, { ok: true }); // honeypot chống spam
    const name = str(b.name, 80), phone = str(b.phone, 20);
    if (!name || !/^[0-9 +().-]{8,20}$/.test(phone)) return send(res, 400, { error: 'Vui lòng nhập họ tên và số điện thoại hợp lệ' });
    const tour = db.tours.find(t => t.id === b.tourId);
    const adults = Math.max(1, Math.min(99, num(b.adults) || 1)), children = Math.max(0, Math.min(99, num(b.children)));
    const dep = tour && tour.departures.find(d => d.date === b.date);
    const unit = dep ? dep.price : tour ? tour.price : 0;
    const booking = {
      id: uid(), tourId: tour ? tour.id : '', tourTitle: tour ? tour.title : str(b.tourTitle, 200), name, phone,
      email: str(b.email, 120), date: str(b.date, 40), adults, children, note: str(b.note, 1000),
      total: unit * adults + Math.round(unit * 0.75 / 1000) * 1000 * children, status: 'new', adminNote: '', source: str(b.source, 40), createdAt: Date.now(),
    };
    db.bookings.unshift(booking); save();
    console.log(`• Đơn mới: ${name} — ${phone} — ${booking.tourTitle || 'Tư vấn chung'}`);
    return send(res, 201, { ok: true, id: booking.id });
  }
  if (m === 'POST' && p === '/api/subscribe') {
    const b = await readBody(req, 2000);
    const email = str(b.email, 120).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: 'Email không hợp lệ' });
    if (!db.subscribers.some(s => s.email === email)) { db.subscribers.unshift({ id: uid(), email, createdAt: Date.now() }); save(); }
    return send(res, 200, { ok: true });
  }

  // ----- Auth -----
  if (m === 'POST' && p === '/api/admin/login') {
    const ip = req.socket.remoteAddress;
    const a = loginAttempts.get(ip) || { count: 0, until: 0 };
    if (a.until > Date.now()) return send(res, 429, { error: 'Bạn nhập sai quá nhiều lần, vui lòng thử lại sau 5 phút' });
    const b = await readBody(req, 2000);
    const { hash } = hashPassword(str(b.password, 200), db.auth.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(db.auth.hash, 'hex'))) {
      a.count++; if (a.count >= 5) { a.until = Date.now() + 5 * 60e3; a.count = 0; }
      loginAttempts.set(ip, a);
      return send(res, 401, { error: 'Mật khẩu không đúng' });
    }
    loginAttempts.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `lumi_admin=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_MS / 1000}` });
  }
  if (m === 'POST' && p === '/api/admin/logout') {
    sessions.delete(getCookie(req, 'lumi_admin'));
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'lumi_admin=; HttpOnly; Path=/; Max-Age=0' });
  }
  if (!p.startsWith('/api/admin')) return send(res, 404, { error: 'Không tìm thấy' });
  if (!isAuthed(req)) return send(res, 401, { error: 'Chưa đăng nhập' });

  // ----- Admin -----
  if (m === 'GET' && p === '/api/admin/me') return send(res, 200, { ok: true });
  if (m === 'GET' && p === '/api/admin/stats') {
    const now = Date.now(), day = 864e5;
    const byDay = [...Array(14)].map((_, i) => {
      const start = new Date(now - (13 - i) * day); start.setHours(0, 0, 0, 0);
      const end = start.getTime() + day;
      const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      return { date, count: db.bookings.filter(b => b.createdAt >= start.getTime() && b.createdAt < end).length };
    });
    const topTours = Object.entries(db.bookings.reduce((acc, b) => { if (b.tourTitle) acc[b.tourTitle] = (acc[b.tourTitle] || 0) + 1; return acc; }, {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([title, count]) => ({ title, count }));
    return send(res, 200, {
      tours: db.tours.length, published: db.tours.filter(t => t.published).length,
      bookings: db.bookings.length, newBookings: db.bookings.filter(b => b.status === 'new').length,
      confirmed: db.bookings.filter(b => b.status === 'confirmed').length,
      revenue: db.bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.total || 0), 0),
      subscribers: db.subscribers.length, byDay, topTours, recent: db.bookings.slice(0, 6),
    });
  }
  if (p === '/api/admin/settings') {
    if (m === 'GET') return send(res, 200, db.settings);
    if (m === 'PUT') {
      const b = await readBody(req, 50000);
      const s = db.settings;
      ['companyName', 'brand', 'slogan', 'hotline', 'hotlineName', 'email', 'zalo', 'facebook', 'license', 'heroTitle', 'heroSubtitle', 'aboutText', 'visaText', 'reportPhone']
        .forEach(k => { if (k in b) s[k] = str(b[k], 2000); });
      if (Array.isArray(b.addresses)) s.addresses = b.addresses.slice(0, 10).map(a => ({ label: str(a.label, 80), text: str(a.text, 300), phone: str(a.phone, 40) })).filter(a => a.text);
      if ('heroImages' in b) s.heroImages = lines(b.heroImages).slice(0, 8);
      if (Array.isArray(b.stats)) s.stats = b.stats.slice(0, 4).map(x => ({ value: num(x.value), suffix: str(x.suffix, 6), label: str(x.label, 40) }));
      save();
      return send(res, 200, s);
    }
  }
  if (m === 'POST' && p === '/api/admin/password') {
    const b = await readBody(req, 2000);
    const cur = hashPassword(str(b.current, 200), db.auth.salt).hash;
    if (cur !== db.auth.hash) return send(res, 400, { error: 'Mật khẩu hiện tại không đúng' });
    if (str(b.next, 200).length < 8) return send(res, 400, { error: 'Mật khẩu mới cần ít nhất 8 ký tự' });
    db.auth = hashPassword(str(b.next, 200)); save();
    return send(res, 200, { ok: true });
  }
  if (m === 'POST' && p === '/api/admin/upload') {
    const b = await readBody(req, 12e6);
    const mt = String(b.data || '').match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/);
    if (!mt) return send(res, 400, { error: 'Chỉ nhận ảnh PNG, JPG, WEBP, GIF' });
    const ext = mt[1] === 'jpeg' ? 'jpg' : mt[1];
    const name = `${slugify(path.parse(str(b.name, 80)).name || 'anh')}-${uid()}.${ext}`;
    fs.mkdirSync(UPLOADS, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(mt[2], 'base64'));
    return send(res, 201, { url: '/uploads/' + name });
  }
  if (m === 'GET' && p === '/api/admin/export/bookings.csv') {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Mã', 'Ngày tạo', 'Họ tên', 'SĐT', 'Email', 'Tour', 'Ngày đi', 'Người lớn', 'Trẻ em', 'Tạm tính', 'Trạng thái', 'Ghi chú khách', 'Ghi chú nội bộ']]
      .concat(db.bookings.map(b => [b.id, new Date(b.createdAt).toLocaleString('vi-VN'), b.name, b.phone, b.email, b.tourTitle, b.date, b.adults, b.children, b.total, b.status, b.note, b.adminNote]));
    return send(res, 200, '﻿' + rows.map(r => r.map(esc).join(',')).join('\n'), { 'Content-Type': MIME['.csv'], 'Content-Disposition': 'attachment; filename="don-dat-tour.csv"' });
  }

  if ((mm = p.match(/^\/api\/admin\/(\w+)(?:\/([\w-]+))?$/)) && COLLECTIONS.includes(mm[1])) {
    const [, col, id] = mm;
    const list = db[col];
    if (m === 'GET' && !id) return send(res, 200, list);
    const idx = id ? list.findIndex(x => x.id === id) : -1;
    if (id && idx < 0) return send(res, 404, { error: 'Không tìm thấy' });
    if (m === 'GET') return send(res, 200, list[idx]);
    if (m === 'DELETE') { list.splice(idx, 1); save(); return send(res, 200, { ok: true }); }
    if (m === 'POST' && !id && col !== 'bookings') {
      const item = { id: uid(), ...SANITIZE[col](await readBody(req)), createdAt: Date.now(), updatedAt: Date.now() };
      if ('title' in item || col === 'tours') item.slug = uniqueSlug(col, item.title || item.name, item.id);
      list.unshift(item); save();
      return send(res, 201, item);
    }
    if (m === 'PUT' && id) {
      const old = list[idx];
      const item = { ...old, ...SANITIZE[col](await readBody(req), old), updatedAt: Date.now() };
      if ((col === 'tours' || col === 'posts') && !old.slug) item.slug = uniqueSlug(col, item.title, item.id); // giữ nguyên đường dẫn cũ để không hỏng link đã chia sẻ
      list[idx] = item; save();
      return send(res, 200, item);
    }
  }
  return send(res, 404, { error: 'Không tìm thấy' });
}

/* ---------------- Page routes ---------------- */
const PAGES = [
  [/^\/tour\/[\w-]+\/?$/, '/tour.html'],
  [/^\/tours\/?$/, '/tours.html'],
  [/^\/cam-nang\/[\w-]+\/?$/, '/post.html'],
  [/^\/admin\/?$/, '/admin/index.html'],
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    const page = PAGES.find(([re]) => re.test(url.pathname));
    return serveStatic(req, res, page ? page[1] : url.pathname);
  } catch (e) {
    if (!e.status) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : 'Lỗi máy chủ' });
  }
});
server.listen(PORT, () => {
  console.log(`\n  Lumi Travel đang chạy:  http://localhost:${PORT}`);
  console.log(`  Trang quản trị:           http://localhost:${PORT}/admin\n`);
});
