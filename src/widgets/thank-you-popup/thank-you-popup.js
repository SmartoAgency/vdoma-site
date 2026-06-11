import gsap from "gsap";
import "./thank-you-popup.scss";

window.addEventListener("succesFormSend", () => {
  const overflow = document.querySelector("[data-call-us__overflow]");
  const callUsModal = document.querySelector("[data-call-us-modal]");
  const tyPopup = document.querySelector("[data-ty-popup]");

  if (!overflow || !tyPopup) return;

  window.dispatchEvent(new Event("stop-scroll"));
  overflow.classList.remove("hidden");

  if (callUsModal) {
    gsap.to(callUsModal, {
      opacity: 0,
      duration: 0.3,
    });
  }

  window.setTimeout(() => {
    tyPopup.classList.remove("hidden");
  }, 300);
});
