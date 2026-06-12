import "./location.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import i18next from "i18next";
import { whenLoaderReveals } from "@shared/scripts/loader-sync.js";
import { initLazyMap } from "@/widgets/mapBox/mapInit";
import mapBoxConfig from "@/widgets/mapBox/map-config.json";

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
    "Map.location.enableZoom": "Розблокувати",
    "Map.location.disableZoom": "Заблокувати",
    "Map.location.zoomDesktop": "Zoom",
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
    "Map.location.enableZoom": "Enable",
    "Map.location.disableZoom": "Disable",
    "Map.location.zoomDesktop": "Zoom",
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
      const locationSection = document.querySelector(".home-location");
      locationSection?.scrollIntoView({ behavior: "smooth", block: "start" });
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

function initLocationMap() {
  const mapTarget = document.querySelector("#map");
  if (!mapTarget) return;

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
}

function initLocation() {
  gsap.registerPlugin(ScrollTrigger);

  initHeroTemplateAnimation();
  initTitleWrapAnimations();
  initLocationAnimations();
  initLocationMap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLocation);
} else {
  initLocation();
}
