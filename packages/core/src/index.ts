// src/index.ts

/**
 * Strike — lightweight sprite/viewport runtime.
 * Public entry: re-exports types and main factories.
 *
 * Tree-shake friendly: only import what you need, e.g.
 *   import { createSurface, createActor, loadImage } from '@badiiix/strike-core'
 */

/* ---------------------------------- Types --------------------------------- */
export * from './types/core'
export * from './types/events'
export * from './types/options'

/* --------------------------------- Timing --------------------------------- */
export { onTick, isTicking, stopTicker } from './timing/ticker'
export {
    ActionChannel,
    createActionChannel,
    type EveryOptions,
    type OnceOptions
} from './timing/actions'

/* ---------------------------------- Actor --------------------------------- */
export {
    createActor,
    type Actor
} from './actor/actor'
export {
    frameRect,
    ensureFrameSize,
    totalFrames,
    inferSheetFromSize,
    inferSheetFromImage
} from './actor/spritesheet'

/* --------------------------------- Render --------------------------------- */
export {
    Canvas2DRenderer
} from './render/canvas2d'
export {
    type IRenderer,
    type Canvas2DRendererOptions
} from './render/renderer'
export {
    loadImage,
    type LoadImageOptions
} from './render/image'

/* ----------------------------------- View --------------------------------- */
export {
    type ViewInit,
    type ViewModel,
    type ViewPatch
} from './view/view'
export {
    ViewManager
} from './view/viewManager'

/* -------------------------------- Viewport -------------------------------- */
export {
    type IViewport
} from './viewport/viewport'
export {
    CageViewport
} from './viewport/cageViewport'
export {
    CameraViewport,
    type CameraViewportOptions,
    type FollowMode
} from './viewport/cameraViewport'

/* --------------------------------- Surface -------------------------------- */
export {
    createSurface,
    type Surface
} from './surface/surface'
