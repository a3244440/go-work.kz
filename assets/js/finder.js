/* GO-WORK.KZ: блок «Как вас находят», живая демонстрация пути клиента.
   Набирается запрос в Google → выдача с сайтом клиента → переход на сайт → сообщение в WhatsApp → «Новая заявка».
   Сценарии сменяют друг друга; можно выбрать вручную. Работает только пока блок на экране. */
(function () {
  var root = document.getElementById('finder');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CASES = [
    {
      tab: 'забивка свай астана', q: 'забивка свай астана', url: 'ne-ti.kz', biz: 'NE-TI', ava: 'N', rank: 2,
      title: 'Забивка свай в Астане: NE-TI | Расчёт за 15 минут', desc: 'Забивка ж/б свай под фундамент в Астане и области. Своя техника, выезд на объект, расчёт стоимости онлайн.',
      msg: 'Здравствуйте! Нужна забивка свай под фундамент дома, сколько будет стоить?',
      site: '<div class="fd-mock"><div class="fd-mock-nav"><b>NE-TI</b><span>Услуги</span><span>Техника</span><span>Контакты</span></div><div class="fd-mock-hero"><small>Астана и область</small><h4>Забивка свай под фундамент</h4><p>Своя техника · выезд в день обращения</p><span class="fd-mock-btn">Рассчитать стоимость</span></div><div class="fd-mock-row"><i></i><i></i><i></i></div></div>'
    },
    {
      tab: 'кухни на заказ астана', q: 'кухни на заказ астана', url: 'khanmebel.vercel.app', biz: 'Khan Mebel', ava: 'K', rank: 0,
      title: 'Кухни и мебель на заказ в Астане: Khan Mebel', desc: 'Своё производство, замер и дизайн-проект бесплатно. Рассчитайте стоимость кухни онлайн за минуту.',
      msg: 'Здравствуйте! Хочу кухню на заказ, длина около 3 метров. Можно замер?',
      site: '<img src="/assets/img/work/khan-mebel.jpg" alt="" loading="lazy">'
    },
    {
      tab: 'умра 2026 из астаны', q: 'умра 2026 из астаны', url: 'smart-travel.kz', biz: 'Smart Travel', ava: 'S', rank: 1,
      title: 'Умра 2026 из Астаны: туры VIP, Luxe, Standard | Smart Travel', desc: 'Туры в Мекку и Медину с заботой о каждой детали. Виза в Саудовскую Аравию по фото паспорта.',
      msg: 'Ассаламу алейкум! Подскажите, есть ли места на Умру в марте на двоих?',
      site: '<img src="/assets/img/work/smart-travel.jpg" alt="" loading="lazy">'
    },
    {
      tab: 'спортивная форма на заказ', q: 'спортивная форма на заказ', url: 'abadansport.kz', biz: 'ABADAN SPORT', ava: 'A', rank: 0,
      title: 'Спортивная форма на заказ для команд: ABADAN SPORT', desc: 'Футбольная, баскетбольная и волейбольная форма с вашим логотипом. Пошив от 10 комплектов.',
      msg: 'Здравствуйте! Нужна футбольная форма на команду, 15 комплектов с логотипом.',
      site: '<img src="/assets/img/work/abadan-sport.jpg" alt="" loading="lazy">'
    }
  ];
  var OTHERS = [
    ['Каталог компаний: 2ГИС', '2gis.kz', 'Адреса, телефоны и отзывы о компаниях вашего города.'],
    ['Объявления, OLX.kz', 'olx.kz', 'Частные объявления и услуги в Казахстане.'],
    ['Товары и услуги, Satu.kz', 'satu.kz', 'Каталог предложений от компаний Казахстана.']
  ];

  var steps = $('fdSteps').children, tabs = $('fdTabs');
  var cur = 0, timers = [], visible = false, running = false;

  CASES.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = c.tab;
    b.addEventListener('click', function () { play(i, true); });
    tabs.appendChild(b);
  });

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function step(n) { for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', i <= n); }
  function pane(id) { ['fdHome', 'fdSerp', 'fdSite'].forEach(function (p) { $(p).classList.toggle('on', p === id); }); }

  function build(c) {
    $('fdSerpQ').textContent = c.q;
    var list = OTHERS.slice();
    var me = { me: true, t: c.title, u: c.url, d: c.desc };
    var res = list.map(function (o) { return { t: o[0], u: o[1], d: o[2] }; });
    res.splice(c.rank, 0, me);
    $('fdResults').innerHTML = res.map(function (r) {
      return '<div class="fd-res' + (r.me ? ' me' : '') + '"><small>' + r.u + '</small><b>' + r.t + '</b><p>' + r.d + '</p>' + (r.me && c.rank === 2 ? '<em>ТОП-3</em>' : '') + '</div>';
    }).join('');
    $('fdSite').innerHTML = c.site;
    $('fdBiz').textContent = c.biz; $('fdAva').textContent = c.ava;
    $('fdToastSite').textContent = c.url + ' · «' + c.q + '»';
    $('fdMsg').textContent = c.msg;
  }

  function cursorTo(el) {
    var v = root.querySelector('.fd-view').getBoundingClientRect(), r = el.getBoundingClientRect();
    var cu = $('fdCursor');
    cu.style.transform = 'translate(' + (r.left - v.left + Math.min(r.width * .35, 160)) + 'px,' + (r.top - v.top + r.height * .45) + 'px)';
  }

  function play(i, manual) {
    clear(); cur = i; running = true;
    var c = CASES[i];
    Array.prototype.forEach.call(tabs.children, function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    build(c);
    root.classList.remove('chat', 'typing', 'sent', 'toast', 'click');
    $('fdUrl').textContent = 'google.kz'; $('fdQ').textContent = ''; $('fdCursor').style.transform = '';
    pane('fdHome'); step(0);
    if (reduce) { pane('fdSite'); $('fdUrl').textContent = c.url; root.classList.add('chat', 'sent', 'toast'); step(3); return; }
    // 1. набор запроса
    var t = 500;
    c.q.split('').forEach(function (ch, k) { at(t + k * 55, function () { $('fdQ').textContent = c.q.slice(0, k + 1); }); });
    t += c.q.length * 55 + 450;
    // 2. выдача
    at(t, function () { pane('fdSerp'); $('fdUrl').textContent = 'google.kz/search?q=' + c.q.replace(/ /g, '+'); step(1); });
    at(t + 900, function () { cursorTo(root.querySelector('.fd-res.me b')); });
    at(t + 1700, function () { root.classList.add('click'); });
    // 3. сайт и WhatsApp
    at(t + 2000, function () { root.classList.remove('click'); pane('fdSite'); $('fdUrl').textContent = c.url; step(2); $('fdCursor').style.transform = ''; });
    at(t + 3000, function () { root.classList.add('chat', 'typing'); });
    at(t + 4400, function () { root.classList.remove('typing'); root.classList.add('sent'); });
    // 4. заявка
    at(t + 5200, function () { root.classList.add('toast'); step(3); });
    at(t + 8200, function () { if (visible) play((cur + 1) % CASES.length); else running = false; });
  }

  new IntersectionObserver(function (e) {
    visible = e[0].isIntersecting;
    if (visible && !running) play(cur);
  }, { threshold: .35 }).observe(root);
})();
