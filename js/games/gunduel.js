/* Gun Duel — 2-4 players (or vs CPU). A dusty arena of barrels: circle each
   other, take cover, and fire. Two pistols, 3 shots each, then reload. */
(function () {
  const { clamp, dist, rand, rectsOverlap, text } = Eng;

  GameHub.register({
    id: "gunduel",
    name: "Gun Duel",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4, cpu: true,
    color: "#c89b54",
    icon: "🔫",
    desc: "Circle the barrels, duck behind cover and shoot. 3 shots then reload. First to 5.",
    controls: "Move to aim the way you walk · action key to fire",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, TARGET = 5, PR = 15, AMMO = 3;
      const bg = Eng.skinColor("gunduel", "#c89b54");
      const BOT = env.bot
        ? ({ easy: { spd: 110, aim: 0.55, cd: 1.5 }, normal: { spd: 155, aim: 0.3, cd: 0.95 }, hard: { spd: 200, aim: 0.15, cd: 0.6 } })[env.bot.diff]
        : null;
      const M = 26;
      let players, bullets, barrels, roundT, msg, matchOver, time = 0;
      const results = Eng.Results();

      function makeBarrels() {
        barrels = [];
        const spots = [
          [W * 0.5, H * 0.5], [W * 0.26, H * 0.3], [W * 0.74, H * 0.3],
          [W * 0.26, H * 0.72], [W * 0.74, H * 0.72],
          [W * 0.5, H * 0.18], [W * 0.5, H * 0.84],
          [W * 0.14, H * 0.5], [W * 0.86, H * 0.5],
        ];
        spots.forEach(([x, y]) => barrels.push({ x, y, r: 21 }));
      }
      function startRound() {
        makeBarrels();
        players.forEach((p, i) => {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          p.x = W / 2 + Math.cos(a) * 330;
          p.y = H / 2 + Math.sin(a) * 205;
          p.x = clamp(p.x, M + PR, W - M - PR);
          p.y = clamp(p.y, M + PR, H - M - PR);
          p.face = Math.atan2(H / 2 - p.y, W / 2 - p.x);
          p.alive = true; p.ammo = AMMO; p.reload = 0; p.cd = 0; p.botCd = rand(0.4, 1.2);
        });
        bullets = []; roundT = 0; msg = "";
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b, i) => ({
          b, score: 0, isBot: !!(BOT && i >= N - (env.bot ? 1 : 0)),
        }));
        matchOver = false; startRound();
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      const blocked = (x, y, r) => barrels.some((br) => dist(x, y, br.x, br.y) < br.r + r);

      function fire(p) {
        if (p.ammo <= 0 || p.cd > 0) return;
        p.ammo--; p.cd = 0.22;
        if (p.ammo === 0) p.reload = 1.6;
        // one shot from each pistol, slightly splayed
        [-0.055, 0.055].forEach((off) => {
          const a = p.face + off;
          bullets.push({
            x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20,
            vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, owner: p, life: 1.6,
          });
        });
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (roundT > 0) { roundT -= dt; if (roundT <= 0) startRound(); return; }

        for (const p of players) {
          if (!p.alive) continue;
          if (p.cd > 0) p.cd -= dt;
          if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) p.ammo = AMMO; }

          let vx = 0, vy = 0;
          if (p.isBot) {
            const foe = players.find((q) => q !== p && q.alive);
            if (foe) {
              const want = Math.atan2(foe.y - p.y, foe.x - p.x);
              // strafe around rather than charge straight in
              const orbit = want + Math.PI * 0.42 * Math.sin(time * 0.7 + p.b.id);
              vx = Math.cos(orbit); vy = Math.sin(orbit);
              p.face = want + rand(-BOT.aim, BOT.aim) * 0.5;
              p.botCd -= dt;
              if (p.botCd <= 0 && p.ammo > 0) { fire(p); p.botCd = BOT.cd; }
            }
          } else {
            if (input.down(p.b.left)) vx -= 1;
            if (input.down(p.b.right)) vx += 1;
            if (input.down(p.b.up)) vy -= 1;
            if (input.down(p.b.down)) vy += 1;
            if (vx || vy) p.face = Math.atan2(vy, vx);       // you aim where you walk
            if (input.pressed(p.b.action)) fire(p);
          }

          const sp = (p.isBot ? BOT.spd : 205) * dt;
          const m = Math.hypot(vx, vy) || 1;
          const nx = clamp(p.x + (vx / m) * sp, M + PR, W - M - PR);
          const ny = clamp(p.y + (vy / m) * sp, M + PR, H - M - PR);
          if (!blocked(nx, p.y, PR)) p.x = nx;                // slide along barrels
          if (!blocked(p.x, ny, PR)) p.y = ny;
        }

        for (const bl of bullets) {
          bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
          if (bl.x < M || bl.x > W - M || bl.y < M || bl.y > H - M) bl.dead = true;
          for (const br of barrels) if (dist(bl.x, bl.y, br.x, br.y) < br.r) bl.dead = true;
          for (const p of players) {
            if (!p.alive || p === bl.owner || bl.dead) continue;
            if (dist(bl.x, bl.y, p.x, p.y) < PR) { p.alive = false; bl.dead = true; }
          }
        }
        bullets = bullets.filter((b) => !b.dead && b.life > 0);

        const alive = players.filter((p) => p.alive);
        if (alive.length <= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} is last standing!`;
          } else msg = "Everyone down!";
          roundT = 1.3;
        }
      }

      function render(ctx) {
        // dusty ground
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, bg); g.addColorStop(1, "#3a2a16");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(0,0,0,0.07)";
        for (let y = 0; y < H; y += 26) ctx.fillRect(0, y, W, 13);
        // fenced boundary
        ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 7;
        ctx.strokeRect(M, M, W - 2 * M, H - 2 * M);

        // barrels
        for (const br of barrels) {
          Art.shadow(ctx, br.x, br.y + br.r * 0.75, br.r * 0.95, 0.3);
          ctx.fillStyle = "#8a5a2a"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(br.x, br.y, br.r, 0, 7); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = "#c98f4a"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(br.x, br.y, br.r * 0.72, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(br.x, br.y, br.r * 0.4, 0, 7); ctx.stroke();
        }

        // bullets
        for (const bl of bullets) {
          ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(bl.x, bl.y);
          ctx.lineTo(bl.x - bl.vx * 0.014, bl.y - bl.vy * 0.014); ctx.stroke();
        }

        // gunslingers
        for (const p of players) {
          if (!p.alive) continue;
          const faceRight = Math.cos(p.face) >= 0 ? 1 : -1;
          Art.shadow(ctx, p.x, p.y + 22, 16);
          Art.stickman(ctx, p.x, p.y + 20, {
            color: p.b.color, scale: 0.92, t: time,
            pose: "throw", face: faceRight,
          });
          // twin pistols pointing where they walk
          [-0.3, 0.3].forEach((off) => {
            const a = p.face + off;
            ctx.save(); ctx.translate(p.x, p.y - 4); ctx.rotate(a);
            ctx.fillStyle = "#d8dcea"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.rect(8, -2.6, 13, 5); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.rect(8, 1.5, 4.5, 6); ctx.fill(); ctx.stroke();
            ctx.restore();
          });
          // ammo pips
          for (let k = 0; k < AMMO; k++) {
            ctx.fillStyle = k < p.ammo ? "#ffe066" : "rgba(0,0,0,0.35)";
            ctx.beginPath(); ctx.arc(p.x - 9 + k * 9, p.y - 34, 3.2, 0, 7); ctx.fill();
          }
          if (p.reload > 0) {
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(p.x - 16, p.y - 46, 32, 5);
            ctx.fillStyle = "#4dff9e";
            ctx.fillRect(p.x - 16, p.y - 46, 32 * (1 - p.reload / 1.6), 5);
          }
        }

        const sw = Math.min(190, (W - 60) / players.length);
        players.forEach((p, i) => text(ctx, `${p.isBot ? "🤖 " : ""}${p.b.name} ${p.score}`, 34 + i * sw, 20,
          { align: "left", font: "800 18px system-ui", color: p.b.color }));
        if (msg && roundT > 0)
          text(ctx, msg, W / 2, H / 2, { font: "900 34px system-ui", color: "#fff", glow: "#000" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
