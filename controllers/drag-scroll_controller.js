/* stimulusFetch: 'lazy' */
import { Controller } from '@hotwired/stimulus';

// Both sets name the axis explicitly, so an unrecognised value is neither horizontal nor
// vertical instead of quietly falling through to one of them.
const HORIZONTAL_AXES = new Set(['horizontal', 'x', 'both']);
const VERTICAL_AXES = new Set(['vertical', 'y', 'both']);
const DEFAULT_THRESHOLD = 30;

/**
 * Turns the drag events of a `swipe` controller into pointer scrolling of this element.
 * Touch is left to the browser unless `touch` is set, so native panning and momentum are
 * preserved; the dead zone mirrors the emitting controller's threshold so a short gesture
 * can still be a click.
 */
export default class extends Controller {
    static values = {
        axis: { type: String, default: 'horizontal' },
        sensitivity: { type: Number, default: 3 },
        touch: { type: Boolean, default: false }
    };

    active = false;
    startScrollLeft = 0;
    startScrollTop = 0;
    startX = 0;
    startY = 0;

    axisValueChanged() {
        const axis = this.#axis();

        if (!HORIZONTAL_AXES.has(axis) && !VERTICAL_AXES.has(axis)) {
            console.warn(
                `[drag-scroll] unknown axis "${this.axisValue}" — nothing will scroll. Expected one of: ` +
                [...new Set([...HORIZONTAL_AXES, ...VERTICAL_AXES])].join(', ')
            );
        }
    }

    dragStart({ detail }) {
        this.active = this.touchValue || detail.pointerType !== 'touch';
        if (!this.active) return;

        this.startScrollLeft = this.element.scrollLeft;
        this.startScrollTop = this.element.scrollTop;
        this.startX = detail.clientX;
        this.startY = detail.clientY;
    }

    dragScroll({ detail }) {
        if (!this.active) return;

        const axis = this.#axis();
        const sensitivity = Math.max(0, this.sensitivityValue);
        const threshold = Number.isFinite(detail.threshold)
            ? Math.max(0, detail.threshold)
            : DEFAULT_THRESHOLD;

        if (HORIZONTAL_AXES.has(axis)) {
            const deltaX = this.#afterThreshold(this.startX - detail.clientX, threshold);
            this.element.scrollLeft = this.startScrollLeft + deltaX * sensitivity;
        }

        if (VERTICAL_AXES.has(axis)) {
            const deltaY = this.#afterThreshold(this.startY - detail.clientY, threshold);
            this.element.scrollTop = this.startScrollTop + deltaY * sensitivity;
        }
    }

    dragEnd() {
        this.active = false;
    }

    #axis() {
        return this.axisValue.toLowerCase();
    }

    #afterThreshold(delta, threshold) {
        return Math.sign(delta) * Math.max(0, Math.abs(delta) - threshold);
    }
}
