/**
 * stock-logos.js — procedural canvas textures for the cube faces.
 *
 * Every mark is drawn with the Canvas 2D API instead of being fetched, so the
 * cubes need no network round-trip and no CORS handling. The marks are
 * simplified, stylised renditions used purely as decorative surfaces.
 *
 * Fonts are restricted to the system stack: a CanvasTexture is rasterised once,
 * so a webfont that finishes loading afterwards would leave the wrong glyphs
 * baked into the GPU texture.
 *
 * Exposes: window.StockLogos.createTextures() -> THREE.CanvasTexture[]
 */
(function (global) {
  "use strict";

  var SIZE = 512;
  var FONT_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  /** Brand definitions, in cube-face order. */
  var BRANDS = [
    { key: "nvidia", label: "NVIDIA", bg: "#0d0d0d", fg: "#76b900", draw: drawNvidiaMark },
    { key: "spacex", label: "SPACEX", bg: "#000000", fg: "#ffffff", draw: drawSpaceXMark },
    { key: "tesla", label: "TESLA", bg: "#0a0a0a", fg: "#e82127", draw: drawTeslaMark },
    { key: "apple", label: "APPLE", bg: "#111111", fg: "#f5f5f7", draw: drawAppleMark },
    { key: "amazon", label: "amazon", bg: "#232f3e", fg: "#ff9900", draw: drawAmazonMark },
    { key: "micron", label: "MICRON", bg: "#041e42", fg: "#0072ce", draw: drawMicronMark }
  ];

  /* ── Drawing helpers ─────────────────────────────────────────────── */

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Fits text to a maximum width by shrinking the font size, never the canvas. */
  function fittedText(ctx, text, cx, cy, maxWidth, startPx, weight, letterSpacing) {
    var px = startPx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    do {
      ctx.font = weight + " " + px + "px " + FONT_STACK;
      px -= 2;
    } while (px > 8 && ctx.measureText(text).width > maxWidth);

    if (!letterSpacing) {
      ctx.fillText(text, cx, cy);
      return;
    }

    // Manual letter spacing — ctx.letterSpacing is not available everywhere.
    var chars = text.split("");
    var total = 0;
    var i;
    for (i = 0; i < chars.length; i++) {
      total += ctx.measureText(chars[i]).width + letterSpacing;
    }
    total -= letterSpacing;

    var x = cx - total / 2;
    ctx.textAlign = "left";
    for (i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, cy);
      x += ctx.measureText(chars[i]).width + letterSpacing;
    }
    ctx.textAlign = "center";
  }

  /* ── Brand marks ─────────────────────────────────────────────────── */

  /** NVIDIA: the spiralling "eye" reduced to two nested crescents. */
  function drawNvidiaMark(ctx, cx, cy, r, fg) {
    ctx.strokeStyle = fg;
    ctx.lineCap = "round";

    ctx.lineWidth = r * 0.30;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, Math.PI * 0.62, Math.PI * 1.92);
    ctx.stroke();

    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.40, Math.PI * 0.45, Math.PI * 1.80);
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(cx + r * 0.06, cy - r * 0.04, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  /** SpaceX: the trailing orbital swoosh crossing an X. */
  function drawSpaceXMark(ctx, cx, cy, r, fg) {
    ctx.strokeStyle = fg;
    ctx.lineCap = "round";

    ctx.lineWidth = r * 0.10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.95, r * 0.34, -Math.PI * 0.13, Math.PI * 0.05, Math.PI * 1.35);
    ctx.stroke();

    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.52, cy - r * 0.52);
    ctx.lineTo(cx + r * 0.52, cy + r * 0.52);
    ctx.moveTo(cx + r * 0.52, cy - r * 0.52);
    ctx.lineTo(cx - r * 0.52, cy + r * 0.52);
    ctx.stroke();
  }

  /** Tesla: the "T" shield — stem, shoulder bar and two side hooks. */
  function drawTeslaMark(ctx, cx, cy, r, fg) {
    ctx.fillStyle = fg;

    // Shoulder bar.
    roundedRect(ctx, cx - r * 0.62, cy - r * 0.86, r * 1.24, r * 0.24, r * 0.10);
    ctx.fill();

    // Stem, tapering toward the base.
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.17, cy - r * 0.52);
    ctx.lineTo(cx + r * 0.17, cy - r * 0.52);
    ctx.lineTo(cx + r * 0.11, cy + r * 0.88);
    ctx.lineTo(cx - r * 0.11, cy + r * 0.88);
    ctx.closePath();
    ctx.fill();

    // Side hooks sweeping down from the bar.
    ctx.strokeStyle = fg;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.88, cy - r * 0.60);
    ctx.quadraticCurveTo(cx - r * 0.74, cy - r * 0.24, cx - r * 0.44, cy - r * 0.20);
    ctx.moveTo(cx + r * 0.88, cy - r * 0.60);
    ctx.quadraticCurveTo(cx + r * 0.74, cy - r * 0.24, cx + r * 0.44, cy - r * 0.20);
    ctx.stroke();
  }

  /** Apple: bitten fruit silhouette assembled from four arcs plus a leaf. */
  function drawAppleMark(ctx, cx, cy, r, fg) {
    ctx.fillStyle = fg;

    var lobe = r * 0.46;
    var top = cy - r * 0.16;

    // Body: two overlapping lobes with a shared, slightly pointed base.
    ctx.beginPath();
    ctx.arc(cx - lobe * 0.62, top, lobe, 0, Math.PI * 2);
    ctx.arc(cx + lobe * 0.62, top, lobe, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - lobe * 1.08, top);
    ctx.bezierCurveTo(cx - lobe * 1.16, top + r * 0.72, cx - lobe * 0.34, top + r * 0.98, cx, top + r * 0.94);
    ctx.bezierCurveTo(cx + lobe * 0.34, top + r * 0.98, cx + lobe * 1.16, top + r * 0.72, cx + lobe * 1.08, top);
    ctx.closePath();
    ctx.fill();

    // Bite taken out of the right flank.
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx + r * 0.78, top + r * 0.04, r * 0.30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Leaf.
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.14, cy - r * 0.72, r * 0.20, r * 0.09, -Math.PI * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Amazon: the smile arrow. The wordmark sits above it. */
  function drawAmazonMark(ctx, cx, cy, r, fg) {
    ctx.strokeStyle = fg;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.34, r * 0.86, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();

    // Arrowhead at the right tip of the smile.
    var ax = cx + r * 0.72;
    var ay = cy + r * 0.30;
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(ax + r * 0.24, ay - r * 0.02);
    ctx.lineTo(ax - r * 0.06, ay - r * 0.24);
    ctx.lineTo(ax + r * 0.02, ay + r * 0.10);
    ctx.closePath();
    ctx.fill();
  }

  /** Micron: concentric die/chip motif. */
  function drawMicronMark(ctx, cx, cy, r, fg) {
    ctx.strokeStyle = fg;
    ctx.lineWidth = r * 0.13;
    ctx.lineJoin = "round";

    roundedRect(ctx, cx - r * 0.80, cy - r * 0.80, r * 1.60, r * 1.60, r * 0.18);
    ctx.stroke();

    roundedRect(ctx, cx - r * 0.40, cy - r * 0.40, r * 0.80, r * 0.80, r * 0.10);
    ctx.stroke();

    // Pin stubs on all four sides.
    ctx.lineWidth = r * 0.10;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (var i = -1; i <= 1; i++) {
      var o = i * r * 0.42;
      ctx.moveTo(cx + o, cy - r * 0.80); ctx.lineTo(cx + o, cy - r * 1.02);
      ctx.moveTo(cx + o, cy + r * 0.80); ctx.lineTo(cx + o, cy + r * 1.02);
      ctx.moveTo(cx - r * 0.80, cy + o); ctx.lineTo(cx - r * 1.02, cy + o);
      ctx.moveTo(cx + r * 0.80, cy + o); ctx.lineTo(cx + r * 1.02, cy + o);
    }
    ctx.stroke();
  }

  /* ── Composition ─────────────────────────────────────────────────── */

  function renderBrand(brand) {
    var canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    var ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    // Backing plate with a subtle vignette so the face reads as a lit surface.
    ctx.fillStyle = brand.bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    var vignette = ctx.createRadialGradient(SIZE / 2, SIZE * 0.42, SIZE * 0.12, SIZE / 2, SIZE / 2, SIZE * 0.78);
    vignette.addColorStop(0, "rgba(255,255,255,0.10)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Inner hairline border.
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 4;
    roundedRect(ctx, 14, 14, SIZE - 28, SIZE - 28, 34);
    ctx.stroke();

    brand.draw(ctx, SIZE / 2, SIZE * 0.42, SIZE * 0.20, brand.fg);

    ctx.fillStyle = brand.fg;
    fittedText(ctx, brand.label, SIZE / 2, SIZE * 0.80, SIZE * 0.78, 74, "700", 3);

    return canvas;
  }

  /**
   * Builds one CanvasTexture per brand, in cube-face order
   * (+X, -X, +Y, -Y, +Z, -Z as consumed by BoxBufferGeometry material groups).
   */
  function createTextures() {
    var THREE = global.THREE;
    if (!THREE) {
      console.error("[stock-logos] THREE is not available on window.");
      return [];
    }

    return BRANDS.map(function (brand) {
      var texture = new THREE.CanvasTexture(renderBrand(brand));
      texture.anisotropy = 4;
      texture.needsUpdate = true;
      return texture;
    });
  }

  global.StockLogos = {
    BRANDS: BRANDS,
    createTextures: createTextures,
    renderBrand: renderBrand
  };
})(window);
