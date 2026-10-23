import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store'
import { CHARS } from '../chars'
import { Audio } from '../audio'

// Tennis score label
function formatScore(pts: any): string {
  if (pts === 'Ad') return 'AD'
  return String(pts)
}

// Combo messages for rally streaks
const COMBO_MESSAGES = [
  { min: 5, text: 'NICE RALLY!', sub: 'KEEP IT GOING' },
  { min: 10, text: 'HOT STREAK!', sub: 'AMAZING CONTROL' },
  { min: 15, text: 'UNBREAKABLE!', sub: 'LEGENDARY RALLY' },
  { min: 20, text: 'GODLIKE!', sub: 'YOU\'RE ON FIRE' },
]

function Combo({ rallyCount }: { rallyCount: number }) {
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState({ text: '', sub: '' })
  const prev = useRef(0)

  useEffect(() => {
    const milestone = COMBO_MESSAGES.slice().reverse().find(m => rallyCount >= m.min && rallyCount > prev.current)
    if (milestone) {
      setMsg(milestone)
      setShow(true)
      const t = setTimeout(() => setShow(false), 2000)
      return () => clearTimeout(t)
    }
    prev.current = rallyCount
  }, [rallyCount])

  if (!show) return null
  return (
    <div className="combo-overlay">
      <div className="combo-text">{msg.text}</div>
      <div className="combo-sub">{msg.sub}</div>
    </div>
  )
}

function PointBanner({ winner, onDismiss }: { winner: 0 | 1; onDismiss: () => void }) {
  const players = useGameStore((s) => s.players)
  const char = CHARS[players[winner].characterId]
  const isP0 = winner === 0

  useEffect(() => {
    Audio[isP0 ? 'pointWon' : 'pointLost']()
    const t = setTimeout(onDismiss, 2200)
    return () => clearTimeout(t)
  }, [winner])

  return (
    <div className="point-banner">
      <div className="point-text" style={{ color: isP0 ? '#ffcc00' : '#ff4444' }}>
        {isP0 ? 'POINT!' : 'OPPONENT SCORES!'}
      </div>
      <div className="point-sub">{char.name.toUpperCase()}</div>
    </div>
  )
}

// Touch joystick
function TouchControls() {
  const startPowerHold = useGameStore((s) => s.startPowerHold)
  const releasePower = useGameStore((s) => s.releasePower)
  const activateUltimate = useGameStore((s) => s.activateUltimate)
  const players = useGameStore((s) => s.players)
  const joystickOrigin = useRef<{ x: number; y: number } | null>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const [pressed, setPressed] = useState(false)

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 700

  useEffect(() => {
    if (!isMobile) return
    const move = (e: TouchEvent) => {
      if (!joystickOrigin.current) return
      e.preventDefault()
      const t = e.touches[0]
      const dx = t.clientX - joystickOrigin.current.x
      const dy = t.clientY - joystickOrigin.current.y
      const maxR = 30
      const dist = Math.min(maxR, Math.hypot(dx, dy))
      const angle = Math.atan2(dy, dx)
      const kx = Math.cos(angle) * dist
      const ky = Math.sin(angle) * dist
      if (knobRef.current) knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`
      // Dispatch movement
      window.dispatchEvent(new CustomEvent('touch-joystick', { detail: { dx: kx / maxR, dy: ky / maxR } }))
    }
    const end = () => {
      joystickOrigin.current = null
      if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)'
      window.dispatchEvent(new CustomEvent('touch-joystick', { detail: { dx: 0, dy: 0 } }))
    }
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [isMobile])

  if (!isMobile) return null

  return (
    <>
      <div
        className="mobile-joystick"
        onTouchStart={(e) => {
          joystickOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
      >
        <div ref={knobRef} className="joystick-knob" />
      </div>
    </>
  )
}

function GameUI() {
  const players = useGameStore((s) => s.players)
  const match = useGameStore((s) => s.match)
  const ball = useGameStore((s) => s.ball)
  const startPowerHold = useGameStore((s) => s.startPowerHold)
  const releasePower = useGameStore((s) => s.releasePower)
  const activateUltimate = useGameStore((s) => s.activateUltimate)
  const dismissPointResult = useGameStore((s) => s.dismissPointResult)
  const setMode = useGameStore((s) => s.setMode)

  const p0 = players[0]
  const p1 = players[1]
  const char0 = CHARS[p0.characterId]
  const char1 = CHARS[p1.characterId]

  const ultReady = p0.ultimateCharge >= 100 && !p0.abilityOnCooldown
  const [hitPressed, setHitPressed] = useState(false)

  // Status message
  let statusMsg = ''
  if (match.phase === 'serving') {
    statusMsg = match.servingPlayer === 0 ? 'YOUR SERVE — PRESS HIT' : 'OPPONENT SERVES'
  }

  // Match over
  useEffect(() => {
    if (match.matchWinner !== null) {
      Audio[match.matchWinner === 0 ? 'gameWin' : 'pointLost']()
      setTimeout(() => setMode('gameOver'), 2000)
    }
  }, [match.matchWinner])

  const handleHitDown = () => {
    setHitPressed(true)
    startPowerHold(0)
  }

  const handleHitUp = () => {
    setHitPressed(false)
    releasePower(0)
  }

  return (
    <div className="ui-overlay">
      <div className="hud-wrap">
        {/* Top HUD */}
        <div className="hud-top">
          <div className="hud-player-box">
            <div className="hud-player-label">YOU</div>
            <div className="hud-player-name" style={{ color: char0.accentHex }}>
              {char0.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: 2,
              marginTop: 4
            }}>
              SETS: {p0.sets} · GAMES: {p0.games}
            </div>
          </div>

          <div className="hud-score-center">
            <div className="hud-score-label">MONSTER TENNIS</div>
            <div className="hud-score-main">
              {formatScore(p0.points)} : {formatScore(p1.points)}
            </div>
            {match.deuce && !match.advantage && (
              <div className="hud-sets" style={{ color: '#ffaa44' }}>DEUCE</div>
            )}
            {match.advantage !== null && (
              <div className="hud-sets" style={{ color: '#ffaa44' }}>
                ADV: {match.advantage === 0 ? char0.name.toUpperCase() : char1.name.toUpperCase()}
              </div>
            )}
            {!match.deuce && match.advantage === null && (
              <div className="hud-sets">SETS {p0.sets}–{p1.sets} · GAMES {p0.games}–{p1.games}</div>
            )}
          </div>

          <div className="hud-player-box" style={{ textAlign: 'right' }}>
            <div className="hud-player-label" style={{ textAlign: 'right' }}>OPPONENT</div>
            <div className="hud-player-name" style={{ color: char1.accentHex }}>
              {char1.name.toUpperCase()}
            </div>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: 2,
              marginTop: 4,
              textAlign: 'right'
            }}>
              SETS: {p1.sets} · GAMES: {p1.games}
            </div>
          </div>
        </div>

        {/* Rally count */}
        {match.rallyCount > 0 && (
          <div className="rally-display">RALLY ×{match.rallyCount}</div>
        )}

        {/* Combo overlays */}
        <Combo rallyCount={match.rallyCount} />

        {/* Status message */}
        {statusMsg && (
          <div className="status-overlay">{statusMsg}</div>
        )}

        {/* Point banner */}
        {match.phase === 'pointWon' && match.pointWinner !== null && (
          <PointBanner winner={match.pointWinner} onDismiss={dismissPointResult} />
        )}

        {/* Bottom HUD */}
        <div className="hud-bottom">
          {/* Ultimate panel */}
          <div className="ult-panel">
            <div className="ult-bar-wrap">
              <div className="ult-label">ULTIMATE</div>
              <div className="ult-bar-track">
                <div className="ult-bar-fill" style={{ width: `${p0.ultimateCharge}%` }} />
              </div>
            </div>
            <button
              className={`ult-btn ${ultReady ? 'ready' : 'cooldown'}`}
              onMouseDown={() => { if (ultReady) activateUltimate(0) }}
              onTouchStart={() => { if (ultReady) activateUltimate(0) }}
              style={{ pointerEvents: 'all' }}
            >
              <span>{char0.abilityIcon}</span>
              <span className="ult-btn-label">Q / TAP</span>
            </button>
          </div>

          {/* Hit zone */}
          <div className="hit-zone">
            <div className="hit-hint">
              {p0.isHolding ? '⚡ CHARGING POWER SHOT...' : match.phase === 'serving' ? 'TAP TO SERVE' : 'HIT / SERVE'}
            </div>
            <button
              className={`hit-btn ${hitPressed ? 'pressed' : ''}`}
              onMouseDown={handleHitDown}
              onMouseUp={handleHitUp}
              onTouchStart={handleHitDown}
              onTouchEnd={handleHitUp}
              style={{ pointerEvents: 'all' }}
            >
              {match.phase === 'serving' ? 'SERVE' : 'HIT'}
            </button>
            <div className="power-wrap">
              <div className="power-label">SHOT POWER</div>
              <div className="power-track">
                <div className="power-fill" style={{ width: `${p0.powerMeter}%` }} />
              </div>
            </div>
          </div>

          {/* Controls hint (desktop only) */}
          <div style={{
            minWidth: 130,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
          }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: 2,
              textAlign: 'right',
              lineHeight: 2,
            }}>
              WASD = MOVE<br />
              SPACE = HIT<br />
              HOLD = POWER<br />
              Q = ULTIMATE
            </div>
          </div>
        </div>

        {/* Touch joystick for mobile */}
        <TouchControls />
      </div>
    </div>
  )
}

export default GameUI
