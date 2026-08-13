// ============================================================================
// تكامل حقيقي ومجاني بالكامل مع OpenStreetMap (Overpass API) لميزة "المنافسون
// والموقع" — مستوى وسيط في سلسلة الرجوع التلقائي: Google Places (إن وُجد مفتاح)
// ← OpenStreetMap (بدون مفتاح، هنا) ← الكتالوج التجريبي المحلي (assistantData.js).
// لا يحتاج مفتاحاً ولا فوترة، لكن تغطيته للأعمال العُمانية أقل كثافة من Google،
// ولا يوفر تقييمات أو أوقات عمل أو مستوى سعري — فقط ما هو موسوم فعلياً في
// OpenStreetMap (الاسم، الهاتف، الموقع الإلكتروني إن وُجدا). خادم Overpass العام
// مُعدّل الاستخدام (rate-limited) — مناسب لحركة نموذج أولي، وليس إنتاجاً بحجم كبير.
// ============================================================================

const { CITY_COORDS, haversineKm } = require("./places");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
// Overpass تطلب صراحة User-Agent مُعرِّف لأي استخدام آلي (سياسة الاستخدام العادل).
const USER_AGENT = "FazaaOmanEntrepreneurAssistant/1.0 (prototype; educational project)";

// وسوم OpenStreetMap المقابلة لكل قطاع مدعوم في SECTORS (public/index.html) —
// مختلفة بنيوياً عن كلمات بحث Google الحرة (server/places.js: SECTOR_KEYWORDS)
// لأن OSM يعتمد وسوم key=value منظّمة بدل نص حر. "ecommerce" مستثناة لنفس سبب
// استثنائها في places.js: لا معنى جغرافي لـ"منافس قريب" لمتجر إلكتروني بحت.
const SECTOR_OSM_TAGS = {
  tech: [["shop", "electronics"], ["shop", "computer"]],
  retail: [["shop", "clothes"], ["shop", "boutique"]],
  food: [["amenity", "restaurant"], ["amenity", "cafe"]],
  services: [["office", "consulting"], ["office", "company"]],
  manufact: [["man_made", "works"], ["craft", null]],
  agro: [["shop", "agrarian"]],
  education: [["office", "educational_institution"], ["amenity", "driving_school"]],
  beauty: [["shop", "beauty"], ["shop", "hairdresser"]],
  health: [["amenity", "clinic"], ["healthcare", "clinic"]],
  logistics: [["office", "courier"]],
};
const REAL_ESTATE_TAG = [["office", "estate_agent"]];

function tagFilter([key, value]) {
  return value ? `["${key}"="${value}"]` : `["${key}"]`;
}

// [timeout:8] هنا هو المهلة التي نطلبها من خادم Overpass نفسه لتنفيذ الاستعلام
// (منخفضة عمداً)، منفصلة عن REQUEST_TIMEOUT_MS أدناه وهو مهلتنا نحن كعميل —
// كلاهما مطلوب: خادم Overpass العام قد يبقى بطيئاً في الرد بخطأ حتى بعد رفض
// تنفيذ الاستعلام، فمهلة العميل هي الضمان الفعلي لعدم تعليق واجهة المستخدم.
function buildQuery(tagPairs, lat, lng, radiusM) {
  const clauses = tagPairs
    .map((pair) => `  node${tagFilter(pair)}(around:${radiusM},${lat},${lng});`)
    .join("\n");
  return `[out:json][timeout:8];\n(\n${clauses}\n);\nout body;`;
}

// مهلة جانب العميل — لوحظ فعلياً أن خادم Overpass العام قد يستغرق حتى 25+
// ثانية قبل إرجاع خطأ 504 وقت الازدحام؛ بدون هذه المهلة، ينتظر المستخدم طويلاً
// قبل ظهور بيانات الكتالوج التجريبي البديلة. 8 ثوانٍ توازن بين إعطاء الاستعلام
// فرصة حقيقية للنجاح والانتقال السريع للمستوى التالي عند التعثر.
const REQUEST_TIMEOUT_MS = 8000;

async function runOverpassQuery(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain", "User-Agent": USER_AGENT },
      body: query,
      signal: controller.signal,
    });
    if (!upstream.ok) throw new Error(`Overpass API error: HTTP ${upstream.status}`);
    const data = await upstream.json();
    return data.elements || [];
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`Overpass API timed out after ${REQUEST_TIMEOUT_MS}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function elementToEntry(el, center) {
  const tags = el.tags || {};
  const loc = { lat: el.lat, lng: el.lon };
  const neighborhood = tags["addr:suburb"] || tags["addr:district"] || tags["addr:city"] || null;
  return {
    id: `osm-${el.type}-${el.id}`,
    name: tags.name,
    neighborhood,
    distanceKm: Math.round(haversineKm(center, loc) * 10) / 10,
    lat: loc.lat,
    lng: loc.lng,
    priceRange: null,
    rating: null,
    reviews: null,
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    openNow: null,
    mapsUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

/**
 * يبحث عن منافسين حقيقيين قريبين عبر OpenStreetMap. يرجّع null إن لم يكن
 * القطاع مدعوماً بمعنى جغرافي (مثال: ecommerce) — المتصل يكمل لبقية سلسلة
 * الرجوع التلقائي حينها (مثل places.js تماماً). centerOverride اختياري:
 * إحداثيات دقيقة اختارها المستخدم على الخريطة بدل مركز المدينة الافتراضي.
 */
async function searchCompetitors(sector, city, lang, centerOverride) {
  const tagPairs = SECTOR_OSM_TAGS[sector];
  if (!tagPairs) return null;
  const center = centerOverride || CITY_COORDS[city] || CITY_COORDS.muscat;

  const elements = await runOverpassQuery(buildQuery(tagPairs, center.lat, center.lng, 5000));
  return elements
    .filter((el) => el.tags && el.tags.name)
    .map((el) => elementToEntry(el, center))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 12);
}

/** يبحث عن وكالات عقارية حقيقية قريبة عبر OpenStreetMap (office=estate_agent). */
async function searchNearbyAgencies(city, lang, centerOverride) {
  const center = centerOverride || CITY_COORDS[city] || CITY_COORDS.muscat;
  const elements = await runOverpassQuery(buildQuery(REAL_ESTATE_TAG, center.lat, center.lng, 5000));
  return elements
    .filter((el) => el.tags && el.tags.name)
    .map((el) => {
      const entry = elementToEntry(el, center);
      return { ...entry, address: entry.neighborhood };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);
}

module.exports = { searchCompetitors, searchNearbyAgencies };
