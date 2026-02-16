// src/terrain/camera/CinematicCameraRig.tsx
// STRATFIT — Camera Rig (Only Controller)
// Phase 11 Voice API Lock

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "@react-three/drei";
import { useCinematicStore } from "@/core/store/useCinematicStore";
import { DEMO_SCRIPT } from "./demoScript";
import { runVoiceForStep, stopVoice } from "@/core/voice/demoVoiceOrchestrator";

function easeInOut(t: number) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default function CinematicCameraRig() {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    const mode = useCinematicStore((s) => s.mode);
    const demoStep = useCinematicStore((s) => s.demoStep);

    // interpolation state
    const tRef = useRef(0);
    const fromRef = useRef({ pos: new Vector3(), target: new Vector3(), fov: 45 });
    const toRef = useRef({ pos: new Vector3(), target: new Vector3(), fov: 45 });

    const keyframe = useMemo(() => {
        const idx = Math.max(0, Math.min(DEMO_SCRIPT.length - 1, demoStep));
        return DEMO_SCRIPT[idx];
    }, [demoStep]);

    // when entering demo or changing step: set interpolation endpoints deterministically
    useEffect(() => {
        if (mode !== "demo") return;

        const fromPos = camera.position.clone();
        const fromTarget = controlsRef.current?.target?.clone?.() ?? new Vector3(0, 8, 0);

        fromRef.current = { pos: fromPos, target: fromTarget, fov: (camera as PerspectiveCamera).fov };

        toRef.current = {
            pos: new Vector3(...keyframe.pos),
            target: new Vector3(...keyframe.target),
            fov: keyframe.fov,
        };

        tRef.current = 0;
    }, [mode, demoStep, keyframe, camera]);

    // demo step auto-advance (deterministic dwell)
    useEffect(() => {
        if (mode !== "demo") return;

        const id = window.setTimeout(() => {
            const s = useCinematicStore.getState();
            if (s.mode !== "demo") return;
            const next = (s.demoStep + 1) % DEMO_SCRIPT.length;
            s.setDemoStep(next);
        }, keyframe.dwellMs);

        return () => window.clearTimeout(id);
    }, [mode, demoStep, keyframe.dwellMs]);

    // Voice narration trigger
    useEffect(() => {
        if (mode !== "demo") {
            stopVoice();
            return;
        }
        runVoiceForStep(demoStep);
    }, [mode, demoStep]);

    useFrame((_, delta) => {
        if (mode !== "demo") return;

        // 1.2s blend time
        const blendSeconds = 1.2;
        const tNext = Math.min(1, tRef.current + delta / blendSeconds);
        tRef.current = tNext;

        const e = easeInOut(tNext);

        // position
        camera.position.lerpVectors(fromRef.current.pos, toRef.current.pos, e);

        // fov
        (camera as PerspectiveCamera).fov = fromRef.current.fov + (toRef.current.fov - fromRef.current.fov) * e;
        camera.updateProjectionMatrix();

        // target (OrbitControls target)
        const tgt = new Vector3().lerpVectors(fromRef.current.target, toRef.current.target, e);
        if (controlsRef.current) {
            controlsRef.current.target.copy(tgt);
            controlsRef.current.update();
        }
    });

    const enableUser = mode === "explore";

    return (
        <OrbitControls
            ref={controlsRef}
            enabled={enableUser}
            enableDamping={true}
            dampingFactor={0.08}
            rotateSpeed={0.55}
            zoomSpeed={0.75}
            panSpeed={0.55}
            minDistance={28}
            maxDistance={140}
            minPolarAngle={0.25}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 8, 0]}
        />
    );
}
