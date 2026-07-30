/* hub.js — registry, menu, player/CPU chooser, shop, main loop. */
(function () {
  const W = 960, H = 600;
  const GAMES = [];

  const GameHub = {
    register(def) {
      def.min = def.min || (def.players.includes("1") ? 1 : 2);
      def.max = def.max || (def.players.includes("4") ? 4 : def.min);
      GAMES.push(def);
    },
    games: GAMES, W, H,
  };
  window.GameHub = GameHub;

  // Shared defs: soft shading + a rim light, so icons read as objects not doodles.
  const IDEF = `<defs>
    <radialGradient id="ig" cx="34%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".55"/>
      <stop offset="55%" stop-color="#fff" stop-opacity=".05"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".35"/>
    </radialGradient>
    <linearGradient id="ib" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity=".38"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".28"/>
    </linearGradient>
  </defs>`;

  const ICONS = {
    geometrydash: IDEF + `<rect x="3" y="37" width="42" height="6" rx="2" fill="currentColor" opacity=".45"/><rect x="6" y="19" width="17" height="17" rx="4" fill="currentColor"/><rect x="6" y="19" width="17" height="17" rx="4" fill="url(#ig)"/><circle cx="11.5" cy="26" r="1.9" fill="#0b0e1a"/><circle cx="17.5" cy="26" r="1.9" fill="#0b0e1a"/><path d="M27 37 L34 21 L41 37 Z" fill="currentColor"/><path d="M27 37 L34 21 L41 37 Z" fill="url(#ib)"/>`,
    pong: IDEF + `<ellipse cx="14" cy="21" rx="8" ry="11" fill="currentColor"/><ellipse cx="14" cy="21" rx="8" ry="11" fill="url(#ig)"/><rect x="12" y="30" width="4" height="12" rx="2" fill="#8a6234"/><ellipse cx="34" cy="27" rx="8" ry="11" fill="currentColor" opacity=".75"/><rect x="32" y="36" width="4" height="9" rx="2" fill="#8a6234"/><circle cx="27" cy="12" r="5" fill="#fff"/><circle cx="27" cy="12" r="5" fill="url(#ig)"/>`,
    airhockey: IDEF + `<rect x="7" y="5" width="34" height="38" rx="6" fill="currentColor" opacity=".18"/><rect x="7" y="5" width="34" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="7" y1="24" x2="41" y2="24" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="34" r="6" fill="currentColor"/><circle cx="17" cy="34" r="6" fill="url(#ig)"/><circle cx="31" cy="14" r="6" fill="currentColor"/><circle cx="31" cy="14" r="6" fill="url(#ig)"/><ellipse cx="24" cy="24" rx="4" ry="2.4" fill="#fff" opacity=".8"/>`,
    sumo: IDEF + `<ellipse cx="24" cy="41" rx="19" ry="4" fill="currentColor" opacity=".22"/><circle cx="16" cy="27" r="13" fill="currentColor"/><circle cx="16" cy="27" r="13" fill="url(#ig)"/><circle cx="34" cy="24" r="11" fill="currentColor" opacity=".62"/><circle cx="34" cy="24" r="11" fill="url(#ig)"/><circle cx="11" cy="24" r="3.4" fill="#fdfdff"/><circle cx="20" cy="24" r="3.4" fill="#fdfdff"/><circle cx="11.6" cy="24.4" r="1.6" fill="#0b0e1a"/><circle cx="20.6" cy="24.4" r="1.6" fill="#0b0e1a"/>`,
    tank: IDEF + `<rect x="6" y="24" width="30" height="11" rx="4" fill="currentColor"/><rect x="6" y="24" width="30" height="11" rx="4" fill="url(#ib)"/><rect x="15" y="15" width="15" height="10" rx="3" fill="currentColor"/><rect x="15" y="15" width="15" height="10" rx="3" fill="url(#ig)"/><rect x="29" y="18" width="16" height="4.5" rx="2" fill="currentColor"/><circle cx="12" cy="38" r="4" fill="currentColor"/><circle cx="21" cy="38" r="4" fill="currentColor"/><circle cx="30" cy="38" r="4" fill="currentColor"/><circle cx="12" cy="38" r="1.6" fill="#0b0e1a"/><circle cx="21" cy="38" r="1.6" fill="#0b0e1a"/><circle cx="30" cy="38" r="1.6" fill="#0b0e1a"/>`,
    tron: IDEF + `<path d="M6 42 V20 H26 V32 H41" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".3"/><path d="M6 42 V20 H26 V32 H41" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="35" y="26" width="11" height="11" rx="3" fill="currentColor"/><rect x="35" y="26" width="11" height="11" rx="3" fill="url(#ig)"/><circle cx="43" cy="31.5" r="2" fill="#fff"/>`,
    sword: IDEF + `<path d="M31 8 l5 3 -14 25 -5-3 z" fill="currentColor"/><path d="M31 8 l5 3 -14 25 -5-3 z" fill="url(#ib)"/><path d="M17 8 l-5 3 14 25 5-3 z" fill="currentColor" opacity=".7"/><rect x="17" y="34" width="14" height="4" rx="2" transform="rotate(30 24 36)" fill="#8a6234"/><rect x="17" y="34" width="14" height="4" rx="2" transform="rotate(-30 24 36)" fill="#8a6234"/><circle cx="24" cy="22" r="3" fill="#fff" opacity=".6"/>`,
    soccer: IDEF + `<circle cx="24" cy="25" r="16" fill="#f2f5ff"/><circle cx="24" cy="25" r="16" fill="url(#ig)"/><path d="M24 15 l8.5 6.2 -3.2 10h-10.6l-3.2-10z" fill="currentColor"/><path d="M24 9 v6 M38 20 l-6 2 M33 39 l-3-6 M15 39 l3-6 M10 20 l6 2" stroke="currentColor" stroke-width="2.4"/>`,
    tictactoe: IDEF + `<rect x="5" y="5" width="38" height="38" rx="6" fill="currentColor" opacity=".16"/><path d="M18 7 V41 M30 7 V41 M7 18 H41 M7 30 H41" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M9.5 9.5 l6 6 M15.5 9.5 l-6 6" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="36" cy="36" r="4.4" fill="none" stroke="currentColor" stroke-width="3.4"/><path d="M21.5 21.5 l5 5 M26.5 21.5 l-5 5" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
    sprint: IDEF + `<rect x="9" y="5" width="3.4" height="38" rx="1.7" fill="#8a6234"/><g fill="currentColor"><rect x="13" y="8" width="7" height="7"/><rect x="27" y="8" width="7" height="7"/><rect x="20" y="15" width="7" height="7"/><rect x="34" y="15" width="7" height="7"/><rect x="13" y="22" width="7" height="7"/><rect x="27" y="22" width="7" height="7"/></g><g fill="#f2f5ff"><rect x="20" y="8" width="7" height="7"/><rect x="34" y="8" width="7" height="7"/><rect x="13" y="15" width="7" height="7"/><rect x="27" y="15" width="7" height="7"/><rect x="20" y="22" width="7" height="7"/><rect x="34" y="22" width="7" height="7"/></g>`,
    chicken: IDEF + `<ellipse cx="24" cy="43" rx="14" ry="3" fill="currentColor" opacity=".2"/><rect x="18" y="33" width="2.6" height="8" fill="#e8a33a"/><rect x="26" y="33" width="2.6" height="8" fill="#e8a33a"/><ellipse cx="23" cy="26" rx="14" ry="12" fill="#fdfdff"/><ellipse cx="23" cy="26" rx="14" ry="12" fill="url(#ig)"/><circle cx="33" cy="16" r="7.5" fill="#fdfdff"/><circle cx="33" cy="16" r="7.5" fill="url(#ig)"/><path d="M30 9 q2-5 4 0 q2-5 3.6 .4 v2 h-7.6z" fill="currentColor"/><path d="M40 16 l7 2 -7 2z" fill="#f0a52e"/><circle cx="35" cy="15" r="1.9" fill="#0b0e1a"/><ellipse cx="20" cy="26" rx="6" ry="4.4" fill="#e6e9f5"/>`,
    gunduel: IDEF + `<circle cx="24" cy="24" r="17" fill="currentColor" opacity=".16"/><circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="3.6" fill="currentColor"/><path d="M24 3 v9 M24 36 v9 M3 24 h9 M36 24 h9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    basketball: IDEF + `<rect x="11" y="4" width="26" height="4" rx="2" fill="#e8eeff"/><rect x="18" y="8" width="12" height="8" rx="1.5" fill="none" stroke="#e8eeff" stroke-width="2"/><path d="M17 17 h14 l-3 7 h-8z" fill="#fff" opacity=".55"/><rect x="16" y="15" width="16" height="2.8" rx="1.4" fill="#ff5b3a"/><circle cx="24" cy="32" r="11" fill="currentColor"/><circle cx="24" cy="32" r="11" fill="url(#ig)"/><path d="M13 32 h22 M24 21 v22 M16 24 q8 8 0 16 M32 24 q-8 8 0 16" stroke="#0b0e1a" stroke-width="1.6" fill="none" opacity=".65"/>`,
    penalty: IDEF + `<path d="M5 33 V11 H43 V33" fill="currentColor" opacity=".14"/><path d="M12 11 v22 M20 11 v22 M28 11 v22 M36 11 v22 M5 18 h38 M5 25 h38" stroke="currentColor" stroke-width="1.2" opacity=".8"/><path d="M5 33 V11 H43 V33" fill="none" stroke="#f2f5ff" stroke-width="3.4" stroke-linejoin="round"/><circle cx="24" cy="40" r="5.5" fill="#f2f5ff"/><circle cx="24" cy="40" r="5.5" fill="url(#ig)"/><path d="M24 36.5 l3 2.2 -1.1 3.5h-3.8l-1.1-3.5z" fill="#0b0e1a" opacity=".7"/>`,
    snake: IDEF + `<path d="M7 39 h12 a7 7 0 0 0 0-14 h-7 a7 7 0 0 1 0-14 h14" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/><path d="M7 39 h12 a7 7 0 0 0 0-14 h-7 a7 7 0 0 1 0-14 h14" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="35" cy="11" r="6" fill="currentColor"/><circle cx="35" cy="11" r="6" fill="url(#ig)"/><circle cx="36.5" cy="9.5" r="1.6" fill="#0b0e1a"/><path d="M41 11 l5 -1.5 -5 -1.5z" fill="#ff5b5b"/>`,
    spinners: IDEF + `<ellipse cx="24" cy="43" rx="13" ry="3" fill="currentColor" opacity=".2"/><path d="M24 7 l14 8 v17 l-14 8 -14-8 V15z" fill="currentColor"/><path d="M24 7 l14 8 v17 l-14 8 -14-8 V15z" fill="url(#ig)"/><circle cx="24" cy="23" r="7" fill="#fdfdff"/><circle cx="21.5" cy="22" r="1.7" fill="#0b0e1a"/><circle cx="26.5" cy="22" r="1.7" fill="#0b0e1a"/><path d="M21 26 a3.4 3.4 0 0 0 6 0" fill="none" stroke="#0b0e1a" stroke-width="1.6" stroke-linecap="round"/>`,
    volleyball: IDEF + `<circle cx="24" cy="24" r="17" fill="#f2f5ff"/><circle cx="24" cy="24" r="17" fill="url(#ig)"/><path d="M8 20 q16 -3 32 4 M15 40 q6 -18 -3 -30 M33 40 q-6 -18 3 -30" fill="none" stroke="currentColor" stroke-width="2.6"/>`,
    bowling: IDEF + `<path d="M14 34 q-5 -7 -2 -15 q1.6 -7 4 -12 q2.4 5 4 12 q3 8 -2 15z" fill="#f7f9ff"/><path d="M14 34 q-5 -7 -2 -15 q1.6 -7 4 -12 q2.4 5 4 12 q3 8 -2 15z" fill="url(#ig)"/><ellipse cx="16" cy="16" rx="4.4" ry="1.6" fill="#ff4d4d"/><ellipse cx="16" cy="20" rx="5" ry="1.6" fill="#ff4d4d"/><circle cx="33" cy="31" r="12" fill="currentColor"/><circle cx="33" cy="31" r="12" fill="url(#ig)"/><circle cx="30" cy="27" r="2.1" fill="#0b0e1a"/><circle cx="36" cy="27" r="2.1" fill="#0b0e1a"/><circle cx="32.5" cy="34" r="2.1" fill="#0b0e1a"/>`,
    racing: IDEF + `<ellipse cx="24" cy="41" rx="18" ry="4" fill="currentColor" opacity=".2"/><rect x="6" y="26" width="10" height="8" rx="2.5" fill="#1a1d2a"/><rect x="32" y="26" width="10" height="8" rx="2.5" fill="#1a1d2a"/><rect x="6" y="12" width="10" height="8" rx="2.5" fill="#1a1d2a"/><rect x="32" y="12" width="10" height="8" rx="2.5" fill="#1a1d2a"/><path d="M14 9 h20 l5 8 v14 l-5 8 H14 l-5-8 V17z" fill="currentColor"/><path d="M14 9 h20 l5 8 v14 l-5 8 H14 l-5-8 V17z" fill="url(#ig)"/><rect x="16" y="21" width="16" height="6" rx="2" fill="#10131f"/><circle cx="24" cy="24" r="4.6" fill="#f2f5ff"/><rect x="18" y="4" width="12" height="5" rx="2" fill="#2a2f42"/>`,
    stack: IDEF + `<rect x="10" y="34" width="28" height="9" rx="2.5" fill="currentColor"/><rect x="10" y="34" width="28" height="9" rx="2.5" fill="url(#ib)"/><rect x="13" y="24" width="24" height="9" rx="2.5" fill="currentColor" opacity=".85"/><rect x="13" y="24" width="24" height="9" rx="2.5" fill="url(#ib)"/><rect x="16" y="14" width="19" height="9" rx="2.5" fill="currentColor" opacity=".7"/><rect x="16" y="14" width="19" height="9" rx="2.5" fill="url(#ib)"/><rect x="20" y="4" width="15" height="9" rx="2.5" fill="#f2f5ff"/><rect x="20" y="4" width="15" height="9" rx="2.5" fill="url(#ig)"/>`,
    memory: IDEF + `<rect x="4" y="8" width="19" height="27" rx="3.5" transform="rotate(-8 13.5 21.5)" fill="currentColor" opacity=".35"/><rect x="4" y="8" width="19" height="27" rx="3.5" transform="rotate(-8 13.5 21.5)" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="25" y="13" width="19" height="27" rx="3.5" transform="rotate(7 34.5 26.5)" fill="#f2f5ff"/><rect x="25" y="13" width="19" height="27" rx="3.5" transform="rotate(7 34.5 26.5)" fill="url(#ig)"/><circle cx="34.5" cy="26.5" r="5.5" fill="currentColor"/>`,
  };

  const icon = (id, fallback) =>
    ICONS[id]
      ? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${ICONS[id]}</svg>`
      : (fallback || "");

  let canvas, ctx, input, env;
  let state = "menu";
  let current = null, currentDef = null, currentCount = 1, currentBot = null;
  let last = 0, activeFilter = "All";
  let mode = "quick";                       // 'quick' | 'cup'
  let cup = null;                           // active tournament

  function boot() {
    canvas = document.getElementById("game");
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext("2d");
    input = new Eng.Input(canvas, W, H);

    env = {
      canvas, ctx, W, H, input, players: 1, bot: null,
      exit: exitToMenu, restart: () => launch(currentDef, currentCount, currentBot),
    };

    buildMenu();
    refreshCoins();
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        if (state === "play") exitToMenu();
        else { hideChooser(); closeShop(); }
      }
    });
    document.getElementById("backBtn").addEventListener("click", exitToMenu);
    document.getElementById("chooserCancel").addEventListener("click", hideChooser);
    document.getElementById("shopBtn").addEventListener("click", openShop);
    document.getElementById("shopClose").addEventListener("click", closeShop);
    document.getElementById("modeQuick").addEventListener("click", () => setMode("quick"));
    document.getElementById("modeCup").addEventListener("click", () => setMode("cup"));
    document.getElementById("cupNext").addEventListener("click", cupNext);
    document.getElementById("homeBtn").addEventListener("click", showFront);
    document.querySelectorAll(".frontnav .navbtn").forEach((b) => {
      b.addEventListener("click", () => {
        const go = b.dataset.go;
        leaveFront();
        if (go === "shop") openShop();
        else setMode(go);
      });
    });
    showFront();

    last = performance.now();
    requestAnimationFrame(loop);
  }

  function buildMenu() {
    const tabs = document.getElementById("tabs");
    const grid = document.getElementById("grid");
    const filters = ["All", "1 Player", "2 Players", "Party 3-4"];
    tabs.innerHTML = "";
    filters.forEach((f) => {
      const b = document.createElement("button");
      b.className = "tab" + (f === activeFilter ? " active" : "");
      b.textContent = f;
      b.onclick = () => { activeFilter = f; buildMenu(); };
      tabs.appendChild(b);
    });

    grid.innerHTML = "";
    GAMES.filter((g) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "1 Player") return g.min <= 1 || g.cpu;
      if (activeFilter === "2 Players") return g.min <= 2 && g.max >= 2;
      return g.max >= 3;
    }).forEach((g) => {
      const card = document.createElement("button");
      card.className = "card";
      card.style.setProperty("--c", g.color);
      const range = g.min === g.max ? `${g.min}P` : `${g.min}-${g.max}P`;
      card.innerHTML = `
        <span class="badge">${range}${g.cpu ? " · CPU" : ""}</span>
        <span class="icon">${icon(g.id, g.icon)}</span>
        <span class="name">${g.name}</span>
        <span class="desc">${g.desc || ""}</span>
        <span class="ctrl">${g.controls || ""}</span>`;
      card.onclick = () => choose(g);
      grid.appendChild(card);
    });
  }

  // ---------- front page ----------
  function showFront() {
    dropFocus();
    cup = null;
    document.getElementById("chooser").hidden = true;
    document.getElementById("cup").hidden = true;
    document.getElementById("shop").hidden = true;
    document.body.classList.add("onfront");
    refreshCoins();
    buildDaily();
    if (window.FrontPage) FrontPage.start();
  }
  function buildDaily() {
    const list = document.getElementById("dailyList");
    if (!list) return;
    list.innerHTML = "";
    Eng.DAILY.tasks.forEach((t) => {
      const done = t.prog >= t.goal;
      const row = document.createElement("div");
      row.className = "dailyrow" + (t.claimed ? " claimed" : done ? " ready" : "");
      row.innerHTML = `
        <span class="dtext">${t.desc}</span>
        <span class="dbar"><i style="width:${Math.round((t.prog / t.goal) * 100)}%"></i></span>
        <span class="dprog">${Math.min(t.prog, t.goal)}/${t.goal}</span>`;
      const btn = document.createElement("button");
      btn.className = "dclaim";
      btn.textContent = t.claimed ? "✓ Claimed" : done ? `Claim ${COIN_SM}${t.reward}`.replace(/<[^>]+>/g, "") : `+${t.reward}`;
      if (t.claimed) btn.innerHTML = "✓ Claimed";
      else if (done) btn.innerHTML = `Claim ${COIN_SM}${t.reward}`;
      else btn.innerHTML = `${COIN_SM}${t.reward}`;
      btn.disabled = !done || t.claimed;
      btn.onclick = () => { if (Eng.claimTask(t)) { buildDaily(); refreshCoins(); } };
      row.appendChild(btn);
      list.appendChild(row);
    });
  }
  GameHub.refreshDaily = buildDaily;

  function leaveFront() {
    document.body.classList.remove("onfront");
    if (window.FrontPage) FrontPage.stop();
  }

  // ---------- modes ----------
  function setMode(m) {
    mode = m;
    document.getElementById("modeQuick").classList.toggle("active", m === "quick");
    document.getElementById("modeCup").classList.toggle("active", m === "cup");
    document.querySelector(".tagline").textContent = m === "cup"
      ? "Tournament — 5 random games, 3/2/1/0 points each, most points is champion"
      : "Mini-game arcade — grab a friend & pick one";
    if (m === "cup") startCupSetup(); else { cup = null; buildMenu(); }
  }

  // Tournament: ask player count, then whether the empty slots are CPUs.
  function startCupSetup() {
    const modal = document.getElementById("chooser");
    document.getElementById("chooserTitle").textContent = "Tournament";
    document.getElementById("chooserHint").textContent = "How many players?";
    const box = document.getElementById("chooserBtns");
    box.innerHTML = "";
    for (let n = 1; n <= 4; n++) {
      const b = mkBtn(Eng.PLAYERS[n - 1].color, n, `player${n > 1 ? "s" : ""}`);
      b.onclick = () => (n < 4 ? askRobots(n) : askLength(4, 0));
      box.appendChild(b);
    }
    modal.hidden = false;
  }
  function askRobots(n) {
    const box = document.getElementById("chooserBtns");
    document.getElementById("chooserHint").textContent =
      `${n} human${n > 1 ? "s" : ""} — fill the rest with robots?`;
    box.innerHTML = "";
    const no = mkBtn(Eng.PLAYERS[n - 1].color, n, n === 1 ? "solo (practice)" : "just us");
    no.onclick = () => askLength(n, 0);
    box.appendChild(no);
    for (let r = 1; r <= 4 - n; r++) {
      const b = mkBtn("#9d7bff", "🤖" + r, `+${r} robot${r > 1 ? "s" : ""}`);
      b.onclick = () => askLength(n + r, r);
      box.appendChild(b);
    }
  }
  // how long should the cup be?
  function askLength(total, robots) {
    const box = document.getElementById("chooserBtns");
    document.getElementById("chooserHint").textContent = "How many games?";
    box.innerHTML = "";
    [[5, "short"], [8, "medium"], [9, "long"]].forEach(([n, label]) => {
      const b = mkBtn("#ffd24d", n, label);
      b.onclick = () => beginCup(total, robots, n);
      box.appendChild(b);
    });
  }

  function beginCup(total, robots, count) {
    hideChooser();
    const pool = GAMES.filter((g) => g.min <= total && g.max >= total && !g.selfSelect);
    const picks = [];
    let bag = pool.slice();
    for (let i = 0; i < count; i++) {
      if (!bag.length) bag = pool.slice();                  // reshuffle if we run out
      if (!bag.length) break;
      picks.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
    cup = {
      total, robots, games: picks, round: 0,
      points: Object.fromEntries(Eng.PLAYERS.slice(0, total).map((p) => [p.id, 0])),
    };
    Eng.resetSession();
    showCupBoard(true);
  }

  function showCupBoard(first) {
    const modal = document.getElementById("cup");
    const done = cup.round >= cup.games.length;
    const solo = cup.total === 1;
    document.getElementById("cupTitle").textContent =
      done ? (solo ? "Run complete" : "🏆 Champion!") : (solo ? "Solo run" : "Tournament");
    document.getElementById("cupHint").textContent = done
      ? (solo ? "Practice run finished — no title with one player." : `${champion().name} wins the cup!`)
      : `Game ${cup.round + 1} of ${cup.games.length} — ${cup.games[cup.round].name}`
        + (solo ? "  ·  practice, nothing to win" : "");

    const board = document.getElementById("cupBoard");
    board.innerHTML = "";
    Eng.PLAYERS.slice(0, cup.total)
      .slice().sort((a, b) => cup.points[b.id] - cup.points[a.id])
      .forEach((p, i) => {
        const isBot = p.id > cup.total - cup.robots;
        const row = document.createElement("div");
        row.className = "cuprow"; row.style.setProperty("--c", p.color);
        row.innerHTML = `<span class="cuppos">${i + 1}</span>
          <span class="cupname">${isBot ? "🤖 " : ""}${p.name}</span>
          <span class="cuppts">${cup.points[p.id]} pts</span>`;
        board.appendChild(row);
      });
    document.getElementById("cupNext").textContent = done
      ? "Back to menu" : first ? `Start: ${cup.games[0].name} →` : `Next: ${cup.games[cup.round].name} →`;
    modal.hidden = false;
  }
  function champion() {
    const ids = Object.keys(cup.points).sort((a, b) => cup.points[b] - cup.points[a]);
    return Eng.PLAYERS[+ids[0] - 1];
  }
  function cupNext() {
    document.getElementById("cup").hidden = true;
    if (cup.round >= cup.games.length) { cup = null; showFront(); return; }
    const def = cup.games[cup.round];
    go(def, cup.total, cup.robots ? { diff: "normal" } : null);
  }
  // called when a game reports its final ranking
  function cupRecord(ranking) {
    if (!cup) return;
    ranking.forEach((r, i) => {
      cup.points[r.b.id] = (cup.points[r.b.id] || 0) + ([3, 2, 1, 0][i] || 0);
    });
    cup.round++;
    if (cup.round >= cup.games.length) Eng.track("cup");
    exitToMenu();
    showCupBoard(false);
  }
  GameHub.cupActive = () => !!cup;
  GameHub.cupRecord = cupRecord;

  // ---------- chooser (player count + optional CPU difficulty) ----------
  const go = (def, count, bot) => brief(def, count, bot, () => launch(def, count, bot));

  function choose(def) {
    if (def.selfSelect) { go(def, def.min, null); return; }
    const needCount = def.max > def.min;
    if (!needCount && !def.cpu) { go(def, def.min, null); return; }

    const modal = document.getElementById("chooser");
    document.getElementById("chooserTitle").textContent = def.name;
    const box = document.getElementById("chooserBtns");
    box.innerHTML = "";

    if (needCount) {
      document.getElementById("chooserHint").textContent = "How many players?";
      for (let n = def.min; n <= def.max; n++) {
        const b = mkBtn(Eng.PLAYERS[n - 1].color, n, `player${n > 1 ? "s" : ""}`);
        b.onclick = () => { hideChooser(); go(def, n, null); };
        box.appendChild(b);
      }
      if (def.cpu) {
        const b = mkBtn("#9d7bff", "🤖", "vs CPU");
        b.onclick = () => openCpu(def);
        box.appendChild(b);
      }
    } else {
      // 2-player game: choose human or CPU difficulty
      document.getElementById("chooserHint").textContent = "Choose your opponent";
      const h = mkBtn(Eng.PLAYERS[1].color, "2", "players");
      h.onclick = () => { hideChooser(); go(def, 2, null); };
      box.appendChild(h);
      ["Easy", "Normal", "Hard"].forEach((d) => {
        const b = mkBtn("#9d7bff", "🤖", d);
        b.onclick = () => { hideChooser(); go(def, 2, { diff: d.toLowerCase() }); };
        box.appendChild(b);
      });
    }
    modal.hidden = false;
  }
  function openCpu(def) {
    const box = document.getElementById("chooserBtns");
    document.getElementById("chooserHint").textContent = "CPU difficulty";
    box.innerHTML = "";
    ["Easy", "Normal", "Hard"].forEach((d) => {
      const b = mkBtn("#9d7bff", "🤖", d);
      b.onclick = () => { hideChooser(); go(def, def.max, { diff: d.toLowerCase() }); };
      box.appendChild(b);
    });
  }
  function mkBtn(color, big, sub) {
    const b = document.createElement("button");
    b.className = "pbtn";
    b.style.setProperty("--c", color);
    b.innerHTML = `<span class="big">${big}</span><span>${sub}</span>`;
    return b;
  }
  function hideChooser() {
    document.getElementById("chooser").hidden = true;
    document.getElementById("chooserBtns").innerHTML = "";   // drop stale handlers
  }

  // ---------- shop ----------
  const COIN = `<span class="mcoin">M</span>`;
  const COIN_SM = `<span class="mcoin sm">M</span>`;
  function refreshCoins() {
    const c = `${COIN}${Eng.coins()}`;
    ["coinBal", "shopCoins", "coinBalFront"].forEach((id) => {
      const el = document.getElementById(id); if (el) el.innerHTML = c;
    });
  }
  function openShop() { buildShop(); refreshCoins(); document.getElementById("shop").hidden = false; }
  function closeShop() {
    document.getElementById("shop").hidden = true;
    refreshCoins();
    if (!document.body.classList.contains("playing")) showFront();
  }
  function buildShop() {
    const grid = document.getElementById("shopGrid");
    grid.innerHTML = "";
    const section = (title, color, iconHTML, list) => {
      if (!list.length) return;
      const h = document.createElement("h3");
      h.className = "shopcat"; h.style.setProperty("--c", color);
      h.innerHTML = `<span class="catico">${iconHTML}</span> ${title}`;
      grid.appendChild(h);
      list.forEach((it) => grid.appendChild(itemCard(it)));
    };
    const ITEMS = window.SHOP_ITEMS || [];
    // stickman customisation first — it applies everywhere
    section("Stickman — Hats", "#ffd24d",
      `<svg viewBox="0 0 48 48" fill="currentColor"><ellipse cx="24" cy="32" rx="20" ry="5"/><path d="M13 30 q1-18 11-18 t11 18 z"/></svg>`,
      ITEMS.filter((i) => i.game === "hat"));
    const SVG_HAIR = `<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="24" cy="30" r="12" fill="none" stroke="currentColor" stroke-width="3"/><path d="M11 26 q3-16 13-16 t13 16 q-6-7-13-7 t-13 7z"/></svg>`;
    const SVG_TOP = `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M17 10 l7 4 7-4 8 5-4 8-4-2v17H17V21l-4 2-4-8z"/></svg>`;
    const SVG_LEGS = `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M14 8h20l2 32h-9l-3-19-3 19h-9z"/></svg>`;
    section("Stickman — Tops", "#4dff9e", SVG_TOP, ITEMS.filter((i) => i.game === "top"));
    section("Stickman — Legwear", "#4dc4ff", SVG_LEGS, ITEMS.filter((i) => i.game === "legs"));
    section("Stickman — Hair", "#ff8a3a", SVG_HAIR, ITEMS.filter((i) => i.game === "hair"));
    section("Stickman — Hair Colour", "#ffd24d", SVG_HAIR, ITEMS.filter((i) => i.game === "haircol"));
    GAMES.forEach((g) =>
      section(g.name, g.color, icon(g.id, g.icon), ITEMS.filter((it) => it.game === g.id)));
  }

  function itemCard(it) {
    const card = document.createElement("div");
    card.className = "shopitem"; card.style.setProperty("--c", it.color || "#8fa4d6");
    const owned = Eng.isOwned(it), eq = Eng.isEquipped(it);
    const cv = document.createElement("canvas");
    cv.className = "preview"; cv.width = 200; cv.height = 120;
    drawPreview(cv.getContext("2d"), it);
    card.appendChild(cv);
    const nm = document.createElement("span");
    nm.className = "iname"; nm.textContent = it.name;
    card.appendChild(nm);
    const b = document.createElement("button");
    b.className = "buybtn " + (eq ? "eq" : owned ? "own" : "");
    b.innerHTML = eq ? "✓ Equipped" : owned ? "Equip" : `Buy ${COIN_SM}${it.price}`;
    b.onclick = () => {
      if (Eng.isEquipped(it)) return;
      if (Eng.isOwned(it)) Eng.equipItem(it);
      else if (!Eng.buyItem(it)) { b.innerHTML = `Need more ${COIN_SM}`; b.classList.add("nope"); return; }
      buildShop(); refreshCoins();
    };
    card.appendChild(b);
    return card;
  }

  /* Draw the actual item so you see what you're buying. */
  function drawPreview(c, it) {
    const W2 = 200, H2 = 120, cx = W2 / 2, cy = H2 / 2;
    c.fillStyle = "#0b1020"; c.fillRect(0, 0, W2, H2);
    // faint tech-board grid behind every preview
    c.strokeStyle = "rgba(255,255,255,0.05)"; c.lineWidth = 1;
    for (let x = 0; x < W2; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H2); c.stroke(); }
    for (let y = 0; y < H2; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W2, y); c.stroke(); }
    const col = it.color || "#8fa4d6";

    switch (it.kind) {
      case "cube": {
        c.save(); c.translate(cx, cy); c.rotate(-0.22);
        c.shadowColor = col; c.shadowBlur = 22;
        const g = c.createLinearGradient(-30, -30, 30, 30);
        g.addColorStop(0, "#fff"); g.addColorStop(1, col);
        c.fillStyle = g; Eng.roundRect(c, -30, -30, 60, 60, 9); c.fill();
        c.shadowBlur = 0; c.fillStyle = "#16244a";
        c.beginPath(); c.arc(-9, -4, 4.5, 0, 7); c.arc(9, -4, 4.5, 0, 7); c.fill();
        c.lineWidth = 3; c.strokeStyle = "#16244a"; c.lineCap = "round";
        c.beginPath(); c.arc(0, 2, 10, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        c.restore(); break;
      }
      case "ball": Art.ball(c, cx, cy, 26, "plain", col); break;
      case "basketball": Art.ball(c, cx, cy, 28, "basket", col); break;
      case "volleyball": Art.ball(c, cx, cy, 28, "volley", col); break;
      case "soccerball": Art.ball(c, cx, cy, 28, "soccer", col); break;
      case "bowlball": Art.ball(c, cx, cy, 30, "bowl", col); break;
      case "puck":
        c.fillStyle = col; c.strokeStyle = Art.OUT; c.lineWidth = 3;
        c.beginPath(); c.ellipse(cx, cy + 6, 34, 13, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = "rgba(255,255,255,0.25)";
        c.beginPath(); c.ellipse(cx, cy - 2, 34, 13, 0, 0, 7); c.fill();
        c.strokeStyle = Art.OUT; c.stroke(); break;
      case "pellet":
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 20;
        c.beginPath(); c.arc(cx, cy, 17, 0, 7); c.fill(); c.shadowBlur = 0; break;
      case "shell":
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 18;
        c.beginPath(); c.arc(cx + 10, cy, 9, 0, 7); c.fill();
        c.shadowBlur = 0; c.globalAlpha = 0.5;
        c.beginPath(); c.moveTo(cx - 34, cy); c.lineTo(cx + 4, cy - 6); c.lineTo(cx + 4, cy + 6); c.fill();
        c.globalAlpha = 1; break;
      case "trail":
        c.strokeStyle = col; c.lineWidth = 12; c.lineCap = "round"; c.lineJoin = "round";
        c.shadowColor = col; c.shadowBlur = 18;
        c.beginPath(); c.moveTo(28, 90); c.lineTo(28, 52); c.lineTo(96, 52); c.lineTo(96, 78); c.lineTo(164, 78); c.stroke();
        c.shadowBlur = 0; c.fillStyle = "#fff";
        c.beginPath(); c.arc(164, 78, 8, 0, 7); c.fill(); break;
      case "blade": {
        c.save(); c.translate(cx, cy); c.rotate(-0.7);
        if (it.extra === "fire") { c.shadowColor = "#ff7a3a"; c.shadowBlur = 26; }
        if (it.extra === "ice") { c.shadowColor = "#7ce8ff"; c.shadowBlur = 24; }
        if (it.extra === "venom") { c.shadowColor = "#7dff4d"; c.shadowBlur = 24; }
        if (it.extra === "shadow") { c.shadowColor = "#b46bff"; c.shadowBlur = 26; }
        const bg = c.createLinearGradient(0, -44, 0, 26);
        bg.addColorStop(0, "#ffffff"); bg.addColorStop(1, col);
        c.fillStyle = bg; c.strokeStyle = Art.OUT; c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(0, -46); c.lineTo(7, -30); c.lineTo(7, 20); c.lineTo(-7, 20); c.lineTo(-7, -30);
        c.closePath(); c.fill(); c.stroke();
        c.shadowBlur = 0;
        c.fillStyle = "#8a6234";
        c.beginPath(); c.rect(-16, 20, 32, 7); c.fill(); c.stroke();
        c.beginPath(); c.rect(-5, 27, 10, 20); c.fill(); c.stroke();
        c.restore(); break;
      }
      case "tank": {
        c.save(); c.translate(cx, cy + 6);
        c.fillStyle = "#2a2f42"; c.strokeStyle = Art.OUT; c.lineWidth = 2.5;
        [-1, 1].forEach((s) => { Eng.roundRect(c, -34, s * 20 - 6, 68, 11, 4); c.fill(); c.stroke(); });
        c.fillStyle = col; c.strokeStyle = Art.OUT; c.lineWidth = 3;
        Eng.roundRect(c, -32, -18, 64, 36, 6); c.fill(); c.stroke();
        if (it.extra === "camo") {
          c.fillStyle = "rgba(0,0,0,0.3)";
          [[-14, -6, 10], [6, 7, 9], [16, -8, 7]].forEach(([bx, by, br]) => {
            c.beginPath(); c.ellipse(bx, by, br, br * 0.7, 0.4, 0, 7); c.fill();
          });
        }
        c.fillStyle = "#3a4160"; c.strokeStyle = Art.OUT; c.lineWidth = 2.5;
        Eng.roundRect(c, 20, -5, 40, 10, 4); c.fill(); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill(); c.stroke();
        c.fillStyle = "#8fa4d6"; c.beginPath(); c.arc(0, -3, 8, 0, 7); c.fill(); c.stroke();
        c.fillStyle = Art.OUT; c.beginPath(); c.ellipse(0, -9, 10, 3.4, 0, 0, 7); c.fill();
        c.beginPath(); c.arc(-3, -2.5, 1.7, 0, 7); c.arc(3, -2.5, 1.7, 0, 7); c.fill();
        c.restore(); break;
      }
      case "racecar": {
        const bodyC = col || "#8fa4d6";
        c.save(); c.translate(cx, cy);
        c.fillStyle = "#1a1d2a";
        [[-18, -17], [-18, 17], [20, -17], [20, 17]].forEach(([wx, wy]) => {
          Eng.roundRect(c, wx - 7, wy - 6, 15, 12, 3); c.fill();
        });
        c.fillStyle = bodyC; c.strokeStyle = Art.OUT; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-32, -16); c.lineTo(18, -16); c.lineTo(36, -7);
        c.lineTo(36, 7); c.lineTo(18, 16); c.lineTo(-32, 16);
        c.closePath(); c.fill(); c.stroke();
        if (it.extra === "stripe") { c.fillStyle = "rgba(255,255,255,0.78)"; c.fillRect(-29, -5, 60, 10); }
        c.fillStyle = "#2a2f42"; c.strokeStyle = Art.OUT; c.lineWidth = 2.5;
        Eng.roundRect(c, -38, -19, 8, 38, 3); c.fill(); c.stroke();
        c.fillStyle = "#10131f"; c.beginPath(); c.ellipse(0, 0, 13, 11, 0, 0, 7); c.fill();
        c.fillStyle = "#8fa4d6"; c.strokeStyle = Art.OUT; c.lineWidth = 2.4;
        c.beginPath(); c.arc(0, -1, 8, 0, 7); c.fill(); c.stroke();
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.beginPath(); c.arc(0, -3, 4.4, Math.PI * 0.1, Math.PI * 0.9); c.fill();
        c.restore(); break;
      }
      case "table": {
        c.fillStyle = col; c.fillRect(0, 0, W2, H2);
        c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 3;
        c.strokeRect(16, 10, W2 - 32, H2 - 20);
        c.beginPath(); c.moveTo(16, H2 / 2); c.lineTo(W2 - 16, H2 / 2); c.stroke();
        c.beginPath(); c.arc(cx, H2 / 2, 20, 0, 7); c.stroke();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(cx, H2 / 2, 7, 0, 7); c.fill();
        break;
      }
      case "slab": {
        [0, 1, 2].forEach((k) => {
          const w = 96 - k * 16, y = cy + 24 - k * 24;
          c.fillStyle = col; Eng.roundRect(c, cx - w / 2, y, w, 20, 5); c.fill();
          c.fillStyle = "rgba(255,255,255,0.24)"; Eng.roundRect(c, cx - w / 2, y, w, 6, 3); c.fill();
          c.fillStyle = "rgba(0,0,0,0.22)"; Eng.roundRect(c, cx - w / 2, y + 14, w, 5, 3); c.fill();
        });
        break;
      }
      case "ring":
        c.strokeStyle = col; c.lineWidth = 9; c.shadowColor = col; c.shadowBlur = 22;
        c.beginPath(); c.arc(cx, cy, 40, 0, 7); c.stroke(); c.shadowBlur = 0;
        c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 2;
        c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.stroke(); break;
      case "board":
        c.strokeStyle = col; c.lineWidth = 7; c.lineCap = "round";
        [-18, 18].forEach((o) => {
          c.beginPath(); c.moveTo(cx + o, cy - 38); c.lineTo(cx + o, cy + 38); c.stroke();
          c.beginPath(); c.moveTo(cx - 38, cy + o); c.lineTo(cx + 38, cy + o); c.stroke();
        }); break;
      case "cardback":
        c.fillStyle = col; c.strokeStyle = "rgba(255,255,255,0.3)"; c.lineWidth = 2;
        Eng.roundRect(c, cx - 30, cy - 40, 60, 80, 9); c.fill(); c.stroke();
        c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 3;
        for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx - 20, cy + k * 13); c.lineTo(cx + 20, cy + k * 13); c.stroke(); }
        break;
      case "track":
      case "scene": {
        const g2 = c.createLinearGradient(0, 0, 0, H2);
        g2.addColorStop(0, col); g2.addColorStop(1, "#0a0d16");
        c.fillStyle = g2; c.fillRect(0, 0, W2, H2);
        Art.stickman(c, cx, H2 - 22, { color: "#e8ecff", scale: 0.9, pose: "run", t: 1.2 });
        break;
      }
      case "chicken":
        Art.chicken(c, cx - 6, cy + 30, 1.5, col, 0.4, 1); break;
      case "stickman": {
        // show the item on a mannequin, keeping whatever else is equipped
        const st = window.stickmanStyle();
        const o = {
          noStyle: true, color: "#8fa4d6", scale: 1.4, pose: "idle", t: 0,
          hat: st.hat, hatColor: st.hatColor,
          hair: st.hair, hairColor: st.hairColor,
          top: st.top, topColor: st.topColor,
          legs: st.legs, legsColor: st.legsColor,
        };
        if (it.game === "hat") { o.hat = it.extra; o.hatColor = it.color; }
        // a hat would cover the hair, so drop it while browsing hairstyles
        if (it.game === "hair") { o.hair = it.extra; o.hat = ""; }
        if (it.game === "top") { o.top = it.extra; o.topColor = it.color; }
        if (it.game === "legs") { o.legs = it.extra; o.legsColor = it.color; }
        Art.stickman(c, cx, H2 - 12, o);
        break;
      }
      case "haircolor": {
        // same mannequin, but force a visible style so the colour reads
        const st = window.stickmanStyle();
        Art.stickman(c, cx, H2 - 12, {
          noStyle: true, color: "#8fa4d6", scale: 1.4, pose: "idle", t: 0,
          hat: "",                                  // hat would hide the colour
          hair: st.hair && st.hair !== "" ? st.hair : "bangs", hairColor: col,
          top: st.top, topColor: st.topColor, legs: st.legs, legsColor: st.legsColor,
        });
        break;
      }
      default:
        c.fillStyle = col; Eng.roundRect(c, cx - 40, cy - 24, 80, 48, 10); c.fill();
    }
  }

  // ---------- launch / loop ----------
  // Space/Enter are gameplay keys — if a menu button keeps focus the browser
  // re-activates it on the next press, so drop focus whenever we change screen.
  function dropFocus() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  // Show what each player presses, then start on any key/click.
  function brief(def, count, bot, go) {
    dropFocus();
    leaveFront();
    document.getElementById("shop").hidden = true;
    document.getElementById("chooser").hidden = true;
    document.getElementById("briefTitle").textContent = def.name;
    document.getElementById("briefDesc").textContent = def.desc || "";
    const rows = document.getElementById("briefRows");
    rows.innerHTML = "";
    const KEY = { Space: "Space", Enter: "Enter", KeyB: "B", KeyO: "O" };
    const humans = count - (bot ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const b = Eng.PLAYERS[i];
      const isBot = bot && i >= humans;
      const row = document.createElement("div");
      row.className = "briefrow"; row.style.setProperty("--c", b.color);
      row.innerHTML = isBot
        ? `<span class="bname">🤖 ${b.name}</span><span class="bkeys">CPU (${bot.diff})</span>`
        : `<span class="bname">${b.name}</span><span class="bkeys">${b.keys.replace("+", "·")}
             <em>${KEY[b.action] || ""}</em></span>`;
      rows.appendChild(row);
    }
    const extra = document.createElement("p");
    extra.className = "hint";
    extra.textContent = def.controls || "";
    rows.appendChild(extra);

    const modal = document.getElementById("brief");
    modal.hidden = false;
    const start = (e) => {
      if (e && e.type === "keydown" && e.code === "Escape") return;
      window.removeEventListener("keydown", start);
      modal.removeEventListener("click", start);
      modal.hidden = true;
      go();
    };
    window.addEventListener("keydown", start);
    modal.addEventListener("click", start);
  }

  function launch(def, count, bot) {
    dropFocus();
    // make sure no overlay is left covering the canvas
    leaveFront();
    document.getElementById("shop").hidden = true;
    document.getElementById("chooser").hidden = true;
    document.getElementById("brief").hidden = true;
    // don't let the click/keypress that started the game leak into its first frame
    input.justP = {};
    input.pointer.pressed = false;
    input.pointer.down = false;
    if (current && current.destroy) current.destroy();
    currentDef = def; currentCount = count; currentBot = bot;
    env.players = count; env.bot = bot;
    current = def.create(env);
    Eng.track("play", def.id);
    state = "play";
    document.body.classList.add("playing");
    let label = def.name;
    if (bot) label += `  ·  vs CPU (${bot.diff})`;
    else if (count > 1 && !def.selfSelect) label += `  ·  ${count}P`;
    document.getElementById("gameTitle").textContent = label;
    last = performance.now();
  }

  function exitToMenu() {
    dropFocus();
    if (current && current.destroy) current.destroy();
    current = null; currentDef = null;
    state = "menu";
    document.body.classList.remove("playing");
    refreshCoins();
  }

  function loop(t) {
    let dt = (t - last) / 1000; last = t;
    if (dt > 0.05) dt = 0.05;
    if (state === "play" && current) {
      current.update(dt);
      ctx.clearRect(0, 0, W, H);
      current.render(ctx);
    }
    input.endFrame();
    requestAnimationFrame(loop);
  }

  window.addEventListener("load", boot);
})();
