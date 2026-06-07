'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, PresentationControls, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function Screen({ position, rotation, scale, delay, title, color, icon, children }: any) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <Float floatIntensity={1.5} rotationIntensity={0.5} speed={2}>
      <mesh position={position} rotation={rotation} scale={scale} ref={meshRef}>
        <boxGeometry args={[3.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
        
        {/* Screen Bezels/Frame */}
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[3.3, 2.3, 0.02]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>

        {/* Content plane */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[3.1, 2.1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        <Html
          transform
          position={[0, 0, 0.03]}
          distanceFactor={1.2}
          occlude
          className="w-[310px] h-[210px] bg-white rounded-md overflow-hidden pointer-events-none p-4 flex flex-col border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-white ${color}`}>
              {icon}
            </div>
            <span className="text-sm font-semibold text-slate-800">{title}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Html>
      </mesh>
    </Float>
  )
}

function Mockups() {
  return (
    <group position={[0, 0, 0]} rotation={[0.1, -0.4, 0]}>
      {/* Feed Screen */}
      <Screen 
        position={[-1.5, 0.5, 0.5]} 
        rotation={[0, 0.2, 0]} 
        scale={1.2}
        title="Campus Feed"
        color="bg-blue-500"
        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200" />
            <div className="space-y-1">
              <div className="w-20 h-2 bg-slate-200 rounded" />
              <div className="w-12 h-1.5 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="w-full h-16 bg-slate-50 rounded border border-slate-100" />
          <div className="w-3/4 h-2 bg-slate-200 rounded" />
          <div className="w-1/2 h-2 bg-slate-200 rounded" />
        </div>
      </Screen>

      {/* Events Screen */}
      <Screen 
        position={[1.5, 1.2, -0.5]} 
        rotation={[0, -0.2, 0]} 
        scale={1}
        title="Events"
        color="bg-sky-500"
        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="h-20 bg-slate-50 rounded border border-slate-100 flex flex-col p-2 gap-1">
            <div className="w-full h-10 bg-slate-200 rounded" />
            <div className="w-1/2 h-2 bg-slate-300 rounded mt-1" />
          </div>
          <div className="h-20 bg-slate-50 rounded border border-slate-100 flex flex-col p-2 gap-1">
            <div className="w-full h-10 bg-slate-200 rounded" />
            <div className="w-2/3 h-2 bg-slate-300 rounded mt-1" />
          </div>
        </div>
      </Screen>

      {/* Leaderboard Screen */}
      <Screen 
        position={[0.8, -1.2, 1]} 
        rotation={[-0.1, -0.1, 0]} 
        scale={1.1}
        title="Leaderboard"
        color="bg-indigo-500"
        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
      >
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400">#{i}</span>
              <div className="w-5 h-5 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-1">
                <div className="w-16 h-2 bg-slate-300 rounded" />
                <div className="w-10 h-1.5 bg-slate-200 rounded" />
              </div>
              <div className="w-8 h-3 bg-blue-100 rounded flex items-center justify-center">
                <div className="w-4 h-1 bg-blue-500 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Screen>
    </group>
  )
}

export function Hero3D() {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-0.1, 0.1]}
          azimuth={[-0.2, 0.2]}
        >
          <Mockups />
        </PresentationControls>

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
