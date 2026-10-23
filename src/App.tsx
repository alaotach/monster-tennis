import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { useGameStore } from './store'
import Scene from './components/Scene'
import Menu from './ui/Menu'
import CharacterSelect from './ui/CharacterSelect'
import GameUI from './ui/GameUI'
import GameOverScreen from './ui/GameOverScreen'
import TournamentMode from './ui/TournamentMode'
import './styles/ui.css'
import './index.css'

// Global ball hit listener — applies physics impulse to the ball
function BallImpulseSystem() {
  useEffect(() => {
    // This is handled inside Ball.tsx via event
  }, [])
  return null
}

function App() {
  const mode = useGameStore((s) => s.mode)

  return (
    <div className="app-container">
      {mode === 'menu' && <Menu />}
      {mode === 'characterSelect' && <CharacterSelect />}
      {mode === 'tournamentMode' && <TournamentMode />}

      {/* 3D Canvas always present when playing */}
      {(mode === 'playing' || mode === 'gameOver') && (
        <>
          <Canvas
            camera={{ position: [0, 8, 14], fov: 55, near: 0.1, far: 500 }}
            shadows
            gl={{
              antialias: true,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 1.5]}
            style={{ position: 'fixed', inset: 0 }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
          <GameUI />
          {mode === 'gameOver' && <GameOverScreen />}
        </>
      )}
    </div>
  )
}

export default App
