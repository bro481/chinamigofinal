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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

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
