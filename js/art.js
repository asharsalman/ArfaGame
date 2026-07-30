/* art.js — shared cartoon art kit (original artwork).
   Every mini-game draws its characters through here so the whole arcade reads
   as one game: chunky stickmen, thick dark outlines, flat bright colors. */
(function () {
  const A = {};
  const OUT = "#0d1020";                       // outline color

  // ---- low level: an outlined thick line ----
  function limb(ctx, x1, y1, x2, y2, w, c) {
    ctx.lineCap = "round";
    ctx.strokeStyle = OUT; ctx.lineWidth = w + 5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  A.limb = limb;

  A.shadow = function (ctx, x, y, rx, alpha) {
    ctx.fillStyle = `rgba(0,0,0,${alpha == null ? 0.28 : alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, 7); ctx.fill();
  };

  // ---- poses: limb endpoints as offsets from the joint ----
  function P(a1, a2, l1, l2, lean, bob) {
    return { a1, a2, l1, l2, lean: lean || 0, bob: bob || 0 };
  }
  A.pose = function (name, t, f) {
    t = t || 0; f = f === -1 ? -1 : 1;
    switch (name) {
      case "run": {
        const sw = Math.sin(t * 13);
        return P([f * 13, 4 + sw * 9], [f * -9, 4 - sw * 9],
                 [f * 9 + sw * 13, 21], [f * -7 - sw * 13, 21], f * 0.13, Math.abs(sw) * 2);
      }
      case "walk": {
        const sw = Math.sin(t * 7);
        return P([f * 11, 7 + sw * 5], [f * -10, 7 - sw * 5],
                 [f * 7 + sw * 9, 22], [f * -7 - sw * 9, 22], 0, 0);
      }
      case "jump":  return P([f * 12, -16], [f * -12, -16], [f * 11, 17], [f * -9, 21], 0, 0);
      case "shoot": return P([f * 9, -21], [f * -6, -19], [f * 9, 22], [f * -9, 22], 0, 0);
      case "throw": return P([f * 22, -12], [f * -10, 2], [f * 11, 22], [f * -10, 22], f * 0.14, 0);
      case "dive":  return P([f * 25, -10], [f * 19, 3], [f * -17, 11], [f * -13, 19], f * 0.95, 0);
      case "swing": return P([f * 24, -6], [f * -9, 4], [f * 12, 22], [f * -10, 22], f * 0.15, 0);
      case "carry": return P([f * 13, -3], [f * -13, -3], [f * 8, 22], [f * -8, 22], 0, 0);
      case "cheer": return P([f * 14, -23], [f * -14, -23], [f * 9, 22], [f * -9, 22], 0, 0);
      case "guard": return P([f * 20, -14], [f * -20, -14], [f * 14, 22], [f * -14, 22], 0, 0);
      case "ready": return P([f * 15, -2], [f * -13, 2], [f * 11, 22], [f * -11, 22], 0, 0);
      default:      return P([f * 11, 8], [f * -11, 8], [f * 8, 22], [f * -8, 22], 0, 0);
    }
  };

  /* Draw a stickman standing with its FEET at (x, y).
     opts: { color, scale, pose, face:1|-1, t, hat, hatColor, glow } */
  A.stickman = function (ctx, x, y, opts) {
    let o = opts || {};
    // apply the player's shop-equipped hat / body colour unless the game forces one
    if (!o.noStyle && window.stickmanStyle) {
      const st = window.stickmanStyle(o.color);
      o = Object.assign({}, o, {
        // NB: never override o.color — that's the player's identity colour
        top: o.top || st.top, topColor: o.topColor || st.topColor,
        legs: o.legs || st.legs, legsColor: o.legsColor || st.legsColor,
        hat: o.hat || st.hat,
        hatColor: o.hatColor || st.hatColor,
        hair: o.hair || st.hair,
        hairColor: o.hairColor || st.hairColor,
      });
    }
    const s = o.scale || 1, c = o.color || "#fff";
    const f = o.face === -1 ? -1 : 1;
    const p = A.pose(o.pose, o.t, f);

    ctx.save();
    ctx.translate(x, y - p.bob * s);
    ctx.scale(s, s);
    if (p.lean) ctx.rotate(p.lean);
    if (o.glow) { ctx.shadowColor = c; ctx.shadowBlur = 16; }

    const HIP = -22, SHO = -40, HEAD = -52, R = 9;
    const parts = [
      [0, HIP, p.l1[0], HIP + p.l1[1], 7],
      [0, HIP, p.l2[0], HIP + p.l2[1], 7],
      [0, SHO, p.a1[0], SHO + p.a1[1], 6],
      [0, SHO, p.a2[0], SHO + p.a2[1], 6],
      [0, SHO - 2, 0, HIP, 9],
    ];
    // Pass 1: every outline. Pass 2: every fill. Drawing it in two passes means
    // limbs merge into one silhouette with no dark seams where they join.
    ctx.lineCap = "round";
    ctx.strokeStyle = OUT;
    parts.forEach(([x1, y1, x2, y2, w]) => {
      ctx.lineWidth = w + 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(0, HEAD, R + 2.5, 0, 7); ctx.fill();
    ctx.strokeStyle = c;
    parts.forEach(([x1, y1, x2, y2, w]) => {
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });

    A.wear(ctx, o, p, SHO, HIP, HEAD);

    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, HEAD, R, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;

    if (o.hair) A.hair(ctx, HEAD, R, f, o.hair, o.hairColor || "#3a2a1a");

    // face: eyes + mouth
    ctx.fillStyle = OUT;
    ctx.beginPath();
    ctx.arc(f * 2.4 - 2.6, HEAD - 1.6, 2, 0, 7);
    ctx.arc(f * 2.4 + 2.6, HEAD - 1.6, 2, 0, 7);
    ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(f * 1.6, HEAD + 2.2, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    if (o.hat === "cap") {
      ctx.fillStyle = o.hatColor || "#e8503a"; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, HEAD - 3, R + 1, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(f * 1, HEAD - 3); ctx.lineTo(f * (R + 11), HEAD - 3);
      ctx.lineTo(f * (R + 9), HEAD + 1); ctx.lineTo(f * 1, HEAD + 1); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (o.hat === "straw") {
      ctx.fillStyle = o.hatColor || "#e8b24a"; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, HEAD - 5, R + 9, 4.4, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, HEAD - 9, R - 2, 5.4, 0, 0, 7); ctx.fill(); ctx.stroke();
    } else if (o.hat === "cowboy") {
      ctx.fillStyle = o.hatColor || "#4a3a2a"; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, HEAD - 5, R + 11, 4.6, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R + 2, HEAD - 6); ctx.quadraticCurveTo(0, HEAD - 20, R - 2, HEAD - 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  /* Clothing drawn over the stickman (local coords, called from inside stickman).
     o.top: tshirt|hoodie|halfsleeve|tank   o.legs: pants|shorts|skirt */
  A.wear = function (ctx, o, p, SHO, HIP, HEAD) {
    // ---- legwear first, so the shirt hem sits over it ----
    if (o.legs && o.legsColor) {
      const c = o.legsColor;
      const frac = o.legs === "shorts" ? 0.45 : 1;
      if (o.legs === "skirt") {
        ctx.fillStyle = c; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-9, HIP - 3); ctx.lineTo(9, HIP - 3);
        ctx.lineTo(15, HIP + 13); ctx.lineTo(-15, HIP + 13);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        [p.l1, p.l2].forEach((l) => {
          ctx.lineCap = "round";
          ctx.strokeStyle = OUT; ctx.lineWidth = 12;
          ctx.beginPath(); ctx.moveTo(0, HIP);
          ctx.lineTo(l[0] * frac, HIP + l[1] * frac); ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 8.5;
          ctx.beginPath(); ctx.moveTo(0, HIP);
          ctx.lineTo(l[0] * frac, HIP + l[1] * frac); ctx.stroke();
        });
      }
    }

    // ---- top ----
    const top = o.top, tc = o.topColor || o.shirt;
    if (!tc) return;
    // sleeves along the arms
    const sleeve = top === "hoodie" ? 1 : top === "halfsleeve" ? 0.62 : top === "tshirt" ? 0.4 : 0;
    if (sleeve > 0) {
      [p.a1, p.a2].forEach((a) => {
        ctx.lineCap = "round";
        ctx.strokeStyle = OUT; ctx.lineWidth = 11;
        ctx.beginPath(); ctx.moveTo(0, SHO);
        ctx.lineTo(a[0] * sleeve, SHO + a[1] * sleeve); ctx.stroke();
        ctx.strokeStyle = tc; ctx.lineWidth = 7.5;
        ctx.beginPath(); ctx.moveTo(0, SHO);
        ctx.lineTo(a[0] * sleeve, SHO + a[1] * sleeve); ctx.stroke();
      });
    }
    // torso panel
    ctx.fillStyle = tc; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    const halfW = top === "tank" ? 8 : 11;
    ctx.beginPath();
    ctx.moveTo(-halfW, SHO - 3);
    ctx.lineTo(halfW, SHO - 3);
    ctx.lineTo(halfW + 1, HIP + 2);
    ctx.lineTo(-halfW - 1, HIP + 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // hoodie: hood behind the head + a pocket
    if (top === "hoodie") {
      ctx.fillStyle = tc; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, HEAD + 5, 12.5, Math.PI * 0.05, Math.PI * 0.95);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, HIP - 6, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    // simple collar
    ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5, SHO - 2); ctx.lineTo(0, SHO + 3); ctx.lineTo(5, SHO - 2); ctx.stroke();
  };

  /* Hair styles drawn on the head (local coords, called from inside stickman). */
  A.hair = function (ctx, HEAD, R, f, style, col) {
    ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2.4;
    const cap = (lift) => {                      // the skull-hugging part
      ctx.beginPath();
      ctx.arc(0, HEAD - (lift || 0), R + 1.6, Math.PI, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    const bangs = () => {
      ctx.beginPath();
      ctx.moveTo(-R - 1.6, HEAD - 1);
      ctx.quadraticCurveTo(-R * 0.3, HEAD + 4.5, R * 0.2, HEAD - 1.5);
      ctx.quadraticCurveTo(R * 0.7, HEAD + 3, R + 1.6, HEAD - 2.5);
      ctx.lineTo(R + 1.6, HEAD - 5); ctx.lineTo(-R - 1.6, HEAD - 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    switch (style) {
      case "short": cap(1); break;
      case "bangs": cap(1); bangs(); break;
      case "spikes":                              // neon-tipped spikes
        cap(0);
        ctx.beginPath();
        for (let k = -2; k <= 2; k++) {
          const x = k * 4.4;
          ctx.moveTo(x - 3.2, HEAD - R - 0.5);
          ctx.lineTo(x + f * 1.6, HEAD - R - 9);
          ctx.lineTo(x + 3.2, HEAD - R - 0.5);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case "ponyBangs":
      case "pony":
        cap(1);
        if (style === "ponyBangs") bangs();
        ctx.beginPath();                          // tie
        ctx.arc(-f * (R + 2), HEAD - 2, 2.6, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath();                          // tail
        ctx.moveTo(-f * (R + 1), HEAD - 4);
        ctx.quadraticCurveTo(-f * (R + 11), HEAD + 2, -f * (R + 6), HEAD + 13);
        ctx.quadraticCurveTo(-f * (R + 3), HEAD + 5, -f * (R - 1), HEAD + 1);
        ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case "bob":
        cap(1);
        ctx.beginPath();
        ctx.moveTo(-R - 1.6, HEAD - 2);
        ctx.quadraticCurveTo(-R - 4, HEAD + 11, -R + 1, HEAD + 11);
        ctx.lineTo(-R + 1, HEAD - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R + 1.6, HEAD - 2);
        ctx.quadraticCurveTo(R + 4, HEAD + 11, R - 1, HEAD + 11);
        ctx.lineTo(R - 1, HEAD - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        bangs(); break;
      case "afro":
        ctx.beginPath();
        for (let k = 0; k < 11; k++) {            // puffy outline
          const a = Math.PI + (k / 10) * Math.PI;
          const rr = R + 6 + Math.sin(k * 2.3) * 1.6;
          ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * rr, HEAD - 2 + Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case "mohawk":
        ctx.beginPath();
        ctx.moveTo(-3.5, HEAD - R + 2);
        ctx.quadraticCurveTo(0, HEAD - R - 15, 3.5, HEAD - R + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    }
  };

  /* Hands position for a given pose, in world coords — so games can put a ball
     or a racket exactly where the character is holding it. */
  A.handPos = function (x, y, opts) {
    const o = opts || {}, s = o.scale || 1, f = o.face === -1 ? -1 : 1;
    const p = A.pose(o.pose, o.t, f), SHO = -40;
    return { x: x + p.a1[0] * s, y: y + (SHO + p.a1[1]) * s - p.bob * s };
  };

  /* The game currency: a gold coin stamped with an M. squash = 0..1 for spin. */
  A.coin = function (ctx, x, y, r, squash) {
    const sc = squash == null ? 1 : squash;
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.06, sc), 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
    g.addColorStop(0, "#fff3b0"); g.addColorStop(0.5, "#ffd24d"); g.addColorStop(1, "#d99a1b");
    ctx.fillStyle = g; ctx.strokeStyle = "#a8780f"; ctx.lineWidth = Math.max(1.5, r * 0.13);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, 7); ctx.stroke();
    if (sc > 0.45) {                       // only stamp the M when facing us
      ctx.fillStyle = "#8a5f08";
      ctx.font = `900 ${Math.round(r * 1.15)}px system-ui`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("M", 0, r * 0.06);
    }
    ctx.restore();
  };

  /* Face drawn on the Geometry Dash cube (local coords, cube centred on 0,0). */
  A.cubeFace = function (ctx, S, style) {
    const ink = "#16244a";
    const eo = S / 6, er = S / 13;
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    ctx.lineWidth = S / 18; ctx.lineCap = "round";
    switch (style) {
      case "shades":
        ctx.fillRect(-S / 2.6, -S / 9, S / 1.3, S / 7);
        ctx.beginPath();
        ctx.ellipse(-eo, -2, er * 1.9, er * 1.5, 0, 0, 7);
        ctx.ellipse(eo, -2, er * 1.9, er * 1.5, 0, 0, 7);
        ctx.fill();
        ctx.beginPath(); ctx.arc(0, S / 6, S / 7, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        break;
      case "wink":
        ctx.beginPath(); ctx.arc(-eo, -3, er, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(eo - er, -3); ctx.lineTo(eo + er, -3); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 2, S / 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        break;
      case "grr":
        ctx.beginPath();
        ctx.moveTo(-eo - er, -8); ctx.lineTo(-eo + er, -3);
        ctx.moveTo(eo + er, -8); ctx.lineTo(eo - er, -3); ctx.stroke();
        ctx.beginPath(); ctx.arc(-eo, -1, er * 0.8, 0, 7); ctx.arc(eo, -1, er * 0.8, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-S / 7, S / 5); ctx.lineTo(S / 7, S / 5); ctx.stroke();
        break;
      case "shock":
        ctx.beginPath(); ctx.arc(-eo, -3, er * 1.25, 0, 7); ctx.arc(eo, -3, er * 1.25, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, S / 5, S / 9, S / 7, 0, 0, 7); ctx.fill();
        break;
      case "tongue":
        ctx.beginPath(); ctx.arc(-eo, -3, er, 0, 7); ctx.arc(eo, -3, er, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 2, S / 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        ctx.fillStyle = "#ff6a8a"; ctx.strokeStyle = ink; ctx.lineWidth = S / 26;
        ctx.beginPath();
        ctx.ellipse(S / 22, S / 4.2, S / 9, S / 8, 0, 0, 7);
        ctx.fill(); ctx.stroke();
        break;
      default:                                   // smile
        ctx.beginPath(); ctx.arc(-eo, -3, er, 0, 7); ctx.arc(eo, -3, er, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 2, S / 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
  };

  // ---- cartoon balls ----
  A.ball = function (ctx, x, y, r, kind, color) {
    ctx.save();
    ctx.fillStyle = color || "#fff";
    ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(2, r * 0.16);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath();
    if (kind === "basket") {
      ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x - r * 1.35, y, r * 1.2, -0.85, 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + r * 1.35, y, r * 1.2, Math.PI - 0.85, Math.PI + 0.85); ctx.stroke();
    } else if (kind === "volley") {
      ctx.lineWidth = Math.max(1.4, r * 0.1);
      ctx.moveTo(x - r * 0.95, y - r * 0.3);
      ctx.quadraticCurveTo(x, y - r * 0.1, x + r * 0.95, y - r * 0.3);
      ctx.moveTo(x - r * 0.6, y + r * 0.78);
      ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.1, x - r * 0.62, y - r * 0.76);
      ctx.moveTo(x + r * 0.6, y + r * 0.78);
      ctx.quadraticCurveTo(x + r * 0.15, y - r * 0.1, x + r * 0.62, y - r * 0.76);
      ctx.stroke();
    } else if (kind === "soccer") {
      ctx.fillStyle = OUT;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        ctx[k ? "lineTo" : "moveTo"](x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42);
      }
      ctx.closePath(); ctx.fill();
    } else if (kind === "bowl") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.22, r * 0.17, 0, 7);
      ctx.arc(x + r * 0.22, y - r * 0.28, r * 0.17, 0, 7);
      ctx.arc(x - r * 0.02, y + r * 0.18, r * 0.17, 0, 7); ctx.fill();
    }
    // gloss
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.ellipse(x - r * 0.34, y - r * 0.4, r * 0.26, r * 0.16, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  };

  // ---- cartoon chicken (feet at y) ----
  A.chicken = function (ctx, x, y, s, combColor, t, face) {
    const f = face === -1 ? -1 : 1;
    const bob = Math.sin((t || 0) * 8) * 1.2 * s;
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(s, s);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    // legs
    limb(ctx, -4, -9, -4, 0, 3, "#e8a33a");
    limb(ctx, 4, -9, 4, 0, 3, "#e8a33a");
    // body
    ctx.fillStyle = "#fdfdff";
    ctx.beginPath(); ctx.ellipse(0, -19, 13, 11, 0, 0, 7); ctx.fill(); ctx.stroke();
    // wing
    ctx.fillStyle = "#e6e9f5";
    ctx.beginPath(); ctx.ellipse(f * -2, -19, 6.5, 4.6, f * -0.35, 0, 7); ctx.fill(); ctx.stroke();
    // head
    ctx.fillStyle = "#fdfdff";
    ctx.beginPath(); ctx.arc(f * 8, -31, 7.5, 0, 7); ctx.fill(); ctx.stroke();
    // comb
    ctx.fillStyle = combColor || "#ff4d4d";
    ctx.beginPath();
    ctx.moveTo(f * 5, -37);
    ctx.quadraticCurveTo(f * 7, -43, f * 9, -37);
    ctx.quadraticCurveTo(f * 11, -43, f * 12.5, -36.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // beak + wattle
    ctx.fillStyle = "#f0a52e";
    ctx.beginPath(); ctx.moveTo(f * 15, -31); ctx.lineTo(f * 22, -29); ctx.lineTo(f * 15, -27); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = combColor || "#ff4d4d";
    ctx.beginPath(); ctx.ellipse(f * 13, -25, 2.4, 3.4, 0, 0, 7); ctx.fill();
    // eye
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(f * 10, -32.5, 1.9, 0, 7); ctx.fill();
    ctx.restore();
  };

  /* Sword blade held at (x,y), pointing along `ang` (radians, 0 = right).
     fx: "" | "fire" | "ice" | "venom" | "shadow" */
  A.blade = function (ctx, x, y, ang, len, color, fx, t) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    const GLOW = { fire: "#ff7a3a", ice: "#7ce8ff", venom: "#7dff4d", shadow: "#b46bff" }[fx];
    if (GLOW) { ctx.shadowColor = GLOW; ctx.shadowBlur = 22; }

    // hilt — grip sits IN the hand at the origin
    ctx.fillStyle = "#8a6234"; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.rect(-10, -2.6, 11, 5.2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-1, -6.5, 4.5, 13); ctx.fill(); ctx.stroke();   // crossguard

    // blade
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, color); g.addColorStop(0.6, "#ffffff"); g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(3.5, -4.4); ctx.lineTo(len - 9, -4.4); ctx.lineTo(len, 0);
    ctx.lineTo(len - 9, 4.4); ctx.lineTo(3.5, 4.4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // elemental trim
    if (fx === "fire") {
      ctx.fillStyle = "rgba(255,140,50,0.85)";
      for (let i = 0; i < 5; i++) {
        const fx0 = 10 + i * (len - 16) / 5;
        const h = 7 + Math.sin(t * 14 + i * 1.7) * 5;
        ctx.beginPath(); ctx.moveTo(fx0, -6); ctx.lineTo(fx0 + 5, -6 - h); ctx.lineTo(fx0 + 10, -6); ctx.fill();
      }
    } else if (fx === "ice") {
      ctx.strokeStyle = "rgba(200,245,255,0.95)"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ix = 14 + i * (len - 20) / 4;
        ctx.beginPath(); ctx.moveTo(ix, -6); ctx.lineTo(ix + 5, -12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix, 6); ctx.lineTo(ix + 5, 12); ctx.stroke();
      }
    } else if (fx === "venom") {
      ctx.fillStyle = "rgba(125,255,77,0.9)";
      for (let i = 0; i < 3; i++) {
        const dx = 18 + i * (len - 24) / 3;
        const dy = 8 + ((t * 60 + i * 22) % 16);
        ctx.beginPath(); ctx.ellipse(dx, dy, 2.6, 4, 0, 0, 7); ctx.fill();
      }
    } else if (fx === "shadow") {
      ctx.globalAlpha = 0.4; ctx.fillStyle = "#b46bff";
      ctx.beginPath();
      ctx.moveTo(4, -9); ctx.lineTo(len, 0); ctx.lineTo(4, 9); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  /* A sumo wrestler seen from above-ish. Everyone shares the same skin; the
     player's colour is only on the mawashi (belt), like the real thing. */
  A.sumo = function (ctx, x, y, r, beltCol, lean, t, hit) {
    const SKIN = "#e8b98f", SKIN_D = "#c9945f";
    ctx.save(); ctx.translate(x, y);
    const bob = Math.sin((t || 0) * 3) * 1.2;
    ctx.translate(Math.cos(lean) * 3, Math.sin(lean) * 3 + bob);

    // legs braced out to the sides
    ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.62 + 5; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, r * 0.42); ctx.lineTo(-r * 0.82, r * 0.94);
    ctx.moveTo(r * 0.42, r * 0.42); ctx.lineTo(r * 0.82, r * 0.94);
    ctx.stroke();
    ctx.strokeStyle = SKIN_D; ctx.lineWidth = r * 0.62;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, r * 0.42); ctx.lineTo(-r * 0.82, r * 0.94);
    ctx.moveTo(r * 0.42, r * 0.42); ctx.lineTo(r * 0.82, r * 0.94);
    ctx.stroke();

    // arms held in a fixed braced stance — only the body moves around the ring
    const arms = (w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, -r * 0.12); ctx.lineTo(-r * 1.22, r * 0.42);
      ctx.moveTo(r * 0.72, -r * 0.12); ctx.lineTo(r * 1.22, r * 0.42);
      ctx.stroke();
    };
    arms(r * 0.5 + 5, OUT);
    arms(r * 0.5, SKIN);

    // big round belly
    ctx.fillStyle = hit ? "#fff" : SKIN;
    ctx.strokeStyle = OUT; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.98, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath(); ctx.ellipse(-r * 0.26, -r * 0.3, r * 0.42, r * 0.3, -0.5, 0, 7); ctx.fill();

    // mawashi — the ONLY thing that differs between players
    ctx.fillStyle = beltCol; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, r * 0.5, r * 0.95, r * 0.3, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.rect(-r * 0.2, r * 0.42, r * 0.4, r * 0.62); ctx.fill(); ctx.stroke();

    // head + topknot
    ctx.fillStyle = SKIN; ctx.strokeStyle = OUT; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0, -r * 0.92, r * 0.44, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#241a14";
    ctx.beginPath(); ctx.arc(0, -r * 1.08, r * 0.44, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -r * 1.42, r * 0.2, r * 0.13, 0, 0, 7); ctx.fill(); ctx.stroke();
    // face
    ctx.fillStyle = OUT;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.92, r * 0.06, 0, 7);
    ctx.arc(r * 0.15, -r * 0.92, r * 0.06, 0, 7); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath();
    if (hit) ctx.arc(0, -r * 0.72, r * 0.13, Math.PI, 0);
    else ctx.arc(0, -r * 0.8, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  };

  // ---- bowling pin (base at y) ----
  A.pin = function (ctx, x, y, s, down) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (down) ctx.rotate(1.25);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.fillStyle = "#f7f9ff";
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-9, -6, -6, -13);
    ctx.quadraticCurveTo(-4, -19, -3.4, -22);
    ctx.quadraticCurveTo(0, -26, 3.4, -22);
    ctx.quadraticCurveTo(4, -19, 6, -13);
    ctx.quadraticCurveTo(9, -6, 4, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath(); ctx.ellipse(0, -17, 5.2, 1.8, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -13, 6.2, 1.8, 0, 0, 7); ctx.fill();
    ctx.restore();
  };

  A.OUT = OUT;
  window.Art = A;
})();
