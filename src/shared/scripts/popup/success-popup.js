const popupFactory = (ref) => ({
  open() {
    this.element.classList.add("modal-open");
  },
  close() {
    this.element.classList.remove("modal-open");
  },
  toggle() {
    this.element.classList.toggleClass("modal-open");
  },
  element: ref,
});

export const successPopup = popupFactory(document.querySelector(".thank-you-popup"));

const closeAllBtnRef = document.querySelector(".thank-you-popup__btn");
const overlay = document.querySelector(".overlay");
overlay.addEventListener("click", function (evt) {
  if (evt.target === overlay) {
    successPopup.close();
  }
});
closeAllBtnRef.addEventListener("click", () => {
  successPopup.close();
});
