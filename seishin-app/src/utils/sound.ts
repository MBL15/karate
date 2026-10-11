let audioCtx: AudioContext | null = null

export function unlockAudio() {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    audioCtx = Ctor ? new Ctor() : null
  }
  if (audioCtx?.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

export function beep(freq: number, duration: number, delay = 0) {
  const ctx = unlockAudio()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const t = ctx.currentTime + delay
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export function startSignal() {
  beep(1046, 0.18)
  beep(1318, 0.35, 0.2)
}

export function finishSignal() {
  beep(1046, 0.22)
  beep(1046, 0.22, 0.28)
  beep(1318, 0.6, 0.56)
}

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
