/* GO-WORK.KZ: 3D-сцена первого экрана (three.js).
   Глянцевая объёмная буква «G» из логотипа в студийном свете, рядом — чёрное кольцо, лаймовая и белая сферы.
   Объекты медленно покачиваются, поворачиваются за курсором и уезжают при прокрутке.
   Грузится только на больших экранах с WebGL и без «уменьшения движения»; рисует, только когда первый экран виден. */
const canvas = document.getElementById('orb');
const hero = canvas && canvas.closest('.hero');
const ok = canvas && innerWidth >= 820 && !matchMedia('(prefers-reduced-motion: reduce)').matches && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
})();

if (ok) {
  const start = () => import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(init).catch(() => {});
  if (document.readyState === 'complete') setTimeout(start, 300); else addEventListener('load', () => setTimeout(start, 300));
}

// Контур буквы «G»: дуга кольца с вырезом справа сверху + перекладина
function letterG(THREE) {
  const R = 1, r = .58, a0 = 42 * Math.PI / 180, a1 = 2 * Math.PI;
  const ring = new THREE.Shape();
  ring.absarc(0, 0, R, a0, a1, false);
  ring.absarc(0, 0, r, a1, a0, true);
  ring.closePath();
  const opts = { depth: .42, bevelEnabled: true, bevelThickness: .09, bevelSize: .07, bevelSegments: 8, curveSegments: 72 };
  const g1 = new THREE.ExtrudeGeometry(ring, opts);
  const barShape = new THREE.Shape();
  barShape.moveTo(.1, -.02); barShape.lineTo(.92, -.02); barShape.lineTo(.92, .3); barShape.lineTo(.1, .3); barShape.closePath();
  const g2 = new THREE.ExtrudeGeometry(barShape, opts);
  return [g1, g2];
}

function init(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.z = 15;

  // Студийный свет: мягкий общий, тёплый ключевой, холодный контровой, лаймовый снизу
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 1.1));
  const key = new THREE.DirectionalLight(0xfff2e6, 2.6); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8f7bff, 2.2); rim.position.set(6, 2, -6); scene.add(rim);
  const fill = new THREE.PointLight(0xd4ff3a, 18, 20, 2); fill.position.set(0, -5, 4); scene.add(fill);

  const orange = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, sheen: .4, sheenColor: new THREE.Color(0xffb38a) });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: .22, metalness: .2, clearcoat: 1, clearcoatRoughness: .05 });
  const lime = new THREE.MeshPhysicalMaterial({ color: 0xd4ff3a, roughness: .35, clearcoat: .8, clearcoatRoughness: .2 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .18, clearcoat: 1, clearcoatRoughness: .05 });

  const G = new THREE.Group();
  letterG(THREE).forEach((geo) => { geo.translate(0, 0, -.21); G.add(new THREE.Mesh(geo, orange)); });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .2, 48, 120), black);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.42, 64, 48), lime);
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(.26, 48, 32), white);
  const pill = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .55, 12, 32), white);

  const items = [
    { m: G, ax: .86, ay: .6, z: 0, s: .85, sway: [.35, .5], par: 1.4, base: [-.25, -.45, .08] },
    { m: ring, ax: -.78, ay: .22, z: -.5, s: 1, sway: [.5, .6], par: 2.2, base: [1.1, .3, 0] },
    { m: ball, ax: -.58, ay: .74, z: .5, s: 1, sway: [.3, .3], par: 2.8, base: [0, 0, 0] },
    { m: pearl, ax: .55, ay: .02, z: 1, s: 1, sway: [.3, .3], par: 3.2, base: [0, 0, 0] },
    { m: pill, ax: -.66, ay: -.12, z: .8, s: 1, sway: [.6, .4], par: 2.6, base: [.4, 0, .9] }
  ];
  items.forEach((it, i) => { scene.add(it.m); it.ph = i * 1.9; });

  let H = 0, hw = 1, hh = 1;
  const size = () => {
    const W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    hh = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z; hw = hh * camera.aspect;
    const sc = Math.max(.65, Math.min(1, W / 1500));
    items.forEach((it) => it.m.scale.setScalar(it.s * sc));
  };
  size();
  addEventListener('resize', size);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });

  let visible = true, raf = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });

  const clock = new THREE.Clock();
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    const sy = Math.min(scrollY / Math.max(H, 1), 1.2);
    items.forEach((it, i) => {
      const m = it.m, side = Math.sign(it.ax);
      m.position.set(
        it.ax * hw + side * sy * hw * .3 + mouse.x * it.par * .5,
        it.ay * hh + Math.sin(t * .7 + it.ph) * .14 + sy * hh * (.45 + i * .18) - mouse.y * it.par * .4,
        it.z
      );
      m.rotation.set(
        it.base[0] + Math.sin(t * .5 + it.ph) * it.sway[0] * .4 + mouse.y * .5 + sy * .8,
        it.base[1] + Math.sin(t * .4 + it.ph) * it.sway[1] + mouse.x * .9 + sy * 1.4 * side,
        it.base[2]
      );
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  document.documentElement.classList.add('has-orb');
  canvas.classList.add('on');
  raf = requestAnimationFrame(loop);
}
