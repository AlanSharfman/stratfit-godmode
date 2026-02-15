import * as THREE from "three";

/**
 * Creates a 1D DataTexture from a Float32Array of velocity values.
 * Values should be in [0..1] range. Stored in R channel.
 * Texture width = values.length, height = 1.
 */
export function createVelocityTexture(values: Float32Array): THREE.DataTexture {
    const width = values.length;
    const data = new Uint8Array(width * 4);

    for (let i = 0; i < width; i++) {
        const v = Math.max(0, Math.min(1, values[i]));
        const byte = Math.round(v * 255);
        data[i * 4 + 0] = byte; // R — velocity intensity
        data[i * 4 + 1] = byte; // G — duplicate for filtering
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 255;
    }

    const tex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;

    return tex;
}
