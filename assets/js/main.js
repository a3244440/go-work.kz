/* ============ GO-WORK.KZ ============ */

// ⚙️ Настройки — замените номер на свой (только цифры, с 7 в начале)
const CONFIG = {
  whatsapp: '77783244440',
  waText: 'Здравствуйте! Хочу бесплатный аудит сайта',
  aiEndpoint: '/api/chat', // серверная функция (Vercel). Если её нет — работает локальный ассистент.
};

const waLink = (text = CONFIG.waText) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- WhatsApp ссылки ---------- */
document.querySelectorAll('.js-wa').forEach((a) => (a.href = waLink()));

/* ---------- Год ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Навигация ---------- */
const nav = document.getElementById('nav');
const waFloat = document.querySelector('.wa-float');
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 30);
  waFloat.classList.toggle('show', y > window.innerHeight * 0.6);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  navLinks.classList.toggle('open', open);
});
navLinks.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  })
);

/* ---------- Появление при скролле ---------- */
const groups = new Map();
document.querySelectorAll('.reveal').forEach((el) => {
  const parent = el.parentElement;
  const i = groups.get(parent) || 0;
  el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
  groups.set(parent, i + 1);
});

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.count').forEach(countUp);
      io.unobserve(e.target);
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- Счётчики ---------- */
function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const to = +el.dataset.to;
  if (reduceMotion || to === 0) { el.textContent = to; return; }
  const dur = 1600;
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min((t - start) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Эффекты указателя ---------- */
if (finePointer && !reduceMotion) {
  // свечение за курсором
  const glow = document.querySelector('.cursor-glow');
  let gx = 0, gy = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(loop);
  })();

  // блик на кнопке WhatsApp + магнитный эффект
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      btn.style.setProperty('--x', x + 'px');
      btn.style.setProperty('--y', y + 'px');
      const mx = (x - r.width / 2) * 0.18, my = (y - r.height / 2) * 0.3;
      btn.style.translate = `${mx}px ${my}px`;
    });
    btn.addEventListener('pointerleave', () => (btn.style.translate = '0 0'));
  });

  // 3D-наклон карточек
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 10}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => (card.style.transform = ''));
  });

  // параллакс hero
  const visual = document.querySelector('.hero-visual');
  window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / innerWidth - 0.5) * 24, y = (e.clientY / innerHeight - 0.5) * 24;
    visual.style.translate = `${x}px ${y}px`;
  }, { passive: true });
}

/* ---------- Фильтр портфолио ---------- */
const filters = document.getElementById('filters');
filters.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  filters.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  const f = b.dataset.f;
  document.querySelectorAll('.work').forEach((w) => {
    const show = f === 'all' || w.dataset.cat.split(' ').includes(f);
    w.classList.toggle('hide', !show);
    if (show) w.animate([{ opacity: 0, transform: 'scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
});

/* ---------- ИИ-чат ---------- */
const chatBody = document.getElementById('chatBody');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatQuick = document.getElementById('chatQuick');
const history = [];
let busy = false;

function addMsg(text, who) {
  const m = document.createElement('div');
  m.className = `msg ${who}`;
  m.textContent = text;
  chatBody.appendChild(m);
  chatBody.scrollTop = chatBody.scrollHeight;
  return m;
}

function showTyping() {
  const t = document.createElement('div');
  t.className = 'msg bot typing';
  t.innerHTML = '<i></i><i></i><i></i>';
  chatBody.appendChild(t);
  chatBody.scrollTop = chatBody.scrollHeight;
  return t;
}

async function typeOut(el, text) {
  if (reduceMotion) { el.textContent = text; return; }
  el.textContent = '';
  for (let i = 0; i < text.length; i += 2) {
    el.textContent = text.slice(0, i + 2);
    chatBody.scrollTop = chatBody.scrollHeight;
    await new Promise((r) => setTimeout(r, 12));
  }
}

// Локальные ответы — работают, даже если сервер с ИИ не подключён
const KB = [
  { k: ['цен', 'стоим', 'сколько', 'прайс', 'бағ'], a: 'Стоимость зависит от задачи:\n• Лендинг — быстрый старт для рекламы\n• Многостраничный сайт — под SEO и услуги\n• Платформа с ИИ — ассистент, каталог, автоматизация\n\nТочную цену назову после бесплатного аудита — так вы не переплатите за лишнее.' },
  { k: ['аудит', 'провер', 'анализ'], a: 'В бесплатный аудит входит:\n• скорость и мобильная версия\n• технические ошибки SEO\n• индексация в Google и Яндекс\n• сравнение с 3 конкурентами\n• список конкретных шагов для роста заявок\n\nОтвет — в течение 24 часов в WhatsApp.' },
  { k: ['seo', 'сео', 'реклам', 'директ', 'ads', 'контекст'], a: 'Коротко:\n• Реклама (Директ, Google Ads) — заявки уже в первые дни, но платите за каждый клик.\n• SEO — результат через 2–3 месяца, зато поток заявок без оплаты за клик.\n\nЛучшая связка для малого бизнеса — стартовать с рекламы и параллельно растить SEO.' },
  { k: ['бот', 'ии', 'ai', 'ассистент', 'чат', 'нейро', 'gpt'], a: 'ИИ-ассистент как этот можно встроить в ваш сайт или WhatsApp: он знает ваши услуги и цены, отвечает 24/7, квалифицирует клиента и передаёт готовую заявку вам. Это экономит время менеджера и не теряет ночные обращения.' },
  { k: ['срок', 'долго', 'когда', 'быстро'], a: 'Лендинг — от 7 дней, многостраничный сайт — 2–3 недели, платформа с ИИ — по ТЗ. Работаем по этапам, вы видите прогресс.' },
  { k: ['сайт', 'лендинг', 'магазин'], a: 'Делаю быстрые сайты под заявки: продуманная структура, тексты под поисковые запросы, кнопки WhatsApp, аналитика. Расскажите нишу и город — подскажу, какой формат подойдёт.' },
  { k: ['привет', 'здравств', 'салам', 'сәлем', 'добрый'], a: 'Здравствуйте! 🙂 Чем занимается ваш бизнес и в каком городе? Подскажу, как получать больше клиентов из поиска.' },
];

function localAnswer(q) {
  const s = q.toLowerCase();
  const hit = KB.find((x) => x.k.some((k) => s.includes(k)));
  if (hit) return hit.a;
  return 'Хороший вопрос! Чтобы ответить точно, мне нужно посмотреть ваш сайт или нишу. Напишите в WhatsApp — сделаю бесплатный аудит и пришлю план роста заявок.';
}

async function askAI(q) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetch(CONFIG.aiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10) }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    if (!data.reply) throw new Error('empty');
    return data.reply;
  } catch {
    await new Promise((r) => setTimeout(r, 700));
    return localAnswer(q);
  }
}

async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  addMsg(text, 'user');
  history.push({ role: 'user', content: text });
  chatInput.value = '';
  const t = showTyping();
  const reply = await askAI(text);
  t.remove();
  history.push({ role: 'assistant', content: reply });
  const userTurns = history.filter((m) => m.role === 'user').length;
  const m = addMsg('', 'bot');
  await typeOut(m, reply);
  if (userTurns % 2 === 1) {
    // после ответа предлагаем перейти в WhatsApp
    const a = document.createElement('a');
    a.className = 'btn btn-wa btn-sm';
    a.href = waLink();
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = '<svg class="wa-ico" viewBox="0 0 24 24"><use href="#ico-wa"/></svg><span>Бесплатный аудит в WhatsApp</span>';
    m.appendChild(document.createElement('br'));
    m.appendChild(a);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  busy = false;
}

chatForm.addEventListener('submit', (e) => { e.preventDefault(); send(chatInput.value); });
chatQuick.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) send(b.textContent);
});
