import { useEffect, useRef, useState } from 'react';
import { Trophy, Play, RotateCcw } from 'lucide-react';
import { useGameScores } from '../hooks/useGameScores';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Obstacle extends GameObject {
  type: 'cactus' | 'bird';
}

export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { topScores, loading, saveScore } = useGameScores();

  const gameStateRef = useRef({
    dino: { x: 50, y: 0, width: 40, height: 50, velocityY: 0, isJumping: false },
    obstacles: [] as Obstacle[],
    score: 0,
    level: 1,
    speed: 5,
    frameCount: 0,
    lastObstacleFrame: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 300;
    const GROUND_Y = CANVAS_HEIGHT - 50;
    const GRAVITY = 0.8;
    const JUMP_STRENGTH = -15;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const handleJump = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameStateRef.current.dino.isJumping && gameStarted && !gameOver) {
        e.preventDefault();
        gameStateRef.current.dino.velocityY = JUMP_STRENGTH;
        gameStateRef.current.dino.isJumping = true;
      }
    };

    const handleClick = () => {
      if (!gameStateRef.current.dino.isJumping && gameStarted && !gameOver) {
        gameStateRef.current.dino.velocityY = JUMP_STRENGTH;
        gameStateRef.current.dino.isJumping = true;
      }
    };

    window.addEventListener('keydown', handleJump);
    canvas.addEventListener('click', handleClick);

    const drawDino = (dino: GameObject) => {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

      ctx.fillStyle = '#1e40af';
      ctx.fillRect(dino.x + 25, dino.y + 5, 8, 8);

      ctx.fillRect(dino.x + 5, dino.y + dino.height - 15, 12, 15);
      ctx.fillRect(dino.x + 23, dino.y + dino.height - 15, 12, 15);
    };

    const drawObstacle = (obstacle: Obstacle) => {
      if (obstacle.type === 'cactus') {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillRect(obstacle.x - 5, obstacle.y + 10, 5, 15);
        ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 10, 5, 15);
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(obstacle.x - 10, obstacle.y + obstacle.height / 2);
        ctx.lineTo(obstacle.x, obstacle.y);
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width + 10, obstacle.y + obstacle.height / 2);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.fill();
      }
    };

    const checkCollision = (dino: GameObject, obstacle: Obstacle): boolean => {
      return (
        dino.x < obstacle.x + obstacle.width &&
        dino.x + dino.width > obstacle.x &&
        dino.y < obstacle.y + obstacle.height &&
        dino.y + dino.height > obstacle.y
      );
    };

    const gameLoop = () => {
      if (!gameStarted || gameOver) return;

      const state = gameStateRef.current;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, GROUND_Y + state.dino.height, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - state.dino.height);

      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + state.dino.height);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + state.dino.height);
      ctx.stroke();

      state.dino.velocityY += GRAVITY;
      state.dino.y += state.dino.velocityY;

      if (state.dino.y >= GROUND_Y) {
        state.dino.y = GROUND_Y;
        state.dino.velocityY = 0;
        state.dino.isJumping = false;
      }

      drawDino(state.dino);

      state.frameCount++;

      const minGap = Math.max(80, 120 - state.level * 5);
      if (state.frameCount - state.lastObstacleFrame > minGap) {
        const obstacleType = Math.random() > 0.3 ? 'cactus' : 'bird';
        const newObstacle: Obstacle = {
          x: CANVAS_WIDTH,
          y: obstacleType === 'cactus' ? GROUND_Y + state.dino.height - 40 : GROUND_Y - 20,
          width: obstacleType === 'cactus' ? 20 : 30,
          height: obstacleType === 'cactus' ? 40 : 20,
          type: obstacleType,
        };
        state.obstacles.push(newObstacle);
        state.lastObstacleFrame = state.frameCount;
      }

      state.obstacles = state.obstacles.filter(obstacle => {
        obstacle.x -= state.speed;

        if (checkCollision(state.dino, obstacle)) {
          setGameOver(true);
          setScore(state.score);
          setLevel(state.level);
          return false;
        }

        drawObstacle(obstacle);
        return obstacle.x + obstacle.width > 0;
      });

      state.score += 1;

      const newLevel = Math.floor(state.score / 500) + 1;
      if (newLevel > state.level) {
        state.level = newLevel;
        state.speed = 5 + (newLevel - 1) * 0.5;
      }

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${state.score}`, 20, 30);
      ctx.fillText(`Level: ${state.level}`, 20, 60);

      requestAnimationFrame(gameLoop);
    };

    if (gameStarted && !gameOver) {
      gameLoop();
    }

    return () => {
      window.removeEventListener('keydown', handleJump);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    gameStateRef.current = {
      dino: { x: 50, y: 0, width: 40, height: 50, velocityY: 0, isJumping: false },
      obstacles: [],
      score: 0,
      level: 1,
      speed: 5,
      frameCount: 0,
      lastObstacleFrame: 0,
    };
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
  };

  const handleSaveScore = async () => {
    if (playerName.trim()) {
      await saveScore(playerName.trim(), score, level);
      setShowLeaderboard(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dino Runner</h1>
          <p className="text-gray-600">Jump over obstacles and survive as long as you can!</p>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border-4 border-gray-300 rounded-lg w-full bg-sky-50"
            style={{ maxWidth: '800px', margin: '0 auto', display: 'block' }}
          />

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <button
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg flex items-center gap-3 text-xl transition-all transform hover:scale-105"
              >
                <Play className="w-6 h-6" />
                Start Game
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Game Over!</h2>
                <div className="text-center mb-6">
                  <p className="text-xl text-gray-700">Final Score: <span className="font-bold text-blue-600">{score}</span></p>
                  <p className="text-xl text-gray-700">Level Reached: <span className="font-bold text-green-600">{level}</span></p>
                </div>

                {!showLeaderboard && (
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-3"
                      maxLength={20}
                    />
                    <button
                      onClick={handleSaveScore}
                      disabled={!playerName.trim()}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Trophy className="w-5 h-5" />
                      Save Score
                    </button>
                  </div>
                )}

                <button
                  onClick={startGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>

                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Trophy className="w-5 h-5" />
                  {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
                </button>

                {showLeaderboard && (
                  <div className="mt-6 border-t-2 border-gray-200 pt-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Top 10 Scores</h3>
                    {loading ? (
                      <p className="text-center text-gray-600">Loading...</p>
                    ) : topScores.length > 0 ? (
                      <div className="space-y-2">
                        {topScores.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-gray-600 w-6">#{index + 1}</span>
                              <span className="font-medium text-gray-800">{entry.player_name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-blue-600">{entry.score}</span>
                              <span className="text-gray-500 text-sm ml-2">Lvl {entry.level}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-600">No scores yet. Be the first!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">How to Play:</h3>
          <ul className="text-gray-700 space-y-1">
            <li>• Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Space</kbd> or <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑</kbd> to jump</li>
            <li>• Click on the game canvas to jump</li>
            <li>• Avoid green cacti and red birds</li>
            <li>• Your speed increases with each level</li>
            <li>• Try to get the highest score!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
