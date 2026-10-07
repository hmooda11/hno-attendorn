import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { contentFile, renderSiteHtml, validateSiteContent } from "../scripts/site-content.mjs";

const baseline = JSON.parse(await readFile(contentFile, "utf8"));
const template = await readFile(new URL("../index.html", import.meta.url), "utf8");

function copyContent() {
  return structuredClone(baseline);
}

test("current CMS content is valid", () => {
  assert.doesNotThrow(() => validateSiteContent(copyContent()));
});

test("closed days and days with one or two intervals are valid", () => {
  const content = copyContent();
  content.openingHours.find((day) => day.id === "monday").intervals = [];
  content.openingHours.find((day) => day.id === "tuesday").intervals = [{ open: "08:30", close: "12:30" }];
  content.openingHours.find((day) => day.id === "wednesday").intervals = [
    { open: "08:00", close: "12:00" },
    { open: "14:00", close: "17:30" }
  ];
  assert.doesNotThrow(() => validateSiteContent(content));
});

test("invalid contact data is rejected", () => {
  const content = copyContent();
  content.contact.email = "keine-adresse";
  content.contact.bookingUrl = "http://unsicher.example";
  assert.throws(() => validateSiteContent(content), /contact\.email/);
  assert.throws(() => validateSiteContent(content), /contact\.bookingUrl/);
});

test("invalid and overlapping opening hours are rejected", () => {
  const invalidTime = copyContent();
  invalidTime.openingHours[0].intervals[0].open = "8 Uhr";
  assert.throws(() => validateSiteContent(invalidTime), /Format HH:MM/);

  const overlap = copyContent();
  overlap.openingHours[0].intervals = [
    { open: "08:00", close: "12:00" },
    { open: "11:30", close: "14:00" }
  ];
  assert.throws(() => validateSiteContent(overlap), /nicht überschneiden/);
});

test("rendering escapes editor text and resolves every template token", () => {
  const content = copyContent();
  content.hero.title = "HNO & <script>alert('x')</script>";
  const html = renderSiteHtml(template, validateSiteContent(content));
  assert.match(html, /HNO &amp; &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /\{\{|CMS:/);
});

test("contact and opening-hour data feed all generated representations", () => {
  const content = copyContent();
  content.contact.phoneLink = "+491234567890";
  content.openingHours.find((day) => day.id === "monday").intervals = [{ open: "09:00", close: "11:30" }];
  const html = renderSiteHtml(template, validateSiteContent(content));
  assert.ok(html.match(/tel:\+491234567890/g)?.length >= 4);
  assert.match(html, /9 - 11:30/);
  assert.match(html, /"opens": "09:00"/);
  assert.match(html, /"closes": "11:30"/);
});
