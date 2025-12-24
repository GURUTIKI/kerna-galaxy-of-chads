import * as THREE from 'three';
import { ModelFactory } from './ModelFactory';
import type { Character } from '../types/Character';

/**
 * CHARACTER PREVIEW
 * 
 * Manages a single-character 3D preview in a specific container.
 * Optimized for UI previews.
 */
export class CharacterPreview {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private model: THREE.Group | null = null;
    private frameId: number | null = null;

    constructor(container: HTMLElement, character: Character) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0.8, 3.5);
        this.camera.lookAt(0, 0.8, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);

        this.addLights();
        this.loadModel(character);
        this.animate();
    }

    private addLights(): void {
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambient);

        const fill = new THREE.DirectionalLight(0xffffff, 0.8);
        fill.position.set(-2, 2, 2);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffffff, 0.5);
        rim.position.set(2, 2, -2);
        this.scene.add(rim);
    }

    private async loadModel(character: Character): Promise<void> {
        this.model = await ModelFactory.createModel(
            character.visual.color,
            character.visual.modelType,
            character.visual.modelPath
        );
        this.scene.add(this.model);
    }

    private animate(): void {
        this.frameId = requestAnimationFrame(() => this.animate());

        if (this.model) {
            this.model.rotation.y += 0.01;
            this.model.position.y = Math.sin(Date.now() * 0.002) * 0.05;
        }

        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        if (this.frameId) cancelAnimationFrame(this.frameId);

        if (this.model) {
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        this.renderer.dispose();
        if (this.renderer.domElement.parentElement) {
            this.renderer.domElement.remove();
        }
    }
}
