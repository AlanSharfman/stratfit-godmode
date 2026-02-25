import { useCallback, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "ready" | "error";

export function useDemoRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const start = useCallback(() => {
    try {
      setError(null);

      const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) throw new Error("No canvas found to record.");

      const stream = canvas.captureStream(60);

      chunksRef.current = [];
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }

      const mime =
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

      const rec = new MediaRecorder(stream, { mimeType: mime });

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setState("ready");
      };

      rec.onerror = () => {
        setState("error");
        setError("Recording failed.");
      };

      recorderRef.current = rec;
      rec.start();
      setState("recording");
    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : "Recording failed.");
    }
  }, [blobUrl]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    } finally {
      recorderRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setError(null);
    setState("idle");
  }, [blobUrl]);

  return { state, error, blobUrl, start, stop, reset };
}
