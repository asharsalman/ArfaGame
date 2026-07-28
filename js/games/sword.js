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
      const FLOOR = H - 70, GRAV = 1800, REACH = 56, TARGET = 5, LUNGE = 0.22;
      const bladeItem = Eng.equippedItem("sword") || {};
      const bladeCol = bladeItem.color || "#e0e6ff";
      const bladeFx = bladeItem.extra || "";
      let p1, p2, roundT, msg, matchOver, time = 0;
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
          if (input.pressed(p.b.action) && p.cd <= 0) { p.lungeT = LUNGE; p.lungeDir = p.face; p.cd = 0.5; }
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
        time += dt;
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
        Art.shadow(ctx, p.x, FLOOR + 2, 17, 0.25);
        const pose = p.lungeT > 0 ? "swing" : (!p.onGround ? "jump" : "ready");
        Art.stickman(ctx, p.x, p.y, { color: p.b.color, scale: 1.05, t: time, pose, face: p.face });

        // Overhead chop: the blade rises, then comes down through the arc.
        const h = Art.handPos(p.x, p.y, { scale: 1.05, t: time, face: p.face, pose });
        const k = p.lungeT > 0 ? 1 - p.lungeT / LUNGE : -1;   // -1 = resting
        const ang = k < 0
          ? p.face * -0.5                                      // held ready, tip up
          : p.face * (-2.0 + 2.6 * Math.min(1, k * 1.25));     // raise → chop down
        Art.blade(ctx, h.x, h.y, ang, REACH, bladeCol, bladeFx, time);
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#241a33"); g.addColorStop(0.55, "#161d33"); g.addColorStop(1, "#0a0f1f");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        // torch-lit arena wall
        ctx.fillStyle = "#1b2140";
        for (let x = 0; x < W; x += 76) ctx.fillRect(x + 4, 140, 68, FLOOR - 140);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        for (let x = 0; x < W; x += 76) ctx.fillRect(x, 140, 4, FLOOR - 140);
        for (let i = 0; i < 5; i++) {                     // torches
          const tx = 110 + i * 185, ty = 210;
          const fl = 12 + Math.sin(time * 9 + i * 2) * 5;
          ctx.fillStyle = "#5a4326"; ctx.fillRect(tx - 4, ty, 8, 34);
          ctx.fillStyle = "rgba(255,150,50,0.9)"; ctx.shadowColor = "#ff9632"; ctx.shadowBlur = 34;
          ctx.beginPath(); ctx.ellipse(tx, ty - 8, 8, fl, 0, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
        }
        // arches
        ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 5;
        for (let x = 76; x < W; x += 152) {
          ctx.beginPath(); ctx.arc(x, 200, 46, Math.PI, 0); ctx.stroke();
        }

        ctx.fillStyle = "#2a2038"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        for (let x = 0; x < W; x += 48) ctx.fillRect(x, FLOOR + 6, 24, H - FLOOR);
        ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 4;
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
