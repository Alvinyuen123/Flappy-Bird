import { Bird } from "./bird";
import { Pipe } from "./pipe";
import { AUDIO_ASSETS, COLORS, GAME_CONSTANTS } from "./assets";

interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bird: Bird;
  private pipes: Pipe[];
  private score: number;
  private gameOver: boolean;
  private frameId: number;
  private lastPipeSpawn: number;
  private onGameOver?: (score: number) => void;
  private sounds: {
    jump?: HTMLAudioElement;
    score?: HTMLAudioElement;
    hit?: HTMLAudioElement;
  };
  private buttons: {
    restart: Button;
    share: Button;
  };

  constructor(canvas: HTMLCanvasElement, onGameOver?: (score: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.bird = new Bird(canvas.height);
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.frameId = 0;
    this.lastPipeSpawn = 0;
    this.onGameOver = onGameOver;
    this.sounds = {};

    // Initialize buttons
    const buttonY = canvas.height / 2 + 50;
    this.buttons = {
      restart: {
        x: canvas.width / 2 - GAME_CONSTANTS.BUTTON_WIDTH - GAME_CONSTANTS.BUTTON_MARGIN,
        y: buttonY,
        width: GAME_CONSTANTS.BUTTON_WIDTH,
        height: GAME_CONSTANTS.BUTTON_HEIGHT,
        text: "RESTART"
      },
      share: {
        x: canvas.width / 2 + GAME_CONSTANTS.BUTTON_MARGIN,
        y: buttonY,
        width: GAME_CONSTANTS.BUTTON_WIDTH,
        height: GAME_CONSTANTS.BUTTON_HEIGHT,
        text: "SHARE"
      }
    };

    // Initialize sounds with error handling
    try {
      this.sounds = {
        jump: new Audio(AUDIO_ASSETS.JUMP),
        score: new Audio(AUDIO_ASSETS.SCORE),
        hit: new Audio(AUDIO_ASSETS.HIT),
      };

      // Preload sounds
      Object.values(this.sounds).forEach(sound => {
        if (sound) {
          sound.preload = 'auto';
        }
      });
    } catch (err) {
      console.warn('Failed to load audio assets:', err);
    }

    this.setupControls();
  }

  private setupControls() {
    const handleJump = (e?: Event) => {
      if (e) {
        e.preventDefault();
      }

      if (this.gameOver) {
        return;
      }

      this.bird.jump();
      try {
        if (this.sounds.jump) {
          this.sounds.jump.currentTime = 0;
          this.sounds.jump.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to play jump sound:', err);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (this.gameOver) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if restart button was clicked
        if (this.isPointInButton(x, y, this.buttons.restart)) {
          this.restart();
        }
        // Check if share button was clicked
        else if (this.isPointInButton(x, y, this.buttons.share)) {
          this.shareScore();
        }
      } else {
        handleJump();
      }
    };

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        handleJump(e);
      }
    });

    this.canvas.addEventListener("click", handleClick);
  }

  private isPointInButton(x: number, y: number, button: Button): boolean {
    return (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    );
  }

  private shareScore() {
    // For now, just copy score to clipboard
    const text = `I scored ${this.score} points in Flappy Bird!`;
    navigator.clipboard.writeText(text).then(() => {
      console.log('Score copied to clipboard');
    }).catch(err => {
      console.warn('Failed to copy score:', err);
    });
  }

  restart() {
    if (!this.gameOver) return; // Only allow restart when game is over

    this.bird = new Bird(this.canvas.height);
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.lastPipeSpawn = 0;
    this.start();
  }

  start() {
    if (this.frameId) return;
    const loop = () => {
      this.update();
      this.draw();
      if (!this.gameOver) {
        this.frameId = requestAnimationFrame(loop);
      }
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  }

  private update() {
    if (this.gameOver) return;

    this.bird.update();

    // Spawn new pipes
    if (this.lastPipeSpawn === 0 || this.lastPipeSpawn < Date.now() - 2000) {
      this.pipes.push(new Pipe(this.canvas.width, this.canvas.height));
      this.lastPipeSpawn = Date.now();
    }

    // Update and check pipes
    this.pipes.forEach((pipe) => {
      pipe.update();

      // Check collisions
      if (pipe.collidesWith(this.bird)) {
        this.handleGameOver();
        return;
      }

      // Score points
      if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true;
        this.score++;
        try {
          this.sounds.score?.play().catch(() => {});
        } catch (err) {
          console.warn('Failed to play score sound:', err);
        }
      }
    });

    // Remove off-screen pipes
    this.pipes = this.pipes.filter((pipe) => pipe.x + pipe.width > 0);

    // Check canvas boundaries
    if (
      this.bird.y - this.bird.height / 2 <= 0 ||
      this.bird.y + this.bird.height / 2 >= this.canvas.height
    ) {
      this.handleGameOver();
    }
  }

  private handleGameOver() {
    if (this.gameOver) return; // Prevent multiple triggers

    this.gameOver = true;
    try {
      this.sounds.hit?.play().catch(() => {});
    } catch (err) {
      console.warn('Failed to play hit sound:', err);
    }

    // Stop the game loop
    this.stop();

    // Draw the game over screen immediately
    this.draw();

    // Notify about game over with final score
    if (this.onGameOver) {
      this.onGameOver(this.score);
    }
  }

  private drawButton(button: Button) {
    const ctx = this.ctx;

    // Button background
    ctx.fillStyle = COLORS.BUTTON.BG;
    ctx.strokeStyle = COLORS.BUTTON.BORDER;
    ctx.lineWidth = 3;

    // Rounded rectangle
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(button.x + radius, button.y);
    ctx.lineTo(button.x + button.width - radius, button.y);
    ctx.quadraticCurveTo(button.x + button.width, button.y, button.x + button.width, button.y + radius);
    ctx.lineTo(button.x + button.width, button.y + button.height - radius);
    ctx.quadraticCurveTo(button.x + button.width, button.y + button.height, button.x + button.width - radius, button.y + button.height);
    ctx.lineTo(button.x + radius, button.y + button.height);
    ctx.quadraticCurveTo(button.x, button.y + button.height, button.x, button.y + button.height - radius);
    ctx.lineTo(button.x, button.y + radius);
    ctx.quadraticCurveTo(button.x, button.y, button.x + radius, button.y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Button text
    ctx.fillStyle = COLORS.BUTTON.TEXT;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      button.text,
      button.x + button.width / 2,
      button.y + button.height / 2
    );
  }

  private draw() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = "#87CEEB";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw pipes
    this.pipes.forEach((pipe) => pipe.draw(this.ctx, this.canvas.height));

    // Draw bird
    this.bird.draw(this.ctx);

    // Draw score
    this.ctx.fillStyle = "white";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 50);

    if (this.gameOver) {
      // Semi-transparent overlay
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Score display
      this.ctx.fillStyle = "white";
      this.ctx.font = "48px Arial";
      this.ctx.fillText("SCORE", this.canvas.width / 2, this.canvas.height / 2 - 80);
      this.ctx.fillText(this.score.toString(), this.canvas.width / 2, this.canvas.height / 2 - 20);

      // Draw buttons
      this.drawButton(this.buttons.restart);
      this.drawButton(this.buttons.share);
    }
  }

  getScore() {
    return this.score;
  }

  isGameOver() {
    return this.gameOver;
  }
}