import "./news.scss";

// function initNews() {

// };

// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', initNews);
// } else {
//   initNews();
// }

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";
import { whenLoaderReveals } from "../../shared/scripts/loader-sync.js";

gsap.registerPlugin(ScrollTrigger);

const newsFunctional = () => {
  const newsSection = document.querySelector(".news");
  const newsList = document.querySelector(".news__list");
  const cards = Array.from(document.querySelectorAll(".news-card"));
  const loadMoreBtnWrap = document.querySelector(".load-more-btn-wrap");
  const loadMoreBtn = document.querySelector(".load-more-btn");
  const btnText = loadMoreBtn?.querySelector("span");

  if (!newsList || cards.length === 0 || !loadMoreBtn) return;

  const getStep = () => (window.innerWidth >= 1024 ? 3 : 3);
  let currentShown = getStep();

  const checkBtnPersistence = () => {
    if (cards.length <= getStep()) {
      loadMoreBtnWrap.style.display = "none";
    } else {
      loadMoreBtnWrap.style.display = "flex";
    }
  };

  const updateVisibility = (isInitial = false) => {
    const newlyAdded = [];

    cards.forEach((card, index) => {
      if (index < currentShown) {
        if (card.style.display === "none" || isInitial) {
          card.style.display = "flex";
          if (!isInitial) newlyAdded.push(card);
        }
      } else {
        card.style.display = "none";
      }
    });

    // Lenis кешує висоту сторінки — після зміни display примусово перерахувати
    requestAnimationFrame(() => {
      window.lenis?.resize();
      ScrollTrigger.refresh(true);
    });

    if (newlyAdded.length > 0) {
      gsap.fromTo(
        newlyAdded,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          clearProps: "all",
        },
      );
    }

    if (currentShown >= cards.length) {
      btnText.textContent = "Згорнути";
      document.querySelector(".load-more-btn svg").style.transform = "rotate(180deg)";
      loadMoreBtn.classList.add("is-full");
    } else {
      btnText.textContent = "Завантажити ще";
      document.querySelector(".load-more-btn svg").style.transform = "rotate(0deg)";
      loadMoreBtn.classList.remove("is-full");
    }
  };

  loadMoreBtn.addEventListener("click", () => {
    const step = getStep();

    if (currentShown >= cards.length) {
      // 1. Повертаємо початкову кількість
      currentShown = step;

      // 2. Використовуємо Lenis для скролу вгору
      // window.lenis — це стандартне ім'я змінної, де лежить екземпляр Lenis
      if (window.lenis) {
        window.lenis.scrollTo(newsSection, {
          offset: -50, // Невеликий відступ зверху
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Стандартний Lenis easing
        });
      } else {
        // Fallback якщо Lenis не ініціалізовано
        newsSection.scrollIntoView({ behavior: "smooth" });
      }

      // 3. Оновлюємо видимість ПІСЛЯ початку скролу або з невеликою затримкою
      setTimeout(() => {
        updateVisibility();
      }, 100);
    } else {
      currentShown += step;
      updateVisibility();
    }
  });

  window.addEventListener("resize", () => {
    checkBtnPersistence();
    if (currentShown <= 9) {
      currentShown = getStep();
      updateVisibility(true);
    }
  });

  checkBtnPersistence();
  updateVisibility(true);
};

newsFunctional();
initNewsHeroAnimation();
initMagneticButtons();

function initMagneticButtons() {
  const magnetics = document.querySelectorAll(".news-card__magnetic");

  magnetics.forEach((magnetic) => {
    const btn = magnetic.querySelector(".news-card__btn");
    if (!btn) return;

    magnetic.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;
      const dx = (e.clientX - btnCenterX) * 0.35;
      const dy = (e.clientY - btnCenterY) * 0.35;
      const maxOffset = 10;
      const x = Math.max(-maxOffset, Math.min(maxOffset, dx));
      const y = Math.max(-maxOffset, Math.min(maxOffset, dy));
      gsap.to(btn, { x, y, duration: 0.35, ease: "power2.out" });
    });

    magnetic.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    });
  });
}

function initNewsHeroAnimation() {
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

  const btnDown = document.querySelector(".hero-template .btn-down");
  const newsSection = document.querySelector(".news__list");
  if (btnDown && newsSection) {
    btnDown.addEventListener("click", () => {
      newsSection.scrollIntoView({ behavior: "smooth", block: "start" });
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
    tl.to(edgeSvgs, { opacity: 1, scale: 1, duration: 1.45 }, endAt - 1.45);
  }

  if (svgGroups.length) {
    tl.to(
      svgGroups,
      {
        opacity: (index) => targetGroupOpacity[index],
        duration: 1.2,
        stagger: { each: 0.02, from: "start" },
      },
      endAt - 1.2,
    );
  }

  if (videoInner) {
    tl.to(videoInner, { opacity: 1, scale: 1, duration: 1, clearProps: "transform" }, endAt - 1);
  }

  if (shadowImg) {
    tl.to(shadowImg, { opacity: 1, y: 0, duration: 0.65 }, endAt - 0.72);
  }

  if (title) {
    tl.to(title, { opacity: 1, y: 0, rotate: 0, duration: 0.8 }, endAt - 0.8);
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
    tl.to(downBtn, { opacity: 1, y: 0, duration: 0.55 }, endAt - 0.55);
  }
}
