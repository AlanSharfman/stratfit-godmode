import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useSemanticBalance } from "@/render/shl/semanticBalance";

import { RPF_UNIFORMS_KEY } from "@/render/rpf/rpfContracts";
import { CF_UNIFORMS_KEY } from "@/render/cf/cfContracts";
import { TFL_UNIFORMS_KEY } from "@/render/tfl/tflContracts";
import { DHL_UNIFORMS_KEY } from "@/render/dhl/dhlContracts";
import { SRL_UNIFORMS_KEY } from "@/render/srl/srlContracts";
import { STM_UNIFORMS_KEY } from "@/render/stm/stmContracts";
import { TME_UNIFORMS_KEY } from "@/render/tme/tmeContracts";

import { setStmTopoScale } from "@/render/stm/stmRuntime";

import type { RpfUniforms } from "@/render/rpf/rpfContracts";
import type { CfUniforms } from "@/render/cf/cfContracts";
import type { TflUniforms } from "@/render/tfl/tflContracts";
import type { DhlUniforms } from "@/render/dhl/dhlContracts";
import type { SrlUniforms } from "@/render/srl/srlContracts";
import type { StmUniforms } from "@/render/stm/stmContracts";
import type { TmeUniforms } from "@/render/tme/tmeContracts";

/**
 * Base intensity values — what each layer uses before SHL modulation.
 * Must match the defaults in each layer's createXxxUniforms().
 */
const BASE_RPF_INTENSITY = 0.65;
const BASE_CF_INTENSITY = 0.45;
const BASE_TFL_INTENSITY = 0.18;
const BASE_DHL_INTENSITY = 0.22;
const BASE_SRL_INTENSITY = 0.08;
const BASE_STM_SCALE = 8.0;

/**
 * SemanticHarmonizer — declarative R3F component.
 *
 * Reads global semantic balance weights every frame and applies them
 * to each injected shader layer's intensity uniform.
 *
 * No geometry, no shader injection — purely uniform modulation.
 * Returns null — renders nothing.
 */
export default function SemanticHarmonizer() {
    const { scene } = useThree();

    const terrainMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const sdlMeshesRef = useRef<THREE.Mesh[]>([]);

    // Cache terrain material + SDL meshes once (avoid per-frame traversal)
    useEffect(() => {
        let foundMat: THREE.MeshStandardMaterial | null = null;
        const sdl: THREE.Mesh[] = [];

        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                if (!foundMat && obj.name === "terrain-surface") {
                    if (obj.material instanceof THREE.MeshStandardMaterial) {
                        foundMat = obj.material;
                    }
                }
                if (obj.name === "sdl-optimistic" || obj.name === "sdl-defensive") {
                    sdl.push(obj);
                }
            }
        });

        terrainMaterialRef.current = foundMat;
        sdlMeshesRef.current = sdl;

        return () => {
            terrainMaterialRef.current = null;
            sdlMeshesRef.current = [];
        };
    }, [scene]);

    useFrame(() => {
        const mat = terrainMaterialRef.current;
        if (!mat) return;

        const weights = useSemanticBalance.getState().weights;
        const ud = mat.userData;

        // RPF — risk weight
        const rpf = ud[RPF_UNIFORMS_KEY] as RpfUniforms | undefined;
        if (rpf) {
            rpf.uRpfIntensity.value = BASE_RPF_INTENSITY * weights.risk;
        }

        // CF — confidence weight
        const cf = ud[CF_UNIFORMS_KEY] as CfUniforms | undefined;
        if (cf) {
            cf.uCfIntensity.value = BASE_CF_INTENSITY * weights.confidence;
        }

        // TFL — flow weight
        const tfl = ud[TFL_UNIFORMS_KEY] as TflUniforms | undefined;
        if (tfl) {
            tfl.uTflIntensity.value = BASE_TFL_INTENSITY * weights.flow;
        }

        // DHL — heat weight
        const dhl = ud[DHL_UNIFORMS_KEY] as DhlUniforms | undefined;
        if (dhl) {
            dhl.uDhlIntensity.value = BASE_DHL_INTENSITY * weights.heat;
        }

        // SRL — resonance weight
        const srl = ud[SRL_UNIFORMS_KEY] as SrlUniforms | undefined;
        if (srl) {
            srl.uSrlIntensity.value = BASE_SRL_INTENSITY * weights.resonance;
        }

        // STM — topography weight
        const stm = ud[STM_UNIFORMS_KEY] as StmUniforms | undefined;
        if (stm) {
            stm.uTopoScale.value = BASE_STM_SCALE * weights.topography;
            setStmTopoScale(stm.uTopoScale.value);
        }

        // TME — morph weight
        const tme = ud[TME_UNIFORMS_KEY] as TmeUniforms | undefined;
        if (tme) {
            tme.uTmeEnabled.value = weights.morph > 0.01 ? 1.0 : 0.0;
        }

        // SDL divergence corridors: modulate opacity on cached meshes (no traversal)
        const sdlMeshes = sdlMeshesRef.current;
        if (sdlMeshes.length) {
            const opacity = 0.2 * weights.divergence;
            for (const mesh of sdlMeshes) {
                const m = mesh.material as THREE.MeshStandardMaterial | undefined;
                if (m) m.opacity = opacity;
            }
        }
    });

    return null;
}

