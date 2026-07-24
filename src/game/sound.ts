// ============================================================
// TETRIS BALANCE — Mini synthé WebAudio (bleeps rétro)
// ============================================================

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.05, when = 0) {
  const a = ac();
  if (!a) return;
  try {
    const t = a.currentTime + when;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* silencieux */ }
}

export const sfx = {
  move:    () => tone(220, 0.05, 'square', 0.03),
  rotate:  () => tone(330, 0.06, 'square', 0.04),
  lock:    () => { tone(160, 0.08, 'square', 0.05); tone(110, 0.1, 'triangle', 0.05, 0.03); },
  clear:   () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.07)); },
  item:    () => { tone(880, 0.08, 'sine', 0.05); tone(1320, 0.12, 'sine', 0.05, 0.08); },
  event:   () => { tone(440, 0.15, 'sawtooth', 0.05); tone(440, 0.15, 'sawtooth', 0.05, 0.2); },
  turn:    () => tone(520, 0.07, 'triangle', 0.04),
  warning: () => { tone(660, 0.1, 'square', 0.05); tone(660, 0.1, 'square', 0.05, 0.15); },
  collapse:() => {
    tone(90, 0.7, 'sawtooth', 0.09);
    tone(60, 0.9, 'triangle', 0.09, 0.1);
    [200, 170, 140, 110, 80].forEach((f, i) => tone(f, 0.15, 'square', 0.05, i * 0.1));
  },
  gameover:() => { [392, 370, 349, 311].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, i * 0.22)); },
  win:     () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'square', 0.05, i * 0.12)); },
};
