import "./about.scss";
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const swiperComfort = new Swiper(".swiper-comfort", {
  modules: [Navigation, Pagination],
  slidesPerView: 1.1,
  spaceBetween: 20,
  speed: 800,
  // Навігація працює для обох наборів кнопок (моб і десктоп),
  // якщо у них однакові дата-атрибути
  navigation: {
    nextEl: "[data-comfort-next]",
    prevEl: "[data-comfort-prev]",
  },
  // Адаптивність
  breakpoints: {
    1024: {
      slidesPerView: "auto",
      direction: "vertical", // Стає вертикальним
      autoHeight: false,
      navigation: {
        nextEl: "[data-comfort-laptop-next]",
        prevEl: "[data-comfort-laptop-prev]",
      }, // Важливо: для вертикального краще фіксована висота
    },
  },
  on: {
    init: function (swiper) {
      updateText(swiper, true, ".about-comfort");
    },
    slideChange: function (swiper) {
      updateText(swiper, false, ".about-comfort");
    },
  },
});

function updateText(swiper, isInit, containerSelector) {
  const activeSlide = swiper.slides[swiper.activeIndex];
  const title = activeSlide.dataset.title;
  const text = activeSlide.dataset.text;
  const container = document.querySelector(containerSelector);
  const titleEl = document.querySelector(`${containerSelector}__text-wrap h3`);
  const descEl = document.querySelector(`${containerSelector}__text-wrap p`);
  const counterEl = document.querySelector(`${containerSelector}__counter`);

  // Оновлення лічильника
  const current = (swiper.activeIndex + 1).toString().padStart(2, "0");
  const total = swiper.slides.length.toString().padStart(2, "0");
  counterEl.textContent = `${current} / ${total}`;

  if (isInit) {
    titleEl.textContent = title;
    descEl.textContent = text;
  } else {
    // Анімація GSAP
    gsap
      .timeline()
      .to([titleEl, descEl], {
        opacity: 0,
        y: 15,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          titleEl.textContent = title;
          descEl.textContent = text;
        },
      })
      .to([titleEl, descEl], {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
  }
}

const swiperCommercial = new Swiper(".swiper-commercial", {
  modules: [Navigation, Pagination],
  slidesPerView: 1.1,
  spaceBetween: 20,
  speed: 800,
  // Навігація працює для обох наборів кнопок (моб і десктоп),
  // якщо у них однакові дата-атрибути
  navigation: {
    nextEl: "[data-commercial-next]",
    prevEl: "[data-commercial-prev]",
  },
  // Адаптивність
  breakpoints: {
    1024: {
      slidesPerView: "auto",
      direction: "vertical", // Стає вертикальним
      autoHeight: false,
      navigation: {
        nextEl: "[data-commercial-laptop-next]",
        prevEl: "[data-commercial-laptop-prev]",
      }, // Важливо: для вертикального краще фіксована висота
    },
  },
  on: {
    init: function (swiper) {
      updateText(swiper, true, ".about-commercial");
    },
    slideChange: function (swiper) {
      updateText(swiper, false, ".about-commercial");
    },
  },
});

document.addEventListener("DOMContentLoaded", () => {
  // Реєструємо ScrollTrigger, якщо він знадобиться для інших блоків

  const tl = gsap.timeline({
    defaults: {
      ease: "power2.out", // Плавне сповільнення в кінці
      duration: 1.2,
    },
  });

  // Робимо елементи видимими перед початком
  tl.set(".header, .home-location__img-block, .home-location__block", {
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
    ".home-location__img-block",
    {
      y: -50,
      scale: 1.1,
      opacity: 0,
      duration: 1.5,
    },
    0.2,
  ); // Починаємо з невеликою затримкою від старту

  // 3. Анімація лівого блоку (Заголовок та кнопка "Гортай")
  // Використовуємо stagger: 0.2 для послідовної появи
  tl.from(
    ".home-location__block > *",
    {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
      clipPath: "inset(0% 0% 100% 0%)",
    },
    "-=0.8",
  ); // Починаємо раніше, ніж закінчиться попередня анімація

  // 4. Анімація правого блоку з текстом та декоративною іконкою
  tl.from(
    ".home-hero__text-block > *",
    {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      clipPath: "inset(0% 0% 100% 0%)",
    },
    "-=0.6",
  );

  ScrollTrigger.create({
    trigger: ".home-location",
    start: "bottom bottom",
    end: "bottom top",
    pin: true, // "Приклеюємо" блок
    pinSpacing: false, // Наступний блок ігнорує простір і наїжджає
  });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".home-hero__bg",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    })
    .to(".home-location__img-block img", {
      yPercent: -10, // Ефект паралаксу
      ease: "none",
    })
    .to(
      ".home-hero__bg",
      {
        opacity: 1,
        ease: "none",
      },
      "<",
    );

  // const bannerSection = document.querySelector("#section_2.banner");
  // const bannerImg = bannerSection.querySelector(".banner__img-wrap img");

  // // 1. АНІМАЦІЯ ВІДДАЛЕННЯ (Scale 1.2 -> 1)
  // // Використовуємо fromTo, щоб гарантувати старт з 1.2
  // gsap.fromTo(
  //   bannerImg,
  //   { scale: 1.2 },
  //   {
  //     scale: 1,
  //     ease: "none",
  //     scrollTrigger: {
  //       trigger: bannerSection,
  //       start: "top bottom",
  //       end: "bottom top",
  //       scrub: true,
  //     },
  //   },
  // );

  // Заголовок: поява знизу з легким нахилом

  const selectors = [
    ".home-advantages>h2",
    ".home-advantages>p",
    ".about-comfort>h2",
    ".section-title",
    ".home-location__subblock h2",
    ".slogan__img-wrap ",
    ".slogan__text",
    ".home-location__img-wrap img",
    ".home-location__text-wrap p",

    ".about-comfort__text-wrap>h3",
    ".about-comfort__text-wrap>p",
    ".about-infra__list li",
    ".about-commercial h2",

    ".about-commercial__text-wrap>h3",
    ".about-commercial__text-wrap>p",
    ".swiper__counter",
    ".home-gallery__subblock h2",
    ".home-progress__title-wrap h2",
    ".home-progress__descr-wrap p",
    ".home-progress__descr-wrap .general-btn",
    ".home-progress__title-wrap h2",
  ];

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
  const advantageItems = document.querySelectorAll(".advantages-item");

  advantageItems.forEach((item, index) => {
    // Фіксуємо початковий випадковий нахил для фази появи
    const startRotation = gsap.utils.random(-8, 8);

    // 1. ЕТАП: ПОЯВА (Intro)
    // Закінчується, коли центр картки досягає 60% екрана
    gsap
      .timeline({
        scrollTrigger: {
          trigger: item,
          start: "top 95%", // Початок появи знизу
          end: "top 40%", // Фініш появи на 60% висоти в'юпорту
          scrub: 0.5, // М'яка прив'язка до скролу під час появи
        },
      })
      .from(item, {
        opacity: 0,
        y: 120,
        rotation: startRotation,
        ease: "power2.out",
      })
      .from(
        item.querySelector("img"),
        {
          scale: 1.1,
        },
        "<",
      );
    const isEven = (index + 1) % 2 === 0;
    // 2. ЕТАП: ПОСТІЙНИЙ ПЛИН ТА ПІДКРУЧУВАННЯ (Scrub Loop)
    // Починається ПІСЛЯ того, як картка пройшла позначку 60%

    gsap
      .timeline({
        scrollTrigger: {
          trigger: item,
          start: "top 40%", // Початок фази плину (стикується з кінцем появи)
          end: "bottom top", // До повного зникнення зверху
          scrub: 0.5, // Більша інерція для ефекту "невагомості"
        },
      })
      .to(item, {
        // Продовжує плисти вгору
        // Пливемо далі вгору
        x: isEven ? 10 : -5,

        // rotation: isEven ? 2 : -2, // Легке додаткове підкручування
        ease: "none",
      })
      .to(
        item.querySelector("img"),
        {
          filter: "grayscale(30%)",
        },
        "<",
      );
  });
  if (window.innerWidth > 1024) {
    ScrollTrigger.create({
      trigger: ".about-comfort",
      start: "bottom bottom", // Закріплюємо, коли верх секції торкнувся верху екрана
      pin: true, // Секція застигає
      pinSpacing: false, // Важливо: наступна секція буде ігнорувати простір і наповзати
      end: "bottom top",
      // Тримаємо, поки наступна секція повністю не перекриє
    });
  }
  ScrollTrigger.create({
    trigger: ".about-commercial",
    start: "bottom bottom", // Закріплюємо, коли верх секції торкнувся верху екрана
    pin: true, // Секція застигає
    pinSpacing: false, // Важливо: наступна секція буде ігнорувати простір і наповзати
    end: "bottom top",
    // Тримаємо, поки наступна секція повністю не перекриє
  });

  const animDir = window.innerWidth > 1024 ? { yPercent: 50 } : { xPercent: 50 };
  gsap.from(".swiper-commercial .swiper-slide", {
    opacity: 0, // Починаємо з позорості
    ...animDir, // Починаємо зміщеними вниз на 100% своєї висоти
    duration: 1.2, // Трохи довша тривалість для плавності
    stagger: 0.15, // Каскадна поява (один за одним)
    ease: "power2.out", // Плавне сповільнення в кінці
    scrollTrigger: {
      trigger: ".swiper-commercial", // Тригер — увесь список
      start: "top 85%", // Починаємо, коли верх списку на 85% висоти екрана
      toggleActions: "play none none none", // Програти один раз
      // will-change для оптимізації продуктивності під час руху
    },
  });
  gsap.from(".swiper-comfort>.swiper-wrapper>.swiper-slide", {
    opacity: 0, // Починаємо з позорості
    ...animDir, // Починаємо зміщеними вниз на 100% своєї висоти
    duration: 1.2, // Трохи довша тривалість для плавності
    stagger: 0.15, // Каскадна поява (один за одним)
    ease: "power2.out", // Плавне сповільнення в кінці
    scrollTrigger: {
      trigger: ".swiper-comfort", // Тригер — увесь список
      start: "top 85%", // Починаємо, коли верх списку на 85% висоти екрана
      toggleActions: "play none none none", // Програти один раз
      // will-change для оптимізації продуктивності під час руху
    },
  });
});
