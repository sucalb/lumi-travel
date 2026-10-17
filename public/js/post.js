/* Lumi Travel — Cẩm nang (blog post) */
(async () => {
  const { $, esc, api, reduce } = TS;
  const slug = location.pathname.split('/').filter(Boolean).pop();
  const root = $('#postRoot');
  let data;
  try { data = await api('api/posts/' + encodeURIComponent(slug)); }
  catch {
    const site = await api('api/site').catch(() => null);
    if (site) TS.boot(site.settings, { solid: true });
    root.innerHTML = `<section class="notfound"><h1>404</h1><p>Bài viết không tồn tại.</p><a class="btn btn--gold" href="./#blog">Xem cẩm nang khác</a></section>`;
    return;
  }
  const { post: p, more, settings } = data;
  document.title = p.title + ' — Lumi Travel';
  const paras = p.content.split(/\n{2,}/).map(par => `<p>${esc(par).replace(/\n/g, '<br>')}</p>`).join('');
  root.innerHTML = `
    <section class="page-hero page-hero--post">
      <div class="page-hero__bg" style="background-image:url('${esc(p.image)}')"></div>
      <div class="container page-hero__inner">
        <nav class="crumbs"><a href="./">Trang chủ</a><span>/</span><a href="./#blog">Cẩm nang</a></nav>
        <h1 class="page-hero__title" id="postTitle">${esc(p.title)}</h1>
        <p class="page-hero__sub">${new Date(p.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </section>
    <article class="article container">
      <p class="article__lead" data-reveal>${esc(p.excerpt)}</p>
      <div class="article__body" data-stagger>${paras}</div>
      <div class="article__cta" data-reveal><b>Bạn muốn đi Trung Quốc?</b><span>Lumi Travel tư vấn lịch trình & visa miễn phí.</span><a href="tours?cat=china" class="btn btn--gold" data-magnetic>Xem tour Trung Quốc</a></div>
    </article>
    ${more.length ? `<section class="section blog"><div class="container"><div class="section-head"><h2 class="section-title" data-reveal-words>Đọc thêm <em class="script">cẩm nang</em></h2></div>
      <div class="blog__grid blog__grid--3" data-stagger>${more.map(m => `<a class="post" href="cam-nang/${esc(m.slug)}" data-cursor="Đọc"><div class="post__img"><img src="${esc(m.image)}" alt="${esc(m.title)}" loading="lazy" /></div><div class="post__body"><h3>${esc(m.title)}</h3><p>${esc(m.excerpt)}</p></div></a>`).join('')}</div></div></section>` : ''}`;
  TS.boot(settings, { solid: true });
  TS.reveal();
  TS.initMagnetic();
  if (reduce) return;
  gsap.timeline()
    .from('.page-hero__bg', { scale: 1.3, duration: 2, ease: 'expo.out' }, 0)
    .from(TS.splitWords($('#postTitle')), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .04 }, .1)
    .from('.crumbs, .page-hero__sub', { y: 20, opacity: 0, duration: .8, stagger: .1 }, .3);
  gsap.to('.page-hero__bg', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } });
})();
