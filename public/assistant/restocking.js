// ============================================================================
// إعادة التخزين التنبؤية (Predictive Restocking) — تنبيهات تجريبية حتمية
// حسب فئات منتجات قطاعك، بدون أي بيانات مبيعات فعلية متصلة (معلَّم بوضوح).
// ============================================================================

AiViews.restocking = async function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  container.innerHTML = `<h2 class="ai-view-title">📦 ${LANG === "ar" ? "إعادة التخزين" : "Predictive Restocking"}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { alerts } = await AssistantAPI.getRestockingAlerts(state.sector || null, LANG);
    const dismissed = state.assistant.dismissedRestockAlerts || {};
    const visible = alerts.filter((a) => !dismissed[a.id]);
    container.innerHTML = `<h2 class="ai-view-title">📦 ${LANG === "ar" ? "إعادة التخزين" : "Predictive Restocking"}</h2>
      <p class="ai-view-sub">${LANG === "ar" ? "تنبيهات تقديرية لموعد إعادة الطلب حسب فئة المنتج." : "Estimated reorder alerts by product category."}</p>
      ${visible.length ? visible.map(restockAlertHtml).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا توجد تنبيهات حالياً 🎉" : "No alerts right now 🎉"}</div>`}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات تقديرية تجريبية — غير متصلة بمبيعات فعلية." : "Illustrative mock data — not connected to real sales."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📦 ${LANG === "ar" ? "إعادة التخزين" : "Predictive Restocking"}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function restockAlertHtml(a) {
  const urgencyLabel = { critical: LANG === "ar" ? "🔴 عاجل" : "🔴 Critical", low: LANG === "ar" ? "🟡 منخفض" : "🟡 Low", ok: LANG === "ar" ? "🟢 جيد" : "🟢 OK" }[a.urgency];
  return `<div class="ai-reminder-item" data-restock="${a.id}">
    <div class="txt"><b>${escapeHtml(a.category)}</b> — ${urgencyLabel} — ${LANG === "ar" ? `${a.daysLeft} يوم متبقٍ` : `${a.daysLeft} days left`}
      ${a.suggestedSupplier ? `<div style="font-size:12.5px;color:var(--text-faint);margin-top:2px;">${LANG === "ar" ? "المورد المقترح" : "Suggested supplier"}: ${escapeHtml(a.suggestedSupplier)}</div>` : ""}</div>
    <div class="acts"><button onclick="dismissRestockAlert('${a.id}')">${LANG === "ar" ? "تمت إعادة الطلب ✓" : "Reordered ✓"}</button></div>
  </div>`;
}

function dismissRestockAlert(id) {
  ensureAssistantState();
  if (!state.assistant.dismissedRestockAlerts) state.assistant.dismissedRestockAlerts = {};
  state.assistant.dismissedRestockAlerts[id] = true;
  if (typeof saveState === "function") saveState();
  document.querySelector(`.ai-reminder-item[data-restock="${id}"]`)?.remove();
}
