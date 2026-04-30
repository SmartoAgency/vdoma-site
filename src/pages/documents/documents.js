import "./documents.scss";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const updateFileSizes = async () => {
  const fileLinks = document.querySelectorAll(".js-file-link");

  fileLinks.forEach(async (link) => {
    const sizeSpan = link.querySelector(".document-card__size");
    const fileUrl = link.getAttribute("href");

    if (!fileUrl || !sizeSpan) return;

    try {
      // Робимо HEAD запит, щоб отримати тільки заголовки
      const response = await fetch(fileUrl, { method: "HEAD" });
      const sizeInBytes = response.headers.get("content-length");

      if (sizeInBytes) {
        // Конвертація: Байти -> Кілобайти -> Мегабайти
        const sizeInMb = (sizeInBytes / (1024 * 1024)).toFixed(2);
        sizeSpan.textContent = `${sizeInMb} MB`;
      } else {
        sizeSpan.textContent = "--- MB";
      }
    } catch (error) {
      console.error("Помилка отримання розміру файлу:", error);
      sizeSpan.textContent = "Error";
    }
  });
};

document.addEventListener("DOMContentLoaded", updateFileSizes);

const newsFunctional = () => {
  const newsSection = document.querySelector(".documents");
  const newsList = document.querySelector(".documents__list");
  const cards = Array.from(document.querySelectorAll(".document-card"));
  const loadMoreBtnWrap = document.querySelector(".load-more-btn-wrap");
  const loadMoreBtn = document.querySelector(".load-more-btn");
  const btnText = loadMoreBtn?.querySelector("span");

  if (!newsList || cards.length === 0 || !loadMoreBtn) return;

  const getStep = () => 6;
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
      loadMoreBtn.classList.add("is-full");
    } else {
      btnText.textContent = "Завантажити ще";
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

  checkBtnPersistence();
  updateVisibility(true);
};

newsFunctional();
document.addEventListener("DOMContentLoaded", () => {
  // Реєструємо ScrollTrigger, якщо він знадобиться для інших блоків

  const tl = gsap.timeline({
    defaults: {
      ease: "power2.out", // Плавне сповільнення в кінці
      duration: 1.2,
    },
  });

  // Робимо елементи видимими перед початком
  tl.set(".header, .documents__img, .documents__list, .documents__title-wrap", {
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
    ".documents__img",
    {
      y: -50,
      scale: 1.1,
      opacity: 0,
      duration: 1.5,
    },
    0.2,
  ); // Починаємо з невеликою затримкою від старту
  tl.from(
    ".documents__title-wrap",
    {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      clipPath: "inset(0% 0% 100% 0%)",
    },
    "-=0.6",
  );
  // 3. Анімація лівого блоку (Заголовок та кнопка "Гортай")
  // Використовуємо stagger: 0.2 для послідовної появи
  tl.from(
    ".documents__list > *",
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
    trigger: ".documents",
    start: "bottom bottom",
    end: "bottom top",
    pin: true, // "Приклеюємо" блок
    pinSpacing: false, // Наступний блок ігнорує простір і наїжджає
  });
});
