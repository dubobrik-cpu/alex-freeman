// Пластинка со скретчем (демо). Диск и этикетка восстановлены из рисунка Лёши (assets/plastinka.webp,
// assets/etiketka.webp). Этикетка крутится рукой, звук идёт вперёд и назад со скоростью руки.
// Звук ВРЕМЕННЫЙ: синтез кодом, без чужой музыки. Сэмпл Лёши подставить в makeBuffer().
(function () {
  var hero = document.querySelector('.hero'), bgImg = document.querySelector('.hero__bg img');
  if (!hero || !bgImg) return;
  // на рисунке 1672x941: центр пластинки и полуоси диска и этикетки
  var CX = 10, CY = 930, DRX = 262, DRY = 136, LRX = 101, LRY = 59;

  var top = document.createElement('div'); top.className = 'vinyl';
  top.innerHTML =
    '<div class="vinyl__disk"><img src="assets/plastinka.webp" alt="" draggable="false"></div>' +
    '<div class="vinyl__flat"><img class="vinyl__lab" src="assets/etiketka.webp" alt="" draggable="false"></div>' +
    '<button class="vinyl__hit" type="button" aria-label="Пластинка: потяните по кругу, чтобы поскретчить. Стрелки влево и вправо тоже работают"></button>' +
    '<span class="vinyl__hint" aria-hidden="true">крути пластинку</span>';
  hero.appendChild(top);
  var disk = top.querySelector('.vinyl__disk'), flat = top.querySelector('.vinyl__flat'),
      lab = top.querySelector('.vinyl__lab'), hit = top.querySelector('.vinyl__hit'), hint = top.querySelector('.vinyl__hint');
  var C = { x: 0, y: 0, k: LRX / LRY };

  function put(x, y, sc) {
    var dw = 2 * DRX * sc, lw = 2 * LRX * sc;
    disk.style.cssText = 'left:' + (x - dw / 2) + 'px;top:' + (y - dw / 2) + 'px;width:' + dw + 'px;height:' + dw + 'px;transform:scaleY(' + (DRY / DRX) + ')';
    flat.style.cssText = 'left:' + (x - lw / 2) + 'px;top:' + (y - lw / 2) + 'px;width:' + lw + 'px;height:' + lw + 'px;transform:scaleY(' + (LRY / LRX) + ')';
    var hw = 2 * DRX * sc, hh = 2 * DRY * sc;
    hit.style.cssText = 'left:' + (x - hw / 2) + 'px;top:' + (y - hh / 2) + 'px;width:' + hw + 'px;height:' + hh + 'px';
    C.x = x; C.y = y;
  }
  function place() {
    var hr = hero.getBoundingClientRect();
    if (window.innerWidth >= 1100) {
      // на компьютере: ровно на своём месте рисунка (object-fit: cover)
      var r = bgImg.getBoundingClientRect(), cs = getComputedStyle(bgImg).objectPosition.split(' ');
      var px = parseFloat(cs[0]) / 100, py = parseFloat(cs[1] || '50%') / 100;
      var sc = Math.max(r.width / 1672, r.height / 941);
      var ox = r.left - hr.left + (r.width - 1672 * sc) * px, oy = r.top - hr.top + (r.height - 941 * sc) * py;
      put(ox + CX * sc, oy + CY * sc, sc);
      hint.style.cssText = 'left:' + (C.x + DRX * sc * 0.08) + 'px;top:' + (C.y - DRY * sc * 1.3) + 'px';
      hint.textContent = 'крути пластинку'; top.classList.remove('vinyl--mob');
    } else {
      // телефон и планшет: выглядывает справа от кнопки «Слушать миксы»
      var b = document.querySelector('.listen').getBoundingClientRect(), s2 = 104 / DRX;
      put(hr.width + 6, b.top - hr.top + b.height / 2, s2);
      hint.textContent = 'крути'; hint.style.cssText = 'right:10px;top:' + (b.top - hr.top + b.height / 2 - DRY * s2 - 30) + 'px';
      top.classList.add('vinyl--mob');
    }
  }
  if (bgImg.complete) place(); else bgImg.addEventListener('load', place);
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);

  // звук
  var ctx, data, len, rate = 0, target = 0, pos = 0;
  function makeBuffer() {
    var sr = ctx.sampleRate, n = Math.floor(sr * 2.4), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), i, t;
    // «а-а»: пила с падением высоты через форманты гласной «а»
    for (i = 0; i < sr * 0.9; i++) {
      t = i / sr; var f0 = 150 - 30 * t, s = 0, h;
      for (h = 1; h < 28; h++) {
        var fh = f0 * h, fA = Math.exp(-Math.pow((fh - 700) / 160, 2)) + 0.6 * Math.exp(-Math.pow((fh - 1220) / 200, 2)) + 0.25 * Math.exp(-Math.pow((fh - 2600) / 300, 2));
        s += fA / h * Math.sin(2 * Math.PI * fh * t);
      }
      d[i] = s * 0.9 * Math.min(1, t / 0.02) * Math.max(0, 1 - Math.pow(t / 0.9, 3));
    }
    function kick(at) { for (var j = 0; j < sr * 0.35; j++) { var tt = j / sr; d[Math.floor(at * sr) + j] += Math.sin(2 * Math.PI * (50 + 120 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 9) * 0.9; } }
    function clap(at) { for (var j = 0; j < sr * 0.25; j++) { var tt = j / sr; d[Math.floor(at * sr) + j] += (Math.random() * 2 - 1) * Math.exp(-tt * 18) * 0.45; } }
    kick(1.0); clap(1.4); kick(1.8); clap(2.1);
    for (i = 0; i < n; i++) d[i] = Math.tanh(d[i] * 1.2) * 0.7;
    return b;
  }
  function audioOn() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); data = makeBuffer().getChannelData(0); len = data.length;
    var gain = ctx.createGain(); gain.gain.value = 0.8;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
    var node = ctx.createScriptProcessor(1024, 0, 1);
    node.onaudioprocess = function (e) {
      var out = e.outputBuffer.getChannelData(0);
      for (var k = 0; k < out.length; k++) {
        rate += (target - rate) * 0.004;
        pos += rate; if (pos < 0) pos += len; if (pos >= len) pos -= len;
        var p0 = Math.floor(pos), f = pos - p0, a = data[p0], b2 = data[(p0 + 1) % len];
        out[k] = (a + (b2 - a) * f) * Math.min(1, Math.abs(rate) * 1.5);
      }
    };
    node.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
  }

  // рука: угол вокруг центра этикетки в «развёрнутых» координатах
  var angle = 0, dragging = false, last = 0, lastT = 0, stopTimer;
  function ang(e) { var r = hero.getBoundingClientRect(); return Math.atan2((e.clientY - r.top - C.y) * C.k, e.clientX - r.left - C.x) * 180 / Math.PI; }
  function turn(delta, dt) {
    angle += delta; lab.style.transform = 'rotate(' + angle + 'deg)';
    target = Math.max(-4, Math.min(4, delta / Math.max(dt, 0.008) / 200)); // 33 об/мин = 200 °/с = скорость 1
    clearTimeout(stopTimer); stopTimer = setTimeout(function () { target = 0; }, 60);
    top.classList.add('is-used');
  }
  hit.addEventListener('pointerdown', function (e) {
    audioOn(); dragging = true; hit.setPointerCapture(e.pointerId); last = ang(e); lastT = performance.now(); top.classList.add('is-hand');
  });
  hit.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var a = ang(e), now = performance.now(), d = a - last;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    turn(d, (now - lastT) / 1000); last = a; lastT = now;
  });
  function up() { dragging = false; target = 0; top.classList.remove('is-hand'); }
  hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up);
  hit.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); audioOn(); var dir = e.key === 'ArrowRight' ? 1 : -1, steps = 0;
    var iv = setInterval(function () { turn(dir * 9, 0.016); if (++steps > 12) { clearInterval(iv); target = 0; } }, 16);
  });
})();
