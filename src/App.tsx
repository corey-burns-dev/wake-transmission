import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import * as Tone from 'tone';

const dreamWords = ['Listen', 'Flow', 'Evolve', 'Pulse', 'Transmission', 'Wake'];

// --- Scene Components ---

function AuroraField({ audioData }: { audioData: React.MutableRefObject<{ volume: number, low: number, mid: number, high: number }> }) {
  const surfaceRef = useRef<THREE.Mesh | null>(null);
  const ribbonRefs = useRef<Array<THREE.Mesh | null>>([]);

  const ribbonData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        x: -6 + index * 1.7,
        z: -4 - index * 1.3,
        phase: index * 0.8,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { volume, low, mid, high } = audioData.current;

    const surface = surfaceRef.current;
    if (surface?.geometry) {
      const geometry = surface.geometry as THREE.BufferGeometry;
      const position = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const y = position.getY(i);
        // Add audio reactivity to wave height
        const wave = Math.sin(x * 0.75 + t * 1.4) * (0.3 + low * 0.5) + 
                     Math.cos(y * 0.62 + t * 1.1) * (0.24 + mid * 0.3);
        position.setZ(i, wave);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      
      // Update material emissive intensity
      if (surface.material instanceof THREE.MeshStandardMaterial) {
        surface.material.emissiveIntensity = 0.2 + low * 0.8;
      }
    }

    ribbonRefs.current.forEach((ribbon, index) => {
      if (!ribbon) return;
      const data = ribbonData[index];
      // Faster movement on high frequencies
      const speedMult = 1 + high * 2;
      ribbon.position.y = 1.6 + Math.sin(t * 1.5 * speedMult + data.phase) * 0.55;
      ribbon.position.x = data.x + Math.cos(t * 0.6 + data.phase) * 0.45;
      ribbon.position.z = data.z + Math.sin(t * 0.7 + data.phase) * 0.35;
      ribbon.rotation.y += 0.01 * speedMult;
      
      if (ribbon.material instanceof THREE.MeshStandardMaterial) {
        ribbon.material.emissiveIntensity = 0.5 + high * 1.5;
      }
    });
  });

  return (
    <group>
      <mesh ref={surfaceRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -2]}>
        <planeGeometry args={[18, 18, 64, 64]} />
        <meshStandardMaterial color="#0f172a" emissive="#5eead4" emissiveIntensity={0.22} wireframe />
      </mesh>

      {ribbonData.map((data, index) => (
        <mesh
          key={`aurora-ribbon-${index}`}
          ref={(node) => {
            ribbonRefs.current[index] = node;
          }}
          position={[data.x, 1.8, data.z]}
        >
          <torusKnotGeometry args={[0.32, 0.08, 96, 16]} />
          <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- Main App Component ---

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioData = useAudioAnalyzer(audioRef.current);

  // Icecast stream URL - User can change this
  const STREAM_URL = "https://ice6.somafm.com/dronezone-128-mp3"; // Example placeholder

  const handleTogglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      audioRef.current?.play();
      setIsPlaying(true);
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % dreamWords.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='w-full h-screen bg-slate-950 relative overflow-hidden'>
      {/* HUD Player */}
      <div className='absolute right-6 top-6 z-30 w-80 rounded-2xl border border-white/10 bg-black/40 p-4 text-emerald-400 shadow-2xl backdrop-blur-xl'>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className='text-[10px] uppercase tracking-[0.25em] text-emerald-500/60'>Wake Transmission</p>
            <p className='mt-1 text-sm font-mono font-bold tracking-tight'>LIVE STREAM FEED</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
        </div>

        <div className="space-y-4">
          <button
            onClick={handleTogglePlay}
            className="w-full py-2 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors text-xs font-mono uppercase tracking-widest"
          >
            {isPlaying ? "STOP TRANSMISSION" : "START TRANSMISSION"}
          </button>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span>GAIN</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (audioRef.current) audioRef.current.volume = val;
              }}
              className="w-full accent-emerald-500 bg-emerald-950 h-1 rounded-full appearance-none overflow-hidden"
            />
          </div>
        </div>

        <audio 
          ref={audioRef} 
          src={STREAM_URL} 
          crossOrigin="anonymous"
          autoPlay={false}
        />
      </div>

      {/* Center Text */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none'>
        <AnimatePresence mode='wait'>
          <motion.h1
            key={dreamWords[wordIndex]}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className='text-5xl md:text-7xl font-light tracking-[0.5em] uppercase text-emerald-400/30'
          >
            {dreamWords[wordIndex]}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 4, 10], fov: 60 }}>
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color='#5eead4' />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color='#22d3ee' />

        <AuroraField audioData={audioData} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
