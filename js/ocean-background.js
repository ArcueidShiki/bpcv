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
      elevation: 50,
      azimuth: 55,
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

    // 设置GUI位置到右下角且默认隐藏
    this.gui.domElement.style.position = "fixed";
    this.gui.domElement.style.bottom = "20px";
    this.gui.domElement.style.right = "20px";
    this.gui.domElement.style.top = "auto";
    this.gui.domElement.style.zIndex = "1000";
    this.gui.domElement.style.display = "none"; // 默认隐藏

    this.folderSky = this.gui.addFolder("Sky");
    this.folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
    this.folderSky
      .add(parameters, "azimuth", -180, 180, 0.1)
      .onChange(updateSun);
    this.folderSky.open();

    this.waterUniforms = this.water.material.uniforms;

    this.folderWater = this.gui.addFolder("Water");
    this.folderWater
      .add(this.waterUniforms.distortionScale, "value", 0, 8, 0.1)
      .name("distortionScale");

    // 设置默认size值为6
    this.waterUniforms.size.value = 6.0;
    this.folderWater
      .add(this.waterUniforms.size, "value", 0.1, 10, 0.1)
      .name("size");
    this.folderWater.open();

    // 创建交互提示文本框
    this.createInteractionHints();

    // 添加键盘事件监听
    this.setupKeyboardEvents();

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

  createInteractionHints() {
    // 创建提示文本框
    const hintBox = document.createElement("div");
    hintBox.id = "interaction-hints";
    hintBox.innerHTML = `
      <div style="font-size: 14px; line-height: 1.5;">
        <strong>交互控制：</strong><br>
        <span style="color: #00ff88;">Left Click:</span> Toggle Aggregate<br>
        <span style="color: #ff8800;">Right Click:</span> Change Shape<br>
        <span style="color: #0088ff;">Space:</span> Change Both<br>
        <span style="color: #ff0088;">H:</span> Show/Hide Debug Window
      </div>
    `;

    // 设置样式
    hintBox.style.position = "fixed";
    hintBox.style.bottom = "20px";
    hintBox.style.left = "20px";
    hintBox.style.background = "rgba(0, 0, 0, 0.7)";
    hintBox.style.color = "white";
    hintBox.style.padding = "15px";
    hintBox.style.borderRadius = "8px";
    hintBox.style.fontFamily = 'Monaco, "Lucida Console", monospace';
    hintBox.style.fontSize = "12px";
    hintBox.style.zIndex = "1001";
    hintBox.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    hintBox.style.backdropFilter = "blur(10px)";
    hintBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
    hintBox.style.transition = "opacity 0.3s ease";

    document.body.appendChild(hintBox);
    this.hintBox = hintBox;

    // 3秒后自动淡出
    setTimeout(() => {
      hintBox.style.opacity = "0.3";
    }, 3000);

    // 鼠标悬停时恢复完全不透明
    hintBox.addEventListener("mouseenter", () => {
      hintBox.style.opacity = "1";
    });

    hintBox.addEventListener("mouseleave", () => {
      hintBox.style.opacity = "0.3";
    });
  }

  setupKeyboardEvents() {
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyH":
          // 切换GUI显示/隐藏
          this.toggleDebugWindow();
          break;
        case "Space":
          // 同时切换聚合状态和形状
          event.preventDefault(); // 阻止页面滚动
          this.changeBoth();
          break;
      }
    });

    // 鼠标事件处理
    document.addEventListener("mousedown", (event) => {
      // 只处理在ocean背景区域的点击
      if (
        event.target === this.renderer.domElement ||
        event.target.closest("#ocean-background")
      ) {
        if (event.button === 0) {
          // 左键
          this.toggleAggregateFromOcean();
        } else if (event.button === 2) {
          // 右键
          event.preventDefault(); // 阻止右键菜单
          this.changeShapeFromOcean();
        }
      }
    });

    // 阻止右键菜单
    document.addEventListener("contextmenu", (event) => {
      if (
        event.target === this.renderer.domElement ||
        event.target.closest("#ocean-background")
      ) {
        event.preventDefault();
      }
    });
  }

  toggleDebugWindow() {
    if (this.gui.domElement.style.display === "none") {
      this.gui.domElement.style.display = "block";
      console.log("Debug window shown");
    } else {
      this.gui.domElement.style.display = "none";
      console.log("Debug window hidden");
    }
  }

  toggleAggregateFromOcean() {
    // 通知 CubesBackground 切换聚合状态
    const cubesEvent = new CustomEvent("oceanToggleAggregate");
    window.dispatchEvent(cubesEvent);
    console.log("Ocean: Toggle aggregate requested");
  }

  changeShapeFromOcean() {
    // 通知 CubesBackground 切换形状
    const cubesEvent = new CustomEvent("oceanChangeShape");
    window.dispatchEvent(cubesEvent);
    console.log("Ocean: Change shape requested");
  }

  changeBoth() {
    // 同时执行两个操作
    this.toggleAggregateFromOcean();
    this.changeShapeFromOcean();
    console.log("Ocean: Change both requested");
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
