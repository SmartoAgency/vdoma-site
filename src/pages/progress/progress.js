import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from "swiper";
import { Scrollbar } from "swiper/modules";
import "./progress.scss";

gsap.registerPlugin(ScrollTrigger);

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
    touchStartPreventDefault: false,
    touchStartForcePreventDefault: false,
    passiveListeners: false,
    scrollbar: {
      el: progressScrollbar,
      draggable: true,
      dragSize: 220,
      snapOnRelease: false,
    },
    breakpoints: {
      768: {
        spaceBetween: 60,
        scrollbar: {
          el: progressScrollbar,
          draggable: true,
          dragSize: 280,
          snapOnRelease: false,
        },
      },
      1200: {
        spaceBetween: 60,
        scrollbar: {
          el: progressScrollbar,
          draggable: true,
          dragSize: 340,
          snapOnRelease: false,
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeProgress);
} else {
  initHomeProgress();
}
