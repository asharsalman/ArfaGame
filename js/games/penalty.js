/* Penalty Shootout — 2 players (or vs CPU). Take turns striking and keeping.
   Striker locks a sweeping aim marker; keeper has to read it and dive. */
(function () {
  const { clamp, rand, text } = Eng;

  GameHub.register({
    id: "penalty",
    name: "Penalty Shootout",
    category: "2 Players",
    players: "2P",
    cpu: true,
    color: "#4dff9e",
    icon: "🥅",
    desc: "Swap between striker and keeper. Five spot-kicks each — most goals wins.",
    controls: "Striker: action to shoot · Keeper: ←/→ move, action to dive",
    create(env) {
      const { W, H, input } = env;
      const ROUNDS = 5;
      const GX0 = W / 2 - 260, GX1 = W / 2 + 260, GY = 118, GH = 190;
      const LINE = GY + GH;                      // goal-line y the ball crosses
      const BOT = env.bot
        ? ({ easy: { react: 0.34, err: 130 }, normal: { react: 0.2, err: 74 }, hard: { react: 0.1, err: 30 } })[env.bot.diff]
        : null;
      let strikerIdx, round, phase, t, aimX, aimDir, ball, keeper, msg, msgT, scores, matchOver, botPlan, time = 0;
      const results = Eng.Results();

      function newKick() {
        phase = "aim"; t = 0;
        aimX = W / 2; aimDir = Math.random() < 0.5 ? 1 : -1;
        ball = { x: W / 2, y: H - 118, vx: 0, vy: 0, flying: false, targetX: 0 };
        keeper = { x: W / 2, dive: 0, diveDir: 0, reacted: false };
        botPlan = null;
      }
      function reset() {
        scores = [0, 0]; strikerIdx = 0; round = 0;
        msg = ""; msgT = 0; matchOver = false; newKick();
      }
      reset();

      const keeperIdx = () => (strikerIdx === 0 ? 1 : 0);
      const isBotKeeper = () => BOT && keeperIdx() === 1;
      const isBotStriker = () => BOT && strikerIdx === 1;

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

      function shoot(tx) {
        ball.flying = true; ball.targetX = tx;
        ball.vx = (tx - ball.x) / 0.62;
        ball.vy = (LINE - 40 - ball.y) / 0.62;
        phase = "flight"; t = 0;
        if (isBotKeeper()) {
          // CPU keeper reacts after a delay, with aim error
          botPlan = { at: BOT.react, to: tx + rand(-BOT.err, BOT.err), done: false };
        }
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (msgT > 0) { msgT -= dt; if (msgT <= 0) nextKick(); return; }

        const sB = Eng.PLAYERS[strikerIdx], kB = Eng.PLAYERS[keeperIdx()];

        if (phase === "aim") {
          t += dt;
          aimX += aimDir * 430 * dt;
          if (aimX < GX0 + 26) { aimX = GX0 + 26; aimDir = 1; }
          if (aimX > GX1 - 26) { aimX = GX1 - 26; aimDir = -1; }
          // keeper may pre-position
          if (!isBotKeeper()) {
            if (input.down(kB.left)) keeper.x -= 300 * dt;
            if (input.down(kB.right)) keeper.x += 300 * dt;
            keeper.x = clamp(keeper.x, GX0 + 30, GX1 - 30);
          }
          const fire = isBotStriker() ? t > rand(0.6, 0.9) || t > 1.6 : input.pressed(sB.action);
          if (fire) shoot(aimX);
          return;
        }

        if (phase === "flight") {
          t += dt;
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;

          if (isBotKeeper()) {
            if (botPlan && !botPlan.done && t >= botPlan.at) {
              botPlan.done = true;
              keeper.diveDir = Math.sign(botPlan.to - keeper.x) || 1;
              keeper.dive = 1;
            }
          } else {
            if (input.down(kB.left)) keeper.x -= 330 * dt;
            if (input.down(kB.right)) keeper.x += 330 * dt;
            if (input.pressed(kB.action) && !keeper.reacted) {
              keeper.reacted = true;
              keeper.diveDir = Math.sign(ball.x - keeper.x) || 1;
              keeper.dive = 1;
            }
          }
          if (keeper.dive > 0) keeper.x += keeper.diveDir * 430 * dt;
          keeper.x = clamp(keeper.x, GX0 + 20, GX1 - 20);

          if (ball.y <= LINE - 34) {                 // reached the line
            const reach = keeper.dive > 0 ? 62 : 40;
            const saved = Math.abs(keeper.x - ball.x) < reach;
            if (saved) { msg = `${kB.name} SAVES!`; }
            else { scores[strikerIdx]++; msg = "GOAL!"; }
            phase = "result"; msgT = 1.35;
          }
          return;
        }
      }

      function keeperFig(ctx, c) {
        Art.shadow(ctx, keeper.x, LINE - 4, 20, 0.25);
        Art.stickman(ctx, keeper.x, LINE - 6, {
          color: c, scale: 1.15, t: time,
          pose: keeper.dive > 0 ? "dive" : "guard",
          face: keeper.dive > 0 ? keeper.diveDir : 1,
        });
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0b2a4a"); g.addColorStop(0.45, "#10502c"); g.addColorStop(1, "#0a2f1a");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // pitch stripes
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        for (let y = LINE; y < H; y += 54) ctx.fillRect(0, y, W, 27);
        // penalty arc + spot
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, LINE); ctx.lineTo(W, LINE); ctx.stroke();
        ctx.beginPath(); ctx.arc(W / 2, H - 118, 76, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(W / 2, H - 118, 4, 0, 7); ctx.fill();

        // goal frame + net
        ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1;
        for (let x = GX0; x <= GX1; x += 20) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x, LINE); ctx.stroke(); }
        for (let y = GY; y <= LINE; y += 20) { ctx.beginPath(); ctx.moveTo(GX0, y); ctx.lineTo(GX1, y); ctx.stroke(); }
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(GX0, LINE); ctx.lineTo(GX0, GY); ctx.lineTo(GX1, GY); ctx.lineTo(GX1, LINE); ctx.stroke();

        const sB = Eng.PLAYERS[strikerIdx], kB = Eng.PLAYERS[keeperIdx()];
        keeperFig(ctx, kB.color);

        // aim marker
        if (phase === "aim") {
          ctx.strokeStyle = sB.color; ctx.lineWidth = 4; ctx.shadowColor = sB.color; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(aimX, GY + GH * 0.45, 19, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(aimX - 27, GY + GH * 0.45); ctx.lineTo(aimX + 27, GY + GH * 0.45);
          ctx.moveTo(aimX, GY + GH * 0.45 - 27); ctx.lineTo(aimX, GY + GH * 0.45 + 27); ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // striker
        const sx = W / 2 - 46, sy = H - 92;
        Art.shadow(ctx, sx, sy + 2, 18);
        Art.stickman(ctx, sx, sy, {
          color: sB.color, scale: 1.15, t: time,
          pose: phase === "aim" ? "ready" : "run", face: 1,
        });

        // ball
        const bs = ball.flying ? clamp(1 - (H - 118 - ball.y) / 620, 0.55, 1) : 1;
        Art.ball(ctx, ball.x, ball.y, 13 * bs, "soccer", "#ffffff");

        // hud
        text(ctx, `${Eng.PLAYERS[0].name}  ${scores[0]}`, 30, 32, { align: "left", font: "800 22px system-ui", color: Eng.PLAYERS[0].color });
        text(ctx, `${scores[1]}  ${BOT ? "CPU" : Eng.PLAYERS[1].name}`, W - 30, 32, { align: "right", font: "800 22px system-ui", color: Eng.PLAYERS[1].color });
        text(ctx, `Kick ${Math.min(round + 1, ROUNDS)} / ${ROUNDS}`, W / 2, 32, { font: "700 17px system-ui", color: "#cfe0ff" });
        text(ctx, `${sB.name} shooting  ·  ${kB.name} in goal`, W / 2, H - 24, { font: "700 16px system-ui", color: "#9fb0e0" });

        if (msg && msgT > 0)
          text(ctx, msg, W / 2, H / 2 + 26, { font: "900 54px system-ui", color: "#fff", glow: msg === "GOAL!" ? "#4dff9e" : "#ffd24d" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
