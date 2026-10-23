import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../store'
import * as THREE from 'three'

// Court dimensions
const COURT_W = 16
const COURT_L = 24
const NET_H = 1.0
const LINE_W = 0.12

function CourtLines() {
  const lines: JSX.Element[] = []
  const mat = <meshStandardMaterial color="#ffffff" emissive="#88ffcc" emissiveIntensity={0.4} />

  const addLine = (key: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
    lines.push(
      <mesh key={key} position={[x, y, z]} receiveShadow>
        <boxGeometry args={[w, h, d]} />
        {mat}
      </mesh>
    )

  // Baselines
  addLine('bl1', 0, 0.005, -COURT_L / 2, COURT_W, 0.01, LINE_W)
  addLine('bl2', 0, 0.005, COURT_L / 2, COURT_W, 0.01, LINE_W)
  // Sidelines
  addLine('sl1', -COURT_W / 2, 0.005, 0, LINE_W, 0.01, COURT_L)
  addLine('sl2', COURT_W / 2, 0.005, 0, LINE_W, 0.01, COURT_L)
  // Service lines
  addLine('sv1', 0, 0.005, -COURT_L / 4, COURT_W * 0.75, 0.01, LINE_W)
  addLine('sv2', 0, 0.005, COURT_L / 4, COURT_W * 0.75, 0.01, LINE_W)
  // Center service line
  addLine('csl', 0, 0.005, 0, LINE_W, 0.01, COURT_L / 2)
  // Center mark
  addLine('cm1', 0, 0.005, -COURT_L / 2 + 0.3, 0.4, 0.01, LINE_W * 2)
  addLine('cm2', 0, 0.005, COURT_L / 2 - 0.3, 0.4, 0.01, LINE_W * 2)

  return <>{lines}</>
}

function Net() {
  const ref = useRef<THREE.Group>(null)

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Net top band */}
      <mesh position={[0, NET_H, 0]}>
        <boxGeometry args={[COURT_W + 1, 0.07, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaffee" emissiveIntensity={0.3} />
      </mesh>
      {/* Net mesh — cross-hatch using multiple planes */}
      {Array.from({ length: 22 }).map((_, i) => (
        <mesh key={`nv${i}`} position={[-COURT_W / 2 + i * 0.76, NET_H / 2, 0]}>
          <boxGeometry args={[0.025, NET_H, 0.02]} />
          <meshStandardMaterial color="#ddffee" transparent opacity={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`nh${i}`} position={[0, i * 0.155 + 0.08, 0]}>
          <boxGeometry args={[COURT_W, 0.02, 0.02]} />
          <meshStandardMaterial color="#ddffee" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Net posts */}
      <mesh position={[-COURT_W / 2 - 0.15, NET_H / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, NET_H, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[COURT_W / 2 + 0.15, NET_H / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, NET_H, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function CourtSurface() {
  // Animated grass shader
  const grassMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a5c2a'),
      roughness: 0.9,
      metalness: 0.0,
    })
  }, [])

  // Striped effect - alternate light/dark rows
  return (
    <group>
      {/* Base court */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[COURT_W + 2, 0.1, COURT_L + 2]} />
        <meshStandardMaterial color="#1a5c2a" roughness={0.9} />
      </mesh>

      {/* Lawn stripes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0, 0.051, -COURT_L / 2 + i * 2 + 1]} receiveShadow>
          <boxGeometry args={[COURT_W, 0.001, 2]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#1e6b30' : '#174f22'}
            roughness={0.95}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {/* Out-of-bounds areas */}
      <mesh position={[0, -0.01, -COURT_L / 2 - 4]} receiveShadow>
        <boxGeometry args={[COURT_W + 12, 0.1, 8]} />
        <meshStandardMaterial color="#0e3d17" roughness={1} />
      </mesh>
      <mesh position={[0, -0.01, COURT_L / 2 + 4]} receiveShadow>
        <boxGeometry args={[COURT_W + 12, 0.1, 8]} />
        <meshStandardMaterial color="#0e3d17" roughness={1} />
      </mesh>
      <mesh position={[-COURT_W / 2 - 4, -0.01, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, COURT_L + 16]} />
        <meshStandardMaterial color="#0e3d17" roughness={1} />
      </mesh>
      <mesh position={[COURT_W / 2 + 4, -0.01, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, COURT_L + 16]} />
        <meshStandardMaterial color="#0e3d17" roughness={1} />
      </mesh>
    </group>
  )
}

function Stadium() {
  // Stadium stands + walls
  return (
    <group>
      {/* Back walls */}
      {[-COURT_L / 2 - 2, COURT_L / 2 + 2].map((z, i) => (
        <mesh key={i} position={[0, 3, z]}>
          <boxGeometry args={[COURT_W + 20, 6, 0.5]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
        </mesh>
      ))}
      {/* Side walls */}
      {[-COURT_W / 2 - 2, COURT_W / 2 + 2].map((x, i) => (
        <mesh key={i} position={[x, 3, 0]}>
          <boxGeometry args={[0.5, 6, COURT_L + 24]} />
          <meshStandardMaterial color="#12122a" roughness={0.8} />
        </mesh>
      ))}
      {/* Stands */}
      {[-1, 1].map((side) =>
        Array.from({ length: 5 }).map((_, row) => (
          <mesh
            key={`stand-${side}-${row}`}
            position={[side * (COURT_W / 2 + 3 + row * 1.2), 1 + row * 0.8, 0]}
          >
            <boxGeometry args={[1.2, 0.5, COURT_L + 6]} />
            <meshStandardMaterial color={`hsl(${220 + row * 10}, 40%, ${10 + row * 3}%)`} roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Crowd silhouettes (simple blocks) */}
      {Array.from({ length: 30 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const z = -COURT_L / 2 - 1 + (i % 15) * ((COURT_L + 2) / 14)
        const row = Math.floor(Math.random() * 3)
        return (
          <mesh
            key={`crowd-${i}`}
            position={[side * (COURT_W / 2 + 3.2 + row * 1.2), 1.3 + row * 0.8, z]}
          >
            <boxGeometry args={[0.4, 0.7, 0.3]} />
            <meshStandardMaterial color={`hsl(${Math.random() * 360}, 60%, 40%)`} roughness={1} />
          </mesh>
        )
      })}

      {/* Floor under everything */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[60, 0.1, 60]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  )
}

function Floodlights() {
  const positions: [number, number, number][] = [
    [-COURT_W / 2 - 3, 12, -COURT_L / 2 - 2],
    [COURT_W / 2 + 3, 12, -COURT_L / 2 - 2],
    [-COURT_W / 2 - 3, 12, COURT_L / 2 + 2],
    [COURT_W / 2 + 3, 12, COURT_L / 2 + 2],
  ]

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Pole */}
          <mesh position={[0, -6, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 12, 8]} />
            <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light fixture */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.6]} />
            <meshStandardMaterial color="#ffeeaa" emissive="#ffeeaa" emissiveIntensity={2} />
          </mesh>
          <spotLight
            position={[0, 0, 0]}
            target-position={[0, 0, 0]}
            intensity={80}
            angle={Math.PI / 5}
            penumbra={0.3}
            color="#fff8e0"
            castShadow
            shadow-mapSize={[512, 512]}
          />
        </group>
      ))}
    </>
  )
}

function Court() {
  return (
    <group>
      <CourtSurface />
      <CourtLines />
      <Net />
      <Stadium />
      <Floodlights />
    </group>
  )
}

export default Court
export { COURT_W, COURT_L, NET_H }
