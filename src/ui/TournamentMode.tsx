import { useGameStore } from '../store'
import { CHARS } from '../chars'
import { Audio } from '../audio'

function TournamentMode() {
  const tournament = useGameStore((s) => s.tournament)
  const players = useGameStore((s) => s.players)
  const startTournamentMatch = useGameStore((s) => s.startTournamentMatch)
  const setMode = useGameStore((s) => s.setMode)

  const myChar = CHARS[players[0].characterId]
  const oppChar = CHARS[tournament.currentOpponent] ?? CHARS[1]

  const roundNames = ['QUARTERFINAL', 'SEMIFINAL', 'GRAND FINAL']
  const roundName = roundNames[Math.min(tournament.round - 1, 2)]

  const onFight = () => {
    Audio.menuClick()
    startTournamentMatch()
  }

  const onMenu = () => {
    Audio.menuClick()
    setMode('menu')
  }

  return (
    <div className="screen tourn-screen">
      <div className="tourn-title">🏆 TOURNAMENT</div>
      <div className="tourn-round">{roundName} · ROUND {tournament.round} OF {tournament.maxRounds}</div>

      {/* Bracket */}
      <div className="bracket-wrap">
        {Array.from({ length: tournament.maxRounds }).map((_, i) => {
          const r = i + 1
          const done = r < tournament.round
          const current = r === tournament.round
          const opp = CHARS[tournament.opponents[i]] ?? CHARS[1]
          return (
            <div
              key={r}
              className={`bracket-match ${current ? 'current' : ''} ${done ? 'won' : ''}`}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {done ? '✅' : current ? opp.emoji : '❓'}
              </div>
              <div style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 14,
                letterSpacing: 2,
                color: done ? '#66ff66' : current ? '#ffcc44' : 'rgba(255,255,255,0.25)',
                marginBottom: 4,
              }}>
                {done ? 'BEATEN' : current ? opp.name.toUpperCase() : '???'}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2 }}>
                {roundNames[i]}
              </div>
            </div>
          )
        })}
      </div>

      {/* VS display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 36 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 8 }}>{myChar.emoji}</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 3, color: 'white' }}>
            {myChar.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, marginTop: 2 }}>
            YOU
          </div>
        </div>

        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 40,
          color: '#ff4400',
          letterSpacing: 4,
          textShadow: '0 0 20px #ff4400',
        }}>VS</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 8 }}>{oppChar.emoji}</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 3, color: 'white' }}>
            {oppChar.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 3, marginTop: 2 }}>
            OPPONENT
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-gold" onClick={onFight}>
          ⚔ FIGHT!
        </button>
        <button className="btn btn-ghost" onClick={onMenu}>
          ← MAIN MENU
        </button>
      </div>
    </div>
  )
}

export default TournamentMode
