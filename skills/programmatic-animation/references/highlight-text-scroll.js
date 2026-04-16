// Osmo Free Resource: highlight-text-on-scroll
// Source: https://www.osmo.supply/resource/highlight-text-on-scroll
// Preview: https://highlight-text-on-scroll-resource.webflow.io/

// Dependencies:
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
//   <script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>

gsap.registerPlugin(ScrollTrigger, SplitText)
  
function initHighlightText(){

  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
  
  splitHeadingTargets.forEach((heading) => {
  	//console.log(heading)
    
    // Define your default ScrollTrigger start point
    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%"
    
    // Default ScrollTrigger end point
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%"
    
    // Opacity of each letter before they start animating
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2
    
    // Lower value here means a smoother reveal, feel free to test!
    const staggerValue =  heading.getAttribute("data-highlight-stagger") || 0.1
    
    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        // use a context to collect up all the animations
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading, 
              start: scrollStart,
              end: scrollEnd,
            }
          })
          tl.from(self.chars,{
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          })
        });
        return ctx; // return our animations so GSAP can clean them up when onSplit fires
      }
    });    
  })
  
}

document.addEventListener("DOMContentLoaded", () =>{
  initHighlightText()
})

// Lenis (with GSAP Scroltrigger)
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {lenis.raf(time * 1000);});
gsap.ticker.lagSmoothing(0);
