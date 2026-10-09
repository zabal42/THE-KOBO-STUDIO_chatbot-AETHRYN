// Header background on scroll
const header = document.getElementById('siteHeader');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');
navToggle.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMobile.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Scroll-reveal animation
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => io.observe(el));

// Safety net: web-font loading can reflow the page after the observer's
// first pass, leaving already-visible elements stuck at opacity 0.
const revealInViewport = () => {
  revealEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
  });
};
window.addEventListener('load', revealInViewport);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(revealInViewport);

// Phone booth illustration — lights up when the contact section is reached
const kbc = document.querySelector('.kbc');
if (kbc) {
  const kbcIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        kbc.classList.add('is-on');
        kbcIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  kbcIO.observe(kbc);
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form (no backend wired yet — replace with real endpoint)
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  formNote.textContent = 'Gracias. Te responderemos en menos de 24h a la dirección indicada.';
  form.reset();
});
