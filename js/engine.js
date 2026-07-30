/* engine.js — shared helpers + input. No game logic here. */
(function () {
  const Eng = {};

  // --- math ---
  Eng.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  Eng.lerp = (a, b, t) => a + (b - a) * t;
  Eng.rand = (a, b) => a + Math.random() * (b - a);
  Eng.randInt = (a, b) => Math.floor(Eng.rand(a, b + 1));
  Eng.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  Eng.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  Eng.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);

  // --- collision ---
  Eng.rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  Eng.circleRect = (cx, cy, r, rx, ry, rw, rh) => {
    const nx = Eng.clamp(cx, rx, rx + rw);
    const ny = Eng.clamp(cy, ry, ry + rh);
    return Eng.dist(cx, cy, nx, ny) < r;
  };
  Eng.circlesOverlap = (x1, y1, r1, x2, y2, r2) =>
    Eng.dist(x1, y1, x2, y2) < r1 + r2;

  // --- drawing ---
  Eng.roundRect = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  // glow text helper
  Eng.text = (ctx, str, x, y, opts = {}) => {
    ctx.save();
    ctx.font = opts.font || "bold 28px system-ui, sans-serif";
    ctx.textAlign = opts.align || "center";
    ctx.textBaseline = opts.baseline || "middle";
    if (opts.glow) {
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur = opts.blur || 16;
    }
    ctx.fillStyle = opts.color || "#fff";
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  // --- input: keyboard (by e.code) + pointer (in logical coords) ---
  const PREVENT = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space",
    "Enter", "KeyW", "KeyA", "KeyS", "KeyD",
  ]);

  class Input {
    constructor(canvas, W, H) {
      this.canvas = canvas;
      this.W = W;
      this.H = H;
      this.keysDown = {};
      this.justP = {};
      this.pointer = { x: 0, y: 0, down: false, pressed: false };

      window.addEventListener("keydown", (e) => {
        if (!this.keysDown[e.code]) this.justP[e.code] = true;
        this.keysDown[e.code] = true;
        if (PREVENT.has(e.code)) e.preventDefault();
      });
      window.addEventListener("keyup", (e) => {
        this.keysDown[e.code] = false;
      });

      const setPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        this.pointer.x = ((cx - r.left) / r.width) * W;
        this.pointer.y = ((cy - r.top) / r.height) * H;
      };
      canvas.addEventListener("pointerdown", (e) => {
        setPos(e);
        this.pointer.down = true;
        this.pointer.pressed = true;
      });
      window.addEventListener("pointermove", (e) => setPos(e));
      window.addEventListener("pointerup", () => (this.pointer.down = false));
    }
    down(code) { return !!this.keysDown[code]; }
    pressed(code) { return !!this.justP[code]; }
    anyDown(list) { return list.some((c) => this.down(c)); }
    anyPressed(list) { return list.some((c) => this.pressed(c)); }
    // called once per frame by the hub, AFTER update()
    endFrame() {
      this.justP = {};
      this.pointer.pressed = false;
    }
  }

  Eng.Input = Input;

  // up to 4 players on one keyboard — shared bindings + colors
  Eng.PLAYERS = [
    { id: 1, name: "P1", color: "#4df0ff", up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", action: "Space", keys: "WASD + Space" },
    { id: 2, name: "P2", color: "#ff5b8a", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", action: "Enter", keys: "Arrows + Enter" },
    { id: 3, name: "P3", color: "#4dff9e", up: "KeyT", down: "KeyG", left: "KeyF", right: "KeyH", action: "KeyB", keys: "TFGH + B" },
    { id: 4, name: "P4", color: "#ffd24d", up: "KeyI", down: "KeyK", left: "KeyJ", right: "KeyL", action: "KeyO", keys: "IJKL + O" },
  ];

  // ---- session standings (shared across every game, persisted) ----
  Eng.SESSION = (function () {
    let d = { points: { 1: 0, 2: 0, 3: 0, 4: 0 }, wins: { 1: 0, 2: 0, 3: 0, 4: 0 } };
    try { const v = localStorage.getItem("games_session"); if (v) d = JSON.parse(v); } catch (e) {}
    return d;
  })();
  Eng.saveSession = () => { try { localStorage.setItem("games_session", JSON.stringify(Eng.SESSION)); } catch (e) {} };
  Eng.resetSession = () => { Eng.SESSION = { points: { 1: 0, 2: 0, 3: 0, 4: 0 }, wins: { 1: 0, 2: 0, 3: 0, 4: 0 } }; Eng.saveSession(); };

  // ---- reusable end-of-match standings screen (1st=3, 2nd=2, 3rd=1, 4th=0) ----
  Eng.Results = function () {
    let active = false, ranking = null, gained = {}, t = 0, coinReward = 0;
    function trophy(ctx, x, y, c) {
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = c; ctx.strokeStyle = c;
      ctx.shadowColor = c; ctx.shadowBlur = 26; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-24, -22); ctx.lineTo(24, -22); ctx.lineTo(18, 6);
      ctx.quadraticCurveTo(0, 20, -18, 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-28, -12, 11, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(28, -12, 11, Math.PI * 1.5, Math.PI * 0.5); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillRect(-5, 6, 10, 14); ctx.fillRect(-16, 20, 32, 7);
      ctx.restore();
    }
    return {
      get active() { return active; },
      open(rank) {                       // rank: best-first [{b, score}]
        ranking = rank; active = true; t = 0; gained = {};
        rank.forEach((r, i) => {
          const pts = [3, 2, 1, 0][i] || 0;
          gained[r.b.id] = pts;
          Eng.SESSION.points[r.b.id] = (Eng.SESSION.points[r.b.id] || 0) + pts;
        });
        Eng.SESSION.wins[rank[0].b.id] = (Eng.SESSION.wins[rank[0].b.id] || 0) + 1;
        Eng.saveSession();
        coinReward = 30; Eng.addCoins(coinReward);
        if (rank.length > 1) Eng.track("win");     // solo runs aren't wins
        // in a tournament the hub takes over: bank the points and show standings
        if (window.GameHub && GameHub.cupActive && GameHub.cupActive()) {
          setTimeout(() => GameHub.cupRecord(rank), 1400);
        }
      },
      update(dt, input) { t += dt; if (input.pressed("KeyR")) { active = false; return true; } return false; },
      render(ctx, W, H) {
        ctx.save();
        ctx.fillStyle = "rgba(4,6,15,0.9)"; ctx.fillRect(0, 0, W, H);
        const win = ranking[0];
        const solo = ranking.length < 2;
        const pop = Math.min(1, t * 3);
        if (!solo) trophy(ctx, W / 2, 86, win.b.color);
        ctx.save();
        ctx.translate(W / 2, solo ? 120 : 158); ctx.scale(0.85 + pop * 0.15, 0.85 + pop * 0.15);
        // nobody "wins" a one-player game — just report the run
        Eng.text(ctx, solo ? "ROUND COMPLETE" : `${win.b.name} WINS!`, 0, 0,
          { font: "900 48px system-ui", color: solo ? "#cfe0ff" : win.b.color, glow: "#fff" });
        ctx.restore();
        if (solo && win.score != null)
          Eng.text(ctx, `Score: ${win.score}`, W / 2, 176, { font: "800 24px system-ui", color: win.b.color });

        const n = ranking.length, boxW = Math.min(580, W - 120);
        const rowH = Math.min(62, (H - 300) / n), startY = 206;
        const medals = ["#ffd24d", "#c8d2e6", "#cd7f32", "#6b76a3"];
        ranking.forEach((r, i) => {
          const y = startY + i * rowH, mid = y + (rowH - 8) / 2;
          Eng.roundRect(ctx, W / 2 - boxW / 2, y, boxW, rowH - 8, 12);
          ctx.fillStyle = i === 0 ? "rgba(255,210,77,0.14)" : "rgba(255,255,255,0.05)"; ctx.fill();
          const mx = W / 2 - boxW / 2 + 34;
          ctx.fillStyle = medals[i] || "#6b76a3"; ctx.beginPath(); ctx.arc(mx, mid, 17, 0, 7); ctx.fill();
          Eng.text(ctx, i + 1, mx, mid + 1, { font: "900 18px system-ui", color: "#10131f" });
          Eng.text(ctx, r.b.name, mx + 40, mid, { align: "left", font: "800 23px system-ui", color: r.b.color });
          Eng.text(ctx, `+${gained[r.b.id]}`, W / 2 + boxW / 2 - 150, mid, { align: "right", font: "800 22px system-ui", color: "#4dff9e" });
          Eng.text(ctx, `${Eng.SESSION.points[r.b.id]} pts`, W / 2 + boxW / 2 - 28, mid, { align: "right", font: "800 22px system-ui", color: "#fff" });
        });
        Eng.text(ctx, `+${coinReward} coins earned  ·  🪙 ${Eng.coins()} total`,
          W / 2, H - 58, { font: "700 17px system-ui", color: "#ffcf33" });
        Eng.text(ctx, "Session standings  ·  Press R to play again  ·  Esc for menu",
          W / 2, H - 32, { font: "600 16px system-ui", color: "#9fb0e0" });
        ctx.restore();
      },
    };
  };

  // ---- wallet + cosmetics shop (persisted). Items live in window.SHOP_ITEMS ----
  Eng.SHOP = (function () {
    let d = { coins: 0, owned: {}, equipped: {} };
    try { const v = localStorage.getItem("games_shop"); if (v) d = Object.assign(d, JSON.parse(v)); } catch (e) {}
    return d;
  })();
  Eng.shopSave = () => { try { localStorage.setItem("games_shop", JSON.stringify(Eng.SHOP)); } catch (e) {} };
  Eng.coins = () => Eng.SHOP.coins;
  Eng.addCoins = (n) => { Eng.SHOP.coins += n; Eng.shopSave(); };
  Eng.spendCoins = (n) => { if (Eng.SHOP.coins < n) return false; Eng.SHOP.coins -= n; Eng.shopSave(); return true; };
  Eng.isOwned = (it) => it.price === 0 || !!Eng.SHOP.owned[it.id];
  Eng.isEquipped = (it) => { const eq = Eng.SHOP.equipped[it.game]; return eq ? eq === it.id : !!it.default; };
  Eng.buyItem = (it) => { if (Eng.isOwned(it)) return true; if (!Eng.spendCoins(it.price)) return false; Eng.SHOP.owned[it.id] = true; Eng.shopSave(); return true; };
  Eng.equipItem = (it) => { Eng.SHOP.equipped[it.game] = it.id; Eng.shopSave(); };
  Eng.equippedItem = (game) => {
    const items = window.SHOP_ITEMS || [];
    const eq = Eng.SHOP.equipped[game];
    return (eq ? items.find((i) => i.id === eq) : null) ||
           items.find((i) => i.game === game && i.default) || null;
  };
  Eng.skinColor = (game, fallback) => {
    const items = window.SHOP_ITEMS || [];
    const eq = Eng.SHOP.equipped[game];
    const it = eq ? items.find((i) => i.id === eq) : items.find((i) => i.game === game && i.default);
    return it ? it.color : fallback;
  };

  // ---- daily challenges: 3 tasks a day, rerolled at midnight ----
  const TASK_POOL = [
    { id: "play3", desc: "Play 3 different games", goal: 3, reward: 60, ev: "play" },
    { id: "win2", desc: "Win 2 matches", goal: 2, reward: 80, ev: "win" },
    { id: "win4", desc: "Win 4 matches", goal: 4, reward: 140, ev: "win" },
    { id: "coins30", desc: "Collect 30 coins", goal: 30, reward: 70, ev: "coin" },
    { id: "coins60", desc: "Collect 60 coins", goal: 60, reward: 130, ev: "coin" },
    { id: "play5", desc: "Play 5 different games", goal: 5, reward: 110, ev: "play" },
    { id: "cup1", desc: "Finish a tournament", goal: 1, reward: 150, ev: "cup" },
    { id: "gd50", desc: "Reach 50% in Geometry Dash", goal: 1, reward: 90, ev: "gd50" },
    { id: "hoop3", desc: "Sink a 3-point basket", goal: 1, reward: 90, ev: "hoop3" },
    { id: "stack8", desc: "Stack a tower 8 high", goal: 1, reward: 100, ev: "stack8" },
  ];
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function rollDaily() {
    // deterministic per-day pick so it's the same all day
    const seedStr = todayKey();
    let s = 0;
    for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
    const pool = TASK_POOL.slice(), picks = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      s = (s * 1103515245 + 12345) >>> 0;
      picks.push(pool.splice(s % pool.length, 1)[0]);
    }
    return {
      date: seedStr,
      seen: [],
      tasks: picks.map((t) => ({ id: t.id, desc: t.desc, goal: t.goal, reward: t.reward, ev: t.ev, prog: 0, claimed: false })),
    };
  }

  Eng.DAILY = (function () {
    let d = null;
    try { const v = localStorage.getItem("games_daily"); if (v) d = JSON.parse(v); } catch (e) {}
    if (!d || d.date !== todayKey()) d = rollDaily();
    return d;
  })();
  Eng.dailySave = () => { try { localStorage.setItem("games_daily", JSON.stringify(Eng.DAILY)); } catch (e) {} };

  /* Games and the hub call this; matching tasks tick up. */
  Eng.track = function (ev, arg) {
    if (Eng.DAILY.date !== todayKey()) { Eng.DAILY = rollDaily(); }
    let changed = false;
    for (const t of Eng.DAILY.tasks) {
      if (t.ev !== ev || t.prog >= t.goal) continue;
      if (ev === "play") {                        // distinct games only
        if (Eng.DAILY.seen.indexOf(arg) >= 0) continue;
        Eng.DAILY.seen.push(arg);
        t.prog = Eng.DAILY.seen.length;
      } else if (ev === "coin") t.prog += (arg || 1);
      else t.prog += 1;
      t.prog = Math.min(t.prog, t.goal);
      changed = true;
    }
    if (changed) { Eng.dailySave(); if (window.GameHub && GameHub.refreshDaily) GameHub.refreshDaily(); }
  };
  Eng.claimTask = function (t) {
    if (t.prog < t.goal || t.claimed) return false;
    t.claimed = true; Eng.addCoins(t.reward); Eng.dailySave(); return true;
  };

  window.Eng = Eng;
})();
