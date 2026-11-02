/* GO-WORK.KZ: 3D-карусель работ на первом экране.
   Карточки стоят по кругу, кольцо медленно вращается, ускоряется от прокрутки страницы
   и крутится мышью или пальцем (с инерцией). Работает только пока карусель на экране. */
(function () {
  var box = document.getElementById('carousel3d'), ring = document.getElementById('ring');
  if (!box || !ring) return;
  var cards = ring.children, N = cards.length, step = 360 / N;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var R = 400, angle = 0, vel = 0, auto = reduce ? 0 : 9; // градусов в секунду
  var drag = null, visible = false, raf = 0, last = 0, lastScroll = scrollY;

  function layout() {
    var cw = ring.offsetWidth;
    R = Math.round(cw / 2 / Math.tan(Math.PI / N) * 1.04);
    for (var i = 0; i < N; i++) cards[i].style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)';
    render();
  }
  function render() {
    ring.style.transform = 'translateZ(' + (-R) + 'px) rotateX(-6deg) rotateY(' + angle.toFixed(2) + 'deg)';
    // Карточки плавно гаснут, уходя за край кольца; задняя половина скрыта
    for (var i = 0; i < N; i++) {
      var a = ((i * step + angle) % 360 + 360) % 360, k = Math.cos(a * Math.PI / 180);
      cards[i].style.opacity = Math.max(0, Math.min(1, (k + .05) * 3.5)).toFixed(3);
      cards[i].style.zIndex = Math.round(k * 100) + 100;
    }
  }
  function tick(t) {
    raf = 0;
    if (!visible) return;
    var dt = last ? Math.min((t - last) / 1000, .05) : 0; last = t;
    var ds = scrollY - lastScroll; lastScroll = scrollY;
    if (!drag) {
      vel += ds * (reduce ? 0 : .9);
      vel *= Math.pow(.04, dt);           // инерция гаснет
      angle -= (auto + vel) * dt;
    }
    render();
    raf = requestAnimationFrame(tick);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

  box.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, a: angle, t: performance.now(), v: 0 };
    box.setPointerCapture(e.pointerId); box.classList.add('drag');
  });
  box.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var now = performance.now(), na = drag.a + (e.clientX - drag.x) * .28;
    drag.v = (angle - na) / Math.max((now - drag.t) / 1000, .016);
    drag.t = now; angle = na; drag.a = na; drag.x = e.clientX;
    render();
  });
  function end() { if (!drag) return; vel = Math.max(-260, Math.min(260, drag.v)) - auto; drag = null; box.classList.remove('drag'); }
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);

  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(box);
  addEventListener('resize', layout);
  layout();
})();
