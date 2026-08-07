/**
 * logo-cube-tunnel.js — scroll-driven flight along a figure-8 corridor of
 * rotating, logo-textured cubes.
 *
 * The path is a Lissajous 1:2 curve (the classic "8") in XY, with Z marching
 * monotonically from far to near. The camera flies down the centre of that
 * curve; the cubes are pushed off the curve along its own perpendicular frame
 * so the camera never clips through one.
 *
 * Requires window.THREE (r113 vendored build) and window.StockLogos.
 * Exposes: window.LogoCubeTunnel.create(options) -> instance
 */
(function (global) {
  "use strict";

  var TAU = Math.PI * 2;

  var DEFAULTS = {
    container: null,        // required: element the canvas is appended to
    cubeCount: 78,          // cubes distributed along the corridor
    loops: 2,               // how many figure-8 cycles across the whole path
    amplitudeX: 26,
    amplitudeY: 15,
    depth: 460,             // total Z travel, far -> near
    corridorRadius: 4.8,    // cube offset from the flight line (> cube half-diagonal)
    cubeSize: 2.2,
    opacity: 1,
    background: null,       // THREE-compatible colour, or null for transparent
    fogColor: 0x05060d,
    fogDensity: 0.0052,
    spinSpeed: 1,
    maxPixelRatio: 1.5
  };

  function assign(target, source) {
    Object.keys(source || {}).forEach(function (key) {
      if (source[key] !== undefined) target[key] = source[key];
    });
    return target;
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ── Path ────────────────────────────────────────────────────────── */

  /**
   * Point on the serpentine figure-8 at normalised distance t in [0, 1].
   * Writes into `out` to avoid allocating inside the render loop.
   */
  function pathPoint(cfg, t, out) {
    var a = TAU * cfg.loops * t;
    out.x = cfg.amplitudeX * Math.sin(a);
    out.y = cfg.amplitudeY * Math.sin(a * 2);
    out.z = -cfg.depth * (1 - t);
    return out;
  }

  /* ── Instance ────────────────────────────────────────────────────── */

  function create(options) {
    var THREE = global.THREE;
    if (!THREE) {
      console.error("[logo-cube-tunnel] window.THREE is not available — load js/Three.iife.min.js first.");
      return null;
    }

    var cfg = assign(assign({}, DEFAULTS), options);
    var container = cfg.container;
    if (!container) {
      console.error("[logo-cube-tunnel] `container` option is required.");
      return null;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: cfg.background === null });
    } catch (err) {
      console.error("[logo-cube-tunnel] WebGL is unavailable:", err);
      container.setAttribute("data-webgl-failed", "true");
      return null;
    }

    renderer.setPixelRatio(Math.min(cfg.maxPixelRatio, global.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth || global.innerWidth, container.clientHeight || global.innerHeight);
    renderer.domElement.style.display = "block";
    if (cfg.opacity !== 1) renderer.domElement.style.opacity = String(cfg.opacity);
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    if (cfg.background !== null) scene.background = new THREE.Color(cfg.background);
    scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

    var camera = new THREE.PerspectiveCamera(62, 1, 0.1, 900);

    /* Lights — the cubes use MeshStandardMaterial so they catch the rim tone. */
    scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x120a2a, 1.15));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(6, 10, 8);
    scene.add(key);
    var rimA = new THREE.PointLight(0x7000ff, 1.5, 140);
    var rimB = new THREE.PointLight(0x00e676, 1.2, 140);
    scene.add(rimA, rimB);

    /* Materials — one per cube face, sharing the six brand textures. */
    var textures = global.StockLogos ? global.StockLogos.createTextures() : [];
    if (!textures.length) {
      console.warn("[logo-cube-tunnel] StockLogos produced no textures; falling back to plain faces.");
    }
    var faceMaterials = (textures.length ? textures : [null, null, null, null, null, null]).map(function (tex) {
      return new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : 0x334466,
        emissiveMap: tex || null,
        emissive: tex ? 0xffffff : 0x000000,
        emissiveIntensity: tex ? 0.34 : 0,
        metalness: 0.28,
        roughness: 0.54
      });
    });

    var geometry = new THREE.BoxBufferGeometry(cfg.cubeSize, cfg.cubeSize, cfg.cubeSize);

    /* Cubes: sampled along the path, then spiralled off it by corridorRadius. */
    var cubes = [];
    var tangent = new THREE.Vector3();
    var normal = new THREE.Vector3();
    var binormal = new THREE.Vector3();
    var here = new THREE.Vector3();
    var ahead = new THREE.Vector3();
    var UP = new THREE.Vector3(0, 1, 0);

    for (var i = 0; i < cfg.cubeCount; i++) {
      var t = cfg.cubeCount > 1 ? i / (cfg.cubeCount - 1) : 0;

      pathPoint(cfg, t, here);
      pathPoint(cfg, Math.min(1, t + 0.004), ahead);
      tangent.copy(ahead).sub(here).normalize();

      // Perpendicular frame around the flight line.
      normal.crossVectors(tangent, UP);
      if (normal.lengthSq() < 1e-6) normal.set(1, 0, 0);
      normal.normalize();
      binormal.crossVectors(tangent, normal).normalize();

      // Spiral the cubes around the corridor so consecutive ones never queue up
      // directly in front of the camera.
      var phase = i * 1.05;
      var radius = cfg.corridorRadius * (1 + 0.22 * Math.sin(i * 0.7));

      var mesh = new THREE.Mesh(geometry, faceMaterials);
      mesh.position.copy(here)
        .addScaledVector(normal, Math.cos(phase) * radius)
        .addScaledVector(binormal, Math.sin(phase) * radius);
      mesh.rotation.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);

      cubes.push({
        mesh: mesh,
        spin: {
          x: (0.12 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1),
          y: (0.16 + Math.random() * 0.28) * (Math.random() < 0.5 ? -1 : 1),
          z: (0.06 + Math.random() * 0.14) * (Math.random() < 0.5 ? -1 : 1)
        }
      });
      scene.add(mesh);
    }

    /* Starfield for parallax against the fog. */
    var starGeo = new THREE.BufferGeometry();
    var starCount = 900;
    var starPos = new Float32Array(starCount * 3);
    for (var s = 0; s < starCount; s++) {
      starPos[s * 3] = (Math.random() - 0.5) * 320;
      starPos[s * 3 + 1] = (Math.random() - 0.5) * 220;
      starPos[s * 3 + 2] = -Math.random() * cfg.depth;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x9fc0ff, size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.55, fog: false
    }));
    scene.add(stars);

    /* ── Scroll + loop state ───────────────────────────────────────── */

    var reduced = prefersReducedMotion();
    var spinScale = cfg.spinSpeed * (reduced ? 0.25 : 1);
    var state = { target: 0, current: 0, elapsed: 0, running: true, frame: 0 };
    var clock = new THREE.Clock();

    var camPos = new THREE.Vector3();
    var camLook = new THREE.Vector3();

    function readScroll() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight || 0) - global.innerHeight;
      var y = global.scrollY || doc.scrollTop || 0;
      state.target = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    }

    function resize() {
      var w = container.clientWidth || global.innerWidth;
      var h = container.clientHeight || global.innerHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function render() {
      var dt = Math.min(clock.getDelta(), 0.05);
      state.elapsed += dt;

      // Ease toward the scroll target so the flight glides instead of snapping.
      state.current += (state.target - state.current) * Math.min(1, dt * 4.5);

      // Keep a margin at both ends so the camera stays inside the corridor.
      var t = 0.02 + state.current * 0.94;
      pathPoint(cfg, t, camPos);
      pathPoint(cfg, Math.min(1, t + 0.035), camLook);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      // Gentle bank. lookAt() rewrites the whole orientation every frame, so
      // this offset is re-applied rather than accumulated.
      camera.rotation.z += Math.sin(state.elapsed * 0.35) * 0.06;

      rimA.position.set(camPos.x + 14, camPos.y + 8, camPos.z - 18);
      rimB.position.set(camPos.x - 14, camPos.y - 8, camPos.z - 30);

      for (var i = 0; i < cubes.length; i++) {
        var c = cubes[i];
        c.mesh.rotation.x += c.spin.x * spinScale * dt;
        c.mesh.rotation.y += c.spin.y * spinScale * dt;
        c.mesh.rotation.z += c.spin.z * spinScale * dt;
      }

      stars.rotation.z += 0.006 * dt;

      renderer.render(scene, camera);
    }

    function tick() {
      if (!state.running) return;
      state.frame = global.requestAnimationFrame(tick);
      if (document.hidden) return;
      render();
    }

    function onVisibility() {
      // Reset the clock so a backgrounded tab does not resume with a huge delta.
      if (!document.hidden) clock.getDelta();
    }

    global.addEventListener("scroll", readScroll, { passive: true });
    global.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    readScroll();
    state.current = state.target;
    tick();

    return {
      scene: scene,
      camera: camera,
      renderer: renderer,
      config: cfg,
      /** Frees GPU resources and detaches listeners. */
      destroy: function () {
        state.running = false;
        global.cancelAnimationFrame(state.frame);
        global.removeEventListener("scroll", readScroll);
        global.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
        geometry.dispose();
        starGeo.dispose();
        stars.material.dispose();
        faceMaterials.forEach(function (m) {
          if (m.map) m.map.dispose();
          m.dispose();
        });
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  global.LogoCubeTunnel = { create: create, DEFAULTS: DEFAULTS, pathPoint: pathPoint };
})(window);
