/* Memory Match — 2-4 players, turn based. Flip two cards; a pair scores and you
   go again. Click or tap to flip. */
(function () {
  const { text, roundRect } = Eng;

  GameHub.register({
    id: "memory",
    name: "Memory Match",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ff6ad5",
    icon: "🃏",
    desc: "Flip two cards. Find a pair and go again. Most pairs when the board clears wins.",
    controls: "Click / tap a card on your turn",
    create(env) {
      const { W, H, input } = env;
      const N = env.players;
      const COLS = 6, ROWS = 4;                       // 24 cards = 12 pairs
      const CW = 118, CH = 106, GAP = 10;
      const GW = COLS * CW + (COLS - 1) * GAP, GH = ROWS * CH + (ROWS - 1) * GAP;
      const OX = (W - GW) / 2, OY = (H - GH) / 2 + 22;
      const backCol = Eng.skinColor("memory", "#46406e");
      const FACES = [
        { c: "#ff5b5b", s: "circle" }, { c: "#4df0ff", s: "square" },
        { c: "#7dff4d", s: "triangle" }, { c: "#ffd24d", s: "diamond" },
        { c: "#b46bff", s: "star" }, { c: "#ff8a3a", s: "heart" },
        { c: "#4dff9e", s: "circle" }, { c: "#ff6ad5", s: "square" },
        { c: "#5b8aff", s: "triangle" }, { c: "#f4f7ff", s: "diamond" },
        { c: "#ffa8c8", s: "star" }, { c: "#9ad14d", s: "heart" },
      ];
      let cards, players, turn, flipped, lockT, matchOver;
      const results = Eng.Results();

      function reset() {
        const deck = [];
        FACES.forEach((f, i) => { deck.push({ face: i }, { face: i }); });
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        cards = deck.map((d, i) => ({
          face: d.face, up: false, done: false, pop: 0,
          x: OX + (i % COLS) * (CW + GAP), y: OY + Math.floor(i / COLS) * (CH + GAP),
        }));
        players = Eng.PLAYERS.slice(0, N).map((b) => ({ b, score: 0 }));
        turn = 0; flipped = []; lockT = 0; matchOver = false;
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        for (const c of cards) if (c.pop > 0) c.pop -= dt;

        if (lockT > 0) {
          lockT -= dt;
          if (lockT <= 0) {
            const [a, b] = flipped;
            if (a.face === b.face) {
              a.done = b.done = true; a.pop = b.pop = 0.5;
              players[turn].score++;
              if (cards.every((c) => c.done)) { endMatch(); return; }
            } else {
              a.up = b.up = false;
              turn = (turn + 1) % N;
            }
            flipped = [];
          }
          return;
        }

        if (input.pointer.pressed) {
          const { x, y } = input.pointer;
          for (const c of cards) {
            if (c.done || c.up) continue;
            if (x > c.x && x < c.x + CW && y > c.y && y < c.y + CH) {
              c.up = true; c.pop = 0.3; flipped.push(c);
              if (flipped.length === 2) lockT = 0.75;
              break;
            }
          }
        }
      }

      function symbol(ctx, f, cx, cy, r) {
        ctx.fillStyle = f.c; ctx.shadowColor = f.c; ctx.shadowBlur = 12;
        ctx.beginPath();
        switch (f.s) {
          case "circle": ctx.arc(cx, cy, r, 0, 7); break;
          case "square": ctx.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7); break;
          case "triangle":
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * 0.8); ctx.lineTo(cx - r, cy + r * 0.8); break;
          case "diamond":
            ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); break;
          case "star":
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r;
              ctx[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
            }
            break;
          case "heart":
            ctx.moveTo(cx, cy + r * 0.8);
            ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.4, cx - r * 0.4, cy - r * 1.2, cx, cy - r * 0.35);
            ctx.bezierCurveTo(cx + r * 0.4, cy - r * 1.2, cx + r * 1.5, cy - r * 0.4, cx, cy + r * 0.8);
            break;
        }
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#1a1230"); g.addColorStop(1, "#0c0a1c");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        const cur = players[turn];
        text(ctx, `${cur.b.name}'s turn`, W / 2, 30,
          { font: "900 26px system-ui", color: cur.b.color, glow: cur.b.color });

        for (const c of cards) {
          const pop = Math.max(0, c.pop) * 0.18;
          const sc = 1 + pop;
          ctx.save();
          ctx.translate(c.x + CW / 2, c.y + CH / 2); ctx.scale(sc, sc);
          if (c.done) ctx.globalAlpha = 0.32;
          if (c.up || c.done) {
            ctx.fillStyle = "#f2f5ff";
            roundRect(ctx, -CW / 2, -CH / 2, CW, CH, 12); ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2; ctx.stroke();
            symbol(ctx, FACES[c.face], 0, 0, 30);
          } else {
            ctx.fillStyle = backCol;
            roundRect(ctx, -CW / 2, -CH / 2, CW, CH, 12); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 3;
            for (let k = -2; k <= 2; k++) {
              ctx.beginPath(); ctx.moveTo(-CW / 2 + 14, k * 16); ctx.lineTo(CW / 2 - 14, k * 16); ctx.stroke();
            }
          }
          ctx.globalAlpha = 1; ctx.restore();
        }

        // scoreboard
        const sw = Math.min(200, (W - 60) / players.length);
        players.forEach((p, i) => {
          text(ctx, `${p.b.name}  ${p.score}`, 30 + i * sw, H - 22,
            { align: "left", font: (i === turn ? "900 " : "700 ") + "19px system-ui", color: p.b.color });
        });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
