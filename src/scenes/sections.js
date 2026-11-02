import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

/* Hero + section scroll scenes. Called after the intro handover. */

export function initHero() {
  const hero = document.querySelector("#hero");
  if (!hero) return;
  gsap.set("[data-hero-reveal]", { opacity: 0, y: 40 });
  gsap.to("[data-hero-reveal]", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: "power4.out",
    delay: 0.3,
  });

  initHeroAmbient();
}

// Ambient-only pieces, safe to run after the construction tour already
// revealed the hero: the Ken Burns portrait breathing. Never re-hides
// anything the tour built.
export function initHeroAmbient() {
  const photo = document.querySelector("[data-hero-photo]");
  if (photo) {
    gsap.to(photo, { scale: 1.06, duration: 6, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }
}

export function initSections() {
  gsap.set("[data-section-title]", { opacity: 0, y: 60 });

  gsap.utils.toArray("[data-section-title]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        once: true
      },
    });
  });

  gsap.utils.toArray("[data-section-body]").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true
      },
    });
  });

  // skill bars fill on enter
  gsap.utils.toArray("[data-skill-bar]").forEach((bar) => {
    gsap.from(bar, {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: bar, start: "top 90%" },
    });
  });

  ScrollTrigger.refresh();
}
