export function smoothHeightMap(data: number[], w: number, h: number, passes = 1) {
    let arr = data.slice();

    for (let p = 0; p < passes; p++) {
        const next = arr.slice();
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = y * w + x;
                next[i] =
                    (arr[i] +
                        arr[i - 1] +
                        arr[i + 1] +
                        arr[i - w] +
                        arr[i + w]) /
                    5;
            }
        }
        arr = next;
    }
    return arr;
}
