import { create } from 'zustand'

interface GamePhysicsState {
  ballRef: any | null
  setBallRef: (ref: any) => void
  applyHitForce: (direction: [number, number, number], power: number) => void
}

export const useGamePhysics = create<GamePhysicsState>((set, get) => ({
  ballRef: null,
  setBallRef: (ref) => set({ ballRef: ref }),
  applyHitForce: (direction, power) => {
    const ballRef = get().ballRef
    if (!ballRef) return

    const force = {
      x: direction[0] * power * 15,
      y: direction[1] * power * 15,
      z: direction[2] * power * 15,
    }

    ballRef.applyImpulse(force, true)
  },
}))

// Game scoring state
interface GameScore {
  player1: number
  player2: number
  serving: number // 0 or 1
}

export const useGameScore = create<GameScore & {
  addPoint: (playerIndex: number) => void
  resetSet: () => void
  setSserver: (playerIndex: number) => void
}>((set) => ({
  player1: 0,
  player2: 0,
  serving: 0,

  addPoint: (playerIndex) =>
    set((state) => ({
      [playerIndex === 0 ? 'player1' : 'player2']: state[playerIndex === 0 ? 'player1' : 'player2'] + 1,
    })),

  resetSet: () =>
    set({
      player1: 0,
      player2: 0,
    }),

  setSserver: (playerIndex) =>
    set({
      serving: playerIndex,
    }),
}))
