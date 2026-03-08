import { useEffect } from "react";
import { diag } from "./DiagnosticsStore";

const TERRAIN_ERROR_RE = /terrain|webgl|three|shader|canvas/i;
const AI_URL_RE = /api\.openai\.com|\/v1\/responses|\/audio\/speech/i;

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if ("url" in input) return input.url;
  return String(input);
}

export default function RuntimeDiagnosticsBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onContextLost = (event: Event) => {
      const target = event.target instanceof HTMLCanvasElement ? "canvas" : "unknown";
      diag("warn", "graphics:context-lost", "WebGL context lost", { target });
      diag("error", "terrain:failure", "Terrain rendering lost its graphics context", { target });
    };

    const onContextRestored = () => {
      diag("info", "graphics:context-restored", "WebGL context restored");
    };

    const onWindowError = (event: ErrorEvent) => {
      const text = [event.message, event.filename, event.error?.stack].filter(Boolean).join(" ");
      if (TERRAIN_ERROR_RE.test(text)) {
        diag("error", "terrain:failure", event.message || "Terrain/runtime error", {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const url = getUrl(args[0]);
      const method = args[1]?.method ?? (typeof args[0] !== "string" && "method" in args[0] ? args[0].method : "GET");
      const isAiRequest = AI_URL_RE.test(url);

      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          diag("error", isAiRequest ? "ai:failure" : "network:failure", `${method} ${url} failed`, {
            status: response.status,
            statusText: response.statusText,
          });
        }
        return response;
      } catch (error) {
        diag("error", isAiRequest ? "ai:failure" : "network:failure", `${method} ${url} threw`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    window.addEventListener("webglcontextlost", onContextLost, true);
    window.addEventListener("webglcontextrestored", onContextRestored, true);
    window.addEventListener("error", onWindowError);
    diag("info", "runtime", "Runtime diagnostics bridge mounted");

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("webglcontextlost", onContextLost, true);
      window.removeEventListener("webglcontextrestored", onContextRestored, true);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}
