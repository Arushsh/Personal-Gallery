"use client";
import React from 'react';
import { Environment, ContactShadows } from '@react-three/drei';

export function EnvironmentSetup() {
    return (
        <>
            <Environment preset="studio" />
            <directionalLight position={[10, 20, 5]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
            <ambientLight intensity={0.5} />

            <ContactShadows
                position={[0, 0, 0]}
                opacity={0.8}
                scale={20}
                blur={2}
                far={4.5}
                color="#000000"
            />
        </>
    );
}
