const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");
const baseHref = process.env.STATIC_BASE_HREF ?? "/chinamigo/";

const htmlRoutes = [
  ["guides.html", "index.html"],
  ["about.html", "about/index.html"],
  ["contact.html", "contact/index.html"],
  ["guides.html", "guides/index.html"],
  ["trips.html", "trips/index.html"],
  ["trip-detail.html", "trips/shanghai-lifestyle-trip/index.html"],
  ["trip-detail.html", "trips/china-beauty-trip/index.html"],
  ["trip-detail.html", "trips/shenzhen-tech-journey/index.html"],
  ["trip-detail.html", "trips/visa-local-support/index.html"],
  ["trip-detail.html", "trips/shopping-sourcing/index.html"],
  ["trip-detail.html", "trips/vip-custom-trip/index.html"],
  ["city-experiences.html", "trips/shanghai/index.html"],
  ["city-experiences.html", "trips/beijing/index.html"],
  ["city-experiences.html", "trips/shenzhen/index.html"],
  ["city-experiences.html", "trips/chengdu/index.html"],
  ["city-experiences.html", "trips/guangzhou/index.html"],
  ["city-experiences.html", "trips/hangzhou/index.html"],
  ["city-experiences.html", "trips/chongqing/index.html"],
  ["guide-detail.html", "guides/can-tourists-use-alipay/index.html"],
  ["guide-detail.html", "guides/can-tourists-use-alipay-in-china/index.html"],
  ["guide-detail.html", "guides/china-high-speed-rail-guide/index.html"],
  ["guide-detail.html", "guides/best-cafes-in-shanghai/index.html"],
  ["guide-detail.html", "guides/china-beauty-clinic-guide/index.html"],
  ["guide-detail.html", "guides/shenzhen-electronics-market-guide/index.html"],
  ["guide-detail.html", "guides/essential-apps-for-china/index.html"],
  ["guide-detail.html", "guides/internet-setup-in-china/index.html"],
  ["guide-detail.html", "guides/modern-local-discoveries/index.html"]
];

function rewriteStaticHtml(html) {
  let output = html;
  output = output.replace(
    /<script src="\/site\.js([^"]*)" defer><\/script>/,
    `<script>window.__CHINAMIGO_STATIC__ = true;</script>\n    <script src="site.js$1" defer></script>`
  );
  output = output
    .replace(/(href|src)="\/assets\//g, '$1="assets/')
    .replace(/href="\/guides\/([^"]+)"/g, 'href="guides/$1"')
    .replace(/href="\/trips\/([^"]+)"/g, 'href="trips/$1"')
    .replace(/href="\/guides"/g, 'href="guides"')
    .replace(/href="\/trips"/g, 'href="trips"')
    .replace(/href="\/about"/g, 'href="about"')
    .replace(/href="\/contact"/g, 'href="contact"')
    .replace(/href="\/#contact"/g, 'href="./#contact"')
    .replace(/href="\/#about"/g, 'href="./#about"')
    .replace(/href="\/"/g, 'href="./"')
    .replace(/src="\/site\.js/g, 'src="site.js')
    .replace(/href="\/styles\.css/g, 'href="styles.css')
    .replace(/action="\/api\/inquiries"/g, 'data-static-action="inquiry"');

  output = output.replace(/(["'`])\/assets\//g, "$1assets/");
  output = output.replace(/(["'`])\/trips\//g, "$1trips/");
  output = output.replace(/(["'`])\/guides\//g, "$1guides/");
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

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  await copyIfExists(path.join(root, "assets"), path.join(outDir, "assets"));
  await copyIfExists(path.join(root, "data"), path.join(outDir, "data"));
  await copyIfExists(path.join(root, "styles.css"), path.join(outDir, "styles.css"));
  await copyIfExists(path.join(root, "site.js"), path.join(outDir, "site.js"));
  for (const [source, target] of htmlRoutes) await writeRoute(source, target);
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
