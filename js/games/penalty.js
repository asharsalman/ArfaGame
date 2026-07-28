/* Penalty Shootout — 2 players (or vs CPU).
   BOTH players move freely the whole time. The striker runs at the ball and
   aims by the angle they approach from; the keeper runs the line and dives. */
(function () {
  const { clamp, dist, rand, text } = Eng;

  GameHub.register({
    id: "penalty",
    name: "Penalty Shootout",
    category: "2 Players",
    players: "2P",
    cpu: true,
    color: "#4dff9e",
    icon: "🥅",
    desc: "Run at the ball and strike — the keeper runs the line and dives. 5 kicks each.",
    controls: "Both move freely · striker: action to kick · keeper: action to dive",
    create(env) {
      const { W, H, input } = env;
      const ROUNDS = 5;
      const GX0 = W / 2 - 250, GX1 = W / 2 + 250, GY = 132, GH = 176;
      const LINE = GY + GH;                     // goal line
      const SPOT = { x: W / 2, y: H - 128 };
      const FLIGHT = 0.72;                      // seconds ball takes to reach the line
      const BOT = env.bot
        ? ({ easy: { spd: 200, react: 0.3, err: 120 }, normal: { spd: 290, react: 0.18, err: 66 }, hard: { spd: 380, react: 0.09, err: 26 } })[env.bot.diff]
        : null;
      let strikerIdx, round, phase, t, ball, st, kp, msg, msgT, scores, matchOver, time = 0, botDive;
      const results = Eng.Results();

      function newKick() {
        phase = "live"; t = 0; botDive = null;
        ball = { x: SPOT.x, y: SPOT.y, vx: 0, vy: 0, flying: false, z: 0 };
        st = { x: SPOT.x - 70, y: SPOT.y + 30, cool: 0 };
        kp = { x: W / 2, dive: 0, diveDir: 0, diveT: 0 };
      }
      function reset() {
        scores = [0, 0]; strikerIdx = 0; round = 0;
        msg = ""; msgT = 0; matchOver = false; newKick();
      }
      reset();

      const keeperIdx = () => (strikerIdx === 0 ? 1 : 0);
      const botIsKeeper = () => BOT && keeperIdx() === 1;
      const botIsStriker = () => BOT && strikerIdx === 1;

      function endMatch() {
        const order = scores[0] >= scores[1] ? [0, 1] : [1, 0];
        results.open(order.map((i) => ({ b: Eng.PLAYERS[i], score: scores[i] })));
        matchOver = true;
      }
      function nextKick() {
        if (strikerIdx === 1) round++;
        strikerIdx = strikerIdx === 0 ? 1 : 0;
        if (round >= ROUNDS) { endMatch(); return; }
        newKick();
      }

      // where a shot from the current striker position would cross the goal line
      function aimTarget() {
        const dx = ball.x - st.x, dy = ball.y - st.y;
        const d = Math.hypot(dx, dy) || 1;
        return clamp(ball.x + (dx / d) * 330, GX0 - 70, GX1 + 70);
      }

      function kickBall() {
        // Fixed flight time so every shot is reactable — the keeper always gets
        // FLIGHT seconds to read it and dive.
        const tx = aimTarget();
        ball.vx = (tx - ball.x) / FLIGHT;
        ball.vy = ((LINE - 26) - ball.y) / FLIGHT;
        ball.flying = true;
        phase = "flight";
        if (botIsKeeper()) botDive = { at: BOT.react, to: tx + rand(-BOT.err, BOT.err), done: false };
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) nextKick(); return; }

        const sB = Eng.PLAYERS[strikerIdx], kB = Eng.PLAYERS[keeperIdx()];

        // ---- keeper moves at ALL times ----
        if (botIsKeeper()) {
          if (phase === "live") {
            const target = W / 2 + Math.sin(time * 1.1) * 90;
            kp.x += clamp(target - kp.x, -BOT.spd * 0.5 * dt, BOT.spd * 0.5 * dt);
          } else if (botDive && !botDive.done) {
            if (t >= botDive.at) { botDive.done = true; kp.diveDir = Math.sign(botDive.to - kp.x) || 1; kp.dive = 1; }
          }
        } else {
          const sp = 330 * dt;
          if (input.down(kB.left)) kp.x -= sp;
          if (input.down(kB.right)) kp.x += sp;
          if (input.pressed(kB.action) && kp.dive === 0) {
            kp.diveDir = 0; kp.dive = 1; kp.diveT = 0;
            if (input.down(kB.left)) kp.diveDir = -1;
            else if (input.down(kB.right)) kp.diveDir = 1;
          }
        }
        if (kp.dive > 0) { kp.diveT += dt; kp.x += kp.diveDir * 470 * dt; if (kp.diveT > 0.75) { kp.dive = 0; kp.diveT = 0; } }
        kp.x = clamp(kp.x, GX0 + 18, GX1 - 18);

        // ---- striker moves at ALL times ----
        if (phase === "live") {
          if (botIsStriker()) {
            const tx = SPOT.x - 60, ty = SPOT.y + 20;
            st.x += clamp(tx - st.x, -BOT.spd * dt, BOT.spd * dt);
            st.y += clamp(ty - st.y, -BOT.spd * dt, BOT.spd * dt);
            t += dt;
            if (t > 1.1) kickBall();
          } else {
            const sp = 300 * dt;
            if (input.down(sB.left)) st.x -= sp;
            if (input.down(sB.right)) st.x += sp;
            if (input.down(sB.up)) st.y -= sp;
            if (input.down(sB.down)) st.y += sp;
            st.x = clamp(st.x, 40, W - 40);
            st.y = clamp(st.y, LINE + 40, H - 30);
            if (input.pressed(sB.action) && dist(st.x, st.y, ball.x, ball.y) < 62) kickBall();
          }
          return;
        }

        // ---- flight ----
        t += dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;

        if (ball.y <= LINE - 26) {
          const reach = kp.dive > 0 ? 92 : 52;
          if (Math.abs(kp.x - ball.x) < reach && ball.x > GX0 - 20 && ball.x < GX1 + 20) {
            msg = `${kB.name} SAVES!`;
          } else if (ball.x < GX0 || ball.x > GX1) {
            msg = "MISSED!";
          } else { scores[strikerIdx]++; msg = "GOAL!"; }
          phase = "result"; msgT = 1.4;
        }
        if (ball.y < -40 || ball.x < -40 || ball.x > W + 40) { msg = "MISSED!"; phase = "result"; msgT = 1.3; }
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0b2a4a"); g.addColorStop(0.4, "#12592f"); g.addColorStop(1, "#0b3a1e");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        for (let y = LINE; y < H; y += 56) ctx.fillRect(0, y, W, 28);

        ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, LINE); ctx.lineTo(W, LINE); ctx.stroke();
        ctx.beginPath(); ctx.arc(SPOT.x, SPOT.y, 82, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(SPOT.x, SPOT.y, 4, 0, 7); ctx.fill();
        ctx.strokeRect(GX0 - 60, LINE, (GX1 - GX0) + 120, 96);

        // net
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
        for (let x = GX0; x <= GX1; x += 18) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x, LINE); ctx.stroke(); }
        for (let y = GY; y <= LINE; y += 18) { ctx.beginPath(); ctx.moveTo(GX0, y); ctx.lineTo(GX1, y); ctx.stroke(); }
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(GX0, LINE); ctx.lineTo(GX0, GY); ctx.lineTo(GX1, GY); ctx.lineTo(GX1, LINE); ctx.stroke();

        const sB = Eng.PLAYERS[strikerIdx], kB = Eng.PLAYERS[keeperIdx()];

        // keeper
        Art.shadow(ctx, kp.x, LINE - 2, 20, 0.28);
        Art.stickman(ctx, kp.x, LINE - 4, {
          color: kB.color, scale: 1.2, t: time,
          pose: kp.dive > 0 ? "dive" : "guard", face: kp.dive > 0 ? (kp.diveDir || 1) : 1,
        });

        // aim guide — shows exactly where the shot will cross the line, so the
        // keeper can read it and the striker has to disguise it by moving late
        if (phase === "live") {
          const near = dist(st.x, st.y, ball.x, ball.y) < 62;
          const tx = aimTarget();
          ctx.strokeStyle = near ? sB.color : "rgba(255,255,255,0.25)";
          ctx.lineWidth = near ? 4 : 2; ctx.setLineDash([10, 9]);
          ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(tx, LINE - 26); ctx.stroke();
          ctx.setLineDash([]);
          if (near) {
            ctx.strokeStyle = sB.color; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(tx, LINE - 26, 13, 0, 7); ctx.stroke();
          }
        }

        // striker
        Art.shadow(ctx, st.x, st.y + 2, 18);
        Art.stickman(ctx, st.x, st.y, {
          color: sB.color, scale: 1.2, t: time,
          pose: phase === "live" ? "run" : "throw", face: ball.x >= st.x ? 1 : -1,
        });

        Art.shadow(ctx, ball.x, Math.max(ball.y + 6, LINE + 4), 12, 0.18);
        Art.ball(ctx, ball.x, ball.y, 13, "soccer", "#ffffff");

        text(ctx, `${Eng.PLAYERS[0].name}  ${scores[0]}`, 30, 32, { align: "left", font: "800 22px system-ui", color: Eng.PLAYERS[0].color });
        text(ctx, `${scores[1]}  ${BOT ? "CPU" : Eng.PLAYERS[1].name}`, W - 30, 32, { align: "right", font: "800 22px system-ui", color: Eng.PLAYERS[1].color });
        text(ctx, `Kick ${Math.min(round + 1, ROUNDS)} / ${ROUNDS}`, W / 2, 32, { font: "700 17px system-ui", color: "#cfe0ff" });
        text(ctx, `${sB.name} striking  ·  ${kB.name} keeping`, W / 2, H - 16, { font: "700 15px system-ui", color: "#bcd8c4" });

        if (msg && msgT > 0)
          text(ctx, msg, W / 2, H / 2 - 20, { font: "900 56px system-ui", color: "#fff", glow: msg === "GOAL!" ? "#4dff9e" : "#ffd24d" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
