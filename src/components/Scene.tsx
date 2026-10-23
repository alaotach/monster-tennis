import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { Sky } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useGameStore } from '../store'
import Court from './game/Court'
import Ball from './game/Ball'
import Player from './game/Player'
import Camera from './game/Camera'
import Lighting from './game/Lighting'
import { HitParticles, AmbientParticles, UltimateRing } from './game/Particles'

function Scene() {
  const vfx = useGameStore((s) => s.vfx)

  return (
    <>
      <Camera />
      <Lighting />

      <Sky
        distance={450000}
        sunPosition={[5, 1, 8]}
        inclination={0}
        azimuth={0.25}
        rayleigh={2}
        turbidity={8}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <Suspense fallback={null}>
        <Physics
          timeStep="vary"
          gravity={[0, -12, 0]}
          colliders={false}
        >
          <Court />
          <Ball />
          <Player playerIndex={0} isAI={false} />
          <Player playerIndex={1} isAI={true} />
        </Physics>
      </Suspense>

      {/* VFX layers */}
      <HitParticles />
      <AmbientParticles />
      {vfx.ultimateActive && vfx.ultimatePlayerId !== null && (
        <UltimateRing playerId={vfx.ultimatePlayerId} />
      )}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.85}
          intensity={vfx.ultimateActive ? 3 : 1.2}
          mipmapBlur
        />
        <Vignette
          eskil={false}
          offset={0.35}
          darkness={0.6}
        />
      </EffectComposer>
    </>
  )
}

export default Scene
