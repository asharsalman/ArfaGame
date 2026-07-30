/* Basketball — 1-4 players on ONE shared court.
   Three moving hoops at different heights: the higher/farther it is the more
   it scores (3 / 2 / 1). Balls lie on the floor — grab one, and you can barge
   a rival to make them drop theirs. Most points in 60s wins. */
(function () {
  const { clamp, rand, dist, text, roundRect } = Eng;

  GameHub.register({
    id: "basketball",
    name: "Basketball",
    category: "Party",
    players: "1-4P",
    min: 1, max: 4,
    color: "#ff8a3a",
    icon: "🏀",
    desc: "Grab a loose ball, pick your hoop — 3, 2 or 1 point — and shoot. Barge rivals to steal. 60s.",
    controls: "Move to a ball to pick it up · hold action to charge, release to shoot",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, GAME_TIME = 60, PR = 17;
      const ballCol = Eng.skinColor("basketball", "#ff8a3a");
      const FLOOR = H - 44;
      // three shared hoops: value 3 is highest & swings widest
      const HOOPS = [
        { value: 3, y: 72,  x: W * 0.5,  min: 150, max: W - 150, dir: 1,  spd: 132, rim: 26 },
        { value: 2, y: 194, x: W * 0.25, min: 110, max: W * 0.44, dir: -1, spd: 96, rim: 30 },
        { value: 1, y: 194, x: W * 0.75, min: W * 0.56, max: W - 110, dir: 1, spd: 84, rim: 34 },
      ];
      let players, loose, shots, timeLeft, phase, count, matchOver, time = 0, pops = [];
      const results = Eng.Results();

      function spawnLoose(n) {
        for (let i = 0; i < n; i++)
          loose.push({ x: rand(90, W - 90), y: rand(H * 0.55, FLOOR - 30) });
      }
      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b, i) => ({
          b, x: (W / (N + 1)) * (i + 1), y: FLOOR - 60,
          has: false, charge: 0, charging: false, aim: 0, score: 0,
          bump: 0, face: 1,
        }));
        loose = []; shots = []; pops = [];
        spawnLoose(4);
        HOOPS.forEach((h, i) => { h.x = [W * 0.5, W * 0.25, W * 0.75][i]; });
        timeLeft = GAME_TIME; phase = "count"; count = 3.2; matchOver = false;
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.score - a.score).map((p) => ({ b: p.b, score: p.score }));
        results.open(rank); matchOver = true;
      }

      function shoot(p) {
        const sp = 560 + p.charge * 560;
        shots.push({
          x: p.x, y: p.y - 34, vx: Math.sin(p.aim) * sp, vy: -Math.cos(p.aim) * sp,
          owner: p, scored: false,
        });
        p.has = false; p.charge = 0; p.charging = false;
      }

      function update(dt) {
        time += dt;
        for (const q of pops) q.life -= dt;
        pops = pops.filter((q) => q.life > 0);
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (phase === "count") { count -= dt; if (count <= 0) phase = "play"; return; }

        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; endMatch(); return; }

        for (const h of HOOPS) {
          h.x += h.dir * h.spd * dt;
          if (h.x < h.min) { h.x = h.min; h.dir = 1; }
          if (h.x > h.max) { h.x = h.max; h.dir = -1; }
        }

        for (const p of players) {
          if (p.bump > 0) p.bump -= dt;
          let vx = 0, vy = 0;
          if (input.down(p.b.left)) vx -= 1;
          if (input.down(p.b.right)) vx += 1;
          if (input.down(p.b.up)) vy -= 1;
          if (input.down(p.b.down)) vy += 1;
          if (vx) p.face = vx > 0 ? 1 : -1;
          const m = Math.hypot(vx, vy) || 1;
          const sp = (p.charging ? 110 : 235) * dt;
          p.x = clamp(p.x + (vx / m) * sp, 40, W - 40);
          p.y = clamp(p.y + (vy / m) * sp, H * 0.42, FLOOR - 20);

          if (!p.has) {                               // pick a loose ball up
            const i = loose.findIndex((l) => dist(l.x, l.y, p.x, p.y) < PR + 16);
            if (i >= 0) { loose.splice(i, 1); p.has = true; }
          } else {
            if (input.down(p.b.action)) {
              p.charging = true;
              p.charge = clamp(p.charge + dt * 0.85, 0, 1);
              if (input.down(p.b.left)) p.aim = clamp(p.aim - 1.4 * dt, -0.85, 0.85);
              if (input.down(p.b.right)) p.aim = clamp(p.aim + 1.4 * dt, -0.85, 0.85);
            } else if (p.charging) shoot(p);
          }
        }

        // barging: run into a carrier and they drop it
        for (let i = 0; i < players.length; i++)
          for (let j = 0; j < players.length; j++) {
            if (i === j) continue;
            const a = players[i], b = players[j];
            if (!b.has || a.has) continue;
            if (dist(a.x, a.y, b.x, b.y) < PR * 2 && b.bump <= 0) {
              b.has = false; b.charging = false; b.charge = 0;
              b.bump = 0.8; a.bump = 0.8;
              loose.push({ x: b.x + rand(-40, 40), y: clamp(b.y + rand(20, 50), H * 0.5, FLOOR - 20) });
            }
          }

        for (const s of shots) {
          const py = s.y;
          s.vy += 1080 * dt;
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (!s.scored && s.vy > 0) {
            for (const h of HOOPS) {
              if (py <= h.y && s.y > h.y && Math.abs(s.x - h.x) < h.rim) {
                s.scored = true; s.owner.score += h.value;
                if (h.value === 3) Eng.track("hoop3");
                pops.push({ x: h.x, y: h.y, v: h.value, life: 0.9, c: s.owner.b.color });
                break;
              }
            }
          }
          if (s.y > FLOOR - 12) {                     // lands and becomes loose again
            s.dead = true;
            loose.push({ x: clamp(s.x, 60, W - 60), y: clamp(FLOOR - 24, H * 0.5, FLOOR - 20) });
          }
          if (s.x < -40 || s.x > W + 40) s.dead = true;
        }
        shots = shots.filter((s) => !s.dead);
        if (loose.length + shots.length + players.filter((p) => p.has).length < 3) spawnLoose(1);
      }

      function hoop(ctx, h) {
        // backboard
        ctx.fillStyle = "#e8eeff"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2.5;
        ctx.beginPath(); roundRect(ctx, h.x - h.rim - 16, h.y - 52, (h.rim + 16) * 2, 9, 3);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#cfd8ee"; ctx.lineWidth = 3;
        ctx.strokeRect(h.x - 20, h.y - 44, 40, 30);
        // rim
        ctx.strokeStyle = "#ff5b3a"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(h.x - h.rim, h.y); ctx.lineTo(h.x + h.rim, h.y); ctx.stroke();
        // net
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1.6;
        for (let k = -3; k <= 3; k++) {
          ctx.beginPath();
          ctx.moveTo(h.x + (k * h.rim) / 3.4, h.y);
          ctx.lineTo(h.x + (k * h.rim) / 7, h.y + 26); ctx.stroke();
        }
        // point value badge
        ctx.fillStyle = "rgba(6,10,20,0.8)";
        ctx.beginPath(); ctx.arc(h.x, h.y - 66, 15, 0, 7); ctx.fill();
        ctx.strokeStyle = "#ffd24d"; ctx.lineWidth = 2.5; ctx.stroke();
        text(ctx, `${h.value}`, h.x, h.y - 66, { font: "900 18px system-ui", color: "#ffd24d" });
      }

      function render(ctx) {
        // court
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#5a3a18"); g.addColorStop(1, "#3a2410");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 3;
        ctx.strokeRect(24, H * 0.4, W - 48, FLOOR - H * 0.4);
        ctx.beginPath(); ctx.arc(W / 2, FLOOR, 96, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        for (let x = 0; x < W; x += 54) ctx.fillRect(x, 0, 27, H);

        HOOPS.forEach((h) => hoop(ctx, h));

        for (const l of loose) {
          Art.shadow(ctx, l.x, l.y + 13, 12, 0.28);
          Art.ball(ctx, l.x, l.y, 13, "basket", ballCol);
        }

        for (const p of players) {
          Art.shadow(ctx, p.x, p.y + 3, 16);
          Art.stickman(ctx, p.x, p.y, {
            color: p.b.color, scale: 0.95, t: time,
            pose: p.charging ? "shoot" : (p.has ? "carry" : "idle"), face: p.face,
          });
          if (p.has) Art.ball(ctx, p.x + (p.charging ? p.aim * 14 : p.face * 12),
            p.charging ? p.y - 62 : p.y - 40, 12, "basket", ballCol);
          if (p.charging) {
            const ax = Math.sin(p.aim), ay = -Math.cos(p.aim);
            ctx.strokeStyle = `${p.b.color}aa`; ctx.lineWidth = 3; ctx.setLineDash([7, 7]);
            ctx.beginPath(); ctx.moveTo(p.x, p.y - 50);
            ctx.lineTo(p.x + ax * 80, p.y - 50 + ay * 80); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(p.x - 22, p.y + 10, 44, 7);
            ctx.fillStyle = "#ffd24d"; ctx.fillRect(p.x - 22, p.y + 10, 44 * p.charge, 7);
          }
          if (p.bump > 0) {
            ctx.strokeStyle = "#fff"; ctx.globalAlpha = p.bump;
            ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 26, 24, 0, 7); ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        for (const s of shots) Art.ball(ctx, s.x, s.y, 13, "basket", ballCol);

        for (const q of pops)
          text(ctx, `+${q.v}`, q.x, q.y - 30 - (0.9 - q.life) * 40,
            { font: "900 30px system-ui", color: q.c, glow: "#fff" });

        // hud — timer up top, scores along the bottom so nothing collides
        ctx.fillStyle = "rgba(6,10,20,0.8)";
        roundRect(ctx, W / 2 - 62, 6, 124, 30, 15); ctx.fill();
        text(ctx, `⏱ ${Math.ceil(timeLeft)}s`, W / 2, 22, { font: "900 20px system-ui", color: "#fff" });
        ctx.fillStyle = "rgba(6,10,20,0.72)";
        roundRect(ctx, 0, H - 30, W, 30, 0); ctx.fill();
        const sw = (W - 60) / players.length;
        players.forEach((p, i) => text(ctx, `${p.b.name}  ${p.score}`, 34 + i * sw, H - 15,
          { align: "left", font: "800 19px system-ui", color: p.b.color }));

        if (phase === "count") {
          ctx.fillStyle = "rgba(4,6,15,0.55)"; ctx.fillRect(0, 0, W, H);
          const n = Math.ceil(count - 0.2);
          text(ctx, n > 0 ? n : "TIP OFF!", W / 2, H / 2, { font: "900 84px system-ui", color: "#ff8a3a", glow: "#ff8a3a" });
        }
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
