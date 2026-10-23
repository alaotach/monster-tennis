import { useRef, useEffect } from 'react'
import { useGameStore } from '../store'

export function useInput() {
  const keysPressed = useRef<{ [key: string]: boolean }>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keysPressed.current
}

export function usePlayerControls(playerIndex: number) {
  const keysPressed = useInput()
  
  const getMovementInput = () => {
    let x = 0
    let z = 0

    // Arrow keys or WASD
    if (keysPressed['arrowup'] || keysPressed['w']) z = 1
    if (keysPressed['arrowdown'] || keysPressed['s']) z = -1
    if (keysPressed['arrowright'] || keysPressed['d']) x = 1
    if (keysPressed['arrowleft'] || keysPressed['a']) x = -1

    return { x, z, normalize: Math.sqrt(x * x + z * z) > 0 ? Math.sqrt(x * x + z * z) : 1 }
  }

  const getHitInput = () => {
    return keysPressed[' '] || keysPressed['space']
  }

  const getUltimateInput = () => {
    return keysPressed['q']
  }

  return {
    movement: getMovementInput(),
    hit: getHitInput(),
    ultimate: getUltimateInput(),
  }
}
