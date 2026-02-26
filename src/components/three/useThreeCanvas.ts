import * as THREE from "three";

let renderer: THREE.WebGLRenderer | null = null;
let animationId: number | null = null;

export function initStudioScene(container: HTMLDivElement) {
    if (renderer) return () => { }; // prevent duplicate renderer

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        2000
    );
    camera.position.set(0, 2, 6);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

    container.appendChild(renderer.domElement);

    // WebGL context loss / restore safety net
    const canvas = renderer.domElement;
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

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 2);
    scene.add(light);

    function animate() {
        animationId = requestAnimationFrame(animate);
        renderer!.render(scene, camera);
    }

    animate();

    function handleResize() {
        if (!renderer) return;

        const w = container.clientWidth;
        const h = container.clientHeight;

        if (w === 0 || h === 0) return;

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    window.addEventListener("resize", handleResize);

    return () => {
        window.removeEventListener("resize", handleResize);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
    };
}

export function disposeStudioScene(dispose?: () => void) {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;

    if (renderer) {
        // Deep scene cleanup is handled by caller if needed;
        // force GPU resource release
        renderer.renderLists?.dispose?.();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        renderer = null;
    }

    if (dispose) dispose();
}
