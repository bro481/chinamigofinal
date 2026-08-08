const fs = require("fs");

const html = fs.readFileSync("trips.html", "utf8");

[
  "function renderFoodGuideCard",
  "service-feed-card food-guide-card",
  "function isEditorialGuideCategory",
  'isEditorialGuideCategory(serviceActiveCategory) ? "" : renderCustomRouteCard()',
  "if (isEditorialGuideCategory(item.primaryCategory)) return renderFoodGuideCard(item);",
  '["Local Food", "Breakfast", "Coffee", "Bars", "Fine Dining"]'
].forEach((token) => {
  if (!html.includes(token)) {
    throw new Error(`Missing Food & Cafés guide card token: ${token}`);
  }
});

const foodRendererMatch = html.match(/function renderFoodGuideCard\(item\) \{([\s\S]*?)\n      \}/);
if (!foodRendererMatch) {
  throw new Error("Food & Cafés guide card renderer was not found.");
}

[
  "service-feed-rating",
  "priceFor(",
  "productTypeFor(",
  "service-product-meta",
  "service-feed-category",
  "service-feed-area"
].forEach((token) => {
  if (foodRendererMatch[1].includes(token)) {
    throw new Error(`Food & Cafés guide cards still include product element: ${token}`);
  }
});

[
  '"food-cafes", "Local Food"',
  '"food-cafes", "Breakfast"',
  '"food-cafes", "Coffee"',
  '"food-cafes", "Bars"',
  '"food-cafes", "Fine Dining"'
].forEach((token) => {
  if (!html.includes(token)) {
    throw new Error(`Food & Cafés is missing visitor-friendly filter content: ${token}`);
  }
});

if (html.includes('"Global Food"')) {
  throw new Error("Food & Cafés should not include the removed Global Food filter.");
}

console.log("Food & Cafés guide cards use editorial structure.");
