# scroll-strip

Keeps scroll navigation and edge indicators in sync with an overflowing
viewport. It supports horizontal and vertical layouts, logical start/end edges
in RTL, viewport-sized previous/next actions, and content resizing.

Buttons and indicators are optional targets of the same controller. The
application owns their markup and CSS; `scroll-strip` only updates the standard
`hidden` and `disabled` attributes.

**[Live demo →](https://sol.parts/packages/docs-demo/scroll-strip)**

## Installation

With npm or any bundler:

```bash
npm install @sol-parts/sol-stimulus-components
```

With Symfony AssetMapper:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/scroll-strip
```

## Usage

Register the controller in your Stimulus application:

```js
import { Application } from '@hotwired/stimulus';
import ScrollStrip from '@sol-parts/sol-stimulus-components/scroll-strip';

const app = Application.start();
app.register('scroll-strip', ScrollStrip);
```

## Markup

Attach the controller to a wrapper and mark the scrolling element as
`viewport`. Buttons scroll by one viewport; indicators are visible only while
more content is available beyond their logical edge:

```html
<div class="scroll-wrapper" data-controller="scroll-strip">
    <div class="scroll-viewport" data-scroll-strip-target="viewport">
        …
    </div>

    <button hidden
            data-scroll-strip-target="prevButton"
            data-action="scroll-strip#prev">
        Previous
        <span hidden class="gradient-start"
              data-scroll-strip-target="start"></span>
    </button>

    <button hidden
            data-scroll-strip-target="nextButton"
            data-action="scroll-strip#next">
        Next
        <span hidden class="gradient-end"
              data-scroll-strip-target="end"></span>
    </button>
</div>
```

Buttons and indicators can also be separate elements, or omitted independently.
If the controller element is itself scrollable, the `viewport` target may be
omitted.

### Buttons beside the viewport

Nothing in the controller positions the buttons — they are plain targets, so
they can also sit in their own flex columns instead of overlapping the content.
That layout suits short items such as breadcrumbs or tabs, where a button drawn
over the content would cover a whole label:

```html
<div class="strip" data-controller="scroll-strip">
    <button data-scroll-strip-target="prevButton" data-action="scroll-strip#prev">←</button>

    <nav class="strip-viewport" data-scroll-strip-target="viewport">
        …
    </nav>

    <button data-scroll-strip-target="nextButton" data-action="scroll-strip#next">→</button>
</div>
```

```css
.strip { display: flex; align-items: center; gap: .25rem; }
/* A flex item defaults to min-width: auto, so without this the viewport never
   shrinks below its content and the strip simply never overflows. */
.strip-viewport { flex: 1; min-width: 0; overflow-x: auto; }
```


For a vertical viewport, use `data-scroll-strip-axis-value="vertical"` and
position previous/next controls and start/end indicators at its top and bottom.
Start and end remain logical edges, including horizontal RTL layouts.

## Pairing with `drag-scroll`

`scroll-strip` only reads the scroll position, so it composes with the
[`drag-scroll`](drag-scroll.md) controller on the same viewport: buttons and
edge indicators keep tracking the edges while the strip is also draggable with
the mouse. Put `scroll-strip` on the wrapper, `drag-scroll` on the scrolling
element, and `swipe` on the row that emits the gestures:

```html
<div class="strip" data-controller="scroll-strip">
    <div class="strip-viewport"
         data-scroll-strip-target="viewport"
         data-controller="drag-scroll">
        <div class="strip-row"
             data-controller="swipe"
             data-action="
                 swipe:dragStart->drag-scroll#dragStart
                 swipe:dragging->drag-scroll#dragScroll
                 swipe:dragEnd->drag-scroll#dragEnd
             ">
            …
        </div>
    </div>

    <button data-scroll-strip-target="prevButton" data-action="scroll-strip#prev">←</button>
    <button data-scroll-strip-target="nextButton" data-action="scroll-strip#next">→</button>
</div>
```

The two never talk to each other — `drag-scroll` writes `scrollLeft`, and
`scroll-strip` picks the change up from the viewport's own `scroll` event — so
either one can be dropped without touching the other.

## Values

| Value | Default | Purpose |
|---|---|---|
| `axis` | `horizontal` | `horizontal` / `x` or `vertical` / `y` |
| `threshold` | `2` | edge tolerance in pixels; also ignores overflow no larger than this value |
| `hideDisabled` | `false` | hide a button once it reaches its edge, instead of only disabling it |

A button at its edge stays rendered by default, so the controls do not move
under the reader. Turn `hideDisabled` on for buttons drawn over the content,
where an arrow that does nothing still covers what is behind it; leave it off
for buttons holding their own slot in a flex row, where hiding one shifts
everything beside it. Edge indicators always behave as if the flag were on.

Targets can carry `hidden` in server-rendered markup to avoid flashing before
Stimulus connects — but only when the controller is loaded eagerly. Behind a
lazily fetched controller, leave them visible instead: a slow or failed chunk
then still shows the edge treatment rather than nothing at all.

The viewport and the row inside it are watched with a `ResizeObserver`, so
late-loading images and appended items are picked up; the controller needs no
dependency beyond Stimulus itself. The `viewport` target may also appear or
disappear while the controller stays connected — the listeners follow it.
