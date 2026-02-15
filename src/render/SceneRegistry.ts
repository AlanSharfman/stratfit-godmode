import { RenderView } from "./types";

const registry = new Map<string, RenderView>();

export function registerView(view: RenderView) {
    registry.set(view.id, view);
}

export function getView(id: string) {
    return registry.get(id);
}
