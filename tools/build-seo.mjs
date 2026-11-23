// Генератор SEO-страниц: node tools/build-seo.mjs
// Создаёт /uslugi/, /uslugi/<услуга>/, /uslugi/<услуга>/<город>/, /goroda/<город>/, /audit/ и sitemap.xml
import fs from 'node:fs';
import path from 'node:path';
import { CITIES, SERVICES, COMP, AI_PACKS, AI_EXAMPLES, LOVE_PACK, CASES } from './data.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://go-work.kz';
const WA = 'https://wa.me/77783244440?text=' + encodeURIComponent('Здравствуйте! Хочу бесплатный аудит сайта');
const TODAY = new Date().toISOString().slice(0, 10);
const pages = [{ loc: '/', pr: '1.0' }];
const QA = []; // короткие ответы со всех страниц: для /voprosy/, llms.txt и llms-full.txt (GEO/AEO)
const ALLFAQ = []; // все вопросы и ответы сайта

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const WA_ICO = '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>';
const waBtn = (label = 'Бесплатный аудит сайта', cls = 'btn-lg', text) =>
  `<a class="btn btn-wa ${cls} js-wa" href="${text ? 'https://wa.me/77783244440?text=' + encodeURIComponent(text) : WA}" target="_blank" rel="noopener"><span class="btn-shine"></span>${WA_ICO}<span>${label}</span></a>`;
const tg = (n) => n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ');

function layout({ url, title, desc, h1, kicker, lead, crumbs, body, jsonld = [], cta = [], answer = '', lang = 'ru' }) {
  if (answer) QA.push([title.replace(/ \| GO-WORK\.KZ$/, ''), answer, url]);
  const canonical = SITE + url;
  const bc = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + c[1] })),
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <script>document.documentElement.classList.add("js")</script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>if(location.hostname.indexOf("www.")===0)location.replace("https://go-work.kz"+location.pathname+location.search+location.hash)</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#f1f1f1">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GO-WORK.KZ">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${SITE}/assets/img/og.png">
  <meta property="og:locale" content="ru_RU">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/img/gw-icon-96.png" type="image/png" sizes="96x96">
  <link rel="icon" href="/assets/img/gw-icon-48.png" type="image/png" sizes="48x48">
  <link rel="icon" href="/assets/img/gw-icon-192.png" type="image/png" sizes="192x192">
  <link rel="shortcut icon" href="/assets/img/gw-favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap"></noscript>
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="stylesheet" href="/assets/css/pages.css">
${[bc, ...jsonld].map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body class="page">
  <div class="bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><div class="grid-lines"></div><div class="noise"></div></div>

  <header class="nav" id="nav">
    <a href="/" class="logo"><span class="logo-mark">G</span><span class="logo-text">GO-WORK<span class="accent">.KZ</span></span></a>
    <nav class="nav-links" id="navLinks">
      <a href="/uslugi/">Услуги</a>
      <a href="/ai-roliki/">ИИ-ролики</a>
      <a href="/goroda/">Города</a>
      <a href="/#portfolio">Портфолио</a>
      <a href="/audit/">Аудит</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <a class="btn btn-wa btn-sm js-wa" href="${WA}" target="_blank" rel="noopener" aria-label="Аудит, бесплатный аудит сайта в WhatsApp">${WA_ICO}<span>Аудит</span></a>
    <button class="burger" id="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
  </header>

  <main>
    <section class="p-hero">
      <div class="container">
        <nav class="crumbs reveal" aria-label="Хлебные крошки">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`).join('<i>/</i>')}</nav>
        <p class="kicker reveal">${esc(kicker)}</p>
        <h1 class="p-title reveal">${h1}</h1>
        <p class="p-lead reveal">${lead}</p>
${answer ? `        <div class="p-answer reveal" data-aeo><b>${lang === 'en' ? 'In short' : 'Коротко'}</b><p>${answer}</p></div>
` : ''}        <div class="hero-cta reveal">${waBtn(cta[0], 'btn-lg', cta[1])}<a class="btn btn-ghost btn-lg" href="#details"><span>${cta[2] || 'Подробнее'}</span></a></div>
      </div>
    </section>
${body}
    <section class="final">
      <div class="container">
        <div class="final-box reveal">
          <div class="final-glow" aria-hidden="true"></div>
          <h2>Узнайте, сколько заявок<br>вы <span class="grad-text">теряете</span> прямо сейчас</h2>
          <p>Бесплатный аудит сайта за 24 часа. Без обязательств.</p>
          ${waBtn('Получить аудит в WhatsApp', 'btn-xl pulse')}
        </div>
      </div>
    </section>
  </main>

  <footer class="footer p-footer">
    <div class="container">
      <section class="f-contact" aria-labelledby="fContactT" itemscope itemtype="https://schema.org/ProfessionalService">
        <meta itemprop="name" content="GO-WORK.KZ"><link itemprop="url" href="https://go-work.kz/">
        <div class="fc-head">
          <span class="fc-kicker">Контакты</span>
          <p class="fc-title" id="fContactT">Обсудим ваш проект?</p>
          <p>Алихан Сейилбек, сайты, SEO, реклама и ИИ-ролики для бизнеса.</p>
          <a class="fc-btn js-wa" href="${WA}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg><span>Написать в WhatsApp</span></a>
        </div>
        <div class="fc-grid">
          <a class="fc-tile" href="tel:+77783244440"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg></i><small>Телефон и WhatsApp</small><b itemprop="telephone">+7 778 324 44 40</b></a>
          <a class="fc-tile" href="https://2gis.kz/astana/geo/70000001119705288" target="_blank" rel="noopener" itemprop="hasMap"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/></svg></i><small>Адрес</small><b itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="addressLocality">Астана</span><meta itemprop="addressCountry" content="KZ"></b><em>Маршрут в 2ГИС ↗</em></a>
          <a class="fc-tile" href="https://www.instagram.com/alikhan_seiilbek/" target="_blank" rel="noopener"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01"/></svg></i><small>Instagram</small><b>@alikhan_seiilbek</b><em>Работы и ролики ↗</em></a>
          <div class="fc-tile"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg></i><small>География</small><b>Весь Казахстан и СНГ</b><em>Работаем онлайн</em></div>
        </div>
      </section>
      <div class="f-cols">
        <div>
          <a href="/" class="logo"><span class="logo-mark">G</span><span class="logo-text">GO-WORK<span class="accent">.KZ</span></span></a>
          <p class="f-note">Сайты с ИИ, SEO в Google и Яндекс, контекстная реклама для бизнеса в Казахстане.</p>
          <div class="footer-links"><a href="https://www.instagram.com/alikhan_seiilbek/" target="_blank" rel="noopener">Instagram</a><a href="https://2gis.kz/astana/geo/70000001119705288" target="_blank" rel="noopener">2ГИС</a><a class="js-wa" href="${WA}" target="_blank" rel="noopener">WhatsApp</a></div>
          <p class="f-note"><a class="tel-link" href="tel:+77783244440">+7 778 324 44 40</a></p>
        </div>
        <div><b>Услуги</b>${SERVICES.map((s) => `<a href="/uslugi/${s.slug}/">${s.name}</a>`).join('')}<a href="/ai-roliki/">ИИ-ролики для бизнеса</a><a href="/ai-roliki/love-story/">ИИ-ролик Love Story</a><a href="/zakazat-sayt/">Заказать сайт</a><a href="/audit/">Бесплатный аудит</a></div>
        <div><b>Города</b><div class="f-cities">${CITIES.map((c) => `<a href="/goroda/${c.slug}/">${c.name}</a>`).join('')}</div></div>
      </div>
      <small>© ${new Date().getFullYear()} go-work.kz</small>
    </div>
  </footer>

  <a class="wa-float js-wa" href="${WA}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp"><span class="wa-ring"></span><span class="wa-ring d2"></span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg><span class="wa-tip">Бесплатный аудит</span></a>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="ico-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.92-4.64-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2 .07.14.11.3.02.48-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.14-.28.28-.12.55.16.27.7 1.16 1.51 1.88 1.04.93 1.92 1.21 2.19 1.35.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z"/></symbol></svg>
  <script src="/assets/js/page.js" defer></script>
  <script src="/assets/js/analytics.js" defer></script>
</body>
</html>
`;
}

function write(url, html, pr = '0.7') {
  const dir = path.join(ROOT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  pages.push({ loc: url, pr });
}

const faqLd = (faq, url = '') => (faq.forEach(([q, a]) => ALLFAQ.push([q, a, url])), {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
const serviceLd = (s, c, url, desc) => ({
  '@context': 'https://schema.org', '@type': 'Service',
  name: c ? `${s.name} ${c.loc}` : s.name, serviceType: s.name, description: desc, url: SITE + url,
  areaServed: c ? { '@type': 'City', name: c.name } : { '@type': 'Country', name: 'Казахстан' },
  provider: { '@type': 'ProfessionalService', name: 'GO-WORK.KZ', url: SITE + '/', image: SITE + '/assets/img/og.png', sameAs: ['https://www.instagram.com/alikhan_seiilbek/', 'https://2gis.kz/astana/geo/70000001119705288'] },
});

/* ---------- блоки ---------- */
const sec = (id, kicker, title, inner, cls = '') =>
  `    <section class="section p-sec ${cls}"${id ? ` id="${id}"` : ''}>
      <div class="container">
        <div class="section-head"><p class="kicker reveal">${kicker}</p><h2 class="reveal">${title}</h2></div>
${inner}
      </div>
    </section>
`;
const benefitsBlock = (s) => `        <div class="cards p-cards">${s.benefits.map(([t, d], i) => `<article class="card reveal"><div class="card-ico ic-${(i % 4) + 1}">${['◆', '✦', '▲', '●'][i % 4]}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`;
const includesBlock = (s) => `        <ul class="p-checks reveal">${s.includes.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const stepsBlock = (s) => `        <ol class="steps p-steps">${s.steps.map(([t, d], i) => `<li class="step reveal"><span class="step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`;
const priceBlock = (s) => `        <div class="p-two reveal"><div class="p-box"><h3>Стоимость зависит от</h3><ul class="p-dots">${s.price.map((x) => `<li>${x}</li>`).join('')}</ul><p class="p-muted">Точную цену называю после бесплатного аудита, без скрытых платежей.</p></div><div class="p-box"><h3>Сроки</h3><p>${s.time}</p><div class="p-cta-inline">${waBtn('Рассчитать стоимость', 'btn-sm')}</div></div></div>`;
const faqBlock = (faq) => `        <div class="faq narrow">${faq.map(([q, a]) => `<details class="reveal"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`;
const chips = (items) => `<div class="p-chips">${items.map(([t, u, on]) => on ? `<span class="chip on">${t}</span>` : `<a class="chip" href="${u}">${t}</a>`).join('')}</div>`;

/* ---------- страница услуги (хаб) ---------- */
for (const s of SERVICES) {
  const url = `/uslugi/${s.slug}/`;
  const desc = s.desc(null);
  const body =
    sec('details', 'Почему это работает', `Что вы <span class="grad-text">получаете</span>`, benefitsBlock(s)) +
    sec('', 'Состав работ', `Что <span class="grad-text">входит</span> в услугу`, includesBlock(s)) +
    sec('', 'Как работаю', `Этапы <span class="grad-text">работы</span>`, stepsBlock(s)) +
    sec('', 'Цена и сроки', `Сколько стоит и <span class="grad-text">сколько ждать</span>`, priceBlock(s)) +
    sec('', 'География', `${s.short} в <span class="grad-text">городах Казахстана</span>`,
      `        <p class="p-text reveal">Работаю удалённо по всему Казахстану. Выберите свой город, расскажу, как ${s.what} работает именно там.</p>\n        ${chips(CITIES.map((c) => [c.name, `/uslugi/${s.slug}/${c.slug}/`]))}`) +
    sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(s.faq)) +
    sec('', 'Ещё услуги', `Другие <span class="grad-text">услуги</span>`, `        ${chips(SERVICES.filter((x) => x !== s).map((x) => [x.name, `/uslugi/${x.slug}/`]))}`);
  write(url, layout({
    url, title: s.title(null), desc,
    h1: `${s.hubH1[0]} <span class="grad-text">${s.hubH1[1]}</span>`,
    kicker: 'Услуга · Казахстан', lead: s.lead,
    answer: `${s.name} в Казахстане: GO-WORK.KZ, Алихан Сейилбек. ${s.time} Стоимость называю после бесплатного аудита за 24 часа и фиксирую в договоре. Работаю удалённо по всему Казахстану, связь в WhatsApp +7 778 324 44 40.`,
    crumbs: [['Главная', '/'], ['Услуги', '/uslugi/'], [s.name, url]],
    body, jsonld: [serviceLd(s, null, url, desc), faqLd(s.faq, url)],
  }), '0.9');

  /* ---------- услуга × город ---------- */
  CITIES.forEach((c, ci) => {
    const curl = `/uslugi/${s.slug}/${c.slug}/`;
    const cdesc = s.desc(c);
    const [h1a, h1b] = s.cityH1(c);
    const faq = [s.cityFaq(c), [`Работаете ли вы ${c.loc}?`, `Да. Работаю с бизнесом ${c.loc} удалённо: все обсуждения, в WhatsApp и созвонах, отчёты и доступы, онлайн. Выезд не нужен, а результат вы видите в цифрах.`], ...s.faq.slice(0, 3)];
    // порядок блоков слегка меняется, чтобы страницы не были копиями
    const blocks = [
      sec('', 'Состав работ', `Что входит в работу <span class="grad-text">${c.loc}</span>`, includesBlock(s)),
      sec('', 'Как работаю', `Этапы <span class="grad-text">работы</span>`, stepsBlock(s)),
      sec('', 'Почему это работает', `Что получит ваш <span class="grad-text">бизнес</span>`, benefitsBlock(s)),
    ];
    const order = ci % 3 === 0 ? [0, 1, 2] : ci % 3 === 1 ? [2, 0, 1] : [1, 2, 0];
    const body =
      sec('details', `${c.name} · особенности`, `${s.short} ${c.loc}: <span class="grad-text">что важно знать</span>`,
        `        <div class="p-two reveal"><div class="p-box p-city"><h3>${c.name}</h3><p>${cap(c.name)}, ${c.about}. ${s.slug === 'yandex-direct' && c.ya ? 'Реклама показывается в поиске Яндекса и на тысячах сайтов рекламной сети.' : s.lead.split('. ').slice(1).join('. ')}</p></div><div class="p-box"><h3>Как я работаю ${c.loc}</h3><p>${s.local(c)}</p></div></div>
        <p class="p-text reveal">Ниши ${c.loc}, где особенно хорошо работает ${s.what}:</p>
        <ul class="p-checks p-niches reveal">${c.niches.map((n) => `<li>${cap(n)}</li>`).join('')}</ul>`) +
      order.map((i) => blocks[i]).join('') +
      sec('', 'Цена и сроки', `Сколько стоит ${s.what} <span class="grad-text">${c.loc}</span>`, priceBlock(s)) +
      sec('', 'Вопросы', `Вопросы о работе <span class="grad-text">${c.loc}</span>`, faqBlock(faq)) +
      sec('', 'Рядом', `${s.short} в <span class="grad-text">других городах</span>`,
        `        ${chips(CITIES.map((x) => [x.name, `/uslugi/${s.slug}/${x.slug}/`, x === c]))}`) +
      sec('', c.name, `Другие услуги <span class="grad-text">${c.loc}</span>`,
        `        ${chips(SERVICES.map((x) => [x.name, `/uslugi/${x.slug}/${c.slug}/`, x === s]))}\n        <p class="p-text reveal"><a class="p-link" href="/goroda/${c.slug}/">Все услуги ${c.loc} →</a></p>`);
    write(curl, layout({
      url: curl, title: s.title(c).length > 70 ? `${s.short} ${c.loc} | GO-WORK.KZ` : s.title(c), desc: cdesc,
      h1: `${h1a} <span class="grad-text">${h1b}</span>`,
      kicker: `${s.name} · ${c.name}`,
      lead: `${s.lead.split('. ')[0]}. Работаю с бизнесом ${c.loc}, бесплатный аудит и расчёт за 24 часа.`,
      answer: `${h1a} ${h1b}: GO-WORK.KZ (Алихан Сейилбек), работа удалённо, связь в WhatsApp +7 778 324 44 40. ${s.time} Цена называется после бесплатного аудита за 24 часа. Кейсы: ne-ti.kz в ТОП-3 Google за 1 месяц, BuhTask в ТОП-3 за 2 месяца.`,
      crumbs: [['Главная', '/'], ['Услуги', '/uslugi/'], [s.name, url], [c.name, curl]],
      body, jsonld: [serviceLd(s, c, curl, cdesc), faqLd(faq, curl)],
    }), '0.6');
  });
}

/* ---------- страницы городов ---------- */
for (const c of CITIES) {
  const url = `/goroda/${c.slug}/`;
  const desc = `Разработка сайтов, SEO-продвижение, контекстная реклама и таргет для бизнеса ${c.loc}: сайты с ИИ, Google и Яндекс, Instagram и TikTok. Бесплатный аудит сайта за 24 часа.`;
  const body =
    sec('details', 'Услуги', `Что я делаю для бизнеса <span class="grad-text">${c.loc}</span>`,
      `        <div class="cards p-cards p-svc">${SERVICES.map((s, i) => `<a class="card reveal" href="/uslugi/${s.slug}/${c.slug}/"><div class="card-ico ic-${(i % 4) + 1}">${s.icon}</div><h3>${s.name}</h3><p>${s.desc(c).split(':')[0]}.</p><span class="p-more">Подробнее →</span></a>`).join('')}</div>`) +
    sec('', 'Рынок', `Особенности рынка <span class="grad-text">${c.loc}</span>`,
      `        <div class="p-two reveal"><div class="p-box p-city"><h3>${c.name}</h3><p>${cap(c.name)}, ${c.about}. ${COMP[c.comp]}</p></div><div class="p-box"><h3>Поисковые системы</h3><p>${c.ya ? `${cap(c.loc)} заметная часть пользователей ищет в Яндексе, поэтому продвигаю сайт сразу в двух системах: Google и Яндекс.` : `${cap(c.loc)} большинство клиентов ищет в Google, а Яндекс даёт дополнительную аудиторию, за которую мало кто борется.`}</p></div></div>
        <p class="p-text reveal">Ниши, где ${c.loc} хорошо работает интернет-продвижение:</p>
        <ul class="p-checks p-niches reveal">${c.niches.map((n) => `<li>${cap(n)}</li>`).join('')}</ul>`) +
    sec('', 'Другие города', `Работаю по всему <span class="grad-text">Казахстану</span>`, `        ${chips(CITIES.map((x) => [x.name, `/goroda/${x.slug}/`, x === c]))}`);
  write(url, layout({
    url, title: `Разработка сайтов, SEO и реклама ${c.loc} | GO-WORK.KZ`, desc,
    h1: `Сайты, SEO и реклама <span class="grad-text">${c.loc}</span>`,
    kicker: `${c.name} · Казахстан`,
    lead: `Привожу заявки малому бизнесу ${c.loc}: разработка сайтов и платформ с ИИ, SEO-продвижение в Google и Яндекс, контекстная реклама и таргет.`,
    crumbs: [['Главная', '/'], ['Города', '/goroda/'], [c.name, url]],
    body,
  }), '0.7');
}

/* ---------- индекс городов ---------- */
write('/goroda/', layout({
  url: '/goroda/', title: 'Разработка сайтов, SEO и реклама по всему Казахстану | GO-WORK.KZ',
  desc: 'Разработка сайтов, SEO-продвижение, контекстная реклама и таргет в 20 городах Казахстана: Астана, Алматы, Шымкент, Караганда и другие.',
  h1: 'Работаю по всему <span class="grad-text">Казахстану</span>', kicker: 'География',
  lead: 'Удалённо, но с учётом особенностей каждого города: конкуренции, поисковых систем и местных карт.',
  crumbs: [['Главная', '/'], ['Города', '/goroda/']],
  body: sec('details', '20 городов', `Выберите <span class="grad-text">свой город</span>`,
    `        <div class="p-citygrid">${CITIES.map((c) => `<a class="p-citycard reveal" href="/goroda/${c.slug}/"><b>${c.name}</b><span>${cap(c.about)}</span></a>`).join('')}</div>`),
}), '0.8');

/* ---------- индекс услуг ---------- */
write('/uslugi/', layout({
  url: '/uslugi/', title: 'Услуги: разработка сайтов, SEO, контекстная реклама и таргет | GO-WORK.KZ',
  desc: 'Все услуги GO-WORK.KZ: разработка сайтов и платформ с ИИ, SEO-продвижение в Google и Яндекс, контекстная реклама, Google Ads, Яндекс Директ и таргет для бизнеса в Казахстане.',
  h1: 'Услуги, которые <span class="grad-text">приводят клиентов</span>', kicker: 'Услуги',
  lead: 'Каждая услуга, отдельный инструмент получения заявок. Вместе они дают максимальный результат.',
  crumbs: [['Главная', '/'], ['Услуги', '/uslugi/']],
  body: sec('details', `${SERVICES.length} направлений`, `Выберите <span class="grad-text">услугу</span>`,
    `        <div class="cards p-cards p-svc">${SERVICES.map((s, i) => `<a class="card reveal" href="/uslugi/${s.slug}/"><div class="card-ico ic-${(i % 4) + 1}">${s.icon}</div><h3>${s.name}</h3><p>${s.lead}</p><span class="p-more">Подробнее →</span></a>`).join('')}</div>`) +
    sec('', 'Бесплатно', `Начните с <span class="grad-text">аудита</span>`, `        <p class="p-text reveal">Не знаете, что выбрать? Бесплатный аудит покажет, где вы теряете клиентов. <a class="p-link" href="/audit/">Что входит в аудит →</a></p>`),
}), '0.9');

/* ---------- аудит ---------- */
const auditFaq = [
  ['Аудит правда бесплатный?', 'Да. Вы ничего не обязаны покупать после аудита это способ показать мой подход и пользу.'],
  ['Сколько ждать результат?', 'Обычно до 24 часов в рабочие дни. Отчёт приходит в WhatsApp.'],
  ['Что нужно от меня?', 'Только ссылка на сайт, город и ниша. Если сайта нет, разберу конкурентов и спрос в поиске.'],
  ['Подойдёт ли аудит для сайта на конструкторе?', 'Да, проверяю сайты на любых платформах: Tilda, Wix, WordPress, Lovable и других.'],
];
write('/audit/', layout({
  url: '/audit/', title: 'Бесплатный аудит сайта за 24 часа | GO-WORK.KZ',
  desc: 'Бесплатный аудит сайта: скорость, мобильная версия, SEO-ошибки, индексация в Google и Яндекс, конкуренты и план роста заявок. Ответ в WhatsApp за 24 часа.',
  h1: 'Бесплатный <span class="grad-text">аудит сайта</span>', kicker: 'Бесплатно · 24 часа',
  lead: 'Покажу, где сайт теряет клиентов, и дам конкретный список шагов для роста заявок из Google и Яндекса.',
  crumbs: [['Главная', '/'], ['Аудит сайта', '/audit/']],
  body: sec('details', 'Что проверяю', `Что входит в <span class="grad-text">аудит</span>`,
    `        <ul class="p-checks reveal">${['Скорость загрузки на телефоне и компьютере', 'Мобильная версия и удобство', 'Технические ошибки SEO', 'Индексация в Google и Яндекс', 'Заголовки, мета-теги и структура', 'Карточки в Google Maps, Яндекс Картах и 2ГИС', 'Сравнение с 3 конкурентами', 'Список конкретных шагов по приоритету'].map((x) => `<li>${x}</li>`).join('')}</ul>`) +
    sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(auditFaq)),
  jsonld: [faqLd(auditFaq, "/audit/")],
}), '0.9');


/* ---------- заказать сайт (запросы «заказать сайт», «сайт под ключ», «разработка сайтов казахстан») ---------- */
{
  const url = '/zakazat-sayt/';
  const desc = 'Заказать сайт под ключ в Казахстане: лендинг от 7 дней, сайт компании за 2–3 недели. Дизайн, тексты, SEO-структура, ИИ-ассистент и заявки в WhatsApp. Расчёт стоимости за 24 часа.';
  const kinds = [
    ['Лендинг', 'Одна страница под одну услугу или рекламу. Запуск от 7 дней.'],
    ['Сайт компании', 'Отдельные страницы под каждую услугу и город, основа для SEO. 2–3 недели.'],
    ['Каталог и интернет-магазин', 'Товары, фильтры, корзина и оплата, выгрузка в Kaspi и CRM по задаче.'],
    ['Платформа с ИИ', 'Личный кабинет, калькуляторы, онлайн-запись и ИИ-ассистент 24/7.'],
  ];
  const order = [['Напишите в WhatsApp', 'Коротко о бизнесе и ссылка на текущий сайт, если он есть.'], ['Аудит и расчёт за 24 часа', 'Пришлю структуру, сроки и стоимость, без скрытых платежей.'], ['Договор и старт', 'Фиксируем объём и сроки, начинаю работу.'], ['Дизайн и тексты', 'Показываю дизайн главных экранов, согласуем.'], ['Запуск и продвижение', 'Публикую сайт, подключаю аналитику и отправляю на индексацию.']];
  const faq = [
    ['Сколько стоит заказать сайт?', 'Зависит от типа сайта, количества страниц и функций. Точную стоимость называю после короткого разговора и бесплатного аудита, фиксирую в договоре.'],
    ['Сколько времени занимает разработка сайта?', 'Лендинг: от 7 дней, сайт компании: 2–3 недели, платформа с личным кабинетом, по техническому заданию.'],
    ['Можно заказать сайт, если я не в Астане или Алматы?', 'Да. Работаю удалённо со всем Казахстаном: обсуждения в WhatsApp и созвонах, доступы и отчёты онлайн.'],
    ['Что нужно от меня, чтобы заказать сайт?', 'Рассказать о бизнесе, услугах и ценах, прислать логотип и фото, если они есть. Тексты и структуру делаю сам.'],
    ['Будет ли сайт продвигаться в Google и Яндексе?', 'Да, SEO-структура закладывается с первого дня: отдельные страницы под услуги, заголовки, микроразметка и карта сайта. Пример, ne-ti.kz вышел в ТОП-3 Google через месяц.'],
  ];
  const body =
    sec('details', 'Что можно заказать', `Какой сайт <span class="grad-text">вам нужен</span>`,
      `        <div class="cards p-cards">${kinds.map(([t, d], i) => `<article class="card reveal"><div class="card-ico ic-${(i % 4) + 1}">${['◆', '✦', '▲', '●'][i]}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`) +
    sec('', 'Как заказать', `5 шагов от заявки до <span class="grad-text">запуска</span>`,
      `        <ol class="steps p-steps">${order.map(([t, d], i) => `<li class="step reveal"><span class="step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`) +
    sec('', 'В каждом сайте', `Что <span class="grad-text">входит</span>`, includesBlock(SERVICES[0])) +
    sec('', 'Города', `Разработка сайтов <span class="grad-text">в вашем городе</span>`,
      `        <p class="p-text reveal">Заказать сайт можно из любого города Казахстана. Выберите свой, расскажу о местной конкуренции и картах.</p>\n        ${chips(CITIES.map((c) => [c.name, `/uslugi/sozdanie-saytov/${c.slug}/`]))}`) +
    sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(faq)) +
    sec('', 'Вместе с сайтом', `Чтобы сайт приводил <span class="grad-text">клиентов</span>`, `        ${chips(SERVICES.slice(1).map((x) => [x.name, `/uslugi/${x.slug}/`]))}`);
  write(url, layout({
    url, title: 'Заказать сайт под ключ в Казахстане: разработка сайтов | GO-WORK.KZ', desc,
    h1: 'Заказать сайт <span class="grad-text">под ключ</span>', kicker: 'Разработка сайтов · Казахстан',
    lead: 'Сайт, который приводит заявки: структура под поисковые запросы, понятные тексты, кнопки WhatsApp и звонка, аналитика и ИИ-ассистент по желанию. Расчёт стоимости за 24 часа.',
    crumbs: [['Главная', '/'], ['Заказать сайт', url]],
    body, jsonld: [serviceLd(SERVICES[0], null, url, desc), faqLd(faq, url)],
  }), '0.9');
}

/* ---------- ИИ-ролики ---------- */
{
  const url = '/ai-roliki/';
  const packCard = (p) => `<article class="pack reveal${p.best ? ' best' : ''}">
          ${p.best ? '<span class="pack-badge">Выгоднее</span>' : ''}
          <p class="pack-name">Пакет «${p.name}»</p>
          <p class="pack-count"><b>${p.count}</b> ИИ-роликов от 1 минуты</p>
          <p class="pack-price">${tg(p.price)} <span>₸</span></p>
          <p class="pack-per">≈ ${tg(p.per)} ₸ за ролик${p.save ? ` · <b>экономия ${tg(p.save)} ₸</b>` : ''}</p>
          <ul class="pack-list">${['Сценарий под ваш бизнес', 'Озвучка', 'VFX-звуки', 'Монтаж', 'Токены Higgsfield включены'].map((x) => `<li>${x}</li>`).join('')}</ul>
          <p class="pack-note">${p.note}</p>
          ${waBtn(`Заказать ${p.count} роликов`, p.best ? 'btn-lg pulse' : 'btn-lg', `Здравствуйте! Хочу пакет «${p.name}»: ${p.count} ИИ-роликов за ${tg(p.price)} ₸`)}
        </article>`;
  const loveCard = (more = true) => `<article class="pack love reveal">
          <span class="pack-badge">Спеццена</span>
          <p class="pack-name">ИИ «Love Story» ❤</p>
          <p class="pack-count"><b>1</b> ролик на 1 минуту</p>
          <p class="pack-price">${tg(LOVE_PACK.price)} <span>₸</span></p>
          <p class="pack-per">На свадьбу, предложение или чтобы завоевать сердце</p>
          <ul class="pack-list">${LOVE_PACK.list.map((x) => `<li>${x}</li>`).join('')}</ul>
          <p class="pack-note">${more ? '<a class="p-link" href="/ai-roliki/love-story/">Подробнее о Love Story →</a>' : 'Покажите на тое, отправьте любимому человеку или сделайте предложение по-новому.'}</p>
          ${waBtn('Заказать Love Story', 'btn-lg', `Здравствуйте! Хочу ИИ-ролик Love Story за ${tg(LOVE_PACK.price)} ₸`)}
        </article>`;
  const fmtViews = (v) => v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1).replace('.0', '').replace('.', ',') + ' тыс.' : String(v);
  const examples = AI_EXAMPLES.filter((e) => e.views >= 10000);
  const exBlock = examples.length
    ? `        <div class="ex-grid">${examples.map((e) => `<a class="ex reveal" href="${e.url}" target="_blank" rel="noopener"><div class="ex-media"${e.thumb ? ` style="background-image:url('${e.thumb}')"` : ''}><span class="ex-play">▶</span><span class="ex-views">👁 ${fmtViews(e.views)}</span></div><div class="ex-info"><b>${esc(e.title)}</b><span>${esc(e.niche || '')}</span></div></a>`).join('')}</div>`
    : `        <div class="p-box ex-empty reveal"><h3>Ролики, которые набирают 10 000+ просмотров</h3><p>Свежие примеры с реальной статистикой, в Instagram. Там видно и сами ролики, и количество просмотров.</p><div class="p-cta-inline"><a class="btn btn-ghost btn-lg" href="https://www.instagram.com/alikhan_seiilbek/" target="_blank" rel="noopener"><span>Смотреть в Instagram</span></a></div></div>`;
  const inc = [
    ['📝', 'Сценарий под ваш бизнес', 'Разбираю нишу, аудиторию и оффер. Пишу сценарий с цепляющим началом в первые 2 секунды, именно они решают, досмотрят ли ролик.'],
    ['🎙', 'Озвучка', 'Живой ИИ-голос на русском или казахском под характер бренда: экспертный, дружелюбный, энергичный.'],
    ['🔊', 'VFX-звуки', 'Звуковой дизайн под каждое движение: «вжухи», удары, щелчки. Ролик звучит как дорогая реклама.'],
    ['🎬', 'Монтаж', 'Динамичный монтаж под Reels, TikTok и Shorts: вертикальный формат, субтитры, ритм, призыв к действию.'],
    ['⚡', 'Токены Higgsfield', 'Генерация видео в Higgsfield уже в цене, вам не нужно покупать подписки и разбираться в нейросетях.'],
  ];
  const faq = [
    ['Что такое ИИ-ролик?', 'Это видео, созданное нейросетями: персонажи, сцены и движение генерируются в Higgsfield по сценарию, затем добавляются озвучка, звуки и монтаж. Снимать ничего не нужно.'],
    ['Сколько длится один ролик?', 'Каждый ролик: от 1 минуты. Хронометраж подбираем под задачу и площадку.'],
    ['Что нужно от меня?', 'Рассказать о бизнесе, продукте и клиентах, прислать логотип и, если есть, фото товара. Сценарии и всё производство, на мне.'],
    ['Подойдёт ли для рекламы?', 'Да. Ролики подходят для Reels, TikTok, YouTube Shorts, таргетированной рекламы и сайта.'],
    ['Чем пакет на 20 роликов выгоднее?', `Один ролик в пакете «Бизнес» обходится примерно в ${tg(25000)} ₸ вместо ${tg(30000)} ₸, экономия ${tg(100000)} ₸ на всём пакете.`],
    ['На каком языке озвучка?', 'На русском или казахском, по вашему выбору.'],
  ];
  const offers = [...AI_PACKS.map((p) => ({ '@type': 'Offer', name: `${p.count} ИИ-роликов от 1 минуты`, price: p.price, priceCurrency: 'KZT', availability: 'https://schema.org/InStock', url: SITE + url })), { '@type': 'Offer', name: 'ИИ-ролик Love Story, 1 минута', price: LOVE_PACK.price, priceCurrency: 'KZT', availability: 'https://schema.org/InStock', url: SITE + url + 'love-story/' }];
  const desc = 'ИИ-ролики под ключ: сценарий, озвучка, VFX-звуки, монтаж и токены Higgsfield. 10 роликов: 300 000 ₸, 20: 500 000 ₸, Love Story: 100 000 ₸.';
  write(url, layout({
    url, title: 'ИИ-ролики для бизнеса: 10 роликов: 300 000 ₸ | GO-WORK.KZ', desc,
    h1: 'ИИ-ролики <span class="grad-text">для вашего бизнеса</span>', kicker: 'Видеоконтент · Higgsfield',
    lead: 'Премиальные видео, созданные нейросетями: без съёмок, актёров и студии. Сценарий, озвучка, VFX-звуки и монтаж, под ключ.',
    crumbs: [['Главная', '/'], ['ИИ-ролики', url]],
    cta: ['Обсудить ролики в WhatsApp', 'Здравствуйте! Хочу заказать ИИ-ролики для бизнеса', 'Смотреть пакеты'],
    body:
      sec('details', 'Пакеты', `Выберите <span class="grad-text">пакет</span>`, `        <div class="packs three">${AI_PACKS.map(packCard).join('')}${loveCard()}</div>`) +
      sec('', 'Что входит', `Всё под ключ, <span class="grad-text">от идеи до ролика</span>`,
        `        <div class="cards p-cards inc-cards">${inc.map(([i, t, d]) => `<article class="card reveal"><div class="card-ico ic-${(inc.findIndex((x) => x[1] === t) % 4) + 1}">${i}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`) +
      sec('', 'Примеры', `Ролики с <span class="grad-text">10 000+ просмотров</span>`, exBlock) +
      sec('', 'Для чего', `Где работают <span class="grad-text">ИИ-ролики</span>`,
        `        <ul class="p-checks reveal">${['Reels и Stories в Instagram', 'TikTok и YouTube Shorts', 'Таргетированная реклама', 'Презентация товара или услуги', 'Видео на сайт и в WhatsApp-рассылки', 'Запуск акций и новых продуктов'].map((x) => `<li>${x}</li>`).join('')}</ul>`) +
      sec('', 'Как работаю', `Этапы <span class="grad-text">работы</span>`,
        `        <ol class="steps p-steps">${[['Бриф', 'Разбираю бизнес, аудиторию и цели роликов.'], ['Сценарии', 'Пишу сценарии и согласую их с вами.'], ['Генерация', 'Создаю сцены и персонажей в Higgsfield.'], ['Звук и монтаж', 'Озвучка, VFX-звуки, субтитры, монтаж.'], ['Сдача', 'Передаю готовые ролики для публикации.']].map(([t, d], i) => `<li class="step reveal"><span class="step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`) +
      sec('', 'Коммерческое предложение', `Предложение <span class="grad-text">одним взглядом</span>`,
        `        <div class="offer-imgs">${[['ai-roliki-10', '10 ИИ-роликов от 1 минуты: 300 000 ₸'], ['ai-roliki-20', '20 ИИ-роликов от 1 минуты: 500 000 ₸']].map(([f, a]) => `<img class="reveal" src="/assets/img/offers/${f}.jpg" alt="Коммерческое предложение: ${a}" width="800" height="1000" loading="lazy">`).join('')}</div>`) +
      sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(faq)),
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Service', name: 'ИИ-ролики для бизнеса', serviceType: 'Производство видео с помощью ИИ', description: desc, url: SITE + url, areaServed: { '@type': 'Country', name: 'Казахстан' }, provider: { '@type': 'ProfessionalService', name: 'GO-WORK.KZ', url: SITE + '/' }, offers }, faqLd(faq, url)],
  }), '0.9');

  /* ---------- Love Story ---------- */
  {
    const lurl = '/ai-roliki/love-story/';
    const lfaq = [
      ['Что такое ИИ-ролик Love Story?', 'Это минутный фильм о вашей паре, созданный нейросетями: по вашим фото ИИ «оживляет» вас в красивых кино-сценах, знакомство, первое свидание, предложение, свадьба. Снимать ничего не нужно.'],
      ['Что нужно от нас?', 'Несколько чётких фото каждого и пары вместе, а также ваша история: как познакомились, важные моменты, любимые места. Всё остальное, сценарий, генерация, озвучка и монтаж, делаю я.'],
      ['Где показать ролик?', 'На свадьбе или тое на экране, в момент предложения руки и сердца, на годовщине, в Instagram или просто отправить любимому человеку.'],
      ['Сколько длится ролик?', 'Около 1 минуты, идеальная длина, чтобы растрогать и не затянуть.'],
      ['На каком языке озвучка?', 'На русском или казахском, по вашему выбору. Можно сделать ролик и без голоса, только с музыкой и звуками.'],
      ['Это безопасно для наших фото?', 'Фото используются только для создания вашего ролика и не публикуются без вашего согласия.'],
    ];
    const ldesc = `ИИ-ролик Love Story по вашим фото: минутный фильм о вашей паре для свадьбы, тоя, предложения или признания. Спеццена, ${tg(LOVE_PACK.price)} ₸.`;
    write(lurl, layout({
      url: lurl, title: `ИИ-ролик Love Story на свадьбу: ${tg(LOVE_PACK.price)} ₸ | GO-WORK.KZ`, desc: ldesc,
      h1: 'ИИ-ролик <span class="grad-text">Love Story</span>', kicker: 'Свадьба · предложение · признание',
      lead: 'Минутный фильм о вашей любви, созданный нейросетями по вашим фото. Растрогает гостей на тое и того, кому вы хотите признаться в чувствах.',
      crumbs: [['Главная', '/'], ['ИИ-ролики', url], ['Love Story', lurl]],
      cta: ['Заказать Love Story', `Здравствуйте! Хочу ИИ-ролик Love Story за ${tg(LOVE_PACK.price)} ₸`, 'Что входит'],
      body:
        sec('details', 'Спеццена', `Один ролик, <span class="grad-text">одна большая история</span>`, `        <div class="packs one">${loveCard(false)}</div>`) +
        sec('', 'Для какого момента', `Когда <span class="grad-text">дарят Love Story</span>`,
          `        <div class="cards p-cards">${[['💍', 'Свадьба и той', 'Покажите историю вашей пары гостям на большом экране это момент, который запомнят все.'], ['🌹', 'Предложение руки и сердца', 'Включите ролик перед главным вопросом, и ответ будет «да».'], ['💌', 'Завоевать сердце', 'Признайтесь в чувствах так, как не признавался никто: кино, где вы двое, главные герои.'], ['🎂', 'Годовщина и праздник', 'Подарите воспоминания: от первой встречи до сегодняшнего дня.']].map(([i, t, d], k) => `<article class="card reveal"><div class="card-ico ic-${(k % 4) + 1}">${i}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`) +
        sec('', 'Как это работает', `От ваших фото <span class="grad-text">до фильма</span>`,
          `        <ol class="steps p-steps">${[['Ваша история', 'Рассказываете, как познакомились и что для вас важно.'], ['Фото', 'Присылаете несколько чётких фото.'], ['Сценарий', 'Пишу трогательный сценарий и согласую с вами.'], ['Генерация', 'ИИ создаёт кино-сцены с вами в главных ролях.'], ['Монтаж и звук', 'Озвучка, VFX-звуки, монтаж, и фильм готов.']].map(([t, d], i) => `<li class="step reveal"><span class="step-n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`) +
        sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(lfaq)) +
        sec('', 'Для бизнеса', `Нужны ролики <span class="grad-text">для бизнеса?</span>`, `        <p class="p-text reveal">Пакеты на 10 и 20 ИИ-роликов для Reels, TikTok и рекламы, <a class="p-link" href="${url}">смотреть пакеты →</a></p>`),
      jsonld: [{ '@context': 'https://schema.org', '@type': 'Service', name: 'ИИ-ролик Love Story', serviceType: 'Свадебное видео с помощью ИИ', description: ldesc, url: SITE + lurl, areaServed: { '@type': 'Country', name: 'Казахстан' }, provider: { '@type': 'ProfessionalService', name: 'GO-WORK.KZ', url: SITE + '/' }, offers: { '@type': 'Offer', price: LOVE_PACK.price, priceCurrency: 'KZT', availability: 'https://schema.org/InStock', url: SITE + lurl } }, faqLd(lfaq, lurl)],
    }), '0.8');
  }
}

/* ---------- посадочные страницы под отдельные запросы ---------- */
// Каждый запрос получает свою страницу: заголовок и H1 повторяют запрос, сверху короткий ответ (AEO),
// ниже подробности, вопросы с разметкой FAQPage и ссылки на услуги.
const CASES_LINE = 'ne-ti.kz вышел в ТОП-3 Google за 1 месяц, BuhTask за 2 месяца.';
const LANDINGS = [
  {
    url: '/skolko-stoit-sayt/', q: 'Сколько стоит сделать сайт в Казахстане',
    title: 'Сколько стоит сделать сайт в Казахстане в 2026 году | GO-WORK.KZ',
    desc: 'Сколько стоит сделать сайт в Казахстане: сайт под ключ за 100 000 ₸ с дизайном, текстами, SEO и заявками в WhatsApp. Что влияет на цену, сравнение с конструктором и агентствами.',
    h1: 'Сколько стоит <span class="grad-text">сделать сайт</span> в Казахстане',
    lead: 'Разбираю, из чего складывается цена сайта и сколько стоит сайт под ключ у меня.',
    answer: 'Сайт под ключ в GO-WORK.KZ стоит 100 000 ₸ разово: индивидуальный дизайн, продающие тексты, мобильная версия, SEO-основа и заявки в WhatsApp. Срок 7–14 дней. Пакеты с правками: «Старт» 100 000 ₸, «Год» 200 000 ₸, «Навсегда» 400 000 ₸. Домен оплачивается отдельно.',
    blocks: [
      ['Что влияет на цену', '<ul class="p-dots"><li>Тип сайта: лендинг, сайт компании, интернет-магазин или платформа</li><li>Количество страниц и услуг</li><li>Кто пишет тексты и готовит фото</li><li>Интеграции: оплата, CRM, онлайн-запись</li><li>Нужен ли ИИ-ассистент и SEO-продвижение</li></ul>'],
      ['Конструктор, фрилансер или под ключ', '<ul class="p-dots"><li>Конструктор: дешевле на старте, но подписка каждый месяц, шаблонный дизайн, тексты пишете сами</li><li>Фрилансер: дешевле агентства, но SEO и тексты часто не входят</li><li>Под ключ в GO-WORK.KZ: 100 000 ₸ разово, всё включено, правки по пакету</li></ul>'],
    ],
    faq: [['Сколько стоит лендинг в Казахстане?', 'Лендинг под ключ в GO-WORK.KZ входит в пакет за 100 000 ₸: дизайн, тексты, мобильная версия, SEO и заявки в WhatsApp.'],
      ['Сколько стоит интернет-магазин?', 'Зависит от количества товаров, оплаты и интеграций. Стоимость называю после бесплатного аудита.'],
      ['Есть ли ежемесячная плата?', 'Нет. За сайт платите один раз, отдельно оплачивается только домен.']],
    links: [['Цены на главной', '/#price'], ['Заказать сайт', '/zakazat-sayt/'], ['Разработка сайтов', '/uslugi/sozdanie-saytov/'], ['Интернет-магазин', '/uslugi/internet-magazin/']],
  },
  {
    url: '/seo-stoimost/', q: 'SEO-продвижение сайта: стоимость',
    title: 'SEO-продвижение сайта: стоимость в Казахстане | GO-WORK.KZ',
    desc: 'Стоимость SEO-продвижения сайта в Казахстане: от чего зависит цена, что входит в работу, сроки выхода в ТОП Google и Яндекс. Бесплатный аудит и расчёт за 24 часа.',
    h1: 'SEO-продвижение сайта: <span class="grad-text">стоимость</span>',
    lead: 'Цена SEO зависит от конкуренции в нише и состояния сайта. Объясняю, что входит и как считаю.',
    answer: 'Стоимость SEO-продвижения в GO-WORK.KZ рассчитывается после бесплатного аудита за 24 часа и фиксируется ежемесячной суммой в договоре. Зависит от конкуренции, количества услуг и городов, состояния сайта. Первые сдвиги позиций через 4–8 недель. ' + CASES_LINE,
    blocks: [
      ['От чего зависит цена SEO', '<ul class="p-dots"><li>Конкуренция в нише и городе</li><li>Сколько услуг и городов продвигаем</li><li>Текущее состояние сайта и ошибки</li><li>Объём нового контента</li><li>Нужна ли GEO-оптимизация для ответов ИИ</li></ul>'],
      ['Что входит каждый месяц', '<ul class="p-dots"><li>Технические исправления и скорость</li><li>Новые страницы под запросы</li><li>Карты: Google, Яндекс, 2ГИС</li><li>Отчёт по позициям, трафику и заявкам</li></ul>'],
    ],
    faq: [['Сколько стоит SEO в месяц?', 'Фиксированная ежемесячная сумма после бесплатного аудита: зависит от конкуренции и объёма работ.'],
      ['Когда будет результат?', 'Первые сдвиги через 4–8 недель, стабильный поток заявок обычно через 3–6 месяцев. ' + CASES_LINE],
      ['Гарантируете ТОП-1?', 'Нет, позицию не гарантирует никто. Гарантирую план работ и прозрачные отчёты.']],
    links: [['SEO-продвижение сайтов', '/uslugi/prodvizhenie-saytov/'], ['SEO в Астане', '/uslugi/prodvizhenie-saytov/astana/'], ['SEO в Алматы', '/uslugi/prodvizhenie-saytov/almaty/'], ['GEO-оптимизация', '/uslugi/geo-optimizaciya/']],
  },
  {
    url: '/seo-specialist/', q: 'SEO-специалист (SEO expert) в Казахстане',
    title: 'SEO-специалист в Казахстане: SEO expert Алихан Сейилбек | GO-WORK.KZ',
    desc: 'SEO-специалист в Казахстане: Алихан Сейилбек, GO-WORK.KZ. Продвижение сайтов в Google и Яндекс, GEO для ответов ИИ. Кейсы: ne-ti.kz и BuhTask в ТОП-3 Google.',
    h1: 'SEO-специалист <span class="grad-text">в Казахстане</span>',
    lead: 'Алихан Сейилбек, основатель GO-WORK.KZ: разработка сайтов и SEO-продвижение в Google и Яндексе для малого бизнеса.',
    answer: 'SEO-специалист Алихан Сейилбек (GO-WORK.KZ) продвигает сайты в Google и Яндексе и готовит их к ответам нейросетей (GEO). ' + CASES_LINE + ' Работает удалённо по Казахстану, бесплатный аудит за 24 часа в WhatsApp +7 778 324 44 40.',
    blocks: [
      ['Чем занимаюсь', '<ul class="p-dots"><li>Технический аудит и исправление ошибок</li><li>Семантика и страницы под запросы</li><li>Локальное SEO: карты и 2ГИС</li><li>GEO и AEO: чтобы ИИ рекомендовал ваш бизнес</li></ul>'],
      ['Результаты', '<ul class="p-dots"><li>ne-ti.kz: сайт за 7 дней, ТОП-3 Google за 1 месяц</li><li>BuhTask: ТОП-3 Google за 2 месяца</li></ul>'],
    ],
    faq: [['Как выбрать SEO-специалиста?', 'Смотрите на реальные кейсы с позициями, прозрачный план работ и отчёты по заявкам, а не только по трафику.'],
      ['Работаете с сайтами на Tilda и WordPress?', 'Да, продвигаю сайты на любых платформах.']],
    links: [['SEO-продвижение сайтов', '/uslugi/prodvizhenie-saytov/'], ['Стоимость SEO', '/seo-stoimost/'], ['Бесплатный аудит', '/audit/']],
  },
  {
    url: '/sozdat-sayt-besplatno/', q: 'Создать сайт бесплатно',
    title: 'Создать сайт бесплатно: можно ли и что выбрать | GO-WORK.KZ',
    desc: 'Можно ли создать сайт бесплатно: честный разбор конструкторов, их ограничений и скрытых расходов. Когда выгоднее сайт под ключ за 100 000 ₸ разово.',
    h1: 'Создать сайт <span class="grad-text">бесплатно</span>: честный разбор',
    lead: 'Бесплатный сайт сделать можно, но у него есть ограничения. Рассказываю, когда это подходит, а когда дороже обходится.',
    answer: 'Создать сайт бесплатно можно на конструкторе (Tilda, Wix, Google Sites), но на бесплатном тарифе будет чужой домен, реклама платформы, ограничения SEO и шаблонный дизайн. Для бизнеса выгоднее сайт под ключ: в GO-WORK.KZ это 100 000 ₸ разово, без подписки, с дизайном, текстами, SEO и заявками в WhatsApp.',
    blocks: [
      ['Ограничения бесплатных сайтов', '<ul class="p-dots"><li>Адрес вида вашсайт.tilda.ws вместо своего домена</li><li>Логотип и реклама платформы</li><li>Слабые возможности SEO</li><li>Тексты и дизайн придётся делать самому</li></ul>'],
      ['Когда бесплатный сайт подходит', '<ul class="p-dots"><li>Проверить идею за выходные</li><li>Визитка для себя без продвижения</li></ul>'],
    ],
    faq: [['Какой конструктор бесплатный?', 'У Tilda, Wix и Google Sites есть бесплатные тарифы с ограничениями: чужой домен и мало страниц.'],
      ['Можно ли продвинуть бесплатный сайт в Google?', 'Сложно: на бесплатных тарифах ограничены SEO-настройки и нет своего домена.']],
    links: [['Сколько стоит сайт', '/skolko-stoit-sayt/'], ['Заказать сайт', '/zakazat-sayt/'], ['Бесплатный аудит', '/audit/']],
  },
  {
    url: '/smm-agentstvo-astana/', q: 'SMM-агентство в Астане',
    title: 'SMM-агентство в Астане: ведение Instagram, TikTok и таргет | GO-WORK.KZ',
    desc: 'SMM-агентство в Астане: ведение Instagram и TikTok, Reels и ИИ-ролики, таргет и заявки в WhatsApp. SMM и таргет одной командой. Бесплатный разбор аккаунта.',
    h1: 'SMM-агентство <span class="grad-text">в Астане</span>',
    lead: 'Контент, ведение аккаунтов и таргет одной командой: чтобы из Instagram и TikTok приходили заявки.',
    answer: 'SMM в Астане: GO-WORK.KZ ведёт Instagram и TikTok, делает Reels и ИИ-ролики без съёмок, настраивает таргет и переводит заявки в WhatsApp. Старт за 3–5 рабочих дней, стоимость после бесплатного разбора аккаунта. WhatsApp +7 778 324 44 40.',
    blocks: [
      ['SMM и таргет вместе', '<ul class="p-dots"><li>Контент-план и Reels</li><li>ИИ-ролики без съёмок</li><li>Таргет в Instagram и TikTok на город и район</li><li>Отчёт по заявкам каждый месяц</li></ul>'],
    ],
    faq: [['Сколько стоит SMM в Астане?', 'Зависит от количества публикаций и форматов. Стоимость называю после бесплатного разбора аккаунта.'],
      ['Делаете таргет без ведения аккаунта?', 'Да, можно заказать только таргет.']],
    links: [['SMM в Астане', '/uslugi/smm/astana/'], ['Таргет в Астане', '/uslugi/target/astana/'], ['ИИ-ролики', '/ai-roliki/']],
  },
];
for (const L of LANDINGS) {
  const body =
    L.blocks.map(([h, inner], i) => sec(i ? '' : 'details', L.q, h, `        <div class="p-box reveal">${inner}</div>`)).join('') +
    sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(L.faq)) +
    sec('', 'Смотрите также', `Связанные <span class="grad-text">страницы</span>`, `        ${chips(L.links)}`);
  write(L.url, layout({
    url: L.url, title: L.title, desc: L.desc, h1: L.h1, kicker: L.q, lead: L.lead, answer: L.answer,
    crumbs: [['Главная', '/'], [L.q, L.url]], body,
    jsonld: [faqLd([[L.q + '?', L.answer], ...L.faq], L.url)],
  }), '0.8');
}

/* ---------- English: Website development Astana ---------- */
{
  const url = '/en/website-astana/';
  const answer = 'GO-WORK.KZ builds websites in Astana and across Kazakhstan: a turnkey website costs 100,000 KZT one-time and includes custom design, copywriting, mobile version, SEO setup and WhatsApp leads. Delivery in 7–14 days. Contact on WhatsApp +7 778 324 44 40.';
  const faq = [['How much does a website cost in Astana?', answer], ['Do you do SEO in English and Russian?', 'Yes. Websites can be in Russian, Kazakh and English, optimized for Google and Yandex.'], ['Can you add an AI assistant?', 'Yes, an AI chat assistant that answers clients 24/7 and sends leads to WhatsApp.']];
  write(url, layout({
    url, lang: 'en', title: 'Website development in Astana, Kazakhstan | GO-WORK.KZ',
    desc: 'Website development in Astana: turnkey websites from 100,000 KZT with design, copywriting, SEO and WhatsApp leads. AI assistants, online stores and SEO in Kazakhstan.',
    h1: 'Website development <span class="grad-text">in Astana</span>', kicker: 'Website Astana',
    lead: 'Fast, mobile-friendly websites for small businesses in Kazakhstan, built to bring leads from Google and Yandex.',
    answer, crumbs: [['Home', '/'], ['Website Astana', url]],
    body: sec('details', 'What you get', 'Everything <span class="grad-text">included</span>', '        <ul class="p-checks reveal"><li>Custom design for your niche</li><li>Sales copywriting</li><li>Mobile version</li><li>SEO from day one</li><li>Leads straight to WhatsApp</li><li>Domain connection and full access</li></ul>') +
      sec('', 'Results', 'Real <span class="grad-text">cases</span>', '        <ul class="p-dots reveal"><li>ne-ti.kz: website in 7 days, TOP-3 on Google in 1 month</li><li>BuhTask: TOP-3 on Google in 2 months</li></ul>') +
      sec('', 'FAQ', 'Questions', faqBlock(faq)),
    jsonld: [faqLd(faq, url), serviceLd(SERVICES[0], null, url, 'Website development in Astana')],
  }), '0.7');
}

/* ---------- /voprosy/: все короткие ответы сайта в одном месте (AEO) ---------- */
{
  const url = '/voprosy/';
  const top = QA.filter((x) => !/\/uslugi\/[^/]+\/[^/]+\/$/.test(x[2]) || /\/(astana|almaty)\/$/.test(x[2]));
  const faq = top.map(([q, a]) => [q + '?', a]);
  write(url, layout({
    url, title: 'Ответы на частые вопросы: сайты, SEO, реклама в Казахстане | GO-WORK.KZ',
    desc: 'Короткие ответы на частые вопросы о разработке сайтов, SEO, GEO, контекстной рекламе, таргете и SMM в Казахстане: цены, сроки, кейсы GO-WORK.KZ.',
    h1: 'Ответы на <span class="grad-text">частые вопросы</span>', kicker: 'Вопросы и ответы',
    lead: 'Коротко о ценах, сроках и услугах. Каждый ответ ведёт на подробную страницу.',
    crumbs: [['Главная', '/'], ['Вопросы и ответы', url]],
    body: sec('details', 'Коротко', 'Всё <span class="grad-text">главное</span>', `        <div class="faq narrow">${top.map(([q, a, u]) => `<details class="reveal"><summary>${q}</summary><p>${a} <a class="p-link" href="${u}">Подробнее →</a></p></details>`).join('')}</div>`),
    jsonld: [faqLd(faq, url)],
  }), '0.8');
}

/* ---------- llms.txt и llms-full.txt собираются автоматически (GEO) ---------- */
{
  const svc = SERVICES.map((s) => `- [${s.name}](${SITE}/uslugi/${s.slug}/): ${s.desc(null)} Страницы по городам: ${CITIES.slice(0, 4).map((c) => `[${c.name}](${SITE}/uslugi/${s.slug}/${c.slug}/)`).join(', ')}.`).join('\n');
  const land = LANDINGS.map((L) => `- [${L.q}](${SITE}${L.url}): ${L.answer}`).join('\n');
  const head = `# GO-WORK.KZ

> GO-WORK.KZ — разработка сайтов и интернет-маркетинг для малого бизнеса в Казахстане (Астана, Алматы и ещё 18 городов): сайты и платформы с ИИ, интернет-магазины, SEO-продвижение в Google и Яндекс, GEO-оптимизация для ответов нейросетей, контекстная реклама, таргет и SMM. Основатель — Алихан Сейилбек. Сайт под ключ — 100 000 ₸ разово. Первый шаг — бесплатный аудит сайта за 24 часа.

## Контакты
- Сайт: ${SITE}/
- WhatsApp и телефон: +7 778 324 44 40 (https://wa.me/77783244440)
- Instagram: https://www.instagram.com/alikhan_seiilbek/
- 2ГИС (Астана): https://2gis.kz/astana/geo/70000001119705288

## Цены
- Сайт под ключ: 100 000 ₸ разово (дизайн, тексты, мобильная версия, SEO, заявки в WhatsApp), срок 7–14 дней.
- Пакеты правок: «Старт» 100 000 ₸ (неделя правок), «Год» 200 000 ₸ (правки 12 месяцев), «Навсегда» 400 000 ₸ (правки навсегда + 2 услуги в подарок).
- ИИ-ролики: 10 роликов — 300 000 ₸, 20 роликов — 500 000 ₸, Love Story — 100 000 ₸.
- SEO, реклама, SMM, интернет-магазины: стоимость после бесплатного аудита.

## Услуги
${svc}
- [ИИ-ролики для бизнеса](${SITE}/ai-roliki/)
- [Заказать сайт](${SITE}/zakazat-sayt/)
- [Бесплатный аудит сайта](${SITE}/audit/)

## Ответы на частые запросы
${land}
- Все короткие ответы: ${SITE}/voprosy/

## Кейсы
${CASES.map((c) => `- ${c}`).join('\n')}

## География
${CITIES.map((c) => c.name).join(', ')}: ${SITE}/goroda/
`;
  fs.writeFileSync(path.join(ROOT, 'llms.txt'), head);
  const full = head + '\n## Все вопросы и ответы\n' + [...new Map(ALLFAQ.map(([q, a, u]) => [q, `### ${q}\n${a}\nИсточник: ${SITE}${u}\n`])).values()].join('\n');
  fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), full);
}

/* ---------- sitemap ---------- */
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE}${p.loc}</loc><lastmod>${TODAY}</lastmod><priority>${p.pr}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log('pages:', pages.length);
