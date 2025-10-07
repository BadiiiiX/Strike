import type { SheetMeta, Size } from '../types/core'

/**
 * Computes the source rectangle (sx, sy, sw, sh) for a given frame index
 * inside a sprite sheet described by {@link SheetMeta}.
 *
 * Assumptions:
 * - Single row of `frames`.
 * - Optional uniform `margin` and horizontal `spacing` between frames.
 * - `imageSize` is used for inference/validation if present.
 *
 * @param meta  Sprite sheet metadata
 * @param frame Zero-based frame index (will be wrapped into [0..frames-1])
 */
export function frameRect(
    meta: SheetMeta,
    frame: number
): { sx: number; sy: number; sw: number; sh: number } {
    const frames = Math.max(1, meta.frames | 0)
    const spacing = meta.spacing ?? 0
    const margin  = meta.margin  ?? 0
    const [fw, fh] = ensureFrameSize(meta)

    // Normalize index into range [0..frames-1]
    const f = ((frame % frames) + frames) % frames

    const sx = margin + f * (fw + spacing)
    const sy = margin
    const sw = fw
    const sh = fh
    return { sx, sy, sw, sh }
}

/**
 * Ensures a valid frameSize exists on the meta.
 * If missing, tries to infer it from `imageSize` and `frames` (single row).
 * Throws if insufficient data is available.
 */
export function ensureFrameSize(meta: SheetMeta): Size {
    if (meta.frameSize && meta.frameSize[0] > 0 && meta.frameSize[1] > 0) {
        return meta.frameSize
    }
    if (!meta.imageSize) {
        throw new Error('[strike] sheet.frameSize missing and imageSize unavailable for inference')
    }
    const frames = Math.max(1, meta.frames | 0)
    const spacing = meta.spacing ?? 0
    const margin  = meta.margin  ?? 0
    const [imgW, imgH] = meta.imageSize

    const totalSpacing = spacing * Math.max(0, frames - 1)
    const usableW = imgW - margin * 2 - totalSpacing
    const fw = Math.floor(usableW / frames)
    const fh = imgH - margin * 2

    // Non-exact division → still return integer fw, but warn the caller.
    // (Leave responsibility to caller to adjust spacing/margin if needed.)
    if (fw * frames + totalSpacing + margin * 2 !== imgW) {
        // eslint-disable-next-line no-console
        console.warn('[strike] inferred frame width not exact; consider providing spacing/margin explicitly.', {
            imgW, frames, spacing, margin, inferredFW: fw
        })
    }

    meta.frameSize = [fw, fh]
    return meta.frameSize
}

/**
 * Returns the total frame count of a sheet (clamped to >= 1).
 */
export function totalFrames(meta: SheetMeta): number {
    return Math.max(1, meta.frames | 0)
}

/**
 * Convenience helper to infer a {@link SheetMeta} from raw image size.
 * Assumes a single-row sheet.
 */
export function inferSheetFromSize(
    imageW: number,
    imageH: number,
    frames: number,
    spacing = 0,
    margin = 0
): SheetMeta {
    const totalSpacing = spacing * Math.max(0, frames - 1)
    const usable = imageW - margin * 2 - totalSpacing
    const fw = Math.floor(usable / frames)
    const fh = imageH - margin * 2
    return {
        frameSize: [fw, fh],
        frames,
        spacing,
        margin,
        imageSize: [imageW, imageH]
    }
}

/**
 * Browser-only convenience helper to infer a {@link SheetMeta} from an HTMLImageElement.
 */
export function inferSheetFromImage(
    img: HTMLImageElement,
    frames: number,
    spacing = 0,
    margin = 0
): SheetMeta {
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    return inferSheetFromSize(w, h, frames, spacing, margin)
}