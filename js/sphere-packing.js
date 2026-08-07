/**
 * sphere-packing.js — a tank of soft-body spheres that fall, collide and pack.
 *
 * Reimplementation of the "Sphere Packing" idea (CodePen soju22/qBezBeo, which
 * pulls a prebuilt CC BY-NC-SA module from a CDN). This version is written from
 * scratch against the vendored Three.js r113 build: no remote modules, no ESM,
 * and no dependency on that library's licence terms.
 *
 * Physics is deliberately plain: semi-implicit Euler, O(n^2) pair resolution and
 * a box container. At a few hundred spheres that is well inside frame budget,
 * and it keeps the whole simulation readable.
 *
 * Colour is applied per group rather than per instance: r113 predates
 * InstancedMesh.instanceColor (r117), so spheres are bucketed into a few
 * InstancedMeshes whose material colours can be swapped wholesale.
 *
 * Requires window.THREE.
 * Exposes: window.SpherePacking.create(options) -> instance
 */
(function (global) {
  "use strict";

  var DEFAULTS = {
    container: null,
    count: 300,
    // Radii and tank size are tuned together: the pack only reads as "packed"
    // when the spheres occupy roughly half the tank volume. Random close
    // packing tops out near 64%, so these land just under it.
    minRadius: 0.75,
    maxRadius: 1.75,
    gravity: 1,             // 0 disables downward pull and lets them drift
    restitution: 0.18,      // low, so the bed settles instead of bouncing
    damping: 0.985,
    tankDepth: 6,
    pointerRadius: 6.5,     // world-space reach of the cursor push
    pointerForce: 62,
    palette: [0xff5a7a, 0x4dd0e1, 0xffd166],
    background: 0xf2f4f8,
    maxPixelRatio: 1.75
  };

  var CAMERA_DISTANCE = 26;
  var FOV = 45;

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function create(options) {
    var THREE = global.THREE;
    if (!THREE) {
      console.error("[sphere-packing] window.THREE is not available.");
      return null;
    }

    var cfg = Object.assign({}, DEFAULTS, options || {});
    var container = cfg.container;
    if (!container) {
      console.error("[sphere-packing] `container` option is required.");
      return null;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: cfg.background === null });
    } catch (err) {
      console.error("[sphere-packing] WebGL is unavailable:", err);
      container.setAttribute("data-webgl-failed", "true");
      return null;
    }
    renderer.setPixelRatio(Math.min(cfg.maxPixelRatio, global.devicePixelRatio || 1));
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    if (cfg.background !== null) scene.background = new THREE.Color(cfg.background);

    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    camera.position.set(0, 0, CAMERA_DISTANCE);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa6bb, 1.05));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(6, 12, 10);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.4);
    fill.position.set(-8, -4, 6);
    scene.add(fill);

    /* ── Bodies ────────────────────────────────────────────────────── */

    var bodies = [];
    for (var i = 0; i < cfg.count; i++) {
      bodies.push({
        radius: randRange(cfg.minRadius, cfg.maxRadius),
        px: randRange(-16, 16),
        py: randRange(-9, 16),
        pz: randRange(-cfg.tankDepth / 2, cfg.tankDepth / 2),
        vx: randRange(-2, 2),
        vy: randRange(-2, 2),
        vz: randRange(-1, 1),
        group: i % cfg.palette.length,
        slot: 0
      });
    }

    // Mass scales with volume so big spheres shoulder small ones aside.
    bodies.forEach(function (b) {
      b.invMass = 1 / (b.radius * b.radius * b.radius);
    });

    /* ── Instanced rendering, one mesh per palette colour ──────────── */

    var sphereGeo = new THREE.SphereBufferGeometry(1, 18, 14);
    var geometries = [];
    var groups = cfg.palette.map(function (color, index) {
      var members = bodies.filter(function (b) { return b.group === index; });
      members.forEach(function (b, slot) { b.slot = slot; });

      var material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.34,
        metalness: 0.06
      });

      // Each group needs its OWN geometry. r113 caches vertex-attribute
      // bindings per (geometry.id, program.id); sharing one geometry across
      // several InstancedMeshes makes them collapse into a single binding, so
      // every group ends up drawing the last uploaded instanceMatrix.
      var geo = sphereGeo.clone();
      geometries.push(geo);

      var mesh = new THREE.InstancedMesh(geo, material, Math.max(members.length, 1));
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { mesh: mesh, material: material, members: members };
    });

    var dummy = new THREE.Object3D();

    /* ── Tank bounds, derived from the visible frustum ─────────────── */

    var bounds = { x: 10, y: 6, z: cfg.tankDepth / 2 };

    function recomputeBounds() {
      var vFov = (FOV * Math.PI) / 180;
      var h = 2 * Math.tan(vFov / 2) * CAMERA_DISTANCE;
      bounds.y = h / 2;
      bounds.x = (h * camera.aspect) / 2;
      bounds.z = cfg.tankDepth / 2;
    }

    /* ── Pointer ───────────────────────────────────────────────────── */

    var pointer = { x: 0, y: 0, active: false };
    var ndc = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();
    var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    var hit = new THREE.Vector3();

    function updatePointer(clientX, clientY) {
      var rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(planeZ, hit)) {
        pointer.x = hit.x;
        pointer.y = hit.y;
        pointer.active = true;
      }
    }

    function onPointerMove(ev) {
      var p = ev.touches && ev.touches.length ? ev.touches[0] : ev;
      updatePointer(p.clientX, p.clientY);
    }

    function onPointerLeave() { pointer.active = false; }

    /* ── Simulation ────────────────────────────────────────────────── */

    var state = { gravity: cfg.gravity, running: true, frame: 0 };

    /**
     * Motion applied to each sphere while gravity is switched OFF.
     *
     * DESIGN CHOICE — there is no single correct answer here, and the option
     * picked defines what the "Toggle gravity" button actually means:
     *
     *   swirl   (current) — torque about the origin plus drag, so the pack
     *                       rotates as a loose disc. Reads as "weightless".
     *   float             — near-zero damping and no force: spheres drift in
     *                       straight lines and collide like billiards.
     *   implode           — pull toward the origin, so the pack re-packs into
     *                       a sphere instead of a bed. Best "packing" reveal.
     *
     * Mutates `body.vx/vy/vz` in place; the integrator applies them afterwards.
     */
    function applyZeroGravityDrift(body, dt) {
      var SWIRL = 0.06;
      var DRAG = 0.4;
      body.vx += (-body.py * SWIRL - body.vx * DRAG) * dt;
      body.vy += (body.px * SWIRL - body.vy * DRAG) * dt;
    }

    function integrate(dt) {
      var i, b;
      var g = state.gravity * 26;

      for (i = 0; i < bodies.length; i++) {
        b = bodies[i];

        b.vy -= g * dt;

        if (state.gravity === 0) applyZeroGravityDrift(b, dt);

        if (pointer.active) {
          var dx = b.px - pointer.x;
          var dy = b.py - pointer.y;
          var d2 = dx * dx + dy * dy;
          var r = cfg.pointerRadius;
          if (d2 < r * r && d2 > 1e-4) {
            var d = Math.sqrt(d2);
            var push = (1 - d / r) * cfg.pointerForce * dt;
            b.vx += (dx / d) * push;
            b.vy += (dy / d) * push;
          }
        }

        b.vx *= cfg.damping;
        b.vy *= cfg.damping;
        b.vz *= cfg.damping;

        b.px += b.vx * dt;
        b.py += b.vy * dt;
        b.pz += b.vz * dt;
      }
    }

    function resolveCollisions() {
      var i, j, a, b;
      for (i = 0; i < bodies.length; i++) {
        a = bodies[i];
        for (j = i + 1; j < bodies.length; j++) {
          b = bodies[j];

          var dx = b.px - a.px;
          var dy = b.py - a.py;
          var dz = b.pz - a.pz;
          var minDist = a.radius + b.radius;
          var d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= minDist * minDist || d2 < 1e-8) continue;

          var d = Math.sqrt(d2);
          var nx = dx / d;
          var ny = dy / d;
          var nz = dz / d;
          var overlap = minDist - d;

          // Positional correction, split by inverse mass.
          var invSum = a.invMass + b.invMass;
          var aShare = (a.invMass / invSum) * overlap;
          var bShare = (b.invMass / invSum) * overlap;
          a.px -= nx * aShare; a.py -= ny * aShare; a.pz -= nz * aShare;
          b.px += nx * bShare; b.py += ny * bShare; b.pz += nz * bShare;

          // Exchange the normal component of the relative velocity.
          var rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz;
          if (rvn > 0) continue;
          var impulse = (-(1 + cfg.restitution) * rvn) / invSum;
          a.vx -= nx * impulse * a.invMass;
          a.vy -= ny * impulse * a.invMass;
          a.vz -= nz * impulse * a.invMass;
          b.vx += nx * impulse * b.invMass;
          b.vy += ny * impulse * b.invMass;
          b.vz += nz * impulse * b.invMass;
        }
      }
    }

    function constrain() {
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        var lx = bounds.x - b.radius;
        var ly = bounds.y - b.radius;
        var lz = bounds.z - b.radius;

        if (b.px < -lx) { b.px = -lx; b.vx = Math.abs(b.vx) * cfg.restitution; }
        else if (b.px > lx) { b.px = lx; b.vx = -Math.abs(b.vx) * cfg.restitution; }

        if (b.py < -ly) { b.py = -ly; b.vy = Math.abs(b.vy) * cfg.restitution; }
        else if (b.py > ly) { b.py = ly; b.vy = -Math.abs(b.vy) * cfg.restitution; }

        if (b.pz < -lz) { b.pz = -lz; b.vz = Math.abs(b.vz) * cfg.restitution; }
        else if (b.pz > lz) { b.pz = lz; b.vz = -Math.abs(b.vz) * cfg.restitution; }
      }
    }

    function syncInstances() {
      groups.forEach(function (group) {
        for (var i = 0; i < group.members.length; i++) {
          var b = group.members[i];
          dummy.position.set(b.px, b.py, b.pz);
          dummy.scale.setScalar(b.radius);
          dummy.updateMatrix();
          group.mesh.setMatrixAt(b.slot, dummy.matrix);
        }
        group.mesh.instanceMatrix.needsUpdate = true;
      });
    }

    /* ── Loop ──────────────────────────────────────────────────────── */

    var clock = new THREE.Clock();

    function resize() {
      var w = container.clientWidth || global.innerWidth;
      var h = container.clientHeight || global.innerHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      recomputeBounds();
    }

    function tick() {
      if (!state.running) return;
      state.frame = global.requestAnimationFrame(tick);
      if (document.hidden) return;

      // Fixed sub-steps keep the solver stable regardless of frame rate.
      var dt = Math.min(clock.getDelta(), 0.05);
      var steps = 2;
      for (var s = 0; s < steps; s++) {
        integrate(dt / steps);
        resolveCollisions();
        constrain();
      }

      syncInstances();
      renderer.render(scene, camera);
    }

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("touchmove", onPointerMove, { passive: true });
    renderer.domElement.addEventListener("mouseleave", onPointerLeave);
    renderer.domElement.addEventListener("touchend", onPointerLeave);
    global.addEventListener("resize", resize);

    resize();
    tick();

    return {
      scene: scene,
      renderer: renderer,
      /** Flips between downward gravity and a drifting zero-g swirl. */
      toggleGravity: function () {
        state.gravity = state.gravity === 0 ? cfg.gravity : 0;
        return state.gravity;
      },
      /** Replaces the palette. Accepts an array of colours, one per group. */
      setColors: function (colors) {
        if (!Array.isArray(colors) || !colors.length) return;
        groups.forEach(function (group, index) {
          group.material.color.set(colors[index % colors.length]);
        });
      },
      randomizeColors: function () {
        this.setColors(groups.map(function () {
          return new THREE.Color().setHSL(Math.random(), 0.62, 0.58).getHex();
        }));
      },
      destroy: function () {
        state.running = false;
        global.cancelAnimationFrame(state.frame);
        global.removeEventListener("resize", resize);
        renderer.domElement.removeEventListener("mousemove", onPointerMove);
        renderer.domElement.removeEventListener("touchmove", onPointerMove);
        renderer.domElement.removeEventListener("mouseleave", onPointerLeave);
        renderer.domElement.removeEventListener("touchend", onPointerLeave);
        sphereGeo.dispose();
        geometries.forEach(function (g) { g.dispose(); });
        groups.forEach(function (g) { g.material.dispose(); });
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  global.SpherePacking = { create: create, DEFAULTS: DEFAULTS };
})(window);
