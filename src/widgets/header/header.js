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

  // clearProps removes the inline filter/transform once the tween finishes.
  // Safari keeps `filter` as a new containing block for as long as it's set
  // inline, which breaks the overflow:hidden clip on .nav-link's absolutely
  // positioned .fake span (menu items were leaking each other's hover text).
  gsap.to(logo, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.42,
    ease: "power3.out",
    clearProps: "filter,transform",
  });

  gsap.to(links, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.38,
    ease: "power3.out",
    stagger: 0.045,
    delay: 0.05,
    clearProps: "filter,transform",
  });

  gsap.to(contacts, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power3.out",
    delay: 0.18,
    clearProps: "filter,transform",
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

function initMobileHeaderLiquidGlass() {
  const mobileHeaderBg = document.querySelector(".header-bg.mob-v");
  if (!mobileHeaderBg) return;

  const ua = navigator.userAgent;
  const isWebKitEngine = /AppleWebKit/i.test(ua) && !/Chrome|CriOS|Edg|EdgiOS|FxiOS|OPR/i.test(ua);
  mobileHeaderBg.classList.toggle("is-webkit-glass", isWebKitEngine);

  const isMobileViewport = window.matchMedia("(max-width: 767px)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsBackdropFilter =
    CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)");

  const syncMobileClass = (matches) => {
    mobileHeaderBg.classList.toggle("is-liquid-ready", matches && supportsBackdropFilter);
  };

  syncMobileClass(isMobileViewport.matches);

  const onViewportChange = (event) => {
    syncMobileClass(event.matches);
  };

  if (isMobileViewport.addEventListener) {
    isMobileViewport.addEventListener("change", onViewportChange);
  } else {
    isMobileViewport.addListener(onViewportChange);
  }

  if (!supportsBackdropFilter || prefersReducedMotion) return;

  const turbulence = document.getElementById("header-liquid-fe-turbulence");
  const displacement = document.getElementById("header-liquid-fe-displacement");
  const turbulenceStrong = document.getElementById("header-liquid-fe-turbulence-strong");
  const displacementStrong = document.getElementById("header-liquid-fe-displacement-strong");
  const offsetRed = document.getElementById("header-liquid-fe-offset-r");
  const offsetBlue = document.getElementById("header-liquid-fe-offset-b");
  if (!turbulence || !displacement || !turbulenceStrong || !displacementStrong) return;

  const start = performance.now();
  let previousScrollY = window.scrollY;
  let velocity = 0;

  window.addEventListener(
    "scroll",
    () => {
      const nextY = window.scrollY;
      const delta = Math.abs(nextY - previousScrollY);
      previousScrollY = nextY;
      velocity = Math.min(1, delta / 18);
    },
    { passive: true },
  );

  const animate = (now) => {
    const t = (now - start) * 0.001;
    velocity *= 0.9;

    const boost = 1 + velocity * 1.35;
    const freqX = (0.0105 + Math.sin(t * 0.75) * 0.0023 * boost).toFixed(4);
    const freqY = (0.024 + Math.cos(t * 0.62) * 0.0028 * boost).toFixed(4);
    const scale = (24 + Math.sin(t * 0.9) * 3.8 + velocity * 7.5).toFixed(2);

    const strongFreqX = (0.014 + Math.sin(t * 0.68 + 0.4) * 0.003 * boost).toFixed(4);
    const strongFreqY = (0.032 + Math.cos(t * 0.58 - 0.3) * 0.0042 * boost).toFixed(4);
    const strongScale = (34 + Math.sin(t * 0.84 + 0.7) * 5.6 + velocity * 11).toFixed(2);

    const chromaShift = (0.82 + Math.sin(t * 1.2) * 0.22 + velocity * 0.55).toFixed(3);

    turbulence.setAttribute("baseFrequency", `${freqX} ${freqY}`);
    displacement.setAttribute("scale", scale);
    turbulenceStrong.setAttribute("baseFrequency", `${strongFreqX} ${strongFreqY}`);
    displacementStrong.setAttribute("scale", strongScale);

    if (offsetRed && offsetBlue) {
      offsetRed.setAttribute("dx", chromaShift);
      offsetBlue.setAttribute("dx", (-Number(chromaShift)).toFixed(3));
    }

    window.requestAnimationFrame(animate);
  };

  window.requestAnimationFrame(animate);
}

function initScrollTopButton() {
  const btn = document.querySelector("[data-btn-up]");
  if (!btn) return;

  // The header uses transforms, so fixed positioning inside it can be trapped.
  // Moving the button to <body> keeps it anchored to the viewport on mobile and desktop.
  if (btn.parentElement !== document.body) {
    document.body.appendChild(btn);
  }

  const footer = document.querySelector(".footer");
  const socialsList = footer ? footer.querySelector(".socials-list") : null;

  let ticking = false;

  const update = () => {
    const showButton = window.scrollY > window.innerHeight;
    btn.classList.toggle("is-visible", showButton);

    if (!showButton) {
      btn.classList.remove("is-docked");
      btn.style.removeProperty("--btn-up-top");
      return;
    }

    const bottomOffset = window.innerWidth >= 768 ? 24 : 8;
    const minTopOffset = 12;
    const defaultTop = window.innerHeight - bottomOffset - btn.offsetHeight;

    const anchor = socialsList || footer;
    if (!anchor) {
      btn.classList.remove("is-docked");
      btn.style.removeProperty("--btn-up-top");
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const anchorCenterY = anchorRect.top + anchorRect.height / 2;
    const dockedTop = anchorCenterY - btn.offsetHeight / 2;

    if (dockedTop < defaultTop) {
      btn.classList.add("is-docked");
      btn.style.setProperty("--btn-up-top", `${Math.max(minTopOffset, dockedTop)}px`);
      return;
    }

    btn.classList.remove("is-docked");
    btn.style.removeProperty("--btn-up-top");
  };

  const requestUpdate = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  requestUpdate();
}

initMobileHeaderLiquidGlass();
initScrollTopButton();

// if (innerWidth < 768) {
//   let lastScroll = 0;
//   const header = document.querySelector(".header");
//   const scrollThreshold = 10; // мінімальна зміна для реагування

//   window.addEventListener("scroll", () => {
//     const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

//     // Якщо прокрутка незначна — нічого не робимо
//     if (Math.abs(currentScroll - lastScroll) < scrollThreshold) return;

//     if (currentScroll > lastScroll && currentScroll > header.offsetHeight) {
//       // Користувач крутить вниз
//       header.classList.add("hide");
//     } else {
//       // Користувач крутить вгору
//       header.classList.remove("hide");
//     }

//     lastScroll = currentScroll;
//   });
// }

// Hover menu opening for devices that support hover
const supportsHover = window.matchMedia("(hover: hover)").matches;

if (supportsHover) {
  console.log("Hover interactions enabled for header menu");
  const header = document.querySelector(".header");
  const btnMenuTarget = document.querySelector(".menu-block[data-menu-button]");
  const menu = document.querySelector("[data-menu]");
  const menuContainer = menu.querySelector(".menu-container");

  if (btnMenuTarget && menu) {
    let openTimeout;
    let closeTimeout;
    console.log("menu");
    const openMenu = () => {
      console.log("openMenu");
      if (closeTimeout) clearTimeout(closeTimeout);
      if (openTimeout) return;

      openTimeout = setTimeout(() => {
        if (menu.classList.contains("hidden")) {
          if (window.innerWidth < 768) {
            window.dispatchEvent(new Event("stop-scroll"));
          }
          header.classList.add("menu-is-open");
          openMenuWithPixels(menu);
        }
        openTimeout = null;
      }, 0);
    };

    const closeMenu = () => {
      console.log("openMenu");
      if (openTimeout) {
        clearTimeout(openTimeout);
        openTimeout = null;
        return;
      }

      closeTimeout = setTimeout(() => {
        if (!menu.classList.contains("hidden")) {
          if (window.innerWidth < 768) {
            window.dispatchEvent(new Event("start-scroll"));
          }
          header.classList.remove("menu-is-open");
          closeMenuWithPixels(menu);
        }
      }, 150);
    };

    btnMenuTarget.addEventListener("mouseenter", openMenu);
    btnMenuTarget.addEventListener("mouseleave", closeMenu);
    menuContainer.addEventListener("mouseenter", openMenu);
    menuContainer.addEventListener("mouseleave", closeMenu);
  }
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
  const menuItem = evt.target.closest(".menu-main-link");
  const tyPopup = document.querySelector("[data-ty-popup]");
  if (btnMenuTarget) {
    const isHidden = menu.classList.contains("hidden");

    if (isHidden) {
      if (window.innerWidth < 768) {
        window.dispatchEvent(new Event("stop-scroll"));
      }
      header.classList.add("menu-is-open");
      openMenuWithPixels(menu);
    } else {
      if (window.innerWidth < 768) {
        window.dispatchEvent(new Event("start-scroll"));
      }
      header.classList.remove("menu-is-open");
      closeMenuWithPixels(menu);
    }

    return;
  }
  if (menuItem && !menu.classList.contains("hidden")) {
    if (window.innerWidth < 768) {
      window.dispatchEvent(new Event("start-scroll"));
    }
    header.classList.remove("menu-is-open");
    closeMenuWithPixels(menu);
    return;
  }
  if (btnMenuClose || evt.target === menu) {
    if (window.innerWidth < 768) {
      window.dispatchEvent(new Event("start-scroll"));
    }
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
      gsap.to("[data-call-us-modal]", {
        opacity: 1,
      });
      return overflow.classList.remove("hidden");
    }
    return;
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
