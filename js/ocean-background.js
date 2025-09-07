class OceanBackground {
    constructor() {
        // 检查Three.js是否加载
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded for ocean!');
            return;
        }
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        this.clock = new THREE.Clock();
        this.water = null;
        
        this.init();
        this.createWater();
        this.animate();
    }
    
    init() {
        const container = document.getElementById('ocean-background');
        if (!container) {
            console.error('Ocean background container not found!');
            return;
        }
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB, 1); // 天空蓝色背景
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // 使用性能更好的阴影类型
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        container.appendChild(this.renderer.domElement);
        
        // 设置canvas样式
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.zIndex = '-10'; // 最底层
        this.renderer.domElement.style.pointerEvents = 'none';
        
        this.camera.position.set(0, 10, 100);
        
        // 优化的光照系统 - 性能友好
        // 环境光 - 模拟天空散射光
        const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4);
        this.scene.add(ambientLight);
        
        // 主太阳光 - 性能优化的设置
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(100, 60, 50);
        sunLight.castShadow = false; // 关闭阴影以提高性能
        this.scene.add(sunLight);
        
        // 辅助金色阳光 - 营造温暖效果
        const warmLight = new THREE.DirectionalLight(0xffd700, 0.3);
        warmLight.position.set(-50, 40, 80);
        this.scene.add(warmLight);
        
        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);
        
        // 处理窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
    }
    
    createWater() {
        // 性能优化的水面几何体
        const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 128, 128); // 适中的分辨率
        
        // 加载水面法线纹理
        const textureLoader = new THREE.TextureLoader();
        const waterNormalTexture = textureLoader.load('js/textures/waternormals.jpg');
        waterNormalTexture.wrapS = THREE.RepeatWrapping;
        waterNormalTexture.wrapT = THREE.RepeatWrapping;
        waterNormalTexture.repeat.set(12, 12);
        
        // 优化的水面材质 - 平衡真实感和性能
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x006994,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8,
            normalMap: waterNormalTexture,
            normalScale: new THREE.Vector2(1.5, 1.5),
            envMapIntensity: 0.8, // 适度的环境反射
        });
        
        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -50;
        this.water.receiveShadow = false; // 关闭阴影接收以提高性能
        this.scene.add(this.water);
        
        // 添加动态波浪效果
        this.originalPositions = new Float32Array(waterGeometry.attributes.position.array);
        
        // 添加简单的太阳反射效果
        this.createSunReflection();
    }
    
    createSunReflection() {
        // 简单的太阳反射点 - 使用正确的材质
        const sunGeometry = new THREE.SphereGeometry(4, 12, 12);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6
        });
        
        this.sunReflection = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunReflection.position.set(50, -45, 30);
        this.scene.add(this.sunReflection);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // 优化的动态波浪 - 减少计算复杂度
        if (this.water && this.originalPositions) {
            const positions = this.water.geometry.attributes.position.array;
            
            // 使用更少但更有效的波浪层
            for (let i = 0; i < positions.length; i += 3) {
                const x = this.originalPositions[i];
                const y = this.originalPositions[i + 1];
                const z = this.originalPositions[i + 2];
                
                // 三层波浪叠加 - 性能优化
                positions[i + 2] = z + 
                    Math.sin(x * 0.015 + time * 1.0) * 2.5 + // 主波浪
                    Math.sin(y * 0.012 + time * 0.8) * 1.8 + // 次要波浪
                    Math.sin((x + y) * 0.008 + time * 0.6) * 1.2; // 交叉波浪
            }
            
            this.water.geometry.attributes.position.needsUpdate = true;
            this.water.geometry.computeVertexNormals();
        }
        
        // 简单的太阳反射动画
        if (this.sunReflection) {
            this.sunReflection.position.y = -45 + Math.sin(time * 0.5) * 1.5;
            this.sunReflection.material.emissiveIntensity = 0.8 + Math.sin(time * 2) * 0.2;
        }
        
        // 温和的相机运动
        this.camera.position.x = Math.sin(time * 0.08) * 12;
        this.camera.position.z = 100 + Math.cos(time * 0.05) * 15;
        this.camera.lookAt(0, -20, 0);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 页面加载完成后初始化海洋背景
window.addEventListener('DOMContentLoaded', () => {
    window.oceanBackground = new OceanBackground();
});
