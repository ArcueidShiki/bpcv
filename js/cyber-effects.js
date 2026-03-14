(function () {
  // ---------------------------------------------------------------------------
  // Performance check
  // ---------------------------------------------------------------------------
  var isCapable = !(
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2)
  );

  // ---------------------------------------------------------------------------
  // Inject styles
  // ---------------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = [
    '#trail-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }',
    '#mouth-canvas { position: fixed; bottom: 0; left: 0; width: 100%; height: 200px; z-index: 1; pointer-events: none; opacity: 0.4; }',
    '#scroll-line { position: fixed; right: 4px; top: 10%; height: 80%; width: 2px; background: rgba(255,255,255,0.08); z-index: 999; border-radius: 2px; }',
    '#scroll-progress { width: 100%; background: linear-gradient(to bottom, #00f0ff, #7000ff); height: 0%; box-shadow: 0 0 8px #00f0ff; border-radius: 2px; transition: height 0.1s; }',
    '@keyframes glitch {',
    '  0%   { transform: translateX(0); text-shadow: 2px 0 #00f0ff, -2px 0 #ff003c; }',
    '  20%  { transform: translateX(-2px); text-shadow: -2px 0 #00f0ff, 2px 0 #ff003c; }',
    '  40%  { transform: translateX(2px); clip-path: inset(30% 0 30% 0); }',
    '  60%  { transform: translateX(-1px); clip-path: inset(60% 0 10% 0); }',
    '  80%  { transform: translateX(0); clip-path: inset(0 0 0 0); text-shadow: none; }',
    '  100% { transform: translateX(0); text-shadow: none; }',
    '}',
    '.section-title.glitch { animation: glitch 0.4s ease; }',
  ].join('\n');
  document.head.appendChild(style);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ---------------------------------------------------------------------------
  // Effect 2: Mouse Trail Particles
  // ---------------------------------------------------------------------------
  function initTrail() {
    var canvas = document.createElement('canvas');
    canvas.id = 'trail-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var MAX_PARTICLES = 80;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', function (e) {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x:    e.clientX,
        y:    e.clientY,
        vx:   (Math.random() - 0.5) * 1.5,
        vy:   (Math.random() - 0.5) * 1.5 - 1,
        life: 1.0,
        size: Math.random() * 3 + 1,
        hue:  Math.random() * 60 + 180
      });
    });

    function tickTrail() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.life -= 0.03;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = 'hsl(' + p.hue + ',100%,60%)';
        ctx.fillStyle   = 'hsl(' + p.hue + ',100%,70%)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(tickTrail);
    }
    tickTrail();
  }

  // ---------------------------------------------------------------------------
  // Effect 3: Wave / Mouth Effect
  // ---------------------------------------------------------------------------
  function drawWaves(ctx, w, h, time, mouseXFactor) {
    ctx.clearRect(0, 0, w, h);

    // Wave 1: cyan
    ctx.beginPath();
    for (var x = 0; x <= w; x += 3) {
      var y = h / 2 + Math.sin(x * 0.012 + time * 1.2 + mouseXFactor) *
              (20 + Math.sin(time * 0.5) * 10);
      if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    }
    ctx.strokeStyle = 'rgba(0,240,255,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Wave 2: purple (offset)
    ctx.beginPath();
    for (var x2 = 0; x2 <= w; x2 += 3) {
      var y2 = h / 2 + Math.sin(x2 * 0.015 + time * 0.8 + mouseXFactor * 0.7 + 1.5) *
               (15 + Math.sin(time * 0.7 + 1) * 8);
      if (x2 === 0) { ctx.moveTo(x2, y2); } else { ctx.lineTo(x2, y2); }
    }
    ctx.strokeStyle = 'rgba(112,0,255,0.5)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  function initWave() {
    var canvas = document.createElement('canvas');
    canvas.id = 'mouth-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var startTime = performance.now();

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = 200;
    }
    resize();
    window.addEventListener('resize', resize);

    function tickWave() {
      var elapsed      = (performance.now() - startTime) / 1000;
      var mouseXFactor = (mouseX / window.innerWidth) * Math.PI * 2;
      drawWaves(ctx, canvas.width, canvas.height, elapsed, mouseXFactor);
      requestAnimationFrame(tickWave);
    }
    tickWave();
  }

  // ---------------------------------------------------------------------------
  // Effect 4: Section Title Glitch
  // ---------------------------------------------------------------------------
  function initGlitch() {
    document.addEventListener('mouseover', function (e) {
      var el = e.target;
      if (!el || !el.classList) return;
      if (!el.classList.contains('section-title')) return;
      if (el.classList.contains('glitch')) return;
      el.classList.add('glitch');
      el.addEventListener('animationend', function onEnd() {
        el.classList.remove('glitch');
        el.removeEventListener('animationend', onEnd);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Effect 5: Scroll Progress Line
  // ---------------------------------------------------------------------------
  function initScrollProgress() {
    var line = document.createElement('div');
    line.id  = 'scroll-line';
    var bar  = document.createElement('div');
    bar.id   = 'scroll-progress';
    line.appendChild(bar);
    document.body.appendChild(line);

    function updateScroll() {
      var scrollTop  = window.scrollY || document.documentElement.scrollTop;
      var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      var pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.height = pct + '%';
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    if (isCapable) {
      initTrail();
      initWave();
    }
    initGlitch();
    initScrollProgress();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
