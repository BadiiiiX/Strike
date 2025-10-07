/**
 * Two-dimensional size expressed as [width, height] in CSS (logical) pixels.
 */
export type Size = [number, number]

/**
 * 2D point in world coordinates.
 */
export interface Point {
    /** X coordinate in pixels. */
    x: number
    /** Y coordinate in pixels. */
    y: number
}

/**
 * Axis-aligned rectangle in world coordinates.
 */
export interface Rect {
    /** Top-left X in pixels. */
    x: number
    /** Top-left Y in pixels. */
    y: number
    /** Width in pixels. */
    w: number
    /** Height in pixels. */
    h: number
}

/**
 * Render anchor for a view. Determines how (x,y) maps onto the sprite.
 * - 'topleft': (x,y) is the top-left corner of the sprite.
 * - 'center' : (x,y) is the geometric center of the sprite.
 */
export type Anchor = 'topleft' | 'center'

/**
 * Horizontal facing of an actor: 1 = normal, -1 = flipped horizontally.
 * This is a logical property; actual image flipping can also be handled per-view.
 */
export type Facing = 1 | -1

/** View unique identifier. */
export type ViewId = number
/** Z-index for draw ordering (lower first). */
export type ZIndex = number

/**
 * Metadata describing a sprite sheet (typically a single row of frames).
 * This metadata is used to compute the source rectangle for each frame.
 */
export interface SheetMeta {
    /**
     * Size of a single frame in pixels.
     * If omitted at creation, it may be inferred from `imageSize` and `frames`.
     */
    frameSize?: Size
    /**
     * Total number of frames in the row (required).
     */
    frames: number
    /**
     * Horizontal spacing between adjacent frames in pixels (default: 0).
     */
    spacing?: number
    /**
     * Symmetric outer margin (left/right and top/bottom) in pixels (default: 0).
     */
    margin?: number
    /**
     * Actual pixel dimensions of the underlying image.
     * This may be autofilled when the image is loaded.
     */
    imageSize?: Size
}

/**
 * Runtime state of an actor (position, animation frame, playback/bookkeeping).
 * The interpretation of (x,y) depends on the view's anchor.
 */
export interface ActorState {
    /** World X position in pixels. */
    x: number
    /** World Y position in pixels. */
    y: number
    /** Current frame index in [0 .. frames-1]. */
    frame: number
    /** Horizontal facing (1 normal, -1 flipped). */
    facing: Facing
    /** Whether the actor is currently playing (vs. paused). */
    playing: boolean
    /**
     * Accumulated time in milliseconds since the actor started (or since last reset).
     * Used by action channels/tickers for scheduling.
     */
    time: number
    /**
     * Number of completed loops for any looping animation logic.
     * Consumers may increment or reset this as needed for their use case.
     */
    loops: number
}

/**
 * Milliseconds duration type alias for semantic clarity.
 */
export type DurationMs = number
