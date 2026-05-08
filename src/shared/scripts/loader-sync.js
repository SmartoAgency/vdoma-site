/**
 * Returns a Promise that resolves the moment the loader begins its reveal
 * (curtain starts opening). If no loader is currently in the DOM the Promise
 * resolves immediately, so the same call-site works on every page regardless
 * of whether it was opened fresh or navigated to after the loader has already
 * finished.
 *
 * @param {number} [safetyMs=9000] - Hard-timeout fallback so animations never
 *   get stuck if the loader event is somehow never dispatched.
 * @returns {Promise<void>}
 */
export function whenLoaderReveals(safetyMs = 9000) {
  if (!document.querySelector(".site-loader")) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, safetyMs);

    window.addEventListener(
      "loader:reveal",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
