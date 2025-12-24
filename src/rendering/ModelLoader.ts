import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

/**
 * MODEL LOADER
 * 
 * Handles loading external 3D models (GLB/GLTF) for characters.
 * Caches loaded models for performance.
 */
export class ModelLoader {
    private static loader = new GLTFLoader();
    private static cache = new Map<string, THREE.Group>();

    /**
     * Load a GLB/GLTF model from a file path
     * @param path Path to the model file (relative to public directory)
     * @param scale Optional scale factor (default: 1)
     * @returns Promise resolving to a THREE.Group containing the model
     */
    public static async loadModel(path: string, scale: number = 1): Promise<THREE.Group> {
        // Check cache first
        if (this.cache.has(path)) {
            const cached = this.cache.get(path)!;
            return cached.clone();
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;

                    // Apply scale
                    model.scale.set(scale, scale, scale);

                    // Center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    // Ensure model sits on ground (y=0)
                    const minY = box.min.y;
                    model.position.y -= minY;

                    // Cache the model
                    this.cache.set(path, model);

                    resolve(model.clone());
                },
                (progress) => {
                    // Optional: Log loading progress
                    const percentComplete = (progress.loaded / progress.total) * 100;
                    console.log(`Loading ${path}: ${percentComplete.toFixed(0)}%`);
                },
                (error) => {
                    console.error(`Error loading model ${path}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Clear the model cache
     */
    public static clearCache(): void {
        this.cache.clear();
    }
}
