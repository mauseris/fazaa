// ============================================================================
// قيّم فكرتي (Evaluate My Idea)، خطة العمل (Business Plan)، الحاسبة المالية
// (Financial Calculator)، اشرح هذا (Explain This). الأولى والثانية والرابعة
// تستدعي النموذج اللغوي المُفعّل حالياً على السيرفر (نداء واحد بسيط، بدون حلقة
// أدوات) عبر /api/assistant/*؛ الحاسبة المالية حتمية بحتة.
// ============================================================================

// ------------------------------- Evaluate My Idea ------------------------------
// لا يوجد صندوق نص هنا — الفكرة تُقرأ حصراً من state.idea التي استخرجتها
// المحادثة الرئيسية، بدل سؤال المستخدم عن فكرته مرة ثانية في مكان منفصل.
AiViews.idea = function (container) {
  if (!state.idea) {
    container.innerHTML = `<h2 class="ai-view-title">💡 ${ta("navIdea")}</h2>
      <div class="ai-empty">${LANG === "ar" ? "احكيلي عن فكرة مشروعك في المحادثة الرئيسية أولاً، وبعدها أقدر أقيّمها لك هنا." : "Tell me about your business idea in the main chat first, then I can evaluate it here."}</div>
      <button class="ai-btn primary" onclick="switchAiView('start')">${ta("navStart")}</button>`;
    return;
  }
  container.innerHTML = `<h2 class="ai-view-title">💡 ${ta("navIdea")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "بنقيّم فكرتك بواقعية (مو ضمان نجاح) بناءً على وصفك لها في المحادثة." : "We'll evaluate your idea realistically (not a success guarantee) based on what you told the chat."}</p>
    <div class="ai-card">
      <div style="font-size:13.5px;color:var(--text);line-height:1.7;">${escapeHtml(state.idea)}</div>
      <button class="ai-btn primary" style="margin-top:10px;" onclick="runIdeaEvaluation()">${LANG === "ar" ? "قيّم الفكرة" : "Evaluate idea"}</button>
    </div>
    <div id="aiIdeaResult"></div>`;
};
async function runIdeaEvaluation() {
  const text = state.idea || "";
  if (!text) return;
  const box = document.getElementById("aiIdeaResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.evaluateIdea(text, LANG);
    if (result.raw) { box.innerHTML = `<div class="ai-card" style="white-space:pre-wrap;">${escapeHtml(result.raw)}</div>`; return; }
    const sections = [
      ["targetCustomers", LANG === "ar" ? "العملاء المستهدفون" : "Target customers"],
      ["demand", LANG === "ar" ? "الطلب المحتمل" : "Potential demand"],
      ["competition", LANG === "ar" ? "المنافسة" : "Competition"],
      ["costs", LANG === "ar" ? "التكاليف المتوقعة" : "Expected costs"],
    ];
    box.innerHTML = sections.map(([k, label]) => result[k] ? `<div class="ai-section"><div class="sec-title">${label}</div><div style="font-size:13px;color:var(--text-dim);line-height:1.7;">${escapeHtml(result[k])}</div></div>` : "").join("") +
      listSection(result.requirements, LANG === "ar" ? "متطلبات أساسية" : "Basic requirements") +
      listSection(result.risks, LANG === "ar" ? "مخاطر محتملة" : "Potential risks") +
      listSection(result.questions, LANG === "ar" ? "أسئلة عليك الإجابة عنها قبل البدء" : "Questions to answer before starting");
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}
function listSection(arr, label) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return `<div class="ai-section"><div class="sec-title">${label}</div><ul class="ai-reason-list">${arr.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>`;
}

// ------------------------------- Business Plan ---------------------------------
const PLAN_SECTIONS = [
  ["description", { ar: "وصف المشروع", en: "Business description" }],
  ["problem", { ar: "المشكلة", en: "Problem" }],
  ["solution", { ar: "الحل", en: "Solution" }],
  ["targetCustomers", { ar: "العملاء المستهدفون", en: "Target customers" }],
  ["productsServices", { ar: "المنتجات/الخدمات", en: "Products/services" }],
  ["competitors", { ar: "المنافسون", en: "Competitors" }],
  ["marketing", { ar: "استراتيجية التسويق", en: "Marketing strategy" }],
  ["operations", { ar: "التشغيل", en: "Operations" }],
  ["suppliers", { ar: "الموردون", en: "Suppliers" }],
  ["staffing", { ar: "فريق العمل", en: "Staffing" }],
  ["startupCosts", { ar: "تكاليف التأسيس", en: "Startup costs" }],
  ["expectedRevenue", { ar: "الإيرادات المتوقعة", en: "Expected revenue" }],
  ["risks", { ar: "المخاطر", en: "Risks" }],
  ["growthPlan", { ar: "خطة النمو", en: "Growth plan" }],
];
AiViews.plan = function (container) {
  ensureAssistantState();
  const existing = state.assistant.businessPlan;
  const hasContent = Object.keys(existing).length > 0;
  container.innerHTML = `<h2 class="ai-view-title">📊 ${ta("navPlan")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "مسودة أولية قابلة للتعديل الكامل." : "An initial draft, fully editable."}</p>
    <button class="ai-btn primary" onclick="generatePlan()">${hasContent ? (LANG === "ar" ? "إعادة توليد الخطة" : "Regenerate plan") : (LANG === "ar" ? "أنشئ مسودة الخطة" : "Generate plan draft")}</button>
    <div id="aiPlanBody" style="margin-top:14px;">${hasContent ? renderPlanSections(existing) : ""}</div>`;
};
function renderPlanSections(plan) {
  return PLAN_SECTIONS.map(([key, label]) => `
    <div class="ai-section">
      <div class="sec-title">${LANG === "ar" ? label.ar : label.en}</div>
      <textarea class="ai-textarea" onchange="updatePlanSection('${key}', this.value)">${escapeHtml(plan[key] || "")}</textarea>
    </div>
  `).join("");
}
function updatePlanSection(key, value) {
  ensureAssistantState();
  state.assistant.businessPlan[key] = value;
  if (typeof saveState === "function") saveState();
}
async function generatePlan() {
  const box = document.getElementById("aiPlanBody");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateBusinessPlan(getBusinessProfile(), { idea: state.idea }, LANG);
    if (result.raw) { box.innerHTML = `<div class="ai-card" style="white-space:pre-wrap;">${escapeHtml(result.raw)}</div>`; return; }
    ensureAssistantState();
    state.assistant.businessPlan = result;
    if (typeof saveState === "function") saveState();
    box.innerHTML = renderPlanSections(result);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

// ------------------------------- Financial Calculator ---------------------------
const FIN_FIELDS = [
  ["startupCosts", { ar: "تكاليف تأسيس أخرى (مبلغ مقطوع)", en: "Other one-time startup costs" }],
  ["rent", { ar: "الإيجار الشهري", en: "Monthly rent" }],
  ["equipment", { ar: "المعدات (مبلغ مقطوع)", en: "Equipment (one-time)" }],
  ["salaries", { ar: "الرواتب الشهرية", en: "Monthly salaries" }],
  ["inventory", { ar: "المخزون (مبلغ مقطوع)", en: "Inventory (one-time)" }],
  ["marketing", { ar: "التسويق الشهري", en: "Monthly marketing" }],
  ["other", { ar: "مصاريف أخرى شهرية", en: "Other monthly expenses" }],
  ["expectedSales", { ar: "المبيعات المتوقعة شهرياً (وحدة)", en: "Expected monthly sales (units)" }],
  ["price", { ar: "سعر الوحدة", en: "Price per unit" }],
];
AiViews.financial = function (container) {
  ensureAssistantState();
  const saved = state.assistant.financialInputs || {};
  container.innerHTML = `<h2 class="ai-view-title">💰 ${ta("navFinancial")}</h2>
    <div class="ai-card"><div class="ai-grid">
      ${FIN_FIELDS.map(([key, label]) => `
        <div class="ai-field"><label>${LANG === "ar" ? label.ar : label.en}</label>
        <input type="number" min="0" class="ai-input" id="aiFin-${key}" value="${saved[key] ?? ""}"></div>
      `).join("")}
    </div>
    <button class="ai-btn primary" style="margin-top:8px;" onclick="runFinancialCalc()">${LANG === "ar" ? "احسب" : "Calculate"}</button></div>
    <div id="aiFinResult"></div>`;
};
async function runFinancialCalc() {
  ensureAssistantState();
  const inputs = {};
  FIN_FIELDS.forEach(([key]) => { inputs[key] = Number(document.getElementById(`aiFin-${key}`).value) || 0; });
  state.assistant.financialInputs = inputs;
  if (typeof saveState === "function") saveState();
  const box = document.getElementById("aiFinResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const r = await AssistantAPI.computeFinancials(inputs);
    const omr = LANG === "ar" ? "ر.ع" : "OMR";
    const rows = [
      [LANG === "ar" ? "إجمالي تكلفة التأسيس" : "Total startup cost", r.totalStartupCost, omr],
      [LANG === "ar" ? "المصاريف الشهرية" : "Monthly expenses", r.monthlyExpenses, omr],
      [LANG === "ar" ? "الإيرادات المتوقعة شهرياً" : "Estimated monthly revenue", r.estimatedRevenue, omr],
      [LANG === "ar" ? "الربح المتوقع شهرياً" : "Estimated monthly profit", r.estimatedProfit, omr],
      [LANG === "ar" ? "حجم المبيعات المطلوب للتعادل" : "Required sales volume to break even", r.requiredSalesVolume, LANG === "ar" ? "وحدة/شهر" : "units/mo"],
      [LANG === "ar" ? "نقطة التعادل" : "Break-even point", r.breakEvenMonths, LANG === "ar" ? "شهر" : "months"],
    ];
    box.innerHTML = `<div class="ai-card">${rows.map(([lbl, val, unit]) => `<div class="row-between"><span>${lbl}</span><b>${typeof val === "number" ? val.toLocaleString() + " " + unit : (LANG === "ar" ? "غير محقَّق بالمعطيات الحالية" : "Not reached with current assumptions")}</b></div>`).join("")}
      <div class="ai-disclaimer">${LANG === "ar" ? r.note.ar : r.note.en}</div></div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

// ------------------------------- Explain This -------------------------------
// بدون صندوق نص منفصل — المحادثة الرئيسية أصلاً قادرة على شرح أي مصطلح تسألها
// عنه، فنوجّه المستخدم إليها بدل تكرار نفس القدرة في صندوق نص ثانٍ.
AiViews.explain = function (container) {
  container.innerHTML = `<h2 class="ai-view-title">❓ ${ta("navExplain")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "اكتب أي مصطلح أو جملة حكومية معقّدة في المحادثة الرئيسية، وبنشرحها بعربي بسيط هناك." : "Type any complicated government/business term or sentence in the main chat, and we'll explain it there in plain language."}</p>
    <button class="ai-btn primary" onclick="askInChat('${LANG === "ar" ? "اشرح لي: " : "Explain to me: "}')">${LANG === "ar" ? "💬 اسأل في المحادثة" : "💬 Ask in the chat"}</button>`;
};
// يُستخدم من أكثر من ميزة (اشرح هذا، لوحة التحكم) لتحويل المستخدم للمحادثة
// الحقيقية بدل بناء صندوق نص موازٍ في كل ميزة على حدة.
function askInChat(prefill) {
  closeAssistant();
  const composer = document.getElementById("textInput");
  if (composer) {
    composer.value = prefill || "";
    composer.focus();
    if (composer.setSelectionRange) composer.setSelectionRange(composer.value.length, composer.value.length);
  }
}
