export type RenderProfile =
  | "full3d"
  | "reduced3d"
  | "fallback2d"

export interface GraphicsCapabilities {
  webglSupported: boolean
  deviceMemory: number | null
  hardwareConcurrency: number | null
  rendererPresent: boolean
}

function getWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext | WebGL2RenderingContext | null {
  return (
    canvas.getContext("webgl2") ||
    canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")
  ) as WebGLRenderingContext | WebGL2RenderingContext | null
}

export function detectGraphicsCapabilities(): GraphicsCapabilities {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      webglSupported: false,
      deviceMemory: null,
      hardwareConcurrency: null,
      rendererPresent: false,
    }
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number
  }

  const canvas = document.createElement("canvas")
  const gl = getWebGLContext(canvas)

  let rendererPresent = false
  if (gl) {
    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER)
      rendererPresent = typeof renderer === "string" && renderer.trim().length > 0
    } catch {
      rendererPresent = false
    }
  }

  return {
    webglSupported: !!gl,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    hardwareConcurrency: typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null,
    rendererPresent,
  }
}

export default detectGraphicsCapabilities
