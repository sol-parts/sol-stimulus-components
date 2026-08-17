# slideshow

<img src="https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/slideshow.svg" alt="slideshow — looping slideshow Stimulus controller" width="100%">

A looping slideshow rendered entirely from your server-side markup: seamless
loop via edge-slide clones, autoplay that pauses on hover and while the window
is out of focus, pagination, and drag/flick support when paired with the
[`swipe`](swipe.md) controller.

**[Live demo →](https://sol.parts/packages/docs-demo/slideshow)**

## Installation

With npm or any bundler:

```bash
npm install @sol-parts/sol-stimulus-components
```

With Symfony AssetMapper:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/slideshow
```

The window-focus autoplay pause uses
[stimulus-use](https://stimulus-use.github.io/stimulus-use) (a peer
dependency). The `swipe` controller does not need it.

## Usage

```js
import { Application } from '@hotwired/stimulus';
import Slideshow from '@sol-parts/sol-stimulus-components/slideshow';
import Swipe from '@sol-parts/sol-stimulus-components/swipe';

const app = Application.start();
app.register('slideshow', Slideshow);
app.register('swipe', Swipe); // for gesture support
```

## Markup

The slideshow renders from your own markup: slides are `slide` targets, the
sliding track is the `wrapper` target, pagination dots are `paginationItem`
targets — the `class` attributes of the first two dots define the active and
the normal look. Edge slides are cloned automatically for seamless looping.

```html
<div data-controller="slideshow swipe"
     data-slideshow-autoplay-interval-value="5000"
     data-action="swipe:swipeLeft->slideshow#next
                  swipe:swipeRight->slideshow#prev
                  swipe:dragStart->slideshow#transformOff
                  swipe:dragging->slideshow#dragging
                  swipe:dragEnd->slideshow#dragEnd">
    <div data-slideshow-target="wrapper" style="display: flex">
        <a data-slideshow-target="slide" href="…"><img src="…" alt=""></a>
        <a data-slideshow-target="slide" href="…"><img src="…" alt=""></a>
    </div>
    <button data-action="slideshow#prev">‹</button>
    <button data-action="slideshow#next">›</button>
    <div>
        <button data-slideshow-target="paginationItem" class="dot dot-active" data-action="slideshow#go" data-slideshow-n-param="1"></button>
        <button data-slideshow-target="paginationItem" class="dot" data-action="slideshow#go" data-slideshow-n-param="2"></button>
    </div>
</div>
```

## Values

| Value | Default | Purpose |
|---|---|---|
| `autoplayInterval` | `0` (off) | autoplay period in ms; pauses on hover and while the window is out of focus |
| `dynamicAspect` | `true` | animate the container aspect-ratio per slide; when `false` it is fixed to the first slide |

## Actions

`next`, `prev`, `go` (with `data-slideshow-n-param`), plus `dragging` /
`dragEnd` / `transformOff` for wiring up the `swipe` controller as shown in
the markup above.

## Turbo notes

Edge clones are marked with `data-slideshow-clone` and removed on reconnect,
so cached Turbo snapshots restore correctly; inline styles are reset in
`disconnect()`. The controller never relies on `DOMContentLoaded`.
