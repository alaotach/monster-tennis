import { useRef, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { CHARS } from '../../chars'
import { Audio } from '../../audio'

const COURT_HALF_L = 12
const NET_Z = 0
const NET_Y = 1.0
const COURT_HALF_W = 8

// Trail points
const TRAIL_LENGTH = 24

function BallTrail({ positions, color }: { positions: THREE.Vector3[]; color: string }) {
  const ref = useRef<THREE.Line>(null)
  const geo = useRef(new THREE.BufferGeometry())

  useEffect(() => {
    const pts = new Float32Array(TRAIL_LENGTH * 3)
    geo.current.setAttribute('position', new THREE.BufferAttribute(pts, 3))
  }, [])

  useFrame(() => {
    if (!ref.current || positions.length < 2) return
    const pts = geo.current.attributes.position as THREE.BufferAttribute
    const len = Math.min(positions.length, TRAIL_LENGTH)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const p = positions[Math.max(0, len - 1 - i)]
      if (p) {
        pts.setXYZ(i, p.x, p.y, p.z)
      } else {
        pts.setXYZ(i, 0, -100, 0)
      }
    }
    pts.needsUpdate = true
    geo.current.setDrawRange(0, len)
  })

  return (
    <line ref={ref as any} geometry={geo.current}>
      <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={2} />
    </line>
  )
}

function Ball() {
  const rigidRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const trailPositions = useRef<THREE.Vector3[]>([])

  const updateBall = useGameStore((s) => s.updateBall)
  const scorePoint = useGameStore((s) => s.scorePoint)
  const ball = useGameStore((s) => s.ball)
  const match = useGameStore((s) => s.match)
  const players = useGameStore((s) => s.players)
  const addHitParticle = useGameStore((s) => s.addHitParticle)
  const setBallInPlay = useGameStore((s) => s.setBallInPlay)

  const lastBounceTime = useRef(0)
  const lastScoreTime = useRef(0)
  const frameRef = useRef(0)
  const servingPhaseRef = useRef(match.phase)
  servingPhaseRef.current = match.phase
  const servingPlayerRef = useRef(match.servingPlayer)
  servingPlayerRef.current = match.servingPlayer

  const resetBall = useCallback(() => {
    if (!rigidRef.current) return
    const sp = servingPlayerRef.current
    // Player 0 (human) at Z=+8, player 1 (AI) at Z=-8
    const z = sp === 0 ? 8 : -8
    rigidRef.current.setTranslation({ x: 0, y: 1.5, z }, true)
    rigidRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rigidRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }, [])

  useEffect(() => {
    if (match.phase === 'serving') {
      setTimeout(resetBall, 50)
    }
  }, [match.phase, resetBall])

  // Listen for hit impulse from Player component
  useEffect(() => {
    const handleHit = (e: CustomEvent) => {
      if (!rigidRef.current) return
      const { impulse } = e.detail
      // Apply velocity directly (more reliable than addForce for gameplay)
      rigidRef.current.setLinvel(impulse, true)
      // Dispatch spark event
      const pos = rigidRef.current.translation()
      window.dispatchEvent(new CustomEvent('monster-spark', {
        detail: { pos: [pos.x, pos.y, pos.z], color: e.detail.particleColor ?? '#ffcc00' }
      }))
    }
    window.addEventListener('monster-hit-ball' as any, handleHit)
    return () => window.removeEventListener('monster-hit-ball' as any, handleHit)
  }, [])

  useFrame((state, delta) => {
    if (!rigidRef.current || !meshRef.current) return
    frameRef.current++

    const pos = rigidRef.current.translation()
    const vel = rigidRef.current.linvel()

    // Update store
    if (frameRef.current % 2 === 0) {
      updateBall([pos.x, pos.y, pos.z], [vel.x, vel.y, vel.z])
    }

    // Trail
    trailPositions.current.push(new THREE.Vector3(pos.x, pos.y, pos.z))
    if (trailPositions.current.length > TRAIL_LENGTH) trailPositions.current.shift()

    // Update mesh
    meshRef.current.position.set(pos.x, pos.y, pos.z)

    // Glow based on speed
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2)
    if (glowRef.current) {
      const s = 1 + speed * 0.08
      glowRef.current.scale.setScalar(s)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(0.5, speed * 0.04)
    }

    // Bounce sound on ground hit
    const now = Date.now()
    if (pos.y < 0.25 && now - lastBounceTime.current > 200 && ball.inPlay) {
      lastBounceTime.current = now
      Audio.bounce()
    }

    // Out of bounds / scoring
    // Layout: player 0 at Z=+8, player 1 at Z=-8. Net at Z=0.
    if (!ball.inPlay || now - lastScoreTime.current < 2000) return

    const outLeft = pos.x < -COURT_HALF_W - 0.5
    const outRight = pos.x > COURT_HALF_W + 0.5
    const outFarPos = pos.z > COURT_HALF_L + 0.5  // past player 0 baseline → AI scores
    const outFarNeg = pos.z < -COURT_HALF_L - 0.5  // past AI baseline → player 0 scores
    const hitNet = Math.abs(pos.z) < 0.4 && pos.y < NET_Y + 0.15 && pos.y > 0.05

    if (outLeft || outRight || outFarNeg || outFarPos || hitNet) {
      lastScoreTime.current = now
      setBallInPlay(false)
      const lastHit = ball.lastHitBy
      let winner: 0 | 1 = 0
      if (outFarPos) winner = 1      // ball went past player 0 (human) baseline → AI wins
      else if (outFarNeg) winner = 0 // ball went past AI baseline → human wins
      else if (hitNet) winner = lastHit === 0 ? 1 : 0  // hit net → other player wins
      else winner = lastHit === 0 ? 1 : 0  // side out

      scorePoint(winner)
      Audio[winner === 0 ? 'pointWon' : 'pointLost']()
    }
  })

  const charId = players[ball.lastHitBy === -1 ? 0 : ball.lastHitBy]?.characterId ?? 0
  const trailColor = CHARS[charId]?.trailColor ?? '#ffffff'

  return (
    <>
      {/* Physics body */}
      <RigidBody
        ref={rigidRef}
        colliders={false}
        position={[0, 1.5, -8]}
        restitution={0.75}
        friction={0.4}
        linearDamping={0.05}
        angularDamping={0.3}
        gravityScale={1.5}
      >
        <BallCollider args={[0.12]} />
      </RigidBody>

      {/* Visual mesh (separate from physics so we can style freely) */}
      <group>
        {/* Core ball */}
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={ball.isPowerShot ? '#ff8800' : ball.isUltimateShot ? '#aa00ff' : '#ccff44'}
            emissive={ball.isPowerShot ? '#ff4400' : ball.isUltimateShot ? '#6600aa' : '#88cc00'}
            emissiveIntensity={ball.isPowerShot || ball.isUltimateShot ? 1.5 : 0.4}
            metalness={0.1}
            roughness={0.4}
          />
        </mesh>
        {/* Glow sphere */}
        <mesh ref={glowRef} position={[0, -100, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial
            color={ball.isPowerShot ? '#ff6600' : ball.isUltimateShot ? '#aa44ff' : '#ccff66'}
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Trail */}
      <BallTrail positions={trailPositions.current} color={trailColor} />
    </>
  )
}

export default Ball
