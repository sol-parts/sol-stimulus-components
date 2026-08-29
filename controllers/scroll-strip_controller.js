/* stimulusFetch: 'lazy' */
import { Controller } from '@hotwired/stimulus';

const VERTICAL_AXES = new Set(['vertical', 'y']);

export default class extends Controller {
    static targets = ['viewport', 'prevButton', 'nextButton', 'start', 'end'];
    static values = {
        axis: { type: String, default: 'horizontal' },
        threshold: { type: Number, default: 2 },
        hideDisabled: { type: Boolean, default: false }
    };

    viewport = null;
    rtl = false;
    updateFrame = null;
    resizeObserver = null;
    handleScroll = () => this.scheduleUpdate();

    connect() {
        // Direction is cached and refreshed from here instead of being read in update():
        // it only changes when the surrounding layout does, while update() runs on every
        // scroll frame and would otherwise force a style resolution each time.
        this.resizeObserver = new ResizeObserver(() => {
            this.#readDirection();
            this.scheduleUpdate();
        });

        this.#unbindViewport();
        this.#bindViewport();
        this.update();
    }

    disconnect() {
        this.#unbindViewport();
        this.resizeObserver = null;

        if (this.updateFrame !== null) {
            cancelAnimationFrame(this.updateFrame);
            this.updateFrame = null;
        }
    }

    // The viewport target can appear and disappear while the controller element itself
    // stays connected — a server-rendered fragment re-renders around it, an empty state
    // drops the scrolling wrapper altogether. Rebinding from the target callbacks keeps
    // the listeners on the element that is scrolling now instead of the one that
    // happened to exist when connect() ran.
    viewportTargetConnected() {
        this.#bindViewport();
    }

    viewportTargetDisconnected() {
        this.#bindViewport();
    }

    axisValueChanged() {
        this.scheduleUpdate();
    }

    thresholdValueChanged() {
        this.scheduleUpdate();
    }

    hideDisabledValueChanged() {
        this.scheduleUpdate();
    }

    prev() {
        this.scrollByViewport(-1);
    }

    next() {
        this.scrollByViewport(1);
    }

    scrollByViewport(direction) {
        if (!this.viewport) return;

        const vertical = this.isVertical;
        const amount = vertical ? this.viewport.clientHeight : this.viewport.clientWidth;
        if (amount <= 0) return;

        if (vertical) {
            this.viewport.scrollBy({ top: direction * amount, behavior: 'smooth' });
            return;
        }

        this.viewport.scrollBy({ left: direction * amount * (this.rtl ? -1 : 1), behavior: 'smooth' });
    }

    scheduleUpdate() {
        if (!this.viewport || this.updateFrame !== null) return;

        this.updateFrame = requestAnimationFrame(() => this.update());
    }

    update() {
        if (!this.viewport) return;

        this.updateFrame = null;

        const viewportSize = this.isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
        const scrollSize = this.isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
        const maxPosition = Math.max(0, scrollSize - viewportSize);
        const threshold = Math.max(0, this.thresholdValue);
        const overflow = maxPosition > threshold;
        const position = Math.min(maxPosition, Math.max(0, this.position));
        const canScrollBack = overflow && position > threshold;
        const canScrollForward = overflow && position < maxPosition - threshold;

        this.toggleButtons(this.prevButtonTargets, overflow, canScrollBack);
        this.toggleButtons(this.nextButtonTargets, overflow, canScrollForward);
        this.toggleIndicators(this.startTargets, canScrollBack);
        this.toggleIndicators(this.endTargets, canScrollForward);
    }

    get isVertical() {
        return VERTICAL_AXES.has(this.axisValue.toLowerCase());
    }

    get position() {
        if (this.isVertical) return this.viewport.scrollTop;

        const position = this.viewport.scrollLeft;
        return this.rtl ? Math.abs(position) : position;
    }

    // `disabled` is set even on a hidden button: [hidden] is only a default style, and a page
    // that overrides it would otherwise get a clickable control that scrolls nowhere.
    toggleButtons(buttons, visible, enabled) {
        const hidden = !visible || (this.hideDisabledValue && !enabled);

        buttons.forEach(button => {
            button.toggleAttribute('hidden', hidden);
            button.toggleAttribute('disabled', !enabled);
        });
    }

    toggleIndicators(indicators, visible) {
        indicators.forEach(indicator => indicator.toggleAttribute('hidden', !visible));
    }

    #bindViewport() {
        const viewport = this.hasViewportTarget ? this.viewportTarget : this.element;
        if (viewport === this.viewport) return;

        this.#unbindViewport();

        this.viewport = viewport;
        this.#readDirection();
        viewport.addEventListener('scroll', this.handleScroll, { passive: true });
        this.resizeObserver?.observe(viewport);

        // The row inside the viewport is observed as well: lazily loaded images and
        // appended items grow the scrollable content while the viewport's own box keeps
        // its size, and ResizeObserver never reports that. A viewport whose direct
        // children are the items themselves therefore has to wrap them in one row.
        if (viewport.firstElementChild) {
            this.resizeObserver?.observe(viewport.firstElementChild);
        }

        this.scheduleUpdate();
    }

    #unbindViewport() {
        this.viewport?.removeEventListener('scroll', this.handleScroll);
        // The observer only ever watches the viewport and its row, so dropping every
        // observation is exactly the teardown for the element being unbound.
        this.resizeObserver?.disconnect();
        this.viewport = null;
    }

    #readDirection() {
        this.rtl = this.viewport ? getComputedStyle(this.viewport).direction === 'rtl' : false;
    }
}
