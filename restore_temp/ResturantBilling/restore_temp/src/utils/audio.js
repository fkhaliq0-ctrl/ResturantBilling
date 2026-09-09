// Audio feedback using Web Audio API — no external dependencies needed

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silent fail if audio is blocked
  }
}

export function playAddSound() {
  playTone(600, 0.1, 'sine', 0.25);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.25), 100);
}

export function playRemoveSound() {
  playTone(400, 0.15, 'sine', 0.2);
  setTimeout(() => playTone(300, 0.15, 'sine', 0.2), 100);
}

export function playCheckoutSuccess() {
  // Happy ascending tones
  playTone(523, 0.15, 'sine', 0.3);   // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);  // E5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 300);   // G5
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 450);  // C6
}

export function playErrorSound() {
  playTone(200, 0.2, 'square', 0.15);
  setTimeout(() => playTone(150, 0.3, 'square', 0.15), 200);
}

export function playKeyPress() {
  playTone(500, 0.05, 'sine', 0.15);
}

export function playButtonPress() {
  playTone(440, 0.08, 'sine', 0.2);
}
