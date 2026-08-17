import { Controller } from '@hotwired/stimulus';
import { useWindowFocus } from 'stimulus-use';

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

    // Index normalization when the position moves past the slide range boundaries
    get loopedSlideIndex() {
        const totalSlides = this.countSlide;
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
        this.element.querySelectorAll('[data-slideshow-clone]').forEach(clone => clone.remove());
        this.selectedSlide = 1;
        this.isAnimation = false;

        this.countSlide = this.slideTargets.length;

        this.applyAspectFromFirstSlide();

        if(this.dynamicAspectValue) {
            this.slideImages = this.slideTargets.map(slide => slide.querySelector('img'));
            this.element.style.transition = 'aspect-ratio 500ms ease-in-out';
        }

        if(this.hasPaginationItemTarget && this.countSlide > 1){
            this.paginationItemClassSelect = this.paginationItemTargets[0].getAttribute('class');
            this.paginationItemClass = this.paginationItemTargets[1].getAttribute('class');

            // clone the first and the last slide for loop sliding
            this.slideTargets[this.countSlide - 1].insertAdjacentElement('afterend', this.createSlideClone(this.slideTargets[0]));
            this.slideTargets[0].insertAdjacentElement('beforebegin', this.createSlideClone(this.slideTargets[this.countSlide - 1]));

            // on reconnect the wrapper may still carry the transition — reposition without animation
            this.transformOff();
            this.wrapperTarget.style.transform='translateX(-100%)';
        }

        if(this.autoplayIntervalValue) {
            this.handlerAutoplayStart();
            this.element.addEventListener('mouseenter', this.handlerAutoplayStop);
            this.element.addEventListener('mouseleave', this.handlerAutoplayStart);
            // pause autoplay while the window is out of focus (focus()/unfocus() below)
            useWindowFocus(this);
        }
        this.wrapperTarget.addEventListener('transitionend', this.handlerAnimationEnd);
    }

    // A clone is a utility copy used for loop sliding: not a slide target (it does not shift
    // slideTargets/countSlide), marked with data-slideshow-clone for cleanup on reconnect.
    // Other attributes and nested controllers' targets are kept intact, so behaviors like
    // image-loading placeholders keep working on the clone.
    createSlideClone(slide) {
        const clone = slide.cloneNode(true);
        clone.removeAttribute('data-slideshow-target');
        clone.setAttribute('data-slideshow-clone', '');

        const img = clone.querySelector('img');
        if(img) {
            img.removeAttribute('fetchpriority');
            img.setAttribute('loading', 'lazy');
        }

        return clone;
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
        this.firstSlideImg?.removeEventListener('load', this.applyAspect);
        this.wrapperTarget.removeEventListener('transitionend', this.handlerAnimationEnd);
        if(this.dynamicAspectValue) {
            // Clean up inline state so no stale references/styles survive a reconnect (Turbo morphing).
            this.element.style.transition = '';
            this.slideImages = null;
        }
        if(this.autoplayIntervalValue) {
            this.handlerAutoplayStop();
            this.element.removeEventListener('mouseenter', this.handlerAutoplayStop);
            this.element.removeEventListener('mouseleave', this.handlerAutoplayStart);
        }
    }

    next() {
        this.selectedSlide++;
        this.showCurrentSlide();
    }

    prev() {
        this.selectedSlide--;
        this.showCurrentSlide();
    }
    dragEnd({ detail: { distanceX }}) {
        if(Math.abs(distanceX) < 30){
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
        this.wrapperTarget.style.transition = 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)';
    }

    go(event) {
        this.selectedSlide = event.params.n;
        this.showCurrentSlide();
    }

    showCurrentSlide() {
        if(this.isAnimation) {
            this.handlerAnimationEnd();
        }

        if(this.autoplayIntervalValue) {
            this.handlerAutoplayStart();
        }

        requestAnimationFrame(() => {
            this.isAnimation = true;
            // Write the aspect and the transform in the same frame, so the container height
            // animates in sync with the shift.
            if(this.dynamicAspectValue) {
                this.applyAspectForCurrentSlide();
            }
            this.transformOn();
            this.wrapperTarget.style.transform = `translateX(${-1*(this.selectedSlide) * 100}%)`;
        });

        if(this.hasPaginationItemTarget && this.paginationItemClassSelect && this.paginationItemClass){
            this.paginationItemTargets.forEach(item => {
                item.setAttribute('class', this.paginationItemClass);
            });

            const currentPaginationItem = this.paginationItemTargets[(this.loopedSlideIndex - 1)];
            if (currentPaginationItem) {
                currentPaginationItem.setAttribute('class', this.paginationItemClassSelect);
            }
        }
    }
}
