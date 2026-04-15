/* ============================================
   PIXEL SNAKE — Easter Egg Game
   ============================================ */

const Game = (() => {
  let canvas, ctx;
  let snake, food, direction, nextDirection;
  let score, highScore, gameLoop, gameState;
  let cellSize, cols, rows;

  // Pixel art palette
  const COLORS = {
    bg: '#1a1714',
    grid: '#222018',
    snake: '#90a8c0',
    snakeHead: '#b8d0e8',
    food: '#e8a87c',
    foodGlow: '#c07850',
    text: '#8a8580',
    textBright: '#d4d0c8',
    border: '#3a3530'
  };

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    
    cellSize = 16;
    cols = Math.floor(canvas.width / cellSize);
    rows = Math.floor(canvas.height / cellSize);
    highScore = parseInt(localStorage.getItem('snakeHigh') || '0');
    
    reset();
    draw();
    
    document.addEventListener('keydown', handleKey);
    
    // Touch controls
    let touchStartX, touchStartY;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!touchStartX || !touchStartY) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      
      if (gameState === 'waiting' || gameState === 'dead') {
        start();
        return;
      }
      
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && direction !== 'left') nextDirection = 'right';
        else if (dx < -20 && direction !== 'right') nextDirection = 'left';
      } else {
        if (dy > 20 && direction !== 'up') nextDirection = 'down';
        else if (dy < -20 && direction !== 'down') nextDirection = 'up';
      }
    }, { passive: false });
  }

  function reset() {
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameState = 'waiting';
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function start() {
    if (gameState === 'dead') reset();
    gameState = 'playing';
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 110);
  }

  function update() {
    if (gameState !== 'playing') return;

    direction = nextDirection;

    const head = { ...snake[0] };
    switch (direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      die();
      return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      die();
      return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHigh', highScore.toString());
      }
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function die() {
    gameState = 'dead';
    clearInterval(gameLoop);
    draw();
  }

  function handleKey(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (gameState === 'waiting' || gameState === 'dead') {
      if (e.key === ' ' || e.key === 'Enter') {
        start();
        return;
      }
    }

    switch (e.key) {
      case 'ArrowUp': case 'w': if (direction !== 'down') nextDirection = 'up'; break;
      case 'ArrowDown': case 's': if (direction !== 'up') nextDirection = 'down'; break;
      case 'ArrowLeft': case 'a': if (direction !== 'right') nextDirection = 'left'; break;
      case 'ArrowRight': case 'd': if (direction !== 'left') nextDirection = 'right'; break;
    }

    if (gameState === 'waiting') start();
  }

  function draw() {
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.fillStyle = COLORS.grid;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Food with glow
    ctx.fillStyle = COLORS.foodGlow;
    ctx.fillRect(
      food.x * cellSize - 2,
      food.y * cellSize - 2,
      cellSize + 4,
      cellSize + 4
    );
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(
      food.x * cellSize + 1,
      food.y * cellSize + 1,
      cellSize - 2,
      cellSize - 2
    );

    // Snake
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snake;
      const inset = i === 0 ? 0 : 1;
      ctx.fillRect(
        segment.x * cellSize + inset,
        segment.y * cellSize + inset,
        cellSize - inset * 2,
        cellSize - inset * 2
      );
    });

    // Score
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${score}`, 8, 14);
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${highScore}`, canvas.width - 8, 14);

    // Overlays
    if (gameState === 'waiting') {
      drawOverlay('SNAKE', 'PRESS ANY KEY TO START');
    } else if (gameState === 'dead') {
      drawOverlay('GAME OVER', 'PRESS SPACE TO RETRY');
    }
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(26, 23, 20, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textBright;
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8);

    ctx.fillStyle = COLORS.text;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 14);
  }

  function destroy() {
    if (gameLoop) clearInterval(gameLoop);
    document.removeEventListener('keydown', handleKey);
  }

  return { init, destroy };
})();

// Easter egg toggle
document.addEventListener('DOMContentLoaded', () => {
  const egg = document.querySelector('.easter-egg');
  const overlay = document.querySelector('.game-overlay');
  const closeBtn = overlay?.querySelector('.close-game');
  const canvas = overlay?.querySelector('canvas');

  if (!egg || !overlay || !canvas) return;

  egg.addEventListener('click', () => {
    overlay.classList.add('active');
    Game.init(canvas);
  });

  closeBtn?.addEventListener('click', () => {
    overlay.classList.remove('active');
    Game.destroy();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      Game.destroy();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      Game.destroy();
    }
  });
});
