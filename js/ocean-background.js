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
        this.renderer.setClearColor(0x006994, 1); // 海洋蓝色背景
        this.renderer.setPixelRatio(window.devicePixelRatio);
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
        
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 添加方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);
        
        // 处理窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
    }
    
    createWater() {
        // 创建水面几何体
        const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
        
        // 加载水面法线纹理
        const textureLoader = new THREE.TextureLoader();
        const waterNormalTexture = textureLoader.load('js/textures/waternormals.jpg');
        waterNormalTexture.wrapS = THREE.RepeatWrapping;
        waterNormalTexture.wrapT = THREE.RepeatWrapping;
        waterNormalTexture.repeat.set(8, 8);
        
        // 简化的水面材质
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x006994,
            roughness: 0.1,
            metalness: 0.0,
            transparent: true,
            opacity: 0.8,
            normalMap: waterNormalTexture,
            normalScale: new THREE.Vector2(1.0, 1.0)
        });
        
        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -50;
        this.scene.add(this.water);
        
        // 添加动态波浪效果
        this.originalPositions = new Float32Array(waterGeometry.attributes.position.array);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // 创建动态波浪
        if (this.water && this.originalPositions) {
            const positions = this.water.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = this.originalPositions[i];
                const y = this.originalPositions[i + 1];
                const z = this.originalPositions[i + 2];
                
                // 多层波浪叠加
                positions[i + 2] = z + 
                    Math.sin(x * 0.02 + time * 1.5) * 2.0 +
                    Math.sin(y * 0.015 + time * 1.2) * 1.5 +
                    Math.sin((x + y) * 0.01 + time * 0.8) * 1.0 +
                    Math.sin(x * 0.05 + y * 0.03 + time * 2.0) * 0.5;
            }
            
            this.water.geometry.attributes.position.needsUpdate = true;
            this.water.geometry.computeVertexNormals();
        }
        
        // 轻微的相机运动
        this.camera.position.x = Math.sin(time * 0.1) * 10;
        this.camera.position.z = 100 + Math.cos(time * 0.05) * 20;
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
