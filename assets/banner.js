// Banner de novedades. Lee los elementos con data-news="AAAA-MM-DD" y data-kind
// de las páginas indicadas en data-sources y muestra los de los últimos 4 meses
// (máximo 5, los más recientes primero). No hay que tocar este archivo para
// añadir novedades: basta con poner esos dos atributos al elemento nuevo.
(function () {
  const banner = document.getElementById('banner');
  if (!banner) return;
  const MAX = 5;
  const LABELS = {
    pub:    ['tag-pub',  'Nueva publicación', 'New publication'],
    conf:   ['tag-conf', 'Congreso',          'Conference'],
    thesis: ['tag-proj', 'Tesis defendida',   'Thesis defended'],
    proj:   ['tag-proj', 'Proyecto concedido','Project awarded']
  };
  const ORDER = ['pub', 'thesis', 'proj', 'conf'];
  const esc = t => t.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clean = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  const sources = (banner.dataset.sources || 'research.html').split(/\s+/);
  const here = location.pathname.split('/').pop() || 'index.html';
  Promise.all(sources.map(src =>
    (src === here ? Promise.resolve(document) :
      fetch(src).then(r => r.text()).then(h => new DOMParser().parseFromString(h, 'text/html')))
    .then(doc => [...doc.querySelectorAll('[data-news]')].map(el => ({ el, src })))
    .catch(() => [])
  )).then(lists => {
    const limit = new Date(); limit.setMonth(limit.getMonth() - 4);
    const items = lists.flat()
      .map((x, idx) => ({ ...x, idx, date: new Date(x.el.dataset.news + 'T00:00:00') }))
      .filter(x => !isNaN(x.date) && x.date >= limit && LABELS[x.el.dataset.kind])
      .sort((a, b) => b.date - a.date || ORDER.indexOf(a.el.dataset.kind) - ORDER.indexOf(b.el.dataset.kind) || a.idx - b.idx)
      .slice(0, MAX);
    if (!items.length) return;
    const slider = document.getElementById('banner-slider');
    const dotsBox = document.getElementById('banner-dots');
    items.forEach(({ el, src }, n) => {
      const [cls, es, en] = LABELS[el.dataset.kind];
      const sec = el.closest('.section[id]');
      const href = (src === here ? '' : src) + (sec ? '#' + sec.id : '');
      const title = clean(el.querySelector('[data-news-title], .pub-title, .project-title.es-text, h3.es-text'));
      const venue = clean(el.querySelector('.pub-tag'));
      const pdf = el.querySelector('a.pub-btn-pdf');
      const text = esc((venue ? venue + '. ' : '') + title);
      slider.insertAdjacentHTML('beforeend',
        `<div class="banner-slide${n ? '' : ' active'}">
           <p class="banner-text">
             <span class="banner-tag ${cls} es-text">${es}</span><span class="banner-tag ${cls} en-text">${en}</span>
             <span> — ${text}</span>
           </p>
           <a href="${esc(href)}" class="banner-link es-text">Ver más →</a><a href="${esc(href)}" class="banner-link en-text">See more →</a>
           ${pdf ? `<a href="${esc(pdf.getAttribute('href'))}" download class="banner-link">PDF ↓</a>` : ''}
         </div>`);
      if (items.length > 1)
        dotsBox.insertAdjacentHTML('beforeend', `<button class="banner-dot-btn${n ? '' : ' active'}" aria-label="${n + 1}"></button>`);
    });
    banner.hidden = false;
    const slides = slider.querySelectorAll('.banner-slide');
    const dots = dotsBox.querySelectorAll('.banner-dot-btn');
    if (slides.length < 2) return;
    let current = 0, timer;
    const goToSlide = n => {
      slides[current].classList.remove('active'); dots[current].classList.remove('active');
      current = n;
      slides[current].classList.add('active'); dots[current].classList.add('active');
      clearInterval(timer); timer = setInterval(() => goToSlide((current + 1) % slides.length), 8000);
    };
    dots.forEach((d, n) => d.addEventListener('click', () => goToSlide(n)));
    goToSlide(0);
  });
})();
