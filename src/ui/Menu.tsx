import { useEffect, useRef } from 'react'
import { useGameStore } from '../store'
import { Audio } from '../audio'

// Floating particles background for menu
function MenuParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vy: number; vx: number; r: number; alpha: number; color: string }[] = []
    const colors = ['#ffcc00', '#ff4400', '#aa44ff', '#44aaff', '#44ffcc']

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vy: -0.3 - Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        r: 2 + Math.random() * 4,
        alpha: 0.1 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.y += p.vy
        p.x += p.vx
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowBlur = 10
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.restore()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}

function Menu() {
  const setMode = useGameStore((s) => s.setMode)

  const go = (mode: string) => {
    Audio.menuClick()
    ;(window as any).__lastMenuMode = mode
    if (mode === 'tournament') setMode('characterSelect')
    else if (mode === 'quick') setMode('characterSelect')
    else if (mode === 'practice') setMode('characterSelect')
  }

  const hover = () => Audio.menuHover()

  return (
    <div className="screen menu-screen">
      <MenuParticles />

      <div className="menu-logo">
        <div className="logo-monster">MONSTER</div>
        <div className="logo-tennis">TENNIS</div>
        <div className="logo-sub">⚡ ARCADE SPORTS · 2026 EDITION ⚡</div>
      </div>

      <div className="menu-btns">
        <button
          className="btn btn-gold"
          onClick={() => go('tournament')}
          onMouseEnter={hover}
        >
          🏆 TOURNAMENT MODE
        </button>
        <button
          className="btn btn-primary"
          onClick={() => go('quick')}
          onMouseEnter={hover}
        >
          ⚡ QUICK MATCH
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => go('practice')}
          onMouseEnter={hover}
        >
          🎾 PRACTICE
        </button>
      </div>

      <div className="menu-controls">
        WASD / ARROWS = MOVE &nbsp;·&nbsp; SPACE / TAP = HIT &nbsp;·&nbsp; HOLD = POWER SHOT &nbsp;·&nbsp; Q / ⚡ = ULTIMATE
      </div>
    </div>
  )
}

export default Menu
