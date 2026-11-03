/* GO-WORK.KZ: первый экран — 3D-робот, ИИ-ассистент Алихана.
   Робот парит перед огромным GO-WORK, машет рукой, моргает, следит за курсором и «говорит»:
   в облачке по очереди печатаются фразы о том, кто он, чем занимается Алихан и какие есть результаты.
   Облачко работает всегда; 3D (three.js) — только при наличии WebGL и без «уменьшения движения». */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const talk = { on: false };

/* ---------- Облачко с фразами ---------- */
const LINES = [
  'Сәлем! Я робот-ассистент <b>Алихана</b>. Помогаю ему в работе и встречаю гостей сайта.',
  'Алихан — маркетолог и разработчик с большим опытом: делает <b>сайты с ИИ</b>, продвигает их в Google и Яндексе и настраивает рекламу.',
  'Наши результаты: <b>BuhTask</b> — ТОП-3 Google за 2 месяца, <b>ne-ti.kz</b> — ТОП-3 за 1 месяц.',
  'Хотите так же? Начнём с <b>бесплатного аудита</b> — напишите нам в WhatsApp.',
];
(function bubble() {
  const p = document.getElementById('roboText'), dots = document.getElementById('roboDots');
  if (!p) return;
  const btns = dots ? [...dots.children] : [];
  let i = 0, timer = 0;
  const show = (k) => {
    clearTimeout(timer); i = k;
    btns.forEach((b, j) => b.classList.toggle('on', j === k));
    const html = LINES[k];
    if (reduce) { p.innerHTML = html; timer = setTimeout(() => show((k + 1) % LINES.length), 6000); return; }
    const plain = html.replace(/<[^>]+>/g, '');
    let n = 0; talk.on = true;
    const type = () => {
      n += 2;
      if (n < plain.length) { p.innerHTML = plain.slice(0, n) + '<i class="cur"></i>'; timer = setTimeout(type, 24); }
      else { p.innerHTML = html; talk.on = false; timer = setTimeout(() => show((k + 1) % LINES.length), 4200); }
    };
    type();
  };
  btns.forEach((b, j) => b.addEventListener('click', () => show(j)));
  setTimeout(() => show(0), reduce ? 0 : 1500);
})();

/* ---------- 3D-робот ---------- */
const canvas = document.getElementById('robot');
const hero = canvas && canvas.closest('.hero');
const ok = canvas && !reduce && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
})();
if (ok) {
  const start = () => import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(init).catch(() => {});
  if (document.readyState === 'complete') setTimeout(start, 100); else addEventListener('load', () => setTimeout(start, 100));
}

function init(THREE) {
  document.documentElement.classList.add('has-robot'); // сначала показать полотно, чтобы измерить его размер
  const mobile = innerWidth <= 900;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, .35, 9.5);

  // Студийный свет: тёплый ключ, оранжевый и лаймовый контровые, мягкий общий
  scene.add(new THREE.HemisphereLight(0xffffff, 0x30303a, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-3, 5, 6); scene.add(key);
  const rimO = new THREE.DirectionalLight(0xff6a2a, 3); rimO.position.set(5, 2, -4); scene.add(rimO);
  const rimL = new THREE.DirectionalLight(0xd4ff3a, 1.6); rimL.position.set(-5, -1, -3); scene.add(rimL);

  const white = new THREE.MeshPhysicalMaterial({ color: 0xf3f4f7, roughness: .32, clearcoat: 1, clearcoatRoughness: .12 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x0b0b10, roughness: .12, metalness: .3, clearcoat: 1, clearcoatRoughness: .04 });
  const orange = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: .3, clearcoat: 1, clearcoatRoughness: .1 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xd4ff3a });
  const glowO = new THREE.MeshBasicMaterial({ color: 0xff7a3a });
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

  const robot = new THREE.Group();
  // Корпус и значок на груди
  const body = new THREE.Group();
  body.add(M(new THREE.CapsuleGeometry(.6, .5, 16, 48), white, 0, -.32, 0));
  const badge = M(new THREE.CylinderGeometry(.19, .19, .05, 48), orange, 0, -.12, .6); badge.rotation.x = Math.PI / 2; body.add(badge);
  const ring = M(new THREE.TorusGeometry(.25, .025, 16, 64), glow, 0, -.12, .6); body.add(ring);
  body.add(M(new THREE.CylinderGeometry(.2, .26, .2, 32), dark, 0, .38, 0));
  robot.add(body);

  // Голова: шлем, тёмное стекло-экран, глаза, улыбка, уши, антенна
  const head = new THREE.Group(); head.position.y = .98;
  const shell = M(new THREE.SphereGeometry(.78, 64, 48), white); shell.scale.set(1.18, .94, .96); head.add(shell);
  const visor = M(new THREE.SphereGeometry(.7, 64, 48), dark, 0, -.02, .36); visor.scale.set(1.06, .72, .62); head.add(visor);
  const eyeGeo = new THREE.CapsuleGeometry(.07, .13, 8, 24);
  const eyeL = M(eyeGeo, glow, -.25, .05, .74), eyeR = M(eyeGeo, glow, .25, .05, .74);
  head.add(eyeL, eyeR);
  const mouth = M(new THREE.TorusGeometry(.11, .022, 12, 32, Math.PI), glow, 0, -.17, .73); mouth.rotation.z = Math.PI; head.add(mouth);
  [-1, 1].forEach((s) => { const e = M(new THREE.CylinderGeometry(.17, .17, .14, 32), orange, s * .92, 0, 0); e.rotation.z = Math.PI / 2; head.add(e); });
  head.add(M(new THREE.CylinderGeometry(.025, .025, .34, 12), dark, 0, .86, 0));
  const tip = M(new THREE.SphereGeometry(.09, 24, 16), glowO, 0, 1.05, 0); head.add(tip);
  robot.add(head);

  // Руки на шарнирах в плечах: правая (слева от зрителя) машет
  const arm = (side) => {
    const g = new THREE.Group(); g.position.set(side * .74, .12, 0);
    g.add(M(new THREE.CapsuleGeometry(.13, .42, 8, 24), white, 0, -.34, 0));
    g.add(M(new THREE.SphereGeometry(.17, 32, 24), orange, 0, -.7, 0));
    robot.add(g); return g;
  };
  const armL = arm(-1), armR = arm(1);

  // Парящее кольцо под роботом
  const hover = M(new THREE.TorusGeometry(.46, .04, 16, 64), glow, 0, -1.2, 0); hover.rotation.x = Math.PI / 2; robot.add(hover);
  const halo = M(new THREE.CircleGeometry(.9, 48), new THREE.MeshBasicMaterial({ color: 0xd4ff3a, transparent: true, opacity: .12, depthWrite: false }), 0, -1.22, 0); halo.rotation.x = -Math.PI / 2; robot.add(halo);
  scene.add(robot);

  let H = 1;
  const size = () => {
    const W = canvas.clientWidth, h = canvas.clientHeight; H = hero.clientHeight;
    renderer.setSize(W, h, false);
    camera.aspect = W / h; camera.updateProjectionMatrix();
    // Робот занимает около 60% высоты первого экрана на компьютере и всю высоту полотна на телефоне
    robot.scale.setScalar(mobile ? 1.3 : Math.min(.9, Math.max(.7, h / 1100)));
    robot.position.y = mobile ? -.2 : -.15;
  };
  size();
  addEventListener('resize', size);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });
  let waveUntil = 3.2, nextWave = 11, nextBlink = 2.5, blinkEnd = 0;
  canvas.addEventListener('pointerdown', () => { waveUntil = clock.getElapsedTime() + 2.2; });

  let visible = true, raf = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });

  const clock = new THREE.Clock();
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;
    const sy = Math.min(scrollY / H, 1);
    // Парит, наклоняется за курсором, при прокрутке поднимается и уменьшается
    robot.position.y = (mobile ? -.2 : .05) + Math.sin(t * 1.6) * .07 + sy * 1.2;
    robot.rotation.y = mouse.x * .35;
    robot.rotation.z = Math.sin(t * .9) * .025;
    const base = mobile ? 1.3 : Math.min(.9, Math.max(.7, canvas.clientHeight / 1100));
    robot.scale.setScalar(base * (1 - sy * .35));
    head.rotation.y = mouse.x * .55; head.rotation.x = mouse.y * .3; head.rotation.z = Math.sin(t * .7) * .04;
    // Моргание
    if (t > nextBlink) { blinkEnd = t + .13; nextBlink = t + 2.5 + Math.random() * 3; }
    const eyeS = t < blinkEnd ? .15 : 1; eyeL.scale.y = eyeR.scale.y = eyeS;
    // Рот «говорит», пока в облачке печатается текст
    mouth.scale.y = talk.on ? .6 + Math.abs(Math.sin(t * 18)) * 1.2 : 1;
    // Помахать рукой: при загрузке, по клику и время от времени
    if (t > nextWave) { waveUntil = t + 2.2; nextWave = t + 12; }
    const waving = t < waveUntil;
    const target = waving ? 2.55 + Math.sin(t * 9) * .38 : .22 + Math.sin(t * 1.3) * .05;
    armR.rotation.z += (target - armR.rotation.z) * .15;
    armL.rotation.z = -.22 - Math.sin(t * 1.3 + 1) * .05;
    tip.material.color.setHSL(.06, 1, .55 + Math.sin(t * 4) * .1);
    hover.scale.setScalar(1 + Math.sin(t * 3) * .06);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  canvas.classList.add('on');
  raf = requestAnimationFrame(loop);
}
