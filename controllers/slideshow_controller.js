import { Controller } from '@hotwired/stimulus';

// Slide-transition duration: the transform and the container aspect-ratio animate with the
// same value, so the height never keeps stretching after the slide has already settled.
const SLIDE_DURATION_MS = 500;

// Clones duplicate content that is already on the page — everything focusable inside them is
// taken out of the tab order.
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

/* stimulusFetch: 'lazy' */
export default class extends Controller {
    static targets = ['wrapper', 'slide', 'paginationItem'];
    static values = {
        autoplayInterval: { type: Number, default: 0 },
        // Recalculate the aspect-ratio for every slide; when disabled it is fixed to the first slide.
        dynamicAspect: { type: Boolean, default: true }
    };

    selectedSlide = 1;
    countSlide = 0;
    intervalAutoplayId = null;
    isAnimation = false;
    isControllerConnected = false;
    paginationItemClassSelect = null;
    paginationItemClass = null;

    // Attribute names follow the identifier the controller was registered under: the same class
    // can be registered as `slideshow`, `banner`, … and a clone must carry that instance's own
    // names, otherwise Stimulus keeps seeing the clones as real slide targets.
    get cloneAttribute() {
        return `data-${this.identifier}-clone`;
    }

    get targetAttribute() {
        return `data-${this.identifier}-target`;
    }

    // Honour the OS "reduce motion" setting: the slide still changes, it just does not animate.
    get prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Index normalization when the position moves past the slide range boundaries
    get loopedSlideIndex() {
        const totalSlides = this.countSlide;
        if(totalSlides < 1) {
            return 1;
        }
        return ((this.selectedSlide - 1) % totalSlides + totalSlides) % totalSlides + 1;
    }

    handlerAnimationEnd = (event = null) => {
        // transitionend bubbles from the wrapper's children (img etc.) and fires for every CSS
        // property — react only to the transform transition of the wrapper itself.
        // A call without an event = forced completion.
        if(event && (event.target !== this.wrapperTarget || event.propertyName !== 'transform')) {
            return;
        }

        this.isAnimation = false;
        // when shifted past the slide range, reposition to the proper edge slide without animation
        if(this.selectedSlide !== this.loopedSlideIndex){
            this.transformOff();
            this.wrapperTarget.style.transform = `translateX(${(this.selectedSlide < 1 ? this.countSlide : 1) * -100}%)`;
            // Commit the snap position with a reflow before re-enabling the transition,
            // otherwise the browser merges both writes and animates from an intermediate point.
            void this.wrapperTarget.offsetWidth;
            this.selectedSlide = this.loopedSlideIndex;
        }
    };

    handlerAutoplayStart = () => {
        // The disabled-autoplay guard is mandatory: this handler can be reached bypassing
        // connect() (focus() from useWindowFocus, mouseleave), and setInterval(fn, 0)
        // would mean non-stop sliding.
        if(!this.autoplayIntervalValue || this.countSlide < 2){
            return;
        }

        if(this.intervalAutoplayId) {
            clearInterval(this.intervalAutoplayId);
        }

        this.intervalAutoplayId = setInterval(() => {
            this.selectedSlide++;
            this.showCurrentSlide();
        }, this.autoplayIntervalValue);
    };

    handlerAutoplayStop = () => {
        if(this.intervalAutoplayId){
            clearInterval(this.intervalAutoplayId);
            this.intervalAutoplayId = null;
        }
    };

    connect() {
        // A Turbo snapshot caches the DOM together with clones from the previous connection —
        // remove them, otherwise they double up on a restore visit and break countSlide.
        this.element.querySelectorAll(`[${this.cloneAttribute}]`).forEach(clone => clone.remove());
        this.isControllerConnected = true;
        this.selectedSlide = 1;
        this.isAnimation = false;

        this.countSlide = this.slideTargets.length;

        this.applyAspectFromFirstSlide();

        if(this.dynamicAspectValue) {
            this.slideImages = this.slideTargets.map(slide => slide.querySelector('img'));
            if(!this.prefersReducedMotion) {
                this.element.style.transition = `aspect-ratio ${SLIDE_DURATION_MS}ms ease-in-out`;
            }
        }

        // Looping rests on the clones alone — pagination is an independent, optional part of
        // the markup and must not decide whether the slideshow can loop.
        if(this.countSlide > 1){
            // clone the first and the last slide for loop sliding
            this.slideTargets[this.countSlide - 1].insertAdjacentElement('afterend', this.createSlideClone(this.slideTargets[0]));
            this.slideTargets[0].insertAdjacentElement('beforebegin', this.createSlideClone(this.slideTargets[this.countSlide - 1]));

            // on reconnect the wrapper may still carry the transition — reposition without animation
            this.transformOff();
            this.wrapperTarget.style.transform='translateX(-100%)';
        }

        this.readPaginationClasses();
        // The dots keep the state of the previous connection (restore visit) — repaint them for
        // the slide actually shown now.
        this.updatePagination();

        if(this.autoplayIntervalValue) {
            this.handlerAutoplayStart();
            this.element.addEventListener('mouseenter', this.handlerAutoplayStop);
            this.element.addEventListener('mouseleave', this.handlerAutoplayStart);
            // pause autoplay while the window is out of focus (focus()/unfocus() below).
            // stimulus-use is an optional peer dependency, so it is pulled in on demand: without
            // it autoplay simply keeps running in a background window, instead of the whole
            // controller failing to load.
            import('stimulus-use')
                .then(({ useWindowFocus }) => {
                    if(this.isControllerConnected) {
                        useWindowFocus(this);
                    }
                })
                .catch(() => {});
        }
        this.wrapperTarget.addEventListener('transitionend', this.handlerAnimationEnd);
    }

    // A clone is a utility copy used for loop sliding: not a slide target (it does not shift
    // slideTargets/countSlide), marked with the clone attribute for cleanup on reconnect.
    // Other attributes and nested controllers' targets are kept intact, so behaviors like
    // image-loading placeholders keep working on the clone.
    createSlideClone(slide) {
        const clone = slide.cloneNode(true);
        clone.removeAttribute(this.targetAttribute);
        clone.setAttribute(this.cloneAttribute, '');

        // The clone repeats a slide that is already on the page: hide it from assistive
        // technology, keep it out of the tab order and drop the ids it copied along, which
        // would otherwise be duplicated in the document.
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        if(clone.matches(FOCUSABLE_SELECTOR)) {
            clone.setAttribute('tabindex', '-1');
        }
        clone.querySelectorAll(FOCUSABLE_SELECTOR).forEach(node => node.setAttribute('tabindex', '-1'));

        const img = clone.querySelector('img');
        if(img) {
            img.removeAttribute('fetchpriority');
            img.setAttribute('loading', 'lazy');
        }

        return clone;
    }

    // The active and the normal look of the dots come from the class attributes of the first two
    // pagination items — but navigation rewrites those very attributes, so on a restore visit
    // (cached Turbo snapshot) the first dot no longer carries the active class. The pair is
    // therefore stored on the element at the first connect and read back from there afterwards;
    // a cached snapshot brings the stored values along with the markup.
    readPaginationClasses() {
        this.paginationItemClassSelect = null;
        this.paginationItemClass = null;

        // Both looks have to be readable: with a single dot there is nothing to compare against.
        if(this.paginationItemTargets.length < 2) {
            return;
        }

        const selectAttribute = `data-${this.identifier}-item-class-select`;
        const normalAttribute = `data-${this.identifier}-item-class`;

        if(!this.element.hasAttribute(selectAttribute)) {
            this.element.setAttribute(selectAttribute, this.paginationItemTargets[0].getAttribute('class') ?? '');
            this.element.setAttribute(normalAttribute, this.paginationItemTargets[1].getAttribute('class') ?? '');
        }

        this.paginationItemClassSelect = this.element.getAttribute(selectAttribute);
        this.paginationItemClass = this.element.getAttribute(normalAttribute);
    }

    updatePagination() {
        if(!this.paginationItemClassSelect || !this.paginationItemClass){
            return;
        }

        this.paginationItemTargets.forEach(item => {
            item.setAttribute('class', this.paginationItemClass);
        });

        this.paginationItemTargets[this.loopedSlideIndex - 1]?.setAttribute('class', this.paginationItemClassSelect);
    }

    // Fallback / self-correction of the server-rendered inline aspect: takes naturalWidth/Height
    // of the first image (available for cross-origin images too) — for the case when server-side
    // dimensions are missing. The load listener fires again when <picture> switches between
    // mobile and desktop sources on resize.
    applyAspectFromFirstSlide() {
        this.firstSlideImg = this.slideTargets[0]?.querySelector('img');
        if(!this.firstSlideImg) {
            return;
        }

        this.applyAspect = () => this.setAspectRatioFromImg(this.firstSlideImg);

        if(this.firstSlideImg.complete) {
            this.applyAspect();
        }
        this.firstSlideImg.addEventListener('load', this.applyAspect);
    }

    setAspectRatioFromImg(img) {
        const { naturalWidth: w, naturalHeight: h } = img;
        if(w && h) {
            this.element.style.aspectRatio = `${w} / ${h}`;
        }
    }

    applyAspectForCurrentSlide() {
        const img = this.slideImages?.[this.loopedSlideIndex - 1];
        if(!img) {
            return;
        }
        if(img.complete) {
            this.setAspectRatioFromImg(img);
        } else {
            img.addEventListener('load', () => {
                // the slide may have been flipped while the image was loading — skip the stale aspect
                if(img === this.slideImages?.[this.loopedSlideIndex - 1]) {
                    this.setAspectRatioFromImg(img);
                }
            }, { once: true });
        }
    }

    focus() {
        this.handlerAutoplayStart();
    }

    unfocus() {
        this.handlerAutoplayStop();
    }

    disconnect() {
        this.isControllerConnected = false;
        this.firstSlideImg?.removeEventListener('load', this.applyAspect);
        // The wrapper can already be gone (a stream or a morph replaced the inner markup) —
        // teardown must not throw on a missing target before the autoplay timer is cleared.
        if(this.hasWrapperTarget) {
            this.wrapperTarget.removeEventListener('transitionend', this.handlerAnimationEnd);
        }
        if(this.dynamicAspectValue) {
            // Clean up inline state so no stale references/styles survive a reconnect (Turbo morphing).
            this.element.style.transition = '';
            this.slideImages = null;
        }
        // Unconditional: the value can change between connect and disconnect, while stopping an
        // autoplay that never started — and removing listeners that were never added — is a no-op.
        this.handlerAutoplayStop();
        this.element.removeEventListener('mouseenter', this.handlerAutoplayStop);
        this.element.removeEventListener('mouseleave', this.handlerAutoplayStart);
    }

    next() {
        this.selectedSlide++;
        this.showCurrentSlide();
    }

    prev() {
        this.selectedSlide--;
        this.showCurrentSlide();
    }
    // The swipe controller settles every gesture with dragEnd and names the direction it
    // recognised in `detail.swipe`. Anything the slideshow does not navigate on — a vertical
    // swipe, a drag too short to count as one — has to be snapped back, otherwise the track
    // stays parked at the offset written by dragging() with its transition still off.
    dragEnd({ detail }) {
        if(detail?.swipe !== 'swipeLeft' && detail?.swipe !== 'swipeRight'){
            this.showCurrentSlide();
        }
    }

    dragging({ detail: { distanceX }}) {
        const offset = this.selectedSlide * this.wrapperTarget.offsetWidth;
        this.wrapperTarget.style.transform = `translateX(-${(offset - distanceX)}px)`;
    }

    // The sliding animation is driven by an inline transition, so the markup needs no
    // framework-specific utility classes on the wrapper.
    transformOff() {
        this.wrapperTarget.style.transition = '';
    }
    transformOn() {
        // Reduced motion: the transition stays off, so the slide changes instantly.
        this.wrapperTarget.style.transition = this.prefersReducedMotion
            ? ''
            : `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    }

    go(event) {
        this.selectedSlide = event.params.n;
        this.showCurrentSlide();
    }

    showCurrentSlide() {
        // Without a second slide there are no clones, so any shift would park the track on empty
        // space — the position stays pinned to the only slide.
        if(this.countSlide < 2) {
            this.selectedSlide = 1;
            return;
        }

        if(this.isAnimation) {
            this.handlerAnimationEnd();
        }

        if(this.autoplayIntervalValue) {
            this.handlerAutoplayStart();
        }

        // No animation to ride through the edge clone — normalize the index up front and jump
        // straight to the target slide.
        if(this.prefersReducedMotion) {
            this.selectedSlide = this.loopedSlideIndex;
        }

        // Raised before the frame is scheduled: two navigations landing in the same frame must
        // not both skip the forced completion above and step twice past the edge clone.
        this.isAnimation = true;
        requestAnimationFrame(() => {
            // Write the aspect and the transform in the same frame, so the container height
            // animates in sync with the shift.
            if(this.dynamicAspectValue) {
                this.applyAspectForCurrentSlide();
            }
            this.transformOn();
            this.wrapperTarget.style.transform = `translateX(${-1*(this.selectedSlide) * 100}%)`;
        });

        this.updatePagination();
    }
}
