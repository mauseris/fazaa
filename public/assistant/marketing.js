// ============================================================================
// التسويق (Marketing & Influencer Finder) — قائمة مؤثرين مطابقة لقطاعك من
// كتالوج تجريبي حتمي، بالإضافة لاستراتيجية تسويق واحدة يولّدها النموذج اللغوي
// بناءً على بيانات مشروعك فقط (بدون أي صندوق نص جديد).
// ============================================================================

AiViews.marketing = async function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  container.innerHTML = `<h2 class="ai-view-title">📣 ${ta("navMarketing")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { influencers } = await AssistantAPI.matchInfluencers(state.sector || null, LANG);
    const existingStrategy = state.assistant.marketingStrategy;
    container.innerHTML = `<h2 class="ai-view-title">📣 ${ta("navMarketing")}</h2>
      <div class="ai-card">
        <h3>${LANG === "ar" ? "استراتيجية التسويق" : "Marketing strategy"}</h3>
        <button class="ai-btn primary" onclick="runMarketingStrategy()">${existingStrategy ? (LANG === "ar" ? "🔁 إعادة التوليد" : "🔁 Regenerate") : (LANG === "ar" ? "✨ ولّد استراتيجية" : "✨ Generate strategy")}</button>
        <div id="aiMarketingStrategy" style="margin-top:10px;">${existingStrategy ? marketingStrategyHtml(existingStrategy) : ""}</div>
      </div>
      <h3 style="margin-top:14px;">${LANG === "ar" ? "المؤثرون المناسبون لمشروعك" : "Influencers that fit your business"}</h3>
      ${influencers.map(influencerCardHtml).join("")}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات مؤثرين تجريبية للعرض فقط." : "Mock influencer data for demo purposes only."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📣 ${ta("navMarketing")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

async function runMarketingStrategy() {
  ensureAssistantState();
  const box = document.getElementById("aiMarketingStrategy");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateMarketingStrategy(getBusinessProfile(), LANG);
    state.assistant.marketingStrategy = result;
    if (typeof saveState === "function") saveState();
    box.innerHTML = marketingStrategyHtml(result);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function marketingStrategyHtml(r) {
  if (r.raw) return `<div style="white-space:pre-wrap;font-size:12.5px;">${escapeHtml(r.raw)}</div>`;
  return `
    <div class="row-between"><span>${LANG === "ar" ? "المنصات" : "Platforms"}</span><b>${(r.platforms || []).join(" · ")}</b></div>
    <div class="row-between"><span>${LANG === "ar" ? "الميزانية المقترحة" : "Suggested budget"}</span><b>${escapeHtml(r.budgetSuggestionOmr || "")} ${LANG === "ar" ? "ر.ع/شهر" : "OMR/mo"}</b></div>
    <ul class="ai-reason-list" style="margin-top:8px;">${(r.contentIdeas || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
}

function influencerCardHtml(inf) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(inf.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${(inf.platforms || []).join(" + ")}</span></div>
    <div class="why">${LANG === "ar" ? "الجمهور" : "Audience"}: ${escapeHtml(inf.audience)}</div>
    <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "المتابعون" : "Followers"}: <b>${inf.followers}</b> &nbsp;|&nbsp; ${LANG === "ar" ? "نسبة التفاعل" : "Engagement"}: <b>${inf.engagementRate}%</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "السعر التقديري" : "Est. price"}: <b>${inf.priceMin}-${inf.priceMax} ${omr}</b>
    </div>
    <div style="font-size:12px;color:var(--text-dim);">${escapeHtml(inf.content)}</div>
    <div class="next"><span style="font-size:12px;color:var(--text-faint);">${LANG === "ar" ? "حملة مقترحة" : "Suggested campaign"}: ${escapeHtml(inf.campaign)}</span>
      <span style="font-size:11px;color:var(--text-faint);">${escapeHtml(inf.social)}</span></div>
  </div>`;
}
