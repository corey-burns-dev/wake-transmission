import type React from "react";
import { useEffect, useRef } from "react";
import type { ColorTheme } from "../App";
import type { AudioData } from "../hooks/useAudioAnalyzer";

interface HudMonitorProps {
	audioData: React.MutableRefObject<AudioData>;
	theme: ColorTheme;
	onClose?: () => void;
}

export function HudMonitor({ audioData, theme, onClose }: HudMonitorProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// We need a loop to draw to the 2D canvas.
	// Since we are likely inside the R3F Canvas context in App (or should be),
	// we can use useFrame. If this is outside R3F, we need requestAnimationFrame.
	// However, HUDs are usually HTML overlays.
	// IF this component is placed OUTSIDE the <Canvas>, we need our own loop.
	// IF it is INSIDE <Canvas> (as <Html>), we use useFrame.
	// Based on the plan, this is a top-left overlay, likely sibling to the HUD Player.
	// So it should be an HTML component using requestAnimationFrame.

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationId: number;

		const draw = () => {
			animationId = requestAnimationFrame(draw);

			const width = canvas.width;
			const height = canvas.height;

			// Clear
			ctx.clearRect(0, 0, width, height);

			// --- Styling ---
			ctx.fillStyle = theme.accent;
			ctx.strokeStyle = theme.accent;
			ctx.lineWidth = 2;

			// --- FAKE SPECTRUM SIMULATION (Since we only get 3 bands from AudioData) ---
			// Real apps would pass the full FFT array.
			// We will simulate a full spectrum using the 3 bands we have + some noise interpolation.
			const { low, mid, high } = audioData.current;

			// Bars
			const barCount = 16;
			const barWidth = (width - 20) / barCount;

			for (let i = 0; i < barCount; i++) {
				// Interpolate values
				let value = 0;
				if (i < 5)
					value = low * (1 - i * 0.1); // Bass heavy
				else if (i < 11)
					value = mid * (0.8 + (i % 2) * 0.2); // Mids
				else value = high * (0.5 + Math.random() * 0.5); // Highs (jittery)

				const barHeight = Math.max(4, value * height * 0.8);
				const x = 10 + i * barWidth;
				const y = height - 10 - barHeight;

				ctx.globalAlpha = 0.6;
				ctx.fillRect(x, y, barWidth - 2, barHeight);

				// Cap
				ctx.globalAlpha = 1.0;
				ctx.fillRect(x, y - 2, barWidth - 2, 2);
			}

			// --- WAVEFORM SIMULATION ---
			// Draw a line overlay based on the raw values
			ctx.beginPath();
			ctx.moveTo(10, height / 2);

			const points = barCount * 2;
			for (let i = 0; i <= points; i++) {
				const x = 10 + (i / points) * (width - 20);
				const progress = i / points;

				// Create a wave shape
				// Mix of low sine + high jitter
				const waveY =
					Math.sin(progress * Math.PI * 2 + Date.now() * 0.005) * (low * 20) +
					Math.sin(progress * Math.PI * 10) * (high * 10);

				ctx.lineTo(x, height / 2 - 40 + waveY);
			}
			ctx.stroke();

			// --- TEXT INFO ---
			ctx.fillStyle = theme.high.color;
			ctx.font = "10px monospace";
			ctx.fillText(`L: ${(low * 100).toFixed(0)}`, 10, 20);
			ctx.fillText(`M: ${(mid * 100).toFixed(0)}`, 50, 20);
			ctx.fillText(`H: ${(high * 100).toFixed(0)}`, 90, 20);
			ctx.fillText("SYS.MONITOR_v1.0", width - 100, 20);
		};

		draw();

		return () => cancelAnimationFrame(animationId);
	}, [audioData, theme]);

	return (
		<div className="absolute z-30 w-64 p-4 border shadow-2xl left-6 top-6 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl">
			<button type="button" onClick={onClose} className="absolute p-1 text-xs rounded top-3 right-3 text-white/40 hover:bg-white/5">✕</button>
			<div className="flex items-center justify-between mb-2">
				<p className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/60 w-full border-b border-white/5 pb-2">
					SYSTEM MONITOR
				</p>
			</div>

			<canvas
				ref={canvasRef}
				width={220}
				height={100}
				className="w-full h-auto opacity-80"
			/>

			<div className="mt-2 text-[9px] font-mono text-white/30 flex justify-between">
				<span>FREQ.RESP</span>
				<span>{theme.name.toUpperCase()} P.R.O.T.O.C.O.L</span>
			</div>
		</div>
	);
}
