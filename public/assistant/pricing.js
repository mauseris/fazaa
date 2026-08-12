// ============================================================================
// التسعير الديناميكي (Dynamic Pricing) — نطاق سعري مقترح من تكلفة الوحدة
// (رقم فقط، بنفس مبدأ حقول الحاسبة المالية) ونطاقات أسعار المنافسين التجريبية.
// ============================================================================

AiViews.pricing = function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const savedCost = (state.assistant.financialInputs && state.assistant.financialInputs.price) || "";
  container.innerHTML = `<h2 class="ai-view-title">🎯 ${LANG === "ar" ? "التسعير الديناميكي" : "Dynamic Pricing"}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "نطاق سعري مقترح بناءً على تكلفتك وأسعار المنافسين في قطاعك." : "A suggested price range based on your cost and competitor pricing in your sector."}</p>
    <div class="ai-card">
      <div class="ai-field"><label>${LANG === "ar" ? "تكلفة الوحدة (ر.ع)" : "Unit cost (OMR)"}</label>
        <input type="number" min="0" step="0.1" class="ai-input" id="dpUnitCost" value="${savedCost}"></div>
      <button class="ai-btn primary" style="margin-top:8px;" onclick="runPricingSuggestion()">${LANG === "ar" ? "احسب النطاق السعري" : "Calculate price range"}</button>
    </div>
    <div id="aiPricingResult" style="margin-top:14px;"></div>`;
};

async function runPricingSuggestion() {
  const unitCost = Number(document.getElementById("dpUnitCost").value) || 0;
  const box = document.getElementById("aiPricingResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const r = await AssistantAPI.suggestPricing(unitCost, state.sector || null, LANG);
    box.innerHTML = renderPricingResult(r);
    const slider = document.getElementById("dpSlider");
    if (slider) slider.oninput = () => updatePricingSliderLabel(r, Number(slider.value));
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderPricingResult(r) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  return `<div class="ai-card">
      <div class="row-between"><span>${LANG === "ar" ? "الحد الأدنى" : "Min"}</span><b>${r.minPrice} ${omr}</b></div>
      <div class="row-between"><span>${LANG === "ar" ? "السعر المقترح" : "Recommended"}</span><b style="color:var(--good);">${r.recommendedPrice} ${omr}</b></div>
      <div class="row-between"><span>${LANG === "ar" ? "الحد الأعلى" : "Max"}</span><b>${r.maxPrice} ${omr}</b></div>
      <div style="margin-top:10px;">
        <input type="range" id="dpSlider" min="${r.minPrice}" max="${r.maxPrice}" step="0.1" value="${r.recommendedPrice}" style="width:100%;">
        <div id="dpSliderLabel" style="text-align:center;font-size:14.5px;color:var(--text-dim);margin-top:4px;">${LANG === "ar" ? "جرّب سعراً مختلفاً ضمن النطاق" : "Try a different price within the range"}: <b>${r.recommendedPrice} ${omr}</b></div>
      </div>
      <div style="font-size:14.5px;color:var(--text-dim);margin-top:10px;line-height:1.7;">${escapeHtml(r.reasoning)}</div>
    </div>
    <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "نطاق أسعار المنافسين تجريبي للعرض فقط." : "Competitor price ranges are mock data for demo purposes."}</div>`;
}

function updatePricingSliderLabel(r, value) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  const label = document.getElementById("dpSliderLabel");
  if (label) label.innerHTML = `${LANG === "ar" ? "جرّب سعراً مختلفاً ضمن النطاق" : "Try a different price within the range"}: <b>${value} ${omr}</b>`;
}
