/* GO-WORK.KZ: первый экран — «светящийся зал» на three.js.
   Коридор из вертикальных неоновых панелей (оранжевые, синие, фиолетовые, лаймовые) с отражением на мокром полу.
   Камера медленно плывёт вперёд, поворачивается за курсором и уходит вверх при прокрутке.
   Рисует только пока первый экран виден; без WebGL или при «уменьшении движения» остаётся CSS-замена. */
const canvas = document.getElementById('scene');
const hero = canvas && canvas.closest('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ok = canvas && !reduce && (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
})();

if (ok) {
  const start = () => import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(init).catch(() => {});
  if (document.readyState === 'complete') setTimeout(start, 150); else addEventListener('load', () => setTimeout(start, 150));
}

function init(THREE) {
  const mobile = innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x050507, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 62 : 48, 1, .1, 120);

  // ---------- панели: позиции, размеры, цвета ----------
  const palette = [[1, .36, .12], [1, .55, .2], [.3, .42, 1], [.48, .36, 1], [.83, 1, .23], [1, .86, .7]];
  const weights = [5, 3, 4, 2, 1, 1];
  const pick = (r) => { let s = 0; const tot = weights.reduce((a, b) => a + b, 0); r *= tot; for (let i = 0; i < weights.length; i++) { s += weights[i]; if (r < s) return palette[i]; } return palette[0]; };
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const panels = [];
  for (let z = 7; z > -46; z -= .82) {
    for (const side of [-1, 1]) {
      const h = 3.2 + rnd() * 5.5;
      panels.push({ x: side * (2.1 + rnd() * 1.3), z: z + rnd() * .4, w: .14 + rnd() * .34, h, rot: side * (.35 + rnd() * .5), c: pick(rnd()), ph: rnd() * 6.28, sp: .6 + rnd() * 1.8 });
    }
  }
  for (let x = -9; x <= 9; x += .7) {
    const h = 4 + rnd() * 7;
    panels.push({ x: x + rnd() * .3, z: -46 - rnd() * 3, w: .2 + rnd() * .4, h, rot: 0, c: pick(rnd()), ph: rnd() * 6.28, sp: .4 + rnd() });
  }
  const N = panels.length;

  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, .5, 0); // низ панели на полу
  const aColor = new Float32Array(N * 3), aPhase = new Float32Array(N * 2);
  panels.forEach((p, i) => { aColor.set(p.c, i * 3); aPhase.set([p.ph, p.sp], i * 2); });
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(aPhase, 2));

  const mat = (refl) => new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uRefl: { value: refl } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `
      attribute vec3 aColor; attribute vec2 aPhase;
      varying vec2 vUv; varying vec3 vC; varying float vDepth; varying float vFl; varying float vY;
      uniform float uT;
      void main(){
        vUv = uv; vC = aColor;
        vFl = .78 + .22 * sin(uT * aPhase.y + aPhase.x) + .08 * sin(uT * 7.3 + aPhase.x * 3.);
        vec4 wp = instanceMatrix * vec4(position, 1.);
        vY = wp.y;
        vec4 mv = viewMatrix * modelMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uRefl;
      varying vec2 vUv; varying vec3 vC; varying float vDepth; varying float vFl; varying float vY;
      void main(){
        float dx = (vUv.x - .5) * 2.;
        float core = exp(-dx * dx * 28.);            // яркая нить
        float halo = exp(-dx * dx * 3.2) * .35;      // мягкое свечение вокруг
        float v = smoothstep(0., .06, vUv.y) * smoothstep(1., .72, vUv.y) * mix(.55, 1., vUv.y);
        float fog = exp(-vDepth * .042);
        vec3 col = vC * (core * 1.6 + halo) * v * vFl * fog;
        col += vec3(1.) * core * core * .35 * v * fog;   // белая сердцевина
        if (uRefl > 0.) col *= uRefl * smoothstep(-3.5, 0., vY); // отражение гаснет вглубь пола
        gl_FragColor = vec4(col, 1.);
      }`,
  });

  const lights = new THREE.InstancedMesh(geo, mat(0), N);
  const mirror = new THREE.InstancedMesh(geo, mat(.28), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  panels.forEach((p, i) => {
    q.setFromEuler(e.set(0, p.rot, 0));
    m4.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(p.w, p.h, 1));
    lights.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(p.w, -p.h, 1));
    mirror.setMatrixAt(i, m4);
  });
  lights.frustumCulled = mirror.frustumCulled = false;
  scene.add(mirror, lights);

  // Тёплое «марево» над полом: большая плоскость с мягким градиентом
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(60, 10), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; void main(){ float g = exp(-pow((vUv.y - .45) * 5., 2.)) * exp(-pow((vUv.x - .5) * 2.6, 2.)); gl_FragColor = vec4(vec3(1., .42, .16) * g * .22, 1.); }',
  }));
  haze.position.set(0, 1.2, -30);
  scene.add(haze);

  // ---------- размер, курсор, прокрутка ----------
  let H = 1;
  const size = () => {
    const W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  };
  size();
  addEventListener('resize', size);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (ev) => { mouse.tx = ev.clientX / innerWidth - .5; mouse.ty = ev.clientY / innerHeight - .5; }, { passive: true });

  let visible = true, raf = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });

  const clock = new THREE.Clock();
  const look = new THREE.Vector3();
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    lights.material.uniforms.uT.value = mirror.material.uniforms.uT.value = t;
    mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
    const sy = Math.min(scrollY / H, 1);
    // Камера плывёт вперёд-назад по залу, поднимается при прокрутке
    const z = 9 - (Math.sin(t * .07) * .5 + .5) * 7 - sy * 4;
    camera.position.set(mouse.x * 1.4, 1.35 + sy * 1.6 - mouse.y * .5, z);
    look.set(mouse.x * 3.5, 1.9 + sy * .6 - mouse.y * 1.2, z - 20);
    camera.lookAt(look);
    camera.rotation.z = mouse.x * -.05;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  document.documentElement.classList.add('has-scene');
  canvas.classList.add('on');
  raf = requestAnimationFrame(loop);
}
