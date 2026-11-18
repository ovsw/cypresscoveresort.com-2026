// Concept A2: the header, and the three moments of the day (sunset, lights on, dawn).
(() => {
  const top = document.querySelector('.top');
  const hero = document.querySelector('.hero');
  const sun = document.querySelector('.sun');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const h = hero.offsetHeight;
    top.classList.toggle('is-solid', y > h - 140);
    // The sun sinks behind the horizon line over the first 60% of the hero.
    if (!calm) sun.style.setProperty('--sink', Math.min(1, Math.max(0, y / (h * 0.6))).toFixed(3));
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Lights come on over the evening; the gold band opens at dawn. Only for what starts below the fold.
  if (!calm && 'IntersectionObserver' in window) {
    const waiting = [...document.querySelectorAll('.lights, .offer')]
      .filter((el) => el.getBoundingClientRect().top > innerHeight);
    waiting.forEach((el) => el.classList.add('is-waiting'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.remove('is-waiting'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    waiting.forEach((el) => io.observe(el));
  }

  // Newsletter: show the right message without leaving the page.
  const form = document.querySelector('.news-form');
  if (form) {
    const ok = form.querySelector('.news-ok');
    const err = form.querySelector('.news-err');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const valid = form.email.checkValidity();
      ok.hidden = !valid;
      err.hidden = valid;
      if (valid) form.reset();
    });
  }
})();
