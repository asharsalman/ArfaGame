/* Chicken Round-Up — 2-4 players. Catch loose chickens and herd them into your
   pen. Most chickens penned when the timer runs out wins. */
(function () {
  const { clamp, rand, dist, text, rectsOverlap } = Eng;

  GameHub.register({
    id: "chicken",
    name: "Chicken Round-Up",
    category: "Party",
    players: "2-4P",
    min: 2, max: 4,
    color: "#ffcf33",
    icon: "🐔",
    desc: "Catch the loose chickens and drop them in your pen. Most chickens in 40s wins!",
    controls: "Move with your keys · touch a chicken to grab · walk it home",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, M = 20, PR = 20, CR = 12, GAME_TIME = 40;
      const comb = Eng.skinColor("chicken", "#ff4d4d");
      const AX0 = M + 10, AX1 = W - M - 10, AY0 = M + 10, AY1 = H - M - 10;
      const PENW = 150, PENH = 120;
      const penPos = [
        { x: M + 8, y: M + 8 }, { x: W - M - PENW - 8, y: H - M - PENH - 8 },
        { x: W - M - PENW - 8, y: M + 8 }, { x: M + 8, y: H - M - PENH - 8 },
      ];
      let players, chickens, timeLeft, phase, count, matchOver, time = 0;
      const results = Eng.Results();

      function reset() {
        players = Eng.PLAYERS.slice(0, N).map((b, i) => {
          const pen = { x: penPos[i].x, y: penPos[i].y, w: PENW, h: PENH };
          return { b, pen, x: pen.x + PENW / 2, y: pen.y + PENH / 2, carried: [], count: 0 };
        });
        // start penned up in a neat ring in the middle of the yard
        chickens = [];
        const FLOCK = 14;
        for (let i = 0; i < FLOCK; i++) {
          const a = (i / FLOCK) * Math.PI * 2;
          const ring = i % 2 ? 96 : 58;
          chickens.push({
            x: W / 2 + Math.cos(a) * ring, y: H / 2 + Math.sin(a) * ring * 0.75,
            hx: W / 2 + Math.cos(a) * ring, hy: H / 2 + Math.sin(a) * ring * 0.75,
            orbit: a, spin: Math.random() < 0.5 ? 1 : -1, radius: rand(16, 34),
            panic: 0, face: 1, state: "loose",
          });
        }
        timeLeft = GAME_TIME; phase = "count"; count = 3.2; matchOver = false;
      }
      reset();

      function endMatch() {
        const rank = [...players].sort((a, b) => b.count - a.count).map((p) => ({ b: p.b, score: p.count }));
        results.open(rank); matchOver = true;
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (phase === "count") { count -= dt; if (count <= 0) phase = "play"; return; }

        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; endMatch(); return; }

        // players move
        for (const p of players) {
          let vx = 0, vy = 0;
          if (input.down(p.b.left)) vx -= 1; if (input.down(p.b.right)) vx += 1;
          if (input.down(p.b.up)) vy -= 1; if (input.down(p.b.down)) vy += 1;
          const m = Math.hypot(vx, vy) || 1;
          p.moving = !!(vx || vy);
          if (vx) p.face = vx > 0 ? 1 : -1;
          p.x = clamp(p.x + (vx / m) * 270 * dt, AX0, AX1);
          p.y = clamp(p.y + (vy / m) * 270 * dt, AY0, AY1);
          // trailing carried chickens
          let lx = p.x, ly = p.y;
          for (const ch of p.carried) {
            const dx = lx - ch.x, dy = ly - ch.y, d = Math.hypot(dx, dy) || 1, gap = 24;
            if (d > gap) { const k = Math.min(1, 16 * dt) * (d - gap) / d; ch.x += dx * k; ch.y += dy * k; }
            lx = ch.x; ly = ch.y;
          }
          // deposit when in own pen
          if (p.carried.length && p.x > p.pen.x && p.x < p.pen.x + p.pen.w && p.y > p.pen.y && p.y < p.pen.y + p.pen.h) {
            for (const ch of p.carried) { ch.state = "penned"; ch.x = rand(p.pen.x + 16, p.pen.x + p.pen.w - 16); ch.y = rand(p.pen.y + 16, p.pen.y + p.pen.h - 16); p.count++; }
            p.carried = [];
          }
        }

        // loose chickens: pecking in lazy circles until someone gets close
        for (const ch of chickens) {
          if (ch.state !== "loose") continue;

          let near = null, nd = 108;
          for (const p of players) { const d = dist(p.x, p.y, ch.x, ch.y); if (d < nd) { nd = d; near = p; } }

          let vx, vy;
          if (near) {
            ch.panic = 1.1;                                   // spooked
            const a = Math.atan2(ch.y - near.y, ch.x - near.x);
            vx = Math.cos(a) * 150; vy = Math.sin(a) * 150;
            ch.hx = ch.x; ch.hy = ch.y;                        // new home where it stops
          } else if (ch.panic > 0) {
            ch.panic -= dt;                                    // still jogging it off
            vx = Math.cos(ch.orbit) * 90; vy = Math.sin(ch.orbit) * 90;
            ch.orbit += ch.spin * 2.4 * dt;
          } else {
            // settle into a slow circle around its home patch
            ch.orbit += ch.spin * 1.15 * dt;
            const tx = ch.hx + Math.cos(ch.orbit) * ch.radius;
            const ty = ch.hy + Math.sin(ch.orbit) * ch.radius * 0.7;
            vx = (tx - ch.x) * 3.2; vy = (ty - ch.y) * 3.2;
          }

          if (Math.abs(vx) > 8) ch.face = vx > 0 ? 1 : -1;
          ch.x = clamp(ch.x + vx * dt, AX0, AX1); ch.y = clamp(ch.y + vy * dt, AY0, AY1);
          for (const p of players) {
            if (dist(p.x, p.y, ch.x, ch.y) < PR + CR) { ch.state = "carried"; p.carried.push(ch); break; }
          }
        }
      }

      function drawChicken(ctx, ch, s) {
        Art.shadow(ctx, ch.x, ch.y + 15 * s, 11 * s, 0.22);
        Art.chicken(ctx, ch.x, ch.y + 15 * s, s, comb, time + ch.x * 0.02, ch.face || 1);
      }

      function render(ctx) {
        ctx.fillStyle = "#244a22"; ctx.fillRect(0, 0, W, H);
        // grass stripes
        ctx.fillStyle = "#1f4220";
        for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, W, 20);
        // fence border
        ctx.strokeStyle = "#caa15a"; ctx.lineWidth = 6; ctx.strokeRect(M, M, W - 2 * M, H - 2 * M);

        // pens — dirt floor with a post-and-rail fence
        for (const p of players) {
          const { x, y, w, h } = p.pen;
          ctx.fillStyle = "#6b4a2a"; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "rgba(0,0,0,0.16)";
          for (let sy = y; sy < y + h; sy += 12) ctx.fillRect(x, sy, w, 5);
          ctx.fillStyle = p.b.color + "33"; ctx.fillRect(x, y, w, h);
          // rails
          ctx.strokeStyle = "#c99a52"; ctx.lineWidth = 5; ctx.lineCap = "round";
          [0.3, 0.68].forEach((f) => {
            ctx.beginPath();
            ctx.moveTo(x, y + h * f); ctx.lineTo(x + w, y + h * f);
            ctx.moveTo(x + w * f, y); ctx.lineTo(x + w * f, y + h);
            ctx.stroke();
          });
          ctx.strokeStyle = p.b.color; ctx.lineWidth = 5;
          ctx.strokeRect(x, y, w, h);
          // corner posts
          ctx.fillStyle = "#8a6234"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2.5;
          [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([px, py]) => {
            ctx.beginPath(); ctx.rect(px - 5, py - 9, 10, 18); ctx.fill(); ctx.stroke();
          });
          text(ctx, `${p.b.name}: ${p.count}`, x + w / 2, y - 14, { font: "800 16px system-ui", color: p.b.color });
        }
        // penned chickens
        for (const ch of chickens) if (ch.state === "penned") drawChicken(ctx, ch, 0.72);
        // loose + carried
        for (const ch of chickens) if (ch.state !== "penned") drawChicken(ctx, ch, 0.95);

        // players (stickman farmers in straw hats)
        for (const p of players) {
          const feet = p.y + 20;
          Art.shadow(ctx, p.x, feet, 16);
          Art.stickman(ctx, p.x, feet, {
            color: p.b.color, scale: 0.95, t: time,
            pose: p.moving ? "run" : (p.carried.length ? "carry" : "idle"),
            face: p.face || 1, hat: "cowboy", hatColor: "#6b4a2a",
          });
        }

        text(ctx, `⏱ ${Math.ceil(timeLeft)}s`, W / 2, 30, { font: "900 26px system-ui", color: "#fff", glow: "#000" });

        if (phase === "count") {
          ctx.fillStyle = "rgba(4,6,15,0.5)"; ctx.fillRect(0, 0, W, H);
          const n = Math.ceil(count - 0.2);
          text(ctx, n > 0 ? n : "GO!", W / 2, H / 2, { font: "900 90px system-ui", color: "#ffcf33", glow: "#ffcf33" });
          text(ctx, "Herd chickens into your pen!", W / 2, H / 2 + 70, { font: "700 20px system-ui", color: "#fff" });
        }
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
