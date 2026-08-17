/** Minimal typing for the 3Dmol.js viewer returned by the CDN global. */
export interface ThreeDmolViewer {
    resize(): void;
    render(): void;
    removeAllModels(): void;
    addModel(data: string, format: string): void;
    setStyle(sel: unknown, style: Record<string, unknown>): void;
    zoomTo(): void;
    clear(): void;
}

/** Typing for the `window.$3Dmol` global loaded via CDN script tag. */
export interface ThreeDmolApi {
    createViewer(element: HTMLElement, config?: { backgroundColor?: string }): ThreeDmolViewer;
}
