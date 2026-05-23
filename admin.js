const state = {
  overview: null,
  inquiries: [],
  guides: [],
  cities: [],
  experiences: [],
  media: [],
  currentGuideId: null,
  currentGuideLang: "en",
  guideDraft: null,
  guideAutosaveTimer: null
};

let draggedBlock = null;

const inquiryStatuses = ["new", "reviewed", "contacted", "planning", "quoted", "confirmed", "lost", "spam"];

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

function parseBlocks(value) {
  if (!String(value || "").trim()) return [];
  return JSON.parse(value);
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

function defaultGuide() {
  const id = `guide-${Date.now()}`;
  return {
    id,
    title: "Untitled Guide",
    slug: "",
    city: "",
    category: "Payments",
    tags: [],
    coverImage: "",
    coverAlt: "",
    mobileCoverImage: "",
    readTime: "5 min read",
    author: "ChinaMigo Editorial",
    status: "draft",
    publishedAt: "",
    scheduledAt: "",
    relatedGuides: [],
    translations: {
      en: { title: "Untitled Guide", excerpt: "", htmlContent: "", contentBlocks: [], seo: { title: "", description: "" } },
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

function inlineMarkdown(text = "") {
  return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
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
    const cta = trimmed.match(/^CTA:\s*(.*?)\s*\|\s*(.+)$/i);
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      bullets.push(trimmed.slice(2).trim());
    } else if (image) {
      flushParagraph();
      flushBullets();
      html.push(`<figure><img src="/${escapeHtml(image[2].replace(/^\/+/, ""))}" alt="${escapeHtml(image[1])}"><figcaption>${escapeHtml(image[1])}</figcaption></figure>`);
    } else if (cta) {
      flushParagraph();
      flushBullets();
      html.push(`<p><a class="cms-cta" href="${escapeHtml(cta[2])}">${escapeHtml(cta[1])}</a></p>`);
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
    en: Boolean(en.title && (en.excerpt || en.contentBlocks.length)),
    cn: Boolean(cn.title && (cn.excerpt || cn.contentBlocks.length))
  };
}

function fillForm(form, values = {}) {
  [...form.elements].forEach((field) => {
    if (!field.name) return;
    const value = values[field.name];
    if (Array.isArray(value)) field.value = listToCsv(value);
    else if (field.name === "contentBlocks") field.value = JSON.stringify(value || [], null, 2);
    else if (typeof value === "boolean") field.value = String(value);
    else field.value = value ?? "";
  });
}

function formValues(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  if ("relatedGuides" in payload) payload.relatedGuides = csvToList(payload.relatedGuides);
  if ("tags" in payload) payload.tags = csvToList(payload.tags);
  if ("galleryImages" in payload) payload.galleryImages = csvToList(payload.galleryImages);
  if ("contentBlocks" in payload) payload.contentBlocks = parseBlocks(payload.contentBlocks);
  if ("sortOrder" in payload) payload.sortOrder = Number(payload.sortOrder || 0);
  if ("active" in payload) payload.active = payload.active === "true";
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

function inquirySummary(item) {
  return [
    `ChinaMigo Inquiry`,
    `Name: ${item.name || ""}`,
    `Email: ${item.email || ""}`,
    `WhatsApp / Phone: ${item.phone || item.whatsapp || ""}`,
    `Travel dates: ${item.travelDates || ""}`,
    `Travelers: ${item.travelers || ""}`,
    `Cities: ${item.citiesInterestedIn || item.cities || ""}`,
    `Stay level: ${item.preferredStayLevel || item.stayLevel || ""}`,
    `Trip style: ${(item.tripStyle || []).join(", ")}`,
    `Status: ${item.status || "new"}`,
    `Notes: ${item.notes || ""}`,
    `Internal notes: ${item.internalNotes || ""}`
  ].join("\n");
}

function compactDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function contactLine(item) {
  const contacts = [item.email, item.phone || item.whatsapp].filter(Boolean);
  return contacts.length ? contacts.join(" · ") : "<em>missing contact info</em>";
}

function latestActivity(item) {
  const activity = item.activity || [];
  return activity.length ? activity[activity.length - 1].label : "Inquiry submitted";
}

function filteredInquiries() {
  const query = ($("[data-inquiry-search]")?.value || "").toLowerCase();
  const status = $("[data-filter-status]")?.value || "";
  const city = ($("[data-filter-city]")?.value || "").toLowerCase();
  const dates = ($("[data-filter-dates]")?.value || "").toLowerCase();
  const created = ($("[data-filter-created]")?.value || "").toLowerCase();
  const stay = ($("[data-filter-stay]")?.value || "").toLowerCase();
  const travelers = ($("[data-filter-travelers]")?.value || "").toLowerCase();
  return state.inquiries.filter((item) => {
    const haystack = [item.name, item.email, item.phone, item.whatsapp, item.notes].join(" ").toLowerCase();
    return (!query || haystack.includes(query))
      && (!status || item.status === status)
      && (!city || String(item.citiesInterestedIn || item.cities || "").toLowerCase().includes(city))
      && (!dates || String(item.travelDates || "").toLowerCase().includes(dates))
      && (!created || String(item.createdAt || "").toLowerCase().includes(created))
      && (!stay || String(item.preferredStayLevel || item.stayLevel || "").toLowerCase().includes(stay))
      && (!travelers || String(item.travelers || "").toLowerCase().includes(travelers));
  });
}

function renderInquiryList() {
  const items = filteredInquiries();
  $("[data-inquiries-list]").innerHTML = items.map((item) => {
    const tags = (item.tags || []).map((tag) => `<span>${tag}</span>`).join("");
    return `
      <article class="inquiry-row" data-row-inquiry="${item.id}">
        <button class="inquiry-main" type="button" data-view-inquiry="${item.id}">
          <strong>${item.name || "Unnamed visitor"}</strong>
          <span>${[item.travelDates || "No dates", item.travelers, item.citiesInterestedIn || item.cities].filter(Boolean).join(" · ")}</span>
          <small>${contactLine(item)}</small>
        </button>
        <div class="inquiry-tags">${tags || "<span>untagged</span>"}</div>
        <div class="inquiry-activity">
          <span>Updated ${compactDate(item.updatedAt || item.createdAt)}</span>
          <small>${latestActivity(item)}</small>
        </div>
        <div class="inquiry-controls">
          <details class="status-control">
            <summary>${item.status || "new"}</summary>
            <select data-inquiry-status="${item.id}">
              ${inquiryStatuses.map((status) => `<option ${status === (item.status || "new") ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </details>
          <button class="copy-button" data-copy-inquiry="${item.id}" type="button">Copy</button>
          <details class="more-menu">
            <summary>•••</summary>
            <div>
              <button type="button" data-archive-inquiry="${item.id}">Archive</button>
              <button type="button" data-mark-spam="${item.id}">Mark spam</button>
              <button type="button" data-delete-inquiry="${item.id}">Delete</button>
            </div>
          </details>
        </div>
      </article>
    `;
  }).join("") || "<p class='empty'>No inquiries match your filters.</p>";
}

function renderInquiryDetail(item) {
  const detail = $("[data-inquiry-detail]");
  if (!item) {
    detail.classList.add("is-hidden");
    detail.innerHTML = "";
    return;
  }
  detail.classList.remove("is-hidden");
  detail.innerHTML = `
    <div class="detail-head">
      <div>
        <p class="eyebrow">Inquiry detail</p>
        <h3>${item.name || "Unnamed visitor"}</h3>
      </div>
      <button class="secondary" type="button" data-close-inquiry>Close</button>
    </div>
    <dl class="detail-grid">
      <div><dt>Email</dt><dd>${item.email || "—"}</dd></div>
      <div><dt>WhatsApp / Phone</dt><dd>${item.phone || item.whatsapp || "—"}</dd></div>
      <div><dt>Travel dates</dt><dd>${item.travelDates || "—"}</dd></div>
      <div><dt>Travelers</dt><dd>${item.travelers || "—"}</dd></div>
      <div><dt>Cities interested in</dt><dd>${item.citiesInterestedIn || item.cities || "—"}</dd></div>
      <div><dt>Preferred stay level</dt><dd>${item.preferredStayLevel || item.stayLevel || "—"}</dd></div>
      <div><dt>Trip style</dt><dd>${(item.tripStyle || []).join(", ") || "—"}</dd></div>
      <div><dt>Source page</dt><dd>${item.sourcePage || "—"}</dd></div>
      <div><dt>Created</dt><dd>${item.createdAt || "—"}</dd></div>
      <div><dt>Status</dt><dd>${item.status || "new"}</dd></div>
      <div><dt>Tags</dt><dd>${(item.tags || []).join(", ") || "—"}</dd></div>
      <div><dt>Last updated</dt><dd>${item.updatedAt || "—"}</dd></div>
    </dl>
    <div class="detail-block">
      <strong>Client notes</strong>
      <p>${item.notes || "No notes yet."}</p>
    </div>
    <label class="detail-block">
      Internal notes
      <textarea rows="6" data-detail-notes>${item.internalNotes || ""}</textarea>
    </label>
    <label class="detail-block">
      Tags
      <input data-detail-tags value="${(item.tags || []).join(", ")}" placeholder="VIP, Luxury, Urgent" />
    </label>
    <div class="form-actions">
      <button type="button" data-save-inquiry-notes="${item.id}">Save Notes</button>
      <button class="secondary" type="button" data-copy-inquiry="${item.id}">Copy Summary</button>
      <button class="secondary" type="button" data-mark-spam="${item.id}">Mark Spam</button>
    </div>
    <div class="detail-block">
      <strong>Activity timeline</strong>
      ${(item.activity || []).length ? `<ul class="activity-list">${item.activity.map((entry) => `<li><span>${entry.at}</span>${entry.label}</li>`).join("")}</ul>` : "<p>No activity yet.</p>"}
    </div>
    <div class="detail-block">
      <strong>Status history</strong>
      ${(item.statusHistory || []).length ? `<ul class="activity-list">${item.statusHistory.map((entry) => `<li><span>${entry.at}</span>${entry.from} → ${entry.to}</li>`).join("")}</ul>` : "<p>No status changes yet.</p>"}
    </div>
  `;
}

async function loadOverview() {
  state.overview = await api("/api/admin/overview");
  $("[data-stats]").innerHTML = Object.entries(state.overview.counts).map(([key, value]) => `
    <article class="stat-card"><span>${key}</span><strong>${value}</strong></article>
  `).join("");
  $("[data-latest-inquiries]").innerHTML = state.overview.latestInquiries.map((item) => itemRow({
    title: item.name || "Unnamed visitor",
    meta: `${item.status || "new"} · ${item.createdAt || ""}`,
    body: [item.travelDates, item.citiesInterestedIn || item.cities].filter(Boolean).join(" · ")
  })).join("") || "<p class='empty'>No inquiries yet.</p>";
}

async function loadInquiries() {
  state.inquiries = (await api("/api/admin/inquiries")).data;
  renderInquiryList();
}

async function loadGuides() {
  state.guides = (await api("/api/admin/guides")).data;
  renderGuideFilters();
  renderGuideList();
  if (state.guideDraft) renderGuideEditor();
}

function renderGuideFilters() {
  const citySelect = $("[data-guide-filter-city]");
  const categorySelect = $("[data-guide-filter-category]");
  if (citySelect && citySelect.options.length <= 1) {
    [...new Set(state.guides.map((guide) => guide.city).filter(Boolean))].forEach((city) => citySelect.insertAdjacentHTML("beforeend", `<option>${escapeHtml(city)}</option>`));
  }
  if (categorySelect && categorySelect.options.length <= 1) {
    [...new Set(state.guides.map((guide) => guide.category).filter(Boolean))].forEach((category) => categorySelect.insertAdjacentHTML("beforeend", `<option>${escapeHtml(category)}</option>`));
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
  return [...state.guides].filter((guide) => {
    const langs = guideLanguageStatus(guide);
    const haystack = [guide.title, guide.slug, guide.category, guide.city, ...(guide.tags || [])].join(" ").toLowerCase();
    return (!query || haystack.includes(query))
      && (!city || guide.city === city)
      && (!category || guide.category === category)
      && (!status || guide.status === status)
      && (!date || String(guide.publishedAt || "").toLowerCase().includes(date))
      && (!language || (language === "en" && langs.en) || (language === "cn" && langs.cn) || (language === "missing-cn" && !langs.cn));
  }).sort((a, b) => {
    if (sort === "title") return String(a.title).localeCompare(String(b.title));
    if (sort === "published") return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function renderGuideList() {
  const items = filteredGuides();
  $("[data-guides-list]").innerHTML = items.map((guide) => {
    const langs = guideLanguageStatus(guide);
    return `
      <article class="guide-row ${guide.id === state.currentGuideId ? "is-active" : ""}">
        <button type="button" data-edit-guide="${guide.id}">
          <img src="/${guide.coverImage || "assets/guide-first-time-china.png"}" alt="" />
          <span>
            <strong>${escapeHtml(guide.title)}</strong>
            <small>${escapeHtml([guide.category, guide.city, guide.status].filter(Boolean).join(" · "))}</small>
            <em>${escapeHtml((guide.tags || []).join(" · "))}</em>
          </span>
        </button>
        <div class="guide-row-meta">
          <span>${guide.publishedAt || "unpublished"}</span>
          <span>Updated ${compactDate(guide.updatedAt)}</span>
          <span class="${langs.en ? "ready" : ""}">EN</span>
          <span class="${langs.cn ? "ready" : ""}">CN</span>
        </div>
        <div class="row-actions">
          <button class="secondary" data-preview-row-guide="${guide.id}" type="button">Preview</button>
          <button class="secondary" data-duplicate-row-guide="${guide.id}" type="button">Duplicate</button>
          <button class="secondary" data-delete-guide="${guide.id}" type="button">Delete</button>
        </div>
      </article>
    `;
  }).join("") || "<p class='empty'>No guides match your filters.</p>";
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
    publishedAt: guide.publishedAt,
    tags: guide.tags || [],
    coverImage: guide.coverImage,
    mobileCoverImage: guide.mobileCoverImage,
    coverAlt: guide.coverAlt,
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
  $("[data-cover-preview]").src = guide.coverImage ? `/${guide.coverImage}` : "/assets/guide-first-time-china.png";
  ["en", "cn"].forEach((lang) => {
    const translation = getGuideTranslation(guide, lang);
    const raw = $(`[data-raw-editor="${lang}"]`);
    if (raw) raw.value = translation.rawContent || htmlToPlainDraft(translation.htmlContent || blocksToHtml(translation.contentBlocks));
  });
  renderRelatedList();
  renderRelatedSelect();
  renderGuideMediaPicker();
  renderTranslationStatus();
  renderGuidePreview();
  renderEditorChecks();
  setUnsaved(false);
}

function setUnsaved(value) {
  const node = $("[data-unsaved-state]");
  node.textContent = value ? "Unsaved changes" : "Saved just now";
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
  const values = Object.fromEntries(new FormData(form).entries());
  const guide = state.guideDraft || defaultGuide();
  guide.id = values.id || guide.id;
  guide.slug = values.slug;
  guide.status = values.status;
  guide.author = values.author || "ChinaMigo Editorial";
  guide.city = values.city;
  guide.category = values.category || guide.category || "Lifestyle";
  guide.readTime = values.readTime;
  guide.publishedAt = values.publishedAt;
  guide.tags = csvToList(values.tags);
  guide.coverImage = values.coverImage;
  guide.mobileCoverImage = values.mobileCoverImage;
  guide.coverAlt = values.coverAlt;
  guide.seo = {
    ogImage: values.ogImage,
    canonicalUrl: values.canonicalUrl,
    noindex: values.noindex === "true"
  };
  getGuideTranslation(guide, "en").title = values.titleEn;
  getGuideTranslation(guide, "en").excerpt = values.excerptEn;
  getGuideTranslation(guide, "en").rawContent = $(`[data-raw-editor="en"]`)?.value || "";
  getGuideTranslation(guide, "en").htmlContent = markdownToHtml(getGuideTranslation(guide, "en").rawContent);
  getGuideTranslation(guide, "en").seo = { title: values.seoTitleEn, description: values.metaDescriptionEn };
  getGuideTranslation(guide, "cn").title = values.titleCn;
  getGuideTranslation(guide, "cn").excerpt = values.excerptCn;
  getGuideTranslation(guide, "cn").rawContent = $(`[data-raw-editor="cn"]`)?.value || "";
  getGuideTranslation(guide, "cn").htmlContent = markdownToHtml(getGuideTranslation(guide, "cn").rawContent);
  getGuideTranslation(guide, "cn").seo = { title: values.seoTitleCn, description: values.metaDescriptionCn };
  if ($(`[data-block="en"]`)) syncBlocksFromDom("en");
  if ($(`[data-block="cn"]`)) syncBlocksFromDom("cn");
  guide.title = getGuideTranslation(guide, "en").title || getGuideTranslation(guide, "cn").title || "Untitled Guide";
  guide.excerpt = getGuideTranslation(guide, "en").excerpt || getGuideTranslation(guide, "cn").excerpt || "";
  guide.contentBlocks = getGuideTranslation(guide, "en").contentBlocks;
  return guide;
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
      <span>${escapeHtml(item.folder || "media")}</span>
    </button>
  `).join("") || "<p class='empty'>Upload media first, then reuse it here.</p>";
}

function renderTranslationStatus() {
  const node = $("[data-translation-status]");
  if (!node || !state.guideDraft) return;
  const status = guideLanguageStatus(state.guideDraft);
  const enBlocks = getGuideTranslation(state.guideDraft, "en").contentBlocks.length;
  const cnBlocks = getGuideTranslation(state.guideDraft, "cn").contentBlocks.length;
  node.innerHTML = `
    <article><strong>${status.en ? "Ready" : "Needs content"}</strong><span>English · ${enBlocks} sections</span></article>
    <article><strong>${status.cn ? "Ready" : "Needs translation"}</strong><span>中文 · ${cnBlocks} sections</span></article>
  `;
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
  }).join("") || "<p class='empty'>No related guides selected.</p>";
}

function renderGuidePreview() {
  const guide = syncGuideFromForm();
  ["en", "cn"].forEach((lang) => {
    const translation = getGuideTranslation(guide, lang);
    const preview = $(`[data-fast-preview="${lang}"]`);
    if (!preview) return;
    const contentHtml = translation.htmlContent || "";
    preview.innerHTML = `
      <img src="/${escapeHtml(guide.coverImage || "assets/guide-first-time-china.png")}" alt="" />
      <p>${escapeHtml([guide.category, guide.author, guide.publishedAt].filter(Boolean).join(" · "))}</p>
      <h2>${escapeHtml(translation.title || guide.title)}</h2>
      <p>${escapeHtml(translation.excerpt || guide.excerpt)}</p>
      ${contentHtml}
    `;
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
  $("[data-guide-preview]").innerHTML = `
    <img src="/${escapeHtml(guide.coverImage || "assets/guide-first-time-china.png")}" alt="" />
    <p>${escapeHtml([guide.category, guide.author, guide.publishedAt].filter(Boolean).join(" · "))}</p>
    <h2>${escapeHtml(translation.title || guide.title)}</h2>
    <p>${escapeHtml(translation.excerpt || guide.excerpt)}</p>
    ${blockHtml}
  `;
  renderEditorChecks();
}

function renderEditorChecks() {
  const node = $("[data-editor-checks]");
  if (!node || !state.guideDraft) return;
  const guide = syncGuideFromForm();
  const en = getGuideTranslation(guide, "en");
  const cn = getGuideTranslation(guide, "cn");
  const content = `${en.rawContent || ""}\n${cn.rawContent || ""}`;
  const checks = [
    { label: "Cover image", ok: Boolean(guide.coverImage), note: guide.coverImage ? "Ready" : "Missing cover" },
    { label: "FAQ", ok: /FAQ|Q:|问：|常见问题/i.test(content), note: /FAQ|Q:|问：|常见问题/i.test(content) ? "Trust section present" : "Consider adding FAQ" },
    { label: "CTA", ok: /CTA:/i.test(content), note: /CTA:/i.test(content) ? "Conversion ready" : "CTA missing" },
    { label: "Chinese version", ok: Boolean(cn.title || cn.rawContent), note: (cn.title || cn.rawContent) ? "中文 ready" : "Untranslated" },
    { label: "SEO basics", ok: Boolean(en.title && en.excerpt), note: (en.title && en.excerpt) ? "Title and intro ready" : "Needs title/intro" },
    { label: "Readability", ok: (en.rawContent || "").length > 300 || (cn.rawContent || "").length > 120, note: "Auto checked" }
  ];
  node.innerHTML = checks.map((check) => `
    <article class="${check.ok ? "is-ok" : "needs-work"}">
      <span>${check.ok ? "✓" : "!"}</span>
      <div><strong>${check.label}</strong><small>${check.note}</small></div>
    </article>
  `).join("");
}

async function uploadAdminImage(file, folder = "guides") {
  const dataUrl = await fileToDataUrl(file);
  const response = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, alt: file.name.replace(/\.[^.]+$/, ""), folder, dataUrl })
  });
  await loadMedia();
  return response.media || { url: response.path };
}

function insertHtmlAtCursor(html) {
  document.execCommand("insertHTML", false, html);
}

async function insertImageFiles(files, gallery = false) {
  const validFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!validFiles.length) return;
  setStatus("Uploading image...");
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
  setStatus("Image uploaded.");
}

function insertTextIntoTextarea(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function scheduleGuideAutosave() {
  window.clearTimeout(state.guideAutosaveTimer);
  state.guideAutosaveTimer = window.setTimeout(async () => {
    if (!state.guideDraft) return;
    syncGuideFromForm();
    const hasTitle = getGuideTranslation(state.guideDraft, "en").title || getGuideTranslation(state.guideDraft, "cn").title;
    if (!hasTitle || hasTitle === "Untitled Guide") return;
    try {
      await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
      await loadGuides();
      setUnsaved(false);
      setStatus("Guide autosaved.");
    } catch (error) {
      setStatus(`Autosave failed: ${error.message}`);
    }
  }, 4200);
}

async function loadCities() {
  state.cities = (await api("/api/admin/cities")).data;
  $("[data-cities-list]").innerHTML = state.cities.map((item) => itemRow({
    title: item.name,
    meta: `${item.slug} · order ${item.sortOrder} · ${item.active ? "active" : "inactive"}`,
    body: item.description,
    actions: `<button class="secondary" data-edit-city="${item.id}" type="button">Edit</button><button class="secondary" data-delete-city="${item.id}" type="button">Delete</button>`
  })).join("");
}

async function loadExperiences() {
  state.experiences = (await api("/api/admin/experiences")).data;
  $("[data-experiences-list]").innerHTML = state.experiences.map((item) => itemRow({
    title: item.title,
    meta: `${item.city} · ${item.type} · ${item.duration} · ${item.published ? "published" : "draft"}`,
    body: item.excerpt,
    actions: `<button class="secondary" data-edit-experience="${item.id}" type="button">Edit</button><button class="secondary" data-delete-experience="${item.id}" type="button">Delete</button>`
  })).join("") || "<p class='empty'>No experiences yet.</p>";
}

async function loadMedia() {
  state.media = (await api("/api/admin/media")).data;
  const query = ($("[data-media-search]")?.value || "").toLowerCase();
  const folder = ($("[data-media-folder-filter]")?.value || "").toLowerCase();
  const items = state.media.filter((item) => {
    const haystack = [item.filename, item.alt, item.url, item.folder].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!folder || String(item.folder || "").toLowerCase().includes(folder));
  });
  $("[data-media-list]").innerHTML = items.map((item) => `
    <article class="media-item">
      <img src="/${item.url}" alt="${item.alt || ""}" />
      <strong>${item.filename}</strong>
      <span>${item.folder || "guides"} · ${item.createdAt}</span>
      <code>${item.url}</code>
      <button class="secondary" data-copy-media="${item.url}" type="button">Copy URL</button>
      <button class="secondary" data-delete-media="${item.id}" type="button">Remove</button>
    </article>
  `).join("") || "<p class='empty'>No uploaded media yet.</p>";
  renderGuideMediaPicker();
}

async function refreshAll() {
  await Promise.all([loadOverview(), loadInquiries(), loadGuides(), loadCities(), loadExperiences(), loadMedia()]);
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
  $$("[data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== name));
}

$("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("[data-login-status]");
  status.textContent = "Logging in...";
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
  setStatus("Saving guide...");
  await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
  await loadGuides();
  await loadOverview();
  setUnsaved(false);
  setStatus("Guide saved.");
});

$("[data-city-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Saving city...");
  await api("/api/admin/cities", { method: "POST", body: JSON.stringify(formValues(event.currentTarget)) });
  await loadCities();
  await loadOverview();
  setStatus("City saved.");
});

$("[data-experience-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Saving experience...");
  await api("/api/admin/experiences", { method: "POST", body: JSON.stringify(formValues(event.currentTarget)) });
  await loadExperiences();
  await loadOverview();
  setStatus("Experience saved.");
});

$("[data-media-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.file.files[0];
  if (!file) return;
  setStatus("Uploading media...");
  const dataUrl = await fileToDataUrl(file);
  await api("/api/upload", { method: "POST", body: JSON.stringify({ filename: file.name, alt: form.alt.value, folder: form.folder.value, dataUrl }) });
  form.reset();
  await loadMedia();
  await loadOverview();
  setStatus("Media uploaded.");
});

$("[data-new-guide]").addEventListener("click", () => selectGuide(defaultGuide()));
$("[data-new-city]").addEventListener("click", () => fillForm($("[data-city-form]"), { active: true, sortOrder: 0 }));
$("[data-new-experience]").addEventListener("click", () => fillForm($("[data-experience-form]"), { type: "recommended_journey", published: true, contentBlocks: [], sortOrder: 0 }));

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-cover-dropzone], [data-editor-tab], [data-edit-guide], [data-preview-row-guide], [data-duplicate-row-guide], [data-lang-tab], [data-open-edit-panel], [data-close-edit-panel], [data-close-guide-editor], [data-add-block], [data-collapse-block], [data-duplicate-block], [data-remove-block], [data-move-block], [data-remove-related], [data-preview-device], [data-pick-cover], [data-edit-city], [data-edit-experience], [data-view-inquiry], [data-close-inquiry], [data-export-inquiries], [data-copy-inquiry], [data-save-inquiry-notes], [data-mark-spam], [data-archive-inquiry], [data-delete-guide], [data-delete-city], [data-delete-experience], [data-delete-inquiry], [data-delete-media], [data-copy-media]") || event.target;
  if (target.matches("[data-edit-guide]")) selectGuide(state.guides.find((item) => item.id === target.dataset.editGuide));
  if (target.matches("[data-close-guide-editor]")) {
    $("[data-panel='guides']")?.classList.remove("is-editor-open");
  }
  if (target.matches("[data-open-edit-panel]")) {
    $("[data-edit-panel]")?.classList.remove("is-hidden");
    $(`[data-raw-editor="${state.currentGuideLang}"]`)?.focus();
  }
  if (target.matches("[data-close-edit-panel]")) {
    $("[data-edit-panel]")?.classList.add("is-hidden");
    renderGuidePreview();
  }
  if (target.matches("[data-editor-tab]")) {
    $$("[data-editor-tab]").forEach((button) => button.classList.toggle("is-active", button === target));
    $$("[data-editor-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.editorPanel !== target.dataset.editorTab));
  }
  if (target.matches("[data-preview-row-guide]")) {
    selectGuide(state.guides.find((item) => item.id === target.dataset.previewRowGuide));
    $("[data-guide-preview]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (target.matches("[data-duplicate-guide], [data-duplicate-row-guide]")) {
    const source = target.dataset.duplicateRowGuide
      ? state.guides.find((item) => item.id === target.dataset.duplicateRowGuide)
      : syncGuideFromForm();
    const copy = JSON.parse(JSON.stringify(source || defaultGuide()));
    copy.id = `guide-${Date.now()}`;
    copy.slug = `${copy.slug || "guide"}-copy`;
    copy.title = `${copy.title || "Untitled Guide"} Copy`;
    copy.status = "draft";
    copy.createdAt = "";
    copy.updatedAt = "";
    selectGuide(copy);
    setUnsaved(true);
  }
  if (target.matches("[data-preview-guide]")) {
    renderGuidePreview();
    showToast("Preview refreshed");
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
    const textarea = $(`[data-raw-editor="${target.dataset.insertImage}"]`);
    textarea?.focus();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = () => insertImageFiles(input.files, input.files.length > 1);
    input.click();
  }
  if (target.matches("[data-docx-upload]") || target.matches("[data-docx-dropzone]")) {
    $("[data-docx-file]")?.click();
  }
  if (target.matches("[data-ai-action]")) {
    const editor = $(`[data-raw-editor="${state.currentGuideLang}"]`);
    if (!editor) return;
    if (target.dataset.aiAction === "beautify") {
      const previous = target.textContent;
      target.textContent = "Beautifying...";
      target.disabled = true;
      setStatus("Beautifying article...");
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
        setStatus("AI beautify complete.");
        showToast("Layout beautified");
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
      showToast("Layout cleaned up");
    }
    if (target.dataset.aiAction === "format" && !/^#{1,3}\s/m.test(editor.value)) {
      editor.value = `## What to know first\n\n${editor.value}`;
      showToast("Formatting suggestion applied");
    }
    if (target.dataset.aiAction === "images") {
      editor.value = editor.value.replace(/\n{3,}(!\[)/g, "\n\n$1");
      showToast("Images arranged");
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    renderGuidePreview();
    setUnsaved(true);
  }
  if (target.matches("[data-publish-guide]")) {
    syncGuideFromForm();
    state.guideDraft.status = "published";
    state.guideDraft.publishedAt ||= new Date().toISOString().slice(0, 10);
    $("[name='status']").value = "published";
    $("[name='publishedAt']").value = state.guideDraft.publishedAt;
    await api("/api/admin/guides", { method: "POST", body: JSON.stringify(state.guideDraft) });
    await loadGuides();
    await loadOverview();
    setUnsaved(false);
    showToast("Guide published");
  }
  if (target.matches("[data-lang-tab]")) {
    state.currentGuideLang = target.dataset.langTab;
    $$("[data-lang-tab]").forEach((button) => button.classList.toggle("is-active", button === target));
    $$("[data-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.langPanel !== state.currentGuideLang));
    $$("[data-source-lang-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.sourceLangPanel !== state.currentGuideLang));
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
    $("[name='coverImage']").value = target.dataset.pickCover;
    $("[data-cover-preview]").src = `/${target.dataset.pickCover}`;
    renderGuidePreview();
    setUnsaved(true);
    showToast("Cover image selected");
  }
  if (target.matches("[data-cover-dropzone]")) {
    $("[data-cover-file]")?.click();
  }
  if (target.matches("[data-preview-device]")) {
    const preview = $("[data-guide-preview]");
    preview.className = `guide-preview ${target.dataset.previewDevice}`;
  }
  if (target.matches("[data-copy-media]")) {
    try {
      await navigator.clipboard.writeText(target.dataset.copyMedia);
      const previous = target.textContent;
      target.textContent = "✓ Copied";
      target.disabled = true;
      window.setTimeout(() => {
        target.textContent = previous;
        target.disabled = false;
      }, 1100);
      showToast("Media URL copied");
    } catch {
      window.prompt("Copy media URL", target.dataset.copyMedia);
    }
  }
  if (target.matches("[data-edit-city]")) fillForm($("[data-city-form]"), state.cities.find((item) => item.id === target.dataset.editCity));
  if (target.matches("[data-edit-experience]")) fillForm($("[data-experience-form]"), state.experiences.find((item) => item.id === target.dataset.editExperience));
  if (target.matches("[data-view-inquiry]")) renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.viewInquiry));
  if (target.matches("[data-close-inquiry]")) renderInquiryDetail(null);
  if (target.matches("[data-export-inquiries]")) window.open("/api/admin/inquiries/export", "_blank");
  if (target.matches("[data-copy-inquiry]")) {
    const item = state.inquiries.find((inquiry) => inquiry.id === target.dataset.copyInquiry);
    const text = inquirySummary(item || {});
    try {
      await navigator.clipboard.writeText(text);
      const previous = target.textContent;
      target.textContent = "✓ Copied";
      target.disabled = true;
      target.classList.add("is-copied");
      window.setTimeout(() => {
        target.textContent = previous;
        target.disabled = false;
        target.classList.remove("is-copied");
      }, 1200);
      showToast("Inquiry summary copied");
      setStatus("Inquiry summary copied.");
    } catch {
      window.prompt("Copy inquiry summary", text);
    }
  }
  if (target.matches("[data-save-inquiry-notes]")) {
    await api("/api/admin/inquiries", {
      method: "PATCH",
      body: JSON.stringify({ id: target.dataset.saveInquiryNotes, internalNotes: $("[data-detail-notes]").value, tags: csvToList($("[data-detail-tags]").value) })
    });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.saveInquiryNotes));
    setStatus("Internal notes saved.");
  }
  if (target.matches("[data-mark-spam]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.markSpam, status: "spam" }) });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.markSpam));
    setStatus("Inquiry marked as spam.");
  }
  if (target.matches("[data-archive-inquiry]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.archiveInquiry, status: "lost" }) });
    await loadInquiries();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.archiveInquiry));
    setStatus("Inquiry archived.");
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
      await api(`${path}?id=${encodeURIComponent(target.dataset[key])}`, { method: "DELETE" });
      await loader();
      await loadOverview();
      setStatus("Deleted.");
    }
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches("[data-inquiry-status]")) {
    await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id: target.dataset.inquiryStatus, status: target.value }) });
    await loadInquiries();
    await loadOverview();
    renderInquiryDetail(state.inquiries.find((item) => item.id === target.dataset.inquiryStatus));
    setStatus("Inquiry status updated.");
  }
});

document.addEventListener("dragstart", (event) => {
  const block = event.target.closest("[data-block]");
  if (!block) return;
  draggedBlock = { lang: block.dataset.block, index: Number(block.dataset.index) };
  block.classList.add("is-dragging");
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-block]")?.classList.remove("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-block]")) event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const rawEditor = event.target.closest("[data-raw-editor]");
  if (rawEditor && event.dataTransfer?.files?.length) {
    event.preventDefault();
    rawEditor.focus();
    insertImageFiles(event.dataTransfer.files, event.dataTransfer.files.length > 1);
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
  if (event.target.closest("[data-raw-editor], [data-rich-editor], [data-cover-dropzone], [data-docx-dropzone]")) event.preventDefault();
});

async function uploadCoverFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  setStatus("Uploading cover...");
  const media = await uploadAdminImage(file, "guides");
  syncGuideFromForm();
  state.guideDraft.coverImage = media.url;
  state.guideDraft.coverAlt = media.alt || file.name;
  $("[name='coverImage']").value = media.url;
  $("[name='coverAlt']").value = media.alt || file.name;
  $("[data-cover-preview]").src = `/${media.url}`;
  renderGuidePreview();
  setUnsaved(true);
  setStatus("Cover uploaded.");
}

async function importDocxFile(file) {
  if (!file || !file.name.toLowerCase().endsWith(".docx")) {
    showToast("Please upload a .docx file");
    return;
  }
  setStatus("Importing Word document...");
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
    if (!translation.title || translation.title === "Untitled Guide") translation.title = response.data.title;
    if (!translation.excerpt) translation.excerpt = response.data.excerpt;
    if (response.data.coverImage && !state.guideDraft.coverImage) {
      state.guideDraft.coverImage = response.data.coverImage;
      state.guideDraft.coverAlt = response.data.title;
    }
    renderGuideEditor();
    setUnsaved(true);
    setStatus("Word document imported.");
    showToast("DOCX imported");
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
    if (event.target.matches("[data-related-search]")) {
      renderRelatedSelect();
    }
    if (event.target.closest("[data-guide-form]")) {
      syncGuideFromForm();
      if (event.target.name === "coverImage") {
        $("[data-cover-preview]").src = event.target.value ? `/${event.target.value}` : "/assets/guide-first-time-china.png";
      }
      renderGuidePreview();
      renderTranslationStatus();
      setUnsaved(true);
      scheduleGuideAutosave();
    }
    if (event.target.matches("[data-cover-file]")) {
      uploadCoverFile(event.target.files?.[0]);
    }
    if (event.target.matches("[data-docx-file]")) {
      importDocxFile(event.target.files?.[0]);
    }
    if (event.target.matches("[data-media-search], [data-media-folder-filter]")) {
      loadMedia();
    }
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
