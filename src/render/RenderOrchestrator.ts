import * as THREE from "three";
import { useRenderStore } from "./RenderStore";

class RenderOrchestrator {
    private rafId: number | null = null;

    init(canvas: HTMLCanvasElement) {
        const state = useRenderStore.getState();
        if (state.renderer) return;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

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
        const { renderer } = useRenderStore.getState();
        renderer?.dispose();
    }
}

export const renderOrchestrator = new RenderOrchestrator();
