// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ThreeDmolApi } from './lib/types/3dmol';

declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    /** 3Dmol.js loaded via CDN script tag in app.html. */
    var $3Dmol: ThreeDmolApi;
}

export {};
