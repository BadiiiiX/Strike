import type { IRenderer, Canvas2DRendererOptions } from './renderer'
import type { Size } from '../types/core'
import type { ViewModel } from '../view/view'
import { frameRect } from '../actor/spritesheet'

/**
 * Canvas 2D implementation of the IRenderer.
 * Handles DPR, safe clears, and basic sprite drawing with anchor/flip/scale.
 */
export class Canvas2DRenderer implements IRenderer {
    public readonly canvas: HTMLCanvasElement
    public readonly ctx: CanvasRenderingContext2D

    private dpr = 1
    private smoothing: boolean

    constructor(canvas: HTMLCanvasElement, opts: Canvas2DRendererOptions = {}) {
        this.canvas = canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('[strike] CanvasRenderingContext2D unavailable')
        this.ctx = ctx
        this.smoothing = opts.smoothing ?? true
    }

    /** Current device pixel ratio used by this renderer. */
    get devicePixelRatio(): number { return this.dpr }

    setLogicalSize([w, h]: Size): void {
        const dpr = Math.max(1, (window as any).devicePixelRatio || 1)
        this.dpr = dpr
        // Backing store size (device px)
        this.canvas.width = Math.round(w * dpr)
        this.canvas.height = Math.round(h * dpr)
        // CSS size (logical px)
        this.canvas.style.width = `${w}px`
        this.canvas.style.height = `${h}px`
        // World transform = DPR
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        this.ctx.imageSmoothingEnabled = this.smoothing
    }

    clear(background: string | 'transparent'): void {
        const g = this.ctx
        g.save()
        // Clear in device px
        g.setTransform(1, 0, 0, 1, 0, 0)
        if (background === 'transparent') {
            g.clearRect(0, 0, this.canvas.width, this.canvas.height)
        } else {
            g.fillStyle = background
            g.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
        g.restore()
    }

    begin(offset: { x: number; y: number }): void {
        this.ctx.save()
        this.ctx.translate(-offset.x, -offset.y)
    }

    end(): void {
        this.ctx.restore()
    }

    draw(v: ViewModel): void {
        if (!v.visible) return
        const g = this.ctx
        const meta = v.actor.sheet
        const { sx, sy, sw, sh } = frameRect(meta, v.actor.state.frame)

        // Destination (world) position
        let dx = v.actor.state.x
        let dy = v.actor.state.y
        if (v.anchor === 'center') {
            dx -= (sw * v.scale) / 2
            dy -= (sh * v.scale) / 2
        }

        g.save()
        // Translate to the sprite center to apply flips around the middle
        g.translate(dx + (sw * v.scale) / 2, dy + (sh * v.scale) / 2)
        g.scale(v.flipX ? -1 : 1, v.flipY ? -1 : 1)
        g.translate(-(sw * v.scale) / 2, -(sh * v.scale) / 2)

        // Source → dest
        g.drawImage(v.sheet, sx, sy, sw, sh, 0, 0, sw * v.scale, sh * v.scale)
        g.restore()
    }
}
