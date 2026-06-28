/* Sprint Race — 2-4 players. Mash your two keys to run. First past the line wins. */
(function () {
  const { clamp, text } = Eng;

  GameHub.register({
    id: "sprint",
    name: "Sprint Race",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ffd24d",
    icon: "🏁",
    desc: "Hammer your left/right keys alternately to sprint to the finish line.",
    controls: "Alternate your two side keys fast (e.g. A/D)",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, START = 90, FINISH = W - 90;
      let runners, phase, count, finishOrder, endTimer;
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

      function runner(ctx, r, cy) {
        const lean = Math.sin(r.anim) * Math.min(1, r.v / 220);
        ctx.strokeStyle = r.b.color; ctx.fillStyle = r.b.color; ctx.lineWidth = 4;
        ctx.shadowColor = r.b.color; ctx.shadowBlur = 10;
        const x = r.x;
        ctx.beginPath(); ctx.arc(x, cy - 26, 9, 0, 7); ctx.fill();          // head
        ctx.beginPath(); ctx.moveTo(x, cy - 17); ctx.lineTo(x, cy + 4); ctx.stroke(); // body
        ctx.beginPath();                                                    // legs
        ctx.moveTo(x, cy + 4); ctx.lineTo(x + 12 * lean, cy + 22);
        ctx.moveTo(x, cy + 4); ctx.lineTo(x - 12 * lean, cy + 22); ctx.stroke();
        ctx.beginPath();                                                    // arms
        ctx.moveTo(x, cy - 10); ctx.lineTo(x - 12 * lean, cy - 2);
        ctx.moveTo(x, cy - 10); ctx.lineTo(x + 12 * lean, cy - 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      function render(ctx) {
        const laneH = H / N;
        for (let i = 0; i < N; i++) {
          const r = runners[i], cy = laneH * (i + 0.5);
          ctx.fillStyle = i % 2 ? "#0d1430" : "#0a1126"; ctx.fillRect(0, laneH * i, W, laneH);
          ctx.fillStyle = `${r.b.color}22`; ctx.fillRect(0, laneH * i, W, laneH);
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
