import { Controller } from '@hotwired/stimulus';

/* stimulusFetch: 'lazy' */
export default class extends Controller {
    dragging = false;
    intervalId = false;
    startX = false;
    startY = false;
    clickElement = null;
    clickElementPointerEvents = null;
    /** When true, neither swipe directions nor the click event are dispatched
     * (gesture started on a `[data-swipe-ignore]` descendant — e.g. a button
     * with its own handlers inside the swipe area). */
    ignoreSwipeForGesture = false;

    connect() {
        this.element.addEventListener('mousedown', this.handleStartDrag);
        this.element.addEventListener('touchstart', this.handleStartDrag, { passive: true });
    }

    disconnect() {
        this.element.removeEventListener('mousedown', this.handleStartDrag);
        this.element.removeEventListener('touchstart', this.handleStartDrag);
    }

    handleStartDrag = (event) => {
        this.dragging = true;
        this.#initDragging();

        this.startX = this.#clientX(event);
        this.startY = this.#clientY(event);

        const t = event.target;
        this.ignoreSwipeForGesture = Boolean(
            t && typeof t.closest === 'function' && t.closest('[data-swipe-ignore]')
        );

        if(!event.changedTouches) {
            this.clickElement = event.target.closest('a');
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

        this.intervalId = requestAnimationFrame(
            () => this.dispatch('dragging', this.#detailEvent(event))
        );
    };

    handleEndDrag = (event) => {
        this.#cancelDragging();

        const endX = this.#clientX(event);
        const endY = this.#clientY(event);

        const distanceX = Math.abs(endX - this.startX);
        const distanceY = Math.abs(endY - this.startY);

        const distanceMax = Math.max(distanceX, distanceY);
        let eventName = null;
        const skipSwipe = this.ignoreSwipeForGesture;
        this.ignoreSwipeForGesture = false;

        // if valid Swipe
        if (!skipSwipe && distanceMax > 30) {
            if (distanceX === distanceMax) {
                const signX = this.#getSign(endX - this.startX);
                eventName = signX < 0 ? 'swipeLeft' : 'swipeRight';
            }else{
                const signY = this.#getSign(endY - this.startY);
                eventName = signY < 0 ? 'swipeUp' : 'swipeDown';
            }

            this.dispatch(eventName, this.#detailEvent(event));
        }

        if(this.clickElement){
            this.clickElement.style.pointerEvents = this.clickElementPointerEvents;
            if(!eventName && this.clickElement.hasAttribute('href')){
                this.clickElement.click();
            }
            this.clickElement = null;
            this.clickElementPointerEvents = null;
        }

        // dragEnd closes EVERY gesture and names the recognised direction in `detail.swipe`
        // (null when there was none): a consumer that moved something while `dragging` fired
        // needs one reliable place to settle it, and deducing that from the distance would mean
        // duplicating the threshold above on the other side of the event.
        this.dispatch('dragEnd', this.#detailEvent(event, { swipe: eventName }));

        if(!eventName && !skipSwipe) {
            this.dispatch('click', this.#detailEvent(event));
        }

        this.dragging = false;
        this.startX = false;
        this.startY = false;
    };

    #detailEvent(event, extra = {}) {
        return {
            detail: {
                clientX: this.#clientX(event),
                clientY: this.#clientY(event),
                distanceX: this.#clientX(event) - this.startX,
                distanceY: this.#clientY(event) - this.startY,
                ...extra
            }
        };
    }

    #initDragging() {
        this.element.addEventListener('mouseup', this.handleEndDrag);
        this.element.addEventListener('mouseleave', this.handleEndDrag);
        this.element.addEventListener('touchend', this.handleEndDrag);

        this.element.addEventListener('mousemove', this.handleDragging);
        this.element.addEventListener('touchmove', this.handleDragging, { passive: true });
    }

    #cancelDragging() {
        if (this.intervalId) {
            cancelAnimationFrame(this.intervalId);
            this.intervalId = false;
        }

        this.element.removeEventListener('mouseup', this.handleEndDrag);
        this.element.removeEventListener('mouseleave', this.handleEndDrag);
        this.element.removeEventListener('touchend', this.handleEndDrag);

        this.element.removeEventListener('mousemove', this.handleDragging);
        this.element.removeEventListener('touchmove', this.handleDragging);
    }

    #clientX(event) {
        return parseInt(event.changedTouches ? event.changedTouches[0].clientX : event.clientX);
    }
    #clientY(event) {
        return parseInt(event.changedTouches ? event.changedTouches[0].clientY : event.clientY);
    }
    #getSign(value) {
        return Math.sign ? Math.sign(value) : (value > 0) - (value < 0) || +value;
    }
}
