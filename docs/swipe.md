# swipe

<img src="https://raw.githubusercontent.com/sol-parts/sol-stimulus-components/main/docs/media/swipe.svg" alt="swipe — gestures as Stimulus events" width="100%">

Turns mouse and touch gestures on any element into Stimulus events:
`swipeLeft` / `swipeRight` / `swipeUp` / `swipeDown`, drag coordinates and a
gesture-aware `click`. No dependencies besides Stimulus itself.

**[Live demo →](https://sol.parts/packages/docs-demo/swipe)**

## Installation

With npm or any bundler:

```bash
npm install @sol-parts/sol-stimulus-components
```

With Symfony AssetMapper:

```bash
php bin/console importmap:require @sol-parts/sol-stimulus-components/swipe
```

## Usage

Register the controller in your Stimulus application:

```js
import { Application } from '@hotwired/stimulus';
import Swipe from '@sol-parts/sol-stimulus-components/swipe';

const app = Application.start();
app.register('swipe', Swipe);
```

## Markup

Attach the controller to any element and listen to its events with standard
Stimulus actions — this is how `swipe` composes with a gallery, a slideshow
or your own controller:

```html
<div data-controller="swipe"
     data-action="swipe:swipeLeft->gallery#next swipe:swipeRight->gallery#prev">
    …
</div>
```

## Events

Every event carries `{ clientX, clientY, distanceX, distanceY }` in `detail`.
A gesture longer than 30px counts as a swipe; a shorter one — as a click.

| Event | Fired when |
|---|---|
| `swipe:swipeLeft` / `swipe:swipeRight` / `swipe:swipeUp` / `swipe:swipeDown` | travel exceeded 30px, dominant axis picked |
| `swipe:dragStart` | gesture started |
| `swipe:dragging` | pointer moved (throttled via `requestAnimationFrame`) |
| `swipe:dragEnd` | gesture ended — `detail.swipe` names the recognised direction, or is `null` |
| `swipe:click` | gesture ended without a swipe |

`swipe:dragEnd` fires for every finished gesture, so anything moved while
`swipe:dragging` was firing has a single place to settle, without re-deriving
the 30px threshold on the listening side.

## Links inside the swipe area

A mouse drag that starts on a link suppresses the native click for the
duration of the gesture; when the gesture turns out to be a plain click, the
link is re-triggered. Links inside the area keep working, while real swipes
never navigate away.

## Opting out: `data-swipe-ignore`

Descendants marked with `data-swipe-ignore` (e.g. buttons with their own
handlers inside the swipe area) opt out: gestures starting on them dispatch
neither swipe events nor `swipe:click`.
