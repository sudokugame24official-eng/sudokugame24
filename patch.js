const fs = require('fs');
let c = fs.readFileSync('apps/api/src/duel/duel.service.ts', 'utf8');

c = c.replace(/async handleMove\([\s\S]*?\}\s*catch\s*\(error\)\s*\{\s*this\.logger\.error\(`Error executing Lua handleMove: \$\{error\.message\}`\);\s*\}\s*\}/, `async handleMove(
    matchId: string,
    userId: string,
    row: number,
    col: number,
    value: number,
  ) {
    const now = Date.now();
    try {
      const result = await this.fallbackHandleMove(matchId, userId, row, col, value, now);
      if (result.error) return;
      if (result.isSus) this.logger.warn('Suspicious move');
      
      const payload = {
        row,
        col,
        value: result.isCorrect ? value : null,
        isCorrect: result.isCorrect,
        userId,
        scoreP1: result.scoreP1,
        scoreP2: result.scoreP2,
        combo: result.combo,
      };

      this.server.to('match_' + matchId).emit('duel_move', payload);

      if (result.isCorrect) {
        let isFinished = true;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (result.currentBoard[r][c] === 0) {
              isFinished = false;
              break;
            }
          }
          if (!isFinished) break;
        }

        if (isFinished) {
          const updatedDuel = await this.getActiveDuel(matchId);
          if (updatedDuel) void this.checkWinCondition(updatedDuel);
        }
      }
    } catch (err) {
      this.logger.error(err);
    }
  }`);

fs.writeFileSync('apps/api/src/duel/duel.service.ts', c);
