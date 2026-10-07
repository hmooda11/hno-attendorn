import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const config = parse(await readFile(new URL("../.pages.yml", import.meta.url), "utf8"));

test("Pages CMS configuration targets the single content source", () => {
  assert.equal(config.content.length, 1);
  assert.equal(config.content[0].path, "content/site.json");
  assert.equal(config.content[0].format, "json");
  assert.equal(config.settings.content.merge, true);
});

test("Pages CMS uploads media to the dedicated public image folder", () => {
  assert.equal(config.media[0].name, "content_images");
  assert.equal(config.media[0].input, "public/content/images");
  assert.equal(config.media[0].output, "/content/images");
});

test("important editor fields are required", () => {
  const fields = new Map(config.content[0].fields.map((field) => [field.name, field]));
  for (const name of ["site", "contact", "hero", "gallery", "openingHours", "services", "seo"]) {
    assert.equal(fields.get(name)?.required, true, `${name} should be required`);
  }

  const galleryFields = new Map(fields.get("gallery").fields.map((field) => [field.name, field]));
  assert.equal(galleryFields.get("image")?.required, true);
  assert.equal(galleryFields.get("alt")?.required, true);
});
