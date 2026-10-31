/* GO-WORK.KZ: анимации по прокрутке (GSAP + ScrollTrigger). Без библиотеки страница работает как обычно. */
(function () {
  function run() {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);
    var has = function (s) { return document.querySelector(s); };

    // Веер карточек на первом экране: раскрывается при загрузке и разъезжается при прокрутке
    if (has('.fan')) {
      var cards = gsap.utils.toArray('.fan .card');
      gsap.from(cards, { '--x': '0%', '--y': '40%', '--r0': '0deg', duration: 1.3, ease: 'expo.out', stagger: .07, delay: .2 });
      gsap.to(cards, { '--s': 1.45, ease: 'none', scrollTrigger: { trigger: '.fan', start: 'top 70%', end: 'bottom top', scrub: true } });
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 821px)', function () {
      // Чёрная сцена: закрепляется, заголовок уменьшается, выдача Google растёт, карточки цифр вылетают снизу
      if (has('.stage-pin')) {
        var card = has('.stage-card');
        gsap.set(card, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
        gsap.timeline({ scrollTrigger: { trigger: '.stage-pin', start: 'top top', end: '+=130%', pin: true, scrub: .6 } })
          .from('.giant', { scale: 1.35, ease: 'none' }, 0)
          .from(card, { scale: .3, rotation: -10, ease: 'none' }, 0)
          .from('.stat', { y: 560, rotation: function (i) { return [-26, 18, -18, 26][i]; }, stagger: .06, ease: 'power2.out' }, .1);
      }
    });

    // Строки услуг выезжают по очереди
    gsap.utils.toArray('.svc-list li').forEach(function (li) {
      gsap.from(li.querySelector('b'), { x: -40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 92%', once: true } });
    });

    // Огромное GO-WORK.KZ в подвале
    if (has('.wordmark')) {
      gsap.from('.wordmark', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.wordmark', start: 'top 95%', once: true } });
    }

    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
