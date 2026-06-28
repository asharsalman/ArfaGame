# GAMES — Project Plan

A single web app called **Games**: a launcher hub that opens a collection of
local mini-games inspired by *2 Player Challenge* and *Stickman Party*, plus an
original **Geometry Dash**-style mini-game. All code and art are original — only
the game *mechanics* are recreated.

## Why a web app
Runs anywhere (just open `index.html`), no install, easy local 2-player on one
keyboard. Single fixed logical canvas (960×600) scaled to fit the screen.

## Architecture
```
index.html        - shell: canvas + DOM menu, loads all scripts
css/style.css     - neon arcade theme, responsive menu + canvas
js/engine.js      - shared helpers (math, collision, drawing) + Input (keyboard + pointer)
js/hub.js         - game registry, the main menu, the game loop, ESC = back to menu
js/games/*.js     - one file per mini-game; each calls GameHub.register({...})
```

Every mini-game exposes the same tiny contract:
```js
GameHub.register({
  id, name, category, players, color, icon, desc, controls,
  create(env) -> { update(dt), render(ctx), destroy?() }
})
```
The hub owns the loop, input polling, and screen transitions, so games stay simple.

## Controls convention
- **Player 1:** W A S D  + Space
- **Player 2:** Arrow keys + Enter
- **R** restart round · **Esc** back to menu · mouse for menu / board games

## Mini-game catalog
Source games overlap heavily (pong, soccer, tank, sword, race appear in both),
so the catalog is the de-duplicated union.

### Featured (original)
- [x] **Geometry Dash** — auto-runner, tap to jump spikes & blocks, rising speed, attempts counter.

### 2-Player duels (from 2 Player Challenge + Stickman Party)
- [x] **Ping Pong**
- [x] **Air Hockey**
- [x] **Sumo** (push off the ring)
- [x] **Tank Battle**
- [x] **Tron Light Cycles**
- [x] **Sword Duel**
- [x] **Soccer Duel** (head-soccer style)
- [x] **Tic-Tac-Toe**
- [x] **Sprint Race** (button-mash runner)

### Backlog (same framework, add later)
Basketball, Penalty shootout, Spaceship battle, Snake, Maze chase, Whack/reaction,
Chicken/Crab fight, Memory match, Pumpkin smash.

## Build order
1. Scaffold: engine + hub + menu + loop  ← foundation
2. Geometry Dash (the featured/original one)
3. The 2-player duels
4. Polish: sounds, win screens, hub categories/filters
5. Verify in a browser

## Definition of done (this pass)
Opening `index.html` shows the **Games** menu; every listed game launches, is
playable, has a clear win/lose + restart, and returns to the menu with Esc.

## Added since first draft (all done & verified)
- **Up to 4 players on one device** — shared keyboard map: P1 WASD+Space,
  P2 Arrows+Enter, P3 TFGH+B, P4 IJKL+O (`Eng.PLAYERS`).
- **"How many players?" chooser** — the hub asks before launching any game whose
  player count is a range; Sumo / Tank / Tron / Sprint scale to 2–4.
- **Geometry Dash upgrades** — finite level with a **% progress bar**,
  **collectible coins** (vanish on pickup, total counter on top),
  a persistent **coin + best-% reward system** (localStorage),
  a **2-player split-screen race**, and **fairer, reaction-friendly spacing**.
- **Colorful theme** — animated multi-hue background, per-game card glows,
  vivid player colors throughout.

## Polish pass 2 (done & verified)
- **Custom SVG icons** for every game (no more emoji), tinted to each card's accent.
- **Post-match standings** (`Eng.Results`) like Stickman Party: trophy + big
  "Px WINS!" + ranked board awarding **3 / 2 / 1 / 0** points by placement, with a
  persistent **session total** (`Eng.SESSION`, localStorage). Used by all
  multiplayer games + the 2-player Geometry Dash race.
- **Harder + longer Geometry Dash**: track 14k→22k px, faster (370→670), tighter
  spacing, up to 4 spikes + block/spike combos; the cube now has a face.

## How to run
Open `index.html` directly, or serve the folder: `node server.js` → http://localhost:4173
