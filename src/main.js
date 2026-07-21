const openingHours = {
  1: ["8 - 12", "14 - 17"],
  2: ["8 - 12", "14 - 17"],
  3: ["8 - 13"],
  4: ["8 - 12", "15 - 18"],
  5: ["8 - 12"]
};

const weekdayNames = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag"
];

const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");
const motionTextItems = [...document.querySelectorAll("[data-motion-text]")];
const quickInfo = document.querySelector(".quick-info");
const praxisHighlights = document.querySelector(".praxis-highlights");
const hoursBoard = document.querySelector(".hours-board");
const serviceGrid = document.querySelector(".service-grid");
const contactActions = document.querySelector(".contact-actions");
const todayLabel = document.querySelector("[data-today-label]");
const todayHours = document.querySelector("[data-today-hours]");
const year = document.querySelector("[data-year]");
const gallerySteps = [...document.querySelectorAll("[data-gallery-step]")];
const galleryImages = [...document.querySelectorAll("[data-gallery-image]")];
const gallerySection = document.querySelector("#praxis");
const phoneTrigger = document.querySelector("[data-phone-trigger]");
const phoneModal = document.querySelector("[data-phone-modal]");
const phoneModalCloseButtons = [...document.querySelectorAll("[data-phone-modal-close]")];

if (year) {
  year.textContent = new Date().getFullYear();
}

function updateHeader() {
  header?.classList.toggle("is-compact", window.scrollY > 24);
}

function updateToday() {
  if (!todayLabel || !todayHours) return;

  const now = new Date();
  const day = now.getDay();
  const hours = openingHours[day];
  todayLabel.textContent = `Heute, ${weekdayNames[day]}`;
  todayHours.textContent = hours ? `${hours.join(" und ")} Uhr` : "Heute keine regulären Sprechzeiten";
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(item);
  });
}

function setupStaggeredSections() {
  const staggerGroups = [
    {
      element: quickInfo,
      itemSelector: ".info-tile",
      x: (index) => `${index % 2 === 0 ? -46 : 46}px`,
      y: "28px",
      rotate: (index) => `${index % 2 === 0 ? -0.8 : 0.8}deg`,
      scale: "0.965",
      delay: 105
    },
    {
      element: praxisHighlights,
      itemSelector: "span",
      x: "-28px",
      y: "12px",
      rotate: "-0.4deg",
      scale: "0.96",
      delay: 92
    },
    {
      element: hoursBoard,
      itemSelector: ".day, .appointment-note",
      x: "-82px",
      y: "0px",
      rotate: "-0.6deg",
      scale: "0.985",
      delay: 86
    },
    {
      element: serviceGrid,
      itemSelector: ".service-card",
      x: (index) => `${index % 2 === 0 ? -96 : 96}px`,
      y: (index) => `${index < 2 ? 22 : 38}px`,
      rotate: (index) => `${index % 2 === 0 ? -1.1 : 1.1}deg`,
      scale: "0.94",
      delay: 132
    },
    {
      element: contactActions,
      itemSelector: ".button",
      x: (index) => `${index % 2 === 0 ? -34 : 34}px`,
      y: "16px",
      rotate: "0deg",
      scale: "0.97",
      delay: 96
    }
  ].filter((group) => group.element);

  if (staggerGroups.length === 0) return;

  function readValue(value, index) {
    return typeof value === "function" ? value(index) : value;
  }

  staggerGroups.forEach((group) => {
    const items = [...group.element.querySelectorAll(group.itemSelector)];
    group.element.classList.add("stagger-group");

    items.forEach((item, index) => {
      item.classList.add("stagger-item");
      item.style.setProperty("--stagger-x", readValue(group.x, index));
      item.style.setProperty("--stagger-y", readValue(group.y, index));
      item.style.setProperty("--stagger-rotate", readValue(group.rotate, index));
      item.style.setProperty("--stagger-scale", readValue(group.scale, index));
      item.style.setProperty("--stagger-delay", `${index * group.delay}ms`);
    });
  });

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".stagger-item").forEach((item) => item.classList.add("is-staggered-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".stagger-item").forEach((item) => {
          item.classList.add("is-staggered-in");
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
  );

  staggerGroups.forEach((group) => observer.observe(group.element));
}

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function setupScrollTextEffects() {
  if (motionTextItems.length === 0) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactMotionQuery = window.matchMedia("(max-width: 680px)");
  const motionProfiles = {
    hero: { strength: 1, y: 38, x: 10, rotate: 0.52, skew: 0.4, scale: 0.02, blur: 0.72, clip: 4, wordY: 10, wordX: 4, wordZ: 18, tilt: 4.8, wave: 2.8 },
    cinematic: { strength: 0.96, y: 36, x: 9, rotate: 0.44, skew: 0.34, scale: 0.018, blur: 0.68, clip: 5, wordY: 9.2, wordX: 3.5, wordZ: 15, tilt: 4.2, wave: 2.5 },
    headline: { strength: 0.86, y: 32, x: 8, rotate: 0.34, skew: 0.26, scale: 0.016, blur: 0.56, clip: 4, wordY: 8, wordX: 3, wordZ: 12, tilt: 3.3, wave: 2.1 },
    "gallery-title": { strength: 0.74, y: 24, x: 12, rotate: 0.3, skew: 0.18, scale: 0.012, blur: 0.44, clip: 3, wordY: 6.4, wordX: 5, wordZ: 9, tilt: 2.6, wave: 1.8 },
    "card-title": { strength: 0.56, y: 20, x: 5, rotate: 0.2, skew: 0.12, scale: 0.01, blur: 0.34, clip: 2, wordY: 5, wordX: 2.2, wordZ: 5, tilt: 1.5, wave: 1.2 },
    caption: { strength: 0.38, y: 12, x: 8, rotate: 0.12, skew: 0, scale: 0.006, blur: 0.18, clip: 0, wordY: 2.4, wordX: 3, wordZ: 2, tilt: 0.7, wave: 0.8 },
    focus: { strength: 0.3, y: 16, x: 2, rotate: 0.08, skew: 0, scale: 0.004, blur: 0.2, clip: 0, wordY: 2.6, wordX: 0.8, wordZ: 1.5, tilt: 0.45, wave: 0.55 },
    label: { strength: 0.4, y: 14, x: 8, rotate: 0.1, skew: 0, scale: 0.004, blur: 0.16, clip: 0, wordY: 2.4, wordX: 2.2, wordZ: 2, tilt: 0.5, wave: 0.7 }
  };
  let frame = 0;

  motionTextItems.forEach((item) => {
    if (!item.hasAttribute("data-motion-words") || item.dataset.motionPrepared === "true") return;

    const words = item.textContent.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    item.textContent = "";
    item.style.setProperty("--word-count", words.length);
    words.forEach((word, index) => {
      const wordElement = document.createElement("span");
      wordElement.className = "motion-word";
      wordElement.textContent = word;
      wordElement.style.setProperty("--word-index", index);
      wordElement.style.setProperty("--word-arrive-delay", `${index * 58}ms`);
      wordElement.style.setProperty("--word-gallery-delay", `${index * 72}ms`);

      item.append(wordElement);

      if (index < words.length - 1) {
        item.append(" ");
      }
    });
    item.dataset.motionPrepared = "true";
  });

  function setMotionProperties(item, properties) {
    Object.entries(properties).forEach(([property, value]) => {
      item.style.setProperty(property, value);
    });
  }

  function setReducedMotion() {
    motionTextItems.forEach((item) => {
      setMotionProperties(item, {
        "--text-motion-x": "0px",
        "--text-motion-y": "0px",
        "--text-motion-rotate": "0deg",
        "--text-motion-scale": "1",
        "--text-motion-blur": "0px",
        "--text-motion-opacity": "1",
        "--text-motion-skew": "0deg",
        "--text-motion-clip": "0%"
      });

      item.querySelectorAll(".motion-word").forEach((word) => {
        setMotionProperties(word, {
          "--word-x": "0px",
          "--word-y": "0px",
          "--word-z": "0px",
          "--word-tilt": "0deg",
          "--word-rotate": "0deg",
          "--word-scale": "1",
          "--word-opacity": "1"
        });
      });

    });
  }

  function updateTextMotion() {
    frame = 0;

    if (reducedMotionQuery.matches) {
      setReducedMotion();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const compactStrength = compactMotionQuery.matches ? 0.72 : 1;

    motionTextItems.forEach((item, itemIndex) => {
      const rect = item.getBoundingClientRect();
      const type = item.dataset.motionText || "focus";
      const profile = motionProfiles[type] ?? motionProfiles.focus;
      const strength = profile.strength * compactStrength;
      const centerOffset = (rect.top + rect.height * 0.5 - viewportHeight * 0.52) / viewportHeight;
      const focus = clamp(1 - Math.abs(centerOffset) / 0.98);
      const travel = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
      const looseness = 1 - focus;
      const direction = itemIndex % 2 === 0 ? 1 : -1;
      const breath = Math.sin(travel * Math.PI * 1.35 + itemIndex * 0.32);
      const blur = looseness * profile.blur * strength;
      const y = (0.5 - travel) * profile.y * strength + breath * profile.wave * 0.86;
      const x = centerOffset * -profile.x * strength + direction * looseness * profile.x * 0.54;
      const rotate = centerOffset * -profile.rotate * strength + breath * profile.rotate * 0.18;
      const skew = centerOffset * -profile.skew * strength;
      const scale = 1 - looseness * profile.scale * strength + focus * 0.004;
      const opacity = 0.82 + focus * 0.18;
      const clip = `${(looseness * profile.clip).toFixed(2)}%`;

      setMotionProperties(item, {
        "--text-motion-x": `${x.toFixed(2)}px`,
        "--text-motion-y": `${y.toFixed(2)}px`,
        "--text-motion-rotate": `${rotate.toFixed(2)}deg`,
        "--text-motion-scale": scale.toFixed(3),
        "--text-motion-blur": `${blur.toFixed(2)}px`,
        "--text-motion-opacity": opacity.toFixed(3),
        "--text-motion-skew": `${skew.toFixed(2)}deg`,
        "--text-motion-clip": clip
      });
      item.classList.toggle("is-motion-hot", focus > 0.72);

      item.querySelectorAll(".motion-word").forEach((word, index) => {
        const wordDirection = index % 2 === 0 ? 1 : -1;
        const wave = Math.sin(travel * Math.PI * 2.35 + index * 0.58 + itemIndex * 0.24);
        const staggerFocus = clamp(focus * 1.16 - index * 0.035);
        const orbit = Math.cos(travel * Math.PI * 1.65 + index * 0.72 + itemIndex * 0.12);
        const wordY = (looseness * (profile.wordY + (index % 3) * 1.8) + wave * profile.wave * 1.28) * strength;
        const wordX = (wordDirection * looseness * profile.wordX * 1.25 + orbit * profile.wordX * 0.45) * strength;
        const wordZ = (focus * profile.wordZ - looseness * profile.wordZ * 0.58 + wave * profile.wordZ * 0.12) * strength;
        const wordTilt = (wordDirection * looseness * profile.tilt + wave * profile.tilt * 0.3) * strength;
        const wordRotate = (wordDirection * looseness * profile.rotate * 0.9 + wave * profile.rotate * 0.28) * strength;
        const wordScale = 0.974 + staggerFocus * 0.026;
        const wordOpacity = 0.78 + staggerFocus * 0.22;

        setMotionProperties(word, {
          "--word-x": `${wordX.toFixed(2)}px`,
          "--word-y": `${wordY.toFixed(2)}px`,
          "--word-z": `${wordZ.toFixed(2)}px`,
          "--word-tilt": `${wordTilt.toFixed(2)}deg`,
          "--word-rotate": `${wordRotate.toFixed(2)}deg`,
          "--word-scale": wordScale.toFixed(3),
          "--word-opacity": wordOpacity.toFixed(3)
        });

      });
    });
  }

  function requestTextMotionUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateTextMotion);
  }

  window.addEventListener("scroll", requestTextMotionUpdate, { passive: true });
  window.addEventListener("resize", requestTextMotionUpdate);
  reducedMotionQuery.addEventListener?.("change", requestTextMotionUpdate);
  updateTextMotion();
}

function setupScrollGallery() {
  if (!gallerySection || gallerySteps.length === 0 || galleryImages.length === 0) return;

  let activeIndex = -1;
  let frame = 0;
  const phoneGalleryQuery = window.matchMedia("(max-width: 680px)");

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;

    gallerySteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === index);
    });

    galleryImages.forEach((image, imageIndex) => {
      image.classList.toggle("is-active", imageIndex === index);
    });
  }

  function updateActiveStep() {
    frame = 0;
    const gallery = document.querySelector("[data-scroll-gallery]");
    const galleryRect = gallery?.getBoundingClientRect();
    const sectionRect = gallerySection.getBoundingClientRect();
    const scrollRange = Math.max(sectionRect.height - window.innerHeight, 1);
    const progress = Math.min(Math.max(-sectionRect.top / scrollRange, 0), 1);
    const revealProgress = Math.min(progress / 0.18, 1);
    const exitProgress = Math.min(Math.max((progress - 0.84) / 0.16, 0), 1);
    const scale = 0.88 + revealProgress * 0.12;
    const inset = 10 - revealProgress * 10;
    const isPhoneGallery = phoneGalleryQuery.matches;
    const activeImageScale = 1.02 + progress * (isPhoneGallery ? 0.12 : 0.08);

    gallerySection.style.setProperty("--gallery-scale", scale.toFixed(3));
    gallerySection.style.setProperty("--gallery-inset", inset.toFixed(3));
    gallerySection.style.setProperty("--gallery-radius", `${8 - revealProgress * 8}px`);
    gallerySection.style.setProperty("--gallery-entry-fade", ((1 - revealProgress) * 0.46).toFixed(3));
    gallerySection.style.setProperty("--gallery-exit-fade", exitProgress.toFixed(3));
    gallerySection.style.setProperty("--image-scale", activeImageScale.toFixed(3));

    if (isPhoneGallery) {
      const mobileItemCount = Math.min(gallerySteps.length, galleryImages.length);
      const mobileProgress = Math.min(Math.max((progress - 0.06) / 0.8, 0), 1);
      const mobileIndex = Math.min(
        mobileItemCount - 1,
        Math.max(0, Math.round(mobileProgress * (mobileItemCount - 1)))
      );
      setActive(mobileIndex);
      return;
    }

    let focusLine = window.innerHeight * 0.52;

    if (
      window.matchMedia("(max-width: 980px)").matches &&
      galleryRect &&
      galleryRect.bottom > 0 &&
      galleryRect.bottom < window.innerHeight
    ) {
      focusLine = galleryRect.bottom + (window.innerHeight - galleryRect.bottom) * 0.42;
    }

    const closest = gallerySteps.reduce(
      (best, step, index) => {
        const rect = step.getBoundingClientRect();
        const isNearViewport = rect.bottom > 0 && rect.top < window.innerHeight;
        const distance = Math.abs(rect.top + rect.height * 0.5 - focusLine);

        if (!isNearViewport && best.index !== -1) return best;
        return distance < best.distance ? { distance, index } : best;
      },
      { distance: Number.POSITIVE_INFINITY, index: -1 }
    );

    const stepInView = gallerySteps.some((step) => {
      const rect = step.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    const fallbackProgress = Math.min(Math.max((progress - 0.12) / 0.78, 0), 1);
    const fallbackIndex = Math.round(fallbackProgress * (gallerySteps.length - 1));

    setActive(stepInView ? Math.max(closest.index, 0) : fallbackIndex);
  }

  function requestUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(updateActiveStep);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateActiveStep();
}

function isMobileCallDevice() {
  const hasMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const hasPhoneLikePointer = window.matchMedia("(max-width: 760px) and (pointer: coarse)").matches;
  return hasMobileUserAgent || hasPhoneLikePointer;
}

function setupPhoneModal() {
  if (!phoneTrigger || !phoneModal) return;

  const closeButton = phoneModal.querySelector(".phone-modal-close");

  function openModal() {
    phoneModal.hidden = false;
    document.body.classList.add("has-modal-open");
    closeButton?.focus();
  }

  function closeModal() {
    phoneModal.hidden = true;
    document.body.classList.remove("has-modal-open");
    phoneTrigger.focus();
  }

  phoneTrigger.addEventListener("click", (event) => {
    if (isMobileCallDevice()) return;
    event.preventDefault();
    openModal();
  });

  phoneModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !phoneModal.hidden) {
      closeModal();
    }
  });
}

updateHeader();
updateToday();
setupReveal();
setupStaggeredSections();
setupScrollTextEffects();
setupScrollGallery();
setupPhoneModal();

window.addEventListener("scroll", updateHeader, { passive: true });
