/* Geometry Dash — original auto-runner.
   Solo or 2-player split-screen race · coins · % progress · reward system. */
(function () {
  const { clamp, rand, randInt, circleRect, rectsOverlap, roundRect, text } = Eng;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  GameHub.register({
    id: "geometrydash",
    name: "Geometry Dash",
    category: "Featured",
    players: "1-2P",
    min: 1, max: 2, selfSelect: true,
    color: "#4df0ff",
    icon: "🔺",
    desc: "Rhythm runner. Grab coins, dodge spikes, reach 100%. Solo or race a friend.",
    controls: "Jump: Space/↑ (P1: W · P2: ↑) · hold to auto-jump",
    create(env) {
      const { W, H, input } = env;
      const PX = 170;                 // screen x where the cube sits
      const LEVEL_END = 22000;        // world length (px) — longer track
      const GRAV = 2500, JUMP = -880;
      const results = Eng.Results();

      let lifetimeCoins = Eng.coins();
      let bestPct = store.get("gd_best", 0);

      let state = "select";           // 'select' | 'play'
      let mode = 1;                   // 1 or 2 players
      let time = 0;
      let level, players, matchWinner;
      let SIZE = 42;

      const speedAt = (x) => 370 + clamp(x / LEVEL_END, 0, 1) * 300;

      // ---- level generation (shared by both racers; fair spacing) ----
      function buildLevel() {
        const obstacles = [], coins = [], pads = [], shields = [];
        let x = 800;                                   // short intro
        const safeEnd = LEVEL_END - 700;
        while (x < safeEnd) {
          const sp = speedAt(x), prog = x / LEVEL_END;
          const r = Math.random();
          let groupW = 0, bigGap = false;
          if (r < 0.5) {                               // spikes — up to 4 as it ramps
            const maxN = prog < 0.2 ? 2 : prog < 0.5 ? 3 : 4;
            const n = randInt(1, maxN);
            for (let i = 0; i < n; i++) obstacles.push({ type: "spike", wx: x + i * 38, w: 38 });
            groupW = n * 38;
          } else if (r < 0.74) {                       // short block, sometimes a trailing spike
            obstacles.push({ type: "block", wx: x, w: 50, units: 1 });
            groupW = 50;
            if (prog > 0.35 && Math.random() < 0.5) { obstacles.push({ type: "spike", wx: x + 200, w: 38 }); groupW = 238; }
          } else if (r < 0.9) {                        // tall block (forced jump-on)
            obstacles.push({ type: "block", wx: x, w: 50, units: 2 });
            groupW = 50; bigGap = true;
          } else {                                     // reward stretch: arc of coins
            for (let i = 0; i < 3; i++) coins.push({ wx: x + i * 44, hAbove: 34 });
            groupW = 132;
          }
          if (groupW <= 150 && Math.random() < 0.5)
            coins.push({ wx: x + groupW / 2, hAbove: 150 });
          // gap = sp * factor → constant reaction time; tighter factor = harder
          let gap = sp * (bigGap ? rand(1.2, 1.45) : rand(0.72, 1.08));
          gap = Math.max(gap, 300);
          // boosters: a jump pad mid-gap (launches you high), or a shield pickup
          if (prog > 0.12 && Math.random() < 0.16) pads.push({ wx: x + groupW + gap * 0.5 });
          else if (prog > 0.2 && Math.random() < 0.1) shields.push({ wx: x + groupW + gap * 0.5, hAbove: 60 });
          x += groupW + gap;
        }
        return { obstacles, coins, pads, shields };
      }

      function makePlayer(id, regionTop, regionH, jumpKeys, color) {
        const floorY = regionTop + regionH - (mode === 1 ? 90 : 40);
        return {
          id, regionTop, regionH, floorY, jumpKeys, color,
          wx: 0, y: floorY - SIZE, vy: 0, angle: 0, onGround: true,
          alive: true, finished: false, respawn: 0, shield: false, inv: 0,
          coins: 0, collected: new Set(), gotShield: new Set(), particles: [], attempts: 1,
        };
      }

      function startGame(m) {
        mode = m;
        SIZE = m === 1 ? 42 : 34;
        level = buildLevel();
        matchWinner = 0;
        if (m === 1) {
          players = [makePlayer(1, 0, H, ["Space", "ArrowUp", "KeyW"], "#4df0ff")];
        } else {
          players = [
            makePlayer(1, 0, H / 2, ["KeyW", "Space"], "#4df0ff"),
            makePlayer(2, H / 2, H / 2, ["ArrowUp", "Enter"], "#ff5b8a"),
          ];
        }
        state = "play";
      }

      function resetPlayer(p) {
        p.wx = 0; p.y = p.floorY - SIZE; p.vy = 0; p.angle = 0;
        p.onGround = true; p.alive = true; p.finished = false;
        p.shield = false; p.inv = 0; p.gotShield = new Set();
        p.coins = 0; p.collected = new Set(); p.attempts++;
      }

      function jumpHeld(p) {
        return input.anyDown(p.jumpKeys) || (mode === 1 && input.pointer.down);
      }
      function retryPressed(p) {
        return input.pressed("KeyR") || input.anyPressed(p.jumpKeys) ||
               (mode === 1 && input.pointer.pressed);
      }

      function die(p) {
        if (!p.alive || p.inv > 0) return;
        if (p.shield) {                       // shield absorbs one hit
          p.shield = false; p.inv = 0.9;
          for (let i = 0; i < 14; i++) p.particles.push({ x: PX + SIZE / 2, y: p.y + SIZE / 2, vx: rand(-200, 200), vy: rand(-260, 40), life: 0.7, s: rand(4, 9) });
          return;
        }
        p.alive = false;
        for (let i = 0; i < 24; i++)
          p.particles.push({
            x: PX + SIZE / 2, y: p.y + SIZE / 2,
            vx: rand(-260, 260), vy: rand(-340, 60), life: 1, s: rand(5, 11),
          });
        if (mode === 2) p.respawn = 0.7;
      }

      function updatePlayer(p, dt) {
        for (const q of p.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt; q.life -= dt * 1.4; }
        p.particles = p.particles.filter((q) => q.life > 0);

        if (p.finished) return;
        if (!p.alive) {
          if (mode === 1) { if (retryPressed(p)) resetPlayer(p); }
          else { p.respawn -= dt; if (p.respawn <= 0) resetPlayer(p); }
          return;
        }

        p.wx += speedAt(p.wx) * dt;
        if (p.inv > 0) p.inv -= dt;

        const prevBottom = p.y + SIZE;
        p.vy += GRAV * dt;
        p.y += p.vy * dt;

        let support = p.floorY;
        for (const o of level.obstacles) {
          if (o.type !== "block") continue;
          if (p.wx + SIZE > o.wx && p.wx < o.wx + o.w) {
            const top = p.floorY - o.units * 48;
            if (prevBottom <= top + 8) support = Math.min(support, top);
          }
        }
        if (p.y + SIZE >= support) {
          p.y = support - SIZE; p.vy = 0;
          if (!p.onGround) p.angle = Math.round(p.angle / (Math.PI / 2)) * (Math.PI / 2);
          p.onGround = true;
        } else { p.onGround = false; p.angle += 7.5 * dt; }

        if (p.onGround && jumpHeld(p)) { p.vy = JUMP; p.onGround = false; }

        // jump pads — launch high when you run over one
        for (const pad of level.pads) {
          if (Math.abs((p.wx + SIZE / 2) - pad.wx) < 26 && p.y + SIZE >= p.floorY - 18) {
            p.vy = -1320; p.onGround = false;
          }
        }
        // shield pickups
        level.shields.forEach((sh, i) => {
          if (p.gotShield.has(i)) return;
          if (circleRect(sh.wx, p.floorY - sh.hAbove, 20, p.wx, p.y, SIZE, SIZE)) { p.gotShield.add(i); p.shield = true; }
        });

        // hazards
        const pin = { x: p.wx + 6, y: p.y + 6, w: SIZE - 12, h: SIZE - 12 };
        for (const o of level.obstacles) {
          if (o.type === "spike") {
            if (rectsOverlap(pin, { x: o.wx + 8, y: p.floorY - 32, w: 24, h: 32 })) { die(p); break; }
          } else if (rectsOverlap(pin, { x: o.wx, y: p.floorY - o.units * 48, w: o.w, h: o.units * 48 })) { die(p); break; }
        }
        // coins
        level.coins.forEach((c, i) => {
          if (p.collected.has(i)) return;
          if (circleRect(c.wx, p.floorY - c.hAbove, 16, p.wx, p.y, SIZE, SIZE)) {
            p.collected.add(i); p.coins++;
            Eng.addCoins(1); lifetimeCoins = Eng.coins();
          }
        });

        if (p.wx >= LEVEL_END) {
          p.wx = LEVEL_END; p.finished = true;
          const pct = 100;
          if (pct > bestPct) { bestPct = pct; store.set("gd_best", bestPct); }
          if (mode === 2 && !matchWinner) {
            matchWinner = p.id;
            const other = players.find((q) => q !== p);
            const opct = Math.floor((other.wx / LEVEL_END) * 100);
            results.open([
              { b: Eng.PLAYERS[p.id - 1], score: 100 },
              { b: Eng.PLAYERS[other.id - 1], score: opct },
            ]);
          }
        } else {
          const pct = Math.floor((p.wx / LEVEL_END) * 100);
          if (mode === 1 && pct > bestPct) { bestPct = pct; store.set("gd_best", bestPct); }
        }
      }

      // ---------------- update ----------------
      function update(dt) {
        time += dt;
        if (state === "select") {
          if (input.pressed("Digit1") || input.pressed("Numpad1")) startGame(1);
          if (input.pressed("Digit2") || input.pressed("Numpad2")) startGame(2);
          if (input.pointer.pressed) {
            const { x, y } = input.pointer;
            if (y > H / 2 + 10 && y < H / 2 + 90) {
              if (x > W / 2 - 220 && x < W / 2 - 20) startGame(1);
              if (x > W / 2 + 20 && x < W / 2 + 220) startGame(2);
            }
          }
          return;
        }
        if (matchWinner) { if (results.update(dt, input)) startGame(2); return; }
        for (const p of players) updatePlayer(p, dt);
      }

      // ---------------- render ----------------
      function coin(ctx, cx, cy, seed) {
        const sc = Math.abs(Math.cos(time * 4 + seed)) * 0.8 + 0.2;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, 1);
        ctx.fillStyle = "#ffcf33"; ctx.strokeStyle = "#a8780f"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#fff3b0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.stroke();
        ctx.restore();
      }

      function renderView(ctx, p) {
        const top = p.regionTop, h = p.regionH, hue = (200 + p.wx / 18) % 360;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();

        const g = ctx.createLinearGradient(0, top, 0, top + h);
        g.addColorStop(0, `hsl(${hue},60%,12%)`); g.addColorStop(1, `hsl(${(hue + 40) % 360},55%,6%)`);
        ctx.fillStyle = g; ctx.fillRect(0, top, W, h);

        const cam = p.wx - PX;
        const off = p.wx % 60;
        ctx.strokeStyle = `hsla(${hue},70%,60%,0.10)`; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = -off; x < W; x += 60) { ctx.moveTo(x, top); ctx.lineTo(x, p.floorY); }
        for (let y = top; y < p.floorY; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        // ground
        ctx.fillStyle = `hsl(${hue},45%,9%)`; ctx.fillRect(0, p.floorY, W, top + h - p.floorY);
        ctx.strokeStyle = `hsl(${hue},90%,65%)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, p.floorY); ctx.lineTo(W, p.floorY); ctx.stroke();

        // coins
        level.coins.forEach((c, i) => {
          if (p.collected.has(i)) return;
          const sx = c.wx - cam;
          if (sx > -30 && sx < W + 30) coin(ctx, sx, p.floorY - c.hAbove, c.wx * 0.01);
        });

        // jump pads
        for (const pad of level.pads) {
          const sx = pad.wx - cam;
          if (sx < -30 || sx > W + 30) continue;
          ctx.fillStyle = "#ffb02e"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sx - 22, p.floorY); ctx.lineTo(sx, p.floorY - 16); ctx.lineTo(sx + 22, p.floorY); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "rgba(255,176,46,0.8)";
          ctx.beginPath(); ctx.moveTo(sx - 9, p.floorY - 6); ctx.lineTo(sx, p.floorY - 22); ctx.lineTo(sx + 9, p.floorY - 6); ctx.fill();
        }
        // shield pickups
        level.shields.forEach((sh, i) => {
          if (p.gotShield.has(i)) return;
          const sx = sh.wx - cam; if (sx < -30 || sx > W + 30) return;
          const cy = p.floorY - sh.hAbove;
          ctx.strokeStyle = "#6cf0ff"; ctx.lineWidth = 3; ctx.shadowColor = "#6cf0ff"; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(sx, cy, 14, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, cy - 11); ctx.lineTo(sx + 9, cy - 5); ctx.lineTo(sx + 9, cy + 4); ctx.quadraticCurveTo(sx, cy + 13, sx - 9, cy + 4); ctx.lineTo(sx - 9, cy - 5); ctx.closePath(); ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // obstacles
        for (const o of level.obstacles) {
          const sx = o.wx - cam;
          if (sx < -120 || sx > W + 120) continue;
          if (o.type === "spike") {
            ctx.fillStyle = `hsl(${(hue + 180) % 360},90%,62%)`; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sx, p.floorY); ctx.lineTo(sx + o.w / 2, p.floorY - 44); ctx.lineTo(sx + o.w, p.floorY); ctx.closePath();
            ctx.fill(); ctx.stroke();
          } else {
            const bh = o.units * 48;
            ctx.fillStyle = `hsl(${(hue + 150) % 360},75%,55%)`; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            roundRect(ctx, sx, p.floorY - bh, o.w, bh, 6); ctx.fill(); ctx.stroke();
          }
        }

        // cube
        if (p.alive && !p.finished) {
          const cubeCol = mode === 1 ? Eng.skinColor("geometrydash", p.color) : p.color;
          if (p.shield || p.inv > 0) {        // shield aura
            ctx.strokeStyle = "#6cf0ff"; ctx.lineWidth = 3; ctx.globalAlpha = p.shield ? 0.9 : 0.4 + 0.3 * Math.sin(time * 20);
            ctx.beginPath(); ctx.arc(PX + SIZE / 2, p.y + SIZE / 2, SIZE * 0.82, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
          }
          ctx.save(); ctx.translate(PX + SIZE / 2, p.y + SIZE / 2); ctx.rotate(p.angle);
          ctx.shadowColor = cubeCol; ctx.shadowBlur = 18;
          const grd = ctx.createLinearGradient(-SIZE / 2, -SIZE / 2, SIZE / 2, SIZE / 2);
          grd.addColorStop(0, "#fff"); grd.addColorStop(1, cubeCol);
          ctx.fillStyle = grd; roundRect(ctx, -SIZE / 2, -SIZE / 2, SIZE, SIZE, 7); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = "#16244a";
          const eo = SIZE / 6;
          ctx.beginPath(); ctx.arc(-eo, -3, SIZE / 13, 0, 7); ctx.arc(eo, -3, SIZE / 13, 0, 7); ctx.fill();
          ctx.lineWidth = SIZE / 18; ctx.strokeStyle = "#16244a"; ctx.lineCap = "round";
          ctx.beginPath(); ctx.arc(0, 2, SIZE / 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
          ctx.restore();
        }

        for (const q of p.particles) {
          ctx.globalAlpha = clamp(q.life, 0, 1); ctx.fillStyle = p.color;
          ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
        }
        ctx.globalAlpha = 1;

        // HUD: coins + progress bar
        const pct = Math.floor((p.wx / LEVEL_END) * 100);
        const barX = 70, barW = W - 140, barY = top + 22;
        ctx.fillStyle = "rgba(255,255,255,0.12)"; roundRect(ctx, barX, barY, barW, 14, 7); ctx.fill();
        const fg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        fg.addColorStop(0, "#4df0ff"); fg.addColorStop(1, "#ff5b8a");
        ctx.fillStyle = fg; roundRect(ctx, barX, barY, Math.max(8, barW * (pct / 100)), 14, 7); ctx.fill();
        text(ctx, `${pct}%`, W / 2, barY + 30, { font: "800 16px system-ui", color: "#fff" });

        text(ctx, `🪙 ${p.coins}`, 16, barY + 7, { align: "left", font: "800 20px system-ui", color: "#ffcf33" });
        if (mode === 2)
          text(ctx, `P${p.id}`, W - 16, barY + 7, { align: "right", font: "800 18px system-ui", color: p.color });

        // per-view overlays
        if (mode === 2 && !p.alive && !matchWinner)
          text(ctx, "CRASHED", W / 2, top + h / 2, { font: "900 40px system-ui", color: "#ff5b8a", glow: "#ff5b8a" });
        if (mode === 2 && p.finished && !matchWinner)
          text(ctx, "FINISHED!", W / 2, top + h / 2, { font: "900 40px system-ui", color: "#4dff9e", glow: "#4dff9e" });

        ctx.restore();
      }

      function renderSelect(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#101a36"); g.addColorStop(1, "#0a0f22");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        text(ctx, "GEOMETRY DASH", W / 2, 150, { font: "900 64px system-ui", color: "#4df0ff", glow: "#4df0ff" });
        text(ctx, "Collect coins · dodge spikes · reach 100%", W / 2, 205, { font: "600 20px system-ui", color: "#9fb0e0" });
        text(ctx, `🪙 ${lifetimeCoins} total coins        ⭐ best ${bestPct}%`, W / 2, 250,
          { font: "700 20px system-ui", color: "#ffcf33" });

        const btn = (bx, label, sub, col, num) => {
          ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.strokeStyle = col; ctx.lineWidth = 3;
          roundRect(ctx, bx, H / 2 + 10, 200, 80, 16); ctx.fill(); ctx.stroke();
          text(ctx, label, bx + 100, H / 2 + 42, { font: "800 26px system-ui", color: col });
          text(ctx, sub, bx + 100, H / 2 + 70, { font: "600 14px system-ui", color: "#9fb0e0" });
          text(ctx, num, bx + 100, H / 2 - 10, { font: "700 14px system-ui", color: "#6b76a3" });
        };
        btn(W / 2 - 220, "SOLO", "1 player", "#4df0ff", "press 1");
        btn(W / 2 + 20, "RACE", "2 players", "#ff5b8a", "press 2");
        text(ctx, "P1 jump: W / Space    ·    P2 jump: ↑ / Enter", W / 2, H - 60,
          { font: "600 16px system-ui", color: "#7e8ab5" });
      }

      function render(ctx) {
        if (state === "select") { renderSelect(ctx); return; }
        for (const p of players) renderView(ctx, p);

        if (mode === 2) {
          ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
        }

        const solo = players[0];
        if (mode === 1 && !solo.alive) {
          ctx.fillStyle = "rgba(4,6,15,0.72)"; ctx.fillRect(0, 0, W, H);
          text(ctx, "CRASHED", W / 2, H / 2 - 50, { font: "900 56px system-ui", color: "#ff5b8a", glow: "#ff5b8a" });
          text(ctx, `Reached ${Math.floor((solo.wx / LEVEL_END) * 100)}%  ·  🪙 ${solo.coins} this run  ·  attempt ${solo.attempts}`,
            W / 2, H / 2 + 6, { font: "600 20px system-ui", color: "#fff" });
          text(ctx, "Space / click to retry   ·   Esc for menu", W / 2, H / 2 + 48, { font: "600 16px system-ui", color: "#9fb0e0" });
        }
        if (mode === 1 && solo.finished) {
          ctx.fillStyle = "rgba(4,6,15,0.78)"; ctx.fillRect(0, 0, W, H);
          text(ctx, "LEVEL COMPLETE!", W / 2, H / 2 - 40, { font: "900 54px system-ui", color: "#4dff9e", glow: "#4dff9e" });
          text(ctx, `🪙 ${solo.coins} coins collected this run`, W / 2, H / 2 + 14, { font: "700 22px system-ui", color: "#ffcf33" });
          text(ctx, "Space / click to play again   ·   Esc for menu", W / 2, H / 2 + 54, { font: "600 16px system-ui", color: "#9fb0e0" });
        }
        if (matchWinner) results.render(ctx, W, H);
      }

      return { update, render };
    },
  });
})();
