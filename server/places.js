// ============================================================================
// تكامل حقيقي مع Google Places API لميزة "المنافسون والموقع" — اختياري بالكامل:
// يعمل فقط عند ضبط GOOGLE_MAPS_API_KEY في server/.env، وإلا يرجّع null فيستخدم
// المتصل (server/assistantRoutes.js) الكتالوج التجريبي المحلي (assistantData.js)
// تلقائياً، تماماً كآلية الرجوع التلقائي المستخدمة لمزوّد المحادثة في server.js.
//
// ملاحظة دقة مهمة: لا نُخترع بيانات لأماكن حقيقية. Google Places لا يوفر بيانات
// عقارية (أسعار إيجار/مساحات) ولا تحليل "نقاط قوة/ضعف" تسويقي — لذلك بدل تلفيق
// أرقام كما تفعل بعض القوالب الجاهزة، نعرض فقط ما هو حقيقي وموثّق من جوجل
// (الاسم، التقييم، الهاتف، الموقع، المسافة)، ولوكالات العقارات القريبة بدل عروض
// إيجار مُختلقة يتواصل معها المستخدم فعلياً ليعرف الأسعار الحقيقية.
// ============================================================================

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

// مراكز تقريبية للولايات المدعومة في CITIES (public/index.html) — دقة كافية
// لعرض "منافسين قريبين" ضمن نطاق المدينة، وليست إحداثيات مساحية دقيقة.
const CITY_COORDS = {
  muscat: { lat: 23.5880, lng: 58.3829 },
  sohar: { lat: 24.3399, lng: 56.7076 },
  nizwa: { lat: 22.9333, lng: 57.5333 },
  sur: { lat: 22.5667, lng: 59.5289 },
  salalah: { lat: 17.0151, lng: 54.0924 },
  ibri: { lat: 23.2238, lng: 56.5136 },
  soham: { lat: 24.1685, lng: 56.8845 },
  rustaq: { lat: 23.3909, lng: 57.4249 },
  buraimi: { lat: 24.2505, lng: 55.7929 },
  duqm: { lat: 19.6583, lng: 57.7000 },
};

// كلمات بحث Google Places لكل قطاع مدعوم في SECTORS (public/index.html).
// "ecommerce" مستثناة عمداً: لا يوجد مفهوم فعلي لـ"منافس قريب جغرافياً" لمتجر
// إلكتروني بحت، فتُترك دائماً للكتالوج التجريبي بدل بحث لا معنى له.
const SECTOR_KEYWORDS = {
  tech: "electronics store",
  retail: "clothing store",
  food: "restaurant",
  services: "consulting services",
  manufact: "factory",
  agro: "farm supply store",
  education: "training center",
  beauty: "beauty salon",
  health: "medical clinic",
  logistics: "courier service",
};

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function priceRangeFromLevel(level) {
  if (level === 0 || level === 1) return "budget";
  if (level === 2) return "mid";
  if (level === 3) return "premium";
  if (level === 4) return "luxury";
  return null;
}

// مهلة جانب العميل لكل نداء — ضمان عدم تعليق الميزة لو تعثّر Google Places
// شبكياً؛ عند التعثر ننتقل بسرعة لمستوى OpenStreetMap ثم الكتالوج التجريبي.
const REQUEST_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`Google Places timed out after ${REQUEST_TIMEOUT_MS}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function nearbySearch(apiKey, location, params) {
  const url = new URL(`${PLACES_BASE}/nearbysearch/json`);
  url.searchParams.set("location", `${location.lat},${location.lng}`);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const upstream = await fetchWithTimeout(url.toString());
  const data = await upstream.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Google Places error: ${data.status}`);
  }
  return data.results || [];
}

async function placeDetails(apiKey, placeId, fields) {
  const url = new URL(`${PLACES_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("fields", fields.join(","));
  const upstream = await fetchWithTimeout(url.toString());
  const data = await upstream.json();
  return data.status === "OK" ? data.result : {};
}

// يجلب بيانات الاتصال (هاتف/موقع) لأول عدد محدود من النتائج فقط لضبط التكلفة —
// حقول Contact Data أغلى من Basic Data في تسعير Places API.
async function enrichTop(apiKey, results, limit = 5) {
  await Promise.all(results.slice(0, limit).map(async (place) => {
    try {
      const details = await placeDetails(apiKey, place.place_id, ["formatted_phone_number", "website"]);
      place.formatted_phone_number = details.formatted_phone_number || null;
      place.website = details.website || null;
    } catch (e) { /* فشل جلب التفاصيل — الاسم والموقع الأساسي يكفيان، نتجاهل */ }
  }));
  return results;
}

function withDistance(results, center) {
  return results
    .filter((p) => p.geometry && p.geometry.location)
    .map((p) => ({ ...p, _distanceKm: haversineKm(center, p.geometry.location) }))
    .sort((a, b) => a._distanceKm - b._distanceKm);
}

/**
 * يبحث عن منافسين حقيقيين قريبين حسب القطاع والمدينة. يرجّع null إن لم يكن
 * القطاع مدعوماً بمعنى جغرافي (مثال: ecommerce) بدل بحث Places لا فائدة منه —
 * المتصل يستخدم الكتالوج التجريبي حينها. centerOverride اختياري: إحداثيات
 * دقيقة اختارها المستخدم فعلياً على الخريطة (public/assistant/competitors.js)
 * بدل مركز المدينة التقريبي الافتراضي.
 */
async function searchCompetitors(apiKey, sector, city, lang, centerOverride) {
  const keyword = SECTOR_KEYWORDS[sector];
  if (!keyword) return null;
  const center = centerOverride || CITY_COORDS[city] || CITY_COORDS.muscat;

  const raw = await nearbySearch(apiKey, center, {
    radius: 5000,
    keyword,
    language: lang === "ar" ? "ar" : "en",
  });
  const sorted = withDistance(raw, center).slice(0, 12);
  await enrichTop(apiKey, sorted, 5);

  return sorted.map((p) => ({
    id: p.place_id,
    name: p.name,
    neighborhood: p.vicinity || null,
    distanceKm: Math.round(p._distanceKm * 10) / 10,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    priceRange: priceRangeFromLevel(p.price_level),
    rating: p.rating ?? null,
    reviews: p.user_ratings_total ?? null,
    website: p.website || null,
    phone: p.formatted_phone_number || null,
    openNow: p.opening_hours ? Boolean(p.opening_hours.open_now) : null,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
  }));
}

/** يبحث عن وكالات عقارية حقيقية قريبة (بديل صادق عن تلفيق عروض إيجار). */
async function searchNearbyAgencies(apiKey, city, lang, centerOverride) {
  const center = centerOverride || CITY_COORDS[city] || CITY_COORDS.muscat;

  const raw = await nearbySearch(apiKey, center, {
    radius: 5000,
    type: "real_estate_agency",
    language: lang === "ar" ? "ar" : "en",
  });
  const sorted = withDistance(raw, center).slice(0, 8);
  await enrichTop(apiKey, sorted, 5);

  return sorted.map((p) => ({
    id: p.place_id,
    name: p.name,
    address: p.vicinity || null,
    distanceKm: Math.round(p._distanceKm * 10) / 10,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    rating: p.rating ?? null,
    reviews: p.user_ratings_total ?? null,
    website: p.website || null,
    phone: p.formatted_phone_number || null,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
  }));
}

module.exports = { searchCompetitors, searchNearbyAgencies, CITY_COORDS, SECTOR_KEYWORDS, haversineKm };
