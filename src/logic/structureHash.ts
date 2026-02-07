import { FoundationData } from "../store/foundationStore";

export function generateStructureSeed(data: FoundationData): number {
  const raw = JSON.stringify(data);

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return Math.abs(hash);
}

