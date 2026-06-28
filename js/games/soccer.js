/* Soccer Duel — 2 players, side-view head-soccer. First to 5 goals. */
(function () {
  const { clamp, dist, text } = Eng;

  GameHub.register({
    id: "soccer",
    name: "Soccer Duel",
    category: "2 Players",
    players: "2P",
    color: "#4dff9e",
    icon: "⚽",
    desc: "Bounce the ball into their goal. Jump for headers. First to 5.",
    controls: "P1: A/D move, W jump · P2: ←/→ move, ↑ jump",
    create(env) {
      const { W, H, input } = env;
      const FLOOR = H - 60, GRAV = 1500, PRAD = 32, BR = 16;
      const GW = 70, GH = 170, TARGET = 5;       // goal width & height
      const ballCol = Eng.skinColor("soccer", "#ffffff");
      let p1, p2, ball, s1, s2, msg, msgT, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const order = s1 >= s2
          ? [{ b: p1.b, score: s1 }, { b: p2.b, score: s2 }]
          : [{ b: p2.b, score: s2 }, { b: p1.b, score: s1 }];
        results.open(order); matchOver = true;
      }

      function kickoff(dir) {
        ball = { x: W / 2, y: H / 2 - 40, vx: 0, vy: 0 };
        p1.x = W * 0.28; p1.y = FLOOR; p1.vx = 0; p1.vy = 0;
        p2.x = W * 0.72; p2.y = FLOOR; p2.vx = 0; p2.vy = 0;
      }
      function reset() {
        p1 = { b: Eng.PLAYERS[0], x: 0, y: FLOOR, vx: 0, vy: 0, onGround: true };
        p2 = { b: Eng.PLAYERS[1], x: 0, y: FLOOR, vx: 0, vy: 0, onGround: true };
        s1 = 0; s2 = 0; msg = ""; msgT = 0; matchOver = false; kickoff(1);
      }
      reset();

      function move(p, lo, hi, dt) {
        p.vx = 0;
        if (input.down(p.b.left)) p.vx = -300;
        if (input.down(p.b.right)) p.vx = 300;
        p.x = clamp(p.x + p.vx * dt, lo, hi);
        if (input.down(p.b.up) && p.onGround) { p.vy = -620; p.onGround = false; }
        p.vy += GRAV * dt; p.y += p.vy * dt;
        if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; }
      }
      function kick(p) {
        const cy = p.y - PRAD;
        const d = dist(p.x, cy, ball.x, ball.y);
        if (d < PRAD + BR && d > 0) {
          const nx = (ball.x - p.x) / d, ny = (ball.y - cy) / d;
          ball.x = p.x + nx * (PRAD + BR); ball.y = cy + ny * (PRAD + BR);
          ball.vx = nx * 440 + p.vx * 0.8;
          ball.vy = ny * 440 + (p.vy < 0 ? p.vy * 0.7 : 0) - 90;
        }
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) kickoff(1); return; }

        // players roam the whole pitch (can actually reach the goal to score)
        move(p1, PRAD, W - PRAD, dt);
        move(p2, PRAD, W - PRAD, dt);

        ball.vy += GRAV * 0.6 * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.vx *= Math.exp(-0.12 * dt);

        if (ball.y > FLOOR - BR) { ball.y = FLOOR - BR; ball.vy *= -0.7; ball.vx *= 0.92; }
        if (ball.y < BR) { ball.y = BR; ball.vy *= -0.7; }

        // goals at far left / right, below crossbar (FLOOR-GH)
        const inMouth = ball.y > FLOOR - GH;
        if (ball.x - BR <= 0) {
          if (inMouth) { s2++; goal(); return; }
          ball.x = BR; ball.vx = Math.abs(ball.vx);
        }
        if (ball.x + BR >= W) {
          if (inMouth) { s1++; goal(); return; }
          ball.x = W - BR; ball.vx = -Math.abs(ball.vx);
        }
        // crossbars
        const bar = (gx0, gx1) => {
          if (ball.x > gx0 && ball.x < gx1 && Math.abs(ball.y - (FLOOR - GH)) < BR) {
            ball.y = FLOOR - GH - BR; ball.vy = Math.abs(ball.vy) * 0.6;
          }
        };
        bar(0, GW); bar(W - GW, W);

        kick(p1); kick(p2);
      }
      function goal() {
        if (s1 >= TARGET || s2 >= TARGET) { endMatch(); return; }
        msg = "GOAL!"; msgT = 1.3;
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0c2a1a"); g.addColorStop(1, "#06140d");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#0a3d24"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
        ctx.strokeStyle = "#1d7a47"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();

        // goals
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 5;
        ctx.strokeRect(0, FLOOR - GH, GW, GH);
        ctx.strokeRect(W - GW, FLOOR - GH, GW, GH);
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
        for (let i = 8; i < GW; i += 14) { ctx.beginPath(); ctx.moveTo(i, FLOOR - GH); ctx.lineTo(i, FLOOR); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W - i, FLOOR - GH); ctx.lineTo(W - i, FLOOR); ctx.stroke(); }

        const head = (p) => {
          const cy = p.y - PRAD;
          ctx.fillStyle = p.b.color; ctx.shadowColor = p.b.color; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(p.x, cy, PRAD, Math.PI, 0); ctx.lineTo(p.x + PRAD, p.y); ctx.lineTo(p.x - PRAD, p.y); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = "#0a1018";
          ctx.beginPath(); ctx.arc(p.x + (p === p1 ? 10 : -10), cy - 6, 5, 0, 7); ctx.fill();
        };
        head(p1); head(p2);

        ctx.fillStyle = ballCol; ctx.shadowColor = ballCol; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, 7); ctx.stroke();

        text(ctx, `P1  ${s1}`, 30, 34, { align: "left", font: "800 26px system-ui", color: p1.b.color });
        text(ctx, `${s2}  P2`, W - 30, 34, { align: "right", font: "800 26px system-ui", color: p2.b.color });
        if (msg && msgT > 0) text(ctx, msg, W / 2, H / 2 - 60, { font: "900 46px system-ui", color: "#fff", glow: "#4dff9e" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
