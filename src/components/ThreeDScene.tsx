"use client";
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CarModel } from './CarModel';
import { EnvironmentSetup } from './EnvironmentSetup';
import { Preload, Trail, Sparkles, PresentationControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const DURATION = 3.5;

function getSharedProgress(t: number) {
    let raw = t / DURATION;
    if (raw > 1) raw = 1;
    // Smoother cubic easing (InOut)
    return raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
}

// ---------------------------------------------------------
// Premium Dark Studio / Showroom Lighting
// ---------------------------------------------------------
function ReferenceEnvironment({ mountTime }: { mountTime: number }) {
    const haloLight = useRef<THREE.PointLight>(null);
    const lightningRef = useRef<THREE.PointLight>(null);
    const neonLineMat = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((state) => {
        const t = Math.max(0, state.clock.elapsedTime - mountTime);
        const p = getSharedProgress(t);

        if (lightningRef.current) {
            // Flash random intense bursts of purple/white light
            if (p < 0.9 && Math.random() > 0.97) {
                lightningRef.current.intensity = Math.random() * 100;
                lightningRef.current.position.set((Math.random() - 0.5) * 80, 20, (Math.random() - 0.5) * 80);
            } else {
                lightningRef.current.intensity = THREE.MathUtils.lerp(lightningRef.current.intensity, 0, 0.2);
            }
        }

        if (haloLight.current) {
            haloLight.current.intensity = 50 + Math.sin(t * 3) * 10; // Slow ambient pulse
        }

        if (neonLineMat.current) {
            neonLineMat.current.opacity = 0.5 + Math.sin(t * 10) * 0.2; // pulse
        }
    });

    return (
        <group>
            {/* Massive Overhead Halo Softbox (Classic High-End Car Reveal Lighting) */}
            <mesh position={[-5, 12, -15]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[25, 0.2, 64, 128]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight ref={haloLight} position={[-5, 11, -15]} intensity={50} color="#ffffff" distance={60} decay={2} />

            {/* Distant Atmospheric Accent Lights hitting the floor */}
            <spotLight position={[-40, 5, -30]} angle={0.8} intensity={40} color="#0055ff" penumbra={1} distance={100} castShadow />
            <spotLight position={[40, 5, -20]} angle={0.8} intensity={40} color="#ff0055" penumbra={1} distance={100} castShadow />
            <spotLight position={[0, 10, -50]} angle={1} intensity={30} color="#ffffff" penumbra={1} distance={100} />

            {/* The dramatic lightning strike flasher */}
            <pointLight ref={lightningRef} color="#cc99ff" distance={200} decay={1.5} />

            {/* Dark Glossy Infinite Showroom Floor */}
            <mesh position={[0, -0.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#050505" roughness={0.15} metalness={0.9} />
            </mesh>

            {/* The Elliptical Glowing Path on the ground */}
            <mesh position={[-5, -0.62, -15]} rotation={[-Math.PI / 2, 0, 0]}>
                {/* A partial ellipse / ring curve for the car to follow */}
                <torusGeometry args={[30, 0.1, 16, 100, Math.PI]} />
                <meshBasicMaterial ref={neonLineMat} color="#00ddff" transparent opacity={0.3} />
            </mesh>

            {/* Subtle ambient fill so the shadows aren't pitch black */}
            <ambientLight intensity={0.2} color="#111122" />

            {/* Floating dust motes catching the studio lights */}
            <Sparkles count={800} scale={60} size={3} speed={0.2} opacity={0.15} color="#ffffff" position={[0, 5, -15]} />
        </group>
    );
}

// ---------------------------------------------------------
// The Elliptical Curve Math & Trailing Animation
// ---------------------------------------------------------
function TracedCar({ mountTime }: { mountTime: number }) {
    const groupRef = useRef<THREE.Group>(null);

    // Ellipse parameters
    const centerX = -5;
    const centerZ = -15;
    const radiusX = 30; // wide curve
    const radiusZ = 20;

    useFrame((state) => {
        if (!groupRef.current) return;

        const t = Math.max(0, state.clock.elapsedTime - mountTime);
        const p = getSharedProgress(t);

        // 1. Position: Driving along the elliptical arc
        // 0 to PI over the duration
        const angle = p * Math.PI; 
        
        // Start from angle 0 (x=25, z=-15) and curve to angle PI (x=-35, z=-15)
        const x = centerX + Math.cos(angle) * radiusX;
        const z = centerZ + Math.sin(angle) * radiusZ;

        // Front dip/brake at the very end when parking
        let y = -0.6;
        if (p > 0.8 && p < 1) {
            y = -0.6 - Math.sin((p - 0.8) * 5 * Math.PI) * 0.08;
        }

        groupRef.current.position.set(x, y, z);

        // 2. Rotation (Tangent to ellipse)
        // dx/da = -radiusX * sin(a), dz/da = radiusZ * cos(a)
        const dx = -radiusX * Math.sin(angle);
        const dz = radiusZ * Math.cos(angle);
        const driveAngle = Math.atan2(dx, dz);

        // Final hero pose facing slightly forward
        const finalAngle = Math.PI / 6;

        const rotMix = Math.pow(p, 8);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(driveAngle, finalAngle, rotMix);

        // Roll into turns like a real car leaning into the elliptical tight corner
        const roll = Math.sin(angle) * 0.2; 
        let pitch = p < 0.8 ? -0.05 : 0;
        if (p > 0.8 && p < 1) {
            pitch = -0.15 * Math.sin((p - 0.8) * 5 * Math.PI); // Hard brake dive
        }

        groupRef.current.rotation.z = roll;
        groupRef.current.rotation.x = pitch;
    });

    return (
        <>
            <group ref={groupRef}>
                {/* Massive Glowing TRON-like tail trails */}
                <Trail width={1.0} color={'#00ddff'} length={30} decay={1.5} local={false} stride={0} interval={1}>
                    <group position={[-0.6, 0.4, 1.2]}><mesh><sphereGeometry args={[0.01]} /><meshBasicMaterial color="#00ddff" /></mesh></group>
                </Trail>
                <Trail width={1.0} color={'#ff0055'} length={30} decay={1.5} local={false} stride={0} interval={1}>
                    <group position={[0.6, 0.4, 1.2]}><mesh><sphereGeometry args={[0.01]} /><meshBasicMaterial color="#ff0055" /></mesh></group>
                </Trail>

                {/* Wraps the car to allow the user to drag and rotate it around its center point */}
                <PresentationControls
                    global={true} // Can grab anywhere on the screen
                    cursor={false} // Canvas already handles cursor CSS
                    snap={true} // Bounces back to original angle when released
                    speed={1.5}
                    zoom={1.1} // Slight zoom on grab
                    rotation={[0, 0, 0]}
                    polar={[-Math.PI / 12, Math.PI / 6]} // Limit vertical rotation so they don't look completely underneath it
                    azimuth={[-Infinity, Infinity]} // Infinite horizontal rotation
                >
                    <CarModel scale={[0.35, 0.35, 0.35]} />
                </PresentationControls>
            </group>
        </>
    );
}

// ---------------------------------------------------------
// Active Overhead Tracking Camera
// ---------------------------------------------------------
function CameraRig({ mountTime }: { mountTime: number }) {
    const { viewport } = useThree();

    useFrame((state, delta) => {
        const t = Math.max(0, state.clock.elapsedTime - mountTime);
        const p = getSharedProgress(t);

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        // Extreme Zoom In: Push camera intimately close to the car on mobile
        const finalZ = isMobile ? 8 : 12; 
        const finalFov = isMobile ? 55 : 45; 

        // Starts high up and tight, finishes lower down tracking the car
        // @ts-ignore
        state.camera.fov = THREE.MathUtils.lerp(80, finalFov, p);
        state.camera.updateProjectionMatrix();

        // Calculate Car's current Elliptical Position dynamically to follow it
        const angle = p * Math.PI; 
        const carX = -5 + Math.cos(angle) * 30;
        const carZ = -15 + Math.sin(angle) * 20;

        if (p > 0.8 && p < 0.95) {
            const intensity = (0.95 - p) * 1.0;
            state.camera.position.x = carX + (Math.random() - 0.5) * intensity;
            state.camera.position.y = 8 + (Math.random() - 0.5) * intensity;
        } else {
            // Chase camera trails behind the car's X and offsets Z
            state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, carX * 0.4, 2, delta);
            state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, carZ + THREE.MathUtils.lerp(50, finalZ, p), 3, delta);

            if (p > 0.99) {
                state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 2.2 + Math.sin(t * 0.5) * 0.1, 0.5, delta);
            } else {
                state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, THREE.MathUtils.lerp(15, 8, p), 2, delta);
            }
        }

        // Always point the camera at the car
        state.camera.lookAt(carX, 0, carZ);
    });
    return null;
}

// ---------------------------------------------------------
// Love Text Component – rises from behind the parked car in 3D world space
// ---------------------------------------------------------
function LoveText({ mountTime }: { mountTime: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Scale text up aggressively as camera pushes closer
    const textScale = isMobile ? 0.75 : 1; 

    // Camera is at Z:8, meaning we need to pull text aggressively closer
    // so it doesn't get obscured or look tiny in the background
    const parkX = isMobile ? -36.5 : -35;
    const parkZ = isMobile ? -14 : -22; 
    const parkRotY = Math.PI / 6; 

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = Math.max(0, state.clock.elapsedTime - mountTime);
        const triggerAt = DURATION + 0.8; 
        if (t < triggerAt) {
            groupRef.current.position.y = -4; 
        } else {
            // Keep it tucked just above the car's roof
            const targetY = isMobile ? 2.4 : 2.8;
            groupRef.current.position.y = THREE.MathUtils.damp(
                groupRef.current.position.y, targetY, 3.5, delta
            );
        }
    });

    return (
        <group ref={groupRef} position={[parkX, -4, parkZ]} rotation={[0, parkRotY, 0]} scale={[textScale, textScale, textScale]}>
            {/* Semi-transparent dark backdrop so text pops */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[11, 3]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.55} />
            </mesh>

            {/* Top decorative label */}
            {/* <Text
                position={[0, 0.88, 0]}
                fontSize={0.28}
                anchorX="center" anchorY="middle"
                letterSpacing={0.18}
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
            >
                {'✦  crafted with passion  ✦'}
                <meshStandardMaterial emissive="#00ddff" emissiveIntensity={5} color="#004466" />
            </Text> */}

            {/* Big main line - bold font */}
            <Text
                position={[0, 0, 0]}
                fontSize={0.75}
                anchorX="center" anchorY="middle"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
            >
                {'Made for you by Arush'}
                <meshStandardMaterial emissive="#ff0055" emissiveIntensity={4} color="#660022" />
            </Text>

            {/* Bottom row - subtle tagline */}
            {/* <Text
                position={[0, -0.78, 0]}
                fontSize={0.22}
                anchorX="center" anchorY="middle"
                letterSpacing={0.25}
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
            >
                {'❤  vault-gallery.dev  ❤'}
                <meshStandardMaterial emissive="#ff0055" emissiveIntensity={3} color="#660022" />
            </Text> */}
        </group>
    );
}

// Inner Wrapper to access useThree() cleanly for clock sync
function ThreeDInner({ mountTime }: { mountTime: number }) {
    const { clock } = useThree();
    
    // We capture the exact THREE.Clock time when this component mounts, 
    // rather than using performance.now(), ensuring they are 1:1 synced.
    const [threeMountTime] = useState(() => clock.elapsedTime);

    return (
        <>
            <Suspense fallback={null}>
                <CameraRig mountTime={threeMountTime} />
                <EnvironmentSetup />
                <ReferenceEnvironment mountTime={threeMountTime} />
                <TracedCar mountTime={threeMountTime} />

                {/* GPU Post-Processing Effects optimized for clarity */}
                <EffectComposer>
                    <Bloom luminanceThreshold={3.0} mipmapBlur luminanceSmoothing={0.1} intensity={0.4} />
                    <Vignette eskil={false} offset={0.1} darkness={0.9} />
                </EffectComposer>
            </Suspense>

            {/* Separate Suspense so font loading doesn't block the car */}
            <Suspense fallback={null}>
                <LoveText mountTime={threeMountTime} />
            </Suspense>
        </>
    );
}

// ---------------------------------------------------------
// Main Scene : Hydration Safe Wrapper
// ---------------------------------------------------------
export function ThreeDScene() {
    const [mountTime, setMountTime] = useState<number | null>(null);

    useEffect(() => {
        // Wait an extra frame to ensure ThreeJS clock has started
        requestAnimationFrame(() => {
             setMountTime(performance.now() / 1000);
        });
    }, []);

    if (mountTime === null) {
        return <div className="w-full h-screen absolute top-0 left-0 bg-[#000000] z-50 flex items-center justify-center text-white">Loading Engine...</div>;
    }

    return (
        <div className="w-full h-screen absolute top-0 left-0 bg-[#000000] overflow-hidden">
            <Canvas shadows camera={{ position: [0, 8, -40], fov: 60 }} style={{ position: 'absolute', inset: 0, zIndex: 0 }} className="cursor-grab active:cursor-grabbing">
                <fog attach="fog" args={['#000', 5, 45]} />
                <ThreeDInner mountTime={mountTime} />
                <Preload all />
            </Canvas>

            {/* Cinematic Title */}
            <div className="absolute top-[10%] left-0 right-0 z-10 pointer-events-none flex items-center justify-center p-4">
                <h1 className="text-center text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-0 animate-[fadeIn_2s_ease-out_3s_forwards]" style={{ textShadow: '0 0 40px rgba(168,85,247,0.4)' }}>
                    For You
                </h1>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `
            }} />
        </div>
    );
}
