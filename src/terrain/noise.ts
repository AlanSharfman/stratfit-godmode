export function noise2D(x: number, y: number, seed: number) {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 101.3) * 43758.5453123;
    return s - Math.floor(s);
}
