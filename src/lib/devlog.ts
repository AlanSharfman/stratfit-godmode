export const __DEV__ =
    typeof import.meta !== "undefined" &&
    typeof import.meta.env !== "undefined" &&
    !!import.meta.env.DEV;

export function devlog(...args: any[]) {
    if (__DEV__) console.log(...args);
}

export function deverr(...args: any[]) {
    if (__DEV__) console.error(...args);
}

export function devwarn(...args: any[]) {
    if (__DEV__) console.warn(...args);
}
