document.addEventListener('DOMContentLoaded', function () {

  // ---- Copy-to-clipboard buttons (moved verbatim) ----
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copyText;
      if (!text && btn.dataset.copyTarget) {
        var el = document.querySelector(btn.dataset.copyTarget);
        if (el) text = el.innerText || el.value || '';
      }
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.classList.add('copied');
        var orig = btn.dataset.copyLabel || btn.textContent;
        if (!btn.dataset.copyLabel) btn.dataset.copyLabel = orig.trim();
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = btn.dataset.copyLabel;
        }, 1400);
      });
    });
  });

  // ---- Tabs: click + full keyboard nav + ARIA wiring ----
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var btns = Array.prototype.slice.call(tabs.querySelectorAll('.tab-btn'));
    var panels = Array.prototype.slice.call(tabs.querySelectorAll('.tab-panel'));
    function select(i) {
      btns.forEach(function (b, j) {
        var on = i === j;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
        if (panels[j]) panels[j].setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    }
    btns.forEach(function (btn, i) {
      // Wire ARIA relationships if missing.
      if (!btn.id) btn.id = 'tab-' + Math.random().toString(36).slice(2, 8);
      if (panels[i]) {
        if (!panels[i].id) panels[i].id = btn.id + '-panel';
        btn.setAttribute('aria-controls', panels[i].id);
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', btn.id);
      }
      btn.addEventListener('click', function () { select(i); });
      btn.addEventListener('keydown', function (e) {
        var n = btns.length, t = null;
        if (e.key === 'ArrowRight') t = (i + 1) % n;
        else if (e.key === 'ArrowLeft') t = (i - 1 + n) % n;
        else if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = n - 1;
        if (t !== null) { e.preventDefault(); select(t); btns[t].focus(); }
      });
    });
    var current = btns.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; });
    select(current < 0 ? 0 : current);
  });

  // ---- Slider live readout (moved verbatim) ----
  document.querySelectorAll('.slider').forEach(function (slider) {
    var valueEl = slider.parentElement.querySelector('.slider-value');
    if (!valueEl) return;
    var update = function () { valueEl.textContent = slider.value; };
    update();
    slider.addEventListener('input', update);
  });

  // ---- TOC scroll-spy: highlight the section currently in view ----
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('nav.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  // ---- Back-to-top button ----
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
  }

  // ---- Click-to-expand diagrams (overlay) ----
  var overlay = document.querySelector('.diagram-overlay');
  if (overlay) {
    var inner = overlay.querySelector('.inner');
    function openDiagram(node) {
      inner.innerHTML = '';
      var clone = node.cloneNode(true);
      clone.removeAttribute('data-expandable');
      inner.appendChild(clone);
      overlay.classList.add('open');
    }
    function closeDiagram() { overlay.classList.remove('open'); inner.innerHTML = ''; }
    document.querySelectorAll('[data-expandable]').forEach(function (node) {
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', 'Expand diagram');
      node.addEventListener('click', function () { openDiagram(node); });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDiagram(node); }
      });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeDiagram(); });
    var closeBtn = overlay.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', closeDiagram);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDiagram(); });
  }
});
