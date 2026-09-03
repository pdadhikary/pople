/** Label style specification for 3Dmol.js `addLabel`. */
export interface LabelSpec {
    position: { x: number; y: number; z: number };
    fontSize?: number;
    fontColor?: string;
    showBackground?: boolean;
    backgroundColor?: string;
    inFront?: boolean;
    bold?: boolean;
    alignment?: string;
}

/** Minimal typing for the 3Dmol.js viewer returned by the CDN global. */
export interface ThreeDmolViewer {
    resize(): void;
    render(): void;
    removeAllModels(): void;
    addModel(data: string, format: string): void;
    setStyle(sel: unknown, style: Record<string, unknown>): void;
    zoomTo(): void;
    clear(): void;
    addLabel(text: string, style: LabelSpec): void;
    removeAllLabels(): void;
}

/** Typing for the `window.$3Dmol` global loaded via CDN script tag. */
export interface ThreeDmolApi {
    createViewer(element: HTMLElement, config?: { backgroundColor?: string }): ThreeDmolViewer;
}
