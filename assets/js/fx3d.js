/* GO-WORK.KZ: 3D-эффекты главной (GSAP + ScrollTrigger).
   Заголовки влетают с разных ракурсов, 3D-куб услуг, наклон карточек за курсором,
   ленты реагируют на скорость прокрутки, колода этапов, финал и объёмный логотип.
   Двигается только transform/opacity. Без GSAP или при «уменьшении движения» страница остаётся статичной. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  function run() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- Огромный заголовок первого экрана: буквы встают из-под строки, при прокрутке разлетаются ---------- */
    var mega = document.querySelector('.mega-line');
    if (mega) {
      var txt = mega.textContent; mega.textContent = '';
      // Слова не разрываются при переносе: буквы лежат внутри неразрывного блока слова
      txt.split(' ').forEach(function (word, wi) {
        if (wi) mega.appendChild(document.createTextNode(' '));
        var wd = document.createElement('span'); wd.className = 'mw';
        word.split('').forEach(function (c) { var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = c; wd.appendChild(sp); });
        mega.appendChild(wd);
      });
      mega.setAttribute('aria-hidden', 'true');
      mega.insertAdjacentHTML('afterend', '<span class="sr-only">' + txt + '</span>');
      var chars = mega.querySelectorAll('.ch');
      gsap.from(chars, { yPercent: 115, rotationX: -95, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .035, delay: .25 });
      gsap.from('.hero-inner > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .12, delay: .7 });
      gsap.to(chars, {
        yPercent: function (i) { return (i % 3 - 1) * 38 - 20; }, rotationZ: function (i) { return (i % 2 ? 1 : -1) * (4 + i % 5); }, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 }
      });
    }

    /* ---------- Манифест: слова проявляются по мере прокрутки, картинки «выпрыгивают» ---------- */
    var mf = document.querySelector('.mf-text');
    if (mf) {
      splitWords(mf);
      gsap.to(mf.querySelectorAll('.w'), { color: '#0d0d0d', stagger: .12, ease: 'none', scrollTrigger: { trigger: mf, start: 'top 78%', end: 'bottom 50%', scrub: .5 } });
      mf.querySelectorAll('.mf-pic, .mf-ico').forEach(function (m) {
        gsap.from(m, { scale: 0, rotation: -25, duration: .9, ease: 'back.out(2)', scrollTrigger: { trigger: m, start: 'top 75%', once: true } });
      });
    }

    /* ---------- Белая панель наезжает на первый экран ---------- */
    gsap.from('.sheet', { borderRadius: '90px 90px 0 0', ease: 'none', scrollTrigger: { trigger: '.sheet', start: 'top bottom', end: 'top 40%', scrub: true } });

    /* ---------- Заголовки: слова влетают с разных ракурсов ---------- */
    var angles = [
      { rotationX: -95, yPercent: 40, transformOrigin: '50% 100% -30px' },          // переворот снизу
      { rotationY: 85, xPercent: -20, transformOrigin: '0% 50%' },                  // дверь слева
      { z: 520, rotationY: -25, opacity: 0 },                                       // вылет на зрителя
      { rotationZ: 14, rotationX: 70, yPercent: 80, transformOrigin: '0% 100%' },   // поворот с наклоном
      { rotationX: 95, yPercent: -40, transformOrigin: '50% 0% -30px' }             // переворот сверху
    ];
    document.querySelectorAll('main h2.reveal').forEach(function (h, i) {
      splitWords(h);
      h.classList.remove('reveal');
      h.classList.add('split');
      var from = Object.assign({ opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .06 }, angles[i % angles.length]);
      from.scrollTrigger = { trigger: h, start: 'top 88%', once: true };
      gsap.from(h.querySelectorAll('.w'), from);
    });

    /* ---------- Ленты: наклон от скорости прокрутки ---------- */
    var tracks = gsap.utils.toArray('.ribbons .marquee-track');
    if (tracks.length) {
      var skew = gsap.quickTo(tracks, 'skewX', { duration: .5, ease: 'power3' });
      ScrollTrigger.create({ onUpdate: function (s) { skew(gsap.utils.clamp(-14, 14, s.getVelocity() / -160)); } });
      gsap.fromTo('.ribbons .marquee:first-child', { rotationX: 40 }, { rotationX: 6, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: .5 } });
      gsap.fromTo('.ribbons .marquee.alt', { rotationX: -40 }, { rotationX: -4, ease: 'none', scrollTrigger: { trigger: '.ribbons', start: 'top bottom', end: 'bottom top', scrub: .5 } });
    }

    /* ---------- 3D-куб услуг: крутится сам, при прокрутке и поворачивается к услуге под курсором ---------- */
    var cube = document.getElementById('cube');
    if (cube && getComputedStyle(cube.parentNode).display !== 'none') {
      // Грань для каждой строки списка: Сайты, ИИ, SEO, SEO Яндекс, Google Ads, Директ, Таргет, ИИ-ролики
      var faces = [[0, 0], [0, -90], [0, -180], [0, 90], [-90, 0], [-90, 0], [-90, 0], [90, 0]];
      var st = { x: -18, y: 30, tx: -18, ty: 30, hold: false };
      var lastScroll = scrollY;
      document.querySelectorAll('.svc-list li').forEach(function (li, i) {
        li.addEventListener('pointerenter', function () {
          var f = faces[i] || faces[0];
          // Ближайший поворот к нужной грани, чтобы куб не крутился лишний круг
          st.tx = f[0] - 12; st.ty = f[1] + 360 * Math.round((st.y - f[1]) / 360) + 14; st.hold = true;
        });
        li.addEventListener('pointerleave', function () { st.hold = false; });
      });
      var vis = false;
      new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(cube);
      gsap.ticker.add(function (time, dt) {
        if (!vis) return;
        if (!st.hold) {
          var ds = scrollY - lastScroll;
          st.ty += dt * .018 + ds * .25; st.tx = -18 + Math.sin(time * .6) * 10;
        }
        lastScroll = scrollY;
        st.x += (st.tx - st.x) * .08; st.y += (st.ty - st.y) * .08;
        cube.style.transform = 'rotateX(' + st.x.toFixed(2) + 'deg) rotateY(' + st.y.toFixed(2) + 'deg)';
      });
      gsap.from('.cube-col', { scale: .4, rotationZ: -40, opacity: 0, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '#services', start: 'top 70%', once: true } });
    }

    /* ---------- Портфолио: карточки въезжают веером, наклон за курсором с бликом ---------- */
    gsap.utils.toArray('.works .work').forEach(function (w, i) {
      w.classList.remove('reveal');
      gsap.from(w, { rotationY: i % 2 ? -28 : 28, rotationX: 12, z: -260, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: w, start: 'top 90%', once: true } });
      if (!finePointer) return;
      var rx = gsap.quickTo(w, 'rotationX', { duration: .6, ease: 'power3' });
      var ry = gsap.quickTo(w, 'rotationY', { duration: .6, ease: 'power3' });
      w.addEventListener('pointermove', function (e) {
        var r = w.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - .5) * 12); rx((.5 - py) * 10);
        w.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); w.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        w.classList.add('tilt');
      });
      w.addEventListener('pointerleave', function () { rx(0); ry(0); w.classList.remove('tilt'); });
    });

    /* ---------- Пакеты ИИ-роликов: прилетают с трёх сторон ---------- */
    gsap.utils.toArray('.packs .pack').forEach(function (p, i) {
      p.classList.remove('reveal');
      var from = [{ rotationY: 55, xPercent: -30 }, { rotationX: -60, yPercent: 30 }, { rotationY: -55, xPercent: 30 }][i % 3];
      gsap.from(p, Object.assign({ opacity: 0, z: -300, duration: 1.3, ease: 'expo.out', delay: i * .08, scrollTrigger: { trigger: '.packs', start: 'top 85%', once: true } }, from));
    });

    /* ---------- Этапы: колода карточек раскрывается как календарь ---------- */
    var steps = gsap.utils.toArray('.steps .step');
    if (steps.length) {
      steps.forEach(function (s) { s.classList.remove('reveal'); });
      gsap.from(steps, { rotationX: -88, transformOrigin: '50% 0%', y: 60, opacity: 0, duration: 1.2, ease: 'back.out(1.3)', stagger: .14, scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });
    }

    /* ---------- FAQ: строки разворачиваются по оси X ---------- */
    gsap.utils.toArray('.faq details').forEach(function (d, i) {
      d.classList.remove('reveal');
      gsap.from(d, { rotationX: -70, transformPerspective: 900, transformOrigin: '50% 0%', opacity: 0, duration: .9, ease: 'power3.out', delay: i * .05, scrollTrigger: { trigger: d, start: 'top 92%', once: true } });
    });

    /* ---------- Финал: чёрный блок поднимается из плоскости ---------- */
    var fb = document.querySelector('.final-box');
    if (fb) {
      fb.classList.remove('reveal');
      gsap.fromTo(fb, { rotationX: 38, scale: .86, y: 60 }, { rotationX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center 60%', scrub: .6 } });
    }

    /* ---------- Объёмное GO-WORK.KZ поворачивается за курсором ---------- */
    var wm = document.querySelector('.wordmark');
    if (wm && finePointer) {
      var wx = gsap.quickTo(wm, 'rotationX', { duration: .8, ease: 'power3' });
      var wy = gsap.quickTo(wm, 'rotationY', { duration: .8, ease: 'power3' });
      document.querySelector('.footer').addEventListener('pointermove', function (e) {
        wy((e.clientX / innerWidth - .5) * 18); wx((.5 - e.clientY / innerHeight) * 10);
      });
    }

    /* ---------- Магнитные кнопки ---------- */
    if (finePointer) {
      document.querySelectorAll('.btn-lg, .btn-xl').forEach(function (b) {
        var bx = gsap.quickTo(b, 'x', { duration: .5, ease: 'elastic.out(1, .5)' });
        var by = gsap.quickTo(b, 'y', { duration: .5, ease: 'elastic.out(1, .5)' });
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          bx((e.clientX - r.left - r.width / 2) * .25); by((e.clientY - r.top - r.height / 2) * .35);
        });
        b.addEventListener('pointerleave', function () { bx(0); by(0); });
      });
    }

    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* Оборачивает каждое слово заголовка в <span class="w">, не ломая вложенные <em>, <span> и &nbsp; */
  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var parts = n.textContent.split(/( +)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^ +$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
  }

  /* Огромный заголовок занимает ровно ширину экрана при любом шрифте (на телефоне он переносится и не подгоняется) */
  function fitMega() {
    var el = document.querySelector('.mega-line'); if (!el) return;
    el.style.fontSize = '';
    if (innerWidth <= 820) return;
    var h = el.parentNode, cs = getComputedStyle(h);
    var avail = h.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var w = el.getBoundingClientRect().width, fs = parseFloat(getComputedStyle(el).fontSize);
    if (w > 0) el.style.fontSize = (fs * avail / w * .985).toFixed(1) + 'px';
  }
  fitMega();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMega);
  addEventListener('resize', fitMega);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
