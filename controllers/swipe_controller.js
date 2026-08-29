/* stimulusFetch: 'lazy' */
import { Controller } from '@hotwired/stimulus';

const IGNORED_GESTURE_SELECTOR = 'button, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [data-swipe-ignore]';

export default class extends Controller {
    static values = {
        threshold: { type: Number, default: 30 }
    };

    dragging = false;
    intervalId = null;
    pendingDragParams = null;
    startX = false;
    startY = false;
    clickElement = null;
    clickElementPointerEvents = null;
    /** When true, the gesture drives `dragStart`/`dragging`/`dragEnd` as usual but is
     * never recognised as a swipe and never re-triggers a click: it started on an
     * interactive element, or inside a nested `swipe` that owns the direction. */
    suppressGesture = false;

    get threshold() {
        return Math.max(0, this.thresholdValue);
    }

    connect() {
        this.element.addEventListener('mousedown', this.handleStartDrag);
        this.element.addEventListener('touchstart', this.handleStartDrag, { passive: true });
    }

    disconnect() {
        this.element.removeEventListener('mousedown', this.handleStartDrag);
        this.element.removeEventListener('touchstart', this.handleStartDrag);
        this.#cancelDragging();
        this.#restoreClickElement();
        this.dragging = false;
    }

    handleStartDrag = (event) => {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        const target = event.target;
        if (!target || typeof target.closest !== 'function') {
            return;
        }

        // Only the closest `swipe` names the direction, and interactive descendants keep
        // their own handlers — but the drag events still have to flow: an outer strip
        // scrolls itself from `dragging` and must keep working when the gesture starts on
        // a card that owns a nested `swipe`, or on a button inside that card.
        const closestSwipe = target.closest(`[data-controller~="${this.identifier}"]`);
        this.suppressGesture = closestSwipe !== this.element
            || Boolean(target.closest(IGNORED_GESTURE_SELECTOR));

        this.dragging = true;
        this.#initDragging();

        this.startX = this.#clientX(event);
        this.startY = this.#clientY(event);

        if(!event.changedTouches && !this.suppressGesture) {
            this.clickElement = target.closest('a');
            if (this.clickElement) {
                // Suppress the native link click while a mouse drag is in progress;
                // handleEndDrag re-triggers it manually when the gesture was a plain click.
                this.clickElementPointerEvents = this.clickElement.style.pointerEvents;
                this.clickElement.style.pointerEvents = 'none';
            }
        }

        this.dispatch('dragStart', this.#detailEvent(event));
    };

    handleDragging = (event) => {
        if (!this.dragging) return;

        this.pendingDragParams = this.#detailEvent(event);
        if (this.intervalId !== null) return;

        this.intervalId = requestAnimationFrame(() => {
            this.intervalId = null;
            const params = this.pendingDragParams;
            this.pendingDragParams = null;

            if (this.dragging && params) {
                this.dispatch('dragging', params);
            }
        });
    };

    handleEndDrag = (event) => {
        const endX = this.#clientX(event);
        const endY = this.#clientY(event);

        const distanceX = Math.abs(endX - this.startX);
        const distanceY = Math.abs(endY - this.startY);

        const distanceMax = Math.max(distanceX, distanceY);
        if (distanceMax > 0) {
            this.dispatch('dragging', this.#detailEvent(event));
        }
        this.#cancelDragging();

        let eventName = null;

        // if valid Swipe
        if (!this.suppressGesture && distanceMax > this.threshold) {
            if (distanceX === distanceMax) {
                const signX = this.#getSign(endX - this.startX);
                eventName = signX < 0 ? 'swipeLeft' : 'swipeRight';
            }else{
                const signY = this.#getSign(endY - this.startY);
                eventName = signY < 0 ? 'swipeUp' : 'swipeDown';
            }

            this.dispatch(eventName, this.#detailEvent(event));
        }

        const clickElement = this.clickElement;
        this.#restoreClickElement();

        // dragEnd closes EVERY gesture and names the recognised direction in `detail.swipe`
        // (null when there was none): a consumer that moved something while `dragging` fired
        // needs one reliable place to settle it, and deducing that from the distance would mean
        // duplicating the threshold above on the other side of the event.
        this.dispatch('dragEnd', this.#detailEvent(event, { swipe: eventName }));

        if(!eventName && !this.suppressGesture) {
            if(clickElement?.hasAttribute('href')){
                clickElement.click();
            }
            this.dispatch('click', this.#detailEvent(event));
        }

        this.dragging = false;
        this.startX = false;
        this.startY = false;
    };

    handleCancelDrag = (event) => {
        if (!this.dragging) return;

        this.#cancelDragging();
        this.#restoreClickElement();
        this.dispatch('dragEnd', this.#detailEvent(event, { swipe: null, canceled: true }));
        this.dragging = false;
        this.startX = false;
        this.startY = false;
    };

    #detailEvent(event, extra = {}) {
        const clientX = this.#clientX(event);
        const clientY = this.#clientY(event);

        return {
            detail: {
                clientX,
                clientY,
                distanceX: clientX - this.startX,
                distanceY: clientY - this.startY,
                pointerType: event.changedTouches ? 'touch' : 'mouse',
                threshold: this.threshold,
                ...extra
            }
        };
    }

    #initDragging() {
        this.element.addEventListener('mouseup', this.handleEndDrag);
        // A mouse drag that overshoots the element still ended in a direction the consumer
        // asked for — a drawer swiped shut, a gallery flicked over — so mouseleave settles
        // the gesture. Only touchcancel, where the pointer is gone, is a real cancel.
        this.element.addEventListener('mouseleave', this.handleEndDrag);
        this.element.addEventListener('touchend', this.handleEndDrag);
        this.element.addEventListener('touchcancel', this.handleCancelDrag);

        this.element.addEventListener('mousemove', this.handleDragging);
        this.element.addEventListener('touchmove', this.handleDragging, { passive: true });
    }

    #cancelDragging() {
        if (this.intervalId !== null) {
            cancelAnimationFrame(this.intervalId);
            this.intervalId = null;
        }
        this.pendingDragParams = null;

        this.element.removeEventListener('mouseup', this.handleEndDrag);
        this.element.removeEventListener('mouseleave', this.handleEndDrag);
        this.element.removeEventListener('touchend', this.handleEndDrag);
        this.element.removeEventListener('touchcancel', this.handleCancelDrag);

        this.element.removeEventListener('mousemove', this.handleDragging);
        this.element.removeEventListener('touchmove', this.handleDragging);
    }

    #restoreClickElement() {
        if (!this.clickElement) return;

        this.clickElement.style.pointerEvents = this.clickElementPointerEvents;
        this.clickElement = null;
        this.clickElementPointerEvents = null;
    }

    #clientX(event) {
        return this.#clientCoordinate(event, 'clientX', this.startX);
    }
    #clientY(event) {
        return this.#clientCoordinate(event, 'clientY', this.startY);
    }
    #clientCoordinate(event, property, fallback) {
        const touch = event.changedTouches?.[0] ?? event.touches?.[0];

        return touch?.[property] ?? event[property] ?? fallback;
    }
    #getSign(value) {
        return Math.sign ? Math.sign(value) : (value > 0) - (value < 0) || +value;
    }
}
