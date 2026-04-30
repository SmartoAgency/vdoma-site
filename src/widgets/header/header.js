import "./header.scss";

import device from "current-device";

import { gsap, ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const MENU_PIXEL_DURATION = 640;
const MENU_CONTENT_REVEAL_LEAD = 180;

function ensurePixelLayer(menuContainer) {
  let layer = menuContainer.querySelector(".menu-pixel-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "menu-pixel-layer";
    menuContainer.prepend(layer);
  }
  return layer;
}

function buildPixelGrid(layer, options) {
  const { cellCountX, animationName, maxDelay } = options;
  const hostRect = layer.parentElement.getBoundingClientRect();
  const cellSize = Math.max(20, hostRect.width / cellCountX);
  const cellCountY = Math.ceil(hostRect.height / cellSize);
  const total = cellCountX * cellCountY;

  layer.innerHTML = "";
  layer.style.setProperty("--pixel-cols", String(cellCountX));
  layer.style.setProperty("--pixel-size", `${cellSize}px`);

  for (let i = 0; i < total; i += 1) {
    const cell = document.createElement("span");
    cell.style.setProperty("--pixel-animation", animationName);
    cell.style.setProperty("--pixel-delay", `${Math.random() * maxDelay}ms`);
    layer.appendChild(cell);
  }
}

function setMenuContentHidden(menu) {
  if (!menu) return;

  const logo = menu.querySelector(".menu-logo");
  const links = menu.querySelectorAll(".menu-main-link");
  const contacts = menu.querySelector(".menu-contacts");

  gsap.set([logo, ...links, contacts], {
    autoAlpha: 0,
    y: 16,
    filter: "blur(2px)",
  });
}

function revealMenuContent(menu) {
  if (!menu) return;

  const logo = menu.querySelector(".menu-logo");
  const links = menu.querySelectorAll(".menu-main-link");
  const contacts = menu.querySelector(".menu-contacts");

  gsap.killTweensOf([logo, ...links, contacts]);

  gsap.to(logo, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.42,
    ease: "power3.out",
  });

  gsap.to(links, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.38,
    ease: "power3.out",
    stagger: 0.045,
    delay: 0.05,
  });

  gsap.to(contacts, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power3.out",
    delay: 0.18,
  });
}

function openMenuWithPixels(menu) {
  if (!menu || menu.classList.contains("is-pixel-opening")) return;

  const menuContainer = menu.querySelector(".menu-container");
  if (!menuContainer) return;

  const layer = ensurePixelLayer(menuContainer);
  const cellCountX = window.innerWidth >= 768 ? 18 : 12;

  menu.classList.remove(
    "hidden",
    "menu-opened",
    "is-content-visible",
    "is-content-revealing",
    "is-pixel-closing",
    "is-content-hiding",
  );
  menu.classList.add("is-pixel-opening");
  setMenuContentHidden(menu);

  buildPixelGrid(layer, {
    cellCountX,
    animationName: "pixel-fill",
    maxDelay: 360,
  });

  window.setTimeout(() => {
    if (!menu.classList.contains("is-pixel-opening")) return;
    menu.classList.add("is-content-revealing");
    revealMenuContent(menu);
  }, MENU_PIXEL_DURATION - MENU_CONTENT_REVEAL_LEAD);

  window.setTimeout(() => {
    menu.classList.remove("is-pixel-opening", "is-content-revealing");
    menu.classList.add("menu-opened", "is-content-visible");
    layer.innerHTML = "";
  }, MENU_PIXEL_DURATION + 20);
}

function closeMenuWithPixels(menu) {
  if (!menu || menu.classList.contains("is-pixel-closing") || menu.classList.contains("hidden")) return;

  const menuContainer = menu.querySelector(".menu-container");
  if (!menuContainer) return;

  const layer = ensurePixelLayer(menuContainer);
  const cellCountX = window.innerWidth >= 768 ? 18 : 12;

  menu.classList.remove("menu-opened", "is-content-visible", "is-content-revealing", "is-pixel-opening");
  menu.classList.add("is-content-hiding", "is-pixel-closing");
  setMenuContentHidden(menu);

  buildPixelGrid(layer, {
    cellCountX,
    animationName: "pixel-reveal",
    maxDelay: 300,
  });

  window.setTimeout(() => {
    menu.classList.remove("is-content-hiding", "is-pixel-closing");
    menu.classList.add("hidden");
    layer.innerHTML = "";
  }, MENU_PIXEL_DURATION + 20);
}

if (innerWidth < 768) {
  let lastScroll = 0;
  const header = document.querySelector(".header");
  const scrollThreshold = 10; // мінімальна зміна для реагування

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Якщо прокрутка незначна — нічого не робимо
    if (Math.abs(currentScroll - lastScroll) < scrollThreshold) return;

    if (currentScroll > lastScroll && currentScroll > header.offsetHeight) {
      // Користувач крутить вниз
      header.classList.add("hide");
    } else {
      // Користувач крутить вгору
      header.classList.remove("hide");
    }

    lastScroll = currentScroll;
  });
}
const header = document.querySelector(".header");
document.body.addEventListener("click", function (evt) {
  const close = evt.target.closest("[data-call-us-modal-close]");
  const form = evt.target.closest("[data-call-us-modal]");
  const btn = evt.target.closest("[data-call-us-btn]");
  const overflow = document.querySelector("[data-call-us__overflow]");
  const btnMob = evt.target.closest("[data-mob-call-btn]");
  const overflowMob = document.querySelector("[data-mob-call__overflow]");
  const closeMob = evt.target.closest("[data-mob-call-close]");
  const countryList = evt.target.closest(".iti__country-list");
  const btnUp = evt.target.closest("[data-btn-up]");
  const btnMenuTarget = evt.target.closest("[data-menu-button]");
  const btnMenuClose = evt.target.closest("[data-menu-close]");
  const menu = document.querySelector("[data-menu]");
  const menuItem = evt.target.closest(".menu-item");
  const submitBtn = evt.target.closest("[data-btn-submit]");
  const tyPopup = document.querySelector("[data-ty-popup]");
  if (btnMenuTarget || menuItem) {
    const isHidden = menu.classList.contains("hidden");

    if (isHidden) {
      window.dispatchEvent(new Event("stop-scroll"));
      header.classList.add("menu-is-open");
      openMenuWithPixels(menu);
    } else {
      window.dispatchEvent(new Event("start-scroll"));
      header.classList.remove("menu-is-open");
      closeMenuWithPixels(menu);
    }

    return;
  }
  if (btnMenuClose || evt.target === menu) {
    window.dispatchEvent(new Event("start-scroll"));
    header.classList.remove("menu-is-open");
    closeMenuWithPixels(menu);
  }
  if (btnUp) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (btn) {
    if (overflow.classList.contains("hidden")) {
      window.dispatchEvent(new Event("stop-scroll"));
      overflowMob.classList.add("hidden");

      return overflow.classList.remove("hidden");
    }
    return;
  }
  if (submitBtn) {
    window.dispatchEvent(new Event("succesFormSend"));
  }
  if (close) {
    window.dispatchEvent(new Event("start-scroll"));

    tyPopup.classList.add("hidden");
    setTimeout(() => {
      overflow.classList.add("hidden");
    }, 300);
    return;
  }
  if (evt.target === overflow) {
    window.dispatchEvent(new Event("start-scroll"));

    tyPopup.classList.add("hidden");
    setTimeout(() => {
      overflow.classList.add("hidden");
    }, 300);
    return;
  }

  if (btnMob) {
    if (overflowMob.classList.contains("hidden")) {
      window.dispatchEvent(new Event("stop-scroll"));

      return overflowMob.classList.remove("hidden");
    }
    return;
  }
  if (closeMob) {
    window.dispatchEvent(new Event("start-scroll"));

    return overflowMob.classList.add("hidden");
  }

  if (evt.target === overflowMob) {
    window.dispatchEvent(new Event("start-scroll"));

    return overflowMob.classList.add("hidden");
  }
});
