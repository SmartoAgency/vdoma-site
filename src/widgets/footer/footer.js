import "./footer.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const selectors = [".footer-contacts__list>*", ".footer-map"];

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
          start: "top 90%",
          toggleActions: "play none none none",
          // will-change допомагає уникнути "мигтіння" при роботі з clip-path
          onEnter: () => (el.style.willChange = "transform, clip-path"),
          onComplete: () => (el.style.willChange = "auto"),
        },
      },
    );
  });
});
