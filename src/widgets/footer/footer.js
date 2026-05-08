import "./footer.scss";
import "../../features/footerSvg/footerSvg";
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

function initRunningLine() {
  const track = document.querySelector(".running-line__track");
  const container = document.querySelector(".running-line");

  if (!track || !container || track.dataset.marqueeReady === "true") return;

  const baseMarkup = track.innerHTML;
  if (!baseMarkup.trim()) return;

  // Build the first half long enough for smooth scrolling on wide screens.
  let safety = 0;
  while (track.scrollWidth < container.offsetWidth * 2 && safety < 12) {
    track.insertAdjacentHTML("beforeend", baseMarkup);
    safety += 1;
  }

  // Duplicate the full first half once so translateX(-50%) loops seamlessly.
  const firstHalfMarkup = track.innerHTML;
  track.insertAdjacentHTML("beforeend", firstHalfMarkup);

  track.dataset.marqueeReady = "true";
}

const runningLineVideos = document.querySelectorAll(".running-line video");
if (runningLineVideos.length) {
  let pending = runningLineVideos.length;

  const onVideoReady = () => {
    pending -= 1;
    if (pending <= 0) {
      initRunningLine();
    }
  };

  runningLineVideos.forEach((video) => {
    if (video.readyState >= 1) {
      onVideoReady();
      return;
    }

    video.addEventListener("loadedmetadata", onVideoReady, { once: true });
    video.addEventListener("error", onVideoReady, { once: true });
  });
} else {
  initRunningLine();
}
