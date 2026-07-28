/* Sumo — 2-4 players. Ram everyone else off the ring. Last one in scores. */
(function () {
  const { dist, text } = Eng;

  GameHub.register({
    id: "sumo",
    name: "Sumo",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ff8a4d",
    icon: "🤼",
    desc: "Shove everyone off the ring. Last one standing scores. First to 5.",
    controls: "Move: each player's keys · ram to push",
    create(env) {
      const { W, H, input } = env;
      const N = env.players;
      const CXR = W / 2, CYR = H / 2 + 6, RING = 226, PR = 34, TARGET = 5;
      let players, roundActive, roundT, msg, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function startRound() {
        players.forEach((p, i) => {
          const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
          p.x = CXR + Math.cos(ang) * 120;
          p.y = CYR + Math.sin(ang) * 120;
          p.vx = 0; p.vy = 0; p.alive = true;
        });
        roundActive = true; msg = "";
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0 }));
        matchOver = false; roundT = 0;
        startRound();
      }
      reset();

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (roundT > 0) {
          roundT -= dt;
          if (roundT <= 0) startRound();
          return;
        }

        const ac = 1500 * dt;
        for (const p of players) {
          if (!p.alive) continue;
          if (input.down(p.b.up)) p.vy -= ac;
          if (input.down(p.b.down)) p.vy += ac;
          if (input.down(p.b.left)) p.vx -= ac;
          if (input.down(p.b.right)) p.vx += ac;
          const damp = Math.exp(-1.8 * dt);
          p.vx *= damp; p.vy *= damp;
          p.x += p.vx * dt; p.y += p.vy * dt;
        }

        // pairwise elastic collisions
        for (let i = 0; i < players.length; i++)
          for (let j = i + 1; j < players.length; j++) {
            const a = players[i], b = players[j];
            if (!a.alive || !b.alive) continue;
            const d = dist(a.x, a.y, b.x, b.y);
            if (d < PR * 2 && d > 0) {
              const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, ov = PR * 2 - d;
              a.x -= nx * ov / 2; a.y -= ny * ov / 2;
              b.x += nx * ov / 2; b.y += ny * ov / 2;
              const av = a.vx * nx + a.vy * ny, bv = b.vx * nx + b.vy * ny, diff = bv - av;
              a.vx += nx * diff; a.vy += ny * diff;
              b.vx -= nx * diff; b.vy -= ny * diff;
            }
          }

        for (const p of players)
          if (p.alive && dist(p.x, p.y, CXR, CYR) > RING) p.alive = false;

        const alive = players.filter((p) => p.alive);
        if (alive.length <= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} scores!`;
          } else msg = "Draw!";
          roundT = 1.2;
        }
      }

      function render(ctx) {
        ctx.fillStyle = "#120a18"; ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(CXR, CYR, RING - 8, CXR, CYR, RING + 130);
        g.addColorStop(0, "rgba(255,60,60,0)"); g.addColorStop(1, "rgba(255,60,60,0.25)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#241a12"; ctx.beginPath(); ctx.arc(CXR, CYR, RING, 0, 7); ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = "#caa15a"; ctx.beginPath(); ctx.arc(CXR, CYR, RING, 0, 7); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.arc(CXR, CYR, RING - 40, 0, 7); ctx.stroke();

        for (const p of players) {
          if (!p.alive) continue;
          const lean = Math.atan2(p.vy, p.vx), spd = Math.min(1, Math.hypot(p.vx, p.vy) / 340);
          Art.shadow(ctx, p.x, p.y + PR - 2, PR * 0.9, 0.3);
          // round sumo body
          ctx.save();
          ctx.translate(p.x + Math.cos(lean) * spd * 4, p.y + Math.sin(lean) * spd * 4);
          ctx.fillStyle = p.b.color; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(0, 0, PR, 0, 7); ctx.fill(); ctx.stroke();
          // belt
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.beginPath(); ctx.ellipse(0, PR * 0.42, PR * 0.92, PR * 0.24, 0, 0, 7); ctx.fill();
          // face
          ctx.fillStyle = "#fdfdff"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(-9, -6, 7, 0, 7); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(9, -6, 7, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = Art.OUT;
          ctx.beginPath();
          ctx.arc(-9 + Math.cos(lean) * 2.4, -6 + Math.sin(lean) * 2.4, 3, 0, 7);
          ctx.arc(9 + Math.cos(lean) * 2.4, -6 + Math.sin(lean) * 2.4, 3, 0, 7);
          ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = Art.OUT;
          ctx.beginPath(); ctx.arc(0, 8, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
          // topknot
          ctx.fillStyle = Art.OUT;
          ctx.beginPath(); ctx.ellipse(0, -PR + 2, 6, 4.5, 0, 0, 7); ctx.fill();
          ctx.restore();
        }

        // scoreboard
        const sw = Math.min(200, (W - 40) / players.length);
        players.forEach((p, i) => {
          text(ctx, `${p.b.name}  ${p.score}`, 24 + i * sw, 30,
            { align: "left", font: "800 22px system-ui", color: p.b.color });
        });

        if (msg && roundT > 0 && !matchOver)
          text(ctx, msg, W / 2, 64, { font: "800 30px system-ui", color: "#fff", glow: "#ff8a4d" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
