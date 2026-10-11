'use strict';
/* ===== Config: set a form endpoint (e.g. Formspree) to send real submissions ===== */
const FORM_ENDPOINT = ''; // leave empty until a backend/form service is connected
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
document.documentElement.classList.add('js');

// Loader, year, min date
addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), reduce ? 0 : 400));
$('#year').textContent = new Date().getFullYear();
$('#date').min = new Date().toISOString().split('T')[0];

// Navbar shadow + mobile menu
const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const setMenu = open => { menu.classList.toggle('open', open); burger.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
burger.onclick = () => setMenu(!menu.classList.contains('open'));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

// Scroll reveal + counters
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15 });
$$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });

const countIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  countIO.unobserve(e.target);
  const to = +e.target.dataset.to, sfx = e.target.dataset.suffix || '', t0 = performance.now(), dur = 1600;
  const tick = t => {
    const p = reduce ? 1 : Math.min((t - t0) / dur, 1);
    e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString() + sfx;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: .5 });
$$('.count').forEach(c => countIO.observe(c));

// Before/after slider (range input keeps it touch- and keyboard-friendly)
const cmp = $('#cmp');
$('input', cmp).addEventListener('input', e => cmp.style.setProperty('--pos', e.target.value + '%'));

// Testimonials
const track = $('.track'), slides = $$('.slide'), dots = $('#dots');
let idx = 0, timer;
slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Review ' + (i + 1)); b.onclick = () => go(i, true); dots.appendChild(b); });
function go(i, user) {
  idx = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${idx * 100}%)`;
  $$('button', dots).forEach((d, j) => d.classList.toggle('on', j === idx));
  if (user) clearInterval(timer);
}
$('#prev').onclick = () => go(idx - 1, true);
$('#next').onclick = () => go(idx + 1, true);
let sx = 0;
track.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
track.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) go(idx + (d < 0 ? 1 : -1), true); });
go(0);
if (!reduce) timer = setInterval(() => go(idx + 1), 6000);

// FAQ accordion (one open at a time)
$$('.q').forEach(q => $('button', q).addEventListener('click', () => {
  const open = !q.classList.contains('open');
  $$('.q').forEach(o => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', false); $('.a', o).style.maxHeight = 0; });
  if (open) { q.classList.add('open'); $('button', q).setAttribute('aria-expanded', true); $('.a', q).style.maxHeight = $('.a', q).scrollHeight + 'px'; }
}));

// Pre-select service from card/pricing links
$$('[data-service]').forEach(a => a.addEventListener('click', () => { $('#service').value = a.dataset.service; }));

// Form validation + submit
async function handleForm(form, msgEl, okText) {
  let valid = true;
  $$('[required]', form).forEach(f => {
    const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
    f.classList.toggle('invalid', bad); f.setAttribute('aria-invalid', bad); if (bad) valid = false;
  });
  msgEl.className = 'msg' + (form.id === 'bookForm' ? ' full' : '');
  if (!valid) { msgEl.classList.add('err'); msgEl.textContent = 'Please fill in all required fields with valid details.'; $('.invalid', form)?.focus(); return; }
  if (!FORM_ENDPOINT) {
    msgEl.classList.add('ok');
    msgEl.textContent = 'Form is valid, but nothing was sent: no backend is connected yet. Set FORM_ENDPOINT in script.js.';
    return;
  }
  try {
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
    if (!r.ok) throw new Error();
    msgEl.classList.add('ok'); msgEl.textContent = okText; form.reset();
  } catch { msgEl.classList.add('err'); msgEl.textContent = 'Something went wrong. Please try again or call us.'; }
}
[['bookForm', 'formMsg', 'Thanks! We will contact you shortly with your quote.'],
 ['contactForm', 'contactMsg', 'Thanks! Your message has been sent.'],
 ['newsForm', 'newsMsg', 'You are subscribed.']].forEach(([f, m, t]) =>
  $('#' + f).addEventListener('submit', e => { e.preventDefault(); handleForm(e.target, $('#' + m), t); }));
