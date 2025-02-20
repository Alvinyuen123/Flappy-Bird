// Asset URLs for game sounds
export const AUDIO_ASSETS = {
  JUMP: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  SCORE: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  HIT: "https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3"
} as const;

// Bird sprite states
export const BIRD_SPRITES = {
  NORMAL: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30">
      <path d="M30,15 Q40,12 35,15 T30,15" fill="#FFA500"/> <!-- Wing -->
      <circle cx="20" cy="15" r="12" fill="#FFD700"/> <!-- Body -->
      <circle cx="28" cy="12" r="4" fill="#FF6B6B"/> <!-- Eye -->
      <path d="M32,12 Q36,12 34,14" stroke="#000" fill="none"/> <!-- Beak -->
    </svg>
  `,
  UP: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30">
      <path d="M30,15 Q40,8 35,12 T30,15" fill="#FFA500"/> <!-- Wing up -->
      <circle cx="20" cy="15" r="12" fill="#FFD700"/> <!-- Body -->
      <circle cx="28" cy="12" r="4" fill="#FF6B6B"/> <!-- Eye -->
      <path d="M32,12 Q36,12 34,14" stroke="#000" fill="none"/> <!-- Beak -->
    </svg>
  `,
  DOWN: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30">
      <path d="M30,15 Q40,18 35,20 T30,15" fill="#FFA500"/> <!-- Wing down -->
      <circle cx="20" cy="15" r="12" fill="#FFD700"/> <!-- Body -->
      <circle cx="28" cy="12" r="4" fill="#FF6B6B"/> <!-- Eye -->
      <path d="M32,12 Q36,12 34,14" stroke="#000" fill="none"/> <!-- Beak -->
    </svg>
  `
} as const;

// Colors used in the game
export const COLORS = {
  BIRD_BODY: '#FFD700', // Gold
  BIRD_WING: '#FFA500', // Orange
  PIPE: '#2ECC71',      // Green
  PIPE_EDGE: '#27AE60', // Darker green
  SKY: '#87CEEB',       // Sky blue
  TEXT: '#FFFFFF',      // White
  BUTTON: {
    BG: '#E67E22',      // Orange
    TEXT: '#FFFFFF',    // White
    BORDER: '#D35400'   // Dark orange
  }
} as const;

// Audio manager to handle sound effects
export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement>;

  private constructor() {
    this.sounds = new Map();
    Object.entries(AUDIO_ASSETS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public play(soundKey: keyof typeof AUDIO_ASSETS): void {
    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore errors from browsers blocking autoplay
      });
    }
  }

  public setVolume(volume: number): void {
    this.sounds.forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

// Game dimensions and physics constants
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  BIRD_WIDTH: 40,
  BIRD_HEIGHT: 30,
  PIPE_WIDTH: 60,
  PIPE_GAP: 150,
  GRAVITY: 0.5,
  JUMP_FORCE: -8,
  PIPE_SPEED: 3,
  SPAWN_INTERVAL: 2000, // ms between pipe spawns
  MIN_PIPE_HEIGHT: 50,
  BUTTON_WIDTH: 120,
  BUTTON_HEIGHT: 40,
  BUTTON_MARGIN: 20,
} as const;

// Helper function to create gradient backgrounds
export function createSkyGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS_HEIGHT);
  gradient.addColorStop(0, '#64B5F6'); // Light blue
  gradient.addColorStop(1, '#90CAF9'); // Slightly darker blue
  return gradient;
}