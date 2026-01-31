export async function getLiveSensors() {
  return {
    vix: await get("/api/live/vix", 19.2),
    yieldCurve: await get("/api/live/curve", -0.42),
    macroDrift: await get("/api/live/macro", -0.28),
    regime: await get("/api/live/regime", "Neutral"),
  };
}

async function get(url, fallback) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.value;
  } catch {
    return fallback;
  }
}


