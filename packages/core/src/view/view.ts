import type { Anchor, ViewId, ZIndex } from '../types/core'
import type { Actor } from '../actor/actor'

/**
 * Construction params for a view/sprite instance.
 * A view binds an {@link Actor} (state + sheet) to a renderable image.
 */
export interface ViewInit {
    /** Backing actor (position, frame, etc.). */
    actor: Actor
    /** Source image that contains the sprite sheet. */
    sheet: HTMLImageElement
    /** Draw order; lower z is drawn first (default: 0). */
    z?: ZIndex
    /** Render scale factor (default: 1). */
    scale?: number
    /** Anchor to interpret (x,y) — default: 'topleft'. */
    anchor?: Anchor
    /** Flip horizontally at draw time (default: false). */
    flipX?: boolean
    /** Flip vertically at draw time (default: false). */
    flipY?: boolean
    /** Whether this view is visible (default: true). */
    visible?: boolean
}

/**
 * A renderable sprite instance. Couples an {@link Actor} with a source sheet
 * and per-instance render flags (scale, anchor, flips, z, visibility).
 */
export interface ViewModel {
    /** Unique identifier assigned by the view manager. */
    id: ViewId
    /** Backing actor (mutable state owned by the actor). */
    actor: Actor
    /** Sprite sheet image used as the source for frames. */
    sheet: HTMLImageElement
    /** Draw order (ascending). */
    z: ZIndex
    /** Render scale factor. */
    scale: number
    /** Anchor for positioning. */
    anchor: Anchor
    /** Horizontal flip at draw time. */
    flipX: boolean
    /** Vertical flip at draw time. */
    flipY: boolean
    /** Visibility toggle. */
    visible: boolean
}

/**
 * Partial update bag for mutating an existing view.
 * Only provided fields are applied.
 */
export interface ViewPatch {
    z?: ZIndex
    scale?: number
    anchor?: Anchor
    flipX?: boolean
    flipY?: boolean
    visible?: boolean
    /** Replace the sheet image (rare; useful for runtime swaps). */
    sheet?: HTMLImageElement
}
