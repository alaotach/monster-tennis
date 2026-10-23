import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../store'
import * as THREE from 'three'

function Lighting() {
  const dirRef = useRef<THREE.DirectionalLight>(null)
  const ambRef = useRef<THREE.HemisphereLight>(null)
  const vfx = useGameStore((s) => s.vfx)

  useFrame(() => {
    if (dirRef.current) {
      const target = vfx.ultimateActive ? 3 : 1.5
      dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, target, 0.05)
    }
    if (ambRef.current) {
      const target = vfx.ultimateActive ? 1.5 : 0.6
      ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, target, 0.05)
    }
  })

  return (
    <>
      {/* Main directional light */}
      <directionalLight
        ref={dirRef}
        position={[5, 20, 8]}
        intensity={1.5}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Hemisphere ambient */}
      <hemisphereLight
        ref={ambRef}
        args={['#7ad4ff', '#1a5c2a', 0.6]}
      />

      {/* Fill light */}
      <directionalLight position={[-5, 10, -8]} intensity={0.4} color="#aaccff" />

      {/* Rim light */}
      <directionalLight position={[0, -5, -15]} intensity={0.3} color="#ff9944" />
    </>
  )
}

export default Lighting
