import { gsap, ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const initParalax = () => {
  const paralaxImages = document.querySelectorAll("[img-paralax]");
  paralaxImages.forEach((image) => {
    const wrap = document.createElement("div");
    wrap.style.overflow = "hidden";
    wrap.style.height = "100%";
    image.parentElement.prepend(wrap);
    gsap.set(image, { willChange: "transform", scale: 1 });
    wrap.prepend(image);

    gsap
      .timeline({
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          scrub: 0.5,
          markers: false,
          onLeave: () => {
            // console.log('leave');
          },
        },
      })
      .fromTo(
        image,
        { scale: 1 },
        {
          scale: 1.3,

          ease: "linear",
        },
      );
  });
};

const imageParalax = document.querySelectorAll("[img-paralax]");

if (imageParalax) {
  initParalax();
}
