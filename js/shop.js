/* shop.js — cosmetic catalog.
   Every item declares how to PREVIEW itself so the shop shows the real thing
   (an actual cube, ball, blade, hat or stickman) instead of a colour swatch. */
(function () {
  const I = [];
  // kind: how the shop draws the preview  ·  price 0 = free default
  const add = (game, kind, arr) =>
    arr.forEach((o, i) => I.push({
      id: game + "_" + i, game, kind, name: o.n, color: o.c,
      price: o.p, extra: o.x || null, default: i === 0,
    }));

  add("geometrydash", "cube", [
    { n: "Cyan Cube", c: "#4df0ff", p: 0 }, { n: "Magma Cube", c: "#ff5b3a", p: 100 },
    { n: "Toxic Cube", c: "#7dff4d", p: 150 }, { n: "Void Cube", c: "#b46bff", p: 220 },
    { n: "Gold Cube", c: "#ffd24d", p: 300 },
  ]);
  add("pong", "ball", [
    { n: "White Ball", c: "#ffffff", p: 0 }, { n: "Fireball", c: "#ff7a3a", p: 80 },
    { n: "Plasma Ball", c: "#7dff4d", p: 120 }, { n: "Gold Ball", c: "#ffd24d", p: 160 },
  ]);
  add("airhockey", "puck", [
    { n: "White Puck", c: "#ffffff", p: 0 }, { n: "Neon Puck", c: "#4df0ff", p: 80 },
    { n: "Pink Puck", c: "#ff5bd0", p: 120 },
  ]);
  add("sumo", "ring", [
    { n: "Classic Ring", c: "#caa15a", p: 0 }, { n: "Neon Ring", c: "#4df0ff", p: 120 },
    { n: "Lava Ring", c: "#ff5b3a", p: 160 },
  ]);
  add("tank", "shell", [
    { n: "Gold Shell", c: "#ffe066", p: 0 }, { n: "Plasma Shell", c: "#4df0ff", p: 100 },
    { n: "Pink Shell", c: "#ff5bd0", p: 140 },
  ]);
  add("tron", "trail", [
    { n: "Cyan Grid", c: "#4df0ff", p: 0 }, { n: "Amber Grid", c: "#ffb84d", p: 100 },
    { n: "Violet Grid", c: "#b46bff", p: 140 },
  ]);
  add("sword", "blade", [
    { n: "Steel Blade", c: "#e0e6ff", p: 0 },
    { n: "Fire Blade", c: "#ff7a3a", p: 140, x: "fire" },
    { n: "Ice Blade", c: "#7ce8ff", p: 140, x: "ice" },
    { n: "Venom Blade", c: "#7dff4d", p: 180, x: "venom" },
    { n: "Shadow Blade", c: "#b46bff", p: 240, x: "shadow" },
  ]);
  add("soccer", "soccerball", [
    { n: "Classic Ball", c: "#ffffff", p: 0 }, { n: "Beach Ball", c: "#ff5bd0", p: 80 },
    { n: "Golden Ball", c: "#ffd24d", p: 150 },
  ]);
  add("tictactoe", "board", [
    { n: "Indigo Board", c: "#46406e", p: 0 }, { n: "Neon Board", c: "#4df0ff", p: 80 },
    { n: "Rose Board", c: "#ff5b8a", p: 120 },
  ]);
  add("sprint", "track", [
    { n: "Night Track", c: "#10204a", p: 0 }, { n: "Sunset Track", c: "#4a1530", p: 90 },
    { n: "Forest Track", c: "#103a26", p: 120 },
  ]);
  add("chicken", "chicken", [
    { n: "Red Comb", c: "#ff4d4d", p: 0 }, { n: "Blue Comb", c: "#4d8aff", p: 80 },
    { n: "Gold Comb", c: "#ffd24d", p: 130 },
  ]);
  add("gunduel", "scene", [
    { n: "Desert Noon", c: "#c89b54", p: 0 }, { n: "Midnight", c: "#2a3a6b", p: 90 },
    { n: "Crimson Dusk", c: "#7a2a3a", p: 120 },
  ]);
  add("basketball", "basketball", [
    { n: "Classic Ball", c: "#ff8a3a", p: 0 }, { n: "Neon Ball", c: "#4df0ff", p: 90 },
    { n: "Gold Ball", c: "#ffd24d", p: 140 },
  ]);
  add("penalty", "scene", [
    { n: "Green Pitch", c: "#4dff9e", p: 0 }, { n: "Night Match", c: "#4d8aff", p: 90 },
    { n: "Sunset Pitch", c: "#ff8a4d", p: 130 },
  ]);
  add("snake", "pellet", [
    { n: "Pink Pellet", c: "#ff5b8a", p: 0 }, { n: "Gold Pellet", c: "#ffd24d", p: 80 },
    { n: "Ice Pellet", c: "#6cf0ff", p: 120 },
  ]);
  add("spinners", "ring", [
    { n: "Violet Arena", c: "#b46bff", p: 0 }, { n: "Ember Arena", c: "#ff5b3a", p: 110 },
    { n: "Cyan Arena", c: "#4df0ff", p: 150 },
  ]);
  add("volleyball", "volleyball", [
    { n: "White Ball", c: "#ffffff", p: 0 }, { n: "Sunset Ball", c: "#ff8a3a", p: 80 },
    { n: "Lime Ball", c: "#9aff4d", p: 120 },
  ]);
  add("bowling", "bowlball", [
    { n: "Blue Ball", c: "#4dc4ff", p: 0 }, { n: "Magma Ball", c: "#ff5b3a", p: 90 },
    { n: "Violet Ball", c: "#b46bff", p: 130 },
  ]);
  add("memory", "cardback", [
    { n: "Indigo Backs", c: "#46406e", p: 0 }, { n: "Teal Backs", c: "#1c5b6b", p: 80 },
    { n: "Rose Backs", c: "#7a2a4a", p: 120 },
  ]);

  /* ---- Stickman customisation: applies to EVERY game ---- */
  add("hat", "stickman", [
    { n: "No Hat", c: "#8fa4d6", p: 0, x: "" },
    { n: "Ball Cap", c: "#e8503a", p: 90, x: "cap" },
    { n: "Straw Hat", c: "#e8b24a", p: 110, x: "straw" },
    { n: "Cowboy Hat", c: "#6b4a2a", p: 160, x: "cowboy" },
  ]);
  // Shirts tint the torso only — each player keeps their own identity colour.
  add("body", "stickman", [
    { n: "No Shirt", c: null, p: 0, x: "" },
    { n: "Snow Vest", c: "#f2f5ff", p: 100, x: "shirt" },
    { n: "Midnight Vest", c: "#2b3566", p: 120, x: "shirt" },
    { n: "Sunset Vest", c: "#ff8a3a", p: 140, x: "shirt" },
    { n: "Mint Vest", c: "#4dff9e", p: 160, x: "shirt" },
    { n: "Violet Vest", c: "#b46bff", p: 200, x: "shirt" },
  ]);

  add("stack", "cube", [
    { n: "Ice Slabs", c: "#4dc4ff", p: 0 }, { n: "Amber Slabs", c: "#ffb84d", p: 90 },
    { n: "Violet Slabs", c: "#b46bff", p: 130 },
  ]);
  add("hair", "stickman", [
    { n: "Bald", c: null, p: 0, x: "" },
    { n: "Spiky Hair", c: "#3a2a1a", p: 90, x: "spiky" },
    { n: "Bowl Cut", c: "#c9954f", p: 110, x: "bowl" },
    { n: "Ponytail", c: "#6b3a1a", p: 130, x: "pony" },
    { n: "Big Afro", c: "#2a1a12", p: 170, x: "afro" },
    { n: "Neon Mohawk", c: "#4df0ff", p: 220, x: "mohawk" },
  ]);

  window.SHOP_ITEMS = I;

  // Equipped stickman look, used by every game via Art.stickman defaults.
  window.stickmanStyle = function () {
    const hatItem = window.SHOP_ITEMS.find((i) => i.game === "hat" && Eng.isEquipped(i)) || {};
    const bodyItem = window.SHOP_ITEMS.find((i) => i.game === "body" && Eng.isEquipped(i)) || {};
    const hairItem = window.SHOP_ITEMS.find((i) => i.game === "hair" && Eng.isEquipped(i)) || {};
    return {
      hat: hatItem.extra || "", hatColor: hatItem.color,
      shirt: bodyItem.color || null,
      hair: hairItem.extra || "", hairColor: hairItem.color,
    };
  };
})();
