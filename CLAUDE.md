# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DTA Office is a 2D office interaction game built with Phaser 3, TypeScript, and Svelte. Players explore an office environment, interact with NPCs through comic-style dialogue bubbles, and can generate AI-powered team dialogues on custom topics via API integration.

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
   - `TopicDialogueManager`: Handles topic-based dialogue generation via API

3. **Game Objects Layer**
   - `DialogueBubble`: Renders comic-style dialogue bubbles with tails
   - `NPC`: Represents interactive standing NPC characters

4. **UI Layer** (`src/game/ui/`)
   - `TopicInputUI`: Input field for entering dialogue topics
   - `TopicTitleUI`: Displays current topic with animated title
   - `TopicListUI`: Shows history of past topics
   - `ControlButtons`: Toggle buttons for topic input and history
   - `LoadingOverlay`: Animated loading screen during API calls

### Event System

The project uses two event buses:

- **Phaser Scene Events** (`this.scene.events`): For game-internal communication
  - `show-dialogue`: Trigger dialogue display
  - `dialogue-shown`: Dialogue bubble appeared
  - `dialogue-hidden`: Dialogue bubble disappeared

- **Global EventBus** (`src/game/EventBus.ts`): For Phaser ↔ Svelte communication
  - `current-scene-ready`: Scene initialization complete
  - `update-characters-dialogue`: Update NPC dialogues with new topic-based content

### Data Flow

**Character & NPC Setup:**
1. Character data is loaded from `static/assets/data/characters.json`
2. Characters are split into two types:
   - `standingNpcs`: Visible sprite-based NPCs managed by NPCManager
   - `hotspotNpcs`: Invisible clickable zones (e.g., for seated characters at round table)
3. Both types reference the same character database by `characterId`

**Dialogue Interaction:**
4. Each NPC tracks click count and has 3 dialogue lines
5. Clicking an NPC/hotspot increments counter and emits `show-dialogue` event with current dialogue
6. DialogueManager creates and positions DialogueBubble instances

**Topic-Based Dialogue Generation:**
7. User enters topic via TopicInputUI → TopicDialogueManager
8. API call to `/api/team-dialogue-v2` endpoint generates 3 dialogues per character
9. Characters' dialogue arrays are updated via `update-characters-dialogue` event
10. Click counter resets; subsequent clicks cycle through the 3 new dialogues

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
- `src/game/config/gameConfig.json`: Asset paths, dimensions, frame sizes, dialogue positioning
- `svelte.config.js`: Base path differs between dev (`""`) and production (`"/dta-office"`)
- `src/lib/api/teamDialogue.ts`: API endpoints for dialogue generation

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

### Topic Dialogue System

The game features an AI-powered dialogue generation system:

**User Flow:**
1. Click topic input button (bottom-right) to open input panel
2. Enter a topic (e.g., "project deadline", "office party")
3. System calls API with character roster and topic
4. API returns 3 contextual dialogues per character
5. Animated title displays current topic
6. NPCs now speak about the topic when clicked (cycling through 3 dialogues)

**API Integration:**
- Endpoint: `https://line-boot.vercel.app/api/team-dialogue-v2`
- Request: `{ topic: string, characters: Array<{id, name, position}> }`
- Response: `{ characters: Array<{id, name, position, dialogues: [string, string, string]}> }`
- Topic history stored and retrievable via `/api/team-dialogue-list`

**Implementation Details:**
- Loading overlay with animated sprites during API call
- Topic title appears with drop-in animation
- Sound effects managed by `SoundManager` utility
- Topic list UI shows past topics (clickable to reload)

### Development Debugging

In dev mode (`import.meta.env.DEV`), the game exposes `window.__DTA_DEBUG__` with utilities:
- `listHotspots()`: Show all hotspot data
- `triggerHotspot(id)`: Programmatically trigger hotspot interaction
- `triggerAllHotspots({ delay, loop })`: Sequential hotspot testing
- `dataToWorld(x, y)` / `worldToData(x, y)`: Coordinate conversion

Debug hotspots by pressing 'H' key to toggle visualization of clickable zones.

## Common Patterns

### Adding New NPCs

1. Add character data to `static/assets/data/characters.json` in the `characters` array:
   ```json
   {
     "id": "unique_id",
     "name": "Character Name",
     "position": "Job Title",
     "dialogue": "Default dialogue text"
   }
   ```

2. Add NPC configuration to either `standingNpcs` or `hotspotNpcs` array in the same file:
   - **Standing NPCs**: Visible sprites with animations
     - Requires: `characterId`, `x`, `y`, `styleId`, `action`, `facing`
   - **Hotspot NPCs**: Invisible click zones (for seated characters)
     - Requires: `characterId`, `x`, `y`, `radius`
     - Optional: `bubbleGap`, `bubbleOffsetX`, `bubbleOffsetY`

3. Coordinates are in data space (1024x1024), automatically transformed to world space

### Modifying Dialogue Appearance

Dialogue bubble styling is in `DialogueBubble.ts`:
- Font: `fontSize`, `color`, `fontFamily` in text object creation
- Bubble: `padding`, `cornerRadius` properties
- Tail: `tailSize` property

### Working with the API

**Topic Dialogue API:**
- Located in `src/lib/api/teamDialogue.ts`
- `fetchTeamDialogue(topic, characters)`: Generate dialogues for a topic
- `fetchTeamDialogueList()`: Retrieve past topics with timestamps
- Returns 3 dialogues per character in structured format

**Testing API Integration:**
```bash
# Test API endpoint directly
curl -s "https://line-boot.vercel.app/api/team-dialogue-list"

# Test in browser console (when game is running)
window.__DTA_DEBUG__.triggerAllHotspots({ delay: 2000, loop: false })
```

### Extending Game Scenes

To add new Phaser scenes:
1. Create scene class in `src/game/scenes/`
2. Add to scene array in `src/game/main.ts` config
3. Use EventBus for Svelte communication if needed

**Note:** Currently only one scene (`Game`) is implemented. The architecture supports multiple scenes but they must be registered in main.ts.

## Project Structure

```
src/
├── game/                    # Phaser game code
│   ├── scenes/
│   │   └── Game.ts         # Main office scene
│   ├── managers/           # System managers
│   │   ├── DialogueManager.ts       # Dialogue bubble lifecycle
│   │   ├── NPCManager.ts            # Standing NPC management
│   │   └── TopicDialogueManager.ts  # Topic API & UI orchestration
│   ├── objects/
│   │   ├── DialogueBubble.ts        # Comic-style dialogue bubble
│   │   └── NPC.ts                   # Standing NPC game object
│   ├── ui/                 # UI components (Phaser DOM elements)
│   │   ├── TopicInputUI.ts          # Topic input field
│   │   ├── TopicTitleUI.ts          # Animated topic title
│   │   ├── TopicListUI.ts           # Past topics list
│   │   ├── ControlButtons.ts        # UI toggle buttons
│   │   └── LoadingOverlay.ts        # API loading animation
│   ├── utils/
│   │   ├── DialogueUtils.ts         # Dialogue positioning logic
│   │   ├── NPCStyleUtils.ts         # NPC sprite styling
│   │   └── SoundManager.ts          # Sound effect management
│   ├── config/
│   │   ├── gameConfig.json          # Asset paths & settings
│   │   ├── types.ts                 # Config TypeScript types
│   │   └── index.ts                 # Config loader
│   ├── types/
│   │   └── NPCTypes.ts              # NPC & character types
│   ├── data/
│   │   └── npcStyles.ts             # NPC visual style definitions
│   ├── EventBus.ts         # Global event bus (Phaser ↔ Svelte)
│   └── main.ts             # Game entry point
├── lib/
│   └── api/
│       └── teamDialogue.ts # API client for dialogue generation
├── components/             # Svelte components
│   └── SplashScreen.svelte # Loading screen before game
└── routes/                 # SvelteKit routes
    └── +page.svelte        # Main page with game canvas

static/assets/
├── bg6.png                 # Office background (1024x1024)
├── tilesets/
│   └── npc.png             # NPC sprite sheet
└── data/
    ├── characters.json     # Character database + NPC positions
    └── npcs.json           # Legacy NPC data (may be unused)
```

## Deployment

The project is configured for GitHub Pages deployment:
- Static adapter in `svelte.config.js`
- Base path set to `/dta-office` in production
- Build output goes to `build/` directory
