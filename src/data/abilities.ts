/**
 * ABILITY DATABASE
 * 
 * Defines all abilities for the 19 characters in the game.
 * Each character has 3 abilities: 1 basic (always available) + 2 specials (2-turn cooldown)
 */

import type { Ability } from '../types/Character';

// ===== THE ONLY BRU =====
export const BRU_ABILITIES: Ability[] = [
    {
        id: 'bru_basic',
        name: 'Heavy Swing',
        description: 'Deals solid damage to a single enemy.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'bru_special1',
        name: 'Bru Force',
        description: 'Grants Attack Up to self for 4 turns.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    },
    {
        id: 'bru_special2',
        name: 'Shake It Off',
        description: 'Grants Defence Up to self for 4 turns.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'defence_up', duration: 4 }]
    }
];

// ===== JATT =====
export const JATT_ABILITIES: Ability[] = [
    {
        id: 'jatt_basic',
        name: 'Quick Shot',
        description: 'Fast single-target attack.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'jatt_special1',
        name: 'Lock On',
        description: 'Applies Marked to an enemy for 4 turns. This unit cannot dodge attacks and is easier to hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'marked', duration: 4 }]
    },
    {
        id: 'jatt_special2',
        name: 'Flashbang',
        description: 'Applies Stun to a single enemy. This unit skips its next turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'stun', duration: 4 }]
    }
];

// ===== PUREZION1 =====
export const PURE_ABILITIES: Ability[] = [
    {
        id: 'pure_basic',
        name: 'Clean Strike',
        description: 'Precise single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'pure_special1',
        name: 'Focus Fire',
        description: 'Applies Vulnerable to an enemy. This unit takes increased damage from all sources.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'vulnerable', duration: 4 }]
    },
    {
        id: 'pure_special2',
        name: 'Overclock',
        description: 'Grants Attack Up to self. This unit deals increased damage.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    }
];

// ===== ZDB =====
export const ZDB_ABILITIES: Ability[] = [
    {
        id: 'zdb_basic',
        name: 'Disruptor Hit',
        description: 'Deals damage with a chance to annoy.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'zdb_special1',
        name: 'System Jam',
        description: 'Applies Silenced to an enemy. This unit cannot use special abilities and can only perform basic attacks.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'silenced', duration: 4 }]
    },
    {
        id: 'zdb_special2',
        name: 'EMP Pulse',
        description: 'Applies Stun to all enemies (short duration). These units skip their next turn.',
        type: 'special',
        cooldown: 2,
        target: 'all_enemies',
        effects: [{ type: 'apply_status', statusType: 'stun', duration: 4 }]
    }
];

// ===== KAPPYJJK =====
export const KAPPY_ABILITIES: Ability[] = [
    {
        id: 'kappy_basic',
        name: 'Swift Jab',
        description: 'Light damage, quick animation.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'kappy_special1',
        name: 'Evasive Roll',
        description: 'Grants Evasion Up to self. This unit has a higher chance to dodge attacks.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'evasion_up', duration: 4 }]
    },
    {
        id: 'kappy_special2',
        name: 'Riposte',
        description: 'Grants Counter for 2 turns. This unit automatically attacks back when hit.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'counter', duration: 4 }]
    }
];

// ===== FAZOID =====
export const FAZOID_ABILITIES: Ability[] = [
    {
        id: 'fazoid_basic',
        name: 'Phase Strike',
        description: 'Single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'fazoid_special1',
        name: 'Phase Shift',
        description: 'Grants Evasion Up to self. This unit has a higher chance to dodge attacks.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'evasion_up', duration: 4 }]
    },
    {
        id: 'fazoid_special2',
        name: 'Reality Burn',
        description: 'Applies Damage Over Time to an enemy. This unit takes damage at the start of each turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'dot', duration: 6, value: 10 }]
    }
];

// ===== MERCYMAIN =====
export const MERCY_ABILITIES: Ability[] = [
    {
        id: 'mercy_basic',
        name: 'Sidearm Shot',
        description: 'Low damage attack.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'mercy_special1',
        name: 'Healing Aura',
        description: 'Grants Regen to all allies. These units recover health at the start of each turn.',
        type: 'special',
        cooldown: 2,
        target: 'all_allies',
        effects: [{ type: 'apply_status', statusType: 'regen', duration: 6, value: 15 }]
    },
    {
        id: 'mercy_special2',
        name: 'Protective Boost',
        description: 'Grants Defence Up to all allies. These units take reduced damage from attacks.',
        type: 'special',
        cooldown: 2,
        target: 'all_allies',
        effects: [{ type: 'apply_status', statusType: 'defence_up', duration: 4 }]
    }
];

// ===== PAPAKLIT =====
export const PAPA_ABILITIES: Ability[] = [
    {
        id: 'papa_basic',
        name: 'Dad Slap',
        description: 'Surprisingly effective damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'papa_special1',
        name: 'Tactical Advice',
        description: 'Grants Attack Up to all allies. These units deal increased damage.',
        type: 'special',
        cooldown: 2,
        target: 'all_allies',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    },
    {
        id: 'papa_special2',
        name: 'Hold the Line',
        description: 'Grants Defence Up to all allies. These units take reduced damage from attacks.',
        type: 'special',
        cooldown: 2,
        target: 'all_allies',
        effects: [{ type: 'apply_status', statusType: 'defence_up', duration: 4 }]
    }
];

// ===== GURUTIKI =====
export const GURU_ABILITIES: Ability[] = [
    {
        id: 'guru_basic',
        name: 'Guiding Strike',
        description: 'Balanced damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'guru_special1',
        name: 'Inner Focus',
        description: 'Grants Regen and Evasion Up to self. This unit recovers health and has higher dodge chance.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [
            { type: 'apply_status', statusType: 'regen', duration: 6, value: 12 },
            { type: 'apply_status', statusType: 'evasion_up', duration: 4 }
        ]
    },
    {
        id: 'guru_special2',
        name: 'Enlighten',
        description: 'Applies Vulnerable to all enemies. These units take increased damage from all sources.',
        type: 'special',
        cooldown: 2,
        target: 'all_enemies',
        effects: [{ type: 'apply_status', statusType: 'vulnerable', duration: 4 }]
    }
];

// ===== JB =====
export const JB_ABILITIES: Ability[] = [
    {
        id: 'jb_basic',
        name: 'Straight Punch',
        description: 'Reliable single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'jb_special1',
        name: 'Crowd Control',
        description: 'Applies Stun to an enemy. This unit skips its next turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'stun', duration: 4 }]
    },
    {
        id: 'jb_special2',
        name: 'Pressure Play',
        description: 'Applies Marked to an enemy. This unit cannot dodge attacks and is easier to hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'marked', duration: 4 }]
    }
];

// ===== KAPPASAURUS =====
export const KAPPA_ABILITIES: Ability[] = [
    {
        id: 'kappa_basic',
        name: 'Tail Whip',
        description: 'Heavy damage to one enemy.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'kappa_special1',
        name: 'Dino Roar',
        description: 'Applies Vulnerable to all enemies. These units take increased damage from all sources.',
        type: 'special',
        cooldown: 2,
        target: 'all_enemies',
        effects: [{ type: 'apply_status', statusType: 'vulnerable', duration: 4 }]
    },
    {
        id: 'kappa_special2',
        name: 'Thick Scales',
        description: 'Grants Defence Up to self. This unit takes reduced damage from attacks.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'defence_up', duration: 4 }]
    }
];

// ===== BIG SUZE =====
export const SUZE_ABILITIES: Ability[] = [
    {
        id: 'suze_basic',
        name: 'Big Hit',
        description: 'High base damage attack.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'suze_special1',
        name: 'No Dodging This',
        description: 'Applies Marked to an enemy. This unit cannot dodge attacks and is easier to hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'marked', duration: 4 }]
    },
    {
        id: 'suze_special2',
        name: 'Smash Back',
        description: 'Grants Counter to self. This unit automatically attacks back when hit.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'counter', duration: 4 }]
    }
];

// ===== TOXOPLASMOSIS =====
export const TOXO_ABILITIES: Ability[] = [
    {
        id: 'toxo_basic',
        name: 'Toxic Scratch',
        description: 'Applies light damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'toxo_special1',
        name: 'Infection',
        description: 'Applies Damage Over Time for 6 turns. This unit takes damage at the start of each turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'dot', duration: 6, value: 12 }]
    },
    {
        id: 'toxo_special2',
        name: 'Weaken Immune System',
        description: 'Applies Vulnerable. This unit takes increased damage from all sources.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'vulnerable', duration: 4 }]
    }
];

// ===== CUBER =====
export const CUBER_ABILITIES: Ability[] = [
    {
        id: 'cuber_basic',
        name: 'Precision Tap',
        description: 'Accurate single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'cuber_special1',
        name: 'Perfect Lines',
        description: 'Grants Attack Up to self. This unit deals increased damage.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    },
    {
        id: 'cuber_special2',
        name: 'Boxed In',
        description: 'Applies Silenced to an enemy. This unit cannot use special abilities and can only perform basic attacks.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'silenced', duration: 4 }]
    }
];

// ===== J-DOG =====
export const JDOG_ABILITIES: Ability[] = [
    {
        id: 'jdog_basic',
        name: 'Bite',
        description: 'Aggressive single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'jdog_special1',
        name: 'Ferocity',
        description: 'Grants Attack Up and Evasion Up to self. This unit deals increased damage and has higher dodge chance.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [
            { type: 'apply_status', statusType: 'attack_up', duration: 4 },
            { type: 'apply_status', statusType: 'evasion_up', duration: 4 }
        ]
    },
    {
        id: 'jdog_special2',
        name: 'Intimidate',
        description: 'Applies Marked to an enemy. This unit cannot dodge attacks and is easier to hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'marked', duration: 4 }]
    }
];

// ===== THORDOG =====
export const THOR_ABILITIES: Ability[] = [
    {
        id: 'thor_basic',
        name: 'Thunder Strike',
        description: 'Heavy damage attack.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'thor_special1',
        name: 'Lightning Stun',
        description: 'Applies Stun to an enemy. This unit skips its next turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'stun', duration: 4 }]
    },
    {
        id: 'thor_special2',
        name: 'Storm Rage',
        description: 'Grants Attack Up to self. This unit deals increased damage.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    }
];

// ===== EL KAPPITAN =====
export const ELK_ABILITIES: Ability[] = [
    {
        id: 'elk_basic',
        name: 'Command Shot',
        description: 'Moderate damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'elk_special1',
        name: 'Rally the Squad',
        description: 'Grants Attack Up to all allies. These units deal increased damage.',
        type: 'special',
        cooldown: 2,
        target: 'all_allies',
        effects: [{ type: 'apply_status', statusType: 'attack_up', duration: 4 }]
    },
    {
        id: 'elk_special2',
        name: 'Tactical Mark',
        description: 'Applies Marked to a priority enemy. This unit cannot dodge attacks and is easier to hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'marked', duration: 4 }]
    }
];

// ===== ZEZIMA =====
export const ZEZ_ABILITIES: Ability[] = [
    {
        id: 'zez_basic',
        name: 'Legacy Strike',
        description: 'Balanced, dependable damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'zez_special1',
        name: 'Old School Focus',
        description: 'Grants Regen and Defence Up to self. This unit recovers health and takes reduced damage.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [
            { type: 'apply_status', statusType: 'regen', duration: 6, value: 20 },
            { type: 'apply_status', statusType: 'defence_up', duration: 4 }
        ]
    },
    {
        id: 'zez_special2',
        name: 'Timeless Pressure',
        description: 'Applies Vulnerable. This unit takes increased damage from all sources.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'vulnerable', duration: 4 }]
    }
];

// ===== DAFRAN =====
export const DAFRAN_ABILITIES: Ability[] = [
    {
        id: 'dafran_basic',
        name: 'Headshot',
        description: 'High single-target damage.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'dafran_special1',
        name: 'Aim God',
        description: 'Grants Attack Up to self and applies Marked to the target. Increased damage and guaranteed hit.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [
            { type: 'apply_status', statusType: 'attack_up', duration: 4, target: 'self' },
            { type: 'apply_status', statusType: 'marked', duration: 4 }
        ]
    },
    {
        id: 'dafran_special2',
        name: 'Zone Control',
        description: 'Applies Stun to an enemy. This unit skips its next turn.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'stun', duration: 4 }]
    }
];

// ===== NEXUS =====
export const NEXUS_ABILITIES: Ability[] = [
    {
        id: 'nexus_basic',
        name: 'Precision Beam',
        description: 'Calculated energy attack.',
        type: 'basic',
        cooldown: 0,
        target: 'single_enemy',
        effects: [{ type: 'damage' }]
    },
    {
        id: 'nexus_special1',
        name: 'Energy Shield',
        description: 'Grants Defence Up to self. This unit takes reduced damage from attacks.',
        type: 'special',
        cooldown: 2,
        target: 'self',
        effects: [{ type: 'apply_status', statusType: 'defence_up', duration: 4 }]
    },
    {
        id: 'nexus_special2',
        name: 'System Override',
        description: 'Applies Silenced to an enemy. This unit cannot use special abilities and can only perform basic attacks.',
        type: 'special',
        cooldown: 2,
        target: 'single_enemy',
        effects: [{ type: 'apply_status', statusType: 'silenced', duration: 4 }]
    }
];

// Ability lookup by character ID
export function getAbilitiesForCharacter(characterId: string): Ability[] {
    const abilityMap: Record<string, Ability[]> = {
        'char_bru': BRU_ABILITIES,
        'char_jatt': JATT_ABILITIES,
        'char_pure': PURE_ABILITIES,
        'char_zdb': ZDB_ABILITIES,
        'char_kappy': KAPPY_ABILITIES,
        'char_fazoid': FAZOID_ABILITIES,
        'char_mercy': MERCY_ABILITIES,
        'char_papa': PAPA_ABILITIES,
        'char_guru': GURU_ABILITIES,
        'char_jb': JB_ABILITIES,
        'char_kappa': KAPPA_ABILITIES,
        'char_suze': SUZE_ABILITIES,
        'char_toxo': TOXO_ABILITIES,
        'char_cuber': CUBER_ABILITIES,
        'char_jdog': JDOG_ABILITIES,
        'char_thor': THOR_ABILITIES,
        'char_elk': ELK_ABILITIES,
        'char_zez': ZEZ_ABILITIES,
        'char_daf': DAFRAN_ABILITIES,
        'char_nexus': NEXUS_ABILITIES
    };

    return abilityMap[characterId] || [];
}
