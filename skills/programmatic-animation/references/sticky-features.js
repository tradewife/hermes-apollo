// Osmo Free Resource: sticky-features
// Source: https://www.osmo.supply/resource/sticky-features
// Preview: https://sticky-features-resource.webflow.io/

// Dependencies:
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
//   <script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>

gsap.registerPlugin(ScrollTrigger);

function initStickyFeatures(root){
  const wraps = Array.from((root || document).querySelectorAll("[data-sticky-feature-wrap]"));
  if(!wraps.length) return;

  wraps.forEach(w => {
    const visualWraps = Array.from(w.querySelectorAll("[data-sticky-feature-visual-wrap]"));
    const items = Array.from(w.querySelectorAll("[data-sticky-feature-item]"));
    const progressBar = w.querySelector("[data-sticky-feature-progress]");
    
    if (visualWraps.length !== items.length) {
      console.warn("[initStickyFeatures] visualWraps and items count do not match:", {
        visualWraps: visualWraps.length,
        items: items.length,
        wrap: w
      });
    }
    
    const count = Math.min(visualWraps.length, items.length);
    if(count < 1) return;

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DURATION = rm ? 0.01 : 0.75; // If user prefers reduced motion, reduce duration
    const EASE = "power4.inOut";
    const SCROLL_AMOUNT = 0.9; // % of scroll used for step transitions

    const getTexts = el => Array.from(el.querySelectorAll("[data-sticky-feature-text]"));

    if(visualWraps[0]) gsap.set(visualWraps[0], { clipPath: "inset(0% round 0.75em)" });
    gsap.set(items[0], { autoAlpha: 1 });

    let currentIndex = 0;

    // Transition Function
    function transition(fromIndex, toIndex){
      if(fromIndex === toIndex) return;
      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      
      if(fromIndex < toIndex){
        tl.to(visualWraps[toIndex], { 
          clipPath: "inset(0% round 0.75em)",
          duration: DURATION,
          ease: EASE
        }, 0);
      } else {
        tl.to(visualWraps[fromIndex], { 
          clipPath: "inset(50% round 0.75em)",
          duration: DURATION,
          ease: EASE
        }, 0);
      }
      animateOut(items[fromIndex]);
      animateIn(items[toIndex]);
    }

    // Fade out text content items
    function animateOut(itemEl){
      const texts = getTexts(itemEl);
      gsap.to(texts, {
        autoAlpha: 0,
        y: -30,
        ease: "power4.out",
        duration: 0.4,
        onComplete: () => gsap.set(itemEl, { autoAlpha: 0 })
      });
    }

    // Reveal incoming text content items
    function animateIn(itemEl){
      const texts = getTexts(itemEl);
      gsap.set(itemEl, { autoAlpha: 1 });
      gsap.fromTo(texts, {
        autoAlpha: 0, 
        y: 30
      }, {
        autoAlpha: 1,
        y: 0,
        ease: "power4.out",
        duration: DURATION,
        stagger: 0.1
      });
    }

    const steps = Math.max(1, count - 1);

    ScrollTrigger.create({
      trigger: w,
      start: "center center",
      end: () => `+=${steps * 100}%`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const p = Math.min(self.progress, SCROLL_AMOUNT) / SCROLL_AMOUNT;
        let idx = Math.floor(p * steps + 1e-6);
        idx = Math.max(0, Math.min(steps, idx));
        
        gsap.to(progressBar,{
        	scaleX: p,
          ease: "none"
        })

        if (idx !== currentIndex) {
          transition(currentIndex, idx);
          currentIndex = idx;
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () =>{
  initStickyFeatures();
})

const lenis = new Lenis({
  autoRaf: true,
});


/* === CSS === */
/* Webflow Designer resets to show hidden content: */
.wf-design-mode .sticky-features__text-list{ overflow: auto; max-height: 45em; gap: 2em; justify-content:flex-start;}
.wf-design-mode .sticky-features__text-item{ position: relative; }
.wf-design-mode [data-sticky-feature-item]{ visibility: visible; }

/* Show only 1st items on live site */
[data-sticky-feature-visual-wrap]:first-of-type{ clip-path: inset(0% round 0.75em); }
[data-sticky-feature-item]:first-of-type{ visibility: visible; }
