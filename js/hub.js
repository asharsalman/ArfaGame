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

  const ICONS = {
    geometrydash: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="5" y="20" width="15" height="15" rx="3"/><circle cx="12.5" cy="26" r="2" fill="#0b0e1a"/><path d="M25 35 L33 19 L41 35 Z"/><rect x="2" y="36" width="44" height="3" rx="1.5"/></svg>`,
    pong: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="6" y="13" width="5" height="22" rx="2.5"/><rect x="37" y="13" width="5" height="22" rx="2.5"/><circle cx="24" cy="24" r="4.5"/><rect x="22.5" y="6" width="3" height="36" rx="1.5" opacity=".35"/></svg>`,
    airhockey: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><rect x="7" y="6" width="34" height="36" rx="5"/><line x1="7" y1="24" x2="41" y2="24"/><circle cx="24" cy="24" r="4"/><circle cx="18" cy="34" r="5" fill="currentColor" stroke="none"/><circle cx="30" cy="14" r="5" fill="currentColor" stroke="none"/></svg>`,
    sumo: `<svg viewBox="0 0 48 48" fill="currentColor"><circle cx="17" cy="27" r="12"/><circle cx="33" cy="22" r="10" opacity=".55"/><circle cx="13" cy="25" r="2" fill="#0b0e1a"/><circle cx="21" cy="25" r="2" fill="#0b0e1a"/></svg>`,
    tank: `<svg viewBox="0 0 48 48" fill="currentColor"><rect x="7" y="25" width="29" height="10" rx="3"/><rect x="16" y="17" width="14" height="9" rx="2"/><rect x="29" y="19" width="15" height="4" rx="2"/><circle cx="13" cy="38" r="3"/><circle cx="22" cy="38" r="3"/><circle cx="31" cy="38" r="3"/></svg>`,
    tron: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 41 V19 H25 V31 H40"/><circle cx="40" cy="31" r="4" fill="currentColor"/></svg>`,
    sword: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M11 40 L33 11"/><path d="M37 40 L15 11"/><path d="M9 38 l4 4 M39 38 l-4 4"/></svg>`,
    soccer: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="24" r="16"/><path d="M24 14 l9 6.6 -3.5 10.4 h-11 l-3.5 -10.4 z" fill="currentColor" stroke="none"/></svg>`,
    tictactoe: `<svg viewBox="0 0 48 48" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"><path d="M19 7 V41 M30 7 V41 M7 19 H41 M7 30 H41"/><path d="M10 10 l5 5 M15 10 l-5 5"/><circle cx="35.5" cy="35.5" r="4.2"/></svg>`,
    sprint: `<svg viewBox="0 0 48 48" stroke="currentColor" stroke-width="3" fill="currentColor"><line x1="11" y1="6" x2="11" y2="43" stroke="currentColor" stroke-linecap="round"/><rect x="14" y="9" width="6" height="6"/><rect x="26" y="9" width="6" height="6"/><rect x="20" y="15" width="6" height="6"/><rect x="32" y="15" width="6" height="6"/><rect x="14" y="21" width="6" height="6"/><rect x="26" y="21" width="6" height="6"/></svg>`,
    chicken: `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M17 9 q2 -5 4 0 q2 -5 4 0 v5 h-8 z" fill="#ff4d4d"/><ellipse cx="22" cy="30" rx="14" ry="13"/><circle cx="17" cy="26" r="2.4" fill="#0b0e1a"/><path d="M8 28 l-6 2.5 6 2.5 z" fill="#ffb84d"/></svg>`,
    gunduel: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="4.5" fill="currentColor" stroke="none"/><path d="M24 4 v8 M24 36 v8 M4 24 h8 M36 24 h8" stroke-linecap="round"/></svg>`,
    basketball: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="28" r="13"/><path d="M11 28 h26 M24 15 v26 M15 19 q9 9 0 18 M33 19 q-9 9 0 18"/><rect x="12" y="5" width="24" height="3" rx="1.5" fill="currentColor" stroke="none"/></svg>`,
    penalty: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M6 34 V12 H42 V34"/><path d="M14 12 v22 M24 12 v22 M34 12 v22 M6 20 h36 M6 27 h36" stroke-width="1.5"/><circle cx="24" cy="40" r="4.5" fill="currentColor" stroke="none"/></svg>`,
    snake: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 38 h12 a6 6 0 0 0 0-12 h-8 a6 6 0 0 1 0-12 h16"/><circle cx="38" cy="14" r="4" fill="currentColor"/></svg>`,
    spinners: `<svg viewBox="0 0 48 48" fill="currentColor"><path d="M24 8 l13 8 v16 l-13 8 -13-8 V16 z" opacity=".85"/><circle cx="24" cy="24" r="6" fill="#0b0e1a"/><path d="M24 3 a21 21 0 0 1 15 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
    volleyball: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><circle cx="24" cy="24" r="16"/><path d="M24 8 q-8 16 4 32 M8 20 q16 -2 30 10 M40 18 q-16 4 -22 21"/></svg>`,
    bowling: `<svg viewBox="0 0 48 48" fill="currentColor"><ellipse cx="16" cy="22" rx="7" ry="13"/><rect x="13" y="12" width="6" height="3" fill="#0b0e1a"/><circle cx="34" cy="32" r="11"/><circle cx="31" cy="29" r="2" fill="#0b0e1a"/><circle cx="37" cy="29" r="2" fill="#0b0e1a"/><circle cx="34" cy="35" r="2" fill="#0b0e1a"/></svg>`,
    memory: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><rect x="5" y="9" width="17" height="24" rx="3"/><rect x="26" y="15" width="17" height="24" rx="3" fill="currentColor" fill-opacity=".25"/><circle cx="13.5" cy="21" r="4" fill="currentColor" stroke="none"/></svg>`,
  };

  let canvas, ctx, input, env;
  let state = "menu";
  let current = null, currentDef = null, currentCount = 1, currentBot = null;
  let last = 0, activeFilter = "All";

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
        <span class="icon">${ICONS[g.id] || g.icon}</span>
        <span class="name">${g.name}</span>
        <span class="desc">${g.desc || ""}</span>
        <span class="ctrl">${g.controls || ""}</span>`;
      card.onclick = () => choose(g);
      grid.appendChild(card);
    });
  }

  // ---------- chooser (player count + optional CPU difficulty) ----------
  function choose(def) {
    if (def.selfSelect) { launch(def, def.min, null); return; }
    const needCount = def.max > def.min;
    if (!needCount && !def.cpu) { launch(def, def.min, null); return; }

    const modal = document.getElementById("chooser");
    document.getElementById("chooserTitle").textContent = def.name;
    const box = document.getElementById("chooserBtns");
    box.innerHTML = "";

    if (needCount) {
      document.getElementById("chooserHint").textContent = "How many players?";
      for (let n = def.min; n <= def.max; n++) {
        const b = mkBtn(Eng.PLAYERS[n - 1].color, n, `player${n > 1 ? "s" : ""}`);
        b.onclick = () => { hideChooser(); launch(def, n, null); };
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
      h.onclick = () => { hideChooser(); launch(def, 2, null); };
      box.appendChild(h);
      ["Easy", "Normal", "Hard"].forEach((d) => {
        const b = mkBtn("#9d7bff", "🤖", d);
        b.onclick = () => { hideChooser(); launch(def, 2, { diff: d.toLowerCase() }); };
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
      b.onclick = () => { hideChooser(); launch(def, def.max, { diff: d.toLowerCase() }); };
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
  function hideChooser() { document.getElementById("chooser").hidden = true; }

  // ---------- shop ----------
  function refreshCoins() {
    const c = `🪙 ${Eng.coins()}`;
    const a = document.getElementById("coinBal"); if (a) a.textContent = c;
    const b = document.getElementById("shopCoins"); if (b) b.textContent = c;
  }
  function openShop() { buildShop(); refreshCoins(); document.getElementById("shop").hidden = false; }
  function closeShop() { document.getElementById("shop").hidden = true; refreshCoins(); }
  function buildShop() {
    const grid = document.getElementById("shopGrid");
    grid.innerHTML = "";
    GAMES.forEach((g) => {
      const list = (window.SHOP_ITEMS || []).filter((it) => it.game === g.id);
      if (!list.length) return;
      const h = document.createElement("h3");
      h.className = "shopcat"; h.style.setProperty("--c", g.color);
      h.innerHTML = `<span class="catico">${ICONS[g.id] || g.icon}</span> ${g.name}`;
      grid.appendChild(h);
      list.forEach((it) => grid.appendChild(itemCard(it)));
    });
  }
  function itemCard(it) {
    const card = document.createElement("div");
    card.className = "shopitem"; card.style.setProperty("--c", it.color);
    const owned = Eng.isOwned(it), eq = Eng.isEquipped(it);
    card.innerHTML = `<span class="swatch"></span><span class="iname">${it.name}</span>
      <button class="buybtn ${eq ? "eq" : owned ? "own" : ""}">${eq ? "Equipped" : owned ? "Equip" : "Buy 🪙" + it.price}</button>`;
    const b = card.querySelector("button");
    b.onclick = () => {
      if (Eng.isEquipped(it)) return;
      if (Eng.isOwned(it)) Eng.equipItem(it);
      else if (!Eng.buyItem(it)) { b.textContent = "Need more 🪙"; b.classList.add("nope"); return; }
      buildShop(); refreshCoins();
    };
    return card;
  }

  // ---------- launch / loop ----------
  // Space/Enter are gameplay keys — if a menu button keeps focus the browser
  // re-activates it on the next press, so drop focus whenever we change screen.
  function dropFocus() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function launch(def, count, bot) {
    dropFocus();
    // don't let the click/keypress that started the game leak into its first frame
    input.justP = {};
    input.pointer.pressed = false;
    input.pointer.down = false;
    if (current && current.destroy) current.destroy();
    currentDef = def; currentCount = count; currentBot = bot;
    env.players = count; env.bot = bot;
    current = def.create(env);
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
