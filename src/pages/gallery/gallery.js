import "./gallery.scss";
import { gsap } from "gsap";
import * as THREE from "three";

function parseGalleryData(root) {
  const categoryEls = root.querySelectorAll(".gallery__data [data-category-id]");
  const categories = Array.from(categoryEls).map((el, categoryIndex) => {
    const id = el.dataset.categoryId;
    const label = el.dataset.categoryLabel || id;
    const slideEls = el.querySelectorAll("[data-slide]");
    const slides = Array.from(slideEls).map((img, slideIndex) => ({
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt") || "",
      categoryId: id,
      categoryLabel: label,
      categoryIndex,
      slideIndex,
    }));
    return { id, label, slides };
  });
  const allSlides = categories.flatMap((c) => c.slides);
  return { categories, allSlides };
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;

  uniform sampler2D uCurrentTexture;
  uniform sampler2D uNextTexture;
  uniform vec2 uResolution;
  uniform vec2 uCurrentImageResolution;
  uniform vec2 uNextImageResolution;
  uniform float uProgress;

  vec3 containUv(vec2 uv, vec2 plane, vec2 image) {
    float planeRatio = plane.x / plane.y;
    float imageRatio = image.x / image.y;
    vec2 fitted = uv;
    float alphaMask = 1.0;

    if (planeRatio > imageRatio) {
      float scale = imageRatio / planeRatio;
      fitted.x = (uv.x - 0.5) / scale + 0.5;
      alphaMask *= step(0.0, fitted.x) * step(fitted.x, 1.0);
    } else {
      float scale = planeRatio / imageRatio;
      fitted.y = (uv.y - 0.5) / scale + 0.5;
      alphaMask *= step(0.0, fitted.y) * step(fitted.y, 1.0);
    }

    return vec3(fitted, alphaMask);
  }

  void main() {
    float progress = clamp(uProgress, 0.0, 1.0);
    vec2 centeredUv = vUv - 0.5;
    float radius = length(centeredUv);
    float transitionMotion = smoothstep(0.0, 0.14, progress) * (1.0 - smoothstep(0.86, 1.0, progress));
    float ripple = (sin((vUv.y * 16.0) - progress * 5.0) * 0.012 + cos((vUv.x * 13.0) + progress * 4.0) * 0.009) * transitionMotion;
    float pulse = smoothstep(0.0, 0.5, progress) * (1.0 - smoothstep(0.52, 1.0, progress)) * transitionMotion;

    vec2 currentDistortion = vec2(ripple, ripple * 0.35) * (0.35 + pulse) + centeredUv * progress * 0.09 * transitionMotion;
    vec2 nextDistortion = vec2(-ripple, ripple * 0.25) * (0.15 + (1.0 - pulse)) - centeredUv * (1.0 - progress) * 0.08 * transitionMotion;

    vec3 currentFit = containUv(vUv + currentDistortion, uResolution, uCurrentImageResolution);
    vec3 nextFit = containUv(vUv + nextDistortion, uResolution, uNextImageResolution);

    vec4 currentColor = texture2D(uCurrentTexture, currentFit.xy);
    vec4 nextColor = texture2D(uNextTexture, nextFit.xy);

    currentColor.a *= currentFit.z;
    nextColor.a *= nextFit.z;

    float transition = smoothstep(0.06, 0.94, progress);
    vec4 color = mix(currentColor, nextColor, transition);

    float glow = smoothstep(0.1, 0.45, progress) * (1.0 - smoothstep(0.52, 0.9, progress)) * transitionMotion;
    color.rgb += glow * 0.09 * vec3(0.96, 0.86, 0.66) * (1.0 - smoothstep(0.1, 0.8, radius));

    gl_FragColor = color;
  }
`;

function formatCounter(value) {
  return String(value).padStart(2, "0");
}

function createWebglStage(canvas) {
  if (!canvas) return null;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uCurrentTexture: { value: null },
      uNextTexture: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCurrentImageResolution: { value: new THREE.Vector2(1, 1) },
      uNextImageResolution: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(Math.round(bounds.width), 1);
      const height = Math.max(Math.round(bounds.height), 1);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
      renderer.render(scene, camera);
    };

    resize();

    return { renderer, scene, camera, uniforms, resize };
  } catch {
    return null;
  }
}

function preloadSlides(slides) {
  const loader = new THREE.TextureLoader();

  return Promise.all(
    slides.map(
      (slide) =>
        new Promise((resolve, reject) => {
          loader.load(
            slide.src,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.generateMipmaps = false;
              resolve({
                texture,
                width: texture.image?.naturalWidth || texture.image?.width || 1,
                height: texture.image?.naturalHeight || texture.image?.height || 1,
              });
            },
            undefined,
            reject,
          );
        }),
    ),
  );
}

async function initGallery() {
  const root = document.querySelector("[data-gallery]");
  if (!root) return;

  const { categories: GALLERY_CATEGORIES, allSlides: GALLERY_SLIDES } = parseGalleryData(root);
  if (!GALLERY_SLIDES.length) return;

  const categoryList = root.querySelector(".gallery__category-list");
  const activeCategoryLabel = root.querySelector(".gallery__active-category");
  const counterCurrent = root.querySelector(".gallery__counter-current");
  const counterTotal = root.querySelector(".gallery__counter-total");
  const prevButton = root.querySelector(".gallery__nav--prev");
  const nextButton = root.querySelector(".gallery__nav--next");
  const bgCurrent = root.querySelector(".gallery__bg--current");
  const bgNext = root.querySelector(".gallery__bg--next");
  const fallbackImage = root.querySelector(".gallery__fallback");
  const canvas = root.querySelector(".gallery__canvas");

  if (
    !categoryList ||
    !counterCurrent ||
    !counterTotal ||
    !prevButton ||
    !nextButton ||
    !bgCurrent ||
    !bgNext ||
    !fallbackImage
  ) {
    return;
  }

  categoryList.innerHTML = GALLERY_CATEGORIES.map(
    (category) =>
      `<li class="gallery__category-item"><button class="gallery__category-button" type="button" data-gallery-category="${category.id}">${category.label}</button></li>`,
  ).join("");

  const categoryButtons = Array.from(root.querySelectorAll("[data-gallery-category]"));

  let webgl = createWebglStage(canvas);
  let textures = [];
  let activeIndex = 0;
  let isTransitioning = false;
  let pendingIndex = null;
  let backdropTween = null;

  const renderBackdrop = (slide, animate) => {
    const imageValue = `url("${slide.src}")`;

    if (!animate) {
      bgCurrent.style.backgroundImage = imageValue;
      gsap.set(bgNext, { opacity: 0 });
      return;
    }

    bgNext.style.backgroundImage = imageValue;
    backdropTween?.kill();
    gsap.set(bgNext, { opacity: 0 });
    backdropTween = gsap.to(bgNext, {
      opacity: 1,
      duration: 0.9,
      ease: "power2.out",
      onComplete: () => {
        bgCurrent.style.backgroundImage = imageValue;
        gsap.set(bgNext, { opacity: 0 });
      },
    });
  };

  const syncUi = (index) => {
    const slide = GALLERY_SLIDES[index];
    const category = GALLERY_CATEGORIES.find((c) => c.id === slide.categoryId);
    const categorySlides = category ? category.slides : [];
    const posInCategory = slide.slideIndex + 1;
    counterCurrent.textContent = formatCounter(posInCategory);
    counterTotal.textContent = formatCounter(categorySlides.length);
    fallbackImage.alt = slide.alt;
    if (activeCategoryLabel) {
      activeCategoryLabel.textContent = slide.categoryLabel;
    }

    categoryButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.galleryCategory === slide.categoryId);
    });
  };

  const renderStillFrame = (index, animateBackdrop = false) => {
    const slide = GALLERY_SLIDES[index];
    syncUi(index);
    renderBackdrop(slide, animateBackdrop);
    fallbackImage.src = slide.src;

    if (webgl && textures[index]) {
      webgl.uniforms.uCurrentTexture.value = textures[index].texture;
      webgl.uniforms.uNextTexture.value = textures[index].texture;
      webgl.uniforms.uCurrentImageResolution.value.set(textures[index].width, textures[index].height);
      webgl.uniforms.uNextImageResolution.value.set(textures[index].width, textures[index].height);
      webgl.uniforms.uProgress.value = 0;
      webgl.renderer.render(webgl.scene, webgl.camera);
      root.classList.add("is-webgl-ready");
    } else {
      root.classList.remove("is-webgl-ready");
    }
  };

  const goTo = (index, { immediate = false } = {}) => {
    const total = GALLERY_SLIDES.length;
    const normalizedIndex = (index + total) % total;
    if (normalizedIndex === activeIndex && !immediate) return;

    if (isTransitioning) {
      pendingIndex = normalizedIndex;
      return;
    }

    if (immediate || !webgl || !textures[activeIndex] || !textures[normalizedIndex]) {
      activeIndex = normalizedIndex;
      renderStillFrame(activeIndex, !immediate);
      return;
    }

    isTransitioning = true;
    const nextSlide = GALLERY_SLIDES[normalizedIndex];
    syncUi(normalizedIndex);
    renderBackdrop(nextSlide, true);

    webgl.uniforms.uCurrentTexture.value = textures[activeIndex].texture;
    webgl.uniforms.uNextTexture.value = textures[normalizedIndex].texture;
    webgl.uniforms.uCurrentImageResolution.value.set(
      textures[activeIndex].width,
      textures[activeIndex].height,
    );
    webgl.uniforms.uNextImageResolution.value.set(
      textures[normalizedIndex].width,
      textures[normalizedIndex].height,
    );
    webgl.uniforms.uProgress.value = 0;

    gsap.fromTo(
      webgl.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 1.05,
        ease: "power2.inOut",
        onUpdate: () => {
          webgl.renderer.render(webgl.scene, webgl.camera);
        },
        onComplete: () => {
          activeIndex = normalizedIndex;
          fallbackImage.src = nextSlide.src;
          webgl.uniforms.uCurrentTexture.value = textures[activeIndex].texture;
          webgl.uniforms.uNextTexture.value = textures[activeIndex].texture;
          webgl.uniforms.uCurrentImageResolution.value.set(
            textures[activeIndex].width,
            textures[activeIndex].height,
          );
          webgl.uniforms.uNextImageResolution.value.set(
            textures[activeIndex].width,
            textures[activeIndex].height,
          );
          webgl.uniforms.uProgress.value = 0;
          webgl.renderer.render(webgl.scene, webgl.camera);
          isTransitioning = false;

          if (pendingIndex !== null && pendingIndex !== activeIndex) {
            const queued = pendingIndex;
            pendingIndex = null;
            goTo(queued);
          } else {
            pendingIndex = null;
          }
        },
      },
    );
  };

  prevButton.addEventListener("click", () => goTo(activeIndex - 1));
  nextButton.addEventListener("click", () => goTo(activeIndex + 1));

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetIndex = GALLERY_SLIDES.findIndex(
        (slide) => slide.categoryId === button.dataset.galleryCategory,
      );
      if (targetIndex >= 0) {
        goTo(targetIndex);
      }
    });
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  });

  window.addEventListener("resize", () => {
    webgl?.resize();
  });

  try {
    textures = await preloadSlides(GALLERY_SLIDES);
  } catch {
    webgl = null;
  }

  renderStillFrame(0, false);

  gsap.fromTo(
    root.querySelectorAll(".gallery__title, .gallery__panel"),
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.12,
    },
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGallery, { once: true });
} else {
  initGallery();
}
