import type { Character } from '../types/Character';

/**
 * CHARACTER PREVIEW
 * 
 * Displays a simple colored placeholder for characters.
 * WebGL rendering disabled to prevent context exhaustion (60+ contexts exceeded browser limit).
 */
export class CharacterPreview {
    private placeholder: HTMLDivElement;

    constructor(container: HTMLElement, character: Character) {
        // Create a simple colored div placeholder instead of WebGL renderer
        this.placeholder = document.createElement('div');
        this.placeholder.style.width = '100%';
        this.placeholder.style.height = '100%';
        this.placeholder.style.backgroundColor = character.visual.color;
        this.placeholder.style.borderRadius = '8px';
        this.placeholder.style.display = 'flex';
        this.placeholder.style.alignItems = 'center';
        this.placeholder.style.justifyContent = 'center';
        this.placeholder.style.fontSize = '2rem';
        this.placeholder.style.fontWeight = 'bold';
        this.placeholder.style.color = 'rgba(255, 255, 255, 0.8)';
        this.placeholder.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';

        // Display first letter of character name
        this.placeholder.textContent = character.name.charAt(0).toUpperCase();

        console.log('CharacterPreview created:', {
            name: character.name,
            color: character.visual.color,
            container: container,
            placeholder: this.placeholder
        });

        container.appendChild(this.placeholder);
    }

    public dispose(): void {
        if (this.placeholder && this.placeholder.parentElement) {
            this.placeholder.remove();
        }
    }
}
