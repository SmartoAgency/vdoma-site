import gsap from "gsap";
import "./thank-you-popup.scss";

window.addEventListener("succesFormSend", () => {
  console.log("succesFormSend");
  gsap.to("[data-call-us-modal]", {
    opacity: 0,
  });
  setTimeout(() => {
    document.querySelector("[data-ty-popup]").classList.remove("hidden");
  }, 300);
});
