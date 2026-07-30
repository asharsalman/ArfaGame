/* Sprint Race — 2-4 players. Mash your two keys to run. First past the line wins. */
(function () {
  const { clamp, text } = Eng;

  GameHub.register({
    id: "sprint",
    name: "Boat Race",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ffd24d",
    icon: "🏁",
    desc: "Alternate your two side keys to row. First boat over the line wins.",
    controls: "Alternate your two side keys fast (e.g. A/D) to pull the oars",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, START = 90, FINISH = W - 90;
      let runners, phase, count, finishOrder, endTimer, time = 0;
      const results = Eng.Results();
      function endMatch() {
        const rest = runners.filter((r) => !finishOrder.includes(r)).sort((a, b) => b.x - a.x);
        const rank = [...finishOrder, ...rest].map((r) => ({ b: r.b, score: Math.floor(((r.x - START) / (FINISH - START)) * 100) }));
        results.open(rank); phase = "done";
      }
      function reset() {
        runners = Eng.PLAYERS.slice(0, N).map((b) => ({ b, x: START, v: 0, lastKey: "", anim: 0, done: false }));
        phase = "count"; count = 3.2; finishOrder = []; endTimer = 0;
      }
      reset();

      function update(dt) {
        time += dt;
        if (phase === "count") { count -= dt; if (count <= 0) phase = "run"; return; }
        if (phase === "done") { if (results.update(dt, input)) reset(); return; }

        for (const r of runners) {
          if (r.done) continue;
          // alternation: press the *other* key than last time to gain speed
          if (input.pressed(r.b.left) && r.lastKey !== "L") { r.v += 78; r.lastKey = "L"; }
          if (input.pressed(r.b.right) && r.lastKey !== "R") { r.v += 78; r.lastKey = "R"; }
          r.v *= Math.exp(-1.7 * dt);
          r.v = clamp(r.v, 0, 460);
          r.x += r.v * dt;
          r.anim += r.v * dt * 0.08;
          if (r.x >= FINISH) { r.x = FINISH; r.done = true; finishOrder.push(r); if (endTimer === 0) endTimer = 3; }
        }
        if (finishOrder.length >= N) { endMatch(); return; }
        if (endTimer > 0) { endTimer -= dt; if (endTimer <= 0) endMatch(); }
      }

      // a rowing boat with the stickman pulling the oars
      function runner(ctx, r, cy) {
        const bob = Math.sin(r.anim * 2) * 2;
        const y = cy + 18 + bob;
        // wake
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2; ctx.lineCap = "round";
        for (let k = 1; k <= 3; k++) {
          const wx = r.x - 34 - k * 15;
          ctx.globalAlpha = 0.4 - k * 0.1;
          ctx.beginPath();
          ctx.moveTo(wx, y + 4 + Math.sin(r.anim * 3 + k) * 3);
          ctx.lineTo(wx - 11, y + 4 + Math.sin(r.anim * 3 + k) * 3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // oars sweeping with the stroke
        const sweep = Math.sin(r.anim * 2) * 0.5;
        ctx.strokeStyle = "#8a6234"; ctx.lineWidth = 4;
        [-1, 1].forEach((s) => {
          ctx.save(); ctx.translate(r.x - 2, y - 10); ctx.rotate(s * (0.5 + sweep));
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, 0); ctx.stroke();
          ctx.fillStyle = "#c9954f";
          ctx.beginPath(); ctx.ellipse(-29, 0, 5, 3, 0, 0, 7); ctx.fill();
          ctx.restore();
        });

        // the rower
        Art.stickman(ctx, r.x, y - 6, {
          color: r.b.color, scale: 0.7, t: r.anim,
          pose: r.done ? "cheer" : "ready", face: 1,
        });

        // hull
        ctx.fillStyle = r.b.color; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r.x - 32, y - 6);
        ctx.quadraticCurveTo(r.x - 34, y + 10, r.x - 16, y + 11);
        ctx.lineTo(r.x + 18, y + 11);
        ctx.quadraticCurveTo(r.x + 38, y + 8, r.x + 34, y - 6);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath(); ctx.ellipse(r.x, y - 4, 22, 3.4, 0, 0, 7); ctx.fill();
      }

      function render(ctx) {
        const laneH = H / N;
        for (let i = 0; i < N; i++) {
          const r = runners[i], cy = laneH * (i + 0.5);
          // water lane
          const wg = ctx.createLinearGradient(0, laneH * i, 0, laneH * (i + 1));
          wg.addColorStop(0, "#12406b"); wg.addColorStop(1, "#0a2748");
          ctx.fillStyle = wg; ctx.fillRect(0, laneH * i, W, laneH);
          ctx.strokeStyle = "rgba(255,255,255,0.09)"; ctx.lineWidth = 2;
          for (let k = 0; k < 6; k++) {
            const wy = laneH * i + 16 + k * (laneH / 7);
            ctx.beginPath();
            for (let x = 0; x < W; x += 24)
              ctx.lineTo(x, wy + Math.sin(x * 0.05 + time * 2 + k) * 2.5);
            ctx.stroke();
          }
          ctx.fillStyle = `${r.b.color}18`; ctx.fillRect(0, laneH * i, W, laneH);
          // finish line
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          for (let y = laneH * i; y < laneH * (i + 1); y += 16)
            ctx.fillRect(FINISH + 8, y + ((y / 16) % 2 ? 0 : 8), 8, 8);
          // progress
          const pct = Math.floor(((r.x - START) / (FINISH - START)) * 100);
          text(ctx, `${r.b.name}  ${pct}%  (${r.b.keys})`, 14, laneH * i + 18,
            { align: "left", font: "700 14px system-ui", color: r.b.color });
          runner(ctx, r, cy + 6);
        }
        // lane dividers
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
        for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(0, laneH * i); ctx.lineTo(W, laneH * i); ctx.stroke(); }

        if (phase === "count") {
          ctx.fillStyle = "rgba(4,6,15,0.55)"; ctx.fillRect(0, 0, W, H);
          const n = Math.ceil(count - 0.2);
          text(ctx, n > 0 ? n : "GO!", W / 2, H / 2, { font: "900 90px system-ui", color: "#ffd24d", glow: "#ffd24d" });
        }
        if (phase === "done") results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
