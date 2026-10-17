// Xuất bản website tĩnh cho GitHub Pages (không gồm trang quản trị).
// Chạy: BASE=/lumi-travel/ node scripts/build-static.js   → thư mục dist/
// Dữ liệu lấy từ data/db.json nếu có, nếu không thì từ data/seed.js.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'dist');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');

const dbFile = path.join(ROOT, 'data', 'db.json');
const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : require('../data/seed.js');

// Ảnh tải lên lưu dạng "/uploads/..." → đổi sang đường dẫn tương đối để chạy dưới BASE
const rel = v => JSON.parse(JSON.stringify(v).replace(/"\/uploads\//g, '"uploads/'));

const tourSummary = t => ({
  id: t.id, slug: t.slug, title: t.title, code: t.code, category: t.category, destination: t.destination, departFrom: t.departFrom,
  days: t.days, price: t.price, oldPrice: t.oldPrice, schedule: t.schedule, tag: t.tag, rating: t.rating, image: t.images[0] || '',
  featured: t.featured, highlights: t.highlights,
});
const settings = db.settings;
const tours = db.tours.filter(t => t.published);
const posts = (db.posts || []).filter(p => p.published).sort((a, b) => b.createdAt - a.createdAt);

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(PUBLIC, OUT, { recursive: true, filter: src => !src.startsWith(path.join(PUBLIC, 'admin')) });

const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(rel(data))); };

write(path.join(OUT, 'data/site.json'), {
  settings, tours: tours.map(tourSummary),
  destinations: (db.destinations || []).filter(d => d.featured).sort((a, b) => a.order - b.order),
  posts: posts.map(({ content, ...p }) => p),
  reviews: (db.reviews || []).filter(r => r.published),
});
tours.forEach(t => write(path.join(OUT, `data/tours/${t.slug}.json`), {
  tour: t, settings, related: tours.filter(x => x.id !== t.id && x.category === t.category).slice(0, 4).map(tourSummary),
}));
posts.forEach(p => write(path.join(OUT, `data/posts/${p.slug}.json`), {
  post: p, settings, more: posts.filter(x => x.id !== p.id).slice(0, 3).map(({ content, ...x }) => x),
}));

// HTML: đặt <base> theo đường dẫn Pages và bật chế độ tĩnh
const html = name => fs.readFileSync(path.join(PUBLIC, name), 'utf8')
  .replace('<base href="/" />', `<base href="${BASE}" />\n  <script>window.TS_STATIC = true</script>`);
['index.html', 'tours.html', '404.html'].forEach(n => write(path.join(OUT, n), html(n)));
fs.rmSync(path.join(OUT, 'tour.html')); fs.rmSync(path.join(OUT, 'post.html'));
// GitHub Pages phục vụ "tour/abc" từ file "tour/abc.html"
tours.forEach(t => write(path.join(OUT, `tour/${t.slug}.html`), html('tour.html')));
posts.forEach(p => write(path.join(OUT, `cam-nang/${p.slug}.html`), html('post.html')));
write(path.join(OUT, '.nojekyll'), '');

console.log(`Đã xuất ${tours.length} tour, ${posts.length} bài viết vào dist/ (base ${BASE})`);
