import { ObjectiveLens } from "./objectiveLensStore";
import { KPISet } from "./kpiSelector";

export function orderKPIs(lens: ObjectiveLens, k: KPISet) {
  switch (lens) {
    case "survival":
      return [
        { label: "Runway", value: k.runway, unit: "mo" },
        { label: "Risk", value: k.risk * 100, unit: "%" },
        { label: "ARR", value: k.arr, unit: "M" },
        { label: "Value", value: k.value },
      ];
    case "liquidity":
      return [
        { label: "Runway", value: k.runway, unit: "mo" },
        { label: "ARR", value: k.arr, unit: "M" },
        { label: "Risk", value: k.risk * 100, unit: "%" },
        { label: "Value", value: k.value },
      ];
    case "value":
    default:
      return [
        { label: "Value", value: k.value },
        { label: "ARR", value: k.arr, unit: "M" },
        { label: "Runway", value: k.runway, unit: "mo" },
        { label: "Risk", value: k.risk * 100, unit: "%" },
      ];
  }
}
