import * as THREE from 'three';
import { ModelLoader } from './ModelLoader';

/**
 * MODEL FACTORY
 * 
 * Handles both procedural generation and external model loading.
 * Uses character modelType (cube, sphere, cylinder, custom) for rendering.
 */
export class ModelFactory {
    /**
     * Create a 3D model group - either procedural or from external file
     * @param primaryColor Primary color for procedural models
     * @param modelType Type of model to create
     * @param modelPath Optional path to external GLB file (for 'custom' type)
     * @returns Promise resolving to THREE.Group
     */
    public static async createModel(
        primaryColor: string,
        modelType: 'cube' | 'sphere' | 'cylinder' | 'custom' = 'cube',
        modelPath?: string
    ): Promise<THREE.Group> {
        // If custom model with path, load external file
        if (modelType === 'custom' && modelPath) {
            try {
                const model = await ModelLoader.loadModel(modelPath, 0.8);
                return model;
            } catch (error) {
                console.error(`Failed to load custom model ${modelPath}, falling back to cube:`, error);
                // Fall back to procedural cube if loading fails
                return this.createProceduralModel(primaryColor, 'cube');
            }
        }

        // Otherwise create procedural model
        // Type guard: custom should have been handled above, so cast is safe
        const proceduralType = modelType === 'custom' ? 'cube' : modelType;
        return this.createProceduralModel(primaryColor, proceduralType);
    }

    /**
     * Create a simple procedural 3D model (synchronous)
     */
    private static createProceduralModel(
        primaryColor: string,
        modelType: 'cube' | 'sphere' | 'cylinder'
    ): THREE.Group {
        const group = new THREE.Group();
        const color = new THREE.Color(primaryColor);

        // Define materials
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.5,
            roughness: 0.2
        });

        // Create geometry based on modelType
        let geometry: THREE.BufferGeometry;
        switch (modelType) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.6, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                break;
            case 'cube':
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.5; // Offset to sit on ground
        group.add(mesh);

        // Add a simple "face" or "front" indicator (a small white box for eyes)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);

        leftEye.position.set(-0.2, 0.7, 0.5);
        rightEye.position.set(0.2, 0.7, 0.5);

        // Adjust eye position for internal mesh centers
        if (modelType === 'sphere') {
            leftEye.position.set(-0.2, 0.7, 0.45);
            rightEye.position.set(0.2, 0.7, 0.45);
        } else if (modelType === 'cylinder') {
            leftEye.position.set(-0.2, 0.7, 0.5);
            rightEye.position.set(0.2, 0.7, 0.5);
        }

        group.add(leftEye, rightEye);

        return group;
    }
}

