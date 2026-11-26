import type { Quality } from '../rendering/Renderer';

const KEY = 'ai-took-my-job:v1';

interface SaveData {
  muted: boolean;
  bestSeconds: number | null;
  completed: number;
  quality?: Quality;
  music: number;
  effects: number;
}

export class Save {
  private readonly data: SaveData = { muted: false, bestSeconds: null, completed: 0, music: 0.36, effects: 0.76 };

  constructor() {
    try {
      const parsed: Partial<SaveData> | null = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (parsed?.quality === 'low' || parsed?.quality === 'medium' || parsed?.quality === 'high') {
        this.data.quality = parsed.quality;
      }
      for (const key of ['music', 'effects'] as const) {
        const value = parsed?.[key];
        if (typeof value === 'number' && value >= 0 && value <= 1) this.data[key] = value;
      }
      if (typeof parsed?.muted === 'boolean') this.data.muted = parsed.muted;
      if (typeof parsed?.bestSeconds === 'number' && Number.isFinite(parsed.bestSeconds) && parsed.bestSeconds > 0) {
        this.data.bestSeconds = parsed.bestSeconds;
      }
      if (typeof parsed?.completed === 'number' && Number.isSafeInteger(parsed.completed) && parsed.completed >= 0) {
        this.data.completed = parsed.completed;
      }
    } catch {
      // A blocked or corrupt store leaves the session playable.
    }
  }

  get muted(): boolean { return this.data.muted; }
  get bestSeconds(): number | null { return this.data.bestSeconds; }

  get quality(): Quality | undefined { return this.data.quality; }
  get music(): number { return this.data.music; }
  get effects(): number { return this.data.effects; }

  setQuality(quality: Quality): void {
    this.data.quality = quality;
    this.persist();
  }

  setVolume(music: number, effects: number): void {
    this.data.music = music;
    this.data.effects = effects;
    this.persist();
  }

  setMuted(value: boolean): void {
    this.data.muted = value;
    this.persist();
  }

  finish(seconds: number): boolean {
    const record = this.data.bestSeconds === null || seconds < this.data.bestSeconds;
    if (record) this.data.bestSeconds = seconds;
    this.data.completed++;
    this.persist();
    return record;
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // The in-memory copy remains available until the tab closes.
    }
  }
}
