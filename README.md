# 🎮 GAMES — a browser party-game arcade

A single, install-free web app: a launcher hub for **19 local mini-games** you can
play with 1–4 people on one keyboard (or against a CPU), plus an original
**Geometry Dash**-style runner, a **coin shop** with unlockable skins, and a
Stickman-Party-style **standings screen** after every match.

All code and art are original — only the game *mechanics* are recreated.

## ▶ Play

- **Live:** https://asharsalman.github.io/ArfaGame/
- **Offline:** download the repo and open `index.html` in any browser (no server, no build).

## 🕹 The games

| Game | Players | Notes |
|------|---------|-------|
| Geometry Dash | 1–2 | Coins, jump pads & shields, % progress, split-screen race |
| Ping Pong | 2 / vs CPU | Characters hold rackets · Easy/Normal/Hard CPU |
| Air Hockey | 2 | First to 7 |
| Sword Duel | 2 | Lunge & dodge |
| Soccer Duel | 2 | Head-soccer, roam the whole pitch |
| Tic-Tac-Toe | 2 | Click to play |
| Sumo | 2–4 | Ram everyone off the ring |
| Tank Battle | 2–4 | A different themed map every round (Sand/Snow/Grass/Lava/Neon) |
| Tron | 2–4 | Light-cycle trails |
| Sprint Race | 2–4 | Button-mash runner |
| Chicken Round-Up | 2–4 | Catch loose chickens, herd them into your pen |
| Gun Duel | 2–4 / vs CPU | Reaction quick-draw |
| Basketball | 2–4 | Charge & shoot at a moving hoop, 40s |
| Penalty Shootout | 2 / vs CPU | Swap striker & keeper, 5 kicks each |
| Snake Duel | 2–4 | Eat, grow, don't crash |
| Spinners | 2–4 | Battling tops — drain their spin |
| Volleyball | 2 / vs CPU | Keep it off your own side |
| Bowling | 2–4 | Lock aim, lock power, roll |
| Memory Match | 2–4 | Flip pairs, most matches wins |

## 🎛 Controls

- **P1:** `W A S D` + `Space`
- **P2:** Arrow keys + `Enter`
- **P3:** `T F G H` + `B`
- **P4:** `I J K L` + `O`
- `R` restart · `Esc` back to menu · mouse for the menu, shop & board games

## 🛍 Shop & coins

Collect coins in Geometry Dash and earn them for winning matches, then spend them
in the **Shop** on cosmetic skins for every game. Standings, coins, and unlocks
persist in your browser (`localStorage`).

## 🧱 Tech

Plain HTML5 canvas + vanilla JS, no dependencies or build step.

```
index.html        shell: canvas + menu, loads everything
css/style.css     neon arcade theme
js/engine.js      shared helpers, input, standings, wallet/shop
js/art.js         shared cartoon art kit (stickmen, balls, chickens, pins)
js/shop.js        cosmetic catalog
js/hub.js         registry, menu, player/CPU chooser, shop UI, game loop
js/games/*.js     one file per mini-game
```

Each mini-game self-registers via `GameHub.register({...})`, so adding more is a
matter of dropping in a new file.
