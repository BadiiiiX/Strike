import type { Size } from '../types/core'
import type { ViewModel } from '../view/view'

/**
 * Abstract drawing backend used by the Surface.
 * Implementations (e.g. Canvas2D, WebGL) must fulfill this contract.
 */
export interface IRenderer {
    /** Backing canvas element. */
    readonly canvas: HTMLCanvasElement
    /** Primary drawing context (backend-specific). */
    readonly ctx: CanvasRenderingContext2D

    /**
     * Configure the logical canvas size (CSS pixels).
     * Implementations should apply devicePixelRatio internally.
     */
    setLogicalSize(size: Size): void

    /**
     * Clear the backbuffer.
     * Implementations should temporarily reset transforms so clearing
     * operates in device pixels, then restore state.
     */
    clear(background: string | 'transparent'): void

    /**
     * Begin a render pass with a world offset.
     * Typical behavior: save state then `translate(-offset.x, -offset.y)`.
     */
    begin(offset: { x: number; y: number }): void

    /**
     * Draw a single view (sprite instance).
     */
    draw(view: ViewModel): void

    /**
     * End the current render pass and restore state.
     */
    end(): void
}

/**
 * Optional renderer construction options.
 */
export interface Canvas2DRendererOptions {
    /** Enable/disable image smoothing. Default: true. */
    smoothing?: boolean
}
