/**
 * CHARACTER TYPES
 * 
 * PVP-focused character system with customizable stat builds.
 * No classes, no abilities - pure stat-based combat.
 */

// Ability system types
export type AbilityType = 'basic' | 'special';

export type AbilityTarget = 'single_enemy' | 'all_enemies' | 'self' | 'all_allies' | 'single_ally';

export interface AbilityEffect {
  type: 'damage' | 'apply_status';
  statusType?: StatusEffectType;
  duration?: number;
  value?: number;
  target?: AbilityTarget; // Optional target override for specific effects
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  cooldown: number; // 0 for basic, 2 for specials
  target: AbilityTarget;
  effects: AbilityEffect[];
}

export type StatusEffectType =
  | 'stun'
  | 'regen'
  | 'defence_up'
  | 'attack_up'
  | 'vulnerable'
  | 'marked'
  | 'silenced'
  | 'evasion_up'
  | 'counter'
  | 'dot';

export interface StatusEffect {
  id: string; // Unique instance ID
  type: StatusEffectType;
  duration: number; // Turns remaining
  value?: number; // For DoT/Regen amounts (e.g. 50 for 50 damage/healing, or 50 for 50%)
  sourceId?: string; // Who applied it
}

// Main character interface - PVP focused
export interface Character {
  // Basic Info
  id: string;           // Unique ID (e.g., "char_001")
  name: string;         // Character name (e.g., "Red Cube")
  description: string;  // Brief description

  // Abilities
  abilities: Ability[];  // Character's 3 abilities (1 basic + 2 specials)
  abilityCooldowns: Map<string, number>; // Track remaining cooldown per ability

  // Status Effects
  statusEffects: StatusEffect[];

  // Combat Stats - all customizable through leveling
  stats: {
    maxHealth: number;      // Total health points
    currentHealth: number;  // Current health (changes in battle)
    attack: number;         // Base attack damage
    defense: number;        // Damage reduction
    speed: number;          // Determines turn order (higher = goes first)
    healthSteal: number;    // % of damage returned as healing (0-100)
    evasion: number;        // % chance to dodge attacks (0-100)
    accuracy: number;       // % chance to hit target (0-100)
    critChance: number;     // % chance for critical hit (0-100)
    critDamage: number;     // % bonus damage on crit (50 = 1.5x damage, 100 = 2x)
  };

  // Visual (for 3D rendering)
  visual: {
    color: string;        // Primary color (hex code like "#ff0000")
    secondaryColor?: string; // Optional accent color
    modelType: 'cube' | 'sphere' | 'cylinder' | 'custom'; // Shape for easy identification
    modelPath?: string;   // Path to GLB file for custom models
  };

  // Progression
  level: number;              // Character level (1-50)
  experience: number;         // Total XP earned
  availableStatPoints: number; // Unspent stat points from leveling
  isOwned: boolean;       // Whether player owns this character
  fragments: number;      // Collected fragments (5 needed to unlock)
}

// Helper function to create a new character with default values
// We define a flexible input type that allows partial stats
type CharacterInput = Omit<Partial<Character>, 'stats'> & {
  id: string;
  name: string;
  stats?: Partial<Character['stats']>; // Allow partial stats here
};

export function createCharacter(data: CharacterInput): Character {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    abilities: data.abilities || [],
    abilityCooldowns: new Map(),
    stats: {
      maxHealth: data.stats?.maxHealth || 100,
      currentHealth: data.stats?.currentHealth || data.stats?.maxHealth || 100,
      attack: data.stats?.attack || 10,
      defense: data.stats?.defense || 5,
      speed: data.stats?.speed || 50,
      healthSteal: data.stats?.healthSteal || 0,
      evasion: data.stats?.evasion || 5,
      accuracy: data.stats?.accuracy || 80,
      critChance: data.stats?.critChance || 5,
      critDamage: data.stats?.critDamage || 50,
    },
    visual: {
      color: data.visual?.color || '#888888',
      secondaryColor: data.visual?.secondaryColor,
      modelType: data.visual?.modelType || 'cube',
    },
    statusEffects: [], // Initialize empty
    level: data.level || 1,
    experience: data.experience || 0,
    availableStatPoints: data.availableStatPoints || 0,
    isOwned: data.isOwned ?? false,
    fragments: data.fragments || 0,
  };
}

// Calculate XP needed for next level (progressive scaling)
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= 50) return Infinity; // Max level
  return currentLevel * 100; // Level 1→2 = 100 XP, Level 2→3 = 200 XP, etc.
}

// Award XP and handle level ups
export function awardXP(character: Character, amount: number): boolean {
  character.experience += amount;

  let leveledUp = false;
  while (character.level < 50 && character.experience >= getXPForNextLevel(character.level)) {
    character.experience -= getXPForNextLevel(character.level);
    character.level++;
    character.availableStatPoints += 5; // 5 stat points per level
    leveledUp = true;
  }

  return leveledUp;
}

// Allocate a stat point to a specific stat
export function allocateStatPoint(
  character: Character,
  stat: keyof Character['stats']
): boolean {
  if (character.availableStatPoints <= 0) return false;

  // Prevent allocating to currentHealth (it's derived from maxHealth)
  if (stat === 'currentHealth') return false;

  // Cap percentage stats at 100
  const percentageStats = ['healthSteal', 'evasion', 'accuracy', 'critChance'];
  if (percentageStats.includes(stat) && character.stats[stat] >= 100) {
    return false;
  }

  character.stats[stat]++;
  character.availableStatPoints--;

  // If maxHealth increased, also increase currentHealth
  if (stat === 'maxHealth') {
    character.stats.currentHealth++;
  }

  return true;
}

// Helper to check if character is alive
export function isAlive(character: Character): boolean {
  return character.stats.currentHealth > 0;
}

// Helper to heal a character
export function healCharacter(character: Character, amount: number): void {
  character.stats.currentHealth = Math.min(
    character.stats.currentHealth + amount,
    character.stats.maxHealth
  );
}

// Helper to damage a character
export function damageCharacter(character: Character, amount: number): void {
  character.stats.currentHealth = Math.max(0, character.stats.currentHealth - amount);
}

// Reset character health to full (for new battles)
export function resetHealth(character: Character): void {
  character.stats.currentHealth = character.stats.maxHealth;
}

// --- Status Effect Helpers ---

export function addStatusEffect(character: Character, effect: StatusEffect): void {
  // Check if effect of same type exists from same source (refresh duration)
  const existing = character.statusEffects.find(e => e.type === effect.type && e.sourceId === effect.sourceId);
  if (existing) {
    existing.duration = effect.duration;
    existing.value = effect.value;
  } else {
    character.statusEffects.push(effect);
  }
}

export function removeStatusEffect(character: Character, effectId: string): void {
  character.statusEffects = character.statusEffects.filter(e => e.id !== effectId);
}

export function hasStatusEffect(character: Character, type: StatusEffectType): boolean {
  return character.statusEffects.some(e => e.type === type);
}

// --- Ability Helpers ---

export function initializeAbilityCooldowns(character: Character): void {
  character.abilityCooldowns = new Map();
  character.abilities.forEach(ability => {
    character.abilityCooldowns.set(ability.id, 0);
  });
}

export function decrementAbilityCooldowns(character: Character): void {
  character.abilities.forEach(ability => {
    const current = character.abilityCooldowns.get(ability.id) || 0;
    if (current > 0) {
      character.abilityCooldowns.set(ability.id, current - 1);
    }
  });
}

export function setAbilityCooldown(character: Character, abilityId: string, turns: number): void {
  character.abilityCooldowns.set(abilityId, turns);
}

export function isAbilityAvailable(character: Character, abilityId: string): boolean {
  const cooldown = character.abilityCooldowns.get(abilityId) || 0;
  return cooldown === 0;
}

export function getAvailableAbilities(character: Character): Ability[] {
  return character.abilities.filter(ability => isAbilityAvailable(character, ability.id));
}
