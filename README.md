# Kerna: Galaxy of Chads - Alpha Build 2.0

**Version**: Alpha Build 2.0  
**Status**: Active Development

**Kerna: Galaxy of Chads** is a PVP auto-battler where you collect, train, and battle a roster of 19 unique "Chad" characters. Build your team of 5, allocate stats, master unique abilities, and dominate the arena.

## 🎮 Game Features (Alpha Build 2.0)

### Core Gameplay
*   **5v5 Combat**: Build teams of up to 5 Chads for epic battles.
*   **Strategic Combat**:
    *   **Speed Stat**: Determines turn order.
    *   **Manual Targeting**: Click enemy health bars to focus fire.
    *   **Battle Speed**: Defaulted to 2x for faster pacing.
    *   **Ability System**: Each character has 3 unique abilities (1 basic, 2 special).
    *   **Status Effects**: 10 battle effects including Stun, Regen, Defence Up, Attack Up, Vulnerable, Marked, Silenced, Evasion Up, Counter, and Damage Over Time.
*   **Progression**:
    *   **Leveling**: Earn XP from Training Mode and PVP (Character XP).
    *   **Stat Allocation**: Manually distribute points into Attack, Defense, Speed, Health, Accuracy, Evasion, Crit Chance, Crit Damage, and Health Steal.

### Game Modes
*   **Training Mode**:
    *   Battle against AI opponents.
    *   **Fixed Opponent Scaling**: Opponent team level is fixed to the average level of your team (no XP gain for opponents).
    *   **Rewards**: Earn XP and "Sleeping Bags" (loot boxes).
*   **PVP Arena**: 
    *   Real-time multiplayer battles against other players.
    *   Friend system with friend requests and status tracking.
    *   Match stats and leaderboard tracking.

### Systems & UI
*   **Account System**:
    *   **Login & Registration**: Dedicated screens for creating and accessing your account.
    *   **Cloud Save**: Progress is saved to the server.
*   **Collection**:
    *   **19 Unique Characters**: Unlockable via Fragments found in Sleeping Bags.
    *   **Sleeping Bags**: 25% drop chance from wins. Collect 5 fragments to unlock a character.
*   **Modern UI**:
    *   Glassmorphism aesthetics with "Inter" typography.
    *   **HUD**: Unified navigation with Home (context-aware) and Account Management buttons.
    *   **Dynamic Backgrounds**: 3D scene integration.

## 🚀 Getting Started

### Installation
1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Running the Game
*   **Development Server**:
    ```bash
    npm run dev
    ```
    Runs the Vite development server. Open the local URL (usually `http://localhost:5173`) to play.

*   **Backend Server**:
    ```bash
    npm run server
    ```
    Runs the Node.js/Express backend for authentication and data persistence. **Required** for Login/Register functionalities.

## 🛠️ Technical Details

*   **Frontend**: TypeScript, Vite, Three.js (Rendering), Vanilla CSS (Styling).
*   **Backend**: Node.js, Express (API), JSON-based persistence (Alpha).
*   **Architecture**:
    *   `src/systems/`: Game logic (Combat, Turn Systems, Character Management).
    *   `src/data/`: Static game data (Characters, XP Tables).
    *   `src/rendering/`: 3D visual layer.

## 📜 Release Notes

### Alpha Build 2.0 (Current)
*   **Ability System**: Each character now has 3 unique abilities with cooldowns and strategic effects.
*   **Status Effects**: 10 battle effects add depth to combat strategy.
*   **PVP Arena**: Real-time multiplayer battles with matchmaking.
*   **Friend System**: Add friends, send requests, and challenge them to battles.
*   **Enhanced UI**: Improved battle arena with ability selection and status effect indicators.
*   **Character Stats Display**: Two-column layout in character selection for better readability.

### Alpha Build 1.0 (Legacy)
*   **Refactored Navigation**: "Back" buttons consolidated into a HUD Home button.
*   **Balancing**: Training mode opponents no longer out-level the player.
*   **Performance**: Optimized for web deployment.
