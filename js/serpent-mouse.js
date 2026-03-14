window.addEventListener('DOMContentLoaded', function () {

  // --- 1. THREE.JS: THE CYBER SERPENT ---
  const container = document.getElementById("canvas-container");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 40;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Create the Serpent Body (Array of Meshes)
  const segmentCount = 25;
  const segments = [];

  // Head Geometry
  const headGeo = new THREE.ConeGeometry(1.5, 4, 8); // Pointy head
  headGeo.rotateX(Math.PI / 2); // Point forward
  const headMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  scene.add(head);
  segments.push(head);

  // Body Segments
  const bodyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const edges = new THREE.EdgesGeometry(bodyGeo);

  for (let i = 0; i < segmentCount; i++) {
    // Gradient color from Cyan to Purple
    const color = new THREE.Color().setHSL(
      0.5 + (i / segmentCount) * 0.2,
      1,
      0.5,
    );
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6 - (i / segmentCount) * 0.4,
    });
    const segment = new THREE.LineSegments(edges, material);

    // Scale down tail
    const scale = 1 - (i / segmentCount) * 0.8;
    segment.scale.set(scale, scale, scale);

    scene.add(segment);
    segments.push(segment);
  }

  // Background Particles (Starfield)
  const starGeo = new THREE.BufferGeometry();
  const starCount = 400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 300;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x444444, size: 0.5 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // --- Mouse & Animation Logic ---
  let mouse = { x: 0, y: 0 };
  let target = new THREE.Vector3(0, 0, 0);

  // Stores history of head positions for the tail to follow
  const history = [];
  const historyLimit = segmentCount * 3; // Smoothness factor

  document.addEventListener("mousemove", (e) => {
    // Normalize mouse to -1 to 1 range
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Custom Cursor Update
    const cursor = document.getElementById("cursor");
    const dot = document.getElementById("cursor-dot");
    gsap.to(cursor, { left: e.clientX, top: e.clientY, duration: 0.1 });
    gsap.to(dot, { left: e.clientX, top: e.clientY, duration: 0 });
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // 1. Move Head towards Mouse (with lag)
    // Convert 2D mouse to 3D world position (roughly)
    const vector = new THREE.Vector3(mouse.x * 50, mouse.y * 30, 0);
    target.lerp(vector, 0.05); // Smooth leader movement

    head.position.copy(target);
    head.rotation.z += 0.05; // Spin head slightly

    // 2. Record History
    history.unshift(head.position.clone());
    if (history.length > historyLimit) history.pop();

    // 3. Update Body Segments
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      // Each segment follows a position in history
      // Index * 2 gives spacing between segments
      const posIndex = i * 2;

      if (history[posIndex]) {
        segment.position.copy(history[posIndex]);
        segment.rotation.x += 0.02;
        segment.rotation.y += 0.02;
      }
    }

    // 4. Background Movement (Scroll Parallax)
    stars.rotation.y += 0.0005;
    stars.position.y = window.scrollY * 0.05;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- 2. UI INTERACTIONS & GSAP ---

  // Hover Effects for Cursor
  document.querySelectorAll(".hover-trigger").forEach((el) => {
    el.addEventListener("mouseenter", () =>
      document.body.classList.add("hovering"),
    );
    el.addEventListener("mouseleave", () =>
      document.body.classList.remove("hovering"),
    );
  });

  // Scroll Progress Bar
  window.addEventListener("scroll", () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.querySelector(".scroll-progress") &&
      (document.querySelector(".scroll-progress").style.height = scrolled + "%");
  });

});
