let currentMap = null;

const fallbackI18n = {
  t(key) {
    return key;
  },
};

export const initLazyMap = ({
  selector,
  accessToken,
  center,
  markers = [],
  i18n = fallbackI18n,
  zoom = 17,
}) => {
  if (!selector || !accessToken || !Array.isArray(center) || center.length < 2) return;

  const el = document.querySelector(selector);
  if (!el) return;

  if (currentMap) {
    currentMap.destroy();
    currentMap = null;
  }

  const init = () => {
    import("./MapboxBlock").then(({ default: MapboxBlock }) => {
      if (!document.contains(el)) return;
      if (currentMap) currentMap.destroy();
      currentMap = new MapboxBlock({
        mountTo: el,
        accessToken,
        center,
        markers,
        i18n,
        zoom,
      });
    });
  };

  // Якщо елемент вже у viewport — ініціалізуємо одразу, без observer
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight + 400) {
    init();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      init();
    },
    { rootMargin: "400px" },
  );

  observer.observe(el);
};
