import { readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { contentImageExtension, loadSiteContent } from "./site-content.mjs";

export async function optimizeContentImages(outputDirectory) {
  const content = await loadSiteContent();
  const imagePaths = new Set([
    content.seo.socialImage,
    ...content.gallery.map((item) => item.image)
  ]);

  for (const publicPath of imagePaths) {
    if (!publicPath.startsWith("/content/images/")) continue;
    const outputPath = join(outputDirectory, publicPath.replace(/^\//, ""));
    const extension = contentImageExtension(publicPath);
    const before = (await stat(outputPath)).size;
    let pipeline = sharp(await readFile(outputPath), { failOn: "warning" })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });

    if (extension === ".jpg" || extension === ".jpeg") {
      pipeline = pipeline.jpeg({ quality: 84, progressive: true, mozjpeg: true });
    } else if (extension === ".png") {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else if (extension === ".webp") {
      pipeline = pipeline.webp({ quality: 84, smartSubsample: true });
    } else if (extension === ".avif") {
      pipeline = pipeline.avif({ quality: 58, effort: 5 });
    }

    await writeFile(outputPath, await pipeline.toBuffer());
    const after = (await stat(outputPath)).size;
    console.log(`Bild optimiert: ${publicPath} (${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB)`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const outputDirectory = process.argv[2];
  if (!outputDirectory) throw new Error("Ausgabeordner fehlt.");
  await optimizeContentImages(resolve(outputDirectory));
}
