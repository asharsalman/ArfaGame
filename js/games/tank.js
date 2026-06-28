/* Tank Battle — 2-4 player free-for-all. Bouncing shells & cover. */
(function () {
  const { rectsOverlap, text } = Eng;

  GameHub.register({
    id: "tank",
    name: "Tank Battle",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#9d7bff",
    icon: "💥",
    desc: "Drive, aim, fire. Shells bounce off walls. Last tank rolling wins.",
    controls: "Move + each player's action key to fire",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, M = 24, TS = 30, TARGET = 5;
      const shellCol = Eng.skinColor("tank", "#ffe066");
      const border = [
        { x: M, y: M, w: W - 2 * M, h: 14 },
        { x: M, y: H - M - 14, w: W - 2 * M, h: 14 },
        { x: M, y: M, w: 14, h: H - 2 * M },
        { x: W - M - 14, y: M, w: 14, h: H - 2 * M },
      ];
      const THEMES = [
        { name: "Sand", ground: "#3a2f1a", wall: "#7a6234", line: "#caa15a" },
        { name: "Snow", ground: "#1b2740", wall: "#4a648f", line: "#cfe0ff" },
        { name: "Grass", ground: "#163020", wall: "#2f6b3a", line: "#7adf8a" },
        { name: "Lava", ground: "#2a1414", wall: "#7a2f2f", line: "#ff7a4d" },
        { name: "Neon", ground: "#120c2a", wall: "#3a2f7a", line: "#9d7bff" },
      ];
      const LAYOUTS = [
        () => [{ x: W / 2 - 16, y: 150, w: 32, h: 130 }, { x: W / 2 - 16, y: H - 280, w: 32, h: 130 }, { x: 250, y: H / 2 - 16, w: 130, h: 32 }, { x: W - 380, y: H / 2 - 16, w: 130, h: 32 }],
        () => [{ x: W / 2 - 90, y: H / 2 - 16, w: 180, h: 32 }, { x: W / 2 - 16, y: 90, w: 32, h: 120 }, { x: W / 2 - 16, y: H - 210, w: 32, h: 120 }],
        () => [{ x: 210, y: 150, w: 32, h: 150 }, { x: W - 242, y: 150, w: 32, h: 150 }, { x: 210, y: H - 300, w: 32, h: 150 }, { x: W - 242, y: H - 300, w: 32, h: 150 }],
        () => [{ x: W / 2 - 140, y: H / 2 - 130, w: 90, h: 30 }, { x: W / 2 + 50, y: H / 2 - 130, w: 90, h: 30 }, { x: W / 2 - 140, y: H / 2 + 100, w: 90, h: 30 }, { x: W / 2 + 50, y: H / 2 + 100, w: 90, h: 30 }],
        () => [{ x: 170, y: H / 2 - 16, w: 180, h: 32 }, { x: W - 350, y: H / 2 - 16, w: 180, h: 32 }, { x: W / 2 - 16, y: 200, w: 32, h: 200 }],
      ];
      let walls = border.slice(), theme = THEMES[0];
      function makeMap() { theme = Eng.pick(THEMES); walls = border.concat(Eng.pick(LAYOUTS)()); }
      const spawns = [
        { x: 120, y: 120 }, { x: W - 120, y: H - 120 },
        { x: W - 120, y: 120 }, { x: 120, y: H - 120 },
      ];
      let tanks, bullets, respawn, matchOver, msg;
      const results = Eng.Results();
      function endMatch() {
        const rank = [...tanks].sort((a, b) => b.score - a.score).map((t) => ({ b: t.b, score: t.score }));
        results.open(rank); matchOver = true;
      }

      function freshRound() {
        makeMap();
        tanks = Eng.PLAYERS.slice(0, N).map((b, i) => {
          const s = spawns[i];
          return { b, x: s.x, y: s.y, a: Math.atan2(H / 2 - s.y, W / 2 - s.x), cd: 0, alive: true, score: (tanks && tanks[i].score) || 0 };
        });
        bullets = []; respawn = 0; msg = "";
      }
      function reset() { tanks = null; freshRound(); tanks.forEach((t) => (t.score = 0)); matchOver = false; }
      reset();

      const tankRect = (t) => ({ x: t.x - TS / 2, y: t.y - TS / 2, w: TS, h: TS });
      const hitsWall = (r) => walls.some((w) => rectsOverlap(r, w));

      function drive(t, idx, dt) {
        if (!t.alive) return;
        if (input.down(t.b.left)) t.a -= 2.6 * dt;
        if (input.down(t.b.right)) t.a += 2.6 * dt;
        let mv = input.down(t.b.up) ? 1 : input.down(t.b.down) ? -1 : 0;
        if (mv) {
          const nx = t.x + Math.cos(t.a) * 150 * dt * mv;
          const ny = t.y + Math.sin(t.a) * 150 * dt * mv;
          if (!hitsWall({ x: nx - TS / 2, y: t.y - TS / 2, w: TS, h: TS })) t.x = nx;
          if (!hitsWall({ x: t.x - TS / 2, y: ny - TS / 2, w: TS, h: TS })) t.y = ny;
        }
        t.cd -= dt;
        if (input.pressed(t.b.action) && t.cd <= 0) {
          t.cd = 0.55;
          bullets.push({ x: t.x + Math.cos(t.a) * 26, y: t.y + Math.sin(t.a) * 26, vx: Math.cos(t.a) * 430, vy: Math.sin(t.a) * 430, b: 0, owner: idx });
        }
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (respawn > 0) { respawn -= dt; if (respawn <= 0) freshRound(); return; }

        tanks.forEach((t, i) => drive(t, i, dt));

        for (const bl of bullets) {
          bl.x += bl.vx * dt; bl.y += bl.vy * dt;
          for (const w of walls) {
            if (bl.x > w.x && bl.x < w.x + w.w && bl.y > w.y && bl.y < w.y + w.h) {
              const dl = bl.x - w.x, dr = w.x + w.w - bl.x, dtp = bl.y - w.y, db = w.y + w.h - bl.y;
              const m = Math.min(dl, dr, dtp, db);
              if (m === dl || m === dr) bl.vx *= -1; else bl.vy *= -1;
              bl.x += bl.vx * dt * 1.2; bl.y += bl.vy * dt * 1.2; bl.b++;
            }
          }
          tanks.forEach((t, k) => {
            if (!t.alive) return;
            if (k === bl.owner && bl.b === 0) return;       // can't hit self until it bounces
            if (rectsOverlap({ x: bl.x - 4, y: bl.y - 4, w: 8, h: 8 }, tankRect(t))) { t.alive = false; bl.dead = true; }
          });
        }
        bullets = bullets.filter((b) => b.b <= 3 && !b.dead);

        const alive = tanks.filter((t) => t.alive);
        if (alive.length <= 1 && N >= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} survives!`;
          } else msg = "All down!";
          respawn = 1.1;
        }
      }

      function render(ctx) {
        ctx.fillStyle = theme.ground; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = theme.wall;
        for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);
        text(ctx, theme.name + " MAP", W / 2, H - 18, { font: "700 13px system-ui", color: theme.line });

        for (const t of tanks) {
          if (!t.alive) continue;
          ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a);
          ctx.fillStyle = t.b.color; ctx.shadowColor = t.b.color; ctx.shadowBlur = 16;
          ctx.fillRect(-TS / 2, -TS / 2, TS, TS);
          ctx.shadowBlur = 0; ctx.fillStyle = "#0c0f1d"; ctx.fillRect(-6, -6, 12, 12);
          ctx.fillStyle = t.b.color; ctx.fillRect(0, -4, 26, 8);
          ctx.restore();
        }
        ctx.fillStyle = shellCol;
        for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, 7); ctx.fill(); }

        const sw = Math.min(180, (W - 60) / tanks.length);
        tanks.forEach((t, i) => text(ctx, `${t.b.name} ${t.score}`, 30 + i * sw, 38,
          { align: "left", font: "800 20px system-ui", color: t.b.color }));
        if (msg && respawn > 0) text(ctx, msg, W / 2, 60, { font: "800 26px system-ui", color: "#fff", glow: "#9d7bff" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
