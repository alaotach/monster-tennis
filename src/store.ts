import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CHARS } from './chars'

export type GameMode = 'menu' | 'characterSelect' | 'playing' | 'gameOver' | 'tournamentMode'
export type GamePhase = 'serving' | 'tossing' | 'rallying' | 'pointWon' | 'matchOver'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnimState = 'idle' | 'run' | 'swing' | 'celebrate' | 'hurt' | 'ultimate'
export type GameModeType = 'quick' | 'tournament' | 'practice'

// Tennis score points
export type TennisPoint = 0 | 15 | 30 | 40 | 'Ad'

export interface PlayerState {
  characterId: number
  isAI: boolean
  games: number
  sets: number
  points: TennisPoint
  ultimateCharge: number   // 0-100
  abilityActive: boolean
  abilityOnCooldown: boolean
  position: [number, number, number]
  animState: AnimState
  powerMeter: number       // 0-100, current hold power
  isHolding: boolean
}

export interface BallState {
  position: [number, number, number]
  velocity: [number, number, number]
  lastHitBy: 0 | 1 | -1   // player index or -1 for serve
  speed: number            // magnitude of velocity
  isPowerShot: boolean
  isUltimateShot: boolean
  inPlay: boolean
  bounceCount: number
}

export interface MatchState {
  servingPlayer: 0 | 1
  phase: GamePhase
  rallyCount: number
  pointWinner: 0 | 1 | null
  winner: 0 | 1 | null
  gameWinner: 0 | 1 | null
  setWinner: 0 | 1 | null
  matchWinner: 0 | 1 | null
  deuce: boolean
  advantage: 0 | 1 | null
  currentSet: number      // 0-indexed, max 2
  difficulty: Difficulty
  gameModeType: GameModeType
}

export interface TournamentState {
  active: boolean
  round: number           // 1-3
  maxRounds: number
  wins: number
  opponents: number[]     // characterIds
  currentOpponent: number
}

export interface VFXState {
  hitParticles: { id: number; pos: [number, number, number]; color: string; time: number }[]
  ultimateActive: boolean
  ultimatePlayerId: 0 | 1 | null
  screenShake: number
  slowMo: boolean
}

interface GameStateStore {
  mode: GameMode
  players: [PlayerState, PlayerState]
  ball: BallState
  match: MatchState
  tournament: TournamentState
  vfx: VFXState
  selectedCharacter: number | null

  // Actions
  setMode: (mode: GameMode) => void
  selectCharacter: (id: number) => void
  setDifficulty: (d: Difficulty) => void
  startQuickMatch: () => void
  startTournamentMode: () => void
  startTournamentMatch: () => void
  nextTournamentRound: (won: boolean) => void

  updatePlayerPosition: (idx: 0 | 1, pos: [number, number, number]) => void
  updatePlayerAnim: (idx: 0 | 1, anim: AnimState) => void
  updateBall: (pos: [number, number, number], vel: [number, number, number]) => void
  setBallInPlay: (v: boolean) => void

  setPhase: (phase: GamePhase) => void
  startPowerHold: (idx: 0 | 1) => void
  releasePower: (idx: 0 | 1) => void
  updatePowerMeter: (idx: 0 | 1, v: number) => void
  hitBall: (playerIdx: 0 | 1, power: number, isUltimate: boolean) => void
  addUltimateCharge: (idx: 0 | 1, amount: number) => void
  activateUltimate: (idx: 0 | 1) => void

  scorePoint: (winner: 0 | 1) => void
  dismissPointResult: () => void

  addHitParticle: (pos: [number, number, number], color: string) => void
  clearHitParticles: () => void
  setScreenShake: (v: number) => void
  setSlowMo: (v: boolean) => void
}

const TENNIS_SEQUENCE: TennisPoint[] = [0, 15, 30, 40]

const makePlayer = (id: number, isAI: boolean, startZ: number): PlayerState => ({
  characterId: id,
  isAI,
  games: 0,
  sets: 0,
  points: 0,
  ultimateCharge: 0,
  abilityActive: false,
  abilityOnCooldown: false,
  position: [0, 0.5, startZ],
  animState: 'idle',
  powerMeter: 0,
  isHolding: false,
})

const initialBall: BallState = {
  position: [0, 1.5, 8],
  velocity: [0, 0, 0],
  lastHitBy: -1,
  speed: 0,
  isPowerShot: false,
  isUltimateShot: false,
  inPlay: false,
  bounceCount: 0,
}

const initialMatch: MatchState = {
  servingPlayer: 0,
  phase: 'serving',
  rallyCount: 0,
  pointWinner: null,
  winner: null,
  gameWinner: null,
  setWinner: null,
  matchWinner: null,
  deuce: false,
  advantage: null,
  currentSet: 0,
  difficulty: 'medium',
  gameModeType: 'quick',
}

function advanceTennisScore(current: TennisPoint): TennisPoint {
  const idx = TENNIS_SEQUENCE.indexOf(current as 0 | 15 | 30 | 40)
  if (idx === -1) return 'Ad' // was already Ad
  if (idx < 3) return TENNIS_SEQUENCE[idx + 1]
  return 40 // at 40, handle externally
}

export const useGameStore = create<GameStateStore>()(
  immer((set, get) => ({
    mode: 'menu',
    selectedCharacter: null,
    players: [makePlayer(0, false, -8), makePlayer(3, true, 8)],
    ball: { ...initialBall },
    match: { ...initialMatch },
    tournament: {
      active: false,
      round: 1,
      maxRounds: 3,
      wins: 0,
      opponents: [1, 2, 3], // characterIds of opponents
      currentOpponent: 1,
    },
    vfx: {
      hitParticles: [],
      ultimateActive: false,
      ultimatePlayerId: null,
      screenShake: 0,
      slowMo: false,
    },

    setMode: (mode) => set((s) => { s.mode = mode }),

    selectCharacter: (id) => set((s) => {
      s.selectedCharacter = id
      s.players[0].characterId = id
    }),

    setDifficulty: (d) => set((s) => { s.match.difficulty = d }),

    startQuickMatch: () => set((s) => {
      const charId = s.selectedCharacter ?? 0
      const oppId = [1, 2, 3].find(x => x !== charId) ?? 1
      s.players[0] = makePlayer(charId, false, 8)
      s.players[1] = makePlayer(oppId, true, -8)
      s.ball = { ...initialBall }
      s.match = { ...initialMatch, difficulty: s.match.difficulty, gameModeType: 'quick' }
      s.mode = 'playing'
    }),

    startTournamentMode: () => set((s) => {
      const charId = s.selectedCharacter ?? 0
      const opponents = [0, 1, 2, 3].filter(x => x !== charId)
      s.tournament = {
        active: true,
        round: 1,
        maxRounds: 3,
        wins: 0,
        opponents,
        currentOpponent: opponents[0],
      }
      s.players[0] = makePlayer(charId, false, 8)
      s.players[1] = makePlayer(opponents[0], true, -8)
      s.ball = { ...initialBall }
      s.match = { ...initialMatch, difficulty: s.match.difficulty, gameModeType: 'tournament' }
      s.mode = 'playing'
    }),

    startTournamentMatch: () => set((s) => {
      const charId = s.selectedCharacter ?? 0
      const opp = s.tournament.currentOpponent
      s.players[0] = makePlayer(charId, false, 8)
      s.players[1] = makePlayer(opp, true, -8)
      s.ball = { ...initialBall }
      s.match = { ...initialMatch, difficulty: s.match.difficulty, gameModeType: 'tournament' }
      s.mode = 'playing'
    }),

    nextTournamentRound: (won) => set((s) => {
      if (won) {
        s.tournament.wins++
        s.tournament.round++
        if (s.tournament.round > s.tournament.maxRounds) {
          s.mode = 'gameOver'
          s.match.matchWinner = 0
        } else {
          s.tournament.currentOpponent = s.tournament.opponents[s.tournament.round - 1]
          s.mode = 'tournamentMode'
        }
      } else {
        s.mode = 'gameOver'
        s.match.matchWinner = 1
      }
    }),

    updatePlayerPosition: (idx, pos) => set((s) => { s.players[idx].position = pos }),
    updatePlayerAnim: (idx, anim) => set((s) => { s.players[idx].animState = anim }),
    updateBall: (pos, vel) => set((s) => {
      s.ball.position = pos
      s.ball.velocity = vel
      s.ball.speed = Math.sqrt(vel[0]**2 + vel[1]**2 + vel[2]**2)
    }),
    setBallInPlay: (v) => set((s) => { s.ball.inPlay = v }),

    setPhase: (phase) => set((s) => { s.match.phase = phase }),

    startPowerHold: (idx) => set((s) => { s.players[idx].isHolding = true; s.players[idx].powerMeter = 0 }),
    releasePower: (idx) => set((s) => { s.players[idx].isHolding = false }),
    updatePowerMeter: (idx, v) => set((s) => { s.players[idx].powerMeter = Math.min(100, Math.max(0, v)) }),

    hitBall: (playerIdx, power, isUltimate) => set((s) => {
      const phase = s.match.phase
      if (phase !== 'serving' && phase !== 'rallying' && phase !== 'tossing') return

      s.ball.lastHitBy = playerIdx
      s.ball.isPowerShot = power > 70
      s.ball.isUltimateShot = isUltimate
      s.ball.inPlay = true
      s.match.phase = 'rallying'
      s.match.rallyCount++

      // Ultimate charge on hit
      s.players[playerIdx].ultimateCharge = Math.min(100, s.players[playerIdx].ultimateCharge + 12)
    }),

    addUltimateCharge: (idx, amount) => set((s) => {
      s.players[idx].ultimateCharge = Math.min(100, s.players[idx].ultimateCharge + amount)
    }),

    activateUltimate: (idx) => set((s) => {
      if (s.players[idx].ultimateCharge < 100) return
      s.players[idx].ultimateCharge = 0
      s.players[idx].abilityActive = true
      s.players[idx].abilityOnCooldown = true
      s.vfx.ultimateActive = true
      s.vfx.ultimatePlayerId = idx
      s.vfx.screenShake = 1
      s.vfx.slowMo = true
      setTimeout(() => {
        set((s2) => {
          s2.players[idx].abilityActive = false
          s2.vfx.ultimateActive = false
          s2.vfx.slowMo = false
          setTimeout(() => {
            set((s3) => { s3.players[idx].abilityOnCooldown = false })
          }, 3000)
        })
      }, 1500)
    }),

    scorePoint: (winner) => set((s) => {
      s.match.pointWinner = winner
      s.match.phase = 'pointWon'

      const loser = winner === 0 ? 1 : 0
      const wScore = s.players[winner].points
      const lScore = s.players[loser].points

      // Deuce logic
      if (wScore === 40 && lScore === 40) {
        // deuce → advantage
        if (s.match.advantage === null) {
          s.match.advantage = winner
        } else if (s.match.advantage === winner) {
          // Win game
          s.match.advantage = null
          s.match.deuce = false
          giveGame(s, winner)
        } else {
          // Back to deuce
          s.match.advantage = null
        }
        return
      }

      if (s.match.advantage !== null) {
        if (s.match.advantage === winner) {
          s.match.advantage = null
          s.match.deuce = false
          giveGame(s, winner)
        } else {
          s.match.advantage = null // back to deuce
        }
        return
      }

      // Normal scoring
      if (wScore === 40) {
        if (lScore === 40) {
          s.match.deuce = true
          s.match.advantage = winner
        } else {
          giveGame(s, winner)
        }
      } else {
        s.players[winner].points = advanceTennisScore(wScore)
      }
    }),

    dismissPointResult: () => set((s) => {
      // Reset points for new point
      if (s.match.gameWinner === null) {
        s.players[0].points = 0
        s.players[1].points = 0
        s.match.pointWinner = null
        // Switch serve
        s.match.servingPlayer = s.match.servingPlayer === 0 ? 1 : 0
        s.match.phase = 'serving'
        s.match.rallyCount = 0
        s.ball = { ...initialBall }
        s.ball.position = s.match.servingPlayer === 0 ? [0, 1.5, 8] : [0, 1.5, -8]
        s.match.gameWinner = null
      } else if (s.match.setWinner === null) {
        s.match.gameWinner = null
        s.match.pointWinner = null
        s.players[0].points = 0
        s.players[1].points = 0
        s.match.servingPlayer = s.match.servingPlayer === 0 ? 1 : 0
        s.match.phase = 'serving'
        s.match.rallyCount = 0
        s.ball = { ...initialBall }
        s.ball.position = s.match.servingPlayer === 0 ? [0, 1.5, 8] : [0, 1.5, -8]
        s.match.setWinner = null
      } else {
        // Match over
        if (s.match.matchWinner !== null) {
          if (s.tournament.active && s.match.gameModeType === 'tournament') {
            // handle in UI
          } else {
            s.mode = 'gameOver'
          }
        }
      }
    }),

    addHitParticle: (pos, color) => set((s) => {
      const id = Date.now() + Math.random()
      s.vfx.hitParticles.push({ id, pos, color, time: Date.now() })
      if (s.vfx.hitParticles.length > 20) s.vfx.hitParticles.shift()
    }),

    clearHitParticles: () => set((s) => { s.vfx.hitParticles = [] }),
    setScreenShake: (v) => set((s) => { s.vfx.screenShake = v }),
    setSlowMo: (v) => set((s) => { s.vfx.slowMo = v }),
  }))
)

function giveGame(s: any, winner: 0 | 1) {
  s.players[winner].games++
  s.players[0].points = 0
  s.players[1].points = 0
  s.match.gameWinner = winner

  const loser = winner === 0 ? 1 : 0
  const wGames = s.players[winner].games
  const lGames = s.players[loser].games

  if (wGames >= 6 && wGames - lGames >= 2) {
    // Win set
    s.players[winner].sets++
    s.match.setWinner = winner
    s.players[0].games = 0
    s.players[1].games = 0
    s.match.currentSet++

    if (s.players[winner].sets >= 2) {
      s.match.matchWinner = winner
      s.match.phase = 'matchOver'
    }
  }
}
