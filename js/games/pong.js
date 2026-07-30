/* Ping Pong — 2 players or vs CPU. Characters hold the rackets. */
(function () {
  const { clamp, rand, text } = Eng;

  GameHub.register({
    id: "pong",
    name: "Ping Pong",
    category: "2 Players",
    players: "2P",
    cpu: true,
    color: "#ffd24d",
    icon: "🏓",
    desc: "Bounce it past your rival. Play a friend or the CPU. First to 7.",
    controls: "P1: W / S   ·   P2: ↑ / ↓",
    create(env) {
      const { W, H, input } = env;
      const PW = 16, PH = 104, TARGET = 7;
      const C1 = Eng.PLAYERS[0].color, C2 = Eng.PLAYERS[1].color;
      const ballCol = Eng.skinColor("pong", "#ffffff");
      const BOT = env.bot ? ({ easy: { spd: 300, err: 80 }, normal: { spd: 440, err: 36 }, hard: { spd: 620, err: 10 } })[env.bot.diff] : null;
      let p1, p2, ball, s1, s2, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const order = s1 >= s2 ? [0, 1] : [1, 0];
        results.open(order.map((i) => ({ b: Eng.PLAYERS[i], score: i === 0 ? s1 : s2 })));
        matchOver = true;
      }

      function serve(dir) { ball = { x: W / 2, y: H / 2, r: 10, vx: 320 * dir, vy: rand(-170, 170) }; }
      function reset() {
        p1 = { x: 30, y: H / 2 - PH / 2 };
        p2 = { x: W - 30 - PW, y: H / 2 - PH / 2 };
        s1 = 0; s2 = 0; matchOver = false;
        serve(Math.random() < 0.5 ? 1 : -1);
      }
      reset();

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        const sp = 470 * dt;
        if (input.down("KeyW")) p1.y -= sp;
        if (input.down("KeyS")) p1.y += sp;
        if (BOT) {
          if (ball.vx > 0) {
            const target = ball.y - PH / 2 + Math.sin(ball.x * 0.04) * BOT.err;
            p2.y += clamp(target - p2.y, -BOT.spd * dt, BOT.spd * dt);
          } else {
            p2.y += clamp((H / 2 - PH / 2) - p2.y, -190 * dt, 190 * dt);
          }
        } else {
          if (input.down("ArrowUp")) p2.y -= sp;
          if (input.down("ArrowDown")) p2.y += sp;
        }
        p1.y = clamp(p1.y, 0, H - PH);
        p2.y = clamp(p2.y, 0, H - PH);

        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
        if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy *= -1; }

        const hit = (pad, dir) => {
          if (ball.x - ball.r < pad.x + PW && ball.x + ball.r > pad.x &&
              ball.y > pad.y && ball.y < pad.y + PH && Math.sign(ball.vx) === -dir) {
            ball.vx = Math.abs(ball.vx) * dir * 1.06;
            ball.vy += ((ball.y - (pad.y + PH / 2)) / (PH / 2)) * 270;
            ball.x += dir * 6;
          }
        };
        hit(p1, 1); hit(p2, -1);

        if (ball.x < -20) { s2++; check(); serve(1); }
        if (ball.x > W + 20) { s1++; check(); serve(-1); }
      }
      function check() { if (s1 >= TARGET || s2 >= TARGET) endMatch(); }

      // a stickman standing at the end of the table, holding a bat
      function racket(ctx, pad, side, color) {
        const hy = pad.y + PH / 2;
        const standX = side < 0 ? 54 : W - 54;      // where the player stands
        const batX = pad.x + PW / 2;                // the hitting face

        Art.shadow(ctx, standX, hy + 44, 17, 0.25);
        Art.stickman(ctx, standX, hy + 42, {
          color, scale: 1.0, t: 0, pose: "ready", face: side < 0 ? 1 : -1,
        });
        // arm reaching to the bat
        const h = Art.handPos(standX, hy + 42, { scale: 1.0, face: side < 0 ? 1 : -1, pose: "ready" });
        Art.limb(ctx, h.x, h.y, batX - side * 10, hy, 5, color);

        // proper table-tennis bat: round red rubber face + wooden handle
        ctx.save(); ctx.translate(batX, hy);
        ctx.fillStyle = "#8a6234"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2.5;
        ctx.beginPath();
        Eng.roundRect(ctx, -side * 4 - 5, PH / 2 - 6, 10, 26, 4);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d8402f"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 0, PW / 2 + 3, PH / 2 - 4, 0, 0, 7);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.ellipse(-2, -PH / 6, PW / 4, PH / 6, 0, 0, 7); ctx.fill();
        ctx.restore();
      }

      function render(ctx) {
        ctx.fillStyle = "#0a1020"; ctx.fillRect(0, 0, W, H);
        ctx.setLineDash([10, 16]); ctx.strokeStyle = "#27407a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);

        text(ctx, s1, W / 2 - 80, 60, { font: "900 60px system-ui", color: C1 });
        text(ctx, BOT ? "CPU" : s2, W / 2 + 80, 60, { font: BOT ? "900 30px system-ui" : "900 60px system-ui", color: C2 });
        if (BOT) text(ctx, s2, W / 2 + 80, 95, { font: "900 40px system-ui", color: C2 });

        racket(ctx, p1, -1, C1); racket(ctx, p2, 1, C2);

        ctx.fillStyle = ballCol; ctx.shadowColor = ballCol; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
