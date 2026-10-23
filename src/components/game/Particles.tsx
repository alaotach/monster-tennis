import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store'
import { CHARS } from '../../chars'

// ─────────────────────────────────────────────
// Hit spark particles
// ─────────────────────────────────────────────
interface Spark {
  pos: THREE.Vector3
  vel: THREE.Vector3
  life: number
  maxLife: number
  color: string
  size: number
}

export function HitParticles() {
  const sparks = useRef<Spark[]>([])
  const pointsRef = useRef<THREE.Points>(null)
  const posAttr = useRef<THREE.BufferAttribute | null>(null)
  const colorAttr = useRef<THREE.BufferAttribute | null>(null)

  const MAX_PARTICLES = 200

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(MAX_PARTICLES * 3)
    const col = new Float32Array(MAX_PARTICLES * 3)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    posAttr.current = g.getAttribute('position') as THREE.BufferAttribute
    colorAttr.current = g.getAttribute('color') as THREE.BufferAttribute
    return g
  }, [])

  useEffect(() => {
    const handleHit = (e: CustomEvent) => {
      const { pos, color } = e.detail
      const c = new THREE.Color(color)
      for (let i = 0; i < 16; i++) {
        sparks.current.push({
          pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 6 + 2,
            (Math.random() - 0.5) * 8
          ),
          life: 1,
          maxLife: 0.4 + Math.random() * 0.4,
          color,
          size: 0.05 + Math.random() * 0.1,
        })
      }
    }
    window.addEventListener('monster-spark' as any, handleHit)
    return () => window.removeEventListener('monster-spark' as any, handleHit)
  }, [])

  useFrame((_, delta) => {
    if (!posAttr.current || !colorAttr.current) return

    // Update sparks
    sparks.current = sparks.current.filter(s => s.life > 0)
    sparks.current.forEach(s => {
      s.pos.addScaledVector(s.vel, delta)
      s.vel.y -= 12 * delta
      s.life -= delta / s.maxLife
    })

    const pa = posAttr.current
    const ca = colorAttr.current

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const s = sparks.current[i]
      if (s && s.life > 0) {
        pa.setXYZ(i, s.pos.x, s.pos.y, s.pos.z)
        const c = new THREE.Color(s.color)
        ca.setXYZ(i, c.r * s.life, c.g * s.life, c.b * s.life)
      } else {
        pa.setXYZ(i, 0, -100, 0)
        ca.setXYZ(i, 0, 0, 0)
      }
    }
    pa.needsUpdate = true
    ca.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─────────────────────────────────────────────
// Floating ambient particles in stadium
// ─────────────────────────────────────────────
export function AmbientParticles() {
  const COUNT = 80
  const ref = useRef<THREE.Points>(null)
  const posArr = useRef<Float32Array>(new Float32Array(COUNT * 3))

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = Math.random() * 15
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    posArr.current = pos
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const pa = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      pa.setY(i, posArr.current[i * 3 + 1] + Math.sin(t * 0.4 + i * 0.3) * 0.2)
    }
    pa.needsUpdate = true
    ref.current.rotation.y = t * 0.02
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.06} color="#aaffcc" transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

// ─────────────────────────────────────────────
// Ultimate effect — ring burst
// ─────────────────────────────────────────────
export function UltimateRing({ playerId }: { playerId: 0 | 1 }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const players = useGameStore((s) => s.players)
  const char = CHARS[players[playerId].characterId]
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * 3
    if (!ringRef.current) return
    const pos = players[playerId].position
    ringRef.current.position.set(pos[0], 0.05, pos[2])
    const s = 1 + t.current * 3
    ringRef.current.scale.setScalar(s)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0, 0.8 - t.current * 0.4)
  })

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color={char.accentHex} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

export default HitParticles
