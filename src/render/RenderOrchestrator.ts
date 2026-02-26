import * as THREE from "three";
import { useRenderStore } from "./RenderStore";

class RenderOrchestrator {
    private rafId: number | null = null;
    private contextHandlers: { lost: (e: Event) => void; restored: () => void } | null = null;

    init(canvas: HTMLCanvasElement) {
        const state = useRenderStore.getState();
        if (state.renderer) return;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        // WebGL context loss / restore safety net
        const onLost = (e: Event) => {
            e.preventDefault();
            console.warn("[WebGL] context lost");
        };
        const onRestored = () => {
            console.warn("[WebGL] context restored");
            window.location.reload();
        };
        canvas.addEventListener("webglcontextlost", onLost, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
        this.contextHandlers = { lost: onLost, restored: onRestored };

        useRenderStore.setState({ renderer });

        this.loop();
    }

    private loop = () => {
        const { renderer, scene, camera } = useRenderStore.getState();
        if (!renderer) return;

        renderer.render(scene, camera);
        this.rafId = requestAnimationFrame(this.loop);
    };

    dispose() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        const { renderer, scene } = useRenderStore.getState();

        // Deep scene cleanup — dispose geometries, materials, textures
        if (scene) {
            scene.traverse((obj: any) => {
                obj.geometry?.dispose?.();
                const mat = obj.material;
                if (mat) {
                    const mats = Array.isArray(mat) ? mat : [mat];
                    for (const m of mats) {
                        for (const k in m) {
                            const v = (m as any)[k];
                            if (v?.isTexture) v.dispose?.();
                        }
                        m.dispose?.();
                    }
                }
            });
        }

        if (renderer) {
            // Remove context listeners
            if (this.contextHandlers) {
                const canvas = renderer.domElement;
                canvas.removeEventListener("webglcontextlost", this.contextHandlers.lost);
                canvas.removeEventListener("webglcontextrestored", this.contextHandlers.restored);
                this.contextHandlers = null;
            }
            renderer.renderLists?.dispose?.();
            renderer.dispose();
        }
    }
}

export const renderOrchestrator = new RenderOrchestrator();
