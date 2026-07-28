/* Basketball — 2-4 players. Charge, aim, and sink shots in your own lane. */
(function () {
  const { clamp, text } = Eng;

  GameHub.register({
    id: "basketball",
    name: "Basketball",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ff8a3a",
    icon: "🏀",
    desc: "Hold to charge, release to shoot. Most baskets in 40 seconds wins.",
    controls: "←/→ aim · hold your action key to charge, release to shoot",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, GAME_TIME = 40;
      const ballCol = Eng.skinColor("basketball", "#ff8a3a");
      const laneW = W / N, HOOP_Y = 176, SHOOT_Y = H - 116;
      let players, timeLeft, phase, count, matchOver, time = 0;
      const results = Eng.Results();

      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b, i) => ({
          b, lane: i,
          cx: laneW * i + laneW / 2,
          hoopX: laneW * i + laneW / 2,
          hoopDir: i % 2 ? 1 : -1,
          hoopSpd: 90 + i * 14,
          angle: 0,            // -0.7..0.7 radians from vertical
          charge: 0, charging: false,
          balls: [], score: 0, flash: 0,
        }));
        timeLeft = GAME_TIME; phase = "count"; count = 3.2; matchOver = false;
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (phase === "count") { count -= dt; if (count <= 0) phase = "play"; return; }

        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; endMatch(); return; }

        for (const p of players) {
          const lo = laneW * p.lane + 46, hi = laneW * (p.lane + 1) - 46;
          // moving hoop
          p.hoopX += p.hoopDir * p.hoopSpd * dt;
          if (p.hoopX < lo) { p.hoopX = lo; p.hoopDir = 1; }
          if (p.hoopX > hi) { p.hoopX = hi; p.hoopDir = -1; }
          if (p.flash > 0) p.flash -= dt;

          // aim
          if (input.down(p.b.left)) p.angle = clamp(p.angle - 1.5 * dt, -0.72, 0.72);
          if (input.down(p.b.right)) p.angle = clamp(p.angle + 1.5 * dt, -0.72, 0.72);

          // charge & release
          if (input.down(p.b.action)) { p.charging = true; p.charge = clamp(p.charge + dt * 1.5, 0, 1); }
          else if (p.charging) {
            const sp = 620 + p.charge * 430;
            p.balls.push({
              x: p.cx, y: SHOOT_Y,
              vx: Math.sin(p.angle) * sp, vy: -Math.cos(p.angle) * sp,
              scored: false,
            });
            p.charging = false; p.charge = 0;
          }

          // ball physics
          for (const bl of p.balls) {
            const py = bl.y;
            bl.vy += 1050 * dt;
            bl.x += bl.vx * dt; bl.y += bl.vy * dt;
            // through the hoop: crossing the rim plane downward, inside the rim
            if (!bl.scored && bl.vy > 0 && py <= HOOP_Y && bl.y > HOOP_Y &&
                Math.abs(bl.x - p.hoopX) < 26) {
              bl.scored = true; p.score++; p.flash = 0.45;
            }
            // bounce off lane sides
            if (bl.x < laneW * p.lane + 12) { bl.x = laneW * p.lane + 12; bl.vx = Math.abs(bl.vx) * 0.7; }
            if (bl.x > laneW * (p.lane + 1) - 12) { bl.x = laneW * (p.lane + 1) - 12; bl.vx = -Math.abs(bl.vx) * 0.7; }
          }
          p.balls = p.balls.filter((b) => b.y < H + 40);
        }
      }

      function render(ctx) {
        for (let i = 0; i < N; i++) {
          const p = players[i], x0 = laneW * i;
          // court
          ctx.fillStyle = i % 2 ? "#3a2412" : "#33200f";
          ctx.fillRect(x0, 0, laneW, H);
          ctx.fillStyle = p.flash > 0 ? `rgba(255,255,255,${p.flash * 0.35})` : `${p.b.color}14`;
          ctx.fillRect(x0, 0, laneW, H);
          ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
          ctx.strokeRect(x0 + 8, 8, laneW - 16, H - 16);

          // backboard + hoop
          ctx.fillStyle = "#e8eeff";
          ctx.fillRect(p.hoopX - 40, HOOP_Y - 54, 80, 8);
          ctx.strokeStyle = "#cfd8ee"; ctx.lineWidth = 3;
          ctx.strokeRect(p.hoopX - 20, HOOP_Y - 46, 40, 30);
          ctx.strokeStyle = "#ff5b3a"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(p.hoopX - 26, HOOP_Y); ctx.lineTo(p.hoopX + 26, HOOP_Y); ctx.stroke();
          // net
          ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
          for (let k = -3; k <= 3; k++) {
            ctx.beginPath(); ctx.moveTo(p.hoopX + k * 8, HOOP_Y); ctx.lineTo(p.hoopX + k * 4, HOOP_Y + 24); ctx.stroke();
          }

          // aim guide
          const ax = Math.sin(p.angle), ay = -Math.cos(p.angle);
          ctx.strokeStyle = `${p.b.color}99`; ctx.lineWidth = 3; ctx.setLineDash([7, 7]);
          ctx.beginPath(); ctx.moveTo(p.cx, SHOOT_Y); ctx.lineTo(p.cx + ax * 88, SHOOT_Y + ay * 88); ctx.stroke();
          ctx.setLineDash([]);

          // shooter
          const feet = SHOOT_Y + 62;
          Art.shadow(ctx, p.cx, feet + 2, 20);
          Art.stickman(ctx, p.cx, feet, {
            color: p.b.color, scale: 1.15, t: time,
            pose: p.charging ? "shoot" : "ready",
            face: p.angle >= 0 ? 1 : -1, hat: "cap", hatColor: p.b.color,
          });
          // ball held overhead while charging (clear of the head)
          if (p.charging) Art.ball(ctx, p.cx + p.angle * 16, SHOOT_Y - 20, 12, "basket", ballCol);

          // charge meter
          ctx.fillStyle = "rgba(255,255,255,0.14)";
          Eng.roundRect(ctx, x0 + 22, H - 32, laneW - 44, 13, 6); ctx.fill();
          if (p.charge > 0) {
            ctx.fillStyle = "#ffd24d";
            Eng.roundRect(ctx, x0 + 22, H - 32, (laneW - 44) * p.charge, 13, 6); ctx.fill();
          }

          // balls
          for (const bl of p.balls) Art.ball(ctx, bl.x, bl.y, 12, "basket", ballCol);

          text(ctx, `${p.b.name}  ${p.score}`, x0 + laneW / 2, 62,
            { font: "800 19px system-ui", color: p.b.color });
          if (i > 0) { ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke(); }
        }

        // timer pill, clear of the lanes
        ctx.fillStyle = "rgba(6,10,20,0.8)";
        Eng.roundRect(ctx, W / 2 - 62, 8, 124, 32, 16); ctx.fill();
        text(ctx, `⏱ ${Math.ceil(timeLeft)}s`, W / 2, 25,
          { font: "900 22px system-ui", color: "#fff" });

        if (phase === "count") {
          ctx.fillStyle = "rgba(4,6,15,0.55)"; ctx.fillRect(0, 0, W, H);
          const n = Math.ceil(count - 0.2);
          text(ctx, n > 0 ? n : "SHOOT!", W / 2, H / 2, { font: "900 84px system-ui", color: "#ff8a3a", glow: "#ff8a3a" });
        }
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
