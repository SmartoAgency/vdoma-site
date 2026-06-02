import "./single-news.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";
import { whenLoaderReveals } from "../../shared/scripts/loader-sync.js";

gsap.registerPlugin(ScrollTrigger);
document.addEventListener("DOMContentLoaded", () => {
  // Pre-hide hero elements immediately so they're invisible behind the loader
  gsap.set(".header", { y: -100, opacity: 0 });
  gsap.set(".btn-back", { y: -50, scale: 1.1, opacity: 0 });
  gsap.set("h1", { y: 30, opacity: 0, clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set(".single-news__date-wrap", { y: 40, opacity: 0 });

  const tl = gsap.timeline({
    paused: true,
    defaults: {
      ease: "power2.out",
      duration: 1,
    },
  });

  // 1. Анімація Header (зверху вниз)
  tl.to(".header", { y: 0, opacity: 1, duration: 1 }, 0);

  // 2. Кнопка "Назад" + заголовок
  tl.to(".btn-back", { y: 0, scale: 1, opacity: 1, duration: 1 }, "<");
  tl.to(
    "h1",
    { y: 0, opacity: 1, duration: 0.6, clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath" },
    "-=0.6",
  );

  // 3. Дата
  tl.to(".single-news__date-wrap", { y: 0, opacity: 1, duration: 0.6, stagger: 0.2 }, "-=0.8");

  whenLoaderReveals().then(() => tl.play());

  initNewsSlider();
  initMagneticButtons();

  function initMagneticButtons() {
    const magnetics = document.querySelectorAll(".news-card__magnetic");
    magnetics.forEach((magnetic) => {
      const btn = magnetic.querySelector(".news-card__btn");
      if (!btn) return;
      magnetic.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.35;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.35;
        const x = Math.max(-10, Math.min(10, dx));
        const y = Math.max(-10, Math.min(10, dy));
        gsap.to(btn, { x, y, duration: 0.35, ease: "power2.out" });
      });
      magnetic.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  function initNewsSlider() {
    const slider = document.querySelector(".news-slider");
    if (!slider) return;

    const track = slider.querySelector(".news-slider__track");
    const slides = Array.from(slider.querySelectorAll(".news-slider__slide"));
    const prevBtn = slider.querySelector(".news-slider__nav--prev");
    const nextBtn = slider.querySelector(".news-slider__nav--next");
    const counterCurrent = slider.querySelector(".news-slider__counter-current");
    const counterTotal = slider.querySelector(".news-slider__counter-total");

    if (!slides.length || !track) return;

    const total = slides.length;
    let current = 0;
    const pad = (n) => String(n).padStart(2, "0");

    counterTotal.textContent = pad(total);
    counterCurrent.textContent = pad(1);

    const goTo = (index) => {
      current = ((index % total) + total) % total;
      gsap.to(track, {
        x: `-${current * 100}%`,
        duration: 0.7,
        ease: "power2.inOut",
      });
      counterCurrent.textContent = pad(current + 1);
    };

    prevBtn.addEventListener("click", () => goTo(current - 1));
    nextBtn.addEventListener("click", () => goTo(current + 1));

    // Swipe support
    let startX = 0;
    const trackWrap = slider.querySelector(".news-slider__track-wrap");
    trackWrap.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
    });
    trackWrap.addEventListener("pointerup", (e) => {
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    });
  }

  const selectors = [".single-news__content>*"];

  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);

    elements.forEach((el) => {
      if (el.classList.contains("news-slider")) return;
      // Анімація через clip-path (імітація overflow: hidden)
      gsap.fromTo(
        el,
        {
          yPercent: 100,
          // Обрізаємо елемент знизу (маска закрита)
          clipPath: "inset(0% 0% 100% 0%)",
        },
        {
          yPercent: 0,
          clipPath: "inset(0% 0% 0% 0%)", // Маска повністю відкрита
          duration: 1,

          ease: "power3.out", // Більш плавний фініш для преміального вигляду
          scrollTrigger: {
            trigger: el,
            start: "top 100%",
            toggleActions: "play none none none",
            // will-change допомагає уникнути "мигтіння" при роботі з clip-path
            onEnter: () => (el.style.willChange = "transform, clip-path"),
            onComplete: () => (el.style.willChange = "auto"),
          },
        },
      );
    });
  });
});
