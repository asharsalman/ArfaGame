/* shop.js — cosmetic catalog. Each game gets a free default + buyable skins.
   Games read the equipped color via Eng.skinColor(gameId, fallback). */
(function () {
  const I = [];
  const add = (game, arr) =>
    arr.forEach((o, i) => I.push({ id: game + "_" + i, game, name: o.n, color: o.c, price: o.p, default: i === 0 }));

  add("geometrydash", [{ n: "Cyan Cube", c: "#4df0ff", p: 0 }, { n: "Magma Cube", c: "#ff5b3a", p: 100 }, { n: "Toxic Cube", c: "#7dff4d", p: 150 }, { n: "Void Cube", c: "#b46bff", p: 220 }]);
  add("pong", [{ n: "White Ball", c: "#ffffff", p: 0 }, { n: "Fireball", c: "#ff7a3a", p: 80 }, { n: "Plasma Ball", c: "#7dff4d", p: 120 }, { n: "Gold Ball", c: "#ffd24d", p: 160 }]);
  add("airhockey", [{ n: "White Puck", c: "#ffffff", p: 0 }, { n: "Neon Puck", c: "#4df0ff", p: 80 }, { n: "Pink Puck", c: "#ff5bd0", p: 120 }]);
  add("sumo", [{ n: "Classic Ring", c: "#caa15a", p: 0 }, { n: "Neon Ring", c: "#4df0ff", p: 120 }, { n: "Lava Ring", c: "#ff5b3a", p: 160 }]);
  add("tank", [{ n: "Gold Shell", c: "#ffe066", p: 0 }, { n: "Plasma Shell", c: "#4df0ff", p: 100 }, { n: "Pink Shell", c: "#ff5bd0", p: 140 }]);
  add("tron", [{ n: "Cyan Grid", c: "#4df0ff", p: 0 }, { n: "Amber Grid", c: "#ffb84d", p: 100 }, { n: "Violet Grid", c: "#b46bff", p: 140 }]);
  add("sword", [{ n: "Steel Blade", c: "#e0e6ff", p: 0 }, { n: "Flame Blade", c: "#ff7a3a", p: 120 }, { n: "Emerald Blade", c: "#4dff9e", p: 160 }]);
  add("soccer", [{ n: "Classic Ball", c: "#ffffff", p: 0 }, { n: "Beach Ball", c: "#ff5bd0", p: 80 }, { n: "Golden Ball", c: "#ffd24d", p: 150 }]);
  add("tictactoe", [{ n: "Indigo Board", c: "#46406e", p: 0 }, { n: "Neon Board", c: "#4df0ff", p: 80 }, { n: "Rose Board", c: "#ff5b8a", p: 120 }]);
  add("sprint", [{ n: "Night Track", c: "#10204a", p: 0 }, { n: "Sunset Track", c: "#4a1530", p: 90 }, { n: "Forest Track", c: "#103a26", p: 120 }]);
  add("chicken", [{ n: "Red Comb", c: "#ff4d4d", p: 0 }, { n: "Blue Comb", c: "#4d8aff", p: 80 }, { n: "Gold Comb", c: "#ffd24d", p: 130 }]);
  add("gunduel", [{ n: "Desert Noon", c: "#c89b54", p: 0 }, { n: "Midnight", c: "#2a3a6b", p: 90 }, { n: "Crimson Dusk", c: "#7a2a3a", p: 120 }]);
  add("basketball", [{ n: "Classic Ball", c: "#ff8a3a", p: 0 }, { n: "Neon Ball", c: "#4df0ff", p: 90 }, { n: "Gold Ball", c: "#ffd24d", p: 140 }]);
  add("penalty", [{ n: "Green Pitch", c: "#4dff9e", p: 0 }, { n: "Night Match", c: "#4d8aff", p: 90 }, { n: "Sunset Pitch", c: "#ff8a4d", p: 130 }]);
  add("snake", [{ n: "Pink Pellet", c: "#ff5b8a", p: 0 }, { n: "Gold Pellet", c: "#ffd24d", p: 80 }, { n: "Ice Pellet", c: "#6cf0ff", p: 120 }]);
  add("spinners", [{ n: "Violet Arena", c: "#b46bff", p: 0 }, { n: "Ember Arena", c: "#ff5b3a", p: 110 }, { n: "Cyan Arena", c: "#4df0ff", p: 150 }]);
  add("volleyball", [{ n: "White Ball", c: "#ffffff", p: 0 }, { n: "Sunset Ball", c: "#ff8a3a", p: 80 }, { n: "Lime Ball", c: "#9aff4d", p: 120 }]);
  add("bowling", [{ n: "Blue Ball", c: "#4dc4ff", p: 0 }, { n: "Magma Ball", c: "#ff5b3a", p: 90 }, { n: "Violet Ball", c: "#b46bff", p: 130 }]);
  add("memory", [{ n: "Indigo Backs", c: "#46406e", p: 0 }, { n: "Teal Backs", c: "#1c5b6b", p: 80 }, { n: "Rose Backs", c: "#7a2a4a", p: 120 }]);

  window.SHOP_ITEMS = I;
})();
