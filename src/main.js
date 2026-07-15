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
const todayLabel = document.querySelector("[data-today-label]");
const todayHours = document.querySelector("[data-today-hours]");
const year = document.querySelector("[data-year]");

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

updateHeader();
updateToday();
setupReveal();

window.addEventListener("scroll", updateHeader, { passive: true });
