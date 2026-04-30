import "./single-news.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);
document.addEventListener("DOMContentLoaded", () => {
  // Реєструємо ScrollTrigger, якщо він знадобиться для інших блоків

  const tl = gsap.timeline({
    defaults: {
      ease: "power2.out", // Плавне сповільнення в кінці
      duration: 1,
    },
  });

  // Робимо елементи видимими перед початком
  tl.set(".header, .btn-back, h1, .single-news__date-wrap", {
    visibility: "visible",
  });

  // 1. Анімація Header (зверху вниз)
  tl.from(
    ".header",
    {
      y: -100,
      opacity: 0,
      duration: 1,
    },
    0,
  ); // Починаємо в 0 секунд

  // 2. Анімація головного зображення (зверху вниз + легкий scale)
  tl.from(
    ".btn-back",
    {
      y: -50,
      scale: 1.1,
      opacity: 0,
      duration: 1,
    },
    "<",
  ); // Починаємо з невеликою затримкою від старту
  tl.from(
    "h1",
    {
      y: 30,
      opacity: 0,
      duration: 0.6,

      clipPath: "inset(0% 0% 100% 0%)",
    },
    "-=0.6",
  );

  // 3. Анімація лівого блоку (Заголовок та кнопка "Гортай")
  // Використовуємо stagger: 0.2 для послідовної появи
  tl.from(
    ".single-news__date-wrap",
    {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
    },
    "-=0.8",
  ); // Починаємо раніше, ніж закінчиться попередня анімація

  // 4. Анімація правого блоку з текстом та декоративною іконкою

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
