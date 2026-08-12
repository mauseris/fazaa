// ============================================================================
// المنافسون والموقع (Competitors & Location) — خريطة توضيحية بسيطة (CSS، ليست
// خريطة جغرافية حقيقية) تُظهر مشروعك في المنتصف والمنافسين حولك حسب المسافة
// التقريبية، بالإضافة لقائمة مواقع تجارية متاحة قريبة. كل البيانات تجريبية.
// ============================================================================

AiViews.competitors = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const sector = state.sector || null;
    const city = state.city || null;
    const { competitors, rentals } = await AssistantAPI.matchCompetitors(sector, city, LANG);
    const cityLabel = city ? (LANG === "ar" ? (CITIES[city]?.label || city) : (CITIES[city]?.label_en || city)) : (LANG === "ar" ? "غير محدد" : "not set");
    container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2>
      <div class="ai-card"><div class="row-between"><span>${LANG === "ar" ? "موقعك" : "Your location"}</span><b>${cityLabel}</b></div></div>
      ${competitors.length ? mockMapHtml(competitors) : `<div class="ai-empty">${LANG === "ar" ? "لا يوجد منافسون مطابقون حالياً." : "No matching competitors yet."}</div>`}
      <h3 style="margin-top:14px;">${LANG === "ar" ? "تفاصيل المنافسين" : "Competitor details"}</h3>
      ${competitors.map(competitorCardHtml).join("")}
      <h3 style="margin-top:14px;">${LANG === "ar" ? "مواقع تجارية متاحة قريباً منك" : "Nearby commercial rentals"}</h3>
      ${rentals.map(rentalCardHtml).join("")}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "خريطة توضيحية وبيانات تجريبية — ليست بيانات خرائط أو عقارات حقيقية." : "Illustrative map and mock data — not real map or real-estate data."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📍 ${ta("navCompetitors")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function mockMapHtml(competitors) {
  const maxD = Math.max(...competitors.map((c) => c.distanceKm || 1), 1);
  const angleStep = 360 / Math.max(competitors.length, 1);
  const pins = competitors.map((c, i) => {
    const angle = (angleStep * i - 90) * (Math.PI / 180);
    const radiusPct = 18 + (Math.min(c.distanceKm || 0, maxD) / maxD) * 32;
    const left = 50 + radiusPct * Math.cos(angle);
    const top = 50 + radiusPct * Math.sin(angle);
    return `<div title="${escapeHtml(c.name)} — ${c.distanceKm}km" style="position:absolute;left:${left}%;top:${top}%;transform:translate(-50%,-50%);font-size:20px;">🔴<div style="font-size:9px;color:var(--text-dim);white-space:nowrap;text-align:center;">${escapeHtml(c.name)}</div></div>`;
  }).join("");
  return `<div style="position:relative;width:100%;aspect-ratio:16/9;background:var(--navy-800);border:1px solid var(--line);border-radius:12px;margin:10px 0;overflow:hidden;">
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:26px;">⭐<div style="font-size:9px;color:var(--text-dim);text-align:center;">${LANG === "ar" ? "مشروعك" : "You"}</div></div>
    ${pins}
  </div>`;
}

function competitorCardHtml(c) {
  const priceLabel = { budget: LANG === "ar" ? "اقتصادي" : "Budget", mid: LANG === "ar" ? "متوسط" : "Mid-range", premium: LANG === "ar" ? "فاخر" : "Premium", luxury: LANG === "ar" ? "فاخر جداً" : "Luxury" }[c.priceRange] || c.priceRange;
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(c.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${escapeHtml(c.neighborhood)} (${c.distanceKm}km)</span></div>
    <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "السعر" : "Price"}: <b>${priceLabel}</b> &nbsp;|&nbsp; ${LANG === "ar" ? "التقييم" : "Rating"}: <b>${c.rating}/5</b> (${c.reviews}) &nbsp;|&nbsp;
      ${c.social} (${c.followers})
    </div>
    <div style="font-size:12px;color:var(--good);margin-bottom:2px;">✅ ${escapeHtml(c.strengths)}</div>
    <div style="font-size:12px;color:var(--warn);">⚠️ ${escapeHtml(c.weakness)}</div>
    ${c.website ? `<a class="ai-btn" style="margin-top:6px;" href="https://${c.website.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${LANG === "ar" ? "الموقع ↗" : "Website ↗"}</a>` : ""}
  </div>`;
}

function rentalCardHtml(r) {
  const omr = LANG === "ar" ? "ر.ع/شهر" : "OMR/month";
  return `<div class="ai-match-card">
    <div class="title">💰 ${escapeHtml(r.name)}</div>
    <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "المساحة" : "Size"}: <b>${r.sizeSqm} m²</b> &nbsp;|&nbsp; ${LANG === "ar" ? "الإيجار" : "Rent"}: <b>${r.rent} ${omr}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "المسافة" : "Distance"}: <b>${r.distanceM}m</b>
    </div>
    <div style="font-size:12px;color:var(--text-dim);">${LANG === "ar" ? "مناسب لـ" : "Suitable for"}: ${(r.suitableFor || []).join(" · ")}</div>
    <div style="font-size:11px;color:var(--text-faint);margin-top:6px;">${escapeHtml(r.contact)} — ${escapeHtml(r.source)}</div>
  </div>`;
}
