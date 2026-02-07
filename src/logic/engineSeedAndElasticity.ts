import { useFoundationStore } from "../store/foundationStore";
import { generateStructureSeed } from "./structureHash";
import { deriveElasticityFromFoundation } from "./foundationElasticity";

export function getBaselineSeedAndElasticity() {
  const { baseline } = useFoundationStore.getState();

  // If not locked yet, do NOT pretend we have structure.
  if (!baseline) {
    return {
      seed: 12345,
      elasticity: null as ReturnType<typeof deriveElasticityFromFoundation> | null,
    };
  }

  return {
    seed: generateStructureSeed(baseline),
    elasticity: deriveElasticityFromFoundation(baseline),
  };
}

