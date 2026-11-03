/* GO-WORK.KZ: робот-помощник Алихана.
   На первом экране встречает гостя крупно в центре, дальше летает за посетителем по всем блокам,
   оставляя за собой сверкающий шлейф. На каждом блоке показывает свою эмоцию на экране-лице
   (улыбка, смех, смущение, «влюблённые» глаза, подмигивание, задумчивость, удивление) и говорит короткую фразу.
   Нажатие открывает окошко с готовыми вопросами и кнопкой WhatsApp (работает и без WebGL). */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = 'https://wa.me/77783244440?text=';
const bus = { talk: false, emotion: 'happy', pulse: 0 };   // общее состояние для 3D-сцены
const setEmotion = (e, ms) => { bus.emotion = e; bus.until = ms ? performance.now() + ms : 0; bus.pulse = performance.now(); };

/* ---------- Облачко на первом экране ---------- */
const LINES = [
  'Сәлем! Я робот-ассистент <b>Алихана</b>. Помогаю ему в работе и встречаю гостей сайта.',
  'Алихан, маркетолог и разработчик с большим опытом: делает <b>сайты с ИИ</b>, продвигает их в Google и Яндексе и настраивает рекламу.',
  'Наши результаты: <b>BuhTask</b>: ТОП-3 Google за 2 месяца, <b>ne-ti.kz</b>: ТОП-3 за 1 месяц.',
  'Хотите так же? Нажмите на меня, отвечу на вопросы. Или начнём с <b>бесплатного аудита</b>.',
];
const LINE_EMO = ['wave', 'happy', 'love', 'wink'];
(function bubble() {
  const p = document.getElementById('roboText'), dots = document.getElementById('roboDots');
  if (!p) return;
  const btns = dots ? [...dots.children] : [];
  let timer = 0;
  const show = (k) => {
    clearTimeout(timer);
    btns.forEach((b, j) => b.classList.toggle('on', j === k));
    if (bus.inHero !== false) setEmotion(LINE_EMO[k]);
    const html = LINES[k];
    if (reduce) { p.innerHTML = html; timer = setTimeout(() => show((k + 1) % LINES.length), 6000); return; }
    const plain = html.replace(/<[^>]+>/g, '');
    let n = 0; bus.talk = true;
    const type = () => {
      n += 2;
      if (n < plain.length) { p.innerHTML = plain.slice(0, n) + '<i class="cur"></i>'; timer = setTimeout(type, 24); }
      else { p.innerHTML = html; bus.talk = false; timer = setTimeout(() => show((k + 1) % LINES.length), 4200); }
    };
    type();
  };
  btns.forEach((b, j) => b.addEventListener('click', () => show(j)));
  setTimeout(() => show(0), reduce ? 0 : 1500);
})();

/* ---------- Окошко с готовыми вопросами ---------- */
const ANSWERS = {
  site: { q: 'Нужен сайт', emo: 'happy', wa: 'Здравствуйте! Хочу заказать сайт',
    a: 'Делаю сайты под ключ: <b>лендинг: от 7 дней</b>, сайт компании: 2–3 недели. Быстрые, с SEO-структурой с первого дня и заявками прямо в WhatsApp. <a class="p-link" href="/uslugi/sozdanie-saytov/">Подробнее о сайтах</a>' },
  ai: { q: 'Платформа с ИИ', emo: 'wink', wa: 'Здравствуйте! Хочу сайт или платформу с ИИ-ассистентом',
    a: 'Сделаю сайт или платформу с <b>ИИ-ассистентом</b>: он отвечает клиентам 24/7 на русском и казахском, считает стоимость и передаёт готовые заявки. Как я, только для вашего бизнеса. <a class="p-link" href="/uslugi/sayty-s-ii/">Подробнее</a>' },
  video: { q: 'ИИ-ролики', emo: 'laugh', wa: 'Здравствуйте! Хочу ИИ-ролики для бизнеса',
    a: 'ИИ-ролики без съёмок: сценарий, озвучка, VFX-звуки и монтаж. <b>10 роликов: 300 000 ₸</b>, 20 роликов: 500 000 ₸, Love Story: 100 000 ₸. <a class="p-link" href="/ai-roliki/">Смотреть пакеты</a>' },
  seo: { q: 'SEO и GEO', emo: 'love', wa: 'Здравствуйте! Хочу продвижение сайта (SEO и GEO)',
    a: 'Продвигаю в <b>Google и Яндексе</b>, а GEO делает так, чтобы вас советовали ChatGPT и Gemini. Результаты: <b>ne-ti.kz: ТОП-3 за 1 месяц</b>, <b>BuhTask: ТОП-3 за 2 месяца</b>. <a class="p-link" href="/uslugi/prodvizhenie-saytov/">SEO</a> · <a class="p-link" href="/uslugi/geo-optimizaciya/">GEO</a>' },
  ads: { q: 'Реклама', emo: 'surprised', wa: 'Здравствуйте! Хочу настроить рекламу',
    a: 'Настрою <b>Google Ads, Яндекс Директ</b> и таргет в Instagram и TikTok. Запуск за 3–5 рабочих дней, заявки, с первых дней, бюджет под контролем. <a class="p-link" href="/uslugi/kontekstnaya-reklama/">Подробнее</a>' },
  price: { q: 'Сколько стоит?', emo: 'shy', wa: 'Здравствуйте! Хочу бесплатный аудит и расчёт стоимости',
    a: 'Цена зависит от задачи, поэтому начнём с <b>бесплатного аудита за 24 часа</b>. После него Алихан назовёт точную стоимость, без скрытых платежей.' },
};
const panel = document.getElementById('roboPanel'), hit = document.getElementById('roboHit');
(function chat() {
  if (!panel || !hit) return;
  const body = document.getElementById('roboBody');
  const open = () => {
    panel.hidden = false; hit.setAttribute('aria-expanded', 'true'); bus.panel = true; setEmotion('happy', 2500);
    panel.classList.toggle('left', bus.side === 'left');
    setTimeout(() => panel.querySelector('.rp-quick button').focus({ preventScroll: true }), 50);
  };
  const close = () => { panel.hidden = true; hit.setAttribute('aria-expanded', 'false'); bus.panel = false; hit.focus({ preventScroll: true }); };
  hit.addEventListener('click', () => (panel.hidden ? open() : close()));
  // «Убрать робота»: прощается, машет и улетает; вернётся после обновления страницы
  document.getElementById('roboBye').addEventListener('click', () => {
    panel.hidden = true; bus.panel = false; bus.bye = performance.now();
    setEmotion('wave', 99999);
    const note = document.createElement('div'); note.className = 'robo-bye-note'; note.setAttribute('role', 'status');
    note.textContent = 'Пока-пока! Чтобы я вернулся, просто обновите страницу.';
    const tipEl = document.getElementById('roboTip');
    if (tipEl) tipEl.textContent = 'Пока-пока!';
    document.body.appendChild(note);
    setTimeout(() => { document.documentElement.classList.add('robo-gone'); bus.gone = true; }, document.documentElement.classList.contains('has-robot') ? 3400 : 0);
    setTimeout(() => note.remove(), 6500);
  });
  document.getElementById('roboClose').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  panel.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    const it = ANSWERS[b.dataset.q];
    body.insertAdjacentHTML('beforeend', `<div class="rp-msg me">${it.q}</div>`);
    bus.talk = true; setEmotion(it.emo, 4000);
    const typing = document.createElement('div'); typing.className = 'rp-msg bot'; typing.textContent = '…';
    body.appendChild(typing); body.scrollTop = body.scrollHeight;
    setTimeout(() => {
      typing.innerHTML = `${it.a}<br><a class="btn js-wa" href="${WA + encodeURIComponent(it.wa)}" target="_blank" rel="noopener">Написать в WhatsApp</a>`;
      bus.talk = false; body.scrollTop = body.scrollHeight;
    }, reduce ? 0 : 650);
  }));
})();

/* ---------- 3D ---------- */
const canvas = document.getElementById('companion');
const ok = canvas && !reduce && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
})();
if (ok) {
  const start = () => import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(init).catch(() => {});
  if (document.readyState === 'complete') setTimeout(start, 80); else addEventListener('load', () => setTimeout(start, 80));
}

// Блоки страницы: где робот висит, какую эмоцию показывает и что говорит
const STOPS = [
  ['.sheet', 'right', 'happy', 'Листайте вниз: кейсы будут сменяться!'],
  ['#finder-sec', 'left', 'thinking', 'Вот так клиенты находят сайт в Google.'],
  ['#services', 'right', 'wink', 'Выберите услугу, или нажмите на меня.'],
  ['#portfolio', 'left', 'love', 'BuhTask и ne-ti в ТОП-3. Горжусь!'],
  ['#ai', 'right', 'laugh', 'А это мой коллега, ИИ-чат. Спросите его!'],
  ['#ai-video', 'left', 'surprised', 'ИИ-ролики без съёмок, настоящая магия!'],
  ['#process', 'right', 'happy', 'Всего 4 шага до первых заявок.'],
  ['#popular', 'left', 'thinking', 'Ищете свой город? Он здесь.'],
  ['#faq', 'right', 'shy', 'Немного стесняюсь… но на вопросы отвечу!'],
  ['.final', 'left', 'love', 'Бесплатный аудит это правда бесплатно.'],
  ['.footer', 'right', 'wave', 'Пишите в WhatsApp, Алихан ответит!'],
];

/* Лицо: рисуется на холсте и натягивается на экран шлема. Голубые светящиеся глаза со «строками» как у дисплея */
function drawFace(ctx, emo, blink, t) {
  const W = 512, H = 256, cx = W / 2, cy = H / 2 + 6;
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260); g.addColorStop(0, 'rgba(40,60,90,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.shadowColor = '#47c8ff'; ctx.shadowBlur = 26; ctx.fillStyle = '#5fd2ff'; ctx.strokeStyle = '#5fd2ff'; ctx.lineCap = 'round';
  const dx = 92;
  const oval = (x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, rx, Math.max(2, ry * blink), 0, 0, Math.PI * 2); ctx.fill(); };
  const arc = (x, y, r, up, w = 15) => { ctx.lineWidth = w; ctx.beginPath(); if (up) ctx.arc(x, y + r * .55, r, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(x, y - r * .55, r, Math.PI * .15, Math.PI * .85); ctx.stroke(); };
  const heart = (x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y + s * .9); ctx.bezierCurveTo(x - s * 1.4, y - s * .1, x - s * .6, y - s * 1.1, x, y - s * .35); ctx.bezierCurveTo(x + s * .6, y - s * 1.1, x + s * 1.4, y - s * .1, x, y + s * .9); ctx.fill(); };
  const bob = Math.sin(t * 9) * 4;
  switch (emo) {
    case 'happy': case 'wave': arc(cx - dx, cy, 34, true); arc(cx + dx, cy, 34, true); break;
    case 'laugh': arc(cx - dx, cy + bob, 36, true, 17); arc(cx + dx, cy + bob, 36, true, 17); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy + 38 + bob, 26, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); break;
    case 'shy':
      oval(cx - dx + 6, cy + 22, 24, 17); oval(cx + dx - 6, cy + 22, 24, 17);
      ctx.shadowColor = '#ff6fae'; ctx.fillStyle = 'rgba(255,110,170,.75)';
      ctx.beginPath(); ctx.ellipse(cx - dx - 30, cy + 58, 30, 11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + dx + 30, cy + 58, 30, 11, 0, 0, 7); ctx.fill(); break;
    case 'love': ctx.shadowColor = '#ff5a8a'; ctx.fillStyle = '#ff6f98'; heart(cx - dx, cy + 6, 30 + bob * .6); heart(cx + dx, cy + 6, 30 + bob * .6); break;
    case 'wink': oval(cx - dx, cy, 34, 26); arc(cx + dx, cy, 32, true); break;
    case 'thinking': oval(cx - dx + 22, cy - 18, 28, 22); oval(cx + dx + 22, cy - 18, 28, 22); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx - dx - 10, cy - 64); ctx.lineTo(cx - dx + 40, cy - 72); ctx.stroke(); break;
    case 'surprised': ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx - dx, cy, 36 * Math.max(blink, .3), 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + dx, cy, 36 * Math.max(blink, .3), 0, 7); ctx.stroke(); break;
    default: oval(cx - dx, cy, 36, 27); oval(cx + dx, cy, 36, 27);
  }
  ctx.restore();
  // Строки дисплея
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
}

function init(THREE) {
  document.documentElement.classList.add('has-robot');
  const mobile = matchMedia('(max-width: 900px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const PR = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.3);
  renderer.setPixelRatio(PR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
  camera.position.z = 10;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4c, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 5, 6); scene.add(key);
  const rimB = new THREE.DirectionalLight(0x6fb8ff, 2.2); rimB.position.set(4, 1, -5); scene.add(rimB);
  const rimV = new THREE.DirectionalLight(0xb48cff, 1.4); rimV.position.set(-4, -2, -4); scene.add(rimV);

  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: .16, clearcoat: 1, clearcoatRoughness: .05 });
  const ringMat = new THREE.MeshPhysicalMaterial({ color: 0xc9d3e2, roughness: .3, metalness: .2, clearcoat: 1 });

  // ----- робот -----
  const robot = new THREE.Group();
  const rig = new THREE.Group(); robot.add(rig);   // rig качается/наклоняется отдельно от позиции

  // Корпус-«яйцо»: широкие плечи, к низу сужается в каплю
  const prof = new THREE.SplineCurve([
    new THREE.Vector2(0, .5), new THREE.Vector2(.42, .47), new THREE.Vector2(.6, .32), new THREE.Vector2(.62, .05),
    new THREE.Vector2(.52, -.42), new THREE.Vector2(.32, -.86), new THREE.Vector2(.1, -1.1), new THREE.Vector2(0, -1.14),
  ]).getPoints(48).reverse();
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 80), white); rig.add(body);
  const neck = new THREE.Mesh(new THREE.TorusGeometry(.34, .05, 16, 64), ringMat); neck.rotation.x = Math.PI / 2; neck.position.y = .52; rig.add(neck);

  // Голова парит над корпусом; экран, срез сферы, на него натянуто лицо
  const head = new THREE.Group(); head.position.y = 1.08; rig.add(head);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.62, 64, 48), white); shell.scale.set(1.22, .9, 1.02); head.add(shell);
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = 512; faceCanvas.height = 256;
  const fctx = faceCanvas.getContext('2d');
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace;
  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: faceTex, roughness: .08, clearcoat: 1, clearcoatRoughness: .02 });
  const face = new THREE.Mesh(new THREE.SphereGeometry(.6, 64, 32, Math.PI * .2, Math.PI * .6, Math.PI * .3, Math.PI * .4), faceMat);
  face.scale.set(1.24, .92, 1.06); face.position.z = .03; head.add(face);

  // Руки-«плавники» на шарнирах у плеч
  const fin = new THREE.SphereGeometry(1, 40, 28); fin.translate(0, -1, 0);
  const arm = (side) => { const g = new THREE.Group(); g.position.set(side * .7, .36, 0); const m = new THREE.Mesh(fin, white); m.scale.set(.15, .46, .18); g.add(m); rig.add(g); return g; };
  const armL = arm(-1), armR = arm(1);
  scene.add(robot);

  // ----- шлейф из искр -----
  const MAXP = mobile ? 520 : 1100;
  const pos = new Float32Array(MAXP * 3), col = new Float32Array(MAXP * 3), alpha = new Float32Array(MAXP), size = new Float32Array(MAXP);
  const vel = new Float32Array(MAXP * 3), life = new Float32Array(MAXP), maxl = new Float32Array(MAXP);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  pg.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const pm = new THREE.ShaderMaterial({
    uniforms: { uPR: { value: PR } }, transparent: true, depthWrite: false, premultipliedAlpha: true,
    vertexShader: 'attribute vec3 aColor; attribute float aAlpha; attribute float aSize; varying vec3 vC; varying float vA; uniform float uPR; void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uPR * (10. / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = 1. - smoothstep(0., .5, d); a = a * a * vA; gl_FragColor = vec4(vC * a, a); }',
  });
  const points = new THREE.Points(pg, pm); points.frustumCulled = false; scene.add(points);
  const PAL = [[.25, .62, 1], [.32, .38, 1], [.56, .32, 1], [1, .38, .72], [.3, .86, 1], [.85, .9, 1]];
  let pi = 0;
  const tipV = new THREE.Vector3();
  function emit(n, worldScale, vx, vy) {
    for (let k = 0; k < n; k++) {
      const i = pi; pi = (pi + 1) % MAXP;
      tipV.set((Math.random() - .5) * .5, -.75 - Math.random() * .4, (Math.random() - .5) * .4);
      rig.localToWorld(tipV);
      pos[i * 3] = tipV.x; pos[i * 3 + 1] = tipV.y; pos[i * 3 + 2] = tipV.z;
      vel[i * 3] = (Math.random() - .5) * .35 * worldScale - vx * .25; vel[i * 3 + 1] = (-.25 - Math.random() * .45) * worldScale - vy * .25; vel[i * 3 + 2] = (Math.random() - .5) * .2;
      const c = PAL[(Math.random() * PAL.length) | 0]; col.set(c, i * 3);
      maxl[i] = life[i] = .9 + Math.random() * 1.4;
      size[i] = (4 + Math.random() * 14) * Math.max(.45, worldScale);
    }
  }

  // ----- экран ↔ мир -----
  let W = innerWidth, H = innerHeight, VH = 2 * Math.tan(15 * Math.PI / 180) * 10;
  const resize = () => { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  const toWorld = (px, py) => [(px - W / 2) / H * VH, -(py - H / 2) / H * VH];
  const MODEL_H = 2.45; // высота робота в единицах сцены (от низа капли до макушки)

  // ----- куда лететь -----
  const hero = document.querySelector('.hero-robo'), space = document.querySelector('.robot-space');
  const stops = STOPS.map(([sel, side, emo, say]) => ({ el: document.querySelector(sel), side, emo, say })).filter((s) => s.el);
  const tip = document.getElementById('roboTip');
  let cur = null, tipUntil = 0;
  function target() {
    if (bus.bye) {
      const el = (performance.now() - bus.bye) / 1000;
      if (el > 1.6) return { x: W + 260, y: -260, h: st.h * .9, mode: 'side' };
      return { x: st.x, y: st.y - 10, h: st.h, mode: 'side' };
    }
    if (bus.panel) { // окно вопросов открыто, робот рядом с ним
      const r = panel.getBoundingClientRect(), left = bus.side === 'left';
      const sz = mobile ? 92 : 130;
      return { x: mobile ? W - 60 : (left ? r.right + 80 : r.left - 80), y: mobile ? r.top - 60 : r.top + 90, h: sz, mode: 'panel' };
    }
    if (hero) {
      const r = hero.getBoundingClientRect();
      if (r.bottom > H * .55) {
        bus.inHero = true;
        if (mobile && space) { const s = space.getBoundingClientRect(); return { x: W / 2, y: s.top + s.height * .5, h: s.height * .92, mode: 'hero' }; }
        return { x: W / 2, y: r.top + r.height * .45, h: Math.min(r.height * .5, 520), mode: 'hero' };
      }
    }
    bus.inHero = false;
    let stop = stops[0];
    for (const s of stops) { const r = s.el.getBoundingClientRect(); if (r.top < H * .6) stop = s; }
    if (stop !== cur) {
      cur = stop; bus.side = stop.side;
      if (!bus.until || performance.now() > bus.until) setEmotion(stop.emo);
      tip.textContent = stop.say; tipUntil = performance.now() + 3400; tip.classList.add('on');
    }
    if (mobile) return { x: 44, y: H - 96, h: 74, mode: 'side' };
    const left = stop.side === 'left';
    const gx = Math.max(58, (W - 1320) / 2 - 20);
    return { x: left ? gx : W - gx, y: H * .6, h: Math.min(150, H * .2), mode: 'side' };
  }

  // ----- анимация -----
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  const st = { x: W / 2, y: H / 2, h: 300, vx: 0, vy: 0, vh: 0 };
  let blink = 1, nextBlink = 2, blinkEnd = 0, faceKey = '';
  const clock = new THREE.Clock();
  let raf = 0;
  const lerp = (a, b, k) => a + (b - a) * k;

  function loop() {
    raf = 0;
    if (document.hidden || bus.gone) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    const tg = target();
    // Пружина: перелёт с небольшим «нахлёстом»
    const K = tg.mode === 'hero' ? 90 : 26, C = tg.mode === 'hero' ? 19 : 9;
    st.vx += ((tg.x - st.x) * K - st.vx * C) * dt; st.vy += ((tg.y - st.y) * K - st.vy * C) * dt; st.vh += ((tg.h - st.h) * K - st.vh * C) * dt;
    st.x += st.vx * dt; st.y += st.vy * dt; st.h += st.vh * dt;

    const [wx, wy] = toWorld(st.x, st.y);
    const scale = st.h / H * VH / MODEL_H;
    robot.position.set(wx, wy - .1 * scale, 0);
    robot.scale.setScalar(scale);

    // Эмоции и позы
    if (bus.until && performance.now() > bus.until) { bus.until = 0; if (cur && !bus.inHero) bus.emotion = cur.emo; }
    const emo = bus.emotion;
    const speed = Math.hypot(st.vx, st.vy);
    rig.rotation.z = lerp(rig.rotation.z, Math.max(-.5, Math.min(.5, -st.vx * .0011)) + Math.sin(t * 1.3) * .03, .12);
    rig.rotation.x = lerp(rig.rotation.x, Math.min(.35, speed * .0004), .1);
    const hop = emo === 'laugh' ? Math.abs(Math.sin(t * 10)) * .08 : 0;
    rig.position.y = Math.sin(t * 1.8) * .05 + hop;
    // Голова смотрит на курсор
    const [mx, my] = toWorld(mouse.x || W / 2, mouse.y || H / 2);
    const lookY = Math.max(-.6, Math.min(.6, (mx - wx) * .25 / Math.max(scale, .3)));
    const lookX = Math.max(-.35, Math.min(.35, -(my - wy) * .2 / Math.max(scale, .3)));
    let hx = -lookX, hy = lookY, hz = Math.sin(t * .9) * .05, headY = 1.08 + Math.sin(t * 2.1 + 1) * .025;
    if (emo === 'shy') { hx = .32; hy = .35; hz = .22; }
    if (emo === 'thinking') { hz = -.18; hx = -.15; }
    if (emo === 'love') { hz = Math.sin(t * 3) * .12; }
    head.rotation.x = lerp(head.rotation.x, hx, .12); head.rotation.y = lerp(head.rotation.y, hy, .12); head.rotation.z = lerp(head.rotation.z, hz, .12);
    head.position.y = headY;
    // Руки: [поворот вперёд, разведение] для каждой эмоции
    const P = {
      wave: [[0, -.18], [0, 2.5 + Math.sin(t * 9) * .4]],
      happy: [[0, -.5 - Math.sin(t * 5) * .1], [0, .5 + Math.sin(t * 5) * .1]],
      laugh: [[0, -1.9 - Math.sin(t * 14) * .2], [0, 1.9 + Math.sin(t * 14) * .2]],
      shy: [[-1.6, .55], [-1.6, -.55]],
      love: [[-1.1, .75], [-1.1, -.75]],
      wink: [[0, -.2], [-.4, 1.2]],
      thinking: [[0, -.15], [-1.9, -.35]],
      surprised: [[0, -1.05], [0, 1.05]],
    }[emo] || [[0, -.18], [0, .18]];
    const fly = Math.min(.8, speed * .0012); // в полёте руки отводятся назад
    armL.rotation.x = lerp(armL.rotation.x, P[0][0] + fly, .14); armL.rotation.z = lerp(armL.rotation.z, P[0][1], .14);
    armR.rotation.x = lerp(armR.rotation.x, P[1][0] + fly, .14); armR.rotation.z = lerp(armR.rotation.z, P[1][1], .14);

    // Моргание и лицо
    if (t > nextBlink) { blinkEnd = t + .13; nextBlink = t + 2.4 + Math.random() * 3; }
    blink = t < blinkEnd ? .12 : lerp(blink, 1, .3);
    const talkOpen = bus.talk ? (Math.sin(t * 16) > 0 ? 1 : 0) : 0;
    const key2 = emo + '|' + blink.toFixed(1) + '|' + (emo === 'laugh' || emo === 'love' ? (t * 10 | 0) : '') + talkOpen;
    if (key2 !== faceKey) { faceKey = key2; drawFace(fctx, emo, blink, t); if (talkOpen && emo !== 'laugh') { fctx.save(); fctx.shadowColor = '#47c8ff'; fctx.shadowBlur = 18; fctx.fillStyle = '#5fd2ff'; fctx.beginPath(); fctx.ellipse(256, 210, 26, 7, 0, 0, 7); fctx.fill(); fctx.restore(); } faceTex.needsUpdate = true; }

    // Шлейф: чем быстрее летит, тем гуще искры
    const wvx = st.vx / H * VH, wvy = -st.vy / H * VH;
    emit(Math.round((tg.mode === 'hero' ? 34 : 24) * dt * 60 * .25 + Math.min(14, speed * .02)), scale, wvx, wvy);
    for (let i = 0; i < MAXP; i++) {
      if (life[i] <= 0) { alpha[i] = 0; continue; }
      life[i] -= dt;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      vel[i * 3] *= .985; vel[i * 3 + 1] *= .985;
      const k = life[i] / maxl[i];
      alpha[i] = Math.max(0, k) * (.55 + .45 * Math.sin(t * 20 + i));
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.aAlpha.needsUpdate = true;
    pg.attributes.aColor.needsUpdate = true; pg.attributes.aSize.needsUpdate = true;

    renderer.render(scene, camera);

    // Кнопка-«хитбокс» поверх робота и подсказка рядом
    const hw = st.h * (tg.mode === 'hero' ? .42 : .62), hh = st.h * (tg.mode === 'hero' ? .78 : 1);
    hit.style.width = hw + 'px'; hit.style.height = hh + 'px';
    hit.style.transform = `translate(${st.x - hw / 2}px, ${st.y - st.h * .5}px)`;
    if (tip) {
      const showTip = (bus.bye && performance.now() - bus.bye < 1600) || (!bus.inHero && !bus.panel && performance.now() < tipUntil);
      tip.classList.toggle('on', showTip);
      if (showTip) {
        const left = bus.side === 'left' || mobile;
        const tx = left ? st.x + st.h * .45 : st.x - st.h * .45 - tip.offsetWidth;
        tip.style.transform = `translate(${Math.max(8, Math.min(W - tip.offsetWidth - 8, tx))}px, ${st.y - st.h * .55}px)`;
      }
    }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) { clock.getDelta(); raf = requestAnimationFrame(loop); } });
  hit.addEventListener('pointerenter', () => { if (!bus.panel) setEmotion('shy', 1500); });
  raf = requestAnimationFrame(loop);
}
