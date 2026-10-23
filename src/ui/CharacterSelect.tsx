import { useState } from 'react'
import { useGameStore, Difficulty } from '../store'
import { CHARS } from '../chars'
import { Audio } from '../audio'

const CARD_CLASSES = ['card-rock', 'card-shadow', 'card-fire', 'card-ice']

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="stat-track">
      <div
        className="stat-fill"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  )
}

function CharacterSelect() {
  const selectedCharacter = useGameStore((s) => s.selectedCharacter)
  const selectCharacter = useGameStore((s) => s.selectCharacter)
  const setDifficulty = useGameStore((s) => s.setDifficulty)
  const difficulty = useGameStore((s) => s.match.difficulty)
  const mode = useGameStore((s) => s.mode)
  const startQuickMatch = useGameStore((s) => s.startQuickMatch)
  const startTournamentMode = useGameStore((s) => s.startTournamentMode)
  const setMode = useGameStore((s) => s.setMode)

  const onSelect = (id: number) => {
    Audio.menuClick()
    selectCharacter(id)
  }

  const onConfirm = () => {
    if (selectedCharacter === null) return
    Audio.gameWin()
    const prevMode = (window as any).__lastMenuMode ?? 'quick'
    if (prevMode === 'tournament') {
      startTournamentMode()
    } else {
      startQuickMatch()
    }
  }

  const onBack = () => {
    Audio.menuClick()
    setMode('menu')
  }

  const diffColors: Record<Difficulty, string> = {
    easy: '#44cc44',
    medium: '#ffcc44',
    hard: '#ff4400',
  }

  const gradients: Record<number, string> = {
    0: 'linear-gradient(90deg, #8B6914, #c8a040)',
    1: 'linear-gradient(90deg, #6622cc, #aa44ff)',
    2: 'linear-gradient(90deg, #cc2200, #ff6600)',
    3: 'linear-gradient(90deg, #1144aa, #44aaff)',
  }

  const glows: Record<number, string> = {
    0: 'radial-gradient(circle, #c8a040, #4a3010)',
    1: 'radial-gradient(circle, #9a44ff, #200040)',
    2: 'radial-gradient(circle, #ff6600, #440000)',
    3: 'radial-gradient(circle, #88ddff, #001830)',
  }

  const glowShadows: Record<number, string> = {
    0: '0 0 25px #8B6914',
    1: '0 0 25px #7a22dd',
    2: '0 0 25px #cc2200',
    3: '0 0 25px #2266cc',
  }

  return (
    <div className="screen cs-screen">
      <div className="cs-title">SELECT YOUR MONSTER</div>
      <div className="cs-sub">EACH CHAMPION HAS A UNIQUE ULTIMATE ABILITY</div>

      <div className="char-grid">
        {CHARS.map((char) => (
          <div
            key={char.id}
            className={`char-card ${CARD_CLASSES[char.id]} ${selectedCharacter === char.id ? 'selected' : ''}`}
            onClick={() => onSelect(char.id)}
            onMouseEnter={() => Audio.menuHover()}
          >
            <div
              className="char-emoji"
              style={{
                background: glows[char.id],
                boxShadow: glowShadows[char.id],
              }}
            >
              {char.emoji}
            </div>

            <div className="char-name">{char.name.toUpperCase()}</div>
            <div className="char-ability-name">⚡ {char.abilityName.toUpperCase()}</div>

            <div className="stat-row">
              <div className="stat-label">POWER</div>
              <StatBar value={char.power} color={gradients[char.id]} />
            </div>
            <div className="stat-row">
              <div className="stat-label">SPEED</div>
              <StatBar value={char.speed} color={gradients[char.id]} />
            </div>
            <div className="stat-row">
              <div className="stat-label">SPECIAL</div>
              <StatBar value={char.special} color={gradients[char.id]} />
            </div>
          </div>
        ))}
      </div>

      <div className="cs-bottom">
        <div className="cs-selected-info">
          {selectedCharacter !== null
            ? `${CHARS[selectedCharacter].abilityIcon} ${CHARS[selectedCharacter].abilityName.toUpperCase()}: ${CHARS[selectedCharacter].abilityDesc}`
            : '— SELECT A MONSTER TO BEGIN —'}
        </div>

        <div className="diff-row">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <div
              key={d}
              className={`diff-pill diff-${d} ${difficulty === d ? 'active' : ''}`}
              onClick={() => {
                Audio.menuClick()
                setDifficulty(d)
              }}
            >
              {d.toUpperCase()}
            </div>
          ))}
        </div>

        {selectedCharacter !== null && (
          <button className="btn btn-gold" onClick={onConfirm}>
            ENTER THE ARENA ⚔
          </button>
        )}

        <button className="btn btn-ghost" onClick={onBack} style={{ marginTop: 6 }}>
          ← BACK
        </button>
      </div>
    </div>
  )
}

export default CharacterSelect
