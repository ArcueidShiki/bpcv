class CubesBackground {
    constructor() {
        console.log('CubesBackground constructor called');
        
        // 检查Three.js是否加载
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded!');
            return;
        }
        console.log('THREE.js version:', THREE.REVISION);
        
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
        console.log('Container found:', container);
        
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
        console.log('Canvas element created:', this.renderer.domElement);

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
            this.controls.maxDistance = 200;
            this.controls.minDistance = 10;
            console.log('OrbitControls initialized with enhanced settings:', !!this.controls);
        } else {
            console.warn('OrbitControls not available');
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
        const gridSize = 8; // 8x8网格
        const cubeSize = 8; // 立方体尺寸
        
        // 加载纹理
        const textureLoader = new THREE.TextureLoader();
        const waterNormalTexture = textureLoader.load('js/textures/waternormals.jpg');
        waterNormalTexture.wrapS = THREE.RepeatWrapping;
        waterNormalTexture.wrapT = THREE.RepeatWrapping;
        waterNormalTexture.repeat.set(2, 2);
        
        // 立方体贴图纹理
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const cubeTexture = cubeTextureLoader.load([
            'js/textures/0/px.jpg', 'js/textures/0/nx.jpg',
            'js/textures/0/py.jpg', 'js/textures/0/ny.jpg',
            'js/textures/0/pz.jpg', 'js/textures/0/nz.jpg'
        ]);
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                for (let z = 0; z < 2; z++) { // 保持2层
                    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                    
                    // 高级材质 - 金属质感和环境反射
                    const material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        metalness: 0.8, // 高金属度
                        roughness: 0.3, // 一定粗糙度
                        normalMap: waterNormalTexture,
                        normalScale: new THREE.Vector2(0.5, 0.5),
                        envMap: cubeTexture,
                        envMapIntensity: 1.0
                    });
                    
                    const cube = new THREE.Mesh(geometry, material);
                    
                    // 聚合时的紧密分布
                    const aggregateSpacing = 9;
                    const aggregateX = (x - gridSize / 2) * aggregateSpacing;
                    const aggregateY = (y - gridSize / 2) * aggregateSpacing;
                    const aggregateZ = (z - 1) * aggregateSpacing;
                    
                    // 分散时扩展到整个窗口
                    const scatterX = ((x - gridSize / 2) / gridSize) * window.innerWidth * 0.8;
                    const scatterY = ((y - gridSize / 2) / gridSize) * window.innerHeight * 0.8;
                    const scatterZ = ((z - 1) * 2) * 100;
                    
                    // 存储位置信息
                    cube.userData = {
                        aggregatePosition: new THREE.Vector3(aggregateX, aggregateY, aggregateZ),
                        scatterPosition: new THREE.Vector3(scatterX, scatterY, scatterZ),
                        gridIndex: { x, y, z }
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
        
        console.log(`Created ${this.cubes.length} cubes with advanced materials`);
        
        // 添加调试信息
        console.log('Camera position:', this.camera.position);
        console.log('Scene children count:', this.scene.children.length);
        console.log('Renderer size:', this.renderer.getSize(new THREE.Vector2()));
    }

    setupInteraction() {
        let isPressed = false;
        let pressTimer = null;
        
        // 鼠标/触摸事件
        const handleStart = (event) => {
            isPressed = true;
            pressTimer = setTimeout(() => {
                if (isPressed) {
                    this.toggleAggregation();
                }
            }, 500); // 长按500ms触发
        };

        const handleEnd = (event) => {
            if (isPressed && pressTimer) {
                clearTimeout(pressTimer);
                if (pressTimer) {
                    // 短按 - 也触发聚合/分散
                    this.toggleAggregation();
                }
            }
            isPressed = false;
            pressTimer = null;
        };

        // 添加事件监听器
        this.renderer.domElement.addEventListener('mousedown', handleStart);
        this.renderer.domElement.addEventListener('mouseup', handleEnd);
        this.renderer.domElement.addEventListener('touchstart', handleStart);
        this.renderer.domElement.addEventListener('touchend', handleEnd);

        // 键盘事件
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.toggleAggregation();
            }
        });
    }

    toggleAggregation() {
        this.isAggregated = !this.isAggregated;
        console.log(`Toggling to: ${this.isAggregated ? 'Aggregated' : 'Dispersed'}`);
        
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
        
        // 更新OrbitControls
        if (this.controls) {
            this.controls.update();
        }
        
        // 周期性行为 - 每20秒自动切换一次聚合/分散
        const cycleTime = 20; // 20秒周期
        const cyclePhase = (time % cycleTime) / cycleTime;
        
        // 在周期的中间点自动切换状态
        if (Math.floor(time / cycleTime) !== this.lastCycle) {
            this.lastCycle = Math.floor(time / cycleTime);
            this.toggleAggregation();
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
            
            // 平滑移动到目标位置
            cube.position.lerp(targetPos, 0.03);
            
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
