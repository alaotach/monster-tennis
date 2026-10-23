import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store'

const DEFAULT_POS = new THREE.Vector3(0, 8, 14)
const DEFAULT_LOOK = new THREE.Vector3(0, 0, 0)

function Camera() {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 8, 14))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const lerpSpeed = useRef(0.05)

  const ball = useGameStore((s) => s.ball)
  const vfx = useGameStore((s) => s.vfx)
  const match = useGameStore((s) => s.match)
  const players = useGameStore((s) => s.players)

  useFrame((state, delta) => {
    const bp = ball.position
    const bv = ball.velocity
    const ballPos = new THREE.Vector3(bp[0], bp[1], bp[2])
    const phase = match.phase
    const shake = vfx.screenShake

    if (phase === 'matchOver' || phase === 'pointWon') {
      // Cinematic orbit
      const angle = state.clock.getElapsedTime() * 0.5
      targetPos.current.set(Math.sin(angle) * 18, 9, Math.cos(angle) * 18)
      targetLook.current.set(0, 1, 0)
      lerpSpeed.current = 0.03
    } else if (vfx.ultimateActive) {
      // Dramatic low angle
      const pl = vfx.ultimatePlayerId ?? 0
      const plPos = players[pl].position
      targetPos.current.set(plPos[0] * 0.5, 3, plPos[2] + (pl === 0 ? -6 : 6))
      targetLook.current.set(plPos[0], plPos[1] + 1, plPos[2])
      lerpSpeed.current = 0.08
    } else if (phase === 'rallying' && ball.inPlay) {
      // Track ball with slight height
      const ballX = THREE.MathUtils.clamp(bp[0] * 0.3, -3, 3)
      const ballZ = THREE.MathUtils.clamp(bp[2] * 0.15, -2, 2)
      targetPos.current.set(ballX, 8 + bp[1] * 0.4, 14 + ballZ)
      targetLook.current.set(bp[0] * 0.5, 1, bp[2] * 0.3)
      lerpSpeed.current = ball.isPowerShot ? 0.1 : 0.06
    } else {
      // Default position
      targetPos.current.set(0, 8, 14)
      targetLook.current.set(0, 1, 0)
      lerpSpeed.current = 0.04
    }

    // Screen shake
    if (shake > 0.01) {
      const intensity = shake * 0.3
      camera.position.x += (Math.random() - 0.5) * intensity
      camera.position.y += (Math.random() - 0.5) * intensity * 0.5
    }

    camera.position.lerp(targetPos.current, lerpSpeed.current)

    const lookTarget = new THREE.Vector3().lerpVectors(
      new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),
      targetLook.current,
      0.08
    )
    camera.lookAt(targetLook.current)
    camera.updateProjectionMatrix()
  })

  return null
}

export default Camera
