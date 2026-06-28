/* Tic-Tac-Toe — 2 players, click to place. */
(function () {
  const { text } = Eng;

  GameHub.register({
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    category: "2 Players",
    players: "2P",
    color: "#ff6ad5",
    icon: "❌",
    desc: "Three in a row wins. Click a square on your turn.",
    controls: "Click / tap a cell · R new game",
    create(env) {
      const { W, H, input } = env;
      const CELL = 150, OX = (W - CELL * 3) / 2, OY = (H - CELL * 3) / 2 + 16;
      const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      let cells, turn, winner, winLine;
      const results = Eng.Results();

      function reset() { cells = Array(9).fill(0); turn = 1; winner = 0; winLine = null; }
      reset();

      function checkWin() {
        for (const ln of LINES) {
          const [a, b, c] = ln;
          if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            winner = cells[a]; winLine = ln;
            results.open([{ b: Eng.PLAYERS[winner - 1] }, { b: Eng.PLAYERS[winner === 1 ? 1 : 0] }]);
            return;
          }
        }
        if (cells.every((v) => v)) winner = 3;   // draw
      }

      function update(dt) {
        if (results.active) { if (results.update(dt, input)) reset(); return; }
        if (input.pressed("KeyR")) { reset(); return; }
        if (winner) return;
        if (input.pointer.pressed) {
          const { x, y } = input.pointer;
          const col = Math.floor((x - OX) / CELL), row = Math.floor((y - OY) / CELL);
          if (col >= 0 && col < 3 && row >= 0 && row < 3) {
            const i = row * 3 + col;
            if (!cells[i]) { cells[i] = turn; checkWin(); if (!winner) turn = turn === 1 ? 2 : 1; }
          }
        }
      }

      function render(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#1a1230"); g.addColorStop(1, "#0c0a1c");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        const c1 = Eng.PLAYERS[0].color, c2 = Eng.PLAYERS[1].color;
        text(ctx, winner ? (winner === 3 ? "Draw!" : `Player ${winner} wins!`) : `Player ${turn}'s turn`,
          W / 2, 44, { font: "800 28px system-ui", color: winner ? (winner === 1 ? c1 : winner === 2 ? c2 : "#fff") : (turn === 1 ? c1 : c2), glow: "#ff6ad5" });

        ctx.strokeStyle = "#46406e"; ctx.lineWidth = 6; ctx.lineCap = "round";
        for (let i = 1; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(OX + i * CELL, OY); ctx.lineTo(OX + i * CELL, OY + 3 * CELL); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(OX, OY + i * CELL); ctx.lineTo(OX + 3 * CELL, OY + i * CELL); ctx.stroke();
        }

        for (let i = 0; i < 9; i++) {
          if (!cells[i]) continue;
          const cx = OX + (i % 3) * CELL + CELL / 2, cy = OY + Math.floor(i / 3) * CELL + CELL / 2;
          ctx.lineWidth = 12; ctx.lineCap = "round";
          if (cells[i] === 1) {
            ctx.strokeStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.moveTo(cx - 38, cy - 38); ctx.lineTo(cx + 38, cy + 38);
            ctx.moveTo(cx + 38, cy - 38); ctx.lineTo(cx - 38, cy + 38); ctx.stroke();
          } else {
            ctx.strokeStyle = c2; ctx.shadowColor = c2; ctx.shadowBlur = 16;
            ctx.beginPath(); ctx.arc(cx, cy, 44, 0, 7); ctx.stroke();
          }
          ctx.shadowBlur = 0;
        }

        if (winLine) {
          const a = winLine[0], c = winLine[2];
          const ax = OX + (a % 3) * CELL + CELL / 2, ay = OY + Math.floor(a / 3) * CELL + CELL / 2;
          const cx = OX + (c % 3) * CELL + CELL / 2, cy = OY + Math.floor(c / 3) * CELL + CELL / 2;
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.shadowColor = "#fff"; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); ctx.stroke(); ctx.shadowBlur = 0;
        }

        if (winner === 3) text(ctx, "Draw! Press R for a new game · Esc for menu", W / 2, H - 40, { font: "600 16px system-ui", color: "#9fb0e0" });
        if (results.active) results.render(ctx, W, H);
      }
      return { update, render };
    },
  });
})();
