import type { IViewport } from './viewport'
import type { ViewModel } from '../view/view'
import type { Size } from '../types/core'
import { frameRect } from '../actor/spritesheet'

/**
 * CameraViewport
 * --------------
 * - The canvas stays PUT; only the world offset (camera) changes.
 * - Supports follow modes: 'center' | 'deadzone' | 'none'.
 * - Optional padding can inflate the logical size when not using a fixed/base size.
 *
 * You can pass a fixed/base size if your surface decides canvas size externally
 * (e.g., parent-mode). Otherwise, it can derive size from the followed view.
 */
export type FollowMode = 'center' | 'deadzone' | 'none'

export interface CameraViewportOptions {
    /**
     * Follow behavior. Default: 'center'.
     */
    follow?: FollowMode
    /**
     * Deadzone half-size [dx, dy] for 'deadzone' follow mode. Default: [0, 0].
     */
    deadzone?: [number, number]
    /**
     * Optional padding added around the derived logical size (if no base size).
     * Only used when deriving size from the view's current frame. Default: [0, 0].
     */
    padding?: [number, number]
    /**
     * Optional base (fixed) logical size. If provided, getLogicalSize() returns this.
     * You may also pass a function to recompute per-frame (e.g., parent client size).
     */
    baseSize?: Size | (() => Size)
}

export class CameraViewport implements IViewport {
    private follow: FollowMode
    private deadzone: [number, number]
    private padding: [number, number]
    private baseSize?: Size | (() => Size)

    private camX = 0
    private camY = 0

    constructor(opts: CameraViewportOptions = {}) {
        this.follow = opts.follow ?? 'center'
        this.deadzone = opts.deadzone ?? [0, 0]
        this.padding = opts.padding ?? [0, 0]
        this.baseSize = opts.baseSize
    }

    updateFollow(view?: ViewModel): void {
        if (!view) { this.camX = 0; this.camY = 0; return }

        // Compute sprite center (world) based on anchor/scale
        const { sw, sh } = frameRect(view.actor.sheet, view.actor.state.frame)
        const w = sw * view.scale
        const h = sh * view.scale
        const centerX = view.anchor === 'center' ? view.actor.state.x : view.actor.state.x + w / 2
        const centerY = view.anchor === 'center' ? view.actor.state.y : view.actor.state.y + h / 2

        const [vw, vh] = this.getLogicalSize(view)

        if (this.follow === 'none') {
            // camera origin stable; do nothing
            return
        }

        if (this.follow === 'center') {
            // keep actor centered
            this.camX = centerX - vw / 2
            this.camY = centerY - vh / 2
            return
        }

        // deadzone: move camera only when leaving central rect
        const [dzx, dzy] = this.deadzone
        // current viewport origin (top-left)
        let vx = this.camX
        let vy = this.camY
        const vCenterX = vx + vw / 2
        const vCenterY = vy + vh / 2

        if (centerX < vCenterX - dzx) vx -= (vCenterX - dzx) - centerX
        if (centerX > vCenterX + dzx) vx += centerX - (vCenterX + dzx)
        if (centerY < vCenterY - dzy) vy -= (vCenterY - dzy) - centerY
        if (centerY > vCenterY + dzy) vy += centerY - (vCenterY + dzy)

        this.camX = vx
        this.camY = vy
    }

    getWorldOffset(): { x: number; y: number } {
        return { x: this.camX, y: this.camY }
    }

    getLogicalSize(view?: ViewModel): Size {
        // If a base size is supplied (fixed or computed), prefer it.
        if (this.baseSize) {
            const s = typeof this.baseSize === 'function' ? this.baseSize() : this.baseSize
            return [s[0], s[1]]
        }
        // Fallback: derive from the current view + optional padding.
        if (!view) return [64, 64]
        const { sw, sh } = frameRect(view.actor.sheet, view.actor.state.frame)
        const w = sw * view.scale + this.padding[0] * 2
        const h = sh * view.scale + this.padding[1] * 2
        return [w, h]
    }
}
