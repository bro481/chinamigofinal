const fs = require("fs");

const html = fs.readFileSync("guides.html", "utf8");

[
  "function renderCollections",
  "data-collection-track",
  "collectionDefinitions",
  "articles = dynamicArticles.filter"
].forEach((token) => {
  if (!html.includes(token)) {
    throw new Error(`China Guides home is missing CMS-driven collection token: ${token}`);
  }
});

[
  "<small>8 guides</small>",
  "<small>5 guides</small>",
  "<small>6 guides</small>",
  "<small>4 guides</small>",
  "articles = [...fallbackArticles, ...dynamicArticles]"
].forEach((token) => {
  if (html.includes(token)) {
    throw new Error(`China Guides home still contains stale hardcoded content: ${token}`);
  }
});

console.log("China Guides home uses CMS-driven guide and collection rendering.");
