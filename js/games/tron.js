/* Tron Light Cycles — 2-4 players. Don't crash into walls or trails. */
(function () {
  const { text } = Eng;

  GameHub.register({
    id: "tron",
    name: "Tron",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#4df0ff",
    icon: "🏍️",
    desc: "Leave a light trail. Last cycle riding scores. First to 5.",
    controls: "Steer with each player's movement keys",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, CELL = 20, COLS = Math.floor(W / CELL), ROWS = Math.floor(H / CELL);
      const STEP = 0.075, TARGET = 5;
      // pinwheel spawns — each cycle runs away from the next, so nobody is on an
      // instant head-on course (P3/P4 used to share a column and crash at once)
      const starts = [
        { x: 6, y: 5, dx: 1, dy: 0 },                  // top-left  → right
        { x: COLS - 7, y: 5, dx: 0, dy: 1 },           // top-right → down
        { x: COLS - 7, y: ROWS - 6, dx: -1, dy: 0 },   // bot-right → left
        { x: 6, y: ROWS - 6, dx: 0, dy: -1 },          // bot-left  → up
      ];
      let players, grid, timer, roundT, matchOver, msg;
      const results = Eng.Results();
      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function startRound() {
        grid = new Int8Array(COLS * ROWS);
        players.forEach((p, i) => {
          const s = starts[i];
          p.x = s.x; p.y = s.y; p.dx = s.dx; p.dy = s.dy; p.alive = true;
          grid[p.y * COLS + p.x] = i + 1;
        });
        timer = 0; roundT = 0; msg = "";
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0 }));
        matchOver = false; startRound();
      }
      reset();

      function readDir(p) {
        if (input.down(p.b.up) && p.dy !== 1) return [0, -1];
        if (input.down(p.b.down) && p.dy !== -1) return [0, 1];
        if (input.down(p.b.left) && p.dx !== 1) return [-1, 0];
        if (input.down(p.b.right) && p.dx !== -1) return [1, 0];
        return null;
      }

      function step() {
        for (const p of players) {
          if (!p.alive) continue;
          const d = readDir(p);
          if (d && !(d[0] === -p.dx && d[1] === -p.dy)) { p.dx = d[0]; p.dy = d[1]; }
        }
        const nexts = players.map((p) => (p.alive ? { x: p.x + p.dx, y: p.y + p.dy } : null));
        // wall / trail collisions
        players.forEach((p, i) => {
          if (!p.alive) return;
          const n = nexts[i];
          if (n.x < 0 || n.y < 0 || n.x >= COLS || n.y >= ROWS || grid[n.y * COLS + n.x]) p.alive = false;
        });
        // head-on (two cycles into the same cell)
        for (let i = 0; i < players.length; i++)
          for (let j = i + 1; j < players.length; j++) {
            if (nexts[i] && nexts[j] && players[i].alive && players[j].alive &&
                nexts[i].x === nexts[j].x && nexts[i].y === nexts[j].y) {
              players[i].alive = false; players[j].alive = false;
            }
          }
        players.forEach((p, i) => {
          if (!p.alive) return;
          p.x = nexts[i].x; p.y = nexts[i].y; grid[p.y * COLS + p.x] = i + 1;
        });

        const alive = players.filter((p) => p.alive);
        if (alive.length <= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} scores!`;
          } else msg = "Crash!";
          roundT = 1.1;
        }
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (roundT > 0) { roundT -= dt; if (roundT <= 0) startRound(); return; }
        timer += dt;
        while (timer >= STEP) { timer -= STEP; step(); if (roundT > 0 || matchOver) break; }
      }

      function render(ctx) {
        ctx.fillStyle = "#05070f"; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(77,240,255,0.06)"; ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
        for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }

        // glowing light ribbons
        for (let i = 0; i < grid.length; i++) {
          const owner = grid[i];
          if (!owner) continue;
          const c = players[owner - 1].b.color;
          const gx = (i % COLS) * CELL, gy = ((i / COLS) | 0) * CELL;
          ctx.fillStyle = c; ctx.globalAlpha = 0.22;
          ctx.fillRect(gx, gy, CELL, CELL);
          ctx.globalAlpha = 0.95;
          ctx.fillRect(gx + CELL * 0.28, gy + CELL * 0.28, CELL * 0.44, CELL * 0.44);
        }
        ctx.globalAlpha = 1;
        // bike heads with a headlight
        for (const p of players) {
          if (!p.alive) continue;
          const hx = p.x * CELL + CELL / 2, hy = p.y * CELL + CELL / 2;
          ctx.fillStyle = p.b.color; ctx.shadowColor = p.b.color; ctx.shadowBlur = 26;
          Eng.roundRect(ctx, hx - CELL * 0.42, hy - CELL * 0.42, CELL * 0.84, CELL * 0.84, 4);
          ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(hx + p.dx * CELL * 0.24, hy + p.dy * CELL * 0.24, CELL * 0.15, 0, 7);
          ctx.fill();
          // forward beam
          ctx.globalAlpha = 0.16; ctx.fillStyle = p.b.color;
          ctx.beginPath();
          ctx.moveTo(hx + p.dx * CELL * 0.5 - p.dy * CELL * 0.4, hy + p.dy * CELL * 0.5 + p.dx * CELL * 0.4);
          ctx.lineTo(hx + p.dx * CELL * 0.5 + p.dy * CELL * 0.4, hy + p.dy * CELL * 0.5 - p.dx * CELL * 0.4);
          ctx.lineTo(hx + p.dx * CELL * 3.2, hy + p.dy * CELL * 3.2);
          ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        }

        const sw = Math.min(180, (W - 60) / players.length);
        players.forEach((p, i) => text(ctx, `${p.b.name} ${p.score}`, 30 + i * sw, 26,
          { align: "left", font: "800 18px system-ui", color: p.b.color }));
        if (msg && roundT > 0) text(ctx, msg, W / 2, H / 2, { font: "900 44px system-ui", color: "#fff", glow: "#4df0ff" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
