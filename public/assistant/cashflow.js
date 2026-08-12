// ============================================================================
// محاكاة التدفق النقدي قبل الإطلاق (Pre-Launch Cash Flow Simulation) — يستخدم
// computeCashFlowSimulation الحتمية على السيرفر (لا نموذج لغوي). يعيد استخدام
// state.assistant.financialInputs من الحاسبة المالية كقيم افتراضية معقولة.
// ============================================================================

const CF_FIELDS = [
  ["startingCash", { ar: "الرصيد الحالي قبل الإطلاق", en: "Current cash before launch" }],
  ["startupCosts", { ar: "التكاليف الأولية (مبلغ مقطوع)", en: "One-time startup costs" }],
  ["month1Revenue", { ar: "الإيرادات المتوقعة في الشهر الأول", en: "Expected revenue in month 1" }],
  ["monthlyGrowthPct", { ar: "نسبة نمو الإيرادات الشهرية المتوقعة (%)", en: "Expected monthly revenue growth (%)" }],
  ["inventoryCost", { ar: "تكلفة المخزون الشهرية", en: "Monthly inventory cost" }],
  ["marketingCost", { ar: "التسويق الشهري", en: "Monthly marketing" }],
  ["deliveryCost", { ar: "التوصيل الشهري", en: "Monthly delivery" }],
  ["otherCost", { ar: "مصاريف أخرى شهرية", en: "Other monthly expenses" }],
];

function cfDefaults() {
  ensureAssistantState();
  if (state.assistant.cashflowInputs) return state.assistant.cashflowInputs;
  const fin = state.assistant.financialInputs || {};
  return {
    startingCash: 0,
    startupCosts: (fin.startupCosts || 0) + (fin.equipment || 0) + (fin.inventory || 0),
    month1Revenue: (fin.expectedSales || 0) * (fin.price || 0),
    monthlyGrowthPct: 10,
    inventoryCost: 0, marketingCost: fin.marketing || 0, deliveryCost: 0, otherCost: fin.other || 0,
  };
}

AiViews.cashflow = function (container) {
  const saved = cfDefaults();
  container.innerHTML = `<h2 class="ai-view-title">📈 ${ta("navCashflow")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "شوف كيف يتحرك رصيدك أول 6 أشهر قبل ما تصرف ريال واحد." : "See how your balance moves over the first 6 months before spending a single Rial."}</p>
    <div class="ai-card"><div class="ai-grid">
      ${CF_FIELDS.map(([key, label]) => `
        <div class="ai-field"><label>${LANG === "ar" ? label.ar : label.en}</label>
        <input type="number" class="ai-input" id="aiCf-${key}" value="${saved[key] ?? 0}"></div>
      `).join("")}
    </div>
    <button class="ai-btn primary" style="margin-top:8px;" onclick="runCashFlowSimulation()">${LANG === "ar" ? "🔮 شغّل المحاكاة" : "🔮 Run simulation"}</button></div>
    <div id="aiCfResult"></div>`;
};

async function runCashFlowSimulation() {
  ensureAssistantState();
  const inputs = {};
  CF_FIELDS.forEach(([key]) => { inputs[key] = Number(document.getElementById(`aiCf-${key}`).value) || 0; });
  state.assistant.cashflowInputs = inputs;
  if (typeof saveState === "function") saveState();

  const box = document.getElementById("aiCfResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const r = await AssistantAPI.simulateCashFlow(inputs);
    renderCashFlowResult(box, inputs, r);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderCashFlowResult(box, inputs, r) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  const month0Balance = inputs.startingCash - inputs.startupCosts;
  const anyNegative = r.lowestBalance < 0;
  const statusAr = anyNegative ? `🔴 تحذير: المتوقع عجز في الشهر ${r.lowestBalanceMonth}` : "🟢 الوضع الحالي: آمن";
  const statusEn = anyNegative ? `🔴 Warning: a deficit is expected in month ${r.lowestBalanceMonth}` : "🟢 Current status: safe";

  box.innerHTML = `
    <div class="ai-card">
      <h3>${LANG === "ar" ? "📊 قبل الإطلاق (الشهر 0)" : "📊 Before launch (Month 0)"}</h3>
      <div class="row-between"><span>${LANG === "ar" ? "الرصيد الحالي" : "Current cash"}</span><b>${inputs.startingCash.toLocaleString()} ${omr}</b></div>
      <div class="row-between"><span>${LANG === "ar" ? "التكاليف الأولية" : "Initial costs"}</span><b>${inputs.startupCosts.toLocaleString()} ${omr}</b></div>
      <div class="row-between"><span>${LANG === "ar" ? "المتبقي" : "Remaining"}</span><b>${month0Balance.toLocaleString()} ${omr}</b></div>
    </div>

    <div class="ai-card">${cashFlowChartSvg([month0Balance, ...r.months.map((m) => m.balance)])}</div>

    <div class="ai-card" id="aiCfTimeline">${cashFlowTimelineHtml(r.months, 1)}</div>

    <div class="ai-disclaimer" style="margin-bottom:14px;">${statusAr === statusEn ? statusAr : (LANG === "ar" ? statusAr : statusEn)}${anyNegative ? "" : ""}</div>

    ${r.recommendations.length ? `<div class="ai-card"><h3>💡 ${LANG === "ar" ? "توصيات لتجنب العجز" : "Recommendations to avoid a deficit"}</h3>
      <ul class="ai-reason-list">${r.recommendations.map((rec) => `<li>${LANG === "ar" ? rec.ar : rec.en}</li>`).join("")}</ul></div>` : ""}

    <div class="ai-card"><h3>📊 ${LANG === "ar" ? "سيناريوهات «ماذا لو»" : "\"What-if\" scenarios"}</h3>
      <div class="ai-grid">${scenarioCardHtml("optimistic", "📈", LANG === "ar" ? "متفائل" : "Optimistic", r.scenarios.optimistic, omr)}
      ${scenarioCardHtml("realistic", "📊", LANG === "ar" ? "واقعي" : "Realistic", r.scenarios.realistic, omr)}
      ${scenarioCardHtml("pessimistic", "📉", LANG === "ar" ? "متشائم" : "Pessimistic", r.scenarios.pessimistic, omr)}</div>
    </div>

    <div class="ai-card">
      <h3>🎮 ${LANG === "ar" ? "محاكاة تفاعلية — عدّل وشوف الأثر فوراً" : "Interactive simulation — adjust and see the effect instantly"}</h3>
      ${cfSlider("month1Revenue", inputs.month1Revenue, 0, Math.max(inputs.month1Revenue * 3, 1000), LANG === "ar" ? "المبيعات الشهرية" : "Monthly sales")}
      ${cfSlider("inventoryCost", inputs.inventoryCost, 0, Math.max(inputs.inventoryCost * 3, 1000), LANG === "ar" ? "تكاليف المخزون" : "Inventory cost")}
      ${cfSlider("marketingCost", inputs.marketingCost, 0, Math.max(inputs.marketingCost * 3, 500), LANG === "ar" ? "ميزانية التسويق" : "Marketing budget")}
      <div id="aiCfWhatIfResult" style="margin-top:10px;font-size:15px;"></div>
    </div>

    <button class="ai-btn" onclick="window.print()">🖨 ${LANG === "ar" ? "طباعة" : "Print"}</button>
  `;
  box.dataset.baseInputs = JSON.stringify(inputs);
}

function scenarioCardHtml(key, icon, label, s, omr) {
  return `<div class="ai-match-card">
    <div class="title">${icon} ${label}</div>
    <div class="row-between"><span>${LANG === "ar" ? "نقطة التعادل" : "Break-even"}</span><b>${s.breakEvenMonth ? (LANG === "ar" ? `الشهر ${s.breakEvenMonth}` : `Month ${s.breakEvenMonth}`) : (LANG === "ar" ? "لم تتحقق خلال 6 أشهر" : "Not reached in 6 months")}</b></div>
    <div class="row-between"><span>${LANG === "ar" ? "الرصيد في الشهر 6" : "Month 6 balance"}</span><b>${s.month6Balance.toLocaleString()} ${omr}</b></div>
  </div>`;
}

function cashFlowTimelineHtml(months, activeMonth) {
  const m = months.find((x) => x.month === activeMonth) || months[0];
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  const story = m.netFlow < 0
    ? (LANG === "ar" ? `في الشهر ${m.month}، التكاليف أعلى من الإيرادات بمقدار ${Math.abs(m.netFlow)} ${omr}. هذا طبيعي في البداية — الأهم بناء قاعدة عملاء.` : `In month ${m.month}, costs exceed revenue by ${Math.abs(m.netFlow)} ${omr}. This is normal early on — the priority is building a customer base.`)
    : (LANG === "ar" ? `في الشهر ${m.month}، مشروعك يحقق فائضاً قدره ${m.netFlow} ${omr}. استمر بنفس المسار.` : `In month ${m.month}, your business nets a surplus of ${m.netFlow} ${omr}. Keep going.`);
  return `
    <div class="ai-row" style="margin-bottom:12px;">${months.map((mo) => `<button class="ai-btn${mo.month === activeMonth ? " primary" : ""}" style="flex:1;min-width:60px;" onclick="showCfMonth(${mo.month})">${LANG === "ar" ? "شهر" : "Mo"} ${mo.month}</button>`).join("")}</div>
    <div class="row-between"><span>💰 ${LANG === "ar" ? "الإيرادات" : "Revenue"}</span><b>${m.revenue.toLocaleString()} ${omr}</b></div>
    <div class="row-between"><span>📦 ${LANG === "ar" ? "التكاليف" : "Costs"}</span><b>${m.totalCosts.toLocaleString()} ${omr}</b></div>
    <div class="row-between"><span>${m.netFlow >= 0 ? "📈" : "📉"} ${LANG === "ar" ? "صافي التدفق" : "Net flow"}</span><b style="color:${m.netFlow >= 0 ? "var(--good)" : "var(--coral)"};">${m.netFlow >= 0 ? "+" : ""}${m.netFlow.toLocaleString()} ${omr}</b></div>
    <div class="row-between"><span>🏦 ${LANG === "ar" ? "الرصيد النهائي" : "Ending balance"}</span><b>${m.balance.toLocaleString()} ${omr}</b></div>
    <div class="ai-disclaimer" style="margin-top:10px;">📖 ${story}</div>
  `;
}
function showCfMonth(month) {
  const box = document.getElementById("aiCfResult");
  const baseInputs = JSON.parse(box.dataset.baseInputs || "{}");
  AssistantAPI.simulateCashFlow(baseInputs).then((r) => {
    document.getElementById("aiCfTimeline").innerHTML = cashFlowTimelineHtml(r.months, month);
  });
}

function cashFlowChartSvg(balances) {
  const w = 600, h = 180, pad = 30;
  const max = Math.max(...balances, 0);
  const min = Math.min(...balances, 0);
  const range = (max - min) || 1;
  const xStep = (w - pad * 2) / (balances.length - 1);
  const yOf = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
  const points = balances.map((v, i) => [pad + i * xStep, yOf(v)]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const zeroY = yOf(0);
  const dots = points.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="${balances[i] < 0 ? "var(--coral)" : "var(--good)"}" />`).join("");
  const labels = balances.map((v, i) => `<text x="${points[i][0].toFixed(1)}" y="${h - 8}" font-size="10.5" fill="var(--text-faint)" text-anchor="middle">${i === 0 ? "0" : i}</text>`).join("");
  return `<h3>📈 ${LANG === "ar" ? "الرسم البياني التفاعلي — الرصيد عبر الأشهر" : "Interactive chart — balance over time"}</h3>
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; max-height:200px;">
      <line x1="${pad}" y1="${zeroY.toFixed(1)}" x2="${w - pad}" y2="${zeroY.toFixed(1)}" stroke="var(--line)" stroke-dasharray="4 4" />
      <path d="${path}" fill="none" stroke="var(--gold)" stroke-width="2.5" />
      ${dots}
      ${labels}
    </svg>`;
}

function cfSlider(key, value, min, max, label) {
  return `<div class="ai-field">
    <label>${label}: <b id="aiCfSlider-${key}-val">${value}</b></label>
    <input type="range" id="aiCfSlider-${key}" min="${min}" max="${max}" value="${value}" style="width:100%;accent-color:var(--gold);" oninput="cfSliderChanged('${key}', this.value)">
  </div>`;
}

let cfWhatIfTimer = null;
function cfSliderChanged(key, value) {
  document.getElementById(`aiCfSlider-${key}-val`).textContent = value;
  clearTimeout(cfWhatIfTimer);
  cfWhatIfTimer = setTimeout(() => runCfWhatIf(key, Number(value)), 250);
}
async function runCfWhatIf(key, value) {
  const box = document.getElementById("aiCfResult");
  const baseInputs = { ...JSON.parse(box.dataset.baseInputs || "{}"), [key]: value };
  const out = document.getElementById("aiCfWhatIfResult");
  try {
    const r = await AssistantAPI.simulateCashFlow(baseInputs);
    const omr = LANG === "ar" ? "ر.ع" : "OMR";
    out.innerHTML = `💰 ${LANG === "ar" ? "الربح الشهري (الشهر 6)" : "Monthly profit (month 6)"}: <b>${r.months[5].netFlow.toLocaleString()} ${omr}</b> &nbsp;|&nbsp;
      🎯 ${LANG === "ar" ? "نقطة التعادل" : "Break-even"}: <b>${r.breakEvenMonth ? (LANG === "ar" ? `الشهر ${r.breakEvenMonth}` : `Month ${r.breakEvenMonth}`) : (LANG === "ar" ? "غير محقَّق" : "Not reached")}</b>`;
  } catch (e) { /* ignore transient errors while dragging */ }
}
