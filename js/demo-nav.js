/**
 * demo-nav.js — the shared launcher that links the CV pages to the four WebGL
 * demos, and gets you back again from any of them.
 *
 * Rendered as one collapsible group instead of four more fixed buttons: the CV
 * pages already stack six or seven of those down the left edge.
 *
 * On a demo page the back link prefers the CV page you actually arrived from
 * (via document.referrer), so "click back" returns you where you were.
 *
 * Requires css/demo-nav.css.
 * Exposes: window.DemoNav.mount(options) -> element
 */
(function (global) {
  "use strict";

  /** Single source of truth for the demo set. */
  var DEMOS = [
    { id: "cubes", href: "demo-cube-tunnel.html", icon: "🧊", label: "Cube Tunnel" },
    { id: "spheres", href: "demo-sphere-packing.html", icon: "🔮", label: "Sphere Packing" },
    { id: "shatter", href: "demo-image-shatter.html", icon: "🌊", label: "Image Shatter" },
    { id: "storm", href: "thunderstorm.html", icon: "⛈", label: "Thunderstorm" }
  ];

  /** CV pages a demo is allowed to send you back to. */
  var CV_PAGES = [
    { href: "cv.html", label: "Cyber CV" },
    { href: "cv2.html", label: "Comics CV" }
  ];

  var STORAGE_KEY = "demo-nav:open";

  /**
   * Resolves the back target for a demo page.
   * Falls back to cv.html when the referrer is absent, cross-origin, or is
   * itself a demo page.
   */
  function resolveBackTarget() {
    var fallback = CV_PAGES[0];

    var referrer = document.referrer;
    if (!referrer) return fallback;

    var url;
    try {
      url = new URL(referrer, global.location.href);
    } catch (err) {
      return fallback;
    }
    if (url.origin !== global.location.origin) return fallback;

    var file = url.pathname.split("/").pop() || "";
    for (var i = 0; i < CV_PAGES.length; i++) {
      if (CV_PAGES[i].href === file) return CV_PAGES[i];
    }
    return fallback;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function readStoredOpen(defaultOpen) {
    try {
      var raw = global.sessionStorage.getItem(STORAGE_KEY);
      return raw === null ? defaultOpen : raw === "true";
    } catch (err) {
      // Private-mode browsers can throw on sessionStorage access.
      return defaultOpen;
    }
  }

  function writeStoredOpen(open) {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, String(open));
    } catch (err) {
      /* Persisting the panel state is a nicety, not a requirement. */
    }
  }

  /**
   * @param {Object} options
   * @param {string} [options.theme="cyber"]  cyber | comic | dark
   * @param {number} [options.top=350]        distance from the top, in px
   * @param {string} [options.layout="panel"] "stack" renders the four demos as
   *   four always-visible peer buttons (used on the CV pages, which ask for
   *   four buttons under the existing stack); "panel" collapses them behind a
   *   single toggle (used on the demo pages, where a back link leads).
   * @param {boolean} [options.showBack=false] render a "back to CV" link
   * @param {string} [options.active]         demo id to mark as current
   * @param {boolean} [options.defaultOpen]   initial panel state
   */
  function mount(options) {
    var opts = options || {};
    var theme = opts.theme || "cyber";
    var layout = opts.layout === "stack" ? "stack" : "panel";
    var showBack = !!opts.showBack;
    var defaultOpen = opts.defaultOpen !== undefined ? opts.defaultOpen : showBack;

    var existing = document.querySelector(".demo-nav");
    if (existing) existing.parentNode.removeChild(existing);

    var root = el("nav", "demo-nav");
    root.setAttribute("data-demo-theme", theme);
    root.setAttribute("data-layout", layout);
    root.setAttribute("aria-label", "WebGL demos");
    root.style.top = (opts.top === undefined ? 350 : opts.top) + "px";

    if (showBack) {
      var target = resolveBackTarget();
      var back = el("a", "demo-nav__back");
      back.href = target.href;
      back.appendChild(el("span", null, "←"));
      back.appendChild(el("span", null, "Back to " + target.label));
      root.appendChild(back);
    }

    function buildItem(demo) {
      var item = el("a", "demo-nav__item");
      item.href = demo.href;
      item.setAttribute("data-demo-id", demo.id);
      item.appendChild(el("span", null, demo.icon));
      item.appendChild(el("span", null, demo.label));
      if (opts.active && opts.active === demo.id) {
        item.setAttribute("aria-current", "page");
      }
      return item;
    }

    // Stack layout: four peer buttons, no toggle and no persisted state, so
    // collapsing the panel elsewhere can never hide them.
    if (layout === "stack") {
      DEMOS.forEach(function (demo) { root.appendChild(buildItem(demo)); });
      document.body.appendChild(root);
      return root;
    }

    var toggle = el("button", "demo-nav__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.appendChild(el("span", null, "🧪"));
    toggle.appendChild(el("span", null, "Demos"));
    toggle.appendChild(el("span", "demo-nav__caret", "▶"));
    root.appendChild(toggle);

    var panel = el("div", "demo-nav__panel");
    DEMOS.forEach(function (demo) { panel.appendChild(buildItem(demo)); });
    root.appendChild(panel);

    function setOpen(open) {
      root.setAttribute("data-open", String(open));
      toggle.setAttribute("aria-expanded", String(open));
      writeStoredOpen(open);
    }

    toggle.addEventListener("click", function () {
      setOpen(root.getAttribute("data-open") !== "true");
    });

    setOpen(readStoredOpen(defaultOpen));
    document.body.appendChild(root);
    return root;
  }

  global.DemoNav = { mount: mount, DEMOS: DEMOS, resolveBackTarget: resolveBackTarget };
})(window);
