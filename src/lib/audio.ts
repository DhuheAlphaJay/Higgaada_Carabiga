type Tone = OscillatorType;

let context: AudioContext | null = null;

function getContext() {
  if (!context) {
    context = new AudioContext();
  }
  return context;
}

async function ready() {
  const ctx = getContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

function beep(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  type: Tone,
  volume: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
}

async function play(notes: Array<{ frequency: number; delay: number; duration: number; type: Tone; volume: number }>) {
  const ctx = await ready();
  const now = ctx.currentTime;
  notes.forEach((note) => {
    beep(ctx, note.frequency, now + note.delay, note.duration, note.type, note.volume);
  });
}

export function safePlay(task: () => Promise<void>) {
  void task().catch(() => undefined);
}

/** Cheerful rising arpeggio for a correct answer. */
export function playCorrect() {
  return play([
    { frequency: 523.25, delay: 0, duration: 0.18, type: "triangle", volume: 0.1 },
    { frequency: 659.25, delay: 0.08, duration: 0.18, type: "triangle", volume: 0.1 },
    { frequency: 783.99, delay: 0.16, duration: 0.18, type: "triangle", volume: 0.1 },
    { frequency: 1046.5, delay: 0.24, duration: 0.28, type: "triangle", volume: 0.11 },
  ]);
}

/** Short, soft buzz for a wrong tap. */
export async function playWrong() {
  const ctx = await ready();
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(140, now);
  oscillator.frequency.exponentialRampToValueAtTime(78, now + 0.2);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(480, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.26);
}

/** Short pop when a spelling letter lands in the right slot. */
export function playPop() {
  return play([
    { frequency: 660, delay: 0, duration: 0.07, type: "triangle", volume: 0.06 },
    { frequency: 880, delay: 0.05, duration: 0.1, type: "sine", volume: 0.05 },
  ]);
}

/** Distinct placeholder cue until real phonics clips are added. */
export function playLetterCue(seed: number) {
  const base = 420 + (Math.abs(seed) % 10) * 28;
  return play([
    { frequency: base, delay: 0, duration: 0.12, type: "sine", volume: 0.08 },
    { frequency: base * 1.25, delay: 0.12, duration: 0.18, type: "triangle", volume: 0.07 },
  ]);
}

/** Speaks the hidden prompt, for example "Dooro xarafka: Laam". */
export function speakListenPrompt(name: string) {
  speakPhrase(`Dooro xarafka: ${name}`);
}

/** Speaks the Somali letter name, for example "Jiim". */
export function speakLetterName(name: string) {
  speakPhrase(name);
}

function speakPhrase(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    return;
  }
}

export function speakArabic(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.82;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    return;
  }
}
