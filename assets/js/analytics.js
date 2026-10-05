/* Аналитика GO-WORK.KZ: Яндекс Метрика, GA4 и/или GTM + цели.
   Вставьте свои ID — счётчики подключатся автоматически. Пустая строка = не подключать. */
const ANALYTICS = {
  ym: '',   // Яндекс Метрика, например '98765432'
  ga4: '',  // Google Analytics 4, например 'G-XXXXXXXXXX'
  gtm: '',  // Google Tag Manager, например 'GTM-XXXXXXX' (если используете GTM, GA4 лучше подключить внутри него)
};

(function () {
  const w = window, d = document;
  w.dataLayer = w.dataLayer || [];
  const load = (src) => { const s = d.createElement('script'); s.async = true; s.src = src; d.head.appendChild(s); };

  if (ANALYTICS.gtm) {
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    load('https://www.googletagmanager.com/gtm.js?id=' + ANALYTICS.gtm);
  }
  if (ANALYTICS.ga4) {
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', ANALYTICS.ga4);
    load('https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.ga4);
  }
  if (ANALYTICS.ym) {
    w.ym = w.ym || function () { (w.ym.a = w.ym.a || []).push(arguments); };
    w.ym.l = Date.now();
    load('https://mc.yandex.ru/metrika/tag.js');
    w.ym(ANALYTICS.ym, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  // единая отправка цели во все системы
  function goal(name, params = {}) {
    w.dataLayer.push({ event: name, ...params });
    if (ANALYTICS.ga4 && w.gtag) w.gtag('event', name, params);
    if (ANALYTICS.ym && w.ym) w.ym(ANALYTICS.ym, 'reachGoal', name, params);
  }
  w.gwGoal = goal;

  d.addEventListener('click', (e) => {
    const a = e.target.closest('a, button, summary');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const place = a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : a.classList.contains('wa-float') ? 'float' : 'content';
    if (href.includes('wa.me')) goal('whatsapp_click', { place, page: location.pathname });
    else if (href.startsWith('tel:')) goal('phone_click', { place });
    else if (href.includes('instagram.com')) goal('instagram_click', { place });
    else if (a.classList.contains('work-link')) goal('portfolio_click', { site: href });
    else if (a.matches('#chatQuick button')) goal('chat_quick_question', { text: a.textContent.trim() });
    else if (a.tagName === 'SUMMARY') goal('faq_open', { question: a.textContent.trim().slice(0, 80) });
  });
  d.addEventListener('submit', (e) => { if (e.target.id === 'chatForm') goal('chat_message'); });

  // глубина прокрутки 50% и 90%
  const marks = { 50: false, 90: false };
  addEventListener('scroll', () => {
    const p = (scrollY + innerHeight) / d.documentElement.scrollHeight * 100;
    for (const m of [50, 90]) if (!marks[m] && p >= m) { marks[m] = true; goal('scroll_' + m); }
  }, { passive: true });
})();
