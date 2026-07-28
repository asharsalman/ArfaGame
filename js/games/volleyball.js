/* Volleyball — 2 players (or vs CPU). Keep the ball off your own side. First to 7. */
(function () {
  const { clamp, dist, rand, text } = Eng;

  GameHub.register({
    id: "volleyball",
    name: "Volleyball",
    category: "2 Players",
    players: "2P",
    cpu: true,
    color: "#4dc4ff",
    icon: "🏐",
    desc: "Bump the ball over the net — let it land on your side and they score. First to 7.",
    controls: "P1: A/D move, W jump · P2: ←/→ move, ↑ jump",
    create(env) {
      const { W, H, input } = env;
      const FLOOR = H - 56, GRAV = 1500, PR = 30, BR = 15, TARGET = 7;
      const NETX = W / 2, NETH = 172;
      const ballCol = Eng.skinColor("volleyball", "#ffffff");
      const BOT = env.bot ? ({ easy: { spd: 210, err: 90 }, normal: { spd: 300, err: 44 }, hard: { spd: 400, err: 16 } })[env.bot.diff] : null;
      let p1, p2, ball, s1, s2, msg, msgT, matchOver, serveTo, time = 0;
      const results = Eng.Results();

      function endMatch() {
        const order = s1 >= s2
          ? [{ b: p1.b, score: s1 }, { b: p2.b, score: s2 }]
          : [{ b: p2.b, score: s2 }, { b: p1.b, score: s1 }];
        results.open(order); matchOver = true;
      }

      function serve(side) {
        serveTo = side;
        ball = { x: side < 0 ? W * 0.25 : W * 0.75, y: 150, vx: 0, vy: 0 };
        p1.x = W * 0.25; p1.y = FLOOR; p1.vy = 0; p1.onGround = true;
        p2.x = W * 0.75; p2.y = FLOOR; p2.vy = 0; p2.onGround = true;
      }
      function reset() {
        p1 = { b: Eng.PLAYERS[0], x: 0, y: FLOOR, vx: 0, vy: 0, onGround: true };
        p2 = { b: Eng.PLAYERS[1], x: 0, y: FLOOR, vx: 0, vy: 0, onGround: true };
        s1 = 0; s2 = 0; msg = ""; msgT = 0; matchOver = false;
        serve(Math.random() < 0.5 ? -1 : 1);
      }
      reset();

      function move(p, lo, hi, dt) {
        p.vx = 0;
        if (input.down(p.b.left)) p.vx = -330;
        if (input.down(p.b.right)) p.vx = 330;
        if (input.down(p.b.up) && p.onGround) { p.vy = -680; p.onGround = false; }
        step(p, lo, hi, dt);
      }
      function step(p, lo, hi, dt) {
        p.x = clamp(p.x + p.vx * dt, lo, hi);
        p.vy += GRAV * dt; p.y += p.vy * dt;
        if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; }
      }
      function botMove(p, lo, hi, dt) {
        p.vx = 0;
        const incoming = ball.x > NETX || ball.vx > 0;
        const target = incoming ? ball.x + Math.sin(ball.y * 0.05) * BOT.err : W * 0.75;
        if (Math.abs(target - p.x) > 12) p.vx = Math.sign(target - p.x) * BOT.spd;
        if (incoming && p.onGround && ball.y < 260 && Math.abs(ball.x - p.x) < 110) { p.vy = -680; p.onGround = false; }
        step(p, lo, hi, dt);
      }

      function bump(p) {
        const cy = p.y - PR;
        const d = dist(p.x, cy, ball.x, ball.y);
        if (d < PR + BR && d > 0) {
          const nx = (ball.x - p.x) / d, ny = (ball.y - cy) / d;
          ball.x = p.x + nx * (PR + BR); ball.y = cy + ny * (PR + BR);
          ball.vx = nx * 300 + p.vx * 0.55;
          ball.vy = Math.min(ny * 330, -300) + (p.vy < 0 ? p.vy * 0.42 : 0);
        }
      }

      function point(winner) {
        if (winner === 1) s1++; else s2++;
        msg = `${winner === 1 ? p1.b.name : (BOT ? "CPU" : p2.b.name)} scores!`;
        msgT = 1.2;
        if (s1 >= TARGET || s2 >= TARGET) { endMatch(); return; }
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) serve(s1 > s2 ? 1 : -1); return; }

        move(p1, PR, NETX - PR - 6, dt);
        if (BOT) botMove(p2, NETX + PR + 6, W - PR, dt);
        else move(p2, NETX + PR + 6, W - PR, dt);

        ball.vy += GRAV * 0.52 * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.vx *= Math.exp(-0.16 * dt);

        if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }

        // net: solid post below the tape
        if (Math.abs(ball.x - NETX) < BR + 5 && ball.y > FLOOR - NETH) {
          if (ball.x < NETX) { ball.x = NETX - BR - 5; ball.vx = -Math.abs(ball.vx) * 0.7; }
          else { ball.x = NETX + BR + 5; ball.vx = Math.abs(ball.vx) * 0.7; }
        }

        bump(p1); bump(p2);

        if (ball.y > FLOOR - BR) { point(ball.x < NETX ? 2 : 1); return; }
      }

      function figure(ctx, p, faceRight) {
        Art.shadow(ctx, p.x, FLOOR + 2, 20, 0.25);
        Art.stickman(ctx, p.x, p.y, {
          color: p.b.color, scale: 1.12, t: time,
          pose: !p.onGround ? "jump" : (p.vx ? "run" : "guard"),
          face: faceRight ? 1 : -1,
        });
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0d2b4a"); g.addColorStop(1, "#08182c");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#c98f4a"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        for (let x = 0; x < W; x += 60) ctx.fillRect(x, FLOOR, 30, H - FLOOR);

        // net
        ctx.fillStyle = "#e8eeff"; ctx.fillRect(NETX - 4, FLOOR - NETH, 8, NETH);
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5;
        for (let y = FLOOR - NETH; y < FLOOR; y += 14) { ctx.beginPath(); ctx.moveTo(NETX - 14, y); ctx.lineTo(NETX + 14, y); ctx.stroke(); }
        ctx.fillStyle = "#fff"; ctx.fillRect(NETX - 16, FLOOR - NETH - 8, 32, 8);

        figure(ctx, p1, true); figure(ctx, p2, false);

        Art.shadow(ctx, ball.x, FLOOR + 2, BR * 0.9, 0.2);
        Art.ball(ctx, ball.x, ball.y, BR, "volley", ballCol);

        text(ctx, `${p1.b.name}  ${s1}`, 30, 34, { align: "left", font: "800 24px system-ui", color: p1.b.color });
        text(ctx, `${s2}  ${BOT ? "CPU" : p2.b.name}`, W - 30, 34, { align: "right", font: "800 24px system-ui", color: p2.b.color });
        if (msg && msgT > 0) text(ctx, msg, W / 2, 96, { font: "900 40px system-ui", color: "#fff", glow: "#4dc4ff" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
