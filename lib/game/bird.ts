import { BIRD_SPRITES } from './assets';

export class Bird {
  x: number;
  y: number;
  velocity: number;
  gravity: number;
  jumpForce: number;
  width: number;
  height: number;
  private sprites: { [key: string]: HTMLImageElement } = {};
  private currentSprite: 'NORMAL' | 'UP' | 'DOWN' = 'NORMAL';

  constructor(canvasHeight: number) {
    this.width = 40;
    this.height = 30;
    this.x = 100;
    this.y = canvasHeight / 2;
    this.velocity = 0;
    this.gravity = 0.5;
    this.jumpForce = -8;

    // Initialize sprites
    Object.entries(BIRD_SPRITES).forEach(([key, svg]) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
      this.sprites[key] = img;
    });
  }

  jump() {
    this.velocity = this.jumpForce;
    this.currentSprite = 'UP';
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Update sprite based on velocity
    if (this.velocity < 0) {
      this.currentSprite = 'UP';
    } else if (this.velocity > 2) {
      this.currentSprite = 'DOWN';
    } else {
      this.currentSprite = 'NORMAL';
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Rotate based on velocity
    const rotation = Math.min(Math.max(this.velocity * 0.1, -0.5), 0.5);
    ctx.translate(this.x, this.y);
    ctx.rotate(rotation);

    // Draw the current sprite
    const sprite = this.sprites[this.currentSprite];
    if (sprite) {
      ctx.drawImage(
        sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }

    ctx.restore();
  }
}