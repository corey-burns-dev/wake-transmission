# Wake Transmission — Copilot Instructions

## Build, Test, and Lint Commands

```bash
# Development server (proxies Icecast stream from local network)
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format

# Preview production build locally
bun run preview
```

## Architecture Overview

**Wake Transmission** is a real-time audio-reactive 3D visualizer that streams radio and transforms audio into immersive visual landscapes.

### Core Flow

1. **Audio Pipeline**: Icecast stream → Web Audio API → AnalyserNode → FFT analysis → frequency band data (low/mid/high)
2. **Visualization**: React Three Fiber renders 3D geometry driven by frequency data via `useFrame` hooks
3. **Deployment**: Cloudflare Pages with Functions for CORS proxy

### Key Components

- **`App.tsx`**: Main orchestrator. Manages themes, animation styles, audio playback, and UI state. Provides contexts (`ThemeContext`, `AnimationContext`) to child components
- **`useAudioAnalyzer` hook**: Connects to HTMLAudioElement, creates Web Audio API AnalyserNode, extracts frequency data (low/mid/high bands), smooths values with GSAP
- **`AuroraField`**: Primary 3D scene component. Contains:
  - Wireframe plane grid (80×80 vertices) with wave deformation based on 8 animation styles
  - 24 frequency bars (cylinders) in double arc formation mapped to low/mid/high bands
  - 3 floating icosahedron "cores" with orbiting rings, one per frequency band
- **`HudMonitor`**: Left-side HUD showing real-time frequency spectrum and stats
- **`SpaceBackground`**: Starfield particle system
- **`functions/radio.js`**: Cloudflare Function that proxies Icecast stream with CORS headers

### Animation Styles System

Eight distinct wave deformation algorithms in `AuroraField.useFrame()`:
- **Classic**: Direct frequency-reactive waves
- **Pulse**: Breathing pulses from center
- **Spiral**: Rotating vortex with variable speed based on audio intensity
- **Glitch**: Quantized/stepped distortion
- **Zen**: Slow peaceful flows
- **Chaos**: Multi-layered entropy (intentionally slowed)
- **Black Hole**: Gravitational well effect
- **Nebula**: Drifting cloud-like noise

All styles read from `AudioData.low/mid/high` and manipulate grid vertex positions per frame.

### Theme System

Color themes define palettes for grid, frequency bars, cores, and lighting. Each theme has:
- `background`, `gridBase`, `gridEmissive`
- `low/mid/high` colors with separate emissive values
- `accent`, `lightPrimary`, `lightSecondary`

Themes are injected via React Context and applied to materials dynamically.

## Code Conventions

### Three.js / R3F Patterns

- **Refs over state**: Use `useRef` for Three.js objects (`Mesh`, `BufferGeometry`) to avoid re-renders
- **Direct mutation in `useFrame`**: Directly mutate geometry attributes and material properties inside `useFrame` for performance
- **GSAP for smoothing**: Audio data is smoothed with GSAP tweens (not React state) to avoid render churn
- **Context for cross-cutting concerns**: Theme and animation style passed via Context to avoid prop drilling

### Audio Analysis

- **Web Audio API singleton**: Single `AudioContext` reused via `getAudioContext()`
- **Source caching**: `MediaElementAudioSourceNode` cached in `WeakMap` to prevent recreating on re-renders
- **FFT size 256**: Results in 128 frequency bins. Split into bands: low (0-10), mid (10-50), high (50-128)
- **dB normalization**: Raw FFT data in dB (-100 to 0) converted to 0-1 range
- **GSAP smoothing**: Frequency values smoothed with `gsap.to()` for fluid motion

### TypeScript

- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Use `interface` for public contracts (e.g., `ColorTheme`, `AnimationStyle`, `AudioData`)
- Type animations as `const` when used as union types (e.g., `"low" as const`)

### React 19

- Using React 19 with `react-dom` 19.2.4
- Prefer functional components with hooks
- Use `AnimatePresence` (Framer Motion) for enter/exit animations

### Bun Runtime

- Package manager and script runner
- `bun install` for dependencies
- Uses `bun.lock` for lockfile

## Development Setup

### Local Development with Icecast Stream

The app proxies an Icecast stream from a local network device during development:
- **Dev mode**: `/local-stream.ogg` → proxied to `http://192.168.2.124:8003/radio.ogg` (see `vite.config.ts`)
- **Production**: `/radio` → handled by Cloudflare Function that fetches from `https://radio.coreyburns.ca/radio.ogg`

If the local stream is unavailable, update the proxy target in `vite.config.ts` or use a different audio source.

### Cloudflare Pages Deployment

- Build output: `./dist`
- Functions: `functions/` directory (edge handlers)
- Config: `wrangler.jsonc` defines production URL and compatibility date
- Deploy: Push to GitHub, Cloudflare Pages auto-deploys from `main`

## Post-processing Effects

Managed by `@react-three/postprocessing`:
- **Bloom**: Luminance threshold 0.5, intensity 1.5, mipmapBlur enabled
- **Noise**: Opacity 0.05 for film grain
- **Vignette**: Offset 0.1, darkness 1.1

## File Organization

```
src/
├── App.tsx              # Main app, themes, animation styles, UI
├── main.tsx            # React entry point
├── components/
│   ├── HudMonitor.tsx  # Left HUD with frequency display
│   └── SpaceBackground.tsx  # Starfield particles
└── hooks/
    └── useAudioAnalyzer.ts  # Web Audio API hook
functions/
└── radio.js            # Cloudflare Function for CORS proxy
```
