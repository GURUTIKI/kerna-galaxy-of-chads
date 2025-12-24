/**
 * CHARACTER MANAGER
 * 
 * Manages all characters in the game:
 * - Character roster
 * - Saving/loading from browser storage
 * - Stat allocation
 */

import type { Character } from '../types/Character';
import { ALL_CHARACTERS, cloneCharacter } from '../data/characters';
import { allocateStatPoint } from '../types/Character';

export class CharacterManager {
    private characters: Character[] = [];
    private storageKey = 'raid_galaxy_pvp_characters';
    private onDataSync?: (data: Character[]) => void;

    constructor() {
        // Load characters from storage or use defaults
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (Array.isArray(data) && data.length > 0) {
                    this.setCharacters(data); // Use setCharacters to handle Map conversion
                    return;
                }
            } catch (e) {
                console.error('Failed to parse stored characters:', e);
            }
        }
        this.characters = this.initializeNewGame();
    }

    /**
     * Set external data (e.g., from server)
     */
    public setCharacters(characters: any[]): void {
        if (!characters || !Array.isArray(characters)) {
            console.warn('Invalid characters data received, ignoring.');
            return;
        }

        this.characters = characters.map(char => {
            // Ensure properties added in newer versions (like abilities) are present
            const masterChar = ALL_CHARACTERS.find(c => c.id === char.id);
            if (masterChar) {
                // Handle abilityCooldowns Map conversion
                let cooldownsMap: Map<string, number>;
                if (char.abilityCooldowns instanceof Map) {
                    cooldownsMap = char.abilityCooldowns;
                } else if (char.abilityCooldowns && typeof char.abilityCooldowns === 'object') {
                    cooldownsMap = new Map(Object.entries(char.abilityCooldowns));
                } else {
                    cooldownsMap = new Map();
                }

                return {
                    ...masterChar, // Start with defaults
                    ...char,       // Apply saved values (level, stats, owned status)
                    abilities: masterChar.abilities, // FORCE abilities from master list
                    statusEffects: Array.isArray(char.statusEffects) ? char.statusEffects : [],
                    abilityCooldowns: cooldownsMap,
                    stats: {
                        ...masterChar.stats,
                        ...char.stats
                    }
                };
            }
            return cloneCharacter(char as Character);
        });
        this.saveToStorage();
    }

    /**
     * Register a callback for when data needs to be synced to server
     */
    public setSyncCallback(callback: (data: Character[]) => void): void {
        this.onDataSync = callback;
    }

    /**
     * Get all characters
     */
    public getAllCharacters(): Character[] {
        return this.characters;
    }

    /**
     * Get a specific character by ID
     */
    public getCharacterById(id: string): Character | undefined {
        return this.characters.find(char => char.id === id);
    }

    /**
     * Allocate a stat point for a character
     */
    public allocateStatForCharacter(characterId: string, stat: keyof Character['stats']): boolean {
        const character = this.getCharacterById(characterId);
        if (!character) return false;

        const success = allocateStatPoint(character, stat);
        if (success) {
            this.saveToStorage();
            this.triggerSync();
        }
        return success;
    }

    /**
     * Get a fresh copy of a character for battle (doesn't modify saved character)
     */
    public getCharacterForBattle(id: string): Character | null {
        const character = this.getCharacterById(id);
        if (!character) return null;
        return cloneCharacter(character);
    }

    /**
     * Update a character's data (e.g., after battle with XP)
     */
    public updateCharacter(updatedCharacter: Character): void {
        const index = this.characters.findIndex(char => char.id === updatedCharacter.id);
        if (index !== -1) {
            this.characters[index] = updatedCharacter;
            this.saveToStorage();
            this.triggerSync();
        }
    }

    /**
     * Get only owned characters
     */
    public getOwnedCharacters(): Character[] {
        return this.characters.filter(char => char.isOwned);
    }

    /**
     * Unlock a specific character
     */
    public unlockCharacter(id: string): boolean {
        const character = this.characters.find(c => c.id === id);
        if (character && !character.isOwned) {
            character.isOwned = true;
            this.saveToStorage();
            this.triggerSync();
            return true;
        }
        return false;
    }

    /**
     * Add a fragment to a character
     * Returns true if character was unlocked (reached 5 fragments)
     */
    public addFragment(id: string): boolean {
        const character = this.characters.find(c => c.id === id);
        if (!character) return false;

        if (character.isOwned) return false;

        character.fragments = (character.fragments || 0) + 1;

        let justUnlocked = false;
        if (character.fragments >= 5) {
            character.isOwned = true;
            justUnlocked = true;
        }

        this.saveToStorage();
        this.triggerSync();
        return justUnlocked;
    }

    private triggerSync(): void {
        if (this.onDataSync) {
            this.onDataSync(this.characters);
        }
    }

    /**
     * Save character data to browser's localStorage (fallback/local cache)
     */
    private saveToStorage(): void {
        try {
            const data = JSON.stringify(this.characters);
            localStorage.setItem(this.storageKey, data);
        } catch (error) {
            console.error('Failed to save characters:', error);
        }
    }

    /**
     * Initialize new game with one random starter character
     */
    public initializeNewGame(): Character[] {
        return ALL_CHARACTERS.map(char => cloneCharacter(char));
    }

    /**
     * Reset to default characters
     */
    public reset(): void {
        this.characters = this.initializeNewGame();
        this.saveToStorage();
        this.triggerSync();
    }
}
