import { PositionMarker } from "@/types/positionMarkers";

export const positionMarkers: PositionMarker[] = [
  {
    id: "liq",
    type: "liquidity",
    x: -40,
    z: -10,
    label: "Liquidity Node",
    description: "Current capital buffer"
  },
  {
    id: "runway",
    type: "runway",
    x: 20,
    z: -25,
    label: "Runway Cliff",
    description: "Forward cash horizon"
  },
  {
    id: "market",
    type: "market",
    x: 45,
    z: -5,
    label: "Market Beacon",
    description: "Demand environment"
  },
  {
    id: "drag",
    type: "drag",
    x: -10,
    z: 15,
    label: "Operational Drag",
    description: "Execution friction"
  }
];
