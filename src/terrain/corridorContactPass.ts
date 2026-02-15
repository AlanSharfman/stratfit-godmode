import * as THREE from "three";

/**
 * Generate a DataTexture mask representing corridor footprint on terrain.
 * Returns a grayscale texture where white = corridor presence, black = no corridor.
 * 
 * @param curves - Array of path curves (p10, p50, p90, branches)
 * @param terrainSize - World size of terrain {width, height} 
 * @param resolution - Texture resolution (default 256)
 * @param corridorWidths - Array of corridor widths for each curve (world units)
 * @param falloffDistance - Distance over which corridor darkening fades (default 3.0)
 */
export function generateCorridorMask(
    curves: THREE.CatmullRomCurve3[],
    terrainSize: { width: number; height: number },
    resolution = 256,
    corridorWidths: number[] = [],
    falloffDistance = 3.0
): THREE.DataTexture {
    const data = new Uint8Array(resolution * resolution);
    data.fill(0); // Initialize to black (no corridor)

    // Terrain bounds in world space (assuming centered at origin)
    const minX = -terrainSize.width / 2;
    const maxX = terrainSize.width / 2;
    const minZ = -terrainSize.height / 2;
    const maxZ = terrainSize.height / 2;

    // Sample each curve and rasterize to texture
    curves.forEach((curve, curveIdx) => {
        const width = corridorWidths[curveIdx] || 4.0; // Default corridor width
        const points = curve.getPoints(200); // High sampling for smooth coverage

        points.forEach((point) => {
            // Project 3D point to 2D terrain XZ plane
            const worldX = point.x;
            const worldZ = point.z;

            // Convert world coords to UV [0,1]
            const u = (worldX - minX) / (maxX - minX);
            const v = (worldZ - minZ) / (maxZ - minZ);

            if (u < 0 || u > 1 || v < 0 || v > 1) return; // Outside terrain bounds

            // Convert UV to texture pixel coords
            const centerPixelX = Math.floor(u * resolution);
            const centerPixelY = Math.floor(v * resolution);

            // Calculate radius in pixels (width is in world units, convert to pixel space)
            const radiusWorld = width * 0.5 + falloffDistance;
            const radiusPixelsX = (radiusWorld / terrainSize.width) * resolution;
            const radiusPixelsY = (radiusWorld / terrainSize.height) * resolution;

            // Rasterize circle with falloff
            const minPx = Math.max(0, Math.floor(centerPixelX - radiusPixelsX));
            const maxPx = Math.min(resolution - 1, Math.ceil(centerPixelX + radiusPixelsX));
            const minPy = Math.max(0, Math.floor(centerPixelY - radiusPixelsY));
            const maxPy = Math.min(resolution - 1, Math.ceil(centerPixelY + radiusPixelsY));

            for (let py = minPy; py <= maxPy; py++) {
                for (let px = minPx; px <= maxPx; px++) {
                    const dx = (px - centerPixelX) / radiusPixelsX;
                    const dy = (py - centerPixelY) / radiusPixelsY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 1.0) continue; // Outside falloff radius

                    // Calculate mask intensity with cubic smoothstep falloff
                    const coreRadius = width * 0.5;
                    const coreRadiusNorm = coreRadius / radiusWorld;

                    let intensity: number;
                    if (dist < coreRadiusNorm) {
                        // Core region: full intensity
                        intensity = 1.0;
                    } else {
                        // Falloff region: cubic smoothstep
                        const falloffT = (dist - coreRadiusNorm) / (1.0 - coreRadiusNorm);
                        intensity = 1.0 - falloffT * falloffT * (3.0 - 2.0 * falloffT);
                    }

                    const idx = py * resolution + px;
                    const current = data[idx];
                    const newValue = Math.max(current, Math.floor(intensity * 255));
                    data[idx] = newValue;
                }
            }
        });
    });

    const texture = new THREE.DataTexture(data, resolution, resolution, THREE.RedFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
}

/**
 * Apply corridor contact grounding shader to terrain material.
 * Darkens terrain albedo under corridor footprint using multiplicative blend.
 * 
 * @param material - THREE.MeshStandardMaterial to modify
 * @param maskTexture - Corridor footprint mask texture
 * @param darkeningFactor - Multiplier for darkening (0.92 = 8% darker, default)
 */
export function applyCorridorContactGrounding(
    material: THREE.MeshStandardMaterial,
    maskTexture: THREE.DataTexture,
    darkeningFactor = 0.92
) {
    material.onBeforeCompile = (shader) => {
        // Add uniform for mask texture
        shader.uniforms.uCorridorMask = { value: maskTexture };
        shader.uniforms.uDarkeningFactor = { value: darkeningFactor };

        // Inject into fragment shader (before final color output)
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <dithering_fragment>",
            `
            #include <dithering_fragment>
            
            // Corridor contact grounding pass
            uniform sampler2D uCorridorMask;
            uniform float uDarkeningFactor;
            
            // Calculate UV from world position (assuming terrain centered at origin)
            vec2 terrainUV = vUv; // Use existing UV coordinates from geometry
            
            // Sample corridor mask
            float maskValue = texture2D(uCorridorMask, terrainUV).r;
            
            // Apply darkening with cubic falloff
            float darkening = mix(1.0, uDarkeningFactor, maskValue);
            gl_FragColor.rgb *= darkening;
            `
        );

        // Mark shader as needing recompilation
        material.needsUpdate = true;
    };
}
