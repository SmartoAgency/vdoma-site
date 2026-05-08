import "./about.scss";
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";
import { whenLoaderReveals } from "../../shared/scripts/loader-sync.js";

gsap.registerPlugin(ScrollTrigger);

function initAboutHeroAnimation() {
  const hero = document.querySelector(".hero-template");
  if (!hero) return;

  const topSvg = hero.querySelector(".top-svg");
  const bottomSvg = hero.querySelector(".bottom-svg");
  const svgGroups = hero.querySelectorAll(".top-svg g, .bottom-svg g");
  const videoWrap = hero.querySelector(".svg-decor__video");
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

initAboutHeroAnimation();
initAboutComplexAnimations();
initAboutKeyAnimation();

function initAboutComplexAnimations() {
  const section = document.querySelector(".about-complex");
  if (!section) return;

  const quote = section.querySelector(".section-quote");
  const contentBlock = section.querySelector(".about-complex__content-block");
  const img = section.querySelector(".about-complex__img");

  // — entrance animations —
  if (quote) {
    gsap.set(quote, { opacity: 0, y: 40 });
    gsap.to(quote, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: quote,
        start: "top 82%",
        once: true,
      },
    });
  }

  if (contentBlock) {
    gsap.set(contentBlock, { opacity: 0, y: 50 });
    gsap.to(contentBlock, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: "power2.out",
      scrollTrigger: {
        trigger: contentBlock,
        start: "top 85%",
        once: true,
      },
    });
  }

  // — parallax on image (overflow:hidden on section hides overshoot) —
  if (img) {
    gsap.fromTo(
      img,
      { yPercent: -20 },
      {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      },
    );
  }
}

function initAboutKeyAnimation() {
  const section = document.querySelector(".about-key");
  if (!section) return;

  const startKey = section.querySelector(".start-key");
  const startQuote = section.querySelector(".start-key__quote");
  const middleKey = section.querySelector(".middle-key");
  const firstImageWrap = section.querySelector(".about-key__img-wrap .key-img-wrap-1");

  const secondImageSection = section.querySelector(".about-key__img-wrap-2");
  const endQuote = section.querySelector(".end-key__quote");
  const endQuoteTitle = section.querySelector(".end-key__quote .section-quote");
  const cards = section.querySelectorAll(".about-key__cards-wrap .about-key-card");

  const enterCutout = section.querySelector(".svg-key .keyhole-cutout");
  const exitCutout = section.querySelector(".svg-key-oppend .keyhole-cutout");
  const enterSvgLayer = section.querySelector(".svg-key");
  const exitSvgLayer = section.querySelector(".svg-key-oppend");
  const enterSvg = section.querySelector(".svg-key .keyhole-svg");
  const exitSvg = section.querySelector(".svg-key-oppend .keyhole-svg");
  const gradients = section.querySelectorAll(".gradient-key");

  if (!startKey || !startQuote || !middleKey || !firstImageWrap || !secondImageSection || !endQuote) return;

  if (enterCutout) {
    gsap.set(enterCutout, {
      transformBox: "view-box",
      transformOrigin: "50% 50%",
      svgOrigin: "960 540",
      x: 0,
      y: 0,
      scale: 1,
    });
  }

  if (enterSvg) {
    gsap.set(enterSvg, {
      scale: 1,
      transformOrigin: "50% 50%",
    });
  }

  if (exitCutout) {
    gsap.set(exitCutout, {
      transformBox: "view-box",
      transformOrigin: "50% 50%",
      scale: 15,
    });
  }

  if (exitSvgLayer) {
    gsap.set(exitSvgLayer, {
      scale: 1.35,
      autoAlpha: 1,
      transformOrigin: "50% 50%",
    });
  }

  if (exitSvg) {
    gsap.set(exitSvg, {
      scale: 1,
      transformOrigin: "50% 50%",
    });
  }

  gsap.set(startQuote, {
    autoAlpha: 1,
    scale: 1,
    filter: "blur(0px)",
    transformOrigin: "50% 50%",
  });

  if (endQuoteTitle) {
    endQuoteTitle.style.setProperty("--end-key-progress", "0");
  }

  if (gradients.length) {
    gsap.set(gradients, { autoAlpha: 0.8 });
  }

  if (cards.length) {
    const firstCard = cards[0];
    const secondCard = cards[1];

    if (firstCard) {
      gsap.fromTo(
        firstCard,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: firstCard,
            start: "top bottom",
            end: "+=140%",
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        },
      );
    }

    if (secondCard) {
      gsap.fromTo(
        secondCard,
        { yPercent: -16 },
        {
          yPercent: 16,
          ease: "none",
          scrollTrigger: {
            trigger: secondCard,
            start: "top bottom",
            end: "+=90%",
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        },
      );
    }
  }

  const enterTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: startKey,
      start: "bottom bottom",
      end: "+=120%",
      scrub: true,
      pin: startQuote,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  if (enterCutout) {
    enterTimeline.to(
      enterCutout,
      {
        x: 0,
        y: 0,
        scale: 15,
        svgOrigin: "960 540",
        ease: "none",
      },
      0,
    );
  }

  if (enterSvg) {
    enterTimeline.to(
      enterSvg,
      {
        scale: 1.35,
        ease: "none",
      },
      0,
    );
  }

  enterTimeline.to(
    startQuote,
    {
      autoAlpha: 0,
      scale: 1.08,
      filter: "blur(16px)",
      ease: "none",
    },
    0,
  );

  if (gradients.length) {
    enterTimeline.to(
      gradients,
      {
        autoAlpha: 0,
        ease: "none",
      },
      0,
    );
  }

  if (enterSvgLayer) {
    ScrollTrigger.create({
      trigger: startKey,
      start: "bottom bottom",
      end: "+=120%",
      pin: enterSvgLayer,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });
  }

  ScrollTrigger.create({
    trigger: firstImageWrap,
    start: "top top",
    endTrigger: middleKey,
    end: "top top",
    pin: true,
    pinSpacing: false,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });

  const exitTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: secondImageSection,
      start: "top top+=1",
      end: "+=110%",
      scrub: 0.9,
      pin: secondImageSection,
      anticipatePin: 3,
      pinReparent: true,
      pinType: "transform",
      preventOverlaps: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (!endQuoteTitle) return;
        endQuoteTitle.style.setProperty("--end-key-progress", self.progress.toFixed(4));
      },
    },
  });

  if (exitCutout) {
    exitTimeline.to(
      exitCutout,
      {
        scale: 1,
        ease: "none",
      },
      0,
    );
  }

  if (exitSvgLayer) {
    exitTimeline.to(
      exitSvgLayer,
      {
        scale: 1,
        autoAlpha: 1,
        ease: "none",
      },
      0,
    );
  }

  if (gradients.length) {
    exitTimeline.to(
      gradients,
      {
        autoAlpha: 0.8,
        ease: "none",
      },
      0,
    );
  }
}
