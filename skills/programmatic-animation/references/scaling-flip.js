// Osmo Free Resource: scaling-element-on-scroll-gsap-flip
// Source: https://www.osmo.supply/resource/scaling-element-on-scroll-gsap-flip
// Preview: https://scaling-element-on-scroll-gsap-flip-resource.webflow.io/

// Dependencies:
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/Flip.min.js"></script>
//   <script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>

gsap.registerPlugin(ScrollTrigger, Flip);

function initFlipOnScroll() {
  let wrapperElements = document.querySelectorAll("[data-flip-element='wrapper']");
  let targetEl = document.querySelector("[data-flip-element='target']");

  let tl;
  function flipTimeline() {
    if (tl) {
      tl.kill();
      gsap.set(targetEl, { clearProps: "all" });
    }
    
    // Use the first and last wrapper elements for the scroll trigger.
    tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperElements[0],
        start: "center center",
        endTrigger: wrapperElements[wrapperElements.length - 1],
        end: "center center",
        scrub: 0.25
      }
    });
    
    // Loop through each wrapper element.
    wrapperElements.forEach(function(element, index) {
      let nextIndex = index + 1;
      if (nextIndex < wrapperElements.length) {
        let nextWrapperEl = wrapperElements[nextIndex];
        // Calculate vertical center positions relative to the document.
        let nextRect = nextWrapperEl.getBoundingClientRect();
        let thisRect = element.getBoundingClientRect();
        let nextDistance = nextRect.top + window.pageYOffset + nextWrapperEl.offsetHeight / 2;
        let thisDistance = thisRect.top + window.pageYOffset + element.offsetHeight / 2;
        let offset = nextDistance - thisDistance;
        // Add the Flip.fit tween to the timeline.
        tl.add(
          Flip.fit(targetEl, nextWrapperEl, {
            duration: offset,
            ease: "none"
          })
        );
      }
    });
  }

  flipTimeline();

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      flipTimeline();
    }, 100);
  });
}

// Initialize Scaling Elements on Scroll (GSAP Flip)
document.addEventListener('DOMContentLoaded', function() {
  initFlipOnScroll();
});

// Lenis (with GSAP Scroltrigger)
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {lenis.raf(time * 1000);});
gsap.ticker.lagSmoothing(0);
