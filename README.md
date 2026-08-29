# @sol-parts/sol-stimulus-components

Composable [Stimulus](https://stimulus.hotwired.dev/) controllers extracted
from the [SOLPARTS](https://sol.parts) e-commerce platform. Plain ES
modules — no build step, no CSS framework, Turbo-aware, composed together
through DOM events.

```bash
npm install @sol-parts/sol-stimulus-components
```

`stimulus-use` is a peer dependency of the `slideshow` controller only — the
other controllers need nothing beyond Stimulus:

```bash
npm install stimulus-use
```

Symfony AssetMapper users can require controllers individually:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/swipe
```

## Controllers

| [`swipe`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) | [`drag-scroll`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/drag-scroll.md) | [`scroll-strip`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/scroll-strip.md) | [`slideshow`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) |
|---|---|---|---|
| [![swipe — gestures as Stimulus events](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/swipe.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) | [![drag-scroll — pointer drag scrolling](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/drag-scroll.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/drag-scroll.md) | [![scroll-strip — navigation and edge indicators](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/scroll-strip.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/scroll-strip.md) | [![slideshow — looping slideshow](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/slideshow.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) |
| Turns mouse/touch gestures into Stimulus events: `swipeLeft`, `dragging`, gesture-aware `click`, … [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) · [Live demo](https://sol.parts/packages/docs-demo/swipe) | Converts `swipe` drag events into horizontal, vertical or two-axis pointer scrolling while preserving native touch. [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/drag-scroll.md) · [Live demo](https://sol.parts/packages/docs-demo/drag-scroll) | Keeps previous/next buttons and markup-provided gradients synchronized for horizontal or vertical overflow. [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/scroll-strip.md) · [Live demo](https://sol.parts/packages/docs-demo/scroll-strip) | Looping slideshow with autoplay, pagination and animated aspect-ratio; pairs with `swipe` for drag/flick. [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) · [Live demo](https://sol.parts/packages/docs-demo/slideshow) |

## Naming

Two kinds of controller live here, and the name tells you which one you are
looking at before you open it:

| | Behaviour | Component |
|---|---|---|
| Named after | the action it performs | the thing it is |
| Targets | none — it attaches to markup it does not own | owns its structure through targets |
| Examples | `swipe`, `drag-scroll` | `slideshow`, `scroll-strip` |

That is why `scroll` sits at the end of `drag-scroll` — scrolling *by* dragging,
a verb phrase — and at the front of `scroll-strip` — a strip that *scrolls*, a
noun phrase. A new controller picks its side first and its words second.

## License

[MIT](LICENSE)
