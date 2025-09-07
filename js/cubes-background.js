class CubesBackground {
    constructor() {
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
        
        this.init();
        this.createCubes();
        this.animate();
        this.startPeriodicShapeChange();
    }

    init() {
        const container = document.getElementById('cubes-background');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 30);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add point light for better illumination
        const pointLight = new THREE.PointLight(0x4444ff, 0.3, 100);
        pointLight.position.set(-10, -10, 10);
        this.scene.add(pointLight);

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createCubes() {
        const gridSize = 6; // Reduced grid size for larger cubes
        const spacing = 4; // Increased spacing
        const colors = [0x4a90e2, 0x7ed321, 0xf5a623, 0xd0021b, 0x9013fe, 0x50e3c2];
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                for (let z = 0; z < 2; z++) { // Reduced Z layers for better performance
                    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Larger cubes
                    const material = new THREE.MeshPhongMaterial({
                        color: colors[Math.floor(Math.random() * colors.length)],
                        transparent: true,
                        opacity: 0.4, // Slightly more visible
                        shininess: 100
                    });
                    
                    const cube = new THREE.Mesh(geometry, material);
                    
                    const xPos = (x - gridSize / 2) * spacing;
                    const yPos = (y - gridSize / 2) * spacing;
                    const zPos = (z - 1) * spacing;
                    
                    cube.position.set(xPos, yPos, zPos);
                    cube.castShadow = true;
                    cube.receiveShadow = true;
                    
                    // Store original position
                    this.originalPositions.push(new THREE.Vector3(xPos, yPos, zPos));
                    
                    this.scene.add(cube);
                    this.cubes.push(cube);
                }
            }
        }
        
        this.targetPositions = [...this.originalPositions];
        this.generateGridShape();
    }

    generateGridShape() {
        // Simple grid arrangement
        for (let i = 0; i < this.cubes.length; i++) {
            this.targetPositions[i].copy(this.originalPositions[i]);
        }
    }

    generateTightCube() {
        const cubeSize = Math.ceil(Math.pow(this.cubes.length, 1/3));
        const spacing = 1.2;
        
        for (let i = 0; i < this.cubes.length; i++) {
            const x = (i % cubeSize) - cubeSize / 2;
            const y = Math.floor((i % (cubeSize * cubeSize)) / cubeSize) - cubeSize / 2;
            const z = Math.floor(i / (cubeSize * cubeSize)) - cubeSize / 2;
            
            this.targetPositions[i].set(x * spacing, y * spacing, z * spacing);
        }
    }

    generateSphere() {
        const radius = 8;
        for (let i = 0; i < this.cubes.length; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.cubes.length);
            const theta = Math.sqrt(this.cubes.length * Math.PI) * phi;
            
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);
            
            this.targetPositions[i].set(x, y, z);
        }
    }

    generateHelix() {
        const radius = 6;
        const height = 15;
        
        for (let i = 0; i < this.cubes.length; i++) {
            const t = (i / this.cubes.length) * Math.PI * 4;
            const y = (i / this.cubes.length - 0.5) * height;
            
            const x = radius * Math.cos(t);
            const z = radius * Math.sin(t);
            
            this.targetPositions[i].set(x, y, z);
        }
    }

    startPeriodicShapeChange() {
        const shapes = ['grid', 'tightCube', 'sphere', 'helix'];
        let currentShapeIndex = 0;
        
        setInterval(() => {
            currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
            
            switch (shapes[currentShapeIndex]) {
                case 'grid':
                    this.generateGridShape();
                    break;
                case 'tightCube':
                    this.generateTightCube();
                    break;
                case 'sphere':
                    this.generateSphere();
                    break;
                case 'helix':
                    this.generateHelix();
                    break;
            }
        }, 8000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Animate cubes to target positions
        for (let i = 0; i < this.cubes.length; i++) {
            const cube = this.cubes[i];
            const target = this.targetPositions[i];
            
            // Smooth movement to target position
            cube.position.lerp(target, 0.02);
            
            // Global rotation
            cube.rotation.x += this.globalRotation.x;
            cube.rotation.y += this.globalRotation.y;
            cube.rotation.z += this.globalRotation.z;
            
            // Subtle floating animation
            cube.position.y += Math.sin(time + i * 0.1) * 0.01;
        }
        
        // Gentle camera rotation
        this.camera.position.x = Math.cos(time * 0.1) * 35;
        this.camera.position.z = Math.sin(time * 0.1) * 35;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the cubes background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CubesBackground();
});
