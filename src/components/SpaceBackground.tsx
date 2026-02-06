import { useFrame } from "@react-three/fiber";
import type React from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ColorTheme } from "../App";
import type { AudioData } from "../hooks/useAudioAnalyzer";

interface SpaceBackgroundProps {
	audioData: React.MutableRefObject<AudioData>;
	theme: ColorTheme;
}

export function SpaceBackground({ audioData, theme }: SpaceBackgroundProps) {
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const count = 2000;

	// Create particles data once
	const particles = useMemo(() => {
		const temp = [];
		for (let i = 0; i < count; i++) {
			// Random position in a large cube
			const x = (Math.random() - 0.5) * 120;
			const y = (Math.random() - 0.5) * 120;
			// Spread deep into Z distance, starting from behind camera (-100) to slightly in front (20)
			const z = (Math.random() - 0.5) * 120 - 40;
			const scale = 0.5 + Math.random() * 0.5;
			temp.push({ x, y, z, scale });
		}
		return temp;
	}, []);

	const dummy = useMemo(() => new THREE.Object3D(), []);

	useFrame((state, delta) => {
		if (!meshRef.current) return;

		const rawLow = audioData.current.low;
		const rawHigh = audioData.current.high;
		const low = Number.isFinite(rawLow) ? rawLow : 0;
		const high = Number.isFinite(rawHigh) ? rawHigh : 0;

		// Speed control: Base drift + "Warp Speed" based on bass/energy
		const speed = 2 + low * 30;

		// Rotate the whole field slightly for a "rolling" feeling
		meshRef.current.rotation.z += delta * 0.02;

		particles.forEach((particle, i) => {
			// Move star towards camera (+Z)
			particle.z += speed * delta;

			// Reset if passed camera (camera is at Z=10, reset around Z=20 to be safe)
			if (particle.z > 20) {
				particle.z = -100; // Reset far back
				particle.x = (Math.random() - 0.5) * 120; // New random X
				particle.y = (Math.random() - 0.5) * 120; // New random Y
			}

			dummy.position.set(particle.x, particle.y, particle.z);

			// Pulse scale slightly with high freq for twinkling effect
			const flicker = 1 + Math.random() * 0.2 * high;
			const scale = particle.scale * flicker;
			dummy.scale.setScalar(scale);

			dummy.updateMatrix();
			meshRef.current!.setMatrixAt(i, dummy.matrix);
		});

		meshRef.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh
			ref={meshRef}
			args={[undefined, undefined, count]}
			frustumCulled={false}
		>
			<sphereGeometry args={[0.05, 8, 8]} />
			<meshBasicMaterial
				color={theme.high.color} // Use the theme's high/bright color (usually consistent with the vibe)
				transparent
				opacity={0.6}
				blending={THREE.AdditiveBlending}
			/>
		</instancedMesh>
	);
}
