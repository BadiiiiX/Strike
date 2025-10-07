import type { Size } from '../types/core'
import type { ViewModel } from '../view/view'

/**
 * Viewport contract used by the Surface to:
 * - compute the logical canvas size (pre-DPR),
 * - compute the world offset to render (camera),
 * - optionally place the canvas element in the DOM (e.g., “cage” strategy).
 *
 * Implementations are free to keep internal state (e.g., camera position).
 */
export interface IViewport {
    /**
     * Update internal state to follow the given view for this frame.
     * Surface calls this once per frame before rendering.
     */
    updateFollow(view?: ViewModel): void

    /**
     * Logical canvas size in CSS pixels (pre-DPR).
     * The surface will pass this to the renderer each frame.
     */
    getLogicalSize(view?: ViewModel): Size

    /**
     * World-space offset (top-left) that should map to the canvas origin.
     * Typically (camX, camY). The renderer will translate by -offset.
     */
    getWorldOffset(): { x: number; y: number }

    /**
     * Optional: physically position the canvas in the DOM (absolute left/top).
     * Used by the “cage” strategy where the canvas moves with the actor.
     */
    placeCanvas?(canvas: HTMLCanvasElement, view?: ViewModel): void
}
