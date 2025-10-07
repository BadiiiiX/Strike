# Strike • Sprite runtime for the web

> Lightweight, framework-agnostic sprite runtime.  
> Actor-driven scheduling, clean viewport strategies (including **cage**: the canvas follows the actor), and a tidy core you can adapt to Vue/React.

<p align="center">
  <img alt="Strike" src="https://img.shields.io/badge/status-alpha-orange" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue" />
  <img alt="Build" src="https://img.shields.io/badge/bundler-bun-lightgrey" />
</p>

---

## Why Strike?

- **Agnostic core** — pure TS + Canvas2D, no framework lock-in.
- **Actor model** — each sprite has its own state + action channels (timed events).
- **Cage viewport** — the **canvas moves with the actor**, sized exactly to its frame. Perfect for UI widgets, HUDs, mini-previews, etc.
- **Simple spritesheets** — single-row sheets with optional spacing/margin, auto frame-size inference.
- **Tiny & readable** — clean modules (actor, view, viewport, render), easy to extend.

---

## Quick look

```ts
import { createSurface, createActor, loadImage } from '@badiiix/strike-core'

const SURFACE_DIV_ID = "#stage"

const surface = createSurface({ mount: SURFACE_DIV_ID, mode: 'actor', background: 'transparent' })
const img = await loadImage('/cat.png')   // 1×8 spritesheet

const actor = createActor({ sheet: { frames: 8 }, x: 50, y: 150 })
surface.add({ actor, sheet: img, anchor: 'topleft', scale: 2 }) //calculates automaticly the frame size 🔥

actor.channel('frames').every(140, () => actor.nextFrame(), { name: 'frames' }).start()
actor.channel('move').every(500, () => actor.addPos(20, 0), { name: 'drift' }).start()
```

--- 

## Install

```shell
# with bun
bun add @badiiix/strike-core

# or npm
npm i @badiiix/strike-core
```

## Roadmap

- [x] Core (actor, view, viewport: cage, Canvas2D)
- [x] Action channels (every/once, cancel by name)
- [x] Spritesheet inference
- [ ] More camera strategy
- [ ] Deadzone and overflow (css) manager
- [ ] Vue adapter (@badiiiix/strike-vue)
- [ ] React adapter (@badiiiix/strike-react)
- [ ] Docs site & playground