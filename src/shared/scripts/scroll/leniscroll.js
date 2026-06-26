// eslint-disable-next-line import/no-extraneous-dependencies
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
// Define a variable that will store the Lenis smooth scrolling object
let lenis;
// let scrollLockCount = 0;

// const isIOSDevice =
//   /iP(ad|hone|od)/.test(window.navigator.userAgent) ||
//   (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
// const isSafariEngine =
//   /Safari/.test(window.navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(window.navigator.userAgent);
// const isIOSSafari = isIOSDevice && isSafariEngine;

// let isScrollLockedForNative = false;

// const lockNativeScroll = () => {
//   if (isScrollLockedForNative) return;
//   // document.documentElement.style.overflow = "hidden";
//   // document.body.style.overflow = "hidden";
//   isScrollLockedForNative = true;
// };

// const unlockNativeScroll = () => {
//   if (!isScrollLockedForNative) return;
//   // document.documentElement.style.overflow = "";
//   // document.body.style.overflow = "";
//   isScrollLockedForNative = false;
// };

let isInited = false;
export const initSmoothScrolling = () => {
  // Instantiate the Lenis object with specified properties
  if (isInited) return lenis;

  // if (isIOSSafari) {
  //   window.addEventListener("stop-scroll", lockNativeScroll);
  //   window.addEventListener("start-scroll", unlockNativeScroll);
  //   window.lenis = null;
  //   isInited = true;
  //   return null;
  // }

  lenis = new Lenis({
    lerp: 0.1,
    infinite: false, // Lower values create a smoother scroll effect
    smoothWheel: true, // Enables smooth scrolling for mouse wheel events
  });

  // Update ScrollTrigger each time the user scrolls
  lenis.on("scroll", () => ScrollTrigger.update());
  window.lenis = lenis;

  const freezeGestures = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const freezeKeyboardScroll = (e) => {
    const blockedKeys = ["Space", "PageUp", "PageDown", "End", "Home", "ArrowUp", "ArrowDown"];
    if (!blockedKeys.includes(e.code)) return;

    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const lockScroll = () => {
    // if (scrollLockCount === 0) {
    lenis?.stop();

    window.addEventListener("wheel", freezeGestures, { passive: false, capture: true });
    window.addEventListener("touchmove", freezeGestures, { passive: false, capture: true });
    window.addEventListener("pointermove", freezeGestures, { passive: false, capture: true });
    window.addEventListener("keydown", freezeKeyboardScroll, { passive: false, capture: true });

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // }

    // scrollLockCount += 1;
  };

  const unlockScroll = () => {
    // if (scrollLockCount === 0) return;

    // scrollLockCount -= 1;
    // if (scrollLockCount > 0) return;

    lenis?.start();

    window.removeEventListener("wheel", freezeGestures, { capture: true });
    window.removeEventListener("touchmove", freezeGestures, { capture: true });
    window.removeEventListener("pointermove", freezeGestures, { capture: true });
    window.removeEventListener("keydown", freezeKeyboardScroll, { capture: true });

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  };

  window.addEventListener("stop-scroll", lockScroll);
  window.addEventListener("start-scroll", unlockScroll);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Anchor");
      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);
      console.log(target);
      if (target) {
        setTimeout(() => {
          lenis.scrollTo(target, {
            offset: -10,
            duration: 1, // в секундах
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
          });
        }, 10);
      }
    });
  });
  // Define a function to run at each animation frame
  const scrollFn = (time) => {
    lenis.raf(time); // Run Lenis' requestAnimationFrame method
    requestAnimationFrame(scrollFn); // Recursively call scrollFn on each frame
  };
  // Start the animation frame loop
  requestAnimationFrame(scrollFn);
  isInited = true;
  return lenis;
};

initSmoothScrolling();
