import type { Anchor } from '../types/core'
import type { CreateSurfaceOptions, SurfaceMode } from '../types/options'
import type { Actor } from '../actor/actor'
import type { ViewModel, ViewInit, ViewPatch } from '../view/view'
import { ViewManager } from '../view/viewManager'
import { Canvas2DRenderer } from '../render/canvas2d'
import type { IRenderer } from '../render/renderer'
import type { IViewport } from '../viewport/viewport'
import { CageViewport } from '../viewport/cageViewport'
import { CameraViewport } from '../viewport/cameraViewport'
import type { SurfaceEvents } from '../types/events'
import { ensureFrameSize } from '../actor/spritesheet'
import { onTick } from '../timing/ticker'

/* ----------------------------------------------------------------------------
 * Minimal typed emitter (local to surface)
 * --------------------------------------------------------------------------*/
class MiniEmitter<T extends Record<string, any>> {
    private map = new Map<keyof T, Set<(p: any) => void>>()
    on<K extends keyof T>(event: K, fn: (payload: T[K]) => void): () => void {
        if (!this.map.has(event)) this.map.set(event, new Set())
        this.map.get(event)!.add(fn as any)
        return () => this.off(event, fn)
    }
    off<K extends keyof T>(event: K, fn: (payload: T[K]) => void): void {
        this.map.get(event)?.delete(fn as any)
    }
    emit<K extends keyof T>(event: K, payload: T[K]): void {
        const set = this.map.get(event)
        if (!set) return
        for (const fn of Array.from(set)) {
            try { (fn as any)(payload) } catch { /* keep going */ }
        }
    }
}

/* ----------------------------------------------------------------------------
 * Public Surface API
 * --------------------------------------------------------------------------*/
export interface Surface {
    /** Backing canvas (from renderer). */
    readonly canvas: HTMLCanvasElement
    /** 2D drawing context (from renderer). */
    readonly ctx: CanvasRenderingContext2D

    /** Add a new view (sprite instance) and return it. */
    add(params: {
        actor: Actor
        sheet: HTMLImageElement
        z?: number
        scale?: number
        anchor?: Anchor
        flipX?: boolean
        flipY?: boolean
        visible?: boolean
    }): ViewModel

    /** Remove a view (by instance). Returns true on success. */
    remove(view: ViewModel): boolean

    /** Update a view with a partial patch. */
    update(view: ViewModel, patch: ViewPatch): ViewModel | undefined

    /** Set which view is followed by the viewport (if applicable). */
    setFollow(view?: ViewModel): void

    /** Start the render loop (no-op if already running). */
    play(): void
    /** Pause the render loop. */
    pause(): void
    /** Destroy the surface: stop loop and release references. */
    destroy(): void

    /** Subscribe to surface events. */
    on<K extends keyof SurfaceEvents>(event: K, fn: (p: SurfaceEvents[K]) => void): () => void
    off<K extends keyof SurfaceEvents>(event: K, fn: (p: SurfaceEvents[K]) => void): void
}

/* ----------------------------------------------------------------------------
 * Mount helper
 * --------------------------------------------------------------------------*/
function resolveCanvas(mount: CreateSurfaceOptions['mount']): HTMLCanvasElement {
    if (typeof mount === 'string') {
        const el = document.querySelector(mount)
        if (!el) throw new Error(`[strike] mount not found: ${mount}`)
        if ((el as HTMLElement).tagName.toLowerCase() === 'canvas') {
            return el as HTMLCanvasElement
        }
        const canvas = document.createElement('canvas')
        ;(el as HTMLElement).appendChild(canvas)
        return canvas
    }
    if (mount instanceof HTMLCanvasElement) return mount
    const canvas = document.createElement('canvas')
    mount.appendChild(canvas)
    return canvas
}

/* ----------------------------------------------------------------------------
 * Viewport factory based on options
 * --------------------------------------------------------------------------*/
function createViewportFor(mode: SurfaceMode, opts: CreateSurfaceOptions): IViewport {
    if (mode === 'actor') {
        // Strategy defaults to 'cage' (canvas moves with actor, size == frame size)
        const strategy = (opts as any).strategy ?? 'cage'
        if (strategy === 'cage') return new CageViewport()
        // camera strategy
        const follow   = (opts as any).follow   ?? 'center'
        const deadzone = (opts as any).deadzone ?? [0, 0]
        const padding  = (opts as any).padding  ?? [0, 0]
        return new CameraViewport({ follow, deadzone, padding })
    }

    if (mode === 'parent') {
        // Camera viewport with baseSize computed from parent client box; no follow by default.
        const canvas = document.createElement('canvas') // temp only to capture closure
        const baseSize = () => {
            const parent = (canvas.parentElement ?? document.body) as HTMLElement
            const w = parent.clientWidth || 300
            const h = parent.clientHeight || 150
            return [w, h] as [number, number]
        }
        return new CameraViewport({ follow: 'none', baseSize })
    }

    // fixed mode: base size provided by options
    const w = (opts as any).width ?? 300
    const h = (opts as any).height ?? 150
    return new CameraViewport({ follow: 'none', baseSize: [w, h] })
}

/* ----------------------------------------------------------------------------
 * Surface factory
 * --------------------------------------------------------------------------*/
export function createSurface(options: CreateSurfaceOptions): Surface {
    const mode: SurfaceMode = options.mode ?? 'fixed'
    const canvas = resolveCanvas(options.mount)

    const renderer: IRenderer = new Canvas2DRenderer(canvas, { smoothing: options.smoothing })
    const viewport: IViewport = createViewportFor(mode, options)

    // If cage strategy is used later (actor mode), ensure parent is positioned to allow abs positioning.
    const ensureParentPositioned = () => {
        const parent = canvas.parentElement as HTMLElement | null
        if (!parent) return
        const style = getComputedStyle(parent)
        if (style.position === 'static') parent.style.position = 'relative'
    }
    ensureParentPositioned()

    const background = options.background ?? 'transparent'
    const views = new ViewManager()
    const ev = new MiniEmitter<SurfaceEvents>()

    let follow: ViewModel | undefined
    let unsubTick: (() => void) | null = null

    function resize() {
        const size = viewport.getLogicalSize(follow)
        renderer.setLogicalSize(size)
        ev.emit('resize', { width: size[0], height: size[1] })
    }

    function layout() {
        if (viewport.placeCanvas) viewport.placeCanvas(renderer.canvas, follow)
    }

    function frame(dt: number) {
        // Update viewport (camera/cage), size & layout
        viewport.updateFollow(follow)
        resize()
        layout()

        // Clear & draw
        renderer.clear(background)
        renderer.begin(viewport.getWorldOffset())
        views.sortByZ().forEach(v => renderer.draw(v))
        renderer.end()

        ev.emit('render', { dt })
    }

    function play() {
        if (unsubTick) return
        resize()
        layout()
        unsubTick = onTick((dt) => frame(dt))
        ev.emit('play', {})
    }

    function pause() {
        if (!unsubTick) return
        unsubTick()
        unsubTick = null
        ev.emit('pause', {})
    }

    function destroy() {
        pause()
        views.clearKeepIds()
        ev.emit('destroy', {})
    }

    // Public API
    const api: Surface = {
        canvas: renderer.canvas,
        ctx: renderer.ctx,

        add(params) {
            // Ensure actor.sheet has imageSize & frameSize if possible
            const imgW = params.sheet.naturalWidth || params.sheet.width
            const imgH = params.sheet.naturalHeight || params.sheet.height
            params.actor.sheet.imageSize ||= [imgW, imgH]
            // Best-effort frameSize inference (single row)
            try { ensureFrameSize(params.actor.sheet) } catch { /* imageSize may be missing earlier */ }

            const view = views.add({
                actor: params.actor,
                sheet: params.sheet,
                z: params.z,
                scale: params.scale,
                anchor: params.anchor,
                flipX: params.flipX,
                flipY: params.flipY,
                visible: params.visible
            })

            if (!follow) {
                follow = view
                ev.emit('follow:change', { viewId: follow.id })
            }

            // First layout pass reflecting new view
            resize()
            layout()

            ev.emit('view:add', { id: view.id })
            return view
        },

        remove(view) {
            const removed = views.remove(view)
            if (removed) {
                ev.emit('view:remove', { id: view.id })
                if (follow && follow.id === view.id) {
                    follow = views.list()[0]
                    ev.emit('follow:change', { viewId: follow?.id })
                }
            }
            return removed
        },

        update(view, patch) {
            const v = views.update(view, patch)
            if (v) { resize(); layout() }
            return v
        },

        setFollow(view) {
            follow = view
            ev.emit('follow:change', { viewId: follow?.id })
            resize()
            layout()
        },

        play, pause, destroy,

        on: (e, fn) => ev.on(e, fn),
        off: (e, fn) => ev.off(e, fn)
    }

    // Auto-start
    play()
    return api
}
