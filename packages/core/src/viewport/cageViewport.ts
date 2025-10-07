import type { IViewport } from './viewport'
import type { ViewModel } from '../view/view'
import type { Size } from '../types/core'
import { frameRect } from '../actor/spritesheet'

/**
 * CageViewport
 * -------------
 * - The canvas (“cage”) PHYSICALLY moves to follow the actor.
 * - Logical size == current frame size * scale (no padding).
 * - World offset equals the cage's top-left (so renderer translates by -offset).
 *
 * This matches Strike’s current behavior used in your tests.
 */
export class CageViewport implements IViewport {
    private camX = 0
    private camY = 0

    updateFollow(view?: ViewModel): void {
        if (!view) { this.camX = 0; this.camY = 0; return }
        const { sw, sh } = frameRect(view.actor.sheet, view.actor.state.frame)
        const w = sw * view.scale
        const h = sh * view.scale
        // top-left world coords for the cage depending on anchor
        const topLeftX = view.anchor === 'center' ? (view.actor.state.x - w / 2) : view.actor.state.x
        const topLeftY = view.anchor === 'center' ? (view.actor.state.y - h / 2) : view.actor.state.y
        this.camX = topLeftX
        this.camY = topLeftY
    }

    getWorldOffset(): { x: number; y: number } {
        return { x: this.camX, y: this.camY }
    }

    getLogicalSize(view?: ViewModel): Size {
        if (!view) return [64, 64]
        const { sw, sh } = frameRect(view.actor.sheet, view.actor.state.frame)
        return [sw * view.scale, sh * view.scale]
    }

    /**
     * Position the canvas “cage” at the actor’s top-left (or centered).
     */
    placeCanvas(canvas: HTMLCanvasElement, view?: ViewModel): void {
        if (!view) return
        const [w, h] = this.getLogicalSize(view)
        const left = Math.round(this.camX)
        const top  = Math.round(this.camY)

        const parent = canvas.parentElement as HTMLElement | null
        if (parent) {
            const style = getComputedStyle(parent)
            if (style.position === 'static') parent.style.position = 'relative'
        }
        canvas.style.position = 'absolute'
        canvas.style.left = `${left}px`
        canvas.style.top  = `${top}px`

        // (Size is handled by renderer through getLogicalSize; no need to set here)
    }
}
