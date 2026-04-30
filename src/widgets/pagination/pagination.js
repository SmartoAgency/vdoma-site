import "./pagination.scss";
import gsap from "gsap";

export function paginationInit(containerSelector, cardSelector, paginationSelector = ".pagination") {
  const container = document.querySelector(containerSelector);
  const paginationWrapper = document.querySelector(paginationSelector);

  if (!container || !paginationWrapper) return;

  const cards = Array.from(container.querySelectorAll(cardSelector));
  const prevBtn = paginationWrapper.querySelector(".pagination__prev");
  const nextBtn = paginationWrapper.querySelector(".pagination__next");

  const currentCountEl = paginationWrapper.querySelector(".pagination-count__current");
  const maxCountEl = paginationWrapper.querySelector(".pagination-count__max");

  const loadMoreBtn = paginationWrapper.querySelector(".pagination__more");

  const perPage = 6;
  const totalPages = Math.ceil(cards.length / perPage);
  let currentPage = 1;

  function animateCards(visibleCards) {
    gsap.fromTo(
      visibleCards,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: "power2.out",
      },
    );
  }

  function renderPage(page, scrollBlock) {
    page = Math.max(1, Math.min(page, totalPages));
    currentPage = page;

    const start = (currentPage - 1) * perPage;
    const end = currentPage * perPage;

    cards.forEach((card) => (card.style.display = "none"));

    const visibleCards = cards.slice(start, end);
    visibleCards.forEach((card) => (card.style.display = ""));

    animateCards(visibleCards);
    updateUI();

    if (!scrollBlock) {
      setTimeout(() => {
        const offsetTop = container.offsetTop - 100;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }, 200);
    }
  }

  function loadMore() {
    if (currentPage < totalPages) {
      currentPage += 1;
      const start = (currentPage - 1) * perPage;
      const end = currentPage * perPage;

      const newCards = cards.slice(start, end);
      newCards.forEach((card) => (card.style.display = ""));

      animateCards(newCards);
      updateUI();
    }
  }

  function updateUI() {
    const formattedCurrent = currentPage.toString().padStart(2, "0");
    const formattedTotal = totalPages.toString().padStart(2, "0");

    if (currentCountEl) currentCountEl.textContent = formattedCurrent;
    if (maxCountEl) maxCountEl.textContent = `з ${formattedTotal} сторінок`;

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.classList.toggle("disabled", currentPage === 1);
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.classList.toggle("disabled", currentPage === totalPages);
    }

    if (loadMoreBtn) {
      if (currentPage === totalPages) {
        loadMoreBtn.style.display = "none";
      } else {
        loadMoreBtn.style.display = "";
      }
    }
  }

  if (prevBtn) prevBtn.addEventListener("click", () => renderPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => renderPage(currentPage + 1));
  if (loadMoreBtn) loadMoreBtn.addEventListener("click", loadMore);

  renderPage(1, true);
}
