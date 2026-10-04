// Генератор SEO-страниц: node tools/build-seo.mjs
// Создаёт /uslugi/, /uslugi/<услуга>/, /uslugi/<услуга>/<город>/, /goroda/<город>/, /audit/ и sitemap.xml
import fs from 'node:fs';
import path from 'node:path';
import { CITIES, SERVICES, COMP } from './data.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://go-work.kz';
const WA = 'https://wa.me/77783244440?text=' + encodeURIComponent('Здравствуйте! Хочу бесплатный аудит сайта');
const TODAY = new Date().toISOString().slice(0, 10);
const pages = [{ loc: '/', pr: '1.0' }];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const WA_ICO = '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg>';
const waBtn = (label = 'Бесплатный аудит сайта', cls = 'btn-lg') =>
  `<a class="btn btn-wa ${cls} js-wa" href="${WA}" target="_blank" rel="noopener"><span class="btn-shine"></span>${WA_ICO}<span>${label}</span></a>`;

function layout({ url, title, desc, h1, kicker, lead, crumbs, body, jsonld = [] }) {
  const canonical = SITE + url;
  const bc = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + c[1] })),
  };
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>if(location.hostname.indexOf("www.")===0)location.replace("https://go-work.kz"+location.pathname+location.search+location.hash)</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#07060d">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GO-WORK.KZ">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${SITE}/assets/img/og.png">
  <meta property="og:locale" content="ru_RU">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="stylesheet" href="/assets/css/pages.css">
${[bc, ...jsonld].map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body class="page">
  <div class="bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><div class="grid-lines"></div><div class="noise"></div></div>

  <header class="nav" id="nav">
    <a href="/" class="logo" aria-label="GO-WORK.KZ — на главную"><span class="logo-mark">G</span><span class="logo-text">GO-WORK<span class="accent">.KZ</span></span></a>
    <nav class="nav-links" id="navLinks">
      <a href="/uslugi/">Услуги</a>
      <a href="/goroda/">Города</a>
      <a href="/#portfolio">Портфолио</a>
      <a href="/audit/">Аудит</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <a class="btn btn-wa btn-sm js-wa" href="${WA}" target="_blank" rel="noopener">${WA_ICO}<span>Аудит</span></a>
    <button class="burger" id="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
  </header>

  <main>
    <section class="p-hero">
      <div class="container">
        <nav class="crumbs reveal" aria-label="Хлебные крошки">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`).join('<i>/</i>')}</nav>
        <p class="kicker reveal">${esc(kicker)}</p>
        <h1 class="p-title reveal">${h1}</h1>
        <p class="p-lead reveal">${lead}</p>
        <div class="hero-cta reveal">${waBtn()}<a class="btn btn-ghost btn-lg" href="#details"><span>Подробнее</span></a></div>
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
      <div class="f-cols">
        <div>
          <a href="/" class="logo"><span class="logo-mark">G</span><span class="logo-text">GO-WORK<span class="accent">.KZ</span></span></a>
          <p class="f-note">Сайты с ИИ, SEO в Google и Яндекс, контекстная реклама для бизнеса в Казахстане.</p>
          <div class="footer-links"><a href="https://www.instagram.com/alikhan_seiilbek/" target="_blank" rel="noopener">Instagram</a><a class="js-wa" href="${WA}" target="_blank" rel="noopener">WhatsApp</a></div>
        </div>
        <div><b>Услуги</b>${SERVICES.map((s) => `<a href="/uslugi/${s.slug}/">${s.name}</a>`).join('')}<a href="/audit/">Бесплатный аудит</a></div>
        <div><b>Города</b><div class="f-cities">${CITIES.map((c) => `<a href="/goroda/${c.slug}/">${c.name}</a>`).join('')}</div></div>
      </div>
      <small>© ${new Date().getFullYear()} go-work.kz</small>
    </div>
  </footer>

  <a class="wa-float js-wa" href="${WA}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp"><span class="wa-ring"></span><span class="wa-ring d2"></span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ico-wa"/></svg><span class="wa-tip">Бесплатный аудит</span></a>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="ico-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.92-4.64-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.87.84 2 .07.14.11.3.02.48-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.14-.28.28-.12.55.16.27.7 1.16 1.51 1.88 1.04.93 1.92 1.21 2.19 1.35.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z"/></symbol></svg>
  <script src="/assets/js/page.js" defer></script>
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

const faqLd = (faq) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
const serviceLd = (s, c, url, desc) => ({
  '@context': 'https://schema.org', '@type': 'Service',
  name: c ? `${s.name} ${c.loc}` : s.name, serviceType: s.name, description: desc, url: SITE + url,
  areaServed: c ? { '@type': 'City', name: c.name } : { '@type': 'Country', name: 'Казахстан' },
  provider: { '@type': 'ProfessionalService', name: 'GO-WORK.KZ', url: SITE + '/', image: SITE + '/assets/img/og.png' },
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
const priceBlock = (s) => `        <div class="p-two reveal"><div class="p-box"><h3>Стоимость зависит от</h3><ul class="p-dots">${s.price.map((x) => `<li>${x}</li>`).join('')}</ul><p class="p-muted">Точную цену называю после бесплатного аудита — без скрытых платежей.</p></div><div class="p-box"><h3>Сроки</h3><p>${s.time}</p><div class="p-cta-inline">${waBtn('Рассчитать стоимость', 'btn-sm')}</div></div></div>`;
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
      `        <p class="p-text reveal">Работаю удалённо по всему Казахстану. Выберите свой город — расскажу, как ${s.what} работает именно там.</p>\n        ${chips(CITIES.map((c) => [c.name, `/uslugi/${s.slug}/${c.slug}/`]))}`) +
    sec('', 'Вопросы', `Частые <span class="grad-text">вопросы</span>`, faqBlock(s.faq)) +
    sec('', 'Ещё услуги', `Другие <span class="grad-text">услуги</span>`, `        ${chips(SERVICES.filter((x) => x !== s).map((x) => [x.name, `/uslugi/${x.slug}/`]))}`);
  write(url, layout({
    url, title: s.title(null), desc,
    h1: `${s.hubH1[0]} <span class="grad-text">${s.hubH1[1]}</span>`,
    kicker: 'Услуга · Казахстан', lead: s.lead,
    crumbs: [['Главная', '/'], ['Услуги', '/uslugi/'], [s.name, url]],
    body, jsonld: [serviceLd(s, null, url, desc), faqLd(s.faq)],
  }), '0.9');

  /* ---------- услуга × город ---------- */
  CITIES.forEach((c, ci) => {
    const curl = `/uslugi/${s.slug}/${c.slug}/`;
    const cdesc = s.desc(c);
    const [h1a, h1b] = s.cityH1(c);
    const faq = [s.cityFaq(c), [`Работаете ли вы ${c.loc}?`, `Да. Работаю с бизнесом ${c.loc} удалённо: все обсуждения — в WhatsApp и созвонах, отчёты и доступы — онлайн. Выезд не нужен, а результат вы видите в цифрах.`], ...s.faq.slice(0, 3)];
    // порядок блоков слегка меняется, чтобы страницы не были копиями
    const blocks = [
      sec('', 'Состав работ', `Что входит в работу <span class="grad-text">${c.loc}</span>`, includesBlock(s)),
      sec('', 'Как работаю', `Этапы <span class="grad-text">работы</span>`, stepsBlock(s)),
      sec('', 'Почему это работает', `Что получит ваш <span class="grad-text">бизнес</span>`, benefitsBlock(s)),
    ];
    const order = ci % 3 === 0 ? [0, 1, 2] : ci % 3 === 1 ? [2, 0, 1] : [1, 2, 0];
    const body =
      sec('details', `${c.name} · особенности`, `${s.short} ${c.loc}: <span class="grad-text">что важно знать</span>`,
        `        <div class="p-two reveal"><div class="p-box p-city"><h3>${c.name}</h3><p>${cap(c.name)} — ${c.about}. ${s.slug === 'yandex-direct' && c.ya ? 'Реклама показывается в поиске Яндекса и на тысячах сайтов рекламной сети.' : s.lead.split('. ').slice(1).join('. ')}</p></div><div class="p-box"><h3>Как я работаю ${c.loc}</h3><p>${s.local(c)}</p></div></div>
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
      url: curl, title: s.title(c), desc: cdesc,
      h1: `${h1a} <span class="grad-text">${h1b}</span>`,
      kicker: `${s.name} · ${c.name}`,
      lead: `${s.lead.split('. ')[0]}. Работаю с бизнесом ${c.loc} — бесплатный аудит и расчёт за 24 часа.`,
      crumbs: [['Главная', '/'], ['Услуги', '/uslugi/'], [s.name, url], [c.name, curl]],
      body, jsonld: [serviceLd(s, c, curl, cdesc), faqLd(faq)],
    }), '0.6');
  });
}

/* ---------- страницы городов ---------- */
for (const c of CITIES) {
  const url = `/goroda/${c.slug}/`;
  const desc = `Сайты с ИИ, SEO в Google и Яндекс, Google Ads и Яндекс Директ для бизнеса ${c.loc}. Бесплатный аудит сайта за 24 часа.`;
  const body =
    sec('details', 'Услуги', `Что я делаю для бизнеса <span class="grad-text">${c.loc}</span>`,
      `        <div class="cards p-cards p-svc">${SERVICES.map((s, i) => `<a class="card reveal" href="/uslugi/${s.slug}/${c.slug}/"><div class="card-ico ic-${(i % 4) + 1}">${s.icon}</div><h3>${s.name}</h3><p>${s.desc(c).split(':')[0]}.</p><span class="p-more">Подробнее →</span></a>`).join('')}</div>`) +
    sec('', 'Рынок', `Особенности рынка <span class="grad-text">${c.loc}</span>`,
      `        <div class="p-two reveal"><div class="p-box p-city"><h3>${c.name}</h3><p>${cap(c.name)} — ${c.about}. ${COMP[c.comp]}</p></div><div class="p-box"><h3>Поисковые системы</h3><p>${c.ya ? `${cap(c.loc)} заметная часть пользователей ищет в Яндексе, поэтому продвигаю сайт сразу в двух системах: Google и Яндекс.` : `${cap(c.loc)} большинство клиентов ищет в Google, а Яндекс даёт дополнительную аудиторию, за которую мало кто борется.`}</p></div></div>
        <p class="p-text reveal">Ниши, где ${c.loc} хорошо работает интернет-продвижение:</p>
        <ul class="p-checks p-niches reveal">${c.niches.map((n) => `<li>${cap(n)}</li>`).join('')}</ul>`) +
    sec('', 'Другие города', `Работаю по всему <span class="grad-text">Казахстану</span>`, `        ${chips(CITIES.map((x) => [x.name, `/goroda/${x.slug}/`, x === c]))}`);
  write(url, layout({
    url, title: `Сайты, SEO и реклама ${c.loc} | GO-WORK.KZ`, desc,
    h1: `Сайты, SEO и реклама <span class="grad-text">${c.loc}</span>`,
    kicker: `${c.name} · Казахстан`,
    lead: `Привожу заявки из поиска малому бизнесу ${c.loc}: сайты и платформы с ИИ, SEO в Google и Яндекс, контекстная реклама.`,
    crumbs: [['Главная', '/'], ['Города', '/goroda/'], [c.name, url]],
    body,
  }), '0.7');
}

/* ---------- индекс городов ---------- */
write('/goroda/', layout({
  url: '/goroda/', title: 'Города: сайты, SEO и реклама по всему Казахстану | GO-WORK.KZ',
  desc: 'Создание сайтов, SEO-продвижение и контекстная реклама в 20 городах Казахстана: Алматы, Астана, Шымкент, Караганда и другие.',
  h1: 'Работаю по всему <span class="grad-text">Казахстану</span>', kicker: 'География',
  lead: 'Удалённо, но с учётом особенностей каждого города: конкуренции, поисковых систем и местных карт.',
  crumbs: [['Главная', '/'], ['Города', '/goroda/']],
  body: sec('details', '20 городов', `Выберите <span class="grad-text">свой город</span>`,
    `        <div class="p-citygrid">${CITIES.map((c) => `<a class="p-citycard reveal" href="/goroda/${c.slug}/"><b>${c.name}</b><span>${cap(c.about)}</span></a>`).join('')}</div>`),
}), '0.8');

/* ---------- индекс услуг ---------- */
write('/uslugi/', layout({
  url: '/uslugi/', title: 'Услуги: сайты с ИИ, SEO, Google Ads и Яндекс Директ | GO-WORK.KZ',
  desc: 'Все услуги GO-WORK.KZ: создание сайтов, платформы с ИИ, SEO в Google и Яндекс, Google Ads и Яндекс Директ для бизнеса в Казахстане.',
  h1: 'Услуги, которые <span class="grad-text">приводят клиентов</span>', kicker: 'Услуги',
  lead: 'Каждая услуга — отдельный инструмент получения заявок. Вместе они дают максимальный результат.',
  crumbs: [['Главная', '/'], ['Услуги', '/uslugi/']],
  body: sec('details', '6 направлений', `Выберите <span class="grad-text">услугу</span>`,
    `        <div class="cards p-cards p-svc">${SERVICES.map((s, i) => `<a class="card reveal" href="/uslugi/${s.slug}/"><div class="card-ico ic-${(i % 4) + 1}">${s.icon}</div><h3>${s.name}</h3><p>${s.lead}</p><span class="p-more">Подробнее →</span></a>`).join('')}</div>`) +
    sec('', 'Бесплатно', `Начните с <span class="grad-text">аудита</span>`, `        <p class="p-text reveal">Не знаете, что выбрать? Бесплатный аудит покажет, где вы теряете клиентов. <a class="p-link" href="/audit/">Что входит в аудит →</a></p>`),
}), '0.9');

/* ---------- аудит ---------- */
const auditFaq = [
  ['Аудит правда бесплатный?', 'Да. Вы ничего не обязаны покупать после аудита — это способ показать мой подход и пользу.'],
  ['Сколько ждать результат?', 'Обычно до 24 часов в рабочие дни. Отчёт приходит в WhatsApp.'],
  ['Что нужно от меня?', 'Только ссылка на сайт, город и ниша. Если сайта нет — разберу конкурентов и спрос в поиске.'],
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
  jsonld: [faqLd(auditFaq)],
}), '0.9');

/* ---------- sitemap ---------- */
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE}${p.loc}</loc><lastmod>${TODAY}</lastmod><priority>${p.pr}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log('pages:', pages.length);
