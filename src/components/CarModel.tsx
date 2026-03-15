"use client";
import React, { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CarModel(props: any) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/bmw.glb');
 

  const wheels = useMemo(() => {
    const wheelNodes: THREE.Object3D[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      const name = child.name.toLowerCase();
      if (name.includes('wheel') || name.includes('tire') || name.includes('rim') || name.includes('rotor')) {
        wheelNodes.push(child);
      }
    });
    return wheelNodes;
  }, [scene]);

  const prevPosition = useRef(new THREE.Vector3());

  useFrame(() => {
    if (group.current) {
      const currentPosition = new THREE.Vector3();
      group.current.getWorldPosition(currentPosition);

      const distance = currentPosition.distanceTo(prevPosition.current);

      // Auto rotate wheels matching real world coordinate movement distance
      if (distance > 0.001) {
        wheels.forEach((wheel) => {
          wheel.rotation.x -= distance * 12;
        });
      }
      prevPosition.current.copy(currentPosition);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/bmw.glb');
