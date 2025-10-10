# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DTA Office is a 2D office interaction game built with Phaser 3, TypeScript, and Svelte. Players explore an office environment and interact with NPCs through comic-style dialogue bubbles.

## Build and Development Commands

**CRITICAL: This project uses `pnpm`, NOT `npm`.** Always use pnpm for all package management operations.

```bash
# Install dependencies
pnpm install

# Development mode (with hot reload)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Architecture Overview

### Core Systems

The game follows an event-driven architecture with three main layers:

1. **Game Scene Layer** (`src/game/scenes/Game.ts`)
   - Main game scene that orchestrates all game systems
   - Handles background scaling and responsive layout
   - Manages both standing NPCs and hotspot-based NPCs
   - Coordinate transformation system for responsive design (data coordinates → world coordinates)

2. **Manager Layer**
   - `DialogueManager`: Handles dialogue bubble lifecycle and positioning
   - `NPCManager`: Manages standing NPC instances and their data

3. **Game Objects Layer**
   - `DialogueBubble`: Renders comic-style dialogue bubbles with tails
   - `NPC`: Represents interactive standing NPC characters

### Event System

The project uses two event buses:

- **Phaser Scene Events** (`this.scene.events`): For game-internal communication
  - `show-dialogue`: Trigger dialogue display
  - `dialogue-shown`: Dialogue bubble appeared
  - `dialogue-hidden`: Dialogue bubble disappeared

- **Global EventBus** (`src/game/EventBus.ts`): For Phaser ↔ Svelte communication
  - `current-scene-ready`: Scene initialization complete

### Data Flow

1. Character data is loaded from `static/assets/data/characters.json`
2. Characters are split into two types:
   - `standingNpcs`: Visible sprite-based NPCs managed by NPCManager
   - `hotspotNpcs`: Invisible clickable zones (e.g., for seated characters)
3. Both types reference the same character database by `characterId`
4. Clicking an NPC/hotspot emits `show-dialogue` event
5. DialogueManager creates and positions DialogueBubble instances

### Coordinate System

The game uses a dual coordinate system:

- **Data Coordinates**: Fixed coordinates from character JSON (based on 1024x1024 source image)
- **World Coordinates**: Runtime coordinates after scaling for responsive display

Transformation methods in Game.ts:
- `dataToWorldX/Y()`: Convert data → world coordinates
- `worldToDataX/Y()`: Convert world → data coordinates
- `transformNpcCoordinates()`: Transform NPC positions and radii

### Configuration

Game configuration is centralized in:
- `src/game/config/gameConfig.json`: Asset paths, dimensions, frame sizes
- `svelte.config.js`: Base path differs between dev (`""`) and production (`"/dta-office"`)

## Key Technical Details

### Responsive Background Scaling

The Game scene implements FIT scaling that:
1. Calculates fit scale based on canvas vs. source image dimensions
2. Applies scaling to background and stores scale factors
3. Transforms all NPC coordinates using these scale factors
4. Recalculates on window resize

### Hotspot System

Hotspot NPCs use Phaser Zones with circular hit areas:
- Zones are invisible but interactive
- Circle radius and position are transformed to world coordinates
- Debug mode (press 'H' key) shows hotspot boundaries and coordinates

### Development Debugging

In dev mode (`import.meta.env.DEV`), the game exposes `window.__DTA_DEBUG__` with utilities:
- `listHotspots()`: Show all hotspot data
- `triggerHotspot(id)`: Programmatically trigger hotspot interaction
- `triggerAllHotspots({ delay, loop })`: Sequential hotspot testing
- `dataToWorld(x, y)` / `worldToData(x, y)`: Coordinate conversion

## Common Patterns

### Adding New NPCs

1. Add character data to `static/assets/data/characters.json` in the `characters` array
2. Add NPC configuration to either `standingNpcs` or `hotspotNpcs` array
3. For standing NPCs: Specify `characterId`, `x`, `y`, `spriteFrame`
4. For hotspot NPCs: Specify `characterId`, `x`, `y`, `radius`, and optional bubble offsets

### Modifying Dialogue Appearance

Dialogue bubble styling is in `DialogueBubble.ts`:
- Font: `fontSize`, `color`, `fontFamily` in text object creation
- Bubble: `padding`, `cornerRadius` properties
- Tail: `tailSize` property

### Extending Game Scenes

To add new Phaser scenes:
1. Create scene class in `src/game/scenes/`
2. Add to scene array in `src/game/main.ts` config
3. Use EventBus for Svelte communication if needed

## Project Structure

```
src/
├── game/                    # Phaser game code
│   ├── scenes/             # Game scenes
│   │   └── Game.ts         # Main office scene
│   ├── managers/           # System managers
│   │   ├── DialogueManager.ts
│   │   └── NPCManager.ts
│   ├── objects/            # Game objects
│   │   ├── DialogueBubble.ts
│   │   └── NPC.ts
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration
│   ├── types/              # TypeScript types
│   ├── EventBus.ts         # Global event bus
│   └── main.ts             # Game entry point
├── lib/                    # Svelte components and utilities
└── routes/                 # SvelteKit routes

static/assets/              # Game assets
└── data/                   # JSON data files
    └── characters.json     # Character and NPC data
```

## Deployment

The project is configured for GitHub Pages deployment:
- Static adapter in `svelte.config.js`
- Base path set to `/dta-office` in production
- Build output goes to `build/` directory
