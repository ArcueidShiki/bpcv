/**
 * image-shatter.js — an image that shatters into thousands of triangles, each
 * flying its own cubic-bezier arc, while a second image assembles behind it.
 *
 * Reimplementation of Szenia Zadvornykh's BAS "Image Transition"
 * (CodePen erujs/QNoWmO). The original targets Three.js r75 and depends on the
 * BAS plugin plus TweenMax; both are rebuilt here against the vendored r113
 * build using a plain BufferGeometry and a hand-written ShaderMaterial.
 *
 * How it works: a plane is subdivided, converted to non-indexed geometry so
 * every triangle owns its three vertices, then each vertex position is rewritten
 * relative to its triangle's centroid. The centroid's flight path lives in
 * per-triangle attributes and is evaluated in the vertex shader, so the whole
 * animation is a single uniform (`uTime`) with zero per-frame CPU work.
 *
 * Requires window.THREE.
 * Exposes: window.ImageShatter.create(options) -> instance
 */
(function (global) {
  "use strict";

  var DEFAULTS = {
    container: null,
    width: 100,
    height: 60,
    segmentsX: 140,
    segmentsY: 84,
    images: [],             // two or more URLs; cycled in order, wrapping around
    onChange: null,         // (fromEntry, toEntry) => void, fired on each advance
    duration: 3.0,          // seconds for one full pass
    holdSeconds: 0.9,       // pause on the assembled image before advancing
    autoplay: true,
    maxPixelRatio: 1.75
  };

  /* Timing spread across the plane, mirroring the original's feel. */
  var MIN_DURATION = 0.8;
  var MAX_DURATION = 1.2;
  var MAX_DELAY_X = 0.9;
  var MAX_DELAY_Y = 0.125;
  var STRETCH = 0.11;
  var TOTAL_DURATION = MAX_DURATION + MAX_DELAY_X + MAX_DELAY_Y + STRETCH;

  function randFloat(min, max) { return min + Math.random() * (max - min); }
  function randSpread(range) { return range * (0.5 - Math.random()); }
  function mapLinear(x, a1, a2, b1, b2) { return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  var VERTEX_SHADER = [
    "uniform float uTime;",
    "attribute vec2 aAnimation;",
    "attribute vec3 aStartPosition;",
    "attribute vec3 aControl0;",
    "attribute vec3 aControl1;",
    "attribute vec3 aEndPosition;",
    "varying vec2 vUv;",
    "varying float vDepth;",

    "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {",
    "  float tn = 1.0 - t;",
    "  return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;",
    "}",

    // Penner ease-in-out-cubic, matching the original's shader chunk.
    "float easeInOutCubic(float t, float d) {",
    "  float n = t / (d * 0.5);",
    "  if (n < 1.0) return 0.5 * n * n * n;",
    "  n -= 2.0;",
    "  return 0.5 * (n * n * n + 2.0);",
    "}",

    "void main() {",
    "  vUv = uv;",
    "  float tDelay = aAnimation.x;",
    "  float tDuration = aAnimation.y;",
    "  float tTime = clamp(uTime - tDelay, 0.0, tDuration);",
    "  float tProgress = easeInOutCubic(tTime, tDuration);",

    // SCALE_EXPR is substituted per phase: the outgoing slide shrinks its
    // triangles to nothing, the incoming slide grows them from nothing.
    "  vec3 transformed = position * SCALE_EXPR;",
    "  transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);",

    "  vDepth = transformed.z;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);",
    "}"
  ].join("\n");

  var FRAGMENT_SHADER = [
    "uniform sampler2D uMap;",
    "uniform vec2 uUvScale;",
    "uniform vec2 uUvOffset;",
    "uniform float uOpacity;",
    "varying vec2 vUv;",
    "varying float vDepth;",

    "void main() {",
    "  vec4 texel = texture2D(uMap, vUv * uUvScale + uUvOffset);",
    // Triangles that fly toward the camera brighten, those pushed back darken —
    // cheap depth cueing in place of real lighting.
    "  float shade = clamp(1.0 + vDepth * 0.014, 0.55, 1.45);",
    "  gl_FragColor = vec4(texel.rgb * shade, texel.a * uOpacity);",
    "}"
  ].join("\n");

  /**
   * Builds one shatter plane.
   * @param {"in"|"out"} phase
   */
  function buildSlide(THREE, cfg, phase) {
    var base = new THREE.PlaneBufferGeometry(cfg.width, cfg.height, cfg.segmentsX, cfg.segmentsY);
    var geometry = base.toNonIndexed();
    base.dispose();

    var positions = geometry.attributes.position.array;
    var vertexCount = geometry.attributes.position.count;
    var triangleCount = vertexCount / 3;

    var aAnimation = new Float32Array(vertexCount * 2);
    var aStartPosition = new Float32Array(vertexCount * 3);
    var aControl0 = new Float32Array(vertexCount * 3);
    var aControl1 = new Float32Array(vertexCount * 3);
    var aEndPosition = new Float32Array(vertexCount * 3);

    var halfW = cfg.width * 0.5;
    var halfH = cfg.height * 0.5;

    for (var t = 0; t < triangleCount; t++) {
      var v0 = t * 9;

      // Centroid of this triangle.
      var cx = (positions[v0] + positions[v0 + 3] + positions[v0 + 6]) / 3;
      var cy = (positions[v0 + 1] + positions[v0 + 4] + positions[v0 + 7]) / 3;
      var cz = (positions[v0 + 2] + positions[v0 + 5] + positions[v0 + 8]) / 3;

      // Re-origin the triangle so it can be scaled about its own centre.
      for (var k = 0; k < 3; k++) {
        positions[v0 + k * 3] -= cx;
        positions[v0 + k * 3 + 1] -= cy;
        positions[v0 + k * 3 + 2] -= cz;
      }

      // Stagger: mostly left-to-right, with a slight vertical bias.
      var duration = randFloat(MIN_DURATION, MAX_DURATION);
      var delayX = mapLinear(cx, -halfW, halfW, 0, MAX_DELAY_X);
      var delayY = phase === "in"
        ? mapLinear(Math.abs(cy), 0, halfH, 0, MAX_DELAY_Y)
        : mapLinear(Math.abs(cy), 0, halfH, MAX_DELAY_Y, 0);
      var delay = delayX + delayY + Math.random() * STRETCH * duration;

      // Two control points swing the triangle out and back across the plane.
      var signY = cy < 0 ? -1 : 1;
      var dir = phase === "in" ? -1 : 1;

      var c0x = cx + dir * randFloat(0.1, 0.3) * 50;
      var c0y = cy + dir * signY * randFloat(0.1, 0.3) * 70;
      var c0z = cz + dir * randSpread(20);

      var c1x = cx + dir * randFloat(0.3, 0.6) * 50;
      var c1y = cy - dir * signY * randFloat(0.3, 0.6) * 70;
      var c1z = cz + dir * randSpread(20);

      for (var v = 0; v < 3; v++) {
        var i2 = (t * 3 + v) * 2;
        var i3 = (t * 3 + v) * 3;

        aAnimation[i2] = delay;
        aAnimation[i2 + 1] = duration;

        aStartPosition[i3] = cx; aStartPosition[i3 + 1] = cy; aStartPosition[i3 + 2] = cz;
        aEndPosition[i3] = cx; aEndPosition[i3 + 1] = cy; aEndPosition[i3 + 2] = cz;
        aControl0[i3] = c0x; aControl0[i3 + 1] = c0y; aControl0[i3 + 2] = c0z;
        aControl1[i3] = c1x; aControl1[i3 + 1] = c1y; aControl1[i3 + 2] = c1z;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.setAttribute("aAnimation", new THREE.BufferAttribute(aAnimation, 2));
    geometry.setAttribute("aStartPosition", new THREE.BufferAttribute(aStartPosition, 3));
    geometry.setAttribute("aControl0", new THREE.BufferAttribute(aControl0, 3));
    geometry.setAttribute("aControl1", new THREE.BufferAttribute(aControl1, 3));
    geometry.setAttribute("aEndPosition", new THREE.BufferAttribute(aEndPosition, 3));

    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: null },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uUvOffset: { value: new THREE.Vector2(0, 0) },
        // Held at 0 until the texture arrives, so an unbound sampler is never
        // drawn as a black plane on first paint.
        uOpacity: { value: 0 }
      },
      vertexShader: VERTEX_SHADER.replace(
        "SCALE_EXPR",
        phase === "in" ? "tProgress" : "(1.0 - tProgress)"
      ),
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: true
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  }

  function create(options) {
    var THREE = global.THREE;
    if (!THREE) {
      console.error("[image-shatter] window.THREE is not available.");
      return null;
    }

    var cfg = Object.assign({}, DEFAULTS, options || {});
    var container = cfg.container;
    if (!container) {
      console.error("[image-shatter] `container` option is required.");
      return null;
    }
    if (!Array.isArray(cfg.images) || cfg.images.length < 2) {
      console.error("[image-shatter] `images` must contain two URLs.");
      return null;
    }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error("[image-shatter] WebGL is unavailable:", err);
      container.setAttribute("data-webgl-failed", "true");
      return null;
    }
    renderer.setPixelRatio(Math.min(cfg.maxPixelRatio, global.devicePixelRatio || 1));
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(80, 1, 10, 2000);
    camera.position.set(0, 0, 60);

    var slideOut = buildSlide(THREE, cfg, "out");
    var slideIn = buildSlide(THREE, cfg, "in");
    scene.add(slideOut, slideIn);

    /* ── Textures, cover-fitted to the plane ───────────────────────── */

    /* Declared before loading starts: the load callbacks reach into `state`,
       and a cached texture could resolve before this point otherwise. */
    var state = {
      progress: 0,          // 0..1 across the current pair
      index: 0,             // which entry is currently shattering away
      hold: 0,
      pendingAdvance: false,
      scrubbing: false,
      timeScale: 1,
      running: true,
      frame: 0
    };

    var loader = new THREE.TextureLoader();

    /** Every image is preloaded up front — a texture must never be fetched
        mid-transition, or the pair would swap to an empty sampler. */
    var entries = [];
    var settled = 0;

    /** "icons/planets/earth.jpg" -> "Earth" */
    function labelFor(url) {
      var file = url.split("/").pop().replace(/\.[^.]+$/, "");
      return file.charAt(0).toUpperCase() + file.slice(1);
    }

    function onAllSettled() {
      if (entries.length < 2) {
        console.error("[image-shatter] fewer than two images loaded; cannot transition.");
        container.setAttribute("data-image-failed", "true");
        return;
      }
      // Preserve the caller's ordering, which load order does not guarantee.
      entries.sort(function (a, b) { return a.order - b.order; });
      applyPair();
      container.setAttribute("data-ready", "true");
    }

    cfg.images.forEach(function (url, order) {
      loader.load(
        url,
        function (texture) {
          texture.minFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;

          // Emulate `background-size: cover` so mismatched source aspect ratios
          // fill the plane without stretching.
          var planeAspect = cfg.width / cfg.height;
          var imageAspect = texture.image.width / texture.image.height;
          var scale = new THREE.Vector2(1, 1);

          if (imageAspect > planeAspect) {
            scale.set(planeAspect / imageAspect, 1);
          } else {
            scale.set(1, imageAspect / planeAspect);
          }

          entries.push({
            order: order,
            url: url,
            label: labelFor(url),
            texture: texture,
            uvScale: scale,
            uvOffset: new THREE.Vector2((1 - scale.x) / 2, (1 - scale.y) / 2)
          });

          if (++settled === cfg.images.length) onAllSettled();
        },
        undefined,
        function () {
          console.error("[image-shatter] failed to load image:", url);
          if (++settled === cfg.images.length) onAllSettled();
        }
      );
    });

    function assign(mesh, entry) {
      var u = mesh.material.uniforms;
      u.uMap.value = entry.texture;
      u.uUvScale.value.copy(entry.uvScale);
      u.uUvOffset.value.copy(entry.uvOffset);
      u.uOpacity.value = 1;
    }

    /** Points the two slides at entry[index] and the one after it. */
    function applyPair() {
      var from = entries[state.index % entries.length];
      var to = entries[(state.index + 1) % entries.length];
      assign(slideOut, from);
      assign(slideIn, to);
      if (typeof cfg.onChange === "function") cfg.onChange(from, to);
    }

    /* ── Timeline ──────────────────────────────────────────────────── */

    function setProgress(p) {
      state.progress = clamp(p, 0, 1);
      var uTime = state.progress * TOTAL_DURATION;
      slideOut.material.uniforms.uTime.value = uTime;
      slideIn.material.uniforms.uTime.value = uTime;
    }

    /* ── Drag scrubbing ────────────────────────────────────────────── */

    var lastX = 0;

    function pointerX(ev) {
      return ev.touches && ev.touches.length ? ev.touches[0].clientX : ev.clientX;
    }

    function onDown(ev) {
      state.scrubbing = true;
      lastX = pointerX(ev);
      document.body.style.cursor = "ew-resize";
    }

    function onMove(ev) {
      if (!state.scrubbing) return;
      var x = pointerX(ev);
      setProgress(state.progress + (x - lastX) * 0.0016);
      lastX = x;
      if (ev.cancelable) ev.preventDefault();
    }

    function onUp() {
      if (!state.scrubbing) return;
      state.scrubbing = false;
      state.hold = 0;
      document.body.style.cursor = "grab";
    }

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    global.addEventListener("mousemove", onMove, { passive: false });
    global.addEventListener("touchmove", onMove, { passive: false });
    global.addEventListener("mouseup", onUp);
    global.addEventListener("touchend", onUp);

    /* ── Loop ──────────────────────────────────────────────────────── */

    var clock = new THREE.Clock();

    function resize() {
      var w = container.clientWidth || global.innerWidth;
      var h = container.clientHeight || global.innerHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function tick() {
      if (!state.running) return;
      state.frame = global.requestAnimationFrame(tick);
      if (document.hidden) return;

      var dt = Math.min(clock.getDelta(), 0.05);

      // Forward-only cycling: each pass shatters the current image away and
      // assembles the next, then the pair advances. Playing in reverse would
      // just run the same shatter backwards, which reads as a rewind.
      if (cfg.autoplay && !state.scrubbing && entries.length >= 2) {
        if (state.hold > 0) {
          state.hold -= dt;
          if (state.hold <= 0 && state.pendingAdvance) {
            state.pendingAdvance = false;
            state.index = (state.index + 1) % entries.length;
            applyPair();
            setProgress(0);
          }
        } else {
          var next = state.progress + (dt * state.timeScale) / cfg.duration;
          if (next >= 1) {
            next = 1;
            state.hold = cfg.holdSeconds;
            state.pendingAdvance = true;
          }
          setProgress(next);
        }
      }

      renderer.render(scene, camera);
    }

    global.addEventListener("resize", resize);
    resize();
    setProgress(0);
    tick();

    return {
      scene: scene,
      renderer: renderer,
      totalDuration: TOTAL_DURATION,
      getProgress: function () { return state.progress; },
      setProgress: setProgress,
      togglePlay: function () {
        cfg.autoplay = !cfg.autoplay;
        return cfg.autoplay;
      },
      /** Skips to the next pair immediately, without waiting for the hold. */
      next: function () {
        if (entries.length < 2) return;
        state.pendingAdvance = false;
        state.hold = 0;
        state.index = (state.index + 1) % entries.length;
        applyPair();
        setProgress(0);
      },
      destroy: function () {
        state.running = false;
        global.cancelAnimationFrame(state.frame);
        global.removeEventListener("resize", resize);
        global.removeEventListener("mousemove", onMove);
        global.removeEventListener("touchmove", onMove);
        global.removeEventListener("mouseup", onUp);
        global.removeEventListener("touchend", onUp);
        [slideOut, slideIn].forEach(function (mesh) {
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
        // Textures are shared across pairs, so they are owned by the playlist
        // rather than by either slide.
        entries.forEach(function (entry) { entry.texture.dispose(); });
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  global.ImageShatter = { create: create, DEFAULTS: DEFAULTS, TOTAL_DURATION: TOTAL_DURATION };
})(window);
