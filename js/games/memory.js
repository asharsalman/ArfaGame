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
        { c: "#ffd24d", s: "duck" },   { c: "#4df0ff", s: "fish" },
        { c: "#ff8a3a", s: "cat" },    { c: "#b46bff", s: "star" },
        { c: "#ff5b8a", s: "flower" }, { c: "#7dff4d", s: "frog" },
        { c: "#f4f7ff", s: "chick" },  { c: "#5b8aff", s: "whale" },
        { c: "#ff5b5b", s: "apple" },  { c: "#4dff9e", s: "leaf" },
        { c: "#ffa8c8", s: "heart" },  { c: "#c9954f", s: "bone" },
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

      // little cartoon pictures — ducks, animals, flowers, stars…
      function symbol(ctx, f, cx, cy, r) {
        const c = f.c, O = Art.OUT;
        ctx.save();
        ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
        const blob = (x, y, rx, ry, fill) => {
          ctx.fillStyle = fill; ctx.beginPath();
          ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
        };
        const eye = (x, y, s) => { ctx.fillStyle = O; ctx.beginPath(); ctx.arc(x, y, s || 2.4, 0, 7); ctx.fill(); };
        const poly = (pts, fill) => {
          ctx.fillStyle = fill; ctx.beginPath();
          pts.forEach((p, i) => ctx[i ? "lineTo" : "moveTo"](cx + p[0], cy + p[1]));
          ctx.closePath(); ctx.fill(); ctx.stroke();
        };

        switch (f.s) {
          case "duck":
            blob(cx - 2, cy + 6, r * 0.8, r * 0.62, c);
            blob(cx + r * 0.42, cy - r * 0.4, r * 0.36, r * 0.36, c);
            poly([[r * 0.72, -r * 0.42], [r * 1.15, -r * 0.28], [r * 0.72, -r * 0.16]], "#f0a52e");
            eye(cx + r * 0.5, cy - r * 0.48); break;
          case "chick":
            blob(cx, cy + 4, r * 0.72, r * 0.66, c);
            blob(cx, cy - r * 0.5, r * 0.46, r * 0.42, c);
            poly([[r * 0.42, -r * 0.5], [r * 0.78, -r * 0.4], [r * 0.42, -r * 0.3]], "#f0a52e");
            eye(cx + r * 0.16, cy - r * 0.58); eye(cx - r * 0.16, cy - r * 0.58); break;
          case "fish":
            blob(cx - 2, cy, r * 0.78, r * 0.5, c);
            poly([[-r * 0.72, 0], [-r * 1.2, -r * 0.42], [-r * 1.2, r * 0.42]], c);
            eye(cx + r * 0.34, cy - r * 0.1); break;
          case "whale":
            blob(cx - 2, cy + 4, r * 0.82, r * 0.52, c);
            poly([[-r * 0.78, 4], [-r * 1.2, -r * 0.3], [-r * 1.15, r * 0.4]], c);
            ctx.strokeStyle = c; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx + r * 0.3, cy - r * 0.5);
            ctx.quadraticCurveTo(cx + r * 0.5, cy - r, cx + r * 0.7, cy - r * 0.62); ctx.stroke();
            ctx.strokeStyle = O; ctx.lineWidth = 2.5;
            eye(cx + r * 0.42, cy); break;
          case "cat":
            poly([[-r * 0.6, -r * 0.3], [-r * 0.52, -r], [-r * 0.1, -r * 0.52]], c);
            poly([[r * 0.6, -r * 0.3], [r * 0.52, -r], [r * 0.1, -r * 0.52]], c);
            blob(cx, cy, r * 0.76, r * 0.68, c);
            eye(cx - r * 0.28, cy - r * 0.1); eye(cx + r * 0.28, cy - r * 0.1);
            ctx.strokeStyle = O; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - r * 0.75, cy + r * 0.16); ctx.lineTo(cx - r * 0.3, cy + r * 0.24);
            ctx.moveTo(cx + r * 0.75, cy + r * 0.16); ctx.lineTo(cx + r * 0.3, cy + r * 0.24); ctx.stroke(); break;
          case "frog":
            blob(cx, cy + 6, r * 0.82, r * 0.58, c);
            blob(cx - r * 0.34, cy - r * 0.36, r * 0.3, r * 0.3, c);
            blob(cx + r * 0.34, cy - r * 0.36, r * 0.3, r * 0.3, c);
            eye(cx - r * 0.34, cy - r * 0.36); eye(cx + r * 0.34, cy - r * 0.36);
            ctx.strokeStyle = O; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(cx, cy + r * 0.12, r * 0.34, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); break;
          case "flower":
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              blob(cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52, r * 0.32, r * 0.32, c);
            }
            blob(cx, cy, r * 0.3, r * 0.3, "#ffd24d"); break;
          case "leaf":
            ctx.fillStyle = c; ctx.beginPath();
            ctx.moveTo(cx - r * 0.7, cy + r * 0.6);
            ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.8, cx + r * 0.7, cy - r * 0.6);
            ctx.quadraticCurveTo(cx + r * 0.4, cy + r * 0.75, cx - r * 0.7, cy + r * 0.6);
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy + r * 0.5); ctx.lineTo(cx + r * 0.5, cy - r * 0.45); ctx.stroke(); break;
          case "apple":
            blob(cx, cy + r * 0.1, r * 0.72, r * 0.72, c);
            ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.6); ctx.lineTo(cx + r * 0.1, cy - r); ctx.stroke();
            ctx.strokeStyle = O; ctx.lineWidth = 2.5;
            poly([[r * 0.12, -r * 0.95], [r * 0.7, -r * 1.05], [r * 0.3, -r * 0.6]], "#4dff9e"); break;
          case "bone":
            blob(cx - r * 0.6, cy - r * 0.34, r * 0.3, r * 0.3, c);
            blob(cx - r * 0.6, cy + r * 0.24, r * 0.3, r * 0.3, c);
            blob(cx + r * 0.6, cy - r * 0.34, r * 0.3, r * 0.3, c);
            blob(cx + r * 0.6, cy + r * 0.24, r * 0.3, r * 0.3, c);
            ctx.fillStyle = c; ctx.beginPath();
            ctx.rect(cx - r * 0.62, cy - r * 0.22, r * 1.24, r * 0.42); ctx.fill(); break;
          case "star": {
            const pts = [];
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.44 : r * 0.96;
              pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
            }
            poly(pts, c); break;
          }
          case "heart":
            ctx.fillStyle = c; ctx.beginPath();
            ctx.moveTo(cx, cy + r * 0.78);
            ctx.bezierCurveTo(cx - r * 1.4, cy - r * 0.36, cx - r * 0.36, cy - r * 1.1, cx, cy - r * 0.3);
            ctx.bezierCurveTo(cx + r * 0.36, cy - r * 1.1, cx + r * 1.4, cy - r * 0.36, cx, cy + r * 0.78);
            ctx.fill(); ctx.stroke(); break;
        }
        ctx.restore();
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
