import "./advantages.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whenLoaderReveals } from "../../shared/scripts/loader-sync.js";

function initAdvantages() {
  gsap.registerPlugin(ScrollTrigger);

  initAboutHeroAnimation();
  initTitleWrapAnimations();
  initAdvantageAnimations();

  const btnDown = document.querySelector(".hero-template .btn-down");
  const advantageSection = document.querySelector(".advantage-section");
  if (btnDown && advantageSection) {
    btnDown.addEventListener("click", () => {
      advantageSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function initAboutHeroAnimation() {
  const hero = document.querySelector(".hero-template");
  if (!hero) return;

  const topSvg = hero.querySelector(".top-svg");
  const bottomSvg = hero.querySelector(".bottom-svg");
  const svgGroups = hero.querySelectorAll(".top-svg g, .bottom-svg g");
  const videoInner = hero.querySelector(".svg-decor__video-wrap");
  const shadowImg = hero.querySelector(".shadow-img");
  const title = hero.querySelector(".title-wrap h1");
  const handText = hero.querySelector(".title-wrap .home-svg-to-write");
  const downBtn = hero.querySelector(".btn-down");

  const edgeSvgs = [topSvg, bottomSvg].filter(Boolean);
  if (edgeSvgs.length) {
    gsap.set(edgeSvgs, { opacity: 0, scale: 1.08, transformOrigin: "50% 50%" });
  }

  const targetGroupOpacity = Array.from(svgGroups, (group) => {
    const attrOpacity = group.getAttribute("opacity");
    if (attrOpacity !== null) {
      const parsedAttr = Number.parseFloat(attrOpacity);
      if (Number.isFinite(parsedAttr)) return parsedAttr;
    }

    const styleOpacity = group.style.opacity;
    if (styleOpacity) {
      const parsedStyle = Number.parseFloat(styleOpacity);
      if (Number.isFinite(parsedStyle)) return parsedStyle;
    }

    const computed = Number.parseFloat(getComputedStyle(group).opacity);
    return Number.isFinite(computed) ? computed : 1;
  });

  if (svgGroups.length) {
    gsap.set(svgGroups, { opacity: 0 });
  }

  if (videoInner) {
    gsap.set(videoInner, { opacity: 0, scale: 1.1, transformOrigin: "50% 55%" });
  }

  if (shadowImg) {
    gsap.set(shadowImg, { opacity: 0, y: 18 });
  }

  if (title) {
    gsap.set(title, { opacity: 0, y: 34, rotate: -2 });
  }

  if (handText) {
    gsap.set(handText, {
      opacity: 0,
      y: 28,
      clipPath: "inset(0 100% 0 0)",
    });
  }

  if (downBtn) {
    gsap.set(downBtn, { opacity: 0, y: 24 });
  }

  const endAt = 2;
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.out" },
  });

  whenLoaderReveals().then(() => tl.play());

  if (edgeSvgs.length) {
    tl.to(
      edgeSvgs,
      {
        opacity: 1,
        scale: 1,
        duration: 1.45,
      },
      endAt - 1.45,
    );
  }

  if (svgGroups.length) {
    tl.to(
      svgGroups,
      {
        opacity: (index) => targetGroupOpacity[index],
        duration: 1.2,
        stagger: {
          each: 0.02,
          from: "start",
        },
      },
      endAt - 1.2,
    );
  }

  if (videoInner) {
    tl.to(
      videoInner,
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        clearProps: "transform",
      },
      endAt - 1,
    );
  }

  if (shadowImg) {
    tl.to(
      shadowImg,
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
      },
      endAt - 0.72,
    );
  }

  if (title) {
    tl.to(
      title,
      {
        opacity: 1,
        y: 0,
        rotate: 0,
        duration: 0.8,
      },
      endAt - 0.8,
    );
  }

  if (handText) {
    tl.to(
      handText,
      {
        opacity: 1,
        y: 0,
        clipPath: "inset(0 0% 0 0)",
        duration: 0.62,
        clearProps: "clipPath",
      },
      endAt - 0.62,
    );
  }

  if (downBtn) {
    tl.to(
      downBtn,
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
      },
      endAt - 0.55,
    );
  }
}

function animateTitleWrap(titleWrap) {
  const decor = titleWrap.querySelector(".title-decor-svg");
  const quote = titleWrap.querySelector(".section-quote");
  const writeBlock = titleWrap.querySelector(".home-svg-to-write");

  const appearItems = [decor, quote].filter(Boolean);
  if (writeBlock) {
    gsap.set(writeBlock, {
      opacity: 0,
      y: 28,
      clipPath: "inset(0 100% 0 0)",
    });
  }
  if (appearItems.length) {
    gsap.set(appearItems, { opacity: 0, y: 28 });
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: titleWrap,
      start: "top 78%",
      once: true,
    },
  });

  if (appearItems.length) {
    tl.to(appearItems, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
      stagger: 0.16,
    });
  }

  if (writeBlock) {
    tl.to(
      writeBlock,
      {
        opacity: 1,
        y: 0,
        clipPath: "inset(0 0% 0 0)",
        duration: 1.25,
        ease: "power2.out",
        clearProps: "clipPath",
      },
      "<0.08",
    );

    gsap.to(writeBlock, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: {
        trigger: titleWrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });
  }
}

function initTitleWrapAnimations() {
  document.querySelectorAll(".home-about__title-wrap").forEach(animateTitleWrap);
}

function initAdvantageAnimations() {
  const advantageBlock = document.querySelector(".advantage-block");
  if (!advantageBlock) return;
  const isWideDesktop = window.matchMedia("(min-width: 1600px)").matches;

  const blockTriggerRange = isWideDesktop
    ? { start: "top 94%", end: "top 40%" }
    : { start: "top 88%", end: "top 36%" };

  gsap.set(advantageBlock, {
    scaleX: 0.86,
    yPercent: 14,
    borderRadius: "200px",
    transformOrigin: "50% 100%",
    force3D: true,
  });

  gsap.to(advantageBlock, {
    scaleX: 1,
    yPercent: 0,
    borderRadius: "40px",
    ease: "none",
    scrollTrigger: {
      trigger: advantageBlock,
      start: blockTriggerRange.start,
      end: blockTriggerRange.end,
      scrub: 1,
    },
  });

  const items = gsap.utils.toArray(".advantage-list .advantage-item");
  if (items.length < 2) return;

  const coveredState = isWideDesktop
    ? {
        scale: 0.88,
        y: 38,
        opacity: 0.62,
        filter: "brightness(0.58)",
      }
    : {
        scale: 0.94,
        y: 18,
        opacity: 0.78,
        filter: "brightness(0.75)",
      };

  const triggerRange = isWideDesktop
    ? { start: "top 94%", end: "top 38%" }
    : { start: "top 86%", end: "top 42%" };

  items.forEach((item, index) => {
    if (index === items.length - 1) return;

    const nextItem = items[index + 1];

    gsap.fromTo(
      item,
      {
        scale: 1,
        y: 0,
        opacity: 1,
        filter: "brightness(1)",
      },
      {
        ...coveredState,
        ease: "none",
        scrollTrigger: {
          trigger: nextItem,
          start: triggerRange.start,
          end: triggerRange.end,
          scrub: 1,
        },
      },
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdvantages);
} else {
  initAdvantages();
}
