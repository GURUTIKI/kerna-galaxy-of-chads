/**
 * SCENE MANAGER
 * 
 * Manages the 3D scene using Three.js:
 * - Creates the 3D world (scene, camera, lights)
 * - Renders characters as 3D models
 * - Handles animations
 */

import * as THREE from 'three';
import type { Character } from '../types/Character';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private characterModels: Map<string, THREE.Group> = new Map();


    constructor(container: HTMLElement) {
        // Create the 3D scene
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x0a0a0a); // Removed for background video transparency

        // Create camera (what we look through)
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            container.clientWidth / container.clientHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 5;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Add lights
        this.addLights();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(container));

        // Start animation loop
        this.animate();
    }

    private addLights(): void {
        // Ambient light (base illumination)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        // Directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Spot light for drama
        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(-5, 5, 5);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    /**
     * Create a 3D model for a character
     */
    public createCharacterModel(_character: Character, _position: THREE.Vector3): void {
        // Character models disabled for Alpha Build 2.1 (PVP Visual Effects focus)
    }

    /**
     * Clear all characters from scene
     */
    public clearAllCharacters(): void {
        this.characterModels.forEach(model => {
            this.scene.remove(model);
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.characterModels.clear();
    }

    /**
     * Update a character's visual state (e.g., death)
     */
    public setCharacterState(characterId: string, isDead: boolean): void {
        const model = this.characterModels.get(characterId);
        if (!model) return;

        if (isDead) {
            model.scale.set(0.5, 0.5, 0.5);
            model.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.color.set(0x333333);
                    child.material.transparent = true;
                    child.material.opacity = 0.4;
                }
            });
        }
    }

    /**
     * handle window resize
     */
    private onWindowResize(container: HTMLElement): void {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * Animation loop
     */
    private animate(): void {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.002;

        this.characterModels.forEach(model => {
            // Idle breathing effect (subtle scale/y oscillation)
            const breathing = Math.sin(time) * 0.02;
            model.position.y += breathing * 0.1;

            // Subtle rotation / floating
            model.rotation.y = Math.sin(time * 0.5) * 0.1;

            // Bobbing effect
            model.position.y += Math.sin(time * 0.8) * 0.001;
        });

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
