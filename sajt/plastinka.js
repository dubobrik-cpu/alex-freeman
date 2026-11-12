// Пластинка со скретчем (демо 11.11). Этикетка из рисунка Лёши крутится рукой,
// звук идёт вперёд и назад со скоростью руки. Звук ВРЕМЕННЫЙ: синтез кодом, без чужой музыки.
// Когда Лёша пришлёт свой сэмпл, заменить makeBuffer() на загрузку файла.
(function () {
  var hero = document.querySelector('.hero'), bgImg = document.querySelector('.hero__bg img');
  if (!hero || !bgImg) return;
  // этикетка на фоне: центр и полуоси в пикселях исходника 1672x941
  var CX = 10, CY = 930, RX = 101, RY = 59, DISC_RX = 270, DISC_RY = 138;

  // этикетка лежит в слое фона (под затемнением), ловушка руки и подсказка поверх
  var box = document.createElement('div'); box.className = 'vinyl';
  box.innerHTML = '<div class="vinyl__flat"><img class="vinyl__lab" src="assets/etiketka.webp" alt="" draggable="false"></div>';
  hero.querySelector('.hero__bg').appendChild(box);
  var top = document.createElement('div'); top.className = 'vinyl vinyl--top';
  top.innerHTML = '<button class="vinyl__hit" type="button" aria-label="Пластинка: потяните по кругу, чтобы поскретчить. Стрелки влево и вправо тоже работают"></button><span class="vinyl__hint" aria-hidden="true">крути</span>';
  hero.appendChild(top);
  var flat = box.querySelector('.vinyl__flat'), lab = box.querySelector('.vinyl__lab'), hit = top.querySelector('.vinyl__hit');

  // пересчёт положения: картинка фона с object-fit:cover и своим object-position
  var sc = 1, ox = 0, oy = 0, on = false;
  function place() {
    var r = bgImg.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    var nw = 1672, nh = 941, cs = getComputedStyle(bgImg).objectPosition.split(' ');
    var px = parseFloat(cs[0]) / 100, py = parseFloat(cs[1] || '50%') / 100;
    sc = Math.max(r.width / nw, r.height / nh);
    ox = r.left - hr.left + (r.width - nw * sc) * px; oy = r.top - hr.top + (r.height - nh * sc) * py;
    var x = ox + CX * sc, y = oy + CY * sc;
    on = window.innerWidth >= 1100 && x > -20 && y < hr.height + 40;
    box.style.display = top.style.display = on ? '' : 'none';
    var w = 2 * RX * sc;
    flat.style.cssText = 'left:' + (x - w / 2) + 'px;top:' + (y - w / 2) + 'px;width:' + w + 'px;height:' + w + 'px;transform:scaleY(' + (RY / RX) + ')';
    var hw = 2 * DISC_RX * sc, hh = 2 * DISC_RY * sc;
    hit.style.cssText = 'left:' + (x - hw / 2) + 'px;top:' + (y - hh / 2) + 'px;width:' + hw + 'px;height:' + hh + 'px';
    top.querySelector('.vinyl__hint').style.cssText = 'left:' + (x + DISC_RX * sc * 0.55) + 'px;top:' + (y - DISC_RY * sc * 0.95) + 'px';
    box._c = { x: x, y: y, k: RX / RY };
  }
  if (bgImg.complete) place(); else bgImg.addEventListener('load', place);
  window.addEventListener('resize', place);

  // звук
  var ctx, buf, node, pos = 0, rate = 0, target = 0, gain;
  function makeBuffer() {
    var sr = ctx.sampleRate, n = Math.floor(sr * 2.4), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), i, t;
    // «а-а»: пила 140 Гц через форманты гласной «а» (700 и 1220 Гц), с падением высоты
    for (i = 0; i < sr * 0.9; i++) {
      t = i / sr; var f0 = 150 - 30 * t, ph = 0, s = 0, h;
      for (h = 1; h < 28; h++) {
        var fh = f0 * h, fA = Math.exp(-Math.pow((fh - 700) / 160, 2)) + 0.6 * Math.exp(-Math.pow((fh - 1220) / 200, 2)) + 0.25 * Math.exp(-Math.pow((fh - 2600) / 300, 2));
        s += fA / h * Math.sin(2 * Math.PI * fh * t);
      }
      var env = Math.min(1, t / 0.02) * Math.max(0, 1 - Math.pow(t / 0.9, 3));
      d[i] = s * 0.9 * env;
    }
    // бочка и хлопок
    function kick(at) { for (var j = 0; j < sr * 0.35; j++) { var tt = j / sr; d[Math.floor(at * sr) + j] += Math.sin(2 * Math.PI * (50 + 120 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 9) * 0.9; } }
    function clap(at) { for (var j = 0; j < sr * 0.25; j++) { var tt = j / sr; d[Math.floor(at * sr) + j] += (Math.random() * 2 - 1) * Math.exp(-tt * 18) * 0.45; } }
    kick(1.0); clap(1.4); kick(1.8); clap(2.1);
    for (i = 0; i < n; i++) d[i] = Math.tanh(d[i] * 1.2) * 0.7;
    return b;
  }
  function audioOn() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); buf = makeBuffer(); var data = buf.getChannelData(0), len = data.length;
    gain = ctx.createGain(); gain.gain.value = 0.8;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
    node = ctx.createScriptProcessor(1024, 0, 1);
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
  function ang(e) { var c = box._c, r = hero.getBoundingClientRect(); return Math.atan2((e.clientY - r.top - c.y) * c.k, e.clientX - r.left - c.x) * 180 / Math.PI; }
  function turn(delta, dt) {
    angle += delta; lab.style.transform = 'rotate(' + angle + 'deg)';
    var w = delta / Math.max(dt, 0.008); // градусов в секунду
    target = Math.max(-4, Math.min(4, w / 200)); // 33 об/мин = 200 °/с = скорость 1
    clearTimeout(stopTimer); stopTimer = setTimeout(function () { target = 0; }, 60);
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
