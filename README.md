# @sol-parts/sol-stimulus-components

Composable [Stimulus](https://stimulus.hotwired.dev/) controllers extracted
from the [sol.parts](https://sol.parts) e-commerce platform. Plain ES
modules — no build step, no CSS framework, Turbo-aware, composed together
through DOM events.

```bash
npm install @sol-parts/sol-stimulus-components
```

Symfony AssetMapper users can require controllers individually:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/swipe
```

## Controllers

| [`swipe`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) | [`slideshow`](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) |
|---|---|
| [![swipe — gestures as Stimulus events](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/swipe.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) | [![slideshow — looping slideshow](https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/slideshow.svg)](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) |
| Turns mouse/touch gestures into Stimulus events: `swipeLeft`, `dragging`, gesture-aware `click`, … [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/swipe.md) · [Live demo](https://sol.parts/packages/docs-demo/swipe) | Looping slideshow with autoplay, pagination and animated aspect-ratio; pairs with `swipe` for drag/flick. [Docs](https://github.com/sol-parts/sol-stimulus-components/blob/main/docs/slideshow.md) · [Live demo](https://sol.parts/packages/docs-demo/slideshow) |

## License

[MIT](LICENSE)
