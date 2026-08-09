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
  guideCollections: path.join(dataDir, "guide-collections.json"),
  cities: path.join(dataDir, "cities.json"),
  experiences: path.join(dataDir, "experiences.json"),
  inquiries: path.join(dataDir, "inquiries.json"),
  templates: path.join(dataDir, "templates.json"),
  media: path.join(dataDir, "media.json"),
  notifications: path.join(dataDir, "email-notifications.json"),
  users: path.join(dataDir, "users.json")
};

const adminUser = process.env.ADMIN_USER || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "chinamigo2026";
const sessions = new Map();
const visitorSessions = new Map();
const inquiryRateLimit = new Map();
const inquiryStatuses = ["new", "replied", "following", "confirmed", "won", "lost", "spam", "reviewed", "contacted", "planning", "quoted"];
const guideCategoryOptions = ["Payments", "Apps", "Transportation", "Food & Cafés", "Safety", "Hotels", "Shopping", "Beauty & Wellness"];
const guideCategories = new Set(guideCategoryOptions);
const guideCategoryAliases = {
  "Apps & Digital Life": "Apps",
  "Food & Cafes": "Food & Cafés",
  "Shopping & Sourcing": "Shopping",
  "Where to Stay": "Hotels",
  Lifestyle: "Payments"
};

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

function normalizeGuideCategory(value) {
  const category = safeString(value, 120);
  if (!category) return guideCategoryOptions[0];
  return guideCategoryAliases[category] || (guideCategories.has(category) ? category : guideCategoryOptions[0]);
}

function slugify(value, fallback = "item") {
  const slug = safeString(value, 160)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${fallback}-${Date.now()}`;
}

function stripHtml(value = "") {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function estimateReadTimeForGuide(guide = {}) {
  const translations = guide.translations || {};
  const text = [
    translations.en?.rawContent,
    translations.cn?.rawContent,
    stripHtml(translations.en?.htmlContent),
    stripHtml(translations.cn?.htmlContent),
    guide.excerpt,
    ...(guide.contentBlocks || []).flatMap((block) => [block.title, block.body, ...(block.items || [])])
  ].filter(Boolean).join(" ");
  const latinWords = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
  const cjkChars = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const minutes = Math.max(1, Math.ceil((latinWords + cjkChars / 2) / 220));
  return `${minutes} min read`;
}

function scoreRelatedGuide(source, candidate) {
  if (!source || !candidate || source.id === candidate.id || source.slug === candidate.slug) return -1;
  let score = 0;
  if (source.category && source.category === candidate.category) score += 5;
  if (source.city && candidate.city && source.city === candidate.city) score += 4;
  const sourceTags = new Set((source.tags || []).map((tag) => String(tag).toLowerCase()));
  for (const tag of candidate.tags || []) {
    if (sourceTags.has(String(tag).toLowerCase())) score += 2;
  }
  if (candidate.featured) score += 1;
  return score;
}

function withGuideRelations(guides) {
  return guides.map((guide) => {
    const autoRelated = guides
      .filter((candidate) => candidate.status === "published")
      .map((candidate) => ({ candidate, score: scoreRelatedGuide(guide, candidate) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || String(b.candidate.updatedAt || "").localeCompare(String(a.candidate.updatedAt || "")))
      .slice(0, 6)
      .map((entry) => entry.candidate.slug);
    const manual = Array.isArray(guide.relatedGuides) ? guide.relatedGuides.filter(Boolean) : [];
    return {
      ...guide,
      readTime: guide.readTime || estimateReadTimeForGuide(guide),
      relatedGuides: manual.length ? manual : autoRelated,
      autoRelatedGuides: autoRelated
    };
  });
}

function publicGuideList(guides) {
  return withGuideRelations(guides.map((guide) => ({
    ...guide,
    category: normalizeGuideCategory(guide.category)
  })))
    .filter((guide) => guide.status === "published")
    .sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
      return String(b.publishedAt || b.updatedAt || b.createdAt || "")
        .localeCompare(String(a.publishedAt || a.updatedAt || a.createdAt || ""));
    });
}

function normalizeGuideCollection(payload, existing = {}) {
  const title = safeString(payload.title || existing.title || "Guide Collection", 160);
  const categories = Array.isArray(payload.categories)
    ? payload.categories
    : String(payload.categories || existing.categories || "").split(",");
  const guideSlugs = Array.isArray(payload.guideSlugs)
    ? payload.guideSlugs
    : String(payload.guideSlugs || existing.guideSlugs || "").split(",");
  return {
    id: safeString(existing.id || payload.id || `guide-collection-${crypto.randomUUID()}`, 120),
    title,
    description: safeString(payload.description || existing.description || "", 520),
    categories: [...new Set(categories.map(normalizeGuideCategory))].slice(0, 12),
    guideSlugs: guideSlugs.map((item) => slugify(item, "guide")).filter(Boolean).slice(0, 24),
    image: safeString(payload.image || existing.image || "", 500),
    alt: safeString(payload.alt || existing.alt || title, 240),
    sortOrder: Number.isFinite(Number(payload.sortOrder ?? existing.sortOrder))
      ? Number(payload.sortOrder ?? existing.sortOrder)
      : 100,
    active: payload.active === false || payload.active === "false" ? false : true,
    createdAt: existing.createdAt || payload.createdAt || now(),
    updatedAt: now()
  };
}

function publicGuideCollections(collections, guides) {
  const publishedGuides = publicGuideList(guides);
  const bySlug = new Map(publishedGuides.map((guide) => [guide.slug, guide]));

  return (Array.isArray(collections) ? collections : [])
    .filter((collection) => collection.active !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((collection) => {
      const manualGuides = (collection.guideSlugs || [])
        .map((slug) => bySlug.get(slug))
        .filter(Boolean);
      const categoryGuides = publishedGuides.filter((guide) => (collection.categories || []).includes(guide.category));
      const seen = new Set();
      const matchedGuides = [...manualGuides, ...categoryGuides].filter((guide) => {
        if (!guide?.slug || seen.has(guide.slug)) return false;
        seen.add(guide.slug);
        return true;
      });
      if (!matchedGuides.length) return null;

      const firstGuide = matchedGuides[0];
      const image = collection.image || firstGuide.coverImage || "assets/guide-first-time-china.png";
      const href = collection.categories?.length === 1 && !collection.guideSlugs?.length
        ? `/?category=${encodeURIComponent(collection.categories[0])}`
        : `/guides/${firstGuide.slug}`;

      return {
        ...collection,
        image,
        alt: collection.alt || firstGuide.coverAlt || firstGuide.title || collection.title,
        imagePosition: collection.image ? "center center" : (firstGuide.imagePosition || "center center"),
        imageScale: collection.image ? 1.02 : (firstGuide.imageScale || 1.02),
        count: matchedGuides.length,
        href,
        guides: matchedGuides.slice(0, 6).map((guide) => guide.slug)
      };
    })
    .filter(Boolean);
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
  const citySlug = url.pathname.startsWith("/cities/") ? url.pathname.split("/").filter(Boolean)[1] : "";
  const routes = {
    "/": "/guides.html",
    "/guides": "/guides.html",
    "/trips": "/trips.html",
    "/about": "/about.html",
    "/contact": "/contact.html",
    "/admin": "/admin.html"
  };
  const routePath = routes[url.pathname]
    || (url.pathname.startsWith("/guides/") ? "/guide-detail.html" : null)
    || (citySlug ? "/city-experiences.html" : null)
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
      imageScale: Math.min(1.8, Math.max(1, Number(card.imageScale || 1.02))),
      ratio: ["4 / 5", "3 / 4", "1 / 1"].includes(card.ratio) ? card.ratio : "4 / 5"
    }))
  };
}

function normalizeContentBlocks(blocks) {
  const allowed = new Set(["heading", "paragraph", "divider", "bullet_list", "number_list", "image", "gallery", "quote", "checklist", "tip", "cta", "faq", "itinerary_day"]);
  return (Array.isArray(blocks) ? blocks : []).slice(0, 80).map((block) => ({
    id: safeString(block.id || `block-${crypto.randomUUID()}`, 80),
    type: allowed.has(block.type) ? block.type : "paragraph",
    title: safeString(block.title, 220),
    body: safeString(block.body, 3000),
    morning: safeString(block.morning, 2200),
    afternoon: safeString(block.afternoon, 2200),
    evening: safeString(block.evening, 2200),
    stayNotes: safeString(block.stayNotes, 2200),
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
  const category = normalizeGuideCategory(payload.category || existing.category);
  const normalized = {
    id: safeString(existing.id || payload.id || `guide-${crypto.randomUUID()}`, 100),
    title,
    slug: slugify(payload.slug || existing.slug || title, "guide"),
    category,
    city: safeString(payload.city || existing.city || "", 120),
    tags: tags.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 20),
    featured: Boolean(payload.featured ?? existing.featured ?? false),
    author: safeString(payload.author || existing.author || "ChinaMigo Editorial", 140),
    excerpt: safeString(payload.excerpt || en.excerpt || existing.excerpt || "", 420),
    coverImage: safeString(payload.coverImage || existing.coverImage || "", 500),
    coverAlt: safeString(payload.coverAlt || existing.coverAlt || "", 240),
    mobileCoverImage: safeString(payload.mobileCoverImage || existing.mobileCoverImage || "", 500),
    imagePosition: safeString(payload.imagePosition || existing.imagePosition || "center center", 80),
    imageScale: Math.min(1.8, Math.max(1, Number(payload.imageScale || existing.imageScale || 1.02))),
    readTime: safeString(payload.readTime || existing.readTime || "", 80),
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
  normalized.readTime = estimateReadTimeForGuide(normalized);
  return normalized;
}

function normalizeCity(payload, existing = {}) {
  const name = safeString(payload.name || existing.name || "City", 120);
  const shortDescription = safeString(payload.shortDescription || payload.description || existing.shortDescription || existing.description || "", 420);
  return {
    id: safeString(existing.id || payload.id || `city-${crypto.randomUUID()}`, 100),
    name,
    slug: slugify(payload.slug || existing.slug || name, "city"),
    description: shortDescription,
    shortDescription,
    longDescription: safeString(payload.longDescription || existing.longDescription || "", 2200),
    bannerImage: safeString(payload.bannerImage || existing.bannerImage || "", 500),
    cardImage: safeString(payload.cardImage || existing.cardImage || "", 500),
    thumbnailImage: safeString(payload.thumbnailImage || existing.thumbnailImage || "", 500),
    sortOrder: Number(payload.sortOrder ?? existing.sortOrder ?? 0),
    active: payload.active === false ? false : true,
    showInNavigation: payload.showInNavigation === false ? false : true,
    updatedAt: now()
  };
}

function normalizeExperience(payload, existing = {}) {
  const title = safeString(payload.title || existing.title || "Untitled Experience", 180);
  const itineraryDays = Array.isArray(payload.itineraryDays) ? payload.itineraryDays : (existing.itineraryDays || []);
  const shortDetails = payload.shortDetails && typeof payload.shortDetails === "object" ? payload.shortDetails : (existing.shortDetails || {});
  const experienceFlow = Array.isArray(payload.experienceFlow) ? payload.experienceFlow : (existing.experienceFlow || []);
  const experienceDetails = Array.isArray(payload.experienceDetails) ? payload.experienceDetails : (existing.experienceDetails || []);
  const includedSupport = Array.isArray(payload.includedSupport) ? payload.includedSupport : (existing.includedSupport || []);
  const notIncluded = Array.isArray(payload.notIncluded) ? payload.notIncluded : (existing.notIncluded || []);
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : (existing.reviews || []);
  const faqs = Array.isArray(payload.faqs) ? payload.faqs : (existing.faqs || []);
  const expert = payload.expert && typeof payload.expert === "object" ? payload.expert : (existing.expert || {});
  const cta = payload.cta && typeof payload.cta === "object" ? payload.cta : (existing.cta || {});
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
    itineraryDays: itineraryDays.slice(0, 14).map((day, index) => ({
      title: safeString(day.title || `Day ${index + 1}`, 120),
      template: safeString(day.template || "free", 80),
      outlineFields: Array.isArray(day.outlineFields) ? day.outlineFields.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 20) : [],
      summary: safeString(day.summary, 900),
      highlights: safeString(day.highlights, 1800),
      timeline: safeString(day.timeline, 2200),
      places: safeString(day.places, 2200),
      experience: safeString(day.experience, 2200),
      participation: safeString(day.participation, 2200),
      food: safeString(day.food, 2200),
      practical: safeString(day.practical, 2200),
      tips: safeString(day.tips, 2200),
      arrival: safeString(day.arrival, 2200),
      transfer: safeString(day.transfer, 2200),
      hotel: safeString(day.hotel, 2200),
      eveningPlan: safeString(day.eveningPlan, 2200),
      body: safeString(day.body, 3000),
      morning: safeString(day.morning, 2200),
      afternoon: safeString(day.afternoon, 2200),
      evening: safeString(day.evening, 2200),
      stayNotes: safeString(day.stayNotes, 2200),
      image: safeString(day.image, 500)
    })),
    shortDetails: {
      location: safeString(shortDetails.location, 220),
      highlights: safeString(shortDetails.highlights, 2000),
      bookingMethod: safeString(shortDetails.bookingMethod, 420),
      notes: safeString(shortDetails.notes, 2000)
    },
    experienceFlow: experienceFlow.slice(0, 8).map((item) => ({
      title: safeString(item.title, 160),
      description: safeString(item.description, 800),
      icon: safeString(item.icon, 12)
    })).filter((item) => item.title || item.description),
    experienceDetails: experienceDetails.slice(0, 8).map((item) => ({
      title: safeString(item.title, 160),
      description: safeString(item.description, 900),
      icon: safeString(item.icon, 12)
    })).filter((item) => item.title || item.description),
    includedSupport: includedSupport.map((item) => safeString(item, 180)).filter(Boolean).slice(0, 16),
    notIncluded: notIncluded.map((item) => safeString(item, 180)).filter(Boolean).slice(0, 16),
    reviews: reviews.slice(0, 8).map((item) => ({
      text: safeString(item.text || item.quote, 1000),
      context: safeString(item.context || item.travelerType, 180)
    })).filter((item) => item.text || item.context),
    faqs: faqs.slice(0, 10).map((item) => ({
      question: safeString(item.question, 260),
      answer: safeString(item.answer, 1200)
    })).filter((item) => item.question || item.answer),
    expert: {
      name: safeString(expert.name, 120),
      role: safeString(expert.role, 260),
      details: safeString(expert.details, 520),
      image: safeString(expert.image, 500),
      initials: safeString(expert.initials, 8)
    },
    cta: {
      title: safeString(cta.title, 120),
      responseTime: safeString(cta.responseTime, 160),
      buttonLabel: safeString(cta.buttonLabel, 120),
      description: safeString(cta.description, 520)
    },
    rating: safeString(payload.rating || existing.rating || "", 20),
    reviewCount: safeString(payload.reviewCount || existing.reviewCount || "", 20),
    recommendRate: safeString(payload.recommendRate || existing.recommendRate || "", 20),
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
  const hasOwnerChange = existing.id && payload.owner !== undefined && payload.owner !== existing.owner;
  const hasPriorityChange = existing.id && payload.priority !== undefined && payload.priority !== existing.priority;
  const hasReply = existing.id && payload.lastReplyAt !== undefined && payload.lastReplyAt !== existing.lastReplyAt;
  const customActivity = safeString(payload.activityLabel || "", 220);
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
    tripLength: safeString(payload.tripLength, 80),
    citiesInterestedIn: safeString(payload.citiesInterestedIn || payload.cities, 240),
    preferredStayLevel: safeString(payload.preferredStayLevel || payload.stayLevel, 120),
    budgetRange: safeString(payload.budgetRange || payload.budget, 120),
    tripStyle: tripStyle.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 12),
    tags: tags.map((item) => safeString(item, 80)).filter(Boolean).slice(0, 12),
    owner: safeString(payload.owner ?? existing.owner ?? "Migo", 80),
    priority: safeString(payload.priority ?? existing.priority ?? "", 80),
    lastReplyAt: safeString(payload.lastReplyAt ?? existing.lastReplyAt ?? "", 80),
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
      ...(hasNoteChange ? [{ type: "note", label: "Internal notes updated", at: timestamp }] : []),
      ...(hasOwnerChange ? [{ type: "owner", label: `Owner changed to ${safeString(payload.owner, 80)}`, at: timestamp }] : []),
      ...(hasPriorityChange ? [{ type: "priority", label: `Priority changed to ${safeString(payload.priority || "Normal", 80)}`, at: timestamp }] : []),
      ...(hasReply ? [{ type: "whatsapp", label: customActivity || "WhatsApp reply copied", at: timestamp }] : []),
      ...(customActivity && !hasReply ? [{ type: "activity", label: customActivity, at: timestamp }] : [])
    ].slice(-80)
  };
}

function normalizeTemplate(payload, existing = {}) {
  const timestamp = now();
  const title = safeString(payload.title ?? existing.title, 120) || "未命名模板";
  return {
    id: existing.id || payload.id || `template-${Date.now()}`,
    title,
    slug: slugify(payload.slug || existing.slug || title, "template"),
    category: safeString(payload.category ?? existing.category ?? "欢迎", 80),
    channel: safeString(payload.channel ?? existing.channel ?? "WhatsApp", 40),
    language: safeString(payload.language ?? existing.language ?? "EN", 20),
    icon: safeString(payload.icon ?? existing.icon ?? "💬", 12),
    body: safeString(payload.body ?? existing.body, 3000),
    sortOrder: Number(payload.sortOrder ?? existing.sortOrder ?? 0),
    favorite: payload.favorite === true || payload.favorite === "true" || existing.favorite === true,
    active: payload.active === false || payload.active === "false" ? false : true,
    createdAt: existing.createdAt || payload.createdAt || timestamp,
    updatedAt: timestamp
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
    `Trip length: ${inquiry.tripLength || ""}`,
    `Cities: ${inquiry.citiesInterestedIn}`,
    `Stay level: ${inquiry.preferredStayLevel}`,
    `Budget range: ${inquiry.budgetRange || ""}`,
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
  if (!Array.isArray(stored)) return [];
  return stored.map((item) => ({
    ...item,
    category: safeString(item.category || item.folder || "guides", 80),
    folder: safeString(item.folder || item.category || "guides", 80),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => safeString(tag, 80)).filter(Boolean) : []
  }));
}

function findImageUsage(media, guides = [], cities = [], experiences = []) {
  const byUrl = new Map(media.map((item) => [String(item.url || "").replace(/^\/+/, ""), []]));
  const addUsage = (url, label, type, editTarget = "") => {
    const key = String(url || "").replace(/^\/+/, "");
    if (!key || !byUrl.has(key)) return;
    const list = byUrl.get(key);
    if (!list.some((entry) => entry.label === label && entry.type === type)) {
      list.push({ label: safeString(label, 180), type, editTarget: safeString(editTarget, 240) });
    }
  };

  for (const guide of guides) {
    const label = guide.title || guide.translations?.en?.title || guide.slug || "Guide";
    const editTarget = `guide:${guide.id || guide.slug || ""}`;
    addUsage(guide.coverImage, label, "攻略封面", editTarget);
    addUsage(guide.mobileCoverImage, label, "攻略移动端封面", editTarget);
    addUsage(guide.seo?.ogImage, label, "攻略 OG 图片", editTarget);
    const raw = [guide.translations?.en?.rawContent, guide.translations?.cn?.rawContent].filter(Boolean).join("\n");
    for (const match of raw.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)) addUsage(match[1], label, "攻略正文", editTarget);
  }

  for (const city of cities) {
    const label = `${city.name || city.slug || "City"} City Page`;
    const editTarget = `city:${city.id || city.slug || ""}`;
    addUsage(city.bannerImage, label, "城市横幅图", editTarget);
    addUsage(city.cardImage, label, "城市卡片图", editTarget);
    addUsage(city.thumbnailImage, label, "城市缩略图", editTarget);
  }

  for (const experience of experiences) {
    const label = experience.title || experience.slug || "Experience";
    const editTarget = `experience:${experience.id || experience.slug || ""}`;
    addUsage(experience.coverImage, label, "行程封面", editTarget);
    for (const src of experience.galleryImages || []) addUsage(src, label, "行程图片组", editTarget);
    for (const day of experience.itineraryDays || []) addUsage(day.image, label, "Day 图片", editTarget);
  }

  return byUrl;
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
  const normalizeInlineShortcodes = (value = "") => {
    let output = String(value || "");
    for (let index = 0; index < 5; index += 1) {
      output = output
        .replace(/\[highlight(?::([^\]]+))?]\s*\[highlight(?::[^\]]+)?]([\s\S]*?)\[\/highlight]\s*\[\/highlight]/g, (_match, color, body) => `[highlight${color ? `:${color}` : ""}]${body}[/highlight]`)
        .replace(/\[size:(small|medium|large|hero)]\s*\[size:(?:small|medium|large|hero)]([\s\S]*?)\[\/size]\s*\[\/size]/g, "[size:$1]$2[/size]")
        .replace(/\[color:([^\]]+)]\s*\[color:[^\]]+]([\s\S]*?)\[\/color]\s*\[\/color]/g, "[color:$1]$2[/color]");
    }
    return output;
  };
  const inline = (text) => safeString(normalizeInlineShortcodes(text), 5000)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[color:([#a-zA-Z0-9(),.\s-]+)]([\s\S]*?)\[\/color]/g, '<span class="cms-text-color" style="color:$1">$2</span>')
    .replace(/\[size:(small|medium|large|hero)]([\s\S]*?)\[\/size]/g, '<span class="cms-text-size cms-text-size-$1">$2</span>')
    .replace(/\[highlight(?::([#a-zA-Z0-9(),.\s-]+))?]([\s\S]*?)\[\/highlight]/g, (_match, color, body) => (
      `<mark class="cms-highlight"${color ? ` style="background:${color}"` : ""}>${body}</mark>`
    ))
    .replace(/\[\/?(?:highlight(?::[^\]]+)?|size:(?:small|medium|large|hero)|color:[^\]]+)]/g, "");
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
    const audio = trimmed.match(/^Audio:\s*(.*?)\s*\|\s*(.+)$/i);
    const video = trimmed.match(/^Video:\s*(.*?)\s*\|\s*(.+)$/i);
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
    } else if (audio) {
      flushParagraph();
      flushBullets();
      html.push(`<figure class="cms-media cms-audio"><figcaption>${safeString(audio[1], 220)}</figcaption><audio controls src="/${safeString(audio[2].replace(/^\/+/, ""), 500)}"></audio></figure>`);
    } else if (video) {
      flushParagraph();
      flushBullets();
      html.push(`<figure class="cms-media cms-video"><video controls playsinline src="/${safeString(video[2].replace(/^\/+/, ""), 500)}"></video><figcaption>${safeString(video[1], 220)}</figcaption></figure>`);
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
    const usage = findImageUsage(media, guides, cities, experiences);
    const countWhere = (items, predicate) => items.filter(predicate).length;
    const now = Date.now();
    const dayMs = 86400000;
    const isWithinDays = (value, days) => {
      const date = new Date(value || "");
      return !Number.isNaN(date.getTime()) && now - date.getTime() <= days * dayMs;
    };
    const minutesBetween = (from, to) => {
      const start = new Date(from || "");
      const end = new Date(to || "");
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    };
    const unhandledStatuses = new Set(["new", "reviewed", "replied", "contacted"]);
    const activeStatuses = new Set(["following", "planning", "quoted"]);
    const guideMissingCover = countWhere(guides, (guide) => !guide.coverImage);
    const guideDrafts = countWhere(guides, (guide) => guide.status === "draft");
    const guideNeedsCn = countWhere(guides, (guide) => !guide.translations?.cn?.title && !guide.translations?.cn?.rawContent);
    const guideMissingSeo = countWhere(guides, (guide) => !guide.translations?.en?.seo?.description && !guide.seo?.description && !guide.metaDescription);
    const guideMissingTags = countWhere(guides, (guide) => !(guide.tags || []).length);
    const guideMissingPlacement = countWhere(guides, (guide) => !guide.city || !guide.category);
    const cityMissingVisual = countWhere(cities, (city) => !city.bannerImage || !city.cardImage);
    const unpublishedExperiences = countWhere(experiences, (experience) => !experience.published);
    const uncategorizedMedia = countWhere(media, (item) => !item.category || item.category === "media");
    const unusedMedia = countWhere(media, (item) => !(usage.get(String(item.url || "").replace(/^\/+/, "")) || []).length);
    const newInquiriesToday = countWhere(inquiries, (item) => isWithinDays(item.createdAt, 1));
    const repliedInquiriesWeek = inquiries.filter((item) => isWithinDays(item.createdAt, 7));
    const repliedInquiries = repliedInquiriesWeek.filter((item) => item.lastReplyAt || ["replied", "following", "confirmed", "won"].includes(item.status));
    const responseTimes = repliedInquiries.map((item) => minutesBetween(item.createdAt, item.lastReplyAt || item.updatedAt)).filter((value) => value !== null);
    const avgResponseMins = responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : null;
    const closedInquiries = inquiries.filter((item) => ["won", "lost"].includes(item.status));
    const wonInquiries = inquiries.filter((item) => item.status === "won");
    const weeklyContent = [
      ...guides,
      ...cities,
      ...experiences
    ].filter((item) => isWithinDays(item.createdAt || item.publishedAt || item.updatedAt, 7)).length;
    const recentlyEdited = [
      ...guides.map((item) => ({ type: "guide", id: item.id, title: item.title || item.translations?.en?.title || "未命名攻略", meta: `${item.category || "攻略"} · ${item.status === "published" ? "已发布" : "草稿"}`, editor: item.updatedBy || "Migo", updatedAt: item.updatedAt || item.publishedAt || item.createdAt })),
      ...cities.map((item) => ({ type: "city", id: item.id, title: `${item.name || "未命名城市"} City Page`, meta: `${item.active === false ? "停用" : "已启用"} · ${item.showInNavigation === false ? "导航隐藏" : "导航显示"}`, editor: item.updatedBy || "Migo", updatedAt: item.updatedAt })),
      ...experiences.map((item) => ({ type: "experience", id: item.id, title: item.title || "未命名行程", meta: `${item.type === "short_experience" ? "短体验" : "推荐行程"} · ${item.published === false ? "草稿" : "已发布"}`, editor: item.updatedBy || "Migo", updatedAt: item.updatedAt || item.createdAt }))
    ].filter((item) => item.updatedAt).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6);
    const recentActivities = [
      ...inquiries.map((item) => ({ type: "inquiry", icon: "📩", actor: "系统", label: `收到新咨询：${item.name || "未命名客户"}`, at: item.createdAt, target: item.id })),
      ...media.map((item) => ({ type: "media", icon: "🖼", actor: item.createdBy || "Migo", label: `上传了素材：${item.filename || item.alt || "图片"}`, at: item.createdAt, target: item.id })),
      ...recentlyEdited.map((item) => ({ type: item.type, icon: item.type === "guide" ? "📝" : item.type === "city" ? "🏙" : "🧳", actor: item.editor || "Migo", label: `${item.editor || "Migo"} 更新了 ${item.title}`, at: item.updatedAt, target: item.id }))
    ].filter((item) => item.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8);
    const todos = [
      { type: "inquiries", priority: "urgent", action: "立即处理", due: "需要今天跟进", label: `${countWhere(inquiries, (item) => unhandledStatuses.has(item.status || "new"))} 个咨询待回复`, count: countWhere(inquiries, (item) => unhandledStatuses.has(item.status || "new")) },
      { type: "guides", priority: "normal", action: "去补全", due: "影响多语言发布", label: `${guideNeedsCn} 篇攻略缺少中文版`, count: guideNeedsCn },
      { type: "guides", priority: "normal", action: "去上传", due: "影响前台视觉", label: `${guideMissingCover} 篇攻略缺少封面`, count: guideMissingCover },
      { type: "cities", priority: "normal", action: "去完善", due: "影响城市页展示", label: `${cityMissingVisual} 个城市缺少视觉图片`, count: cityMissingVisual },
      { type: "experiences", priority: "low", action: "去检查", due: "发布前确认", label: `${unpublishedExperiences} 个行程未发布`, count: unpublishedExperiences },
      { type: "media", priority: "low", action: "去整理", due: "素材库建议维护", label: `${unusedMedia} 张图片未使用`, count: unusedMedia }
    ].filter((item) => item.count > 0);
    const healthItems = [
      { type: "guides", priority: "normal", action: "去补全", label: `${guideNeedsCn} 篇攻略缺少中文版`, count: guideNeedsCn },
      { type: "guides", priority: "normal", action: "去上传", label: `${guideMissingCover} 篇攻略缺少封面`, count: guideMissingCover },
      { type: "guides", priority: "low", action: "去补 SEO", label: `${guideMissingSeo} 篇攻略缺少 SEO 描述`, count: guideMissingSeo },
      { type: "guides", priority: "low", action: "去加标签", label: `${guideMissingTags} 篇攻略缺少标签`, count: guideMissingTags },
      { type: "guides", priority: "normal", action: "去关联", label: `${guideMissingPlacement} 篇攻略未关联城市或分类`, count: guideMissingPlacement },
      { type: "cities", priority: "normal", action: "去完善", label: `${cityMissingVisual} 个城市缺少横幅图或卡片图`, count: cityMissingVisual },
      { type: "experiences", priority: "low", action: "去补图", label: `${countWhere(experiences, (experience) => !experience.coverImage)} 个行程缺少封面`, count: countWhere(experiences, (experience) => !experience.coverImage) },
      { type: "media", priority: "low", action: "去分类", label: `${uncategorizedMedia} 张图片建议重新分类`, count: uncategorizedMedia }
    ].filter((item) => item.count > 0);
    const dailyFocus = [
      { type: "inquiries", done: false, label: `回复 ${countWhere(inquiries, (item) => unhandledStatuses.has(item.status || "new"))} 个客户`, count: countWhere(inquiries, (item) => unhandledStatuses.has(item.status || "new")) },
      { type: "guides", done: guideMissingCover === 0, label: `上传 ${guideMissingCover} 张攻略封面`, count: guideMissingCover },
      { type: "guides", done: guideNeedsCn === 0, label: `完善 ${guideNeedsCn} 篇中文攻略`, count: guideNeedsCn },
      { type: "cities", done: cityMissingVisual === 0, label: `补齐 ${cityMissingVisual} 个城市视觉`, count: cityMissingVisual }
    ].filter((item) => item.count > 0).slice(0, 4);
    const aiSuggestions = [
      guideNeedsCn ? { type: "guides", label: "优先补齐中文攻略", detail: `${guideNeedsCn} 篇攻略缺少中文内容，会影响中文用户信任感。`, action: "去补中文" } : null,
      cityMissingVisual ? { type: "cities", label: "城市页需要真实图片", detail: `${cityMissingVisual} 个城市缺少横幅或卡片图，建议先补上海、北京、深圳。`, action: "去完善城市" } : null,
      countWhere(inquiries, (item) => /luxury/i.test([item.preferredStayLevel, ...(item.tags || []), ...(item.tripStyle || [])].join(" "))) ? { type: "inquiries", label: "Luxury 客户值得优先跟进", detail: "Luxury 倾向咨询已经出现，建议使用高端酒店和私享路线话术。", action: "查看客户" } : null,
      unusedMedia ? { type: "media", label: "整理未使用素材", detail: `${unusedMedia} 张图片未被页面引用，可分类后用于攻略或城市页。`, action: "去整理素材" } : null
    ].filter(Boolean).slice(0, 4);
    const systemStatus = [
      { label: "网站在线", status: "ok", detail: "前台页面可访问" },
      { label: "咨询表单", status: "ok", detail: "数据已进入 CRM" },
      { label: "WhatsApp 跟进", status: "manual", detail: "模板复制后手动发送" },
      { label: "多语言同步", status: guideNeedsCn ? "warning" : "ok", detail: guideNeedsCn ? `${guideNeedsCn} 篇中文待补` : "中文内容完整" }
    ];
    json(res, 200, {
      ok: true,
      counts: {
        guides: guides.length,
        cities: cities.length,
        experiences: experiences.length,
        inquiries: inquiries.length,
        media: media.length
      },
      summaries: {
        guides: {
          published: countWhere(guides, (guide) => guide.status === "published"),
          draft: guideDrafts,
          needsWork: guideMissingCover + guideNeedsCn + guideMissingSeo + guideMissingTags + guideMissingPlacement,
          trend: `↑ +${countWhere(guides, (guide) => isWithinDays(guide.createdAt || guide.publishedAt, 7))} 本周新增`
        },
        cities: {
          active: countWhere(cities, (city) => city.active !== false),
          navigation: countWhere(cities, (city) => city.showInNavigation !== false),
          needsWork: cityMissingVisual,
          trend: cityMissingVisual ? `↓ ${cityMissingVisual} 待完善` : "✓ 状态稳定"
        },
        experiences: {
          published: countWhere(experiences, (experience) => experience.published !== false),
          draft: unpublishedExperiences,
          needsWork: countWhere(experiences, (experience) => !experience.coverImage),
          trend: unpublishedExperiences ? `↓ ${unpublishedExperiences} 未发布` : "✓ 全部已发布"
        },
        inquiries: {
          unhandled: countWhere(inquiries, (item) => unhandledStatuses.has(item.status || "new")),
          active: countWhere(inquiries, (item) => activeStatuses.has(item.status)),
          confirmed: countWhere(inquiries, (item) => item.status === "confirmed" || item.status === "won"),
          lost: countWhere(inquiries, (item) => item.status === "lost"),
          trend: `↑ 今日新增 ${newInquiriesToday}`
        },
        media: {
          unused: unusedMedia,
          uncategorized: uncategorizedMedia,
          used: media.length - unusedMedia,
          trend: uncategorizedMedia ? `↓ ${uncategorizedMedia} 未分类` : "✓ 已分类"
        }
      },
      operatingStatus: [
        { label: "本周咨询回复率", value: repliedInquiriesWeek.length ? `${Math.round((repliedInquiries.length / repliedInquiriesWeek.length) * 100)}%` : "—" },
        { label: "平均回复时间", value: avgResponseMins === null ? "—" : avgResponseMins < 60 ? `${avgResponseMins} 分钟` : `${Math.round(avgResponseMins / 60)} 小时` },
        { label: "成交率", value: closedInquiries.length ? `${Math.round((wonInquiries.length / closedInquiries.length) * 100)}%` : "—" },
        { label: "本周新增内容", value: weeklyContent }
      ],
      dailyFocus,
      todoItems: todos,
      healthItems,
      aiSuggestions,
      systemStatus,
      latestInquiries: inquiries.slice(0, 5),
      recentlyEdited,
      recentActivities
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

  if (url.pathname === "/api/admin/templates") {
    if (req.method === "GET") {
      const templates = await readJson(files.templates, []);
      json(res, 200, { ok: true, data: templates.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)) });
    } else if (req.method === "POST") {
      const templates = await readJson(files.templates, []);
      const payload = await parsePayload(req);
      const index = templates.findIndex((template) => template.id === payload.id);
      const next = normalizeTemplate(payload, index >= 0 ? templates[index] : {});
      const updated = index >= 0 ? templates.map((template, i) => i === index ? next : template) : [next, ...templates];
      await writeJson(files.templates, updated.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)));
      json(res, 200, { ok: true, data: next });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.templates, (await readJson(files.templates, [])).filter((template) => template.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/guide-collections") {
    if (req.method === "GET") {
      const collections = await readJson(files.guideCollections, []);
      json(res, 200, { ok: true, data: collections.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)) });
    } else if (req.method === "POST") {
      const collections = await readJson(files.guideCollections, []);
      const payload = await parsePayload(req);
      const index = collections.findIndex((collection) => collection.id === payload.id);
      const next = normalizeGuideCollection(payload, index >= 0 ? collections[index] : {});
      const updated = index >= 0
        ? collections.map((collection, i) => i === index ? next : collection)
        : [...collections, next];
      await writeJson(files.guideCollections, updated.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)));
      json(res, 200, { ok: true, data: next });
    } else if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      await writeJson(files.guideCollections, (await readJson(files.guideCollections, [])).filter((collection) => collection.id !== id));
      json(res, 200, { ok: true });
    }
    return true;
  }

  if (url.pathname === "/api/admin/media" && req.method === "GET") {
    const [media, guides, cities, experiences] = await Promise.all([
      listUploadedMedia(),
      readJson(files.guides, []),
      readJson(files.cities, []),
      readJson(files.experiences, [])
    ]);
    const usage = findImageUsage(media, guides, cities, experiences);
    json(res, 200, {
      ok: true,
      data: media.map((item) => ({
        ...item,
        usage: usage.get(String(item.url || "").replace(/^\/+/, "")) || []
      }))
    });
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

  if (url.pathname.startsWith("/api/public/guides/") && req.method === "GET") {
    const slug = slugify(decodeURIComponent(url.pathname.replace("/api/public/guides/", "")), "guide");
    const guides = publicGuideList(await readJson(files.guides, []));
    const guide = guides.find((item) => item.slug === slug);
    if (!guide) {
      json(res, 404, { ok: false, error: "Guide not found or not published." }, { "Cache-Control": "no-store" });
      return;
    }
    json(res, 200, {
      ok: true,
      data: guide,
      related: (guide.relatedGuides || [])
        .map((relatedSlug) => guides.find((item) => item.slug === relatedSlug))
        .filter(Boolean)
        .slice(0, 6)
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/public/guide-collections" && req.method === "GET") {
    const [collections, guides] = await Promise.all([
      readJson(files.guideCollections, []),
      readJson(files.guides, [])
    ]);
    json(res, 200, {
      ok: true,
      data: publicGuideCollections(collections, guides)
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/public/guides" && req.method === "GET") {
    const category = safeString(url.searchParams.get("category") || "", 120).toLowerCase();
    const city = safeString(url.searchParams.get("city") || "", 120).toLowerCase();
    const tag = safeString(url.searchParams.get("tag") || "", 120).toLowerCase();
    const query = safeString(url.searchParams.get("q") || "", 240).toLowerCase();
    const featured = url.searchParams.get("featured");
    const guides = publicGuideList(await readJson(files.guides, []));
    json(res, 200, {
      ok: true,
      data: guides
        .filter((guide) => !category || String(guide.category || "").toLowerCase() === category)
        .filter((guide) => !city || String(guide.city || "").toLowerCase() === city)
        .filter((guide) => !tag || (guide.tags || []).some((item) => String(item).toLowerCase() === tag))
        .filter((guide) => featured !== "true" || guide.featured)
        .filter((guide) => {
          if (!query) return true;
          return [guide.title, guide.slug, guide.category, guide.city, guide.excerpt, ...(guide.tags || [])].join(" ").toLowerCase().includes(query);
        }),
      categories: [...guideCategoryOptions],
      cities: [...new Set(guides.map((guide) => guide.city).filter(Boolean))],
      tags: [...new Set(guides.flatMap((guide) => guide.tags || []).filter(Boolean))]
    }, { "Cache-Control": "no-store" });
    return;
  }

  if (url.pathname === "/api/public/cities" && req.method === "GET") {
    const cities = await readJson(files.cities, []);
    const includeNavigationHidden = url.searchParams.get("includeNavigationHidden") === "true";
    json(res, 200, {
      ok: true,
      data: cities
        .filter((city) => city.active)
        .filter((city) => includeNavigationHidden || city.showInNavigation !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
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
    const match = safeString(payload.dataUrl, 80_000_000).match(/^data:((?:image\/(?:png|jpe?g|webp|gif))|(?:audio\/(?:mpeg|mp3|wav|ogg|webm|m4a|mp4))|(?:video\/(?:mp4|webm|ogg|quicktime)));base64,(.+)$/i);
    if (!match) {
      json(res, 400, { ok: false, error: "Upload must be an image, gif, audio or video data URL." });
      return;
    }

    const ext = match[1].split("/")[1].replace("jpeg", "jpg").replace("mpeg", "mp3").replace("quicktime", "mov");
    const mediaType = match[1].split("/")[0];
    const baseName = slugify(String(payload.filename || `media-${Date.now()}`).replace(/\.[^.]+$/, ""), "media");
    const filename = `${Date.now()}-${baseName}.${ext}`;
    const outputPath = path.join(uploadDir, filename);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(match[2], "base64"));
    const media = {
      id: `media-${crypto.randomUUID()}`,
      url: `assets/uploads/${filename}`,
      alt: safeString(payload.alt || baseName, 220),
      folder: safeString(payload.folder || payload.category || "guides", 120),
      category: safeString(payload.category || payload.folder || "guides", 80),
      type: mediaType,
      mimeType: match[1],
      tags: Array.isArray(payload.tags)
        ? payload.tags.map((tag) => safeString(tag, 80)).filter(Boolean).slice(0, 20)
        : String(payload.tags || "").split(",").map((tag) => safeString(tag, 80)).filter(Boolean).slice(0, 20),
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
