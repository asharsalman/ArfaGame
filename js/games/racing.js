/* Racing — 1-4 players. Top-down laps round a track, stickmen driving.
   Surfaces differ per map: tarmac grips, ice slides, sand drags you down. */
(function () {
  const { clamp, rand, dist, text, roundRect } = Eng;

  GameHub.register({
    id: "racing",
    name: "Racing",
    category: "Party",
    players: "1-4P",
    min: 1, max: 4,
    color: "#ff5b5b",
    icon: "🏎",
    desc: "Three laps round a circuit. Tarmac grips, ice slides, sand slows — pick your line.",
    controls: "Up = accelerate · Down = brake/reverse · Left/Right = steer",
    create(env) {
      const { W, H, input } = env;
      const N = env.players, LAPS = 3;
      const carItem = Eng.equippedItem("racecar") || {};
      const bodyCol = carItem.color || null;          // null = use player colour
      const MAPS = [
        { name: "Sunset Circuit", grip: 0.92, drag: 1.0, road: "#3a3a44", grass: "#2a5a2a", trim: "#e8503a" },
        { name: "Ice Ring", grip: 0.985, drag: 1.0, road: "#9fc4dd", grass: "#d8ecf6", trim: "#4dc4ff" },
        { name: "Desert Dash", grip: 0.9, drag: 0.82, road: "#c9a165", grass: "#8a6a3a", trim: "#ffd24d" },
        { name: "Night Neon", grip: 0.94, drag: 1.05, road: "#22243a", grass: "#12142a", trim: "#b46bff" },
      ];
      let map = MAPS[0];
      // oval centre-line; the track is a band around it
      const CX = W / 2, CY = H / 2, RX = W * 0.34, RY = H * 0.29, ROAD = 74;
      let players, timeLeft, phase, count, matchOver, time = 0, finished;
      const results = Eng.Results();

      // distance from the oval centre-line — <ROAD/2 means you're on the road
      function offTrack(x, y) {
        const dx = (x - CX) / RX, dy = (y - CY) / RY;
        const r = Math.hypot(dx, dy);
        const nx = CX + (dx / (r || 1)) * RX, ny = CY + (dy / (r || 1)) * RY;
        return dist(x, y, nx, ny) > ROAD / 2;
      }
      // lap progress 0..1, measured from the start/finish line at the bottom
      const TAU = Math.PI * 2;
      const progressOf = (x, y) => {
        const a = Math.atan2((y - CY) / RY, (x - CX) / RX);   // bottom = +PI/2
        return (((a - Math.PI / 2) % TAU) + TAU) % TAU / TAU;
      };

      function reset() {
        map = Eng.pick(MAPS);
        finished = [];
        players = Eng.PLAYERS.slice(0, N).map((b, i) => {
          const lane = ROAD * 0.28 * (i - (N - 1) / 2) / Math.max(1, (N - 1) / 2 || 1);
          // line up on the start/finish straight, already pointing ALONG the
          // track (the racing direction at the bottom of the oval is leftward)
          return {
            b, x: CX + 30 + i * 30, y: CY + RY + lane, a: Math.PI,
            sp: 0, lap: 0, prog: 0, half: false,
            done: false, place: 0, skid: 0, vx: 0, vy: 0,
          };
        });
        phase = "count"; count = 3.4; matchOver = false; timeLeft = 0;
      }
      reset();

      function endMatch() {
        const order = finished.concat(
          players.filter((p) => !p.done).sort((a, b) => (b.lap + b.prog) - (a.lap + a.prog)));
        results.open(order.map((p) => ({ b: p.b, score: p.lap })));
        matchOver = true;
      }

      function update(dt) {
        time += dt;
        if (matchOver) { if (results.update(dt, input)) reset(); return; }
        if (phase === "count") { count -= dt; if (count <= 0) phase = "race"; return; }
        timeLeft += dt;

        for (const p of players) {
          if (p.done) { p.sp *= 0.94; p.x += Math.cos(p.a) * p.sp * dt; p.y += Math.sin(p.a) * p.sp * dt; continue; }
          const off = offTrack(p.x, p.y);
          const maxSp = (off ? 150 : 330) * map.drag;
          if (input.down(p.b.up)) p.sp += 340 * dt;
          else if (input.down(p.b.down)) p.sp -= 300 * dt;
          else p.sp *= 0.985;
          p.sp = clamp(p.sp, -120, maxSp);
          // steering bites less at low speed, and ice keeps you sliding
          const steer = 2.6 * dt * clamp(Math.abs(p.sp) / 140, 0, 1) * Math.sign(p.sp || 1);
          if (input.down(p.b.left)) p.a -= steer;
          if (input.down(p.b.right)) p.a += steer;
          const glide = map.grip;
          p.vx = (p.vx || 0) * glide + Math.cos(p.a) * p.sp * (1 - glide);
          p.vy = (p.vy || 0) * glide + Math.sin(p.a) * p.sp * (1 - glide);
          const mvx = Math.cos(p.a) * p.sp * 0.65 + p.vx * 0.35;
          const mvy = Math.sin(p.a) * p.sp * 0.65 + p.vy * 0.35;
          p.x = clamp(p.x + mvx * dt, 16, W - 16);
          p.y = clamp(p.y + mvy * dt, 16, H - 16);
          p.skid = off ? 1 : Math.max(0, p.skid - dt * 3);

          // lap counting: must pass the far side before the line counts again
          const pr = progressOf(p.x, p.y);
          if (pr > 0.35 && pr < 0.65) p.half = true;
          if (p.half && pr > 0.92) {
            p.half = false; p.lap++;
            if (p.lap >= LAPS) { p.done = true; p.place = finished.length + 1; finished.push(p); }
          }
          p.prog = pr;
        }
        if (players.every((p) => p.done)) endMatch();
      }

      function car(ctx, p) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        const col = bodyCol || p.b.color;
        Art.shadow(ctx, 0, 6, 20, 0.3);
        // wheels
        ctx.fillStyle = "#1a1d2a";
        [[-11, -12], [-11, 12], [12, -12], [12, 12]].forEach(([wx, wy]) => {
          roundRect(ctx, wx - 5, wy - 4, 11, 8, 2); ctx.fill();
        });
        // body
        ctx.fillStyle = col; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, -11); ctx.lineTo(12, -11); ctx.lineTo(23, -5);
        ctx.lineTo(23, 5); ctx.lineTo(12, 11); ctx.lineTo(-20, 11);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (carItem.extra === "stripe") {
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.fillRect(-18, -3.4, 38, 6.8);
        }
        // rear wing
        ctx.fillStyle = "#2a2f42"; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2.5;
        ctx.beginPath(); roundRect(ctx, -24, -13, 6, 26, 2); ctx.fill(); ctx.stroke();
        // cockpit + the driver's head and helmet
        ctx.fillStyle = "#10131f";
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 8, 0, 0, 7); ctx.fill();
        ctx.rotate(-p.a);
        ctx.fillStyle = p.b.color; ctx.strokeStyle = Art.OUT; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, -1, 6, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.arc(0, -2.4, 3.4, Math.PI * 0.1, Math.PI * 0.9); ctx.fill();
        ctx.restore();
      }

      function render(ctx) {
        ctx.fillStyle = map.grass; ctx.fillRect(0, 0, W, H);
        // road band
        ctx.strokeStyle = map.road; ctx.lineWidth = ROAD;
        ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, 0, 7); ctx.stroke();
        // kerbs
        ctx.lineWidth = 5; ctx.setLineDash([16, 16]);
        ctx.strokeStyle = map.trim;
        ctx.beginPath(); ctx.ellipse(CX, CY, RX + ROAD / 2 - 3, RY + ROAD / 2 - 3, 0, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(CX, CY, RX - ROAD / 2 + 3, RY - ROAD / 2 + 3, 0, 0, 7); ctx.stroke();
        ctx.setLineDash([]);
        // centre dashes
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3; ctx.setLineDash([18, 22]);
        ctx.beginPath(); ctx.ellipse(CX, CY, RX, RY, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        // start/finish
        ctx.save(); ctx.translate(CX, CY + RY); ctx.fillStyle = "#f2f5ff";
        for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++)
          if ((r + c) % 2 === 0) ctx.fillRect(-4 + r * 8, -ROAD / 2 + c * (ROAD / 8), 8, ROAD / 8);
        ctx.restore();

        players.forEach((p) => car(ctx, p));

        // hud
        ctx.fillStyle = "rgba(6,10,20,0.78)";
        roundRect(ctx, 12, 10, 176, 26 + N * 22, 12); ctx.fill();
        text(ctx, `${map.name}  ·  ${LAPS} laps`, 24, 26,
          { align: "left", font: "800 13px system-ui", color: map.trim });
        players.forEach((p, i) => {
          const lbl = p.done ? `P${p.place}` : `lap ${Math.min(p.lap + 1, LAPS)}/${LAPS}`;
          text(ctx, `${p.b.name}  ${lbl}`, 24, 48 + i * 22,
            { align: "left", font: "800 15px system-ui", color: p.b.color });
        });

        if (phase === "count") {
          ctx.fillStyle = "rgba(4,6,15,0.5)"; ctx.fillRect(0, 0, W, H);
          const n = Math.ceil(count - 0.4);
          text(ctx, n > 0 ? n : "GO!", W / 2, H / 2, { font: "900 92px system-ui", color: map.trim, glow: map.trim });
        }
        if (matchOver) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
