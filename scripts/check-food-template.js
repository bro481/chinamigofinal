const fs = require("fs");

const html = fs.readFileSync("trip-detail.html", "utf8");

[
  'data-editorial-place-title',
  'data-editorial-place-category-label',
  'data-editorial-place-info',
  'data-editorial-place-image',
  'data-editorial-only',
  'data-hide-for-editorial',
  'data-editorial-related',
  'function renderEditorialCards',
  'function isEditorialCategory',
  'function renderEditorialDetail',
  'return "editorial";'
].forEach((token) => {
  if (!html.includes(token)) {
    throw new Error(`Missing editorial template token: ${token}`);
  }
});

[
  '"quiet-streets-behind-the-main-route"',
  'primaryCategory: "hidden-spots"',
  '"Why Visit", "Quiet streets, local cafés and a slower side of Shanghai."',
  '"Best Time", "Morning / Sunset"',
  '"Insider Tip", "Visit on weekdays for the quietest atmosphere."',
  '"Photography", "Walking", "Local Life"'
].forEach((token) => {
  if (!html.includes(token)) {
    throw new Error(`Missing Hidden Spots detail content token: ${token}`);
  }
});

[
  'data-food-highlights',
  'data-food-menu',
  'data-food-atmosphere',
  'data-editorial-guides',
  'data-editorial-routes',
  'Typical Spend',
  'typicalSpend',
  'Visit Length',
  'data-editorial-place-venue',
  'Known For',
  'data-editorial-place-summary',
  'data-editorial-place-area',
  'Coffee Route',
  'details.area',
  'details.spend'
].forEach((token) => {
  if (html.includes(token)) {
    throw new Error(`Food & Cafés minimal template still includes removed token: ${token}`);
  }
});

console.log("Editorial content detail template markers are present.");
