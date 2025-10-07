# @badiiix/strike-core

> Lightweight, framework-agnostic sprite runtime for the web.  

<p align="left">
  <img alt="Status" src="https://img.shields.io/badge/status-alpha-orange" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue" />
</p>

---

## ✨ Why Strike Core?

- **Agnostic core** — pure TS + Canvas2D, no framework lock-in (Vue/React adapters coming).
- **Actor model** — each sprite owns state + action channels (timed events).
- **Simple spritesheets** — single row, optional spacing/margin, auto frame-size inference.
- **Small & clear** — clean modules (actor, view, viewport, render), easy to extend.

---

## 📦 Install

```bash
# npm
npm i @badiiix/strike-core

# bun
bun add @badiiix/strike-core

# pnpm
pnpm add @badiiix/strike-core
```

---

## 🚀 Quick start

HTML:
```html
<div id="stage"></div>
```

TS:
```ts
import { createSurface, createActor, loadImage } from '@badiiix/strike-core'

const surface = createSurface({
  mount: '#stage',
  mode: 'actor',              // "cage" strategy by default
  background: 'transparent',
})

const img = await loadImage('/cat.png')   // 1×8 spritesheet
const actor = createActor({ sheet: { frames: 8 }, x: 50, y: 150 })

surface.add({ actor, sheet: img, anchor: 'topleft', scale: 2 })

actor.channel('frames').every(140, () => actor.nextFrame(), { name: 'frames' }).start()
actor.channel('move').every(500, () => actor.addPos(20, 0), { name: 'drift' }).start()
```
---
## 🧠 Concepts

### Actor
> Owns runtime state and actions

```ts
const actor = createActor({ sheet: { frames: 8 }, x: 0, y: 0 })
actor.setPos(100, 120)
actor.nextFrame()
actor.channel('frames').every(200, () => actor.nextFrame(), { name: 'tick' }).start()
```

### View
> Binds an `Actor` to an image and render flags (scale, flips, anchor, z)

```ts
const view = surface.add({ actor, sheet: img, scale: 2, anchor: 'center', z: 1 })
surface.update(view, { flipX: true })
```

### Surface & Viewport
Surface orchestrates rendering through a viewport strategy:
- `mode: 'actor'` → Cage: canvas follows the actor; canvas size = current frame × scale. 
- `mode: 'fixed'` → fixed canvas size; pair with camera viewport if needed. 
- `mode: 'parent'` → canvas matches parent size; pair with camera viewport.

---
## 🖼️ Spritesheets
Single row of frames. You can provide or omit frameSize:

```ts
const actor = createActor({
  sheet: {
    frames: 8, //If nothing else provided, will calculate automaticly the frame size
    // Optional if the image is known; will be inferred:
    // frameSize: [20, 14],
    // spacing: 0,
    // margin: 0,
  }
})
```
> If frameSize is omitted, the core infers it from imageSize and frames.
Spacing/margin are supported (uniform).

---
## 🔧 API (high level)
```ts
// Surface
createSurface(options)
  .add({ actor, sheet, scale?, anchor?, z?, flipX?, flipY?, visible? })
  .update(view, patch)
  .remove(view)
  .setFollow(view?)   // for camera-like strategies
  .play() / .pause() / .destroy()

// Actor
createActor({ sheet, x?, y?, frame?, facing? })
  .setPos(x, y) / .addPos(dx, dy)
  .setFrame(i) / .nextFrame() / .prevFrame()
  .channel(name).every(ms, fn, { name?, immediate?, catchUp? }).start()
  .channel(name).once(ms, fn, { name? })
```

> Types are fully exported if you need them:
```ts
import type { SheetMeta, Anchor, ViewModel } from '@badiiix/strike-core'
```

---
## 🛠️ Build targets

- `ESM`: dist/index.mjs 
- `CJS`: dist/index.cjs 
- `Types`: dist/index.d.ts 

> Package exports are configured for both `import` and `require`.
