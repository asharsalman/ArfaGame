/* Bowling — 2-4 players, turn based. Lock your aim, lock your power, knock pins down.
   Three frames each; most pins wins. */
(function () {
  const { clamp, dist, text } = Eng;

  GameHub.register({
    id: "bowling",
    name: "Bowling",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#4dc4ff",
    icon: "🎳",
    desc: "Lock your aim, then your power, and roll. Three frames each — most pins wins.",
    controls: "Your action key: 1st press locks aim, 2nd locks power",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, FRAMES = 3;
      const LX = W / 2 - 150, RX = W / 2 + 150;       // lane edges
      const FOUL = H - 96, PIN_Y = 150, PR = 11, BR = 19;
      const ballCol = Eng.skinColor("bowling", "#4dc4ff");
      let players, turn, frame, phase, aim, aimDir, power, powDir, ball, pins, msg, msgT, matchOver, time = 0;
      const results = Eng.Results();

      function setPins() {
        pins = [];
        const rows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]];
        rows.forEach((row, r) => row.forEach((c) => {
          pins.push({ x: W / 2 + c * 25, y: PIN_Y - r * 30, vx: 0, vy: 0, down: false });
        }));
      }
      function newRoll() {
        phase = "aim"; aim = 0; aimDir = 1; power = 0; powDir = 1;
        ball = { x: W / 2, y: FOUL, vx: 0, vy: 0, rolling: false, spin: 0 };
        setPins();
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0 }));
        turn = 0; frame = 0; msg = ""; msgT = 0; matchOver = false; newRoll();
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function finishRoll() {
        const knocked = pins.filter((p) => p.down).length;
        players[turn].score += knocked;
        msg = knocked === 10 ? "STRIKE!" : `${players[turn].b.name} knocked ${knocked}`;
        msgT = 1.5;
      }
      function nextTurn() {
        turn++;
        if (turn >= N) { turn = 0; frame++; }
        if (frame >= FRAMES) { endMatch(); return; }
        newRoll();
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) nextTurn(); return; }

        const cur = players[turn];

        if (phase === "aim") {
          aim += aimDir * 1.5 * dt;
          if (aim > 1) { aim = 1; aimDir = -1; }
          if (aim < -1) { aim = -1; aimDir = 1; }
          if (input.pressed(cur.b.action)) phase = "power";
          return;
        }
        if (phase === "power") {
          power += powDir * 1.6 * dt;
          if (power > 1) { power = 1; powDir = -1; }
          if (power < 0.1) { power = 0.1; powDir = 1; }
          if (input.pressed(cur.b.action)) {
            const sp = 400 + power * 620;
            ball.vy = -sp; ball.vx = aim * sp * 0.34; ball.rolling = true;
            phase = "roll";
          }
          return;
        }

        // rolling
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.vx *= Math.exp(-0.25 * dt); ball.vy *= Math.exp(-0.16 * dt);
        if (ball.x < LX + BR) { ball.x = LX + BR; ball.vx = Math.abs(ball.vx) * 0.4; }
        if (ball.x > RX - BR) { ball.x = RX - BR; ball.vx = -Math.abs(ball.vx) * 0.4; }

        // ball vs pins
        for (const p of pins) {
          if (p.down) continue;
          if (dist(ball.x, ball.y, p.x, p.y) < BR + PR) {
            const a = Math.atan2(p.y - ball.y, p.x - ball.x);
            p.vx = Math.cos(a) * 250 + ball.vx * 0.35;
            p.vy = Math.sin(a) * 250 + ball.vy * 0.35;
            p.down = true;
            ball.vx *= 0.9; ball.vy *= 0.94;
          }
        }
        // pins knocking pins
        for (const p of pins) {
          if (!p.down) continue;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.vx *= Math.exp(-1.6 * dt); p.vy *= Math.exp(-1.6 * dt);
          for (const q of pins) {
            if (q.down || q === p) continue;
            if (dist(p.x, p.y, q.x, q.y) < PR * 2.1) {
              const a = Math.atan2(q.y - p.y, q.x - p.x);
              q.vx = Math.cos(a) * 190; q.vy = Math.sin(a) * 190; q.down = true;
            }
          }
        }

        if (ball.y < -40 || Math.hypot(ball.vx, ball.vy) < 40) finishRoll();
      }

      function pin(ctx, p) {
        if (!p.down) Art.shadow(ctx, p.x, p.y + 3, 9, 0.22);
        Art.pin(ctx, p.x, p.y + 13, 1.15, p.down);
      }

      function render(ctx) {
        ctx.fillStyle = "#0d1226"; ctx.fillRect(0, 0, W, H);
        // lane
        const lg = ctx.createLinearGradient(0, 0, 0, H);
        lg.addColorStop(0, "#c9954f"); lg.addColorStop(1, "#8a6234");
        ctx.fillStyle = lg; ctx.fillRect(LX, 0, RX - LX, H);
        ctx.strokeStyle = "rgba(0,0,0,0.16)"; ctx.lineWidth = 1;
        for (let x = LX + 20; x < RX; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        // gutters
        ctx.fillStyle = "#232b47"; ctx.fillRect(LX - 26, 0, 26, H); ctx.fillRect(RX, 0, 26, H);
        // foul line
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(LX, FOUL + 22); ctx.lineTo(RX, FOUL + 22); ctx.stroke();

        for (const p of pins) if (!p.down) pin(ctx, p);
        for (const p of pins) if (p.down) pin(ctx, p);

        const cur = players[turn];
        // aim guide
        if (phase === "aim" || phase === "power") {
          ctx.strokeStyle = cur.b.color; ctx.lineWidth = 3; ctx.setLineDash([9, 9]);
          ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + aim * 220, ball.y - 400); ctx.stroke();
          ctx.setLineDash([]);
        }
        // power meter
        if (phase === "power") {
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(RX + 34, H / 2 - 110, 22, 220);
          ctx.fillStyle = "#ffd24d"; ctx.fillRect(RX + 34, H / 2 + 110 - 220 * power, 22, 220 * power);
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(RX + 34, H / 2 - 110, 22, 220);
        }

        // bowler stands beside the ball, behind the foul line
        if (phase !== "roll") {
          Art.shadow(ctx, W / 2 - 56, FOUL + 76, 18);
          Art.stickman(ctx, W / 2 - 56, FOUL + 74, {
            color: cur.b.color, scale: 1.1, t: time,
            pose: phase === "power" ? "throw" : "ready", face: 1,
          });
        }
        Art.shadow(ctx, ball.x, ball.y + 6, BR * 0.85, 0.22);
        Art.ball(ctx, ball.x, ball.y, BR, "bowl", ballCol);

        // scoreboard down the left
        players.forEach((p, i) => {
          const y = 40 + i * 32;
          text(ctx, `${p.b.name}  ${p.score}`, 22, y,
            { align: "left", font: (i === turn ? "900 " : "700 ") + "19px system-ui", color: p.b.color });
          if (i === turn) text(ctx, "▶", 8, y, { align: "left", font: "900 15px system-ui", color: p.b.color });
        });
        text(ctx, `Frame ${Math.min(frame + 1, FRAMES)} / ${FRAMES}`, W - 22, 40, { align: "right", font: "700 17px system-ui", color: "#cfe0ff" });
        // prompt lives in the dark gutter, clear of the lane
        const KEY = { Space: "Space", Enter: "Enter", KeyB: "B", KeyO: "O" }[cur.b.action] || "your key";
        const py = 40 + players.length * 32 + 16;
        if (phase === "aim" || phase === "power") {
          text(ctx, `${cur.b.name} — press ${KEY}`, 22, py,
            { align: "left", font: "700 15px system-ui", color: "#cfe0ff" });
          text(ctx, phase === "aim" ? "to lock AIM" : "to lock POWER", 22, py + 22,
            { align: "left", font: "900 17px system-ui", color: "#ffd24d" });
        }

        if (msg && msgT > 0) text(ctx, msg, W / 2, H / 2, { font: "900 44px system-ui", color: "#fff", glow: "#4dc4ff" });
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
