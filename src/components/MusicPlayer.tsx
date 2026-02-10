import { AnimatePresence, motion } from "framer-motion";
import { List, Maximize2, Minimize2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { AnimationStyle, ColorTheme } from "../App";

type PlayerMode = "minimized" | "normal" | "maximized";

interface MusicPlayerProps {
	isPlaying: boolean;
	onTogglePlay: () => void;
	gain: number;
	onGainChange: (gain: number) => void;
	themeIndex: number;
	setThemeIndex: (index: number) => void;
	themes: ColorTheme[];
	animStyleIndex: number;
	setAnimStyleIndex: (index: number) => void;
	animationStyles: AnimationStyle[];
}

export function MusicPlayer({
	isPlaying,
	onTogglePlay,
	gain,
	onGainChange,
	themeIndex,
	setThemeIndex,
	themes,
	animStyleIndex,
	setAnimStyleIndex,
	animationStyles,
}: MusicPlayerProps) {
	const [playerMode, setPlayerMode] = useState<PlayerMode>("normal");
	const [showThemes, setShowThemes] = useState(false);
	const [showAnimStyles, setShowAnimStyles] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const draggingRef = useRef(false);
	const dragStartRef = useRef({ x: 0, y: 0 });
	const dragOrigRef = useRef({ x: 0, y: 0 });
	const [anchored, setAnchored] = useState<"right" | "left">("right");
	const [isHidden, setIsHidden] = useState(false);
	const hideTimerRef = useRef<number | null>(null);

	const currentTheme = themes[themeIndex];
	const currentAnimStyle = animationStyles[animStyleIndex];

	// Calculate width based on mode
	const playerWidth =
		playerMode === "minimized"
			? "auto"
			: playerMode === "maximized"
				? "min(28rem, calc(100vw - 2rem))"
				: "min(24rem, calc(100vw - 2rem))";

	// Dragging logic for minimized mode
	useEffect(() => {
		const onPointerMove = (e: PointerEvent) => {
			if (!draggingRef.current) return;
			const dx = e.clientX - dragStartRef.current.x;
			const dy = e.clientY - dragStartRef.current.y;
			setDragOffset({
				x: dragOrigRef.current.x + dx,
				y: dragOrigRef.current.y + dy,
			});
		};

		const onPointerUp = () => {
			draggingRef.current = false;
			const el = document.getElementById("music-player-widget");
			if (el) {
				const rect = el.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				if (centerX < window.innerWidth / 2) {
					setAnchored("left");
				} else {
					setAnchored("right");
				}
			}

			if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
			if (playerMode === "minimized") {
				hideTimerRef.current = window.setTimeout(() => setIsHidden(true), 4000);
			}
		};

		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
		return () => {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
			if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
		};
	}, [playerMode]);

	const onPointerDownMin = (e: React.PointerEvent) => {
		if (playerMode !== "minimized") return;
		draggingRef.current = true;
		dragStartRef.current = { x: e.clientX, y: e.clientY };
		dragOrigRef.current = { ...dragOffset };
		if (hideTimerRef.current) {
			window.clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
		setIsHidden(false);
	};

	// Auto-hide when minimized and playing
	useEffect(() => {
		if (playerMode === "minimized" && isPlaying) {
			if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
			hideTimerRef.current = window.setTimeout(() => setIsHidden(true), 4000);
		} else {
			if (hideTimerRef.current) {
				window.clearTimeout(hideTimerRef.current);
				hideTimerRef.current = null;
			}
			setIsHidden(false);
		}
	}, [playerMode, isPlaying]);

	return (
		<>
			{/* Show Button when hidden (minimized) */}
			{playerMode === "minimized" && isHidden && (
				<button
					type="button"
					onClick={() => setIsHidden(false)}
					className={`fixed ${anchored === "right" ? "right-6" : "left-6"} bottom-6 z-50 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-xs backdrop-blur-sm transition-transform hover:scale-110`}
				>
					▸
				</button>
			)}

			<motion.div
				id="music-player-widget"
				drag={playerMode === "minimized"}
				dragMomentum={false}
				dragListener={playerMode === "minimized"}
				onPointerDown={onPointerDownMin}
				animate={{
					width: playerWidth,
					height:
						playerMode === "minimized"
							? "auto"
							: playerMode === "maximized"
								? "32rem"
								: "auto",
					opacity: isHidden && playerMode === "minimized" ? 0 : 1,
					x: playerMode === "minimized" ? dragOffset.x : 0,
					y: playerMode === "minimized" ? dragOffset.y : 0,
				}}
				className={`fixed z-40 overflow-visible shadow-2xl backdrop-blur-xl transition-colors border
          ${
						playerMode === "minimized"
							? "rounded-full bg-black/80 border-white/10"
							: "rounded-2xl bg-black/40 border-white/10 p-4 bottom-6 right-6"
					}
        `}
				style={{
					right:
						playerMode === "minimized"
							? anchored === "right"
								? "1.5rem"
								: "auto"
							: "1.5rem",
					left:
						playerMode === "minimized"
							? anchored === "left"
								? "1.5rem"
								: "auto"
							: "auto",
					bottom: playerMode === "minimized" ? "1.5rem" : "1.5rem",
					pointerEvents:
						isHidden && playerMode === "minimized" ? "none" : "auto",
				}}
			>
				{playerMode === "minimized" ? (
					// MINIMIZED PILL UI
					<div className="flex items-center gap-3 p-2 pr-4 text-emerald-400">
						<div className="flex items-center gap-2">
							<div
								className={`w-2 h-2 ml-1 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}
							/>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={onTogglePlay}
								className="p-1.5 text-[10px] border rounded-full border-white/10 hover:bg-white/10 transition-colors text-emerald-400"
							>
								{isPlaying ? "STOP" : "PLAY"}
							</button>
							<button
								type="button"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={() => setPlayerMode("normal")}
								className="p-1.5 text-white/60 hover:text-white transition-colors"
							>
								<Maximize2 size={12} />
							</button>
						</div>
					</div>
				) : (
					// NORMAL / MAXIMIZED UI
					<div className="flex flex-col h-full text-emerald-400">
						<div className="flex items-center justify-between mb-4">
							<div>
								<p className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/60">
									Wake Transmission
								</p>
								<p className="mt-1 font-mono text-sm font-bold tracking-tight">
									LIVE STREAM FEED
								</p>
							</div>
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => setPlayerMode("minimized")}
									className="p-1 transition-colors rounded-full hover:bg-white/10 text-emerald-400/60 hover:text-emerald-400"
									title="Minimize"
								>
									<Minimize2 size={14} />
								</button>
								<button
									type="button"
									onClick={() =>
										setPlayerMode(
											playerMode === "maximized" ? "normal" : "maximized",
										)
									}
									className="p-1 transition-colors rounded-full hover:bg-white/10 text-emerald-400/60 hover:text-emerald-400"
									title={
										playerMode === "maximized" ? "Standard View" : "Expand"
									}
								>
									<List size={14} />
								</button>
								<div
									className={`ml-2 w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 border rounded-xl bg-white/5 border-white/5">
								<div className="flex items-center gap-3">
									<div
										className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}
									/>
									<div className="text-xs font-mono">
										{isPlaying ? "SIGNAL ACTIVE - RECEIVING" : "SIGNAL STANDBY"}
									</div>
								</div>
								<button
									type="button"
									onClick={onTogglePlay}
									className={`px-3 py-1 text-[10px] font-bold border rounded-lg transition-all ${
										isPlaying
											? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
											: "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
									}`}
								>
									{isPlaying ? "STOP AUDIO" : "INITIATE"}
								</button>
							</div>

							<div className="grid grid-cols-2 gap-2">
								{/* Theme Switcher */}
								<div className="relative">
									<button
										type="button"
										onClick={() => {
											setShowThemes(!showThemes);
											setShowAnimStyles(false);
										}}
										style={{ borderColor: `${currentTheme.accent}30` }}
										className="flex items-center justify-between w-full px-3 py-2 font-mono text-[10px] tracking-wider uppercase transition-colors border rounded-lg hover:bg-white/5"
									>
										<span className="truncate">
											{currentTheme.icon} {currentTheme.name}
										</span>
										<span className="opacity-30 text-[8px]">▼</span>
									</button>
									<AnimatePresence>
										{showThemes && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 10 }}
												className="absolute bottom-full left-0 w-48 mb-2 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 overflow-auto z-50 max-h-[40vh] shadow-2xl"
											>
												{themes.map((t, i) => (
													<button
														type="button"
														key={t.name}
														onClick={() => {
															setThemeIndex(i);
															setShowThemes(false);
														}}
														className={`w-full px-3 py-2.5 text-left text-[10px] font-mono flex items-center gap-2 hover:bg-white/10 transition-colors ${
															i === themeIndex
																? "bg-white/10 text-emerald-400"
																: "text-white/60"
														}`}
													>
														<span>{t.icon}</span>
														<span className="flex-1">{t.name}</span>
													</button>
												))}
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Animation Style Switcher */}
								<div className="relative">
									<button
										type="button"
										onClick={() => {
											setShowAnimStyles(!showAnimStyles);
											setShowThemes(false);
										}}
										style={{ borderColor: `${currentTheme.accent}30` }}
										className="flex items-center justify-between w-full px-3 py-2 font-mono text-[10px] tracking-wider uppercase transition-colors border rounded-lg hover:bg-white/5"
									>
										<span className="truncate">
											{currentAnimStyle.icon} {currentAnimStyle.name}
										</span>
										<span className="opacity-30 text-[8px]">▼</span>
									</button>
									<AnimatePresence>
										{showAnimStyles && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 10 }}
												className="absolute bottom-full right-0 w-48 mb-2 bg-black/90 backdrop-blur-xl rounded-lg border border-white/10 overflow-auto z-50 max-h-[40vh] shadow-2xl"
											>
												{animationStyles.map((s, i) => (
													<button
														type="button"
														key={s.name}
														onClick={() => {
															setAnimStyleIndex(i);
															setShowAnimStyles(false);
														}}
														className={`w-full px-3 py-2.5 text-left text-[10px] font-mono flex items-center gap-2 hover:bg-white/10 transition-colors ${
															i === animStyleIndex
																? "bg-white/10 text-emerald-400"
																: "text-white/60"
														}`}
													>
														<span>{s.icon}</span>
														<span className="flex-1">{s.name}</span>
													</button>
												))}
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>

							<div className="p-3 bg-white/5 rounded-xl space-y-2 border border-white/5">
								<div className="flex justify-between text-[9px] font-mono tracking-tighter opacity-60">
									<span>GAIN CONTROL</span>
									<span>{Math.round(gain * 100)}%</span>
								</div>
								<input
									type="range"
									min="0"
									max="1"
									step="0.01"
									value={gain}
									onChange={(e) => onGainChange(parseFloat(e.target.value))}
									className="w-full h-1 overflow-hidden rounded-full appearance-none accent-emerald-500 bg-emerald-950/50 cursor-pointer"
								/>
							</div>
						</div>

						{playerMode === "maximized" && (
							<div className="mt-4 pt-4 border-t border-white/10 flex-1 overflow-y-auto">
								<p className="text-[10px] uppercase tracking-widest text-emerald-500/40 mb-2">
									System Status
								</p>
								<div className="space-y-2 font-mono text-[10px] text-emerald-400/60 pb-2">
									<p>
										Connection: Stable ({Math.floor(Math.random() * 20) + 10}ms)
									</p>
									<p>Stream Bitrate: 320kbps</p>
									<p>Visualizer: Active</p>
									<p>Session Time: {new Date().toLocaleTimeString()}</p>
									<p className="mt-4 pt-4 border-t border-white/5">
										<a
											href="https://dreaming.coreyburns.ca"
											target="_blank"
											rel="noopener noreferrer"
											className="block text-center p-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 transition-all text-emerald-500 font-bold"
										>
											✨ EXPLORE DREAM TRANSMISSION
										</a>
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</motion.div>
		</>
	);
}
