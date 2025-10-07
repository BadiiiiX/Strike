/**
 * Options for robust image loading in the browser.
 */
export interface LoadImageOptions {
    /**
     * Set cross-origin for CORS-enabled reading from canvas (e.g., toDataURL/getImageData).
     * Must be set BEFORE assigning src.
     */
    crossOrigin?: '' | 'anonymous' | 'use-credentials'
    /**
     * Optional referrer policy (e.g., 'no-referrer').
     */
    referrerPolicy?: ReferrerPolicy
    /**
     * Bail out if the image hasn't loaded within this timeout (ms).
     */
    timeoutMs?: number
    /**
     * Optional abort signal to cancel loading.
     */
    signal?: AbortSignal
}

/**
 * Load an image element and return a resolved `HTMLImageElement` when ready.
 * Rejects on error/timeout/abort and guards against empty (0×0) images.
 *
 * @example
 * const img = await loadImage('/cat.png', { crossOrigin: 'anonymous', timeoutMs: 8000 })
 */
export function loadImage(src: string, opts: LoadImageOptions = {}): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        if (opts.crossOrigin !== undefined) img.crossOrigin = opts.crossOrigin
        if (opts.referrerPolicy) (img as any).referrerPolicy = opts.referrerPolicy
        img.decoding = 'async'
        ;(img as any).loading = 'eager'

        let timer: number | null = null
        const cleanup = () => {
            img.onload = null
            img.onerror = null
            img.onabort = null
            if (timer != null) { clearTimeout(timer); timer = null }
        }

        if (opts.timeoutMs && opts.timeoutMs > 0) {
            timer = window.setTimeout(() => {
                cleanup()
                reject(new Error(`Image load timeout after ${opts.timeoutMs}ms: ${src}`))
            }, opts.timeoutMs)
        }

        if (opts.signal) {
            if (opts.signal.aborted) return reject(new Error('Image load aborted'))
            opts.signal.addEventListener('abort', () => {
                cleanup()
                reject(new Error('Image load aborted'))
            }, { once: true })
        }

        img.onload = () => {
            cleanup()
            // Ensure we got valid pixel data
            const w = img.naturalWidth || img.width
            const h = img.naturalHeight || img.height
            if (w === 0 || h === 0) reject(new Error(`Image loaded but empty: ${src}`))
            else resolve(img)
        }

        img.onerror = () => { cleanup(); reject(new Error(`Failed to load image: ${src}`)) }
        img.onabort  = () => { cleanup(); reject(new Error('Image load aborted')) }

        img.src = src

        // Fast path: already cached by the browser
        if (img.complete && (img.naturalWidth || img.width) > 0) {
            cleanup()
            resolve(img)
        }
    })
}
