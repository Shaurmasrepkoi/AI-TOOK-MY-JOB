import { Howl } from 'howler';

type Cue = 'pick' | 'throw' | 'event' | 'win' | 'printer';

function synth(notes: readonly number[], duration: number): string {
  const rate = 16000;
  const count = Math.round(rate * duration);
  const data = new DataView(new ArrayBuffer(44 + count * 2));
  const tag = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) data.setUint8(offset + i, value.charCodeAt(i));
  };
  tag(0, 'RIFF'); data.setUint32(4, 36 + count * 2, true);
  tag(8, 'WAVE'); tag(12, 'fmt '); data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, rate, true); data.setUint32(28, rate * 2, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  tag(36, 'data'); data.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) {
    const beat = i / count * notes.length;
    const phase = beat % 1;
    const frequency = notes[Math.floor(beat)] ?? 0;
    const angle = 2 * Math.PI * i / rate * frequency;
    const envelope = Math.min(phase * 18, 1) * (1 - phase) ** 1.7;
    data.setInt16(44 + i * 2, 9600 * envelope * (Math.sin(angle) + 0.22 * Math.sin(angle * 2)), true);
  }
  return URL.createObjectURL(new Blob([data.buffer], { type: 'audio/wav' }));
}

const tones: Record<Cue, readonly [readonly number[], number]> = {
  pick: [[340, 520], 0.19],
  throw: [[185, 140], 0.19],
  event: [[430, 310, 430], 0.42],
  win: [[392, 494, 587, 784], 0.68],
  printer: [[165, 110, 165], 0.3],
};

export class Audio {
  private readonly sounds = new Map<Cue, Howl>();

  constructor(private muted: boolean) {}

  setMuted(muted: boolean): void {
    this.muted = muted;
    for (const sound of this.sounds.values()) sound.mute(muted);
  }

  play(cue: Cue): void {
    if (this.muted) return;
    let sound = this.sounds.get(cue);
    if (!sound) {
      sound = new Howl({ src: [synth(...tones[cue])], format: ['wav'], volume: 0.48 });
      this.sounds.set(cue, sound);
    }
    sound.play();
  }
}
