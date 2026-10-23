import { useGameStore } from '../store'
import { CHARS } from '../chars'
import { Audio } from '../audio'

function GameOverScreen() {
  const match = useGameStore((s) => s.match)
  const players = useGameStore((s) => s.players)
  const tournament = useGameStore((s) => s.tournament)
  const setMode = useGameStore((s) => s.setMode)
  const startTournamentMatch = useGameStore((s) => s.startTournamentMatch)
  const nextTournamentRound = useGameStore((s) => s.nextTournamentRound)

  const winner = match.matchWinner
  const isWin = winner === 0
  const p0 = players[0]
  const p1 = players[1]

  const onPlayAgain = () => {
    Audio.menuClick()
    setMode('characterSelect')
  }

  const onMenu = () => {
    Audio.menuClick()
    setMode('menu')
  }

  const onNextRound = () => {
    Audio.menuClick()
    nextTournamentRound(isWin)
  }

  const isTournament = tournament.active && match.gameModeType === 'tournament'

  return (
    <div className="screen go-screen">
      <div
        className="go-result"
        style={{ color: isWin ? '#ffcc00' : '#ff3333' }}
      >
        {isWin ? '🏆 VICTORY!' : '💀 DEFEAT'}
      </div>

      <div className="go-detail">
        {isWin
          ? `${CHARS[p0.characterId].name.toUpperCase()} DEFEATS ${CHARS[p1.characterId].name.toUpperCase()}`
          : `${CHARS[p1.characterId].name.toUpperCase()} IS TOO POWERFUL`}
      </div>

      {/* Final score */}
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 32,
        letterSpacing: 8,
        color: 'white',
        marginBottom: 8,
      }}>
        {p0.sets} — {p1.sets}
        <span style={{ fontSize: 14, fontFamily: 'Rajdhani, sans-serif', letterSpacing: 4, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4 }}>
          SETS
        </span>
      </div>

      {isTournament && (
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,180,0,0.2)',
          borderRadius: 12,
          padding: '16px 28px',
          marginBottom: 32,
          textAlign: 'center',
          fontFamily: 'Rajdhani, sans-serif',
          color: 'rgba(255,200,100,0.7)',
          letterSpacing: 2,
          fontSize: 13,
        }}>
          {isWin
            ? tournament.round > tournament.maxRounds
              ? '🏆 TOURNAMENT CHAMPION!'
              : `ROUND ${tournament.round - 1} COMPLETE — ${tournament.maxRounds - tournament.round + 1} MATCH${tournament.maxRounds - tournament.round + 1 !== 1 ? 'ES' : ''} REMAINING`
            : 'TOURNAMENT OVER — ELIMINATED'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        {isTournament && isWin && tournament.round <= tournament.maxRounds && (
          <button className="btn btn-gold" onClick={onNextRound}>
            NEXT ROUND →
          </button>
        )}
        <button className="btn btn-primary" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button className="btn btn-ghost" onClick={onMenu}>
          MAIN MENU
        </button>
      </div>
    </div>
  )
}

export default GameOverScreen
