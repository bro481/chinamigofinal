const fs = require("fs");

const css = fs.readFileSync("admin.css", "utf8");
const html = fs.readFileSync("admin.html", "utf8");
const js = fs.readFileSync("admin.js", "utf8");

const requiredCssTokens = [
  '.admin-shell:has([data-panel="guides"].is-editor-open)',
  '.admin-shell:has([data-panel="guides"].is-editor-open) .admin-header',
  '.admin-shell:has([data-panel="guides"].is-editor-open) .admin-tabs',
  '[data-panel="guides"].is-editor-open .section-heading',
  '[data-panel="guides"].is-editor-open .guide-quick-filters',
  '[data-panel="guides"].is-editor-open .guide-collections-admin',
  '[data-panel="guides"].is-editor-open .simple-editor-shell',
  '[data-panel="guides"].is-editor-open .edit-panel',
  '[data-panel="guides"].is-editor-open .edit-panel-head',
  '[data-panel="guides"].is-editor-open .content-settings summary',
  '[data-panel="guides"].is-editor-open .hero-settings summary',
  '[data-panel="guides"].is-editor-open .ai-assist-bar',
  '.raw-editor'
];

const requiredHtmlTokens = [
  "data-close-guide-editor",
  "simple-editor-shell",
  "writing-canvas",
  "data-raw-editor",
  "data-visual-editor",
  "data-editor-command",
  "data-insert-media",
  "data-format-inline",
  "data-format-value",
  "color-swatch",
  "data-card-focus",
  "data-card-scale",
  "data-word-count"
];

const missingCss = requiredCssTokens.filter((token) => !css.includes(token));
const missingHtml = requiredHtmlTokens.filter((token) => !html.includes(token));
const headRule = css.match(/\[data-panel="guides"\]\.is-editor-open \.edit-panel-head\s*\{[^}]+\}/);
const hidesEditorIntro = Boolean(headRule?.[0]?.includes("display: none"));
const hasEditorIntroCopy = html.includes("像写文章一样编辑攻略");
const hasOldHeroCopy = html.includes("Hero 设置");
const hasCardImageCopy = html.includes("攻略卡片图");
const remembersVisualSelection = js.includes("state.lastVisualSelection?.lang === visual.dataset.visualEditor");
const preventsToolbarFocusSteal = js.includes('event.target.closest("[data-format-inline], [data-editor-command]")');
const hasEditorHistory = js.includes("function applyEditorHistory") && js.includes("state.editorHistory");

if (missingCss.length || missingHtml.length || !hidesEditorIntro || hasEditorIntroCopy || hasOldHeroCopy || !hasCardImageCopy || !remembersVisualSelection || !preventsToolbarFocusSteal || !hasEditorHistory) {
  console.error("Guide editor workspace check failed.");
  if (missingCss.length) console.error("Missing CSS:", missingCss.join(", "));
  if (missingHtml.length) console.error("Missing HTML:", missingHtml.join(", "));
  if (!hidesEditorIntro) console.error("Guide editor intro should be hidden in immersive editor mode.");
  if (hasEditorIntroCopy) console.error("Guide editor intro copy should be removed from the editor DOM.");
  if (hasOldHeroCopy) console.error("Guide editor should manage card images, not legacy Hero settings.");
  if (!hasCardImageCopy) console.error("Guide editor should label the image field as 攻略卡片图.");
  if (!remembersVisualSelection) console.error("Visual formatting must use the last remembered editor selection after toolbar clicks.");
  if (!preventsToolbarFocusSteal) console.error("Toolbar buttons must not steal focus before applying editor formatting.");
  if (!hasEditorHistory) console.error("Guide editor must use custom undo/redo history instead of native-only execCommand history.");
  process.exit(1);
}

console.log("Guide editor workspace check passed.");
