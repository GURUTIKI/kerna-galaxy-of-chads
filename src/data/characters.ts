/**
 * CHARACTER DATABASE
 * 
 * Kerna: Galaxy of Chads character roster
 * 19 unique named characters for collection and battle
 */

import { createCharacter } from '../types/Character';
import type { Character } from '../types/Character';
import { getAbilitiesForCharacter } from './abilities';

// All characters available in the game
export const ALL_CHARACTERS: Character[] = [
    createCharacter({
        id: 'char_jatt',
        name: 'Jatt',
        description: 'The OG Sniper.',
        abilities: getAbilitiesForCharacter('char_jatt'),
        stats: {
            maxHealth: 50,
            attack: 15,
            defense: 5,
            speed: 12,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#4facfe', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_pure',
        name: 'Purezion1',
        description: 'Sleek Cyborg.',
        abilities: getAbilitiesForCharacter('char_pure'),
        stats: {
            maxHealth: 45,
            attack: 12,
            defense: 2,
            speed: 15,
            healthSteal: 0,
            evasion: 10,
            accuracy: 95,
            critChance: 15,
            critDamage: 50
        },
        visual: { color: '#aaaaaa', modelType: 'sphere' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_zdb',
        name: 'ZDB',
        description: 'Tactical Tech.',
        abilities: getAbilitiesForCharacter('char_zdb'),
        stats: {
            maxHealth: 40,
            attack: 18,
            defense: 3,
            speed: 14,
            healthSteal: 0,
            evasion: 8,
            accuracy: 85,
            critChance: 25,
            critDamage: 75
        },
        visual: { color: '#f5576c', modelType: 'cylinder' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_kappy',
        name: 'Kappyjjk',
        description: 'Martial Artist.',
        abilities: getAbilitiesForCharacter('char_kappy'),
        stats: {
            maxHealth: 75,
            attack: 8,
            defense: 12,
            speed: 8,
            healthSteal: 5,
            evasion: 0,
            accuracy: 80,
            critChance: 0,
            critDamage: 50
        },
        visual: { color: '#43e97b', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_fazoid',
        name: 'Fazoid',
        description: 'Energy Being.',
        abilities: getAbilitiesForCharacter('char_fazoid'),
        stats: {
            maxHealth: 35,
            attack: 20,
            defense: 2,
            speed: 18,
            healthSteal: 0,
            evasion: 25,
            accuracy: 100,
            critChance: 30,
            critDamage: 60
        },
        visual: { color: '#9932cc', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_mercy',
        name: 'Mercymain',
        description: 'Angelic Support.',
        abilities: getAbilitiesForCharacter('char_mercy'),
        stats: {
            maxHealth: 40,
            attack: 10,
            defense: 5,
            speed: 13,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#ffd700', modelType: 'sphere' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_papa',
        name: 'Papaklit',
        description: 'The Dad.',
        abilities: getAbilitiesForCharacter('char_papa'),
        stats: {
            maxHealth: 55,
            attack: 16,
            defense: 8,
            speed: 10,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 15,
            critDamage: 50
        },
        visual: { color: '#4169e1', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_guru',
        name: 'Gurutiki',
        description: 'Ancient Monk.',
        abilities: getAbilitiesForCharacter('char_guru'),
        stats: {
            maxHealth: 35,
            attack: 14,
            defense: 4,
            speed: 15,
            healthSteal: 0,
            evasion: 10,
            accuracy: 95,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#ff8c00', modelType: 'cylinder' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_jb',
        name: 'JB',
        description: 'Secret Agent.',
        abilities: getAbilitiesForCharacter('char_jb'),
        stats: {
            maxHealth: 45,
            attack: 15,
            defense: 5,
            speed: 12,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 15,
            critDamage: 50
        },
        visual: { color: '#000000', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_bru',
        name: 'The Only Bru',
        description: 'The Highlander.',
        abilities: getAbilitiesForCharacter('char_bru'),
        stats: {
            maxHealth: 50,
            attack: 15,
            defense: 6,
            speed: 11,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#1e90ff', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_kappa',
        name: 'Kappasaurus',
        description: 'Prehistoric Beast.',
        abilities: getAbilitiesForCharacter('char_kappa'),
        stats: {
            maxHealth: 80,
            attack: 10,
            defense: 10,
            speed: 6,
            healthSteal: 0,
            evasion: 0,
            accuracy: 85,
            critChance: 5,
            critDamage: 50
        },
        visual: { color: '#228b22', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_suze',
        name: 'Big Suze',
        description: 'Heavy Wrestler.',
        abilities: getAbilitiesForCharacter('char_suze'),
        stats: {
            maxHealth: 60,
            attack: 14,
            defense: 8,
            speed: 9,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#ff69b4', modelType: 'sphere' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_toxo',
        name: 'Toxoplasmosis',
        description: 'Plague Doctor.',
        abilities: getAbilitiesForCharacter('char_toxo'),
        stats: {
            maxHealth: 30,
            attack: 18,
            defense: 2,
            speed: 16,
            healthSteal: 10,
            evasion: 15,
            accuracy: 90,
            critChance: 20,
            critDamage: 60
        },
        visual: { color: '#adff2f', modelType: 'sphere' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_cuber',
        name: 'Cuber',
        description: 'Blocky Robot.',
        abilities: getAbilitiesForCharacter('char_cuber'),
        stats: {
            maxHealth: 50,
            attack: 12,
            defense: 12,
            speed: 10,
            healthSteal: 0,
            evasion: 0,
            accuracy: 100,
            critChance: 0,
            critDamage: 50
        },
        visual: { color: '#4b0082', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_jdog',
        name: 'J-Dog',
        description: 'The Beast.',
        abilities: getAbilitiesForCharacter('char_jdog'),
        stats: {
            maxHealth: 45,
            attack: 16,
            defense: 4,
            speed: 14,
            healthSteal: 0,
            evasion: 10,
            accuracy: 90,
            critChance: 15,
            critDamage: 50
        },
        visual: { color: '#8b4513', modelType: 'cylinder' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_thor',
        name: 'Thordog',
        description: 'Small God.',
        abilities: getAbilitiesForCharacter('char_thor'),
        stats: {
            maxHealth: 55,
            attack: 20,
            defense: 6,
            speed: 11,
            healthSteal: 0,
            evasion: 5,
            accuracy: 90,
            critChance: 25,
            critDamage: 80
        },
        visual: { color: '#708090', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_elk',
        name: 'El Kappitan',
        description: 'Pirate Captain.',
        abilities: getAbilitiesForCharacter('char_elk'),
        stats: {
            maxHealth: 50,
            attack: 15,
            defense: 8,
            speed: 12,
            healthSteal: 0,
            evasion: 5,
            accuracy: 95,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#000080', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_zez',
        name: 'Zezima',
        description: 'Legendary Boss.',
        abilities: getAbilitiesForCharacter('char_zez'),
        stats: {
            maxHealth: 100,
            attack: 5,
            defense: 20,
            speed: 5,
            healthSteal: 0,
            evasion: 0,
            accuracy: 100,
            critChance: 0,
            critDamage: 50
        },
        visual: { color: '#ffffff', modelType: 'cube' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_daf',
        name: 'Dafran',
        description: 'Pro Gamer.',
        abilities: getAbilitiesForCharacter('char_daf'),
        stats: {
            maxHealth: 35,
            attack: 25,
            defense: 2,
            speed: 15,
            healthSteal: 10,
            evasion: 10,
            accuracy: 80,
            critChance: 30,
            critDamage: 100
        },
        visual: { color: '#dc143c', modelType: 'cylinder' },
        isOwned: false
    }),
    createCharacter({
        id: 'char_nexus',
        name: 'Nexus',
        description: 'Optimized Warrior.',
        abilities: getAbilitiesForCharacter('char_nexus'),
        stats: {
            maxHealth: 60,
            attack: 12,
            defense: 15,
            speed: 10,
            healthSteal: 0,
            evasion: 5,
            accuracy: 95,
            critChance: 5,
            critDamage: 50
        },
        visual: {
            color: '#4facfe',
            modelType: 'custom',
            modelPath: '/Assets/nexus_armor.glb'
        },
        isOwned: false
    }),
    createCharacter({
        id: 'char_phil',
        name: 'Fresh Farmer Phil',
        description: 'Honest worker.',
        abilities: getAbilitiesForCharacter('char_phil'),
        stats: {
            maxHealth: 55,
            attack: 14,
            defense: 8,
            speed: 10,
            healthSteal: 0,
            evasion: 5,
            accuracy: 95,
            critChance: 10,
            critDamage: 50
        },
        visual: { color: '#daa520', modelType: 'cylinder' },
        isOwned: false
    })
];

// Helper to clone a character for battle (prevents modifying original data)
export function cloneCharacter(character: Character): Character {
    let cooldownsMap: Map<string, number>;
    if (character.abilityCooldowns instanceof Map) {
        cooldownsMap = new Map(character.abilityCooldowns);
    } else if (character.abilityCooldowns && typeof character.abilityCooldowns === 'object') {
        cooldownsMap = new Map(Object.entries(character.abilityCooldowns));
    } else {
        cooldownsMap = new Map();
    }

    const cloned: Character = {
        ...character,
        stats: { ...character.stats },
        visual: { ...character.visual },
        statusEffects: [], // Start fresh for battle clone
        abilities: character.abilities ? [...character.abilities] : [],
        abilityCooldowns: cooldownsMap,
    };
    return cloned;
}
