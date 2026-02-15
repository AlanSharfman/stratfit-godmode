import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSemanticBalance } from "@/render/shl/semanticBalance";
import { RPF_UNIFORMS_KEY } from "@/render/rpf/rpfContracts";
import { CF_UNIFORMS_KEY } from "@/render/cf/cfContracts";
import { TFL_UNIFORMS_KEY } from "@/render/tfl/tflContracts";
import { DHL_UNIFORMS_KEY } from "@/render/dhl/dhlContracts";
import { SRL_UNIFORMS_KEY } from "@/render/srl/srlContracts";
import type { RpfUniforms } from "@/render/rpf/rpfContracts";
import type { CfUniforms } from "@/render/cf/cfContracts";
import type { TflUniforms } from "@/render/tfl/tflContracts";
import type { DhlUniforms } from "@/render/dhl/dhlContracts";
import type { SrlUniforms } from "@/render/srl/srlContracts";

/**
 * Base intensity values — what each layer uses before SHL modulation.
 * Must match the defaults in each layer's createXxxUniforms().
 */
const BASE_RPF_INTENSITY = 0.65;
const BASE_CF_INTENSITY = 0.45;
const BASE_TFL_INTENSITY = 0.18;
const BASE_DHL_INTENSITY = 0.22;
const BASE_SRL_INTENSITY = 0.08;

/**
 * SemanticHarmonizer — declarative R3F component.
 *
 * Reads global semantic balance weights every frame and applies them
 * to each injected shader layer's intensity uniform. This provides a
 * single control surface for visual intensity across all semantic layers.
 *
 * No geometry, no shader injection — purely uniform modulation.
 * Returns null — renders nothing.
 */
export default function SemanticHarmonizer() {
    const { scene } = useThree();

    useFrame(() => {
        const weights = useSemanticBalance.getState().weights;

        // Find terrain material
        let found: THREE.MeshStandardMaterial | null = null;
        scene.traverse((obj) => {
            if (found) return;
            if (obj instanceof THREE.Mesh && obj.name === "terrain-surface") {
                if (obj.material instanceof THREE.MeshStandardMaterial) {
                    found = obj.material;
                }
            }
        });
        if (!found) return;
        const mat: THREE.MeshStandardMaterial = found;

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

        // SDL divergence corridors: modulate opacity on ghost meshes
        scene.traverse((obj) => {
            if (
                obj instanceof THREE.Mesh &&
                (obj.name === "sdl-optimistic" || obj.name === "sdl-defensive")
            ) {
                const m = obj.material as THREE.MeshStandardMaterial;
                if (m) {
                    m.opacity = 0.2 * weights.divergence;
                }
            }
        });
    });

    return null;
}
