import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import gsap from 'gsap';

export interface AudioData {
  volume: number;
  low: number;
  mid: number;
  high: number;
}

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const analyzerRef = useRef<Tone.Analyser | null>(null);
  const dataRef = useRef<AudioData>({ volume: 0, low: 0, mid: 0, high: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!audioElement) return;

    // Initialize Tone.js analyzer
    const analyzer = new Tone.Analyser('fft', 256);
    analyzerRef.current = analyzer;

    // Create a source from the audio element
    const source = Tone.getContext().createMediaElementSource(audioElement);
    source.connect(analyzer);
    // Also connect to destination to hear it
    source.connect(Tone.getContext().destination);

    setIsReady(true);

    return () => {
      source.disconnect();
      analyzer.dispose();
    };
  }, [audioElement]);

  useEffect(() => {
    if (!isReady || !analyzerRef.current) return;

    let rafId: number;

    const update = () => {
      const freqData = analyzerRef.current?.getValue() as Float32Array;
      if (!freqData) return;

      // Calculate levels for different frequency ranges
      // Simplified: low (0-20), mid (20-100), high (100-256)
      let low = 0;
      let mid = 0;
      let high = 0;

      for (let i = 0; i < 20; i++) low += freqData[i];
      for (let i = 20; i < 100; i++) mid += freqData[i];
      for (let i = 100; i < 256; i++) high += freqData[i];

      const currentData = {
        volume: (low + mid + high) / 256 + 100, // Offset from dB
        low: low / 20 + 100,
        mid: mid / 80 + 100,
        high: high / 156 + 100,
      };

      // Map to 0-1 range roughly (dB is usually -100 to 0)
      const normalizedData = {
        volume: Math.max(0, currentData.volume / 100),
        low: Math.max(0, currentData.low / 100),
        mid: Math.max(0, currentData.mid / 100),
        high: Math.max(0, currentData.high / 100),
      };

      // Smooth the data using GSAP for that "smooth motion" requirement
      gsap.to(dataRef.current, {
        duration: 0.1,
        volume: normalizedData.volume,
        low: normalizedData.low,
        mid: normalizedData.mid,
        high: normalizedData.high,
        ease: 'power2.out',
        overwrite: true
      });

      rafId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(rafId);
  }, [isReady]);

  return dataRef;
}
