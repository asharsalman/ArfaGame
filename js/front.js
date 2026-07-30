/* front.js — the front page: an animated brawl over the M coin, plus the
   bottom nav (Quick Match / Tournament / Shop). */
(function () {
  const W = 960, H = 330;
  let cv, ctx, t = 0, raf = 0;

  const CAST = [
    { i: 0, x: 250, phase: 0.0 },
    { i: 1, x: 400, phase: 1.6 },
    { i: 2, x: 560, phase: 3.1 },
    { i: 3, x: 710, phase: 4.4 },
  ];

  function draw() {
    if (!cv) return;
    t += 1 / 60;
    const FLOOR = H - 40;

    // sky + spotlights
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#121a3a"); g.addColorStop(1, "#080b18");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) {
      const lx = 200 + i * 280 + Math.sin(t * 0.7 + i) * 40;
      const lg = ctx.createLinearGradient(lx, 0, lx, FLOOR);
      lg.addColorStop(0, `hsla(${(i * 90 + t * 22) % 360},90%,65%,0.20)`);
      lg.addColorStop(1, "transparent");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + 110, FLOOR); ctx.lineTo(lx - 110, FLOOR); ctx.fill();
    }
    // floor
    ctx.fillStyle = "#0d1226"; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = "#2c3a6b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();

    // the prize, bobbing above the scrum
    const coinY = 96 + Math.sin(t * 2) * 10;
    ctx.save();
    ctx.shadowColor = "#ffd24d"; ctx.shadowBlur = 34;
    Art.coin(ctx, W / 2, coinY, 30, Math.abs(Math.cos(t * 1.4)) * 0.85 + 0.15);
    ctx.restore();

    // four stickmen jumping for it
    CAST.forEach((c) => {
      const b = Eng.PLAYERS[c.i];
      const cyc = (t * 1.5 + c.phase) % 3;
      const jumping = cyc < 1.1;
      const hop = jumping ? Math.sin((cyc / 1.1) * Math.PI) * 62 : 0;
      const sway = Math.sin(t * 1.2 + c.phase) * 26;
      const x = c.x + sway;
      const y = FLOOR - hop;
      Art.shadow(ctx, x, FLOOR + 2, 20 - hop * 0.12, 0.3 - hop * 0.0022);
      Art.stickman(ctx, x, y, {
        color: b.color, scale: 1.45, t: t * 1.6 + c.phase,
        pose: jumping ? "cheer" : "idle",
        face: x < W / 2 ? 1 : -1,
      });
    });

    raf = requestAnimationFrame(draw);
  }

  function start() {
    cv = document.getElementById("frontStage");
    if (!cv) return;
    ctx = cv.getContext("2d");
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  window.FrontPage = { start, stop };
})();
