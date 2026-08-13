const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");
// Vercel and custom-domain deployments serve this export from the domain root.
// GitHub Pages can still opt into a repository subpath with STATIC_BASE_HREF.
const baseHref = process.env.STATIC_BASE_HREF ?? "/";

const htmlRoutes = [
  ["guides.html", "index.html"],
  ["about.html", "about/index.html"],
  ["contact.html", "contact/index.html"],
  ["guides.html", "guides/index.html"],
  ["trips.html", "trips/index.html"],
  ["city-experiences.html", "trips/shanghai/index.html"],
  ["city-experiences.html", "trips/beijing/index.html"],
  ["city-experiences.html", "trips/shenzhen/index.html"],
  ["city-experiences.html", "trips/chengdu/index.html"],
  ["city-experiences.html", "trips/guangzhou/index.html"],
  ["city-experiences.html", "trips/hangzhou/index.html"],
  ["city-experiences.html", "trips/chongqing/index.html"],
];

async function readData(name, fallback = []) {
  return JSON.parse(await fs.readFile(path.join(root, "data", name), "utf8").catch(() => JSON.stringify(fallback)));
}

async function contentRoutes() {
  const [guides, experiences] = await Promise.all([
    readData("guide-articles.json"),
    readData("experiences.json")
  ]);
  return [
    ...(Array.isArray(guides) ? guides : [])
      .filter((guide) => guide.slug && guide.status === "published")
      .map((guide) => ["guide-detail.html", `guides/${guide.slug}/index.html`]),
    ...(Array.isArray(experiences) ? experiences : [])
      .filter((experience) => experience.slug && experience.published !== false)
      .map((experience) => ["trip-detail.html", `trips/${experience.slug}/index.html`])
  ];
}

async function guideCollectionRoutes() {
  const collections = await readData("guide-collections.json");
  return (Array.isArray(collections) ? collections : [])
    .filter((collection) => collection.active !== false)
    .filter((collection) => collection.id)
    .flatMap((collection) => {
      const aliases = new Set([
        collection.id,
        collection.slug,
        String(collection.id).replace(/^collection-/, "")
      ].filter(Boolean));
      return [...aliases].map((slug) => ["guide-collection.html", `guides/collections/${slug}/index.html`]);
    });
}

function rewriteStaticHtml(html) {
  let output = html;
  output = output.replace(
    /<script src="\/site\.js([^"]*)" defer><\/script>/,
    `<script>window.__CHINAMIGO_STATIC__ = true;</script>\n    <script src="site.js$1" defer></script>`
  );
  output = output
    .replace(/href="\.\/"/g, 'href="/"')
    .replace(/action="\/api\/inquiries"/g, 'data-static-action="inquiry"');

  output = output.replace(/(["'`])assets\//g, "$1/assets/");
  output = output.replace(/(["'`])trips\//g, "$1/trips/");
  output = output.replace(/(["'`])guides\//g, "$1/guides/");
  output = output.replace(/(["'])styles\.css/g, "$1/styles.css");
  output = output.replace(/(["'])site\.js/g, "$1/site.js");
  if (baseHref && !output.includes("<base ")) {
    output = output.replace(/<head>/i, `<head>\n    <base href="${baseHref}">`);
  }
  return output;
}

async function copyIfExists(from, to) {
  try {
    await fs.cp(from, to, { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function writeRoute(source, target) {
  const html = await fs.readFile(path.join(root, source), "utf8");
  const targetPath = path.join(outDir, target);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, rewriteStaticHtml(html));
}

async function writeStaticApi(target, data) {
  const targetPath = path.join(outDir, target);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, JSON.stringify({ ok: true, data }));
}

function collectionSlug(collection = {}) {
  return String(collection.slug || collection.id || collection.title || "collection")
    .trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function publicCollections(collections, guides) {
  const publishedGuides = (guides || []).filter((guide) => guide.status === "published");
  const bySlug = new Map(publishedGuides.map((guide) => [guide.slug, guide]));
  return (collections || []).filter((collection) => collection.active !== false).map((collection) => {
    const manual = (collection.guideSlugs || []).map((slug) => bySlug.get(slug)).filter(Boolean);
    const category = publishedGuides.filter((guide) => (collection.categories || []).includes(guide.category));
    const seen = new Set();
    const matched = [...manual, ...category].filter((guide) => guide?.slug && !seen.has(guide.slug) && seen.add(guide.slug));
    return {
      ...collection,
      count: matched.length,
      href: `/guides/collections/${collectionSlug(collection)}`,
      guides: matched,
      imagePosition: collection.imagePosition || "center center",
      imageScale: collection.imageScale || 1.02
    };
  });
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await copyIfExists(path.join(root, "assets"), path.join(outDir, "assets"));
  await copyIfExists(path.join(root, "data"), path.join(outDir, "data"));
  await copyIfExists(path.join(root, "styles.css"), path.join(outDir, "styles.css"));
  await copyIfExists(path.join(root, "site.js"), path.join(outDir, "site.js"));
  for (const [source, target] of [...htmlRoutes, ...await contentRoutes(), ...await guideCollectionRoutes()]) await writeRoute(source, target);
  const [guides, collections, experiences, cities] = await Promise.all([
    readData("guide-articles.json"),
    readData("guide-collections.json"),
    readData("experiences.json"),
    readData("cities.json")
  ]);
  const publishedGuides = (guides || []).filter((guide) => guide.status === "published");
  await writeStaticApi("api/public/guides/index.html", publishedGuides);
  for (const guide of publishedGuides) await writeStaticApi(`api/public/guides/${guide.slug}/index.html`, guide);
  await writeStaticApi("api/public/guide-collections/index.html", publicCollections(collections, guides));
  await writeStaticApi("api/public/experiences/index.html", (experiences || []).filter((experience) => experience.published !== false));
  await writeStaticApi("api/public/cities/index.html", (cities || []).filter((city) => city.active !== false));
  await fs.writeFile(
    path.join(outDir, "404.html"),
    rewriteStaticHtml(await fs.readFile(path.join(root, "guides.html"), "utf8"))
  );
  console.log(`Static GitHub Pages export created at ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
