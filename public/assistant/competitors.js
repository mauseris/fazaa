// ============================================================================
// المنافسون والموقع (Competitors & Location) — خريطة حقيقية (Leaflet +
// OpenStreetMap، مجانية بالكامل وبدون مفتاح) تُظهر موقعك والمنافسين الحقيقيين
// حولك (عند توفر بيانات حية عبر Google Places أو OpenStreetMap)، بالإضافة
// لقائمة مواقع تجارية متاحة قريبة. المستخدم يقدر يحدد موقعه الدقيق بالنقر على
// الخريطة أو سحب العلامة أو GPS الجهاز، ثم يعيد البحث من تلك النقطة بالضبط
// بدل الاكتفاء بمركز المدينة التقريبي.
// ============================================================================

// نسخة أمامية من إحداثيات المدن (مطابقة لـ server/places.js: CITY_COORDS) —
// لازمة لتمركز الخريطة فوراً قبل أي رد من السيرفر. تكرار متعمد لعشر قيم ثابتة
// صغيرة، بنفس منطق تكرار كائن CITIES نفسه كبيانات واجهة ثابتة في index.html.
const CITY_COORDS_FRONT = {
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

AiViews.competitors = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const sector = state.sector || null;
    const city = state.city || null;
    const { competitors, rentals, source, rentalsSource } = await AssistantAPI.matchCompetitors(sector, city, LANG, state.userLocation || null);
    const cityLabel = city ? (LANG === "ar" ? (CITIES[city]?.label || city) : (CITIES[city]?.label_en || city)) : (LANG === "ar" ? "غير محدد" : "not set");
    const isLive = source === "google" || source === "osm";
    const rentalsLive = rentalsSource === "google" || rentalsSource === "osm";
    container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2>
      <div class="ai-card"><div class="row-between"><span>${LANG === "ar" ? "موقعك" : "Your location"}</span><b>${cityLabel}</b></div></div>
      ${mapWidgetHtml()}
      <h3 style="margin-top:14px;">${LANG === "ar" ? "تفاصيل المنافسين" : "Competitor details"}</h3>
      ${competitors.length ? competitors.map((c) => competitorCardHtml(c, isLive)).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا يوجد منافسون مطابقون حالياً." : "No matching competitors yet."}</div>`}
      <h3 style="margin-top:14px;">${rentalsLive ? (LANG === "ar" ? "وكالات عقارية قريبة منك" : "Nearby real-estate agencies") : (LANG === "ar" ? "مواقع تجارية متاحة قريباً منك" : "Nearby commercial rentals")}</h3>
      ${rentals.map((r) => rentalCardHtml(r, rentalsLive)).join("")}
      ${sourceDisclaimerHtml(source, rentalsLive)}`;
    initCompetitorsMap({ city, competitors, rentals, isLive });
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

// نص التنويه أسفل القائمة يعكس مصدر البيانات الفعلي — ثلاث حالات تطابق سلسلة
// الرجوع التلقائي في server/assistantRoutes.js: google (الأغنى) → osm (مجاني
// لكن تغطية أقل) → mock (شبكة أمان أخيرة).
function sourceDisclaimerHtml(source, rentalsLive) {
  if (source === "google") {
    const rentalsNote = rentalsLive
      ? (LANG === "ar" ? " تواصل مع الوكالات العقارية المذكورة لمعرفة الأسعار الفعلية — Google لا يوفر بيانات إيجار." : " Contact the listed agencies for actual prices — Google doesn't provide rental pricing data.")
      : "";
    return `<div class="ai-disclaimer">🟢 ${LANG === "ar" ? "بيانات منافسين حقيقية عبر Google Maps." : "Real competitor data via Google Maps."}${rentalsNote}</div>`;
  }
  if (source === "osm") {
    const rentalsNote = rentalsLive
      ? (LANG === "ar" ? " تواصل مع الوكالات العقارية المذكورة لمعرفة الأسعار الفعلية." : " Contact the listed agencies for actual prices.")
      : "";
    return `<div class="ai-disclaimer">🟡 ${LANG === "ar" ? "بيانات منافسين حقيقية عبر OpenStreetMap (مصدر مجاني) — تغطية أقل من Google، بدون تقييمات أو أوقات عمل." : "Real competitor data via OpenStreetMap (free source) — less coverage than Google, no ratings or opening hours."}${rentalsNote}</div>`;
  }
  return `<div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "خريطة توضيحية وبيانات تجريبية — ليست بيانات خرائط أو عقارات حقيقية." : "Illustrative map and mock data — not real map or real-estate data."}</div>`;
}

// ---------------------------------------------------------------------------
// خريطة حقيقية (Leaflet + OpenStreetMap tiles) — تُحمَّل فقط عند فتح هذا العرض
// (lazy-load) حتى لا تبطّئ إقلاع التطبيق الرئيسي لميزة قد لا يفتحها كل مستخدم.
//
// ⚠️ تعارض أسماء حقيقي: هذا التطبيق يعرّف بالفعل دالة عامة باسم L(obj) في
// index.html (مساعد اختيار الترجمة: L(cityObj) → label أو label_en) — واستيراد
// سكربت Leaflet يكتب فوق window.L بالكامل تلقائياً، مما يكسر تلك الدالة بصمت
// بمجرد فتح المستخدم لهذا العرض مرة واحدة. الحل: L.noConflict() المدمج في
// Leaflet نفسه مصمم بالضبط لهذا السيناريو — يعيد window.L الأصلي فوراً بعد
// التحميل، ويُرجع كائن Leaflet الحقيقي لنخزّنه في LeafletLib بدلاً منه.
// ============================================================================
let LeafletLib = null;
let leafletLoadPromise = null;
function ensureLeaflet() {
  if (LeafletLib) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => {
      LeafletLib = window.L.noConflict(); // يعيد L الأصلي (مساعد الترجمة) لمكانه
      resolve();
    };
    script.onerror = () => { leafletLoadPromise = null; reject(new Error("Leaflet failed to load")); };
    document.head.appendChild(script);
  });
  return leafletLoadPromise;
}

function mapWidgetHtml() {
  return `<div class="ai-card" style="padding:0;overflow:hidden;">
    <div id="competitorsMap" style="width:100%;height:320px;background:var(--navy-800);"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 16px;">
      <span style="font-size:12.5px;color:var(--text-faint);flex:1;min-width:220px;">${LANG === "ar" ? "📍 انقر على الخريطة أو اسحب العلامة لتحديد موقعك الدقيق، ثم اضغط \"ابحث هنا\" لتحديث التوصيات." : "📍 Click the map or drag the pin to set your exact location, then press \"Search here\" to refresh recommendations."}</span>
      <button class="ai-btn" id="btnUseGps" type="button">${LANG === "ar" ? "📡 موقعي (GPS)" : "📡 My GPS"}</button>
      <button class="ai-btn primary" id="btnSearchHere" type="button" style="display:none;">${LANG === "ar" ? "🔍 ابحث هنا" : "🔍 Search here"}</button>
      ${state.userLocation ? `<button class="ai-btn" id="btnResetLocation" type="button">${LANG === "ar" ? "↺ مركز المدينة" : "↺ City center"}</button>` : ""}
    </div>
  </div>`;
}

function emojiIcon(emoji, size) {
  return LeafletLib.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

async function initCompetitorsMap({ city, competitors, rentals, isLive }) {
  try {
    await ensureLeaflet();
  } catch (e) {
    const mapEl = document.getElementById("competitorsMap");
    if (mapEl) mapEl.outerHTML = `<div class="ai-empty">${LANG === "ar" ? "تعذّر تحميل الخريطة." : "Could not load the map."}</div>`;
    return;
  }
  const mapEl = document.getElementById("competitorsMap");
  if (!mapEl) return; // المستخدم غادر هذا العرض قبل اكتمال تحميل Leaflet

  const base = CITY_COORDS_FRONT[city] || CITY_COORDS_FRONT.muscat;
  const center = state.userLocation || base;

  const map = LeafletLib.map(mapEl).setView([center.lat, center.lng], 13);
  LeafletLib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  let pending = { ...center };
  const youMarker = LeafletLib.marker([center.lat, center.lng], { icon: emojiIcon("⭐", 28), draggable: true })
    .addTo(map)
    .bindPopup(LANG === "ar" ? "موقعك — اسحب أو انقر على الخريطة لتغييره" : "Your location — drag or click the map to change it");

  const searchBtn = document.getElementById("btnSearchHere");
  const showSearchBtn = () => { if (searchBtn) searchBtn.style.display = "inline-block"; };

  youMarker.on("dragend", () => {
    const ll = youMarker.getLatLng();
    pending = { lat: ll.lat, lng: ll.lng };
    showSearchBtn();
  });
  map.on("click", (e) => {
    youMarker.setLatLng(e.latlng);
    pending = { lat: e.latlng.lat, lng: e.latlng.lng };
    showSearchBtn();
  });

  if (searchBtn) {
    searchBtn.onclick = () => {
      state.userLocation = pending;
      saveState();
      switchAiView("competitors");
    };
  }
  const resetBtn = document.getElementById("btnResetLocation");
  if (resetBtn) {
    resetBtn.onclick = () => {
      state.userLocation = null;
      saveState();
      switchAiView("competitors");
    };
  }
  const gpsBtn = document.getElementById("btnUseGps");
  if (gpsBtn) {
    gpsBtn.onclick = () => {
      if (!navigator.geolocation) {
        alert(LANG === "ar" ? "المتصفح لا يدعم تحديد الموقع." : "Your browser doesn't support geolocation.");
        return;
      }
      gpsBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          saveState();
          switchAiView("competitors");
        },
        () => {
          gpsBtn.disabled = false;
          alert(LANG === "ar" ? "تعذّر الحصول على موقعك. تأكد من السماح بالوصول للموقع." : "Couldn't get your location. Make sure location access is allowed.");
        },
        { timeout: 10000 }
      );
    };
  }

  // نُضيف علامات حقيقية للمنافسين/العقارات فقط عند بيانات حية (لها إحداثيات
  // فعلية) — لا نخترع مواقع لمقاطع الكتالوج التجريبي.
  if (isLive) {
    competitors.forEach((c) => {
      if (typeof c.lat !== "number" || typeof c.lng !== "number") return;
      LeafletLib.marker([c.lat, c.lng], { icon: emojiIcon("🔴", 22) })
        .addTo(map)
        .bindPopup(`<b>${escapeHtml(c.name)}</b>${c.rating ? `<br>⭐ ${c.rating}/5` : ""}<br><a href="${c.mapsUrl}" target="_blank" rel="noopener">${LANG === "ar" ? "خرائط جوجل ↗" : "Google Maps ↗"}</a>`);
    });
    rentals.forEach((r) => {
      if (typeof r.lat !== "number" || typeof r.lng !== "number") return;
      LeafletLib.marker([r.lat, r.lng], { icon: emojiIcon("🏢", 22) })
        .addTo(map)
        .bindPopup(`<b>${escapeHtml(r.name)}</b><br><a href="${r.mapsUrl}" target="_blank" rel="noopener">${LANG === "ar" ? "خرائط جوجل ↗" : "Google Maps ↗"}</a>`);
    });
  }
}

function competitorCardHtml(c, isLive) {
  if (isLive) {
    const priceLabel = { budget: LANG === "ar" ? "اقتصادي" : "Budget", mid: LANG === "ar" ? "متوسط" : "Mid-range", premium: LANG === "ar" ? "فاخر" : "Premium", luxury: LANG === "ar" ? "فاخر جداً" : "Luxury" }[c.priceRange] || null;
    const openLabel = c.openNow === true ? (LANG === "ar" ? "🟢 مفتوح الآن" : "🟢 Open now") : c.openNow === false ? (LANG === "ar" ? "🔴 مغلق الآن" : "🔴 Closed now") : "";
    return `<div class="ai-match-card">
      <div class="title">${escapeHtml(c.name)} <span style="font-weight:400;font-size:13px;color:var(--text-faint);">${c.neighborhood ? `— ${escapeHtml(c.neighborhood)} ` : ""}(${c.distanceKm}km)</span></div>
      <div style="font-size:14px;color:var(--text-faint);margin:4px 0;">
        ${priceLabel ? `${LANG === "ar" ? "السعر" : "Price"}: <b>${priceLabel}</b> &nbsp;|&nbsp; ` : ""}${c.rating ? `${LANG === "ar" ? "التقييم" : "Rating"}: <b>${c.rating}/5</b> (${c.reviews || 0}) &nbsp;|&nbsp; ` : ""}${openLabel}
      </div>
      ${c.phone ? `<div style="font-size:13px;color:var(--text-dim);">📞 ${escapeHtml(c.phone)}</div>` : ""}
      <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
        ${c.website ? `<a class="ai-btn" href="https://${c.website.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${LANG === "ar" ? "الموقع ↗" : "Website ↗"}</a>` : ""}
        <a class="ai-btn" href="${c.mapsUrl}" target="_blank" rel="noopener">${LANG === "ar" ? "📍 خرائط جوجل ↗" : "📍 Google Maps ↗"}</a>
      </div>
    </div>`;
  }
  const priceLabel = { budget: LANG === "ar" ? "اقتصادي" : "Budget", mid: LANG === "ar" ? "متوسط" : "Mid-range", premium: LANG === "ar" ? "فاخر" : "Premium", luxury: LANG === "ar" ? "فاخر جداً" : "Luxury" }[c.priceRange] || c.priceRange;
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(c.name)} <span style="font-weight:400;font-size:13px;color:var(--text-faint);">— ${escapeHtml(c.neighborhood)} (${c.distanceKm}km)</span></div>
    <div style="font-size:14px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "السعر" : "Price"}: <b>${priceLabel}</b> &nbsp;|&nbsp; ${LANG === "ar" ? "التقييم" : "Rating"}: <b>${c.rating}/5</b> (${c.reviews}) &nbsp;|&nbsp;
      ${c.social} (${c.followers})
    </div>
    <div style="font-size:14px;color:var(--good);margin-bottom:2px;">✅ ${escapeHtml(c.strengths)}</div>
    <div style="font-size:14px;color:var(--warn);">⚠️ ${escapeHtml(c.weakness)}</div>
    ${c.website ? `<a class="ai-btn" style="margin-top:6px;" href="https://${c.website.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${LANG === "ar" ? "الموقع ↗" : "Website ↗"}</a>` : ""}
  </div>`;
}

function rentalCardHtml(r, isLive) {
  if (isLive) {
    return `<div class="ai-match-card">
      <div class="title">🏢 ${escapeHtml(r.name)} <span style="font-weight:400;font-size:13px;color:var(--text-faint);">(${r.distanceKm}km)</span></div>
      ${r.address ? `<div style="font-size:14px;color:var(--text-faint);margin:4px 0;">📍 ${escapeHtml(r.address)}</div>` : ""}
      ${r.rating ? `<div style="font-size:13px;color:var(--text-dim);">${LANG === "ar" ? "التقييم" : "Rating"}: <b>${r.rating}/5</b> (${r.reviews || 0})</div>` : ""}
      ${r.phone ? `<div style="font-size:13px;color:var(--text-dim);">📞 ${escapeHtml(r.phone)}</div>` : ""}
      <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">
        ${r.website ? `<a class="ai-btn" href="https://${r.website.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${LANG === "ar" ? "الموقع ↗" : "Website ↗"}</a>` : ""}
        <a class="ai-btn" href="${r.mapsUrl}" target="_blank" rel="noopener">${LANG === "ar" ? "📍 خرائط جوجل ↗" : "📍 Google Maps ↗"}</a>
      </div>
    </div>`;
  }
  const omr = LANG === "ar" ? "ر.ع/شهر" : "OMR/month";
  return `<div class="ai-match-card">
    <div class="title">💰 ${escapeHtml(r.name)}</div>
    <div style="font-size:14px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "المساحة" : "Size"}: <b>${r.sizeSqm} m²</b> &nbsp;|&nbsp; ${LANG === "ar" ? "الإيجار" : "Rent"}: <b>${r.rent} ${omr}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "المسافة" : "Distance"}: <b>${r.distanceM}m</b>
    </div>
    <div style="font-size:14px;color:var(--text-dim);">${LANG === "ar" ? "مناسب لـ" : "Suitable for"}: ${(r.suitableFor || []).join(" · ")}</div>
    <div style="font-size:12.5px;color:var(--text-faint);margin-top:6px;">${escapeHtml(r.contact)} — ${escapeHtml(r.source)}</div>
  </div>`;
}
