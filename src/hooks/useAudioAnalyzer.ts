import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

export interface AudioData {
	volume: number;
	low: number;
	mid: number;
	high: number;
}

// Keep track of sources to prevent recreating them for the same element
const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

export function useAudioAnalyzer(
	audioElement: HTMLAudioElement | null,
	isEnabled = false,
) {
	const analyzerRef = useRef<AnalyserNode | null>(null);
	const dataRef = useRef<AudioData>({ volume: 0, low: 0, mid: 0, high: 0 });
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		// Wait until user has interacted (isEnabled) AND we have an element
		if (!audioElement || !isEnabled) return;

		const ctx = getAudioContext();

		// Resume context if suspended (required after user gesture)
		if (ctx.state === "suspended") {
			ctx.resume();
		}

		// Create analyzer node
		const analyzer = ctx.createAnalyser();
		analyzer.fftSize = 256; // This determines the size of the FFT, and thus the frequencyBinCount
		analyzerRef.current = analyzer;

		let source: MediaElementAudioSourceNode;

		try {
			// Reuse existing source or create new one
			if (sourceMap.has(audioElement)) {
				source = sourceMap.get(audioElement)!;
			} else {
				source = ctx.createMediaElementSource(audioElement);
				sourceMap.set(audioElement, source);
			}

			// Connect: source -> analyzer -> destination
			source.connect(analyzer);
			analyzer.connect(ctx.destination); // Analyzer needs to be connected to destination to process audio

			// Defer state update to avoid "setState synchronously in effect" warning
			setTimeout(() => setIsReady(true), 0);

			return () => {
				try {
					// Disconnect in reverse order
					analyzer.disconnect(ctx.destination);
					source.disconnect(analyzer);
					// Note: We don't dispose of the analyzer node itself, as it's part of the AudioContext
					// and will be garbage collected when the context is closed or when no longer referenced.
				} catch {
					// ignore disconnect errors
				}
			};
		} catch (e) {
			console.warn("Audio setup error:", e);
			return;
		}
	}, [audioElement, isEnabled]);

	useEffect(() => {
		if (!isReady || !analyzerRef.current) return;

		let rafId: number;
		// Create a reusable buffer for frequency data (frequencyBinCount = fftSize / 2 = 128)
		const freqData = new Float32Array(analyzerRef.current.frequencyBinCount);

		const update = () => {
			if (!analyzerRef.current) return;
			// Fill the buffer with frequency data (values in dB, typically -100 to 0)
			analyzerRef.current.getFloatFrequencyData(freqData);

			// Calculate levels for different frequency ranges
			// frequencyBinCount = 128, so: low (0-10), mid (10-50), high (50-128)
			const binCount = freqData.length;
			let low = 0;
			let mid = 0;
			let high = 0;

			for (let i = 0; i < 10; i++) low += freqData[i] + 100; // offset dB to positive
			for (let i = 10; i < 50; i++) mid += freqData[i] + 100;
			for (let i = 50; i < binCount; i++) high += freqData[i] + 100;

			const currentData = {
				volume: (low + mid + high) / binCount,
				low: low / 10,
				mid: mid / 40,
				high: high / (binCount - 50),
			};

			// Helper to sanitize values
			const sanitize = (val: number) => {
				if (!Number.isFinite(val) || Number.isNaN(val)) return 0;
				return Math.max(0, val / 100);
			};

			// Map to 0-1 range roughly (dB is usually -100 to 0)
			const normalizedData = {
				volume: sanitize(currentData.volume),
				low: sanitize(currentData.low),
				mid: sanitize(currentData.mid),
				high: sanitize(currentData.high),
			};

			// Smooth the data using GSAP for that "smooth motion" requirement
			gsap.to(dataRef.current, {
				duration: 0.1,
				volume: normalizedData.volume,
				low: normalizedData.low,
				mid: normalizedData.mid,
				high: normalizedData.high,
				ease: "power2.out",
				overwrite: true,
			});

			rafId = requestAnimationFrame(update);
		};

		update();

		return () => cancelAnimationFrame(rafId);
	}, [isReady]);

	return dataRef;
}
