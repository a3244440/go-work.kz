/* GO-WORK.KZ: 3D-сцена первого экрана (three.js).
   Переливающаяся «капля», тор и шарики плавают вокруг заголовка, следят за курсором и разлетаются при прокрутке.
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

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

function init(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.z = 14;

  // Один материал на всё: переливы оранжевый → фиолетовый, лаймовый ободок, блик
  const mat = (amp, freq, hue) => new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAmp: { value: amp }, uFreq: { value: freq }, uHue: { value: hue } },
    vertexShader: NOISE + `
      uniform float uT, uAmp, uFreq; varying vec3 vN; varying vec3 vV; varying float vNz;
      void main(){
        float n = snoise(position * uFreq + vec3(uT * .35, uT * .22, 0.));
        vec3 p = position + normal * n * uAmp;
        vNz = n;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uT, uHue; varying vec3 vN; varying vec3 vV; varying float vNz;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV), l = normalize(vec3(.45, .8, .6));
        float fr = pow(1. - max(dot(n, v), 0.), 2.2);
        vec3 orange = vec3(1., .353, .122), violet = vec3(.482, .36, 1.), lime = vec3(.83, 1., .23), deep = vec3(.16, .07, .45);
        float k = smoothstep(-.7, .9, n.y + vNz * .7 + sin(uT * .4 + uHue) * .25);
        vec3 base = mix(violet, orange, k);
        base = mix(deep, base, .55 + .45 * max(dot(n, l), 0.));
        float spec = pow(max(dot(n, normalize(l + v)), 0.), 70.);
        vec3 col = base + spec * .95 + fr * lime * .75;
        gl_FragColor = vec4(col, 1.);
      }`
  });

  const blobMat = mat(.2, .9, 0.), torMat = mat(.06, 1.2, 2.), ballMat = mat(.12, 1.4, 4.), knotMat = mat(.05, 1.6, 1.);
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 48), blobMat);
  const torus = new THREE.Mesh(new THREE.TorusGeometry(.62, .23, 40, 100), torMat);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.36, 20), ballMat);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(.34, .115, 140, 20), knotMat);
  const items = [
    { m: blob, ax: .8, ay: .56, z: -1.2, s: 1, spin: [.12, .18], par: 1.6 },
    { m: torus, ax: -.8, ay: .3, z: 0, s: 1, spin: [.35, .22], par: 2.4 },
    { m: ball, ax: -.6, ay: .76, z: 1, s: 1, spin: [.2, .3], par: 3.2 },
    { m: knot, ax: .7, ay: .1, z: 1.5, s: 1, spin: [.4, .5], par: 2.8 }
  ];
  items.forEach((it, i) => { scene.add(it.m); it.ph = i * 1.7; });

  let W = 0, H = 0, hw = 1, hh = 1;
  const size = () => {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    hh = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z; hw = hh * camera.aspect;
    // Ширина первого экрана меняет масштаб: на узких — объекты меньше, чтобы не залезать на текст
    const sc = Math.min(1, W / 1500);
    items.forEach((it) => it.m.scale.setScalar(Math.max(.62, sc)));
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
      const m = it.m;
      m.material.uniforms.uT.value = t;
      // Позиция от краёв экрана + плавание + параллакс курсора + разлёт при прокрутке
      const side = Math.sign(it.ax);
      m.position.set(
        it.ax * hw + side * sy * hw * .35 + mouse.x * it.par * .6,
        it.ay * hh + Math.sin(t * .8 + it.ph) * .18 + sy * hh * (.5 + i * .25) - mouse.y * it.par * .5,
        it.z
      );
      m.rotation.x = t * it.spin[0] + mouse.y * .8 + sy * 2;
      m.rotation.y = t * it.spin[1] + mouse.x * 1.1 + sy * 3 * side;
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  document.documentElement.classList.add('has-orb');
  canvas.classList.add('on');
  raf = requestAnimationFrame(loop);
}
