import * as THREE from 'three';
import './style.css';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { LineBasicMaterial, EdgesGeometry } from 'three';

interface TextLink {
    text: string;
    link: string;
    subtitle?: string;
}

const textLinks: TextLink[] = [
    { text: 'elijah', link: 'https://elijer.github.io/garden/', subtitle: 'Fullstack Engineer' },
    { text: 'linkedin', link: 'https://www.linkedin.com/in/eliken/' },
    { text: 'portfolio', link: 'https://elijahkennedy.com/' },
    { text: 'resume', link: 'https://docs.google.com/document/d/1Ro5m4rc0K3R9cp_rjB0Fiy0Z3pVhYxavZLxaeGassks/edit?usp=sharing' },
];

class InteractiveTextScene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private textMeshes: THREE.Mesh[] = [];
    private boxMeshes: THREE.Mesh[] = [];
    private boxRotationSpeeds: number[] = [];
    private canvas: HTMLCanvasElement;
    private originalColors: number[] = [];
    private hitAreaMeshes: THREE.Mesh[] = [];
    private clickedIndices: Set<number> = new Set();
    private textScales: { current: number; target: number }[] = [];
    private lastTime: number = 0;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = document.createElement('canvas');
        this.init();
    }

    private init(): void {
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.body.appendChild(this.canvas);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        let back = 40

        this.camera.position.z = back
        this.camera.rotation.x = .2;
        this.camera.position.x = 3;
        this.camera.position.y = -10

        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 20);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        this.loadFont();

        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event), false);

        this.animate();
    }

    private loadFont(): void {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            this.createTextMeshes(font);
        });
    }

    private createTextMeshes(font: Font): void {
        const verticalSpacing = 8; // Vertical spacing between items
        const totalHeight = (textLinks.length - 1) * verticalSpacing;
        let currentY = totalHeight / 2;

        textLinks.forEach((item, index) => {
            const textGeometry = new TextGeometry(item.text, {
                font: font,
                size: 3,
                height: .05,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });

            const color = this.getTextColor(index);
            this.originalColors.push(color);
            const textMaterial = new THREE.MeshPhongMaterial({ color: color });
            const textMesh = new THREE.Mesh(textGeometry as THREE.BufferGeometry<THREE.NormalBufferAttributes>, textMaterial);
            textMesh.position.set(0, currentY, 0); // Centered horizontally, spread vertically

            this.scene.add(textMesh);
            this.textMeshes.push(textMesh);

            // Create a larger, invisible hit area mesh
            const hitAreaGeometry = new THREE.PlaneGeometry(10, 5); // Adjust size as needed
            const hitAreaMaterial = new THREE.MeshBasicMaterial({ visible: false });
            const hitAreaMesh = new THREE.Mesh(hitAreaGeometry, hitAreaMaterial);
            hitAreaMesh.position.copy(textMesh.position);
            hitAreaMesh.position.z = 1; // Slightly in front of the text
            this.scene.add(hitAreaMesh);
            this.hitAreaMeshes.push(hitAreaMesh);

            // Create corresponding box
            const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
            const boxEdges = new EdgesGeometry(boxGeometry);
            const boxMaterial = new LineBasicMaterial({ color: this.getBoxColor(index) });
            const boxMesh = new THREE.LineSegments(boxEdges, boxMaterial);
            boxMesh.position.set(-4, currentY, -2); // Place box to the left and behind text

            this.scene.add(boxMesh);
            this.boxMeshes.push(boxMesh);
            this.boxRotationSpeeds.push(Math.random() * 0.05 + 0.01);

            this.textScales.push({ current: 1, target: 1 });

            currentY -= verticalSpacing;
        });
    }

    private getTextColor(index: number): number {
        const colors = [
          0xF098C4, 0xFAE4E1, 0x96B3FF, 0x98C5D8
        ];
        return colors[index % colors.length];
    }

    private getBoxColor(index: number): number {
        const colors = [
          0xF098C4, 0xFAE4E1, 0x96B3FF, 0x98C5D8
        ];
        return colors[index % colors.length];
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private onMouseMove(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.hitAreaMeshes);

        this.textMeshes.forEach((mesh, index) => {
            if (intersects.length > 0 && intersects[0].object === this.hitAreaMeshes[index]) {
                this.textScales[index].target = 1.4; // Target scale when hovered
                this.boxRotationSpeeds[index] = 0.2; // Increase rotation speed when hovered
            } else {
                this.textScales[index].target = 1; // Target scale when not hovered
                this.boxRotationSpeeds[index] = Math.random() * 0.05 + 0.01; // Reset to random speed
            }
        });
    }

    private onMouseClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.hitAreaMeshes);

        if (intersects.length > 0) {
            const index = this.hitAreaMeshes.indexOf(intersects[0].object as THREE.Mesh);
            if (index !== -1) {
                (this.textMeshes[index].material as THREE.MeshPhongMaterial).color.setHex(0xFFFFFF); // Bright white
                this.clickedIndices.add(index);
                window.open(textLinks[index].link, '_blank', 'noopener,noreferrer');
            }
        }
    }

    private animate(time: number): void {
        requestAnimationFrame((t) => this.animate(t));

        const deltaTime = (time - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = time;

        this.textMeshes.forEach((mesh, index) => {
            // Interpolate scale
            const scale = this.textScales[index];
            scale.current += (scale.target - scale.current) * Math.min(deltaTime / 0.5, 1);
            mesh.scale.setScalar(scale.current);

            // Apply waving effect
            mesh.scale.y *= 1 + Math.sin(time * 0.005 + index) * 0.05;

            // Update corresponding box position and rotation
            const boxMesh = this.boxMeshes[index];
            boxMesh.position.copy(mesh.position).add(new THREE.Vector3(-4 * scale.current, 0, -2));
            boxMesh.scale.setScalar(scale.current);
            
            // Rotate the box
            boxMesh.rotation.x += this.boxRotationSpeeds[index];
            boxMesh.rotation.y += this.boxRotationSpeeds[index];
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the scene
new InteractiveTextScene();