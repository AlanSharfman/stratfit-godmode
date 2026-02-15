export function terrainResolution(distance: number) {
    if (distance < 200) return 180;
    if (distance < 400) return 120;
    if (distance < 800) return 80;
    return 48;
}
