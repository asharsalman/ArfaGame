/* Spinners — 2-4 players. Battling tops: ram rivals to drain their spin.
   Run out of spin or leave the arena and you're out. */
(function () {
  const { clamp, dist, text } = Eng;

  GameHub.register({
    id: "spinners",
    name: "Spinners",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#b46bff",
    icon: "🌀",
    desc: "Battling tops. Ram rivals to drain their spin — last top spinning wins. First to 5.",
    controls: "Move with your keys · hit hard and fast to do damage",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, TARGET = 5;
      const CX = W / 2, CY = H / 2 + 8, ARENA = 236, R = 26;
      const arenaCol = Eng.skinColor("spinners", "#b46bff");
      let players, roundT, msg, matchOver, time;
      const results = Eng.Results();

      function startRound() {
        players.forEach((p, i) => {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          p.x = CX + Math.cos(a) * 130; p.y = CY + Math.sin(a) * 130;
          p.vx = 0; p.vy = 0; p.spin = 100; p.alive = true; p.hit = 0;
        });
        roundT = 0; msg = "";
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0 }));
        matchOver = false; time = 0; startRound();
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        time += dt;
        if (roundT > 0) { roundT -= dt; if (roundT <= 0) startRound(); return; }

        const ac = 1250 * dt;
        for (const p of players) {
          if (!p.alive) continue;
          if (input.down(p.b.up)) p.vy -= ac;
          if (input.down(p.b.down)) p.vy += ac;
          if (input.down(p.b.left)) p.vx -= ac;
          if (input.down(p.b.right)) p.vx += ac;
          const damp = Math.exp(-1.5 * dt);
          p.vx *= damp; p.vy *= damp;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.spin -= 2.2 * dt;                 // spin bleeds away over time
          if (p.hit > 0) p.hit -= dt;
          if (p.spin <= 0) { p.spin = 0; p.alive = false; }
        }

        // collisions drain spin proportional to impact speed
        for (let i = 0; i < players.length; i++)
          for (let j = i + 1; j < players.length; j++) {
            const a = players[i], b = players[j];
            if (!a.alive || !b.alive) continue;
            const d = dist(a.x, a.y, b.x, b.y);
            if (d < R * 2 && d > 0) {
              const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, ov = R * 2 - d;
              a.x -= nx * ov / 2; a.y -= ny * ov / 2;
              b.x += nx * ov / 2; b.y += ny * ov / 2;
              const av = a.vx * nx + a.vy * ny, bv = b.vx * nx + b.vy * ny, diff = bv - av;
              a.vx += nx * diff; a.vy += ny * diff;
              b.vx -= nx * diff; b.vy -= ny * diff;
              const impact = Math.abs(diff);
              if (impact > 40) {
                // whoever was closing faster wins the exchange
                const dmg = clamp(impact / 26, 0.5, 13);
                if (av > bv) { b.spin -= dmg; b.hit = 0.22; a.spin -= dmg * 0.28; }
                else { a.spin -= dmg; a.hit = 0.22; b.spin -= dmg * 0.28; }
              }
            }
          }

        for (const p of players) {
          if (!p.alive) continue;
          if (p.spin <= 0) { p.spin = 0; p.alive = false; continue; }
          if (dist(p.x, p.y, CX, CY) > ARENA) p.alive = false;
        }

        const alive = players.filter((p) => p.alive);
        if (alive.length <= 1) {
          if (alive.length === 1) {
            alive[0].score++;
            if (alive[0].score >= TARGET) { endMatch(); return; }
            msg = `${alive[0].b.name} scores!`;
          } else msg = "Everyone stopped!";
          roundT = 1.2;
        }
      }

      function top(ctx, p) {
        const wob = Math.sin(time * 12 + p.b.id) * (1 - p.spin / 100) * 4;
        ctx.save(); ctx.translate(p.x + wob, p.y);
        ctx.rotate(time * (6 + p.spin * 0.09));
        const c = p.hit > 0 ? "#fff" : p.b.color;
        ctx.fillStyle = c; ctx.shadowColor = p.b.color; ctx.shadowBlur = 20;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * R, Math.sin(a) * R);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3; ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        // face stays upright while the top spins under it
        ctx.save(); ctx.translate(p.x + wob, p.y);
        ctx.fillStyle = "#fdfdff"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = Art.OUT;
        const sq = p.hit > 0 ? 0.4 : 1;
        ctx.beginPath();
        ctx.ellipse(-4.5, -1.5, 1.9, 1.9 * sq, 0, 0, 7);
        ctx.ellipse(4.5, -1.5, 1.9, 1.9 * sq, 0, 0, 7);
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = Art.OUT; ctx.beginPath();
        if (p.hit > 0) ctx.arc(0, 6, 3.4, Math.PI, 0);       // ouch
        else ctx.arc(0, 2.5, 3.6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.restore();
        // spin meter
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, R + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = p.b.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, R + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.spin / 100)); ctx.stroke();
      }

      function render(ctx) {
        ctx.fillStyle = "#0a0817"; ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(CX, CY, ARENA - 20, CX, CY, ARENA + 140);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(180,60,255,0.2)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#151033"; ctx.beginPath(); ctx.arc(CX, CY, ARENA, 0, 7); ctx.fill();
        ctx.strokeStyle = arenaCol; ctx.lineWidth = 8; ctx.shadowColor = arenaCol; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.arc(CX, CY, ARENA, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 2;
        for (let r = 60; r < ARENA; r += 60) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, 7); ctx.stroke(); }

        for (const p of players) if (p.alive) top(ctx, p);

        const sw = Math.min(190, (W - 60) / players.length);
        players.forEach((p, i) => text(ctx, `${p.b.name} ${p.score}`, 30 + i * sw, 28,
          { align: "left", font: "800 20px system-ui", color: p.b.color }));
        if (msg && roundT > 0)
          text(ctx, msg, W / 2, 66, { font: "900 32px system-ui", color: "#fff", glow: "#b46bff" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
