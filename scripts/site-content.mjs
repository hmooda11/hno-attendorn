import { access, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
export const contentFile = join(root, "content/site.json");

const requiredStringPaths = [
  "site.language",
  "site.url",
  "site.name",
  "site.doctorName",
  "site.doctorTitle",
  "site.medicalSpecialty",
  "seo.title",
  "seo.description",
  "seo.socialTitle",
  "seo.socialDescription",
  "seo.socialImage",
  "contact.street",
  "contact.postalCode",
  "contact.city",
  "contact.countryCode",
  "contact.phoneDisplay",
  "contact.phoneLink",
  "contact.faxDisplay",
  "contact.faxLink",
  "contact.email",
  "contact.bookingUrl",
  "contact.mapsUrl",
  "navigation.practice",
  "navigation.hours",
  "navigation.services",
  "navigation.contact",
  "navigation.legal",
  "hero.eyebrow",
  "hero.title",
  "hero.subtitle",
  "hero.headerBookingButton",
  "hero.bookingButton",
  "hero.phoneButton",
  "hero.mapsButton",
  "hero.initialStatusLabel",
  "hero.initialStatusText",
  "quickInfo.addressLabel",
  "quickInfo.phoneLabel",
  "quickInfo.emailLabel",
  "quickInfo.appointmentsLabel",
  "quickInfo.appointmentsText",
  "practice.eyebrow",
  "practice.title",
  "practice.galleryLabel",
  "practice.galleryNote",
  "hoursSection.eyebrow",
  "hoursSection.title",
  "hoursSection.intro",
  "hoursSection.appointmentNote",
  "hoursSection.closedLabel",
  "hoursSection.todayPrefix",
  "hoursSection.hoursJoiner",
  "hoursSection.hoursSuffix",
  "hoursSection.closedTodayText",
  "servicesSection.eyebrow",
  "servicesSection.title",
  "servicesSection.intro",
  "contactSection.eyebrow",
  "contactSection.title",
  "contactSection.intro",
  "contactSection.bookingButton",
  "contactSection.emailButton",
  "phoneModal.eyebrow",
  "phoneModal.title",
  "phoneModal.text",
  "footer.contactHeading",
  "footer.privacyHeading",
  "footer.privacyText",
  "footer.telephoneLabel",
  "footer.faxLabel",
  "footer.emailLabel",
  "accessibility.skipLink",
  "accessibility.homeLabel",
  "accessibility.navigationLabel",
  "accessibility.heroActionsLabel",
  "accessibility.practiceStatusLabel",
  "accessibility.quickInfoLabel",
  "accessibility.practiceHighlightsLabel",
  "accessibility.galleryLabel",
  "accessibility.galleryStepsLabel",
  "accessibility.hoursLabel",
  "accessibility.servicesLabel",
  "accessibility.closeLabel"
];

const weekdays = new Map([
  [0, ["sunday", "Sunday"]],
  [1, ["monday", "Monday"]],
  [2, ["tuesday", "Tuesday"]],
  [3, ["wednesday", "Wednesday"]],
  [4, ["thursday", "Thursday"]],
  [5, ["friday", "Friday"]],
  [6, ["saturday", "Saturday"]]
]);

function valueAt(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function requireStrings(errors, content) {
  requiredStringPaths.forEach((path) => {
    const value = valueAt(content, path);
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${path} muss ausgefüllt sein.`);
    }
  });
}

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateStringList(errors, value, path, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum) {
    errors.push(`${path} benötigt mindestens ${minimum} Eintrag/Einträge.`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      errors.push(`${path}.${index} muss ausgefüllt sein.`);
    }
  });
}

export function validateSiteContent(content) {
  const errors = [];
  requireStrings(errors, content);

  if (!validHttpsUrl(content?.site?.url)) {
    errors.push("site.url muss eine vollständige HTTPS-Adresse sein.");
  }
  if (!validHttpsUrl(content?.contact?.bookingUrl)) {
    errors.push("contact.bookingUrl muss eine vollständige HTTPS-Adresse sein.");
  }
  if (!validHttpsUrl(content?.contact?.mapsUrl)) {
    errors.push("contact.mapsUrl muss eine vollständige HTTPS-Adresse sein.");
  }
  if (!/^\/content\/images\/.+\.(avif|jpe?g|png|webp)$/i.test(content?.seo?.socialImage ?? "")) {
    errors.push("seo.socialImage muss ein Bild aus /content/images sein.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content?.contact?.email ?? "")) {
    errors.push("contact.email ist keine gültige E-Mail-Adresse.");
  }
  for (const key of ["phoneLink", "faxLink"]) {
    if (!/^\+[1-9]\d{6,14}$/.test(content?.contact?.[key] ?? "")) {
      errors.push(`contact.${key} muss im internationalen Format stehen, zum Beispiel +49272254795.`);
    }
  }

  validateStringList(errors, content?.practice?.paragraphs, "practice.paragraphs");
  validateStringList(errors, content?.practice?.highlights, "practice.highlights");

  if (!Array.isArray(content?.services) || content.services.length < 1) {
    errors.push("services benötigt mindestens einen Eintrag.");
  } else {
    content.services.forEach((service, index) => {
      for (const key of ["number", "title", "text"]) {
        if (typeof service?.[key] !== "string" || service[key].trim() === "") {
          errors.push(`services.${index}.${key} muss ausgefüllt sein.`);
        }
      }
    });
  }

  if (!Array.isArray(content?.gallery) || content.gallery.length < 1) {
    errors.push("gallery benötigt mindestens einen Eintrag.");
  } else {
    content.gallery.forEach((item, index) => {
      for (const key of ["image", "alt", "captionLabel", "captionTitle", "stepNumber", "stepTitle", "stepText"]) {
        if (typeof item?.[key] !== "string" || item[key].trim() === "") {
          errors.push(`gallery.${index}.${key} muss ausgefüllt sein.`);
        }
      }
      if (typeof item?.image === "string" && !/^\/content\/images\/.+\.(avif|jpe?g|png|webp)$/i.test(item.image)) {
        errors.push(`gallery.${index}.image muss ein Bild aus /content/images sein.`);
      }
    });
  }

  if (!Array.isArray(content?.openingHours) || content.openingHours.length !== 7) {
    errors.push("openingHours muss alle sieben Wochentage enthalten.");
  } else {
    const seenDays = new Set();
    content.openingHours.forEach((day, index) => {
      const expected = weekdays.get(day?.jsDay);
      if (!expected || expected[0] !== day?.id || expected[1] !== day?.schemaDay || seenDays.has(day?.jsDay)) {
        errors.push(`openingHours.${index} enthält ungültige Wochentagsdaten.`);
      }
      seenDays.add(day?.jsDay);
      if (typeof day?.label !== "string" || day.label.trim() === "") {
        errors.push(`openingHours.${index}.label muss ausgefüllt sein.`);
      }
      if (typeof day?.showOnBoard !== "boolean") {
        errors.push(`openingHours.${index}.showOnBoard muss wahr oder falsch sein.`);
      }
      if (!Array.isArray(day?.intervals) || day.intervals.length > 3) {
        errors.push(`openingHours.${index}.intervals darf höchstens drei Zeiträume enthalten.`);
        return;
      }
      day.intervals.forEach((interval, intervalIndex) => {
        const open = interval?.open;
        const close = interval?.close;
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(open ?? "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(close ?? "")) {
          errors.push(`openingHours.${index}.intervals.${intervalIndex} benötigt Uhrzeiten im Format HH:MM.`);
        } else if (open >= close) {
          errors.push(`openingHours.${index}.intervals.${intervalIndex}: Die Endzeit muss nach der Startzeit liegen.`);
        } else if (intervalIndex > 0 && day.intervals[intervalIndex - 1]?.close > open) {
          errors.push(`openingHours.${index}.intervals.${intervalIndex}: Zeiträume dürfen sich nicht überschneiden und müssen sortiert sein.`);
        }
      });
    });
  }

  if (errors.length > 0) {
    throw new Error(`Die Website-Inhalte sind ungültig:\n- ${errors.join("\n- ")}`);
  }

  return content;
}

export async function loadSiteContent() {
  let content;
  try {
    content = JSON.parse(await readFile(contentFile, "utf8"));
  } catch (error) {
    throw new Error(`content/site.json konnte nicht gelesen werden: ${error.message}`);
  }

  validateSiteContent(content);

  await Promise.all(
    [...content.gallery.map((item, index) => ({ path: item.image, label: `Galeriebild ${index + 1}` })),
      { path: content.seo.socialImage, label: "Vorschaubild" }].map(async (item) => {
      try {
        await access(join(root, "public", item.path.replace(/^\//, "")));
      } catch {
        throw new Error(`${item.label} fehlt: public${item.path}`);
      }
    })
  );

  return content;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(base, path) {
  return new URL(path, base).href;
}

function formatTime(value) {
  const [hour, minute] = value.split(":");
  return minute === "00" ? String(Number(hour)) : `${Number(hour)}:${minute}`;
}

function formatInterval(interval) {
  return `${formatTime(interval.open)} - ${formatTime(interval.close)}`;
}

function flattenStrings(value, prefix = "", output = {}) {
  if (typeof value === "string" || typeof value === "number") {
    output[prefix] = escapeHtml(value);
    return output;
  }
  if (!value || Array.isArray(value) || typeof value !== "object") return output;
  Object.entries(value).forEach(([key, child]) => {
    flattenStrings(child, prefix ? `${prefix}.${key}` : key, output);
  });
  return output;
}

function renderStructuredData(content) {
  const openingHoursSpecification = content.openingHours.flatMap((day) =>
    day.intervals.map((interval) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: day.schemaDay,
      opens: interval.open,
      closes: interval.close
    }))
  );

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: content.site.name,
    url: content.site.url,
    image: absoluteUrl(content.site.url, content.seo.socialImage),
    medicalSpecialty: content.site.medicalSpecialty,
    employee: {
      "@type": "Physician",
      name: content.site.doctorName,
      medicalSpecialty: content.site.medicalSpecialty
    },
    telephone: content.contact.phoneLink,
    faxNumber: content.contact.faxLink,
    email: content.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: content.contact.street,
      postalCode: content.contact.postalCode,
      addressLocality: content.contact.city,
      addressCountry: content.contact.countryCode
    },
    openingHoursSpecification
  }, null, 2).replaceAll("<", "\\u003c");
}

function renderHoursBoard(content) {
  return content.openingHours
    .filter((day) => day.showOnBoard)
    .map((day) => {
      const intervals = day.intervals.length > 0
        ? day.intervals.map((interval) => `<strong>${escapeHtml(formatInterval(interval))}</strong>`).join("\n")
        : `<strong>${escapeHtml(content.hoursSection.closedLabel)}</strong>`;
      return `<div class="day">
        <span>${escapeHtml(day.label)}</span>
        ${intervals}
      </div>`;
    })
    .join("\n");
}

function renderServices(content) {
  return content.services.map((service) => `<article class="service-card reveal">
    <span aria-hidden="true">${escapeHtml(service.number)}</span>
    <h3 data-motion-text="card-title" data-motion-words>${escapeHtml(service.title)}</h3>
    <p data-motion-text="focus">${escapeHtml(service.text)}</p>
  </article>`).join("\n");
}

function renderGalleryImages(content) {
  return content.gallery.map((item, index) => `<figure class="scroll-image${index === 0 ? " is-active" : ""}" data-gallery-image="${index}">
    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async" />
    <figcaption class="slide-caption">
      <span>${escapeHtml(item.captionLabel)}</span>
      <strong data-motion-text="caption">${escapeHtml(item.captionTitle)}</strong>
    </figcaption>
  </figure>`).join("\n");
}

function renderGallerySteps(content) {
  return content.gallery.map((item, index) => `<article class="gallery-step${index === 0 ? " is-active" : ""}" data-gallery-step="${index}">
    <span>${escapeHtml(item.stepNumber)}</span>
    <h3 data-motion-text="gallery-title" data-motion-words>${escapeHtml(item.stepTitle)}</h3>
    <p data-motion-text="focus">${escapeHtml(item.stepText)}</p>
  </article>`).join("\n");
}

export function renderSiteHtml(template, content) {
  const replacements = {
    "CMS:structured-data": renderStructuredData(content),
    "CMS:practice-paragraphs": content.practice.paragraphs.map((paragraph) => `<p data-motion-text="focus">${escapeHtml(paragraph)}</p>`).join("\n"),
    "CMS:practice-highlights": content.practice.highlights.map((highlight) => `<span>${escapeHtml(highlight)}</span>`).join("\n"),
    "CMS:gallery-images": renderGalleryImages(content),
    "CMS:gallery-steps": renderGallerySteps(content),
    "CMS:hours-board": renderHoursBoard(content),
    "CMS:services": renderServices(content)
  };

  let html = template;
  Object.entries(replacements).forEach(([marker, replacement]) => {
    html = html.replace(`<!-- ${marker} -->`, replacement);
  });

  const tokens = {
    ...flattenStrings(content),
    "seo.socialImageAbsolute": escapeHtml(absoluteUrl(content.site.url, content.seo.socialImage)),
    "contact.addressSingleLine": escapeHtml(`${content.contact.street}, ${content.contact.postalCode} ${content.contact.city}`),
    "contact.addressTwoLines": `${escapeHtml(content.contact.street)}<br />${escapeHtml(`${content.contact.postalCode} ${content.contact.city}`)}`,
    "site.doctorLine": escapeHtml(`${content.site.doctorName}, ${content.site.doctorTitle}`),
    "gallery.count": String(content.gallery.length)
  };

  Object.entries(tokens).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value);
  });

  const unresolved = [...html.matchAll(/\{\{([^}]+)\}\}|<!--\s*CMS:([^\s]+)\s*-->/g)].map((match) => match[1] ?? match[2]);
  if (unresolved.length > 0) {
    throw new Error(`Nicht aufgelöste Inhaltsfelder im HTML: ${unresolved.join(", ")}`);
  }

  return html;
}

export function contentImageExtension(path) {
  return extname(path).toLowerCase();
}
