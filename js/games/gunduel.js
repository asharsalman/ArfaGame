/* Gun Duel — 2-4 players (or vs CPU). Wait for DRAW! then fire first. */
(function () {
  const { rand, text } = Eng;

  GameHub.register({
    id: "gunduel",
    name: "Gun Duel",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4, cpu: true,
    color: "#c89b54",
    icon: "🔫",
    desc: "Hold your nerve. Fire the instant DRAW! shows — too soon and you're out.",
    controls: "Fire = your action key (P1 Space · P2 Enter · P3 B · P4 O)",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, TARGET = 5;
      const bg = Eng.skinColor("gunduel", "#c89b54");
      const botDelay = { easy: () => rand(0.5, 0.75), normal: () => rand(0.32, 0.46), hard: () => rand(0.17, 0.27) };
      let players, phase, timer, msg, roundWin, roundT, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function startRound() {
        players.forEach((p) => { p.out = false; p.fired = false; p.botT = 0; });
        phase = "wait"; timer = rand(1.5, 3.6); msg = ""; roundWin = null; roundT = 0;
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b, i) => ({
          b, score: 0, isBot: !!(env.bot && i === N - 1),
        }));
        matchOver = false; startRound();
      }
      reset();

      function eligible() { return players.filter((p) => !p.out); }
      function win(p) {
        roundWin = p; phase = "result"; roundT = 1.4;
        p.score++; msg = `${p.b.name} is fastest!`;
        if (p.score >= TARGET) endMatch();
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (phase === "result") { roundT -= dt; if (roundT <= 0 && !matchOver) startRound(); return; }

        if (phase === "wait") {
          // false starts (humans only; bots are patient)
          for (const p of players) {
            if (p.out || p.isBot) continue;
            if (input.pressed(p.b.action)) { p.out = true; msg = `${p.b.name} drew too soon!`; }
          }
          const el = eligible();
          if (el.length === 1 && players.length > 1) { win(el[0]); return; }
          if (el.length === 0) { startRound(); return; }
          timer -= dt;
          if (timer <= 0) { phase = "fire"; timer = 0; players.forEach((p) => { if (p.isBot) p.botT = botDelay[env.bot.diff](); }); }
          return;
        }

        // phase === 'fire'
        timer += dt;
        for (const p of players) {
          if (p.out) continue;
          const trigger = p.isBot ? timer >= p.botT : input.pressed(p.b.action);
          if (trigger) { win(p); return; }
        }
      }

      function slinger(ctx, p, x, drawn, won) {
        const c = p.b.color;
        ctx.save();
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.shadowColor = c; ctx.shadowBlur = won ? 24 : 8;
        const y = H * 0.62;
        ctx.beginPath(); ctx.arc(x, y - 70, 13, 0, 7); ctx.fill();          // head
        ctx.fillStyle = "#2a2030"; ctx.fillRect(x - 16, y - 86, 32, 8);     // hat brim
        ctx.fillRect(x - 10, y - 100, 20, 16);                              // hat
        ctx.strokeStyle = c;
        ctx.beginPath(); ctx.moveTo(x, y - 57); ctx.lineTo(x, y - 18); ctx.stroke();   // body
        ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 11, y + 6); ctx.moveTo(x, y - 18); ctx.lineTo(x + 11, y + 6); ctx.stroke();  // legs
        // gun arm: raised when drawn
        ctx.beginPath(); ctx.moveTo(x, y - 46);
        if (drawn) { ctx.lineTo(x + 26, y - 46); ctx.stroke(); ctx.fillStyle = "#ddd"; ctx.fillRect(x + 26, y - 50, 12, 7); }
        else { ctx.lineTo(x + 14, y - 30); ctx.stroke(); }
        ctx.restore();
        text(ctx, p.out ? `${p.b.name} ✗` : `${p.b.name}`, x, H * 0.62 + 34,
          { font: "800 16px system-ui", color: p.out ? "#7e8ab5" : c });
        text(ctx, p.score, x, H * 0.62 + 56, { font: "900 22px system-ui", color: c });
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, bg); g.addColorStop(1, "#0a0d16");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, H * 0.66, W, H);

        const drawn = phase === "fire" || phase === "result";
        players.forEach((p, i) => slinger(ctx, p, (W / (N + 1)) * (i + 1), drawn, roundWin === p));

        if (phase === "wait") text(ctx, "WAIT…", W / 2, 110, { font: "900 60px system-ui", color: "#fff", glow: "#000" });
        if (phase === "fire") text(ctx, "DRAW!", W / 2, 110, { font: "900 80px system-ui", color: "#ff4d4d", glow: "#ff4d4d" });
        if (msg) text(ctx, msg, W / 2, 168, { font: "800 26px system-ui", color: "#fff", glow: "#000" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
