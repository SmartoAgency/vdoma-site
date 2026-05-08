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

  ScrollTrigger.create({
    trigger: ".single-news",
    start: "bottom bottom",
    end: "bottom top",
    pin: true, // "Приклеюємо" блок
    pinSpacing: false, // Наступний блок ігнорує простір і наїжджає
  });

  const selectors = [".single-news__content>*"];

  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);

    elements.forEach((el) => {
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
