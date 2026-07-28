/* Snake Duel — 2-4 players. Eat to grow, don't hit anything. Last one alive scores. */
(function () {
  const { text } = Eng;

  GameHub.register({
    id: "snake",
    name: "Snake Duel",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#7dff4d",
    icon: "🐍",
    desc: "Eat pellets to grow. Crash into a wall or any tail and you're out. First to 5.",
    controls: "Steer with each player's movement keys",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, CELL = 24;
      const COLS = Math.floor(W / CELL), ROWS = Math.floor(H / CELL);
      const OX = (W - COLS * CELL) / 2, OY = (H - ROWS * CELL) / 2;
      const STEP = 0.11, TARGET = 5, START_LEN = 4;
      const foodCol = Eng.skinColor("snake", "#ff5b8a");
      // pinwheel spawns — everyone runs away from the next player, so nobody is
      // on an instant head-on course at the start of a round
      const starts = [
        { x: 6, y: 6, dx: 1, dy: 0 },                       // top-left  → right
        { x: COLS - 7, y: 6, dx: 0, dy: 1 },                // top-right → down
        { x: COLS - 7, y: ROWS - 7, dx: -1, dy: 0 },        // bot-right → left
        { x: 6, y: ROWS - 7, dx: 0, dy: -1 },               // bot-left  → up
      ];
      let players, food, timer, roundT, msg, matchOver;
      const results = Eng.Results();

      const occupied = (x, y) =>
        players.some((p) => p.alive && p.body.some((s) => s.x === x && s.y === y));

      function placeFood() {
        for (let i = 0; i < 400; i++) {
          const x = 1 + Math.floor(Math.random() * (COLS - 2));
          const y = 1 + Math.floor(Math.random() * (ROWS - 2));
          if (!occupied(x, y) && !food.some((f) => f.x === x && f.y === y)) { food.push({ x, y }); return; }
        }
      }
      function startRound() {
        players.forEach((p, i) => {
          const s = starts[i];
          p.dx = s.dx; p.dy = s.dy; p.pdx = s.dx; p.pdy = s.dy; p.alive = true;
          p.body = [];
          for (let k = 0; k < START_LEN; k++) p.body.push({ x: s.x - s.dx * k, y: s.y - s.dy * k });
        });
        food = [];
        for (let i = 0; i < 4; i++) placeFood();
        timer = 0; roundT = 0; msg = "";
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0, body: [] }));
        matchOver = false; startRound();
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function readDir(p) {
        if (input.down(p.b.up) && p.pdy !== 1) return [0, -1];
        if (input.down(p.b.down) && p.pdy !== -1) return [0, 1];
        if (input.down(p.b.left) && p.pdx !== 1) return [-1, 0];
        if (input.down(p.b.right) && p.pdx !== -1) return [1, 0];
        return null;
      }

      function step() {
        for (const p of players) {
          if (!p.alive) continue;
          const d = readDir(p);
          if (d) { p.dx = d[0]; p.dy = d[1]; }
        }
        const heads = players.map((p) => (p.alive ? { x: p.body[0].x + p.dx, y: p.body[0].y + p.dy } : null));

        // walls + tails (tails evaluated before anyone moves)
        players.forEach((p, i) => {
          if (!p.alive) return;
          const n = heads[i];
          if (n.x < 0 || n.y < 0 || n.x >= COLS || n.y >= ROWS) { p.alive = false; return; }
          for (const q of players) {
            if (!q.alive) continue;
            const tail = q.body.slice(0, q.body.length - 1);  // tail tip vacates
            if (tail.some((s) => s.x === n.x && s.y === n.y)) { p.alive = false; return; }
          }
        });
        // head-on collisions
        for (let i = 0; i < players.length; i++)
          for (let j = i + 1; j < players.length; j++)
            if (players[i].alive && players[j].alive && heads[i] && heads[j] &&
                heads[i].x === heads[j].x && heads[i].y === heads[j].y) {
              players[i].alive = false; players[j].alive = false;
            }

        players.forEach((p, i) => {
          if (!p.alive) return;
          p.pdx = p.dx; p.pdy = p.dy;
          p.body.unshift(heads[i]);
          const fi = food.findIndex((f) => f.x === heads[i].x && f.y === heads[i].y);
          if (fi >= 0) { food.splice(fi, 1); placeFood(); }   // grow: skip the pop
          else p.body.pop();
        });

        const alive = players.filter((p) => p.alive);
        if (alive.length <= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} scores!`;
          } else msg = "Everyone crashed!";
          roundT = 1.2;
        }
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (roundT > 0) { roundT -= dt; if (roundT <= 0) startRound(); return; }
        timer += dt;
        while (timer >= STEP) { timer -= STEP; step(); if (roundT > 0 || matchOver) break; }
      }

      function render(ctx) {
        ctx.fillStyle = "#06120a"; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(125,255,77,0.06)"; ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(OX + x * CELL, OY); ctx.lineTo(OX + x * CELL, OY + ROWS * CELL); ctx.stroke(); }
        for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(OX, OY + y * CELL); ctx.lineTo(OX + COLS * CELL, OY + y * CELL); ctx.stroke(); }
        ctx.strokeStyle = "#2b5c34"; ctx.lineWidth = 3;
        ctx.strokeRect(OX, OY, COLS * CELL, ROWS * CELL);

        // food
        for (const f of food) {
          const cx = OX + f.x * CELL + CELL / 2, cy = OY + f.y * CELL + CELL / 2;
          ctx.fillStyle = foodCol; ctx.shadowColor = foodCol; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.32, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }

        // snakes
        for (const p of players) {
          if (!p.alive) continue;
          p.body.forEach((s, k) => {
            const x = OX + s.x * CELL, y = OY + s.y * CELL;
            ctx.fillStyle = p.b.color;
            ctx.globalAlpha = k === 0 ? 1 : Math.max(0.35, 1 - k / (p.body.length + 4));
            Eng.roundRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, k === 0 ? 7 : 5);
            ctx.fill();
          });
          ctx.globalAlpha = 1;
          // eyes on the head
          const h = p.body[0];
          const hx = OX + h.x * CELL + CELL / 2, hy = OY + h.y * CELL + CELL / 2;
          ctx.fillStyle = "#0b1a10";
          const ox = p.dy !== 0 ? 5 : 0, oy = p.dx !== 0 ? 5 : 0;
          ctx.beginPath();
          ctx.arc(hx + (p.dx * 3) + ox, hy + (p.dy * 3) + oy, 2.6, 0, 7);
          ctx.arc(hx + (p.dx * 3) - ox, hy + (p.dy * 3) - oy, 2.6, 0, 7);
          ctx.fill();
        }

        const sw = Math.min(190, (W - 60) / players.length);
        players.forEach((p, i) => text(ctx, `${p.b.name} ${p.score}`, 30 + i * sw, 18,
          { align: "left", font: "800 17px system-ui", color: p.b.color }));
        if (msg && roundT > 0)
          text(ctx, msg, W / 2, H / 2, { font: "900 42px system-ui", color: "#fff", glow: "#7dff4d" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
