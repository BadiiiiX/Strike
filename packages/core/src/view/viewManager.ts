import type { ViewId } from '../types/core'
import type { ViewInit, ViewModel, ViewPatch } from './view'

/**
 * Maintains a collection of {@link ViewModel} with stable ids and
 * provides common operations (add/remove/update/sort/lookup).
 *
 * The ViewManager is deliberately state-only: it does not render.
 * Rendering is handled by the surface/renderer.
 */
export class ViewManager {
    private nextId: ViewId = 1
    private views: ViewModel[] = []
    private byId = new Map<ViewId, ViewModel>()

    /**
     * Add a new view to the collection and return it.
     */
    add(init: ViewInit): ViewModel {
        const view: ViewModel = {
            id: this.nextId++,
            actor: init.actor,
            sheet: init.sheet,
            z: init.z ?? 0,
            scale: init.scale ?? 1,
            anchor: init.anchor ?? 'topleft',
            flipX: !!init.flipX,
            flipY: !!init.flipY,
            visible: init.visible ?? true
        }
        this.views.push(view)
        this.byId.set(view.id, view)
        return view
    }

    /**
     * Remove a view (by instance or id). Returns true if removed.
     */
    remove(viewOrId: ViewModel | ViewId): boolean {
        const id = typeof viewOrId === 'number' ? viewOrId : viewOrId.id
        const idx = this.views.findIndex(v => v.id === id)
        if (idx < 0) return false
        this.views.splice(idx, 1)
        this.byId.delete(id)
        return true
    }

    /**
     * Get a view by id (undefined if not found).
     */
    get(id: ViewId): ViewModel | undefined {
        return this.byId.get(id)
    }

    /**
     * Immutable snapshot of the internal array (sorted or not).
     * Use `sortByZ()` first if you need z-ordering guarantees.
     */
    list(): readonly ViewModel[] {
        return this.views
    }

    /**
     * Number of views currently tracked.
     */
    count(): number {
        return this.views.length
    }

    /**
     * Update a view with a partial patch.
     */
    update(viewOrId: ViewModel | ViewId, patch: ViewPatch): ViewModel | undefined {
        const v = typeof viewOrId === 'number' ? this.byId.get(viewOrId) : viewOrId
        if (!v) return undefined
        if (patch.z !== undefined) v.z = patch.z
        if (patch.scale !== undefined) v.scale = patch.scale
        if (patch.anchor !== undefined) v.anchor = patch.anchor
        if (patch.flipX !== undefined) v.flipX = patch.flipX
        if (patch.flipY !== undefined) v.flipY = patch.flipY
        if (patch.visible !== undefined) v.visible = patch.visible
        if (patch.sheet !== undefined) v.sheet = patch.sheet
        return v
    }

    /**
     * Swap z-values for two views (in-place).
     */
    swapZ(a: ViewModel, b: ViewModel): void {
        const z = a.z
        a.z = b.z
        b.z = z
    }

    /**
     * Sort internal array by ascending z (stable-ish for equal z).
     * Returns the internal array for chaining/iteration convenience.
     */
    sortByZ(): ViewModel[] {
        // native sort is not strictly stable; this is usually fine for sprites.
        // If strict stability is required, we can decorate with original indices.
        this.views.sort((a, b) => a.z - b.z)
        return this.views
    }

    /**
     * Remove all views and reset the id counter.
     * (You may prefer `clearKeepIds()` if you want monotonically increasing ids.)
     */
    reset(): void {
        this.views.length = 0
        this.byId.clear()
        this.nextId = 1
    }

    /**
     * Remove all views but keep the id counter increasing.
     */
    clearKeepIds(): void {
        this.views.length = 0
        this.byId.clear()
    }

    /**
     * Iterate over current views (in insertion order unless you sorted).
     */
    forEach(cb: (v: ViewModel) => void): void {
        for (const v of this.views) cb(v)
    }
}
