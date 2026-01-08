/**
 * MAIN APPLICATION - PVP Training Mode
 * 
 * Entry point for the PVP game with Training Mode
 */

import './styles/main.css';
console.log('🎮 Main.ts loaded!');
import { CharacterManager } from './systems/CharacterManager';
import { AuthManager } from './systems/AuthManager';
import { CombatSystem } from './systems/CombatSystem';
import type { Team } from './systems/CombatSystem';
import { SceneManager } from './rendering/SceneManager';
import type { Character } from './types/Character';
import { NetworkManager } from './systems/NetworkManager';
import { API_URL } from './config';


/**
 * GAME APPLICATION CLASS
 */
export class Game {
  private characterManager: CharacterManager;
  private sceneManager: SceneManager;
  private combatSystem: CombatSystem | null = null;
  private authManager: AuthManager;
  private networkManager: NetworkManager;
  private currentRoomId: string | null = null;
  private selectedNetworkTeamIds: string[] = [];

  // Team selection state
  private yourTeamIds: string[] = [];
  private opponentTeamIds: string[] = [];
  private difficulty: 'easy' | 'normal' | 'hard' = 'normal';

  // Auto-battle state
  private autoBattleInterval: number | null = null;

  // Transactional Stats State
  private tempAllocatedPoints: Map<string, Array<keyof Character['stats']>> = new Map();
  private pendingStatReturnScreen: string = 'results-screen';

  // UI Previews


  constructor() {
    this.characterManager = new CharacterManager();
    this.authManager = new AuthManager();
    this.networkManager = new NetworkManager();

    const sceneContainer = document.getElementById('scene-container')!;
    this.sceneManager = new SceneManager(sceneContainer);

    this.setupEventListeners();
    this.setupAuthEventListeners();
    this.setupAccountEventListeners();
    this.startBootSequence();
    // checkFirstTime moved to after login

    // Debug Tool
    (window as any).cheatApplyEffect = (effectType: any, duration: number = 3) => {
      if (!this.combatSystem) {
        console.error("No battle active!");
        return;
      }
      const char = this.combatSystem.getCurrentCharacter();
      if (char) {
        console.log(`Applying ${effectType} to ${char.name}`);
        import('./types/Character').then(({ addStatusEffect }) => {
          addStatusEffect(char, {
            id: Math.random().toString(),
            type: effectType,
            duration: duration,
            sourceId: 'debug'
          });
          this.updateBattleUI();
        });
      }
    };
  }

  private startBootSequence(): void {
    const loadingBar = document.getElementById('loading-bar-fill');
    const loadingText = document.getElementById('loading-text');

    if (!loadingBar || !loadingText) {
      this.showScreen('main-menu');
      return;
    }

    // Random duration between 1.5 and 5 seconds
    const duration = 1500 + Math.random() * 3500;
    const startTime = performance.now();

    const updateLoading = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      loadingBar.style.width = `${progress * 100}%`;

      if (progress < 1) {
        requestAnimationFrame(updateLoading);
      } else {
        // Complete!
        setTimeout(async () => {
          if (this.authManager.isAuthenticated()) {
            // Already logged in? Fetch data from server
            const result = await this.authManager.fetchPlayerData();
            if (result.success && result.data) {
              this.onAuthSuccess(result.data);
            } else {
              // If fetch fails, still call success but with null (will use local storage fallback)
              this.onAuthSuccess(null);
            }
            this.showScreen('main-menu');
          } else {
            this.showScreen('login-screen');
          }

          // Optional: Add a fade-out class to boot screen for smoother transition
          const bootScreen = document.getElementById('boot-screen');
          if (bootScreen) {
            bootScreen.style.opacity = '0';
            bootScreen.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
              bootScreen.style.display = 'none';
            }, 500);
          }
        }, 300);
      }
    };

    requestAnimationFrame(updateLoading);
  }

  /**
   * Helper to bind fast clicks for mobile compatibility
   */
  private bindButton(id: string, action: () => void): void {
    const btn = document.getElementById(id);
    if (!btn) return;

    // Handle touch end (fast click) - Prevents ghost clicks
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      action();
    }, { passive: false });

    // Handle standard click (desktop)
    btn.addEventListener('click', () => {
      action();
    });
  }

  private setupEventListeners(): void {
    // Main menu - Updated to use fast binding
    this.bindButton('btn-training', () => this.showSelectionScreen());
    this.bindButton('btn-manage', () => this.showManageScreen());
    this.bindButton('btn-pvp', () => this.showPvpArena());

    // Friends needs standard listener as it's less critical for nav speed
    document.getElementById('btn-friends')?.addEventListener('click', () => {
      this.showFriendsScreen();
    });

    // Inbox
    document.getElementById('btn-inbox')?.addEventListener('click', () => {
      this.showInbox();
    });
    document.getElementById('btn-close-inbox')?.addEventListener('click', () => {
      document.getElementById('inbox-modal')?.classList.remove('active');
    });

    // Friends
    // Friends - Event Delegation to ensure it works even if DOM elements shift
    document.addEventListener('click', (e: any) => {
      if (e.target && e.target.id === 'btn-search-users') {
        if (!this.networkManager.connected) {
          console.error("Error: Not connected to PVP Server!");
          return;
        }
        const query = (document.getElementById('friend-search-input') as HTMLInputElement).value;
        if (query) {
          //alert(`Searching for: ${query}`); // Removed debug alert
          this.networkManager.searchUsers(query);
        }
      }
    });

    // PVP
    document.getElementById('btn-find-match')?.addEventListener('click', () => {
      this.startMatchmaking();
    });
    document.getElementById('btn-cancel-matchmaking')?.addEventListener('click', () => {
      // Ideally send cancel event, for now just hide UI
      document.getElementById('matchmaking-status')!.style.display = 'none';
    });

    // Selection screen
    // Selection screen
    // Old back button removed


    document.getElementById('btn-start-battle')?.addEventListener('click', () => {
      this.startBattle();
    });

    // Difficulty Controls
    ['easy', 'normal', 'hard'].forEach(diff => {
      document.getElementById(`btn-diff-${diff}`)?.addEventListener('click', () => {
        this.setDifficulty(diff as 'easy' | 'normal' | 'hard');
      });
    });

    // Battle screen
    // Old listener removed to prevent conflict with PVP Forfeit logic


    document.getElementById('btn-auto-battle')?.addEventListener('click', () => {
      this.toggleAutoBattle();
    });

    // Mobile Battle Controls (Overhaul)
    document.getElementById('btn-battle-auto')?.addEventListener('click', () => {
      this.toggleAutoBattle();
    });

    document.getElementById('btn-battle-settings')?.addEventListener('click', () => {
      document.getElementById('battle-settings-modal')?.classList.add('active');
    });

    document.getElementById('btn-close-battle-settings')?.addEventListener('click', () => {
      document.getElementById('battle-settings-modal')?.classList.remove('active');
    });

    document.getElementById('btn-battle-continue')?.addEventListener('click', () => {
      document.getElementById('battle-settings-modal')?.classList.remove('active');
    });

    document.getElementById('btn-battle-forfeit')?.addEventListener('click', () => {
      document.getElementById('battle-settings-modal')?.classList.remove('active');
      this.handleForfeit();
    });

    // Remove old Next Turn listener if present (cleanup)

    // Results screen
    document.getElementById('btn-allocate-stats')?.addEventListener('click', () => {
      this.showStatsScreen();
    });

    document.getElementById('btn-back-to-training')?.addEventListener('click', () => {
      this.showSelectionScreen();
    });

    // Stats screen
    document.getElementById('btn-back-from-stats')?.addEventListener('click', () => {
      this.tempAllocatedPoints.clear(); // Cancel changes
      this.showScreen(this.pendingStatReturnScreen);
    });

    document.getElementById('btn-confirm-stats')?.addEventListener('click', () => {
      // Commit changes
      this.tempAllocatedPoints.forEach((stats, charId) => {
        stats.forEach(stat => {
          this.characterManager.allocateStatForCharacter(charId, stat);
        });
      });
      this.tempAllocatedPoints.clear();
      alert('Stats Saved!');
      this.renderCharacterSelector();
      // Refresh current view
      const activeCharId = document.getElementById('selected-char-name')?.getAttribute('data-char-id');
      if (activeCharId) this.showStatAllocation(activeCharId);
    });

    // Manage screen
    // Manage screen
    // Old back button removed


    // Battle controls
    // Battle controls
    // Speed buttons removed

    document.getElementById('btn-back-from-battle')?.addEventListener('click', () => {
      this.handleForfeit();
    });

    // Global Home Button
    document.getElementById('btn-home')?.addEventListener('click', () => {
      // Logic to return to menu from anywhere
      this.stopAutoBattle(); // Just in case
      this.showScreen('main-menu');
      this.sceneManager.clearAllCharacters();
      if (this.combatSystem) this.combatSystem = null; // Clean up battle if active

      // Cancel matchmaking if active
      const matchmakingStatus = document.getElementById('matchmaking-status');
      if (matchmakingStatus) matchmakingStatus.style.display = 'none';
    });
  }

  private toggleAutoBattle(): void {
    if (this.autoBattleInterval) {
      this.stopAutoBattle();
    } else {
      this.startAutoBattle();
    }
    this.updateBattleUI();
  }

  private handleForfeit(): void {
    const isPvP = this.combatSystem?.isPvP;

    if (isPvP && !this.combatSystem!.getState().isOver) {
      if (this.currentRoomId) {
        this.networkManager.forfeitMatch(this.currentRoomId);
      }
    } else {
      this.stopAutoBattle();
      this.showScreen('main-menu');
      this.sceneManager.clearAllCharacters();
      this.combatSystem = null;
    }
  }

  private renderTurnMeter(): void {
    const container = document.getElementById('turn-meter-container');
    if (!container || !this.combatSystem) return;

    container.innerHTML = '';
    const state = this.combatSystem.getState();
    const order = state.turnOrder;
    const currentIndex = state.currentTurnIndex;

    // Show next 5 turns
    for (let i = 0; i < 5; i++) {
      const idx = (currentIndex + i) % order.length;
      const char = order[idx];
      if (!char || char.stats.currentHealth <= 0) continue;

      const slot = document.createElement('div');
      const isAlly = this.combatSystem.isPlayerCharacter(char);
      slot.className = `turn-slot ${isAlly ? 'ally' : 'enemy'}`;

      // First 2 letters of name
      const initials = char.name.substring(0, 2).toUpperCase();
      slot.textContent = initials;

      container.appendChild(slot);
    }
  }

  private setDifficulty(diff: 'easy' | 'normal' | 'hard'): void {
    this.difficulty = diff;
    document.querySelectorAll('.difficulty-controls .btn').forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-secondary');
    });
    const btn = document.getElementById(`btn-diff-${diff}`)!;
    btn.classList.remove('btn-secondary');
    btn.classList.add('active', 'btn-primary');

    // Re-render opponent grid to show updated stats
    this.renderSelectionGrids();
  }

  /* private setBattleSpeed(speed: number): void {
    if (!this.combatSystem) return;

    this.combatSystem.setBattleSpeed(speed);

    // Update buttons
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-speed-${speed}x`)?.classList.add('active');

    // Restart timer if running
    if (this.autoBattleInterval) {
      this.stopAutoBattle();
      this.startAutoBattle();
    }
  } */

  private showScreen(screenId: string): void {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Explicitly hide main menu to prevent overlay issues
    document.getElementById('main-menu')?.classList.remove('active');

    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
    }

    // Toggle regular HUD - Hide in battle
    const hud = document.getElementById('hud-container');
    if (hud) {
      hud.style.display = screenId === 'battle-screen' ? 'none' : 'flex';
    }

    // Toggle Home Button
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      // Hide on main menu and login screen (galaxy view)
      if (screenId === 'main-menu' || screenId === 'login-screen') {
        homeBtn.style.display = 'none';
      } else {
        homeBtn.style.display = 'block';
      }
    }
  }

  private showPvpArena(): void {
    this.showScreen('pvp-arena-screen');

    // Fetch leaderboard
    fetch(`${API_URL} / api / leaderboard`)
      .then(res => res.json())
      .then(data => this.renderLeaderboard(data))
      .catch(err => console.error('Failed to load leaderboard', err));
  }

  private renderLeaderboard(data: any[]): void {
    const list = document.getElementById('leaderboard-list')!;
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<div class="empty-state">No rankings yet. Be the first!</div>';
      return;
    }

    data.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      item.innerHTML = `
  < span > #${index + 1} </span>
    < span > ${entry.username} </span>
      < span > ${entry.wins} </span>
        < span > ${entry.winRate}% </span>
          < span > ${entry.avgLevel || '-'} </span>
            `;
      list.appendChild(item);
    });
  }

  private startMatchmaking(): void {
    // Validate team (use top 5 or allow selection?)
    // Simplicity: Use top 5 distinct owned characters
    const myTeam = this.characterManager.getOwnedCharacters().slice(0, 5);
    if (myTeam.length === 0) {
      // Removed alert
      return;
    }

    document.getElementById('matchmaking-status')!.style.display = 'flex';

    this.networkManager.joinMatchmaking(myTeam);
  }

  private showSelectionScreen(): void {
    this.yourTeamIds = [];
    this.opponentTeamIds = []; // Opponent selection is dynamic now
    this.showScreen('selection-screen');
    // We only render player's grid now. Opponent is auto-generated.
    this.renderSelectionGrids();
    this.updateSelectedLists();

    // Hide opponent selection UI parts if they exist? 
    // Actually user requirement implies we can pick opponents? 
    // "play agaisnt other characters on a - beginner, normal or hard difficulty"
    // "hide all the stats of the opponents" implies we see them.
    // The previous implementation had manual opponent selection.
    // I will keep manual opponent selection but apply the difficulty scaling to them.
    // OR, auto-fill them?
    // "match the level of the characters you are fighting with" suggested dynamic generation.
    // Let's modify renderSelectionGrids to allow selecting opponents but HIDE stats.
  }

  private checkFirstTime(): void {
    const owned = this.characterManager.getOwnedCharacters();

    // Disable buttons if no characters (FTUE not done)
    const trainingBtn = document.getElementById('btn-training') as HTMLButtonElement;
    if (trainingBtn) trainingBtn.disabled = owned.length === 0;

    const pvpBtn = document.getElementById('btn-pvp') as HTMLButtonElement;
    if (pvpBtn) pvpBtn.disabled = owned.length === 0;

    // PVP Arena unlocked

    if (owned.length === 0) {
      // Show FTUE Overlay
      const overlay = document.getElementById('ftue-overlay')!;
      overlay.style.display = 'flex';

      const lootBox = document.getElementById('loot-box')!;
      lootBox.onclick = () => this.openStarterLootBox();
    }
  }

  private openStarterLootBox(): void {
    const lootBox = document.getElementById('loot-box')!;
    if (lootBox.classList.contains('opening')) return;

    lootBox.classList.add('opening');

    // Play sound? (Optional)

    setTimeout(() => {
      // Pick random starter
      const allChars = this.characterManager.getAllCharacters();
      const randomChar = allChars[Math.floor(Math.random() * allChars.length)];

      // Unlock
      this.characterManager.unlockCharacter(randomChar.id);

      // Reveal
      lootBox.style.display = 'none';
      const reveal = document.getElementById('loot-reveal')!;
      reveal.style.display = 'flex';
      reveal.style.flexDirection = 'column';
      reveal.style.alignItems = 'center';
      reveal.style.width = '100%';
      // Removed aggressive !important resets asking for trouble

      reveal.innerHTML = `
            < div style = "width: 100%; display: flex; justify-content: center; margin: 2rem 0 4rem 0;" >
              <div id="revealed-card-action" class="character-card revealed-card" style = "transform: scale(2.0); transform-origin: center center; margin: 0; cursor: pointer;" >
                <div class="character-shape" style = "background: ${randomChar.visual.color}" > </div>
                  < div class="character-name" > ${randomChar.name} </div>
                    < div class="character-stats-mini" style = "flex-direction: column; align-items: center;" >
                      <div>HP: ${randomChar.stats.maxHealth} </div>
                        < div > ATK: ${randomChar.stats.attack} </div>
                          < div > SPD: ${randomChar.stats.speed} </div>
                            </div>
                            < div style = "font-size: 0.5rem; margin-top: 0.5rem; opacity: 0.8;" > (Click to Claim)</div>
                              </div>
                              </div>
                                `;

      const cardAction = document.getElementById('revealed-card-action')!;
      cardAction.onclick = () => {
        document.getElementById('ftue-overlay')!.style.display = 'none';
        this.checkFirstTime(); // Re-check to enable buttons
        // Alert user (optional, maybe remove if annoyng)
        // alert('Training Mode Unlocked! Go test your new Chad.');
      };

    }, 2000);
  }

  private renderSelectionGrids(): void {
    const allCharacters = this.characterManager.getAllCharacters();
    const ownedCharacters = this.characterManager.getOwnedCharacters();

    // Player can only select owned characters
    this.renderCharacterGrid('your-team-grid', ownedCharacters, 'your');

    // Opponent can be any character
    // We update this to allow opponent selection, but stats will be hidden in renderCharacterGrid
    this.renderCharacterGrid('opponent-team-grid', allCharacters, 'opponent');
  }

  private renderCharacterGrid(containerId: string, characters: Character[], team: 'your' | 'opponent'): void {
    const grid = document.getElementById(containerId)!;
    grid.innerHTML = '';

    // Dispose old previews if we are re-rendering a major grid (only for manage screen usually, 
    // but lets keep a small pool for selection screen too if needed)
    // Actually selection screen has small cards, maybe keep them 2D symbols for clarity?
    // User said "replace current 2D character cards... for ALL 19 characters".
    // I will use 3D previews here too.

    characters.forEach(character => {
      const card = document.createElement('div');
      card.className = 'character-card';

      const isSelected = team === 'your'
        ? this.yourTeamIds.includes(character.id)
        : this.opponentTeamIds.includes(character.id);

      if (isSelected) {
        card.classList.add('selected');
      }

      let statsHtml = '';
      let levelHtml = '';

      if (team === 'your') {
        // Player team: show level and stats
        levelHtml = `< div class="character-level" > Level ${character.level} </div>`;
        statsHtml = `
          <div class="character-stats-mini">
            <div>HP: ${character.stats.maxHealth}</div>
            <div>ATK: ${character.stats.attack}</div>
            <div>DEF: ${character.stats.defense}</div>
            <div>SPD: ${character.stats.speed}</div>
          </div>
        `;
      } else {
        // Opponent team: hide level, show difficulty-adjusted stats
        levelHtml = '';

        // Calculate stat multiplier based on current difficulty
        let statMultiplier = 1.0;
        if (this.difficulty === 'easy') {
          statMultiplier = 0.8; // 20% less stats
        } else if (this.difficulty === 'hard') {
          statMultiplier = 1.2; // 20% more stats
        }

        // Apply multiplier to displayed stats
        const adjustedHP = Math.floor(character.stats.maxHealth * statMultiplier);
        const adjustedATK = Math.floor(character.stats.attack * statMultiplier);
        const adjustedDEF = Math.floor(character.stats.defense * statMultiplier);
        const adjustedSPD = Math.floor(character.stats.speed * statMultiplier);

        statsHtml = `
          <div class="character-stats-mini">
            <div>HP: ${adjustedHP}</div>
            <div>ATK: ${adjustedATK}</div>
            <div>DEF: ${adjustedDEF}</div>
            <div>SPD: ${adjustedSPD}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="character-shape" style="background: ${character.visual.color}; width: 100%; height: 120px; margin-bottom: 0.5rem; border-radius: 8px;"></div>
        <div class="character-name">${character.name}</div>
        ${levelHtml}
        ${statsHtml}
      `;

      card.addEventListener('click', () => {
        this.toggleCharacterSelection(character.id, team);
      });

      grid.appendChild(card);
    });
  }

  private toggleCharacterSelection(characterId: string, team: 'your' | 'opponent'): void {
    const teamIds = team === 'your' ? this.yourTeamIds : this.opponentTeamIds;
    const index = teamIds.indexOf(characterId);

    if (index > -1) {
      // Deselect
      teamIds.splice(index, 1);
    } else {
      // Select (max 5)
      if (teamIds.length < 5) {
        teamIds.push(characterId);
      }
    }

    this.renderSelectionGrids();
    this.updateSelectedLists();
    this.updateStartButton();
  }

  private updateSelectedLists(): void {
    this.updateSelectedList('your-selected', this.yourTeamIds);
    this.updateSelectedList('opponent-selected', this.opponentTeamIds);
  }

  private updateSelectedList(containerId: string, teamIds: string[]): void {
    const container = document.getElementById(containerId)!;
    container.innerHTML = '';

    if (teamIds.length === 0) {
      container.innerHTML = '<p>None selected</p>';
      return;
    }

    teamIds.forEach(id => {
      const char = this.characterManager.getCharacterById(id);
      if (char) {
        const item = document.createElement('div');
        item.className = 'selected-item';
        item.textContent = char.name;
        container.appendChild(item);
      }
    });
  }

  private updateStartButton(): void {
    const button = document.getElementById('btn-start-battle') as HTMLButtonElement;
    // Allow 1-5 players on YOUR team. 
    // For opponent, we can either enforce manual selection OR auto-generate if empty.
    // User asked to "play against other characters", implies selection? 
    // Or "give option to play against...".
    // Let's enforce 1-5 for YOUR team.
    // If opponent team is empty, we AUTO GENERATE based on player team size.
    button.disabled = this.yourTeamIds.length === 0 || this.yourTeamIds.length > 5;
  }

  private startBattle(): void {
    // Get character copies for battle
    const yourTeamChars = this.yourTeamIds.map(id => this.characterManager.getCharacterForBattle(id));

    // Filter out nulls and ensure we have at least one character
    const validYourTeamChars = yourTeamChars.filter(c => c !== null) as Character[];

    if (validYourTeamChars.length === 0) {
      // Removed alert
      this.showSelectionScreen();
      return;
    }

    this.showScreen('battle-screen');

    const yourTeam: Team = {
      name: 'Your Team',
      characters: validYourTeamChars,
      color: '#4facfe',
    };

    // Prepare Opponent Team
    let opponentTeamChars: Character[] = [];

    if (this.opponentTeamIds.length > 0) {
      // Use manually selected opponents
      opponentTeamChars = this.opponentTeamIds.map(id => this.characterManager.getCharacterForBattle(id)!);
    } else {
      const allChars = this.characterManager.getAllCharacters();
      // Filter out player's team chars to avoid duplicates on field? Or allows duplicates?
      // Let's allow duplicates for opponents.
      const teamSize = this.yourTeamIds.length;
      for (let i = 0; i < teamSize; i++) {
        const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
        opponentTeamChars.push(this.characterManager.getCharacterForBattle(randomChar.id)!);
      }
    }

    // Apply Difficulty Scaling (Level Matching + Stat Multiplier)
    const playerLevels = yourTeam.characters.map(c => c.level);
    const avgPlayerLevel = Math.round(playerLevels.reduce((a, b) => a + b, 0) / playerLevels.length);

    let statMultiplier = 1.0;
    let xpMultiplier = 1;

    if (this.difficulty === 'easy') {
      statMultiplier = 0.8; // 20% less stats
      xpMultiplier = 0.5;
    } else if (this.difficulty === 'hard') {
      statMultiplier = 1.2; // 20% more stats
      xpMultiplier = 1.5;
    }

    // Training Mode (Non-PVP) XP Reduction
    // User Request: "training mode to give 10% of the XP as you would get from doing PVP arena"
    // Since startBattle is exclusively for Training/Local PVE, we enforce 0.1 multiplier.
    xpMultiplier = 0.1;

    // Normal: statMultiplier = 1.0 (equal stats)

    opponentTeamChars.forEach(char => {
      // Set level to match player team average
      char.level = avgPlayerLevel;
      if (this.difficulty === 'hard') char.level += 2;

      // Apply stat multiplier based on difficulty
      char.stats.maxHealth = Math.floor(char.stats.maxHealth * statMultiplier);
      char.stats.currentHealth = char.stats.maxHealth;
      char.stats.attack = Math.floor(char.stats.attack * statMultiplier);
      char.stats.defense = Math.floor(char.stats.defense * statMultiplier);
      char.stats.speed = Math.floor(char.stats.speed * statMultiplier);
    });

    const opponentTeam: Team = {
      name: 'Opponent Team',
      characters: opponentTeamChars,
      color: '#f5576c',
    };

    const allCharacterIds = this.characterManager.getAllCharacters().map(c => c.id);

    this.combatSystem = new CombatSystem(yourTeam, opponentTeam, allCharacterIds, xpMultiplier, false, undefined, undefined, undefined);
    this.combatSystem.setBattleSpeed(2); // Standard is 2x now
    this.displayBattleIn3D();
    this.updateBattleUI();

    // START THE FIRST TURN
    setTimeout(() => {
      this.executeNextTurn();
    }, 500);
  }

  private renderAbilityButtons(): void {
    const container = document.getElementById('ability-panel');
    if (!container) return;

    const attacker = this.combatSystem?.getCurrentCharacter();
    const state = this.combatSystem?.getState();

    // Check availability even if we modify visibility rules:
    // If waiting for target selection, we KEEP showing buttons so user can see what they selected
    // or select a DIFFERENT ability.
    // Logic: 
    // - If waitingForAbilitySelection: Show all avail.
    // - If waitingForTargetSelection: Show all avail, highlight selected.

    // User Request: "i only want to see my moves" -> implies only show when player is acting.
    // Combined logic: Show if player is acting AND (waiting for ability OR waiting for target).
    const isPlayerTurn = attacker && this.combatSystem?.isPlayerCharacter(attacker);
    const showPanel = isPlayerTurn && (state?.waitingForAbilitySelection || state?.waitingForTargetSelection);

    if (!showPanel) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    // Render each ability as an icon button
    attacker!.abilities.forEach((ability, index) => {
      const cooldown = attacker!.abilityCooldowns.get(ability.id) || 0;
      const isAvailable = cooldown === 0;
      const isBasic = ability.type === 'basic';
      const isSelected = state?.selectedAbility?.id === ability.id;

      const btn = document.createElement('button');
      btn.className = `ability-btn ${isBasic ? 'basic' : 'special'} ${!isAvailable ? 'on-cooldown' : ''} ${isSelected ? 'selected' : ''}`;
      btn.disabled = !isAvailable && !isSelected;

      // Label logic: B, S1, S2
      let label = isBasic ? 'B' : `S${index}`;

      btn.innerHTML = `
        <div class="ability-name">${label}</div>
        ${!isAvailable ? `<div class="cooldown-badge">${cooldown}</div>` : ''}
      `;

      // Trigger logic (same as before)
      const handleTrigger = (e: Event) => {
        if (e.type === 'touchend') e.preventDefault();

        if (isSelected) {
          const targetType = ability.target;
          if (['self', 'all_enemies', 'all_allies'].includes(targetType)) {
            const validTargets = this.combatSystem?.getAvailableTargets();
            if (validTargets && validTargets.length > 0) {
              let targetId = validTargets[0].instanceId || validTargets[0].id;
              if (targetType === 'self') targetId = attacker!.instanceId || attacker!.id;
              this.combatSystem?.selectTarget(targetId);
              this.updateBattleUI();
              this.executeNextTurn();
              return;
            }
          }
        }

        const turnFinishedByAbility = this.combatSystem?.selectAbility(ability.id);
        this.updateBattleUI();
        if (turnFinishedByAbility) this.executeNextTurn();
      };

      if (isAvailable || isSelected) {
        btn.addEventListener('click', handleTrigger);
        btn.addEventListener('touchend', handleTrigger, { passive: false });
      }

      // Tooltip on Hold
      let pressTimer: number | null = null;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressTimer = window.setTimeout(() => this.showAbilityTooltip(ability, btn), 200);
      }, { passive: false });
      btn.addEventListener('touchend', () => {
        if (pressTimer) clearTimeout(pressTimer);
        this.hideAbilityTooltip();
      });
      btn.addEventListener('mousedown', () => {
        pressTimer = window.setTimeout(() => this.showAbilityTooltip(ability, btn), 200);
      });
      btn.addEventListener('mouseup', () => {
        if (pressTimer) clearTimeout(pressTimer);
        this.hideAbilityTooltip();
      });
      btn.addEventListener('mouseleave', () => {
        if (pressTimer) clearTimeout(pressTimer);
        this.hideAbilityTooltip();
      });

      container.appendChild(btn);
    });
  }

  private showAbilityTooltip(ability: any, element: HTMLElement): void {
    const tooltip = document.getElementById('ability-tooltip');
    if (!tooltip) return;

    let details = `
      <div class="tooltip-title">${ability.name}</div>
      <div class="tooltip-description">${ability.description}</div>
    `;

    if (ability.cooldown > 0) {
      details += `<div class="tooltip-meta">Cooldown: ${ability.cooldown} turns</div>`;
    }

    if (ability.damageMultiplier) {
      details += `<div class="tooltip-meta">Power: ${Math.round(ability.damageMultiplier * 100)}%</div>`;
    }

    tooltip.innerHTML = details;
    tooltip.style.display = 'block';
    tooltip.classList.add('active');

    // Position tooltip above the button
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 15}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
  }

  private hideAbilityTooltip(): void {
    const tooltip = document.getElementById('ability-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  private showStatusTooltip(content: string, element: HTMLElement): void {
    const tooltip = document.getElementById('ability-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = content;
    tooltip.style.display = 'block';

    // Position tooltip above the icon
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 5}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
  }

  private displayBattleIn3D(): void {
    if (!this.combatSystem) return;
    this.sceneManager.clearAllCharacters();

    // 3D Model rendering disabled per user request to remove floating objects
    /*
    const state = this.combatSystem.getState();
    // Position player team
    state.playerTeam.characters.forEach((char, index) => {
      const zPos = 2; // Front row
      const xPos = (index - (state.playerTeam.characters.length - 1) / 2) * 2;
      this.sceneManager.createCharacterModel(char, new THREE.Vector3(xPos, 0, zPos));
    });
  
    // Position enemy team
    state.enemyTeam.characters.forEach((char, index) => {
      const zPos = -2; // Enemy row
      const xPos = (index - (state.enemyTeam.characters.length - 1) / 2) * 2;
      this.sceneManager.createCharacterModel(char, new THREE.Vector3(xPos, 0, zPos));
    });
    */
  }

  private startAutoBattle(): void {
    if (!this.combatSystem || this.combatSystem.getState().isOver) return;

    // Check interval to avoid double start
    if (this.autoBattleInterval) return;

    this.autoBattleInterval = window.setInterval(() => {
      if (!this.combatSystem || this.combatSystem.getState().isOver) {
        this.stopAutoBattle();
        return;
      }

      // Execute turn with isAuto = true
      this.combatSystem.executeTurn(true);
      this.updateBattleUI();

    }, 1000); // 1-second delay between moves

    // Update Button UI
    const btn = document.getElementById('btn-auto-battle');
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = '<span class="icon">⚡</span> STOP';
    }
  }

  private stopAutoBattle(): void {
    if (this.autoBattleInterval) {
      clearInterval(this.autoBattleInterval);
      this.autoBattleInterval = null;
    }

    // Update Button UI
    const btn = document.getElementById('btn-auto-battle');
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<span class="icon">⚡</span> AUTO';
    }
  }

  private executeNextTurn(): void {
    if (!this.combatSystem) return;

    if (this.combatSystem.getState().isOver) {
      this.updateBattleUI();
      return; // Battle over
    }

    // Try to execute. If it returns false, it means it's waiting for player input.
    // isAuto=false for normal manual flow
    const turnComplete = this.combatSystem.executeTurn(false);

    if (turnComplete) {
      this.updateBattleUI();
      // If turn completed (e.g. skip turn, or AI turn), automatically trigger next
      setTimeout(() => this.executeNextTurn(), 1000); // Delay for visual pacing
    } else {
      // Waiting for player. Update UI to show skills.
      this.updateBattleUI();
    }
  }

  private updateBattleUI(): void {
    if (!this.combatSystem) return;

    const state = this.combatSystem.getState();

    // Hide auto-battle button in PVP mode
    // Update Auto Battle visual state
    const autoBattleBtn = document.getElementById('btn-battle-auto');
    if (autoBattleBtn) {
      if (this.autoBattleInterval) autoBattleBtn.classList.add('active');
      else autoBattleBtn.classList.remove('active');
    }

    // Render Turn Meter
    this.renderTurnMeter();

    // Render Tiles for both teams
    this.renderBattleGrid('player-battle-grid', state.playerTeam.characters, false);
    this.renderBattleGrid('enemy-battle-grid', state.enemyTeam.characters, true);

    // Render ability buttons
    this.renderAbilityButtons();

    // Show target selection message if waiting
    const msg = document.getElementById('target-selection-msg')!;
    msg.style.display = state.waitingForTargetSelection ? 'block' : 'none';

    // Stop auto battle if over
    if (state.isOver) {
      this.stopAutoBattle();
      this.showResultsScreen();
    }
  }



  private renderBattleGrid(containerId: string, characters: Character[], isEnemy: boolean): void {
    const container = document.getElementById(containerId)!;
    container.innerHTML = '';

    const state = this.combatSystem?.getState();
    const currentChar = this.combatSystem?.getCurrentCharacter();
    const isWaiting = state?.waitingForTargetSelection;
    const availableInputs = state?.availableTargets || [];

    characters.forEach(character => {
      const isDead = character.stats.currentHealth <= 0;
      const healthPercent = (character.stats.currentHealth / character.stats.maxHealth) * 100;

      // Use instanceId for unique identification in battle, fallback to id
      const uniqueId = character.instanceId || character.id;
      // Targetable uses correct ID match
      // FIX: Removed 'isEnemy' check to allow selecting self/allies if they are in availableInputs
      const isTargetable = isWaiting && availableInputs.some(t => (t.instanceId || t.id) === uniqueId);
      // Acting check uses correct ID match
      const isActing = (currentChar?.instanceId || currentChar?.id) === uniqueId;

      const tile = document.createElement('div');
      tile.className = `battle-tile ${isEnemy ? 'enemy-tile' : 'player-tile'} ${isDead ? 'dead' : ''} ${isTargetable ? 'targetable' : ''} ${isActing ? 'acting' : ''}`;
      tile.setAttribute('data-character-id', uniqueId);

      // HP Bar Color class
      let hpClass = 'hp-high';
      if (healthPercent <= 25) hpClass = 'hp-low';
      else if (healthPercent <= 50) hpClass = 'hp-medium';

      // Avatar/Visual removed per request
      /*
      let avatar = '👤';
      if (character.visual.modelType === 'cube') avatar = '🟥';
      if (character.visual.modelType === 'sphere') avatar = '🔴';
      if (character.visual.modelType === 'cylinder') avatar = '🔺';
      */

      // Sync 3D model state
      this.sceneManager.setCharacterState(character.id, isDead);

      tile.innerHTML = `
        <div class="battle-tile-info">
          <div class="battle-tile-name">${character.name}</div>
          <div class="battle-tile-hp-bar">
             <div class="hp-fill ${hpClass}" style="width: ${Math.max(0, healthPercent)}%"></div>
          </div>
          <div class="status-effect-bar" style="margin-top: 5px; font-size: 1.2rem; display: flex; gap: 4px; height: 1.5rem; justify-content: center;">
            ${character.statusEffects.map(e => {
        const iconMap: Record<string, string> = {
          'stun': '💫', 'regen': '💚', 'defence_up': '🛡️', 'attack_up': '⚔️',
          'vulnerable': '💔', 'marked': '🎯', 'silenced': '🤐',
          'evasion_up': '💨', 'counter': '↩️', 'dot': '☠️'
        };

        const effectData: Record<string, { name: string, desc: string }> = {
          'stun': { name: 'Stunned', desc: 'Skips the next turn.' },
          'regen': { name: 'Regeneration', desc: 'Recovers HP at the start of each turn.' },
          'defence_up': { name: 'Defence Up', desc: 'Increases defense by 50% and reduces incoming damage by 30%.' },
          'attack_up': { name: 'Attack Up', desc: 'Increases attack power by 50%.' },
          'vulnerable': { name: 'Vulnerable', desc: 'Increases incoming damage by 30%.' },
          'marked': { name: 'Marked', desc: 'Cannot dodge and guaranteed to be hit.' },
          'silenced': { name: 'Silenced', desc: 'Cannot use special abilities.' },
          'evasion_up': { name: 'Evasion Up', desc: 'Increases evasion by 20%.' },
          'counter': { name: 'Counter', desc: 'Automatically attacks back when hit.' },
          'dot': { name: 'Poison', desc: 'Takes damage at the start of each turn.' }
        };

        const data = effectData[e.type] || { name: e.type, desc: '' };
        const tooltipContent = `<strong>${data.name}</strong><br>${data.desc}<br><em>Duration: ${e.duration} turns</em>`;

        return `<span class="status-icon" 
                      data-tooltip="${tooltipContent}" 
                      style="cursor: help;">
                ${iconMap[e.type] || '❓'}
              </span>`;
      }).join('')}
          </div>
          <div class="battle-tile-hp-text" style="font-weight: 800; color: white; margin-top: 2px;">${Math.floor(character.stats.currentHealth)}/${character.stats.maxHealth}</div>
        </div>
        ${isActing ? '<div class="turn-marker" style="position: absolute; top: -10px; background: #ffd700; color: black; font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.5rem; border-radius: 4px;">TURN</div>' : ''}
      `;

      // Add tooltip listeners to status icons
      tile.querySelectorAll('.status-icon').forEach(icon => {
        const content = icon.getAttribute('data-tooltip') || '';
        icon.addEventListener('mouseenter', () => {
          this.showStatusTooltip(content, icon as HTMLElement);
        });
        icon.addEventListener('mouseleave', () => {
          this.hideAbilityTooltip(); // Reuse the same hide logic
        });
      });

      if (isTargetable) {
        const selectTarget = () => {
          this.combatSystem?.selectTarget(character.instanceId || character.id);
          this.updateBattleUI();

          // Trigger the turn execution immediately after selection
          // This will execute the player's attack and then run enemy turns via processTurns
          this.executeNextTurn();
        };

        tile.addEventListener('click', selectTarget);

        tile.addEventListener('touchend', (e) => {
          e.preventDefault();
          selectTarget();
        }, { passive: false });
      }
      container.appendChild(tile);
    });
  }







  private runAutoBattleLoop(): void {
    if (!this.autoBattleInterval || !this.combatSystem || this.combatSystem.state.isOver) {
      return;
    }

    const current = this.combatSystem.getCurrentCharacter();
    if (!current) return;

    // Execute turn with auto flag
    const completed = this.combatSystem.executeTurn(true);
    this.updateBattleUI();

    // Continue loop after a delay
    if (completed && this.autoBattleInterval) {
      setTimeout(() => this.runAutoBattleLoop(), 1000 / this.combatSystem.getBattleSpeed());
    }
  }

  private showResultsScreen(): void {
    this.stopAutoBattle();
    const state = this.combatSystem!.getState();

    // Save ONLY player team characters back to manager (opponents are temporary)
    state.playerTeam.characters.forEach(char => {
      char.statusEffects = []; // Clean up status effects before saving state
      this.characterManager.updateCharacter(char);
    });

    this.showScreen('results-screen');

    // Update results title
    const title = document.getElementById('results-title')!;
    title.textContent = state.winner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT!';
    title.style.color = state.winner === 'player' ? '#4facfe' : '#f5576c';

    // Show XP gains for PLAYER TEAM ONLY
    const xpContainer = document.getElementById('results-xp')!;
    xpContainer.innerHTML = '<h3>XP Earned:</h3>';

    const baseWinXP = 100;
    const baseLoseXP = 50;
    const multiplier = this.combatSystem?.xpMultiplier || 1.0;

    const xpGained = Math.floor((state.winner === 'player' ? baseWinXP : baseLoseXP) * multiplier);
    state.playerTeam.characters.forEach(char => {
      const div = document.createElement('div');
      div.textContent = `${char.name}: +${xpGained} XP`;
      xpContainer.appendChild(div);
    });

    // Show level ups for PLAYER TEAM ONLY
    const levelupContainer = document.getElementById('results-levelups')!;
    const leveledUpChars = state.playerTeam.characters.filter(char => char.availableStatPoints > 0);

    if (leveledUpChars.length > 0) {
      levelupContainer.innerHTML = '<h3>🎉 Level Ups:</h3>';
      leveledUpChars.forEach(char => {
        const div = document.createElement('div');
        div.className = 'levelup-entry';
        div.style.marginBottom = '0.5rem';

        div.innerHTML = `
            <span>${char.name} reached Level ${char.level}! (+${char.availableStatPoints} points)</span>
            <button class="btn-upgrade-now" style="margin-left: 10px; padding: 2px 8px; font-size: 0.8rem; background: #4facfe; border: none; border-radius: 4px; color: white; cursor: pointer;">Upgrade Now</button>
        `;

        div.querySelector('.btn-upgrade-now')?.addEventListener('click', () => {
          this.showStatsScreen();
          this.showStatAllocation(char.id, 'results-screen');
        });

        levelupContainer.appendChild(div);
      });
    } else {
      levelupContainer.innerHTML = '';
    }

    // Handle Loot (Sleeping Bag) - TESTING: Give 5 fragments
    const lootContainer = document.getElementById('results-loot')!;
    lootContainer.innerHTML = ''; // Clear previous loot

    if (state.loot) {
      const lootChar = this.characterManager.getCharacterById(state.loot.characterId)!;

      // Add 1 fragment
      const justUnlocked = this.characterManager.addFragment(lootChar.id);

      const lootDiv = document.createElement('div');
      lootDiv.style.marginTop = '1rem';
      lootDiv.style.padding = '1rem';
      lootDiv.style.background = 'rgba(255, 215, 0, 0.1)';
      lootDiv.style.border = '2px solid #FFD700';
      lootDiv.style.borderRadius = '8px';

      const updatedChar = this.characterManager.getCharacterById(lootChar.id)!; // Get updated fragments

      lootDiv.innerHTML = `
        <h3 style="color: #FFD700">🎁 SLEEPING BAG FOUND!</h3>
        <p>You found a fragment for <strong>${lootChar.name}</strong>!</p>
        <p>Fragments: ${updatedChar.fragments}/5</p>
        ${justUnlocked ? `<p style="color: #4facfe; font-weight: bold; margin-top: 0.5rem">🎉 ${lootChar.name} UNLOCKED! You can now use them in battle!</p>` : ''}
      `;
      lootContainer.appendChild(lootDiv);
    }
  }

  private showStatsScreen(): void {
    this.showScreen('stats-screen');
    this.renderCharacterSelector();
  }

  private renderCharacterSelector(): void {
    const container = document.getElementById('character-selector-list')!;
    container.innerHTML = '';

    const characters = this.characterManager.getAllCharacters()
      .filter(char => char.availableStatPoints > 0);

    if (characters.length === 0) {
      container.innerHTML = '<p>No characters have stat points to allocate</p>';
      return;
    }

    characters.forEach(char => {
      const button = document.createElement('button');
      button.className = 'btn btn-secondary';
      button.textContent = `${char.name} (${char.availableStatPoints} points)`;
      button.addEventListener('click', () => {
        this.showStatAllocation(char.id);
      });
      container.appendChild(button);
    });

    // Auto-select first character
    if (characters.length > 0) {
      this.showStatAllocation(characters[0].id);
    }
  }

  private showStatAllocation(characterId: string, returnScreen: string = 'results-screen'): void {
    this.pendingStatReturnScreen = returnScreen;
    const character = this.characterManager.getCharacterById(characterId);
    if (!character) return;

    const nameEl = document.getElementById('selected-char-name')!;
    nameEl.textContent = character.name;
    nameEl.setAttribute('data-char-id', characterId); // Store ID for refresh

    // Calculate effective available points (base - temp allocated)
    const pendingStats = this.tempAllocatedPoints.get(characterId) || [];
    const effectiveAvailable = character.availableStatPoints - pendingStats.length;

    document.getElementById('available-points')!.textContent = effectiveAvailable.toString();

    const statList = document.getElementById('stat-list')!;
    statList.innerHTML = '';

    const stats: Array<{ key: keyof Character['stats'], label: string }> = [
      { key: 'maxHealth', label: 'Max Health' },
      { key: 'attack', label: 'Attack' },
      { key: 'defense', label: 'Defense' },
      { key: 'speed', label: 'Speed' },
      { key: 'healthSteal', label: 'Health Steal (%)' },
      { key: 'evasion', label: 'Evasion (%)' },
      { key: 'accuracy', label: 'Accuracy (%)' },
      { key: 'critChance', label: 'Crit Chance (%)' },
      { key: 'critDamage', label: 'Crit Damage (%)' },
    ];

    stats.forEach(({ key, label }) => {
      const statRow = document.createElement('div');
      statRow.className = 'stat-row';

      const baseValue = character.stats[key];
      const addedPoints = pendingStats.filter(s => s === key).length;
      const displayValue = baseValue + addedPoints; // Simplified display (1 point = +1 visual, though logic differs)

      const isPercentage = ['healthSteal', 'evasion', 'accuracy', 'critChance'].includes(key);
      const isMaxed = isPercentage && displayValue >= 100;
      const canAdd = effectiveAvailable > 0 && !isMaxed;
      const canRemove = addedPoints > 0;

      statRow.innerHTML = `
        <span class="stat-label">${label}:</span>
        <span class="stat-value">${displayValue} ${addedPoints > 0 ? `<span style="color:#0f0">(+${addedPoints})</span>` : ''}</span>
        <div class="stat-buttons">
            <button class="btn-allocate remove" ${!canRemove ? 'disabled' : ''}>-</button>
            <button class="btn-allocate add" ${!canAdd ? 'disabled' : ''}>+</button>
        </div>
      `;

      statRow.querySelector('.add')?.addEventListener('click', () => {
        this.handleStatAllocation(characterId, key, 'add');
      });

      statRow.querySelector('.remove')?.addEventListener('click', () => {
        this.handleStatAllocation(characterId, key, 'remove');
      });

      statList.appendChild(statRow);
    });

    // Show confirm button if there are pending changes
    const confirmBtn = document.getElementById('btn-confirm-stats')!;
    confirmBtn.style.display = this.tempAllocatedPoints.size > 0 ? 'block' : 'none';
  }

  private handleStatAllocation(characterId: string, stat: keyof Character['stats'], operation: 'add' | 'remove'): void {
    if (!this.tempAllocatedPoints.has(characterId)) {
      this.tempAllocatedPoints.set(characterId, []);
    }
    const pending = this.tempAllocatedPoints.get(characterId)!;

    if (operation === 'add') {
      pending.push(stat);
    } else {
      const index = pending.lastIndexOf(stat);
      if (index > -1) {
        pending.splice(index, 1);
      }
    }

    // Cleanup empty
    if (pending.length === 0) {
      this.tempAllocatedPoints.delete(characterId);
    }

    this.showStatAllocation(characterId);
  }

  private showManageScreen(): void {
    this.showScreen('manage-screen');
    this.renderManageGrid();
  }

  private renderManageGrid(): void {
    const grid = document.getElementById('character-manage-grid')!;



    grid.innerHTML = '';
    grid.className = 'character-manage-grid';

    const allCharacters = this.characterManager.getAllCharacters();

    // Sort: Owned first
    allCharacters.sort((a, b) => {
      if (a.isOwned && !b.isOwned) return -1;
      if (!a.isOwned && b.isOwned) return 1;
      return 0;
    });

    allCharacters.forEach(character => {
      const card = document.createElement('div');
      card.className = `character-card-detailed ${character.isOwned ? 'owned' : 'unowned'}`;

      let content = '';

      if (character.isOwned) {
        // Build abilities HTML
        const abilitiesHtml = character.abilities.map(ability => {
          const typeLabel = ability.type === 'basic' ? '⚡ Basic' : '✨ Special';
          const typeClass = ability.type === 'basic' ? 'ability-basic' : 'ability-special';
          return `
            <div class="ability-item ${typeClass}">
              <div class="ability-header">
                <span class="ability-type-label">${typeLabel}</span>
                <span class="ability-name-label">${ability.name}</span>
              </div>
              <div class="ability-desc">${ability.description}</div>
            </div>
          `;
        }).join('');

        content = `
          <div class="character-info">
             <div class="character-name">${character.name}</div>
             <div class="character-level">Level ${character.level} | XP: ${character.experience}/${character.level * 100}</div>
             <div class="stat-points-badge" ${character.availableStatPoints > 0 ? '' : 'style="display:none"'} >
               +${character.availableStatPoints} Stat Points Available
             </div>
          </div>
          <div class="character-stats-detailed" style="text-align: center;"> <!-- Centered Stats -->
             <div class="stat-detail-row"><span>Health</span> <span>${character.stats.maxHealth}</span></div>
             <div class="stat-detail-row"><span>Attack</span> <span>${character.stats.attack}</span></div>
             <div class="stat-detail-row"><span>Defense</span> <span>${character.stats.defense}</span></div>
             <div class="stat-detail-row"><span>Speed</span> <span>${character.stats.speed}</span></div>
             <div class="stat-detail-row"><span>Health Steal</span> <span>${character.stats.healthSteal}%</span></div>
             <div class="stat-detail-row"><span>Evasion</span> <span>${character.stats.evasion}%</span></div>
             <div class="stat-detail-row"><span>Accuracy</span> <span>${character.stats.accuracy}%</span></div>
             <div class="stat-detail-row"><span>Crit Rate</span> <span>${character.stats.critChance}%</span></div>
             <div class="stat-detail-row"><span>Crit Dmg</span> <span>${character.stats.critDamage}%</span></div>
          </div>
          <div class="character-abilities-section">
            <div class="abilities-title">Abilities</div>
            ${abilitiesHtml}
          </div>
          ${character.availableStatPoints > 0 ? `<button class="btn btn-success btn-manage-upgrade" style="width: 100%; margin-top: 1rem;">Upgrade (+${character.availableStatPoints})</button>` : ''}
        `;
      } else {
        const fragments = character.fragments || 0;
        const progressPercent = (fragments / 5) * 100;

        content = `
           <div class="character-info-unowned">
             <div class="character-name">${character.name}</div>
             <div class="locked-status">🔒 Locked</div>
           </div>
           
           <div class="fragment-display">
             <div class="fragment-count">Bags Collected: ${fragments}/5</div>
             <div class="fragment-bar">
               <div class="fragment-bar-fill" style="width: ${progressPercent}%"></div>
             </div>
           </div>

            <div class="character-stats-detailed" style="filter: blur(4px); opacity: 0.5; user-select: none; text-align: center;">
              <div class="stat-detail-row"><span>Health</span> <span>???</span></div>
              <div class="stat-detail-row"><span>Attack</span> <span>???</span></div>
              <div class="stat-detail-row"><span>Defense</span> <span>???</span></div>
            </div>
         `;
      }

      card.innerHTML = content;

      // Add listener for Upgrade button
      const upgradeBtn = card.querySelector('.btn-manage-upgrade');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showStatsScreen();
          this.showStatAllocation(character.id, 'manage-screen');
        });
      }

      grid.appendChild(card);
    });
  }

  private setupAuthEventListeners(): void {
    let loginBtn = document.getElementById('btn-login');
    let registerBtn = document.getElementById('btn-register');

    // HMR Fix: Clone buttons to remove old listeners
    if (loginBtn) {
      const newLoginBtn = loginBtn.cloneNode(true) as HTMLElement;
      loginBtn.parentNode?.replaceChild(newLoginBtn, loginBtn);
      loginBtn = newLoginBtn;
    }
    if (registerBtn) {
      const newRegisterBtn = registerBtn.cloneNode(true) as HTMLElement;
      registerBtn.parentNode?.replaceChild(newRegisterBtn, registerBtn);
      registerBtn = newRegisterBtn;
    }
    const loginUser = document.getElementById('login-username') as HTMLInputElement;
    const loginPass = document.getElementById('login-password') as HTMLInputElement;
    const registerUser = document.getElementById('register-username') as HTMLInputElement;
    const registerPass = document.getElementById('register-password') as HTMLInputElement;
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const toRegisterLink = document.getElementById('link-to-register');
    const toLoginLink = document.getElementById('link-to-login');
    const rememberMeCheck = document.getElementById('remember-me') as HTMLInputElement;

    // Check for remembered credentials on startup
    const rememberedUser = localStorage.getItem('remembered_user');
    const rememberedPass = localStorage.getItem('remembered_pass');
    if (rememberedUser && rememberedPass) {
      if (loginUser) loginUser.value = rememberedUser;
      if (loginPass) loginPass.value = rememberedPass;
      if (rememberMeCheck) rememberMeCheck.checked = true;
    }

    // Navigation
    toRegisterLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showScreen('register-screen');
    });

    toLoginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showScreen('login-screen');
    });

    loginBtn?.addEventListener('click', async () => {
      const user = loginUser.value.trim();
      const pass = loginPass.value.trim();
      if (!user || !pass) return;

      if (loginMessage) loginMessage.textContent = 'Logging in...';
      // Remember Me Feature
      const rememberMe = (document.getElementById('remember-me') as HTMLInputElement).checked;
      if (rememberMe) {
        localStorage.setItem('remembered_user', user);
        localStorage.setItem('remembered_pass', pass);
      } else {
        localStorage.removeItem('remembered_user');
        localStorage.removeItem('remembered_pass');
      }

      const result = await this.authManager.login(user, pass);
      if (result.success) {
        this.onAuthSuccess(result.data, result.friendRequests);
      } else {
        if (loginMessage) {
          loginMessage.textContent = result.error || 'Login failed';
          loginMessage.className = 'auth-message error';
        }
      }
    });

    registerBtn?.addEventListener('click', async () => {
      const user = registerUser.value.trim();
      const pass = registerPass.value.trim();
      if (!user || !pass) return;

      if (registerMessage) {
        registerMessage.textContent = 'Creating account...';
        registerMessage.className = 'auth-message';
      }
      // Disable button to prevent double-clicks
      if (registerBtn) (registerBtn as HTMLButtonElement).disabled = true;

      const result = await this.authManager.register(user, pass);
      if (result.success) {
        if (registerMessage) {
          registerMessage.textContent = 'Account created! Redirecting to login...';
          registerMessage.className = 'auth-message success';
        }

        // Wait a bit then switch to login
        setTimeout(() => {
          this.showScreen('login-screen');
          // Populate username for convenience
          if (loginUser) loginUser.value = user;
          // Clear register fields
          if (registerUser) registerUser.value = '';
          if (registerPass) registerPass.value = '';
          if (registerMessage) registerMessage.textContent = '';
          // Re-enable button
          if (registerBtn) (registerBtn as HTMLButtonElement).disabled = false;
        }, 1500);
      } else {
        if (registerBtn) (registerBtn as HTMLButtonElement).disabled = false;
        if (registerMessage) {
          registerMessage.textContent = result.error || 'Registration failed';
          registerMessage.className = 'auth-message error';
        }
      }
    });
  }

  private setupAccountEventListeners(): void {
    const accountBtn = document.getElementById('btn-account');
    const closeAccountBtn = document.getElementById('btn-close-account');
    const accountModal = document.getElementById('account-modal');
    const logoutBtn = document.getElementById('btn-logout');
    const savePasswordBtn = document.getElementById('btn-save-password');

    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab - ${target} `)?.classList.add('active');
      });
    });

    accountBtn?.addEventListener('click', () => {
      this.openAccountModal();
    });

    closeAccountBtn?.addEventListener('click', () => {
      accountModal?.classList.remove('active');
    });

    logoutBtn?.addEventListener('click', () => {
      this.authManager.logout();
      window.location.reload(); // Simplest way to reset state
    });

    savePasswordBtn?.addEventListener('click', async () => {
      const oldPass = (document.getElementById('old-password') as HTMLInputElement).value;
      const newPass = (document.getElementById('new-password') as HTMLInputElement).value;
      const message = document.getElementById('account-action-message');

      if (!oldPass || !newPass) return;

      if (message) message.textContent = 'Changing password...';
      const result = await this.authManager.changePassword(oldPass, newPass);

      if (message) {
        message.textContent = result.success ? 'Password changed successfully!' : (result.error || 'Failed to change password');
        message.className = result.success ? 'auth-message success' : 'auth-message error';
      }
    });

    // Close on click outside
    accountModal?.addEventListener('click', (e) => {
      if (e.target === accountModal) {
        accountModal.classList.remove('active');
      }
    });
  }

  private openAccountModal(): void {
    const nameDisplay = document.getElementById('display-username');
    if (nameDisplay) nameDisplay.textContent = this.authManager.getUsername() || 'Chad';

    document.getElementById('account-modal')?.classList.add('active');

    const message = document.getElementById('account-action-message');
    if (message) {
      message.textContent = '';
      message.className = 'auth-message';
    }

    // DEV TOOL: Unlock All Characters (Only for 'tom')
    const username = this.authManager.getUsername();
    const modalBody = document.querySelector('.modal-body');
    const existingDevBtn = document.getElementById('btn-dev-unlock');

    if (username === 'tom' && modalBody && !existingDevBtn) {
      const devBtn = document.createElement('button');
      devBtn.id = 'btn-dev-unlock';
      devBtn.className = 'btn btn-primary';
      devBtn.style.marginTop = '1rem';
      devBtn.style.width = '100%';
      devBtn.style.background = '#ff00ff'; // Distinct color
      devBtn.innerHTML = '⚡ DEV: Unlock All Characters';

      devBtn.onclick = () => {
        if (confirm('Unlock all characters?')) {
          this.networkManager.unlockAllCharacters();
        }
      };

      // Append at the end of modal
      modalBody.appendChild(devBtn);
    }
  }

  private onAuthSuccess(userData: any, friendRequests: any[] = []): void {
    if (userData) {
      this.characterManager.setCharacters(userData);

      // User Request: Notification for friend requests
      if (friendRequests && friendRequests.length > 0) {
        this.updateInboxBadge(true);
      }
    } else {
      // New user or reset request - clear local cache so we don't load previous user's characters
      this.characterManager.reset();
    }

    // Setup sync to server
    this.characterManager.setSyncCallback((data) => {
      this.authManager.savePlayerData(data);
    });

    this.showScreen('main-menu');
    this.checkFirstTime();

    // Show Account HUD
    document.getElementById('hud-container')?.classList.add('active');

    // Connect to Network
    this.networkManager.connect(this.authManager.getUsername()!);
    this.setupNetworkEventListeners();
  }

  private setupNetworkEventListeners(): void {
    this.networkManager.on('search_results', (results: any[]) => {
      const container = document.getElementById('user-search-results')!;
      container.innerHTML = '';

      if (results.length === 0) {
        container.innerHTML = '<div style="padding:0.5rem; opacity:0.7">No users found</div>';
        return;
      }

      results.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-result-item';
        div.innerHTML = `
          <span>${u.username}</span>
          <button class="btn btn-small btn-success">Add</button>
        `;
        div.querySelector('button')!.addEventListener('click', () => {
          this.networkManager.sendFriendRequest(u.username);
          // Removed alert, button could change state here for feedback but keeping it simple as requested
          (div.querySelector('button') as HTMLButtonElement).innerText = 'Sent';
          (div.querySelector('button') as HTMLButtonElement).disabled = true;
        });
        container.appendChild(div);
      });
    });

    this.networkManager.on('new_friend_request', (data: any) => {
      this.updateInboxBadge(true);
      const fromUser = data?.from || 'Someone';
      this.showNotification(`New friend request from ${fromUser}!`);
    });

    this.networkManager.on('friend_added', (friendName: string) => {
      this.updateInboxBadge(false);
      this.networkManager.getFriendsList();
      this.showNotification(`You are now friends with ${friendName}!`);
    });

    this.networkManager.on('friends_list_update', (friends: any[]) => {
      const list = document.getElementById('friends-list')!;
      list.innerHTML = '';
      if (friends.length === 0) {
        list.innerHTML = '<p class="empty-state">No friends yet.</p>';
        return;
      }

      friends.forEach(f => {
        const div = document.createElement('div');
        div.className = `friend-item ${f.isOnline ? 'online' : 'offline'}`;
        div.innerHTML = `
          <div style="display:flex; flex-direction:column;">
            <span style="font-weight:bold">${f.username}</span>
            <span class="friend-status">${f.isOnline ? 'Online' : 'Offline'}</span>
          </div>
          ${f.isOnline ? `<button class="btn btn-small btn-primary btn-challenge">⚔️ Challenge</button>` : ''}
        `;

        if (f.isOnline) {
          div.querySelector('.btn-challenge')!.addEventListener('click', () => {
            // Instant challenge without confirm
            this.networkManager.challengeFriend(f.username);
            // alert("Challenge sent!"); // Removed
          });
        }

        list.appendChild(div);
      });
    });

    this.networkManager.on('inbox_update', (data: any) => {
      this.renderInbox(data.friendRequests || []);
    });

    this.networkManager.on('challenge_received', (data: any) => {
      console.log('DEBUG: Challenge received payload:', data);

      const modal = document.getElementById('challenge-modal');
      const text = document.getElementById('challenge-text');

      if (modal && text) {
        text.textContent = `Player "${data.from}" wants to battle you!`;
        modal.classList.add('active');

        // Setup listeners (cloning to remove old listeners to prevent duplicates per session)
        const acceptBtn = document.getElementById('btn-accept-challenge')!;
        const declineBtn = document.getElementById('btn-decline-challenge')!;

        const newAccept = acceptBtn.cloneNode(true);
        const newDecline = declineBtn.cloneNode(true);
        acceptBtn.parentNode!.replaceChild(newAccept, acceptBtn);
        declineBtn.parentNode!.replaceChild(newDecline, declineBtn);

        newAccept.addEventListener('click', () => {
          this.networkManager.acceptChallenge(data.from);
          modal.classList.remove('active');
        });

        newDecline.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      } else {
        if (data.from && data.roomId) {
          // A minimal approach is to log it or use a custom UI element, but that's a bigger task.
          // Checking task: "there seems to be a lot of dialogue boxes... I'd like to remove them".
          // It's risky to auto-accept battles.
          // I will keep this ONE confirm as it initiates gameplay, but clarify logic.
          // Actually, let's make it a non-blocking toast or banner?
          // Given constraints, I'll assume they want the standard flow but cleaner.
          // Let's use a subtle check.
          const accept = window.confirm(`${data.from} wants to battle!`); // Minimal text
          if (accept) {
            this.networkManager.acceptChallenge(data.roomId);
          } else {
            this.networkManager.declineChallenge(data.from);
          }
        }
      }
    });

    this.networkManager.on('challenge_error', (msg: string) => {
      // Removed alert
      console.error(`Challenge Failed: ${msg}`);
    });

    this.networkManager.on('battle_start', (data: any) => {
      // Phase 1: Go to Team Selection
      this.currentRoomId = data.roomId;
      this.showNetworkTeamSelect();
    });

    this.networkManager.on('battle_commence', (data: any) => {
      // Phase 2: Actual Battle
      // data contains { p1, p2 } with teams.
      // We need to map this to the format startNetworkBattle expects.
      // startNetworkBattle expects { roomId, opponentTeam: [], isHost? }

      const myUsername = this.authManager.getUsername();
      const opponent = data.p1.username === myUsername ? data.p2 : data.p1;

      // We need to pass the opponent team to startNetworkBattle
      // and also set OUR team based on what we selected? 
      // startNetworkBattle currently grabs 'getOwnedCharacters().slice(0,5)'.
      // We should store our selected team in a class property 'selectedNetworkTeam'.

      // Let's refactor startNetworkBattle slightly or just hack the data it receives.

      const battleData = {
        roomId: data.roomId,
        opponent: opponent.username,
        opponentTeam: opponent.team,
        // We also need to know OUR selected team to pass to combat system?
        // startNetworkBattle currently grabs 'getOwnedCharacters().slice(0,5)'.
        // We should store our selected team in a class property 'selectedNetworkTeam'.
      };
      this.startNetworkBattle(battleData);
    });

    this.networkManager.on('battle_action', (_data: any) => {
      // Self-echo (usually ignored or used for confirmation)
    });

    this.networkManager.on('opponent_action', (action: any) => {
      // Remote action from opponent
      if (this.combatSystem && action) {
        console.log("Applying opponent action:", action);
        this.combatSystem.applyRemoteAction(action);
        this.updateBattleUI();

        // Execute the next turn to set up waiting state for current player
        this.combatSystem.executeTurn();
        this.updateBattleUI();
      }
    });

    this.networkManager.on('battle_forfeited', (data: any) => {
      // data: { winner: string, loser: string }
      const myUsername = this.authManager.getUsername();
      const isWinner = myUsername === data.winner;

      this.stopAutoBattle();

      if (this.combatSystem) {
        // Force battle end state
        const state = this.combatSystem.getState();
        state.isOver = true;
        state.winner = isWinner ? 'player' : 'enemy';
        this.showResultsScreen();
      } else {
        // Fallback if system is already cleared (shouldn't happen with new logic, but safe)
        this.combatSystem = null; // Clean up
        // No alert
        if (isWinner) {
          this.showScreen('main-menu');
          // Maybe show a simple banner or just return
        } else {
          this.showScreen('main-menu');
        }
      }
    });

    this.networkManager.on('battle_matched', (data: any) => {
      console.log("Battle matched data:", data);
      // { roomId, opponent, opponentTeam, isHost }
      document.getElementById('matchmaking-status')!.style.display = 'none';

      // IMPORTANT: Start the battle system after displaying
      console.log("Matched with:", data.opponent);
      this.startNetworkBattle(data);
    });
  }

  private updateInboxBadge(show: boolean): void {
    const badge = document.getElementById('inbox-badge')!;
    badge.style.display = show ? 'flex' : 'none';
    if (show) badge.textContent = '!';
  }

  private showInbox(): void {
    document.getElementById('inbox-modal')?.classList.add('active');
    this.networkManager.getInbox();
  }

  private renderInbox(requests: any[]): void {
    const list = document.getElementById('inbox-list')!;
    list.innerHTML = '';

    if (requests.length === 0) {
      list.innerHTML = '<p class="empty-state">No new messages.</p>';
      return;
    }

    requests.forEach(req => {
      const div = document.createElement('div');
      div.className = 'inbox-item';
      div.innerHTML = `
          <div class="inbox-item-content">
            <span class="inbox-item-title">Friend Request</span>
            <span class="inbox-item-time">From: ${req.from}</span>
          </div>
          <div class="inbox-actions">
            <button class="btn btn-small btn-success accept-btn">Accept</button>
            <button class="btn btn-small btn-danger reject-btn">Reject</button>
          </div>
      `;

      // Explicitly attach listeners to the newly created elements
      const acceptBtn = div.querySelector('.accept-btn');
      const rejectBtn = div.querySelector('.reject-btn');

      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
          // Disable button immediately to prevent double-clicks
          (acceptBtn as HTMLButtonElement).disabled = true;
          (acceptBtn as HTMLButtonElement).innerText = '...';

          console.log(`Accepting friend request from: ${req.from}`);
          this.networkManager.acceptFriendRequest(req.from);

          // Optimistic UI update
          setTimeout(() => {
            this.networkManager.getInbox(); // Refresh inbox to clear item
          }, 500);
        });
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          // For now, no reject API? Just hide it or we need a reject endpoint?
          // Assuming no reject endpoint exists yet based on review, so just locally hide or implement if API exists.
          // Looking at server.js, there is NO reject_friend_request... 
          // We'll just ignore it for now or assume implementation later.
          div.remove();
        });
      }

      list.appendChild(div);
    });
  }

  // Helper for non-intrusive notifications
  private showNotification(message: string, duration: number = 3000): void {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.background = 'rgba(20, 20, 30, 0.95)';
    toast.style.border = '1px solid #4facfe';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toast.style.minWidth = '250px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';

    toast.innerHTML = `<span style="font-weight:bold; color: #4facfe">Notice</span><div style="margin-top:4px">${message}</div>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  private showFriendsScreen(): void {
    this.showScreen('friends-screen');
    this.networkManager.getFriendsList();
  }

  private showNetworkTeamSelect(): void {
    this.showScreen('network-team-select-screen');
    const grid = document.getElementById('network-select-grid')!;
    grid.innerHTML = '';
    this.selectedNetworkTeamIds = [];

    const readyBtn = document.getElementById('btn-network-ready') as HTMLButtonElement;
    readyBtn.disabled = true;
    readyBtn.textContent = 'Select 1-5 Chads';
    // Clear old listeners
    const newBtn = readyBtn.cloneNode(true) as HTMLButtonElement;
    readyBtn.parentNode!.replaceChild(newBtn, readyBtn);

    newBtn.addEventListener('click', () => {
      if (!this.currentRoomId) return;

      // Hydrate team before sending (Client-Authoritative for now)
      const fullTeam = this.selectedNetworkTeamIds.map(id => {
        const owned = this.characterManager.getOwnedCharacters().find(c => c.id === id);
        const template = this.characterManager.getCharacterForBattle(id);
        if (!owned || !template) return null;

        // Merge for network transmission
        return {
          ...template,
          id: id,
          stats: owned.stats || template.stats,
          level: owned.level || 1,
          visual: template.visual,
          abilities: template.abilities, // Crucial!
          // Reset runtime
          statusEffects: [],
          abilityCooldowns: {} // Map converts to object for JSON? No, Maps don't serialize.
          // We'll init cooldowns on receiver side anyway.
        };
      }).filter(c => c !== null);

      newBtn.disabled = true;
      newBtn.textContent = 'Waiting for opponent...';
      this.networkManager.emit('battle_ready', { roomId: this.currentRoomId, team: fullTeam });
    });

    const owned = this.characterManager.getOwnedCharacters();
    owned.forEach(char => {
      const card = document.createElement('div');
      card.className = 'character-card'; // Reuse style
      // Add basic visual
      const template = this.characterManager.getCharacterForBattle(char.id);
      if (!template) return;

      card.innerHTML = `
        <div class="card-inner" style="border: 2px solid transparent; padding: 10px;">
          <h4 style="margin: 0 0 5px 0;">${template.name}</h4>
          <p style="margin: 0;">Lvl ${char.level}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        const idx = this.selectedNetworkTeamIds.indexOf(char.id);
        if (idx >= 0) {
          this.selectedNetworkTeamIds.splice(idx, 1);
          (card.querySelector('.card-inner') as HTMLElement).style.border = '2px solid transparent';
          (card.querySelector('.card-inner') as HTMLElement).style.background = '';
        } else {
          if (this.selectedNetworkTeamIds.length >= 5) {
            // Removed Intrusive alert
            // Visual feedback wiggle?
            return;
          }
          this.selectedNetworkTeamIds.push(char.id);
          (card.querySelector('.card-inner') as HTMLElement).style.border = '2px solid #00ff00';
          (card.querySelector('.card-inner') as HTMLElement).style.background = 'rgba(0, 255, 0, 0.2)';
        }

        // Update Button
        if (this.selectedNetworkTeamIds.length > 0) {
          newBtn.disabled = false;
          newBtn.textContent = 'READY';
        } else {
          newBtn.disabled = true;
          newBtn.textContent = 'Select 1-5 Chads';
        }
      });
      grid.appendChild(card);
    });
  }

  private startNetworkBattle(data: any): void {
    this.currentRoomId = data.roomId; // Ensure roomId is synchronized
    this.showScreen('battle-screen');

    // Reset Forfeit Button State
    const forfeitBtn = document.getElementById('btn-back-from-battle') as HTMLButtonElement;
    if (forfeitBtn) {
      forfeitBtn.textContent = 'FORFEIT';
      forfeitBtn.disabled = false;
    }

    // Helper to hydrate character data
    const hydrate = (stored: any): Character => {
      const template = this.characterManager.getCharacterForBattle(stored.id);
      if (!template) {
        console.warn(`Template not found for ${stored.id}, returning raw`);
        return stored;
      }

      // Merge Template (Abilities/Visuals) with Stored (Level/Stats)
      return {
        ...template,
        id: stored.id, // Ensure ID matches
        // Stats: Use stored stats if they exist (from leveling), else template defaults
        stats: stored.stats ? { ...stored.stats } : { ...template.stats },
        // Level/XP
        level: stored.level || 1,
        experience: stored.experience || 0,
        availableStatPoints: stored.availableStatPoints || 0,
        // Visuals: Stored might have overrides? Use template for now.
        visual: template.visual,
        // Abilities: ALWAYS use template abilities (DB doesn't store them usually)
        abilities: template.abilities,
        // Runtime: Reset Health/Cooldowns
        statusEffects: [],
        abilityCooldowns: new Map() // Fresh map
      };
    };

    // Parse My Team (using SELECTED team)
    const myOwned = this.characterManager.getOwnedCharacters();
    // Filter by selected IDs
    const selectedObjects = myOwned.filter(c => this.selectedNetworkTeamIds.includes(c.id));
    // If empty (shouldn't happen), fallback to first 5
    const finalSelection = selectedObjects.length > 0 ? selectedObjects : myOwned.slice(0, 5);

    const myTeamChars = finalSelection.map(c => hydrate(c));

    // Parse Opponent Team (from data)
    const opponentChars: Character[] = data.opponentTeam.map((c: any) => hydrate(c));

    // Ensure Health is full
    myTeamChars.forEach(c => c.stats.currentHealth = c.stats.maxHealth);
    opponentChars.forEach(c => c.stats.currentHealth = c.stats.maxHealth);

    const yourTeam: Team = {
      name: "Your Team",
      characters: myTeamChars,
      color: '#4a90e2'
    };

    const enemyTeam: Team = {
      name: data.opponent || "Opponent",
      characters: opponentChars,
      color: '#e74c3c'
    };

    const lootIds = opponentChars.map(c => c.id); // Loot? 

    // Initialize Combat System
    // isHost determines who calculates turns? For now, we run local simulation visually matching server?
    // Actually, purely network driven? No, 'battle_action' suggests remote.
    // So we just need to init.
    // If data.isHost is missing, we might have issues with who goes first?
    // CombatSystem handles 'startBattle' to determine order.

    this.combatSystem = new CombatSystem(yourTeam, enemyTeam, lootIds, 1.0, true,
      (action) => {
        // Emit action to server
        this.networkManager.sendBattleAction(data.roomId, action);
      },
      (result) => {
        this.networkManager.notifyBattleEnd(data.roomId, result);
        // Local cleanup
        // alert("Battle Over! Winner: " + result.winner);
      },
      data.opponent  // Pass opponent username for leaderboard tracking
    );
    this.displayBattleIn3D();
    this.updateBattleUI();

    // Start the battle system (calculates turn order and executes first turn once)
    this.combatSystem.startBattle();

    // Update UI to reflect initial turn state
    this.updateBattleUI();

    // We need to Override applyAbility to Send events instead of just executing, 
    // OR hook into executeTurn. 
    // This part is the "Networked Combat" complexity. 
    // I will leave this as "Local simulation" for now to satisfy the UI requirement first.
  }
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
