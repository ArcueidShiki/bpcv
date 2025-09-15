class OceanBackground {
  constructor() {
    console.log("OceanBackground constructor called");

    // Check if Three.js and required addons are loaded
    if (typeof Three === "undefined") {
      console.error("Three.js not loaded for ocean!");
      return;
    }
    if (typeof Three.Water === "undefined") {
      console.error("Three.Water not loaded!");
      return;
    } else {
      console.log("Three.Water loaded successfully:", Three.Water);
    }
    if (typeof Three.Sky === "undefined") {
      console.error("Three.Sky not loaded!");
      return;
    } else {
      console.log("Three.Sky loaded successfully:", Three.Sky);
    }
    if (typeof Three.OrbitControls === "undefined") {
      console.error("Three.OrbitControls not loaded!");
      return;
    } else {
      console.log(
        "Three.OrbitControls loaded successfully:",
        Three.OrbitControls
      );
    }

    this.container = null;
    this.stats = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.water = null;
    this.sun = null;
    this.sky = null;
    this.renderTarget = null;
    this.gui = null;
    this.init();
  }
  init() {
    console.log("OceanBackground init called");
    this.container = document.getElementById("ocean-background");

    if (!this.container) {
      console.error("Ocean background container not found!");
      return;
    }
    console.log("Container found:", this.container);

    //

    this.renderer = new Three.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop(() => this.animate());
    this.renderer.toneMapping = Three.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;

    // Set canvas styles for background
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.zIndex = "-5";
    this.renderer.domElement.style.pointerEvents = "none";

    this.container.appendChild(this.renderer.domElement);
    console.log("Renderer created and added to container");

    //

    this.scene = new Three.Scene();

    this.camera = new Three.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      20000
    );
    this.camera.position.set(30, 30, 100);

    //

    this.sun = new Three.Vector3();

    // Water

    const waterGeometry = new Three.PlaneGeometry(10000, 10000);

    this.water = new Three.Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new Three.TextureLoader().load(
        "https://threejs.org/examples/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = Three.RepeatWrapping;
          console.log("Water normals texture loaded");
        },
        undefined,
        function (error) {
          console.error("Failed to load water normals texture:", error);
        }
      ),
      sunDirection: new Three.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: this.scene.fog !== undefined,
    });
    console.log("Water created");

    this.water.rotation.x = -Math.PI / 2;

    this.scene.add(this.water);

    // Skybox

    this.sky = new Three.Sky();
    this.sky.scale.setScalar(10000);
    this.scene.add(this.sky);
    console.log("Sky created");

    const skyUniforms = this.sky.material.uniforms;

    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const parameters = {
      elevation: 2,
      azimuth: 180,
    };

    const pmremGenerator = new Three.PMREMGenerator(this.renderer);
    const sceneEnv = new Three.Scene();

    const updateSun = () => {
      console.log("updateSun called");
      const phi = Three.MathUtils.degToRad(90 - parameters.elevation);
      const theta = Three.MathUtils.degToRad(parameters.azimuth);

      this.sun.setFromSphericalCoords(1, phi, theta);

      this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
      this.water.material.uniforms["sunDirection"].value
        .copy(this.sun)
        .normalize();

      //   if (this.renderTarget !== undefined) this.renderTarget.dispose();

      sceneEnv.add(this.sky);
      this.renderTarget = pmremGenerator.fromScene(sceneEnv);
      this.scene.add(this.sky);

      this.scene.environment = this.renderTarget.texture;
    };

    updateSun();
    console.log("Sun updated");


    this.controls = new Three.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.target.set(0, 10, 0);
    this.controls.minDistance = 40.0;
    this.controls.maxDistance = 200.0;
    this.controls.update();
    console.log("Controls created");

    // Initialize GUI
 
    this.gui = new dat.GUI();

    this.folderSky = this.gui.addFolder("Sky");
    this.folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
    this.folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
    this.folderSky.open();

    this.waterUniforms = this.water.material.uniforms;

    this.folderWater = this.gui.addFolder("Water");
    this.folderWater
      .add(this.waterUniforms.distortionScale, "value", 0, 8, 0.1)
      .name("distortionScale");
    this.folderWater.add(this.waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
    this.folderWater.open();
    if (typeof Stats !== "undefined") {
      this.stats = new Stats();
      this.container.appendChild(this.stats.dom);
      console.log("Stats created");
    } else {
      console.warn("Stats not available");
    }
    window.addEventListener("resize", () => this.onWindowResize());
    console.log("Ocean background initialization complete");
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.render();
    if (this.controls) this.controls.update();
    if (this.stats) this.stats.update();
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }
  render() {
    const time = performance.now() * 0.001;

    this.water.material.uniforms["time"].value += 1.0 / 60.0;

    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, creating ocean background");
  try {
    new OceanBackground();
    console.log("Ocean background created successfully");
  } catch (error) {
    console.error("Failed to create ocean background:", error);
  }
});
