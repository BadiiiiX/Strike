// src/timing/ticker.ts

/**
 * A global, lightweight requestAnimationFrame (RAF) ticker.
 * Consumers subscribe with `onTick`, receive (dt, t) in milliseconds,
 * and can unsubscribe with the returned function.
 *
 * - Starts the RAF loop when the first listener subscribes.
 * - Stops the RAF loop automatically when the last listener unsubscribes.
 * - Clamps absurdly large dt (tab inactive, clock changes) to a max value.
 */
export type TickHandler = (dt: number, time: number) => void

/** Maximum delta time per frame (ms) to avoid huge simulation jumps. */
const MAX_DT = 100 /* ms ~ 10 FPS minimum */

let listeners = new Set<TickHandler>()
let rafId: number | null = null
let lastTs: number | null = null
let accTime = 0 // accumulated time since loop start (ms)

/** RAF loop body */
function loop(ts: number) {
    rafId = null

    if (lastTs == null) lastTs = ts
    let dt = ts - lastTs
    lastTs = ts

    // Convert to ms and clamp
    dt = Math.min(dt, MAX_DT)

    accTime += dt

    // Call listeners (copy to avoid reentrancy issues)
    if (listeners.size > 0) {
        const snapshot = Array.from(listeners)
        for (const fn of snapshot) {
            try { fn(dt, accTime) } catch (err) { /* swallow to keep loop alive */ }
        }
    }

    // Schedule next frame if still needed
    if (listeners.size > 0) {
        rafId = requestAnimationFrame(loop)
    } else {
        // no listeners → stop and reset timing
        lastTs = null
    }
}

/**
 * Subscribe to the global RAF ticker.
 * @param handler Callback receiving `dt` and `time` (both in ms).
 * @returns Unsubscribe function.
 */
export function onTick(handler: TickHandler): () => void {
    listeners.add(handler)

    // Start loop if not running
    if (rafId == null) {
        rafId = requestAnimationFrame(loop)
    }
    return () => {
        listeners.delete(handler)
        // Loop will stop automatically when no listeners remain.
    }
}

/**
 * Returns true if the shared ticker is currently running.
 */
export function isTicking(): boolean {
    return listeners.size > 0
}

/**
 * Force-stop the ticker immediately (rarely needed).
 * All listeners remain registered; they simply won't be called until a
 * new `requestAnimationFrame` is scheduled by adding/removing a listener.
 */
export function stopTicker(): void {
    if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
    }
    lastTs = null
}
