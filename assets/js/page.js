/* Скрипт внутренних страниц GO-WORK.KZ */
const nav = document.getElementById('nav');
const waFloat = document.querySelector('.wa-float');
const onScroll = () => {
  nav.classList.toggle('scrolled', scrollY > 30);
  waFloat && waFloat.classList.toggle('show', scrollY > innerHeight * 0.5);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = document.getElementById('burger');
const links = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  links.classList.toggle('open', open);
});

const groups = new Map();
document.querySelectorAll('.reveal').forEach((el) => {
  const i = groups.get(el.parentElement) || 0;
  el.style.setProperty('--d', `${Math.min(i, 6) * 0.07}s`);
  groups.set(el.parentElement, i + 1);
});
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// блик за курсором на кнопках WhatsApp
if (matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.btn').forEach((b) => b.addEventListener('pointermove', (e) => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--x', e.clientX - r.left + 'px');
    b.style.setProperty('--y', e.clientY - r.top + 'px');
  }));
}
