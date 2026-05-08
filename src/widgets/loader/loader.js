import "./loader.scss";

const PROGRESS_CEILING = 92;
const MIN_VISIBLE_MS = 900;
const FALLBACK_COMPLETE_MS = 7000;
const REVEAL_DURATION_MS = 1100;

function formatCounter(value) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  if (clamped < 10) return `0${clamped}%`;
  return `${clamped}%`;
}

function ensureLoaderShell() {
  const existing = document.querySelector(".site-loader");
  if (existing) return existing;

  const logo = document.querySelector("body > .menu-logo");
  const track = document.querySelector("body > .loader-track");
  const counter = document.querySelector("body > .loader-counter");

  if (!logo || !track || !counter) return null;

  const shell = document.createElement("div");
  shell.className = "site-loader";
  shell.setAttribute("role", "status");
  shell.setAttribute("aria-live", "polite");

  logo.classList.add("loader-logo");
  track.classList.add("loader-track-inner");
  counter.classList.add("loader-counter-inner");

  shell.append(logo, track, counter);
  document.body.prepend(shell);

  return shell;
}

function prepareTrack(track) {
  const base = track.querySelector(".track-svg");
  if (!base) return;

  base.classList.add("track-svg--base");

  if (track.querySelector(".track-svg--fill")) return;

  const fill = base.cloneNode(true);
  fill.classList.remove("track-svg--base");
  fill.classList.add("track-svg--fill");
  fill.setAttribute("aria-hidden", "true");
  track.append(fill);
}

function initLoader() {
  const loader = ensureLoaderShell();
  if (!loader) return;

  const track = loader.querySelector(".loader-track");
  const counter = loader.querySelector(".loader-counter");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  prepareTrack(track);

  let progress = 0;
  let rafId = 0;
  let hasCompleted = false;
  let fallbackTimer = 0;
  const startedAt = performance.now();

  const setProgress = (value) => {
    progress = Math.max(0, Math.min(100, value));
    loader.style.setProperty("--loader-progress", `${progress}%`);

    if (counter) {
      counter.textContent = formatCounter(progress);
    }
  };

  const stopScroll = () => {
    document.body.classList.add("is-loader-active");
    window.dispatchEvent(new Event("stop-scroll"));
  };

  const startScroll = () => {
    document.body.classList.remove("is-loader-active");
    document.body.classList.remove("is-loader-revealing");
    window.dispatchEvent(new Event("start-scroll"));
  };

  const animateProgressTo = (target, duration, onComplete) => {
    const from = progress;
    const delta = target - from;
    const animationStart = performance.now();

    const tick = (now) => {
      const elapsed = now - animationStart;
      const normalized = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - normalized) ** 3;

      setProgress(from + delta * eased);

      if (normalized < 1) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      onComplete?.();
    };

    rafId = window.requestAnimationFrame(tick);
  };

  const runUntilLoaded = () => {
    if (hasCompleted) return;

    const distance = PROGRESS_CEILING - progress;
    const drift = Math.max(0.08, distance * 0.03);
    setProgress(progress + drift);

    rafId = window.requestAnimationFrame(runUntilLoaded);
  };

  const finish = () => {
    if (hasCompleted) return;
    hasCompleted = true;

    window.cancelAnimationFrame(rafId);
    window.clearTimeout(fallbackTimer);

    const elapsed = performance.now() - startedAt;
    const waitBeforeFinish = Math.max(0, MIN_VISIBLE_MS - elapsed);

    window.setTimeout(() => {
      animateProgressTo(100, prefersReducedMotion ? 220 : 880, () => {
        document.body.classList.add("is-loader-revealing");
        loader.classList.add("is-revealing");
        window.dispatchEvent(new CustomEvent("loader:reveal"));

        window.setTimeout(
          () => {
            loader.classList.add("is-loaded");
            window.dispatchEvent(new CustomEvent("loader:complete"));

            window.setTimeout(
              () => {
                startScroll();
                loader.remove();
              },
              prefersReducedMotion ? 120 : 220,
            );
          },
          prefersReducedMotion ? 180 : REVEAL_DURATION_MS,
        );
      });
    }, waitBeforeFinish);
  };

  stopScroll();
  setProgress(0);

  if (prefersReducedMotion) {
    setProgress(25);
  }

  rafId = window.requestAnimationFrame(runUntilLoaded);

  if (document.readyState === "complete") {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
  }

  fallbackTimer = window.setTimeout(finish, FALLBACK_COMPLETE_MS);
}

initLoader();
