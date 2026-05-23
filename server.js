const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "assets", "uploads");
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || "0.0.0.0";

const files = {
  guideCards: path.join(dataDir, "guides.json"),
  guides: path.join(dataDir, "guide-articles.json"),
  cities: path.join(dataDir, "cities.json"),
  experiences: path.join(dataDir, "experiences.json"),
  inquiries: path.join(dataDir, "inquiries.json"),
  media: path.join(dataDir, "media.json"),
  notifications: path.join(dataDir, "email-notifications.json"),
  users: path.join(dataDir, "users.json")
};

const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "chinamigo2026";
const sessions = new Map();
const visitorSessions = new Map();
const inquiryRateLimit = new Map();
const inquiryStatuses = ["new", "reviewed", "contacted", "planning", "quoted", "confirmed", "lost", "spam"];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "application/json; charset=utf-8", headers = {}) {
  res.writeHead(status, { "Content-Type": type, ...headers });
  res.end(body);
}

function json(res, status, value, headers = {}) {
  send(res, status, `${JSON.stringify(value, null, 2)}\n`, "application/json; charset=utf-8", headers);
}

function safeString(value, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function slugify(value, fallback = "item") {
  const slug = safeString(value, 160)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${fallback}-${Date.now()}`;
}

function now() {
  return new Date().toISOString();
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .filter(([key, value]) => key && value));
}

function getSession(req) {
  const token = parseCookies(req).cm_session;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function getVisitorSession(req) {
  const token = parseCookies(req).cm_visitor_session;
  if (!token) return null;
  const session = visitorSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    visitorSessions.delete(token);
    return null;
  }
  return session;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role || "visitor"
  };
}

function normalizeEmail(value) {
  return safeString(value, 180).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [method, salt, hash] = String(stored || "").split(":");
  if (method !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function requireAdmin(req, res) {
  const session = getSession(req);
  if (session) return session;
  json(res, 401, { ok: false, error: "Admin login required." });
  return null;
}

function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function checkInquiryRateLimit(req) {
  const key = getClientIp(req);
  const timestamp = Date.now();
  const windowMs = 1000 * 60 * 10;
  const recent = (inquiryRateLimit.get(key) || []).filter((time) => timestamp - time < windowMs);
  recent.push(timestamp);
  inquiryRateLimit.set(key, recent);
  return recent.length <= 6;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function parsePayload(req) {
  const rawBody = await readBody(req);
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) return rawBody ? JSON.parse(rawBody) : {};
  const params = new URLSearchParams(rawBody);
  const payload = {};
  for (const [key, value] of params.entries()) {
    if (payload[key]) payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
    else payload[key] = value;
  }
  return payload;
}

async function serveFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cityRoutes = new Set(["shanghai", "beijing", "shenzhen", "chengdu", "guangzhou", "hangzhou", "chongqing"]);
  const tripSlug = url.pathname.startsWith("/trips/") ? url.pathname.split("/").filter(Boolean)[1] : "";
  const routes = {
    "/": "/index.html",
    "/guides": "/guides.html",
    "/trips": "/trips.html",
    "/about": "/about.html",
    "/admin": "/admin.html"
  };
  const routePath = routes[url.pathname]
    || (url.pathname.startsWith("/guides/") ? "/guide-detail.html" : null)
    || (cityRoutes.has(tripSlug) ? "/city-experiences.html" : null)
    || (url.pathname.startsWith("/trips/") ? "/trip-detail.html" : url.pathname);
  const cleanPath = decodeURIComponent(routePath);
  const filePath = path.normalize(path.join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, file, mimeTypes[ext] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

function normalizeGuideCards(payload) {
  const section = payload.section || {};
  const cards = Array.isArray(payload.cards) ? payload.cards : [];
  return {
    section: {
      eyebrow: safeString(section.eyebrow || "Discover Modern China", 120),
      title: safeString(section.title || "Modern China, Reimagined.", 160),
      description: safeString(section.description || "", 400)
    },
    cards: cards.slice(0, 24).map((card, index) => ({
      id: slugify(card.id || card.title || `guide-${index + 1}`, "guide"),
      title: safeString(card.title || "Untitled", 160),
      subtitle: safeString(card.subtitle || "", 220),
      image: safeString(card.image || "", 400),
      alt: safeString(card.alt || card.title || "", 220),
      imageFit: card.imageFit === "contain" ? "contain" : "cover",
      imagePosition: safeString(card.imagePosition || "center", 80),
      imageScale: Math.min(1.4, Math.max(1, Number(card.imageScale || 1.02))),
      ratio: ["4 / 5", "3 / 4", "1 / 1"].includes(card.ratio) ? card.ratio : "4 / 5"
    }))
  };
}

function normalizeContentBlocks(blocks) {
  const allowed = new Set(["heading", "paragraph", "divider", "bullet_list", "number_list", "image", "gallery", "quote", "checklist", "tip", "cta", "faq"]);
  return (Array.isArray(blocks) ? blocks : []).slice(0, 80).map((block) => ({
    id: safeString(block.id || `block-${crypto.randomUUID()}`, 80),
    type: allowed.has(block.type) ? block.type : "paragraph",
    title: safeString(block.title, 220),
    body: safeString(block.body, 3000),
    image: safeString(block.image, 500),
    alt: safeString(block.alt, 240),
    items: Array.isArray(block.items) ? block.items.map((item) => safeString(item, 300)).filter(Boolean).slice(0, 30) : [],
    href: safeString(block.href, 500),
    label: safeString(block.label, 120)
  }));
}

function normalizeGuide(payload, existing = {}) {
  const timestamp = now();
  const translations = payload.translations || existing.translations || {};
  const en = translations.en || {};
  const cn = translations.cn || {};
  const title = safeString(payload.title || en.title || existing.title || "Untitled Guide", 180);
  const status = ["draft", "published", "scheduled", "archived"].includes(payload.status) ? payload.status : (existing.status || "draft");
  const tags = Array.isArray(payload.tags) ? payload.tags : (payload.tags ? String(payload.tags).split(",") : existing.tags || []);
  return {
    id: safeString(existing.id || payload.id || `guide-${crypto.randomUUID()}`, 100),
    title,
    slug: slugify(payload.slug || existing.slug || title, "guide"),
    category: safeString(payload.category || existing.category || "Travel Basics", 120),
    city: safeString(payload.city || existing.city || "", 120),
    tags: tags.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 20),
    author: safeString(payload.author || existing.author || "ChinaMigo Editorial", 140),
    excerpt: safeString(payload.excerpt || en.excerpt || existing.excerpt || "", 420),
    coverImage: safeString(payload.coverImage || existing.coverImage || "", 500),
    coverAlt: safeString(payload.coverAlt || existing.coverAlt || "", 240),
    mobileCoverImage: safeString(payload.mobileCoverImage || existing.mobileCoverImage || "", 500),
    readTime: safeString(payload.readTime || existing.readTime || "5 min read", 80),
    contentBlocks: normalizeContentBlocks(payload.contentBlocks || en.contentBlocks || existing.contentBlocks),
    translations: {
      en: {
        title: safeString(en.title || payload.titleEn || payload.title || title, 180),
        excerpt: safeString(en.excerpt || payload.excerptEn || payload.excerpt || "", 420),
        rawContent: safeString(en.rawContent || payload.rawContentEn || existing.translations?.en?.rawContent || "", 80000),
        htmlContent: safeString(en.htmlContent || payload.htmlContentEn || existing.translations?.en?.htmlContent || "", 80000),
        contentBlocks: normalizeContentBlocks(en.contentBlocks || payload.contentBlocksEn || payload.contentBlocks || existing.contentBlocks),
        seo: {
          title: safeString(en.seo?.title || payload.seoTitleEn || "", 180),
          description: safeString(en.seo?.description || payload.metaDescriptionEn || "", 320)
        }
      },
      cn: {
        title: safeString(cn.title || payload.titleCn || "", 180),
        excerpt: safeString(cn.excerpt || payload.excerptCn || "", 420),
        rawContent: safeString(cn.rawContent || payload.rawContentCn || existing.translations?.cn?.rawContent || "", 80000),
        htmlContent: safeString(cn.htmlContent || payload.htmlContentCn || existing.translations?.cn?.htmlContent || "", 80000),
        contentBlocks: normalizeContentBlocks(cn.contentBlocks || payload.contentBlocksCn),
        seo: {
          title: safeString(cn.seo?.title || payload.seoTitleCn || "", 180),
          description: safeString(cn.seo?.description || payload.metaDescriptionCn || "", 320)
        }
      }
    },
    seo: {
      title: safeString(payload.seo?.title || payload.seoTitle || existing.seo?.title || "", 180),
      description: safeString(payload.seo?.description || payload.metaDescription || existing.seo?.description || "", 320),
      ogImage: safeString(payload.seo?.ogImage || payload.ogImage || existing.seo?.ogImage || "", 500),
      canonicalUrl: safeString(payload.seo?.canonicalUrl || payload.canonicalUrl || existing.seo?.canonicalUrl || "", 500),
      noindex: Boolean(payload.seo?.noindex ?? payload.noindex ?? existing.seo?.noindex ?? false)
    },
    relatedGuides: Array.isArray(payload.relatedGuides) ? payload.relatedGuides.map((item) => safeString(item, 120)).slice(0, 12) : (existing.relatedGuides || []),
    status,
    publishedAt: safeString(payload.publishedAt || existing.publishedAt || (status === "published" ? timestamp : ""), 80),
    scheduledAt: safeString(payload.scheduledAt || existing.scheduledAt || "", 80),
    createdAt: existing.createdAt || payload.createdAt || timestamp,
    updatedAt: timestamp
  };
}

function normalizeCity(payload, existing = {}) {
  const name = safeString(payload.name || existing.name || "City", 120);
  return {
    id: safeString(existing.id || payload.id || `city-${crypto.randomUUID()}`, 100),
    name,
    slug: slugify(payload.slug || existing.slug || name, "city"),
    description: safeString(payload.description || existing.description || "", 420),
    sortOrder: Number(payload.sortOrder ?? existing.sortOrder ?? 0),
    active: payload.active === false ? false : true,
    updatedAt: now()
  };
}

function normalizeExperience(payload, existing = {}) {
  const title = safeString(payload.title || existing.title || "Untitled Experience", 180);
  return {
    id: safeString(existing.id || payload.id || `experience-${crypto.randomUUID()}`, 120),
    title,
    slug: slugify(payload.slug || existing.slug || title, "experience"),
    city: slugify(payload.city || existing.city || "shanghai", "city"),
    type: payload.type === "short_experience" ? "short_experience" : "recommended_journey",
    duration: safeString(payload.duration || existing.duration || "", 80),
    excerpt: safeString(payload.excerpt || existing.excerpt || "", 420),
    coverImage: safeString(payload.coverImage || existing.coverImage || "", 500),
    galleryImages: Array.isArray(payload.galleryImages) ? payload.galleryImages.map((item) => safeString(item, 500)).filter(Boolean).slice(0, 20) : (existing.galleryImages || []),
    tags: Array.isArray(payload.tags) ? payload.tags.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 20) : (existing.tags || []),
    contentBlocks: normalizeContentBlocks(payload.contentBlocks || existing.contentBlocks),
    sortOrder: Number(payload.sortOrder ?? existing.sortOrder ?? 0),
    published: payload.published === false ? false : true,
    createdAt: existing.createdAt || payload.createdAt || now(),
    updatedAt: now()
  };
}

function normalizeInquiry(payload, existing = {}) {
  const tripStyle = Array.isArray(payload.tripStyle) ? payload.tripStyle : (payload.tripStyle ? [payload.tripStyle] : []);
  const tags = Array.isArray(payload.tags) ? payload.tags : (payload.tags ? String(payload.tags).split(",") : existing.tags || []);
  const previousStatus = existing.status || "new";
  const nextStatus = inquiryStatuses.includes(payload.status) ? payload.status : previousStatus;
  const statusHistory = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
  const activity = Array.isArray(existing.activity) ? existing.activity : [];
  const hasStatusChange = existing.id && nextStatus !== previousStatus;
  const hasNoteChange = existing.id && payload.internalNotes !== undefined && payload.internalNotes !== existing.internalNotes;
  const timestamp = now();
  return {
    id: existing.id || payload.id || `inquiry-${Date.now()}`,
    createdAt: existing.createdAt || payload.createdAt || timestamp,
    updatedAt: timestamp,
    name: safeString(payload.name, 120),
    email: safeString(payload.email || existing.email, 180),
    phone: safeString(payload.phone || payload.whatsapp || existing.phone || existing.whatsapp, 120),
    travelDates: safeString(payload.travelDates, 160),
    travelers: safeString(payload.travelers, 80),
    citiesInterestedIn: safeString(payload.citiesInterestedIn || payload.cities, 240),
    preferredStayLevel: safeString(payload.preferredStayLevel || payload.stayLevel, 120),
    tripStyle: tripStyle.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 12),
    tags: tags.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 12),
    notes: safeString(payload.notes, 1200),
    sourcePage: safeString(payload.sourcePage || payload.source || "/trips", 300),
    status: nextStatus,
    internalNotes: safeString(payload.internalNotes ?? existing.internalNotes, 4000),
    statusHistory: hasStatusChange
      ? [...statusHistory, { from: previousStatus, to: nextStatus, at: timestamp, by: "admin" }]
      : statusHistory,
    activity: [
      ...activity,
      ...(!existing.id ? [{ type: "submitted", label: "Inquiry submitted", at: timestamp }] : []),
      ...(hasStatusChange ? [{ type: "status", label: `Status changed from ${previousStatus} to ${nextStatus}`, at: timestamp }] : []),
      ...(hasNoteChange ? [{ type: "note", label: "Internal notes updated", at: timestamp }] : [])
    ].slice(-80)
  };
}

function publicInquiry(inquiry) {
  return {
    id: inquiry.id,
    createdAt: inquiry.createdAt,
    status: inquiry.status
  };
}

async function sendInquiryNotification(inquiry) {
  const details = [
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `WhatsApp / Phone: ${inquiry.phone}`,
    `Travel dates: ${inquiry.travelDates}`,
    `Travelers: ${inquiry.travelers}`,
    `Cities: ${inquiry.citiesInterestedIn}`,
    `Stay level: ${inquiry.preferredStayLevel}`,
    `Trip style: ${inquiry.tripStyle.join(", ")}`,
    `Source: ${inquiry.sourcePage}`,
    `Notes: ${inquiry.notes}`
  ].join("\n");
  const notification = {
    id: `notification-${Date.now()}`,
    type: "inquiry",
    to: process.env.ADMIN_EMAIL || "admin@chinamigo.local",
    subject: `New ChinaMigo inquiry from ${inquiry.name || "visitor"}`,
    inquiryId: inquiry.id,
    body: details,
    inquiry,
    createdAt: now(),
    delivered: false,
    provider: process.env.RESEND_API_KEY ? "resend-not-configured-in-static-server" : "local-log"
  };
  const existing = await readJson(files.notifications, []);
  await writeJson(files.notifications, [notification, ...(Array.isArray(existing) ? existing : [])].slice(0, 300));
  console.log(`[Inquiry] ${notification.subject}`);
}

async function listUploadedMedia() {
  const stored = await readJson(files.media, []);
  return Array.isArray(stored) ? stored : [];
}

function decodeXml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function markdownToHtmlServer(markdown = "") {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let bullets = [];
  const inline = (text) => safeString(text, 5000).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    html.push(`<ul>${bullets.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    bullets = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const image = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    const cta = trimmed.match(/^CTA:\s*(.*?)\s*\|\s*(.+)$/i);
    if (!trimmed) {
      flushParagraph();
      flushBullets();
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      bullets.push(trimmed.slice(2).trim());
    } else if (image) {
      flushParagraph();
      flushBullets();
      html.push(`<figure><img src="/${safeString(image[2].replace(/^\/+/, ""), 500)}" alt="${safeString(image[1], 220)}"><figcaption>${safeString(image[1], 220)}</figcaption></figure>`);
    } else if (cta) {
      flushParagraph();
      flushBullets();
      html.push(`<p><a class="cms-cta" href="${safeString(cta[2], 500)}">${safeString(cta[1], 120)}</a></p>`);
    } else if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushBullets();
      html.push(`<h2>${inline(trimmed.slice(2))}</h2>`);
    } else if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushBullets();
      html.push(`<blockquote>${inline(trimmed.slice(2))}</blockquote>`);
    } else {
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushBullets();
  return html.join("");
}

function readZipEntries(buffer) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid DOCX file: zip directory not found.");
  const entries = new Map();
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);
  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let data = compressed;
    if (method === 8) data = zlib.inflateRawSync(compressed);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported DOCX compression method: ${method}`);
    entries.set(name, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function parseDocxRelationships(xml = "") {
  const rels = {};
  for (const match of xml.matchAll(/<Relationship\b([^>]+)>/g)) {
    const attrs = match[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) rels[id] = target.replace(/^\.\.\//, "");
  }
  return rels;
}

async function parseDocxImport(payload) {
  const match = safeString(payload.dataUrl, 60_000_000).match(/^data:application\/(?:vnd\.openxmlformats-officedocument\.wordprocessingml\.document|octet-stream);base64,(.+)$/i);
  if (!match) throw new Error("Please upload a valid .docx file.");
  const zip = readZipEntries(Buffer.from(match[1], "base64"));
  const documentXml = zip.get("word/document.xml")?.toString("utf8");
  if (!documentXml) throw new Error("Could not find Word document content.");
  const rels = parseDocxRelationships(zip.get("word/_rels/document.xml.rels")?.toString("utf8") || "");
  const uploadedMedia = [];
  await fs.mkdir(uploadDir, { recursive: true });

  async function saveRelatedImage(rid, alt = "Travel guide image") {
    const target = rels[rid];
    if (!target) return "";
    const entryName = target.startsWith("word/") ? target : `word/${target}`;
    const data = zip.get(entryName);
    if (!data) return "";
    const ext = path.extname(entryName).replace(".", "") || "png";
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const url = `assets/uploads/${filename}`;
    await fs.writeFile(path.join(uploadDir, filename), data);
    uploadedMedia.push({
      id: `media-${crypto.randomUUID()}`,
      url,
      alt: safeString(alt, 220),
      folder: "guides",
      filename,
      createdAt: now()
    });
    return url;
  }

  const rawLines = [];
  for (const paraMatch of documentXml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)) {
    const paragraphXml = paraMatch[0];
    const style = paragraphXml.match(/<w:pStyle[^>]*w:val="([^"]+)"/)?.[1] || "";
    const isList = /<w:numPr>/.test(paragraphXml);
    const texts = [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((item) => decodeXml(item[1]));
    const text = texts.join("").trim();
    const imageRids = [...paragraphXml.matchAll(/r:embed="([^"]+)"/g)].map((item) => item[1]);
    if (text) {
      if (/Heading1/i.test(style)) rawLines.push(`# ${text}`);
      else if (/Heading2/i.test(style)) rawLines.push(`## ${text}`);
      else if (/Heading3/i.test(style)) rawLines.push(`### ${text}`);
      else if (isList) rawLines.push(`- ${text}`);
      else if (/^Day\s+\d+|^第\s*\d+\s*天/i.test(text)) rawLines.push(`## ${text}`);
      else rawLines.push(text);
    }
    for (const rid of imageRids) {
      const url = await saveRelatedImage(rid, text || "Travel guide image");
      if (url) rawLines.push(`![${text || "Travel guide image"}](${url})`);
    }
    if (text || imageRids.length) rawLines.push("");
  }
  if (uploadedMedia.length) {
    const existing = await listUploadedMedia();
    await writeJson(files.media, [...uploadedMedia, ...existing]);
  }
  const rawContent = rawLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const title = rawLines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") || safeString(payload.filename || "Imported Guide", 120).replace(/\.docx$/i, "");
  return {
    title,
    excerpt: rawLines.find((line) => line && !line.startsWith("#") && !line.startsWith("!") && !line.startsWith("-")) || "",
    rawContent,
    htmlContent: markdownToHtmlServer(rawContent),
    coverImage: uploadedMedia[0]?.url || "",
    media: uploadedMedia
  };
}

async function handleAuth(req, res, url) {
  if (url.pathname === "/api/auth/session" && req.method === "GET") {
    const session = getSession(req);
    json(res, 200, { ok: true, authenticated: Boolean(session), user: session?.user || null });
    return true;
  }

  if (url.pathname === "/api/visitor/session" && req.method === "GET") {
    const session = getVisitorSession(req);
    json(res, 200, { ok: true, authenticated: Boolean(session), user: session?.user || null });
    return true;
  }

  if (url.pathname === "/api/visitor/register" && req.method === "POST") {
    const payload = await parsePayload(req);
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const name = safeString(payload.name || email.split("@")[0], 80);

    if (!isValidEmail(email)) {
      json(res, 400, { ok: false, error: "Please enter a valid email address." });
      return true;
    }
    if (password.length < 8) {
      json(res, 400, { ok: false, error: "Password must be at least 8 characters." });
      return true;
    }

    const users = await readJson(files.users, []);
    if (users.some((user) => user.email === email)) {
      json(res, 409, { ok: false, error: "An account with this email already exists." });
      return true;
    }

    const user = {
      id: `user-${crypto.randomUUID()}`,
      email,
      name,
      role: "visitor",
      passwordHash: hashPassword(password),
      createdAt: now(),
      updatedAt: now()
    };
    await writeJson(files.users, [user, ...(Array.isArray(users) ? users : [])].slice(0, 1000));
    const token = crypto.randomBytes(24).toString("hex");
    visitorSessions.set(token, {
      user: publicUser(user),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14
    });
    json(res, 200, { ok: true, user: publicUser(user) }, {
      "Set-Cookie": `cm_visitor_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=1209600`
    });
    return true;
  }

  if (url.pathname === "/api/visitor/login" && req.method === "POST") {
    const payload = await parsePayload(req);
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    const users = await readJson(files.users, []);
    const user = users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      json(res, 401, { ok: false, error: "Invalid email or password." });
      return true;
    }

    const token = crypto.randomBytes(24).toString("hex");
    visitorSessions.set(token, {
      user: publicUser(user),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14
    });
    json(res, 200, { ok: true, user: publicUser(user) }, {
      "Set-Cookie": `cm_visitor_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=1209600`
    });
    return true;
  }

  if (url.pathname === "/api/visitor/logout" && req.method === "POST") {
    const token = parseCookies(req).cm_visitor_session;
    if (token) visitorSessions.delete(token);
    json(res, 200, { ok: true }, {
      "Set-Cookie": "cm_visitor_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return true;
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    const payload = await parsePayload(req);
    if (payload.username !== adminUser || payload.password !== adminPassword) {
      json(res, 401, { ok: false, error: "Invalid admin credentials." });
      return true;
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, {
      user: { username: adminUser, role: "admin" },
      expiresAt: Date.now() + 1000 * 60 * 60 * 12
    });
    json(res, 200, { ok: true, user: { username: adminUser, role: "admin" } }, {
      "Set-Cookie": `cm_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`
    });
    return true;
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const token = parseCookies(req).cm_session;
    if (token) sessions.delete(token);
    json(res, 200, { ok: true }, {
      "Set-Cookie": "cm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return true;
  }

  return false;
}

async function handleAdminApi(req, res, url) {
  const session = requireAdmin(req, res);
  if (!session) return true;

  if (url.pathname === "/api/admin/overview" && req.method === "GET") {
    const [guides, cities, experiences, inquiries, media] = await Promise.all([
      readJson(files.guides, []),
      readJson(files.cities, []),
      readJson(files.experiences, []),
      readJson(files.inquiries, []),
      listUploadedMedia()
    ]);
    json(res, 200, {
      ok: true,
      counts: {
        guides: guides.length,
        cities: cities.length,
        experiences: experiences.length,
        inquiries: inquiries.length,
        media: media.length
      },
      latestInquiries: inquiries.slice(0, 5)
    });
    return true;
  }

  if (url.pathname === "/api/admin/guides") {
    if (req.method === "GET") json(res, 200, { ok: true, data: await readJson(files.guides, []) });
    else if (req.method === "POST") {
      const guides = await readJson(files.guides, []);
      const payload = await parsePayload(req);
      const index = guides.findIndex((guide) => guide.id === payload.id);
      const next = normalizeGuide(payload, index >= 0 ? guides[index] : {});
      const updated = index >= 0 ? guides.map((guide, i) => i === index ? next : guide) : [next, ...guides];
      await writeJson(files.guides, updated);
      json(res, 200, { ok: true, data: next });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.guides, (await readJson(files.guides, [])).filter((guide) => guide.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/cities") {
    if (req.method === "GET") json(res, 200, { ok: true, data: await readJson(files.cities, []) });
    else if (req.method === "POST") {
      const cities = await readJson(files.cities, []);
      const payload = await parsePayload(req);
      const index = cities.findIndex((city) => city.id === payload.id);
      const next = normalizeCity(payload, index >= 0 ? cities[index] : {});
      const updated = index >= 0 ? cities.map((city, i) => i === index ? next : city) : [...cities, next];
      await writeJson(files.cities, updated.sort((a, b) => a.sortOrder - b.sortOrder));
      json(res, 200, { ok: true, data: next });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.cities, (await readJson(files.cities, [])).filter((city) => city.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/experiences") {
    if (req.method === "GET") json(res, 200, { ok: true, data: await readJson(files.experiences, []) });
    else if (req.method === "POST") {
      const experiences = await readJson(files.experiences, []);
      const payload = await parsePayload(req);
      const index = experiences.findIndex((experience) => experience.id === payload.id);
      const next = normalizeExperience(payload, index >= 0 ? experiences[index] : {});
      const updated = index >= 0 ? experiences.map((experience, i) => i === index ? next : experience) : [next, ...experiences];
      await writeJson(files.experiences, updated.sort((a, b) => a.sortOrder - b.sortOrder));
      json(res, 200, { ok: true, data: next });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.experiences, (await readJson(files.experiences, [])).filter((experience) => experience.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/inquiries") {
    if (req.method === "GET") json(res, 200, { ok: true, data: await readJson(files.inquiries, []) });
    else if (req.method === "PATCH") {
      const payload = await parsePayload(req);
      const inquiries = await readJson(files.inquiries, []);
      const updated = inquiries.map((inquiry) => inquiry.id === payload.id ? normalizeInquiry({ ...inquiry, ...payload }, inquiry) : inquiry);
      await writeJson(files.inquiries, updated);
      json(res, 200, { ok: true, data: updated.find((item) => item.id === payload.id) });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.inquiries, (await readJson(files.inquiries, [])).filter((inquiry) => inquiry.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/inquiries/export" && req.method === "GET") {
    const inquiries = await readJson(files.inquiries, []);
    const columns = ["createdAt", "status", "name", "email", "phone", "travelDates", "travelers", "citiesInterestedIn", "preferredStayLevel", "tripStyle", "notes", "sourcePage", "internalNotes"];
    const escapeCell = (value) => `"${String(Array.isArray(value) ? value.join(", ") : value || "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...inquiries.map((item) => columns.map((column) => escapeCell(item[column] ?? item[column === "citiesInterestedIn" ? "cities" : column === "preferredStayLevel" ? "stayLevel" : column])).join(","))].join("\n");
    send(res, 200, `${csv}\n`, "text/csv; charset=utf-8", {
      "Content-Disposition": "attachment; filename=\"chinamigo-inquiries.csv\""
    });
    return true;
  }

  if (url.pathname === "/api/admin/media" && req.method === "GET") {
    json(res, 200, { ok: true, data: await listUploadedMedia() });
    return true;
  }

  if (url.pathname === "/api/admin/media" && req.method === "DELETE") {
    const id = url.searchParams.get("id");
    await writeJson(files.media, (await listUploadedMedia()).filter((item) => item.id !== id));
    json(res, 200, { ok: true });
    return true;
  }

  return false;
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (await handleAuth(req, res, url)) return;
  if (url.pathname.startsWith("/api/admin/") && await handleAdminApi(req, res, url)) return;

  if (url.pathname === "/api/public/guides" && req.method === "GET") {
    const guides = await readJson(files.guides, []);
    json(res, 200, {
      ok: true,
      data: guides.filter((guide) => guide.status === "published")
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/public/cities" && req.method === "GET") {
    const cities = await readJson(files.cities, []);
    json(res, 200, {
      ok: true,
      data: cities.filter((city) => city.active).sort((a, b) => a.sortOrder - b.sortOrder)
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/public/experiences" && req.method === "GET") {
    const city = url.searchParams.get("city");
    const type = url.searchParams.get("type");
    const experiences = await readJson(files.experiences, []);
    json(res, 200, {
      ok: true,
      data: experiences
        .filter((experience) => experience.published)
        .filter((experience) => !city || experience.city === city)
        .filter((experience) => !type || experience.type === type)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/guides" && req.method === "GET") {
    const data = await readJson(files.guideCards, { section: {}, cards: [] });
    json(res, 200, data, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/guides" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const normalized = normalizeGuideCards(await parsePayload(req));
    await writeJson(files.guideCards, normalized);
    json(res, 200, { ok: true, data: normalized });
    return;
  }

  if (url.pathname === "/api/import/docx" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    try {
      const imported = await parseDocxImport(await parsePayload(req));
      json(res, 200, { ok: true, data: imported });
    } catch (error) {
      console.error("[DOCX import]", error);
      json(res, 400, { ok: false, error: error.message || "DOCX import failed." });
    }
    return;
  }

  if (url.pathname === "/api/ai/beautify" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      json(res, 503, { ok: false, error: "AI beautify is not configured. Please add API key." });
      return;
    }
    const payload = await parsePayload(req);
    const title = safeString(payload.title, 220);
    const language = safeString(payload.language || "en", 20);
    const content = safeString(payload.content, 80000);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an editorial travel guide formatter for a luxury China concierge brand. Return JSON only with beautifiedContent, suggestedTitle, and suggestedExcerpt. Keep the content factual, concise, and in the same language. Use simple Markdown headings, paragraphs, bullet lists, image markdown unchanged, and CTA lines unchanged."
            },
            {
              role: "user",
              content: JSON.stringify({ title, language, content })
            }
          ]
        })
      });
      const result = await response.json();
      if (!response.ok) {
        console.error("[AI beautify]", result);
        json(res, response.status, { ok: false, error: result.error?.message || "AI beautify failed." });
        return;
      }
      let parsed = {};
      try {
        parsed = JSON.parse(result.choices?.[0]?.message?.content || "{}");
      } catch {
        parsed = { beautifiedContent: result.choices?.[0]?.message?.content || content };
      }
      json(res, 200, {
        ok: true,
        beautifiedContent: safeString(parsed.beautifiedContent || content, 80000),
        suggestedTitle: safeString(parsed.suggestedTitle || "", 220),
        suggestedExcerpt: safeString(parsed.suggestedExcerpt || "", 420)
      });
    } catch (error) {
      console.error("[AI beautify]", error);
      json(res, 500, { ok: false, error: error.message || "AI beautify failed." });
    }
    return;
  }

  if (url.pathname === "/api/upload" && req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const payload = await parsePayload(req);
    const match = safeString(payload.dataUrl, 30_000_000).match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
    if (!match) {
      json(res, 400, { ok: false, error: "Upload must be a png, jpg, webp or gif data URL." });
      return;
    }

    const ext = match[1].split("/")[1].replace("jpeg", "jpg");
    const baseName = slugify(String(payload.filename || `media-${Date.now()}`).replace(/\.[^.]+$/, ""), "media");
    const filename = `${Date.now()}-${baseName}.${ext}`;
    const outputPath = path.join(uploadDir, filename);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(match[2], "base64"));
    const media = {
      id: `media-${crypto.randomUUID()}`,
      url: `assets/uploads/${filename}`,
      alt: safeString(payload.alt || baseName, 220),
      folder: safeString(payload.folder || "guides", 120),
      filename,
      createdAt: now()
    };
    const existing = await listUploadedMedia();
    await writeJson(files.media, [media, ...existing]);
    json(res, 200, { ok: true, path: media.url, media });
    return;
  }

  if (url.pathname === "/api/inquiries" && req.method === "POST") {
    if (!checkInquiryRateLimit(req)) {
      json(res, 429, { ok: false, error: "Too many inquiries. Please try again later." });
      return;
    }
    const payload = await parsePayload(req);
    if (safeString(payload.website || payload.companyWebsite, 200)) {
      json(res, 200, { ok: true, inquiry: publicInquiry({ id: `spam-${Date.now()}`, createdAt: now(), status: "spam" }) });
      return;
    }
    if (!safeString(payload.name, 120) || !safeString(payload.email, 180) || !safeString(payload.phone || payload.whatsapp, 120)) {
      json(res, 400, { ok: false, error: "Name, email and WhatsApp / phone are required." });
      return;
    }
    const inquiry = normalizeInquiry(payload);
    const existing = await readJson(files.inquiries, []);
    const next = [inquiry, ...(Array.isArray(existing) ? existing : [])].slice(0, 500);
    await writeJson(files.inquiries, next);
    await sendInquiryNotification(inquiry);
    json(res, 200, { ok: true, inquiry: publicInquiry(inquiry) });
    return;
  }

  json(res, 404, { ok: false, error: "API route not found." });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveFile(req, res);
  } catch (error) {
    json(res, 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`ChinaMigo CMS running at http://${host}:${port}`);
  console.log(`Admin: http://${host}:${port}/admin.html`);
  console.log(`Default admin login: ${adminUser} / ${adminPassword}`);
});
