/* Air Hockey — 2-player, vertical table. */
(function () {
  const { clamp, rand, dist, text } = Eng;

  GameHub.register({
    id: "airhockey",
    name: "Air Hockey",
    category: "2 Players",
    players: "2P",
    color: "#4dff9e",
    icon: "🥅",
    desc: "Slam the puck into their goal. First to 7.",
    controls: "P1: W A S D   ·   P2: arrow keys",
    create(env) {
      const { W, H, input } = env;
      const M = 28;                       // table margin
      const L = M, R = W - M, T = M, B = H - M;
      const GW = 240, CX = W / 2;         // goal opening
      const TARGET = 7, MR = 30, PR = 18; // mallet & puck radius
      let m1, m2, puck, s1, s2, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const order = s1 >= s2 ? [0, 1] : [1, 0];
        results.open(order.map((i) => ({ b: Eng.PLAYERS[i], score: i === 0 ? s1 : s2 })));
        matchOver = true;
      }

      function resetPuck(dir) {
        puck = { x: CX, y: H / 2, vx: rand(-60, 60), vy: 180 * dir };
      }
      function reset() {
        m1 = { x: CX, y: B - 90, px: CX, py: B - 90 };
        m2 = { x: CX, y: T + 90, px: CX, py: T + 90 };
        s1 = 0; s2 = 0; matchOver = false; resetPuck(Math.random() < 0.5 ? 1 : -1);
      }
      reset();

      function moveMallet(m, up, dn, lf, rt, top, bot, dt) {
        m.px = m.x; m.py = m.y;
        const sp = 560 * dt;
        if (input.down(up)) m.y -= sp;
        if (input.down(dn)) m.y += sp;
        if (input.down(lf)) m.x -= sp;
        if (input.down(rt)) m.x += sp;
        m.x = clamp(m.x, L + MR, R - MR);
        m.y = clamp(m.y, top + MR, bot - MR);
      }

      function malletPuck(m) {
        const d = dist(m.x, m.y, puck.x, puck.y);
        if (d < MR + PR && d > 0) {
          const nx = (puck.x - m.x) / d, ny = (puck.y - m.y) / d;
          puck.x = m.x + nx * (MR + PR);
          puck.y = m.y + ny * (MR + PR);
          const mvx = (m.x - m.px) / 0.016, mvy = (m.y - m.py) / 0.016;
          const sp = Math.hypot(puck.vx, puck.vy);
          puck.vx = nx * Math.max(sp, 260) + mvx * 0.6;
          puck.vy = ny * Math.max(sp, 260) + mvy * 0.6;
        }
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        moveMallet(m1, "KeyW", "KeyS", "KeyA", "KeyD", H / 2, B, dt);
        moveMallet(m2, "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", T, H / 2, dt);

        puck.x += puck.vx * dt; puck.y += puck.vy * dt;
        puck.vx *= Math.exp(-0.35 * dt); puck.vy *= Math.exp(-0.35 * dt);

        if (puck.x < L + PR) { puck.x = L + PR; puck.vx = Math.abs(puck.vx); }
        if (puck.x > R - PR) { puck.x = R - PR; puck.vx = -Math.abs(puck.vx); }

        const inGoal = Math.abs(puck.x - CX) < GW / 2;
        if (puck.y < T + PR) {
          if (inGoal) { s1++; goal(1); return; }
          puck.y = T + PR; puck.vy = Math.abs(puck.vy);
        }
        if (puck.y > B - PR) {
          if (inGoal) { s2++; goal(-1); return; }
          puck.y = B - PR; puck.vy = -Math.abs(puck.vy);
        }
        malletPuck(m1); malletPuck(m2);
      }
      function goal(dir) {
        if (s1 >= TARGET || s2 >= TARGET) endMatch();
        else { m1.x = CX; m1.y = B - 90; m2.x = CX; m2.y = T + 90; resetPuck(dir); }
      }

      function render(ctx) {
        ctx.fillStyle = Eng.skinColor("ahtable", "#0d2138"); ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#1d3a55"; ctx.lineWidth = 4;
        ctx.strokeRect(L, T, R - L, B - T);
        ctx.beginPath(); ctx.moveTo(L, H / 2); ctx.lineTo(R, H / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(CX, H / 2, 70, 0, 7); ctx.stroke();

        // goals
        ctx.strokeStyle = "#4dff9e"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(CX - GW / 2, T); ctx.lineTo(CX + GW / 2, T); ctx.stroke();
        ctx.strokeStyle = "#ff6ad5";
        ctx.beginPath(); ctx.moveTo(CX - GW / 2, B); ctx.lineTo(CX + GW / 2, B); ctx.stroke();

        text(ctx, s2, 60, H / 2 - 26, { font: "900 46px system-ui", color: "#4dff9e" });
        text(ctx, s1, 60, H / 2 + 26, { font: "900 46px system-ui", color: "#ff6ad5" });

        const mal = (m, c) => {
          ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(m.x, m.y, MR, 0, 7); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = "#0b1320";
          ctx.beginPath(); ctx.arc(m.x, m.y, MR * 0.45, 0, 7); ctx.fill();
        };
        mal(m1, "#ff6ad5"); mal(m2, "#4dff9e");

        const puckCol = Eng.skinColor("airhockey", "#ffffff");
        ctx.fillStyle = puckCol; ctx.shadowColor = puckCol; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(puck.x, puck.y, PR, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
