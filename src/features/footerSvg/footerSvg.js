import "./footerSvg.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

// Initialize footer SVG staggered animation
function initFooterSvgAnimation() {
  const svg = document.querySelector("svg[data-footer-svg]");

  if (!svg) return;

  // Group consecutive loose <path> children into <g> wrappers so every
  // visual symbol cluster is a single <g> element we can stagger.
  const children = Array.from(svg.childNodes).filter((n) => n.nodeType === Node.ELEMENT_NODE);

  let pendingPaths = [];

  const flushPaths = () => {
    if (pendingPaths.length === 0) return;
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pendingPaths[0].before(wrapper);
    pendingPaths.forEach((p) => wrapper.appendChild(p));
    pendingPaths = [];
  };

  children.forEach((el) => {
    if (el.tagName === "path") {
      pendingPaths.push(el);
    } else {
      flushPaths();
      // el is already a <g> — nothing to do
    }
  });
  flushPaths();

  // All symbol clusters are now <g> direct children of the SVG
  const groups = Array.from(svg.querySelectorAll(":scope > g"));

  if (groups.length === 0) return;

  // Start all groups invisible
  gsap.set(groups, { opacity: 0, scale: 0.92, transformOrigin: "center" });

  ScrollTrigger.create({
    trigger: svg,
    start: "top 90%",
    once: true,
    onEnter: () => {
      gsap.to(groups, {
        opacity: (i, el) => (el.hasAttribute("opacity") ? Number(el.getAttribute("opacity")) : 1),
        scale: 1,
        duration: 0.7,
        ease: "power2.out",
        stagger: {
          each: 0.04,
          from: "random",
        },
      });
    },
  });
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFooterSvgAnimation);
} else {
  initFooterSvgAnimation();
}

export { initFooterSvgAnimation };
