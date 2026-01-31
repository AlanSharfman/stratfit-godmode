export async function getLiveSensors() {
  const sensors = {
    vix: await get("/api/live/vix", 19.2),
    yieldCurve: await get("/api/live/yield-curve", -0.42),
    macroDrift: await get("/api/live/macro-drift", -0.28),
    regime: await get("/api/live/regime", "Neutral"),
  };

  // If the proxy endpoints are not available, prefer the bundled fallback dataset.
  // (This keeps the static package deterministic offline.)
  const needsFallback =
    sensors.vix === 19.2 &&
    sensors.yieldCurve === -0.42 &&
    sensors.macroDrift === -0.28 &&
    sensors.regime === "Neutral";

  if (!needsFallback) return sensors;

  try {
    const res = await fetch("/data/sensor-mock.json");
    if (!res.ok) throw new Error("Bad fetch");
    const data = await res.json();
    return {
      vix: data.vix ?? sensors.vix,
      yieldCurve: data.yieldCurve ?? data.curve ?? sensors.yieldCurve,
      macroDrift: data.macroDrift ?? data.macro ?? sensors.macroDrift,
      regime: data.regime ?? sensors.regime,
    };
  } catch {
    return sensors;
  }
}

async function get(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Bad fetch");
    const data = await res.json();
    return data.value;
  } catch {
    return fallback;
  }
}


