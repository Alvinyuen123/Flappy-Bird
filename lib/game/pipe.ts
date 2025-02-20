export class Pipe {
  x: number;
  topHeight: number;
  gap: number;
  width: number;
  speed: number;
  passed: boolean;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.width = 60;
    this.x = canvasWidth;
    this.gap = 150;
    this.speed = 3;
    this.passed = false;
    
    // Random height for top pipe between 50 and canvas height - gap - 50
    this.topHeight = Math.random() * (canvasHeight - this.gap - 100) + 50;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx: CanvasRenderingContext2D, canvasHeight: number) {
    // Top pipe
    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    
    // Bottom pipe
    const bottomPipeHeight = canvasHeight - (this.topHeight + this.gap);
    ctx.fillRect(this.x, this.topHeight + this.gap, this.width, bottomPipeHeight);
    
    // Pipe caps
    ctx.fillStyle = '#27AE60';
    ctx.fillRect(this.x - 5, this.topHeight - 20, this.width + 10, 20);
    ctx.fillRect(this.x - 5, this.topHeight + this.gap, this.width + 10, 20);
  }

  collidesWith(bird: { x: number; y: number; width: number; height: number }) {
    return (
      bird.x + bird.width / 2 > this.x &&
      bird.x - bird.width / 2 < this.x + this.width &&
      (bird.y - bird.height / 2 < this.topHeight ||
        bird.y + bird.height / 2 > this.topHeight + this.gap)
    );
  }
}
