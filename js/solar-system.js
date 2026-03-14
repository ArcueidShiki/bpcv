(function () {
  'use strict';

  // ── CSS injection ────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '.planet-label{position:absolute;color:rgba(255,255,255,0.7);font-size:10px;',
    'font-family:"Orbitron",monospace;pointer-events:none;',
    'text-shadow:0 0 8px currentColor;letter-spacing:1px;',
    'text-transform:uppercase;transition:opacity 0.3s;}',
    '.planet-label.clickable{pointer-events:auto;cursor:pointer;color:rgba(0,240,255,0.9);}',

    /* ── Planet Sidebar ── */
    '#planet-sidebar{position:fixed;right:18px;top:50%;transform:translateY(-50%);',
    'z-index:500;display:flex;flex-direction:column;gap:10px;pointer-events:auto;}',

    '.planet-icon-btn{width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,0.18);',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'font-size:9px;font-family:"Orbitron",monospace;letter-spacing:0;color:rgba(255,255,255,0.85);',
    'transition:transform 0.25s,border-color 0.25s,box-shadow 0.25s;position:relative;',
    'text-transform:uppercase;}',

    '.planet-icon-btn:hover{transform:scale(1.25);border-color:rgba(255,255,255,0.7);}',

    '.planet-icon-btn.active{border-color:#00f0ff !important;',
    'box-shadow:0 0 14px 2px rgba(0,240,255,0.55);transform:scale(1.15);}',

    '.planet-icon-tip{position:absolute;right:42px;top:50%;transform:translateY(-50%);',
    'background:rgba(4,6,20,0.88);backdrop-filter:blur(6px);',
    'color:#fff;padding:3px 9px;font-size:9px;font-family:"Orbitron",monospace;',
    'letter-spacing:1px;text-transform:uppercase;white-space:nowrap;pointer-events:none;',
    'opacity:0;transition:opacity 0.2s;border:1px solid rgba(255,255,255,0.15);border-radius:2px;}',

    '.planet-icon-btn:hover .planet-icon-tip{opacity:1;}',

    /* Sun button at top */
    '#planet-sidebar-sun{width:34px;height:34px;border-radius:50%;',
    'border:2px solid rgba(255,204,51,0.5);cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;',
    'font-size:9px;font-family:"Orbitron",monospace;color:#ffcc33;',
    'background:radial-gradient(circle,rgba(255,204,51,0.25),rgba(255,140,0,0.1));',
    'transition:transform 0.25s,box-shadow 0.25s;position:relative;',
    'box-shadow:0 0 8px rgba(255,204,51,0.3);}',

    '#planet-sidebar-sun:hover{transform:scale(1.25);box-shadow:0 0 20px rgba(255,204,51,0.6);}',
    '#planet-sidebar-sun.active{border-color:#ffcc33;box-shadow:0 0 20px rgba(255,204,51,0.8);}',
    '#planet-sidebar-sun .planet-icon-tip{color:#ffcc33;}',
  ].join('');
  document.head.appendChild(style);

  // ── Performance detection ────────────────────────────────────────────────────
  function detectPerformanceTier() {
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'low';
    var dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbgInfo) {
      var renderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      if (renderer.includes('intel') && !renderer.includes('iris')) return 'low';
      if (renderer.includes('adreno 3') || renderer.includes('mali-4')) return 'low';
    }
    var mem = navigator.deviceMemory || 4;
    if (mem <= 2) return 'low';
    if (mem <= 4) return 'medium';
    return 'high';
  }

  // ── Planet data ──────────────────────────────────────────────────────────────
  var PLANETS = [
    { name: 'Contact',     radius: 0.3, orbitR: 5,    speed: 0.0035, color: 0xaaaaaa, section: '#contact-section',    texture: 'icons/planets/mercury.jpg' },
    { name: 'Profile',     radius: 0.4, orbitR: 7,    speed: 0.0026, color: 0xffcc88, section: '#profile-section',    texture: 'icons/planets/venus.jpg'   },
    { name: 'Experience',  radius: 0.6, orbitR: 9.5,  speed: 0.002,  color: 0x4488ff, section: '#experience-section', texture: 'icons/planets/earth.jpg'   },
    { name: 'Internships', radius: 0.4, orbitR: 12,   speed: 0.0014, color: 0xff8844, section: '#internship-section', texture: 'icons/planets/mars.jpg'    },
    { name: 'Hackathons',  radius: 0.5, orbitR: 14.5, speed: 0.0011, color: 0xffdd00, section: '#hackathon-section',  texture: 'icons/planets/jupiter.jpg' },
    { name: 'Projects',    radius: 0.9, orbitR: 17,   speed: 0.0008, color: 0x88ff88, section: '#projects-section',   texture: 'icons/planets/saturn.jpg'  },
    { name: 'Skills',      radius: 0.7, orbitR: 20,   speed: 0.0006, color: 0xaa88ff, section: '#skills-section',     texture: 'icons/planets/uranus.jpg'  },
    { name: 'Education',   radius: 0.5, orbitR: 23,   speed: 0.0004, color: 0xff6688, section: '#education-section',  texture: 'icons/planets/neptune.jpg' },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function hexToRgba(hex, a) {
    var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function makeCircleTexture(size, color, alpha) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, color.replace('A', alpha));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function buildOrbitLine(radius) {
    var pts = [];
    var segs = 64;
    for (var i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    return new THREE.LineLoop(geo, mat);
  }

  // ── State ────────────────────────────────────────────────────────────────────
  var state = {
    renderer: null, scene: null, camera: null,
    sun: null, planets: [], labels: [],
    starMesh: null, animId: null,
    mouse: { x: 0, y: 0 }, camTarget: { x: 0, y: 0 },
    camCurrent: { x: 0, y: 0 },
    lastTime: 0, container: null, tier: 'high',
    flares: [], sunAngle: 0,
    // focus state
    focusedPlanetIdx: -1,           // -1 = overview, 0..N = planet index
    camPos:  { x: 0, y: 48, z: 6 },
    camLook: { x: 0, y: 0,  z: 0 },
    sidebarBtns: [],
    scrollZoomY: 48,                // overview camera height, modified by scroll
  };

  // ── Build scene ──────────────────────────────────────────────────────────────
  function buildScene(tier) {
    var scene = new THREE.Scene();

    // Stars
    var starCount = tier === 'high' ? 200 : 100;
    var starPos = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
      starPos[i*3]   = (Math.random() - 0.5) * 120;
      starPos[i*3+1] = (Math.random() - 0.5) * 120;
      starPos[i*3+2] = (Math.random() - 0.5) * 60 - 10;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true });
    state.starMesh = new THREE.Points(starGeo, starMat);
    scene.add(state.starMesh);

    // Lights
    scene.add(new THREE.AmbientLight(0x222244, 0.8));
    var sunLight = new THREE.PointLight(0xfff4cc, 2.5, 80);
    scene.add(sunLight);

    // Texture loader
    var loader = new THREE.TextureLoader();

    // Sun
    var sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
    var sunTex = loader.load('icons/planets/sun.jpg');
    var sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    state.sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(state.sun);

    // Lens flare sprites (canvas-generated)
    var flareDefs = [
      { size: 5.0, color: 'rgba(255,200,50,A)', alpha: '0.18' },
      { size: 3.2, color: 'rgba(255,140,20,A)', alpha: '0.22' },
      { size: 1.8, color: 'rgba(255,255,180,A)', alpha: '0.3' },
    ];
    state.flares = flareDefs.map(function(f) {
      var tex = makeCircleTexture(128, f.color, f.alpha);
      var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      var sp = new THREE.Sprite(mat);
      sp.scale.set(f.size, f.size, 1);
      scene.add(sp);
      return sp;
    });

    // Planets
    var planetCount = tier === 'medium' ? 6 : 8;
    var container2d = state.container;

    for (var pi = 0; pi < planetCount; pi++) {
      var pd = PLANETS[pi];
      var pGeo = new THREE.SphereGeometry(pd.radius, 32, 32);
      var pTex = loader.load(pd.texture);
      var pMat = new THREE.MeshPhongMaterial({ map: pTex, emissive: pd.color, emissiveIntensity: 0.05 });
      var mesh = new THREE.Mesh(pGeo, pMat);
      mesh.userData = { angle: Math.random() * Math.PI * 2, data: pd };

      // Glow sprite
      if (tier !== 'low') {
        var glowTex = makeCircleTexture(64, 'rgba(255,255,255,A)', '0.4');
        var glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: pd.color });
        var glow = new THREE.Sprite(glowMat);
        var gs = pd.radius * (tier === 'high' ? 3.5 : 2.0);
        glow.scale.set(gs, gs, 1);
        mesh.add(glow);
      }

      scene.add(mesh);
      scene.add(buildOrbitLine(pd.orbitR));

      // Saturn ring (high, Skills planet = index 6)
      if (tier === 'high' && pi === 6) {
        var ringGeo = new THREE.TorusGeometry(pd.radius * 2, pd.radius * 0.35, 4, 48);
        var ringMat = new THREE.MeshBasicMaterial({ color: 0xccaaff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.42;
        mesh.add(ring);
      }

      // Label
      var label = document.createElement('div');
      label.className = 'planet-label clickable';
      label.textContent = pd.name;
      label.dataset.section = pd.section;
      label.addEventListener('click', function(e) {
        var sec = document.querySelector(e.target.dataset.section);
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });
      container2d.appendChild(label);

      state.planets.push(mesh);
      state.labels.push(label);
    }

    return scene;
  }

  // ── Burst animation ──────────────────────────────────────────────────────────
  function burstPlanet(mesh) {
    var start = performance.now();
    var origScale = mesh.scale.x;
    function tick(now) {
      var t = Math.min((now - start) / 400, 1);
      var s = origScale + Math.sin(t * Math.PI) * 0.5;
      mesh.scale.set(s, s, s);
      if (t < 1) requestAnimationFrame(tick);
      else mesh.scale.set(origScale, origScale, origScale);
    }
    requestAnimationFrame(tick);
  }

  // ── Animate ──────────────────────────────────────────────────────────────────
  function animate(now) {
    state.animId = requestAnimationFrame(animate);

    // FPS cap ~30 on mobile
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);
    var minDelta = isMobile ? 33 : 0;
    var delta = now - state.lastTime;
    if (delta < minDelta) return;
    state.lastTime = now;

    var t = now * 0.001;

    // Stars twinkle
    if (state.starMesh) state.starMesh.material.opacity = 0.7 + Math.sin(t * 0.5) * 0.3;

    // Sun pulse + rotate
    var pulse = 1.0 + Math.sin(t * 1.2) * 0.025;
    state.sun.scale.set(pulse, pulse, pulse);
    state.sun.rotation.y += 0.003;

    // Flares follow sun
    state.flares.forEach(function(f) { f.position.copy(state.sun.position); });

    // Smooth camera — lerp toward focus target or overview
    var lerpF = 0.04;
    state.camCurrent.x += (state.camTarget.x - state.camCurrent.x) * lerpF;
    state.camCurrent.y += (state.camTarget.y - state.camCurrent.y) * lerpF;

    var tPos, tLook;
    if (state.focusedPlanetIdx >= 0 && state.planets[state.focusedPlanetIdx]) {
      // Near-horizontal cinematic view: camera at same height as planet,
      // positioned radially behind (outside orbit), looking inward toward planet
      var fp = state.planets[state.focusedPlanetIdx].position;
      var orbitLen = Math.sqrt(fp.x * fp.x + fp.z * fp.z) || 1;
      var dirX = fp.x / orbitLen;
      var dirZ = fp.z / orbitLen;
      tPos  = { x: fp.x + dirX * 7, y: fp.y + 1.5, z: fp.z + dirZ * 7 };
      tLook = { x: fp.x * 0.4, y: 0, z: fp.z * 0.4 }; // look slightly past planet toward sun
    } else {
      tPos  = { x: state.camCurrent.x * 6, y: state.scrollZoomY, z: 6 + state.camCurrent.y * 6 };
      tLook = { x: 0, y: 0, z: 0 };
    }

    var camLerp = 0.06;
    state.camPos.x  += (tPos.x  - state.camPos.x)  * camLerp;
    state.camPos.y  += (tPos.y  - state.camPos.y)  * camLerp;
    state.camPos.z  += (tPos.z  - state.camPos.z)  * camLerp;
    state.camLook.x += (tLook.x - state.camLook.x) * camLerp;
    state.camLook.y += (tLook.y - state.camLook.y) * camLerp;
    state.camLook.z += (tLook.z - state.camLook.z) * camLerp;

    state.camera.position.set(state.camPos.x, state.camPos.y, state.camPos.z);
    state.camera.lookAt(state.camLook.x, state.camLook.y, state.camLook.z);

    // Planet orbits
    var w = state.renderer.domElement.clientWidth;
    var h = state.renderer.domElement.clientHeight;

    state.planets.forEach(function(mesh, idx) {
      var ud = mesh.userData;
      ud.angle += ud.data.speed;
      mesh.position.set(
        Math.cos(ud.angle) * ud.data.orbitR,
        Math.sin(ud.angle * 0.3) * 0.15,
        Math.sin(ud.angle) * ud.data.orbitR
      );
      mesh.rotation.y += 0.01;

      // Update label 2D position
      var label = state.labels[idx];
      if (!label) return;
      var pos = mesh.position.clone().project(state.camera);
      // Only show if in front
      if (pos.z > 1) { label.style.opacity = '0'; return; }
      var x = (pos.x * 0.5 + 0.5) * w;
      var y = (-pos.y * 0.5 + 0.5) * h;
      label.style.left = (x + 8) + 'px';
      label.style.top  = (y - 6) + 'px';
      label.style.opacity = '1';
    });

    state.renderer.render(state.scene, state.camera);
  }

  // ── Init / Destroy ───────────────────────────────────────────────────────────
  function init() {
    var tier = detectPerformanceTier();
    state.tier = tier;

    if (tier === 'low') {
      document.body.style.background = 'linear-gradient(135deg, #030310 0%, #0a0a20 100%)';
      return;
    }

    var container = document.getElementById('solar-background');
    if (!container) return;
    state.container = container;
    // container is position:fixed covering full viewport; labels are absolute children

    var W = window.innerWidth, H = window.innerHeight;

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    container.appendChild(renderer.domElement);
    state.renderer = renderer;

    var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 48, 6);
    camera.lookAt(0, 0, 0);
    state.camera = camera;

    state.scene = buildScene(tier);

    // ── Planet Sidebar ───────────────────────────────────────────────────────
    var sidebar = document.createElement('div');
    sidebar.id = 'planet-sidebar';

    // Sun / overview button
    var sunBtn = document.createElement('div');
    sunBtn.id = 'planet-sidebar-sun';
    sunBtn.textContent = '☀';
    var sunTip = document.createElement('span');
    sunTip.className = 'planet-icon-tip';
    sunTip.textContent = 'Overview';
    sunBtn.appendChild(sunTip);
    sunBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      state.focusedPlanetIdx = -1;
      state.sidebarBtns.forEach(function(b) { b.classList.remove('active'); });
      sunBtn.classList.add('active');
    });
    sidebar.appendChild(sunBtn);
    state.sidebarBtns.push(sunBtn);

    // One button per planet
    var planetCount = state.planets.length;
    for (var pi = 0; pi < planetCount; pi++) {
      (function(idx) {
        var pd = PLANETS[idx];
        var hex = '#' + pd.color.toString(16).padStart(6, '0');
        var btn = document.createElement('div');
        btn.className = 'planet-icon-btn';
        btn.style.background = hexToRgba(pd.color, 0.22);
        btn.style.borderColor = hexToRgba(pd.color, 0.5);
        btn.style.color = hex;
        btn.style.boxShadow = '0 0 6px ' + hexToRgba(pd.color, 0.3);
        btn.textContent = pd.name.charAt(0);
        var tip = document.createElement('span');
        tip.className = 'planet-icon-tip';
        tip.textContent = pd.name;
        btn.appendChild(tip);

        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (state.focusedPlanetIdx === idx) {
            state.focusedPlanetIdx = -1;
            state.sidebarBtns.forEach(function(b) { b.classList.remove('active'); });
            sunBtn.classList.add('active');
          } else {
            state.focusedPlanetIdx = idx;
            state.sidebarBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var section = document.querySelector(pd.section);
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        sidebar.appendChild(btn);
        state.sidebarBtns.push(btn);
      }(pi));
    }

    document.body.appendChild(sidebar);
    sunBtn.classList.add('active');

    // Click blank space → back to overview
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#planet-sidebar') &&
          !e.target.closest('.planet-label') &&
          !e.target.closest('main') &&
          !e.target.closest('.map-section') &&
          !e.target.closest('.chatbot-section') &&
          !e.target.closest('.language-selector-container') &&
          !e.target.closest('.pdf-btn') &&
          !e.target.closest('.game-link-btn')) {
        state.focusedPlanetIdx = -1;
        state.sidebarBtns.forEach(function(b) { b.classList.remove('active'); });
        sunBtn.classList.add('active');
      }
    });

    // Hover on labels triggers planet burst
    state.labels.forEach(function(label, idx) {
      label.addEventListener('mouseenter', function() {
        if (state.planets[idx]) burstPlanet(state.planets[idx]);
      });
    });

    window.addEventListener('mousemove', function(e) {
      var maxAngle = (5 * Math.PI) / 180;
      state.camTarget.x = -((e.clientX / window.innerWidth) - 0.5) * 2 * maxAngle;
      state.camTarget.y =  ((e.clientY / window.innerHeight) - 0.5) * 2 * maxAngle;
    });

    // Scroll zoom: smoothly bring camera closer as user scrolls down
    window.addEventListener('scroll', function() {
      if (state.focusedPlanetIdx >= 0) return;
      var scrollY = window.scrollY || document.documentElement.scrollTop;
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      var progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
      // Overview: y=48 (far/top-down) → y=18 (close/angled) as page scrolls down
      state.scrollZoomY = 48 - progress * 30;
    }, { passive: true });

    window.addEventListener('resize', function() {
      var nW = window.innerWidth, nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });

    state.lastTime = performance.now();
    animate(state.lastTime);
  }

  function destroy() {
    if (state.animId) cancelAnimationFrame(state.animId);
    state.labels.forEach(function(l) { l.parentNode && l.parentNode.removeChild(l); });
    if (state.renderer) {
      state.renderer.dispose();
      var el = state.renderer.domElement;
      el.parentNode && el.parentNode.removeChild(el);
    }
    state.planets = [];
    state.labels = [];
    state.flares = [];
    state.sidebarBtns = [];
    var sb = document.getElementById('planet-sidebar');
    if (sb) sb.parentNode && sb.parentNode.removeChild(sb);
    state.renderer = state.scene = state.camera = null;
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  window.SolarSystem = { init: init, destroy: destroy };

  window.addEventListener('DOMContentLoaded', function() {
    SolarSystem.init();
  });
}());
