// ============================================================================
// مستنداتي (My Documents)، مساعد التعبئة (Form Assistant)، طلباتي
// (My Applications)، والتذكيرات (Reminders). كل التخزين الخاص بالمستخدم يمر عبر
// state.assistant.* والحفظ الحالي (saveState/loadState) — لا تخزين جديد بالسيرفر.
// ============================================================================

function relevantDocIds() {
  const ids = ["civil_id", "business_registration", "business_plan", "bank_statement"];
  const physical = ["food", "retail", "beauty", "health", "manufact", "education"];
  if (state.sector && physical.includes(state.sector)) ids.push("municipal_license", "lease_contract");
  if (["food", "beauty", "health"].includes(state.sector)) ids.push("health_certificate");
  const funding = (state.assistant && state.assistant.profileAnswers && state.assistant.profileAnswers.fundingNeeded) || 0;
  if (funding > 0) ids.push("quotation");
  return [...new Set(ids)];
}

// ------------------------------- My Documents --------------------------------
AiViews.documents = async function (container) {
  ensureAssistantState();
  container.innerHTML = `<h2 class="ai-view-title">📄 ${ta("navDocuments")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const ids = relevantDocIds();
    const { documents } = await AssistantAPI.getDocuments(ids);
    const have = state.assistant.documents;
    container.innerHTML = `<h2 class="ai-view-title">📄 ${ta("navDocuments")}</h2>
      <p class="ai-view-sub">${LANG === "ar" ? "اضغط على أي مستند لمعرفة التفاصيل، وعلّم عليه إذا كان جاهزاً عندك." : "Click any document for details, and check it off once you have it."}</p>` +
      documents.map((d) => `
        <div class="ai-doc-item" data-doc="${d.id}">
          <div class="ai-doc-head" onclick="toggleDocOpen('${d.id}')">
            <div class="box${have[d.id] === "have" ? " have" : ""}" onclick="event.stopPropagation();toggleDocHave('${d.id}')">${have[d.id] === "have" ? "✓" : ""}</div>
            <div class="title">${LANG === "ar" ? d.ar : d.en}</div>
          </div>
          <div class="ai-doc-body">
            <div><b>${LANG === "ar" ? "وش هذا؟" : "What is this?"}</b> ${LANG === "ar" ? d.whatAr : d.whatEn}</div>
            <div><b>${LANG === "ar" ? "ليش أحتاجه؟" : "Why do I need it?"}</b> ${LANG === "ar" ? d.whyAr : d.whyEn}</div>
            <div><b>${LANG === "ar" ? "من وين أجيبه؟" : "Where can I get it?"}</b> ${LANG === "ar" ? d.whereAr : d.whereEn}</div>
            <div><b>${LANG === "ar" ? "الصيغة المقبولة" : "Accepted format"}</b> ${LANG === "ar" ? d.formatAr : d.formatEn}</div>
          </div>
        </div>
      `).join("");
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📄 ${ta("navDocuments")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};
function toggleDocOpen(id) {
  document.querySelector(`.ai-doc-item[data-doc="${id}"]`)?.classList.toggle("open");
}
function toggleDocHave(id) {
  ensureAssistantState();
  const cur = state.assistant.documents[id];
  state.assistant.documents[id] = cur === "have" ? "missing" : "have";
  if (typeof saveState === "function") saveState();
  const row = document.querySelector(`.ai-doc-item[data-doc="${id}"] .box`);
  if (row) {
    const have = state.assistant.documents[id] === "have";
    row.classList.toggle("have", have);
    row.textContent = have ? "✓" : "";
  }
}

// ------------------------------- Form Assistant -------------------------------
AiViews.forms = async function (container) {
  container.innerHTML = `<h2 class="ai-view-title">📝 ${ta("navForms")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "نموذج توضيحي (مثال Invest Easy) — اضغط أي حقل لفهمه بعربي بسيط." : "A sample form (Invest Easy example) — click any field to understand it in plain language."}</p>
    <div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { fields } = await AssistantAPI.getFormFields();
    container.innerHTML = `<h2 class="ai-view-title">📝 ${ta("navForms")}</h2>
      <p class="ai-view-sub">${LANG === "ar" ? "نموذج توضيحي (مثال Invest Easy) — اضغط أي حقل لفهمه بعربي بسيط." : "A sample form (Invest Easy example) — click any field to understand it in plain language."}</p>` +
      fields.map((f) => `
        <div class="ai-card">
          <div class="row-between" style="margin-bottom:0;"><span style="font-weight:700;color:var(--text);">${LANG === "ar" ? f.labelAr : f.labelEn}</span>
          <button class="ai-btn" onclick="explainField('${f.id}')">❓ ${LANG === "ar" ? "اشرح هذا الحقل" : "Explain this field"}</button></div>
          <div id="aiField-${f.id}"></div>
        </div>
      `).join("");
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">📝 ${ta("navForms")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};
async function explainField(id) {
  const box = document.getElementById(`aiField-${id}`);
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const field = await AssistantAPI.getFormField(id, state.sector, LANG);
    box.innerHTML = `<div style="margin-top:8px;font-size:12.5px;color:var(--text-dim);line-height:1.7;">
      ${escapeHtml(field.explain)}${field.example ? `<div style="margin-top:6px;color:var(--text-faint);">${escapeHtml(field.example)}</div>` : ""}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

// ------------------------------- My Applications -------------------------------
AiViews.applications = async function (container) {
  ensureAssistantState();
  if (!state.assistant.applications.length) {
    try {
      const { applications } = await AssistantAPI.getSampleApplications(state.sector);
      state.assistant.applications = applications;
      if (typeof saveState === "function") saveState();
    } catch (e) { /* leave empty */ }
  }
  const apps = state.assistant.applications;
  const statusLabel = { under_review: LANG === "ar" ? "🟡 قيد المراجعة" : "🟡 Under Review", action_required: LANG === "ar" ? "🔴 يحتاج إجراء" : "🔴 Action Required", approved: LANG === "ar" ? "🟢 تمت الموافقة" : "🟢 Approved" };
  container.innerHTML = `<h2 class="ai-view-title">📤 ${ta("navApplications")}</h2>` +
    (apps.length ? apps.map((a) => `
      <div class="ai-app-item">
        <div class="ai-app-status ${a.status}">${statusLabel[a.status] || a.status}</div>
        <div style="font-weight:700;font-size:13.5px;margin-bottom:4px;">${LANG === "ar" ? a.nameAr : a.nameEn}</div>
        <div style="font-size:11.5px;color:var(--text-faint);margin-bottom:6px;">${LANG === "ar" ? "قُدّم بتاريخ" : "Submitted"}: ${new Date(a.submittedAt).toLocaleDateString(LANG === "ar" ? "ar-OM" : "en-GB")}</div>
        <div style="font-size:12.5px;color:var(--text-dim);">${LANG === "ar" ? a.recommendationAr : a.recommendationEn}</div>
        ${a.status === "action_required" ? `<button class="ai-btn" style="margin-top:8px;" onclick="switchAiView('documents')">${LANG === "ar" ? "عرض المستند المطلوب" : "View required document"}</button>` : ""}
      </div>
    `).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا توجد طلبات حالياً." : "No applications yet."}</div>`);
};

// ------------------------------- Reminders -------------------------------
AiViews.reminders = async function (container) {
  ensureAssistantState();
  container.innerHTML = `<h2 class="ai-view-title">🔔 ${ta("navReminders")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  const dismissed = state.assistant.dismissedReminders || {};
  const reminders = [];

  try {
    const missingIds = Object.keys(state.assistant.documents).filter((id) => state.assistant.documents[id] === "missing");
    if (missingIds.length) {
      const { documents } = await AssistantAPI.getDocuments(missingIds);
      documents.forEach((d) => reminders.push({ id: `doc-${d.id}`, icon: "🔔", text: (LANG === "ar" ? "ارفع مستند: " : "Upload document: ") + (LANG === "ar" ? d.ar : d.en) }));
    }
  } catch (e) { /* ignore */ }

  (state.assistant.applications || []).filter((a) => a.status === "action_required").forEach((a) => {
    reminders.push({ id: `app-${a.id}`, icon: "🔴", text: (LANG === "ar" ? a.nameAr : a.nameEn) + " — " + (LANG === "ar" ? a.missingAr : a.missingEn) });
  });

  if (state.sector) {
    try {
      const rm = await AssistantAPI.getRoadmap(state.sector);
      const done = state.assistant.roadmapDone;
      rm.phases.flatMap((p) => p.tasks).filter((t) => t.level === "required" && !done[t.id]).slice(0, 2)
        .forEach((t) => reminders.push({ id: `task-${t.id}`, icon: "📅", text: LANG === "ar" ? t.ar : t.en }));
    } catch (e) { /* ignore */ }
  }

  const visible = reminders.filter((r) => !dismissed[r.id]);
  container.innerHTML = `<h2 class="ai-view-title">🔔 ${ta("navReminders")}</h2>` +
    (visible.length ? visible.map((r) => `
      <div class="ai-reminder-item" data-rem="${r.id}">
        <div class="txt">${r.icon} ${escapeHtml(r.text)}</div>
        <div class="acts">
          <button onclick="dismissReminder('${r.id}')">${LANG === "ar" ? "تم ✓" : "Done ✓"}</button>
          <button onclick="dismissReminder('${r.id}')">${LANG === "ar" ? "تأجيل" : "Snooze"}</button>
        </div>
      </div>
    `).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا توجد تذكيرات حالياً 🎉" : "No reminders right now 🎉"}</div>`);
};
function dismissReminder(id) {
  ensureAssistantState();
  if (!state.assistant.dismissedReminders) state.assistant.dismissedReminders = {};
  state.assistant.dismissedReminders[id] = true;
  if (typeof saveState === "function") saveState();
  document.querySelector(`.ai-reminder-item[data-rem="${id}"]`)?.remove();
}
