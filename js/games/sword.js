/* Sword Duel — 2 players. Lunge to stab; jump to dodge. First to 5. */
(function () {
  const { clamp, rectsOverlap, text } = Eng;

  GameHub.register({
    id: "sword",
    name: "Sword Duel",
    category: "2 Players",
    players: "2P",
    color: "#e0e6ff",
    icon: "⚔️",
    desc: "Time your lunge to land a hit — jump over theirs. First to 5.",
    controls: "P1: A/D move, W jump, Space stab · P2: ←/→, ↑, Enter",
    create(env) {
      const { W, H, input } = env;
      const FLOOR = H - 70, GRAV = 1800, REACH = 52, TARGET = 5;
      let p1, p2, roundT, msg, matchOver;
      const results = Eng.Results();
      function endMatch() {
        const order = p1.score >= p2.score ? [p1, p2] : [p2, p1];
        results.open(order.map((p) => ({ b: p.b, score: p.score })));
        matchOver = true;
      }

      function place() {
        p1 = mk(Eng.PLAYERS[0], 260, 1);
        p2 = mk(Eng.PLAYERS[1], W - 260, -1);
      }
      function mk(b, x, face) {
        return { b, x, y: FLOOR, vy: 0, onGround: true, face, lungeT: 0, lungeDir: face, cd: 0, score: (this && 0) || 0 };
      }
      function reset() { place(); p1.score = 0; p2.score = 0; roundT = 0; msg = ""; matchOver = false; }
      reset();

      function ctrl(p, foe, dt) {
        p.cd -= dt;
        if (p.lungeT > 0) {
          p.x += p.lungeDir * 520 * dt; p.lungeT -= dt;
        } else {
          p.face = foe.x >= p.x ? 1 : -1;
          if (input.down(p.b.left)) p.x -= 240 * dt;
          if (input.down(p.b.right)) p.x += 240 * dt;
          if (input.down(p.b.up) && p.onGround) { p.vy = -640; p.onGround = false; }
          if (input.pressed(p.b.action) && p.cd <= 0) { p.lungeT = 0.22; p.lungeDir = p.face; p.cd = 0.5; }
        }
        p.vy += GRAV * dt; p.y += p.vy * dt;
        if (p.y >= FLOOR) { p.y = FLOOR; p.vy = 0; p.onGround = true; }
        p.x = clamp(p.x, 24, W - 24);
      }
      const body = (p) => ({ x: p.x - 14, y: p.y - 58, w: 28, h: 52 });
      function hitzone(p) {
        return p.lungeT > 0
          ? { x: p.lungeDir > 0 ? p.x + 6 : p.x - 6 - REACH, y: p.y - 48, w: REACH, h: 30 }
          : null;
      }

      function update(dt) {
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (roundT > 0) { roundT -= dt; if (roundT <= 0) place(); return; }
        ctrl(p1, p2, dt); ctrl(p2, p1, dt);

        const h1 = hitzone(p1), h2 = hitzone(p2);
        const s1 = h1 && rectsOverlap(h1, body(p2));
        const s2 = h2 && rectsOverlap(h2, body(p1));
        if (s1 || s2) {
          if (s1 && !s2) { p1.score++; msg = "P1 strikes!"; }
          else if (s2 && !s1) { p2.score++; msg = "P2 strikes!"; }
          else { msg = "Clash!"; }
          if (p1.score >= TARGET || p2.score >= TARGET) { endMatch(); return; }
          roundT = 0.9;
        }
      }

      function fig(ctx, p) {
        const c = p.b.color;
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 4;
        ctx.shadowColor = c; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y - 50, 10, 0, 7); ctx.fill();           // head
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 40); ctx.lineTo(p.x, p.y - 14); ctx.stroke(); // body
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 14); ctx.lineTo(p.x - 9, p.y); ctx.moveTo(p.x, p.y - 14); ctx.lineTo(p.x + 9, p.y); ctx.stroke(); // legs
        // sword arm
        const ex = p.x + p.face * (p.lungeT > 0 ? REACH + 8 : 22);
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 34); ctx.lineTo(ex, p.y - 34); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#161d33"); g.addColorStop(1, "#0a0f1f");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#0d1326"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
        ctx.strokeStyle = "#3a4d7a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();

        fig(ctx, p1); fig(ctx, p2);
        text(ctx, `P1  ${p1.score}`, 30, 34, { align: "left", font: "800 24px system-ui", color: p1.b.color });
        text(ctx, `${p2.score}  P2`, W - 30, 34, { align: "right", font: "800 24px system-ui", color: p2.b.color });
        if (msg && roundT > 0 && !matchOver) text(ctx, msg, W / 2, 60, { font: "800 28px system-ui", color: "#fff", glow: "#e0e6ff" });

        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
