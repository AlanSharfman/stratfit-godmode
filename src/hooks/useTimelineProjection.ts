import { useCallback } from 'react';
import * as THREE from 'three';

export interface ProjectedPoint {
  x: number;
  y: number;
  label: string;
}

export function useTimelineProjection() {
  const projectToScreen = useCallback(
    (
      points: THREE.Vector3[],
      labels: string[],
      camera: THREE.Camera,
      canvasWidth: number,
      canvasHeight: number
    ): ProjectedPoint[] => {
      return points.map((point, i) => {
        const projected = point.clone().project(camera);
        const x = (projected.x * canvasWidth) / 2 + canvasWidth / 2;
        const y = (projected.y * canvasHeight) / -2 + canvasHeight / 2;

        return {
          x,
          y,
          label: labels[i] || '',
        };
      });
    },
    []
  );

  return { projectToScreen };
}

export default useTimelineProjection;