/* Stack — 1-4 players. A slab slides back and forth; tap to drop it. Any
   overhang gets sliced off, so the tower narrows. Tallest tower wins. */
(function () {
  const { clamp, text, roundRect } = Eng;

  GameHub.register({
    id: "stack",
    name: "Stack",
    category: "Party",
    players: "1-4P",
    min: 1, max: 4,
    color: "#4dc4ff",
    icon: "🧱",
    desc: "Time your drop. Overhang gets sliced off and the tower narrows. Tallest wins.",
    controls: "Your action key to drop the slab",
    create(env) {
      const { W, H, input } = env;
      const N = env.players;
      const laneW = W / N, BH = 24, BASE_W = 118;
      const FLOOR = H - 46, VIEW = 11;          // slabs visible before scrolling
      let players, matchOver, time = 0;
      const results = Eng.Results();

      function makePlayer(b, i) {
        return {
          b, lane: i, cx: laneW * i + laneW / 2,
          slabs: [{ x: 0, w: BASE_W }],          // x = offset from lane centre
          cur: { x: -laneW * 0.34, w: BASE_W, dir: 1 },
          speed: 168, alive: true, chips: [], flash: 0,
        };
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map(makePlayer);
        matchOver = false;
      }
      reset();

      function endMatch() {
        const rank = [...players]
          .sort((a, b) => b.slabs.length - a.slabs.length)
          .map((p) => ({ b: p.b, score: p.slabs.length - 1 }));
        results.open(rank); matchOver = true;
      }

      function drop(p) {
        const top = p.slabs[p.slabs.length - 1];
        const c = p.cur;
        const left = Math.max(c.x - c.w / 2, top.x - top.w / 2);
        const right = Math.min(c.x + c.w / 2, top.x + top.w / 2);
        const w = right - left;
        if (w <= 2) { p.alive = false; if (players.every((q) => !q.alive)) endMatch(); return; }

        // sliced-off piece falls away
        if (c.x - c.w / 2 < left) p.chips.push({ x: (c.x - c.w / 2 + left) / 2, w: left - (c.x - c.w / 2), y: 0, vy: 0 });
        if (c.x + c.w / 2 > right) p.chips.push({ x: (right + c.x + c.w / 2) / 2, w: (c.x + c.w / 2) - right, y: 0, vy: 0 });

        const perfect = Math.abs(c.x - top.x) < 3;
        const nx = (left + right) / 2;
        p.slabs.push({ x: nx, w: perfect ? top.w : w, perfect });
        p.flash = perfect ? 0.5 : 0;
        p.speed = Math.min(430, p.speed + 11);
        p.cur = { x: -laneW * 0.34, w: perfect ? top.w : w, dir: 1 };
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }

        let anyAlive = false;
        for (const p of players) {
          for (const ch of p.chips) { ch.vy += 1500 * dt; ch.y += ch.vy * dt; }
          p.chips = p.chips.filter((ch) => ch.y < 420);
          if (p.flash > 0) p.flash -= dt;
          if (!p.alive) continue;
          anyAlive = true;
          const lim = laneW * 0.38;
          p.cur.x += p.cur.dir * p.speed * dt;
          if (p.cur.x > lim) { p.cur.x = lim; p.cur.dir = -1; }
          if (p.cur.x < -lim) { p.cur.x = -lim; p.cur.dir = 1; }
          if (input.pressed(p.b.action)) drop(p);
        }
        if (!anyAlive) endMatch();
      }

      function slab(ctx, cx, y, s, col, glow) {
        ctx.fillStyle = col;
        if (glow) { ctx.shadowColor = col; ctx.shadowBlur = 20; }
        roundRect(ctx, cx + s.x - s.w / 2, y, s.w, BH - 3, 5); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        roundRect(ctx, cx + s.x - s.w / 2, y, s.w, 7, 4); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        roundRect(ctx, cx + s.x - s.w / 2, y + BH - 9, s.w, 6, 3); ctx.fill();
      }

      function render(ctx) {
        for (let i = 0; i < N; i++) {
          const p = players[i], x0 = laneW * i;
          const hue = (196 + p.slabs.length * 9) % 360;
          const g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, `hsl(${hue},48%,17%)`); g.addColorStop(1, "#080c18");
          ctx.fillStyle = g; ctx.fillRect(x0, 0, laneW, H);
          if (p.flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${p.flash * 0.3})`;
            ctx.fillRect(x0, 0, laneW, H);
          }

          const scroll = Math.max(0, p.slabs.length - VIEW) * BH;
          // tower
          p.slabs.forEach((s, k) => {
            const y = FLOOR - (k + 1) * BH + scroll;
            if (y < -BH || y > H) return;
            slab(ctx, p.cx, y, s, `hsl(${(196 + k * 9) % 360},72%,${s.perfect ? 68 : 56}%)`, s.perfect);
          });
          // falling offcuts
          for (const ch of p.chips) {
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            const y = FLOOR - p.slabs.length * BH + scroll + ch.y;
            roundRect(ctx, p.cx + ch.x - ch.w / 2, y, ch.w, BH - 3, 4); ctx.fill();
          }
          // the sliding slab
          if (p.alive) {
            const y = FLOOR - (p.slabs.length + 1) * BH + scroll;
            slab(ctx, p.cx, y, p.cur, `hsl(${(196 + p.slabs.length * 9) % 360},85%,66%)`, true);
          } else {
            text(ctx, "TOPPLED", p.cx, H / 2, { font: "900 26px system-ui", color: "#ff5b8a", glow: "#ff5b8a" });
          }

          ctx.fillStyle = "rgba(6,10,20,0.72)";
          roundRect(ctx, x0 + 10, 10, laneW - 20, 34, 10); ctx.fill();
          text(ctx, `${p.b.name}  ${p.slabs.length - 1}`, x0 + laneW / 2, 27,
            { font: "800 18px system-ui", color: p.b.color });
          if (i > 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke();
          }
        }
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
