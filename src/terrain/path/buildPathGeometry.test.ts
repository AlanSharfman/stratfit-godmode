import { describe, expect, it } from "vitest";
import { buildPathGeometry } from "./buildPathGeometry";
import type { PathSpec } from "./PathContract";

describe("buildPathGeometry contract", () => {
  it("includes time anchoring + intervention hash proof", () => {
    const spec: PathSpec = {
      timeAxis: "MONTHS",
      timeStart: 0,
      timeEnd: 12,
      timePoints: 13,
      curvatureFrom: "riskIndex",
      envelopeFrom: "variance",
      shadingFrom: "riskIndex",
      interventionHash: "ABC123",
      explanation: {
        curvature: "Bends with riskIndex changes",
        envelope: "Width from varianceSeries",
        shading: "Color from riskIndex",
      },
    };

    const geom = buildPathGeometry(spec, {
      terrainSampler: () => 10,
      trajectoryXZ: [
        { x: 0, z: 0 },
        { x: 1, z: 1 },
      ],
      metrics: {
        riskIndexSeries: [0.2, 0.9],
        varianceSeries: [0.1, 0.3],
        confidenceSeries: [0.7, 0.6],
      },
    });

    expect(geom.proof.timeAxis).toBe("MONTHS");
    expect(geom.proof.interventionHash).toBe("ABC123");
    expect(geom.points.length).toBe(2);
    expect(geom.risk.length).toBe(2);
  });

  it("reacts to intervention hash changes (guardrail)", () => {
    const baseSpec = {
      timeAxis: "MONTHS",
      timeStart: 0,
      timeEnd: 12,
      timePoints: 13,
      curvatureFrom: "riskIndex",
      envelopeFrom: "variance",
      shadingFrom: "riskIndex",
      explanation: { curvature: "", envelope: "", shading: "" },
    } satisfies Omit<PathSpec, "interventionHash">;

    const a = buildPathGeometry(
      { ...baseSpec, interventionHash: "HASH_A" },
      {
        terrainSampler: () => 10,
        trajectoryXZ: [{ x: 0, z: 0 }],
        metrics: {
          riskIndexSeries: [0.2],
          varianceSeries: [0.1],
          confidenceSeries: [0.7],
        },
      }
    );

    const b = buildPathGeometry(
      { ...baseSpec, interventionHash: "HASH_B" },
      {
        terrainSampler: () => 10,
        trajectoryXZ: [{ x: 0, z: 0 }],
        metrics: {
          riskIndexSeries: [0.2],
          varianceSeries: [0.1],
          confidenceSeries: [0.7],
        },
      }
    );

    expect(a.proof.interventionHash).not.toBe(b.proof.interventionHash);
  });

  it("normalizes metrics to 0..1 range", () => {
    const spec: PathSpec = {
      timeAxis: "WEEKS",
      timeStart: 0,
      timeEnd: 52,
      timePoints: 53,
      curvatureFrom: "confidence",
      envelopeFrom: "variance",
      shadingFrom: "survivalPct",
      interventionHash: "NORM_TEST",
      explanation: { curvature: "", envelope: "", shading: "" },
    };

    const geom = buildPathGeometry(spec, {
      terrainSampler: () => 5,
      trajectoryXZ: [
        { x: 0, z: 0 },
        { x: 1, z: 1 },
        { x: 2, z: 2 },
      ],
      metrics: {
        riskIndexSeries: [100, 200, 300], // raw values
        varianceSeries: [10, 50, 30],
        confidenceSeries: [0.5, 0.5, 0.5], // constant
      },
    });

    // Risk should be normalized to 0..1
    expect(geom.risk[0]).toBe(0);
    expect(geom.risk[2]).toBe(1);

    // Constant confidence should normalize safely
    expect(geom.confidence.every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it("uses terrain sampler for Y coordinates", () => {
    const spec: PathSpec = {
      timeAxis: "MONTHS",
      timeStart: 0,
      timeEnd: 6,
      timePoints: 7,
      curvatureFrom: "riskIndex",
      envelopeFrom: "variance",
      shadingFrom: "riskIndex",
      interventionHash: "TERRAIN_TEST",
      explanation: { curvature: "", envelope: "", shading: "" },
    };

    // Terrain sampler returns x + z as height
    const geom = buildPathGeometry(spec, {
      terrainSampler: (x, z) => x + z,
      trajectoryXZ: [
        { x: 0, z: 0 },
        { x: 5, z: 3 },
        { x: 10, z: 2 },
      ],
      metrics: {
        riskIndexSeries: [0, 0, 0],
        varianceSeries: [0, 0, 0],
        confidenceSeries: [0, 0, 0],
      },
    });

    expect(geom.points[0].y).toBe(0); // 0 + 0
    expect(geom.points[1].y).toBe(8); // 5 + 3
    expect(geom.points[2].y).toBe(12); // 10 + 2
  });
});
