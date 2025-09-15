class CubesBackground {
  constructor() {
    // 检查Three.js是否加载
    if (typeof Three === "undefined") {
      console.error("Three.js not loaded!");
      return;
    }

    this.scene = new Three.Scene();
    this.camera = new Three.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new Three.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.cubes = [];
    this.originalPositions = [];
    this.targetPositions = [];
    this.clock = new Three.Clock();
    this.globalRotation = new Three.Vector3(0.002, 0.003, 0.001);
    this.isAggregated = false; // 聚合状态
    this.controls = null; // OrbitControls
    this.lastCycle = -1; // 跟踪周期性行为
    this.cubeGroup = null; // 立方体组用于统一旋转
    this.geometryTypes = []; // 几何体类型数组
    this.currentGeometryType = "box"; // 当前几何体类型
    this.lastGeometryChange = 0; // 上次几何体变换时间
    this.customInteractionEnabled = true; // 自定义交互开关
    this.isTransitioning = false; // 是否正在过渡
    this.transitionProgress = 0; // 过渡进度 (0-1)
    this.transitionDuration = 1.0; // 过渡持续时间（秒）
    this.targetGeometryType = "box"; // 目标几何体类型

    this.init();
    this.createCubes();
    this.setupInteraction();
    this.animate();
  }

  init() {
    const container = document.getElementById("cubes-background");
    if (!container) {
      console.error("cubes-background container not found!");
      return;
    }

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // 透明背景
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = Three.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 设置canvas样式确保可见且可交互
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.zIndex = "1";
    this.renderer.domElement.style.pointerEvents = "auto";

    this.camera.position.set(0, 0, 150); // 调整相机位置适应更大的分散范围

    // 添加 OrbitControls - 确保正确绑定
    if (typeof Three.OrbitControls !== "undefined") {
      this.controls = new Three.OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.1;
      this.controls.enableZoom = true;
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.autoRotate = false;
      this.controls.maxDistance = 300;
      this.controls.minDistance = 20;

      // 确保控件优先级
      this.renderer.domElement.style.touchAction = "none";

      // 禁用我们自定义的鼠标事件，让OrbitControls接管
      this.customInteractionEnabled = false;
    } else {
      this.customInteractionEnabled = true;
    }

    // Add ambient light - 增强环境光
    const ambientLight = new Three.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener("resize", () => this.handleResize());
  }

  createCubes() {
    const gridSize = 7; // 改为7x7网格形成更紧密的大正方体
    const cubeSize = 10; // 立方体尺寸

    // 加载纹理
    // const textureLoader = new Three.TextureLoader();
    // const waterNormalTexture = textureLoader.load(
    //   "js/textures/3/nx.jpg"
    // );
    // waterNormalTexture.wrapS = Three.RepeatWrapping;
    // waterNormalTexture.wrapT = Three.RepeatWrapping;
    // waterNormalTexture.repeat.set(2, 2);

    // 立方体贴图纹理 - 使用texture/0作为环境贴图
    const cubeTextureLoader = new Three.CubeTextureLoader();
    const cubeTexture = cubeTextureLoader.load([
      "js/textures/0/px.jpg",
      "js/textures/0/nx.jpg",
      "js/textures/0/py.jpg",
      "js/textures/0/ny.jpg",
      "js/textures/0/pz.jpg",
      "js/textures/0/nz.jpg",
    ]);

    // 几何体类型数组，用于周期性变换
    this.geometryTypes = [
      "box",
      "sphere",
      "cone",
      "torus",
      "dodecahedron",
      "octahedron",
    ];
    this.currentGeometryType = "box";

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          // 改为完整的立方体网格
          const geometry = new Three.BoxGeometry(cubeSize, cubeSize, cubeSize);

          // 高级材质 - 金属质感和环境反射
          const material = new Three.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.95, // 高金属度
            roughness: 0.05, // 一定粗糙度
            // normalMap: waterNormalTexture,
            normalScale: new Three.Vector2(0.5, 0.5),
            envMap: cubeTexture,
            envMapIntensity: 1.5,
            transparent: true, // 支持透明度动画
            opacity: 1.0,
          });

          const cube = new Three.Mesh(geometry, material);

          // 聚合时的紧密分布 - 形成大正方体
          const aggregateSpacing = cubeSize + 0.5; // 几乎无缝连接
          const aggregateX = (x - gridSize / 2 + 0.5) * aggregateSpacing;
          const aggregateY = (y - gridSize / 2 + 0.5) * aggregateSpacing;
          const aggregateZ = (z - gridSize / 2 + 0.5) * aggregateSpacing;

          // 分散时的适度间距 - 2倍边长的间距
          const scatterSpacing = cubeSize * 3;
          const scatterX = (x - gridSize / 2 + 0.5) * scatterSpacing;
          const scatterY = (y - gridSize / 2 + 0.5) * scatterSpacing;
          const scatterZ = (z - gridSize / 2 + 0.5) * scatterSpacing;

          // 存储位置信息
          cube.userData = {
            aggregatePosition: new Three.Vector3(
              aggregateX,
              aggregateY,
              aggregateZ
            ),
            scatterPosition: new Three.Vector3(scatterX, scatterY, scatterZ),
            gridIndex: { x, y, z },
            originalGeometry: geometry,
          };

          // 初始位置设为聚合状态
          cube.position.copy(cube.userData.aggregatePosition);
          this.originalPositions.push(cube.userData.scatterPosition);
          this.targetPositions.push(cube.userData.aggregatePosition);

          //   this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }
  }

  setupInteraction() {
    let isPressed = false;
    let pressTimer = null;

    // 鼠标/触摸事件 - 只在没有OrbitControls时使用
    const handleStart = (event) => {
      if (this.customInteractionEnabled) {
        isPressed = true;
        pressTimer = setTimeout(() => {
          if (isPressed) {
            this.toggleAggregation();
          }
        }, 500); // 长按500ms触发
      }
    };

    const handleEnd = (event) => {
      if (this.customInteractionEnabled && isPressed && pressTimer) {
        clearTimeout(pressTimer);
        if (pressTimer) {
          // 短按 - 也触发聚合/分散
          this.toggleAggregation();
        }
      }
      isPressed = false;
      pressTimer = null;
    };

    // 只在自定义交互启用时添加事件监听器
    if (this.customInteractionEnabled) {
      this.renderer.domElement.addEventListener("mousedown", handleStart);
      this.renderer.domElement.addEventListener("mouseup", handleEnd);
      this.renderer.domElement.addEventListener("touchstart", handleStart);
      this.renderer.domElement.addEventListener("touchend", handleEnd);
    }

    // 键盘事件
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.changeGeometryShapes();   
        this.toggleAggregation();
      } else if (event.code === "KeyG") {
        // 按 G 键立即触发几何体变换
        event.preventDefault();
        this.changeGeometryShapes();
      }
    });
  }

  // 创建不同几何体
  createGeometry(type, size = 10) {
    switch (type) {
      case "sphere":
        return new Three.SphereGeometry(size * 0.6, 16, 12);
      case "cone":
        return new Three.ConeGeometry(size * 0.6, size * 1.2, 12);
      case "torus":
        return new Three.TorusGeometry(size * 0.4, size * 0.2, 8, 16);
      case "dodecahedron":
        return new Three.DodecahedronGeometry(size * 0.6);
      case "octahedron":
        return new Three.OctahedronGeometry(size * 0.7);
      case "box":
      default:
        return new Three.BoxGeometry(size, size, size);
    }
  }

  // 周期性变换几何体形状 - 直接替换几何体
  changeGeometryShapes() {
    if (!this.cubeGroup || this.cubeGroup.children.length === 0) return; // 确保cubeGroup已创建且有子对象

    // 选择一个不同于当前类型的几何体类g型
    let randomType;
    let attempts = 0;
    do {
      randomType = this.geometryTypes[Math.floor(Math.random() * this.geometryTypes.length)];
      attempts++;
    } while (randomType === this.currentGeometryType && attempts < 10); // 最多尝试10次避免无限循环

    this.targetGeometryType = randomType;
    this.currentGeometryType = randomType; // 立即更新当前类型
    this.isTransitioning = true;
    this.transitionProgress = 0;

    // 生成随机颜色
    const randomColor = new Three.Color();
    randomColor.setHSL(Math.random(), 0.7, 0.5); // 随机色相，固定饱和度和亮度

    // 为每个立方体直接替换几何体
    this.cubeGroup.children.forEach((cube, index) => {
      // 保存当前几何体作为原始几何体
      cube.userData.originalGeometry = cube.geometry;

      // 创建新的目标几何体
      cube.userData.targetGeometry = this.createGeometry(randomType, 10);

      // 立即替换几何体
      cube.geometry.dispose(); // 清理旧几何体
      cube.geometry = cube.userData.targetGeometry;

      // 保存原始缩放
      cube.userData.originalScale = cube.scale.clone();
      
      // 保存原始颜色并设置目标颜色
      cube.userData.originalColor = cube.material.color.clone();
      cube.userData.targetColor = randomColor.clone();
      
      // 立即应用新颜色
      cube.material.color.copy(cube.userData.targetColor);
    });
  }

  // 更新几何体过渡动画 - 简单的缩放效果
  updateGeometryTransition(deltaTime) {
    if (!this.isTransitioning) return;
    if (!this.cubeGroup || this.cubeGroup.children.length === 0) return; // 确保cubeGroup已创建且有子对象

    this.transitionProgress += deltaTime / this.transitionDuration;

    if (this.transitionProgress >= 1.0) {
      // 过渡完成
      this.transitionProgress = 1.0;
      this.isTransitioning = false;
      // currentGeometryType 已经在 changeGeometryShapes 中更新了

      console.log(`Geometry transition completed: ${this.currentGeometryType}`);

      // 恢复正常状态
      this.cubeGroup.children.forEach((cube) => {
        // 恢复正常缩放和透明度
        if (cube.userData.originalScale) {
          cube.scale.copy(cube.userData.originalScale);
        } else {
          cube.scale.set(1, 1, 1); // 默认缩放
        }
        cube.material.opacity = 1.0;
        cube.material.transparent = false;

        // 清理过渡数据
        delete cube.userData.originalGeometry;
        delete cube.userData.targetGeometry;
        delete cube.userData.originalScale;
        delete cube.userData.originalColor;
        delete cube.userData.targetColor;
      });
    } else {
      // 使用缓动函数创建平滑过渡
      const easeInOutCubic = (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };

      const easedProgress = easeInOutCubic(this.transitionProgress);

      // 简单的缩放动画 - 先缩小再放大
      this.cubeGroup.children.forEach((cube) => {
        let scale;
        if (this.transitionProgress < 0.5) {
          // 前半段：缩小到0.5
          scale = 1.0 - (easedProgress * 0.5);
        } else {
          // 后半段：从0.5放大到1.0
          scale = 0.5 + ((easedProgress - 0.5) * 1.0);
        }
        
        if (cube.userData.originalScale) {
          cube.scale.copy(cube.userData.originalScale);
        } else {
          cube.scale.set(1, 1, 1);
        }
        cube.scale.multiplyScalar(scale);
      });
    }
  }

  toggleAggregation() {
    this.isAggregated = !this.isAggregated;

    // 视觉反馈 - 短暂改变相机位置
    const originalPosition = this.camera.position.clone();
    this.camera.position.multiplyScalar(1.05);
    setTimeout(() => {
      this.camera.position.copy(originalPosition);
    }, 200);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();

    // 更新OrbitControls
    if (this.controls) {
      this.controls.update();
    }

    // 更新几何体过渡动画
    this.updateGeometryTransition(deltaTime);

    // 周期性行为 - 每20秒自动切换一次聚合/分散
    const cycleTime = 20; // 20秒周期
    const cyclePhase = (time % cycleTime) / cycleTime;

    // 在周期的中间点自动切换状态
    if (Math.floor(time / cycleTime) !== this.lastCycle) {
      this.lastCycle = Math.floor(time / cycleTime);
      this.toggleAggregation();
    }

    // 周期性几何体变换 - 每8秒变换一次形状
    const geometryChangeInterval = 8;
    if (time - this.lastGeometryChange > geometryChangeInterval) {
      this.lastGeometryChange = time;
      this.changeGeometryShapes();
    }

    // 创建整体旋转组
    if (!this.cubeGroup) {
      this.cubeGroup = new Three.Group();
      this.cubes.forEach((cube) => {
        this.scene.remove(cube);
        this.cubeGroup.add(cube);
      });
      this.scene.add(this.cubeGroup);
    }

    // 统一旋转整个立方体组
    const globalRotationSpeed = 0.005;
    this.cubeGroup.rotation.x += globalRotationSpeed;
    this.cubeGroup.rotation.y += globalRotationSpeed * 0.7;
    this.cubeGroup.rotation.z += globalRotationSpeed * 0.3;

    // 更新每个正方体位置（不再单独旋转）
    this.cubes.forEach((cube, index) => {
      // 根据聚合状态选择目标位置
      const targetPos = this.isAggregated
        ? cube.userData.aggregatePosition
        : cube.userData.scatterPosition;

      // 平滑移动到目标位置 - 加快速度
      cube.position.lerp(targetPos, 0.08);

      // 轻微的呼吸效果 - 但不在几何体过渡期间应用
      if (!this.isTransitioning) {
        const breathScale = 1 + Math.sin(time * 2 + index * 0.1) * 0.02;
        cube.scale.setScalar(breathScale);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 初始化背景
document.addEventListener("DOMContentLoaded", () => {
  new CubesBackground();
});
