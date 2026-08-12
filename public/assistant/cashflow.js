// ============================================================================
// التدفق النقدي (Cash Flow Monitoring) — سجل شهري بسيط للأرقام الفعلية
// (مبالغ رقمية فقط، لا نص حر — نفس مبدأ حقول الحاسبة المالية الموجودة أصلاً)
// مقارنة بخط الأساس المتوقع من محاكاة التدفق النقدي.
// ============================================================================

AiViews.cashflow = function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const log = state.assistant.cashflowLog || [];
  container.innerHTML = `<h2 class="ai-view-title">💰 ${LANG === "ar" ? "التدفق النقدي" : "Cash Flow"}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "سجّل أرقامك الفعلية شهرياً لمتابعة تدفقك النقدي الحقيقي." : "Log your actual numbers each month to track your real cash flow."}</p>
    <div class="ai-card">
      <h3>${LANG === "ar" ? `تسجيل شهر ${log.length + 1}` : `Log month ${log.length + 1}`}</h3>
      <div class="ai-grid">
        <div class="ai-field"><label>${LANG === "ar" ? "الإيرادات الفعلية (ر.ع)" : "Actual revenue (OMR)"}</label><input type="number" min="0" class="ai-input" id="cfRevenue"></div>
        <div class="ai-field"><label>${LANG === "ar" ? "المصاريف الفعلية (ر.ع)" : "Actual expenses (OMR)"}</label><input type="number" min="0" class="ai-input" id="cfExpenses"></div>
      </div>
      <button class="ai-btn primary" style="margin-top:8px;" onclick="logCashFlowMonth()">${LANG === "ar" ? "➕ إضافة الشهر" : "➕ Add month"}</button>
    </div>
    <div id="aiCashflowLog" style="margin-top:14px;">${log.length ? renderCashflowLog(log) : `<div class="ai-empty">${LANG === "ar" ? "لا يوجد سجل بعد." : "No entries yet."}</div>`}</div>`;
};

function logCashFlowMonth() {
  ensureAssistantState();
  const revenue = Number(document.getElementById("cfRevenue").value) || 0;
  const expenses = Number(document.getElementById("cfExpenses").value) || 0;
  if (!state.assistant.cashflowLog) state.assistant.cashflowLog = [];
  const prevBalance = state.assistant.cashflowLog.length ? state.assistant.cashflowLog[state.assistant.cashflowLog.length - 1].balance : 0;
  state.assistant.cashflowLog.push({ month: state.assistant.cashflowLog.length + 1, revenue, expenses, profit: revenue - expenses, balance: prevBalance + (revenue - expenses) });
  if (typeof saveState === "function") saveState();
  switchAiView("cashflow");
}

function renderCashflowLog(log) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  return `<h3>${LANG === "ar" ? "السجل" : "Log"}</h3>` + log.map((m) => `
    <div class="ai-match-card">
      <div class="row-between"><span style="font-weight:700;">${LANG === "ar" ? "شهر" : "Month"} ${m.month}</span>
        <span style="color:${m.balance >= 0 ? "var(--good)" : "#c0392b"};font-weight:700;">${m.balance.toLocaleString()} ${omr}</span></div>
      <div style="font-size:12px;color:var(--text-faint);">${LANG === "ar" ? "إيرادات" : "Revenue"}: ${m.revenue} ${omr} &nbsp;|&nbsp; ${LANG === "ar" ? "مصاريف" : "Expenses"}: ${m.expenses} ${omr} &nbsp;|&nbsp; ${LANG === "ar" ? "صافي" : "Net"}: ${m.profit} ${omr}</div>
    </div>
  `).join("");
}
