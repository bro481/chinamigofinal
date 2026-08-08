const state = {
  overview: null,
  inquiries: [],
  guides: [],
  guideCollections: [],
  cities: [],
  experiences: [],
  templates: [],
  media: [],
  currentGuideId: null,
  currentGuideCollectionId: null,
  currentCityId: null,
  currentExperienceId: null,
  activeExperienceMode: "recommended_journey",
  currentExperienceDetail: "expect",
  experiencePreviewSource: "content",
  currentTemplateId: null,
  currentExperienceDay: 0,
  activeDayField: "body",
  lastDaySelection: null,
  journeyEditorHistory: { undo: [], redo: [], last: "" },
  currentGuideLang: "en",
  guideDraft: null,
  guideAutosaveTimer: null,
  editorHistoryTimer: null,
  lastVisualSelection: null,
  pendingMediaSelection: null,
  selectedMediaFigure: null,
  selectedMediaSlot: null,
  mediaResizeDrag: null,
  mediaCropDrag: null,
  mediaStyleClipboard: null,
  editorHistory: {
    en: { undo: [], redo: [], last: "" },
    cn: { undo: [], redo: [], last: "" }
  },
  mediaPicker: null,
  overviewActivityExpanded: false,
  completedFocus: new Set(JSON.parse(localStorage.getItem("chinamigo_completed_focus") || "[]"))
};

let draggedBlock = null;
let draggedCityId = null;
let cardCropDrag = null;
const experienceTagOptions = ["Luxury", "Slow Travel", "Wellness", "First-time Visitor", "Family", "Food & Café", "Shopping", "Local Culture", "Nightlife", "Design Hotels", "Business", "Private"];
const guideCategoryOptions = ["Payments", "Apps", "Transportation", "Food & Cafés", "Safety", "Hotels", "Shopping", "Beauty & Wellness"];
const guideCategoryAliases = {
  "Apps & Digital Life": "Apps",
  "Food & Cafes": "Food & Cafés",
  "Shopping & Sourcing": "Shopping",
  "Where to Stay": "Hotels",
  Lifestyle: "Payments"
};
const mediaStyleTemplates = [
  { id: "article", label: "正文图片", width: 100, widthUnit: "percent", height: "auto", align: "center", radius: 18, shadow: "none", spacing: 24, maxWidth: "none", enlarge: true, lockRatio: true },
  { id: "small", label: "窄幅图片", width: 46, widthUnit: "percent", height: "auto", align: "center", radius: 16, shadow: "none", spacing: 16, maxWidth: "640", enlarge: true, lockRatio: true },
  { id: "banner", label: "Banner", width: 100, widthUnit: "percent", height: 320, align: "center", radius: 22, shadow: "soft", spacing: 32, maxWidth: "none", enlarge: true, lockRatio: false },
  { id: "phone", label: "手机截图", width: 42, widthUnit: "percent", height: "auto", align: "center", radius: 24, shadow: "medium", spacing: 24, maxWidth: "520", enlarge: true, lockRatio: true },
  { id: "map", label: "地图", width: 100, widthUnit: "percent", height: 360, align: "center", radius: 18, shadow: "soft", spacing: 24, maxWidth: "none", enlarge: true, lockRatio: false },
  { id: "faq", label: "FAQ 图片", width: 72, widthUnit: "percent", height: "auto", align: "center", radius: 14, shadow: "none", spacing: 16, maxWidth: "800", enlarge: true, lockRatio: true }
];
const mediaLayoutTemplates = [
  { id: "single", label: "单图", count: 1 },
  { id: "double", label: "双图", count: 2 },
  { id: "triple", label: "三图", count: 3 },
  { id: "grid", label: "四宫格", count: 4 },
  { id: "gallery", label: "Gallery", count: 4 },
  { id: "compare", label: "Before / After", count: 2 }
];
const mediaRatioTemplates = [
  { id: "free", label: "自由", ratio: "auto", height: "auto" },
  { id: "wide", label: "16:9 横版", ratio: "16 / 9", height: "auto" },
  { id: "standard", label: "4:3 标准", ratio: "4 / 3", height: "auto" },
  { id: "square", label: "1:1 方形", ratio: "1 / 1", height: "auto" },
  { id: "portrait", label: "3:4 竖版", ratio: "3 / 4", height: "auto" },
  { id: "mobile", label: "9:16 手机", ratio: "9 / 16", height: "auto" },
  { id: "banner", label: "Banner", ratio: "5 / 2", height: "auto" }
];
const crmTagGroups = {
  "旅行类型": ["Luxury", "Family", "Wellness", "Business", "Shopping"],
  "客户等级": ["VIP", "High Intent", "Returning"],
  "紧急程度": ["Urgent", "Flexible"]
};
const defaultQuickReplyTemplates = {
  welcome: {
    id: "template-welcome",
    icon: "👋",
    label: "欢迎模板",
    category: "欢迎",
    body: "Hi {{name}}, thanks for reaching out to ChinaMigo. We received your travel preferences and will help shape a calm China plan around your timing and cities."
  },
  luxury: {
    id: "template-luxury",
    icon: "✨",
    label: "Luxury 模板",
    category: "欢迎",
    body: "Hi {{name}}, we can curate a quieter luxury China journey with private transport, refined hotels, reservations and local support. Could you share your preferred hotel level and approximate budget?"
  },
  family: {
    id: "template-family",
    icon: "👨‍👩‍👧",
    label: "家庭旅行模板",
    category: "欢迎",
    body: "Hi {{name}}, we can help plan a family-friendly China route with smoother transport, flexible pacing and local support. Could you share the ages of the travelers and your preferred dates?"
  },
  business: {
    id: "template-business",
    icon: "💼",
    label: "商务客户模板",
    category: "欢迎",
    body: "Hi {{name}}, we can support your China business trip with transport, translation, sourcing visits and calm local coordination. Could you share your target city, dates and meeting goals?"
  },
  plan: {
    id: "template-plan",
    icon: "🧭",
    label: "发送行程方案",
    category: "路线发送",
    body: "Hi {{name}}, we can prepare a private route proposal based on your dates, city interests and preferred stay level. Could you confirm your hotel budget range?"
  },
  budget: {
    id: "template-budget",
    icon: "💬",
    label: "请求预算",
    category: "预算确认",
    body: "Hi {{name}}, to plan this properly, could you share your rough total budget or preferred hotel level for this China journey?"
  },
  call: {
    id: "template-call",
    icon: "📞",
    label: "预约电话",
    category: "跟进",
    body: "Hi {{name}}, would you like to schedule a short call so we can understand your travel rhythm and support needs more clearly?"
  }
};
const mediaCategoryLabels = {
  guides: "攻略图片",
  trips: "行程图片",
  cities: "城市图片",
  home: "首页图片",
  about: "About 图片",
  common: "通用素材"
};

const inquiryStatuses = ["new", "replied", "following", "confirmed", "won", "lost", "spam"];
const statusLabels = {
  draft: "草稿",
  published: "已发布",
  scheduled: "定时发布",
  archived: "已归档",
  new: "新咨询",
  replied: "已回复",
  following: "跟进中",
  reviewed: "已回复",
  contacted: "已回复",
  planning: "跟进中",
  quoted: "跟进中",
  confirmed: "已确认",
  won: "已成交",
  lost: "已流失",
  spam: "垃圾"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setStatus(message) {
  $("[data-status]").textContent = message || "";
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Use the fallback path below.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function api(path, options = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(options.method || "GET", path);
    request.withCredentials = true;
    if (!(options.body instanceof FormData)) request.setRequestHeader("Content-Type", "application/json");
    request.onload = () => {
      let data = {};
      try {
        data = JSON.parse(request.responseText || "{}");
      } catch {
        data = {};
      }
      if (request.status >= 200 && request.status < 300 && data.ok !== false) resolve(data);
      else reject(new Error(data.error || "Request failed."));
    };
    request.onerror = () => reject(new Error("Network request failed."));
    request.send(options.body || null);
  });
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function listToCsv(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function csvToList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function mediaCategoryLabel(value) {
  return mediaCategoryLabels[value] || value || "通用素材";
}

function normalizeGuideCategory(value) {
  const category = String(value || "").trim();
  if (!category) return guideCategoryOptions[0];
  return guideCategoryAliases[category] || (guideCategoryOptions.includes(category) ? category : guideCategoryOptions[0]);
}

function normalizeGuideCategoryList(values = []) {
  return [...new Set(csvToList(Array.isArray(values) ? values.join(",") : values).map(normalizeGuideCategory))];
}

function mediaSearchText(item) {
  return [
    item.filename,
    item.alt,
    item.url,
    item.category,
    item.folder,
    ...(item.tags || []),
    ...(item.usage || []).flatMap((usage) => [usage.label, usage.type])
  ].join(" ").toLowerCase();
}

function filterMediaItems(query = "", category = "") {
  const normalizedQuery = String(query || "").toLowerCase();
  let items = [...state.media];
  if (category === "unused") items = items.filter((item) => !(item.usage || []).length);
  else if (category === "recent") items = items.slice(0, 24);
  else if (category) items = items.filter((item) => (item.category || item.folder) === category);
  return items.filter((item) => !normalizedQuery || mediaSearchText(item).includes(normalizedQuery));
}

function parseBlocks(value) {
  if (!String(value || "").trim()) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function parseJsonField(value, fallback) {
  if (!String(value || "").trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${fallback}-${Date.now()}`;
}

function defaultGuide() {
  const id = `guide-${Date.now()}`;
  return {
    id,
    title: "未命名攻略",
    slug: "",
    city: "",
    category: "Payments",
    tags: [],
    featured: false,
    coverImage: "",
    coverAlt: "",
    mobileCoverImage: "",
    imagePosition: "center center",
    imageScale: 1.02,
    readTime: "5 min read",
    author: "ChinaMigo Editorial",
    status: "draft",
    publishedAt: "",
    scheduledAt: "",
    relatedGuides: [],
    translations: {
      en: { title: "未命名攻略", excerpt: "", htmlContent: "", contentBlocks: [], seo: { title: "", description: "" } },
      cn: { title: "", excerpt: "", htmlContent: "", contentBlocks: [], seo: { title: "", description: "" } }
    },
    seo: { ogImage: "", canonicalUrl: "", noindex: false }
  };
}

function getGuideTranslation(guide, lang = state.currentGuideLang) {
  guide.translations ||= {};
  guide.translations[lang] ||= {
    title: lang === "en" ? (guide.title || "") : "",
    excerpt: lang === "en" ? (guide.excerpt || "") : "",
    contentBlocks: lang === "en" ? (guide.contentBlocks || []) : [],
    seo: { title: "", description: "" }
  };
  if (lang === "en") {
    guide.translations[lang].title ||= guide.title || "";
    guide.translations[lang].excerpt ||= guide.excerpt || "";
    if (!guide.translations[lang].contentBlocks?.length && guide.contentBlocks?.length) {
      guide.translations[lang].contentBlocks = guide.contentBlocks;
    }
  }
  guide.translations[lang].seo ||= { title: "", description: "" };
  guide.translations[lang].contentBlocks ||= [];
  guide.translations[lang].htmlContent ||= "";
  return guide.translations[lang];
}

function blocksToHtml(blocks = []) {
  return blocks.map((block) => {
    if (block.type === "heading") return `<h2>${escapeHtml(block.title || block.body)}</h2>`;
    if (block.type === "quote") return `<blockquote>${escapeHtml(block.body || block.title)}</blockquote>`;
    if (block.type === "image") return block.image ? `<figure><img src="/${escapeHtml(block.image)}" alt="${escapeHtml(block.alt)}"><figcaption>${escapeHtml(block.alt)}</figcaption></figure>` : "";
    if (block.type === "gallery") return `<div class="cms-gallery">${(block.items || []).map((src) => `<img src="/${escapeHtml(src)}" alt="">`).join("")}</div>`;
    if (block.type === "divider") return "<hr>";
    if (block.type === "cta") return `<p><a class="cms-cta" href="${escapeHtml(block.href || "#")}">${escapeHtml(block.label || block.title || "Chat on WhatsApp")}</a></p>`;
    if (block.type === "tip") return `<aside><strong>${escapeHtml(block.title || "Travel Tip")}</strong><p>${escapeHtml(block.body)}</p></aside>`;
    if (["bullet_list", "number_list", "checklist"].includes(block.type)) {
      const tag = block.type === "number_list" ? "ol" : "ul";
      return `<${tag}>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
    }
    return block.body ? `<p>${escapeHtml(block.body)}</p>` : "";
  }).join("");
}

function htmlToPlainDraft(html = "") {
  return String(html)
    .replace(/<aside[^>]*data-callout-type=[\"'](tip|warning|recommend|budget|time)[\"'][^>]*>[\s\S]*?<strong[^>]*>(.*?)<\/strong>[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<\/aside>/gis, (_match, type, title, body) => `${calloutMarkerLabel(type)}: ${stripHtml(title)} | ${stripHtml(body)}\n\n`)
    .replace(/<div[^>]*data-route-snippet[^>]*>[\s\S]*?<div[^>]*class=[\"'][^\"']*cms-route-steps[^\"']*[\"'][^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/div>/gis, (_match, steps) => {
      const route = [...String(steps).matchAll(/<span[^>]*>(.*?)<\/span>/gis)].map((item) => stripHtml(item[1])).filter(Boolean).join(" > ");
      return route ? `Route: ${route}\n\n` : "";
    })
    .replace(/<div[^>]*data-faq-snippet[^>]*>[\s\S]*?<strong[^>]*>(.*?)<\/strong>[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<\/div>/gis, (_match, question, answer) => `FAQ: ${stripHtml(question).replace(/^Q[:：]\s*/i, "")} | ${stripHtml(answer).replace(/^A[:：]\s*/i, "")}\n\n`)
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gis, "**$1**")
    .replace(/<span[^>]*class=[\"'][^\"']*cms-text-color[^\"']*[\"'][^>]*style=[\"'][^\"']*color:\s*([^;\"']+)[^\"']*[\"'][^>]*>(.*?)<\/span>/gis, "[color:$1]$2[/color]")
    .replace(/<span[^>]*class=[\"'][^\"']*cms-text-size-(small|medium|large|hero)[^\"']*[\"'][^>]*>(.*?)<\/span>/gis, "[size:$1]$2[/size]")
    .replace(/<mark[^>]*style=[\"'][^\"']*background:\s*([^;\"']+)[^\"']*[\"'][^>]*>(.*?)<\/mark>/gis, "[highlight:$1]$2[/highlight]")
    .replace(/<mark[^>]*>(.*?)<\/mark>/gis, "[highlight]$1[/highlight]")
    .replace(/<figure[^>]*class=[\"'][^\"']*cms-audio[^\"']*[\"'][^>]*>[\s\S]*?<figcaption[^>]*>(.*?)<\/figcaption>[\s\S]*?<audio[^>]*src=[\"']\/?([^\"']+)[\"'][^>]*>[\s\S]*?<\/figure>/gis, "Audio: $1 | $2\n\n")
    .replace(/<figure[^>]*class=[\"'][^\"']*cms-video[^\"']*[\"'][^>]*>([\s\S]*?)<\/figure>/gis, (_match, inner) => {
      const src = String(inner).match(/<video[^>]*src=[\"']\/?([^\"']+)[\"'][^>]*>/i)?.[1] || "";
      const caption = stripHtml(String(inner).match(/<figcaption[^>]*>(.*?)<\/figcaption>/is)?.[1] || "视频");
      return src ? `Video: ${caption || "视频"} | ${src}\n\n` : "";
    })
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "### $1\n\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gis, "- $1\n")
    .replace(/<img[^>]*src=[\"']\/?([^\"']+)[\"'][^>]*alt=[\"']?([^\"']*)[\"']?[^>]*>/gis, "![$2]($1)\n\n")
    .replace(/<img[^>]*src=[\"']\/?([^\"']+)[\"'][^>]*>/gis, "![]($1)\n\n")
    .replace(/<a[^>]*class=[\"']cms-cta[\"'][^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)<\/a>/gis, "CTA: $2 | $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function calloutMarkerLabel(type = "tip") {
  return { tip: "Tip", warning: "Warning", recommend: "Recommend", budget: "Budget", time: "Time" }[type] || "Tip";
}

function calloutMeta(type = "tip") {
  return {
    tip: { icon: "💡", title: "Travel Tip", body: "这里填写提示内容。" },
    warning: { icon: "⚠", title: "Important", body: "这里填写注意事项。" },
    recommend: { icon: "⭐", title: "Recommendation", body: "这里填写推荐理由。" },
    budget: { icon: "💰", title: "Budget", body: "这里填写预算参考。" },
    time: { icon: "🕒", title: "Time", body: "这里填写建议时间。" }
  }[type] || { icon: "💡", title: "Travel Tip", body: "这里填写提示内容。" };
}

function calloutHtml(type = "tip", title = "", body = "") {
  const meta = calloutMeta(type);
  return `<aside class="cms-callout cms-callout-${escapeHtml(type)}" data-callout-type="${escapeHtml(type)}"><strong><span>${meta.icon}</span>${inlineMarkdown(title || meta.title)}</strong><p>${inlineMarkdown(body || meta.body)}</p></aside><p><br></p>`;
}

function routeHtml(route = "外滩 > 南京路 > 豫园") {
  const steps = String(route || "").split(/\s*>\s*/).map((item) => item.trim()).filter(Boolean);
  return `<div class="cms-route" data-route-snippet><strong>路线</strong><div class="cms-route-steps">${steps.map((step) => `<span>${escapeHtml(step)}</span>`).join("<em>↓</em>")}</div></div><p><br></p>`;
}

function faqSnippetHtml(question = "常见问题？", answer = "这里填写回答内容。") {
  return `<div class="cms-faq-snippet" data-faq-snippet><strong>Q: ${inlineMarkdown(question)}</strong><p>A: ${inlineMarkdown(answer)}</p></div><p><br></p>`;
}

function normalizeInlineShortcodes(value = "") {
  let output = String(value || "");
  for (let index = 0; index < 5; index += 1) {
    output = output
      .replace(/\[highlight(?::([^\]]+))?]\s*\[highlight(?::[^\]]+)?]([\s\S]*?)\[\/highlight]\s*\[\/highlight]/g, (_match, color, body) => `[highlight${color ? `:${color}` : ""}]${body}[/highlight]`)
      .replace(/\[size:(small|medium|large|hero)]\s*\[size:(?:small|medium|large|hero)]([\s\S]*?)\[\/size]\s*\[\/size]/g, "[size:$1]$2[/size]")
      .replace(/\[color:([^\]]+)]\s*\[color:[^\]]+]([\s\S]*?)\[\/color]\s*\[\/color]/g, "[color:$1]$2[/color]");
  }
  return output;
}

function inlineMarkdown(text = "") {
  return escapeHtml(normalizeInlineShortcodes(text))
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[color:([#a-zA-Z0-9(),.\s-]+)]([\s\S]*?)\[\/color]/g, '<span class="cms-text-color" style="color:$1">$2</span>')
    .replace(/\[size:(small|medium|large|hero)]([\s\S]*?)\[\/size]/g, '<span class="cms-text-size cms-text-size-$1">$2</span>')
    .replace(/\[highlight(?::([#a-zA-Z0-9(),.\s-]+))?]([\s\S]*?)\[\/highlight]/g, (_match, color, body) => (
      `<mark class="cms-highlight"${color ? ` style="background:${color}"` : ""}>${body}</mark>`
    ))
    .replace(/\[\/?(?:highlight(?::[^\]]+)?|size:(?:small|medium|large|hero)|color:[^\]]+)]/g, "");
}

function markdownToHtml(markdown = "") {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let bullets = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    html.push(`<ul>${bullets.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    bullets = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushBullets();
      continue;
    }
    const image = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    const audio = trimmed.match(/^Audio:\s*(.*?)\s*\|\s*(.+)$/i);
    const video = trimmed.match(/^Video:\s*(.*?)\s*\|\s*(.+)$/i);
    const cta = trimmed.match(/^CTA:\s*(.*?)\s*\|\s*(.+)$/i);
    const callout = trimmed.match(/^(Tip|Warning|Recommend|Budget|Time):\s*(.*?)\s*\|\s*(.+)$/i);
    const route = trimmed.match(/^Route:\s*(.+)$/i);
    const faq = trimmed.match(/^FAQ:\s*(.*?)\s*\|\s*(.+)$/i);
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      bullets.push(trimmed.slice(2).trim());
    } else if (image) {
      flushParagraph();
      flushBullets();
      html.push(`<figure><img src="/${escapeHtml(image[2].replace(/^\/+/, ""))}" alt="${escapeHtml(image[1])}"><figcaption>${escapeHtml(image[1])}</figcaption></figure>`);
    } else if (audio) {
      flushParagraph();
      flushBullets();
      html.push(`<figure class="cms-media cms-audio"><figcaption>${escapeHtml(audio[1])}</figcaption><audio controls src="/${escapeHtml(audio[2].replace(/^\/+/, ""))}"></audio></figure>`);
    } else if (video) {
      flushParagraph();
      flushBullets();
      html.push(`<figure class="cms-media cms-video"><video controls playsinline src="/${escapeHtml(video[2].replace(/^\/+/, ""))}"></video><figcaption>${escapeHtml(video[1])}</figcaption></figure>`);
    } else if (cta) {
      flushParagraph();
      flushBullets();
      html.push(`<p><a class="cms-cta" href="${escapeHtml(cta[2])}">${escapeHtml(cta[1])}</a></p>`);
    } else if (callout) {
      flushParagraph();
      flushBullets();
      const marker = callout[1].toLowerCase();
      const type = marker === "warning" ? "warning" : marker === "recommend" ? "recommend" : marker === "budget" ? "budget" : marker === "time" ? "time" : "tip";
      html.push(calloutHtml(type, callout[2], callout[3]));
    } else if (route) {
      flushParagraph();
      flushBullets();
      html.push(routeHtml(route[1]));
    } else if (faq) {
      flushParagraph();
      flushBullets();
      html.push(faqSnippetHtml(faq[1], faq[2]));
    } else if (trimmed === "---") {
      flushParagraph();
      flushBullets();
      html.push("<hr>");
    } else if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushBullets();
      html.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
    } else {
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushBullets();
  return html.join("");
}

function guideLanguageStatus(guide) {
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  return {
    en: Boolean(en.title && (en.excerpt || en.contentBlocks.length || en.rawContent)),
    cn: Boolean(cn.title && (cn.excerpt || cn.contentBlocks.length || cn.rawContent))
  };
}

function guideTranslationSyncLabel(guide) {
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  const enText = [en.title, en.excerpt, en.rawContent, en.htmlContent].filter(Boolean).join(" ");
  const cnText = [cn.title, cn.excerpt, cn.rawContent, cn.htmlContent].filter(Boolean).join(" ");
  if (!cnText.trim()) return "中文未创建";
  if (enText.length > 240 && cnText.length < enText.length * 0.18) return "中文缺少 40%+";
  if ((en.rawContent || "").length > 80 && (cn.rawContent || "").length < 30) return "中文待更新";
  return "中英已同步";
}

function updateTranslationSyncPill(guide = state.guideDraft) {
  const node = $("[data-translation-sync]");
  if (!node || !guide) return;
  const label = guideTranslationSyncLabel(guide);
  node.textContent = label;
  node.className = `translation-sync-pill ${label.includes("同步") ? "is-ok" : "needs-work"}`;
}

function fillForm(form, values = {}) {
  [...form.elements].forEach((field) => {
    if (!field.name) return;
    const value = values[field.name];
    if (["contentBlocks", "itineraryDays", "shortDetails", "experienceFlow", "experienceDetails", "includedSupport", "notIncluded", "reviews", "faqs", "expert", "cta"].includes(field.name)) {
      field.value = JSON.stringify(value || (["shortDetails", "expert", "cta"].includes(field.name) ? {} : []), null, 2);
    }
    else if (Array.isArray(value)) field.value = listToCsv(value);
    else if (typeof value === "boolean") field.value = String(value);
    else field.value = value ?? "";
  });
}

function formValues(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  if ("relatedGuides" in payload) payload.relatedGuides = csvToList(payload.relatedGuides);
  if ("categories" in payload) payload.categories = csvToList(payload.categories);
  if ("guideSlugs" in payload) payload.guideSlugs = csvToList(payload.guideSlugs);
  if ("tags" in payload) payload.tags = csvToList(payload.tags);
  if ("galleryImages" in payload) payload.galleryImages = csvToList(payload.galleryImages);
  if ("contentBlocks" in payload) payload.contentBlocks = parseBlocks(payload.contentBlocks);
  if ("itineraryDays" in payload) payload.itineraryDays = parseJsonField(payload.itineraryDays, []);
  if ("shortDetails" in payload) payload.shortDetails = parseJsonField(payload.shortDetails, {});
  if ("experienceFlow" in payload) payload.experienceFlow = parseJsonField(payload.experienceFlow, []);
  if ("experienceDetails" in payload) payload.experienceDetails = parseJsonField(payload.experienceDetails, []);
  if ("includedSupport" in payload) payload.includedSupport = parseJsonField(payload.includedSupport, []);
  if ("notIncluded" in payload) payload.notIncluded = parseJsonField(payload.notIncluded, []);
  if ("reviews" in payload) payload.reviews = parseJsonField(payload.reviews, []);
  if ("faqs" in payload) payload.faqs = parseJsonField(payload.faqs, []);
  if ("expert" in payload) payload.expert = parseJsonField(payload.expert, {});
  if ("cta" in payload) payload.cta = parseJsonField(payload.cta, {});
  if ("sortOrder" in payload) payload.sortOrder = Number(payload.sortOrder || 0);
  if ("active" in payload) payload.active = payload.active === "true";
  if ("showInNavigation" in payload) payload.showInNavigation = payload.showInNavigation === "true";
  if ("published" in payload) payload.published = payload.published === "true";
  return payload;
}

function itemRow({ title, meta, body, actions = "" }) {
  return `
    <article class="list-item">
      <div>
        <strong>${title}</strong>
        <span>${meta || ""}</span>
        ${body ? `<p>${body}</p>` : ""}
      </div>
      <div class="row-actions">${actions}</div>
    </article>
  `;
}

function cityKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function citySlugFromName(value) {
  return cityKey(value);
}

function normalizeCityDraft(city = {}) {
  return {
    active: true,
    showInNavigation: true,
    sortOrder: 0,
    ...city,
    shortDescription: city.shortDescription || city.description || "",
    longDescription: city.longDescription || "",
    bannerImage: city.bannerImage || "",
    cardImage: city.cardImage || "",
    thumbnailImage: city.thumbnailImage || ""
  };
}

function cityMatchesContent(city, value) {
  const citySlug = cityKey(city.slug || city.name);
  const cityName = cityKey(city.name);
  const contentCity = cityKey(value);
  return Boolean(contentCity && (contentCity === citySlug || contentCity === cityName));
}

function cityContentStats(city) {
  const guides = state.guides.filter((guide) => cityMatchesContent(city, guide.city));
  const experiences = state.experiences.filter((experience) => cityMatchesContent(city, experience.city));
  const journeys = experiences.filter((experience) => experience.type === "recommended_journey");
  const shorts = experiences.filter((experience) => experience.type === "short_experience");
  return { guides, experiences, journeys, shorts };
}

function cityImage(city) {
  return city.thumbnailImage || city.cardImage || city.bannerImage || "assets/hero-china-concierge.png";
}

function cityHealth(city) {
  const stats = cityContentStats(city);
  const issues = [];
  if (!city.bannerImage) issues.push({ key: "missing-banner", label: "缺横图" });
  if (!city.cardImage) issues.push({ key: "missing-card", label: "缺卡片图" });
  if (!stats.guides.length) issues.push({ key: "missing-guides", label: "缺攻略" });
  if (!stats.experiences.length) issues.push({ key: "missing-experience", label: "缺行程" });
  if (!city.shortDescription || city.shortDescription.length < 32) issues.push({ key: "seo-weak", label: "SEO弱" });
  if (city.showInNavigation && city.active) issues.push({ key: "featured", label: "推荐城市", positive: true });
  const required = 5;
  const missing = issues.filter((item) => !item.positive).length;
  return {
    issues,
    percent: Math.max(0, Math.round(((required - missing) / required) * 100))
  };
}

function formatRelativeDate(value) {
  if (!value) return "未保存";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function setCitySaveStatus(message, stateName = "idle") {
  const node = $("[data-city-save-status]");
  if (!node) return;
  node.textContent = message;
  node.dataset.state = stateName;
}

function cityDraftFromForm() {
  const city = normalizeCityDraft(formValues($("[data-city-form]")));
  city.id = state.currentCityId || city.id;
  return city;
}

function experienceSlugFromTitle(value) {
  return cityKey(value);
}

const dayTemplateOptions = {
  free: {
    label: "Free Format",
    description: "Blank day outline.",
    fields: []
  },
  city: {
    label: "City Exploration",
    description: "For city walks, neighborhoods, landmarks and local pacing.",
    fields: ["summary", "highlights", "timeline", "places", "food", "tips"]
  },
  experience: {
    label: "Experience Day",
    description: "For hosted experiences, workshops and memorable local activities.",
    fields: ["summary", "experience", "timeline", "participation", "practical", "tips"]
  },
  food: {
    label: "Food Journey",
    description: "For cafés, restaurants, food neighborhoods and evening plans.",
    fields: ["summary", "highlights", "timeline", "food", "places", "tips"]
  },
  arrival: {
    label: "Arrival / Departure",
    description: "For first day, last day, transfers, hotel check-in and recovery time.",
    fields: ["summary", "arrival", "transfer", "hotel", "eveningPlan", "tips"]
  },
  nature: {
    label: "Nature / Adventure",
    description: "For outdoor routes, active days, preparation and difficulty notes.",
    fields: ["summary", "highlights", "timeline", "places", "practical", "tips"]
  },
  custom: {
    label: "Custom Structure",
    description: "A flexible outline with the most common itinerary sections.",
    fields: ["summary", "highlights", "timeline", "places", "experience", "practical", "body"]
  }
};

const experienceTemplateOptions = {
  privateWalk: {
    label: "Private City Walk",
    sections: ["Overview", "Route", "Tips"]
  },
  foodExperience: {
    label: "Food Experience",
    sections: ["Story", "Stops", "Recommendations"]
  },
  workshop: {
    label: "Workshop",
    sections: ["Introduction", "Process", "Notes"]
  },
  halfDay: {
    label: "Half Day Tour",
    sections: ["Schedule", "Highlights", "Info"]
  }
};

const dayFieldMeta = {
  summary: ["Day Overview", "", 2, "is-hero"],
  highlights: ["Today’s Highlights", "", 3, "is-primary"],
  timeline: ["Route & Schedule", "", 5, "is-route"],
  places: ["Places to Visit", "", 4, "is-places"],
  experience: ["Local Experience", "", 4, "is-experience"],
  participation: ["What Guests Do", "", 4, "is-support"],
  food: ["Food & Cafés", "", 4, "is-support"],
  practical: ["Useful Notes", "", 4, "is-support"],
  tips: ["Local Tips", "", 3, "is-support"],
  arrival: ["Arrival Details", "", 3, "is-route"],
  transfer: ["Transfer", "", 3, "is-support"],
  hotel: ["Hotel", "", 3, "is-support"],
  eveningPlan: ["Free Time", "", 3, "is-support"],
  body: ["Notes", "", 6, "is-free"]
};

function storedDayTemplates() {
  try {
    const templates = JSON.parse(localStorage.getItem("chinamigoDayTemplates") || "[]");
    return Array.isArray(templates) ? templates.filter((item) => item?.id && item?.label && Array.isArray(item.fields)) : [];
  } catch {
    return [];
  }
}

function dayTemplateEntries() {
  return [
    ...Object.entries(dayTemplateOptions).map(([id, template]) => [id, { ...template, source: "system" }]),
    ...storedDayTemplates().map((template) => [template.id, { ...template, source: "mine" }])
  ];
}

function getDayTemplate(templateId = "free") {
  return dayTemplateEntries().find(([id]) => id === templateId)?.[1] || dayTemplateOptions.free;
}

function isKnownDayTemplate(templateId = "") {
  return dayTemplateEntries().some(([id]) => id === templateId);
}

function templateStorageKey(kind = "journey") {
  return kind === "experience" ? "chinamigoExperienceTemplates" : "chinamigoJourneyTemplates";
}

function builtInEditorTemplates(kind = "journey") {
  return kind === "experience" ? experienceTemplateOptions : dayTemplateOptions;
}

function templateKindTitle(kind = "journey") {
  return kind === "experience" ? "Experience" : "Journey";
}

function templateKindSaveLabel(kind = "journey") {
  return kind === "experience" ? "Save Current Experience Template" : "Save Current Journey Template";
}

function storedEditorTemplates(kind = "journey") {
  const storageKey = templateStorageKey(kind);
  try {
    const templates = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(templates)) {
      return templates.filter((item) => item?.id && item?.label && Array.isArray(templateSections(item)));
    }
  } catch {
    // Fall through to the legacy migration for journey templates.
  }
  if (kind === "journey") {
    return storedDayTemplates().map((template) => ({
      id: template.id,
      label: template.label,
      description: template.description || "Saved from your current Journey outline.",
      fields: template.fields || []
    }));
  }
  return [];
}

function editorTemplateEntries(kind = "journey") {
  return [
    ...Object.entries(builtInEditorTemplates(kind)).map(([id, template]) => [id, { ...template, source: "system" }]),
    ...storedEditorTemplates(kind).map((template) => [template.id, { ...template, source: "mine" }])
  ];
}

function getEditorTemplate(kind = "journey", templateId = "") {
  return editorTemplateEntries(kind).find(([id]) => id === templateId)?.[1] || null;
}

function templateSections(template = {}) {
  if (Array.isArray(template.sections)) return template.sections.filter(Boolean);
  return (template.fields || [])
    .map((field) => dayFieldMeta[field]?.[0])
    .filter(Boolean);
}

function templateStructureLabel(template = {}) {
  const sections = templateSections(template);
  return sections.length ? sections.slice(0, 4).join(" · ") : "Blank canvas";
}

function templateSectionMeta(section = "") {
  const normalized = String(section || "").toLowerCase();
  if (/overview|summary/.test(normalized)) return { icon: "📍", prompt: "填写今天整体安排、节奏和体验重点。" };
  if (/highlight|recommend/.test(normalized)) return { icon: "✨", prompt: "填写今天最值得体验的重点。" };
  if (/route|schedule|timeline|transfer|arrival/.test(normalized)) return { icon: "🗺", prompt: "填写路线节奏、时间点或交通安排。" };
  if (/place|area|location/.test(normalized)) return { icon: "📍", prompt: "填写核心地点、为什么值得去和停留建议。" };
  if (/food|café|cafe|restaurant|stop/.test(normalized)) return { icon: "🍜", prompt: "填写推荐餐厅、咖啡馆或美食体验。" };
  if (/tip|note|info|practical/.test(normalized)) return { icon: "💡", prompt: "填写实用提醒、避坑或本地建议。" };
  if (/stay|hotel/.test(normalized)) return { icon: "🏨", prompt: "填写住宿区域、酒店建议或入住提醒。" };
  if (/experience|flow|story|process|workshop/.test(normalized)) return { icon: "✨", prompt: "填写体验氛围、流程和游客会做什么。" };
  if (/included|expect|review|faq/.test(normalized)) return { icon: "📝", prompt: "填写这一部分的内容。" };
  return { icon: "📍", prompt: "填写这一部分的内容。" };
}

function templateHtmlFromSections(sections = []) {
  return sections
    .filter(Boolean)
    .map((section) => {
      const meta = templateSectionMeta(section);
      return `<section class="template-section" data-template-section contenteditable="true">
        <p class="template-section-title"><span>${escapeHtml(meta.icon)}</span><strong>${escapeHtml(section)}</strong></p>
        <p class="template-section-prompt">${escapeHtml(meta.prompt)}</p>
      </section><p><br></p>`;
    })
    .join("");
}

function editorTemplateCard(id, template, kind, activeTemplate = "") {
  const searchText = [template.label, template.description, templateStructureLabel(template)].join(" ").toLowerCase();
  return `
    <button type="button"
      data-editor-template-option="${escapeHtml(id)}"
      data-template-kind="${escapeHtml(kind)}"
      data-template-card
      data-template-search-text="${escapeHtml(searchText)}"
      class="template-menu-card ${id === activeTemplate ? "is-active" : ""}">
      <span class="toolbar-check"></span>
      <span>
        <strong>${escapeHtml(template.label)}</strong>
        <small>${escapeHtml(templateStructureLabel(template))}</small>
      </span>
    </button>
  `;
}

function renderEditorTemplatePanel(kind = "journey", activeTemplate = "") {
  const builtIns = Object.entries(builtInEditorTemplates(kind));
  const mine = storedEditorTemplates(kind);
  const kindTitle = templateKindTitle(kind);
  return `
    <div class="toolbar-menu-panel template-library-panel" data-journey-toolbar-menu-panel data-template-kind="${escapeHtml(kind)}" hidden>
      <div class="template-library-head">
        <strong>Templates</strong>
        <small>${escapeHtml(kindTitle)} Templates</small>
      </div>
      <input class="template-library-search" type="search" data-editor-template-search placeholder="Search templates" />
      <div class="template-library-scroll">
        <p class="template-library-section">Built-in ${escapeHtml(kindTitle)} Templates</p>
        ${builtIns.map(([id, template]) => editorTemplateCard(id, template, kind, activeTemplate)).join("")}
        <p class="template-library-section">My ${escapeHtml(kindTitle)} Templates</p>
        ${mine.length ? mine.map((template) => editorTemplateCard(template.id, template, kind, activeTemplate)).join("") : `<p class="template-library-empty">No saved templates yet.</p>`}
      </div>
      <button type="button" class="template-library-save" data-save-editor-template data-template-kind="${escapeHtml(kind)}">
        <span class="toolbar-check"></span>
        <span>${escapeHtml(templateKindSaveLabel(kind))}</span>
      </button>
    </div>
  `;
}

function dayOutlineFields(day = {}) {
  if (Array.isArray(day.outlineFields) && day.outlineFields.length) {
    return day.outlineFields.filter((field) => dayFieldMeta[field]);
  }
  const template = getDayTemplate(inferDayTemplate(day));
  const fields = [...(template.fields || [])];
  Object.keys(dayFieldMeta).forEach((field) => {
    if (day[field] && !fields.includes(field)) fields.push(field);
  });
  return fields;
}

function saveCurrentDayAsTemplate() {
  const days = readItineraryDays();
  const day = days[state.currentExperienceDay] || defaultItineraryDay(state.currentExperienceDay);
  const name = window.prompt("Template name", day.title ? `${day.title} Template` : "My Day Template");
  if (!name?.trim()) return;
  const templates = storedDayTemplates();
  const idBase = experienceSlugFromTitle(name.trim()) || `template-${Date.now()}`;
  const id = `custom-${idBase}-${Date.now().toString(36)}`;
  const nextTemplate = {
    id,
    label: name.trim(),
    description: "Saved from your current Day outline.",
    fields: dayOutlineFields(day).length ? dayOutlineFields(day) : ["body"]
  };
  localStorage.setItem("chinamigoDayTemplates", JSON.stringify([...templates, nextTemplate].slice(-20)));
  day.template = id;
  day.outlineFields = [...nextTemplate.fields];
  $("[name='itineraryDays']").value = JSON.stringify(days);
  renderDayEditor();
  renderItineraryPreview(days);
  $("[data-experience-save-status]").textContent = "未保存";
  showToast(`已保存模板：${nextTemplate.label}`);
}

function inferDayTemplate(day = {}) {
  if (day.template && isKnownDayTemplate(day.template)) return day.template;
  if (day.arrival || day.transfer || day.hotel || day.eveningPlan) return "arrival";
  if (day.food) return "food";
  if (day.participation) return "experience";
  if (day.summary || day.highlights || day.timeline || day.places || day.experience || day.practical) return "city";
  return "free";
}

function defaultItineraryDay(index = 0) {
  return {
    title: `Day ${index + 1}`,
    template: "free",
    outlineFields: [],
    summary: "",
    highlights: "",
    timeline: "",
    places: "",
    experience: "",
    participation: "",
    food: "",
    practical: "",
    tips: "",
    arrival: "",
    transfer: "",
    hotel: "",
    eveningPlan: "",
    body: "",
    morning: "",
    afternoon: "",
    evening: "",
    stayNotes: "",
    image: ""
  };
}

function normalizeItineraryDay(day = {}, index = 0) {
  const next = {
    ...defaultItineraryDay(index),
    ...day
  };
  next.template = inferDayTemplate(next);
  next.outlineFields = Array.isArray(next.outlineFields) ? next.outlineFields.filter((field) => dayFieldMeta[field]) : [];
  if (!next.body && (next.morning || next.afternoon || next.evening || next.stayNotes)) {
    next.body = dayBodyFromLegacy(next);
  }
  return next;
}

function defaultExperience(overrides = {}) {
  return {
    id: "",
    title: "新行程",
    slug: "",
    city: state.cities[0]?.slug || "shanghai",
    type: "recommended_journey",
    duration: "3 Days",
    excerpt: "",
    coverImage: "",
    galleryImages: [],
    tags: ["Private"],
    itineraryDays: [
      defaultItineraryDay(0)
    ],
    shortDetails: { location: "", highlights: "", bookingMethod: "", notes: "" },
    experienceFlow: [],
    experienceDetails: [],
    includedSupport: [],
    notIncluded: [],
    reviews: [],
    faqs: [],
    expert: { name: "", role: "", details: "", image: "" },
    cta: { title: "", responseTime: "", buttonLabel: "", description: "" },
    rating: "",
    reviewCount: "",
    recommendRate: "",
    contentBlocks: [],
    sortOrder: state.experiences.length + 1,
    published: true,
    ...overrides
  };
}

function defaultExperienceForMode(mode = state.activeExperienceMode, overrides = {}) {
  const meta = experienceModeMeta(mode);
  const isShort = meta.type === "short_experience";
  return defaultExperience({
    title: isShort ? "新短体验" : "新完整行程",
    type: meta.type,
    duration: isShort ? "3 Hours" : "3 Days",
    tags: isShort ? ["Local Experience"] : ["Private Journey"],
    ...overrides
  });
}

function normalizeExperienceDraft(experience = {}) {
  const contentBlocks = Array.isArray(experience.contentBlocks) ? experience.contentBlocks : [];
  const dayBlocks = contentBlocks.filter((block) => block.type === "itinerary_day");
  return {
    ...defaultExperience(),
    ...experience,
    tags: Array.isArray(experience.tags) ? experience.tags : csvToList(experience.tags),
    galleryImages: Array.isArray(experience.galleryImages) ? experience.galleryImages : csvToList(experience.galleryImages),
    itineraryDays: Array.isArray(experience.itineraryDays) && experience.itineraryDays.length
      ? experience.itineraryDays.map((day, index) => normalizeItineraryDay(day, index))
      : (dayBlocks.length ? dayBlocks.map((block, index) => ({
        title: block.title || `Day ${index + 1}`,
        template: inferDayTemplate(block),
        outlineFields: Array.isArray(block.outlineFields) ? block.outlineFields : [],
        summary: block.summary || "",
        highlights: block.highlights || "",
        timeline: block.timeline || "",
        places: block.places || "",
        experience: block.experience || "",
        participation: block.participation || "",
        food: block.food || "",
        practical: block.practical || "",
        tips: block.tips || "",
        arrival: block.arrival || "",
        transfer: block.transfer || "",
        hotel: block.hotel || "",
        eveningPlan: block.eveningPlan || "",
        body: block.body || block.stayNotes || "",
        morning: block.morning || "",
        afternoon: block.afternoon || "",
        evening: block.evening || "",
        stayNotes: block.stayNotes || block.body || "",
        image: block.image || ""
      })) : [defaultItineraryDay(0)]),
    shortDetails: experience.shortDetails || { location: "", highlights: "", bookingMethod: "", notes: "" },
    experienceFlow: Array.isArray(experience.experienceFlow) ? experience.experienceFlow : [],
    experienceDetails: Array.isArray(experience.experienceDetails) ? experience.experienceDetails : [],
    includedSupport: Array.isArray(experience.includedSupport) ? experience.includedSupport : [],
    notIncluded: Array.isArray(experience.notIncluded) ? experience.notIncluded : [],
    reviews: Array.isArray(experience.reviews) ? experience.reviews : [],
    faqs: Array.isArray(experience.faqs) ? experience.faqs : [],
    expert: experience.expert || experience.localSpecialist || { name: "", role: "", details: "", image: "" },
    cta: experience.cta || { title: "", responseTime: "", buttonLabel: "", description: "" }
  };
}

function inquirySummary(item) {
  return [
    `ChinaMigo 客户咨询`,
    `姓名：${item.name || ""}`,
    `邮箱：${item.email || ""}`,
    `WhatsApp / 电话：${item.phone || item.whatsapp || ""}`,
    `旅行日期：${item.travelDates || ""}`,
    `人数：${item.travelers || ""}`,
    `感兴趣城市：${item.citiesInterestedIn || item.cities || ""}`,
    `住宿偏好：${item.preferredStayLevel || item.stayLevel || ""}`,
    `旅行风格：${(item.tripStyle || []).join(", ")}`,
    `状态：${zhStatus(item.status || "new")}`,
    `客户备注：${item.notes || ""}`,
    `内部备注：${item.internalNotes || ""}`
  ].join("\n");
}

function compactDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function zhStatus(value) {
  return statusLabels[value] || value || "草稿";
}

function statusClass(status) {
  const value = String(status || "new");
  if (value === "new") return "blue";
  if (["replied", "reviewed", "contacted"].includes(value)) return "orange";
  if (["following", "planning", "quoted"].includes(value)) return "yellow";
  if (value === "confirmed") return "green";
  if (value === "won") return "deep-green";
  if (["lost", "spam", "archived"].includes(value)) return "gray";
  return "gray";
}

function crmStatusValue(status) {
  const value = String(status || "new");
  if (["reviewed", "contacted"].includes(value)) return "replied";
  if (["planning", "quoted"].includes(value)) return "following";
  return value;
}

function inquiryPriority(item) {
  const tags = new Set([...(item.tags || []), ...(item.tripStyle || [])].map((tag) => String(tag).toLowerCase()));
  if (item.priority) return item.priority;
  if (tags.has("vip")) return "VIP";
  if (tags.has("urgent")) return "Urgent";
  if (tags.has("high intent")) return "High Intent";
  if ((item.preferredStayLevel || "").toLowerCase().includes("luxury")) return "Luxury";
  return "";
}

function inquiryPriorityClass(item) {
  const priority = inquiryPriority(item).toLowerCase();
  if (priority.includes("vip")) return "is-vip";
  if (priority.includes("urgent")) return "is-urgent";
  if (priority.includes("high intent")) return "is-high-intent";
  return "";
}

function inquiryNeedSummary(item) {
  const pieces = [
    item.preferredStayLevel,
    (item.tripStyle || []).slice(0, 3).join(" / "),
    item.notes
  ].filter(Boolean);
  return pieces.join(" · ") || "暂无客户需求摘要。";
}

function ownerBadge(owner = "Migo") {
  return `<span class="owner-badge"><i></i>${escapeHtml(owner || "Migo")}</span>`;
}

function applyTemplateVariables(body = "", item = {}) {
  const city = item.citiesInterestedIn || item.cities || "China";
  const values = {
    name: item.name || "",
    city,
    dates: item.travelDates || "",
    travelers: item.travelers || "",
    stayLevel: item.preferredStayLevel || item.stayLevel || "",
    style: (item.tripStyle || []).join(", ")
  };
  return String(body || "").replace(/\{\{\s*(name|city|dates|travelers|stayLevel|style)\s*\}\}/g, (_, key) => values[key] || "");
}

function crmTemplates() {
  const source = state.templates.length
    ? state.templates.filter((template) => template.active !== false)
    : Object.values(defaultQuickReplyTemplates);
  return source
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((template) => ({
      id: template.id || template.slug || template.label,
      key: template.slug || template.id || template.label,
      icon: template.icon || "💬",
      label: template.title || template.label || "未命名模板",
      category: template.category || "通用",
      body: template.body || "",
      text: (item) => applyTemplateVariables(template.body || "", item)
    }));
}

function templateByKey(key) {
  return crmTemplates().find((template) => template.key === key || template.id === key) || crmTemplates()[0];
}

function templateButton(item, key, template, extraClass = "secondary") {
  const preview = template.text(item);
  return `
    <button class="${extraClass} template-action" type="button" data-quick-reply="${escapeHtml(item.id)}" data-reply-template="${escapeHtml(key)}" data-template-preview="${escapeHtml(preview)}">
      <span>${escapeHtml(template.icon || "")}</span>
      <em>${escapeHtml(template.label)}</em>
      <small>${escapeHtml(preview)}</small>
    </button>
  `;
}

function crmTimelineIcon(label = "") {
  if (/模板|WhatsApp|文案/.test(label)) return "📄";
  if (/回复|联系|预约|电话/.test(label)) return "💬";
  if (/负责人|Migo|Alice|Admin/.test(label)) return "👤";
  if (/备注|预算|方案/.test(label)) return "📝";
  if (/状态|成交|流失|跟进/.test(label)) return "🟢";
  if (/提交|咨询/.test(label)) return "📩";
  return "•";
}

function crmTimelineClass(label = "") {
  if (/流失|垃圾|lost|spam/i.test(label)) return "event-lost";
  if (/成交|确认|won|confirmed/i.test(label)) return "event-won";
  if (/模板|WhatsApp|文案/i.test(label)) return "event-template";
  if (/备注|预算|方案/i.test(label)) return "event-note";
  if (/提交|咨询/i.test(label)) return "event-new";
  if (/状态|回复|跟进/i.test(label)) return "event-status";
  return "event-default";
}

function tagPills(items = []) {
  return items.length ? `<div class="detail-tags">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : "—";
}

function whatsappHref(item = {}) {
  const raw = String(item.phone || item.whatsapp || "").replace(/[^\d+]/g, "");
  if (!raw) return "";
  const normalized = raw.startsWith("+") ? raw.slice(1) : raw;
  return `https://wa.me/${normalized}`;
}

function whatsappTextHref(item = {}, text = "") {
  const href = whatsappHref(item);
  if (!href) return "";
  return `${href}?text=${encodeURIComponent(text)}`;
}

function contactValue(label, value, id, field) {
  if (!value) return `<div><dt>${escapeHtml(label)}</dt><dd>—</dd></div>`;
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd class="copyable-field">
        <span>${escapeHtml(value)}</span>
        <button class="mini-copy" type="button" data-copy-field="${escapeHtml(id)}" data-copy-value="${escapeHtml(value)}" data-copy-label="${escapeHtml(label)}">复制</button>
        ${field === "whatsapp" && whatsappHref({ phone: value }) ? `<a class="mini-copy" href="${escapeHtml(whatsappHref({ phone: value }))}" target="_blank" rel="noreferrer">WhatsApp</a>` : ""}
      </dd>
    </div>
  `;
}

function customerProfileSummary(item = {}) {
  const pieces = [
    inquiryPriority(item) || ((item.preferredStayLevel || "").toLowerCase().includes("luxury") ? "Luxury 倾向" : ""),
    item.travelers ? `${item.travelers} 人出行` : "",
    item.citiesInterestedIn || item.cities ? `${item.citiesInterestedIn || item.cities} 兴趣` : "",
    ...(item.tripStyle || []).slice(0, 2)
  ].filter(Boolean);
  return pieces.length ? pieces : ["需要进一步确认旅行偏好"];
}

function aiCustomerInsights(item = {}) {
  const text = [item.preferredStayLevel, item.notes, ...(item.tags || []), ...(item.tripStyle || [])].join(" ").toLowerCase();
  const insights = [];
  if (/luxury|vip|high intent|design hotel|private/.test(text)) insights.push("高概率 Luxury 客户");
  if (/hotel|stay|suite|aman|spa/.test(text)) insights.push("更关注酒店与恢复体验");
  if (/family|children|kid/.test(text)) insights.push("需要更柔和的亲子节奏");
  if (/business|meeting|sourcing|factory/.test(text)) insights.push("适合商务支持与翻译安排");
  if (daysSince(item.updatedAt || item.createdAt) >= 2 && !["won", "lost", "spam"].includes(crmStatusValue(item.status))) insights.push("建议今天跟进，避免冷却");
  return insights.length ? insights.slice(0, 4) : ["需要补充预算、酒店级别与城市偏好"];
}

function nextStepSuggestion(item = {}) {
  const status = crmStatusValue(item.status);
  if (daysSince(item.updatedAt || item.createdAt) >= 3 && !["won", "lost", "spam"].includes(status)) return "客户超过 3 天未跟进，建议先发送欢迎或预算确认模板。";
  if ((item.preferredStayLevel || "").toLowerCase().includes("luxury") || (item.tags || []).includes("Luxury")) return "建议发送 Luxury 行程模板，确认酒店级别与预算范围。";
  if ((item.tripStyle || []).includes("Family")) return "建议发送家庭旅行模板，确认儿童年龄与节奏偏好。";
  if (status === "new") return "建议先发送欢迎模板，并把客户标记为已回复。";
  return "建议根据客户偏好补充内部备注，保持下一步跟进清晰。";
}

function renderCrmTagGroups(selected = []) {
  const selectedSet = new Set(selected);
  return Object.entries(crmTagGroups).map(([group, tags]) => `
    <div class="crm-tag-group">
      <strong>${escapeHtml(group)}</strong>
      <div>
        ${tags.map((tag) => `
          <label class="crm-tag-check">
            <input type="checkbox" data-detail-tag-option value="${escapeHtml(tag)}" ${selectedSet.has(tag) ? "checked" : ""} />
            <span>${escapeHtml(tag)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function checkedCrmTags() {
  return $$("[data-detail-tag-option]:checked").map((input) => input.value);
}

function daysSince(value) {
  if (!value) return 9999;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function contactLine(item) {
  const contacts = [item.email, item.phone || item.whatsapp].filter(Boolean);
  return contacts.length ? contacts.join(" · ") : "<em>联系方式待补充</em>";
}

function latestActivity(item) {
  const activity = item.activity || [];
  return activity.length ? crmActivityLabel(activity[activity.length - 1].label) : "咨询已提交";
}

function crmActivityLabel(label = "") {
  const value = String(label || "");
  if (!value) return "内部操作";
  if (value === "Inquiry submitted") return "提交咨询";
  if (value === "Internal notes updated") return "更新内部备注";
  if (value.startsWith("Status changed")) return "状态发生变化";
  if (value.startsWith("Owner changed to")) return value.replace("Owner changed to", "负责人改为");
  if (value.startsWith("Priority changed to")) return value.replace("Priority changed to", "优先级改为");
  if (value.includes("WhatsApp")) return value;
  return value;
}

function overviewPriorityLabel(priority = "low") {
  if (priority === "urgent") return "紧急";
  if (priority === "normal") return "普通";
  return "低优先级";
}

function overviewActivityIcon(type = "") {
  if (type === "guide") return "📝";
  if (type === "city") return "🏙";
  if (type === "experience") return "🧳";
  if (type === "inquiry") return "📩";
  if (type === "media") return "🖼";
  return "•";
}

function focusKey(item = {}) {
  return `${item.type || "task"}:${item.label || ""}`;
}

function setFocusCompleted(key, completed) {
  if (completed) state.completedFocus.add(key);
  else state.completedFocus.delete(key);
  localStorage.setItem("chinamigo_completed_focus", JSON.stringify([...state.completedFocus]));
}

function activityTypeClass(type = "") {
  if (type === "guide") return "activity-guide";
  if (type === "city") return "activity-city";
  if (type === "experience") return "activity-experience";
  if (type === "inquiry") return "activity-inquiry";
  if (type === "media") return "activity-media";
  return "activity-default";
}

function filteredInquiries() {
  const query = ($("[data-inquiry-search]")?.value || "").toLowerCase();
  const status = $("[data-filter-status]")?.value || "";
  const crmFilter = $("[data-inquiries-list]")?.dataset.crmFilter || "";
  const city = ($("[data-filter-city]")?.value || "").toLowerCase();
  const dates = ($("[data-filter-dates]")?.value || "").toLowerCase();
  const created = ($("[data-filter-created]")?.value || "").toLowerCase();
  const stay = ($("[data-filter-stay]")?.value || "").toLowerCase();
  const travelers = ($("[data-filter-travelers]")?.value || "").toLowerCase();
  return state.inquiries.filter((item) => {
    const haystack = [item.name, item.email, item.phone, item.whatsapp, item.notes].join(" ").toLowerCase();
    const itemTags = [...(item.tags || []), ...(item.tripStyle || [])].join(" ").toLowerCase();
    const itemCity = String(item.citiesInterestedIn || item.cities || "").toLowerCase();
    const itemStatus = crmStatusValue(item.status);
    const matchesCrmFilter = !crmFilter
      || (crmFilter === "needs-reply" && ["new", "replied"].includes(itemStatus))
      || (crmFilter === "stale" && daysSince(item.updatedAt || item.createdAt) >= 3 && !["won", "lost", "spam"].includes(itemStatus))
      || (crmFilter === "high-intent" && /high intent|vip|urgent|luxury/.test(`${itemTags} ${item.priority || ""}`.toLowerCase()))
      || (crmFilter === "luxury" && /luxury/.test(`${itemTags} ${item.preferredStayLevel || ""}`.toLowerCase()))
      || (crmFilter === "shanghai" && itemCity.includes("shanghai"))
      || (crmFilter === "family" && itemTags.includes("family"));
    return matchesCrmFilter
      && (!query || haystack.includes(query))
      && (!status || itemStatus === status || item.status === status)
      && (!city || String(item.citiesInterestedIn || item.cities || "").toLowerCase().includes(city))
      && (!dates || String(item.travelDates || "").toLowerCase().includes(dates))
      && (!created || String(item.createdAt || "").toLowerCase().includes(created))
      && (!stay || String(item.preferredStayLevel || item.stayLevel || "").toLowerCase().includes(stay))
      && (!travelers || String(item.travelers || "").toLowerCase().includes(travelers));
  });
}

function renderInquiryList() {
  const items = filteredInquiries();
  const all = state.inquiries;
  const countStatus = (predicate) => all.filter(predicate).length;
  const won = countStatus((item) => crmStatusValue(item.status) === "won");
  const totalClosed = countStatus((item) => ["won", "lost"].includes(crmStatusValue(item.status)));
  const stats = [
    ["今日新增咨询", countStatus((item) => daysSince(item.createdAt) === 0)],
    ["最近24小时已回复", countStatus((item) => daysSince(item.lastReplyAt) === 0)],
    ["已成交", won],
    ["转化率", totalClosed ? `${Math.round((won / totalClosed) * 100)}%` : "—"]
  ];
  if ($("[data-inquiry-crm-stats]")) {
    $("[data-inquiry-crm-stats]").innerHTML = stats.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
  }
  $("[data-inquiries-list]").innerHTML = items.map((item) => {
    const tags = [...new Set([inquiryPriority(item), ...(item.tags || []), ...(item.tripStyle || []).slice(0, 2)].filter(Boolean))].slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    const cityLine = [item.citiesInterestedIn || item.cities || "城市待定", item.travelDates || ""].filter(Boolean).join(" · ");
    const status = crmStatusValue(item.status || "new");
    return `
      <article class="inquiry-row ${inquiryPriorityClass(item)} ${status === "new" ? "is-unread" : ""}" data-row-inquiry="${item.id}">
        <button class="inquiry-main" type="button" data-view-inquiry="${item.id}">
          <strong>${status === "new" ? "<b>NEW</b>" : ""}${escapeHtml(item.name || "未命名客户")}</strong>
          <span>${escapeHtml(cityLine)}</span>
          <small>${item.travelers ? `${escapeHtml(String(item.travelers))} 人` : "人数待确认"} · ${ownerBadge(item.owner || "Migo")}</small>
        </button>
        <div class="inquiry-tags">${tags || "<span>未标记</span>"}</div>
        <div class="inquiry-activity">
          <span>最后跟进：${formatRelativeDate(item.updatedAt || item.createdAt)}</span>
          <span>最后回复：${item.lastReplyAt ? formatRelativeDate(item.lastReplyAt) : "暂无记录"}</span>
          <small>${latestActivity(item)}</small>
        </div>
        <div class="inquiry-controls">
          <span class="status-pill ${statusClass(status)}">${zhStatus(status)}</span>
          <button class="secondary" type="button" data-view-inquiry="${item.id}">查看详情</button>
          <details class="more-menu">
            <summary>•••</summary>
            <div>
              <button type="button" data-quick-reply="${item.id}" data-reply-template="welcome">复制欢迎模板</button>
              <button type="button" data-copy-contact="${item.id}">复制联系方式</button>
              <button type="button" data-copy-inquiry="${item.id}">复制客户摘要</button>
              <button type="button" data-quick-reply="${item.id}" data-reply-template="luxury">复制 WhatsApp 文案</button>
              <button type="button" data-quick-note="${item.id}">添加备注</button>
              <button type="button" data-inquiry-status-action="${item.id}" data-status-next="won">标记成交</button>
              <button type="button" data-inquiry-status-action="${item.id}" data-status-next="lost">标记流失</button>
              <button type="button" data-mark-spam="${item.id}">标记垃圾</button>
              <button type="button" data-delete-inquiry="${item.id}">删除</button>
            </div>
          </details>
        </div>
      </article>
    `;
  }).join("") || "<p class='empty'>没有符合筛选条件的客户咨询。</p>";
}

function renderInquiryDetail(item) {
  const detail = $("[data-inquiry-detail]");
  if (!item) {
    detail.classList.add("is-hidden");
    detail.innerHTML = "";
    return;
  }
  detail.classList.remove("is-hidden");
  const timeline = [
    { at: item.createdAt, label: "提交咨询" },
    ...(item.activity || []).map((entry) => ({ at: entry.at, label: crmActivityLabel(entry.label) })),
    ...(item.statusHistory || []).map((entry) => ({ at: entry.at, label: `状态改为 ${zhStatus(entry.to)}` }))
  ].filter((entry) => entry.at || entry.label)
    .filter((entry, index, list) => list.findIndex((other) => other.at === entry.at && other.label === entry.label) === index)
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  const recentFollowups = timeline.slice(0, 5);
  const templates = crmTemplates();
  const primaryTemplate = templates[0];
  const welcomeHref = primaryTemplate ? whatsappTextHref(item, primaryTemplate.text(item)) : "";
  detail.innerHTML = `
    <div class="detail-head">
      <div class="detail-head-top">
        <div>
          <p class="eyebrow">咨询详情</p>
          <h3>${item.name || "未命名客户"}</h3>
          <div class="detail-head-meta">
            <span class="status-pill strong ${statusClass(crmStatusValue(item.status))}">${zhStatus(crmStatusValue(item.status))}</span>
            <label class="owner-switch">
              ${ownerBadge(item.owner || "Migo")}
              <select data-detail-owner-select="${item.id}">
                ${["Migo", "Alice", "Admin"].map((owner) => `<option value="${owner}" ${owner === (item.owner || "Migo") ? "selected" : ""}>${owner}</option>`).join("")}
              </select>
            </label>
            <span class="priority-chip">${escapeHtml(inquiryPriority(item) || "普通优先级")}</span>
          </div>
        </div>
        <button class="secondary" type="button" data-close-inquiry>关闭</button>
      </div>
      <div class="inquiry-detail-tabs">
        <button class="is-active" type="button" data-inquiry-tab="timeline">时间线</button>
        <button type="button" data-inquiry-tab="basic">客户画像</button>
        <button type="button" data-inquiry-tab="notes">内部备注</button>
      </div>
    </div>
    <div class="next-step-card">
      <span>下一步建议</span>
      <strong>${escapeHtml(nextStepSuggestion(item))}</strong>
      <div>
        <button type="button" data-inquiry-status-action="${item.id}" data-status-next="replied">标记已回复</button>
        <button class="secondary" type="button" data-jump-followup>写跟进</button>
        ${whatsappHref(item) ? `<a href="${escapeHtml(whatsappHref(item))}" target="_blank" rel="noreferrer">打开 WhatsApp</a>` : ""}
      </div>
    </div>
    <section class="inquiry-tab-panel is-active" data-inquiry-panel="timeline">
      <div class="follow-composer">
        <label>
          <span>跟进内容</span>
          <textarea rows="4" data-follow-note-text placeholder="记录客户回复、预算、偏好，或粘贴已发送的话术..."></textarea>
        </label>
        <div class="follow-composer-actions">
          <button class="secondary" type="button" data-toggle-templates>插入模板</button>
          <button type="button" data-save-followup="${item.id}">保存跟进</button>
          ${welcomeHref ? `<a href="${escapeHtml(welcomeHref)}" target="_blank" rel="noreferrer">WhatsApp</a>` : ""}
        </div>
        <div class="template-library is-hidden" data-template-library>
          <div>
            <strong>话术模板</strong>
            <small>选择后会复制到剪贴板，并记录到时间线。</small>
          </div>
          <div class="template-grid">
            ${templates.map((template) => templateButton(item, template.key, template)).join("")}
          </div>
        </div>
      </div>
      <div class="detail-block timeline-primary">
        <strong>客户时间线</strong>
        ${timeline.length ? `<ul class="crm-timeline">${timeline.map((entry) => `
          <li class="${crmTimelineClass(entry.label)}">
            <i>${crmTimelineIcon(entry.label)}</i>
            <div>
              <span>${escapeHtml(entry.label)}</span>
              <time>${escapeHtml(formatRelativeDate(entry.at))} · Migo</time>
            </div>
          </li>`).join("")}</ul>` : "<p>暂无时间线。</p>"}
      </div>
    </section>
    <section class="inquiry-tab-panel" data-inquiry-panel="basic">
      <div class="customer-brief">
        <span>客户画像摘要</span>
        <strong>${escapeHtml(customerProfileSummary(item).join(" · "))}</strong>
        <p>${escapeHtml(nextStepSuggestion(item))}</p>
      </div>
      <div class="ai-insight-card">
        <span>AI 客户总结</span>
        <ul>${aiCustomerInsights(item).map((insight) => `<li>${escapeHtml(insight)}</li>`).join("")}</ul>
      </div>
      <dl class="detail-grid">
        ${contactValue("邮箱", item.email, item.id, "email")}
        ${contactValue("WhatsApp / 电话", item.phone || item.whatsapp, item.id, "whatsapp")}
        <div><dt>旅行日期</dt><dd>${item.travelDates || "—"}</dd></div>
        <div><dt>人数</dt><dd>${item.travelers || "—"}</dd></div>
        <div><dt>感兴趣城市</dt><dd>${item.citiesInterestedIn || item.cities || "—"}</dd></div>
        <div><dt>住宿偏好</dt><dd>${item.preferredStayLevel || item.stayLevel || "—"}</dd></div>
        <div><dt>旅行风格</dt><dd>${tagPills(item.tripStyle || [])}</dd></div>
        <div><dt>来源页面</dt><dd>${item.sourcePage ? `<a class="source-link" href="${escapeHtml(item.sourcePage)}" target="_blank" rel="noreferrer">${escapeHtml(item.sourcePage)}</a>` : "—"}</dd></div>
        <div><dt>提交时间</dt><dd>${item.createdAt || "—"}</dd></div>
        <div><dt>状态</dt><dd>${zhStatus(item.status || "new")}</dd></div>
        <div><dt>负责人</dt><dd>${ownerBadge(item.owner || "Migo")}</dd></div>
        <div><dt>优先级</dt><dd>${inquiryPriority(item) || "普通"}</dd></div>
      </dl>
      <div class="detail-block">
        <strong>客户需求摘要</strong>
        <p>${escapeHtml(inquiryNeedSummary(item))}</p>
      </div>
    </section>
    <section class="inquiry-tab-panel" data-inquiry-panel="notes">
      <div class="detail-block">
        <strong>最近跟进</strong>
        ${recentFollowups.length ? `<ul class="crm-timeline compact">${recentFollowups.map((entry) => `
          <li class="${crmTimelineClass(entry.label)}">
            <i>${crmTimelineIcon(entry.label)}</i>
            <div>
              <span>${escapeHtml(entry.label)}</span>
              <time>${escapeHtml(formatRelativeDate(entry.at))} · Migo</time>
            </div>
          </li>`).join("")}</ul>` : "<p>暂无跟进记录。</p>"}
      </div>
      <div class="detail-block">
        <strong>客户备注</strong>
        <p>${item.notes || "暂无备注。"}</p>
      </div>
      <label class="detail-block">
        内部备注
        <textarea rows="6" data-detail-notes>${item.internalNotes || ""}</textarea>
      </label>
      <div class="detail-grid">
        <label>
          负责人
          <input data-detail-owner value="${item.owner || "Migo"}" placeholder="Migo / Alice / Admin" />
        </label>
        <label>
          优先级
          <select data-detail-priority>
            ${["", "High Intent", "VIP", "Urgent", "Luxury"].map((value) => `<option value="${value}" ${value === (item.priority || "") ? "selected" : ""}>${value || "普通"}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="detail-block">
        <strong>客户标签</strong>
        <div class="crm-tag-editor">${renderCrmTagGroups(item.tags || [])}</div>
      </div>
      <div class="form-actions">
        <button type="button" data-save-inquiry-notes="${item.id}">保存备注</button>
        <button class="secondary" type="button" data-copy-inquiry="${item.id}">复制客户摘要</button>
        <button class="secondary" type="button" data-copy-contact="${item.id}">复制联系方式</button>
        <button class="secondary" type="button" data-mark-spam="${item.id}">标记垃圾</button>
      </div>
    </section>
  `;
}

async function loadOverview() {
  state.overview = await api("/api/admin/overview");
  const overviewMeta = {
    guides: { label: "攻略", tab: "guides", lines: (s = {}) => [`${s.published || 0} 已发布`, `${s.draft || 0} 草稿`, `${s.needsWork || 0} 待完善`] },
    cities: { label: "城市", tab: "cities", lines: (s = {}) => [`${s.active || 0} 已启用`, `${s.navigation || 0} 导航显示`, `${s.needsWork || 0} 待完善`] },
    experiences: { label: "行程", tab: "experiences", lines: (s = {}) => [`${s.published || 0} 已发布`, `${s.draft || 0} 草稿`, `${s.needsWork || 0} 待完善`] },
    inquiries: { label: "客户咨询", tab: "inquiries", lines: (s = {}) => [`${s.unhandled || 0} 待回复`, `${s.active || 0} 跟进中`, `${s.confirmed || 0} 已成交`, `${s.lost || 0} 已流失`] },
    media: { label: "素材", tab: "media", lines: (s = {}) => [`${s.used || 0} 使用中`, `${s.unused || 0} 未使用`, `${s.uncategorized || 0} 待分类`] }
  };
  const urgentItems = state.overview.todoItems || [];
  const topTodo = urgentItems[0];
  $("[data-priority-alert]").innerHTML = topTodo ? `
    <div>
      <span class="priority-dot ${escapeHtml(topTodo.priority || "low")}"></span>
      <strong>${escapeHtml(topTodo.label)}</strong>
      <small>${escapeHtml(topTodo.due || "建议尽快处理")}</small>
    </div>
    <button type="button" data-overview-tab="${escapeHtml(topTodo.type)}">${escapeHtml(topTodo.action || "立即处理")}</button>
  ` : `
    <div>
      <span class="priority-dot low"></span>
      <strong>今天没有紧急事项</strong>
      <small>内容与客户跟进状态稳定。</small>
    </div>
    <button class="secondary" type="button" data-overview-tab="inquiries">查看咨询</button>
  `;
  $("[data-continue-edit]").innerHTML = (state.overview.recentlyEdited || []).slice(0, 1).map((item) => `
    <span>最近创建 / 继续编辑</span>
    <button type="button" data-overview-edit="${escapeHtml(item.type)}:${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.editor || "Migo")} 编辑 · ${escapeHtml(formatRelativeDate(item.updatedAt))}</small>
      <em>继续编辑</em>
    </button>
  `).join("") || "";
  const focusItems = state.overview.dailyFocus || [];
  const completedFocusCount = focusItems.filter((item) => state.completedFocus.has(focusKey(item))).length;
  $("[data-daily-focus]").innerHTML = (state.overview.dailyFocus || []).length ? `
    <div class="overview-card-head">
      <div>
        <p class="eyebrow">今日重点</p>
        <h3>今天先处理这些</h3>
      </div>
      <span>今日进度 ${completedFocusCount} / ${focusItems.length}</span>
    </div>
    <div class="daily-focus-progress"><i style="width:${focusItems.length ? Math.round((completedFocusCount / focusItems.length) * 100) : 0}%"></i></div>
    <div class="daily-focus-list">
      ${focusItems.map((item) => {
        const key = focusKey(item);
        const completed = state.completedFocus.has(key);
        return `
        <button class="${completed ? "is-complete" : ""}" type="button" data-focus-toggle="${escapeHtml(key)}">
          <i></i>
          <span>${escapeHtml(item.label)}</span>
        </button>
      `; }).join("")}
    </div>
  ` : `
    <div class="overview-card-head">
      <div>
        <p class="eyebrow">今日重点</p>
        <h3>今天没有紧急运营任务</h3>
      </div>
      <span>状态稳定</span>
    </div>
  `;
  $("[data-stats]").innerHTML = Object.entries(overviewMeta).map(([key, meta]) => `
    <button class="stat-card overview-clickable" type="button" data-overview-tab="${meta.tab}">
      <span>${meta.label}</span>
      <strong>${state.overview.counts[key] || 0}</strong>
      <em>${escapeHtml(state.overview.summaries?.[key]?.trend || "")}</em>
      <small>${meta.lines(state.overview.summaries?.[key]).join(" · ")}</small>
    </button>
  `).join("");
  $("[data-operating-status]").innerHTML = (state.overview.operatingStatus || []).map((item) => `
    <article>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");

  const taskList = (items, emptyText, limit = Infinity) => items?.length
    ? items.slice(0, limit).map((item) => `
      <button class="overview-task ${escapeHtml(item.priority || "low")}" type="button" data-overview-tab="${item.type}">
        <i>${escapeHtml(overviewPriorityLabel(item.priority))}</i>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.due || "")}${item.due ? " · " : ""}${escapeHtml(item.action || "去处理")}</span>
      </button>
    `).join("")
    : `<p class="empty">${emptyText}</p>`;
  $("[data-todo-items]").innerHTML = taskList(state.overview.todoItems, "目前没有明显待处理事项。", 4);
  $("[data-health-items]").innerHTML = taskList(state.overview.healthItems, "内容健康状态不错。");

  $("[data-latest-inquiries]").innerHTML = state.overview.latestInquiries.map((item) => `
    <article class="overview-inquiry-row">
      <div>
        <strong>${escapeHtml(item.name || "未命名客户")}</strong>
        <span>${escapeHtml([item.citiesInterestedIn || item.cities || "未填城市", item.travelDates || formatRelativeDate(item.createdAt)].filter(Boolean).join(" · "))}</span>
      </div>
      <span class="status-pill ${statusClass(crmStatusValue(item.status))}">${zhStatus(crmStatusValue(item.status || "new"))}</span>
      <div class="overview-row-actions">
        <button class="secondary" type="button" data-view-inquiry="${escapeHtml(item.id)}">查看详情</button>
      </div>
    </article>
  `).join("") || "<p class='empty'>暂无客户咨询。</p>";

  $("[data-recent-edits]").innerHTML = (state.overview.recentlyEdited || []).map((item) => `
    <button type="button" data-overview-edit="${escapeHtml(item.type)}:${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.editor || "Migo")} 编辑 · ${escapeHtml(item.meta || "")} · ${escapeHtml(formatRelativeDate(item.updatedAt))}</span>
    </button>
  `).join("") || "<p class='empty'>暂无最近编辑。</p>";

  $("[data-ai-suggestions]").innerHTML = (state.overview.aiSuggestions || []).map((item) => `
    <button type="button" data-overview-tab="${escapeHtml(item.type)}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.detail)}</span>
      <em>${escapeHtml(item.action || "去处理")}</em>
    </button>
  `).join("") || "<p class='empty'>目前没有明显运营建议。</p>";

  const systemStatusLabel = { ok: "正常运行", warning: "需人工跟进", manual: "手动流程", error: "出现错误" };
  $("[data-system-status]").innerHTML = (state.overview.systemStatus || []).map((item) => `
    <article class="${escapeHtml(item.status)}">
      <i></i>
      <div>
        <strong>${escapeHtml(item.label)} · ${escapeHtml(systemStatusLabel[item.status] || "状态未知")}</strong>
        <span>${escapeHtml(item.detail)} · 刚刚更新</span>
      </div>
    </article>
  `).join("");

  const activities = state.overview.recentActivities || [];
  const visibleActivities = state.overviewActivityExpanded ? activities : activities.slice(0, 5);
  $("[data-recent-activity]").innerHTML = visibleActivities.map((item) => `
    <button class="${activityTypeClass(item.type)}" type="button" data-overview-edit="${escapeHtml(item.type)}:${escapeHtml(item.target || "")}">
      <b>${escapeHtml(item.icon || overviewActivityIcon(item.type))}</b>
      <time>${escapeHtml(formatRelativeDate(item.at))}</time>
      <span>${escapeHtml(item.label)}</span>
    </button>
  `).join("") + (activities.length > 5 ? `<button class="overview-more" type="button" data-toggle-activity>${state.overviewActivityExpanded ? "收起活动" : `查看更多 ${activities.length - 5} 条`}</button>` : "") || "<p class='empty'>暂无最近活动。</p>";
}

async function loadInquiries() {
  state.inquiries = (await api("/api/admin/inquiries")).data;
  renderInquiryList();
}

async function loadGuides() {
  state.guides = (await api("/api/admin/guides")).data.map((guide) => ({
    ...guide,
    category: normalizeGuideCategory(guide.category)
  }));
  renderGuideFilters();
  renderGuideList();
  renderGuideCollections();
  if (state.guideDraft) renderGuideEditor();
  if (state.cities.length) renderCitiesCms();
}

function defaultGuideCollection() {
  return {
    id: "",
    title: "New Guide Collection",
    description: "",
    categories: [],
    guideSlugs: [],
    image: "",
    sortOrder: state.guideCollections.length + 1,
    active: true
  };
}

async function loadGuideCollections() {
  state.guideCollections = (await api("/api/admin/guide-collections")).data.map((collection) => ({
    ...collection,
    categories: normalizeGuideCategoryList(collection.categories || [])
  }));
  if (!state.currentGuideCollectionId && state.guideCollections.length) {
    selectGuideCollection(state.guideCollections[0]);
    return;
  }
  renderGuideCollections();
}

function guideCollectionDraftFromForm() {
  updateGuideCollectionGuideSlugs();
  const payload = formValues($("[data-guide-collection-form]"));
  payload.categories = normalizeGuideCategoryList(payload.categories);
  payload.guideSlugs = csvToList(payload.guideSlugs);
  return payload;
}

function selectGuideCollection(collection = defaultGuideCollection()) {
  state.currentGuideCollectionId = collection.id || "";
  fillForm($("[data-guide-collection-form]"), {
    ...collection,
    categories: collection.categories || [],
    guideSlugs: collection.guideSlugs || []
  });
  renderGuideCollectionImage(collection.image);
  renderGuideCollectionGuidePicker(collection.guideSlugs || []);
  renderGuideCollections();
}

function renderGuideCollectionImage(image) {
  const preview = $("[data-guide-collection-image-preview]");
  if (preview) preview.src = `/${image || "assets/guide-first-time-china.png"}`;
}

function selectedGuideCollectionSlugs() {
  return csvToList($("[data-guide-collection-form] [name='guideSlugs']")?.value || "");
}

function updateGuideCollectionGuideSlugs() {
  const selected = $$("[data-guide-collection-guide]:checked").map((input) => input.value);
  const input = $("[data-guide-collection-form] [name='guideSlugs']");
  if (input) input.value = listToCsv(selected);
}

function renderGuideCollectionGuidePicker(selectedSlugs = selectedGuideCollectionSlugs()) {
  const picker = $("[data-guide-collection-guide-picker]");
  if (!picker) return;
  const formCategories = normalizeGuideCategoryList($("[data-guide-collection-form] [name='categories']")?.value || "");
  const publishedGuides = state.guides.filter((guide) => guide.status === "published");
  const categorySlugs = publishedGuides
    .filter((guide) => formCategories.includes(guide.category))
    .map((guide) => guide.slug);
  const selected = new Set(selectedSlugs.length ? selectedSlugs : categorySlugs);
  picker.innerHTML = publishedGuides.map((guide) => `
    <label class="guide-pick-row">
      <input type="checkbox" value="${escapeHtml(guide.slug)}" data-guide-collection-guide ${selected.has(guide.slug) ? "checked" : ""} />
      <img src="/${escapeHtml(guide.coverImage || "assets/guide-first-time-china.png")}" alt="" />
      <span>
        <strong>${escapeHtml(guide.title || guide.translations?.en?.title || "未命名攻略")}</strong>
        <small>${escapeHtml([guide.category, guide.city].filter(Boolean).join(" · ") || "已发布攻略")}</small>
      </span>
    </label>
  `).join("") || "<p class='empty'>还没有已发布攻略。发布攻略后就可以在这里勾选。</p>";
  const input = $("[data-guide-collection-form] [name='guideSlugs']");
  if (input && !selectedSlugs.length && categorySlugs.length) input.value = listToCsv(categorySlugs);
}

function renderGuideCollections() {
  const list = $("[data-guide-collections-list]");
  if (!list) return;
  list.innerHTML = state.guideCollections.map((collection) => {
    const matchedBySlug = (collection.guideSlugs || []).filter((slug) => state.guides.some((guide) => guide.slug === slug && guide.status === "published"));
    const matchedByCategory = state.guides.filter((guide) => guide.status === "published" && (collection.categories || []).includes(guide.category));
    const count = new Set([...matchedBySlug, ...matchedByCategory.map((guide) => guide.slug)]).size;
    return `
      <article class="guide-collection-row ${collection.id === state.currentGuideCollectionId ? "is-active" : ""} ${collection.active === false ? "is-muted" : ""}">
        <img src="/${escapeHtml(collection.image || "assets/guide-first-time-china.png")}" alt="" />
        <button type="button" data-edit-guide-collection="${escapeHtml(collection.id)}">
          <strong>${escapeHtml(collection.title)}</strong>
          <span>${escapeHtml((collection.categories || []).join(" · ") || "手动勾选攻略")}</span>
          <small>${count} 篇 · 排序 ${Number(collection.sortOrder || 0)}</small>
        </button>
        <em>${collection.active === false ? "隐藏" : "启用"}</em>
      </article>
    `;
  }).join("") || "<p class='empty'>还没有精选合集。可以新建一个合集，或让首页继续按分类自动生成。</p>";

  if (!state.currentGuideCollectionId && state.guideCollections[0]) {
    selectGuideCollection(state.guideCollections[0] || defaultGuideCollection());
  } else {
    renderGuideCollectionGuidePicker();
  }
}

function renderGuideFilters() {
  const citySelect = $("[data-guide-filter-city]");
  const categorySelect = $("[data-guide-filter-category]");
  if (citySelect && citySelect.options.length <= 1) {
    [...new Set(state.guides.map((guide) => guide.city).filter(Boolean))].forEach((city) => citySelect.insertAdjacentHTML("beforeend", `<option>${escapeHtml(city)}</option>`));
  }
  if (categorySelect && categorySelect.options.length <= 1) {
    guideCategoryOptions.forEach((category) => categorySelect.insertAdjacentHTML("beforeend", `<option>${escapeHtml(category)}</option>`));
  }
}

function filteredGuides() {
  const query = ($("[data-guide-search]")?.value || "").toLowerCase();
  const city = $("[data-guide-filter-city]")?.value || "";
  const category = $("[data-guide-filter-category]")?.value || "";
  const language = $("[data-guide-filter-language]")?.value || "";
  const status = $("[data-guide-filter-status]")?.value || "";
  const date = ($("[data-guide-filter-date]")?.value || "").toLowerCase();
  const sort = $("[data-guide-sort]")?.value || "updated";
  const quick = $("[data-guides-list]")?.dataset.quickFilter || "";
  return [...state.guides].filter((guide) => {
    const langs = guideLanguageStatus(guide);
    const health = guideHealth(guide);
    const updatedDays = daysSince(guide.updatedAt || guide.publishedAt || guide.createdAt);
    const createdDays = daysSince(guide.createdAt || guide.publishedAt || guide.updatedAt);
    const haystack = [guide.title, guide.slug, guide.category, guide.city, ...(guide.tags || [])].join(" ").toLowerCase();
    return (!query || haystack.includes(query))
      && (!city || guide.city === city)
      && (!category || guide.category === category)
      && (!status || guide.status === status)
      && (!date || String(guide.publishedAt || "").toLowerCase().includes(date))
      && (!language || (language === "en" && langs.en) || (language === "cn" && langs.cn) || (language === "missing-cn" && !langs.cn))
      && (!quick
        || (quick === "draft" && guide.status !== "published")
        || (quick === "recent" && updatedDays <= 7)
        || (quick === "weekly" && createdDays <= 7)
        || (quick === "missing-cn" && health.some((item) => item.key === "missing-cn"))
        || (quick === "missing-cover" && health.some((item) => item.key === "missing-cover"))
        || (quick === "incomplete" && health.length));
  }).sort((a, b) => {
    if (sort === "title") return String(a.title).localeCompare(String(b.title));
    if (sort === "published") return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function guideHealth(guide) {
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  const html = [en.rawContent, cn.rawContent, en.htmlContent, cn.htmlContent].filter(Boolean).join(" ");
  const textLength = html.replace(/<[^>]+>/g, " ").trim().length;
  const issues = [];
  if (!guide.coverImage) issues.push({ key: "missing-cover", label: "缺卡片图", note: "前台攻略卡片缺少视觉图" });
  if (!cn.title && !cn.rawContent && !cn.htmlContent) issues.push({ key: "missing-cn", label: "缺中文", note: "中文版尚未创建，影响中文用户阅读" });
  if (!en.seo?.description && !guide.seo?.description && !guide.metaDescription) issues.push({ key: "missing-seo", label: "SEO 未完成", note: "SEO 描述未填写，建议 120–160 字" });
  if (!guide.coverImage) issues.push({ key: "missing-card-image", label: "卡片图未设置", note: "缺少 China Guides 首页卡片图" });
  if (textLength > 0 && textLength < 600) issues.push({ key: "short", label: "内容过短", note: "正文内容偏短，建议补充实用说明和 FAQ" });
  if (!/faq|question|常见问题|问题/i.test(html)) issues.push({ key: "missing-faq", label: "缺 FAQ", note: "建议加入 3–5 个游客常见问题" });
  return issues;
}

function guideCompletion(guide) {
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  const content = [en.rawContent, cn.rawContent, en.htmlContent, cn.htmlContent].filter(Boolean).join("\n");
  const checks = [
    { key: "card-image", label: "卡片图", ok: Boolean(guide.coverImage), note: "缺少前台攻略卡片图" },
    { key: "category", label: "分类与城市", ok: Boolean(guide.category && guide.city), note: "未关联分类或城市" },
    { key: "intro", label: "标题与简介", ok: Boolean(en.title && en.excerpt), note: "英文标题或简介未完成" },
    { key: "cn", label: "中文版", ok: Boolean(cn.title && (cn.rawContent || cn.excerpt)), note: "中文版本未创建" },
    { key: "seo", label: "SEO", ok: Boolean(en.seo?.description || guide.seo?.description || guide.metaDescription || en.excerpt), note: "SEO 描述未填写" },
    { key: "faq", label: "FAQ", ok: /FAQ|Q:|问：|常见问题|问题/i.test(content), note: "缺少 FAQ" },
    { key: "cta", label: "CTA", ok: /CTA:/i.test(content), note: "缺少联系按钮" }
  ];
  const completed = checks.filter((item) => item.ok).length;
  return {
    percent: Math.round((completed / checks.length) * 100),
    missing: checks.filter((item) => !item.ok),
    checks
  };
}

function renderGuideWorkflowStatus(guide = state.guideDraft) {
  if (!guide) return;
  const completion = guideCompletion(guide);
  const completionNode = $("[data-editor-completion]");
  if (completionNode) {
    const missingText = completion.missing.length ? `还差 ${completion.missing.length} 项可发布` : "已准备发布";
    completionNode.innerHTML = `<strong>内容完整度 ${completion.percent}%</strong><span>${missingText}</span>`;
  }
  const hintNode = $("[data-content-settings-hint]");
  if (hintNode) {
    hintNode.innerHTML = completion.missing.length
      ? completion.missing.slice(0, 3).map((item) => `<span title="${escapeHtml(item.note)}">${escapeHtml(item.label)}</span>`).join("")
      : "<span class='ready'>内容设置健康</span>";
  }
}

function renderGuideList() {
  const items = filteredGuides();
  $("[data-guides-list]").innerHTML = items.map((guide) => {
    const health = guideHealth(guide);
    const completion = guideCompletion(guide);
    return `
      <article class="guide-row ${guide.id === state.currentGuideId ? "is-active" : ""}">
        <button class="guide-title-cell" type="button" data-edit-guide="${guide.id}">
          <img src="/${guide.coverImage || "assets/guide-first-time-china.png"}" alt="" style="object-position:${escapeHtml(guide.imagePosition || "center center")};transform:scale(${Math.min(1.8, Math.max(1, Number(guide.imageScale || 1.02)))})" />
          <span>
            <strong>${escapeHtml(guide.title)}</strong>
            <small>${escapeHtml(guide.category || "未分类")} · ${escapeHtml(compactDate(guide.updatedAt || guide.publishedAt || guide.createdAt))}</small>
          </span>
        </button>
        <div class="guide-status-stack">
          <span class="status-pill ${guide.status === "published" ? "green" : "gray"}">${zhStatus(guide.status)}</span>
          <small>完整度 ${completion.percent}%</small>
        </div>
        <div class="guide-health">${health.length ? health.slice(0, 4).map((item) => `<span title="${escapeHtml(item.note || item.label)}">${escapeHtml(item.label)}</span>`).join("") : "<span class='ready'>健康</span>"}</div>
        <div class="guide-row-meta">
          <span>${guide.publishedAt || "未发布"}</span>
          ${guide.featured ? "<span class='ready'>精选</span>" : ""}
          <span>${escapeHtml(guide.city || "无城市")}</span>
        </div>
        <div class="row-actions">
          <button class="secondary" data-edit-guide="${guide.id}" type="button">继续编辑</button>
          <details class="more-menu">
            <summary>•••</summary>
            <div>
              <button type="button" data-preview-row-guide="${guide.id}">预览</button>
              <button type="button" data-duplicate-row-guide="${guide.id}">复制</button>
              <button type="button" data-delete-guide="${guide.id}">删除</button>
            </div>
          </details>
        </div>
      </article>
    `;
  }).join("") || "<p class='empty'>没有找到符合条件的攻略。</p>";
}

function selectGuide(guide) {
  state.guideDraft = JSON.parse(JSON.stringify(guide || defaultGuide()));
  state.currentGuideId = state.guideDraft.id;
  state.currentGuideLang = "en";
  $("[data-panel='guides']")?.classList.add("is-editor-open");
  renderGuideEditor();
  renderGuideList();
}

function renderGuideEditor() {
  const guide = state.guideDraft || defaultGuide();
  const form = $("[data-guide-form]");
  fillForm(form, {
    id: guide.id,
    slug: guide.slug,
    status: guide.status || "draft",
    author: guide.author || "ChinaMigo Editorial",
    city: guide.city,
    category: guide.category,
    readTime: guide.readTime,
    featured: String(Boolean(guide.featured)),
    publishedAt: guide.publishedAt,
    tags: guide.tags || [],
    coverImage: guide.coverImage,
    mobileCoverImage: guide.mobileCoverImage,
    coverAlt: guide.coverAlt,
    imagePosition: guide.imagePosition || "center center",
    imageScale: guide.imageScale || 1.02,
    titleEn: getGuideTranslation(guide, "en").title,
    excerptEn: getGuideTranslation(guide, "en").excerpt,
    titleCn: getGuideTranslation(guide, "cn").title,
    excerptCn: getGuideTranslation(guide, "cn").excerpt,
    seoTitleEn: getGuideTranslation(guide, "en").seo.title,
    seoTitleCn: getGuideTranslation(guide, "cn").seo.title,
    metaDescriptionEn: getGuideTranslation(guide, "en").seo.description,
    metaDescriptionCn: getGuideTranslation(guide, "cn").seo.description,
    ogImage: guide.seo?.ogImage,
    canonicalUrl: guide.seo?.canonicalUrl,
    noindex: String(Boolean(guide.seo?.noindex))
  });
  renderGuideCardImagePreview(guide);
  ["en", "cn"].forEach((lang) => {
    const translation = getGuideTranslation(guide, lang);
    const raw = $(`[data-raw-editor="${lang}"]`);
    const visual = $(`[data-visual-editor="${lang}"]`);
    const savedHtml = translation.htmlContent || blocksToHtml(translation.contentBlocks);
    if (raw) raw.value = translation.rawContent || htmlToPlainDraft(savedHtml);
    if (visual) {
      visual.innerHTML = savedHtml || (raw?.value ? markdownToHtml(raw.value) : "");
      upgradeEditorMediaNodes(visual);
      resetEditorHistory(lang);
    }
  });
  autoSizeEditors();
  updateWordCounts();
  renderRelatedList();
  renderRelatedSelect();
  renderGuideMediaPicker();
  renderTranslationStatus();
  renderGuidePreview();
  renderEditorChecks();
  renderGuideWorkflowStatus(guide);
  updateTranslationSyncPill(guide);
  $("[data-editor-title]").textContent = guide.title || "未命名攻略";
  if ($("[data-editor-status]")) $("[data-editor-status]").textContent = zhStatus(guide.status || "draft");
  if ($("[data-editor-lang]")) $("[data-editor-lang]").textContent = state.currentGuideLang === "cn" ? "中文" : "英文";
  setGuideEditorMode("edit");
  showReviewPanel(false);
  setUnsaved(false);
}

function renderGuideCardImagePreview(guide = state.guideDraft || {}) {
  const img = $("[data-cover-preview]");
  if (!img) return;
  const src = guide.coverImage ? `/${String(guide.coverImage).replace(/^\/+/, "")}` : "/assets/guide-first-time-china.png";
  const position = guide.imagePosition || $("[name='imagePosition']")?.value || "center center";
  const scale = Math.min(1.8, Math.max(1, Number(guide.imageScale || $("[name='imageScale']")?.value || 1.02)));
  $$("[data-cover-preview], [data-card-final-preview]").forEach((previewImg) => {
    previewImg.src = src;
    previewImg.style.objectPosition = position;
    previewImg.style.transform = `scale(${scale})`;
    previewImg.onload = () => updateGuideCardImageInfo(previewImg);
  });
  $("[data-cover-dropzone]")?.classList.toggle("has-image", Boolean(guide.coverImage));
  if ($("[data-card-preview-title]")) $("[data-card-preview-title]").textContent = guide.title || "攻略标题";
  if ($("[data-card-preview-excerpt]")) $("[data-card-preview-excerpt]").textContent = guide.excerpt || "攻略简介会显示在这里。";
  if ($("[data-card-preview-meta]")) {
    $("[data-card-preview-meta]").textContent = [guide.category || "China Guide", guide.readTime || "5 min read"].filter(Boolean).join(" · ").toUpperCase();
  }
  const positionInput = $("[name='imagePosition']");
  const scaleInput = $("[name='imageScale']");
  if (positionInput) positionInput.value = position;
  if (scaleInput) scaleInput.value = String(scale);
  updateGuideCardImageInfo(img);
}

function updateGuideCardImageInfo(image = $("[data-cover-preview]")) {
  const info = $("[data-card-image-info]");
  if (!info) return;
  const hasImage = state.guideDraft?.coverImage || $("[name='coverImage']")?.value;
  if (!hasImage) {
    info.textContent = "当前图片：未选择";
    return;
  }
  const width = image?.naturalWidth || 0;
  const height = image?.naturalHeight || 0;
  if (!width || !height) {
    info.textContent = "当前图片：读取中 · 前台比例 5:3 · 建议 1600 × 960 px";
    return;
  }
  const quality = width < 900 || height < 540
    ? "⚠ 当前图片较小，建议更换高清图"
    : width < 1600 || height < 960
      ? "可用，建议 1600 × 960 px 以上"
      : "✓ 高清";
  info.textContent = `当前图片：${width} × ${height} px · 前台比例 5:3 · ${quality}`;
}

function parseCropPosition(position = "center center") {
  const parts = String(position || "center center").trim().split(/\s+/);
  const read = (value, axis) => {
    if (/%$/.test(value || "")) return Math.min(100, Math.max(0, Number.parseFloat(value)));
    const mapX = { left: 0, center: 50, right: 100 };
    const mapY = { top: 0, center: 50, bottom: 100 };
    return axis === "x" ? (mapX[value] ?? 50) : (mapY[value] ?? 50);
  };
  return { x: read(parts[0], "x"), y: read(parts[1] || parts[0], "y") };
}

function setGuideCropPosition(x, y, scale = undefined, options = {}) {
  const { sync = true, preview = true, autosave = true } = options;
  if (sync) syncGuideFromForm();
  const cropX = Math.min(100, Math.max(0, Number(x)));
  const cropY = Math.min(100, Math.max(0, Number(y)));
  state.guideDraft.imagePosition = `${Math.round(cropX)}% ${Math.round(cropY)}%`;
  if (scale !== undefined) state.guideDraft.imageScale = Math.min(1.8, Math.max(1, Number(scale)));
  if ($("[name='imagePosition']")) $("[name='imagePosition']").value = state.guideDraft.imagePosition;
  if ($("[name='imageScale']")) $("[name='imageScale']").value = String(state.guideDraft.imageScale || 1.02);
  renderGuideCardImagePreview(state.guideDraft);
  if (preview) renderGuidePreview();
  setUnsaved(true);
  if (autosave) scheduleGuideAutosave();
}

function setUnsaved(value) {
  const node = $("[data-unsaved-state]");
  if (!node) return;
  node.textContent = value ? "有未保存修改" : `已自动保存 · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  node.classList.toggle("is-unsaved", value);
}

function blockTemplate(block, lang, index) {
  const blockTitle = block.title || block.body || "Untitled section";
  const mediaPreview = block.image ? `<img src="/${escapeHtml(block.image)}" alt="" />` : "";
  const itemCount = (block.items || []).length;
  return `
    <article class="content-block ${block.collapsed ? "is-collapsed" : ""}" data-block="${lang}" data-index="${index}" draggable="true">
      <header>
        <div class="block-identity">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${escapeHtml(block.type || "paragraph")}</strong>
            <em>${escapeHtml(blockTitle).slice(0, 80)}</em>
          </div>
        </div>
        <div>
          <button class="secondary" type="button" data-collapse-block>${block.collapsed ? "Expand" : "Collapse"}</button>
          <button class="secondary" type="button" data-duplicate-block>Duplicate</button>
          <button class="secondary" type="button" data-move-block="up">↑</button>
          <button class="secondary" type="button" data-move-block="down">↓</button>
          <button class="secondary" type="button" data-remove-block>Remove</button>
        </div>
      </header>
      <input data-block-field="collapsed" type="hidden" value="${block.collapsed ? "true" : "false"}" />
      <div class="block-preview">
        ${mediaPreview}
        <div>
          <span>${escapeHtml(block.type || "paragraph")} ${itemCount ? `· ${itemCount} items` : ""}</span>
          <p>${escapeHtml(block.body || block.title || "Add content for this section.")}</p>
        </div>
      </div>
      <div class="block-fields">
        <label>Section type<select data-block-field="type">
          ${["heading", "paragraph", "divider", "bullet_list", "number_list", "image", "gallery", "quote", "checklist", "tip", "cta", "faq", "video", "map", "table", "callout"].map((type) => `<option ${block.type === type ? "selected" : ""}>${type}</option>`).join("")}
        </select></label>
        <label>Heading / Question / CTA title<input data-block-field="title" value="${escapeHtml(block.title)}" /></label>
        <label>Body / Answer<textarea data-block-field="body" rows="3">${escapeHtml(block.body)}</textarea></label>
        <div class="form-grid">
          <label>Image from Media Library<input data-block-field="image" value="${escapeHtml(block.image)}" placeholder="assets/uploads/..." /></label>
          <label>Alt text<input data-block-field="alt" value="${escapeHtml(block.alt)}" /></label>
        </div>
        <label>List / Gallery items <small>one per line</small><textarea data-block-field="items" rows="3">${escapeHtml((block.items || []).join("\\n"))}</textarea></label>
        <div class="form-grid">
          <label>Button label<input data-block-field="label" value="${escapeHtml(block.label)}" /></label>
          <label>Button URL<input data-block-field="href" value="${escapeHtml(block.href)}" /></label>
        </div>
      </div>
    </article>
  `;
}

function renderBlockEditors() {
  ["en", "cn"].forEach((lang) => {
    const blocks = getGuideTranslation(state.guideDraft, lang).contentBlocks;
    $(`[data-blocks="${lang}"]`).innerHTML = blocks.map((block, index) => blockTemplate(block, lang, index)).join("") || "<p class='empty'>No blocks yet. Add a heading or paragraph to start writing.</p>";
  });
}

function readBlockElement(element) {
  const value = (field) => element.querySelector(`[data-block-field="${field}"]`)?.value || "";
  return {
    id: state.guideDraft.translations[element.dataset.block].contentBlocks[Number(element.dataset.index)]?.id || `block-${Date.now()}`,
    type: value("type") || "paragraph",
    title: value("title"),
    body: value("body"),
    image: value("image"),
    alt: value("alt"),
    items: value("items").split("\\n").map((item) => item.trim()).filter(Boolean),
    label: value("label"),
    href: value("href"),
    collapsed: value("collapsed") === "true"
  };
}

function syncBlocksFromDom(lang) {
  getGuideTranslation(state.guideDraft, lang).contentBlocks = $$(`[data-block="${lang}"]`).map(readBlockElement);
}

function syncGuideFromForm() {
  const form = $("[data-guide-form]");
  syncRawFromVisualEditors();
  const values = Object.fromEntries(new FormData(form).entries());
  const guide = state.guideDraft || defaultGuide();
  guide.id = values.id || guide.id;
  guide.slug = values.slug;
  guide.status = values.status;
  guide.author = values.author || "ChinaMigo Editorial";
  guide.city = values.city;
  guide.category = normalizeGuideCategory(values.category || guide.category);
  guide.readTime = values.readTime;
  guide.featured = values.featured === "true";
  guide.publishedAt = values.publishedAt;
  guide.tags = csvToList(values.tags);
  guide.coverImage = values.coverImage;
  guide.mobileCoverImage = values.mobileCoverImage;
  guide.coverAlt = values.coverAlt;
  guide.imagePosition = values.imagePosition || guide.imagePosition || "center center";
  guide.imageScale = Math.min(1.8, Math.max(1, Number(values.imageScale || guide.imageScale || 1.02)));
  guide.seo = {
    ogImage: values.ogImage,
    canonicalUrl: values.canonicalUrl,
    noindex: values.noindex === "true"
  };
  getGuideTranslation(guide, "en").title = values.titleEn;
  getGuideTranslation(guide, "en").excerpt = values.excerptEn;
  syncRawFromVisualEditor("en");
  getGuideTranslation(guide, "en").rawContent = $(`[data-raw-editor="en"]`)?.value || "";
  getGuideTranslation(guide, "en").htmlContent = editorHtmlForSave($(`[data-visual-editor="en"]`)) || markdownToHtml(getGuideTranslation(guide, "en").rawContent);
  getGuideTranslation(guide, "en").seo = { title: values.seoTitleEn, description: values.metaDescriptionEn };
  getGuideTranslation(guide, "cn").title = values.titleCn;
  getGuideTranslation(guide, "cn").excerpt = values.excerptCn;
  syncRawFromVisualEditor("cn");
  getGuideTranslation(guide, "cn").rawContent = $(`[data-raw-editor="cn"]`)?.value || "";
  getGuideTranslation(guide, "cn").htmlContent = editorHtmlForSave($(`[data-visual-editor="cn"]`)) || markdownToHtml(getGuideTranslation(guide, "cn").rawContent);
  getGuideTranslation(guide, "cn").seo = { title: values.seoTitleCn, description: values.metaDescriptionCn };
  if ($(`[data-block="en"]`)) syncBlocksFromDom("en");
  if ($(`[data-block="cn"]`)) syncBlocksFromDom("cn");
  guide.title = getGuideTranslation(guide, "en").title || getGuideTranslation(guide, "cn").title || "Untitled Guide";
  guide.excerpt = getGuideTranslation(guide, "en").excerpt || getGuideTranslation(guide, "cn").excerpt || "";
  guide.contentBlocks = getGuideTranslation(guide, "en").contentBlocks;
  guide.readTime = estimateGuideReadTime(guide);
  if ($("[name='readTime']")) $("[name='readTime']").value = guide.readTime;
  updateTranslationSyncPill(guide);
  return guide;
}

function estimateGuideReadTime(guide) {
  const text = [
    getGuideTranslation(guide, "en").rawContent,
    getGuideTranslation(guide, "cn").rawContent,
    getGuideTranslation(guide, "en").htmlContent?.replace(/<[^>]+>/g, " "),
    getGuideTranslation(guide, "cn").htmlContent?.replace(/<[^>]+>/g, " "),
    guide.excerpt
  ].filter(Boolean).join(" ");
  const latinWords = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
  const cjkChars = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const minutes = Math.max(1, Math.ceil((latinWords + cjkChars / 2) / 220));
  return `${minutes} min read`;
}

function renderRelatedSelect() {
  if (!$("[data-related-select]")) return;
  const query = ($("[data-related-search]")?.value || "").toLowerCase();
  const current = state.guideDraft;
  $("[data-related-select]").innerHTML = state.guides
    .filter((guide) => guide.id !== current.id)
    .filter((guide) => !query || [guide.title, guide.slug].join(" ").toLowerCase().includes(query))
    .map((guide) => `<option value="${guide.slug}">${escapeHtml(guide.title)}</option>`)
    .join("");
}

function renderGuideMediaPicker() {
  const picker = $("[data-guide-media-picker]");
  if (!picker) return;
  picker.innerHTML = state.media.slice(0, 18).map((item) => `
    <button type="button" data-pick-cover="${escapeHtml(item.url)}">
      <img src="/${escapeHtml(item.url)}" alt="" />
      <span>${escapeHtml(mediaCategoryLabel(item.category || item.folder))}</span>
    </button>
  `).join("") || "<p class='empty'>先上传素材，再在这里复用。</p>";
}

function renderTranslationStatus() {
  const node = $("[data-translation-status]");
  if (!node || !state.guideDraft) return;
  const status = guideLanguageStatus(state.guideDraft);
  const enBlocks = getGuideTranslation(state.guideDraft, "en").contentBlocks.length;
  const cnBlocks = getGuideTranslation(state.guideDraft, "cn").contentBlocks.length;
  node.innerHTML = `
    <article><strong>${status.en ? "英文已完成" : "需要英文内容"}</strong><span>英文 · ${enBlocks} 个段落</span></article>
    <article><strong>${status.cn ? "中文已完成" : "需要中文版本"}</strong><span>中文 · ${cnBlocks} 个段落</span></article>
  `;
  updateTranslationSyncPill(state.guideDraft);
}

function renderRelatedList() {
  if (!$("[data-related-list]")) return;
  const related = state.guideDraft.relatedGuides || [];
  $("[data-related-list]").innerHTML = related.map((slug) => {
    const guide = state.guides.find((item) => item.slug === slug);
    return `
      <span>
        ${guide?.coverImage ? `<img src="/${escapeHtml(guide.coverImage)}" alt="" />` : ""}
        <strong>${escapeHtml(guide?.title || slug)}</strong>
        <button type="button" data-remove-related="${escapeHtml(slug)}">×</button>
      </span>
    `;
  }).join("") || "<p class='empty'>暂未选择相关阅读。</p>";
}

function cleanupGuideArticleHtml(html = "") {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  template.content.querySelectorAll("figcaption").forEach((caption) => {
    if (isDefaultMediaFilenameCaption(caption.textContent)) caption.remove();
  });
  template.content.querySelectorAll("[data-media-resize-handle]").forEach((node) => node.remove());
  template.content.querySelectorAll(".is-selected,.is-slot-selected,.is-crop-editing").forEach((node) => {
    node.classList.remove("is-selected", "is-slot-selected", "is-crop-editing");
  });
  return template.innerHTML;
}

function sectionizeGuidePreviewHtml(html = "") {
  const template = document.createElement("template");
  template.innerHTML = cleanupGuideArticleHtml(html);
  const output = document.createElement("div");
  let currentSection = null;
  const usedIds = new Set();
  const uniqueId = (label) => {
    const base = slugify(label || "overview", "overview");
    let id = base;
    let count = 2;
    while (usedIds.has(id)) {
      id = `${base}-${count}`;
      count += 1;
    }
    usedIds.add(id);
    return id;
  };
  const startSection = (headingText) => {
    currentSection = document.createElement("section");
    currentSection.id = uniqueId(headingText);
    currentSection.dataset.tocTitle = headingText || "Overview";
    output.appendChild(currentSection);
  };

  [...template.content.children].forEach((child) => {
    let node = child;
    if (node.tagName === "H1") {
      const heading = document.createElement("h2");
      heading.innerHTML = node.innerHTML;
      node = heading;
    }
    if (node.tagName === "H2") {
      startSection(node.textContent.trim() || "Overview");
      currentSection.appendChild(node);
      return;
    }
    if (!currentSection) startSection("Overview");
    if (node.tagName === "IMG") {
      const figure = document.createElement("figure");
      figure.className = "article-inline-image";
      figure.appendChild(node);
      currentSection.appendChild(figure);
      return;
    }
    currentSection.appendChild(node);
  });

  if (!output.children.length) output.innerHTML = template.innerHTML;
  if (!output.querySelector("#need-help")) {
    output.insertAdjacentHTML("beforeend", `
      <section id="need-help" data-toc-title="Need help?">
        <div class="article-cta">
          <h2>Need help planning this in China?</h2>
          <p>ChinaMigo can help with payments, translation, transport and local support.</p>
          <a class="pill-button dark" href="https://wa.me/8613800000000?text=Hi%20ChinaMigo%2C%20I%27d%20like%20help%20with%20a%20China%20guide.">Chat on WhatsApp</a>
        </div>
      </section>
    `);
  }
  return output.innerHTML;
}

function guidePreviewTocHtml(sectionHtml = "") {
  const template = document.createElement("template");
  template.innerHTML = sectionHtml;
  return [...template.content.querySelectorAll("section[data-toc-title]")]
    .map((section, index) => {
      const title = section.dataset.tocTitle || "Overview";
      return `<a class="${index === 0 ? "is-active" : ""}" href="#${escapeHtml(section.id)}">${escapeHtml(title)}</a>`;
    })
    .join("");
}

function renderGuidePreviewDocument(html = "") {
  const bodyHtml = sectionizeGuidePreviewHtml(html);
  const tocHtml = guidePreviewTocHtml(bodyHtml);
  return `
    <section class="article-shell preview-article-shell">
      <aside class="article-toc" aria-label="Table of contents">
        <p>In this guide</p>
        <nav>${tocHtml}</nav>
      </aside>
      <article class="article-body preview-article-body">
        ${bodyHtml}
      </article>
    </section>
  `;
}

function renderGuidePreview() {
  const guide = syncGuideFromForm();
  ["en", "cn"].forEach((lang) => {
    const translation = getGuideTranslation(guide, lang);
    const preview = $(`[data-fast-preview="${lang}"]`);
    if (!preview) return;
    const contentHtml = translation.htmlContent || "";
    preview.innerHTML = renderGuidePreviewDocument(contentHtml);
  });
  const lang = state.currentGuideLang;
  const translation = getGuideTranslation(guide, lang);
  const blockHtml = translation.htmlContent || translation.contentBlocks.map((block) => {
    if (block.type === "heading") return `<h3>${escapeHtml(block.title)}</h3>`;
    if (block.type === "quote") return `<blockquote>${escapeHtml(block.body || block.title)}</blockquote>`;
    if (block.type === "image") return `<img src="/${escapeHtml(block.image)}" alt="${escapeHtml(block.alt)}" />`;
    if (block.type === "gallery") return `<div class="preview-gallery">${(block.items || []).map((src) => `<img src="/${escapeHtml(src)}" alt="" />`).join("")}</div>`;
    if (block.type === "divider") return `<hr />`;
    if (block.type === "tip") return `<aside><strong>${escapeHtml(block.title || "Travel Tip")}</strong><p>${escapeHtml(block.body)}</p></aside>`;
    if (block.type === "cta") return `<aside><strong>${escapeHtml(block.title)}</strong><p>${escapeHtml(block.body)}</p><span>${escapeHtml(block.label)}</span></aside>`;
    if (block.type === "faq") return `<details open><summary>${escapeHtml(block.title)}</summary><p>${escapeHtml(block.body)}</p></details>`;
    if (["bullet_list", "number_list", "checklist"].includes(block.type)) {
      const tag = block.type === "number_list" ? "ol" : "ul";
      return `<${tag}>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
    }
    return `<p>${escapeHtml(block.body || block.title)}</p>`;
  }).join("");
  $("[data-guide-preview]").innerHTML = renderGuidePreviewDocument(blockHtml);
  renderEditorChecks();
}

function setGuideEditorMode(mode = "edit") {
  $$("[data-editor-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.editorMode === mode);
  });
  $$("[data-editor-mode-panel]").forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.editorModePanel !== mode);
  });
  $(".simple-editor-shell")?.classList.toggle("is-preview-mode", mode === "preview");
  if (mode === "preview") renderGuidePreview();
}

function showReviewPanel(show = true) {
  $("[data-review-panel]")?.classList.toggle("is-collapsed", !show);
  $("[data-toggle-review-panel]")?.classList.toggle("is-active", show);
}

function autoSizeEditor(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(520, textarea.scrollHeight + 4)}px`;
}

function autoSizeEditors() {
  $$("[data-raw-editor]").forEach(autoSizeEditor);
}

function renderEditorChecks() {
  const node = $("[data-editor-checks]");
  if (!node || !state.guideDraft) return;
  const guide = syncGuideFromForm();
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  const content = `${en.rawContent || ""}\n${cn.rawContent || ""}`;
  const checks = [
    { key: "card-image", label: "卡片图", ok: Boolean(guide.coverImage), note: guide.coverImage ? "已设置攻略卡片图" : "建议添加前台卡片图" },
    { key: "faq", label: "常见问题", ok: /FAQ|Q:|问：|常见问题/i.test(content), note: /FAQ|Q:|问：|常见问题/i.test(content) ? "已包含信任问答" : "游客常问支付、接机和翻译，建议添加 3–5 个 FAQ" },
    { key: "cta", label: "联系按钮", ok: /CTA:/i.test(content), note: /CTA:/i.test(content) ? "已添加联系按钮" : "缺少联系按钮" },
    { key: "language", label: "中文版本", ok: Boolean(cn.title || cn.rawContent), note: (cn.title || cn.rawContent) ? "中文版已准备" : "尚未添加中文版" },
    { key: "seo", label: "SEO 基础", ok: Boolean(en.title && en.excerpt), note: (en.title && en.excerpt) ? "SEO 标题和简介已完成" : "建议补充标题和简介" },
    { key: "readability", label: "阅读体验", ok: (en.rawContent || "").length > 300 || (cn.rawContent || "").length > 120, note: "阅读节奏自动检查" }
  ];
  renderGuideWorkflowStatus(guide);
  node.innerHTML = checks.map((check) => `
    <article class="${check.ok ? "is-ok" : "needs-work"}" data-jump-section="${check.key}">
      <span>${check.ok ? "✓" : "!"}</span>
      <div><strong>${check.label}</strong><small>${check.note}</small></div>
    </article>
  `).join("");
}

async function uploadAdminImage(file, folder = "guides", tags = []) {
  const dataUrl = await fileToDataUrl(file);
  const response = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, alt: file.name.replace(/\.[^.]+$/, ""), folder, category: folder, tags, dataUrl })
  });
  await loadMedia();
  return response.media || { url: response.path };
}

function jumpToEditorSection(section) {
  setGuideEditorMode("edit");
  showReviewPanel(true);
  $("[data-edit-panel]")?.classList.remove("is-hidden");
  let target = null;
  if (section === "hero") {
    $("[data-hero-settings]")?.setAttribute("open", "");
    target = $("[data-cover-dropzone]");
  }
  if (section === "intro" || section === "seo") target = $(`[name="excerpt${state.currentGuideLang === "cn" ? "Cn" : "En"}"]`);
  if (section === "faq" || section === "cta" || section === "readability") target = $(`[data-raw-editor="${state.currentGuideLang}"]`);
  if (section === "language") {
    state.currentGuideLang = "cn";
    $$("[data-lang-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.langTab === "cn"));
    $$("[data-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.langPanel !== "cn"));
    $$("[data-source-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.sourceLangPanel !== "cn"));
    target = $("[name='titleCn']");
  }
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  target?.focus?.();
  target?.classList.add("is-highlighted");
  window.setTimeout(() => target?.classList.remove("is-highlighted"), 1200);
}

function addMissingSection(section) {
  const editor = $(`[data-raw-editor="${state.currentGuideLang}"]`);
  if (!editor) return;
  if (section === "faq") insertTextIntoTextarea(editor, "\n\n## FAQ 常见问题\n\nQ: 游客可以使用支付宝吗？\n\nA: 可以，建议出发前完成绑定和测试。\n\nQ: 是否提供翻译协助？\n\nA: 可以，ChinaMigo 可协助沟通、预约和现场支持。\n\n");
  if (section === "cta") insertTextIntoTextarea(editor, "\n\nCTA: Chat on WhatsApp | https://wa.me/\n\n");
  if (section === "seo") $(`[name="excerpt${state.currentGuideLang === "cn" ? "Cn" : "En"}"]`)?.focus();
  renderGuidePreview();
  setUnsaved(true);
}

function applySlashCommand(textarea) {
  const value = textarea.value;
  const commandMap = {
    "/faq": "## FAQ 常见问题\n\nQ: 游客最常问什么？\n\nA: 可以在这里写一个简短、安心的回答。\n\n",
    "/cta": "CTA: Chat on WhatsApp | https://wa.me/\n\n",
    "/quote": "> 写一句适合作为文章重点摘录的话。\n\n",
    "/image": "![图片说明](assets/uploads/your-image.jpg)\n\n"
  };
  const command = Object.keys(commandMap).find((key) => new RegExp(`(^|\\n)${key.replace("/", "\\/")}$`).test(value));
  if (!command) return false;
  textarea.value = value.replace(new RegExp(`(^|\\n)${command.replace("/", "\\/")}$`), `$1${commandMap[command]}`);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function getActiveRawEditor() {
  if (document.activeElement?.matches?.("[data-raw-editor]")) return document.activeElement;
  return $(`[data-raw-editor="${state.currentGuideLang}"]`);
}

function getActiveVisualEditor() {
  if (document.activeElement?.matches?.("[data-visual-editor]")) return document.activeElement;
  if (document.activeElement?.matches?.("[data-journey-visual-editor]")) return document.activeElement;
  if (document.activeElement?.matches?.("[data-short-visual-editor]")) return document.activeElement;
  if (state.currentGuideLang === "journey" || state.lastVisualSelection?.lang === "journey") return $(`[data-visual-editor="journey"]`);
  if (state.currentGuideLang === "short" || state.lastVisualSelection?.lang === "short") return $(`[data-visual-editor="short"]`);
  return $(`[data-visual-editor="${state.currentGuideLang}"]`);
}

function rememberVisualSelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const node = selection.anchorNode;
  const visual = node?.nodeType === 1
    ? node.closest?.("[data-visual-editor]")
    : node?.parentElement?.closest?.("[data-visual-editor]");
  if (!visual || !visual.contains(selection.focusNode)) return;
  state.lastVisualSelection = {
    lang: visual.dataset.visualEditor || state.currentGuideLang,
    range: selection.getRangeAt(0).cloneRange()
  };
  updateToolbarState(visual);
}

function restoreVisualSelection(lang = state.currentGuideLang) {
  const visual = $(`[data-visual-editor="${lang}"]`);
  const selection = window.getSelection();
  if (!visual || !selection) return visual;
  try {
    if (state.lastVisualSelection?.lang !== lang || !state.lastVisualSelection.range) {
      visual.focus({ preventScroll: true });
      const fallbackRange = document.createRange();
      fallbackRange.selectNodeContents(visual);
      fallbackRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(fallbackRange);
      state.lastVisualSelection = { lang, range: fallbackRange.cloneRange() };
      return visual;
    }
    const range = state.lastVisualSelection.range.cloneRange();
    if (!visual.contains(range.commonAncestorContainer)) return visual;
    visual.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    visual.focus({ preventScroll: true });
  }
  return visual;
}

function nodeFromSelection(selection) {
  if (!selection || !selection.rangeCount) return null;
  const node = selection.anchorNode;
  return node?.nodeType === 1 ? node : node?.parentElement;
}

function closestWithinEditor(node, selector, editor) {
  const element = node?.closest?.(selector);
  return element && editor?.contains(element) ? element : null;
}

const BLOCK_STYLE_MAP = {
  medium: { tag: "p", label: "Body" },
  hero: { tag: "h1", label: "H1" },
  large: { tag: "h2", label: "H2" },
  small: { tag: "h3", label: "H3" }
};

const TEXT_COLOR_LABELS = {
  "#111111": "文字颜色",
  "#8A5A2B": "Highlight",
  "#9B3D2E": "Warning",
  "#2F5F55": "Brand"
};

const FILL_COLOR_LABELS = {
  transparent: "背景颜色",
  "#F3E7C8": "Tip 背景",
  "#F1E6E0": "Warning 背景",
  "#E8EFE7": "推荐背景",
  "#E7EDF6": "信息背景"
};

function getSelectionNodeForEditor(editor) {
  const selection = window.getSelection();
  let node = nodeFromSelection(selection);
  if (node && editor?.contains(node)) return node;
  const range = state.lastVisualSelection?.range;
  if (range && editor?.contains(range.commonAncestorContainer)) {
    node = range.commonAncestorContainer;
    return node?.nodeType === 1 ? node : node?.parentElement;
  }
  return null;
}

function getCurrentBlock(editor, node = getSelectionNodeForEditor(editor)) {
  if (!editor || !node || !editor.contains(node)) return null;
  const block = closestWithinEditor(node, "h1,h2,h3,p,li,blockquote", editor);
  if (block) return block;
  let current = node.nodeType === 1 ? node : node.parentElement;
  while (current && current.parentElement && current.parentElement !== editor) current = current.parentElement;
  return current && current !== editor ? current : null;
}

function blockStyleValue(block) {
  const tag = block?.tagName?.toLowerCase();
  if (tag === "h1") return "hero";
  if (tag === "h2") return "large";
  if (tag === "h3") return "small";
  return "medium";
}

function inlineSizeValue(node, editor) {
  const sizeNode = node && editor ? closestWithinEditor(node, ".cms-text-size", editor) : null;
  if (!sizeNode) return "";
  if (sizeNode.classList.contains("cms-text-size-hero")) return "hero";
  if (sizeNode.classList.contains("cms-text-size-large")) return "large";
  if (sizeNode.classList.contains("cms-text-size-small")) return "small";
  if (sizeNode.classList.contains("cms-text-size-medium")) return "medium";
  return "";
}

function setToolbarCurrent(kind, label) {
  $$(`[data-toolbar-current="${kind}"]`).forEach((node) => {
    node.textContent = label;
  });
}

function updateToolbarState(editor = getActiveVisualEditor()) {
  if (!editor) return;
  const node = getSelectionNodeForEditor(editor);
  const inEditor = node && editor.contains(node);
  const activeBold = inEditor && Boolean(closestWithinEditor(node, "strong,b", editor));
  const activeColorNode = inEditor ? closestWithinEditor(node, ".cms-text-color", editor) : null;
  const activeHighlightNode = inEditor ? closestWithinEditor(node, "mark.cms-highlight", editor) : null;
  const activeColorValue = activeColorNode?.dataset.colorValue || activeColorNode?.style?.color || "#111111";
  const activeFillValue = activeHighlightNode?.dataset.highlightValue || activeHighlightNode?.style?.background || activeHighlightNode?.style?.backgroundColor || "transparent";
  const activeBlockValue = inlineSizeValue(node, editor) || blockStyleValue(getCurrentBlock(editor, node));
  $$("[data-format-inline='bold']").forEach((button) => button.classList.toggle("is-active", activeBold));
  $$("[data-format-inline='size']").forEach((button) => button.classList.toggle("is-active", button.dataset.formatValue === activeBlockValue));
  $$("[data-format-inline='color']").forEach((button) => button.classList.toggle("is-active", button.dataset.formatValue === activeColorValue));
  $$("[data-format-inline='highlight']").forEach((button) => button.classList.toggle("is-active", button.dataset.formatValue === activeFillValue));
  setToolbarCurrent("style", BLOCK_STYLE_MAP[activeBlockValue]?.label || "样式");
  setToolbarCurrent("color", TEXT_COLOR_LABELS[activeColorValue] || "文字颜色");
  setToolbarCurrent("fill", FILL_COLOR_LABELS[activeFillValue] || "背景颜色");
  $$("[data-toolbar-menu-trigger]").forEach((trigger) => {
    const kind = trigger.dataset.toolbarMenuTrigger;
    trigger.classList.toggle("is-active", (kind === "style" && activeBlockValue !== "medium") || (kind === "color" && Boolean(activeColorNode)) || (kind === "fill" && Boolean(activeHighlightNode)));
  });
}

function syncVisualEditorFromRaw(lang = state.currentGuideLang) {
  const raw = $(`[data-raw-editor="${lang}"]`);
  const visual = $(`[data-visual-editor="${lang}"]`);
  if (!raw || !visual) return;
  visual.innerHTML = raw.value ? markdownToHtml(raw.value) : "";
  upgradeEditorMediaNodes(visual);
  resetEditorHistory(lang);
}

function syncVisualEditorsFromRaw() {
  ["en", "cn"].forEach(syncVisualEditorFromRaw);
}

function syncRawFromVisualEditor(lang = state.currentGuideLang) {
  const raw = $(`[data-raw-editor="${lang}"]`);
  const visual = $(`[data-visual-editor="${lang}"]`);
  if (lang === "journey") {
    if (!visual) return;
    upgradeEditorMediaNodes(visual);
    const days = readItineraryDays();
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayListTitles(days);
    renderItineraryPreview(days);
    updateDayWordCount();
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  if (lang === "short") {
    if (!visual) return;
    upgradeEditorMediaNodes(visual);
    const details = readShortDetails();
    $("[name='shortDetails']").value = JSON.stringify(details);
    updateShortWordCount();
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  if (lang === "details") {
    if (!visual) return;
    upgradeEditorMediaNodes(visual);
    syncActiveDetailEditorToFields();
    updateDetailWordCount();
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  if (!raw || !visual) return;
  upgradeEditorMediaNodes(visual);
  raw.value = htmlToPlainDraft(editorHtmlForSave(visual));
  autoSizeEditor(raw);
  updateWordCount(raw);
}

function editorHtmlForSave(visual) {
  if (!visual) return "";
  const clone = visual.cloneNode(true);
  clone.querySelectorAll("[data-media-resize-handle]").forEach((node) => node.remove());
  clone.querySelectorAll(".cms-media-slot.is-empty").forEach((node) => node.remove());
  clone.querySelectorAll("[data-editor-media].is-selected").forEach((node) => node.classList.remove("is-selected"));
  return clone.innerHTML;
}

function syncRawFromVisualEditors() {
  ["en", "cn"].forEach(syncRawFromVisualEditor);
}

function getEditorHistory(lang = state.currentGuideLang) {
  if (!state.editorHistory[lang]) state.editorHistory[lang] = { undo: [], redo: [], last: "" };
  return state.editorHistory[lang];
}

function resetEditorHistory(lang = state.currentGuideLang) {
  const visual = $(`[data-visual-editor="${lang}"]`);
  const history = getEditorHistory(lang);
  history.undo = [];
  history.redo = [];
  history.last = visual?.innerHTML || "";
}

function pushEditorHistory(lang, beforeHtml, afterHtml) {
  const history = getEditorHistory(lang);
  if (beforeHtml === afterHtml) return;
  if (history.undo[history.undo.length - 1] !== beforeHtml) history.undo.push(beforeHtml);
  if (history.undo.length > 80) history.undo.shift();
  history.redo = [];
  history.last = afterHtml;
}

function markVisualEditorChanged(lang = state.currentGuideLang) {
  syncRawFromVisualEditor(lang);
  if (lang === "journey") {
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  if (lang === "short") {
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  if (lang === "details") {
    $("[data-experience-save-status]").textContent = "未保存";
    return;
  }
  renderGuidePreview();
  renderGuideWorkflowStatus(syncGuideFromForm());
  setUnsaved(true);
}

function recordVisualInputHistory(lang = state.currentGuideLang) {
  const visual = $(`[data-visual-editor="${lang}"]`);
  if (!visual) return;
  const history = getEditorHistory(lang);
  const current = visual.innerHTML;
  if (history.last === current) return;
  const before = history.pendingBefore ?? history.last;
  delete history.pendingBefore;
  pushEditorHistory(lang, before, current);
}

function scheduleVisualHistoryRecord(lang = state.currentGuideLang) {
  window.clearTimeout(state.editorHistoryTimer);
  state.editorHistoryTimer = window.setTimeout(() => {
    recordVisualInputHistory(lang);
  }, 260);
}

function applyEditorHistory(command) {
  const visual = getActiveVisualEditor();
  if (!visual) return;
  const lang = visual.dataset.visualEditor || state.currentGuideLang;
  const history = getEditorHistory(lang);
  const current = visual.innerHTML;
  if (command === "undo") {
    const previous = history.undo.pop();
    if (previous == null) {
      showToast("没有可撤回的内容");
      return;
    }
    history.redo.push(current);
    visual.innerHTML = previous;
    history.last = previous;
    showToast("已撤回");
  }
  if (command === "redo") {
    const next = history.redo.pop();
    if (next == null) {
      showToast("没有可恢复的内容");
      return;
    }
    history.undo.push(current);
    visual.innerHTML = next;
    history.last = next;
    showToast("已恢复");
  }
  visual.focus();
  markVisualEditorChanged(lang);
}

function getSelectedEditorText(editor = getActiveRawEditor()) {
  const visual = getActiveVisualEditor();
  const selection = window.getSelection();
  if (visual && selection && selection.rangeCount && visual.contains(selection.anchorNode)) return selection.toString();
  if (!editor) return "";
  return editor.value.slice(editor.selectionStart || 0, editor.selectionEnd || 0);
}

function replaceSelectedEditorText(editor, text) {
  if (!editor) return;
  const start = editor.selectionStart || 0;
  const end = editor.selectionEnd || 0;
  editor.value = `${editor.value.slice(0, start)}${text}${editor.value.slice(end)}`;
  editor.selectionStart = start;
  editor.selectionEnd = start + text.length;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
}

function replaceSelectedVisualText(text) {
  const visual = getActiveVisualEditor();
  if (!visual) return false;
  const beforeHtml = visual.innerHTML;
  const selection = window.getSelection();
  let range = null;
  if (selection?.rangeCount && visual.contains(selection.anchorNode)) {
    range = selection.getRangeAt(0);
  } else if (state.lastVisualSelection?.range && state.lastVisualSelection.lang === visual.dataset.visualEditor) {
    range = state.lastVisualSelection.range.cloneRange();
  }
  if (!range || !visual.contains(range.commonAncestorContainer)) return false;
  const fragment = document.createDocumentFragment();
  String(text || "")
    .split(/\n{2,}/)
    .forEach((chunk) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = chunk.trim();
      fragment.appendChild(paragraph);
    });
  range.deleteContents();
  range.insertNode(fragment);
  visual.focus();
  pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
  rememberVisualSelection();
  return true;
}

function updateSelectionAiToolbar() {
  const toolbar = $("[data-selection-ai-toolbar]");
  const selected = getSelectedEditorText(getActiveRawEditor()).trim();
  if (!toolbar) return;
  toolbar.classList.toggle("is-hidden", !selected);
}

function runSelectionAiAction(action) {
  const editor = getActiveRawEditor();
  const selected = getSelectedEditorText(editor);
  const visual = getActiveVisualEditor();
  if ((!editor && !visual) || !selected.trim()) {
    showToast("请先选中一段文字");
    return;
  }
  const clean = selected.trim();
  const sentence = clean.replace(/\s+/g, " ");
  const transforms = {
    improve: clean.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n"),
    shorten: sentence.length > 160 ? `${sentence.slice(0, 154).trim()}...` : sentence,
    expand: `${clean}\n\n补充说明：这里可以加入更具体的场景、注意事项或游客常见问题。`,
    translate: state.currentGuideLang === "cn" ? `English draft: ${sentence}` : `中文翻译草稿：${sentence}`,
    faq: `## FAQ 常见问题\n\nQ: ${sentence.replace(/[。.!?？]+$/g, "")}？\n\nA: ${clean}\n`,
    extract: clean.split(/\n+/).filter(Boolean).slice(0, 4).map((line) => `- ${line.replace(/^[-*]\s*/, "").trim()}`).join("\n")
  };
  if (document.activeElement?.matches?.("[data-visual-editor]") || state.lastVisualSelection?.lang === state.currentGuideLang) {
    replaceSelectedVisualText(transforms[action] || clean);
  } else {
    replaceSelectedEditorText(editor, transforms[action] || clean);
  }
  updateSelectionAiToolbar();
  renderGuidePreview();
  renderGuideWorkflowStatus(syncGuideFromForm());
  setUnsaved(true);
  showToast({
    improve: "选区表达已优化",
    shorten: "选区已缩短",
    expand: "选区已扩写",
    translate: "已生成翻译草稿",
    faq: "选区已转成 FAQ",
    extract: "已提取重点"
  }[action] || "选区已更新");
}

function insertHtmlAtCursor(html) {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang;
  restoreVisualSelection(lang);
  document.execCommand("insertHTML", false, html);
  rememberVisualSelection();
}

function looksLikeMarkdownContent(text = "") {
  return /(^|\n)\s{0,3}#{1,3}\s+\S/.test(text)
    || /(^|\n)\s*[-*]\s+\S/.test(text)
    || /!\[[^\]]*]\([^)]+\)/.test(text)
    || /(^|\n)(Tip|Warning|Recommend|Budget|Time|Route|FAQ):\s+/i.test(text)
    || /(^|\n)>\s+\S/.test(text);
}

function pasteIntoVisualEditor(event) {
  const visual = event.target.closest("[data-visual-editor]");
  if (!visual) return;
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!text.trim() || !looksLikeMarkdownContent(text)) return;
  event.preventDefault();
  const lang = visual.dataset.visualEditor || state.currentGuideLang;
  const beforeHtml = visual.innerHTML;
  visual.focus();
  document.execCommand("insertHTML", false, markdownToHtml(text));
  pushEditorHistory(lang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(lang);
  rememberVisualSelection();
  showToast("已自动识别 Markdown 格式");
}

function closeToolbarMenus() {
  $$(".toolbar-menu.is-open").forEach((menu) => {
    menu.classList.remove("is-open");
    menu.querySelector("[data-toolbar-menu-panel]")?.setAttribute("hidden", "");
  });
}

function insertHtmlIntoVisualAtSelection(html, lang = state.lastVisualSelection?.lang || state.currentGuideLang) {
  const visual = restoreVisualSelection(lang);
  if (!visual) return false;
  const beforeHtml = visual.innerHTML;
  visual.focus({ preventScroll: true });
  document.execCommand("insertHTML", false, html);
  pushEditorHistory(lang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(lang);
  rememberVisualSelection();
  return true;
}

function normalizeMediaUrl(url = "") {
  return `/${String(url || "").replace(/^\/+/, "")}`;
}

function mediaFigureHtml(item, kind = "image") {
  const url = normalizeMediaUrl(item.url || "");
  const rawLabel = item.alt || item.filename || "";
  const label = escapeHtml(rawLabel || (kind === "audio" ? "音频说明" : kind === "video" ? "" : "图片说明"));
  const legacyClass = kind === "audio" ? " cms-audio" : kind === "video" ? " cms-video" : "";
  const base = `class="cms-media cms-editor-media cms-media-${escapeHtml(kind)}${legacyClass}" data-editor-media data-media-kind="${escapeHtml(kind)}" data-media-width="100" data-media-width-unit="percent" data-media-height="auto" data-media-ratio="auto" data-media-align="center" data-media-radius="18" data-media-shadow="none" data-media-spacing="24" data-media-max-width="none" data-video-ratio="16 / 9" style="--media-width:100%;--media-height:auto;--media-align:center;--media-radius:18px;--media-spacing:24px;--video-ratio:16 / 9;width:100%" contenteditable="false"`;
  if (kind === "audio") {
    return `<figure ${base}><figcaption>${label}</figcaption><audio controls src="${escapeHtml(url)}"></audio></figure><p><br></p>`;
  }
  if (kind === "video") {
    return `<figure ${base}><video controls playsinline preload="metadata" src="${escapeHtml(url)}"></video>${label && !isDefaultMediaFilenameCaption(rawLabel) ? `<figcaption>${label}</figcaption>` : ""}</figure><p><br></p>`;
  }
  return `<figure ${base}><img src="${escapeHtml(url)}" alt="${label}"></figure><p><br></p>`;
}

function mediaKindFromElement(element) {
  if (!element) return "image";
  if (element.matches?.("audio") || element.querySelector?.("audio")) return "audio";
  if (element.matches?.("video") || element.querySelector?.("video")) return "video";
  const img = element.matches?.("img") ? element : element.querySelector?.("img");
  const src = img?.getAttribute("src") || "";
  return src.toLowerCase().includes(".gif") ? "gif" : "image";
}

function mediaCaptionFromElement(element, kind = "image") {
  const img = element.matches?.("img") ? element : element.querySelector?.("img");
  const source = img || element.querySelector?.("video,audio") || element;
  const src = source?.getAttribute?.("src") || "";
  const filename = src.split("/").pop()?.replace(/\?.*$/, "") || "";
  return img?.getAttribute("alt") || filename || (kind === "audio" ? "音频说明" : kind === "video" ? "视频说明" : "图片说明");
}

function isDefaultMediaFilenameCaption(value = "") {
  const text = String(value || "").trim();
  return !text || text === "视频说明" || /\.(png|jpe?g|gif|webp|mp4|mov|webm|mp3|wav|m4a)$/i.test(text) || /^ChatGPT Image\b/i.test(text) || /^IMG[_-]?\d+/i.test(text) || /^WechatIMG/i.test(text) || /^hailuo[_-]?\d+/i.test(text);
}

function mediaLayoutCount(layoutId = "single") {
  return mediaLayoutTemplates.find((layout) => layout.id === layoutId)?.count || 1;
}

function mediaSlotButton(index) {
  return `<button type="button" class="cms-media-slot is-empty" data-editor-media-slot="${index}">+ 添加图片</button>`;
}

function ensureMediaLayoutSlots(figure) {
  const layout = figure?.dataset?.mediaLayout || "single";
  if (!figure || layout === "single") return;
  let grid = figure.querySelector(".cms-media-layout-grid");
  if (!grid) {
    const images = [...figure.querySelectorAll(":scope > img")];
    if (!images.length) return;
    grid = document.createElement("div");
    grid.className = "cms-media-layout-grid";
    images.forEach((image, index) => {
      const slot = document.createElement("div");
      slot.className = "cms-media-slot";
      slot.dataset.editorMediaSlot = String(index);
      slot.appendChild(image);
      grid.appendChild(slot);
    });
    figure.insertBefore(grid, figure.querySelector("figcaption"));
  }
  const wanted = mediaLayoutCount(layout);
  const slots = [...grid.querySelectorAll(".cms-media-slot")];
  for (let index = slots.length; index < wanted; index += 1) {
    grid.insertAdjacentHTML("beforeend", mediaSlotButton(index));
  }
}

function applyMediaFigureDefaults(figure, kind = mediaKindFromElement(figure)) {
  if (!figure) return null;
  figure.classList.add("cms-media", "cms-editor-media", `cms-media-${kind}`);
  figure.classList.toggle("cms-audio", kind === "audio");
  figure.classList.toggle("cms-video", kind === "video");
  figure.dataset.editorMedia = "";
  figure.dataset.mediaKind = kind;
  if (!figure.dataset.mediaWidth) figure.dataset.mediaWidth = "100";
  if (!figure.dataset.mediaWidthUnit) figure.dataset.mediaWidthUnit = "percent";
  if (!figure.dataset.mediaHeight) figure.dataset.mediaHeight = "auto";
  if (!figure.dataset.mediaRatio) figure.dataset.mediaRatio = "auto";
  if (!figure.dataset.mediaAlign) figure.dataset.mediaAlign = "center";
  if (!figure.dataset.mediaObjectPosition) figure.dataset.mediaObjectPosition = "center center";
  if (!figure.dataset.mediaFit) figure.dataset.mediaFit = "cover";
  if (kind === "video" && !figure.dataset.videoRatio) figure.dataset.videoRatio = "16 / 9";
  if (!figure.dataset.mediaRadius) figure.dataset.mediaRadius = "18";
  if (!figure.dataset.mediaShadow) figure.dataset.mediaShadow = "none";
  if (!figure.dataset.mediaSpacing) figure.dataset.mediaSpacing = "24";
  if (!figure.dataset.mediaMaxWidth) figure.dataset.mediaMaxWidth = "none";
  const width = Number(figure.dataset.mediaWidth) || 100;
  const widthUnit = figure.dataset.mediaWidthUnit === "px" ? "px" : "percent";
  const radius = Number(figure.dataset.mediaRadius);
  const spacing = Number(figure.dataset.mediaSpacing);
  const widthValue = widthUnit === "px" ? `${width}px` : `${width}%`;
  figure.style.setProperty("--media-width", widthValue);
  figure.style.width = widthValue;
  figure.style.setProperty("--media-height", figure.dataset.mediaHeight === "auto" ? "auto" : `${Number(figure.dataset.mediaHeight) || 320}px`);
  if (figure.dataset.mediaRatio && figure.dataset.mediaRatio !== "auto") {
    figure.style.setProperty("--media-ratio", figure.dataset.mediaRatio);
  } else {
    figure.style.removeProperty("--media-ratio");
  }
  figure.style.setProperty("--media-align", figure.dataset.mediaAlign);
  figure.style.setProperty("--media-object-position", figure.dataset.mediaObjectPosition || "center center");
  figure.style.setProperty("--media-fit", figure.dataset.mediaFit || "cover");
  if (kind === "video") figure.style.setProperty("--video-ratio", figure.dataset.videoRatio || "16 / 9");
  figure.style.setProperty("--media-radius", `${Number.isFinite(radius) ? radius : 18}px`);
  figure.style.setProperty("--media-spacing", `${Number.isFinite(spacing) ? spacing : 24}px`);
  figure.style.maxWidth = figure.dataset.mediaMaxWidth && figure.dataset.mediaMaxWidth !== "none" ? `${figure.dataset.mediaMaxWidth}px` : "";
  figure.setAttribute("contenteditable", "false");
  const existingCaption = figure.querySelector("figcaption");
  if ((kind === "image" || kind === "gif" || kind === "video") && existingCaption && isDefaultMediaFilenameCaption(existingCaption.textContent)) {
    existingCaption.remove();
  } else if (!existingCaption && kind !== "image" && kind !== "gif") {
    if (kind !== "video") {
      const caption = document.createElement("figcaption");
      caption.textContent = mediaCaptionFromElement(figure, kind);
      figure.appendChild(caption);
    }
  }
  ensureMediaLayoutSlots(figure);
  if (kind === "video") {
    const video = figure.querySelector("video");
    if (video) {
      video.setAttribute("playsinline", "");
      if (figure.dataset.videoPoster) video.setAttribute("poster", figure.dataset.videoPoster);
      if (!video.hasAttribute("controls") && !video.hasAttribute("autoplay")) video.setAttribute("controls", "");
      if (video.hasAttribute("autoplay")) {
        video.muted = true;
        video.setAttribute("muted", "");
      }
    }
  }
  return figure;
}

function wrapLooseMediaNode(node) {
  if (!node?.parentNode || node.closest?.("[data-editor-media]")) return null;
  const kind = mediaKindFromElement(node);
  const figure = document.createElement("figure");
  node.parentNode.insertBefore(figure, node);
  figure.appendChild(node);
  if (kind !== "image" && kind !== "gif") {
    const caption = document.createElement("figcaption");
    caption.textContent = mediaCaptionFromElement(node, kind);
    figure.appendChild(caption);
  }
  return applyMediaFigureDefaults(figure, kind);
}

function upgradeEditorMediaNodes(scope = document) {
  if (!scope?.querySelectorAll) return;
  scope.querySelectorAll("figure").forEach((figure) => {
    if (figure.querySelector("img,video,audio")) applyMediaFigureDefaults(figure);
  });
  scope.querySelectorAll("img,video,audio").forEach((media) => {
    if (!media.closest("figure")) wrapLooseMediaNode(media);
  });
}

function captureMediaInsertionPoint(lang = state.currentGuideLang) {
  rememberVisualSelection();
  const range = state.lastVisualSelection?.lang === lang && state.lastVisualSelection.range
    ? state.lastVisualSelection.range.cloneRange()
    : null;
  state.pendingMediaSelection = { lang, range };
}

function restorePendingMediaSelection(lang = state.currentGuideLang) {
  const pending = state.pendingMediaSelection;
  if (pending?.range && pending.lang === lang) {
    state.lastVisualSelection = { lang, range: pending.range.cloneRange() };
  }
  return restoreVisualSelection(lang);
}

function setVisualSelectionFromPoint(visual, x, y) {
  if (!visual) return false;
  const selection = window.getSelection();
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (position) {
      range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
    }
  }
  if (!range || !visual.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(visual);
    range.collapse(false);
  }
  selection?.removeAllRanges();
  selection?.addRange(range);
  state.lastVisualSelection = { lang: visual.dataset.visualEditor || state.currentGuideLang, range: range.cloneRange() };
  return true;
}

function selectedMediaFigureFromNode(node) {
  const element = node?.nodeType === 1 ? node : node?.parentElement;
  if (!element) return null;
  const existing = element.closest?.("[data-editor-media]");
  if (existing) return applyMediaFigureDefaults(existing);
  const looseFigure = element.closest?.("figure");
  if (looseFigure?.querySelector?.("img,video,audio")) return applyMediaFigureDefaults(looseFigure);
  if (element.matches?.("img,video,audio")) return wrapLooseMediaNode(element);
  return null;
}

function ensureMediaResizeHandles(figure) {
  if (!figure?.closest?.("[data-visual-editor]")) return;
  if (figure.querySelector("[data-media-resize-handle]")) return;
  ["nw", "ne", "sw", "se"].forEach((corner) => {
    const handle = document.createElement("span");
    handle.className = `media-resize-handle media-resize-${corner}`;
    handle.dataset.mediaResizeHandle = corner;
    handle.setAttribute("contenteditable", "false");
    figure.appendChild(handle);
  });
}

function startMediaResize(event, handle) {
  const figure = handle.closest("[data-editor-media]");
  const visual = figure?.closest?.("[data-visual-editor]");
  if (!figure || !visual) return;
  event.preventDefault();
  event.stopPropagation();
  selectMediaFigure(figure);
  const figureRect = figure.getBoundingClientRect();
  const visualRect = visual.getBoundingClientRect();
  state.mediaResizeDrag = {
    figure,
    visual,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: figureRect.width,
    startHeight: figureRect.height,
    visualWidth: visualRect.width,
    beforeHtml: visual.innerHTML,
    handle: handle.dataset.mediaResizeHandle || "se"
  };
  document.body.classList.add("is-resizing-media");
}

function moveMediaResize(event) {
  const drag = state.mediaResizeDrag;
  if (!drag?.figure?.isConnected) return;
  const direction = drag.handle.includes("w") ? -1 : 1;
  const verticalDirection = drag.handle.includes("n") ? -1 : 1;
  const delta = (event.clientX - drag.startX) * direction;
  const deltaY = (event.clientY - drag.startY) * verticalDirection;
  const nextPx = Math.max(120, Math.min(drag.visualWidth, drag.startWidth + delta));
  if (drag.figure.dataset.mediaLockRatio === "false") {
    const nextHeight = Math.max(120, Math.min(900, drag.startHeight + deltaY));
    updateMediaFigureStyle(drag.figure, { width: Math.round(nextPx), widthUnit: "px", height: Math.round(nextHeight) });
  } else {
    const nextPercent = Math.max(25, Math.min(100, Math.round((nextPx / drag.visualWidth) * 100)));
    updateMediaFigureStyle(drag.figure, { width: nextPercent, widthUnit: "percent", height: "auto" });
  }
  positionMediaToolbar(drag.figure);
}

function endMediaResize() {
  const drag = state.mediaResizeDrag;
  if (!drag?.figure?.isConnected) return;
  const visual = drag.visual;
  const figure = drag.figure;
  state.mediaResizeDrag = null;
  document.body.classList.remove("is-resizing-media");
  pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, drag.beforeHtml, visual.innerHTML);
  syncMediaFigureChange(figure, "媒体尺寸已更新", { toast: true });
}

function mediaObjectPositionToPoint(value = "center center") {
  const parts = String(value || "center center").trim().split(/\s+/);
  const convert = (part, axis) => {
    if (!part || part === "center") return 50;
    if (part === "left" || part === "top") return 0;
    if (part === "right" || part === "bottom") return 100;
    if (/%$/.test(part)) return Number(part.replace("%", "")) || 50;
    return axis === "x" ? 50 : 50;
  };
  return {
    x: convert(parts[0], "x"),
    y: convert(parts[1], "y")
  };
}

function startMediaCropDrag(event, image) {
  const figure = image?.closest?.("[data-editor-media]");
  const visual = figure?.closest?.("[data-visual-editor]");
  if (!figure || !visual) return;
  event.preventDefault();
  event.stopPropagation();
  const slot = image.closest(".cms-media-slot:not(.is-empty)");
  if (slot) selectMediaSlot(slot);
  else selectMediaFigure(figure);
  const target = currentMediaCropTarget(figure);
  const point = mediaObjectPositionToPoint(mediaCropValue(figure, "mediaObjectPosition", "center center"));
  state.mediaCropDrag = {
    figure,
    target,
    visual,
    startX: event.clientX,
    startY: event.clientY,
    startPointX: point.x,
    startPointY: point.y,
    rect: image.getBoundingClientRect(),
    beforeHtml: visual.innerHTML
  };
  document.body.classList.add("is-cropping-media");
}

function moveMediaCropDrag(event) {
  const drag = state.mediaCropDrag;
  if (!drag?.figure?.isConnected || !drag?.target?.isConnected) return;
  const deltaX = event.clientX - drag.startX;
  const deltaY = event.clientY - drag.startY;
  const nextX = Math.max(0, Math.min(100, Math.round(drag.startPointX - (deltaX / Math.max(1, drag.rect.width)) * 100)));
  const nextY = Math.max(0, Math.min(100, Math.round(drag.startPointY - (deltaY / Math.max(1, drag.rect.height)) * 100)));
  updateMediaCropTargetStyle(drag.figure, { objectPosition: `${nextX}% ${nextY}%` });
  positionMediaToolbar(drag.figure);
}

function endMediaCropDrag() {
  const drag = state.mediaCropDrag;
  if (!drag?.figure?.isConnected) return;
  state.mediaCropDrag = null;
  document.body.classList.remove("is-cropping-media");
  pushEditorHistory(drag.visual.dataset.visualEditor || state.currentGuideLang, drag.beforeHtml, drag.visual.innerHTML);
  syncMediaFigureChange(drag.figure, "裁剪焦点已更新", { toast: true });
}

function clearSelectedMedia() {
  document.querySelectorAll("[data-editor-media].is-selected").forEach((item) => item.classList.remove("is-selected"));
  document.querySelectorAll(".cms-media-slot.is-slot-selected").forEach((item) => item.classList.remove("is-slot-selected"));
  state.selectedMediaFigure = null;
  state.selectedMediaSlot = null;
  hideMediaToolbar();
}

function ensureMediaToolbar() {
  let toolbar = document.querySelector("[data-media-edit-toolbar]");
  if (toolbar) return toolbar;
  toolbar = document.createElement("div");
  toolbar.className = "media-edit-toolbar is-hidden";
  toolbar.dataset.mediaEditToolbar = "";
  toolbar.innerHTML = `
    <div class="media-edit-toolbar-main">
      <button type="button" data-editor-media-action="replace">替换</button>
      <span>对齐</span>
      <button type="button" data-editor-media-action="align-left">左</button>
      <button type="button" data-editor-media-action="align-center">中</button>
      <button type="button" data-editor-media-action="align-right">右</button>
      <span>比例</span>
      <button type="button" data-editor-media-action="set-ratio" data-media-ratio-id="wide">16:9</button>
      <button type="button" data-editor-media-action="set-ratio" data-media-ratio-id="standard">4:3</button>
      <button type="button" data-editor-media-action="set-ratio" data-media-ratio-id="square">1:1</button>
      <button type="button" data-editor-media-action="set-ratio" data-media-ratio-id="mobile">9:16</button>
      <button type="button" data-editor-media-action="toggle-style-panel">样式 ⋯</button>
      <button type="button" data-editor-media-action="delete">删除</button>
    </div>
  `;
  document.body.appendChild(toolbar);
  return toolbar;
}

function ensureMediaStylePanel() {
  let panel = document.querySelector("[data-media-style-panel]");
  if (panel) return panel;
  panel = document.createElement("aside");
  panel.className = "media-style-panel is-hidden";
  panel.dataset.mediaStylePanel = "";
  panel.innerHTML = `
      <div class="media-style-head">
        <div>
          <strong>图片样式</strong>
          <span>尺寸、样式、布局和 SEO 信息</span>
          <em data-media-scope-label>当前编辑：整组</em>
        </div>
        <button type="button" data-editor-media-action="close-style-panel">×</button>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">尺寸</span>
        <span class="media-control-label">比例模板</span>
        <div class="media-segment-group" data-media-ratio-options>
          ${mediaRatioTemplates.map((item) => `<button type="button" data-editor-media-action="set-ratio" data-media-ratio-id="${item.id}">${item.label}</button>`).join("")}
        </div>
        <label class="media-width-row">
          <span>宽度 <b data-media-width-label>100%</b></span>
          <input type="range" min="25" max="100" step="1" data-editor-media-control="width">
        </label>
        <label class="media-width-row">
          <span>高度 <b data-media-height-label>Auto</b></span>
          <input type="range" min="120" max="900" step="10" data-editor-media-control="height">
        </label>
        <button class="media-setting-row" type="button" data-editor-media-action="height-auto"><span>恢复原始高度</span><b>Auto</b></button>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">裁剪</span>
        <button class="media-setting-row" type="button" data-editor-media-action="recrop"><span>进入选区编辑</span><b>›</b></button>
        <button class="media-setting-row is-hidden" type="button" data-editor-media-action="finish-crop"><span>完成裁剪</span><b>✓</b></button>
        <span class="media-control-label">主体位置</span>
        <div class="media-segment-group" data-media-object-position-options>
          ${[
            ["center center", "居中"],
            ["center top", "上"],
            ["center bottom", "下"],
            ["left center", "左"],
            ["right center", "右"]
          ].map(([value, label]) => `<button type="button" data-editor-media-action="set-object-position" data-media-value="${value}">${label}</button>`).join("")}
        </div>
        <span class="media-control-label">适应方式</span>
        <div class="media-segment-group" data-media-fit-options>
          ${[
            ["cover", "填充裁剪"],
            ["contain", "完整显示"]
          ].map(([value, label]) => `<button type="button" data-editor-media-action="set-fit" data-media-value="${value}">${label}</button>`).join("")}
        </div>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">样式</span>
        <span class="media-control-label">圆角</span>
        <div class="media-segment-group" data-media-radius-options>
          ${[0, 8, 12, 18, 24].map((value) => `<button type="button" data-editor-media-action="set-radius" data-media-value="${value}">${value}</button>`).join("")}
        </div>
        <span class="media-control-label">阴影</span>
        <div class="media-segment-group" data-media-shadow-options>
          ${[
            ["none", "无阴影"],
            ["soft", "轻"],
            ["medium", "中"]
          ].map(([value, label]) => `<button type="button" data-editor-media-action="set-shadow" data-media-value="${value}">${label}</button>`).join("")}
        </div>
        <span class="media-control-label">上下间距</span>
        <div class="media-segment-group" data-media-spacing-options>
          ${[8, 16, 24, 32].map((value) => `<button type="button" data-editor-media-action="set-spacing" data-media-value="${value}">${value}px</button>`).join("")}
        </div>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">布局</span>
        <div class="media-layout-list" data-media-layout-options></div>
      </div>
      <div class="media-panel-section" data-video-panel-section>
        <span class="media-panel-title">视频</span>
        <span class="media-control-label">播放器比例</span>
        <div class="media-segment-group" data-video-ratio-options>
          ${[
            ["16 / 9", "16:9"],
            ["4 / 3", "4:3"],
            ["1 / 1", "1:1"],
            ["9 / 16", "9:16"]
          ].map(([value, label]) => `<button type="button" data-editor-media-action="set-video-ratio" data-media-value="${value}">${label}</button>`).join("")}
        </div>
        <button class="media-setting-row" type="button" data-editor-media-action="upload-video-poster"><span>上传视频封面</span><b>›</b></button>
        <button class="media-setting-row" type="button" data-editor-media-action="clear-video-poster"><span>清除视频封面</span><b>×</b></button>
        <span class="media-control-label">播放行为</span>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="videoControls" checked>
          <span>显示控制栏</span>
        </label>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="videoAutoplay">
          <span>自动播放</span>
        </label>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="videoMuted">
          <span>静音播放</span>
        </label>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="videoLoop">
          <span>循环播放</span>
        </label>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">模板</span>
        <div class="media-template-list" data-media-official-templates></div>
        <div class="media-template-list" data-media-custom-templates></div>
        <div class="media-template-actions">
          <button type="button" data-editor-media-action="copy-style">复制样式</button>
          <button type="button" data-editor-media-action="paste-style">粘贴样式</button>
          <button type="button" data-editor-media-action="save-style-template">保存模板</button>
        </div>
      </div>
      <div class="media-panel-section">
        <span class="media-panel-title">SEO / 高级</span>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="lockRatio" checked>
          <span>锁定比例</span>
        </label>
        <label class="media-switch">
          <input type="checkbox" data-editor-media-control="enlarge">
          <span>前台点击放大</span>
        </label>
        <button class="media-setting-row" type="button" data-editor-media-action="link"><span>图片链接</span><b>›</b></button>
        <button class="media-setting-row" type="button" data-editor-media-action="caption"><span>说明 Caption</span><b>›</b></button>
        <button class="media-setting-row" type="button" data-editor-media-action="alt"><span>Alt 文本</span><b>›</b></button>
      </div>
  `;
  document.body.appendChild(panel);
  renderMediaTemplateLists(panel);
  return panel;
}

function customMediaStyleTemplates() {
  try {
    return JSON.parse(localStorage.getItem("chinamigo_media_style_templates") || "[]");
  } catch {
    return [];
  }
}

function saveCustomMediaStyleTemplates(templates) {
  localStorage.setItem("chinamigo_media_style_templates", JSON.stringify(templates.slice(0, 18)));
}

function renderMediaTemplateLists(panel = ensureMediaStylePanel()) {
  const official = panel.querySelector("[data-media-official-templates]");
  const custom = panel.querySelector("[data-media-custom-templates]");
  const layouts = panel.querySelector("[data-media-layout-options]");
  if (official) {
    official.innerHTML = mediaStyleTemplates.map((template) => (
      `<button type="button" data-editor-media-action="apply-template" data-media-template-id="${escapeHtml(template.id)}">${escapeHtml(template.label)}</button>`
    )).join("");
  }
  const customTemplates = customMediaStyleTemplates();
  if (custom) {
    custom.innerHTML = customTemplates.length
      ? customTemplates.map((template) => `<button type="button" data-editor-media-action="apply-custom-template" data-media-template-id="${escapeHtml(template.id)}">${escapeHtml(template.label)}</button>`).join("")
      : `<em>还没有自定义模板</em>`;
  }
  if (layouts) {
    layouts.innerHTML = mediaLayoutTemplates.map((layout) => (
      `<button type="button" data-editor-media-action="apply-layout" data-media-layout-id="${escapeHtml(layout.id)}">${escapeHtml(layout.label)}</button>`
    )).join("");
  }
}

function readMediaStyle(figure) {
  return {
    width: Number(figure.dataset.mediaWidth) || 100,
    widthUnit: figure.dataset.mediaWidthUnit || "percent",
    height: figure.dataset.mediaHeight || "auto",
    ratio: figure.dataset.mediaRatio || "auto",
    align: figure.dataset.mediaAlign || "center",
    objectPosition: figure.dataset.mediaObjectPosition || "center center",
    fit: figure.dataset.mediaFit || "cover",
    radius: Number(figure.dataset.mediaRadius) || 0,
    shadow: figure.dataset.mediaShadow || "none",
    spacing: Number(figure.dataset.mediaSpacing) || 24,
    maxWidth: figure.dataset.mediaMaxWidth || "none",
    enlarge: figure.dataset.mediaEnlarge === "true",
    link: figure.dataset.mediaLink || "",
    lockRatio: figure.dataset.mediaLockRatio !== "false"
  };
}

function applyMediaStyleTemplate(figure, template = {}) {
  updateMediaFigureStyle(figure, {
    width: template.width ?? 100,
    widthUnit: template.widthUnit || "percent",
    height: template.height ?? "auto",
    ratio: template.ratio || "auto",
    align: template.align || "center",
    objectPosition: template.objectPosition || "center center",
    fit: template.fit || "cover",
    radius: template.radius ?? 18,
    shadow: template.shadow || "none",
    spacing: template.spacing ?? 24,
    maxWidth: template.maxWidth || "none",
    enlarge: Boolean(template.enlarge),
    link: template.link || "",
    lockRatio: template.lockRatio !== false
  });
}

function mediaRatioTemplateById(id = "free") {
  return mediaRatioTemplates.find((item) => item.id === id) || mediaRatioTemplates[0];
}

function mediaRatioTemplateId(figure) {
  const ratio = figure?.dataset?.mediaRatio || "auto";
  return mediaRatioTemplates.find((item) => item.ratio === ratio)?.id || "free";
}

function applyMediaRatioTemplate(figure, id = "free") {
  const template = mediaRatioTemplateById(id);
  const next = {
    ratio: template.ratio,
    height: template.height,
    fit: template.ratio === "auto" ? mediaCropValue(figure, "mediaFit", "cover") : "cover"
  };
  const video = figure?.querySelector?.("video");
  if (video && template.ratio !== "auto") next.videoRatio = template.ratio;
  updateMediaFigureStyle(figure, next);
}

function updateMediaToolbarControls(figure) {
  const toolbar = ensureMediaToolbar();
  const panel = ensureMediaStylePanel();
  const kind = figure.dataset.mediaKind || mediaKindFromElement(figure);
  const video = figure.querySelector("video");
  const width = Number(figure.dataset.mediaWidth) || 100;
  const widthUnit = figure.dataset.mediaWidthUnit || "percent";
  const radius = figure.dataset.mediaRadius || "18";
  const shadow = figure.dataset.mediaShadow || "none";
  const spacing = figure.dataset.mediaSpacing || "24";
  const objectPosition = mediaCropValue(figure, "mediaObjectPosition", "center center");
  const fit = mediaCropValue(figure, "mediaFit", "cover");
  const maxWidth = figure.dataset.mediaMaxWidth || "none";
  const height = figure.dataset.mediaHeight || "auto";
  const widthInput = panel.querySelector("[data-editor-media-control='width']");
  const heightInput = panel.querySelector("[data-editor-media-control='height']");
  const widthLabel = panel.querySelector("[data-media-width-label]");
  const heightLabel = panel.querySelector("[data-media-height-label]");
  const scopeLabel = panel.querySelector("[data-media-scope-label]");
  const headTitle = panel.querySelector(".media-style-head strong");
  const headSubtitle = panel.querySelector(".media-style-head span");
  const radiusSelect = panel.querySelector("[data-editor-media-control='radius']");
  const shadowSelect = panel.querySelector("[data-editor-media-control='shadow']");
  const spacingSelect = panel.querySelector("[data-editor-media-control='spacing']");
  const maxWidthSelect = panel.querySelector("[data-editor-media-control='maxWidth']");
  const enlargeInput = panel.querySelector("[data-editor-media-control='enlarge']");
  const lockRatioInput = panel.querySelector("[data-editor-media-control='lockRatio']");
  const videoControlsInput = panel.querySelector("[data-editor-media-control='videoControls']");
  const videoAutoplayInput = panel.querySelector("[data-editor-media-control='videoAutoplay']");
  const videoMutedInput = panel.querySelector("[data-editor-media-control='videoMuted']");
  const videoLoopInput = panel.querySelector("[data-editor-media-control='videoLoop']");
  panel.classList.toggle("is-video-selected", kind === "video");
  if (headTitle) headTitle.textContent = kind === "video" ? "视频样式" : "图片样式";
  if (headSubtitle) headSubtitle.textContent = kind === "video" ? "尺寸、封面、播放和 SEO 信息" : "尺寸、样式、布局和 SEO 信息";
  if (widthInput) widthInput.value = String(widthUnit === "percent" ? width : 100);
  if (heightInput) heightInput.value = height !== "auto" ? String(height) : "320";
  if (widthLabel) widthLabel.textContent = widthUnit === "px" ? `${width}px` : `${width}%`;
  if (heightLabel) heightLabel.textContent = height !== "auto" ? `${height}px` : "Auto";
  if (scopeLabel) scopeLabel.textContent = kind === "video" ? "当前编辑：视频" : state.selectedMediaSlot?.isConnected ? "当前编辑：单张图片" : "当前编辑：整组";
  if (radiusSelect) radiusSelect.value = radius;
  if (shadowSelect) shadowSelect.value = shadow;
  if (spacingSelect) spacingSelect.value = spacing;
  if (maxWidthSelect) maxWidthSelect.value = maxWidth;
  if (enlargeInput) enlargeInput.checked = figure.dataset.mediaEnlarge === "true";
  if (lockRatioInput) lockRatioInput.checked = figure.dataset.mediaLockRatio !== "false";
  if (videoControlsInput) videoControlsInput.checked = !video || video.hasAttribute("controls");
  if (videoAutoplayInput) videoAutoplayInput.checked = !!video?.hasAttribute("autoplay");
  if (videoMutedInput) videoMutedInput.checked = !!video?.muted || !!video?.hasAttribute("muted");
  if (videoLoopInput) videoLoopInput.checked = !!video?.hasAttribute("loop");
  const currentTemplate = mediaStyleTemplates.find((template) => (
    Number(template.width) === width &&
    (template.widthUnit || "percent") === widthUnit &&
    String(template.height ?? "auto") === String(height) &&
    String(template.radius ?? 18) === String(radius) &&
    (template.shadow || "none") === shadow &&
    String(template.spacing ?? 24) === String(spacing) &&
    (template.maxWidth || "none") === maxWidth
  ));
  panel.querySelectorAll("[data-editor-media-action='apply-template']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaTemplateId === currentTemplate?.id);
  });
  panel.querySelectorAll("[data-editor-media-action='apply-layout']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaLayoutId === (figure.dataset.mediaLayout || "single"));
  });
  panel.querySelectorAll("[data-editor-media-action='set-radius']").forEach((button) => {
    button.classList.toggle("is-active", String(button.dataset.mediaValue) === String(radius));
  });
  panel.querySelectorAll("[data-editor-media-action='set-shadow']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaValue === shadow);
  });
  panel.querySelectorAll("[data-editor-media-action='set-spacing']").forEach((button) => {
    button.classList.toggle("is-active", String(button.dataset.mediaValue) === String(spacing));
  });
  panel.querySelectorAll("[data-editor-media-action='set-ratio']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaRatioId === mediaRatioTemplateId(figure));
  });
  panel.querySelectorAll("[data-editor-media-action='set-object-position']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaValue === objectPosition);
  });
  panel.querySelectorAll("[data-editor-media-action='set-fit']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaValue === fit);
  });
  panel.querySelectorAll("[data-editor-media-action='set-video-ratio']").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mediaValue === (figure.dataset.videoRatio || "16 / 9"));
  });
  panel.querySelector("[data-editor-media-action='finish-crop']")?.classList.toggle("is-hidden", !figure.classList.contains("is-crop-editing"));
}

function positionMediaToolbar(figure) {
  const toolbar = ensureMediaToolbar();
  if (!figure) {
    toolbar.classList.add("is-hidden");
    return;
  }
  const width = Number(figure.dataset.mediaWidth) || 100;
  const align = figure.dataset.mediaAlign || "center";
  updateMediaToolbarControls(figure);
  toolbar.querySelectorAll("[data-editor-media-action]").forEach((button) => {
    const action = button.dataset.editorMediaAction;
    const active = action === `align-${align}` ||
      (action === "set-ratio" && button.dataset.mediaRatioId === mediaRatioTemplateId(figure)) ||
      (action === "toggle-style-panel" && !ensureMediaStylePanel().classList.contains("is-hidden"));
    button.classList.toggle("is-active", active);
  });
  const rect = figure.getBoundingClientRect();
  const top = Math.max(78, rect.top + window.scrollY - 46);
  const left = Math.min(window.scrollX + window.innerWidth - toolbar.offsetWidth - 18, Math.max(18, rect.left + window.scrollX));
  toolbar.style.top = `${top}px`;
  toolbar.style.left = `${left}px`;
  toolbar.classList.remove("is-hidden");
}

function hideMediaToolbar() {
  document.querySelector("[data-media-edit-toolbar]")?.classList.add("is-hidden");
  document.querySelector("[data-media-style-panel]")?.classList.add("is-hidden");
}

function selectMediaFigure(figure) {
  if (!figure) return;
  applyMediaFigureDefaults(figure);
  document.querySelectorAll("[data-editor-media].is-selected").forEach((item) => item.classList.remove("is-selected"));
  document.querySelectorAll(".cms-media-slot.is-slot-selected").forEach((item) => item.classList.remove("is-slot-selected"));
  figure.classList.add("is-selected");
  state.selectedMediaFigure = figure;
  state.selectedMediaSlot = null;
  ensureMediaResizeHandles(figure);
  positionMediaToolbar(figure);
}

function selectMediaSlot(slot) {
  const figure = slot?.closest?.("[data-editor-media]");
  if (!figure) return;
  selectMediaFigure(figure);
  slot.classList.add("is-slot-selected");
  state.selectedMediaSlot = slot;
  updateMediaToolbarControls(figure);
}

function currentMediaCropTarget(figure = state.selectedMediaFigure) {
  return state.selectedMediaSlot?.isConnected && state.selectedMediaSlot.closest("[data-editor-media]") === figure
    ? state.selectedMediaSlot
    : figure;
}

function mediaCropValue(figure, key, fallback) {
  const target = currentMediaCropTarget(figure);
  return target?.dataset?.[key] || figure?.dataset?.[key] || fallback;
}

function updateMediaCropTargetStyle(figure, { objectPosition, fit } = {}) {
  const target = currentMediaCropTarget(figure);
  if (!target) return;
  if (objectPosition !== undefined) {
    const next = String(objectPosition || "center center").trim() || "center center";
    target.dataset.mediaObjectPosition = next;
    target.style.setProperty("--media-object-position", next);
  }
  if (fit !== undefined) {
    const next = fit === "contain" ? "contain" : "cover";
    target.dataset.mediaFit = next;
    target.style.setProperty("--media-fit", next);
  }
}

function updateMediaFigureStyle(figure, { width, widthUnit, height, ratio, align, objectPosition, fit, radius, shadow, spacing, enlarge, link, maxWidth, lockRatio, videoRatio, videoPoster, videoControls, videoAutoplay, videoMuted, videoLoop } = {}) {
  if (!figure) return;
  const video = figure.querySelector("video");
  if (width !== undefined && width !== null) {
    figure.dataset.mediaWidth = String(width);
    if (widthUnit) figure.dataset.mediaWidthUnit = widthUnit;
    const unit = figure.dataset.mediaWidthUnit === "px" ? "px" : "percent";
    const widthValue = unit === "px" ? `${width}px` : `${width}%`;
    figure.style.setProperty("--media-width", widthValue);
    figure.style.width = widthValue;
  }
  if (align) {
    figure.dataset.mediaAlign = align;
    figure.style.setProperty("--media-align", align);
  }
  if (objectPosition !== undefined) {
    const next = String(objectPosition || "center center").trim() || "center center";
    figure.dataset.mediaObjectPosition = next;
    figure.style.setProperty("--media-object-position", next);
  }
  if (fit !== undefined) {
    const next = fit === "contain" ? "contain" : "cover";
    figure.dataset.mediaFit = next;
    figure.style.setProperty("--media-fit", next);
  }
  if (height !== undefined) {
    const next = height === "auto" || height === "" ? "auto" : String(height);
    figure.dataset.mediaHeight = next;
    figure.style.setProperty("--media-height", next === "auto" ? "auto" : `${Number(next) || 320}px`);
  }
  if (ratio !== undefined) {
    const next = String(ratio || "auto").trim() || "auto";
    figure.dataset.mediaRatio = next;
    if (next === "auto") {
      figure.style.removeProperty("--media-ratio");
    } else {
      figure.style.setProperty("--media-ratio", next);
    }
  }
  if (videoRatio !== undefined) {
    const next = String(videoRatio || "16 / 9").trim() || "16 / 9";
    figure.dataset.videoRatio = next;
    figure.style.setProperty("--video-ratio", next);
  }
  if (radius !== undefined) {
    figure.dataset.mediaRadius = String(radius);
    figure.style.setProperty("--media-radius", `${radius}px`);
  }
  if (shadow !== undefined) {
    figure.dataset.mediaShadow = shadow || "none";
  }
  if (spacing !== undefined) {
    figure.dataset.mediaSpacing = String(spacing);
    figure.style.setProperty("--media-spacing", `${spacing}px`);
  }
  if (maxWidth !== undefined) {
    const next = String(maxWidth || "none");
    figure.dataset.mediaMaxWidth = next;
    figure.style.maxWidth = next !== "none" ? `${next}px` : "";
  }
  if (lockRatio !== undefined) {
    if (lockRatio) delete figure.dataset.mediaLockRatio;
    else figure.dataset.mediaLockRatio = "false";
  }
  if (enlarge !== undefined) {
    if (enlarge) figure.dataset.mediaEnlarge = "true";
    else delete figure.dataset.mediaEnlarge;
  }
  if (link !== undefined) {
    const next = String(link || "").trim();
    if (next) figure.dataset.mediaLink = next;
    else delete figure.dataset.mediaLink;
  }
  if (video) {
    if (videoPoster !== undefined) {
      const next = String(videoPoster || "").trim();
      if (next) {
        figure.dataset.videoPoster = next;
        video.setAttribute("poster", next);
      } else {
        delete figure.dataset.videoPoster;
        video.removeAttribute("poster");
      }
    }
    if (videoControls !== undefined) {
      if (videoControls) video.setAttribute("controls", "");
      else video.removeAttribute("controls");
    }
    if (videoAutoplay !== undefined) {
      if (videoAutoplay) video.setAttribute("autoplay", "");
      else video.removeAttribute("autoplay");
    }
    if (videoMuted !== undefined) {
      video.muted = Boolean(videoMuted);
      if (videoMuted) video.setAttribute("muted", "");
      else video.removeAttribute("muted");
    }
    if (videoLoop !== undefined) {
      if (videoLoop) video.setAttribute("loop", "");
      else video.removeAttribute("loop");
    }
    if (video.hasAttribute("autoplay")) {
      video.muted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
    }
  }
}

function syncMediaFigureChange(figure, message = "媒体已更新", { toast = true } = {}) {
  const visual = figure?.closest?.("[data-visual-editor]");
  if (!visual) return;
  markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
  positionMediaToolbar(figure);
  if (toast) showToast(message);
}

function commitMediaChange(figure, beforeHtml, message = "媒体已更新") {
  const visual = figure?.closest?.("[data-visual-editor]");
  if (!visual) return;
  const lang = visual.dataset.visualEditor || state.currentGuideLang;
  pushEditorHistory(lang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(lang);
  positionMediaToolbar(figure);
  showToast(message);
}

async function replaceSelectedMedia(figure) {
  const kind = figure?.dataset.mediaKind || "image";
  const accept = {
    image: "image/png,image/jpeg,image/webp",
    gif: "image/gif",
    audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4",
    video: "video/mp4,video/webm,video/ogg,video/quicktime"
  }[kind] || "image/png,image/jpeg,image/webp";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file || !figure) return;
    const visual = figure.closest("[data-visual-editor]");
    const beforeHtml = visual?.innerHTML || "";
    setStatus("正在替换媒体...");
    const media = await uploadAdminMedia(file, "guides", [kind]);
    const url = normalizeMediaUrl(media.url || "");
    const label = media.alt || media.filename || "";
    const img = figure.querySelector("img");
    const audio = figure.querySelector("audio");
    const video = figure.querySelector("video");
    if (img) {
      img.src = url;
      img.alt = label;
    }
    if (audio) audio.src = url;
    if (video) video.src = url;
    const caption = figure.querySelector("figcaption");
    if (caption && !caption.textContent.trim()) caption.textContent = label;
    commitMediaChange(figure, beforeHtml, "媒体已替换");
    setStatus("媒体已替换。");
  };
  input.click();
}

function mediaImagesFromFigure(figure) {
  return [...figure.querySelectorAll(".cms-media-layout-grid img, :scope > img")].map((img) => ({
    src: img.getAttribute("src") || "",
    alt: img.getAttribute("alt") || ""
  })).filter((item) => item.src);
}

function applyMediaLayout(figure, layoutId = "single") {
  if (!figure || !["image", "gif"].includes(figure.dataset.mediaKind || mediaKindFromElement(figure))) {
    showToast("图片布局仅支持图片和动图");
    return;
  }
  const layout = mediaLayoutTemplates.find((item) => item.id === layoutId) || mediaLayoutTemplates[0];
  const caption = figure.querySelector("figcaption")?.cloneNode(true);
  const images = mediaImagesFromFigure(figure);
  const first = images[0] || { src: "", alt: "" };
  figure.dataset.mediaLayout = layout.id;
  figure.classList.toggle("cms-media-layout", layout.id !== "single");
  if (layout.id === "single") {
    figure.innerHTML = `<img src="${escapeHtml(first.src)}" alt="${escapeHtml(first.alt)}">`;
    if (caption && caption.textContent.trim()) figure.appendChild(caption);
    applyMediaFigureDefaults(figure, "image");
    return;
  }
  const items = Array.from({ length: layout.count }, (_, index) => images[index]).map((image, index) => {
    if (image?.src) {
      return `<div class="cms-media-slot" data-editor-media-slot="${index}"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}"></div>`;
    }
    return mediaSlotButton(index);
  }).join("");
  figure.innerHTML = `<div class="cms-media-layout-grid">${items}</div>`;
  if (caption && caption.textContent.trim()) figure.appendChild(caption);
  applyMediaFigureDefaults(figure, "image");
}

async function replaceMediaLayoutSlot(slotButton) {
  const figure = slotButton?.closest?.("[data-editor-media]");
  if (!figure) return;
  selectMediaFigure(figure);
  const visual = figure.closest("[data-visual-editor]");
  const beforeHtml = visual?.innerHTML || "";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp,image/gif";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    setStatus("正在添加图片...");
    const media = await uploadAdminMedia(file, "guides", [file.type === "image/gif" ? "gif" : "image"]);
    const slot = slotButton.closest(".cms-media-slot") || slotButton;
    const index = slot.dataset.editorMediaSlot || "0";
    const replacement = document.createElement("div");
    replacement.className = "cms-media-slot";
    replacement.dataset.editorMediaSlot = index;
    replacement.innerHTML = `<img src="${escapeHtml(normalizeMediaUrl(media.url || ""))}" alt="${escapeHtml(media.alt || media.filename || "")}">`;
    slot.replaceWith(replacement);
    commitMediaChange(figure, beforeHtml, "图片已加入布局");
  };
  input.click();
}

function handleMediaToolbarAction(action, source = null) {
  const figure = state.selectedMediaFigure;
  if (!figure?.isConnected) {
    hideMediaToolbar();
    return;
  }
  const visual = figure.closest("[data-visual-editor]");
  const beforeHtml = visual?.innerHTML || "";
  if (action === "replace") {
    replaceSelectedMedia(figure);
    return;
  }
  if (action === "toggle-style-panel") {
    const panel = ensureMediaStylePanel();
    panel.classList.toggle("is-hidden");
    positionMediaToolbar(figure);
    return;
  }
  if (action === "close-style-panel") {
    ensureMediaStylePanel().classList.add("is-hidden");
    positionMediaToolbar(figure);
    return;
  }
  if (action === "apply-template") {
    const id = source?.dataset?.mediaTemplateId;
    const template = mediaStyleTemplates.find((item) => item.id === id);
    if (!template) return;
    applyMediaStyleTemplate(figure, template);
    commitMediaChange(figure, beforeHtml, `已应用${template.label}`);
    return;
  }
  if (action === "apply-custom-template") {
    const id = source?.dataset?.mediaTemplateId;
    const template = customMediaStyleTemplates().find((item) => item.id === id);
    if (!template) return;
    applyMediaStyleTemplate(figure, template);
    commitMediaChange(figure, beforeHtml, `已应用${template.label}`);
    return;
  }
  if (action === "apply-layout") {
    const layoutId = source?.dataset?.mediaLayoutId || "single";
    applyMediaLayout(figure, layoutId);
    commitMediaChange(figure, beforeHtml, `已切换为${mediaLayoutTemplates.find((item) => item.id === layoutId)?.label || "单图"}布局`);
    return;
  }
  if (action === "copy-style") {
    state.mediaStyleClipboard = readMediaStyle(figure);
    showToast("图片样式已复制");
    return;
  }
  if (action === "paste-style") {
    if (!state.mediaStyleClipboard) {
      showToast("还没有复制图片样式");
      return;
    }
    applyMediaStyleTemplate(figure, state.mediaStyleClipboard);
    commitMediaChange(figure, beforeHtml, "图片样式已粘贴");
    return;
  }
  if (action === "save-style-template") {
    const name = window.prompt("模板名称", "我的图片模板");
    if (!name) return;
    const templates = customMediaStyleTemplates().filter((item) => item.label !== name.trim());
    templates.unshift({ id: `custom-${Date.now()}`, label: name.trim(), ...readMediaStyle(figure) });
    saveCustomMediaStyleTemplates(templates);
    renderMediaTemplateLists();
    showToast("图片模板已保存");
    return;
  }
  if (action.startsWith("align-")) {
    updateMediaFigureStyle(figure, { align: action.replace("align-", "") });
    commitMediaChange(figure, beforeHtml, "媒体对齐已更新");
    return;
  }
  if (action === "set-radius") {
    updateMediaFigureStyle(figure, { radius: Number(source?.dataset?.mediaValue || 18) });
    commitMediaChange(figure, beforeHtml, "圆角已更新");
    return;
  }
  if (action === "set-ratio") {
    applyMediaRatioTemplate(figure, source?.dataset?.mediaRatioId || "free");
    commitMediaChange(figure, beforeHtml, "媒体比例已更新");
    return;
  }
  if (action === "recrop") {
    figure.classList.add("is-crop-editing");
    selectMediaFigure(figure);
    ensureMediaStylePanel().classList.remove("is-hidden");
    showToast("已进入选区编辑：直接拖动图片调整主体位置");
    positionMediaToolbar(figure);
    return;
  }
  if (action === "finish-crop") {
    figure.classList.remove("is-crop-editing");
    selectMediaFigure(figure);
    commitMediaChange(figure, beforeHtml, "裁剪已完成");
    return;
  }
  if (action === "set-object-position") {
    updateMediaCropTargetStyle(figure, { objectPosition: source?.dataset?.mediaValue || "center center" });
    commitMediaChange(figure, beforeHtml, "裁剪焦点已更新");
    return;
  }
  if (action === "set-fit") {
    updateMediaCropTargetStyle(figure, { fit: source?.dataset?.mediaValue || "cover" });
    commitMediaChange(figure, beforeHtml, source?.dataset?.mediaValue === "contain" ? "已完整显示图片" : "已切换为填充裁剪");
    return;
  }
  if (action === "set-video-ratio") {
    updateMediaFigureStyle(figure, { videoRatio: source?.dataset?.mediaValue || "16 / 9" });
    commitMediaChange(figure, beforeHtml, "视频比例已更新");
    return;
  }
  if (action === "upload-video-poster") {
    const video = figure.querySelector("video");
    if (!video) {
      showToast("请先选中视频");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setStatus("正在上传视频封面...");
      const media = await uploadAdminMedia(file, "guides", ["video-cover"]);
      updateMediaFigureStyle(figure, { videoPoster: normalizeMediaUrl(media.url || "") });
      commitMediaChange(figure, beforeHtml, "视频封面已更新");
    };
    input.click();
    return;
  }
  if (action === "clear-video-poster") {
    updateMediaFigureStyle(figure, { videoPoster: "" });
    commitMediaChange(figure, beforeHtml, "视频封面已清除");
    return;
  }
  if (action === "height-auto") {
    updateMediaFigureStyle(figure, { height: "auto" });
    commitMediaChange(figure, beforeHtml, "已恢复原始高度");
    return;
  }
  if (action === "set-shadow") {
    updateMediaFigureStyle(figure, { shadow: source?.dataset?.mediaValue || "none" });
    commitMediaChange(figure, beforeHtml, "阴影已更新");
    return;
  }
  if (action === "set-spacing") {
    updateMediaFigureStyle(figure, { spacing: Number(source?.dataset?.mediaValue || 24) });
    commitMediaChange(figure, beforeHtml, "图片间距已更新");
    return;
  }
  if (action === "link") {
    const next = window.prompt("图片点击链接（留空则取消）", figure.dataset.mediaLink || "");
    if (next === null) return;
    updateMediaFigureStyle(figure, { link: next });
    commitMediaChange(figure, beforeHtml, next.trim() ? "图片链接已更新" : "图片链接已移除");
    return;
  }
  if (action === "caption") {
    const caption = figure.querySelector("figcaption") || figure.appendChild(document.createElement("figcaption"));
    const next = window.prompt("图片 / 媒体说明", caption.textContent.trim());
    if (next === null) return;
    caption.textContent = next;
    commitMediaChange(figure, beforeHtml, "说明已更新");
    return;
  }
  if (action === "alt") {
    const img = figure.querySelector("img");
    if (!img) {
      showToast("只有图片 / 动图需要 Alt 文本");
      return;
    }
    const next = window.prompt("SEO Alt 文本", img.getAttribute("alt") || "");
    if (next === null) return;
    img.setAttribute("alt", next);
    commitMediaChange(figure, beforeHtml, "Alt 文本已更新");
    return;
  }
  if (action === "delete") {
    if (!window.confirm("确认删除这个媒体？")) return;
    figure.remove();
    hideMediaToolbar();
    if (visual) {
      const lang = visual.dataset.visualEditor || state.currentGuideLang;
      pushEditorHistory(lang, beforeHtml, visual.innerHTML);
      markVisualEditorChanged(lang);
    }
    showToast("媒体已删除");
  }
}

function handleMediaStyleControl(target, { toast = false } = {}) {
  const figure = state.selectedMediaFigure;
  if (!figure?.isConnected) return;
  const key = target.dataset.editorMediaControl;
  if (!key) return;
  const value = target.type === "checkbox" ? target.checked : target.value;
  if (key === "width") updateMediaFigureStyle(figure, { width: Number(value) || 100, widthUnit: "percent" });
  if (key === "height") {
    updateMediaFigureStyle(figure, { height: Number(value) || 320 });
  }
  if (key === "maxWidth") updateMediaFigureStyle(figure, { maxWidth: value });
  if (key === "radius") updateMediaFigureStyle(figure, { radius: Number(value) || 0 });
  if (key === "shadow") updateMediaFigureStyle(figure, { shadow: value });
  if (key === "spacing") updateMediaFigureStyle(figure, { spacing: Number(value) || 24 });
  if (key === "enlarge") updateMediaFigureStyle(figure, { enlarge: Boolean(value) });
  if (key === "lockRatio") updateMediaFigureStyle(figure, { lockRatio: Boolean(value) });
  if (key === "videoControls") updateMediaFigureStyle(figure, { videoControls: Boolean(value) });
  if (key === "videoAutoplay") updateMediaFigureStyle(figure, { videoAutoplay: Boolean(value), videoMuted: Boolean(value) || figure.querySelector("video")?.muted });
  if (key === "videoMuted") updateMediaFigureStyle(figure, { videoMuted: Boolean(value) });
  if (key === "videoLoop") updateMediaFigureStyle(figure, { videoLoop: Boolean(value) });
  syncMediaFigureChange(figure, "媒体样式已更新", { toast });
}

function insertGuideElement(kind = "tip") {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang || "en";
  const snippets = {
    h1: "<h1>攻略大标题</h1><p><br></p>",
    h2: "<h2>新的攻略标题</h2><p><br></p>",
    h3: "<h3>小标题</h3><p><br></p>",
    link: '<a href="https://">链接文字</a>',
    tip: calloutHtml("tip"),
    warning: calloutHtml("warning"),
    recommend: calloutHtml("recommend"),
    budget: calloutHtml("budget"),
    time: calloutHtml("time"),
    route: routeHtml(),
    faq: faqSnippetHtml()
  };
  if (insertHtmlIntoVisualAtSelection(snippets[kind] || snippets.tip, lang)) {
    showToast("已插入攻略元素");
    return;
  }
  const raw = getActiveRawEditor();
  const fallback = {
    h1: "\n\n# 攻略大标题\n\n",
    h2: "\n\n## 新的攻略标题\n\n",
    h3: "\n\n### 小标题\n\n",
    link: "[链接文字](https://)",
    tip: "\n\nTip: Travel Tip | 这里填写提示内容。\n\n",
    warning: "\n\nWarning: Important | 这里填写注意事项。\n\n",
    recommend: "\n\nRecommend: Recommendation | 这里填写推荐理由。\n\n",
    budget: "\n\nBudget: Budget | 这里填写预算参考。\n\n",
    time: "\n\nTime: Time | 这里填写建议时间。\n\n",
    route: "\n\nRoute: 外滩 > 南京路 > 豫园\n\n",
    faq: "\n\nFAQ: 常见问题？ | 这里填写回答内容。\n\n"
  }[kind] || "\n\nTip: Travel Tip | 这里填写提示内容。\n\n";
  if (raw) insertTextIntoTextarea(raw, fallback);
}

function wrapSelectedMarkdown(editor, before, after = "") {
  if (!editor) return;
  const start = editor.selectionStart ?? 0;
  const end = editor.selectionEnd ?? 0;
  const selected = editor.value.slice(start, end) || "重点文字";
  const replacement = `${before}${selected}${after}`;
  editor.value = `${editor.value.slice(0, start)}${replacement}${editor.value.slice(end)}`;
  editor.selectionStart = start + before.length;
  editor.selectionEnd = start + before.length + selected.length;
  autoSizeEditor(editor);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
}

function wrapVisualSelection(tagName, attributes = {}) {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang;
  const visual = restoreVisualSelection(lang) || getActiveVisualEditor();
  if (!visual) return false;
  const beforeHtml = visual.innerHTML;
  const selection = window.getSelection();
  let range = null;
  if (selection?.rangeCount && visual.contains(selection.anchorNode)) {
    range = selection.getRangeAt(0);
  } else if (state.lastVisualSelection?.range && state.lastVisualSelection.lang === visual.dataset.visualEditor) {
    range = state.lastVisualSelection.range.cloneRange();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  if (!range || !visual.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(visual);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  const wrapper = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "class") wrapper.className = value;
    else if (key === "style") wrapper.setAttribute("style", value);
    else wrapper.setAttribute(key, value);
  });
  try {
    if (range.collapsed) wrapper.textContent = "重点文字";
    else wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    rememberVisualSelection();
  } catch {
    document.execCommand("insertHTML", false, wrapper.outerHTML);
  }
  pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
  return true;
}

function unwrapNode(node) {
  if (!node?.parentNode) return;
  const parent = node.parentNode;
  while (node.firstChild) parent.insertBefore(node.firstChild, node);
  parent.removeChild(node);
}

function removeClosestVisualFormat(selector) {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang;
  const visual = restoreVisualSelection(lang) || getActiveVisualEditor();
  if (!visual) return false;
  const beforeHtml = visual.innerHTML;
  const selection = window.getSelection();
  const node = nodeFromSelection(selection);
  const target = closestWithinEditor(node, selector, visual);
  if (!target) return false;
  unwrapNode(target);
  pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
  rememberVisualSelection();
  return true;
}

function applyBlockStyle(value = "medium") {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang;
  const visual = restoreVisualSelection(lang) || getActiveVisualEditor();
  if (!visual) return false;
  const beforeHtml = visual.innerHTML;
  const selection = window.getSelection();
  const node = getSelectionNodeForEditor(visual);
  const block = getCurrentBlock(visual, node);
  const targetTag = BLOCK_STYLE_MAP[value]?.tag || "p";
  let target = block;
  if (!target) {
    target = document.createElement(targetTag);
    target.textContent = "标题文字";
    visual.appendChild(target);
  } else if (target.tagName.toLowerCase() !== targetTag) {
    const next = document.createElement(targetTag);
    next.innerHTML = target.innerHTML;
    target.replaceWith(next);
    target = next;
  }
  target.querySelectorAll?.(".cms-text-size").forEach(unwrapNode);
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
  state.lastVisualSelection = { lang: visual.dataset.visualEditor || lang, range: range.cloneRange() };
  pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, beforeHtml, visual.innerHTML);
  markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
  updateToolbarState(visual);
  return true;
}

function applyTextSizeStyle(value = "medium") {
  const lang = state.lastVisualSelection?.lang || state.currentGuideLang;
  const visual = restoreVisualSelection(lang) || getActiveVisualEditor();
  if (!visual) return false;
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || range.collapsed || !visual.contains(range.commonAncestorContainer)) {
    return applyBlockStyle(value);
  }
  if (value === "medium") {
    const node = nodeFromSelection(selection);
    const target = closestWithinEditor(node, ".cms-text-size", visual);
    if (target) {
      const beforeHtml = visual.innerHTML;
      unwrapNode(target);
      pushEditorHistory(visual.dataset.visualEditor || state.currentGuideLang, beforeHtml, visual.innerHTML);
      markVisualEditorChanged(visual.dataset.visualEditor || state.currentGuideLang);
      rememberVisualSelection();
      updateToolbarState(visual);
      return true;
    }
    return wrapVisualSelection("span", { class: "cms-text-size cms-text-size-medium", "data-size-value": "medium" });
  }
  return wrapVisualSelection("span", { class: `cms-text-size cms-text-size-${value}`, "data-size-value": value });
}

function applyInlineFormat(format, value = "") {
  const visual = $(`[data-visual-editor="${state.lastVisualSelection?.lang || state.currentGuideLang}"]`) || getActiveVisualEditor();
  if (visual) {
    const lang = visual.dataset.visualEditor || state.currentGuideLang;
    if (format === "size") {
      applyTextSizeStyle(value || "medium");
      return;
    }
    if (format === "color" && value === "#111111") {
      if (!removeClosestVisualFormat(".cms-text-color")) showToast("当前文字没有颜色样式");
      return;
    }
    if (format === "highlight" && value === "transparent") {
      if (!removeClosestVisualFormat("mark.cms-highlight")) showToast("当前文字没有填充背景");
      return;
    }
    if (format === "bold") wrapVisualSelection("strong");
    if (format === "color") wrapVisualSelection("span", { class: "cms-text-color", style: `color:${value || "#8A5A2B"}`, "data-color-value": value || "#8A5A2B" });
    if (format === "highlight") wrapVisualSelection("mark", { class: "cms-highlight", style: `background:${value || "#F3E7C8"}`, "data-highlight-value": value || "#F3E7C8" });
    markVisualEditorChanged(lang);
    updateToolbarState(visual);
    return;
  }
}

async function uploadAdminMedia(file, folder = "guides", tags = []) {
  const dataUrl = await fileToDataUrl(file);
  const response = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, alt: file.name.replace(/\.[^.]+$/, ""), folder, category: folder, tags, dataUrl })
  });
  await loadMedia();
  return response.media || { url: response.path, alt: file.name.replace(/\.[^.]+$/, ""), type: file.type.split("/")[0], mimeType: file.type };
}

function mediaMarkdown(item, kind) {
  const url = item.url || "";
  const label = item.alt || item.filename || (kind === "audio" ? "音频说明" : kind === "video" ? "视频说明" : "图片说明");
  if (kind === "audio") return `Audio: ${label} | ${url}\n\n`;
  if (kind === "video") return `Video: ${label} | ${url}\n\n`;
  return `![${label}](${url})\n\n`;
}

async function insertMediaFiles(files, kind = "image") {
  const acceptMap = {
    image: (file) => file.type.startsWith("image/") && file.type !== "image/gif",
    gif: (file) => file.type === "image/gif",
    audio: (file) => file.type.startsWith("audio/"),
    video: (file) => file.type.startsWith("video/")
  };
  const validFiles = [...files].filter(acceptMap[kind] || acceptMap.image);
  if (!validFiles.length) {
    showToast("请选择匹配的文件类型");
    return;
  }
  setStatus("正在上传素材...");
  const uploaded = [];
  for (const file of validFiles) uploaded.push(await uploadAdminMedia(file, "guides", [kind]));
  const lang = state.pendingMediaSelection?.lang || state.currentGuideLang;
  const visual = $(`[data-visual-editor="${lang}"]`) || getActiveVisualEditor();
  if (visual && (
    document.activeElement?.matches?.("[data-visual-editor]")
    || state.lastVisualSelection?.lang === visual.dataset.visualEditor
    || state.pendingMediaSelection?.lang === visual.dataset.visualEditor
  )) {
    restorePendingMediaSelection(visual.dataset.visualEditor || state.currentGuideLang);
    const beforeHtml = visual.innerHTML;
    const html = uploaded.map((item) => mediaFigureHtml(item, kind)).join("");
    document.execCommand("insertHTML", false, html);
    const visualLang = visual.dataset.visualEditor || state.currentGuideLang;
    pushEditorHistory(visualLang, beforeHtml, visual.innerHTML);
    markVisualEditorChanged(visualLang);
    const figures = [...visual.querySelectorAll("[data-editor-media]")];
    if (figures.length) selectMediaFigure(figures[figures.length - 1]);
  } else {
    const target = getActiveRawEditor();
    if (target) insertTextIntoTextarea(target, uploaded.map((item) => mediaMarkdown(item, kind)).join(""));
  }
  state.pendingMediaSelection = null;
  const insertedLang = visual?.dataset?.visualEditor;
  if (insertedLang === "journey") {
    $("[data-experience-save-status]").textContent = "未保存";
  } else {
    renderGuidePreview();
    setUnsaved(true);
  }
  setStatus("素材已插入。");
  showToast("素材已插入到光标位置");
}

async function insertImageFiles(files, gallery = false) {
  const validFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!validFiles.length) return;
  setStatus("正在上传图片...");
  const uploaded = [];
  for (const file of validFiles) uploaded.push(await uploadAdminImage(file, "guides"));
  if (gallery && uploaded.length > 1) {
    const target = document.activeElement?.matches?.("[data-raw-editor]") ? document.activeElement : null;
    if (target) {
      insertTextIntoTextarea(target, uploaded.map((item) => `![${item.alt || ""}](${item.url})`).join("\n") + "\n\n");
    } else {
      insertHtmlAtCursor(`<div class="cms-gallery">${uploaded.map((item) => `<img src="/${item.url}" alt="${escapeHtml(item.alt || "")}">`).join("")}</div><p><br></p>`);
    }
  } else {
    const target = document.activeElement?.matches?.("[data-raw-editor]") ? document.activeElement : null;
    if (target) {
      insertTextIntoTextarea(target, uploaded.map((item) => `![${item.alt || ""}](${item.url})`).join("\n") + "\n\n");
    } else {
      uploaded.forEach((item) => insertHtmlAtCursor(`<figure><img src="/${item.url}" alt="${escapeHtml(item.alt || "")}"><figcaption>${escapeHtml(item.alt || "")}</figcaption></figure><p><br></p>`));
    }
  }
  renderGuidePreview();
  setUnsaved(true);
  setStatus("图片已上传。");
}

function insertTextIntoTextarea(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  autoSizeEditor(textarea);
  updateWordCount(textarea);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function wordStats(value = "") {
  const clean = String(value || "").replace(/[#*_>`\[\]()/|:-]/g, " ").trim();
  const chinese = (clean.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = clean.replace(/[\u4e00-\u9fff]/g, " ").match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || [];
  const count = chinese + latin.length;
  return {
    count,
    label: `${count.toLocaleString()} 字`
  };
}

function updateWordCount(textarea) {
  if (!textarea) return;
  const lang = textarea.dataset.rawEditor;
  const node = $(`[data-word-count="${lang}"]`);
  if (node) node.textContent = wordStats(textarea.value).label;
}

function updateWordCounts() {
  $$("[data-raw-editor]").forEach(updateWordCount);
}

function scheduleGuideAutosave() {
  window.clearTimeout(state.guideAutosaveTimer);
  state.guideAutosaveTimer = window.setTimeout(async () => {
    if (!state.guideDraft) return;
    syncGuideFromForm();
    const hasTitle = getGuideTranslation(state.guideDraft, "en").title || getGuideTranslation(state.guideDraft, "cn").title;
    if (!hasTitle || hasTitle === "Untitled Guide" || hasTitle === "未命名攻略") return;
    try {
      if ($("[data-unsaved-state]")) $("[data-unsaved-state]").textContent = "正在自动保存...";
      await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
      await loadGuides();
      setUnsaved(false);
      setStatus("攻略已自动保存。");
    } catch (error) {
      setStatus(`自动保存失败：${error.message}`);
    }
  }, 4200);
}

async function loadCities() {
  state.cities = (await api("/api/admin/cities")).data;
  if (!state.currentCityId && state.cities[0]) state.currentCityId = state.cities[0].id;
  renderExperienceCityOptions();
  renderCitiesCms();
}

function renderCitiesCms() {
  renderCityList();
  const city = state.cities.find((item) => item.id === state.currentCityId) || state.cities[0];
  if (city) selectCity(city, { keepList: true });
  else renderEmptyCityEditor();
}

function renderCityList() {
  const list = $("[data-cities-list]");
  if (!list) return;
  const query = ($("[data-city-search]")?.value || "").toLowerCase();
  const filter = $("[data-city-filter]")?.value || "";
  const cities = [...state.cities]
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .filter((city) => {
      const haystack = [city.name, city.slug, city.shortDescription || city.description].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (!filter || (filter === "active" ? city.active : city.showInNavigation));
    });

  list.innerHTML = cities.map((city) => {
    const stats = cityContentStats(city);
    const health = cityHealth(city);
    return `
      <button class="city-row ${city.id === state.currentCityId ? "is-active" : ""}" type="button" draggable="true" data-city-order-id="${city.id}" data-edit-city="${city.id}">
        <img src="/${escapeHtml(String(cityImage(city)).replace(/^\/+/, ""))}" alt="" />
        <span>
          <strong>${escapeHtml(city.name)}</strong>
          <small>${stats.guides.length} 攻略 · ${stats.experiences.length} 行程</small>
          <em>${city.active ? "已启用" : "已停用"}${city.showInNavigation ? " · 导航显示" : ""}</em>
          <span class="city-health-badges">
            ${health.issues.slice(0, 3).map((item) => `<b class="${item.positive ? "is-good" : ""}">${escapeHtml(item.label)}</b>`).join("")}
          </span>
        </span>
      </button>
    `;
  }).join("") || "<p class='empty'>没有找到城市。</p>";
}

function renderEmptyCityEditor() {
  $("[data-current-city-title]").textContent = "请选择城市";
  $("[data-city-page-preview]").textContent = "最终页面地址：/cities/";
  setCitySaveStatus("请选择左侧城市");
  $("[data-city-linked-summary]").innerHTML = "";
  $("[data-city-linked-list]").innerHTML = "";
  $("[data-city-image-preview]").innerHTML = "";
  $("[data-city-card-preview]").innerHTML = "";
  $("[data-city-publish-checks]").innerHTML = "";
}

function selectCity(city, options = {}) {
  const current = normalizeCityDraft(city);
  state.currentCityId = current.id;
  $("[data-city-form]")?.classList.toggle("is-new-city", !current.id);
  fillForm($("[data-city-form]"), current);
  const slugInput = $("[data-city-form] [name='slug']");
  if (slugInput) slugInput.dataset.autoSlug = current.slug ? "false" : "true";
  $("[data-current-city-title]").textContent = current.name || "未命名城市";
  $("[data-city-page-preview]").textContent = `最终页面地址：/cities/${current.slug || ""}`;
  setCitySaveStatus(current.id ? `已保存 · ${formatRelativeDate(current.updatedAt)}` : "新城市 · 保存后进入完整编辑");
  renderCityAssociations(current);
  renderCityImagePreview(current);
  renderCityCardPreview(current);
  renderCityPublishChecks(current);
  if (!options.keepList) renderCityList();
}

function cityPublishChecks(city) {
  const stats = cityContentStats(city);
  return [
    { label: "基础信息完整", ok: Boolean(city.name && city.slug && city.shortDescription), note: "需要城市名称、URL 标识和一句话简介" },
    { label: "城市 Hero 横幅图", ok: Boolean(city.bannerImage), note: "用于城市页顶部视觉" },
    { label: "城市卡片图", ok: Boolean(city.cardImage), note: "用于城市选择和推荐模块" },
    { label: "至少关联 1 篇攻略", ok: stats.guides.length > 0, note: "城市页需要可阅读的 China Guides 内容" },
    { label: "至少关联 1 个完整行程或短体验", ok: stats.experiences.length > 0, note: "用于 Trips & Services 内容承接" },
    { label: "城市页已启用", ok: Boolean(city.active), note: "停用状态下前台不会公开展示" }
  ];
}

function renderCityPublishChecks(city) {
  const node = $("[data-city-publish-checks]");
  if (!node) return;
  const checks = cityPublishChecks(city);
  const completed = checks.filter((item) => item.ok).length;
  node.innerHTML = `
    <div class="city-publish-summary">
      <span>发布准备度</span>
      <strong>${completed}/${checks.length}</strong>
      <i><b style="width:${Math.round((completed / checks.length) * 100)}%"></b></i>
    </div>
    <div class="city-publish-list">
      ${checks.map((item) => `
        <div class="${item.ok ? "is-ready" : ""}">
          <b>${item.ok ? "✓" : "!"}</b>
          <span>${escapeHtml(item.label)}</span>
          <small>${escapeHtml(item.ok ? "已完成" : item.note)}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCityCardPreview(city) {
  const node = $("[data-city-card-preview]");
  if (!node) return;
  const image = String(cityImage(city)).replace(/^\/+/, "");
  const health = cityHealth(city);
  node.innerHTML = `
    <div class="city-preview-copy">
      <p class="eyebrow">实时预览</p>
      <h5>城市卡片预览</h5>
      <p>这会用于前台城市选择、城市推荐和移动端小卡片。</p>
      <div class="city-health-meter">
        <span>内容完整度</span>
        <strong>${health.percent}%</strong>
        <i><b style="width:${health.percent}%"></b></i>
      </div>
    </div>
    <article class="city-card-mockup">
      <img src="/${escapeHtml(image)}" alt="" />
      <div>
        <strong>${escapeHtml(city.name || "城市名称")}</strong>
        <span>${escapeHtml(city.shortDescription || city.description || "这里会显示城市短描述。")}</span>
        <em>${escapeHtml(city.slug ? `/cities/${city.slug}` : "/cities/")}</em>
      </div>
    </article>
  `;
}

function renderCityImagePreview(city) {
  const preview = $("[data-city-image-preview]");
  if (!preview) return;
  const usageFor = (value) => {
    const normalized = String(value || "").replace(/^\/+/, "");
    if (!normalized) return [];
    const matches = [];
    state.cities.forEach((item) => {
      if ([item.bannerImage, item.cardImage, item.thumbnailImage].map((image) => String(image || "").replace(/^\/+/, "")).includes(normalized)) {
        matches.push(`${item.name || "城市"} 页面`);
      }
    });
    state.experiences.forEach((item) => {
      if ([item.coverImage, ...(item.galleryImages || [])].map((image) => String(image || "").replace(/^\/+/, "")).includes(normalized)) {
        matches.push(item.title || "完整行程");
      }
    });
    state.guides.forEach((item) => {
      if ([item.coverImage, item.mobileCoverImage].map((image) => String(image || "").replace(/^\/+/, "")).includes(normalized)) {
        matches.push(item.title || "攻略");
      }
    });
    return [...new Set(matches)].slice(0, 3);
  };
  const images = [
    { field: "bannerImage", label: "城市横幅图", ratio: "16:9", scene: "用于城市页 Hero / 详情页顶部", hint: "用于城市页面顶部的大图。", size: "建议尺寸：1600 × 900", value: city.bannerImage },
    { field: "cardImage", label: "城市卡片图", ratio: "4:3", scene: "用于首页城市卡 / 推荐城市", hint: "用于前台城市卡片和推荐模块。", size: "建议尺寸：1200 × 900", value: city.cardImage },
    { field: "thumbnailImage", label: "城市缩略图", ratio: "1:1", scene: "用于左侧列表 / 移动端小卡片", hint: "用于城市列表、小卡片和移动端展示。", size: "建议尺寸：800 × 800", value: city.thumbnailImage }
  ];

  preview.innerHTML = images.map((item) => `
    <article class="city-upload-card ${item.value ? "has-image" : ""}" data-city-image-drop="${item.field}">
      <div class="city-image-usage">
        <span>${escapeHtml(item.ratio)}</span>
        <em>${escapeHtml(item.scene)}</em>
      </div>
      ${item.value
        ? `<img src="/${escapeHtml(String(item.value).replace(/^\/+/, ""))}" alt="${escapeHtml(item.label)}" />`
        : `<div class="city-upload-empty"><span>+</span><strong>${item.label}</strong><small>${item.hint}</small><em>${item.size}</em></div>`}
      ${item.value ? `<div class="city-image-state">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(String(item.value).split("/").pop())}</span>
        <small>${escapeHtml(item.size)}</small>
        <em>${usageFor(item.value).length ? `使用中：${escapeHtml(usageFor(item.value).join("、"))}` : "当前未检测到前台引用"}</em>
      </div>` : ""}
      <div class="city-upload-actions">
        <button class="secondary" type="button" data-open-media-picker="city:${item.field}">${item.value ? "从素材库替换" : "从素材中心选择"}</button>
        <button class="secondary" type="button" data-upload-city-image="${item.field}">${item.value ? "本地替换" : "本地上传到素材中心"}</button>
        ${item.value ? `<button class="secondary" type="button" data-clear-city-image="${item.field}">删除</button>` : ""}
      </div>
    </article>
  `).join("");
}

function renderCityAssociations(city) {
  const summary = $("[data-city-linked-summary]");
  const list = $("[data-city-linked-list]");
  if (!summary || !list) return;
  const stats = cityContentStats(city);
  summary.innerHTML = `
    <div><strong>${stats.guides.length}</strong><span>篇攻略</span></div>
    <div><strong>${stats.journeys.length}</strong><span>个完整行程</span></div>
    <div><strong>${stats.shorts.length}</strong><span>个短体验</span></div>
  `;

  const latestGuides = stats.guides
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 4);
  const latestExperiences = stats.experiences
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 4);

  list.innerHTML = `
    <div>
      <h5>最新攻略</h5>
      ${latestGuides.map((guide) => `
        <button type="button" data-edit-city-guide="${guide.id}">
          <span>${escapeHtml(guide.title || "未命名攻略")}</span>
          <small>${escapeHtml([guide.category, zhStatus(guide.status), formatRelativeDate(guide.updatedAt)].filter(Boolean).join(" · "))}</small>
        </button>
      `).join("") || `<div class="city-empty-action"><p>还没有 ${escapeHtml(city.name || "这个城市")} 攻略。</p><div><button type="button" data-ai-guide-outline-for-city="${escapeHtml(city.slug || city.name || "")}">AI生成攻略大纲</button><button type="button" data-template-guide-for-city="${escapeHtml(city.slug || city.name || "")}">从模板生成</button><button type="button" data-new-guide-for-city="${escapeHtml(city.slug || city.name || "")}">为 ${escapeHtml(city.name || "这个城市")} 新建攻略</button></div></div>`}
    </div>
    <div>
      <h5>最近行程</h5>
      ${latestExperiences.map((experience) => `
        <button type="button" data-edit-experience="${experience.id}">
          <span>${escapeHtml(experience.title || (experience.type === "short_experience" ? "未命名短体验" : "未命名完整行程"))}</span>
          <small>${escapeHtml([experience.type === "short_experience" ? "短体验" : "完整行程", experience.duration, formatRelativeDate(experience.updatedAt)].filter(Boolean).join(" · "))}</small>
        </button>
      `).join("") || `<div class="city-empty-action"><p>这个城市还没有关联行程。</p><button type="button" data-new-experience-for-city="${escapeHtml(city.slug || city.name || "")}">为 ${escapeHtml(city.name || "这个城市")} 新建行程</button></div>`}
    </div>
  `;
}

function jumpToCitySection(section) {
  const target = $(`[data-city-section="${section}"]`);
  if (!target) return;
  $$("[data-city-jump]").forEach((button) => button.classList.toggle("is-active", button.dataset.cityJump === section));
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("is-highlighted");
  window.setTimeout(() => target.classList.remove("is-highlighted"), 1200);
}

async function reorderCities(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const sorted = [...state.cities].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const from = sorted.findIndex((city) => city.id === sourceId);
  const to = sorted.findIndex((city) => city.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = sorted.splice(from, 1);
  sorted.splice(to, 0, moved);
  state.cities = sorted.map((city, index) => ({ ...city, sortOrder: index + 1 }));
  renderCityList();
  setCitySaveStatus("正在保存排序...", "saving");
  setStatus("正在保存城市排序...");
  try {
    for (const city of state.cities) {
      await api("/api/admin/cities", { method: "POST", body: JSON.stringify(city) });
    }
    await loadCities();
    setCitySaveStatus("排序已保存 · 刚刚", "saved");
    setStatus("城市排序已保存。");
    showToast("城市排序已保存");
  } catch (error) {
    setCitySaveStatus("排序保存失败", "error");
    setStatus(`排序保存失败：${error.message}`);
  }
}

async function loadExperiences() {
  state.experiences = (await api("/api/admin/experiences")).data;
  const currentModeItems = experiencesForActiveMode();
  if (!state.currentExperienceId && currentModeItems[0]) state.currentExperienceId = currentModeItems[0].id;
  renderExperienceCityOptions();
  renderExperienceList();
  const current = state.experiences.find((item) => item.id === state.currentExperienceId) || currentModeItems[0] || state.experiences[0];
  renderExperienceEditor(current || defaultExperienceForMode());
  if (state.cities.length) renderCitiesCms();
}

function experienceModeMeta(mode = state.activeExperienceMode) {
  if (mode === "short_experience") {
    return {
      tab: "short-experiences",
      type: "short_experience",
      title: "短体验",
      description: "管理半日、数小时活动，例如 Skyline Breakfast、Design Walk、Local Experience。",
      searchPlaceholder: "搜索短体验",
      empty: "暂无短体验。",
      newLabel: "+ 新建短体验",
      editLabel: "短体验"
    };
  }
  return {
    tab: "journeys",
    type: "recommended_journey",
    title: "完整行程",
    description: "管理 2–5 Days 的完整行程、Day-by-Day、价格、媒体和详情页内容。",
    searchPlaceholder: "搜索完整行程",
    empty: "暂无完整行程。",
    newLabel: "+ 新建完整行程",
    editLabel: "完整行程"
  };
}

function experiencesForActiveMode() {
  return state.experiences.filter((item) => item.type === experienceModeMeta().type);
}

function tabForExperience(item = {}) {
  return item.type === "short_experience" ? "short-experiences" : "journeys";
}

function updateExperienceModuleChrome() {
  const meta = experienceModeMeta();
  const title = $("[data-experience-module-title]");
  const description = $("[data-experience-module-description]");
  const search = $("[data-experience-search]");
  const filter = $("[data-experience-filter-type]");
  const newButton = $("[data-new-experience-label]");
  const contentJump = $("[data-experience-jump='content']");
  if (title) title.textContent = meta.title;
  if (description) description.textContent = meta.description;
  if (search) search.placeholder = meta.searchPlaceholder;
  if (filter) filter.value = meta.type;
  if (newButton) newButton.textContent = meta.newLabel;
  if (contentJump) contentJump.textContent = meta.type === "short_experience" ? "短体验编辑" : "Journey 编辑";
  $$("[data-experience-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.experienceMode === meta.type);
  });
}

function setExperienceWorkflowSection(section = "content") {
  const activeSection = ["content", "modules", "media", "settings", "preview"].includes(section) ? section : "content";
  if (activeSection !== "preview") state.experiencePreviewSource = activeSection;
  state.activeExperienceSection = activeSection;
  $$("[data-experience-section]").forEach((node) => {
    node.classList.toggle("is-section-hidden", node.dataset.experienceSection !== activeSection);
  });
  $$("[data-experience-jump]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.experienceJump === activeSection);
  });
  if (activeSection !== "content") {
    const node = $(`[data-experience-section="${activeSection}"]:not(.is-hidden)`);
    node?.querySelector("details")?.setAttribute("open", "");
  }
  if (activeSection === "modules") {
    renderDetailEditorCanvas();
  }
  if (activeSection === "preview") {
    renderExperienceSectionPreview(syncExperienceForm(), state.experiencePreviewSource || "content");
  }
}

function renderExperienceCityOptions() {
  const select = $("[data-experience-city-select]");
  if (!select) return;
  const current = select.value;
  select.innerHTML = state.cities
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((city) => `<option value="${escapeHtml(city.slug)}">${escapeHtml(city.name)}</option>`)
    .join("");
  if (current) select.value = current;
}

function renderExperienceList() {
  const list = $("[data-experiences-list]");
  if (!list) return;
  updateExperienceModuleChrome();
  const query = ($("[data-experience-search]")?.value || "").toLowerCase();
  const type = experienceModeMeta().type;
  const experiences = [...state.experiences]
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .filter((item) => {
      const haystack = [item.title, item.city, item.duration, item.excerpt, ...(item.tags || [])].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) && (!type || item.type === type);
    });
  list.innerHTML = experiences.map((item) => `
    <button class="experience-row ${item.id === state.currentExperienceId ? "is-active" : ""}" type="button" data-edit-experience="${item.id}">
      <span>
        <strong>${escapeHtml(item.title || `未命名${experienceModeMeta().editLabel}`)}</strong>
        <small>${escapeHtml([item.city, item.type === "short_experience" ? "短体验" : "完整行程", item.duration].filter(Boolean).join(" · "))}</small>
      </span>
      <em>${item.published ? "已发布" : "草稿"}</em>
    </button>
  `).join("") || `<p class='empty'>${escapeHtml(experienceModeMeta().empty)}</p>`;
}

function renderExperienceEditor(experience) {
  const item = normalizeExperienceDraft(experience);
  state.currentExperienceId = item.id;
  fillForm($("[data-experience-form]"), item);
  $("[name='itineraryDays']").value = JSON.stringify(item.itineraryDays || []);
  $("[name='shortDetails']").value = JSON.stringify(item.shortDetails || {});
  $("[name='experienceFlow']").value = JSON.stringify(item.experienceFlow || []);
  $("[name='experienceDetails']").value = JSON.stringify(item.experienceDetails || []);
  $("[name='includedSupport']").value = JSON.stringify(item.includedSupport || []);
  $("[name='notIncluded']").value = JSON.stringify(item.notIncluded || []);
  $("[name='reviews']").value = JSON.stringify(item.reviews || []);
  $("[name='faqs']").value = JSON.stringify(item.faqs || []);
  $("[name='expert']").value = JSON.stringify(item.expert || {});
  $("[name='cta']").value = JSON.stringify(item.cta || {});
  $("[name='galleryImages']").value = listToCsv(item.galleryImages || []);
  $("[name='tags']").value = listToCsv(item.tags || []);
  const slugInput = $("[data-experience-form] [name='slug']");
  if (slugInput) slugInput.dataset.autoSlug = item.slug ? "false" : "true";
  $("[data-current-experience-title]").textContent = item.title || `未命名${experienceModeMeta(item.type).editLabel}`;
  $("[data-experience-page-preview]").textContent = `/trips/${item.slug || ""}`;
  $("[data-experience-save-status]").textContent = item.id ? `已保存 · ${formatRelativeDate(item.updatedAt)}` : `新${experienceModeMeta(item.type).editLabel} · 尚未保存`;
  state.currentExperienceDay = 0;
  renderExperienceTypeEditor();
  renderExperienceImages(item);
  renderExperienceTags(item.tags || []);
  renderExperienceDetailContent(item);
  renderJourneyCardPreview(item);
  renderExperienceWorkflowStatus(item);
  renderExperienceList();
  setExperienceWorkflowSection("content");
}

function experienceCompletion(item = syncExperienceForm()) {
  const days = item.itineraryDays || [];
  const checks = [
    { label: "Hero 图", ok: Boolean(item.coverImage), note: "缺少行程封面" },
    { label: "基础信息", ok: Boolean(item.title && item.city && item.duration && item.excerpt), note: "标题、城市、时长或简介未完成" },
    { label: "标签", ok: Boolean((item.tags || []).length), note: "缺少标签" },
    { label: "Day 内容", ok: item.type !== "recommended_journey" || days.some((day) => day.summary || day.highlights || day.timeline || day.places || day.experience || day.participation || day.food || day.practical || day.tips || day.arrival || day.transfer || day.hotel || day.eveningPlan || day.body || day.morning || day.afternoon || day.evening), note: "缺少 Day 行程内容" },
    { label: "Day 图片", ok: item.type !== "recommended_journey" || days.every((day) => Boolean(day.image)), note: "有 Day 缺少图片" }
  ];
  const completed = checks.filter((check) => check.ok).length;
  return { percent: Math.round((completed / checks.length) * 100), missing: checks.filter((check) => !check.ok), checks };
}

function renderExperienceWorkflowStatus(item = syncExperienceForm()) {
  const node = $("[data-experience-completion]");
  if (!node) return;
  const completion = experienceCompletion(item);
  node.textContent = `完成度 ${completion.percent}%${completion.missing.length ? ` · 缺 ${completion.missing.length} 项` : " · 可发布"}`;
  node.dataset.state = completion.missing.length ? "dirty" : "saved";
}

function renderExperienceTypeEditor() {
  const type = $("[data-experience-type]")?.value || "recommended_journey";
  $("[data-journey-editor]")?.classList.toggle("is-hidden", type !== "recommended_journey");
  $("[data-short-editor]")?.classList.toggle("is-hidden", type !== "short_experience");
  $$("[data-experience-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.experienceMode === type);
  });
  if (type === "recommended_journey") renderDayEditor();
  else renderShortEditor();
  setExperienceWorkflowSection(state.activeExperienceSection || "content");
}

function readItineraryDays() {
  const existing = parseJsonField($("[name='itineraryDays']")?.value, []);
  const fields = $$("[data-day-field]");
  if (!fields.length) return existing.length ? existing : [defaultItineraryDay(0)];
  const index = state.currentExperienceDay;
  const next = existing.length ? existing.map((day, dayIndex) => normalizeItineraryDay(day, dayIndex)) : [defaultItineraryDay(0)];
  next[index] ||= defaultItineraryDay(index);
  fields.forEach((field) => {
    const fieldKey = field.dataset.dayField;
    next[index][fieldKey] = fieldKey === "title" ? cleanDayTitle(dayFieldValue(field), index) : dayFieldValue(field);
    if (field.matches?.("[data-journey-visual-editor]")) {
      ["highlights", "timeline", "places", "experience", "participation", "food", "practical", "tips", "arrival", "transfer", "hotel", "eveningPlan", "morning", "afternoon", "evening"].forEach((key) => {
        next[index][key] = "";
      });
      next[index].outlineFields = [];
      next[index].template = next[index].template || "free";
    }
  });
  next[index].template = inferDayTemplate(next[index]);
  if (!next[index].stayNotes && next[index].body && !looksLikeHtmlContent(next[index].body)) {
    next[index].stayNotes = next[index].body;
  }
  return next;
}

function cleanDayTitle(title = "", index = 0) {
  return String(title || "")
    .replace(new RegExp(`^\\s*Day\\s*${index + 1}\\s*[—-]\\s*`, "i"), "")
    .replace(/^\s*Day\s+\d+\s*[—-]\s*/i, "")
    .trim();
}

function dayFieldValue(field) {
  if (!field) return "";
  if ("value" in field) return field.value;
  if (field.matches?.("[data-journey-visual-editor]")) return editorHtmlForSave(field);
  return (field.innerText || "").replace(/\u00a0/g, " ").trim();
}

function looksLikeHtmlContent(value = "") {
  return /<\/?(p|h1|h2|h3|ul|ol|li|figure|aside|div|strong|span|mark|video|audio|img|blockquote|section)\b/i.test(String(value || ""));
}

function editableDayHtml(value = "") {
  if (looksLikeHtmlContent(value)) return value;
  if (looksLikeMarkdownContent(value)) return markdownToHtml(value);
  return escapeHtml(value || "").replace(/\n/g, "<br>");
}

function dayBodyFromLegacy(day = {}) {
  if (day.body) return day.body;
  const parts = [
    day.morning ? `Morning\n${day.morning}` : "",
    day.afternoon ? `Afternoon\n${day.afternoon}` : "",
    day.evening ? `Evening\n${day.evening}` : ""
  ].filter(Boolean);
  return parts.join("\n\n");
}

function dayCanvasText(day = {}) {
  if (day.body) return day.body;
  const sectionLabels = {
    highlights: "Today’s Highlights",
    timeline: "Route & Schedule",
    places: "Places to Visit",
    experience: "Local Experience",
    participation: "Guest Flow",
    food: "Food & Cafés",
    practical: "Practical Notes",
    tips: "Local Tips",
    arrival: "Arrival Details",
    transfer: "Transfer",
    hotel: "Hotel",
    eveningPlan: "Evening Plan"
  };
  const sections = Object.entries(sectionLabels)
    .map(([field, label]) => day[field] ? `${label}\n${day[field]}` : "")
    .filter(Boolean);
  return sections.length ? sections.join("\n\n") : "";
}

function dayStructuredValue(day = {}, field) {
  if (day[field]) return day[field];
  if (field === "timeline") {
    return [
      day.morning ? `Morning — ${day.morning}` : "",
      day.afternoon ? `Afternoon — ${day.afternoon}` : "",
      day.evening ? `Evening — ${day.evening}` : ""
    ].filter(Boolean).join("\n");
  }
  if (field === "practical") return day.stayNotes || "";
  return "";
}

function dayStoryField(field, label, hint, value = "", rows = 3) {
  return `
    <label class="day-story-field day-story-${escapeHtml(field)}">
      <span>
        ${escapeHtml(label)}
        <button class="day-section-remove" type="button" data-remove-day-section="${escapeHtml(field)}">Remove</button>
      </span>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
      <textarea data-day-field="${escapeHtml(field)}" rows="${rows}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function dayTemplateSelect(activeTemplate = "free") {
  const myTemplates = storedDayTemplates();
  return `
    <label class="day-template-select">
      <span>Template</span>
      <select data-day-template>
        <optgroup label="System Templates">
          ${Object.entries(dayTemplateOptions).map(([key, option]) => `
            <option value="${escapeHtml(key)}" ${key === activeTemplate ? "selected" : ""}>${escapeHtml(option.label)}</option>
          `).join("")}
        </optgroup>
        ${myTemplates.length ? `
          <optgroup label="My Templates">
            ${myTemplates.map((option) => `
              <option value="${escapeHtml(option.id)}" ${option.id === activeTemplate ? "selected" : ""}>${escapeHtml(option.label)}</option>
            `).join("")}
          </optgroup>
        ` : ""}
      </select>
    </label>
  `;
}

function renderDayToolbar(activeTemplate = "free", options = {}) {
  const {
    target = "[data-day-toolbar]",
    mediaLang = "journey",
    wordCountAttr = "data-day-word-count",
    journeyLabel = "添加旅行模块 +",
    showTemplate = true,
    templateKind = mediaLang === "short" ? "experience" : "journey"
  } = options;
  const toolbar = $(target);
  if (!toolbar) return;
  toolbar.innerHTML = `
    <div class="markdown-toolbar journey-markdown-toolbar">
      <div class="editor-tool-group">
        <span class="toolbar-section-label">编辑</span>
        <button class="secondary" type="button" data-editor-command="undo" title="撤销 Ctrl/Cmd + Z">撤销</button>
        <button class="secondary" type="button" data-editor-command="redo" title="重做 Shift + Ctrl/Cmd + Z">重做</button>
        <span class="toolbar-section-label">格式</span>
        <button class="secondary" type="button" data-format-inline="bold" title="加粗 Ctrl/Cmd + B">加粗</button>
        <span class="toolbar-menu" data-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-toolbar-menu-trigger="style"><span data-toolbar-current="style">Body</span></button>
          <div class="toolbar-menu-panel" data-toolbar-menu-panel hidden>
            <button type="button" data-format-inline="size" data-format-value="medium"><span class="toolbar-check"></span><span>正文 Body</span></button>
            <button type="button" data-format-inline="size" data-format-value="hero"><span class="toolbar-check"></span><span>H1 大标题</span></button>
            <button type="button" data-format-inline="size" data-format-value="large"><span class="toolbar-check"></span><span>H2 标题</span></button>
            <button type="button" data-format-inline="size" data-format-value="small"><span class="toolbar-check"></span><span>H3 小标题</span></button>
          </div>
        </span>
        <span class="toolbar-menu" data-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-toolbar-menu-trigger="color"><span data-toolbar-current="color">文字颜色</span></button>
          <div class="toolbar-menu-panel" data-toolbar-menu-panel hidden>
            <button type="button" data-format-inline="color" data-format-value="#111111"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#111111"></span><span>默认文字</span></button>
            <button type="button" data-format-inline="color" data-format-value="#8A5A2B"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#8A5A2B"></span><span>重点 Highlight</span></button>
            <button type="button" data-format-inline="color" data-format-value="#9B3D2E"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#9B3D2E"></span><span>警告 Warning</span></button>
            <button type="button" data-format-inline="color" data-format-value="#2F5F55"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#2F5F55"></span><span>品牌色 Brand</span></button>
          </div>
        </span>
        <span class="toolbar-menu" data-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-toolbar-menu-trigger="fill"><span data-toolbar-current="fill">背景颜色</span></button>
          <div class="toolbar-menu-panel" data-toolbar-menu-panel hidden>
            <button type="button" data-format-inline="highlight" data-format-value="transparent"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch toolbar-swatch-empty"></span><span>无背景</span></button>
            <button type="button" data-format-inline="highlight" data-format-value="#F3E7C8"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#F3E7C8"></span><span>💡 Tip 背景</span></button>
            <button type="button" data-format-inline="highlight" data-format-value="#F1E6E0"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#F1E6E0"></span><span>⚠ Warning 背景</span></button>
            <button type="button" data-format-inline="highlight" data-format-value="#E8EFE7"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#E8EFE7"></span><span>⭐ 推荐背景</span></button>
            <button type="button" data-format-inline="highlight" data-format-value="#E7EDF6"><span class="toolbar-check"></span><span class="toolbar-swatch color-swatch" style="--swatch:#E7EDF6"></span><span>📌 信息背景</span></button>
          </div>
        </span>
        <span class="toolbar-menu" data-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-toolbar-menu-trigger="insert">Insert</button>
          <div class="toolbar-menu-panel" data-toolbar-menu-panel hidden>
            <button type="button" data-insert-guide-element="link"><span class="toolbar-check"></span><span>链接</span></button>
            <button type="button" data-insert-media="image" data-media-lang="${escapeHtml(mediaLang)}"><span class="toolbar-check"></span><span>图片</span></button>
            <button type="button" data-insert-media="video" data-media-lang="${escapeHtml(mediaLang)}"><span class="toolbar-check"></span><span>视频</span></button>
            <button type="button" data-insert-media="audio" data-media-lang="${escapeHtml(mediaLang)}"><span class="toolbar-check"></span><span>音频</span></button>
            <button type="button" data-insert-media="gif" data-media-lang="${escapeHtml(mediaLang)}"><span class="toolbar-check"></span><span>动图</span></button>
          </div>
        </span>
        ${showTemplate ? `<span class="toolbar-menu guide-elements-menu" data-journey-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-journey-toolbar-menu-trigger="template">Template ▾</button>
          ${renderEditorTemplatePanel(templateKind, activeTemplate)}
        </span>` : ""}
        <span class="toolbar-menu guide-elements-menu" data-journey-toolbar-menu>
          <button class="secondary toolbar-menu-trigger" type="button" data-journey-toolbar-menu-trigger="journey">${escapeHtml(journeyLabel)}</button>
          <div class="toolbar-menu-panel" data-journey-toolbar-menu-panel hidden>
            ${dayInsertButton("experience", "Experience Flow")}
            ${dayInsertButton("timeline", "Timeline")}
            ${dayInsertButton("place", "Place")}
            ${dayInsertButton("food", "Food")}
            ${dayInsertButton("stay", "Stay")}
            ${dayInsertButton("tip", "Tips")}
            ${dayInsertButton("checklist", "Checklist")}
          </div>
        </span>
      </div>
      <span class="word-count" ${wordCountAttr}>0 字</span>
    </div>
  `;
}

function renderDayTemplateField(field, day = {}) {
  const [label, hint, rows, tone] = dayFieldMeta[field] || [field, "", 3, ""];
  if (field === "body") {
    return `
      <label class="day-story-field day-free-field ${escapeHtml(tone || "")}">
        <span>
          ${escapeHtml(label)}
          <button class="day-section-remove" type="button" data-remove-day-section="body">Remove</button>
        </span>
        ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
        <div class="day-free-editor" data-day-field="body" contenteditable="true">${editableDayHtml(dayBodyFromLegacy(day))}</div>
      </label>
    `;
  }
  return dayStoryField(field, label, hint, dayStructuredValue(day, field), rows).replace("day-story-field", `day-story-field ${escapeHtml(tone || "")}`);
}

function applyDayTemplateToOutline(day, templateId) {
  const template = getDayTemplate(templateId);
  day.template = isKnownDayTemplate(templateId) ? templateId : "free";
  day.outlineFields = [...(template.fields || [])];
  return day;
}

function dayTemplateCanvasText(templateId) {
  const template = getDayTemplate(templateId);
  const labels = {
    summary: "",
    highlights: "Today’s Highlights",
    timeline: "Route & Schedule",
    places: "Places to Visit",
    experience: "Local Experience",
    participation: "Guest Flow",
    food: "Food & Cafés",
    practical: "Practical Notes",
    tips: "Local Tips",
    arrival: "Arrival Details",
    transfer: "Transfer",
    hotel: "Hotel",
    eveningPlan: "Evening Plan",
    body: ""
  };
  return (template.fields || [])
    .map((field) => labels[field])
    .filter(Boolean)
    .join("\n\n");
}

function renderDayEditor() {
  const days = readItineraryDays();
  $("[name='itineraryDays']").value = JSON.stringify(days);
  if (state.currentExperienceDay >= days.length) state.currentExperienceDay = 0;
  renderDayListTitles(days);
  const day = normalizeItineraryDay(days[state.currentExperienceDay] || {}, state.currentExperienceDay);
  const templateId = inferDayTemplate(day);
  const displayTitle = cleanDayTitle(day.title || "", state.currentExperienceDay);
  renderDayToolbar(templateId);
  $("[data-day-fields]").innerHTML = `
    <input data-day-field="title" type="hidden" value="${escapeHtml(displayTitle)}" />
    <textarea data-day-field="summary" hidden>${escapeHtml(day.summary || "")}</textarea>
    <div class="document-editor journey-document-editor">
      <div class="visual-editor journey-visual-editor" data-visual-editor="journey" data-day-field="body" data-journey-visual-editor contenteditable="true" aria-label="Journey Day 正文">${editableDayHtml(dayCanvasText(day))}</div>
    </div>
    <input data-day-field="image" type="hidden" value="${escapeHtml(day.image || "")}" />
  `;
  updateDayWordCount();
  resetJourneyEditorHistory();
  renderItineraryPreview(days);
  focusEditorStart("[data-journey-visual-editor]");
}

function focusEditorStart(selector) {
  window.setTimeout(() => {
    const editor = $(selector);
    if (!editor || editor.closest(".is-hidden") || editor.closest(".is-section-hidden")) return;
    editor.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    state.lastVisualSelection = { lang: editor.dataset.visualEditor || state.currentGuideLang, range: range.cloneRange() };
  }, 80);
}

function focusActiveExperienceEditor() {
  if (state.activeExperienceSection !== "content") return;
  const type = $("[data-experience-type]")?.value || state.activeExperienceMode || "recommended_journey";
  const selector = type === "short_experience" ? "[data-short-visual-editor]" : "[data-journey-visual-editor]";
  focusEditorStart(selector);
}

function dayInsertButton(type, label) {
  return `<button class="secondary" type="button" data-insert-day-block="${escapeHtml(type)}">${escapeHtml(label)}</button>`;
}

function renderDayListTitles(days = parseJsonField($("[name='itineraryDays']")?.value, [])) {
  const list = $("[data-day-list]");
  if (!list) return;
  list.innerHTML = days.map((day, index) => `
    <button class="${index === state.currentExperienceDay ? "is-active" : ""}" type="button" data-select-day="${index}">
      <strong>Day ${index + 1}</strong>
    </button>
  `).join("");
}

function insertTextAtContentEditable(element, text) {
  if (!element) return;
  element.focus();
  const selection = window.getSelection();
  const savedRange = state.lastDaySelection?.element === element ? state.lastDaySelection.range : null;
  if (savedRange && element.contains(savedRange.commonAncestorContainer)) {
    selection?.removeAllRanges();
    selection?.addRange(savedRange);
  } else if (!selection?.rangeCount || !element.contains(selection.anchorNode)) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.setEndAfter(node);
  selection.removeAllRanges();
  selection.addRange(range);
  state.lastDaySelection = { element, range: range.cloneRange() };
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function getActiveJourneyEditor() {
  if (document.activeElement?.matches?.("[data-journey-visual-editor]")) return document.activeElement;
  return $("[data-journey-visual-editor]");
}

function rememberJourneySelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const node = selection.anchorNode;
  const editor = node?.nodeType === 1
    ? node.closest?.("[data-journey-visual-editor]")
    : node?.parentElement?.closest?.("[data-journey-visual-editor]");
  if (!editor || !editor.contains(selection.focusNode)) return;
  state.activeDayField = "body";
  state.lastDaySelection = { element: editor, range: selection.getRangeAt(0).cloneRange() };
}

function restoreJourneySelection() {
  const editor = getActiveJourneyEditor();
  const selection = window.getSelection();
  if (!editor || !selection) return editor;
  try {
    const range = state.lastDaySelection?.element === editor ? state.lastDaySelection.range.cloneRange() : null;
    editor.focus({ preventScroll: true });
    selection.removeAllRanges();
    if (range && editor.contains(range.commonAncestorContainer)) {
      selection.addRange(range);
    } else {
      const fallback = document.createRange();
      fallback.selectNodeContents(editor);
      fallback.collapse(false);
      selection.addRange(fallback);
      state.lastDaySelection = { element: editor, range: fallback.cloneRange() };
    }
  } catch {
    editor.focus({ preventScroll: true });
  }
  return editor;
}

function updateDayWordCount() {
  const editor = getActiveJourneyEditor();
  const count = (editor?.innerText || "").replace(/\s+/g, "").length;
  const node = $("[data-day-word-count]");
  if (node) node.textContent = `${count} 字`;
}

function resetJourneyEditorHistory() {
  const editor = getActiveJourneyEditor();
  state.journeyEditorHistory = { undo: [], redo: [], last: editor?.innerHTML || "" };
  const history = getEditorHistory("journey");
  history.undo = [];
  history.redo = [];
  history.last = editor?.innerHTML || "";
}

function pushJourneyHistory(beforeHtml, afterHtml) {
  if (beforeHtml === afterHtml) return;
  const history = state.journeyEditorHistory;
  if (history.undo[history.undo.length - 1] !== beforeHtml) history.undo.push(beforeHtml);
  if (history.undo.length > 80) history.undo.shift();
  history.redo = [];
  history.last = afterHtml;
}

function syncJourneyEditorState({ toast } = {}) {
  const days = readItineraryDays();
  $("[name='itineraryDays']").value = JSON.stringify(days);
  renderDayListTitles(days);
  renderItineraryPreview(days);
  updateDayWordCount();
  $("[data-experience-save-status]").textContent = "未保存";
  if (toast) showToast(toast);
}

function applyJourneyEditorHistory(command) {
  const editor = restoreJourneySelection();
  if (!editor) return;
  const history = state.journeyEditorHistory;
  const current = editor.innerHTML;
  if (command === "undo") {
    const previous = history.undo.pop();
    if (previous == null) {
      showToast("没有可撤回的内容");
      return;
    }
    history.redo.push(current);
    editor.innerHTML = previous;
    history.last = previous;
    syncJourneyEditorState({ toast: "已撤回" });
  }
  if (command === "redo") {
    const next = history.redo.pop();
    if (next == null) {
      showToast("没有可恢复的内容");
      return;
    }
    history.undo.push(current);
    editor.innerHTML = next;
    history.last = next;
    syncJourneyEditorState({ toast: "已恢复" });
  }
  rememberJourneySelection();
}

function insertJourneyHtml(html, toast) {
  const editor = restoreJourneySelection();
  if (!editor) return false;
  const beforeHtml = editor.innerHTML;
  document.execCommand("insertHTML", false, html);
  pushJourneyHistory(beforeHtml, editor.innerHTML);
  pushEditorHistory("journey", beforeHtml, editor.innerHTML);
  rememberJourneySelection();
  rememberVisualSelection();
  syncJourneyEditorState({ toast });
  return true;
}

function applyJourneyInlineFormat(kind, value = "") {
  const editor = restoreJourneySelection();
  if (!editor) return;
  const beforeHtml = editor.innerHTML;
  const selectedText = escapeHtml(window.getSelection()?.toString() || "");
  if (kind === "bold") document.execCommand("bold");
  if (kind === "size") {
    const label = BLOCK_STYLE_MAP[value]?.label || "Body";
    document.execCommand("insertHTML", false, `<span class="cms-text-size cms-text-size-${escapeHtml(value)}">${selectedText || label}</span>`);
  }
  if (kind === "color") {
    document.execCommand("insertHTML", false, `<span class="cms-text-color" data-color-value="${escapeHtml(value)}" style="color:${escapeHtml(value)}">${selectedText || "文字"}</span>`);
  }
  if (kind === "highlight") {
    if (value === "transparent") {
      document.execCommand("removeFormat");
    } else {
      document.execCommand("insertHTML", false, `<mark class="cms-highlight" data-highlight-value="${escapeHtml(value)}" style="background:${escapeHtml(value)}">${selectedText || "重点内容"}</mark>`);
    }
  }
  pushJourneyHistory(beforeHtml, editor.innerHTML);
  rememberJourneySelection();
  syncJourneyEditorState();
}

function journeyMediaPlaceholder(kind = "image") {
  const labels = { image: "图片", video: "视频", audio: "音频", gif: "动图" };
  const label = labels[kind] || "媒体";
  if (kind === "audio") return `<figure class="cms-media cms-editor-media cms-media-audio cms-audio" contenteditable="false"><figcaption>${label}</figcaption><audio controls></audio></figure><p><br></p>`;
  if (kind === "video") return `<figure class="cms-media cms-editor-media cms-media-video cms-video" contenteditable="false"><div class="cms-media-placeholder">视频模块</div></figure><p><br></p>`;
  return `<figure class="cms-media cms-editor-media cms-media-${escapeHtml(kind)}" contenteditable="false"><div class="cms-media-placeholder">插入${escapeHtml(label)}</div></figure><p><br></p>`;
}

function applyJourneyTemplate(templateId) {
  const text = dayTemplateCanvasText(templateId);
  if (!text.trim()) return;
  insertJourneyHtml(`<p>${escapeHtml(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`, `已插入 ${getDayTemplate(templateId).label}`);
}

function currentEditorTemplateSections(editor) {
  if (!editor) return [];
  const sections = [];
  editor.querySelectorAll("h1, h2, h3, .template-section-title strong, .journey-component h3").forEach((node) => {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (text && !sections.includes(text)) sections.push(text);
  });
  return sections.length ? sections : ["Overview"];
}

function saveCurrentEditorTemplate(kind = "journey") {
  const editor = kind === "experience" ? $("[data-short-visual-editor]") : getActiveJourneyEditor();
  const label = window.prompt("Template name", kind === "experience" ? "My Experience Template" : "My Journey Template");
  if (!label?.trim()) return;
  const templates = storedEditorTemplates(kind);
  const idBase = experienceSlugFromTitle(label.trim()) || `template-${Date.now()}`;
  const nextTemplate = {
    id: `custom-${idBase}-${Date.now().toString(36)}`,
    label: label.trim(),
    description: `Saved from your current ${templateKindTitle(kind)} structure.`,
    sections: currentEditorTemplateSections(editor)
  };
  localStorage.setItem(templateStorageKey(kind), JSON.stringify([...templates, nextTemplate].slice(-30)));
  renderDayToolbar("free", {
    target: kind === "experience" ? "[data-short-toolbar]" : "[data-day-toolbar]",
    mediaLang: kind === "experience" ? "short" : "journey",
    wordCountAttr: kind === "experience" ? "data-short-word-count" : "data-day-word-count",
    journeyLabel: kind === "experience" ? "添加体验模块 +" : "添加旅行模块 +",
    showTemplate: true,
    templateKind: kind
  });
  showToast(`已保存模板：${nextTemplate.label}`);
}

function applyEditorTemplate(kind = "journey", templateId = "") {
  const template = getEditorTemplate(kind, templateId);
  if (!template) return;
  const html = templateHtmlFromSections(templateSections(template));
  if (!html.trim()) {
    showToast("Free Format 是空白模式，不会插入内容");
    return;
  }
  if (kind === "experience") {
    insertHtmlIntoVisualAtSelection(html, "short");
    updateShortWordCount();
    showToast(`已插入 ${template.label}`);
    return;
  }
  insertJourneyHtml(html, `已插入 ${template.label}`);
}

function dayBlockSnippet(type) {
  return {
    text: "\n\n",
    heading: "\n\nSection Title\n",
    highlight: "\n\nHighlight\nAdd the day's most memorable experience.\n",
    timeline: "\n\nTimeline\n09:30 — Add route moment here.\n",
    place: "\n\nPlace\nLocation name\nWhy visit / Best time / Stay time.\n",
    experience: "\n\nExperience\nWhat guests do, feel or discover here.\n",
    food: "\n\nFood\nRestaurant / cafe name and reservation notes.\n",
    stay: "\n\nStay\nHotel area, check-in timing or comfort notes.\n",
    tip: "\n\nTip\nAdd a practical local suggestion here.\n",
    checklist: "\n\nChecklist\n- Item one\n- Item two\n- Item three\n",
    video: "\n\nVideo\nPaste video URL or upload a travel clip here.\n"
  }[type] || "\n\nNew block\n";
}

function activeDayTextTarget() {
  const active = document.activeElement;
  if (active?.matches?.("[data-short-visual-editor]")) return active;
  if (active?.matches?.("[data-day-field]") && active.type !== "hidden") return active;
  const remembered = state.activeDayField ? $(`[data-day-field="${state.activeDayField}"]:not([type="hidden"])`) : null;
  if (remembered) return remembered;
  return $(".day-free-canvas") || $(".day-free-editor") || $("[data-day-field='body']") || $("[data-short-visual-editor]") || $(".day-story-field textarea");
}

function insertTextIntoDayTarget(target, text) {
  if (!target) return false;
  state.activeDayField = target.dataset.dayField || "body";
  if (target.isContentEditable) {
    insertTextAtContentEditable(target, text);
    return true;
  }
  if ("value" in target) {
    insertTextIntoTextarea(target, text);
    return true;
  }
  return false;
}

function appendDayModuleSnippet(type) {
  const detailEditor = document.activeElement?.matches?.("[data-detail-visual-editor]")
    ? document.activeElement
    : (state.lastVisualSelection?.lang === "details" ? $("[data-detail-visual-editor]") : null);
  if (detailEditor) {
    insertHtmlIntoVisualAtSelection(dayBlockHtml(type), "details");
    updateDetailWordCount();
    return;
  }
  const shortEditor = document.activeElement?.matches?.("[data-short-visual-editor]")
    ? document.activeElement
    : (state.lastVisualSelection?.lang === "short" || $("[data-experience-type]")?.value === "short_experience" ? $("[data-short-visual-editor]") : null);
  if (shortEditor) {
    insertHtmlIntoVisualAtSelection(dayBlockHtml(type), "short");
    return;
  }
  const target = activeDayTextTarget();
  if (target?.matches?.("[data-journey-visual-editor]")) {
    insertJourneyHtml(dayBlockHtml(type), "已插入行程组件");
    return;
  }
  if (insertTextIntoDayTarget(target, dayBlockSnippet(type))) {
    return;
  }
  const days = readItineraryDays();
  const index = state.currentExperienceDay;
  days[index] ||= defaultItineraryDay(index);
  days[index].body = `${days[index].body || ""}${dayBlockSnippet(type)}`.trimStart();
  days[index].template = "custom";
  $("[name='itineraryDays']").value = JSON.stringify(days);
  renderDayEditor();
}

function journeyComponentHtml(type, title, body, icon = "") {
  return `<section class="journey-component journey-component-${escapeHtml(type)}" data-journey-component="${escapeHtml(type)}" contenteditable="true">
    <h3>${icon ? `<span>${escapeHtml(icon)}</span>` : ""}${escapeHtml(title)}</h3>
    ${body}
  </section><p><br></p>`;
}

function dayBlockHtml(type = "experience") {
  const blocks = {
    experience: journeyComponentHtml("experience", "Experience Flow", `
      <ol class="journey-flow-list">
        <li><strong>Coffee & Introduction</strong><p>Meet your host at a calm local cafe.</p></li>
        <li><strong>Neighborhood Walk</strong><p>Move through quieter streets and local shops.</p></li>
        <li><strong>Photo Moments</strong><p>Leave time for relaxed photos and flexible stops.</p></li>
      </ol>
    `, "✨"),
    timeline: journeyComponentHtml("timeline", "Route & Schedule", `
      <div class="journey-timeline-list">
        <p><strong>09:30</strong><span>Airport pickup or hotel departure.</span></p>
        <p><strong>14:00</strong><span>Neighborhood walk and local experience.</span></p>
        <p><strong>19:00</strong><span>Dinner or evening view.</span></p>
      </div>
    `, "🗺"),
    place: journeyComponentHtml("place", "Place Card", `
      <p><strong>Place name</strong></p>
      <p>Why visit: describe why this stop matters.</p>
      <p>Best time: morning / afternoon / evening.</p>
      <p>Stay: about 1 hour.</p>
    `, "📍"),
    food: journeyComponentHtml("food", "Food Stop", `
      <p><strong>Restaurant or cafe name</strong></p>
      <p>Why recommended: signature dish, atmosphere or reservation note.</p>
      <p>Price range: add a simple budget reference.</p>
    `, "🍜"),
    stay: journeyComponentHtml("stay", "Stay", `
      <p><strong>Hotel / Area</strong></p>
      <p>Why stay here: comfort, location, views or transport convenience.</p>
      <p>Check-in note: add timing or room preference.</p>
    `, "🏨"),
    tip: calloutHtml("tip", "Local Tip", "Add a practical local suggestion here."),
    checklist: journeyComponentHtml("checklist", "Checklist", `
      <ul>
        <li>Confirm passport and payment setup.</li>
        <li>Save hotel address in Chinese.</li>
        <li>Keep timing flexible for traffic.</li>
      </ul>
    `)
  };
  return blocks[type] || blocks.experience;
}

function renderItineraryPreview(days = parseJsonField($("[name='itineraryDays']")?.value, [])) {
  const node = $("[data-itinerary-preview]");
  if (!node) return;
  node.innerHTML = `
    <div class="preview-drawer-head">
      <div>
        <p class="eyebrow">Preview</p>
        <h5>用户看到的行程节奏</h5>
      </div>
      <button class="secondary" type="button" data-close-itinerary-preview>关闭</button>
    </div>
    <div class="itinerary-preview-list">
      ${days.map((day, index) => `
        <article class="${index === state.currentExperienceDay ? "is-active" : ""}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${escapeHtml(day.title || `Day ${index + 1}`)}</strong>
            ${day.summary ? `<p><b>Summary</b>${escapeHtml(day.summary)}</p>` : ""}
            ${day.highlights ? `<p><b>Highlights</b>${escapeHtml(day.highlights).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.timeline ? `<p><b>Timeline</b>${escapeHtml(day.timeline).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.places ? `<p><b>Places</b>${escapeHtml(day.places).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.experience ? `<p><b>Experience</b>${escapeHtml(day.experience).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.participation ? `<p><b>Participation</b>${escapeHtml(day.participation).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.food ? `<p><b>Food</b>${escapeHtml(day.food).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.practical ? `<p><b>Practical</b>${escapeHtml(day.practical).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.tips ? `<p><b>Tips</b>${escapeHtml(day.tips).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.arrival ? `<p><b>Arrival</b>${escapeHtml(day.arrival).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.transfer ? `<p><b>Transfer</b>${escapeHtml(day.transfer).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.hotel ? `<p><b>Hotel</b>${escapeHtml(day.hotel).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.eveningPlan ? `<p><b>Evening</b>${escapeHtml(day.eveningPlan).replace(/\n/g, "<br>")}</p>` : ""}
            ${day.body ? `<div class="trip-day-body">${looksLikeHtmlContent(day.body) ? day.body : escapeHtml(day.body).replace(/\n/g, "<br>")}</div>` : (!(day.summary || day.highlights || day.timeline || day.places || day.experience || day.participation || day.food || day.practical || day.tips || day.arrival || day.transfer || day.hotel || day.eveningPlan) ? `
              ${day.morning ? `<p><b>Morning</b>${escapeHtml(day.morning)}</p>` : ""}
              ${day.afternoon ? `<p><b>Afternoon</b>${escapeHtml(day.afternoon)}</p>` : ""}
              ${day.evening ? `<p><b>Evening</b>${escapeHtml(day.evening)}</p>` : ""}
            ` : "")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function readShortDetails() {
  const existing = parseJsonField($("[name='shortDetails']")?.value, {});
  const details = { ...existing };
  $$("[data-short-field]").forEach((field) => {
    const key = field.dataset.shortField;
    details[key] = "value" in field ? field.value : editorHtmlForSave(field);
  });
  return details;
}

function renderShortEditor() {
  const details = parseJsonField($("[name='shortDetails']")?.value, {});
  renderDayToolbar("free", {
    target: "[data-short-toolbar]",
    mediaLang: "short",
    wordCountAttr: "data-short-word-count",
    journeyLabel: "添加体验模块 +",
    showTemplate: true,
    templateKind: "experience"
  });
  const shortEditor = $("[data-short-editor]");
  if (shortEditor) {
    shortEditor.querySelector(".short-editor-shell").innerHTML = `
      <input data-short-field="location" type="hidden" value="${escapeHtml(details.location || "")}" />
      <input data-short-field="bookingMethod" type="hidden" value="${escapeHtml(details.bookingMethod || "")}" />
      <div class="document-editor journey-document-editor">
        <div class="visual-editor journey-visual-editor" data-visual-editor="short" data-short-field="body" data-short-visual-editor contenteditable="true" aria-label="Short Experience 正文">${editableDayHtml(shortBodyFromDetails(details))}</div>
      </div>
    `;
  }
  $$("[data-short-field]").forEach((field) => {
    const key = field.dataset.shortField;
    if ("value" in field) {
      field.value = details[key] || "";
    } else if (key === "body") {
      field.innerHTML = editableDayHtml(shortBodyFromDetails(details));
    } else {
      field.innerHTML = editableDayHtml(details[key] || "");
    }
  });
  resetEditorHistory("short");
  updateShortWordCount();
  focusEditorStart("[data-short-visual-editor]");
}

function shortBodyFromDetails(details = {}) {
  if (details.body) return details.body;
  return "";
}

function updateShortWordCount() {
  const editor = $("[data-short-visual-editor]");
  const count = (editor?.innerText || "").replace(/\s+/g, "").length;
  const node = $("[data-short-word-count]");
  if (node) node.textContent = `${count} 字`;
}

function linesFromList(items = []) {
  return (Array.isArray(items) ? items : []).filter(Boolean).join("\n");
}

function listFromLines(value = "") {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitEditorialLine(line = "") {
  const parts = String(line).split(/\s+[—–-]\s+/);
  return [parts.shift()?.trim() || "", parts.join(" — ").trim()];
}

function titleDescriptionFromLines(value = "") {
  return listFromLines(value).map((line) => {
    const [title, description] = splitEditorialLine(line);
    return { title, description };
  }).filter((item) => item.title || item.description);
}

function linesFromTitleDescription(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => [item.title, item.description].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("\n");
}

function reviewsFromLines(value = "") {
  return listFromLines(value).map((line) => {
    const [text, context] = splitEditorialLine(line);
    return { text, context };
  }).filter((item) => item.text || item.context);
}

function linesFromReviews(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => [item.text || item.quote, item.context || item.travelerType].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("\n");
}

function faqsFromLines(value = "") {
  return listFromLines(value).map((line) => {
    const [question, answer] = splitEditorialLine(line);
    return { question, answer };
  }).filter((item) => item.question || item.answer);
}

function linesFromFaqs(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => [item.question, item.answer].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("\n");
}

function readExperienceDetailContent() {
  syncActiveDetailEditorToFields();
  const flow = titleDescriptionFromLines($("[data-experience-lines='experienceFlow']")?.value || "");
  const details = titleDescriptionFromLines($("[data-experience-lines='experienceDetails']")?.value || "");
  const included = listFromLines($("[data-experience-list='includedSupport']")?.value || "");
  const notIncluded = listFromLines($("[data-experience-list='notIncluded']")?.value || "");
  const reviews = reviewsFromLines($("[data-experience-lines='reviews']")?.value || "");
  const faqs = faqsFromLines($("[data-experience-lines='faqs']")?.value || "");
  const expert = {};
  $$("[data-expert-field]").forEach((field) => {
    expert[field.dataset.expertField] = field.value.trim();
  });
  const cta = {};
  $$("[data-cta-field]").forEach((field) => {
    cta[field.dataset.ctaField] = field.value.trim();
  });
  return { flow, details, included, notIncluded, reviews, faqs, expert, cta };
}

function renderExperienceDetailContent(item = {}) {
  const flow = $("[data-experience-lines='experienceFlow']");
  if (flow) flow.value = linesFromTitleDescription(item.experienceFlow || []);
  const details = $("[data-experience-lines='experienceDetails']");
  if (details) details.value = linesFromTitleDescription(item.experienceDetails || []);
  const included = $("[data-experience-list='includedSupport']");
  if (included) included.value = linesFromList(item.includedSupport || []);
  const notIncluded = $("[data-experience-list='notIncluded']");
  if (notIncluded) notIncluded.value = linesFromList(item.notIncluded || []);
  const reviews = $("[data-experience-lines='reviews']");
  if (reviews) reviews.value = linesFromReviews(item.reviews || []);
  const faqs = $("[data-experience-lines='faqs']");
  if (faqs) faqs.value = linesFromFaqs(item.faqs || []);
  const expert = item.expert || {};
  $$("[data-expert-field]").forEach((field) => {
    field.value = expert[field.dataset.expertField] || "";
  });
  const cta = item.cta || {};
  $$("[data-cta-field]").forEach((field) => {
    field.value = cta[field.dataset.ctaField] || "";
  });
  renderDetailEditorCanvas();
}

function detailSectionDefinitions() {
  return {
    expect: {
      title: "What To Expect",
      read: () => linesFromTitleDescription(titleDescriptionFromLines($("[data-experience-lines='experienceDetails']")?.value || "")),
      write: (text) => {
        const node = $("[data-experience-lines='experienceDetails']");
        if (node) node.value = text;
      }
    },
    included: {
      title: "Included / Not Included",
      read: () => {
        const included = $("[data-experience-list='includedSupport']")?.value || "";
        const notIncluded = $("[data-experience-list='notIncluded']")?.value || "";
        return [included ? `Included\n${included}` : "", notIncluded ? `Not Included\n${notIncluded}` : ""].filter(Boolean).join("\n\n");
      },
      write: (text) => {
        const normalized = String(text || "").replace(/\u00a0/g, " ");
        const parts = normalized.split(/\n\s*\n/);
        const includedPart = parts.find((part) => /^Included\b/i.test(part)) || "";
        const notIncludedPart = parts.find((part) => /^Not Included\b/i.test(part)) || "";
        const included = includedPart.replace(/^Included\s*/i, "").trim() || (!includedPart && !notIncludedPart ? normalized.trim() : "");
        const notIncluded = notIncludedPart.replace(/^Not Included\s*/i, "").trim();
        if ($("[data-experience-list='includedSupport']")) $("[data-experience-list='includedSupport']").value = included;
        if ($("[data-experience-list='notIncluded']")) $("[data-experience-list='notIncluded']").value = notIncluded;
      }
    },
    faq: {
      title: "FAQ",
      read: () => linesFromFaqs(faqsFromLines($("[data-experience-lines='faqs']")?.value || "")),
      write: (text) => {
        const node = $("[data-experience-lines='faqs']");
        if (node) node.value = text;
      }
    },
    reviews: {
      title: "Reviews",
      read: () => linesFromReviews(reviewsFromLines($("[data-experience-lines='reviews']")?.value || "")),
      write: (text) => {
        const node = $("[data-experience-lines='reviews']");
        if (node) node.value = text;
      }
    }
  };
}

function renderDetailToolbar(active = state.currentExperienceDetail || "expect") {
  const toolbar = $("[data-detail-toolbar]");
  if (!toolbar) return;
  if (active === "expect") {
    renderDayToolbar("free", {
      target: "[data-detail-toolbar]",
      mediaLang: "details",
      wordCountAttr: "data-detail-word-count",
      journeyLabel: "添加详情模块 +",
      showTemplate: false
    });
    return;
  }
  toolbar.innerHTML = `
    <div class="markdown-toolbar detail-structured-toolbar">
      <div class="editor-tool-group">
        <span class="toolbar-section-label">编辑</span>
        <span class="toolbar-section-label">${escapeHtml(detailSectionDefinitions()[active]?.title || "Details")}</span>
      </div>
      <span class="word-count" data-detail-word-count>0 项</span>
    </div>
  `;
}

function setHiddenFieldValue(selector, value = "") {
  const node = $(selector);
  if (node) node.value = value;
}

function detailStructuredValues() {
  return {
    included: listFromLines($("[data-experience-list='includedSupport']")?.value || ""),
    notIncluded: listFromLines($("[data-experience-list='notIncluded']")?.value || ""),
    faqs: faqsFromLines($("[data-experience-lines='faqs']")?.value || ""),
    reviews: reviewsFromLines($("[data-experience-lines='reviews']")?.value || "")
  };
}

function structuredDetailItemHtml(type, item, index) {
  if (type === "faq") {
    return `
      <article class="detail-structured-card" data-detail-item="faq" data-index="${index}">
        <label>
          <span>Question</span>
          <input data-detail-faq-field="question" value="${escapeHtml(item.question || "")}" placeholder="What should travelers know?" />
        </label>
        <label>
          <span>Answer</span>
          <textarea rows="3" data-detail-faq-field="answer" placeholder="Write a clear answer for travelers.">${escapeHtml(item.answer || "")}</textarea>
        </label>
        <button class="text-button" type="button" data-remove-detail-item="faq" data-index="${index}">删除</button>
      </article>
    `;
  }
  if (type === "reviews") {
    return `
      <article class="detail-structured-card" data-detail-item="reviews" data-index="${index}">
        <label>
          <span>Review</span>
          <textarea rows="3" data-detail-review-field="text" placeholder="Traveler review content.">${escapeHtml(item.text || item.quote || "")}</textarea>
        </label>
        <label>
          <span>Traveler / Context</span>
          <input data-detail-review-field="context" value="${escapeHtml(item.context || item.travelerType || "")}" placeholder="Family traveler · May 2026" />
        </label>
        <button class="text-button" type="button" data-remove-detail-item="reviews" data-index="${index}">删除</button>
      </article>
    `;
  }
  return "";
}

function renderIncludedEditor(values = detailStructuredValues()) {
  return `
    <div class="detail-structured-editor detail-list-editor">
      ${[
        ["includedSupport", "Included", "Airport pickup"],
        ["notIncluded", "Not Included", "International flights"]
      ].map(([key, title, placeholder]) => `
        <section class="detail-structured-section" data-detail-list-section="${key}">
          <div class="detail-structured-head">
            <h5>${title}</h5>
            <button class="secondary" type="button" data-add-detail-item="${key}">+ Add item</button>
          </div>
          <div class="detail-list-items">
            ${(key === "includedSupport" ? values.included : values.notIncluded).map((item, index) => `
              <div class="detail-list-row" data-detail-list-row="${key}">
                <span>${key === "includedSupport" ? "✓" : "×"}</span>
                <input data-detail-list-input="${key}" value="${escapeHtml(item)}" placeholder="${escapeHtml(placeholder)}" />
                <button class="text-button" type="button" data-remove-detail-item="${key}" data-index="${index}">删除</button>
              </div>
            `).join("") || `<p class="empty">还没有条目。</p>`}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderFaqEditor(values = detailStructuredValues()) {
  const faqs = values.faqs.length ? values.faqs : [{ question: "", answer: "" }];
  return `
    <div class="detail-structured-editor">
      <div class="detail-structured-head">
        <h5>FAQ</h5>
        <button class="secondary" type="button" data-add-detail-item="faq">+ Add Question</button>
      </div>
      ${faqs.map((item, index) => structuredDetailItemHtml("faq", item, index)).join("")}
    </div>
  `;
}

function renderReviewsEditor(values = detailStructuredValues()) {
  const reviews = values.reviews.length ? values.reviews : [{ text: "", context: "" }];
  return `
    <div class="detail-structured-editor">
      <div class="detail-structured-head">
        <h5>Reviews</h5>
        <button class="secondary" type="button" data-add-detail-item="reviews">+ Add Review</button>
      </div>
      ${reviews.map((item, index) => structuredDetailItemHtml("reviews", item, index)).join("")}
    </div>
  `;
}

function syncStructuredDetailEditor(active = state.currentExperienceDetail || "included") {
  if (active === "included") {
    const included = $$("[data-detail-list-input='includedSupport']").map((input) => input.value.trim()).filter(Boolean);
    const notIncluded = $$("[data-detail-list-input='notIncluded']").map((input) => input.value.trim()).filter(Boolean);
    setHiddenFieldValue("[data-experience-list='includedSupport']", linesFromList(included));
    setHiddenFieldValue("[data-experience-list='notIncluded']", linesFromList(notIncluded));
  }
  if (active === "faq") {
    const faqs = $$("[data-detail-item='faq']").map((card) => ({
      question: card.querySelector("[data-detail-faq-field='question']")?.value.trim() || "",
      answer: card.querySelector("[data-detail-faq-field='answer']")?.value.trim() || ""
    })).filter((item) => item.question || item.answer);
    setHiddenFieldValue("[data-experience-lines='faqs']", linesFromFaqs(faqs));
  }
  if (active === "reviews") {
    const reviews = $$("[data-detail-item='reviews']").map((card) => ({
      text: card.querySelector("[data-detail-review-field='text']")?.value.trim() || "",
      context: card.querySelector("[data-detail-review-field='context']")?.value.trim() || ""
    })).filter((item) => item.text || item.context);
    setHiddenFieldValue("[data-experience-lines='reviews']", linesFromReviews(reviews));
  }
}

function syncActiveDetailEditorToFields() {
  const active = state.currentExperienceDetail || "expect";
  if (active !== "expect") {
    syncStructuredDetailEditor();
    return;
  }
  const editor = $("[data-detail-visual-editor]");
  if (!editor) return;
  const definition = detailSectionDefinitions().expect;
  definition.write((editor.innerText || "").replace(/\u00a0/g, " ").trim());
}

function renderDetailEditorCanvas() {
  const active = state.currentExperienceDetail || "expect";
  renderDetailToolbar(active);
  $$("[data-detail-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.detailTab === active));
  $$("[data-detail-mode]").forEach((node) => node.classList.toggle("is-hidden", node.dataset.detailMode !== active));
  if (active === "expect") {
    const editor = $("[data-detail-visual-editor]");
    if (!editor) return;
    const definition = detailSectionDefinitions().expect;
    editor.innerHTML = editableDayHtml(definition.read() || "");
    resetEditorHistory("details");
    focusEditorStart("[data-detail-visual-editor]");
  } else {
    const container = $(`[data-detail-mode="${active}"]`);
    if (!container) return;
    if (active === "included") container.innerHTML = renderIncludedEditor();
    if (active === "faq") container.innerHTML = renderFaqEditor();
    if (active === "reviews") container.innerHTML = renderReviewsEditor();
  }
  updateDetailWordCount();
}

function updateDetailWordCount() {
  const node = $("[data-detail-word-count]");
  if (!node) return;
  const active = state.currentExperienceDetail || "expect";
  if (active === "expect") {
    const editor = $("[data-detail-visual-editor]");
    node.textContent = `${(editor?.innerText || "").replace(/\s+/g, "").length} 字`;
    return;
  }
  const values = detailStructuredValues();
  if (active === "included") node.textContent = `${values.included.length + values.notIncluded.length} 项`;
  if (active === "faq") node.textContent = `${values.faqs.length} 问`;
  if (active === "reviews") node.textContent = `${values.reviews.length} 条`;
}

function getSelectedExperienceTags() {
  return $$("[data-experience-tag] input:checked").map((input) => input.value);
}

function renderExperienceTags(tags = []) {
  const allTags = [...new Set([...experienceTagOptions, ...tags])];
  $("[data-experience-tags]").innerHTML = allTags.map((tag) => `
    <label data-experience-tag>
      <input type="checkbox" value="${escapeHtml(tag)}" ${tags.includes(tag) ? "checked" : ""} />
      <span>${escapeHtml(tag)}</span>
    </label>
  `).join("");
}

function renderExperienceImages(experience) {
  const cover = experience.coverImage;
  const meta = experienceModeMeta(experience.type);
  $("[data-experience-cover-preview]").innerHTML = cover
    ? `<img src="/${escapeHtml(String(cover).replace(/^\/+/, ""))}" alt="">`
    : `<div class="city-upload-empty"><span>+</span><strong>封面图</strong><small>用于${escapeHtml(meta.editLabel)}卡片和详情页视觉。</small></div>`;
  const normalizedCover = String(cover || "").replace(/^\/+/, "");
  const gallery = (experience.galleryImages || [])
    .map((src, index) => ({ src, index }))
    .filter((item) => String(item.src || "").replace(/^\/+/, "") !== normalizedCover);
  $("[data-experience-gallery]").innerHTML = gallery.map(({ src, index }) => `
    <figure>
      <img src="/${escapeHtml(String(src).replace(/^\/+/, ""))}" alt="" />
      <button class="secondary" type="button" data-remove-experience-gallery="${index}">删除</button>
    </figure>
  `).join("") || "<p class='empty'>暂无图片组。</p>";
}

function renderJourneyCardPreview(item = syncExperienceForm()) {
  renderExperienceSectionPreview(item, state.experiencePreviewSource || state.activeExperienceSection || "content");
}

function previewTextBlock(value = "", fallback = "还没有内容。") {
  const text = String(value || "").replace(/\u00a0/g, " ").trim();
  return text ? escapeHtml(text).replace(/\n/g, "<br>") : `<span class="empty-inline">${escapeHtml(fallback)}</span>`;
}

function renderExperienceContentPreview(item = syncExperienceForm()) {
  const meta = experienceModeMeta(item.type);
  if (item.type === "short_experience") {
    const body = readShortDetails().body || "";
    return `
      <article class="section-preview-article">
        <p class="eyebrow">${escapeHtml(meta.editLabel)}</p>
        <h3>${escapeHtml(item.title || "Untitled Experience")}</h3>
        <div class="section-preview-body">${body ? body : "<p class='empty'>短体验正文还没有内容。</p>"}</div>
      </article>
    `;
  }
  const days = readItineraryDays();
  return `
    <article class="section-preview-article">
      <p class="eyebrow">Journey</p>
      <h3>${escapeHtml(item.title || "Untitled Journey")}</h3>
      <div class="section-preview-timeline">
        ${days.map((day, index) => `
          <section>
            <span>${String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>${escapeHtml(day.title || `Day ${index + 1}`)}</strong>
              ${day.body ? `<div>${day.body}</div>` : `<p>${previewTextBlock([day.summary, day.highlights, day.timeline, day.places].filter(Boolean).join("\n"), "这一天还没有正文内容。")}</p>`}
            </div>
          </section>
        `).join("")}
      </div>
    </article>
  `;
}

function renderExperienceDetailsPreview() {
  syncActiveDetailEditorToFields();
  const active = state.currentExperienceDetail || "expect";
  const values = detailStructuredValues();
  if (active === "included") {
    return `
      <article class="section-preview-article">
        <p class="eyebrow">Details</p>
        <h3>Included / Not Included</h3>
        <div class="section-preview-columns">
          <section>
            <h4>Included</h4>
            <ul>${values.included.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li class='empty-inline'>还没有 Included 条目。</li>"}</ul>
          </section>
          <section>
            <h4>Not Included</h4>
            <ul>${values.notIncluded.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li class='empty-inline'>还没有 Not Included 条目。</li>"}</ul>
          </section>
        </div>
      </article>
    `;
  }
  if (active === "faq") {
    return `
      <article class="section-preview-article">
        <p class="eyebrow">Details</p>
        <h3>FAQ</h3>
        <div class="section-preview-list">
          ${values.faqs.map((item) => `
            <section>
              <strong>${escapeHtml(item.question || "Question")}</strong>
              <p>${previewTextBlock(item.answer, "还没有答案。")}</p>
            </section>
          `).join("") || "<p class='empty'>还没有 FAQ。</p>"}
        </div>
      </article>
    `;
  }
  if (active === "reviews") {
    return `
      <article class="section-preview-article">
        <p class="eyebrow">Details</p>
        <h3>Reviews</h3>
        <div class="section-preview-list">
          ${values.reviews.map((item) => `
            <blockquote>
              <p>${previewTextBlock(item.text || item.quote, "还没有评价内容。")}</p>
              <cite>${escapeHtml(item.context || item.travelerType || "Traveler")}</cite>
            </blockquote>
          `).join("") || "<p class='empty'>还没有 Reviews。</p>"}
        </div>
      </article>
    `;
  }
  const body = detailSectionDefinitions().expect.read();
  return `
    <article class="section-preview-article">
      <p class="eyebrow">Details</p>
      <h3>What To Expect</h3>
      <div class="section-preview-body">${previewTextBlock(body, "What To Expect 还没有内容。")}</div>
    </article>
  `;
}

function renderExperienceMediaPreview(item = syncExperienceForm()) {
  const cover = String(item.coverImage || "").replace(/^\/+/, "");
  const images = (item.galleryImages || [])
    .map((src) => String(src || "").replace(/^\/+/, ""))
    .filter((src) => src && src !== cover);
  return `
    <article class="section-preview-article">
      <p class="eyebrow">Gallery / Moments</p>
      <h3>前台素材区域</h3>
      ${cover ? `<figure class="section-preview-cover"><img src="/${escapeHtml(cover)}" alt="" /><figcaption>Cover Image</figcaption></figure>` : "<p class='empty'>还没有封面图。</p>"}
      <div class="section-preview-gallery">
        ${images.map((src) => `<img src="/${escapeHtml(src)}" alt="" />`).join("") || "<p class='empty'>Moments Gallery 还没有图片。</p>"}
      </div>
    </article>
  `;
}

function renderExperienceSettingsPreview(item = syncExperienceForm()) {
  return `
    <article class="section-preview-article">
      <p class="eyebrow">Page Settings</p>
      <h3>${escapeHtml(item.title || "Untitled")}</h3>
      <dl class="section-preview-meta">
        <div><dt>URL</dt><dd>/trips/${escapeHtml(item.slug || "")}</dd></div>
        <div><dt>City</dt><dd>${escapeHtml(item.city || "未选择")}</dd></div>
        <div><dt>Status</dt><dd>${item.published === "false" || item.published === false ? "草稿" : "已发布"}</dd></div>
        <div><dt>Type</dt><dd>${escapeHtml(experienceModeMeta(item.type).editLabel)}</dd></div>
      </dl>
    </article>
  `;
}

function renderExperienceSectionPreview(item = syncExperienceForm(), source = "content") {
  const title = item.title || `未命名${experienceModeMeta(item.type).editLabel}`;
  const mode = $("[data-journey-card-preview]")?.dataset.previewMode || "desktop";
  const labels = {
    content: item.type === "short_experience" ? "短体验正文预览" : "Journey 内容预览",
    modules: "Details 局部预览",
    media: "Gallery / Moments 局部预览",
    settings: "页面设置预览",
    preview: "当前部分前台预览"
  };
  const titleNode = $("[data-section-preview-title]");
  const eyebrowNode = $("[data-section-preview-eyebrow]");
  if (titleNode) titleNode.textContent = labels[source] || labels.content;
  if (eyebrowNode) eyebrowNode.textContent = "Section Preview";
  const body = {
    content: () => renderExperienceContentPreview(item),
    modules: () => renderExperienceDetailsPreview(),
    media: () => renderExperienceMediaPreview(item),
    settings: () => renderExperienceSettingsPreview(item)
  }[source]?.() || renderExperienceContentPreview(item);
  $("[data-journey-card-preview]").innerHTML = `
    <div class="frontend-preview-frame section-preview-frame ${escapeHtml(mode)}" aria-label="${escapeHtml(title)} ${escapeHtml(labels[source] || labels.content)}">
      ${body}
    </div>
  `;
}

function syncExperienceForm() {
  const form = $("[data-experience-form]");
  const values = formValues(form);
  const detailContent = readExperienceDetailContent();
  values.itineraryDays = readItineraryDays();
  values.shortDetails = readShortDetails();
  values.experienceFlow = detailContent.flow;
  values.experienceDetails = detailContent.details;
  values.includedSupport = detailContent.included;
  values.notIncluded = detailContent.notIncluded;
  values.reviews = detailContent.reviews;
  values.faqs = detailContent.faqs;
  values.expert = detailContent.expert;
  values.cta = detailContent.cta;
  values.tags = getSelectedExperienceTags();
  values.galleryImages = csvToList(form.galleryImages.value);
  values.contentBlocks = values.itineraryDays.map((day, index) => ({
    id: `day-${index + 1}`,
    type: "itinerary_day",
    title: day.title || `Day ${index + 1}`,
    template: day.template || inferDayTemplate(day),
    outlineFields: Array.isArray(day.outlineFields) ? day.outlineFields : [],
    summary: day.summary || "",
    highlights: day.highlights || "",
    timeline: day.timeline || "",
    places: day.places || "",
    experience: day.experience || "",
    participation: day.participation || "",
    food: day.food || "",
    practical: day.practical || "",
    tips: day.tips || "",
    arrival: day.arrival || "",
    transfer: day.transfer || "",
    hotel: day.hotel || "",
    eveningPlan: day.eveningPlan || "",
    body: day.body || day.stayNotes || "",
    morning: day.morning || "",
    afternoon: day.afternoon || "",
    evening: day.evening || "",
    stayNotes: day.stayNotes || "",
    image: day.image || ""
  }));
  form.itineraryDays.value = JSON.stringify(values.itineraryDays);
  form.shortDetails.value = JSON.stringify(values.shortDetails);
  form.experienceFlow.value = JSON.stringify(values.experienceFlow);
  form.experienceDetails.value = JSON.stringify(values.experienceDetails);
  form.includedSupport.value = JSON.stringify(values.includedSupport);
  form.notIncluded.value = JSON.stringify(values.notIncluded);
  form.reviews.value = JSON.stringify(values.reviews);
  form.faqs.value = JSON.stringify(values.faqs);
  form.expert.value = JSON.stringify(values.expert);
  form.cta.value = JSON.stringify(values.cta);
  form.contentBlocks.value = JSON.stringify(values.contentBlocks);
  form.tags.value = listToCsv(values.tags);
  return values;
}

async function loadMedia() {
  state.media = (await api("/api/admin/media")).data;
  const query = $("[data-media-search]")?.value || "";
  const category = $("[data-media-category-filter]")?.value || "";
  const items = filterMediaItems(query, category);
  const list = $("[data-media-list]");
  if (!list) return;
  list.innerHTML = items.map((item) => `
    <article class="media-item">
      ${mediaPreviewMarkup(item)}
      <strong>${escapeHtml(item.filename)}</strong>
      <div class="media-meta">
        <span>${escapeHtml(mediaCategoryLabel(item.category || item.folder))}</span>
        <span>${escapeHtml(formatRelativeDate(item.createdAt))}</span>
      </div>
      ${(item.tags || []).length ? `<div class="media-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <div class="media-usage">
        <strong>${(item.usage || []).length ? "使用中" : "未使用"}</strong>
        ${(item.usage || []).slice(0, 3).map((usage) => `<button class="media-usage-link" type="button" data-media-usage-target="${escapeHtml(usage.editTarget || "")}">${escapeHtml(usage.label)}</button>`).join("")}
      </div>
      <code>${escapeHtml(item.url)}</code>
      <button class="secondary" data-copy-media="${item.url}" type="button">复制链接</button>
      <button class="secondary" data-delete-media="${item.id}" type="button">删除</button>
    </article>
  `).join("") || "<p class='empty'>暂无上传素材。</p>";
  renderGuideMediaPicker();
  renderMediaPicker();
}

function mediaPreviewMarkup(item = {}) {
  const type = item.type || (item.mimeType || "").split("/")[0] || (/\.(mp4|webm|mov|ogg)$/i.test(item.url || "") ? "video" : /\.(mp3|wav|m4a)$/i.test(item.url || "") ? "audio" : "image");
  if (type === "audio") return `<div class="media-file-preview audio"><span>Audio</span><strong>音频素材</strong></div>`;
  if (type === "video") return `<div class="media-file-preview video"><span>Video</span><strong>视频素材</strong></div>`;
  return `<img src="/${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || "")}" />`;
}

function defaultTemplate() {
  return {
    id: "",
    title: "新话术模板",
    slug: "",
    category: "欢迎",
    channel: "WhatsApp",
    language: "EN",
    icon: "💬",
    body: "Hi {{name}}, thanks for reaching out. We can shape a calmer China journey around {{city}} and your timing.",
    sortOrder: state.templates.length + 1,
    active: true
  };
}

async function loadTemplates() {
  try {
    state.templates = (await api("/api/admin/templates")).data;
  } catch {
    state.templates = Object.values(defaultQuickReplyTemplates).map((template, index) => ({
      ...template,
      title: template.label,
      slug: Object.keys(defaultQuickReplyTemplates)[index],
      sortOrder: index + 1,
      active: true
    }));
  }
  if (!state.currentTemplateId && state.templates[0]) state.currentTemplateId = state.templates[0].id;
  renderTemplateCenter();
}

function renderTemplateCenter() {
  renderTemplateCategories();
  renderTemplateList();
  const current = state.templates.find((template) => template.id === state.currentTemplateId) || state.templates[0];
  renderTemplateEditor(current || defaultTemplate());
}

function renderTemplateCategories() {
  const node = $("[data-template-categories]");
  if (!node) return;
  const active = node.dataset.category || "";
  const categories = [...new Set(state.templates.map((template) => template.category || "通用"))];
  node.innerHTML = [`<button class="${!active ? "is-active" : ""}" type="button" data-template-category="">全部模板</button>`]
    .concat(categories.map((category) => `<button class="${active === category ? "is-active" : ""}" type="button" data-template-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`))
    .join("");
}

function renderTemplateList() {
  const node = $("[data-template-list]");
  if (!node) return;
  const query = ($("[data-template-search]")?.value || "").toLowerCase();
  const category = $("[data-template-categories]")?.dataset.category || "";
  const templates = state.templates
    .filter((template) => !category || template.category === category)
    .filter((template) => !query || [template.title, template.category, template.channel, template.language, template.body].join(" ").toLowerCase().includes(query))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  node.innerHTML = templates.map((template) => `
    <button class="template-row ${template.id === state.currentTemplateId ? "is-active" : ""}" type="button" data-edit-template="${escapeHtml(template.id)}">
      <span>${escapeHtml(template.icon || "💬")}</span>
      <strong>${escapeHtml(template.title || "未命名模板")}</strong>
      <small>${escapeHtml([template.category, template.channel, template.language].filter(Boolean).join(" · "))}</small>
    </button>
  `).join("") || "<p class='empty'>暂无模板。</p>";
}

function renderTemplateEditor(template = defaultTemplate()) {
  const form = $("[data-template-form]");
  if (!form) return;
  state.currentTemplateId = template.id || "";
  fillForm(form, template);
  $("[data-current-template-title]").textContent = template.title || "新话术模板";
  $("[data-template-save-status]").textContent = template.id ? `已保存 · ${formatRelativeDate(template.updatedAt)}` : "新模板 · 尚未保存";
  renderTemplatePreview();
  renderTemplateList();
}

function templateDraftFromForm() {
  const form = $("[data-template-form]");
  const fields = form.elements;
  return {
    id: fields.id.value,
    title: fields.title.value,
    slug: slugify(fields.title.value || "template"),
    category: fields.category.value,
    channel: fields.channel.value,
    language: fields.language.value,
    icon: fields.icon.value,
    body: fields.body.value,
    sortOrder: Number(fields.sortOrder.value || 0),
    active: true
  };
}

function renderTemplatePreview() {
  const node = $("[data-template-preview]");
  if (!node) return;
  const draft = templateDraftFromForm();
  const sample = {
    name: "Hy",
    citiesInterestedIn: "Shanghai",
    travelDates: "June 12-16",
    travelers: "3",
    preferredStayLevel: "Luxury",
    tripStyle: ["Slow Travel"]
  };
  node.textContent = applyTemplateVariables(draft.body, sample) || "模板内容为空。";
}

function openMediaPicker(target, options = {}) {
  state.mediaPicker = {
    target,
    category: options.category || "",
    title: options.title || "选择图片"
  };
  const modal = $("[data-media-modal]");
  if (!modal) return;
  modal.classList.remove("is-hidden");
  $("[data-media-picker-title]").textContent = state.mediaPicker.title;
  if ($("[data-picker-category]")) $("[data-picker-category]").value = state.mediaPicker.category || "";
  if ($("[data-picker-search]")) $("[data-picker-search]").value = "";
  renderMediaPicker();
}

function closeMediaPicker() {
  state.mediaPicker = null;
  $("[data-media-modal]")?.classList.add("is-hidden");
}

function renderMediaPicker() {
  const grid = $("[data-picker-grid]");
  if (!grid || !state.mediaPicker) return;
  const query = $("[data-picker-search]")?.value || "";
  const category = $("[data-picker-category]")?.value || state.mediaPicker.category || "";
  const items = filterMediaItems(query, category);
  grid.innerHTML = items.map((item) => `
    <button class="media-choice" type="button" data-pick-media="${escapeHtml(item.url)}">
      ${mediaPreviewMarkup(item)}
      <strong>${escapeHtml(item.alt || item.filename)}</strong>
      <span>${escapeHtml(mediaCategoryLabel(item.category || item.folder))}${(item.tags || []).length ? ` · ${escapeHtml(item.tags.slice(0, 2).join(" · "))}` : ""}</span>
      <span>${(item.usage || []).length ? `使用中 · ${escapeHtml(item.usage[0].label)}` : "未使用"}</span>
    </button>
  `).join("") || "<p class='empty'>没有找到合适的图片，可以直接上传新图片。</p>";
}

function applyPickedMedia(url) {
  if (!state.mediaPicker || !url) return;
  const target = state.mediaPicker.target;

  if (target === "guide-cover") {
    state.guideDraft.coverImage = url;
    state.guideDraft.coverAlt = state.media.find((item) => item.url === url)?.alt || "";
    $("[name='coverImage']").value = url;
    $("[name='coverAlt']").value = state.guideDraft.coverAlt;
    renderGuideCardImagePreview(state.guideDraft);
    renderGuidePreview();
    setUnsaved(true);
  } else if (target === "guide-inline") {
    const lang = state.currentGuideLang || "en";
    const editor = $(`[data-raw-editor="${lang}"]`);
    const media = state.media.find((item) => item.url === url);
    insertTextIntoTextarea(editor, `![${media?.alt || "ChinaMigo image"}](${url})\n\n`);
    editor?.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (target === "guide-collection-image") {
    const input = $("[data-guide-collection-form] [name='image']");
    if (input) input.value = url;
    renderGuideCollectionImage(url);
  } else if (target.startsWith("city:")) {
    const field = target.split(":")[1];
    const input = $(`[name="${field}"]`);
    if (input) input.value = url;
    renderCityImagePreview(cityDraftFromForm());
    setCitySaveStatus("未保存", "dirty");
    showToast("图片已从素材中心应用");
  } else if (target === "experience-cover") {
    $("[name='coverImage']").value = url;
    renderExperienceImages(syncExperienceForm());
    renderJourneyCardPreview();
    $("[data-experience-save-status]").textContent = "未保存";
  } else if (target === "experience-gallery") {
    const gallery = csvToList($("[name='galleryImages']").value);
    if (!gallery.includes(url)) gallery.push(url);
    $("[name='galleryImages']").value = listToCsv(gallery);
    renderExperienceImages(syncExperienceForm());
    $("[data-experience-save-status]").textContent = "未保存";
  } else if (target === "experience-day") {
    const days = readItineraryDays();
    if (days[state.currentExperienceDay]) days[state.currentExperienceDay].image = url;
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
    $("[data-experience-save-status]").textContent = "未保存";
  }

  closeMediaPicker();
  showToast("图片已应用");
}

async function refreshAll() {
  await Promise.all([loadOverview(), loadTemplates(), loadInquiries(), loadGuides(), loadGuideCollections(), loadCities(), loadExperiences(), loadMedia()]);
}

function showDashboard() {
  $("[data-login]").classList.add("is-hidden");
  $("[data-dashboard]").classList.remove("is-hidden");
}

function showLogin() {
  $("[data-dashboard]").classList.add("is-hidden");
  $("[data-login]").classList.remove("is-hidden");
}

function switchTab(name) {
  let panelName = name;
  let shouldFocusExperienceEditor = false;
  if (name === "journeys" || name === "short-experiences") {
    state.activeExperienceMode = name === "short-experiences" ? "short_experience" : "recommended_journey";
    panelName = "experiences";
    shouldFocusExperienceEditor = true;
    const current = state.experiences.find((item) => item.id === state.currentExperienceId);
    if (!current || current.type !== state.activeExperienceMode) {
      state.currentExperienceId = experiencesForActiveMode()[0]?.id || null;
      if (state.currentExperienceId) renderExperienceEditor(state.experiences.find((item) => item.id === state.currentExperienceId));
    }
    renderExperienceList();
  }
  $$("[data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== panelName));
  if (shouldFocusExperienceEditor) focusActiveExperienceEditor();
}

$("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("[data-login-status]");
  status.textContent = "正在登录...";
  try {
    await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    showDashboard();
    await refreshAll();
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message;
  }
});

$("[data-logout]").addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  showLogin();
});

$$("[data-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));

$("[data-guide-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  syncGuideFromForm();
  setStatus("正在保存攻略...");
  if ($("[data-unsaved-state]")) $("[data-unsaved-state]").textContent = "正在保存...";
  await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
  await loadGuides();
  await loadOverview();
  setUnsaved(false);
  setStatus("攻略已保存。");
  showToast("攻略已保存");
});

$("[data-guide-collection-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = guideCollectionDraftFromForm();
  setStatus("正在保存精选合集...");
  try {
    const response = await api("/api/admin/guide-collections", { method: "POST", body: JSON.stringify(payload) });
    await loadGuideCollections();
    selectGuideCollection(response.data);
    setStatus("精选合集已保存，并已同步首页。");
    showToast("精选合集已保存");
  } catch (error) {
    setStatus(`精选合集保存失败：${error.message}`);
    showToast(`保存失败：${error.message}`);
  }
});


$("[data-city-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  setCitySaveStatus("正在保存...", "saving");
  setStatus("正在保存城市内容...");
  try {
    const response = await api("/api/admin/cities", { method: "POST", body: JSON.stringify(formValues(event.currentTarget)) });
    state.currentCityId = response.data.id;
    $("[data-city-form]")?.classList.remove("is-new-city");
    await loadCities();
    await loadOverview();
    setCitySaveStatus("已保存 · 刚刚", "saved");
    setStatus(`${response.data.name || "城市内容"} 已保存，并已同步前台。`);
    showToast(`✓ ${response.data.name || "城市内容"} 已保存`);
  } catch (error) {
    setCitySaveStatus("保存失败，请重试", "error");
    setStatus(`城市保存失败：${error.message}`);
    showToast(`保存失败：${error.message}`);
  }
});

$("[data-experience-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = syncExperienceForm();
  $("[data-experience-save-status]").textContent = "正在保存...";
  const meta = experienceModeMeta(payload.type);
  setStatus(`正在保存${meta.editLabel}...`);
  try {
    const response = await api("/api/admin/experiences", { method: "POST", body: JSON.stringify(payload) });
    state.currentExperienceId = response.data.id;
    state.activeExperienceMode = response.data.type === "short_experience" ? "short_experience" : "recommended_journey";
    await loadExperiences();
    await loadOverview();
    $("[data-experience-save-status]").textContent = "已保存 · 刚刚";
    setStatus(`${meta.editLabel}已保存。`);
    showToast(`${meta.editLabel}已保存`);
  } catch (error) {
    $("[data-experience-save-status]").textContent = "保存失败，请重试";
    setStatus(`${meta.editLabel}保存失败：${error.message}`);
  }
});

$("[data-media-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const files = [...form.file.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  setStatus("正在上传素材...");
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    await api("/api/upload", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        alt: form.alt.value || file.name.replace(/\.[^.]+$/, ""),
        folder: form.category.value,
        category: form.category.value,
        tags: csvToList(form.tags.value),
        dataUrl
      })
    });
  }
  form.reset();
  await loadMedia();
  await loadOverview();
  setStatus("素材已上传。");
  showToast(`已上传 ${files.length} 张素材`);
});

$("[data-template-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = templateDraftFromForm();
  $("[data-template-save-status]").textContent = "正在保存...";
  setStatus("正在保存话术模板...");
  try {
    const response = await api("/api/admin/templates", { method: "POST", body: JSON.stringify(payload) });
    state.currentTemplateId = response.data.id;
    await loadTemplates();
    setStatus("话术模板已保存。");
    showToast("话术模板已保存");
  } catch (error) {
    $("[data-template-save-status]").textContent = "保存失败";
    setStatus(`模板保存失败：${error.message}`);
  }
});

$("[data-new-guide]").addEventListener("click", () => selectGuide(defaultGuide()));
$("[data-new-city]").addEventListener("click", () => {
  const nextCity = normalizeCityDraft({
    id: "",
    name: "新城市",
    slug: "",
    active: true,
    showInNavigation: false,
    sortOrder: state.cities.length + 1
  });
  state.currentCityId = "";
  fillForm($("[data-city-form]"), nextCity);
  $("[data-city-form]")?.classList.add("is-new-city");
  const slugInput = $("[data-city-form] [name='slug']");
  if (slugInput) slugInput.dataset.autoSlug = "true";
  $("[data-current-city-title]").textContent = "新城市";
  $("[data-city-page-preview]").textContent = "最终页面地址：/cities/";
  setCitySaveStatus("新城市 · 保存后进入完整编辑");
  renderCityAssociations(nextCity);
  renderCityImagePreview(nextCity);
  renderCityCardPreview(nextCity);
  renderCityList();
});
$("[data-new-experience]").addEventListener("click", () => renderExperienceEditor(defaultExperienceForMode()));

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-focus-toggle], [data-toggle-activity], [data-crm-filter], [data-guide-quick-filter], [data-inquiry-tab], [data-jump-followup], [data-overview-tab], [data-overview-action], [data-overview-edit], [data-overview-inquiry-status], [data-inquiry-status-action], [data-quick-reply], [data-quick-note], [data-save-quick-note], [data-save-followup], [data-toggle-templates], [data-template-category], [data-edit-template], [data-new-template], [data-ai-polish-template], [data-duplicate-template], [data-delete-template], [data-cancel-quick-note], [data-editor-mode], [data-toggle-review-panel], [data-jump-section], [data-cover-dropzone], [data-card-crop-action], [data-editor-tab], [data-edit-guide], [data-edit-guide-collection], [data-new-guide-collection], [data-edit-city-guide], [data-new-guide-for-city], [data-ai-guide-outline-for-city], [data-template-guide-for-city], [data-new-experience-for-city], [data-copy-city-url], [data-open-city-page], [data-preview-row-guide], [data-duplicate-row-guide], [data-lang-tab], [data-open-edit-panel], [data-close-edit-panel], [data-close-guide-editor], [data-format-inline], [data-insert-guide-element], [data-insert-media], [data-editor-media-action], [data-add-block], [data-collapse-block], [data-duplicate-block], [data-remove-block], [data-move-block], [data-remove-related], [data-preview-device], [data-pick-cover], [data-open-media-picker], [data-close-media-picker], [data-pick-media], [data-media-usage-target], [data-upload-guide-cover], [data-upload-city-image], [data-clear-city-image], [data-edit-city], [data-edit-experience], [data-toggle-experience-list], [data-experience-jump], [data-detail-tab], [data-add-detail-item], [data-remove-detail-item], [data-journey-preview-mode], [data-select-day], [data-add-day], [data-insert-day-block], [data-ai-optimize-day], [data-ai-day-field], [data-upload-day-image], [data-clear-day-image], [data-upload-experience-cover], [data-clear-experience-cover], [data-upload-experience-gallery], [data-remove-experience-gallery], [data-add-experience-tag], [data-ai-suggest-tags], [data-view-inquiry], [data-close-inquiry], [data-export-inquiries], [data-copy-contact], [data-copy-field], [data-copy-inquiry], [data-save-inquiry-notes], [data-mark-spam], [data-archive-inquiry], [data-delete-guide], [data-delete-city], [data-delete-experience], [data-delete-inquiry], [data-delete-media], [data-copy-media]") || event.target;
  const clickedMedia = selectedMediaFigureFromNode(event.target);
  if (clickedMedia) {
    const clickedSlot = event.target.closest(".cms-media-slot:not(.is-empty)");
    if (clickedSlot && clickedSlot.closest("[data-editor-media]") === clickedMedia) {
      selectMediaSlot(clickedSlot);
    } else {
      selectMediaFigure(clickedMedia);
    }
  } else if (!event.target.closest("[data-media-edit-toolbar]") && !event.target.closest("[data-media-style-panel]") && !event.target.closest(".toolbar-menu") && !target.matches("[data-insert-media]")) {
    clearSelectedMedia();
  }
  if (event.target.closest("[data-editor-media-slot].is-empty")) {
    replaceMediaLayoutSlot(event.target.closest("[data-editor-media-slot]"));
    return;
  }
  if (target.matches("[data-editor-media-action]")) {
    handleMediaToolbarAction(target.dataset.editorMediaAction, target);
    return;
  }
  if (target.matches("[data-focus-toggle]")) {
    const key = target.dataset.focusToggle;
    const completed = !state.completedFocus.has(key);
    setFocusCompleted(key, completed);
    target.classList.toggle("is-complete", completed);
    await loadOverview();
    showToast(completed ? "今日重点已完成" : "已恢复为待处理");
  }
  if (target.matches("[data-experience-mode]")) {
    const nextMode = target.dataset.experienceMode === "short_experience" ? "short_experience" : "recommended_journey";
    if (nextMode !== state.activeExperienceMode) {
      switchTab(experienceModeMeta(nextMode).tab);
    } else {
      updateExperienceModuleChrome();
      renderExperienceTypeEditor();
    }
    return;
  }
  if (target.matches("[data-toggle-activity]")) {
    state.overviewActivityExpanded = !state.overviewActivityExpanded;
    await loadOverview();
    showToast(state.overviewActivityExpanded ? "已展开最近活动" : "已收起最近活动");
  }
  if (target.matches("[data-edit-guide-collection]")) {
    const collection = state.guideCollections.find((item) => item.id === target.dataset.editGuideCollection);
    if (collection) selectGuideCollection(collection);
  }
  if (target.matches("[data-new-guide-collection]")) {
    selectGuideCollection(defaultGuideCollection());
    showToast("可以开始新建精选合集");
  }
  if (target.matches("[data-city-jump]")) {
    jumpToCitySection(target.dataset.cityJump);
  }
  if (target.matches("[data-copy-city-url]")) {
    const city = cityDraftFromForm();
    const path = `/cities/${city.slug || ""}`;
    const copied = await copyText(path);
    showToast(copied ? `已复制城市链接：${path}` : "复制失败，请手动复制链接");
  }
  if (target.matches("[data-open-city-page]")) {
    const city = cityDraftFromForm();
    if (!city.slug) {
      showToast("请先填写 URL 标识");
      return;
    }
    window.open(`/cities/${city.slug}`, "_blank");
  }
  if (target.matches("[data-inquiry-tab]")) {
    const tabName = target.dataset.inquiryTab;
    $$("[data-inquiry-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.inquiryTab === tabName));
    $$("[data-inquiry-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.inquiryPanel === tabName));
  }
  if (target.matches("[data-jump-followup]")) {
    $$("[data-inquiry-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.inquiryTab === "timeline"));
    $$("[data-inquiry-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.inquiryPanel === "timeline"));
    $("[data-follow-note-text]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("[data-follow-note-text]")?.focus();
  }
  if (target.matches("[data-crm-filter]")) {
    const list = $("[data-inquiries-list]");
    if (list) list.dataset.crmFilter = target.dataset.crmFilter || "";
    $$("[data-crm-filter]").forEach((button) => button.classList.toggle("is-active", button === target && Boolean(target.dataset.crmFilter)));
    renderInquiryList();
  }
  if (target.matches("[data-template-category]")) {
    const node = $("[data-template-categories]");
    if (node) node.dataset.category = target.dataset.templateCategory || "";
    renderTemplateCategories();
    renderTemplateList();
  }
  if (target.matches("[data-edit-template]")) {
    renderTemplateEditor(state.templates.find((template) => template.id === target.dataset.editTemplate));
  }
  if (target.matches("[data-new-template]")) {
    state.currentTemplateId = "";
    renderTemplateEditor(defaultTemplate());
  }
  if (target.matches("[data-ai-polish-template]")) {
    const form = $("[data-template-form]");
    if (form?.body) {
      form.body.value = form.body.value
        .replace(/\s+/g, " ")
        .replace(/\\s+([,.?])/g, "$1")
        .trim();
      if (!/ChinaMigo/i.test(form.body.value)) form.body.value = `${form.body.value} ChinaMigo can help keep the journey calm and well coordinated.`;
      renderTemplatePreview();
      $("[data-template-save-status]").textContent = "未保存 · AI 已润色";
      showToast("AI 已润色模板");
    }
  }
  if (target.matches("[data-duplicate-template]")) {
    const draft = templateDraftFromForm();
    draft.id = "";
    draft.title = `${draft.title || "模板"} Copy`;
    state.currentTemplateId = "";
    renderTemplateEditor(draft);
    showToast("已复制为新模板，保存后生效");
  }
  if (target.matches("[data-delete-template]")) {
    const id = $("[data-template-form]")?.elements?.id?.value;
    if (!id) return;
    if (!window.confirm("确认删除这个话术模板？")) return;
    await api(`/api/admin/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    state.currentTemplateId = "";
    await loadTemplates();
    showToast("话术模板已删除");
  }
  if (target.matches("[data-guide-quick-filter]")) {
    const list = $("[data-guides-list]");
    if (list) list.dataset.quickFilter = target.dataset.guideQuickFilter || "";
    $$("[data-guide-quick-filter]").forEach((button) => button.classList.toggle("is-active", button === target && Boolean(target.dataset.guideQuickFilter)));
    renderGuideList();
  }
  if (target.matches("[data-overview-tab]")) {
    switchTab(target.dataset.overviewTab);
  }
  if (target.matches("[data-overview-action]")) {
    const action = target.dataset.overviewAction;
    if (action === "new-guide") {
      switchTab("guides");
      selectGuide(defaultGuide());
    }
    if (action === "new-city") {
      switchTab("cities");
      $("[data-new-city]")?.click();
    }
    if (action === "new-experience") {
      switchTab("journeys");
      renderExperienceEditor(defaultExperienceForMode("recommended_journey"));
    }
    if (action === "new-short-experience") {
      switchTab("short-experiences");
      renderExperienceEditor(defaultExperienceForMode("short_experience"));
    }
    if (action === "upload-media") switchTab("media");
  }
  if (target.matches("[data-overview-edit]")) {
    const [type, id] = String(target.dataset.overviewEdit || "").split(":");
    if (type === "guide") {
      switchTab("guides");
      const guide = state.guides.find((item) => item.id === id || item.slug === id);
      if (guide) selectGuide(guide);
    }
    if (type === "city") {
      switchTab("cities");
      const city = state.cities.find((item) => item.id === id || item.slug === id);
      if (city) selectCity(city);
    }
    if (type === "experience") {
      const experience = state.experiences.find((item) => item.id === id || item.slug === id);
      if (experience) {
        switchTab(tabForExperience(experience));
        renderExperienceEditor(experience);
      }
    }
    if (type === "inquiry") {
      switchTab("inquiries");
      const inquiry = state.inquiries.find((item) => item.id === id);
      if (inquiry) renderInquiryDetail(inquiry);
    }
    if (type === "media") switchTab("media");
  }
  if (target.matches("[data-overview-inquiry-status]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.overviewInquiryStatus, status: target.dataset.statusNext }) });
    await loadInquiries();
    await loadOverview();
    showToast("咨询状态已更新");
  }
  if (target.matches("[data-inquiry-status-action]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.inquiryStatusAction, status: target.dataset.statusNext }) });
    await loadInquiries();
    await loadOverview();
    showToast("咨询状态已更新");
  }
  if (target.matches("[data-quick-reply]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.quickReply);
    const template = templateByKey(target.dataset.replyTemplate);
    if (!template) return;
    const text = template.text(item);
    const original = target.innerHTML;
    let copiedTemplate = false;
    try {
      const copied = await copyText(text);
      if (!copied) throw new Error("Copy failed");
      copiedTemplate = true;
      target.classList.add("is-copied");
      target.innerHTML = `<span>✓</span><em>已复制</em>`;
      target.disabled = true;
      window.setTimeout(() => {
        target.innerHTML = original;
        target.disabled = false;
        target.classList.remove("is-copied");
      }, 1500);
      showToast(`✓ 已复制 ${template.label} WhatsApp 模板`);
    } catch {
      showToast("复制失败，请手动复制模板内容。");
      window.prompt("复制快捷回复", text);
    }
    if (copiedTemplate) {
      await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.quickReply, status: "replied", lastReplyAt: new Date().toISOString(), activityLabel: `复制 WhatsApp ${template.label}` }) });
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      await loadInquiries();
      renderInquiryDetail(state.inquiries.find((inquiry) => inquiry.id === target.dataset.quickReply));
    }
  }
  if (target.matches("[data-quick-note]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.quickNote);
    renderInquiryDetail(item);
    $$("[data-inquiry-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.inquiryTab === "timeline"));
    $$("[data-inquiry-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.inquiryPanel === "timeline"));
    $("[data-follow-note-text]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("[data-follow-note-text]")?.focus();
    showToast("请填写跟进备注");
  }
  if (target.matches("[data-cancel-quick-note]")) {
    $("[data-quick-note-composer]")?.classList.add("is-hidden");
    if ($("[data-quick-note-text]")) $("[data-quick-note-text]").value = "";
  }
  if (target.matches("[data-toggle-templates]")) {
    const library = $("[data-template-library]");
    library?.classList.toggle("is-hidden");
    target.classList.toggle("is-active", !library?.classList.contains("is-hidden"));
  }
  if (target.matches("[data-save-followup]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.saveFollowup);
    const note = ($("[data-follow-note-text]")?.value || "").trim();
    if (!note) {
      showToast("请先输入跟进内容");
      return;
    }
    const previousNotes = item?.internalNotes ? `${item.internalNotes}\n\n` : "";
    const noteLine = `Migo · ${new Date().toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}\n${note}`;
    await api("/api/admin/inquiries", {
      method: "PATCH",
      body: JSON.stringify({
        id: target.dataset.saveFollowup,
        internalNotes: `${previousNotes}${noteLine}`,
        activityLabel: `新增跟进：${note.slice(0, 60)}`
      })
    });
    await loadInquiries();
    await loadOverview();
    renderInquiryDetail(state.inquiries.find((inquiry) => inquiry.id === target.dataset.saveFollowup));
    setStatus("跟进内容已保存。");
    showToast("✓ 跟进内容已保存");
  }
  if (target.matches("[data-save-quick-note]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.saveQuickNote);
    const note = ($("[data-quick-note-text]")?.value || "").trim();
    if (!note) {
      showToast("请先输入备注内容");
      return;
    }
    const previousNotes = item?.internalNotes ? `${item.internalNotes}\n\n` : "";
    const noteLine = `Migo · ${new Date().toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}\n${note}`;
    await api("/api/admin/inquiries", {
      method: "PATCH",
      body: JSON.stringify({
        id: target.dataset.saveQuickNote,
        internalNotes: `${previousNotes}${noteLine}`,
        activityLabel: `新增跟进备注：${note.slice(0, 60)}`
      })
    });
    await loadInquiries();
    await loadOverview();
    renderInquiryDetail(state.inquiries.find((inquiry) => inquiry.id === target.dataset.saveQuickNote));
    setStatus("跟进备注已保存。");
    showToast("✓ 跟进备注已保存");
  }
  if (target.matches("[data-editor-mode]")) {
    setGuideEditorMode(target.dataset.editorMode);
    return;
  }
  if (target.matches("[data-toggle-review-panel]")) {
    const panel = $("[data-review-panel]");
    showReviewPanel(panel?.classList.contains("is-collapsed"));
    return;
  }
  if (target.matches("[data-jump-section]")) {
    const section = target.dataset.jumpSection;
    if (target.classList.contains("needs-work")) addMissingSection(section);
    jumpToEditorSection(section);
    return;
  }
  if (target.matches("[data-selection-ai]")) {
    runSelectionAiAction(target.dataset.selectionAi);
    return;
  }
  if (target.matches("[data-toggle-ai-panel]")) {
    $("[data-ai-panel]")?.classList.toggle("is-hidden");
    return;
  }
  if (target.matches("[data-close-ai-panel]")) {
    $("[data-ai-panel]")?.classList.add("is-hidden");
    return;
  }
  if (target.matches("[data-toolbar-menu-trigger]")) {
    rememberVisualSelection();
    const menu = target.closest("[data-toolbar-menu]");
    const panel = menu?.querySelector("[data-toolbar-menu-panel]");
    const shouldOpen = !menu?.classList.contains("is-open");
    closeToolbarMenus();
    if (menu && panel && shouldOpen) {
      menu.classList.add("is-open");
      panel.removeAttribute("hidden");
    }
    restoreVisualSelection(state.lastVisualSelection?.lang || state.currentGuideLang);
    return;
  }
  if (target.matches("[data-editor-command]")) {
    restoreVisualSelection(state.lastVisualSelection?.lang || state.currentGuideLang);
    applyEditorHistory(target.dataset.editorCommand);
    return;
  }
  if (target.matches("[data-format-inline]")) {
    applyInlineFormat(target.dataset.formatInline, target.dataset.formatValue || "");
    closeToolbarMenus();
    return;
  }
  if (target.matches("[data-insert-guide-element]")) {
    insertGuideElement(target.dataset.insertGuideElement || "tip");
    closeToolbarMenus();
    return;
  }
  if (target.matches("[data-insert-media]")) {
    const kind = target.dataset.insertMedia || "image";
    const mediaLang = target.dataset.mediaLang || state.currentGuideLang || "en";
    if (mediaLang !== "journey") state.currentGuideLang = mediaLang;
    captureMediaInsertionPoint(mediaLang);
    restoreVisualSelection(mediaLang);
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = kind === "image" || kind === "gif";
    input.accept = {
      image: "image/png,image/jpeg,image/webp",
      gif: "image/gif",
      audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4",
      video: "video/mp4,video/webm,video/ogg,video/quicktime"
    }[kind] || "image/png,image/jpeg,image/webp";
    input.onchange = () => insertMediaFiles(input.files || [], kind);
    input.click();
    closeToolbarMenus();
    return;
  }
  if (target.matches("[data-edit-guide]")) selectGuide(state.guides.find((item) => item.id === target.dataset.editGuide));
  if (target.matches("[data-edit-city-guide]")) {
    switchTab("guides");
    selectGuide(state.guides.find((item) => item.id === target.dataset.editCityGuide));
  }
  if (target.matches("[data-new-guide-for-city]")) {
    const guide = defaultGuide();
    guide.city = cityKey(target.dataset.newGuideForCity);
    guide.category = "Transportation";
    guide.tags = [guide.city, "city guide"].filter(Boolean);
    guide.translations.en.title = "未命名攻略";
    switchTab("guides");
    selectGuide(guide);
  }
  if (target.matches("[data-ai-guide-outline-for-city], [data-template-guide-for-city]")) {
    const citySlug = cityKey(target.dataset.aiGuideOutlineForCity || target.dataset.templateGuideForCity);
    const city = state.cities.find((item) => cityMatchesContent(item, citySlug)) || { name: citySlug.replace(/-/g, " "), slug: citySlug };
    const guide = defaultGuide();
    guide.city = city.slug || citySlug;
    guide.category = "Transportation";
    guide.coverImage = city.cardImage || city.bannerImage || city.thumbnailImage || "";
    guide.tags = [city.name || citySlug, "First-time visitor", "Transportation"].filter(Boolean);
    guide.translations.en.title = `${city.name || "City"} Travel Guide`;
    guide.translations.en.excerpt = `A calm starter guide for experiencing ${city.name || "this city"}.`;
    guide.translations.en.rawContent = `# ${city.name || "City"} Travel Guide\n\n## Overview\n\n${city.longDescription || city.shortDescription || `A practical guide for international visitors exploring ${city.name || "this city"}.`}\n\n## What to Know First\n\n- Best arrival areas\n- Local transport rhythm\n- Payment and translation notes\n- Neighborhoods worth exploring\n\n## Local Tips\n\nAdd practical advice for first-time visitors here.\n\n## FAQ 常见问题\n\nQ: What should visitors prepare before arriving?\n\nA: Add a clear answer here.\n\nCTA: Chat on WhatsApp | https://wa.me/\n`;
    guide.translations.en.htmlContent = markdownToHtml(guide.translations.en.rawContent);
    switchTab("guides");
    selectGuide(guide);
    showToast(`已为 ${city.name || citySlug} 生成攻略大纲`);
  }
  if (target.matches("[data-new-experience-for-city]")) {
    switchTab("journeys");
    renderExperienceEditor(defaultExperience({
      title: "新完整行程",
      city: cityKey(target.dataset.newExperienceForCity),
      type: "recommended_journey",
      duration: "3 Days",
      tags: ["Private Journey"],
      published: true,
      sortOrder: 0
    }));
  }
  if (target.matches("[data-close-guide-editor]")) {
    $("[data-panel='guides']")?.classList.remove("is-editor-open");
  }
  if (target.matches("[data-open-edit-panel]")) {
    setGuideEditorMode("edit");
    if (target.dataset.openEditPanel === "hero") {
      $("[data-hero-settings]")?.setAttribute("open", "");
      $("[data-cover-dropzone]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      $(`[data-raw-editor="${state.currentGuideLang}"]`)?.focus();
    }
  }
  if (target.matches("[data-close-edit-panel]")) {
    showReviewPanel(false);
    renderGuidePreview();
  }
  if (target.matches("[data-editor-tab]")) {
    $$("[data-editor-tab]").forEach((button) => button.classList.toggle("is-active", button === target));
    $$("[data-editor-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.editorPanel !== target.dataset.editorTab));
  }
  if (target.matches("[data-preview-row-guide]")) {
    selectGuide(state.guides.find((item) => item.id === target.dataset.previewRowGuide));
    setGuideEditorMode("preview");
  }
  if (target.matches("[data-duplicate-guide], [data-duplicate-row-guide]")) {
    const source = target.dataset.duplicateRowGuide
      ? state.guides.find((item) => item.id === target.dataset.duplicateRowGuide)
      : syncGuideFromForm();
    const copy = JSON.parse(JSON.stringify(source || defaultGuide()));
    copy.id = `guide-${Date.now()}`;
    copy.slug = `${copy.slug || "guide"}-copy`;
    copy.title = `${copy.title || "未命名攻略"} 副本`;
    copy.status = "draft";
    copy.createdAt = "";
    copy.updatedAt = "";
    selectGuide(copy);
    setUnsaved(true);
  }
  if (target.matches("[data-preview-guide]")) {
    renderGuidePreview();
    showToast("预览已刷新");
  }
  if (target.matches("[data-rich-command]")) {
    const command = target.dataset.richCommand;
    const editor = $(`[data-rich-editor="${state.currentGuideLang}"]`);
    editor?.focus();
    if (command === "h2") document.execCommand("formatBlock", false, "h2");
    if (command === "p") document.execCommand("formatBlock", false, "p");
    if (command === "bold") document.execCommand("bold");
    if (command === "ul") document.execCommand("insertUnorderedList");
    if (command === "cta") insertHtmlAtCursor('<p><a class="cms-cta" href="https://wa.me/">Chat on WhatsApp</a></p><p><br></p>');
    if (command === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/webp,image/gif";
      input.multiple = true;
      input.onchange = () => insertImageFiles(input.files, input.files.length > 1);
      input.click();
    }
    renderGuidePreview();
    setUnsaved(true);
  }
  if (target.matches("[data-insert-image]")) {
    state.currentGuideLang = target.dataset.insertImage || state.currentGuideLang || "en";
    $(`[data-raw-editor="${state.currentGuideLang}"]`)?.focus();
    openMediaPicker("guide-inline", { category: "guides", title: "插入攻略正文图片" });
  }
  if (target.matches("[data-docx-upload]") || target.matches("[data-docx-dropzone]")) {
    if (target.dataset.importDocxNew !== undefined || !$("[data-panel='guides']")?.classList.contains("is-editor-open")) {
      selectGuide(defaultGuide());
    } else if (!state.guideDraft) {
      selectGuide(defaultGuide());
    }
    $("[data-docx-file]")?.click();
  }
  if (target.matches("[data-ai-action]")) {
    const editor = $(`[data-raw-editor="${state.currentGuideLang}"]`);
    if (!editor) return;
    if (target.dataset.aiAction === "translate-cn") {
      const enEditor = $(`[data-raw-editor="en"]`);
      const sourceTitle = $("[name='titleEn']")?.value || "";
      const sourceExcerpt = $("[name='excerptEn']")?.value || "";
      if (!enEditor?.value.trim() && !sourceTitle.trim()) {
        showToast("请先填写英文内容");
        return;
      }
      const previous = target.textContent;
      target.textContent = "生成中...";
      target.disabled = true;
      setStatus("AI 正在生成中文版本...");
      try {
        const response = await api("/api/ai/beautify", {
          method: "POST",
          body: JSON.stringify({
            title: sourceTitle,
            content: `请把以下 ChinaMigo 英文攻略翻译成自然、适合中文游客阅读的中文版本，保留 Markdown 标题、列表、CTA 和图片语法：\n\n${sourceExcerpt ? `${sourceExcerpt}\n\n` : ""}${enEditor.value}`,
            language: "zh-CN"
          })
        });
        const cnEditor = $(`[data-raw-editor="cn"]`);
        const titleField = $("[name='titleCn']");
        const excerptField = $("[name='excerptCn']");
        const translated = response.beautifiedContent || response.rawContent || response.content || "";
        if (titleField) titleField.value = response.suggestedTitle || sourceTitle;
        if (excerptField) excerptField.value = response.suggestedExcerpt || sourceExcerpt;
        if (cnEditor && translated) {
          cnEditor.value = translated;
          cnEditor.dispatchEvent(new Event("input", { bubbles: true }));
        }
        state.currentGuideLang = "cn";
        $$("[data-lang-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.langTab === "cn"));
        $$("[data-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.langPanel !== "cn"));
        $$("[data-source-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.sourceLangPanel !== "cn"));
        setStatus("AI 已生成中文版本。");
        showToast("AI 已生成中文版本");
      } catch (error) {
        setStatus(error.message);
        showToast(error.message || "AI 翻译失败");
      } finally {
        target.textContent = previous;
        target.disabled = false;
      }
      return;
    }
    if (target.dataset.aiAction === "beautify") {
      const previous = target.textContent;
      target.textContent = "整理中...";
      target.disabled = true;
      setStatus("AI 正在优化排版...");
      try {
        const response = await api("/api/ai/beautify", {
          method: "POST",
          body: JSON.stringify({
            title: $(`[name="title${state.currentGuideLang === "en" ? "En" : "Cn"}"]`)?.value || "",
            content: editor.value,
            language: state.currentGuideLang
          })
        });
        editor.value = response.beautifiedContent || editor.value;
        const titleField = $(`[name="title${state.currentGuideLang === "en" ? "En" : "Cn"}"]`);
        const excerptField = $(`[name="excerpt${state.currentGuideLang === "en" ? "En" : "Cn"}"]`);
        if (response.suggestedTitle && titleField) titleField.value = response.suggestedTitle;
        if (response.suggestedExcerpt && excerptField) excerptField.value = response.suggestedExcerpt;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        setStatus("AI 排版已完成。");
        showToast("AI 已优化排版");
      } catch (error) {
        setStatus(error.message);
        showToast(error.message);
      } finally {
        target.textContent = previous;
        target.disabled = false;
      }
      return;
    }
    if (target.dataset.aiAction === "spacing") {
      editor.value = editor.value
        .replace(/\n{3,}/g, "\n\n")
        .replace(/([^\n])\n(#{1,3}\s)/g, "$1\n\n$2")
        .replace(/([^\n])\n(-\s)/g, "$1\n\n$2");
      showToast("间距已优化");
    }
    if (target.dataset.aiAction === "format" && !/^#{1,3}\s/m.test(editor.value)) {
      editor.value = `## What to know first\n\n${editor.value}`;
      showToast("已转成攻略结构");
    }
    if (target.dataset.aiAction === "images") {
      editor.value = editor.value.replace(/!\[\]\(([^)]+)\)/g, "![请补充图片说明]($1)").replace(/\n{3,}(!\[)/g, "\n\n$1");
      showToast("图片说明和间距已整理");
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    renderGuidePreview();
    setUnsaved(true);
  }
  if (target.matches("[data-publish-guide]")) {
    syncGuideFromForm();
    const completion = guideCompletion(state.guideDraft);
    if (completion.missing.length) {
      const checklist = completion.checks.map((item) => `${item.ok ? "✓" : "✗"} ${item.label}${item.ok ? "" : `：${item.note}`}`).join("\n");
      const shouldPublish = window.confirm(`发布检查\n\n${checklist}\n\n仍然发布？`);
      if (!shouldPublish) {
        showReviewPanel(true);
        renderEditorChecks();
        setStatus("已取消发布，请先处理发布检查项。");
        return;
      }
    }
    state.guideDraft.status = "published";
    state.guideDraft.publishedAt ||= new Date().toISOString().slice(0, 10);
    $("[name='status']").value = "published";
    $("[name='publishedAt']").value = state.guideDraft.publishedAt;
    await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
    await loadGuides();
    await loadOverview();
    setUnsaved(false);
    setStatus(`攻略已发布 · 已同步前台 · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    showToast("攻略已发布，已同步前台");
  }
  if (target.matches("[data-lang-tab]")) {
    state.currentGuideLang = target.dataset.langTab;
    $$("[data-lang-tab]").forEach((button) => button.classList.toggle("is-active", button === target));
    $$("[data-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.langPanel !== state.currentGuideLang));
    $$("[data-source-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.sourceLangPanel !== state.currentGuideLang));
    if ($("[data-editor-lang]")) $("[data-editor-lang]").textContent = state.currentGuideLang === "cn" ? "中文" : "英文";
    renderGuidePreview();
  }
  if (target.matches("[data-add-block]")) {
    syncGuideFromForm();
    getGuideTranslation(state.guideDraft, target.dataset.addBlock).contentBlocks.push({
      id: `block-${Date.now()}`,
      type: target.dataset.type,
      title: target.dataset.type === "heading" ? "New heading" : "",
      body: target.dataset.type === "paragraph" ? "Start writing..." : "",
      image: "",
      alt: "",
      items: [],
      href: "",
      label: ""
    });
    renderBlockEditors();
    renderTranslationStatus();
    renderGuidePreview();
    setUnsaved(true);
  }
  if (target.matches("[data-collapse-block], [data-duplicate-block], [data-remove-block], [data-move-block]")) {
    const blockEl = target.closest("[data-block]");
    const lang = blockEl.dataset.block;
    const index = Number(blockEl.dataset.index);
    syncBlocksFromDom(lang);
    const blocks = getGuideTranslation(state.guideDraft, lang).contentBlocks;
    if (target.matches("[data-collapse-block]")) blocks[index].collapsed = !blocks[index].collapsed;
    if (target.matches("[data-duplicate-block]")) blocks.splice(index + 1, 0, { ...blocks[index], id: `block-${Date.now()}`, collapsed: false });
    if (target.matches("[data-remove-block]")) blocks.splice(index, 1);
    if (target.dataset.moveBlock === "up" && index > 0) [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
    if (target.dataset.moveBlock === "down" && index < blocks.length - 1) [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]];
    renderBlockEditors();
    renderTranslationStatus();
    renderGuidePreview();
    setUnsaved(true);
  }
  if (target.matches("[data-add-related]")) {
    syncGuideFromForm();
    const slug = $("[data-related-select]").value;
    if (slug && !state.guideDraft.relatedGuides.includes(slug)) state.guideDraft.relatedGuides.push(slug);
    renderRelatedList();
    renderTranslationStatus();
    setUnsaved(true);
  }
  if (target.matches("[data-remove-related]")) {
    state.guideDraft.relatedGuides = (state.guideDraft.relatedGuides || []).filter((slug) => slug !== target.dataset.removeRelated);
    renderRelatedList();
    setUnsaved(true);
  }
  if (target.matches("[data-pick-cover]")) {
    syncGuideFromForm();
    state.guideDraft.coverImage = target.dataset.pickCover;
    state.guideDraft.imagePosition ||= "50% 50%";
    state.guideDraft.imageScale = Math.min(1.8, Math.max(1, Number(state.guideDraft.imageScale || 1.02)));
    $("[name='coverImage']").value = target.dataset.pickCover;
    if ($("[name='imagePosition']")) $("[name='imagePosition']").value = state.guideDraft.imagePosition;
    if ($("[name='imageScale']")) $("[name='imageScale']").value = String(state.guideDraft.imageScale);
    $("[data-hero-settings]")?.setAttribute("open", "");
    renderGuideCardImagePreview(state.guideDraft);
    renderGuidePreview();
    setUnsaved(true);
    showToast("攻略卡片图已选择，可以直接拖拽裁剪");
  }
  if (target.matches("[data-card-crop-action]")) {
    const action = target.dataset.cardCropAction;
    syncGuideFromForm();
    const position = parseCropPosition(state.guideDraft.imagePosition || "50% 50%");
    if (action === "fit" || action === "reset") {
      setGuideCropPosition(50, 50, 1.02, { sync: false });
      showToast(action === "fit" ? "已适应前台卡片比例" : "裁剪已重置");
    }
    if (action === "fill") {
      setGuideCropPosition(position.x, position.y, 1.16, { sync: false });
      showToast("图片已填满卡片区域");
    }
    return;
  }
  if (target.matches("[data-cover-dropzone]")) {
    return;
  }
  if (target.matches("[data-upload-guide-cover]")) {
    $("[data-cover-file]")?.click();
  }
  if (target.matches("[data-open-media-picker]")) {
    const pickerTarget = target.dataset.openMediaPicker;
    const category = pickerTarget?.startsWith("city:")
      ? "cities"
      : pickerTarget?.startsWith("experience")
        ? "trips"
        : pickerTarget?.startsWith("guide")
          ? "guides"
          : "";
    const titles = {
      "guide-cover": "选择攻略卡片图",
      "guide-inline": "插入攻略正文图片",
      "guide-collection-image": "选择精选合集图片",
      "experience-cover": "选择行程封面图",
      "experience-gallery": "添加行程图片",
      "experience-day": "选择 Day 图片"
    };
    openMediaPicker(pickerTarget, { category, title: titles[pickerTarget] || "选择城市图片" });
  }
  if (target.matches("[data-close-media-picker]")) closeMediaPicker();
  if (target.matches("[data-pick-media]")) applyPickedMedia(target.dataset.pickMedia);
  if (target.matches("[data-media-usage-target]")) {
    const [type, id] = String(target.dataset.mediaUsageTarget || "").split(":");
    if (type === "guide") {
      switchTab("guides");
      const guide = state.guides.find((item) => item.id === id || item.slug === id);
      if (guide) selectGuide(guide);
    }
    if (type === "city") {
      switchTab("cities");
      const city = state.cities.find((item) => item.id === id || item.slug === id);
      if (city) selectCity(city);
    }
    if (type === "experience") {
      const experience = state.experiences.find((item) => item.id === id || item.slug === id);
      if (experience) {
        switchTab(tabForExperience(experience));
        renderExperienceEditor(experience);
      }
    }
  }
  if (target.matches("[data-upload-city-image]")) {
    const fileInput = $("[data-city-image-file]");
    fileInput.dataset.cityImageField = target.dataset.uploadCityImage;
    fileInput.click();
  }
  if (target.matches("[data-clear-city-image]")) {
    const field = target.dataset.clearCityImage;
    const input = $(`[name="${field}"]`);
    if (input) input.value = "";
    const city = cityDraftFromForm();
    renderCityImagePreview(city);
    setCitySaveStatus("未保存", "dirty");
    setStatus("城市图片已删除，保存后生效。");
    showToast("城市图片已删除，保存后生效");
  }
  if (target.matches("[data-preview-device]")) {
    const preview = $("[data-guide-preview]");
    preview.className = `guide-preview ${target.dataset.previewDevice}`;
  }
  if (target.matches("[data-copy-media]")) {
    try {
      const copied = await copyText(target.dataset.copyMedia);
      if (!copied) throw new Error("Copy failed");
      const previous = target.textContent;
      target.textContent = "✓ 已复制";
      target.disabled = true;
      window.setTimeout(() => {
        target.textContent = previous;
        target.disabled = false;
      }, 1100);
      showToast("素材链接已复制");
    } catch {
      window.prompt("复制素材链接", target.dataset.copyMedia);
    }
  }
  if (target.matches("[data-edit-city]")) selectCity(state.cities.find((item) => item.id === target.dataset.editCity));
  if (target.matches("[data-toggle-experience-list]")) {
    const layout = $(".experience-cms-layout");
    layout?.classList.toggle("is-list-open");
  }
  if (target.matches("[data-edit-experience]")) {
    const experience = state.experiences.find((item) => item.id === target.dataset.editExperience);
    if (experience) {
      switchTab(tabForExperience(experience));
      renderExperienceEditor(experience);
      $(".experience-cms-layout")?.classList.remove("is-list-open");
    }
  }
  if (target.matches("[data-experience-jump]")) {
    const section = target.dataset.experienceJump;
    syncActiveDetailEditorToFields();
    if (section === "preview") {
      const current = state.activeExperienceSection || "content";
      state.experiencePreviewSource = current === "preview" ? (state.experiencePreviewSource || "content") : current;
    }
    setExperienceWorkflowSection(section);
  }
  if (target.matches("[data-detail-tab]")) {
    syncActiveDetailEditorToFields();
    state.currentExperienceDetail = target.dataset.detailTab || "expect";
    renderDetailEditorCanvas();
    $("[data-experience-save-status]").textContent = "未保存";
  }
  if (target.matches("[data-add-detail-item]")) {
    const type = target.dataset.addDetailItem;
    const previousDetail = state.currentExperienceDetail || "expect";
    if (previousDetail !== type && !(previousDetail === "included" && (type === "includedSupport" || type === "notIncluded"))) {
      syncStructuredDetailEditor();
    }
    if (type === "includedSupport" || type === "notIncluded") state.currentExperienceDetail = "included";
    if (type === "faq") state.currentExperienceDetail = "faq";
    if (type === "reviews") state.currentExperienceDetail = "reviews";
    const shouldRenderCanvas = previousDetail !== state.currentExperienceDetail;
    if (shouldRenderCanvas) renderDetailEditorCanvas();
    if (type === "includedSupport" || type === "notIncluded") {
      const list = $(`[data-detail-list-section="${type}"] .detail-list-items`);
      if (list) {
        list.querySelector(".empty")?.remove();
        const index = $$(`[data-detail-list-input="${type}"]`).length;
        list.insertAdjacentHTML("beforeend", `
          <div class="detail-list-row" data-detail-list-row="${type}">
            <span>${type === "includedSupport" ? "✓" : "×"}</span>
            <input data-detail-list-input="${type}" value="" placeholder="${type === "includedSupport" ? "Airport pickup" : "International flights"}" />
            <button class="text-button" type="button" data-remove-detail-item="${type}" data-index="${index}">删除</button>
          </div>
        `);
      }
    }
    if (type === "faq") {
      const editor = $(`[data-detail-mode="faq"] .detail-structured-editor`);
      const index = $$(`[data-detail-item="faq"]`).length;
      editor?.insertAdjacentHTML("beforeend", structuredDetailItemHtml("faq", { question: "", answer: "" }, index));
    }
    if (type === "reviews") {
      const editor = $(`[data-detail-mode="reviews"] .detail-structured-editor`);
      const index = $$(`[data-detail-item="reviews"]`).length;
      editor?.insertAdjacentHTML("beforeend", structuredDetailItemHtml("reviews", { text: "", context: "" }, index));
    }
    $("[data-experience-save-status]").textContent = "未保存";
    updateDetailWordCount();
    const inputs = $$("[data-detail-mode]:not(.is-hidden) input, [data-detail-mode]:not(.is-hidden) textarea");
    const focusTarget = inputs[inputs.length - 1];
    focusTarget?.focus();
  }
  if (target.matches("[data-remove-detail-item]")) {
    syncStructuredDetailEditor();
    const type = target.dataset.removeDetailItem;
    const index = Number(target.dataset.index);
    const values = detailStructuredValues();
    if (type === "includedSupport") {
      setHiddenFieldValue("[data-experience-list='includedSupport']", linesFromList(values.included.filter((_, itemIndex) => itemIndex !== index)));
      state.currentExperienceDetail = "included";
    }
    if (type === "notIncluded") {
      setHiddenFieldValue("[data-experience-list='notIncluded']", linesFromList(values.notIncluded.filter((_, itemIndex) => itemIndex !== index)));
      state.currentExperienceDetail = "included";
    }
    if (type === "faq") {
      setHiddenFieldValue("[data-experience-lines='faqs']", linesFromFaqs(values.faqs.filter((_, itemIndex) => itemIndex !== index)));
      state.currentExperienceDetail = "faq";
    }
    if (type === "reviews") {
      setHiddenFieldValue("[data-experience-lines='reviews']", linesFromReviews(values.reviews.filter((_, itemIndex) => itemIndex !== index)));
      state.currentExperienceDetail = "reviews";
    }
    renderDetailEditorCanvas();
    $("[data-experience-save-status]").textContent = "未保存";
  }
  if (target.matches("[data-journey-preview-mode]")) {
    $$("[data-journey-preview-mode]").forEach((button) => button.classList.toggle("is-active", button === target));
    const preview = $("[data-journey-card-preview]");
    if (preview) preview.dataset.previewMode = target.dataset.journeyPreviewMode;
    renderExperienceSectionPreview(syncExperienceForm(), state.experiencePreviewSource || "content");
  }
  if (target.matches("[data-select-day]")) {
    const days = readItineraryDays();
    state.currentExperienceDay = Number(target.dataset.selectDay);
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
  }
  if (target.matches("[data-add-day]")) {
    const days = readItineraryDays();
    days.push(defaultItineraryDay(days.length));
    state.currentExperienceDay = days.length - 1;
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
    $("[data-experience-save-status]").textContent = "未保存";
  }
  if (target.matches("[data-ai-optimize-day]")) {
    const days = readItineraryDays();
    const day = days[state.currentExperienceDay];
    if (day) {
      day.template = "city";
      day.summary ||= "A calm, paced day built around arrival comfort, one memorable local experience and an easy evening close.";
      day.highlights ||= [
        "Private transfer and smooth first arrival",
        "One signature local moment shaped around the guest's pace",
        "Soft evening plan with hotel return or skyline time"
      ].join("\n");
      day.timeline ||= [
        "09:30 — Private pickup or hotel start",
        "11:00 — Signature neighborhood / experience stop",
        "15:00 — Flexible cafe, shopping or cultural pause",
        "19:00 — Dinner, skyline walk or hotel return"
      ].join("\n");
      day.places ||= "Add 1-3 core places with why they matter and best visiting time.";
      day.experience ||= "Describe what the guest will actually do, feel or discover today.";
      day.practical ||= "Confirm transport windows, weather backup and energy-friendly pacing.";
      $("[name='itineraryDays']").value = JSON.stringify(days);
      renderDayEditor();
      $("[data-experience-save-status]").textContent = "未保存";
      showToast("AI 已优化当前 Day 节奏");
    }
  }
  if (target.matches("[data-save-day-template]")) {
    saveCurrentEditorTemplate("journey");
    return;
  }
  if (target.matches("[data-save-editor-template]")) {
    saveCurrentEditorTemplate(target.dataset.templateKind || "journey");
    target.closest("[data-journey-toolbar-menu]")?.classList.remove("is-open");
    target.closest("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    return;
  }
  if (target.matches("[data-journey-editor-command]")) {
    applyJourneyEditorHistory(target.dataset.journeyEditorCommand);
    return;
  }
  if (target.matches("[data-journey-toolbar-menu-trigger]")) {
    const menu = target.closest("[data-journey-toolbar-menu]");
    const wasOpen = menu?.classList.contains("is-open");
    $$("[data-journey-toolbar-menu]").forEach((item) => {
      item.classList.remove("is-open");
      item.querySelector("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    });
    if (menu && !wasOpen) {
      menu.classList.add("is-open");
      menu.querySelector("[data-journey-toolbar-menu-panel]")?.removeAttribute("hidden");
    }
    return;
  }
  if (target.matches("[data-journey-format-inline]")) {
    applyJourneyInlineFormat(target.dataset.journeyFormatInline, target.dataset.formatValue || "");
    target.closest("[data-journey-toolbar-menu]")?.classList.remove("is-open");
    target.closest("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    return;
  }
  if (target.matches("[data-journey-insert]")) {
    if (target.dataset.journeyInsert === "link") {
      const url = window.prompt("输入链接地址");
      if (url) insertJourneyHtml(`<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(window.getSelection()?.toString() || url)}</a>`, "已插入链接");
    }
    return;
  }
  if (target.matches("[data-journey-insert-media]")) {
    insertJourneyHtml(journeyMediaPlaceholder(target.dataset.journeyInsertMedia), `已插入${target.textContent.trim()}`);
    return;
  }
  if (target.matches("[data-journey-template-option]")) {
    applyEditorTemplate("journey", target.dataset.journeyTemplateOption);
    target.closest("[data-journey-toolbar-menu]")?.classList.remove("is-open");
    target.closest("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    return;
  }
  if (target.matches("[data-editor-template-option]")) {
    applyEditorTemplate(target.dataset.templateKind || "journey", target.dataset.editorTemplateOption);
    target.closest("[data-journey-toolbar-menu]")?.classList.remove("is-open");
    target.closest("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    return;
  }
  if (target.matches("[data-journey-toolbar-action]")) {
    const action = target.dataset.journeyToolbarAction;
    const field = activeDayTextTarget();
    field?.focus?.();
    if (action === "undo") document.execCommand("undo");
    if (action === "redo") document.execCommand("redo");
    field?.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (target.matches("[data-remove-day-section]")) {
    const days = readItineraryDays();
    const index = state.currentExperienceDay;
    const field = target.dataset.removeDaySection;
    days[index] ||= defaultItineraryDay(index);
    const fields = dayOutlineFields(days[index]);
    days[index].outlineFields = fields.filter((item) => item !== field);
    if (!days[index].outlineFields.length && days[index].template !== "free") days[index].template = "free";
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
    renderItineraryPreview(days);
    $("[data-experience-save-status]").textContent = "未保存";
    showToast("已删除当前 section");
  }
  if (target.matches("[data-insert-day-block]")) {
    appendDayModuleSnippet(target.dataset.insertDayBlock);
    target.closest("[data-journey-toolbar-menu]")?.classList.remove("is-open");
    target.closest("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
    showToast("已插入内容块");
  }
  if (target.matches("[data-ai-day-field]")) {
    const field = $(`[data-day-field="${target.dataset.aiDayField}"]`);
    const current = dayFieldValue(field);
    if (field && !current.trim()) {
      const nextValue = {
        morning: "Slow breakfast, hotel pickup and a calm city entry.",
        afternoon: "Local neighborhoods, cafés, shopping support and flexible private transport.",
        evening: "Dinner reservation, rooftop view or quiet recovery arranged around the guest's pace.",
        stayNotes: "Keep timing soft, confirm transport windows and adjust around energy."
      }[target.dataset.aiDayField] || "";
      if ("value" in field) field.value = nextValue;
      else field.innerHTML = editableDayHtml(nextValue);
    } else if (field) {
      const nextValue = current.replace(/\s+/g, " ").trim();
      if ("value" in field) field.value = nextValue;
      else field.innerHTML = editableDayHtml(nextValue);
    }
    field?.dispatchEvent(new Event("input", { bubbles: true }));
    showToast("AI 已处理当前段落");
  }
  if (target.matches("[data-upload-experience-cover]")) {
    const input = $("[data-experience-image-file]");
    input.dataset.experienceImageTarget = "cover";
    input.click();
  }
  if (target.matches("[data-upload-experience-gallery]")) {
    const input = $("[data-experience-image-file]");
    input.dataset.experienceImageTarget = "gallery";
    input.click();
  }
  if (target.matches("[data-upload-day-image]")) {
    const input = $("[data-experience-image-file]");
    input.dataset.experienceImageTarget = "day";
    input.click();
  }
  if (target.matches("[data-clear-experience-cover]")) {
    $("[name='coverImage']").value = "";
    renderExperienceImages(syncExperienceForm());
    renderJourneyCardPreview();
  }
  if (target.matches("[data-remove-experience-gallery]")) {
    const gallery = csvToList($("[name='galleryImages']").value);
    gallery.splice(Number(target.dataset.removeExperienceGallery), 1);
    $("[name='galleryImages']").value = listToCsv(gallery);
    renderExperienceImages(syncExperienceForm());
  }
  if (target.matches("[data-clear-day-image]")) {
    const days = readItineraryDays();
    if (days[state.currentExperienceDay]) days[state.currentExperienceDay].image = "";
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
  }
  if (target.matches("[data-add-experience-tag]")) {
    const input = $("[data-new-experience-tag]");
    const value = input.value.trim();
    if (!value) return;
    const tags = [...new Set([...getSelectedExperienceTags(), value])];
    input.value = "";
    renderExperienceTags(tags);
    $("[name='tags']").value = listToCsv(tags);
    renderJourneyCardPreview();
  }
  if (target.matches("[data-ai-suggest-tags]")) {
    const draft = syncExperienceForm();
    const text = [draft.title, draft.excerpt, draft.duration, draft.city].join(" ").toLowerCase();
    const suggestions = ["Private"];
    if (/luxury|hotel|skyline|premium/.test(text)) suggestions.push("Luxury", "Design Hotels");
    if (/wellness|spa|beauty|recovery/.test(text)) suggestions.push("Wellness");
    if (/family|kid|children/.test(text)) suggestions.push("Family");
    if (/food|cafe|coffee|dinner/.test(text)) suggestions.push("Food & Café");
    if (/shopping|market|sourcing/.test(text)) suggestions.push("Shopping");
    if (/business|tech|factory|founder/.test(text)) suggestions.push("Business");
    suggestions.push("Slow Travel");
    const tags = [...new Set([...(draft.tags || []), ...suggestions])];
    renderExperienceTags(tags);
    $("[name='tags']").value = listToCsv(tags);
    renderJourneyCardPreview(syncExperienceForm());
    renderExperienceWorkflowStatus(syncExperienceForm());
    showToast("AI 已推荐标签");
  }
  if (target.matches("[data-view-inquiry]")) renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.viewInquiry));
  if (target.matches("[data-close-inquiry]")) renderInquiryDetail(null);
  if (target.matches("[data-export-inquiries]")) window.open("/api/admin/inquiries/export", "_blank");
  if (target.matches("[data-copy-inquiry]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.copyInquiry);
    const text = inquirySummary(item || {});
    try {
      const copied = await copyText(text);
      if (!copied) throw new Error("Copy failed");
      const previous = target.textContent;
      target.textContent = "✓ 已复制";
      target.disabled = true;
      target.classList.add("is-copied");
      window.setTimeout(() => {
        target.textContent = previous;
        target.disabled = false;
        target.classList.remove("is-copied");
      }, 1200);
      showToast("客户咨询摘要已复制");
      setStatus("客户咨询摘要已复制。");
    } catch {
      window.prompt("复制客户咨询摘要", text);
    }
  }
  if (target.matches("[data-copy-contact]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.copyContact);
    const text = [`姓名：${item?.name || ""}`, `邮箱：${item?.email || ""}`, `WhatsApp / 电话：${item?.phone || item?.whatsapp || ""}`].join("\n");
    try {
      const copied = await copyText(text);
      if (!copied) throw new Error("Copy failed");
      showToast("联系方式已复制");
    } catch {
      window.prompt("复制联系方式", text);
    }
  }
  if (target.matches("[data-copy-field]")) {
    const text = target.dataset.copyValue || "";
    try {
      const copied = await copyText(text);
      if (!copied) throw new Error("Copy failed");
      const previous = target.textContent;
      target.textContent = "已复制";
      target.classList.add("is-copied");
      window.setTimeout(() => {
        target.textContent = previous;
        target.classList.remove("is-copied");
      }, 1200);
      showToast(`${target.dataset.copyLabel || "内容"}已复制`);
    } catch {
      window.prompt("复制内容", text);
    }
  }
  if (target.matches("[data-save-inquiry-notes]")) {
    await api("/api/admin/inquiries", {
      method: "PATCH",
      body: JSON.stringify({
        id: target.dataset.saveInquiryNotes,
        internalNotes: $("[data-detail-notes]").value,
        tags: checkedCrmTags(),
        owner: $("[data-detail-owner]")?.value || "Migo",
        priority: $("[data-detail-priority]")?.value || "",
        activityLabel: "保存内部备注"
      })
    });
    await loadInquiries();
    await loadOverview();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.saveInquiryNotes));
    setStatus("内部备注已保存。");
    showToast("✓ 内部备注已保存");
  }
  if (target.matches("[data-mark-spam]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.markSpam, status: "spam" }) });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.markSpam));
    setStatus("已标记为垃圾咨询。");
  }
  if (target.matches("[data-archive-inquiry]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.archiveInquiry, status: "lost" }) });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.archiveInquiry));
    setStatus("咨询已归档。");
  }

  const deleteMap = [
    ["deleteGuide", "/api/admin/guides", loadGuides],
    ["deleteCity", "/api/admin/cities", loadCities],
    ["deleteExperience", "/api/admin/experiences", loadExperiences],
    ["deleteInquiry", "/api/admin/inquiries", loadInquiries],
    ["deleteMedia", "/api/admin/media", loadMedia]
  ];
  for (const [key, path, loader] of deleteMap) {
    if (target.dataset[key]) {
      if (key === "deleteMedia") {
        const item = state.media.find((media) => media.id === target.dataset[key]);
        const usage = item?.usage || [];
        if (usage.length) {
          const message = `这张图片正在被以下内容使用：\n${usage.map((entry) => `- ${entry.label}`).join("\n")}\n\n删除后可能影响页面显示。确认删除？`;
          if (!window.confirm(message)) return;
        } else if (!window.confirm("确认删除这张未使用图片？")) {
          return;
        }
      }
      await api(`${path}?id=${encodeURIComponent(target.dataset[key])}`, { method: "DELETE" });
      await loader();
      await loadOverview();
      setStatus("已删除。");
    }
  }
});

document.addEventListener("keydown", (event) => {
  const mod = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();
  const inGuideEditor = state.guideDraft && !$("[data-panel='guides']")?.classList.contains("is-hidden");
  const isWriting = document.activeElement?.matches?.("[data-visual-editor], [data-raw-editor]");
  const isJourneyWriting = document.activeElement?.matches?.("[data-journey-visual-editor]");
  if (mod && key === "s" && inGuideEditor) {
    event.preventDefault();
    $("[data-guide-form]")?.requestSubmit();
    return;
  }
  if (mod && isJourneyWriting) {
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      restoreVisualSelection("journey");
      applyEditorHistory("undo");
      return;
    }
    if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      restoreVisualSelection("journey");
      applyEditorHistory("redo");
      return;
    }
    if (key === "b") {
      event.preventDefault();
      applyInlineFormat("bold");
      return;
    }
    if (key === "k") {
      event.preventDefault();
      insertGuideElement("link");
      return;
    }
  }
  if (!mod || !isWriting) return;
  if (key === "z" && !event.shiftKey) {
    event.preventDefault();
    restoreVisualSelection(state.lastVisualSelection?.lang || state.currentGuideLang);
    applyEditorHistory("undo");
    return;
  }
  if ((key === "z" && event.shiftKey) || key === "y") {
    event.preventDefault();
    restoreVisualSelection(state.lastVisualSelection?.lang || state.currentGuideLang);
    applyEditorHistory("redo");
    return;
  }
  if (key === "b") {
    event.preventDefault();
    applyInlineFormat("bold");
    return;
  }
  if (key === "k") {
    event.preventDefault();
    insertGuideElement("link");
  }
});

window.addEventListener("beforeunload", (event) => {
  if ($("[data-unsaved-state]")?.classList.contains("is-unsaved")) {
    event.preventDefault();
    event.returnValue = "";
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches("[data-editor-media-control]")) {
    handleMediaStyleControl(target, { toast: true });
    return;
  }
  if (target.matches("[data-day-template]")) {
    const days = readItineraryDays();
    const index = state.currentExperienceDay;
    days[index] ||= defaultItineraryDay(index);
    applyDayTemplateToOutline(days[index], target.value);
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayEditor();
    renderItineraryPreview(days);
    $("[data-experience-save-status]").textContent = "未保存";
    showToast(`已切换为 ${getDayTemplate(days[index].template).label}`);
    return;
  }
  if (target.matches("[data-guide-collection-guide]")) {
    updateGuideCollectionGuideSlugs();
  }
  if (target.matches("[data-inquiry-status]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.inquiryStatus, status: target.value }) });
    await loadInquiries();
    await loadOverview();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.inquiryStatus));
    setStatus("咨询状态已更新。");
  }
  if (target.matches("[data-detail-owner-select]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.detailOwnerSelect, owner: target.value }) });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.detailOwnerSelect));
    showToast("负责人已更新");
  }
});

document.addEventListener("focusin", (event) => {
  const dayField = event.target?.closest?.("[data-day-field]");
  if (!dayField || dayField.type === "hidden") return;
  state.activeDayField = dayField.dataset.dayField || "body";
  if (dayField.matches?.("[data-journey-visual-editor]")) rememberJourneySelection();
});

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const node = selection.anchorNode;
  const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  const dayEditor = element?.closest?.("[data-day-field][contenteditable='true']");
  if (!dayEditor) return;
  state.activeDayField = dayEditor.dataset.dayField || "body";
  state.lastDaySelection = { element: dayEditor, range: selection.getRangeAt(0).cloneRange() };
  if (dayEditor.matches("[data-journey-visual-editor]")) updateDayWordCount();
});

document.addEventListener("beforeinput", (event) => {
  const journeyEditor = event.target?.closest?.("[data-journey-visual-editor]");
  if (journeyEditor) {
    state.journeyEditorHistory.pendingBefore = journeyEditor.innerHTML;
    return;
  }
  const visual = event.target?.closest?.("[data-visual-editor]");
  if (!visual) return;
  const lang = visual.dataset.visualEditor || state.currentGuideLang;
  const history = getEditorHistory(lang);
  history.pendingBefore = visual.innerHTML;
}, true);

document.addEventListener("mousedown", (event) => {
  const handle = event.target.closest?.("[data-media-resize-handle]");
  if (handle) {
    startMediaResize(event, handle);
    return;
  }
  const cropImage = event.target.closest?.("[data-editor-media] img");
  if (cropImage) {
    startMediaCropDrag(event, cropImage);
  }
});

document.addEventListener("mousemove", (event) => {
  if (state.mediaResizeDrag) moveMediaResize(event);
  if (state.mediaCropDrag) moveMediaCropDrag(event);
});

document.addEventListener("mouseup", () => {
  if (state.mediaResizeDrag) endMediaResize();
  if (state.mediaCropDrag) endMediaCropDrag();
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-editor-media-control]")) {
    handleMediaStyleControl(target, { toast: false });
    return;
  }
  if (target.matches("[data-day-field]")) {
    if (target.matches("[data-journey-visual-editor]")) {
      const history = state.journeyEditorHistory;
      const current = target.innerHTML;
      const before = history.pendingBefore ?? history.last;
      delete history.pendingBefore;
      pushJourneyHistory(before, current);
      history.last = current;
      pushEditorHistory("journey", before, current);
      rememberJourneySelection();
      rememberVisualSelection();
      updateDayWordCount();
    }
    const days = readItineraryDays();
    $("[name='itineraryDays']").value = JSON.stringify(days);
    renderDayListTitles(days);
    renderItineraryPreview(days);
    return;
  }
  if (target.matches("[data-guide-collection-form] [name='categories']")) {
    const input = $("[data-guide-collection-form] [name='guideSlugs']");
    if (input) input.value = "";
    renderGuideCollectionGuidePicker([]);
  }
});

document.addEventListener("dragstart", (event) => {
  const cityRow = event.target.closest("[data-city-order-id]");
  if (cityRow) {
    draggedCityId = cityRow.dataset.cityOrderId;
    cityRow.classList.add("is-dragging");
    event.dataTransfer?.setData("text/plain", draggedCityId);
    return;
  }
  const block = event.target.closest("[data-block]");
  if (!block) return;
  draggedBlock = { lang: block.dataset.block, index: Number(block.dataset.index) };
  block.classList.add("is-dragging");
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-city-order-id]")?.classList.remove("is-dragging");
  draggedCityId = null;
  event.target.closest("[data-block]")?.classList.remove("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-block], [data-city-order-id], [data-city-image-drop], [data-media-form], [data-media-modal], [data-visual-editor]")) event.preventDefault();
});

document.addEventListener("dragenter", (event) => {
  event.target.closest("[data-city-image-drop]")?.classList.add("is-drag-over");
});

document.addEventListener("dragleave", (event) => {
  const dropCard = event.target.closest("[data-city-image-drop]");
  if (dropCard && !dropCard.contains(event.relatedTarget)) dropCard.classList.remove("is-drag-over");
});

document.addEventListener("drop", async (event) => {
  const cityImageDrop = event.target.closest("[data-city-image-drop]");
  if (cityImageDrop && event.dataTransfer?.files?.length) {
    event.preventDefault();
    cityImageDrop.classList.remove("is-drag-over");
    await uploadCityImageFile(event.dataTransfer.files[0], cityImageDrop.dataset.cityImageDrop);
    return;
  }
  const mediaDrop = event.target.closest("[data-media-form], [data-media-modal]");
  if (mediaDrop && event.dataTransfer?.files?.length) {
    event.preventDefault();
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
    const category = mediaDrop.matches("[data-media-modal]")
      ? ($("[data-picker-category]")?.value || state.mediaPicker?.category || "common")
      : ($("[data-media-form] [name='category']")?.value || "common");
    for (const file of files) await uploadAdminImage(file, category === "unused" ? "common" : category);
    await loadMedia();
    renderMediaPicker();
    showToast(`已上传 ${files.length} 张素材`);
    return;
  }
  const cityRow = event.target.closest("[data-city-order-id]");
  if (draggedCityId && cityRow) {
    event.preventDefault();
    await reorderCities(draggedCityId, cityRow.dataset.cityOrderId);
    return;
  }
  const rawEditor = event.target.closest("[data-raw-editor]");
  if (rawEditor && event.dataTransfer?.files?.length) {
    event.preventDefault();
    rawEditor.focus();
    insertImageFiles(event.dataTransfer.files, event.dataTransfer.files.length > 1);
    return;
  }
  const visualEditor = event.target.closest("[data-visual-editor]");
  if (visualEditor && event.dataTransfer?.files?.length) {
    event.preventDefault();
    visualEditor.focus();
    setVisualSelectionFromPoint(visualEditor, event.clientX, event.clientY);
    captureMediaInsertionPoint(visualEditor.dataset.visualEditor || state.currentGuideLang);
    const file = event.dataTransfer.files[0];
    const kind = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : file.type === "image/gif" ? "gif" : "image";
    insertMediaFiles(event.dataTransfer.files, kind);
    return;
  }
  const richEditor = event.target.closest("[data-rich-editor]");
  if (richEditor && event.dataTransfer?.files?.length) {
    event.preventDefault();
    richEditor.focus();
    insertImageFiles(event.dataTransfer.files, event.dataTransfer.files.length > 1);
    return;
  }
  const coverZone = event.target.closest("[data-cover-dropzone]");
  if (coverZone && event.dataTransfer?.files?.length) {
    event.preventDefault();
    uploadCoverFile(event.dataTransfer.files[0]);
    return;
  }
  const docxZone = event.target.closest("[data-docx-dropzone]");
  if (docxZone && event.dataTransfer?.files?.length) {
    event.preventDefault();
    importDocxFile(event.dataTransfer.files[0]);
    return;
  }
  const targetBlock = event.target.closest("[data-block]");
  if (!draggedBlock || !targetBlock || targetBlock.dataset.block !== draggedBlock.lang) return;
  event.preventDefault();
  const nextIndex = Number(targetBlock.dataset.index);
  if (Number.isNaN(nextIndex) || nextIndex === draggedBlock.index) return;
  syncBlocksFromDom(draggedBlock.lang);
  const blocks = getGuideTranslation(state.guideDraft, draggedBlock.lang).contentBlocks;
  const [moved] = blocks.splice(draggedBlock.index, 1);
  blocks.splice(nextIndex, 0, moved);
  draggedBlock = null;
  renderBlockEditors();
  renderTranslationStatus();
  renderGuidePreview();
  setUnsaved(true);
  scheduleGuideAutosave();
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-raw-editor], [data-rich-editor], [data-cover-dropzone], [data-docx-dropzone], [data-city-image-drop], [data-media-form], [data-media-modal]")) event.preventDefault();
});

document.addEventListener("pointerdown", (event) => {
  const canvas = event.target.closest("[data-card-crop-canvas]");
  if (!canvas) return;
  const hasImage = state.guideDraft?.coverImage || $("[name='coverImage']")?.value;
  if (!hasImage) return;
  const position = parseCropPosition(state.guideDraft?.imagePosition || $("[name='imagePosition']")?.value || "50% 50%");
  cardCropDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: position.x,
    y: position.y,
    rect: canvas.getBoundingClientRect(),
    canvas,
    scale: Number($("[name='imageScale']")?.value || state.guideDraft?.imageScale || 1.02)
  };
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});

document.addEventListener("pointermove", (event) => {
  if (!cardCropDrag) return;
  const dx = event.clientX - cardCropDrag.startX;
  const dy = event.clientY - cardCropDrag.startY;
  const scale = Math.max(1, cardCropDrag.scale || 1);
  const nextX = cardCropDrag.x - (dx / Math.max(1, cardCropDrag.rect.width)) * 100 / scale;
  const nextY = cardCropDrag.y - (dy / Math.max(1, cardCropDrag.rect.height)) * 100 / scale;
  setGuideCropPosition(nextX, nextY, undefined, { sync: false, preview: false, autosave: false });
  event.preventDefault();
});

document.addEventListener("pointerup", (event) => {
  if (!cardCropDrag) return;
  cardCropDrag.canvas?.releasePointerCapture?.(cardCropDrag.pointerId);
  cardCropDrag = null;
  renderGuidePreview();
  scheduleGuideAutosave();
  showToast("卡片裁剪已更新");
});

document.addEventListener("pointercancel", () => {
  cardCropDrag = null;
});

document.addEventListener("wheel", (event) => {
  const canvas = event.target.closest("[data-card-crop-canvas]");
  if (!canvas) return;
  const hasImage = state.guideDraft?.coverImage || $("[name='coverImage']")?.value;
  if (!hasImage) return;
  event.preventDefault();
  const position = parseCropPosition(state.guideDraft?.imagePosition || $("[name='imagePosition']")?.value || "50% 50%");
  const currentScale = Number($("[name='imageScale']")?.value || state.guideDraft?.imageScale || 1.02);
  const nextScale = Math.min(1.8, Math.max(1, currentScale + (event.deltaY > 0 ? -0.04 : 0.04)));
  setGuideCropPosition(position.x, position.y, nextScale, { sync: false });
}, { passive: false });

async function uploadCoverFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  setStatus("正在上传攻略卡片图...");
  const media = await uploadAdminImage(file, "guides");
  syncGuideFromForm();
  state.guideDraft.coverImage = media.url;
  state.guideDraft.coverAlt = media.alt || file.name;
  state.guideDraft.imagePosition ||= "50% 50%";
  state.guideDraft.imageScale = Math.min(1.8, Math.max(1, Number(state.guideDraft.imageScale || 1.02)));
  $("[name='coverImage']").value = media.url;
  $("[name='coverAlt']").value = media.alt || file.name;
  if ($("[name='imagePosition']")) $("[name='imagePosition']").value = state.guideDraft.imagePosition;
  if ($("[name='imageScale']")) $("[name='imageScale']").value = String(state.guideDraft.imageScale);
  $("[data-hero-settings]")?.setAttribute("open", "");
  renderGuideCardImagePreview(state.guideDraft);
  renderGuidePreview();
  setUnsaved(true);
  setStatus("攻略卡片图已上传。");
  showToast("图片已上传，可以直接拖拽裁剪");
}

async function uploadCityImageFile(file, field) {
  if (!file || !file.type.startsWith("image/") || !field) return;
  setStatus("正在上传城市图片...");
  try {
    setCitySaveStatus("正在上传图片...", "saving");
    const media = await uploadAdminImage(file, "cities");
    const input = $(`[name="${field}"]`);
    if (input) input.value = media.url;
    const city = cityDraftFromForm();
    renderCityImagePreview(city);
    setCitySaveStatus("未保存", "dirty");
    setStatus("城市图片已上传，记得保存城市。");
    showToast("✓ 图片已上传到素材中心");
  } catch (error) {
    setCitySaveStatus("上传失败，请重试", "error");
    setStatus(`城市图片上传失败：${error.message}`);
    showToast(error.message);
  }
}

async function uploadExperienceImageFile(file, target) {
  if (!file || !file.type.startsWith("image/") || !target) return;
  setStatus("正在上传行程图片...");
  try {
    const media = await uploadAdminImage(file, "trips");
    if (target === "cover") {
      $("[name='coverImage']").value = media.url;
    }
    if (target === "gallery") {
      const gallery = csvToList($("[name='galleryImages']").value);
      gallery.push(media.url);
      $("[name='galleryImages']").value = listToCsv(gallery);
    }
    if (target === "day") {
      const days = readItineraryDays();
      days[state.currentExperienceDay] ||= { title: `Day ${state.currentExperienceDay + 1}` };
      days[state.currentExperienceDay].image = media.url;
      $("[name='itineraryDays']").value = JSON.stringify(days);
      renderDayEditor();
    }
    const draft = syncExperienceForm();
    renderExperienceImages(draft);
    renderJourneyCardPreview(draft);
    renderExperienceWorkflowStatus(draft);
    renderItineraryPreview(draft.itineraryDays || []);
    $("[data-experience-save-status]").textContent = "未保存";
    setStatus("行程图片已上传，记得保存。");
    showToast("行程图片已上传");
  } catch (error) {
    setStatus(`行程图片上传失败：${error.message}`);
    showToast(error.message);
  }
}

async function importDocxFile(file) {
  if (!file || !file.name.toLowerCase().endsWith(".docx")) {
    showToast("请上传 .docx 文件");
    return;
  }
  setStatus("正在导入 Word 攻略...");
  const dataUrl = await fileToDataUrl(file);
  try {
    const response = await api("/api/import/docx", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, dataUrl })
    });
    syncGuideFromForm();
    const translation = getGuideTranslation(state.guideDraft, state.currentGuideLang);
    translation.rawContent = response.data.rawContent;
    translation.htmlContent = response.data.htmlContent;
    if (!translation.title || translation.title === "Untitled Guide" || translation.title === "未命名攻略") translation.title = response.data.title;
    if (!translation.excerpt) translation.excerpt = response.data.excerpt;
    if (response.data.coverImage && !state.guideDraft.coverImage) {
      state.guideDraft.coverImage = response.data.coverImage;
      state.guideDraft.coverAlt = response.data.title;
    }
    renderGuideEditor();
    setUnsaved(true);
    setStatus("Word 攻略已导入。");
    showToast("Word 攻略已导入");
  } catch (error) {
    setStatus(error.message);
    showToast(error.message);
  }
}

["input", "change"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    if (event.target.matches("[data-inquiry-search], [data-filter-status], [data-filter-city], [data-filter-dates], [data-filter-created], [data-filter-stay], [data-filter-travelers]")) {
      renderInquiryList();
    }
    if (event.target.matches("[data-guide-search], [data-guide-filter-city], [data-guide-filter-category], [data-guide-filter-language], [data-guide-filter-status], [data-guide-filter-date], [data-guide-sort]")) {
      renderGuideList();
    }
    if (event.target.matches("[data-city-search], [data-city-filter]")) {
      renderCityList();
    }
    if (event.target.matches("[data-experience-filter-type]")) {
      const nextMode = event.target.value === "short_experience" ? "short_experience" : "recommended_journey";
      if (nextMode !== state.activeExperienceMode) {
        switchTab(experienceModeMeta(nextMode).tab);
        return;
      }
      renderExperienceList();
    }
    if (event.target.matches("[data-experience-search]")) renderExperienceList();
    if (event.target.matches("[data-editor-template-search]")) {
      const panel = event.target.closest("[data-journey-toolbar-menu-panel]");
      const query = event.target.value.trim().toLowerCase();
      panel?.querySelectorAll("[data-template-card]").forEach((card) => {
        const matches = !query || (card.dataset.templateSearchText || "").includes(query);
        card.hidden = !matches;
      });
    }
    if (event.target.matches("[data-template-search]")) {
      renderTemplateList();
    }
    if (event.target.closest("[data-template-form]")) {
      const draft = templateDraftFromForm();
      $("[data-current-template-title]").textContent = draft.title || "未命名模板";
      $("[data-template-save-status]").textContent = "未保存";
      renderTemplatePreview();
    }
    if (event.target.closest("[data-city-form]")) {
      if (event.target.name === "name") {
        const slugInput = $("[data-city-form] [name='slug']");
        if (slugInput && (!slugInput.value || slugInput.dataset.autoSlug === "true")) {
          slugInput.value = citySlugFromName(event.target.value);
          slugInput.dataset.autoSlug = "true";
        }
      }
      if (event.target.name === "slug") {
        event.target.value = citySlugFromName(event.target.value);
        event.target.dataset.autoSlug = event.target.value ? "false" : "true";
      }
      const city = cityDraftFromForm();
      $("[data-current-city-title]").textContent = city.name || "未命名城市";
      $("[data-city-page-preview]").textContent = `最终页面地址：/cities/${city.slug || ""}`;
      renderCityAssociations(city);
      renderCityImagePreview(city);
      renderCityCardPreview(city);
      renderCityPublishChecks(city);
      setCitySaveStatus("未保存", "dirty");
    }
    if (event.target.closest("[data-experience-form]")) {
      if (event.target.name === "title") {
        const slugInput = $("[data-experience-form] [name='slug']");
        if (slugInput && (!slugInput.value || slugInput.dataset.autoSlug === "true")) {
          slugInput.value = experienceSlugFromTitle(event.target.value);
          slugInput.dataset.autoSlug = "true";
        }
      }
      if (event.target.name === "slug") {
        event.target.value = experienceSlugFromTitle(event.target.value);
        event.target.dataset.autoSlug = event.target.value ? "false" : "true";
      }
      if (event.target.matches("[data-experience-type]")) {
        state.activeExperienceMode = event.target.value === "short_experience" ? "short_experience" : "recommended_journey";
        updateExperienceModuleChrome();
        renderExperienceTypeEditor();
        renderExperienceList();
      }
      if (event.target.matches("[data-day-field]")) {
        const days = readItineraryDays();
        $("[name='itineraryDays']").value = JSON.stringify(days);
        renderDayListTitles(days);
        renderItineraryPreview(days);
      }
      if (event.target.matches("[data-short-field]")) {
        $("[name='shortDetails']").value = JSON.stringify(readShortDetails());
        updateShortWordCount();
      }
      if (event.target.closest("[data-experience-tag]")) {
        $("[name='tags']").value = listToCsv(getSelectedExperienceTags());
      }
      const draft = syncExperienceForm();
      $("[data-current-experience-title]").textContent = draft.title || `未命名${experienceModeMeta(draft.type).editLabel}`;
      $("[data-experience-page-preview]").textContent = `/trips/${draft.slug || ""}`;
      renderJourneyCardPreview(draft);
      renderExperienceWorkflowStatus(draft);
      renderItineraryPreview(draft.itineraryDays || []);
      $("[data-experience-save-status]").textContent = "未保存";
    }
    if (event.target.matches("[data-related-search]")) {
      renderRelatedSelect();
    }
    if (event.target.matches("[data-raw-editor]")) {
      applySlashCommand(event.target);
      autoSizeEditor(event.target);
      updateWordCount(event.target);
      updateSelectionAiToolbar();
    }
    if (event.target.matches("[data-visual-editor]")) {
      state.currentGuideLang = event.target.dataset.visualEditor || state.currentGuideLang;
      recordVisualInputHistory(state.currentGuideLang);
      syncRawFromVisualEditor(state.currentGuideLang);
      if (event.target.matches("[data-detail-visual-editor]")) updateDetailWordCount();
      updateSelectionAiToolbar();
      updateToolbarState(event.target);
    }
    if (event.target.matches("[data-detail-list-input], [data-detail-faq-field], [data-detail-review-field]")) {
      syncStructuredDetailEditor();
      updateDetailWordCount();
      const status = $("[data-experience-save-status]");
      if (status) status.textContent = "未保存";
    }
    if (event.target.matches("[data-card-scale]")) {
      syncGuideFromForm();
      renderGuideCardImagePreview(state.guideDraft);
      renderGuidePreview();
      setUnsaved(true);
      scheduleGuideAutosave();
    }
    if (event.target.closest("[data-guide-form]")) {
      syncGuideFromForm();
      $("[data-editor-title]").textContent = state.guideDraft.title || "未命名攻略";
      if ($("[data-editor-status]")) $("[data-editor-status]").textContent = zhStatus(state.guideDraft.status);
      if (event.target.name === "coverImage") {
        renderGuideCardImagePreview(state.guideDraft);
      }
      renderGuidePreview();
      renderTranslationStatus();
      renderGuideWorkflowStatus(state.guideDraft);
      setUnsaved(true);
      scheduleGuideAutosave();
    }
    if (event.target.matches("[data-cover-file]")) {
      uploadCoverFile(event.target.files?.[0]);
    }
    if (event.target.matches("[data-city-image-file]")) {
      uploadCityImageFile(event.target.files?.[0], event.target.dataset.cityImageField);
      event.target.value = "";
    }
    if (event.target.matches("[data-experience-image-file]")) {
      uploadExperienceImageFile(event.target.files?.[0], event.target.dataset.experienceImageTarget);
      event.target.value = "";
    }
    if (event.target.matches("[data-docx-file]")) {
      importDocxFile(event.target.files?.[0]);
    }
    if (event.target.matches("[data-picker-search], [data-picker-category]")) {
      renderMediaPicker();
    }
    if (event.target.matches("[data-picker-upload]")) {
      const category = $("[data-picker-category]")?.value || state.mediaPicker?.category || "common";
      const files = [...(event.target.files || [])].filter((file) => file.type.startsWith("image/"));
      (async () => {
        for (const file of files) await uploadAdminImage(file, category === "unused" ? "common" : category);
        await loadMedia();
        renderMediaPicker();
        showToast(`已上传 ${files.length} 张素材`);
        event.target.value = "";
      })();
    }
    if (event.target.matches("[data-media-search], [data-media-category-filter]")) {
      loadMedia();
    }
  });

  document.addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-journey-toolbar-menu-trigger], [data-journey-format-inline], [data-journey-editor-command], [data-journey-insert], [data-journey-insert-media], [data-insert-day-block], [data-journey-template-option], [data-editor-template-option], [data-save-editor-template]")) {
      rememberJourneySelection();
      rememberVisualSelection();
      event.preventDefault();
      return;
    }
    if (event.target.closest("[data-journey-toolbar-menu]")) {
      rememberJourneySelection();
      rememberVisualSelection();
      return;
    }
    if (event.target.closest("[data-toolbar-menu-trigger]")) {
      rememberVisualSelection();
      event.preventDefault();
      return;
    }
    if (event.target.closest("[data-format-inline], [data-editor-command]")) {
      rememberVisualSelection();
      event.preventDefault();
      return;
    }
    if (event.target.closest("[data-insert-guide-element], [data-insert-media]")) {
      rememberVisualSelection();
      event.preventDefault();
      return;
    }
    if (event.target.closest(".toolbar-menu")) {
      rememberVisualSelection();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".toolbar-menu")) closeToolbarMenus();
    if (!event.target.closest("[data-journey-toolbar-menu]")) {
      $$("[data-journey-toolbar-menu].is-open").forEach((menu) => {
        menu.classList.remove("is-open");
        menu.querySelector("[data-journey-toolbar-menu-panel]")?.setAttribute("hidden", "");
      });
    }
  });

  document.addEventListener("paste", (event) => {
    pasteIntoVisualEditor(event);
  });

  document.addEventListener("selectionchange", () => {
    rememberVisualSelection();
    if (document.activeElement?.matches?.("[data-raw-editor], [data-visual-editor]")) {
      updateSelectionAiToolbar();
      updateToolbarState();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.target?.matches?.("[data-raw-editor], [data-visual-editor]")) {
      rememberVisualSelection();
      updateSelectionAiToolbar();
      updateToolbarState(event.target.closest("[data-visual-editor]") || undefined);
    }
  });

  document.addEventListener("mouseup", (event) => {
    if (event.target?.matches?.("[data-raw-editor], [data-visual-editor]")) {
      rememberVisualSelection();
      updateSelectionAiToolbar();
      updateToolbarState(event.target.closest("[data-visual-editor]") || undefined);
    }
  });

  window.addEventListener("scroll", () => {
    if (state.selectedMediaFigure?.isConnected) positionMediaToolbar(state.selectedMediaFigure);
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (state.selectedMediaFigure?.isConnected) positionMediaToolbar(state.selectedMediaFigure);
  });
});

api("/api/auth/session")
  .then(async (session) => {
    if (session.authenticated) {
      showDashboard();
      await refreshAll();
    } else {
      showLogin();
    }
  })
  .catch(() => showLogin());
