import "./commercial.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whenLoaderReveals } from "@shared/scripts/loader-sync.js";

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

function initHeroTemplateAnimation() {
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

  if (downBtn) {
    downBtn.addEventListener("click", () => {
      const nextSection = document.querySelector(".commercial-parallax");
      nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

function initCommercialParallax() {
  const section = document.querySelector(".commercial-parallax");
  if (!section) return;

  const bgImg = section.querySelector(".commercial-parallax__bg-img");
  const card = section.querySelector(".commercial-parallax__card");

  if (bgImg) {
    gsap.set(bgImg, { willChange: "transform" });

    gsap.fromTo(
      bgImg,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      },
    );
  }

  if (card) {
    const isLaptop = window.matchMedia("(min-width: 1024px)").matches;
    gsap.set(card, { willChange: "transform" });

    gsap.fromTo(
      card,
      { yPercent: isLaptop ? 9 : 4, rotateX: 3, z: -30 },
      {
        yPercent: isLaptop ? -9 : -4,
        rotateX: -2,
        z: 20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      },
    );
  }
}

function initCommercialCardsAnimation() {
  const cards = gsap.utils.toArray(".commercial-cards .commercial-cards__item");
  if (!cards.length) return;

  gsap.set(cards, { opacity: 0, y: 56, scale: 0.96 });

  gsap.to(cards, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 1.1,
    ease: "power2.out",
    stagger: 0.18,
    scrollTrigger: {
      trigger: ".commercial-cards",
      start: "top 82%",
      once: true,
    },
  });
}

function initCommercialCardsParallax() {
  const section = document.querySelector(".commercial-cards");
  if (!section) return;

  const bgImg = section.querySelector(".commercial-cards__bg img");
  if (bgImg) {
    gsap.set(bgImg, { willChange: "transform" });

    gsap.fromTo(
      bgImg,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      },
    );
  }

  const cards = gsap.utils.toArray(".commercial-cards__item");
  if (!cards.length) return;

  const isLaptop = window.matchMedia("(min-width: 1024px)").matches;
  const range = isLaptop ? 5 : 2.5;

  cards.forEach((card, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    gsap.set(card, { willChange: "transform" });

    gsap.fromTo(
      card,
      { yPercent: -range * direction },
      {
        yPercent: range * direction,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      },
    );
  });
}

function initCommercial() {
  gsap.registerPlugin(ScrollTrigger);

  initHeroTemplateAnimation();
  initTitleWrapAnimations();
  initCommercialParallax();
  initCommercialCardsAnimation();
  initCommercialCardsParallax();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCommercial);
} else {
  initCommercial();
}
