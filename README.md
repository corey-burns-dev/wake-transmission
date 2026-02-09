# Wake Transmission — Immersive Audio-Reactive Visualizer

**Wake Transmission** is a cutting-edge, audio-reactive visual experience built with **React** and **Three.js**. It transforms sound into stunning 3D landscapes in real-time, providing a meditative and visually captivating environment synchronized with your music.

## ✨ Features

- 🔊 **Real-Time Analysis**: Advanced frequency spectrum analysis (Low, Mid, High bands) driving 3D geometry.
- 🎨 **Dynamic Themes**: Choose from neonatal palettes like `Neon`, `Synthwave`, `Aurora`, and `Midnight`.
- 🌀 **Animation Styles**: Eight distinct modes of motion including `Spiral`, `Glitch`, `Chaos`, and `Nebula`.
- 🌌 **Atmospheric Post-Processing**: Bloom, Vignette, and Noise effects for a cinematic look.
- 🚀 **HUD Overlays**: Futuristic Starfield and Monitor interfaces for an immersive pilot-seat feel.
- 🎵 **Curated Soundscapes**: Built-in library of ambient and classical tracks.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **3D Engine**: Three.js + @react-three/fiber + @react-three/drei
- **Effects**: @react-three/postprocessing
- **Motion**: Framer Motion + GSAP
- **Audio Logic**: Tone.js & Web Audio API
- **Build Tool**: Vite 7 + Tailwind CSS 4

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) to enter the transmission.

## 📦 Scripts

- `bun run dev`: Start local development server.
- `bun run build`: Create a production-ready build.
- `bun run typecheck`: Run TypeScript compilation check.
- `bun run lint`: Execute linting checks.
- `bun run lint`: Execute linting checks (now powered by Biome).
- `bun run lint:fix`: Apply auto-fixes using Biome.
- `bun run format`: Format code using Biome.

## Biome (formatting + linting)

We switched formatting and linting to Biome. Install Biome as a dev dependency and run the commands below:

```bash
# with bun
bun add -d biome

# lint only
bun run lint

# apply autofixes
bun run lint:fix

# format files
bun run format
```

If you want to fully remove ESLint/Prettier, uninstall their packages and remove `eslint.config.js`.
