/**
 * logo-cube-hero.js — a single large logo-textured cube that spins on its own
 * and can be dragged, mirroring the rotating-cube motif of the CodePen home page.
 *
 * Kept separate from the tunnel: the hero cube lives at the origin of its own
 * scene, so it can never intersect the corridor geometry.
 *
 * Requires window.THREE and window.StockLogos.
 * Exposes: window.LogoCubeHero.create(options) -> instance
 */
(function (global) {
  "use strict";

  var DEFAULTS = {
    container: null,
    size: 2.1,
    distance: 5.4,
    autoSpin: true,
    wireframe: true,       // draws crisp edges over the textured faces
    maxPixelRatio: 2
  };

  function create(options) {
    var THREE = global.THREE;
    if (!THREE) {
      console.error("[logo-cube-hero] window.THREE is not available.");
      return null;
    }

    var cfg = Object.assign({}, DEFAULTS, options || {});
    var container = cfg.container;
    if (!container) {
      console.error("[logo-cube-hero] `container` option is required.");
      return null;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error("[logo-cube-hero] WebGL is unavailable:", err);
      return null;
    }
    renderer.setPixelRatio(Math.min(cfg.maxPixelRatio, global.devicePixelRatio || 1));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, cfg.distance);

    scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x181038, 1.25));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(4, 6, 7);
    scene.add(key);
    var fill = new THREE.PointLight(0x7000ff, 1.4, 40);
    fill.position.set(-5, -3, 4);
    scene.add(fill);

    var textures = global.StockLogos ? global.StockLogos.createTextures() : [];
    var materials = (textures.length ? textures : [null, null, null, null, null, null]).map(function (tex) {
      return new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : 0x2b3a5c,
        emissiveMap: tex || null,
        emissive: tex ? 0xffffff : 0x000000,
        emissiveIntensity: tex ? 0.30 : 0,
        metalness: 0.30,
        roughness: 0.48
      });
    });

    var geometry = new THREE.BoxBufferGeometry(cfg.size, cfg.size, cfg.size);
    var cube = new THREE.Mesh(geometry, materials);
    cube.rotation.set(-0.35, 0.6, 0.12);
    scene.add(cube);

    var edges = null;
    if (cfg.wireframe) {
      edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.55 })
      );
      cube.add(edges);
    }

    /* ── Drag to rotate ────────────────────────────────────────────── */

    var drag = { active: false, x: 0, y: 0 };
    var velocity = { x: 0, y: 0 };

    function pointerXY(ev) {
      return ev.touches && ev.touches.length
        ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY }
        : { x: ev.clientX, y: ev.clientY };
    }

    function onDown(ev) {
      var p = pointerXY(ev);
      drag.active = true;
      drag.x = p.x;
      drag.y = p.y;
      renderer.domElement.style.cursor = "grabbing";
    }

    function onMove(ev) {
      if (!drag.active) return;
      var p = pointerXY(ev);
      velocity.y = (p.x - drag.x) * 0.006;
      velocity.x = (p.y - drag.y) * 0.006;
      cube.rotation.y += velocity.y;
      cube.rotation.x += velocity.x;
      drag.x = p.x;
      drag.y = p.y;
      if (ev.cancelable) ev.preventDefault();
    }

    function onUp() {
      drag.active = false;
      renderer.domElement.style.cursor = "grab";
    }

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    global.addEventListener("mousemove", onMove, { passive: false });
    global.addEventListener("touchmove", onMove, { passive: false });
    global.addEventListener("mouseup", onUp);
    global.addEventListener("touchend", onUp);

    /* ── Loop ──────────────────────────────────────────────────────── */

    var reduced = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var spin = cfg.autoSpin && !reduced ? 1 : 0;
    var clock = new THREE.Clock();
    var state = { running: true, frame: 0 };

    function resize() {
      var w = container.clientWidth || 320;
      var h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function tick() {
      if (!state.running) return;
      state.frame = global.requestAnimationFrame(tick);
      if (document.hidden) return;

      var dt = Math.min(clock.getDelta(), 0.05);

      if (!drag.active) {
        // Carry the flick momentum, then settle back into the idle spin.
        velocity.x *= 0.94;
        velocity.y *= 0.94;
        cube.rotation.x += velocity.x + 0.16 * spin * dt;
        cube.rotation.y += velocity.y + 0.34 * spin * dt;
      }

      renderer.render(scene, camera);
    }

    global.addEventListener("resize", resize);
    resize();
    tick();

    return {
      scene: scene,
      cube: cube,
      renderer: renderer,
      destroy: function () {
        state.running = false;
        global.cancelAnimationFrame(state.frame);
        global.removeEventListener("resize", resize);
        global.removeEventListener("mousemove", onMove);
        global.removeEventListener("touchmove", onMove);
        global.removeEventListener("mouseup", onUp);
        global.removeEventListener("touchend", onUp);
        geometry.dispose();
        if (edges) { edges.geometry.dispose(); edges.material.dispose(); }
        materials.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  global.LogoCubeHero = { create: create, DEFAULTS: DEFAULTS };
})(window);
