const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const docs = path.join(root, "docs");
const client = path.join(dist, "client");

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit"
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  await run(process.execPath, ["scripts/export-static.js"], { STATIC_BASE_HREF: "/" });
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(path.join(dist, "server"), { recursive: true });
  await fs.cp(docs, client, { recursive: true });
  await fs.rm(path.join(client, "data", "media.json"), { force: true });
  await pruneUnusedUploads();
  await fs.writeFile(
    path.join(dist, "server", "index.js"),
    `const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg"
};

function contentType(pathname) {
  const dot = pathname.lastIndexOf(".");
  return dot >= 0 ? mimeTypes[pathname.slice(dot).toLowerCase()] : undefined;
}

const guideCategories = ["Payments", "Apps", "Transportation", "Food & Cafés", "Safety", "Hotels", "Shopping", "Beauty & Wellness"];

async function fetchAsset(env, request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  const response = await env.ASSETS.fetch(new Request(url, request));
  if (response.status === 404) return null;
  const headers = new Headers(response.headers);
  const type = contentType(pathname);
  if (type) headers.set("content-type", type);
  return new Response(response.body, { status: response.status, headers });
}

async function readJsonAsset(env, request, pathname, fallback) {
  const response = await fetchAsset(env, request, pathname);
  if (!response) return fallback;
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
}

function publicGuides(guides) {
  return (Array.isArray(guides) ? guides : [])
    .filter((guide) => guide.status === "published" || guide.published)
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0));
}

function filterGuides(guides, url) {
  const category = (url.searchParams.get("category") || "").toLowerCase();
  const city = (url.searchParams.get("city") || "").toLowerCase();
  const tag = (url.searchParams.get("tag") || "").toLowerCase();
  const query = (url.searchParams.get("q") || "").toLowerCase();
  const featured = url.searchParams.get("featured");
  return guides
    .filter((guide) => !category || String(guide.category || "").toLowerCase() === category)
    .filter((guide) => !city || String(guide.city || "").toLowerCase() === city)
    .filter((guide) => !tag || (guide.tags || []).some((item) => String(item).toLowerCase() === tag))
    .filter((guide) => featured !== "true" || guide.featured)
    .filter((guide) => {
      if (!query) return true;
      return [guide.title, guide.slug, guide.category, guide.city, guide.excerpt, ...(guide.tags || [])].join(" ").toLowerCase().includes(query);
    });
}

async function handleStaticApi(env, request, url) {
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/api/guides") {
    return jsonResponse(await readJsonAsset(env, request, "/data/guides.json", { section: {}, cards: [] }));
  }
  if (pathname === "/api/public/guides") {
    const guides = publicGuides(await readJsonAsset(env, request, "/data/guide-articles.json", []));
    return jsonResponse({
      ok: true,
      data: filterGuides(guides, url),
      categories: guideCategories,
      cities: [...new Set(guides.map((guide) => guide.city).filter(Boolean))],
      tags: [...new Set(guides.flatMap((guide) => guide.tags || []).filter(Boolean))]
    });
  }
  if (pathname.startsWith("/api/public/guides/")) {
    const slug = pathname.replace("/api/public/guides/", "");
    const guides = publicGuides(await readJsonAsset(env, request, "/data/guide-articles.json", []));
    const guide = guides.find((item) => item.slug === slug);
    if (!guide) return jsonResponse({ ok: false, error: "Guide not found or not published." }, 404);
    return jsonResponse({
      ok: true,
      data: guide,
      related: (guide.relatedGuides || []).map((relatedSlug) => guides.find((item) => item.slug === relatedSlug)).filter(Boolean).slice(0, 6)
    });
  }
  if (pathname === "/api/public/guide-collections") {
    const [collections, guides] = await Promise.all([
      readJsonAsset(env, request, "/data/guide-collections.json", []),
      readJsonAsset(env, request, "/data/guide-articles.json", [])
    ]);
    const published = new Map(publicGuides(guides).map((guide) => [guide.slug, guide]));
    return jsonResponse({
      ok: true,
      data: (Array.isArray(collections) ? collections : [])
        .filter((collection) => collection.enabled !== false)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
        .map((collection) => ({
          ...collection,
          guides: (collection.guideSlugs || collection.guides || []).map((slug) => published.get(slug)).filter(Boolean)
        }))
    });
  }
  if (pathname === "/api/public/cities") {
    const includeHidden = url.searchParams.get("includeNavigationHidden") === "true";
    const cities = await readJsonAsset(env, request, "/data/cities.json", []);
    return jsonResponse({
      ok: true,
      data: (Array.isArray(cities) ? cities : [])
        .filter((city) => city.active)
        .filter((city) => includeHidden || city.showInNavigation !== false)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    });
  }
  if (pathname === "/api/public/experiences") {
    const city = url.searchParams.get("city");
    const type = url.searchParams.get("type");
    const experiences = await readJsonAsset(env, request, "/data/experiences.json", []);
    return jsonResponse({
      ok: true,
      data: (Array.isArray(experiences) ? experiences : [])
        .filter((experience) => experience.published)
        .filter((experience) => !city || experience.city === city)
        .filter((experience) => !type || experience.type === type)
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    });
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

    const staticApiResponse = await handleStaticApi(env, request, url);
    if (staticApiResponse) return staticApiResponse;

    if (pathname === "/admin" || pathname === "/admin.html" || pathname.startsWith("/api/")) {
      return new Response("This public deployment contains the frontend website only.", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    const clean = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const candidates = [];
    if (pathname === "/" || pathname === "") candidates.push("/index.html");
    candidates.push(pathname);
    if (clean && !clean.split("/").pop().includes(".")) candidates.push(clean + "/index.html");
    candidates.push("/404.html");

    for (const candidate of candidates) {
      const response = await fetchAsset(env, request, candidate);
      if (response) return response;
    }

    return new Response("Not found", { status: 404 });
  }
};
`
  );
  console.log(`Sites frontend build created at ${dist}`);
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function pruneUnusedUploads() {
  const uploadsDir = path.join(client, "assets", "uploads");
  try {
    await fs.access(uploadsDir);
  } catch {
    return;
  }

  const allClientFiles = await listFiles(client);
  const textFiles = allClientFiles.filter((file) => {
    if (file.startsWith(uploadsDir + path.sep)) return false;
    return /\.(html|css|js|json|txt|xml|svg)$/i.test(file);
  });

  const corpus = (await Promise.all(
    textFiles.map((file) => fs.readFile(file, "utf8").catch(() => ""))
  )).join("\n");

  const uploadFiles = await listFiles(uploadsDir);
  await Promise.all(uploadFiles.map(async (file) => {
    const relative = path.relative(client, file).split(path.sep).join("/");
    const basename = path.basename(file);
    if (!corpus.includes(relative) && !corpus.includes("/" + relative) && !corpus.includes(basename)) {
      await fs.rm(file, { force: true });
    }
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
