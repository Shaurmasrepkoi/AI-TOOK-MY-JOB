const KEY = 'ai-took-my-job:v1';

interface SaveData {
  muted: boolean;
  bestSeconds: number | null;
  completed: number;
}

export class Save {
  private readonly data: SaveData = { muted: false, bestSeconds: null, completed: 0 };

  constructor() {
    try {
      const parsed: Partial<SaveData> | null = JSON.parse(localStorage.getItem(KEY) ?? 'null');
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
