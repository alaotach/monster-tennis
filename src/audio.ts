// Web Audio API synthesized sound effects — no external files required

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function resume() {
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()
}

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainStart: number,
  gainEnd: number,
  delay = 0,
  detune = 0
) {
  resume()
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  osc.detune.value = detune
  gain.gain.setValueAtTime(gainStart, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainEnd), ctx.currentTime + delay + duration)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

function playNoise(duration: number, gainStart: number, gainEnd: number, delay = 0) {
  resume()
  const ctx = getCtx()
  const bufSize = ctx.sampleRate * duration
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  src.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(gainStart, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainEnd), ctx.currentTime + delay + duration)
  src.start(ctx.currentTime + delay)
}

export const Audio = {
  hit() {
    playTone(440, 'square', 0.05, 0.5, 0.001)
    playTone(880, 'sine', 0.08, 0.3, 0.001)
  },

  powerHit() {
    playTone(220, 'sawtooth', 0.12, 0.6, 0.001)
    playTone(440, 'sine', 0.2, 0.4, 0.001, 0.02)
    playNoise(0.15, 0.3, 0.001)
  },

  ultimate() {
    // Dramatic boom
    playNoise(0.5, 0.8, 0.001)
    playTone(60, 'sine', 0.6, 0.9, 0.001)
    playTone(120, 'sine', 0.4, 0.7, 0.001, 0.05)
    playTone(240, 'triangle', 0.3, 0.001, 0.1)
    playTone(880, 'sine', 0.25, 0.6, 0.001, 0.08)
    playTone(1760, 'sine', 0.15, 0.4, 0.001, 0.12)
  },

  bounce() {
    playTone(180, 'sine', 0.08, 0.4, 0.001)
    playNoise(0.05, 0.15, 0.001)
  },

  pointWon() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      playTone(f, 'sine', 0.25, 0.5, 0.001, i * 0.1)
    })
  },

  pointLost() {
    const notes = [523, 466, 392, 330]
    notes.forEach((f, i) => {
      playTone(f, 'sine', 0.2, 0.4, 0.001, i * 0.1)
    })
  },

  gameWin() {
    const notes = [523, 659, 784, 1047, 1318]
    notes.forEach((f, i) => {
      playTone(f, 'sine', 0.4, 0.6, 0.001, i * 0.1)
    })
    playNoise(0.1, 0.2, 0.001, 0.5)
  },

  menuHover() {
    playTone(660, 'sine', 0.06, 0.2, 0.001)
  },

  menuClick() {
    playTone(880, 'sine', 0.1, 0.3, 0.001)
    playTone(1320, 'sine', 0.08, 0.2, 0.001, 0.04)
  },

  serve() {
    playTone(330, 'sine', 0.15, 0.4, 0.001)
    playTone(660, 'triangle', 0.1, 0.3, 0.001, 0.08)
  },

  freeze() {
    // Ice ability sound
    for (let i = 0; i < 8; i++) {
      playTone(1000 + i * 200, 'sine', 0.08, 0.15, 0.001, i * 0.04)
    }
    playNoise(0.3, 0.2, 0.001, 0.1)
  },
}
