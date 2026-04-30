import { gsap } from "gsap";
import "./liquid-glass-animation.scss";

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".js-liquid-glass-animation");
  if (!items.length) return;

  const rotateIntensity = 0.03;
  const mouseIntensity = 15;

  const startScrollPosition = window.scrollY;

  const isMouse = window.matchMedia("(pointer: fine)").matches;

  const state = {
    mouseX: 0,
    mouseY: 0,
    relativeScroll: 0,
    time: 0,
  };

  const smoothed = {
    x: 0,
    y: 0,
    rotation: 0,
  };

  gsap.set(items, { x: 0, y: 0, rotation: 0, force3D: true });

  if (isMouse) {
    window.addEventListener("mousemove", (e) => {
      state.mouseX = -(e.clientX - window.innerWidth / 2) / mouseIntensity;
      state.mouseY = -(e.clientY - window.innerHeight / 2) / mouseIntensity;

      gsap.to(smoothed, {
        x: state.mouseX,
        y: state.mouseY,
        duration: 1.8,
        ease: "power2.out",
      });
    });
  }

  window.addEventListener("scroll", () => {
    state.relativeScroll = window.scrollY - startScrollPosition;

    gsap.to(smoothed, {
      rotation: state.relativeScroll * rotateIntensity,
      duration: 0.6,
      ease: "power1.out",
    });
  });

  gsap.ticker.add(() => {
    state.time += 0.01;

    const floatingY = Math.sin(state.time) * 10;
    const floatingRot = Math.cos(state.time * 0.8) * 1.5;

    items.forEach((item) => {
      gsap.set(item, {
        x: smoothed.x,
        y: smoothed.y + floatingY,
        rotation: smoothed.rotation + floatingRot,
      });
    });
  });
});
