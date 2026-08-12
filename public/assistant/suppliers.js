// ============================================================================
// الموردون (Suppliers & Products) — فئات منتجات وقائمة موردين مطابقة لقطاع
// مشروعك، من كتالوج تجريبي حتمي على السيرفر (لا يستدعي نموذجاً لغوياً).
// ============================================================================

AiViews.suppliers = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">🏪 ${ta("navSuppliers")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const sector = state.sector || null;
    const [{ categories }, { suppliers }] = await Promise.all([
      AssistantAPI.getProductCategories(sector),
      AssistantAPI.matchSuppliers(sector, LANG),
    ]);
    container.innerHTML = `<h2 class="ai-view-title">🏪 ${ta("navSuppliers")}</h2>
      <div class="ai-card">
        <h3>${LANG === "ar" ? "فئات المنتجات المقترحة" : "Suggested product categories"}</h3>
        <div class="ai-row" style="flex-wrap:wrap;">${categories.map((c) => `<span class="ai-level-tag recommended" style="margin:2px;">${LANG === "ar" ? c.ar : c.en}</span>`).join("")}</div>
      </div>
      <h3 style="margin-top:14px;">${LANG === "ar" ? "قائمة الموردين" : "Supplier list"}</h3>
      ${suppliers.map(supplierCardHtml).join("")}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات موردين تجريبية للعرض فقط." : "Mock supplier data for demo purposes only."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">🏪 ${ta("navSuppliers")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function supplierCardHtml(s) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(s.name)}</div>
    <div class="why">${(s.products || []).join(" · ")}</div>
    <div style="font-size:14px;color:var(--text-faint);margin:6px 0;">
      ${LANG === "ar" ? "سعر الجملة" : "Wholesale price"}: <b>${s.priceMin}-${s.priceMax} ${omr}</b> &nbsp;|&nbsp;
      MOQ: <b>${s.moq}</b> &nbsp;|&nbsp; ${LANG === "ar" ? "مدة التوصيل" : "Delivery"}: <b>${s.deliveryDays} ${LANG === "ar" ? "أيام" : "days"}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "الشحن" : "Shipping"}: <b>${s.shippingCost} ${omr}</b>
    </div>
    <div class="next"><span style="font-size:14px;color:var(--text-faint);">${escapeHtml(s.contact || "")}</span>
      ${s.website ? `<a class="ai-btn" href="https://${s.website.replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">↗</a>` : ""}</div>
  </div>`;
}
