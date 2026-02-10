import { Canvas, useFrame } from "@react-three/fiber";
import {
	Bloom,
	EffectComposer,
	Noise,
	Vignette,
} from "@react-three/postprocessing";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import * as THREE from "three";
import { HudMonitor } from "./components/HudMonitor";
import { MusicPlayer } from "./components/MusicPlayer";
import { SpaceBackground } from "./components/SpaceBackground";
import { type AudioData, useAudioAnalyzer } from "./hooks/useAudioAnalyzer";

// --- Theme System ---
export interface ColorTheme {
	name: string;
	icon: string;
	background: string;
	gridBase: string;
	gridEmissive: string;
	low: { color: string; emissive: string };
	mid: { color: string; emissive: string };
	high: { color: string; emissive: string };
	accent: string;
	accentMuted: string;
	lightPrimary: string;
	lightSecondary: string;
}

const themes: ColorTheme[] = [
	{
		name: "Neon",
		icon: "🌈",
		background: "#020617",
		gridBase: "#050a15",
		gridEmissive: "#5eead4",
		low: { color: "#ff2d55", emissive: "#ff0040" },
		mid: { color: "#bf5af2", emissive: "#9d4edd" },
		high: { color: "#64d2ff", emissive: "#00d4ff" },
		accent: "#5eead4",
		accentMuted: "#5eead4",
		lightPrimary: "#5eead4",
		lightSecondary: "#22d3ee",
	},
	{
		name: "Synthwave",
		icon: "🌆",
		background: "#0d0221",
		gridBase: "#1a0533",
		gridEmissive: "#ff00ff",
		low: { color: "#ff0080", emissive: "#ff0066" },
		mid: { color: "#00ffff", emissive: "#00ccff" },
		high: { color: "#ffff00", emissive: "#ffcc00" },
		accent: "#ff00ff",
		accentMuted: "#cc00cc",
		lightPrimary: "#ff00ff",
		lightSecondary: "#00ffff",
	},
	{
		name: "Ocean",
		icon: "🌊",
		background: "#001a2c",
		gridBase: "#002244",
		gridEmissive: "#00a8cc",
		low: { color: "#0088aa", emissive: "#006688" },
		mid: { color: "#00ccff", emissive: "#00aadd" },
		high: { color: "#88ffff", emissive: "#66ddff" },
		accent: "#00d4ff",
		accentMuted: "#0099cc",
		lightPrimary: "#00a8cc",
		lightSecondary: "#00ffff",
	},
	{
		name: "Lava",
		icon: "🌋",
		background: "#1a0a00",
		gridBase: "#2d1200",
		gridEmissive: "#ff4400",
		low: { color: "#ff0000", emissive: "#cc0000" },
		mid: { color: "#ff6600", emissive: "#ff4400" },
		high: { color: "#ffcc00", emissive: "#ffaa00" },
		accent: "#ff4400",
		accentMuted: "#cc3300",
		lightPrimary: "#ff4400",
		lightSecondary: "#ffaa00",
	},
	{
		name: "Aurora",
		icon: "🌌",
		background: "#050520",
		gridBase: "#0a0a30",
		gridEmissive: "#00ff88",
		low: { color: "#00ff66", emissive: "#00cc55" },
		mid: { color: "#00ffcc", emissive: "#00ddaa" },
		high: { color: "#ff00ff", emissive: "#cc00cc" },
		accent: "#00ff88",
		accentMuted: "#00cc66",
		lightPrimary: "#00ff88",
		lightSecondary: "#ff00ff",
	},
	{
		name: "Midnight",
		icon: "🌙",
		background: "#0a0a12",
		gridBase: "#12121f",
		gridEmissive: "#6366f1",
		low: { color: "#4f46e5", emissive: "#3730a3" },
		mid: { color: "#8b5cf6", emissive: "#7c3aed" },
		high: { color: "#c4b5fd", emissive: "#a78bfa" },
		accent: "#818cf8",
		accentMuted: "#6366f1",
		lightPrimary: "#6366f1",
		lightSecondary: "#a78bfa",
	},
	{
		name: "Toxic",
		icon: "☢️",
		background: "#0a1a0a",
		gridBase: "#0f2a0f",
		gridEmissive: "#39ff14",
		low: { color: "#00ff00", emissive: "#00cc00" },
		mid: { color: "#aaff00", emissive: "#88cc00" },
		high: { color: "#ffff00", emissive: "#cccc00" },
		accent: "#39ff14",
		accentMuted: "#2acc10",
		lightPrimary: "#39ff14",
		lightSecondary: "#aaff00",
	},
	{
		name: "Ember",
		icon: "🔥",
		background: "#0f0706",
		gridBase: "#1a0d0a",
		gridEmissive: "#f97316",
		low: { color: "#dc2626", emissive: "#b91c1c" },
		mid: { color: "#f97316", emissive: "#ea580c" },
		high: { color: "#fbbf24", emissive: "#f59e0b" },
		accent: "#fb923c",
		accentMuted: "#ea580c",
		lightPrimary: "#f97316",
		lightSecondary: "#fbbf24",
	},
];

// --- Animation Styles ---
export interface AnimationStyle {
	name: string;
	icon: string;
	description: string;
}

const animationStyles: AnimationStyle[] = [
	{ name: "Classic", icon: "🌊", description: "Reactive frequency waves" },
	{ name: "Pulse", icon: "💓", description: "Breathing pulses" },
	{ name: "Spiral", icon: "🌀", description: "Rotating vortex" },
	{ name: "Glitch", icon: "⚡", description: "Digital distortion" },
	{ name: "Zen", icon: "🧘", description: "Slow, flowing" },
	{ name: "Chaos", icon: "🔥", description: "Entropy (Slowed)" },
	{ name: "Black Hole", icon: "⚫", description: "Gravitational pull" },
	{ name: "Nebula", icon: "🌫️", description: "Drifting cosmic gas" },
];

const AnimationContext = createContext<string>("Classic");
const ThemeContext = createContext<ColorTheme>(themes[0]);

const dreamWords = [
	"Listen",
	"Flow",
	"Evolve",
	"Pulse",
	"Transmission",
	"Wake",
];

// --- Scene Components ---

function AuroraField({
	audioData,
}: {
	audioData: React.MutableRefObject<AudioData>;
}) {
	const theme = useContext(ThemeContext);
	const animStyle = useContext(AnimationContext);
	const surfaceRef = useRef<THREE.Mesh | null>(null);
	const barRefs = useRef<Array<THREE.Mesh | null>>([]);
	const coreRefs = useRef<Array<THREE.Mesh | null>>([]);
	const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
	const visualTime = useRef(0);

	// Create 24 frequency bars in a double arc
	const barCount = 24;
	const barData = useMemo(
		() =>
			Array.from({ length: barCount }, (_, index) => {
				const angle = (index / (barCount - 1)) * Math.PI * 1.2 - Math.PI * 0.6;
				const radius = 4.5;
				const innerRadius = 2.8;
				const isInner = index % 2 === 0;
				return {
					x: Math.cos(angle) * (isInner ? innerRadius : radius),
					z: Math.sin(angle) * (isInner ? innerRadius : radius) - 2,
					angle: angle,
					isInner,
					freqType: index < 8 ? "low" : index < 16 ? "mid" : ("high" as const),
				};
			}),
		[],
	);

	// 3 floating icosahedron cores with orbiting rings - use theme colors
	const coreData = useMemo(
		() => [
			{
				x: -3,
				z: 0,
				color: theme.low.color,
				emissive: theme.low.emissive,
				type: "low" as const,
			},
			{
				x: 0,
				z: -1.5,
				color: theme.mid.color,
				emissive: theme.mid.emissive,
				type: "mid" as const,
			},
			{
				x: 3,
				z: 0,
				color: theme.high.color,
				emissive: theme.high.emissive,
				type: "high" as const,
			},
		],
		[theme],
	);

	useFrame((state, delta) => {
		const t = state.clock.elapsedTime;
		const rawLow = audioData.current.low;
		const rawMid = audioData.current.mid;
		const rawHigh = audioData.current.high;

		const low = Number.isFinite(rawLow) ? rawLow : 0;
		const mid = Number.isFinite(rawMid) ? rawMid : 0;
		const high = Number.isFinite(rawHigh) ? rawHigh : 0;

		// Determine dominant frequency for field behavior
		const dominant =
			low > mid && low > high ? "low" : mid > high ? "mid" : "high";
		const dominantValue = Math.max(low, mid, high);

		// Variable Speed Logic for Spiral
		// Base speed + reaction to intensity.
		// If Spiral, we strictly use visualTime logic, else we might just track it anyway.
		// Modulate speed: Normal speed 1.0. High intensity -> up to 4.0x speed.
		const speedMultiplier = 1 + dominantValue * 4;
		visualTime.current += delta * speedMultiplier;
		const vt = visualTime.current;

		const surface = surfaceRef.current;
		if (surface?.geometry) {
			const geometry = surface.geometry as THREE.BufferGeometry;
			const position = geometry.attributes.position as THREE.BufferAttribute;

			for (let i = 0; i < position.count; i += 1) {
				const x = position.getX(i);
				const y = position.getY(i);
				const dist = Math.sqrt(x * x + y * y);
				const angle = Math.atan2(y, x);

				// Wave pattern based on animation style
				let wave: number;

				switch (animStyle) {
					case "Pulse": {
						// Breathing pulse from center
						const breathe = Math.sin(t * 1.5) * 0.5 + 0.5;
						const pulse =
							Math.sin(dist * 0.3 - t * 2) *
							(0.3 + dominantValue * breathe * 1.5);
						wave = pulse + Math.sin(t * 3) * dominantValue * 0.3;
						break;
					}
					case "Spiral": {
						// Rotating vortex with VARIABLE SPEED
						// Use vt (visualTime) instead of t for rotation components
						const spiralAngle = angle + dist * 0.3 - vt * 2;
						wave =
							Math.sin(spiralAngle * 3) * (0.3 + dominantValue * 0.8) +
							Math.sin(dist * 0.5 - vt * 1.5) * (0.2 + mid * 0.4);
						break;
					}
					case "Glitch": {
						// Digital distortion - stepped/quantized with random offsets
						const glitchX = Math.floor(x * 2) / 2;
						const glitchY = Math.floor(y * 2) / 2;
						const noise =
							Math.sin(glitchX * 10 + t * 20) * Math.cos(glitchY * 8 + t * 15);
						const step =
							Math.floor(Math.sin(t * 10 + glitchX + glitchY) * 3) / 3;
						wave = step * (0.3 + dominantValue * 1.2) + noise * high * 0.5;
						break;
					}
					case "Zen": {
						// Slow, peaceful flowing waves
						const slowT = t * 0.3;
						wave =
							Math.sin(x * 0.2 + slowT) * 0.4 +
							Math.cos(y * 0.25 + slowT * 0.8) * 0.35 +
							Math.sin(dist * 0.15 - slowT * 0.5) * (0.2 + dominantValue * 0.3);
						break;
					}
					case "Chaos": {
						// Tamed Entropy - significantly slowed down
						// chaosSpeed was 2 + dom*4. Now 0.3 + dom*0.5
						const chaosSpeed = 0.3 + dominantValue * 0.5;
						// Frequencies reduced by 50%
						wave =
							Math.sin(x * 0.5 + t * chaosSpeed) * (0.2 + low * 0.4) +
							Math.cos(y * 0.4 - t * chaosSpeed * 1.1) * (0.2 + mid * 0.3) +
							Math.sin(x * y * 0.05 + t * chaosSpeed * 0.7) *
								(0.3 + high * 0.3);
						break;
					}
					case "Black Hole": {
						// Gravity Well - pulling everything towards center (0,0)
						// y is height in 3D, here x/y are grid coords.
						// We want Z (height) to dip based on closeness to center
						// Rotate geometry inwards
						const suction = t * (0.5 + dominantValue); // Spin speed
						const spiral = angle + suction;

						// The "Event Horizon" dip
						wave = -(1.5 ** (4 - dist * 0.8)) * 0.5;
						// Add ripples from the center
						wave += Math.sin(dist * 2 - t * 5) * (0.1 + high * 0.2);
						// Add spiral arms texturing
						wave += Math.sin(spiral * 4) * (0.2 + mid * 0.5) * (dist / 10);
						break;
					}
					case "Nebula": {
						// Drifting Clouds - Low frequency noise-like waves
						const drift = t * 0.1;
						// Layered sine waves to simulate Perlin-ish noise
						wave =
							Math.sin(x * 0.3 + drift) * Math.cos(y * 0.3 - drift) * 0.8 +
							Math.sin(x * 0.7 - drift * 0.5) *
								Math.sin(y * 0.7 + drift) *
								0.4 +
							Math.sin(dist * 0.2 + t * 0.2) * (0.5 + low * 1.0); // Breathing core
						break;
					}
					default: {
						// Classic - frequency reactive
						if (dominant === "low") {
							wave =
								Math.sin(dist * 0.4 - t * 2) * (0.5 + low * 1.2) +
								Math.sin(dist * 0.2 - t * 0.8) * (0.3 + low * 0.5);
						} else if (dominant === "mid") {
							wave =
								Math.sin((x + y) * 0.5 + t * 2.5) * (0.3 + mid * 0.8) +
								Math.sin((x - y) * 0.4 + t * 1.8) * (0.25 + mid * 0.6);
						} else {
							wave =
								Math.sin(x * 1.2 + t * 4) * (0.2 + high * 0.5) +
								Math.cos(y * 0.9 + t * 3.5) * (0.2 + high * 0.4) +
								Math.sin(dist * 0.8 + t * 5) * (0.15 + high * 0.3);
						}
					}
				}

				position.setZ(i, wave);
			}
			position.needsUpdate = true;
			geometry.computeVertexNormals();

			if (surface.material instanceof THREE.MeshStandardMaterial) {
				// Color shift based on dominant frequency using theme colors
				const targetColor = new THREE.Color(
					dominant === "low"
						? theme.low.emissive
						: dominant === "mid"
							? theme.mid.emissive
							: theme.high.emissive,
				);
				surface.material.emissive.lerp(targetColor, 0.1);
				surface.material.emissiveIntensity = 0.3 + dominantValue * 1.2;
			}
		}

		// Animate frequency bars with more dynamic motion
		barRefs.current.forEach((bar, index) => {
			if (!bar) return;
			const data = barData[index];
			const freqValue =
				data.freqType === "low" ? low : data.freqType === "mid" ? mid : high;

			// Height with wave offset
			const waveOffset = Math.sin(t * 3 + index * 0.4) * 0.2;
			const targetHeight = 0.4 + freqValue * 4 + waveOffset;
			bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.2);
			bar.position.y = -1.8 + bar.scale.y / 2;

			// Rotate towards center and pulse
			bar.rotation.x = Math.sin(t * 2 + index * 0.2) * 0.1 * freqValue;
			bar.rotation.z = Math.cos(t * 1.5 + index * 0.3) * 0.08;

			// Scale width on beat
			bar.scale.x = 0.15 + freqValue * 0.15;
			bar.scale.z = bar.scale.x;

			if (bar.material instanceof THREE.MeshStandardMaterial) {
				bar.material.emissiveIntensity = 0.4 + freqValue * 2.5;
			}
		});

		// Animate cores (icosahedrons)
		coreRefs.current.forEach((core, index) => {
			if (!core) return;
			const data = coreData[index];
			const freqValue =
				data.type === "low" ? low : data.type === "mid" ? mid : high;

			// Pulse and float
			const baseScale = 0.35;
			const targetScale = baseScale + freqValue * 0.6;
			core.scale.setScalar(
				THREE.MathUtils.lerp(core.scale.x, targetScale, 0.12),
			);
			core.position.y =
				2 + Math.sin(t * 1.5 + index * 2) * 0.4 + freqValue * 0.8;

			// Spin faster with frequency
			core.rotation.x += 0.01 + freqValue * 0.05;
			core.rotation.y += 0.015 + freqValue * 0.04;

			if (core.material instanceof THREE.MeshStandardMaterial) {
				core.material.emissiveIntensity = 0.8 + freqValue * 4;
			}
		});

		// Animate rings orbiting cores
		ringRefs.current.forEach((ring, index) => {
			if (!ring) return;
			const data = coreData[index];
			const freqValue =
				data.type === "low" ? low : data.type === "mid" ? mid : high;

			// Orbit and tilt
			const orbitSpeed = 1 + freqValue * 2;
			ring.rotation.x = t * orbitSpeed + index;
			ring.rotation.y = t * orbitSpeed * 0.7 + index * 2;

			// Scale ring with frequency
			const ringScale = 0.8 + freqValue * 0.5;
			ring.scale.setScalar(ringScale);

			if (ring.material instanceof THREE.MeshStandardMaterial) {
				ring.material.emissiveIntensity = 0.6 + freqValue * 3;
			}
		});
	});

	return (
		<group>
			{/* Dynamic wireframe surface */}
			<mesh
				ref={surfaceRef}
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, -2.2, -2]}
			>
				<planeGeometry args={[20, 20, 80, 80]} />
				<meshStandardMaterial
					color={theme.gridBase}
					emissive={theme.gridEmissive}
					emissiveIntensity={0.3}
					wireframe
				/>
			</mesh>

			{/* Frequency bars - cylinders for sleeker look */}
			{barData.map((data, index) => (
				<mesh
					key={`bar-${data.angle.toFixed(3)}-${data.isInner}`}
					ref={(node) => {
						barRefs.current[index] = node;
					}}
					position={[data.x, -1.8, data.z]}
				>
					<cylinderGeometry args={[0.08, 0.12, 1, 8]} />
					<meshStandardMaterial
						color={
							data.freqType === "low"
								? theme.low.color
								: data.freqType === "mid"
									? theme.mid.color
									: theme.high.color
						}
						emissive={
							data.freqType === "low"
								? theme.low.emissive
								: data.freqType === "mid"
									? theme.mid.emissive
									: theme.high.emissive
						}
						emissiveIntensity={0.6}
						metalness={0.8}
						roughness={0.2}
					/>
				</mesh>
			))}

			{/* Floating icosahedron cores */}
			{coreData.map((data, index) => (
				<group key={`core-group-${data.type}`} position={[data.x, 2, data.z]}>
					<mesh
						ref={(node) => {
							coreRefs.current[index] = node;
						}}
					>
						<icosahedronGeometry args={[0.35, 0]} />
						<meshStandardMaterial
							color={data.color}
							emissive={data.emissive}
							emissiveIntensity={1.2}
							metalness={0.9}
							roughness={0.1}
						/>
					</mesh>
					{/* Orbiting ring */}
					<mesh
						ref={(node) => {
							ringRefs.current[index] = node;
						}}
					>
						<torusGeometry args={[0.6, 0.04, 16, 32]} />
						<meshStandardMaterial
							color={data.color}
							emissive={data.emissive}
							emissiveIntensity={0.8}
							transparent
							opacity={0.7}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}

// --- Main App Component ---

export default function App() {
	const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
		null,
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const [wordIndex, setWordIndex] = useState(0);
	const [gain, setGain] = useState(0.8);
	const [themeIndex, setThemeIndex] = useState(0);
	const [showHudMonitor, setShowHudMonitor] = useState(true);
	const [animStyleIndex, setAnimStyleIndex] = useState(0);
	const currentTheme = themes[themeIndex];
	const currentAnimStyle = animationStyles[animStyleIndex];
	const audioData = useAudioAnalyzer(audioElement, isPlaying);

	// Icecast stream URL - dynamic based on environment
	const STREAM_URL = import.meta.env.DEV ? "/local-stream.ogg" : "/radio";

	const handleTogglePlay = async () => {
		if (!audioElement) return;

		if (!isPlaying) {
			audioElement.play();
			setIsPlaying(true);
		} else {
			audioElement.pause();
			setIsPlaying(false);
		}
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setWordIndex((prev) => (prev + 1) % dreamWords.length);
		}, 15000);
		return () => clearInterval(interval);
	}, []);

	// Sync volume with gain state
	useEffect(() => {
		if (audioElement) {
			// eslint-disable-next-line
			audioElement.volume = gain;
		}
	}, [gain, audioElement]);

	return (
		<div className="relative w-full h-screen overflow-hidden bg-slate-950">
			{/* System Monitor HUD (Left) - hidden on small screens */}
			{/* System Monitor HUD (Left) - showable on all viewports via the HUD button */}
			<div>
				{showHudMonitor && (
					<HudMonitor
						audioData={audioData}
						theme={currentTheme}
						onClose={() => setShowHudMonitor(false)}
					/>
				)}
				{/* small-screen HUD reveal button when HUD is closed */}
				{!showHudMonitor && (
					<button
						type="button"
						onClick={() => setShowHudMonitor(true)}
						className="fixed z-50 p-2 text-sm border rounded md:hidden left-4 top-4 bg-black/60 border-white/10"
					>
						🖥
					</button>
				)}
				{/* desktop Show HUD control when HUD is closed */}
				{!showHudMonitor && (
					<div className="hidden ml-4 md:inline">
						<button
							type="button"
							onClick={() => setShowHudMonitor(true)}
							className="px-2 py-1 text-xs rounded text-white/40 hover:bg-white/5"
						>
							Show HUD
						</button>
					</div>
				)}
			</div>

			{/* HUD Player (Right) */}
			<MusicPlayer
				isPlaying={isPlaying}
				onTogglePlay={handleTogglePlay}
				gain={gain}
				onGainChange={setGain}
				themeIndex={themeIndex}
				setThemeIndex={setThemeIndex}
				themes={themes}
				animStyleIndex={animStyleIndex}
				setAnimStyleIndex={setAnimStyleIndex}
				animationStyles={animationStyles}
			/>

			<audio
				ref={setAudioElement}
				src={STREAM_URL}
				crossOrigin="anonymous"
				autoPlay={false}
			>
				<track kind="captions" />
			</audio>

			{/* Center Text */}
			<div className="absolute z-10 text-center -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2">
				<AnimatePresence mode="wait">
					<motion.h1
						key={dreamWords[wordIndex]}
						initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
						transition={{ duration: 3, ease: "easeInOut" }}
						className="text-5xl md:text-7xl font-light tracking-[0.5em] uppercase text-emerald-400/30"
					>
						{dreamWords[wordIndex]}
					</motion.h1>
				</AnimatePresence>
			</div>

			{/* 3D Scene */}
			<ThemeContext.Provider value={currentTheme}>
				<AnimationContext.Provider value={currentAnimStyle.name}>
					<Canvas camera={{ position: [0, 4, 10], fov: 60 }}>
						<color attach="background" args={[currentTheme.background]} />
						<ambientLight intensity={0.2} />
						<pointLight
							position={[10, 10, 10]}
							intensity={1}
							color={currentTheme.lightPrimary}
						/>
						<pointLight
							position={[-10, 5, -10]}
							intensity={0.5}
							color={currentTheme.lightSecondary}
						/>

						<AuroraField audioData={audioData} />
						<SpaceBackground audioData={audioData} theme={currentTheme} />

						<EffectComposer>
							<Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur />
							<Noise opacity={0.05} />
							<Vignette eskil={false} offset={0.1} darkness={1.1} />
						</EffectComposer>
					</Canvas>
				</AnimationContext.Provider>
			</ThemeContext.Provider>
		</div>
	);
}
