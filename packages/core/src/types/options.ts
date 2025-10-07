import type { Size } from './core'

/**
 * Target where the rendering surface (<canvas>) will be mounted.
 * - string: CSS selector
 * - HTMLElement: container element (a <canvas> will be appended)
 * - HTMLCanvasElement: use the given canvas directly
 */
export type MountTarget = string | HTMLElement | HTMLCanvasElement

/**
 * High-level rendering mode for the surface.
 * - 'fixed'  : fixed logical size (independent of parent or actor)
 * - 'actor'  : viewport tied to a followed view/actor
 * - 'parent' : match the parent element's content box size
 */
export type SurfaceMode = 'fixed' | 'actor' | 'parent'

/**
 * Common options shared by all surface modes.
 */
export interface BaseSurfaceOptions {
    /**
     * Where to mount (or which canvas to use).
     */
    mount: MountTarget

    /**
     * Background clear color; use 'transparent' for alpha clearing.
     * Default: 'transparent'
     */
    background?: string | 'transparent'

    /**
     * Enable/disable image smoothing for Canvas2D.
     * Default: true
     */
    smoothing?: boolean
}

/* ========================================================================== */
/* Discriminated mode option bags                                             */
/* ========================================================================== */

/**
 * Options for 'fixed' mode: the canvas has a fixed logical size.
 * Device pixel ratio is applied internally; CSS size equals [width,height].
 */
export interface FixedSurfaceOptions {
    mode: 'fixed'
    /** Logical width in CSS pixels. */
    width: number
    /** Logical height in CSS pixels. */
    height: number
}

/**
 * Strategy for actor mode.
 * - 'cage'   : the canvas (“cage”) physically moves to follow the actor and
 *              its logical size equals the sprite frame size * scale (no padding).
 * - 'camera' : (optional strategy) the canvas stays put and the world is panned
 *              internally; supports follow behaviors such as center or deadzone.
 */
export type ActorStrategy = 'cage' | 'camera'

/**
 * Follow behavior when using the 'camera' strategy.
 * - 'center'   : keep the actor centered
 * - 'deadzone' : only pan when the actor exits a central dead zone
 * - 'none'     : no automatic panning
 */
export type FollowMode = 'center' | 'deadzone' | 'none'

/**
 * Options for 'actor' mode.
 * By default, `strategy` is 'cage' to match the current Strike behavior:
 * the canvas moves with the actor and has exactly the sprite frame size.
 *
 * Notes:
 * - For 'cage', `padding` is ignored and the size is strictly the frame size * scale.
 * - For 'camera', `follow`, `deadzone`, and optional `padding` apply.
 */
export interface ActorSurfaceOptions {
    mode: 'actor'

    /**
     * Actor-following strategy. Default: 'cage'.
     */
    strategy?: ActorStrategy

    /**
     * Follow behavior (only meaningful for strategy 'camera').
     * Default: 'center'
     */
    follow?: FollowMode

    /**
     * Half-size dead zone [dx, dy] in CSS pixels for 'camera' + 'deadzone'.
     * The camera pans only when the actor leaves this zone.
     * Default: [0, 0]
     */
    deadzone?: [number, number]

    /**
     * Optional extra padding [pxX, pxY] added to the computed logical size
     * (only meaningful for 'camera' strategy). Default: [0, 0]
     */
    padding?: [number, number]
}

/**
 * Options for 'parent' mode: the canvas takes the size of its parent element.
 * Optionally observe parent resizes with ResizeObserver.
 */
export interface ParentSurfaceOptions {
    mode: 'parent'
    /**
     * Whether to observe parent size changes and resize the canvas accordingly.
     * Default: true
     */
    observe?: boolean
}

/* ========================================================================== */
/* Final union: create-surface options                                        */
/* ========================================================================== */

/**
 * Unified options for creating a surface.
 * Use one of the discriminated mode bags together with the base options.
 *
 * Examples:
 * ```ts
 * // fixed:
 * const s = createSurface({ mount: '#stage', mode: 'fixed', width: 320, height: 180 })
 *
 * // actor (cage):
 * const s = createSurface({ mount: '#stage', mode: 'actor' }) // strategy defaults to 'cage'
 *
 * // actor (camera + deadzone):
 * const s = createSurface({
 *   mount: '#stage',
 *   mode: 'actor',
 *   strategy: 'camera',
 *   follow: 'deadzone',
 *   deadzone: [48, 32],
 *   padding: [8, 8]
 * })
 *
 * // parent:
 * const s = createSurface({ mount: '#stage', mode: 'parent', observe: true })
 * ```
 */
export type CreateSurfaceOptions =
    | (BaseSurfaceOptions & FixedSurfaceOptions)
    | (BaseSurfaceOptions & ActorSurfaceOptions)
    | (BaseSurfaceOptions & ParentSurfaceOptions)

/* ========================================================================== */
/* Renderer options (optional helper types)                                   */
/* ========================================================================== */

/**
 * Options specific to the Canvas2D renderer implementation.
 * Typically supplied internally by the surface based on `BaseSurfaceOptions`.
 */
export interface Canvas2DRendererOptions {
    /** Enable or disable `imageSmoothingEnabled`. */
    smoothing?: boolean
}

/**
 * Logical size pair for convenience when a function wants a return type
 * that can be either a tuple or an object shape.
 */
export interface LogicalSize {
    width: number
    height: number
}