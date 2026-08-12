// ============================================================================
// محاكاة مالية (Cash Flow Simulation) — إسقاط ١٢ شهراً حتمي مبني على مخرجات
// الحاسبة المالية الموجودة أصلاً (state.assistant.financialInputs). لا يوجد
// أي إدخال جديد هنا — فقط زر "شغّل المحاكاة".
// ============================================================================

AiViews.simulation = async function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const inputs = state.assistant.financialInputs;
  if (!inputs || !Object.keys(inputs).length) {
    container.innerHTML = `<h2 class="ai-view-title">📈 ${LANG === "ar" ? "محاكاة مالية" : "Cash Flow Simulation"}</h2>
      <div class="ai-empty">${LANG === "ar" ? "أكمل الحاسبة المالية أولاً حتى نقدر نبني محاكاة تدفق نقدي واقعية." : "Finish the Financial Calculator first so we can build a realistic cash-flow simulation."}</div>
      <button class="ai-btn primary" onclick="switchAiView('financial')">🧮 ${LANG === "ar" ? "الحاسبة المالية" : "Financial Calculator"}</button>`;
    return;
  }
  container.innerHTML = `<h2 class="ai-view-title">📈 ${LANG === "ar" ? "محاكاة مالية" : "Cash Flow Simulation"}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "إسقاط ١٢ شهراً لتدفقك النقدي بناءً على أرقام الحاسبة المالية." : "A 12-month projection of your cash flow based on your Financial Calculator numbers."}</p>
    <button class="ai-btn primary" onclick="runCashFlowSimulation()">${LANG === "ar" ? "▶️ شغّل المحاكاة" : "▶️ Run simulation"}</button>
    <div id="aiSimResult" style="margin-top:14px;"></div>`;
};

async function runCashFlowSimulation() {
  ensureAssistantState();
  const box = document.getElementById("aiSimResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const financials = await AssistantAPI.computeFinancials(state.assistant.financialInputs);
    const sim = await AssistantAPI.simulateCashFlow(financials, 12);
    box.innerHTML = renderSimulation(sim);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderSimulation(sim) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  const maxAbs = Math.max(...sim.months.map((m) => Math.abs(m.balance)), 1);
  const rows = sim.months.map((m) => {
    const pct = Math.round((Math.abs(m.balance) / maxAbs) * 100);
    const positive = m.balance >= 0;
    return `<div class="row-between" style="margin-bottom:4px;">
      <span style="width:56px;font-size:11px;color:var(--text-faint);">${LANG === "ar" ? "شهر" : "Mo"} ${m.month}</span>
      <div style="flex:1;background:var(--navy-800);border-radius:6px;height:14px;margin:0 8px;overflow:hidden;">
        <div style="height:14px;border-radius:6px;width:${pct}%;background:${positive ? "var(--good)" : "#c0392b"};"></div>
      </div>
      <span style="width:80px;text-align:end;font-size:11.5px;color:${positive ? "var(--good)" : "#c0392b"};">${m.balance.toLocaleString()} ${omr}</span>
    </div>`;
  }).join("");
  return `<div class="ai-card">
      ${sim.breakEvenMonth
        ? `<div class="verdict-badge good">✅ ${LANG === "ar" ? `نقطة التعادل تقريباً في الشهر ${sim.breakEvenMonth}` : `Break-even around month ${sim.breakEvenMonth}`}</div>`
        : `<div class="verdict-badge bad">⚠️ ${LANG === "ar" ? "لا يصل التعادل خلال ١٢ شهراً بهذه الأرقام" : "Doesn't reach break-even within 12 months at these numbers"}</div>`}
      <div style="margin-top:10px;">${rows}</div>
    </div>
    <div class="ai-disclaimer">⚠️ ${sim.note ? (LANG === "ar" ? sim.note.ar : sim.note.en) : ""}</div>`;
}
