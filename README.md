# Wake Transmission

Wake Transmission is an audio-reactive visualizer built with React and Three.js. It combines real-time frequency analysis, animated 3D scenes, and ambient playback controls.

## Features

- Real-time audio analysis (low / mid / high band energy)
- 3D reactive scene rendered with React Three Fiber
- Post-processing effects (Bloom, Noise, Vignette)
- Dynamic starfield and HUD monitor overlays
- Multiple visual themes (Neon, Synthwave, Ocean, Lava, Aurora, Midnight, Toxic, Ember)
- Multiple animation styles (Classic, Pulse, Spiral, Glitch, Zen, Chaos, Black Hole, Nebula)
- Ambient / classical track playback controls

## Tech Stack

- React 19 + TypeScript
- Three.js + @react-three/fiber + @react-three/drei
- @react-three/postprocessing
- Framer Motion + GSAP
- Tone.js
- Vite 7 + Tailwind CSS 4

## Getting Started

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Scripts

```bash
bun run dev
bun run build
bun run preview
bun run typecheck
bun run lint
bun run format
```
