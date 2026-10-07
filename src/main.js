import siteContent from "../content/site.json";

function formatTime(value) {
  const [hour, minute] = value.split(":");
  return minute === "00" ? String(Number(hour)) : `${Number(hour)}:${minute}`;
}

function formatInterval(interval) {
  return `${formatTime(interval.open)} - ${formatTime(interval.close)}`;
}

const openingHours = Object.fromEntries(
  siteContent.openingHours.map((day) => [day.jsDay, day.intervals.map(formatInterval)])
);
const weekdayNames = Object.fromEntries(siteContent.openingHours.map((day) => [day.jsDay, day.label]));

const header = document.querySelector("[data-header]");
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
  todayLabel.textContent = `${siteContent.hoursSection.todayPrefix}, ${weekdayNames[day]}`;
  todayHours.textContent = hours.length > 0
    ? `${hours.join(siteContent.hoursSection.hoursJoiner)}${siteContent.hoursSection.hoursSuffix}`
    : siteContent.hoursSection.closedTodayText;
}

function setupEditorialMotion() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window)) return;

  const targets = new Set(document.querySelectorAll(
    "[data-motion-words], .info-tile, .praxis-highlights > span, .day, .appointment-note, .service-card, .contact-actions > .button"
  ));

  document.querySelectorAll("[data-motion-words]").forEach((heading) => {
    const words = heading.textContent.trim().split(/\s+/);
    heading.textContent = "";
    words.forEach((word, index) => {
      const mask = document.createElement("span");
      const ink = document.createElement("span");
      mask.className = "word-mask";
      ink.className = "word-ink";
      ink.textContent = word;
      ink.style.setProperty("--word-delay", `${Math.min(index * 65, 390)}ms`);
      mask.append(ink);
      heading.append(mask);
      if (index < words.length - 1) heading.append(" ");
    });
  });

  [".quick-info", ".praxis-highlights", ".hours-board", ".contact-actions"].forEach((selector) => {
    document.querySelector(selector)?.querySelectorAll(":scope > *").forEach((item, index) => {
      item.style.setProperty("--entry-delay", `${Math.min(index * 85, 340)}ms`);
    });
  });

  targets.forEach((item) => item.classList.add("motion-target"));
  // Reset only after full exit, so reading near the trigger line never causes flicker.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      if (isIntersecting) target.classList.add("is-entered");
      else if (boundingClientRect.bottom <= 0 || boundingClientRect.top >= window.innerHeight) {
        target.classList.remove("is-entered");
      }
    });
  }, { threshold: 0 });

  function syncPreference() {
    observer.disconnect();
    document.documentElement.classList.toggle("motion-enabled", !reducedMotion.matches);
    targets.forEach((item) => {
      item.classList.remove("is-entered");
      if (!reducedMotion.matches) observer.observe(item);
    });
  }

  reducedMotion.addEventListener("change", syncPreference);
  syncPreference();
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
setupEditorialMotion();
setupScrollGallery();
setupPhoneModal();

window.addEventListener("scroll", updateHeader, { passive: true });
