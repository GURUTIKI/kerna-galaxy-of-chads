/**
 * COMBAT SYSTEM
 * 
 * PVP auto-battler combat logic:
 * - Turn-based automatic attacks
 * - Accuracy vs Evasion checks
 * - Critical hit system
 * - Health steal mechanic
 * - XP rewards after battle
 */

import { isAlive, damageCharacter, healCharacter, awardXP, resetHealth, hasStatusEffect, initializeAbilityCooldowns, decrementAbilityCooldowns, setAbilityCooldown, getAvailableAbilities } from '../types/Character';
import type { Character, StatusEffect, Ability } from '../types/Character';

// Represents one team in battle
export interface Team {
    name: string;           // Team name (e.g., "Your Team", "Opponent Team")
    characters: Character[]; // Array of characters in this team
    color: string;          // Team color for UI
}

// Represents the current state of a battle
export interface BattleState {
    playerTeam: Team;
    enemyTeam: Team;
    turnOrder: Character[];     // Order characters will take turns
    currentTurnIndex: number;   // Which character's turn it is
    battleLog: string[];        // History of what happened
    isOver: boolean;            // Is the battle finished?
    winner: 'player' | 'enemy' | null; // Who won?
    waitingForTargetSelection: boolean; // Is player selecting a target?
    availableTargets: Character[];     // Targets available for selection
    waitingForAbilitySelection: boolean; // Is player selecting an ability?
    selectedAbility: Ability | null;    // Currently selected ability
    loot?: { characterId: string };    // Loot dropped (sleeping bag)
}

export class CombatSystem {
    public state: BattleState; // Public for UI access
    private availableLootIds: string[];
    private xpMultiplier: number;
    public isPvP: boolean; // Public for external logic checks
    private onEmitAction?: (action: any) => void;
    private onBattleEnd?: (result: any) => void;
    private opponentUsername?: string;  // Store opponent name for battle results

    constructor(
        playerTeam: Team,
        enemyTeam: Team,
        availableLootIds: string[],
        xpMultiplier: number = 1.0,
        isPvP: boolean = false,
        onEmitAction?: (action: any) => void,
        onBattleEnd?: (result: any) => void,
        opponentUsername?: string
    ) {
        this.availableLootIds = availableLootIds;
        this.xpMultiplier = xpMultiplier;
        this.isPvP = isPvP;
        this.onEmitAction = onEmitAction;
        this.onBattleEnd = onBattleEnd;
        this.opponentUsername = opponentUsername;
        // Reset all character health before battle and assign instanceId
        [...playerTeam.characters, ...enemyTeam.characters].forEach(char => {
            if (!char.instanceId) {
                // Generate a simple unique ID for battle
                char.instanceId = `${char.id}_${Math.random().toString(36).substring(2, 9)}`;
            }
            resetHealth(char);
            initializeAbilityCooldowns(char);
        });

        this.state = {
            playerTeam,
            enemyTeam,
            turnOrder: [],
            currentTurnIndex: 0,
            battleLog: ['Battle started!'],
            isOver: false,
            winner: null,
            waitingForTargetSelection: false,
            availableTargets: [],
            waitingForAbilitySelection: false,
            selectedAbility: null,
        };

        this.calculateTurnOrder();
    }

    private battleSpeed: number = 1; // 1x, 2x, or 4x

    public setBattleSpeed(speed: number): void {
        this.battleSpeed = speed;
    }

    public getBattleSpeed(): number {
        return this.battleSpeed;
    }

    public forfeit(): void {
        this.state.isOver = true;
        this.state.winner = this.isPlayerCharacter(this.getCurrentCharacter()!)
            ? 'enemy'
            : 'player';
        this.addToLog('Battle forfeited!');
        this.awardPostBattleXP();
    }

    /**
     * Get current battle state
     */
    public getState(): BattleState {
        return this.state;
    }

    /**
     * Determine turn order based on Speed
     */
    private calculateTurnOrder(): void {
        const allCharacters = [
            ...this.state.playerTeam.characters,
            ...this.state.enemyTeam.characters
        ].filter(isAlive);

        // Sort by speed (highest speed goes first), then by instanceId for deterministic PVP sync
        this.state.turnOrder = allCharacters.sort((a, b) => {
            if (b.stats.speed !== a.stats.speed) return b.stats.speed - a.stats.speed;
            const idA = a.instanceId || a.id;
            const idB = b.instanceId || b.id;
            return idA.localeCompare(idB);
        });
    }

    /**
     * Get the character who is currently acting
     */
    public getCurrentCharacter(): Character | null {
        if (this.state.isOver || this.state.turnOrder.length === 0) return null;
        return this.state.turnOrder[this.state.currentTurnIndex];
    }

    /**
     * Check if a character belongs to player (Reference check for unique identity)
     */
    public isPlayerCharacter(character: Character): boolean {
        return this.state.playerTeam.characters.includes(character);
    }

    /**
     * Get the enemy team for a given character
     */
    private getEnemyTeam(character: Character): Team {
        return this.isPlayerCharacter(character)
            ? this.state.enemyTeam
            : this.state.playerTeam;
    }

    // ... (skipping unchanged methods if possible, but replace_file_content works on contiguous blocks)
    // Actually I can just target the methods I need.
    // I need isPlayerCharacter (line 114) and awardPostBattleXP (line 305).
    // They are far apart. I should use MultiReplace or two calls.
    // I'll stick to replacing the big block or separate.
    // Let's replace awardPostBattleXP first.


    /**
     * Get available targets for the current character
     */
    public getAvailableTargets(): Character[] {
        const attacker = this.getCurrentCharacter();
        if (!attacker) return [];

        if (this.state.selectedAbility) {
            const targetType = this.state.selectedAbility.target;
            if (targetType === 'single_enemy') {
                const enemyTeam = this.getEnemyTeam(attacker);
                return enemyTeam.characters.filter(isAlive);
            } else if (targetType === 'single_ally') {
                const allyTeam = this.isPlayerCharacter(attacker) ? this.state.playerTeam : this.state.enemyTeam;
                return allyTeam.characters.filter(isAlive);
            } else if (targetType === 'self') {
                return [attacker];
            } else if (targetType === 'all_enemies') {
                const enemyTeam = this.getEnemyTeam(attacker);
                return enemyTeam.characters.filter(isAlive);
            } else if (targetType === 'all_allies') {
                const allyTeam = this.isPlayerCharacter(attacker) ? this.state.playerTeam : this.state.enemyTeam;
                return allyTeam.characters.filter(isAlive);
            }
        }

        const enemyTeam = this.getEnemyTeam(attacker);
        return enemyTeam.characters.filter(isAlive);
    }

    /**
     * Select a target for the current player character
     */
    public selectTarget(targetId: string): boolean {
        if (!this.state.waitingForTargetSelection) return false;

        const targets = this.getAvailableTargets();
        // Check by instanceId first (if passed), then fallback to standard id
        let target = targets.find(t => t.instanceId === targetId);
        if (!target) {
            target = targets.find(t => t.id === targetId);
        }

        if (target) {
            this.state.waitingForTargetSelection = false;
            this.executeAttack(this.getCurrentCharacter()!, target, this.state.selectedAbility!);
            return true;
        }
        return false;
    }

    /**
     * Select an ability for the current player character
     */
    public selectAbility(abilityId: string): boolean {
        if (!this.state.waitingForAbilitySelection) return false;

        const attacker = this.getCurrentCharacter();
        if (!attacker) return false;

        const ability = attacker.abilities.find(a => a.id === abilityId);
        if (!ability) return false;

        // Check if ability is available (not on cooldown, or not silenced for specials)
        const cooldown = attacker.abilityCooldowns.get(abilityId) || 0;
        if (cooldown > 0) return false;

        // If silenced, can only use basic attacks
        if (hasStatusEffect(attacker, 'silenced') && ability.type === 'special') {
            this.addToLog(`${attacker.name} is silenced and cannot use special abilities!`);
            return false;
        }

        this.state.selectedAbility = ability;
        this.state.waitingForAbilitySelection = false;

        // If ability targets self or all, we used to execute immediately.
        // User Request: "have the moves on screen at all times so i can cjhange my mind"
        // So we now REQUIRE target selection (confirmation) even for these.
        // For 'self', user clicks self. For 'all', user clicks any valid target.

        /* 
        PREVIOUS AUTO-EXECUTE REMOVED
        if (ability.target === 'self' || ability.target === 'all_enemies' || ability.target === 'all_allies') {
            const target = attacker; 
            this.executeAttack(attacker, target, ability);
            return true;
        }
        */

        // Now wait for target selection for ALL ability types
        this.state.waitingForTargetSelection = true;
        this.state.availableTargets = this.getAvailableTargets();

        return true;
    }

    /**
     * Execute turn for the current character
     * Returns true if turn completed, false if waiting for input
     */
    public executeTurn(isAuto: boolean = false): boolean {
        const attacker = this.getCurrentCharacter();
        if (!attacker || this.state.isOver) return false;

        // --- Start of Turn Effects ---

        // 1. Regen
        const regenEffect = attacker.statusEffects.find(e => e.type === 'regen');
        if (regenEffect) {
            const healAmount = regenEffect.value || Math.floor(attacker.stats.maxHealth * 0.1); // Default 10%
            healCharacter(attacker, healAmount);
            this.addToLog(`${attacker.name} regenerates ${healAmount} HP.`);
        }

        // 2. Damage Over Time (DoT)
        const dotEffects = attacker.statusEffects.filter(e => e.type === 'dot');
        for (const dot of dotEffects) {
            const damageAmount = dot.value || Math.floor(attacker.stats.maxHealth * 0.05); // Default 5%
            damageCharacter(attacker, damageAmount);
            this.addToLog(`${attacker.name} takes ${damageAmount} damage from DoT!`);
        }

        if (!isAlive(attacker)) {
            this.addToLog(`${attacker.name} succumbed to damage over time!`);
            this.endTurn();
            return true;
        }

        // 3. Stun
        if (hasStatusEffect(attacker, 'stun')) {
            this.addToLog(`${attacker.name} is stunned and skips their turn!`);
            this.endTurn();
            return true;
        }

        // If it's player's turn...
        if (this.isPlayerCharacter(attacker)) {

            // Should we run AI?
            // Only if Auto Battle is ON (PVP allowed now)
            const shouldRunAI = isAuto;

            if (shouldRunAI) {
                return this.executeAILogic(attacker);
            }

            // Manual Mode (PVP or PVE Manual)
            if (!this.state.waitingForAbilitySelection && !this.state.waitingForTargetSelection) {
                this.state.waitingForAbilitySelection = true;
                return false; // Waiting for ability selection
            }
            return false; // Still waiting for ability or target
        }

        // --- ENEMY CHARACTER TURN ---

        // IF PVP: Wait for remote action
        if (this.isPvP) {
            return false;
        }

        // IF PVE: Run AI
        return this.executeAILogic(attacker);
    }

    private executeAILogic(attacker: Character): boolean {
        const availableAbilities = getAvailableAbilities(attacker);
        const ability = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];

        const enemyTeam = this.getEnemyTeam(attacker);
        const aliveEnemies = enemyTeam.characters.filter(isAlive);

        if (aliveEnemies.length === 0) {
            this.checkBattleEnd();
            return false;
        }

        const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        this.executeAttack(attacker, target, ability);
        return true;
    }

    // Interface for deterministic results
    private calculateDamageOutcome(attacker: Character, target: Character): any {
        // Step 1: Accuracy Check
        let accuracy = attacker.stats.accuracy;
        const evasion = hasStatusEffect(target, 'evasion_up')
            ? target.stats.evasion + 20
            : target.stats.evasion;

        if (hasStatusEffect(target, 'marked')) {
            accuracy = 999;
        }

        const accuracyRoll = Math.random() * 100;
        const evasionRoll = Math.random() * 100;

        const isHit = accuracyRoll <= accuracy && (evasionRoll >= evasion || hasStatusEffect(target, 'marked'));

        let damage = 0;
        let isCrit = false;
        let healAmount = 0;
        let counterDamage = 0;

        if (isHit) {
            let rawDamage = attacker.stats.attack;
            if (hasStatusEffect(attacker, 'attack_up')) rawDamage = Math.floor(rawDamage * 1.5);

            let defense = target.stats.defense;
            damage = Math.max(1, rawDamage - defense);

            // Modifiers
            if (hasStatusEffect(target, 'defence_up')) damage = Math.floor(damage * 0.7);
            if (hasStatusEffect(target, 'vulnerable')) damage = Math.floor(damage * 1.3);

            // Crit
            const critRoll = Math.random() * 100;
            isCrit = critRoll < attacker.stats.critChance;
            if (isCrit) {
                damage = Math.round(damage * (1 + attacker.stats.critDamage / 100));
            }

            // Health Steal
            if (attacker.stats.healthSteal > 0) {
                healAmount = Math.round(damage * (attacker.stats.healthSteal / 100));
            }

            // Counter Calc (if not dead)
            // We can't know for sure if dead until applied, but we can predict.
            // If damage < currentHealth, check counter.
            if (target.stats.currentHealth > damage) {
                if (hasStatusEffect(target, 'counter') && !hasStatusEffect(target, 'stun') && !hasStatusEffect(target, 'silenced')) {
                    counterDamage = Math.max(1, Math.floor(target.stats.attack * 0.8) - attacker.stats.defense);
                }
            }
        }

        return { isHit, damage, isCrit, healAmount, counterDamage };
    }

    private applyDamageOutcome(attacker: Character, target: Character, outcome: any): void {
        if (!outcome.isHit) {
            this.addToLog(`${attacker.name} missed or was evaded by ${target.name}!`);
            return;
        }

        if (outcome.isCrit) {
            this.addToLog(`💥 CRITICAL HIT! ${attacker.name} strikes ${target.name} for ${outcome.damage} damage!`);
        } else {
            this.addToLog(`${attacker.name} hits ${target.name} for ${outcome.damage} damage.`);
        }

        damageCharacter(target, outcome.damage);

        if (outcome.healAmount > 0) {
            healCharacter(attacker, outcome.healAmount);
            this.addToLog(`${attacker.name} steals ${outcome.healAmount} HP!`);
        }

        if (!isAlive(target)) {
            this.addToLog(`${target.name} was defeated!`);
        } else if (outcome.counterDamage > 0) {
            this.addToLog(`${target.name} counters!`);
            damageCharacter(attacker, outcome.counterDamage);
            this.addToLog(`${target.name} deals ${outcome.counterDamage} counter damage to ${attacker.name}!`);
            if (!isAlive(attacker)) {
                this.addToLog(`${attacker.name} was defeated by the counter-attack!`);
            }
        }
    }

    /**
     * Get targets for an ability based on its target type
     */
    private getTargetsForAbility(attacker: Character, primaryTarget: Character, targetType: string): Character[] {
        switch (targetType) {
            case 'single_enemy':
                return [primaryTarget];
            case 'single_ally':
                return [primaryTarget];
            case 'all_enemies':
                const enemyTeam = this.getEnemyTeam(attacker);
                return enemyTeam.characters.filter(isAlive);
            case 'self':
                return [attacker];
            case 'all_allies':
                const allyTeam = this.isPlayerCharacter(attacker) ? this.state.playerTeam : this.state.enemyTeam;
                return allyTeam.characters.filter(isAlive);
            default:
                return [primaryTarget];
        }
    }

    /**
     * Execute an attack on a specific target using an ability
     */
    private executeAttack(attacker: Character, target: Character, ability: Ability, remoteOutcome: any = null): void {
        // Collect results for all targets to emit
        const actionOutcomes: any[] = [];

        // Log ability usage
        this.addToLog(`${attacker.name} uses ${ability.name}!`);

        // Set cooldown for the ability
        if (ability.cooldown > 0) {
            setAbilityCooldown(attacker, ability.id, ability.cooldown);
        }

        // Apply ability effects
        for (const effect of ability.effects) {
            const effectTargetType = effect.target || ability.target;
            const targets = this.getTargetsForAbility(attacker, target, effectTargetType);

            if (effect.type === 'damage') {
                targets.forEach((t: Character) => {
                    // IF REMOTE: Use provided outcome for this target index (simplified assumption: 1 target usually, or mapped)
                    // Multi-target sync is complex. Let's assume passed remoteOutcome IS the outcome for SINGLE target or list.
                    // For now, if remoteOutcome exists, we assume it's the outcome for 'target'.
                    // If Aoe, we might need an array.
                    // SIMPLIFICATION: We ONLY sync the primary target outcome for now to fix the user issue.
                    // Ideally we pass Map<TargetID, Outcome>.

                    let outcome;
                    if (remoteOutcome && remoteOutcome.outcomes && remoteOutcome.outcomes[t.id]) {
                        outcome = remoteOutcome.outcomes[t.id];
                    } else if (remoteOutcome && !remoteOutcome.outcomes) {
                        // Fallback setup?
                        // If we are Local, we calculate.
                        outcome = this.calculateDamageOutcome(attacker, t);
                        actionOutcomes.push({ targetId: t.id, outcome });
                    } else {
                        // Local Calc
                        outcome = this.calculateDamageOutcome(attacker, t);
                        actionOutcomes.push({ targetId: t.id, outcome });
                    }

                    this.applyDamageOutcome(attacker, t, outcome);
                });
            } else if (effect.type === 'apply_status' && effect.statusType) {
                targets.forEach(t => {
                    // Status effects usually deterministic (always apply), 
                    // unless we add resistance later. For now, just apply.
                    const statusType = effect.statusType!;
                    const statusEffect: StatusEffect = {
                        id: `${statusType}_${Date.now()}_${Math.random()}`,
                        type: statusType,
                        duration: effect.duration || 2,
                        value: effect.value,
                        sourceId: attacker.id
                    };
                    t.statusEffects.push(statusEffect);
                    this.addToLog(`${t.name} is affected by ${statusType}!`);
                });
            }
        }

        // PVP: Emit action if local (remoteOutcome is null)
        if (this.isPvP && !remoteOutcome && this.onEmitAction) {
            // We map outcomes to dictionary for easier lookup on receiver
            const outcomesMap: any = {};
            actionOutcomes.forEach(o => outcomesMap[o.targetId] = o.outcome);

            this.onEmitAction({
                attackerId: attacker.id,
                targetId: target.id,
                abilityId: ability.id,
                outcomes: outcomesMap // Send the results!
            });
        }

        this.endTurn();
    }

    /**
     * End the current turn and move to next character
     */
    private endTurn(): void {
        const current = this.getCurrentCharacter();

        // Decrement status effects and ability cooldowns for the character who just finished their turn
        if (current && isAlive(current)) {
            // Decrement status effects
            current.statusEffects.forEach(e => e.duration--);
            const expired = current.statusEffects.filter(e => e.duration <= 0);
            if (expired.length > 0) {
                current.statusEffects = current.statusEffects.filter(e => e.duration > 0);
            }

            // Decrement ability cooldowns
            decrementAbilityCooldowns(current);
        }

        // Check for victory/defeat
        this.checkBattleEnd();
        if (this.state.isOver) {
            this.awardPostBattleXP();
            return;
        }

        // Move to next character
        this.state.currentTurnIndex++;

        // If we've gone through everyone, start over
        if (this.state.currentTurnIndex >= this.state.turnOrder.length) {
            this.calculateTurnOrder();
            this.state.currentTurnIndex = 0;
        }

        // If next character is dead, skip to next alive character
        const next = this.getCurrentCharacter();
        if (next && !isAlive(next)) {
            this.endTurn();
        }
    }

    /**
     * Check if battle is over (all characters on one side defeated)
     */
    private checkBattleEnd(): void {
        const playerAlive = this.state.playerTeam.characters.some(isAlive);
        const enemyAlive = this.state.enemyTeam.characters.some(isAlive);

        if (!playerAlive) {
            this.state.isOver = true;
            this.state.winner = 'enemy';
            this.addToLog('💀 Defeat! Your team was defeated.');
        } else if (!enemyAlive) {
            this.state.isOver = true;
            this.state.winner = 'player';
            this.addToLog('🏆 Victory! You defeated the enemy team!');
        }

        if (this.state.isOver && this.onBattleEnd) {
            const result: any = { winner: this.state.winner };

            // For PVP, include opponent username for leaderboard tracking
            if (this.isPvP && this.opponentUsername) {
                // If player won, opponent is loser, vice versa
                if (this.state.winner === 'player') {
                    result.loser = this.opponentUsername;
                } else {
                    result.loser = 'player'; // We are the loser, opponent is winner
                }
            }

            this.onBattleEnd(result);
        }
    }

    /**
     * Award XP to winning team
     */
    private awardPostBattleXP(): void {
        const isPlayerWinner = this.state.winner === 'player';

        // Winners get XP
        const winXP = Math.floor(100 * this.xpMultiplier);
        const loseXP = Math.floor(50 * this.xpMultiplier);

        // Award XP ONLY to Player Team characters
        this.state.playerTeam.characters.forEach(char => {
            const xpAmount = isPlayerWinner ? winXP : loseXP;

            // Only player's characters persist XP, so we only call it on them.
            // (Assuming enemies are generated instances that get discarded)
            const leveledUp = awardXP(char, xpAmount);
            if (leveledUp) {
                this.addToLog(`${char.name} leveled up to Level ${char.level}! (+5 stat points)`);
            }
        });

        // Loot Roll (25% drop rate on win)
        if (isPlayerWinner && this.availableLootIds.length > 0) {
            if (Math.random() < 0.25) {
                const randomId = this.availableLootIds[Math.floor(Math.random() * this.availableLootIds.length)];
                this.state.loot = { characterId: randomId };
                this.addToLog(`🎁 You found a Sleeping Bag for ${randomId}!`);
            }
        }
    }

    /**
     * Add a message to the battle log
     */
    private addToLog(message: string): void {
        this.state.battleLog.push(message);
        console.log(`[Battle] ${message}`);
    }

    public startBattle(): void {
        this.addToLog('Battle Started!');
        this.calculateTurnOrder();
        this.executeTurn();
    }

    public applyRemoteAction(action: { attackerId: string, targetId: string, abilityId: string }): void {
        const attacker = this.getCurrentCharacter();
        if (!attacker || attacker.id !== action.attackerId) {
            console.warn("Remote action mismatch event!", action);
            // Force sync turn index?? For now assume order is synced.
        }

        const ability = attacker?.abilities.find(a => a.id === action.abilityId);
        // Find target in EITHER team
        const allChars = [...this.state.playerTeam.characters, ...this.state.enemyTeam.characters];
        const target = allChars.find(c => c.id === action.targetId);

        if (attacker && ability && target) {
            // Pass the FULL action payload as the remote outcome definition
            this.executeAttack(attacker, target, ability, action);
        } else {
            console.error("Failed to apply remote action", action);
            this.endTurn(); // Force skip to unblock
        }
    }

    /**
     * Execute turn logic (AI or Player)
     */
    public executeAITurn(): void {
        this.executeTurn();
    }


}
