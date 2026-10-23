import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { CHARS } from '../../chars'
import { Audio } from '../../audio'

const COURT_HALF_L = 12
const COURT_HALF_W = 7.5
const NET_Y = 1.0
const HIT_RANGE = 1.4

// Difficulty settings
const DIFF_CONFIG = {
  easy:   { reactionTime: 80,  hitChance: 0.55, accuracy: 0.6, speed: 0.7 },
  medium: { reactionTime: 50,  hitChance: 0.75, accuracy: 0.8, speed: 1.0 },
  hard:   { reactionTime: 20,  hitChance: 0.92, accuracy: 0.95, speed: 1.3 },
}

// ─────────────────────────────────────────────
// Monster character visual models
// ─────────────────────────────────────────────
function RockTitanMesh({ t }: { t: number }) {
  const c = CHARS[0]
  const swing = Math.sin(t * 8) * 0.3
  return (
    <group scale={[1.3, 1.3, 1.3]}>
      {/* Body - chunky block */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.35]} />
        <meshStandardMaterial color={c.bodyColor} roughness={0.95} metalness={0.1}
          emissive={c.glowHex} emissiveIntensity={0.05} />
      </mesh>
      {/* Shoulder blocks */}
      <mesh position={[-0.35, 0.65, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={c.colorHex} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.65, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color={c.colorHex} roughness={0.9} />
      </mesh>
      {/* Head - angular boulder */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.38, 0.35, 0.33]} />
        <meshStandardMaterial color={c.colorHex} roughness={0.85} />
      </mesh>
      {/* Eyes - glowing amber */}
      <mesh position={[-0.1, 0.93, 0.17]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color={c.accentHex} />
      </mesh>
      <mesh position={[0.1, 0.93, 0.17]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color={c.accentHex} />
      </mesh>
      {/* Racket arm */}
      <group position={[0.4, 0.5, 0]} rotation={[0, 0, -0.3 + swing]}>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.1]} />
          <meshStandardMaterial color={c.darkColor} roughness={0.8} />
        </mesh>
        {/* Racket head */}
        <mesh position={[0.42, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 8, 12]} />
          <meshStandardMaterial color={c.accentHex} metalness={0.5} emissive={c.accentHex} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.42, 0, 0]}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshStandardMaterial color={c.glowHex} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Legs */}
      <mesh position={[-0.14, 0.09, 0]} castShadow>
        <boxGeometry args={[0.16, 0.25, 0.18]} />
        <meshStandardMaterial color={c.darkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.14, 0.09, 0]} castShadow>
        <boxGeometry args={[0.16, 0.25, 0.18]} />
        <meshStandardMaterial color={c.darkColor} roughness={0.9} />
      </mesh>
    </group>
  )
}

function ShadowBeastMesh({ t }: { t: number }) {
  const c = CHARS[1]
  const float = Math.sin(t * 3) * 0.08
  const swing = Math.sin(t * 8) * 0.35
  return (
    <group scale={[1.0, 1.0, 1.0]} position={[0, float, 0]}>
      {/* Main body - wispy cloud shape */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={c.bodyColor} transparent opacity={0.9}
          emissive={c.glowHex} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* Floating tendrils */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[
          Math.sin(t * 2 + i * 1.57) * 0.18,
          0.25 + Math.cos(t * 2 + i * 1.57) * 0.08,
          Math.cos(t * 2 + i * 1.57) * 0.18
        ]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={c.darkColor} transparent opacity={0.7}
            emissive={c.glowHex} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Main eye */}
      <mesh position={[0, 0.52, 0.26]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color={c.accentHex} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0.52, 0.33]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Small side eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, 0.49, 0.22]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={c.accentHex} />
        </mesh>
      ))}
      {/* Racket arm */}
      <group position={[0.32, 0.45, 0]} rotation={[0, 0, -0.2 + swing]}>
        <mesh position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color={c.colorHex} emissive={c.glowHex} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.02, 8, 12]} />
          <meshStandardMaterial color={c.accentHex} emissive={c.accentHex} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <planeGeometry args={[0.24, 0.24]} />
          <meshStandardMaterial color={c.glowHex} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

function FireImpMesh({ t }: { t: number }) {
  const c = CHARS[2]
  const swing = Math.sin(t * 9) * 0.4
  const hop = Math.abs(Math.sin(t * 6)) * 0.08
  return (
    <group scale={[0.85, 0.85, 0.85]} position={[0, hop, 0]}>
      {/* Legs */}
      <mesh position={[-0.1, 0.08, 0]}>
        <boxGeometry args={[0.13, 0.22, 0.12]} />
        <meshStandardMaterial color={c.darkColor} />
      </mesh>
      <mesh position={[0.1, 0.08, 0]}>
        <boxGeometry args={[0.13, 0.22, 0.12]} />
        <meshStandardMaterial color={c.darkColor} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.38, 0.5, 0.28]} />
        <meshStandardMaterial color={c.bodyColor} emissive={c.glowHex} emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={c.colorHex} emissive={c.glowHex} emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      {/* Horn */}
      <mesh position={[0, 1.04, 0]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.06, 0.25, 6]} />
        <meshStandardMaterial color={c.darkColor} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.09, 0.8, 0.2]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      <mesh position={[0.09, 0.8, 0.2]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      {/* Racket arm */}
      <group position={[0.28, 0.4, 0]} rotation={[0, 0, -0.15 + swing]}>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.22, 0.09, 0.09]} />
          <meshStandardMaterial color={c.darkColor} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <torusGeometry args={[0.13, 0.022, 8, 12]} />
          <meshStandardMaterial color={c.accentHex} emissive={c.accentHex} emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <planeGeometry args={[0.22, 0.22]} />
          <meshStandardMaterial color="#ff6600" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Flame particles */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            (Math.sin(t * 4 + i * 2.1) * 0.1),
            1.1 + Math.abs(Math.sin(t * 5 + i)) * 0.18,
            (Math.cos(t * 3 + i * 1.5) * 0.08)
          ]}
        >
          <sphereGeometry args={[0.04 + Math.sin(t * 7 + i) * 0.015, 6, 6]} />
          <meshBasicMaterial color={i === 0 ? '#ff4400' : i === 1 ? '#ff8800' : '#ffcc00'} />
        </mesh>
      ))}
    </group>
  )
}

function IceGolemMesh({ t }: { t: number }) {
  const c = CHARS[3]
  const swing = Math.sin(t * 7) * 0.28
  return (
    <group scale={[1.2, 1.2, 1.2]}>
      {/* Legs */}
      <mesh position={[-0.15, 0.1, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.18]} />
        <meshStandardMaterial color={c.darkColor} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, 0.1, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.18]} />
        <meshStandardMaterial color={c.darkColor} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.52, 0.55, 0.36]} />
        <meshStandardMaterial color={c.bodyColor} transparent opacity={0.92}
          metalness={0.6} roughness={0.1} emissive={c.glowHex} emissiveIntensity={0.15} />
      </mesh>
      {/* Ice spikes on shoulders */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.78, 0]} rotation={[0, 0, x > 0 ? 0.5 : -0.5]}>
          <coneGeometry args={[0.07, 0.28, 5]} />
          <meshStandardMaterial color={c.accentHex} transparent opacity={0.8}
            metalness={0.7} roughness={0.1} emissive={c.glowHex} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Head */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.4, 0.38, 0.36]} />
        <meshStandardMaterial color={c.colorHex} metalness={0.5} roughness={0.15}
          transparent opacity={0.9} emissive={c.glowHex} emissiveIntensity={0.1} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.95, 0.19]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={c.accentHex} />
      </mesh>
      <mesh position={[0.12, 0.95, 0.19]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={c.accentHex} />
      </mesh>
      {/* Ice crown spikes */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 1.16, 0]}>
          <coneGeometry args={[0.04, 0.18, 5]} />
          <meshStandardMaterial color={c.accentHex} transparent opacity={0.85}
            metalness={0.8} roughness={0.05} emissive={c.glowHex} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* Racket arm */}
      <group position={[0.38, 0.5, 0]} rotation={[0, 0, -0.2 + swing]}>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.28, 0.1, 0.08]} />
          <meshStandardMaterial color={c.darkColor} metalness={0.6} />
        </mesh>
        <mesh position={[0.38, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 8, 12]} />
          <meshStandardMaterial color={c.accentHex} metalness={0.8} roughness={0.05}
            emissive={c.glowHex} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.38, 0, 0]}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshStandardMaterial color={c.glowHex} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

const CHAR_MESHES = [RockTitanMesh, ShadowBeastMesh, FireImpMesh, IceGolemMesh]

// ─────────────────────────────────────────────
// Player component
// ─────────────────────────────────────────────
interface PlayerProps {
  playerIndex: 0 | 1
  isAI: boolean
}

function Player({ playerIndex, isAI }: PlayerProps) {
  const rigidRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const t = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const lastHitTime = useRef(0)
  const lastAiUpdateTime = useRef(0)
  const ultimateArmed = useRef(false)
  const frozenUntil = useRef(0)

  const players = useGameStore((s) => s.players)
  const ball = useGameStore((s) => s.ball)
  const match = useGameStore((s) => s.match)
  const hitBall = useGameStore((s) => s.hitBall)
  const updatePlayerPosition = useGameStore((s) => s.updatePlayerPosition)
  const updatePlayerAnim = useGameStore((s) => s.updatePlayerAnim)
  const addUltimateCharge = useGameStore((s) => s.addUltimateCharge)
  const activateUltimate = useGameStore((s) => s.activateUltimate)
  const addHitParticle = useGameStore((s) => s.addHitParticle)
  const setScreenShake = useGameStore((s) => s.setScreenShake)
  const startPowerHold = useGameStore((s) => s.startPowerHold)
  const releasePower = useGameStore((s) => s.releasePower)
  const updatePowerMeter = useGameStore((s) => s.updatePowerMeter)

  const player = players[playerIndex]
  const char = CHARS[player.characterId]
  // Player 0 = human, near camera (Z=+8). Player 1 = AI, far side (Z=-8).
  const startZ = playerIndex === 0 ? 8 : -8

  // ─── Input setup ───────────────────────
  useEffect(() => {
    if (isAI) return

    // Store handlers so cleanup can reference same functions
    const handleDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (e.code === 'Space') {
        startPowerHold(playerIndex)
        e.preventDefault()
      }
      if (e.code === 'KeyQ') {
        activateUltimate(playerIndex)
      }
    }
    const handleUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
      if (e.code === 'Space') {
        releasePower(playerIndex)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [isAI, playerIndex])

  // Keep a ref to ball position for fresh data in tryHit (avoids stale closure)
  const ballPosRef = useRef<[number, number, number]>([0, 1.5, 8])

  // ─── Hit the ball ───────────────────────
  const tryHit = useCallback((power: number, isUltimate = false) => {
    if (!rigidRef.current) return
    const now = Date.now()
    if (now - lastHitTime.current < 300) return

    const state = useGameStore.getState()
    const phase = state.match.phase
    if (phase !== 'serving' && phase !== 'rallying' && phase !== 'tossing') return

    const myPos = rigidRef.current.translation()
    const bp = ballPosRef.current

    // During serve: always allow (ball is right beside player at spawn)
    // During rally: generous distance check
    if (phase === 'rallying') {
      const dx = bp[0] - myPos.x
      const dy = bp[1] - myPos.y
      const dz = bp[2] - myPos.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist > 2.5) return
    }

    lastHitTime.current = now
    hitBall(playerIndex, power, isUltimate)

    // Impulse on ball — player 0 fires toward Z=-12 (AI side), player 1 toward Z=+12
    const targetZ = playerIndex === 0 ? -12 : 12
    const targetX = (Math.random() - 0.5) * 8
    const speedMult = 0.45 + (power / 100) * 0.55
    const baseSpeed = char.power * 0.01 * speedMult * 20

    const dir = new THREE.Vector3(targetX - bp[0], 0, targetZ - bp[2]).normalize()
    const impulse = {
      x: dir.x * baseSpeed,
      y: isUltimate ? 6 : 3.5 + (power / 100) * 3.5,
      z: dir.z * baseSpeed,
    }

    // Dispatch to ball component via custom event
    window.dispatchEvent(new CustomEvent('monster-hit-ball', { detail: { impulse, playerIndex, particleColor: char.particleColor } }))

    // VFX
    addHitParticle(bp, char.particleColor)
    if (power > 70) setScreenShake(0.3)
    Audio[power > 70 ? 'powerHit' : 'hit']()
    if (isUltimate) {
      Audio.ultimate()
      setScreenShake(0.8)
    }

    updatePlayerAnim(playerIndex, 'swing')
    setTimeout(() => updatePlayerAnim(playerIndex, 'idle'), 400)
  }, [char, playerIndex])

  // ─── Game loop ───────────────────────
  useFrame((_, delta) => {
    if (!rigidRef.current || !groupRef.current) return
    t.current += delta

    // Always keep ballPosRef fresh
    ballPosRef.current = useGameStore.getState().ball.position

    const pos = rigidRef.current.translation()

    // Frozen check
    if (Date.now() < frozenUntil.current) {
      rigidRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const spd = char.speed * 0.1
    const phase = match.phase

    if (!isAI) {
      // ─── Human player movement ───────
      // Player 0 is at Z=+8 side (near camera). W=move toward net (neg Z), S=away.
      let vx = 0, vz = 0
      const k = keysRef.current
      if (k['KeyA'] || k['ArrowLeft'])  vx -= spd
      if (k['KeyD'] || k['ArrowRight']) vx += spd
      if (k['KeyW'] || k['ArrowUp']) {
        vz -= spd  // toward net (Z decreases toward 0)
        if (pos.z < 0.8) vz = 0 // don't cross net
      }
      if (k['KeyS'] || k['ArrowDown']) {
        vz += spd  // away from net
      }

      // Power meter update while holding
      if (player.isHolding) {
        updatePowerMeter(playerIndex, player.powerMeter + delta * 90)
      }

      // When Space is released, fire the hit
      // Minimum power = 50 so a quick tap still does a hit
      if (!player.isHolding && player.powerMeter > 0) {
        const pwr = Math.max(50, player.powerMeter)
        updatePowerMeter(playerIndex, 0)
        tryHit(pwr, players[playerIndex].abilityActive)
      }

      rigidRef.current.setLinvel({ x: vx, y: 0, z: vz }, true)

    } else {
      // ─── AI player movement ───────
      const now = Date.now()
      const diff = DIFF_CONFIG[match.difficulty]
      if (now - lastAiUpdateTime.current < diff.reactionTime) {
        // Do nothing — wait for reaction time
      } else {
        lastAiUpdateTime.current = now

        const bp = ball.position
        // AI is player 1 at Z=-8 side; its half is Z < 0
        const myHalf = bp[2] < 0
        let targetX = 0
        let targetZ = -8  // AI default position

        if (myHalf && ball.inPlay) {
          targetX = bp[0] * diff.accuracy + (Math.random() - 0.5) * (1 - diff.accuracy) * 4
          targetZ = bp[2] + 2  // get behind ball
        }

        const dx = targetX - pos.x
        const dz = targetZ - pos.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        const aiSpd = spd * diff.speed
        if (dist > 0.3) {
          rigidRef.current.setLinvel({
            x: (dx / dist) * aiSpd,
            y: 0,
            z: (dz / dist) * aiSpd,
          }, true)
        } else {
          rigidRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }

        // AI hit attempt
        const distToBall = Math.sqrt(
          (bp[0] - pos.x) ** 2 + (bp[1] - pos.y) ** 2 + (bp[2] - pos.z) ** 2
        )
        if (distToBall < HIT_RANGE && ball.inPlay && myHalf && Math.random() < diff.hitChance) {
          const aiPower = 40 + Math.random() * 60
          tryHit(aiPower, Math.random() < 0.05 && players[playerIndex].ultimateCharge >= 100)
        }

        // AI ultimate
        if (players[playerIndex].ultimateCharge >= 100 && Math.random() < 0.01) {
          activateUltimate(playerIndex)
        }
      }
    }

    // Bounds clamping
    if (Math.abs(pos.x) > COURT_HALF_W) {
      rigidRef.current.setTranslation({ x: Math.sign(pos.x) * COURT_HALF_W, y: pos.y, z: pos.z }, true)
    }
    const halfZ = COURT_HALF_L * 0.95
    // Player 0 (human) stays on Z > 0 side; Player 1 (AI) stays on Z < 0 side
    const myMinZ = playerIndex === 0 ? 0.6 : -halfZ
    const myMaxZ = playerIndex === 0 ? halfZ : -0.6
    if (pos.z < myMinZ) rigidRef.current.setTranslation({ x: pos.x, y: pos.y, z: myMinZ }, true)
    if (pos.z > myMaxZ) rigidRef.current.setTranslation({ x: pos.x, y: pos.y, z: myMaxZ }, true)

    // Keep on ground
    if (pos.y < 0.45) {
      rigidRef.current.setTranslation({ x: pos.x, y: 0.5, z: pos.z }, true)
      rigidRef.current.setLinvel({ x: rigidRef.current.linvel().x, y: 0, z: rigidRef.current.linvel().z }, true)
    }

    // Update store position
    updatePlayerPosition(playerIndex, [pos.x, pos.y, pos.z])

    // Orient character to face net (player 0 faces -Z toward net; player 1 faces +Z)
    if (groupRef.current) {
      const targetRot = playerIndex === 0 ? Math.PI : 0
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, 0.1)
    }
  })

  // Listen for freeze event (Ice Golem ultimate)
  useEffect(() => {
    const handleFreeze = (e: CustomEvent) => {
      if (e.detail.target === playerIndex) {
        frozenUntil.current = Date.now() + 2000
      }
    }
    window.addEventListener('monster-freeze' as any, handleFreeze)
    return () => window.removeEventListener('monster-freeze' as any, handleFreeze)
  }, [playerIndex])

  // Ultimate aura
  const isUltActive = players[playerIndex].abilityActive

  const CharMesh = CHAR_MESHES[player.characterId]

  return (
    <RigidBody
      ref={rigidRef}
      type="dynamic"
      mass={1}
      linearDamping={8}
      angularDamping={10}
      colliders={false}
      position={[0, 0.5, startZ]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.25, 0.25]} />
      <group ref={groupRef}>
        <CharMesh t={t.current} />
        {/* Ultimate aura */}
        {isUltActive && (
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshBasicMaterial color={char.glowHex} transparent opacity={0.2} side={THREE.BackSide} />
          </mesh>
        )}
        {/* Player indicator */}
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshBasicMaterial color={char.accentHex} transparent opacity={0.35} />
        </mesh>
        {/* Point light */}
        <pointLight color={char.glowHex} intensity={isUltActive ? 8 : 2} distance={4} />
      </group>
    </RigidBody>
  )
}

export default Player
