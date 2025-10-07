import type { ActorState, SheetMeta } from '../types/core'
import type { ActorEvents } from '../types/events'
import { ensureFrameSize, totalFrames } from './spritesheet'
import { ActionChannel, createActionChannel } from '../timing/actions'

/**
 * Minimal internal event emitter for Actor.
 * It is intentionally tiny; if you later add a shared emitter, you can replace this.
 */
class MiniEmitter<T extends Record<string, any>> {
    private map = new Map<keyof T, Set<(p: any) => void>>()
    on<K extends keyof T>(event: K, fn: (payload: T[K]) => void): () => void {
        if (!this.map.has(event)) this.map.set(event, new Set())
        this.map.get(event)!.add(fn as any)
        return () => this.off(event, fn)
    }
    off<K extends keyof T>(event: K, fn: (payload: T[K]) => void) {
        this.map.get(event)?.delete(fn as any)
    }
    emit<K extends keyof T>(event: K, payload: T[K]) {
        const set = this.map.get(event)
        if (!set) return
        for (const fn of Array.from(set)) {
            try { (fn as any)(payload) } catch { /* keep going */ }
        }
    }
}

/**
 * Public Actor API.
 * The actor owns animation state and exposes time-based channels for actions.
 * Rendering is handled by Views/Renderer; the actor only maintains state.
 */
export interface Actor {
    /** Current animation/state (mutable but controlled via methods). */
    readonly state: ActorState

    /** Current sprite sheet metadata (frame layout, spacing, margins…). */
    readonly sheet: SheetMeta

    /** Replace or partially update the sheet metadata. */
    setSheet(next: Partial<SheetMeta>): void

    /** Set absolute position. */
    setPos(x: number, y: number): void
    /** Increment position. */
    addPos(dx: number, dy: number): void

    /** Jump to an absolute frame index (wrapped to [0..frames-1]). */
    setFrame(index: number): void
    /** Advance by +1 frame (wrapped). */
    nextFrame(): void
    /** Go back by -1 frame (wrapped). */
    prevFrame(): void

    /** Start/resume this actor's local scheduler (all channels). */
    start(): void
    /** Pause this actor's local scheduler (keeps scheduled actions). */
    pause(): void
    /** Stop playback and reset timers (also emits 'stop'). */
    stop(): void

    /** Create or get a named action channel (time-based scheduling). */
    channel(name: string): ActionChannel

    /** Event subscriptions. */
    on<K extends keyof ActorEvents>(event: K, fn: (p: ActorEvents[K]) => void): () => void
    off<K extends keyof ActorEvents>(event: K, fn: (p: ActorEvents[K]) => void): void
}

/**
 * Create a new Actor.
 * @param initial
 */
export function createActor(
    initial: {
        sheet: SheetMeta
        x?: number
        y?: number
        frame?: number
        facing?: 1 | -1
    }
): Actor {
    // --- State ----------------------------------------------------------------
    const state: ActorState = {
        x: initial.x ?? 0,
        y: initial.y ?? 0,
        frame: initial.frame ?? 0,
        facing: initial.facing ?? 1,
        playing: true,
        time: 0,
        loops: 0
    }

    // Copy sheet shallowly (actor owns a mutable copy)
    const sheet: SheetMeta = { ...initial.sheet }

    // Event emitter
    const ev = new MiniEmitter<ActorEvents>()

    // Channels (per-actor schedulers, keyed by channel name)
    const channels = new Map<string, ActionChannel>()

    function getOrCreateChannel(name: string): ActionChannel {
        let ch = channels.get(name)
        if (!ch) {
            ch = createActionChannel()
            channels.set(name, ch)
        }
        return ch
    }

    // --- Methods --------------------------------------------------------------
    function setSheet(next: Partial<SheetMeta>) {
        Object.assign(sheet, next)
        // Validate/infer frame size if possible
        try { ensureFrameSize(sheet) } catch { /* ignore until imageSize known */ }
    }

    function setPos(x: number, y: number) {
        const dx = x - state.x
        const dy = y - state.y
        state.x = x; state.y = y
        ev.emit('move', { x: state.x, y: state.y, dx, dy })
    }

    function addPos(dx: number, dy: number) {
        state.x += dx; state.y += dy
        ev.emit('move', { x: state.x, y: state.y, dx, dy })
    }

    function setFrame(index: number) {
        const total = totalFrames(sheet)
        const prev = state.frame
        // wrap
        const f = ((index % total) + total) % total
        state.frame = f
        if (f !== prev) ev.emit('frame', { frame: f, prev })
    }

    function nextFrame() {
        setFrame(state.frame + 1)
        if (state.frame === 0) {
            state.loops += 1
            ev.emit('loop', { count: state.loops })
        }
    }

    function prevFrame() {
        setFrame(state.frame - 1)
    }

    function start() {
        if (state.playing) return
        state.playing = true
        // Resume all channels
        for (const ch of channels.values()) if (!ch.isRunning()) ch.start()
        ev.emit('start', { time: state.time })
    }

    function pause() {
        if (!state.playing) return
        state.playing = false
        for (const ch of channels.values()) if (ch.isRunning()) ch.stop()
        ev.emit('pause', { time: state.time })
    }

    function stop() {
        state.playing = false
        state.time = 0
        for (const ch of channels.values()) ch.stop()
        ev.emit('stop', { time: state.time })
    }

    function channel(name: string): ActionChannel {
        const ch = getOrCreateChannel(name)
        // Ensure the channel follows the actor play/pause state
        if (state.playing && !ch.isRunning()) ch.start()
        return ch
    }

    // Optionally, wire a small per-actor tick to track `state.time` and emit `tick`.
    // We do NOT auto-create a channel to avoid overhead until the user needs it.
    // Provide a helper channel "time" the first time someone asks for it:
    const timeChannelName = '__time'
    function ensureTimeChannel() {
        if (channels.has(timeChannelName)) return
        const ch = createActionChannel()
        ch.every(0, () => { /* run every RAF frame */
            // dt/time come via ticker step → we cannot access dt directly here,
            // but we can accumulate time via a secondary callback if needed.
            // For now, we simply mark that time progresses (external systems can update).
        }, { name: 'raf', catchUp: true })
        if (state.playing) ch.start()
        channels.set(timeChannelName, ch)
    }
    // Expose a simple way for external systems to report time (optional):
    function _advanceTime(dtMs: number) {
        state.time += dtMs
        ev.emit('tick', { dt: dtMs, time: state.time })
    }

    // Public API object
    const api: Actor = {
        state,
        get sheet() { return sheet },
        setSheet,
        setPos, addPos,
        setFrame, nextFrame, prevFrame,
        start, pause, stop,
        channel,
        on: (e, fn) => ev.on(e, fn),
        off: (e, fn) => ev.off(e, fn)
    }

    // Try to validate frame size once on creation (best-effort)
    try { ensureFrameSize(sheet) } catch {  }

    // Consumers (Surface) can call this internal helper each frame if they want to
    // propagate dt for Actor's bookkeeping (time/tick event). It is optional.
    (api as any)._advanceTime = _advanceTime

    return api
}

export { frameRect } from './spritesheet'
export type { SheetMeta } from '../types/core'