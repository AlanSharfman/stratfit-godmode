import { create } from "zustand";
import * as THREE from "three";

export const useRenderStore = create(() => ({
    renderer: null as THREE.WebGLRenderer | null,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(50, 1, 0.1, 5000),
    activeViewId: null as string | null
}));
