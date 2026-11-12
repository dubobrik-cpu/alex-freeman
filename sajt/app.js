(function () {
  var topBar = document.querySelector('.top');
  // «В эфире»: «Наломали дров» на ESM FM, четверг 22:00-23:00 по Москве (UTC+3)
  var efir = document.querySelector('.efir');
  function moscowNow() { var d = new Date(); return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 3 * 3600000); }
  function tickEfir() {
    if (!efir) return;
    var m = moscowNow(), live = m.getDay() === 4 && m.getHours() === 22;
    efir.classList.toggle('is-live', live);
    efir.querySelector('.efir__t').innerHTML = live ? 'В эфире' : 'Эфир <span class="efir__day">в четверг </span><span class="efir__short">чт </span>22:00';
  }
  tickEfir(); setInterval(tickEfir, 60000);

  // меню на телефоне
  var burger = document.querySelector('.burger'), mnav = document.querySelector('.mnav');
  function setMenu(open) {
    if (!mnav) return;
    mnav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    ['main', 'footer', '.top', '#magnitola', '.skip'].forEach(function (q) { var el = document.querySelector(q); if (el) el.inert = open; });
    if (open) mnav.querySelector('a').focus({ preventScroll: true }); else burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener('click', function () { setMenu(true); });
  var mclose = document.querySelector('.mnav__close');
  if (mclose) mclose.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mnav && mnav.classList.contains('is-open')) { setMenu(false); return; }
    if (mag && mag.classList.contains('is-open') && !mag.classList.contains('is-min')) setMin(true);
  });
  // шапка остаётся на месте и получает фон, когда страницу листают
  function onTop() { if (topBar) topBar.classList.toggle('is-scrolled', window.scrollY > 40); }
  onTop(); window.addEventListener('scroll', onTop, { passive: true });

  // магнитола: плеер audio.com грузится только по нажатию
  var mag = document.getElementById('magnitola');
  var openedAt = null;
  function setMin(min) {
    if (!mag) return;
    mag.classList.toggle('is-min', min);
    var b = mag.querySelector('.mag__min');
    b.setAttribute('aria-label', min ? 'Развернуть плеер' : 'Свернуть плеер'); b.setAttribute('aria-expanded', String(!min));
    mag.querySelector('.mag__body').inert = min;
    if (!min && mag.classList.contains('is-open')) openedAt = window.scrollY;
  }
  var SRC = 'https://audio.com/embed/v2/audio/1881409443450464?theme=custom&themeSurface=%230B0D10&themeText=%23F2F2EE&themeAccent=%2394F800&themeStroke=%233A3A3A&layout=flex';
  function openMag(e) {
    if (e) e.preventDefault();
    if (!mag) return;
    var body = mag.querySelector('.mag__body');
    if (!body.querySelector('iframe')) {
      var f = document.createElement('iframe');
      f.src = SRC; f.title = 'Плеер: микс Alex Freeman, Наломали дров #12';
      f.setAttribute('referrerpolicy', 'no-referrer'); f.setAttribute('allow', 'autoplay');
      body.appendChild(f);
    }
    mag.classList.add('is-open'); mag.removeAttribute('aria-hidden'); setMin(false);
    document.querySelectorAll('[data-open-mag]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    // на компьютере не даём панели закрыть кнопку «Слушать миксы»; на время этой прокрутки автосворачивание выключено
    var btn = document.querySelector('.listen[data-open-mag]');
    openedAt = null;
    requestAnimationFrame(function () {
      var top = window.innerHeight - mag.offsetHeight, bb = btn ? btn.getBoundingClientRect().bottom + 24 : 0;
      var nameEl = document.querySelector('.hero__name'), topBarH = topBar ? topBar.offsetHeight : 0;
      var room = nameEl ? nameEl.getBoundingClientRect().top - topBarH - 8 : 0;
      if (btn && window.innerWidth >= 720 && window.innerWidth < 1100 && bb > top && room > 0) {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollBy({ top: Math.min(bb - top, room), behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { openedAt = window.scrollY; }, 800);
      } else { openedAt = window.scrollY; }
    });
    mag.querySelector('.mag__min').focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-open-mag]').forEach(function (b) { b.addEventListener('click', openMag); });
  if (mag) {
    mag.querySelector('.mag__min').addEventListener('click', function () { setMin(!mag.classList.contains('is-min')); });
    mag.querySelector('.mag__t').addEventListener('click', function () { if (mag.classList.contains('is-min')) setMin(false); });
    mag.querySelector('.mag__close').addEventListener('click', function () {
      var f = mag.querySelector('iframe'); if (f) f.remove();   // закрыть = остановить музыку
      mag.classList.remove('is-open', 'is-min'); mag.setAttribute('aria-hidden', 'true'); openedAt = null;
      document.querySelectorAll('[data-open-mag]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      var b = document.querySelector('[data-open-mag]'); if (b) b.focus({ preventScroll: true });
    });
  }

  // листаешь страницу - магнитола сама сворачивается в полосу, музыка играет дальше
  window.addEventListener('scroll', function () {
    if (!mag || openedAt === null || mag.classList.contains('is-min')) return;
    if (Math.abs(window.scrollY - openedAt) > 120) {
      setMin(true); openedAt = null;
    }
  }, { passive: true });

  // лента «Свежего»: фокус с клавиатуры прокручивает карточку в окно
  var lenta = document.querySelector('#svezhee .cards');
  if (lenta) lenta.addEventListener('focusin', function (e) {
    var c = e.target.closest('.card'); if (c && lenta.scrollWidth > lenta.clientWidth) lenta.scrollTo({ left: c.offsetLeft - lenta.offsetLeft, behavior: 'smooth' });
  });

  // сколько дней до вечеринки
  function tickDate() { document.querySelectorAll('[data-date]').forEach(function (el) {
    var m = moscowNow(), today = Date.UTC(m.getFullYear(), m.getMonth(), m.getDate());
    var p = el.getAttribute('data-date').split('-'), ev = Date.UTC(+p[0], p[1] - 1, +p[2]);
    var days = Math.round((ev - today) / 864e5), hr = m.getHours();
    var card = el.closest('.card');
    if (days < -1 || (days === -1 && hr >= 6)) { if (card) card.hidden = true; return; }
    el.textContent = (days === -1 || (days === 0 && hr >= 21)) ? 'идёт сейчас' : days === 0 ? 'сегодня' : days === 1 ? 'завтра' : 'через ' + days + ' ' + (days % 10 === 1 && days % 100 !== 11 ? 'день' : (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) ? 'дня' : 'дней');
  }); }
  tickDate(); setInterval(tickDate, 60000);
  // 3D-логотип (утверждён Лёшей 11.11): грузится после показа страницы поверх плоского знака.
  // Слабое устройство, экономия трафика или «меньше движения» = остаётся плоский знак
  function load3d() {
    var imgs = document.querySelectorAll('img[data-3d]');
    if (!imgs.length) return;
    var c = navigator.connection || {}, mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    if (c.saveData || mem < 3 || cores < 4 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var s = document.createElement('script');
    s.type = 'module'; s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    s.onload = function () {
      imgs.forEach(function (img) {
        var box = document.createElement('span'); box.className = 'af3d';
        img.parentNode.insertBefore(box, img); box.appendChild(img);
        var mv = document.createElement('model-viewer');
        mv.setAttribute('src', 'assets/af.glb'); mv.setAttribute('auto-rotate', ''); mv.setAttribute('auto-rotate-delay', '0');
        mv.setAttribute('rotation-per-second', '35deg'); mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('tone-mapping', 'neutral'); mv.setAttribute('exposure', '0.55'); mv.setAttribute('shadow-intensity', '0');
        mv.setAttribute('camera-orbit', '0deg 85deg auto'); mv.setAttribute('field-of-view', '17deg');
        mv.setAttribute('loading', 'eager'); mv.setAttribute('reveal', 'auto'); mv.setAttribute('aria-hidden', 'true'); mv.tabIndex = -1;
        // рукой: тянуть = вращать (мышь и палец), наведение = раскрутка быстрее
        mv.setAttribute('camera-controls', ''); mv.setAttribute('disable-zoom', ''); mv.setAttribute('disable-pan', '');
        mv.setAttribute('touch-action', 'pan-y'); mv.setAttribute('auto-rotate-delay', '1200');
        mv.addEventListener('pointerenter', function () { mv.setAttribute('rotation-per-second', '140deg'); });
        mv.addEventListener('pointerleave', function () { mv.setAttribute('rotation-per-second', '35deg'); });
        // логотип-ссылка: клик ведёт по ссылке, а поворот рукой не ведёт
        var sx = 0, sy = 0, moved = false;
        mv.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; moved = false; });
        mv.addEventListener('pointermove', function (e) { if (e.buttons && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true; });
        mv.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } });
        mv.addEventListener('load', function () { box.classList.add('is-3d'); });
        box.appendChild(mv);
      });
    };
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(load3d, 300);
  else window.addEventListener('load', function () { setTimeout(load3d, 300); });
})();
