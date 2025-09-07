class CubesBackground {
    constructor() {
        // 检查Three.js是否加载
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded!');
            return;
        }
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.cubes = [];
        this.originalPositions = [];
        this.targetPositions = [];
        this.clock = new THREE.Clock();
        this.globalRotation = new THREE.Vector3(0.002, 0.003, 0.001);
        this.isAggregated = false; // 聚合状态
        this.controls = null; // OrbitControls
        this.lastCycle = -1; // 跟踪周期性行为
        this.cubeGroup = null; // 立方体组用于统一旋转
        this.geometryTypes = []; // 几何体类型数组
        this.currentGeometryType = 'box'; // 当前几何体类型
        this.lastGeometryChange = 0; // 上次几何体变换时间
        this.customInteractionEnabled = true; // 自定义交互开关
        this.isTransitioning = false; // 是否正在过渡
        this.transitionProgress = 0; // 过渡进度 (0-1)
        this.transitionDuration = 2.0; // 过渡持续时间（秒）
        this.targetGeometryType = 'box'; // 目标几何体类型
        
        this.init();
        this.createCubes();
        this.setupInteraction();
        this.animate();
    }

    init() {
        const container = document.getElementById('cubes-background');
        if (!container) {
            console.error('cubes-background container not found!');
            return;
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // 透明背景
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        // 设置canvas样式确保可见且可交互
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';

        this.camera.position.set(0, 0, 150); // 调整相机位置适应更大的分散范围

        // 添加 OrbitControls - 确保正确绑定
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            this.controls.enableZoom = true;
            this.controls.enableRotate = true;
            this.controls.enablePan = true;
            this.controls.autoRotate = false;
            this.controls.maxDistance = 300;
            this.controls.minDistance = 20;
            
            // 确保控件优先级
            this.renderer.domElement.style.touchAction = 'none';
            
            // 禁用我们自定义的鼠标事件，让OrbitControls接管
            this.customInteractionEnabled = false;
        } else {
            this.customInteractionEnabled = true;
        }

        // Add ambient light - 增强环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Add directional light - 主要方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Add point lights with softer colors for wave effect
        const pointLight1 = new THREE.PointLight(0xccddff, 0.4, 200);
        pointLight1.position.set(-40, -40, 40);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffddcc, 0.4, 200);
        pointLight2.position.set(40, 40, -40);
        this.scene.add(pointLight2);

        // Add a rim light for better definition
        const rimLight = new THREE.DirectionalLight(0xe8e8ff, 0.3);
        rimLight.position.set(-10, 10, -10);
        this.scene.add(rimLight);

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createCubes() {
        const gridSize = 6; // 改为6x6网格形成更紧密的大正方体
        const cubeSize = 10; // 立方体尺寸
        
        // 加载纹理
        const textureLoader = new THREE.TextureLoader();
        const waterNormalTexture = textureLoader.load('js/textures/waternormals.jpg');
        waterNormalTexture.wrapS = THREE.RepeatWrapping;
        waterNormalTexture.wrapT = THREE.RepeatWrapping;
        waterNormalTexture.repeat.set(2, 2);
        
        // 立方体贴图纹理 - 使用texture/0作为环境贴图
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const cubeTexture = cubeTextureLoader.load([
            'js/textures/0/px.jpg', 'js/textures/0/nx.jpg',
            'js/textures/0/py.jpg', 'js/textures/0/ny.jpg',
            'js/textures/0/pz.jpg', 'js/textures/0/nz.jpg'
        ]);
        
        // 几何体类型数组，用于周期性变换
        this.geometryTypes = ['box', 'sphere', 'cone', 'torus', 'dodecahedron', 'octahedron'];
        this.currentGeometryType = 'box';
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                for (let z = 0; z < gridSize; z++) { // 改为完整的立方体网格
                    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                    
                    // 高级材质 - 金属质感和环境反射
                    const material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        metalness: 0.95, // 高金属度
                        roughness: 0.05, // 一定粗糙度
                        // normalMap: waterNormalTexture,
                        normalScale: new THREE.Vector2(0.5, 0.5),
                        envMap: cubeTexture,
                        envMapIntensity: 1.2
                    });
                    
                    const cube = new THREE.Mesh(geometry, material);
                    
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
                        aggregatePosition: new THREE.Vector3(aggregateX, aggregateY, aggregateZ),
                        scatterPosition: new THREE.Vector3(scatterX, scatterY, scatterZ),
                        gridIndex: { x, y, z },
                        originalGeometry: geometry
                    };
                    
                    // 初始位置设为聚合状态
                    cube.position.copy(cube.userData.aggregatePosition);
                    this.originalPositions.push(cube.userData.scatterPosition);
                    this.targetPositions.push(cube.userData.aggregatePosition);
                    
                    this.scene.add(cube);
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
            this.renderer.domElement.addEventListener('mousedown', handleStart);
            this.renderer.domElement.addEventListener('mouseup', handleEnd);
            this.renderer.domElement.addEventListener('touchstart', handleStart);
            this.renderer.domElement.addEventListener('touchend', handleEnd);
        }

        // 键盘事件
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.toggleAggregation();
            }
        });
    }

    // 创建不同几何体
    createGeometry(type, size = 16) {
        switch(type) {
            case 'sphere':
                return new THREE.SphereGeometry(size * 0.6, 32, 16);
            case 'cone':
                return new THREE.ConeGeometry(size * 0.6, size * 1.2, 16);
            case 'torus':
                return new THREE.TorusGeometry(size * 0.4, size * 0.2, 16, 32);
            case 'dodecahedron':
                return new THREE.DodecahedronGeometry(size * 0.6);
            case 'octahedron':
                return new THREE.OctahedronGeometry(size * 0.7);
            case 'box':
            default:
                return new THREE.BoxGeometry(size, size, size);
        }
    }

    // 周期性变换几何体形状 - 带平滑过渡
    changeGeometryShapes() {
        if (this.isTransitioning) return; // 如果正在过渡中，跳过
        
        const randomType = this.geometryTypes[Math.floor(Math.random() * this.geometryTypes.length)];
        if (randomType === this.currentGeometryType) return; // 如果相同类型，跳过
        
        this.targetGeometryType = randomType;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        
        // 为每个立方体创建目标几何体并存储
        this.cubes.forEach((cube, index) => {
            cube.userData.targetGeometry = this.createGeometry(randomType, 16);
            cube.userData.originalVertices = cube.geometry.attributes.position.array.slice();
            cube.userData.targetVertices = cube.userData.targetGeometry.attributes.position.array.slice();
            
            // 确保顶点数组长度一致，如果不一致则进行插值或填充
            const originalLength = cube.userData.originalVertices.length;
            const targetLength = cube.userData.targetVertices.length;
            
            if (originalLength !== targetLength) {
                // 使用较长的数组长度，较短的进行重复或插值
                const maxLength = Math.max(originalLength, targetLength);
                const newOriginal = new Float32Array(maxLength);
                const newTarget = new Float32Array(maxLength);
                
                // 填充原始顶点
                for (let i = 0; i < maxLength; i++) {
                    newOriginal[i] = cube.userData.originalVertices[i % originalLength] || 0;
                    newTarget[i] = cube.userData.targetVertices[i % targetLength] || 0;
                }
                
                cube.userData.originalVertices = newOriginal;
                cube.userData.targetVertices = newTarget;
            }
        });
    }
    
    // 更新几何体过渡动画
    updateGeometryTransition(deltaTime) {
        if (!this.isTransitioning) return;
        
        this.transitionProgress += deltaTime / this.transitionDuration;
        
        if (this.transitionProgress >= 1.0) {
            // 过渡完成
            this.transitionProgress = 1.0;
            this.isTransitioning = false;
            this.currentGeometryType = this.targetGeometryType;
            
            // 应用最终几何体
            this.cubes.forEach((cube) => {
                cube.geometry.dispose(); // 清理旧几何体
                cube.geometry = cube.userData.targetGeometry;
                
                // 清理过渡数据
                delete cube.userData.targetGeometry;
                delete cube.userData.originalVertices;
                delete cube.userData.targetVertices;
            });
        } else {
            // 使用缓动函数创建平滑过渡
            const easeInOutCubic = (t) => {
                return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            };
            
            const easedProgress = easeInOutCubic(this.transitionProgress);
            
            // 更新每个立方体的顶点位置
            this.cubes.forEach((cube) => {
                if (cube.userData.originalVertices && cube.userData.targetVertices) {
                    const positions = cube.geometry.attributes.position.array;
                    
                    for (let i = 0; i < positions.length; i++) {
                        positions[i] = THREE.MathUtils.lerp(
                            cube.userData.originalVertices[i],
                            cube.userData.targetVertices[i],
                            easedProgress
                        );
                    }
                    
                    cube.geometry.attributes.position.needsUpdate = true;
                    cube.geometry.computeBoundingSphere();
                }
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
            this.cubeGroup = new THREE.Group();
            this.cubes.forEach(cube => {
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
            const targetPos = this.isAggregated ? 
                cube.userData.aggregatePosition : 
                cube.userData.scatterPosition;
            
            // 平滑移动到目标位置 - 加快速度
            cube.position.lerp(targetPos, 0.08);
            
            // 轻微的呼吸效果
            const breathScale = 1 + Math.sin(time * 2 + index * 0.1) * 0.02;
            cube.scale.setScalar(breathScale);
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
document.addEventListener('DOMContentLoaded', () => {
    new CubesBackground();
});
