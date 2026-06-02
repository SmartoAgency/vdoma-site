import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from "swiper";
import { Navigation, Autoplay, Scrollbar } from "swiper/modules";
import i18next from "i18next";
import "@shared/scripts/liquid-glass-animation/liquid-glass-animation";
import { whenLoaderReveals } from "@shared/scripts/loader-sync.js";
import "./home.scss";
import { initLazyMap } from "@/widgets/mapBox/mapInit";
import mapBoxConfig from "@/widgets/mapBox/map-config.json";

// Реєструємо плагін
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.normalizeScroll(true);

// Допомагає уникнути стрибків при закріпленні елементів
ScrollTrigger.config({
  ignoreMobileResize: true,
  anticipatePin: 1,
});

const MAP_I18N_DICTIONARY = {
  uk: {
    "Map.location.type.main": "Головна локація",
    "Map.location.type.poi": "Точка інтересу",
    "Map.location.type.club": "Клуб",
    "Map.location.type.terminal": "Пошта",
    "Map.location.type.parking": "СТО та АЗС",
    "Map.location.type.shop": "Магазин",
    "Map.location.type.walking": "Пішохідна зона",
    "Map.location.type.entertainment": "Розваги",
    "Map.location.type.underground": "Громадський транспорт",
    "Map.location.type.zoo": "Зоопарк",
    "Map.location.type.street": "Вулиця",
    "Map.location.type.ports": "Порти",
    "Map.location.type.sport": "Спорт",
    "Map.location.type.marinas": "Марини",
    "Map.location.type.school": "Навчальні заклади",
    "Map.location.type.lake": "Озеро",
    "Map.location.type.workout": "Фітнес",
    "Map.location.type.atm": "Банкомат",
    "Map.location.type.tennis": "Теніс",
    "Map.location.type.pharmacy": "Медичні заклади",
    "Map.location.type.restaurant": "Ресторани",
    "Map.location.showFilter": "Показати фільтр",
    "Map.location.closeFilter": "Закрити фільтр",
    "Map.location.enableZoom": "Увімкнути Zoom",
    "Map.location.disableZoom": "Вимкнути Zoom",
    "Map.location.reCenter": "До головної точки",
    "Map.location.driving": "Авто",
    "Map.location.cycling": "Велосипед",
    "Map.location.walking": "Пішки",
    "Map.location.openInGoogleMaps": "Відкрити в Google Maps",
    "Map.location.noPhotos": "Фото відсутні",
    "Map.location.hours": "год",
    "Map.location.minutes": "хв",
  },
  en: {
    "Map.location.type.main": "Main location",
    "Map.location.type.poi": "Point of interest",
    "Map.location.type.club": "Club",
    "Map.location.type.terminal": "Post office",
    "Map.location.type.parking": "Service stations",
    "Map.location.type.shop": "Shop",
    "Map.location.type.walking": "Walking area",
    "Map.location.type.entertainment": "Entertainment",
    "Map.location.type.underground": "Public transport",
    "Map.location.type.zoo": "Zoo",
    "Map.location.type.street": "Street",
    "Map.location.type.ports": "Ports",
    "Map.location.type.sport": "Sport",
    "Map.location.type.marinas": "Marinas",
    "Map.location.type.school": "Schools",
    "Map.location.type.lake": "Lake",
    "Map.location.type.workout": "Workout",
    "Map.location.type.atm": "ATM",
    "Map.location.type.tennis": "Tennis",
    "Map.location.type.pharmacy": "Pharmacy",
    "Map.location.type.restaurant": "Restaurant",
    "Map.location.showFilter": "Show filter",
    "Map.location.closeFilter": "Close filter",
    "Map.location.enableZoom": "Enable zoom",
    "Map.location.disableZoom": "Disable zoom",
    "Map.location.reCenter": "Back to main point",
    "Map.location.driving": "Driving",
    "Map.location.cycling": "Cycling",
    "Map.location.walking": "Walking",
    "Map.location.openInGoogleMaps": "Open in Google Maps",
    "Map.location.noPhotos": "No photos available",
    "Map.location.hours": "h",
    "Map.location.minutes": "min",
  },
};

function createMapI18n() {
  const htmlLang = document.documentElement.lang || "uk";
  const i18nLang = i18next?.resolvedLanguage || i18next?.language || "";
  const lang = (i18nLang || htmlLang).toLowerCase().startsWith("en") ? "en" : "uk";
  const dictionary = MAP_I18N_DICTIONARY[lang];

  return {
    t(key) {
      const external = typeof i18next?.t === "function" ? i18next.t(key, { defaultValue: "" }) : "";

      if (typeof external === "string" && external && external !== key) {
        return external;
      }

      return dictionary[key] || MAP_I18N_DICTIONARY.en[key] || key;
    },
  };
}

// ===== HERO СЕКЦІЯ =====
function initHero() {
  const hero = document.querySelector(".home-hero");
  if (!hero) return;

  // Анімація входу для заголовку та тексту
  const title = hero.querySelector(".home-hero__title");
  const subtitle = hero.querySelector(".home-hero__subtitle");
  const btn = hero.querySelector(".home-hero__btn");
  const mapCard = hero.querySelector(".home-hero__map");

  gsap.set([title, subtitle, btn, mapCard], { opacity: 0, y: 30 });

  const heroTl = gsap
    .timeline({ paused: true })
    .to(title, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    })
    .to(
      subtitle,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4",
    )
    .to(
      btn,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4",
    )
    .to(
      mapCard,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4",
    );

  whenLoaderReveals().then(() => heroTl.play());

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "+=100%",
    pin: true,
    pinSpacing: false,
  });

  const overlay = hero.querySelector(".home-hero__overlay");
  if (overlay) {
    gsap.to(overlay, {
      opacity: 0.8,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }
}

// ===== TITLE-WRAP АНІМАЦІЯ (універсальна для всіх .home-about__title-wrap) =====
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

function initAdvantageItemsEqualHeight() {
  const list = document.querySelector(".advantage-list");
  if (!list) return;

  const items = Array.from(list.querySelectorAll(".advantage-item"));
  if (!items.length) return;

  const syncHeights = () => {
    items.forEach((item) => {
      item.style.minHeight = "";
    });

    const maxHeight = items.reduce((max, item) => Math.max(max, item.offsetHeight), 0);
    if (!maxHeight) return;

    items.forEach((item) => {
      item.style.minHeight = `${maxHeight}px`;
    });

    ScrollTrigger.refresh();
  };

  let resizeRaf = null;
  const onResize = () => {
    if (resizeRaf !== null) {
      cancelAnimationFrame(resizeRaf);
    }

    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      syncHeights();
    });
  };

  syncHeights();
  window.addEventListener("resize", onResize);
  window.addEventListener("load", syncHeights, { once: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(syncHeights);
  }
}

function initHeroMapLiquidGlass() {
  const mapCard = document.querySelector(".home-hero__map");
  if (!mapCard) return;

  const supportsBackdropFilter =
    CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)");
  const hasFilterDefs =
    document.getElementById("header-liquid-distort") &&
    document.getElementById("header-liquid-distort-strong");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldEnable = Boolean(supportsBackdropFilter && hasFilterDefs && !prefersReducedMotion);
  mapCard.classList.toggle("is-liquid-ready", shouldEnable);
}

// ===== ADVANTAGES ANIMATION =====
function initAdvantageAnimations() {
  const advantageBlock = document.querySelector(".advantage-block");
  if (!advantageBlock) return;
  const advantageTrigger = advantageBlock.closest(".advantage-section") || advantageBlock;
  const isWideDesktop = window.matchMedia("(min-width: 1600px)").matches;
  const isMobileOrTablet = window.matchMedia("(max-width: 1023px)").matches;

  const blockTriggerRange = isWideDesktop
    ? { start: "top 94%", end: "top 40%" }
    : { start: "top 100%", end: "top 36%" };

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
      trigger: advantageTrigger,
      start: blockTriggerRange.start,
      end: blockTriggerRange.end,
      scrub: 1,
    },
  });

  const blockExitRange = isWideDesktop
    ? { start: "bottom 88%", end: "bottom 46%" }
    : { start: "bottom 92%", end: "bottom 50%" };

  gsap.fromTo(
    advantageBlock,
    {
      scaleX: 1,
      yPercent: 0,
      borderRadius: "40px",
    },
    {
      scaleX: 0.86,
      yPercent: -12,
      borderRadius: "200px",

      ease: "none",
      overwrite: "auto",
      scrollTrigger: {
        trigger: advantageTrigger,
        start: blockExitRange.start,
        end: blockExitRange.end,
        scrub: 1,
      },
    },
  );

  const items = gsap.utils.toArray(".advantage-list .advantage-item");
  if (items.length < 2) return;
  const advantageMain = advantageBlock.querySelector(".advantage-main");
  const coveredState = isWideDesktop
    ? {
        scale: 0.88,
        y: 38,

        filter: "brightness(0.58)",
      }
    : {
        scale: 0.8,
        y: 18,

        filter: "brightness(0.58)",
      };

  const triggerRange = isWideDesktop
    ? { start: "top 98%", end: "top 34%" }
    : { start: "top 92%", end: "top 38%" };

  if (advantageMain && isMobileOrTablet) {
    gsap.fromTo(
      advantageMain,
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
          trigger: items[0],
          start: triggerRange.start,
          end: triggerRange.end,
          scrub: 1,
        },
      },
    );
  }

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

// ===== LOCATION ANIMATION =====
function initLocationAnimations() {
  const locationContent = document.querySelector(".home-location__content");
  if (locationContent) {
    const isWideDesktop = window.matchMedia("(min-width: 1600px)").matches;
    const triggerRange = isWideDesktop
      ? { start: "top 94%", end: "top 40%" }
      : { start: "top 88%", end: "top 36%" };
    const blockExitRange = isWideDesktop
      ? { start: "bottom 88%", end: "bottom 46%" }
      : { start: "bottom 92%", end: "bottom 50%" };

    gsap.set(locationContent, {
      scaleX: 0.86,
      yPercent: 14,
      borderRadius: "200px",
      transformOrigin: "50% 100%",
      force3D: true,
    });

    gsap.to(locationContent, {
      scaleX: 1,
      yPercent: 0,
      borderRadius: "40px",
      ease: "none",
      scrollTrigger: {
        trigger: locationContent,
        start: triggerRange.start,
        end: triggerRange.end,
        scrub: 1,
      },
    });

    gsap.fromTo(
      locationContent,
      {
        scaleX: 1,
        yPercent: 0,
        borderRadius: "40px",
      },
      {
        scaleX: 0.86,
        yPercent: -12,
        borderRadius: "200px",
        ease: "none",
        overwrite: "auto",
        scrollTrigger: {
          trigger: locationContent,
          start: blockExitRange.start,
          end: blockExitRange.end,
          scrub: 1,
        },
      },
    );
  }

  const locationDecor = document.querySelectorAll(".home-location .map-wrap > svg");
  locationDecor.forEach((svgEl) => {
    let decorParts = svgEl.querySelectorAll(":scope > g");
    if (!decorParts.length) {
      decorParts = svgEl.querySelectorAll("g");
    }
    if (!decorParts.length) return;

    const targetOpacities = Array.from(decorParts, (part) => {
      const inlineAttrOpacity = part.getAttribute("opacity");
      if (inlineAttrOpacity !== null) {
        const parsedAttr = Number.parseFloat(inlineAttrOpacity);
        if (Number.isFinite(parsedAttr)) return parsedAttr;
      }

      const inlineStyleOpacity = part.style.opacity;
      if (inlineStyleOpacity) {
        const parsedStyle = Number.parseFloat(inlineStyleOpacity);
        if (Number.isFinite(parsedStyle)) return parsedStyle;
      }

      const computedOpacity = Number.parseFloat(getComputedStyle(part).opacity);
      return Number.isFinite(computedOpacity) ? computedOpacity : 1;
    });

    gsap.set(decorParts, {
      opacity: 0,
      willChange: "opacity",
    });

    gsap.to(decorParts, {
      opacity: (index) => targetOpacities[index],
      duration: 0.55,
      ease: "power2.out",
      stagger: {
        each: 0.04,
        from: "random",
      },
      scrollTrigger: {
        trigger: svgEl,
        start: "top 90%",
        once: true,
      },
    });
  });
}

// ===== HOME GALLERY ANIMATION =====
function initHomeGalleryAnimations() {
  const gallery = document.querySelector(".home-gallery");
  if (!gallery) return;

  const title = gallery.querySelector(".home-gallery__title");
  const heading = title?.querySelector("h2");
  const decor = title?.querySelector(".title-decor-svg");
  const writeBlock = title?.querySelector(".home-svg-to-write");

  const photosWrap = gallery.querySelector(".home-gallery__photos-wrap");
  const photos = gsap.utils.toArray(".home-gallery__photo");
  const barWrap = gallery.querySelector(".home-gallery__bar-wrap");
  const barProgress = gallery.querySelector(".home-gallery__bar-progress");

  const bottomWrap = gallery.querySelector(".home-gallery__bottom-wrap");
  const bottomLeft = gallery.querySelector(".home-gallery__bottom-left");
  const bottomRight = gallery.querySelector(".home-gallery__bottom-right");

  if (heading) gsap.set(heading, { autoAlpha: 0, y: 90 });
  if (decor) gsap.set(decor, { autoAlpha: 0, y: 110 });
  if (writeBlock) {
    gsap.set(writeBlock, {
      autoAlpha: 0,
      clipPath: "inset(0 100% 0 0)",
    });
  }

  const titleTl = gsap.timeline({
    scrollTrigger: {
      trigger: gallery,
      start: "top 50%",
      end: "top 8%",
      scrub: 0.9,
    },
  });

  if (heading) {
    titleTl.to(heading, {
      autoAlpha: 1,
      y: 0,
      ease: "none",
      duration: 0.45,
    });
  }

  if (decor) {
    titleTl.to(
      decor,
      {
        autoAlpha: 1,
        y: 0,
        ease: "none",
        duration: 0.35,
      },
      ">-0.08",
    );
  }

  if (writeBlock) {
    titleTl.to(
      writeBlock,
      {
        autoAlpha: 1,
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        duration: 0.4,
        clearProps: "clipPath",
      },
      ">-0.04",
    );

    gsap.to(writeBlock, {
      yPercent: 7,
      ease: "none",
      scrollTrigger: {
        trigger: title,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.1,
      },
    });
  }

  if (barWrap) {
    gsap.set(barWrap, { yPercent: 130, autoAlpha: 0 });
    gsap.to(barWrap, {
      yPercent: 0,
      autoAlpha: 1,
      ease: "none",
      scrollTrigger: {
        trigger: photosWrap || gallery,
        start: "top 96%",
        end: "top 70%",
        scrub: 1,
      },
    });
  }

  if (barProgress) {
    gsap.set(barProgress, { xPercent: -100 });
    gsap.to(barProgress, {
      xPercent: 0,
      ease: "none",
      scrollTrigger: {
        trigger: photosWrap || gallery,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1,
      },
    });
  }

  photos.forEach((photo, index) => {
    let img = photo.querySelector("img");
    let frame = photo.querySelector(".home-gallery__frame");

    if (img && !frame) {
      frame = document.createElement("div");
      frame.className = "home-gallery__frame";
      img.parentNode.insertBefore(frame, img);
      frame.appendChild(img);
    }

    if (frame) {
      img = frame.querySelector("img");
    }

    gsap.fromTo(
      photo,
      {
        autoAlpha: 0,
        y: 90,
        scale: 0.92,
        rotate: index % 2 === 0 ? -1.8 : 1.8,
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        ease: "none",
        scrollTrigger: {
          trigger: photo,
          start: "top 90%",
          end: "top 56%",
          scrub: 1,
        },
      },
    );

    if (img) {
      const fromYOffset = index % 2 === 0 ? -0.8 : -0.5;
      const toYOffset = index % 2 === 0 ? 0.8 : 0.5;
      const fromXOffset = index % 2 === 0 ? -2.6 : 2.6;
      const toXOffset = index % 2 === 0 ? 2.6 : -2.6;

      gsap.fromTo(
        img,
        {
          yPercent: fromYOffset,
          xPercent: fromXOffset,
          scale: 1.08,
        },
        {
          yPercent: toYOffset,
          xPercent: toXOffset,
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: photo,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );
    }
  });

  if (bottomWrap && bottomLeft && bottomRight) {
    gsap.set(bottomWrap, { autoAlpha: 1 });
    gsap.set(bottomLeft, { xPercent: -102 });
    gsap.set(bottomRight, { xPercent: 102 });

    const lastPhoto = photos[photos.length - 1] || photosWrap || gallery;

    const curtainTl = gsap.timeline({
      scrollTrigger: {
        trigger: lastPhoto,
        start: "bottom top",
        end: () => `+=${window.innerHeight * 0.2}`,
        scrub: 1,
        invalidateOnRefresh: true,
        ease: "none",
      },
    });

    curtainTl.to(bottomLeft, {
      xPercent: 0,
      ease: "none",
      duration: 1,
    });

    curtainTl.to(
      bottomRight,
      {
        xPercent: 0,
        ease: "none",
        duration: 1,
      },
      0,
    );
  }
}

// ===== HOME PROGRESS =====
function initHomeProgress() {
  const progressSection = document.querySelector(".home-progress");
  const progressSlider = progressSection?.querySelector(".home-progress__swiper");
  const progressScrollbar = progressSection?.querySelector(".home-progress__scrollbar");

  if (!progressSection || !progressSlider || !progressScrollbar) return;

  const slides = Array.from(progressSection.querySelectorAll(".home-progress__slide"));
  const initialSlide = Math.floor(slides.length / 2);

  const popupRoot = document.createElement("div");
  popupRoot.className = "home-progress-popup";
  popupRoot.innerHTML = `
    <div class="home-progress-popup__backdrop"></div>
    <div class="home-progress-popup__panel" role="dialog" aria-modal="true" aria-label="Звіт будівництва">
      <button class="home-progress-popup__close" type="button" aria-label="Закрити">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
<path d="M0.928711 2.34375L8.58496 10.001L0.928711 17.6592L2.34277 19.0732L9.99902 11.415L17.6562 19.0732L18.3643 18.3662L19.0713 17.6592L11.4131 10.001L19.0713 2.34375L18.3643 1.63672L17.6562 0.929688L9.99902 8.58691L2.34277 0.929688L0.928711 2.34375Z" fill="#27292B"></path>
</svg></button>
      <button class="home-progress-popup__nav home-progress-popup__nav--prev" type="button" aria-label="Попереднє фото">
        <svg xmlns="http://www.w3.org/2000/svg" width="27" height="22" viewBox="0 0 27 22" fill="none">
          <path d="M11.4141 0.707031L1.41406 10.707M1.41406 10.707L11.4141 20.707M1.41406 10.707H26.4141" stroke="#27292B" stroke-width="2"/>
        </svg>
      </button>
      <div class="home-progress-popup__stage">
        <img class="home-progress-popup__image" src="" alt="Звіт будівництва" />
      </div>
      <button class="home-progress-popup__nav home-progress-popup__nav--next" type="button" aria-label="Наступне фото">
      <svg xmlns="http://www.w3.org/2000/svg" width="27" height="22" viewBox="0 0 27 22" fill="none">
  <path d="M15 0.707031L25 10.707M25 10.707L15 20.707M25 10.707H0" stroke="#27292B" stroke-width="2"/>
</svg>
      </button>
      <p class="home-progress-popup__date"></p>
      <p class="home-progress-popup__counter">1 / 1</p>
    </div>
  `;
  document.body.appendChild(popupRoot);

  const popupBackdrop = popupRoot.querySelector(".home-progress-popup__backdrop");
  const popupStage = popupRoot.querySelector(".home-progress-popup__stage");
  const popupImage = popupRoot.querySelector(".home-progress-popup__image");
  const popupDate = popupRoot.querySelector(".home-progress-popup__date");
  const popupCounter = popupRoot.querySelector(".home-progress-popup__counter");
  const popupClose = popupRoot.querySelector(".home-progress-popup__close");
  const popupPrev = popupRoot.querySelector(".home-progress-popup__nav--prev");
  const popupNext = popupRoot.querySelector(".home-progress-popup__nav--next");

  let currentReportImages = [];
  let currentReportDate = "";
  let currentReportIndex = 0;
  let lastOriginPhoto = null;
  let isOpeningPopup = false;

  const getReticleTarget = (photoEl) => photoEl?.closest(".home-progress__slide") || photoEl;

  const animateCaptureSnap = (photoEl) => {
    const reticleTarget = getReticleTarget(photoEl);
    if (!reticleTarget) return;

    gsap.killTweensOf(reticleTarget, "scale");
    gsap.fromTo(
      reticleTarget,
      { scale: 1 },
      {
        scale: 1.04,
        duration: 0.18,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      },
    );
  };

  const animateReticleToCenter = (photoEl) => {
    const reticleTarget = getReticleTarget(photoEl);
    if (!reticleTarget) return;

    gsap.killTweensOf(
      reticleTarget,
      "--progress-dot-top,--progress-dot-bottom,--progress-dot-left,--progress-dot-right,--progress-frame-inset,--progress-reticle-inset,--progress-corner-length",
    );
    gsap.to(reticleTarget, {
      "--progress-dot-top": "50%",
      "--progress-dot-bottom": "50%",
      "--progress-dot-left": "50%",
      "--progress-dot-right": "50%",
      "--progress-corner-length": "10px",
      duration: 0.24,
      ease: "power3.inOut",
    });

    gsap.to(reticleTarget, {
      "--progress-frame-inset": "-22px",
      "--progress-reticle-inset": "-11px",
      duration: 0.28,
      ease: "power2.out",
    });

    gsap.to(reticleTarget, {
      "--progress-frame-inset": "-30px",
      "--progress-reticle-inset": "-14px",
      duration: 0.5,
      ease: "power2.out",
      delay: 0.05,
    });
  };

  const resetReticle = (photoEl) => {
    const reticleTarget = getReticleTarget(photoEl);
    if (!reticleTarget) return;

    gsap.killTweensOf(reticleTarget);
    gsap.to(reticleTarget, {
      "--progress-dot-top": "0%",
      "--progress-dot-bottom": "100%",
      "--progress-dot-left": "0%",
      "--progress-dot-right": "100%",
      "--progress-frame-inset": "-16px",
      "--progress-reticle-inset": "-10px",
      "--progress-corner-length": "18px",
      duration: 0.42,
      ease: "power3.inOut",
    });
  };

  const updatePopupCounter = () => {
    popupCounter.textContent = `${currentReportIndex + 1} / ${currentReportImages.length}`;
  };

  const updatePopupDate = () => {
    if (!popupDate) return;
    popupDate.textContent = currentReportDate;
    popupDate.style.display = currentReportDate ? "inline-flex" : "none";
  };

  const normalizeIndex = (index) => {
    if (!currentReportImages.length) return 0;
    const length = currentReportImages.length;
    return ((index % length) + length) % length;
  };

  const setPopupImage = (index, animate = true) => {
    currentReportIndex = normalizeIndex(index);
    const nextSrc = currentReportImages[currentReportIndex];
    if (!nextSrc) return;

    if (!animate || !popupImage.getAttribute("src")) {
      popupImage.setAttribute("src", nextSrc);
      updatePopupCounter();
      return;
    }

    if (popupImage.getAttribute("src") === nextSrc) {
      updatePopupCounter();
      return;
    }

    popupStage.querySelectorAll(".home-progress-popup__image--crossfade").forEach((node) => node.remove());

    const crossfadeImage = document.createElement("img");
    crossfadeImage.className = "home-progress-popup__image home-progress-popup__image--crossfade";
    crossfadeImage.setAttribute("src", nextSrc);
    crossfadeImage.setAttribute("alt", popupImage.getAttribute("alt") || "Звіт будівництва");
    crossfadeImage.style.position = "absolute";
    crossfadeImage.style.inset = "0";
    crossfadeImage.style.opacity = "0";
    crossfadeImage.style.pointerEvents = "none";
    popupStage.appendChild(crossfadeImage);

    gsap.killTweensOf(popupImage);
    gsap.killTweensOf(crossfadeImage);

    gsap
      .timeline({
        defaults: { duration: 0.34 },
        onComplete: () => {
          popupImage.setAttribute("src", nextSrc);
          popupImage.style.opacity = "1";
          crossfadeImage.remove();
          updatePopupCounter();
        },
      })
      .to(crossfadeImage, { opacity: 1 }, 0);
  };

  const closePopup = () => {
    if (!popupRoot.classList.contains("is-open")) return;

    popupRoot.classList.remove("is-open");
    document.body.classList.remove("progress-popup-open");

    gsap.to(popupBackdrop, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
    });

    if (!lastOriginPhoto || !document.body.contains(lastOriginPhoto)) {
      return;
    }

    const fromRect = popupStage.getBoundingClientRect();
    const toRect = lastOriginPhoto.getBoundingClientRect();
    const clone = popupImage.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = `${fromRect.left}px`;
    clone.style.top = `${fromRect.top}px`;
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.zIndex = "10020";
    clone.style.objectFit = "cover";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "20px";
    document.body.appendChild(clone);

    gsap.to(clone, {
      left: toRect.left,
      top: toRect.top,
      width: toRect.width,
      height: toRect.height,
      borderRadius: 12,
      duration: 0.34,
      ease: "power3.inOut",
      onComplete: () => {
        clone.remove();
      },
    });

    resetReticle(lastOriginPhoto);
  };

  const openPopup = (reportLinks, originPhoto, startIndex = 0, reportDate = "") => {
    currentReportImages = reportLinks.map((link) => link.getAttribute("href")).filter(Boolean);
    if (!currentReportImages.length) return;

    lastOriginPhoto = originPhoto || null;
    currentReportDate = reportDate;
    currentReportIndex = normalizeIndex(startIndex);
    popupImage.setAttribute("src", currentReportImages[currentReportIndex]);
    popupImage.style.opacity = "1";
    updatePopupDate();
    updatePopupCounter();

    popupRoot.classList.add("is-open");
    document.body.classList.add("progress-popup-open");

    if (!originPhoto) {
      gsap.to(popupBackdrop, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(popupImage, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      return;
    }

    const fromRect = originPhoto.getBoundingClientRect();
    const toRect = popupStage.getBoundingClientRect();

    const clone = originPhoto.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = `${fromRect.left}px`;
    clone.style.top = `${fromRect.top}px`;
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.zIndex = "10020";
    clone.style.objectFit = "cover";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "12px";
    clone.style.opacity = "1";
    document.body.appendChild(clone);

    popupImage.style.opacity = "0";

    gsap
      .timeline({
        defaults: { duration: 0.56, ease: "power2.inOut" },
        onComplete: () => {
          popupImage.style.opacity = "1";
          clone.remove();
        },
      })
      .fromTo(popupBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.48 }, 0)
      .to(
        clone,
        {
          left: toRect.left,
          top: toRect.top,
          width: toRect.width,
          height: toRect.height,
          borderRadius: 20,
          duration: 0.5,
        },
        0,
      )
      .to(
        popupImage,
        {
          opacity: 1,
          duration: 0.32,
          ease: "power2.out",
        },
        0.24,
      )
      .to(
        clone,
        {
          opacity: 0,
          duration: 0.32,
          ease: "power2.out",
        },
        0.5,
      );
  };

  const progressSwiper = new Swiper(progressSlider, {
    modules: [Scrollbar],
    centeredSlides: true,
    initialSlide,
    slidesPerView: "auto",
    spaceBetween: 40,
    speed: 680,
    slideToClickedSlide: true,
    watchSlidesProgress: true,
    simulateTouch: true,
    allowTouchMove: true,
    touchStartPreventDefault: true,
    touchStartForcePreventDefault: true,
    passiveListeners: true,
    scrollbar: {
      el: progressScrollbar,
      draggable: true,
      dragSize: 220,
      snapOnRelease: false,
      dragElastic: true,
    },
    breakpoints: {
      768: {
        spaceBetween: 60,
        scrollbar: {
          el: progressScrollbar,
          draggable: true,
          dragSize: 280,
          snapOnRelease: false,
          dragElastic: true,
        },
      },
      1200: {
        spaceBetween: 60,
        scrollbar: {
          el: progressScrollbar,
          draggable: true,
          dragSize: 340,
          snapOnRelease: false,
          dragElastic: true,
        },
      },
    },
  });

  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      const clickedIndex = slides.indexOf(slide);
      if (clickedIndex < 0) return;

      if (clickedIndex !== progressSwiper.activeIndex) {
        progressSwiper.slideTo(clickedIndex);
        return;
      }

      if (isOpeningPopup) {
        return;
      }

      const reportId = slide.dataset.report;
      if (!reportId) return;

      const reportLinks = Array.from(
        progressSection.querySelectorAll(`.home-progress__report-link[data-report-id="${reportId}"]`),
      );
      if (!reportLinks.length) return;

      const activePhoto = slide.querySelector(".home-progress__photo");
      const activeImage = activePhoto?.querySelector("img");
      const activeImagePath = activeImage
        ? new URL(activeImage.currentSrc || activeImage.getAttribute("src"), window.location.href).pathname
        : "";
      const imageUrls = reportLinks
        .map((link) => link.getAttribute("href"))
        .filter(Boolean)
        .map((href) => new URL(href, window.location.href).pathname);
      const startIndex = imageUrls.findIndex((path) => path === activeImagePath);
      const reportDate = slide.querySelector(".home-progress__date")?.textContent?.trim() || "";

      isOpeningPopup = true;
      animateCaptureSnap(activePhoto);
      animateReticleToCenter(activePhoto);

      gsap.delayedCall(0.1, () => {
        openPopup(reportLinks, activePhoto, startIndex >= 0 ? startIndex : 0, reportDate);
        isOpeningPopup = false;
      });
    });
  });

  popupClose?.addEventListener("click", closePopup);
  popupBackdrop?.addEventListener("click", closePopup);
  popupPrev?.addEventListener("click", () => setPopupImage(currentReportIndex - 1));
  popupNext?.addEventListener("click", () => setPopupImage(currentReportIndex + 1));

  document.addEventListener("keydown", (event) => {
    if (!popupRoot.classList.contains("is-open")) return;
    if (event.key === "Escape") closePopup();
    if (event.key === "ArrowLeft") setPopupImage(currentReportIndex - 1);
    if (event.key === "ArrowRight") setPopupImage(currentReportIndex + 1);
  });
}

// ===== HOME-ABOUT PIN =====
function initHomeAboutPin() {
  const homeAbout = document.querySelector(".home-about");
  if (!homeAbout) return;

  // Отримуємо висоту scroll-sequence для коректного pinSpacing
  const scrollSequence = homeAbout.querySelector(".scroll-sequence");
  const sequenceHeight = scrollSequence ? scrollSequence.offsetHeight : 0;

  ScrollTrigger.create({
    trigger: homeAbout,
    start: "bottom bottom",
    end: sequenceHeight > 0 ? `+=${sequenceHeight}` : "+=300vh",
    pin: true,
    pinSpacing: false,
  });
}

// ===== SCROLL SEQUENCE (CANVAS) =====

const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const config = {
  frameCount: 80,
  path: (i) => `/comp/${i}.jpg`, // Шлях до фото в public/
  lerpAmount: 0.1, // Плавність догону (0.05 - дуже м'яко, 0.2 - різко)
};

let images = [];
let currentFrame = 0;
let targetFrame = 0;
let requestId = null;

// 1. Налаштування розмірів (Retina)
function setCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
}

// 2. Логіка малювання кадру (Cover)
function drawImage(index) {
  const img = images[Math.round(index)];
  if (!img) return;

  const cw = canvas.width;
  const ch = canvas.height;

  const scale = Math.max(cw / img.width, ch / img.height);
  const x = (cw - img.width * scale) / 2;
  const y = (ch - img.height * scale) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// 3. Постійний цикл анімації (для плавності lerp)
function animate() {
  // Формула плавного догону: Поточне += (Ціль - Поточне) * Коефіцієнт
  const diff = targetFrame - currentFrame;

  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * config.lerpAmount;
    drawImage(currentFrame);
  }

  requestId = requestAnimationFrame(animate);
}

// 4. Оновлення цільового кадру при скролі Lenis
function handleScroll() {
  const container = document.querySelector(".scroll-sequence");
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const totalScrollable = container.offsetHeight - window.innerHeight;

  // Прогрес від 0 до 1 всередині секції
  let progress = -rect.top / totalScrollable;
  progress = Math.max(0, Math.min(1, progress));

  targetFrame = progress * (config.frameCount - 1);
}

// 5. Завантаження зображень
async function preloadImages() {
  const loader = document.querySelector(".scroll-sequence__loader");
  const promises = [];

  for (let i = 0; i < config.frameCount; i++) {
    const img = new Image();
    img.src = config.path(i);
    const p = new Promise((resolve) => {
      img.onload = () => {
        // GPU декодування для усунення лагів
        img.decode().then(() => {
          images[i] = img;
          if (i === 0) drawImage(0);
          resolve();
        });
      };
      img.onerror = resolve; // Пропускаємо биті кадри
    });
    promises.push(p);
  }

  await Promise.all(promises);
  loader?.classList.add("is-hidden");
}

// Ініціалізація
function init() {
  initHero();
  initHeroMapLiquidGlass();
  initHomeAboutPin();
  initTitleWrapAnimations();
  initAdvantageItemsEqualHeight();
  initAdvantageAnimations();
  initHomeGalleryAnimations();
  initLocationAnimations();
  initHomeProgress();
  setCanvasSize();
  preloadImages();

  // Синхронізація з Lenis
  if (typeof lenis !== "undefined") {
    lenis.on("scroll", handleScroll);
  } else {
    // Якщо Lenis не знайдено, використовуємо нативний скрол
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  window.addEventListener("resize", () => {
    setCanvasSize();
    handleScroll();
  });

  // Запуск циклу
  animate();
}

init();

const mapInfo = mapBoxConfig?.map;

initLazyMap({
  selector: "#map",
  accessToken: mapInfo?.mapbox_access_token,
  i18n: createMapI18n(),
  center: mapInfo?.default_coordinates,
  zoom: mapInfo?.default_zoom,
  markers: (mapInfo?.markers || []).map((marker) => ({
    type: marker.type,
    title: marker.title,
    description: marker.description,
    images: marker.images,
    coordinates: marker.coordinates,
    lng: marker.coordinates[1],
    lat: marker.coordinates[0],
  })),
});
