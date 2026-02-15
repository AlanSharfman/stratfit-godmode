import * as THREE from "three";

export type RenderView = {
    id: string;
    mount: (scene: THREE.Scene, camera: THREE.Camera) => void;
    unmount?: () => void;
};

export type RenderState = {
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    activeViewId: string | null;
};
