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
    /** Pixel offset of the label from its position. */
    screenOffset?: { x: number; y: number };
}

/** An atom clicked in the viewer. XYZ-parsed atoms carry a 0-based `serial`. */
export interface ClickableAtom {
    serial?: number;
    [key: string]: unknown;
}

/** Line style specification for 3Dmol.js `addLine`. */
export interface LineSpec {
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
    color?: string;
    dashed?: boolean;
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
    setClickable(
        sel: unknown,
        clickable: boolean,
        callback: (
            atom: ClickableAtom,
            viewer: ThreeDmolViewer,
            event: unknown,
            container: unknown
        ) => void
    ): void;
    addLine(spec: LineSpec): void;
    removeAllShapes(): void;
}

/** Typing for the `window.$3Dmol` global loaded via CDN script tag. */
export interface ThreeDmolApi {
    createViewer(element: HTMLElement, config?: { backgroundColor?: string }): ThreeDmolViewer;
}
