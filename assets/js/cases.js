/* GO-WORK.KZ: блок кейсов, слайды по мотивам рекламы Chrome.
   Цветная панель разворачивается в 3D, карточки вокруг разлетаются и собираются, фон блока меняет цвет.
   Переключается сам, по точкам и свайпом; карточки слегка двигаются за курсором. */
(function () {
  var sec = document.getElementById('cases'), stage = document.getElementById('csStage');
  if (!sec || !stage) return;
  var slides = stage.querySelectorAll('.cs-slide'), dots = document.querySelectorAll('#csDots button');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = 0, visible = false, hover = false;

  // Сцена нарисована в фиксированном размере и масштабируется под ширину блока
  function fit() {
    var cs = getComputedStyle(stage), W = parseFloat(cs.getPropertyValue('--W')) || 1000;
    stage.style.setProperty('--s', Math.min(1, stage.clientWidth / W).toFixed(4));
  }
  fit(); addEventListener('resize', fit);

  function go(n) {
    if (n === cur) return;
    var old = slides[cur], next = slides[n];
    old.classList.remove('in'); old.classList.add('out'); old.setAttribute('aria-hidden', 'true');
    setTimeout(function () { old.classList.remove('out'); }, 1000);
    next.classList.remove('out');
    // Новый слайд заходит чуть позже, чтобы старый успел развернуться
    setTimeout(function () { next.classList.add('in'); }, reduce ? 0 : 260);
    next.removeAttribute('aria-hidden');
    dots.forEach(function (d, i) { d.classList.toggle('on', i === n); d.setAttribute('aria-selected', i === n); });
    sec.style.backgroundColor = next.dataset.bg;
    cur = n; plan();
  }
  function plan() { clearTimeout(timer); if (visible && !hover && !reduce) timer = setTimeout(function () { go((cur + 1) % slides.length); }, 4800); }

  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
  sec.style.backgroundColor = slides[0].dataset.bg;
  stage.addEventListener('pointerenter', function () { hover = true; clearTimeout(timer); });
  stage.addEventListener('pointerleave', function () { hover = false; plan(); stage.style.setProperty('--mx', 0); stage.style.setProperty('--my', 0); });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = stage.getBoundingClientRect();
    stage.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
    stage.style.setProperty('--my', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
  });
  // Свайп на телефоне
  var sx = null;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40 && !scrollMode) go((cur + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
  });
  /* Переключение прокруткой: блок закрепляется на экране, и каждый отрезок прокрутки показывает следующий кейс.
     Без GSAP или при «уменьшении движения» остаётся автопрокрутка по таймеру. */
  var scrollMode = false;
  function initScroll() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return false;
    gsap.registerPlugin(ScrollTrigger);
    var N = slides.length, prog = document.getElementById('csProg');
    var st = ScrollTrigger.create({
      trigger: sec, start: function () { var n = document.getElementById('nav'); return 'top ' + (n ? Math.round(n.offsetHeight * .7) : 0) + 'px'; }, end: function () { return '+=' + Math.round(innerHeight * .75 * (N - 1)); },
      pin: true, anticipatePin: 1,
      onUpdate: function (self) {
        if (prog) prog.style.setProperty('--p', self.progress.toFixed(3));
        go(Math.min(N - 1, Math.floor(self.progress * N * .9999)));
      }
    });
    // Точки прокручивают страницу к нужному кейсу
    dots.forEach(function (d, i) {
      d.onclick = function () { scrollTo({ top: st.start + (st.end - st.start) * (i + .5) / N, behavior: 'smooth' }); };
    });
    sec.classList.add('pinned');
    return true;
  }
  var oldPlan = plan;
  plan = function () { if (!scrollMode) oldPlan(); };
  scrollMode = initScroll();
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; plan(); }, { threshold: .3 }).observe(stage);
})();
