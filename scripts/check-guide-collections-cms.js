const fs = require("fs");

const server = fs.readFileSync("server.js", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");
const adminJs = fs.readFileSync("admin.js", "utf8");
const guidesHtml = fs.readFileSync("guides.html", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

[
  "guideCollections",
  "/api/admin/guide-collections",
  "/api/public/guide-collections",
  "normalizeGuideCollection",
  "publicGuideCollections"
].forEach((token) => {
  if (!server.includes(token)) {
    throw new Error(`Guide collections server support missing token: ${token}`);
  }
});

[
  "data-guide-collections-list",
  "data-guide-collection-form",
  "data-guide-collection-guide-picker",
  "精选合集管理"
].forEach((token) => {
  if (!adminHtml.includes(token)) {
    throw new Error(`Guide collections admin UI missing token: ${token}`);
  }
});

if (adminHtml.includes("指定攻略 URL 标识")) {
  throw new Error("Guide collection editor should not ask operators to type guide URL slugs.");
}

[
  "guideCollections",
  "loadGuideCollections",
  "renderGuideCollections",
  "/api/admin/guide-collections"
].forEach((token) => {
  if (!adminJs.includes(token)) {
    throw new Error(`Guide collections admin logic missing token: ${token}`);
  }
});

[
  "/api/public/guide-collections",
  "function renderCollections(collections",
  "cmsCollections"
].forEach((token) => {
  if (!guidesHtml.includes(token)) {
    throw new Error(`Guide collections frontend rendering missing token: ${token}`);
  }
});

if (!fs.existsSync("data/guide-collections.json")) {
  throw new Error("Guide collections data file is missing.");
}

if (!packageJson.scripts.check.includes("scripts/check-guide-collections-cms.js")) {
  throw new Error("Guide collections check is not part of npm run check.");
}

console.log("Guide collections are managed through CMS APIs and admin UI.");
