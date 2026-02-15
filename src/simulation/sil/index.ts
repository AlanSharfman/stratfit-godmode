export {
    useStrategicInputStore,
    getStrategicInputs,
} from "./strategicInputStore";

export {
    useSimulationBridge,
    getSimulationState,
    computeSimulationState,
    connectSimulationBridge,
} from "./simulationBridge";

export type { StrategicInputs, SimulationState } from "./silContracts";
export { DEFAULT_STRATEGIC_INPUTS, DEFAULT_SIMULATION_STATE } from "./silContracts";
