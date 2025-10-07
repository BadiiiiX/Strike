import type { ViewId, DurationMs } from './core'

/**
 * Generic map of event names to their payload shapes.
 * Each key is an event name, each value is the payload object for that event.
 */
export interface EventMap {
    [event: string]: unknown
}

/**
 * Function signature for a strongly-typed event listener.
 */
export type Listener<Payload> = (payload: Payload) => void

/**
 * Return type for subscription helpers.
 * Call the function to unsubscribe.
 */
export type Unsubscribe = () => void

/**
 * Extracts a union of valid event names from an EventMap.
 */
export type EventKey<T extends EventMap> = Extract<keyof T, string>

/**
 * A minimal, strongly-typed event emitter contract.
 * This is an interface only (no implementation here).
 */
export interface IEventEmitter<T extends EventMap> {
    /**
     * Subscribe to an event. Returns an `Unsubscribe` function.
     */
    on<K extends EventKey<T>>(event: K, listener: Listener<T[K]>): Unsubscribe
    /**
     * Subscribe once; listener is removed after the first call.
     */
    once<K extends EventKey<T>>(event: K, listener: Listener<T[K]>): Unsubscribe
    /**
     * Remove a previously registered listener.
     */
    off<K extends EventKey<T>>(event: K, listener: Listener<T[K]>): void
    /**
     * Emit an event with the given payload.
     */
    emit<K extends EventKey<T>>(event: K, payload: T[K]): void
}

/* ========================================================================== */
/* Actor Events                                                               */
/* ========================================================================== */

/**
 * Events emitted by an Actor during its lifecycle and motion.
 * These are high-level signals meant for UI/gameplay hooks.
 */
export interface ActorEvents extends EventMap {
    /**
     * Actor started/resumed playback.
     */
    start: { time: number } // ms since actor creation or last reset

    /**
     * Actor paused playback.
     */
    pause: { time: number } // ms at the moment of pause

    /**
     * Actor stopped playback (and typically reset state).
     */
    stop: { time: number }

    /**
     * Actor restarted; `count` is the restart counter since creation.
     * Useful for “stop after N restarts/loops” logic.
     */
    restart: { count: number }

    /**
     * Actor advanced position.
     * `dx, dy` are the delta applied on this tick; `(x, y)` is the new absolute position.
     */
    move: { x: number; y: number; dx: number; dy: number }

    /**
     * Frame index changed.
     * `frame` is the new frame index; `prev` is the previous frame.
     */
    frame: { frame: number; prev: number }

    /**
     * Loop completed (for looping animations). `count` increments per completion.
     */
    loop: { count: number }

    /**
     * A scheduled action was added to a channel.
     * `name` is optional (named actions can be canceled by name).
     */
    'action:add': { channel: string; name?: string }

    /**
     * A scheduled action was canceled from a channel (by name or wholesale).
     */
    'action:cancel': { channel: string; name?: string }

    /**
     * Per-tick callback with delta time and accumulated time.
     * Use this for time-based effects tied to the actor.
     */
    tick: { dt: DurationMs; time: number }
}

/* ========================================================================== */
/* Surface Events                                                             */
/* ========================================================================== */

/**
 * Events emitted by the Surface (renderer/orchestrator) around views,
 * rendering, and runtime control.
 */
export interface SurfaceEvents extends EventMap {
    /**
     * Surface entered the running state (render loop active).
     */
    play: Record<string, never>

    /**
     * Surface paused (render loop stopped).
     */
    pause: Record<string, never>

    /**
     * Surface destroyed; resources should be considered released.
     */
    destroy: Record<string, never>

    /**
     * A view was added to the surface.
     */
    'view:add': { id: ViewId }

    /**
     * A view was removed from the surface.
     */
    'view:remove': { id: ViewId }

    /**
     * The followed view (for actor/camera modes) changed.
     * `viewId` may be undefined if no view is followed anymore.
     */
    'follow:change': { viewId?: ViewId }

    /**
     * The logical canvas size changed (CSS pixels, pre-DPR).
     */
    resize: { width: number; height: number }

    /**
     * End-of-frame render notification with delta time.
     * Useful for external stats/telemetry.
     */
    render: { dt: DurationMs }
}