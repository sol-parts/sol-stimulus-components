# drag-scroll

Turns `swipe` drag events into pointer-driven scrolling. It supports horizontal,
vertical and two-axis viewports, respects RTL direction, and keeps the gesture
dead zone aligned with the emitting `swipe` controller so a short movement can
remain a click.

Mouse dragging is enhanced by JavaScript. Touch keeps the browser's native
scrolling and inertia by default.

**[Live demo →](https://sol.parts/packages/docs-demo/drag-scroll)**

## Installation

With npm or any bundler:

```bash
npm install @sol-parts/sol-stimulus-components
```

With Symfony AssetMapper:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/swipe
php bin/console importmap:require @sol-parts/sol-stimulus-components/drag-scroll
```

## Usage

Register both controllers in your Stimulus application:

```js
import { Application } from '@hotwired/stimulus';
import Swipe from '@sol-parts/sol-stimulus-components/swipe';
import DragScroll from '@sol-parts/sol-stimulus-components/drag-scroll';

const app = Application.start();
app.register('swipe', Swipe);
app.register('drag-scroll', DragScroll);
```

Attach `drag-scroll` to the scrolling viewport and `swipe` to its content:

```html
<div class="scroll-viewport"
     data-controller="drag-scroll"
     data-drag-scroll-axis-value="horizontal">
    <div data-controller="swipe"
         data-action="
             swipe:dragStart->drag-scroll#dragStart
             swipe:dragging->drag-scroll#dragScroll
             swipe:dragEnd->drag-scroll#dragEnd
         ">
        …
    </div>
</div>
```

The `swipe` content may contain links. Movement inside the swipe threshold does
not move the viewport, so a short gesture can still activate a link. Buttons,
form controls, editable content and `[data-swipe-ignore]` descendants do not
start a swipe gesture.

## Values

| Value | Default | Purpose |
|---|---|---|
| `axis` | `horizontal` | `horizontal` / `x`, `vertical` / `y`, or `both` |
| `sensitivity` | `3` | Pointer movement multiplier; negative values are clamped to `0` |
| `touch` | `false` | Also apply JavaScript scrolling to touch gestures |

Keep `touch=false` for ordinary overflow containers so the browser retains
native touch scrolling and momentum. If custom touch scrolling is enabled,
the application should also disable native panning for that viewport with an
appropriate `touch-action` rule.

`drag-scroll` reads the threshold included in every `swipe` event. A custom
event source may omit it; the fallback is `30` pixels.

## Responsive axes

Use `axis="both"` when CSS changes the overflowing axis at a breakpoint. The
browser clamps the inactive axis naturally, so the same markup can scroll a
horizontal mobile row and a vertical desktop column.
