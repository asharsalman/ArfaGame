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
  add("gdface", "cubeface", [
    { n: "Smile", c: "#4df0ff", p: 0, x: "smile" },
    { n: "Tongue Out", c: "#4df0ff", p: 80, x: "tongue" },
    { n: "Determined", c: "#4df0ff", p: 100, x: "grr" },
    { n: "Wink", c: "#4df0ff", p: 110, x: "wink" },
    { n: "Shades", c: "#4df0ff", p: 160, x: "shades" },
    { n: "Shocked", c: "#4df0ff", p: 130, x: "shock" },
  ]);
  add("pong", "ball", [
    { n: "White Ball", c: "#ffffff", p: 0 }, { n: "Fireball", c: "#ff7a3a", p: 80 },
    { n: "Plasma Ball", c: "#7dff4d", p: 120 }, { n: "Gold Ball", c: "#ffd24d", p: 160 },
  ]);
  add("airhockey", "puck", [
    { n: "White Puck", c: "#ffffff", p: 0 }, { n: "Neon Puck", c: "#4df0ff", p: 80 },
    { n: "Pink Puck", c: "#ff5bd0", p: 120 }, { n: "Gold Puck", c: "#ffd24d", p: 160 },
  ]);
  add("ahtable", "table", [
    { n: "Navy Table", c: "#0d2138", p: 0 },
    { n: "Emerald Table", c: "#0d3320", p: 110 },
    { n: "Crimson Table", c: "#330d18", p: 130 },
    { n: "Violet Table", c: "#1e0d33", p: 150 },
  ]);
  add("racecar", "racecar", [
    { n: "Team Colour", c: null, p: 0 },
    { n: "Racing Red", c: "#d8402f", p: 120 },
    { n: "Speed Stripe", c: "#2b3566", p: 170, x: "stripe" },
    { n: "Sunburst", c: "#ffb02e", p: 190, x: "stripe" },
    { n: "Midnight GT", c: "#181c2e", p: 240 },
  ]);
  add("sumo", "ring", [
    { n: "Classic Ring", c: "#caa15a", p: 0 }, { n: "Neon Ring", c: "#4df0ff", p: 120 },
    { n: "Lava Ring", c: "#ff5b3a", p: 160 },
  ]);
  add("tank", "shell", [
    { n: "Gold Shell", c: "#ffe066", p: 0 }, { n: "Plasma Shell", c: "#4df0ff", p: 100 },
    { n: "Pink Shell", c: "#ff5bd0", p: 140 },
  ]);
  add("tankhull", "tank", [
    { n: "Steel Hull", c: "#5a6280", p: 0 },
    { n: "Desert Sand", c: "#b08a4a", p: 120 },
    { n: "Forest Camo", c: "#4a6a3a", p: 180, x: "camo" },
    { n: "Arctic Camo", c: "#8fa8c8", p: 180, x: "camo" },
    { n: "Blue Steel", c: "#3a5a9e", p: 220 },
    { n: "Crimson Hull", c: "#8a2a2a", p: 260 },
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
  add("snakeskin", "snakeskin", [
    { n: "Solid", c: null, p: 0, x: "" },
    { n: "Striped", c: null, p: 110, x: "stripe" },
    { n: "Scaled", c: null, p: 150, x: "scale" },
    { n: "Spotted", c: null, p: 180, x: "spot" },
    { n: "Glowing", c: null, p: 240, x: "glow" },
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
  // Clothing. Each player keeps their own identity colour on the limbs/head.
  add("top", "stickman", [
    { n: "Bare", c: null, p: 0, x: "" },
    { n: "White Tee", c: "#f2f5ff", p: 90, x: "tshirt" },
    { n: "Red Tee", c: "#e8503a", p: 90, x: "tshirt" },
    { n: "Tank Top", c: "#4df0ff", p: 110, x: "tank" },
    { n: "Half Sleeve", c: "#ffd24d", p: 130, x: "halfsleeve" },
    { n: "Navy Hoodie", c: "#2b3566", p: 210, x: "hoodie" },
    { n: "Mint Hoodie", c: "#4dff9e", p: 230, x: "hoodie" },
    { n: "Violet Hoodie", c: "#b46bff", p: 260, x: "hoodie" },
  ]);
  add("legs", "stickman", [
    { n: "Bare Legs", c: null, p: 0, x: "" },
    { n: "Blue Jeans", c: "#3a5a9e", p: 100, x: "pants" },
    { n: "Black Pants", c: "#22283f", p: 100, x: "pants" },
    { n: "Cargo Shorts", c: "#7a6a3a", p: 120, x: "shorts" },
    { n: "Sport Shorts", c: "#e8503a", p: 120, x: "shorts" },
    { n: "Pleat Skirt", c: "#ff5b8a", p: 150, x: "skirt" },
    { n: "Denim Skirt", c: "#5a7ab8", p: 150, x: "skirt" },
  ]);

  add("stack", "slab", [
    { n: "Ice Slabs", c: "#4dc4ff", p: 0 }, { n: "Amber Slabs", c: "#ffb84d", p: 90 },
    { n: "Violet Slabs", c: "#b46bff", p: 130 }, { n: "Emerald Slabs", c: "#4dff9e", p: 150 },
    { n: "Rose Slabs", c: "#ff5b8a", p: 170 }, { n: "Gold Slabs", c: "#ffd24d", p: 220 },
  ]);
  // Hair STYLE and hair COLOUR are chosen separately.
  add("hair", "stickman", [
    { n: "Bald", c: null, p: 0, x: "" },
    { n: "Short Cut", c: "#241a12", p: 70, x: "short" },
    { n: "With Bangs", c: "#241a12", p: 90, x: "bangs" },
    { n: "Spikes", c: "#241a12", p: 110, x: "spikes" },
    { n: "Ponytail", c: "#241a12", p: 130, x: "pony" },
    { n: "Ponytail + Bangs", c: "#241a12", p: 150, x: "ponyBangs" },
    { n: "Bob Cut", c: "#241a12", p: 150, x: "bob" },
    { n: "Big Afro", c: "#241a12", p: 190, x: "afro" },
    { n: "Mohawk", c: "#241a12", p: 220, x: "mohawk" },
  ]);
  add("haircol", "haircolor", [
    { n: "Black", c: "#241a12", p: 0 },
    { n: "Brown", c: "#6b3a1a", p: 60 },
    { n: "Blonde", c: "#e8c46a", p: 80 },
    { n: "Ginger", c: "#d4602a", p: 90 },
    { n: "Silver", c: "#c8d2e6", p: 120 },
    { n: "Neon Cyan", c: "#4df0ff", p: 180 },
    { n: "Hot Pink", c: "#ff5bd0", p: 180 },
    { n: "Toxic Green", c: "#7dff4d", p: 200 },
  ]);

  window.SHOP_ITEMS = I;

  // Equipped stickman look, used by every game via Art.stickman defaults.
  const eq = (game) => window.SHOP_ITEMS.find((i) => i.game === game && Eng.isEquipped(i)) || {};
  window.stickmanStyle = function () {
    const hat = eq("hat"), top = eq("top"), legs = eq("legs");
    const hair = eq("hair"), hc = eq("haircol");
    return {
      hat: hat.extra || "", hatColor: hat.color,
      top: top.extra || "", topColor: top.color || null,
      legs: legs.extra || "", legsColor: legs.color || null,
      hair: hair.extra || "", hairColor: hc.color || "#241a12",
    };
  };
})();
