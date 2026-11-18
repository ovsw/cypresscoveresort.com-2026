// Concept B: the header gains a hairline once the page has scrolled.
(function () {
  var header = document.getElementById('site-header');
  if (!header) return;
  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
})();
