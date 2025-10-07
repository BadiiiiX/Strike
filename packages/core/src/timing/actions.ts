// src/timing/actions.ts
import { onTick, type TickHandler } from './ticker'

/**
 * Simple action scheduler built on top of the global RAF ticker.
 * An ActionChannel lets you schedule periodic or one-shot callbacks,
 * start/stop them, and cancel by name.
 *
 * Usage:
 *   const ch = new ActionChannel()
 *     .every(200, () => actor.nextFrame(), { name: 'frameTick' })
 *     .start()
 *
 *   ch.cancel('frameTick')    // cancel by name
 *   ch.stop()                 // pause channel
 *   ch.start()                // resume
 */

export interface EveryOptions {
    /** Optional name; actions with a name can be canceled via `cancel(name)` */
    name?: string
    /**
     * Fire once immediately before the first interval elapses.
     * Default: false
     */
    immediate?: boolean
    /**
     * If true, when `elapsed` exceeds a multiple of the interval, the action
     * will run multiple times to "catch up". Default: true.
     */
    catchUp?: boolean
}

export interface OnceOptions {
    /** Optional name; can be canceled via `cancel(name)` before it fires. */
    name?: string
}

type PeriodicAction = {
    kind: 'every'
    name?: string
    interval: number
    elapsed: number
    fn: () => void
    catchUp: boolean
}

type OnceAction = {
    kind: 'once'
    name?: string
    delay: number
    elapsed: number
    fn: () => void
}

type Scheduled = PeriodicAction | OnceAction

export class ActionChannel {
    private actions: Scheduled[] = []
    private unsub: (() => void) | null = null
    private running = false

    /**
     * Schedule a periodic action.
     * @param interval Interval in milliseconds.
     * @param fn       Callback to execute.
     * @param opts     Optional behavior flags (name, immediate, catchUp).
     */
    every(interval: number, fn: () => void, opts: EveryOptions = {}): this {
        const item: PeriodicAction = {
            kind: 'every',
            name: opts.name,
            interval: Math.max(0, interval | 0),
            elapsed: 0,
            fn,
            catchUp: opts.catchUp ?? true
        }
        this.actions.push(item)

        if (opts.immediate) {
            try { fn() } catch {}
        }
        return this
    }

    /**
     * Schedule a one-shot action after `delay` ms.
     * @param delay Delay in milliseconds.
     * @param fn    Callback to execute once.
     * @param opts  Optional { name } for cancelation.
     */
    once(delay: number, fn: () => void, opts: OnceOptions = {}): this {
        const item: OnceAction = {
            kind: 'once',
            name: opts.name,
            delay: Math.max(0, delay | 0),
            elapsed: 0,
            fn
        }
        this.actions.push(item)
        return this
    }

    /**
     * Start (or resume) the channel. Subscribes to the global RAF ticker.
     */
    start(): this {
        if (this.running) return this
        this.running = true
        const tick: TickHandler = (dt) => this.step(dt)
        this.unsub = onTick(tick)
        return this
    }

    /**
     * Stop the channel (pause all actions). Keeps scheduled actions intact.
     */
    stop(): this {
        if (!this.running) return this
        this.running = false
        this.unsub?.()
        this.unsub = null
        return this
    }

    /**
     * Cancel actions. If a name is provided, cancels only matching actions.
     * If omitted, cancels all actions in the channel.
     */
    cancel(name?: string): this {
        if (name) {
            this.actions = this.actions.filter(a => a.name !== name)
        } else {
            this.actions = []
        }
        return this
    }

    /**
     * True if the channel is currently subscribed to the ticker.
     */
    isRunning(): boolean {
        return this.running
    }

    /**
     * Advance internal timers and execute due actions.
     * You normally don't call this directly; it's driven by RAF via `start()`.
     */
    step(dt: number): void {
        if (!this.running || this.actions.length === 0) return

        // We may mutate the array (remove fired "once"), so iterate over a copy.
        const items = this.actions.slice()
        for (const a of items) {
            a.elapsed += dt

            if (a.kind === 'every') {
                if (a.interval <= 0) {
                    // Edge case: 0 interval -> run every frame
                    try { a.fn() } catch {}
                    continue
                }

                if (a.elapsed >= a.interval) {
                    if (a.catchUp) {
                        // Fire as many times as intervals elapsed
                        let n = Math.floor(a.elapsed / a.interval)
                        a.elapsed -= n * a.interval
                        while (n-- > 0) { try { a.fn() } catch {} }
                    } else {
                        // Fire once, keep leftover elapsed time
                        a.elapsed -= a.interval
                        try { a.fn() } catch {}
                    }
                }
            } else {
                // once
                if (a.elapsed >= a.delay) {
                    try { a.fn() } catch {}
                    // remove this once-action
                    const idx = this.actions.indexOf(a)
                    if (idx >= 0) this.actions.splice(idx, 1)
                }
            }
        }
    }

    /**
     * Remove all scheduled actions and stop the channel.
     */
    destroy(): void {
        this.stop()
        this.actions = []
    }
}

/**
 * Convenience factory if you prefer a functional style:
 *   const channel = createActionChannel()
 */
export function createActionChannel(): ActionChannel {
    return new ActionChannel()
}
