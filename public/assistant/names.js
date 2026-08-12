// ============================================================================
// اسم المشروع (Business Name Generator) — لا يوجد صندوق نص هنا؛ الاقتراحات
// تُبنى حصراً من بيانات المشروع (فكرة/قطاع/جمهور) التي استخرجتها المحادثة
// الرئيسية، عبر نداء واحد للنموذج اللغوي (/api/assistant/business-names).
// ============================================================================

AiViews.names = function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const has = Array.isArray(state.assistant.generatedNames) && state.assistant.generatedNames.length;
  container.innerHTML = `<h2 class="ai-view-title">🏷️ ${ta("navNames")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "اقتراحات أسماء تجارية مبنية على فكرة مشروعك مباشرة." : "Business name suggestions built directly from your business idea."}</p>
    <button class="ai-btn primary" onclick="runNameGeneration()">${has ? (LANG === "ar" ? "🔁 توليد أسماء أخرى" : "🔁 Generate other names") : (LANG === "ar" ? "✨ ولّد أسماء" : "✨ Generate names")}</button>
    <div id="aiNamesResult" style="margin-top:14px;">${has ? renderNameCards(state.assistant.generatedNames) : ""}</div>`;
};

async function runNameGeneration() {
  ensureAssistantState();
  const box = document.getElementById("aiNamesResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateBusinessNames(getBusinessProfile(), LANG);
    const names = Array.isArray(result.names) ? result.names : [];
    state.assistant.generatedNames = names;
    if (typeof saveState === "function") saveState();
    box.innerHTML = names.length ? renderNameCards(names) : `<div class="ai-error">${ta("errorGeneric")}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderNameCards(names) {
  const selected = state.assistant && state.assistant.businessName;
  return names.map((n, i) => `
    <div class="ai-card" style="margin-bottom:10px;${selected === n.arabicName || selected === n.englishName ? "border-color:var(--gold);" : ""}">
      <div class="row-between" style="margin-bottom:6px;">
        <span style="font-weight:800;font-size:17.5px;color:var(--text);">${escapeHtml(n.arabicName || "")} <span style="font-weight:500;color:var(--text-faint);font-size:14.5px;">(${escapeHtml(n.englishName || "")})</span></span>
        ${typeof n.memorabilityScore === "number" ? `<span class="ai-level-tag recommended">${n.memorabilityScore}/10</span>` : ""}
      </div>
      <div style="font-size:14.5px;color:var(--text-dim);margin-bottom:4px;"><b>${LANG === "ar" ? "المعنى:" : "Meaning:"}</b> ${escapeHtml(n.meaning || "")}</div>
      <div style="font-size:14.5px;color:var(--text-dim);margin-bottom:8px;"><b>${LANG === "ar" ? "ليش يناسب مشروعك:" : "Why it fits:"}</b> ${escapeHtml(n.whyItFits || "")}</div>
      <div style="font-size:13px;color:var(--text-faint);margin-bottom:10px;">📸 ${escapeHtml(n.suggestedInstagramHandle || "")} &nbsp; 🎵 ${escapeHtml(n.suggestedTiktokHandle || "")}</div>
      <div class="ai-row">
        <button class="ai-btn primary" onclick="selectBusinessName(${i})">${LANG === "ar" ? "اختيار الاسم" : "Select this name"}</button>
        <button class="ai-btn" onclick="switchAiView('brand')">${LANG === "ar" ? "🎨 إنشاء شعار" : "🎨 Create logo"}</button>
      </div>
    </div>
  `).join("") + `<div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات تجريبية — توفر النطاق/الحساب تقديري وليس تحققاً فعلياً." : "Mock data — domain/handle availability is illustrative, not a real check."}</div>`;
}

function selectBusinessName(index) {
  ensureAssistantState();
  const n = (state.assistant.generatedNames || [])[index];
  if (!n) return;
  state.assistant.businessName = LANG === "ar" ? (n.arabicName || n.englishName) : (n.englishName || n.arabicName);
  if (typeof saveState === "function") saveState();
  switchAiView("names");
}
