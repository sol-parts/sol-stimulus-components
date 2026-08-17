# @sol-parts/sol-stimulus-components

Composable [Stimulus](https://stimulus.hotwired.dev/) controllers extracted from the
[sol.parts](https://sol.parts) e-commerce platform.

- **Plain ES modules, no build step** — works out of the box with Symfony AssetMapper
  (importmap), or with any bundler.
- **No CSS framework required** — the controllers only touch inline styles and the
  classes you provide in your own markup.
- **Composable by design** — controllers talk to each other through DOM events, so
  each one stays small and reusable.
- **Turbo-aware** — safe `connect()`/`disconnect()` lifecycles, snapshot-restore
  cleanup, no reliance on `DOMContentLoaded`.

**Docs & live demos:** [swipe](https://sol.parts/packages/docs-demo/swipe) ·
[slideshow](https://sol.parts/packages/docs-demo/slideshow)

## Controllers

| Controller | Purpose |
|---|---|
| `swipe` | Turns mouse/touch gestures on an element into Stimulus events (`swipeLeft`, `swipeRight`, `swipeUp`, `swipeDown`, `dragStart`, `dragging`, `dragEnd`, `click`) |
| `slideshow` | Looping slideshow with autoplay, pagination and animated aspect-ratio; pairs with `swipe` for drag/flick support |

## Installation

With npm / a bundler:

```bash
npm install @sol-parts/sol-stimulus-components
```

```js
import { Application } from '@hotwired/stimulus';
import Swipe from '@sol-parts/sol-stimulus-components/swipe';
import Slideshow from '@sol-parts/sol-stimulus-components/slideshow';

const app = Application.start();
app.register('swipe', Swipe);
app.register('slideshow', Slideshow);
```

With Symfony AssetMapper:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/swipe @sol-parts/sol-stimulus-components/slideshow
```

`slideshow` additionally needs [`stimulus-use`](https://stimulus-use.github.io/stimulus-use)
(a peer dependency) for its window-focus autoplay pause. `swipe` has no dependencies
besides Stimulus itself.

## swipe

Attach it to any element to receive gesture events. It distinguishes a real swipe
(more than 30px of travel) from a plain click, suppresses accidental link clicks
while dragging with the mouse, and re-triggers the link when the gesture turns out
to be a click.

```html
<div data-controller="swipe"
     data-action="swipe:swipeLeft->gallery#next swipe:swipeRight->gallery#prev">
    ...
</div>
```

Events (all carry `{ clientX, clientY, distanceX, distanceY }` in `detail`):

| Event | Fired when |
|---|---|
| `swipe:swipeLeft` / `swipe:swipeRight` / `swipe:swipeUp` / `swipe:swipeDown` | travel exceeded 30px, dominant axis picked |
| `swipe:dragStart` | gesture started |
| `swipe:dragging` | pointer moved (throttled via `requestAnimationFrame`) |
| `swipe:dragEnd` | gesture ended with a swipe |
| `swipe:click` | gesture ended without a swipe |

Descendants marked with `data-swipe-ignore` (e.g. buttons with their own handlers
inside the swipe area) opt out: gestures starting on them dispatch neither swipe
events nor `swipe:click`.

## slideshow

A looping slideshow that renders entirely from your markup: slides are `slide`
targets, pagination items are `paginationItem` targets (their first two `class`
attributes define the selected/normal looks), and the sliding track is the
`wrapper` target. Edge slides are cloned for seamless looping.

```html
<div data-controller="slideshow swipe"
     data-slideshow-autoplay-interval-value="5000"
     data-action="swipe:swipeLeft->slideshow#next
                  swipe:swipeRight->slideshow#prev
                  swipe:dragStart->slideshow#transformOff
                  swipe:dragging->slideshow#dragging
                  swipe:dragEnd->slideshow#dragEnd">
    <div data-slideshow-target="wrapper" style="display: flex">
        <a data-slideshow-target="slide" href="..."><img src="..." alt=""></a>
        <a data-slideshow-target="slide" href="..."><img src="..." alt=""></a>
    </div>
    <button data-action="slideshow#prev">‹</button>
    <button data-action="slideshow#next">›</button>
    <div>
        <button data-slideshow-target="paginationItem" class="dot dot-active" data-action="slideshow#go" data-slideshow-n-param="1"></button>
        <button data-slideshow-target="paginationItem" class="dot" data-action="slideshow#go" data-slideshow-n-param="2"></button>
    </div>
</div>
```

Values:

| Value | Default | Purpose |
|---|---|---|
| `autoplayInterval` | `0` (off) | autoplay period in ms; pauses on hover and while the window is out of focus |
| `dynamicAspect` | `true` | animate the container aspect-ratio per slide; when `false` it is fixed to the first slide |

Actions: `next`, `prev`, `go` (with `data-slideshow-n-param`), plus `dragging` /
`dragEnd` / `transformOff` for wiring up the `swipe` controller as shown above.

## License

[MIT](LICENSE)
