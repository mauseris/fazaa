// ============================================================================
// اكتشاف: دوّر على خدماتي (Find My Services)، فحص الأهلية (Eligibility Checker)،
// دوّر على تمويل (Funding Matcher)، الجهات الحكومية (Government Services).
// كل المطابقة والتقييم يتم على السيرفر (server/assistantData.js) — حتمي وسريع،
// لا يستدعي أي نموذج لغوي.
// ============================================================================

function profileSummaryHtml() {
  const p = getBusinessProfile();
  const sectorLabel = p.sector ? (LANG === "ar" ? (SECTORS[p.sector]?.label || p.sector) : (SECTORS[p.sector]?.label_en || p.sector)) : (LANG === "ar" ? "غير محدد" : "not set");
  const cityLabel = p.city ? (LANG === "ar" ? (CITIES[p.city]?.label || p.city) : (CITIES[p.city]?.label_en || p.city)) : (LANG === "ar" ? "غير محدد" : "not set");
  return `<div class="ai-card"><h3>📍 ${LANG === "ar" ? "ملخص مشروعك" : "Your business summary"}</h3>
    <div class="row-between"><span>${LANG === "ar" ? "القطاع" : "Sector"}</span><b>${sectorLabel}</b></div>
    <div class="row-between"><span>${LANG === "ar" ? "الموقع" : "Location"}</span><b>${cityLabel}</b></div>
  </div>`;
}

// ------------------------------- Find My Services --------------------------
AiViews.services = async function (container) {
  container.innerHTML = `<h2 class="ai-view-title">🎯 ${ta("navServices")}</h2>` + profileSummaryHtml() +
    `<button class="ai-btn primary" onclick="runServiceMatch()">${LANG === "ar" ? "دوّر على الخدمات المناسبة لي" : "Find services that fit me"}</button>
     <div id="aiServicesResults" style="margin-top:14px;"></div>`;
};
async function runServiceMatch() {
  const box = document.getElementById("aiServicesResults");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { matches } = await AssistantAPI.matchServices(getBusinessProfile(), LANG);
    box.innerHTML = matches.length ? matches.map(matchCardHtml).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا توجد خدمات مطابقة حالياً — أكمل بيانات مشروعك للحصول على نتائج أدق." : "No matching services yet — finish your business profile for more accurate results."}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

// ------------------------------- Funding Matcher ----------------------------
// المبلغ المطلوب لم يعد يُكتب هنا — يُشتق مباشرة من الميزانية التي ذكرها
// المستخدم في المحادثة الرئيسية (state.userBudget عبر getBusinessProfile).
AiViews.funding = async function (container) {
  const p = getBusinessProfile();
  if (typeof p.fundingNeeded !== "number") {
    container.innerHTML = `<h2 class="ai-view-title">💵 ${ta("navFunding")}</h2>` + profileSummaryHtml() +
      `<div class="ai-empty">${LANG === "ar" ? "قل لي ميزانيتك المتاحة في المحادثة الرئيسية أولاً حتى أقدر أدوّر لك على تمويل مناسب." : "Tell me your available budget in the main chat first, so I can find matching funding for you."}</div>
      <button class="ai-btn primary" onclick="switchAiView('start')">${ta("navStart")}</button>`;
    return;
  }
  container.innerHTML = `<h2 class="ai-view-title">💵 ${ta("navFunding")}</h2>` + profileSummaryHtml() +
    `<div class="ai-card"><h3>${LANG === "ar" ? "احتياجك التمويلي" : "Your funding need"}</h3>
      <div class="row-between"><span>${LANG === "ar" ? "المبلغ (ر.ع)" : "Amount (OMR)"}</span><b>${p.fundingNeeded}</b></div>
      <button class="ai-btn primary" style="margin-top:8px;" onclick="runFundingMatch()">${LANG === "ar" ? "دوّر على تمويل مناسب" : "Find matching funding"}</button>
    </div>
    <div id="aiFundingResults"></div>`;
};
async function runFundingMatch() {
  const box = document.getElementById("aiFundingResults");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { matches } = await AssistantAPI.matchFunding(getBusinessProfile(), LANG);
    box.innerHTML = matches.length ? matches.map(matchCardHtml).join("") : `<div class="ai-empty">${LANG === "ar" ? "لا توجد برامج تمويل مطابقة حالياً." : "No matching funding programs yet."}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function matchCardHtml(m) {
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(m.name)}</div>
    <div class="why">${escapeHtml(m.why)}</div>
    <ul class="req-list">${(m.required || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    <div class="next"><span style="font-size:12px;color:var(--text-faint);">${escapeHtml(m.nextAction)}</span>
      ${m.url ? `<a class="ai-btn" href="${m.url}" target="_blank" rel="noopener">↗</a>` : ""}</div>
  </div>`;
}

// ------------------------------- Eligibility Checker ------------------------
// كل الإجابات هنا اختيارات بالنقر فقط (لا كتابة حرة): يس/لا، وفئات مدة تشغيل
// جاهزة بدل رقم يُكتب يدوياً. مبلغ التمويل يُشتق من ميزانية المحادثة الرئيسية.
const MONTHS_OPTIONS = [
  { value: 0, ar: "لم يبدأ بعد", en: "Not started yet" },
  { value: 3, ar: "أقل من 6 أشهر", en: "Under 6 months" },
  { value: 9, ar: "6 – 12 شهر", en: "6 – 12 months" },
  { value: 18, ar: "أكثر من سنة", en: "Over a year" },
];
AiViews.eligibility = function (container) {
  const pa = (state.assistant && state.assistant.profileAnswers) || {};
  const p = getBusinessProfile();
  container.innerHTML = `<h2 class="ai-view-title">✅ ${ta("navEligibility")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "أجب عن هذه الأسئلة القصيرة للحصول على تقييم أولي." : "Answer these short questions for a preliminary assessment."}</p>
    <div class="ai-card">
      <div class="ai-field"><label>${LANG === "ar" ? "هل أنت مواطن عُماني؟" : "Are you an Omani national?"}</label>
        ${yesNoRadio("aiElIsOmani", pa.isOmani)}</div>
      <div class="ai-field"><label>${LANG === "ar" ? "هل مشروعك مسجّل رسمياً؟" : "Is your business already registered?"}</label>
        ${yesNoRadio("aiElRegistered", pa.registered)}</div>
      <div class="ai-field"><label>${LANG === "ar" ? "منذ كم شهر يعمل مشروعك؟" : "How long has it been operating?"}</label>
        <div class="ai-row" id="aiElMonthsRow">${MONTHS_OPTIONS.map((o) => `<button type="button" class="ai-btn${pa.monthsOperating === o.value ? " primary" : ""}" data-months="${o.value}" onclick="pickMonthsOperating(${o.value})">${LANG === "ar" ? o.ar : o.en}</button>`).join("")}</div></div>
      ${typeof p.fundingNeeded === "number" ? `<div class="ai-field"><label>${LANG === "ar" ? "التمويل الذي تحتاجه" : "Funding you need"}</label><div style="font-size:13px;">${p.fundingNeeded} ${LANG === "ar" ? "ر.ع" : "OMR"}</div></div>` : ""}
      <button class="ai-btn primary" onclick="runEligibilityCheck()">${LANG === "ar" ? "افحص أهليتي" : "Check my eligibility"}</button>
    </div>
    <div id="aiEligibilityResult"></div>`;
};
function pickMonthsOperating(value) {
  ensureAssistantState();
  state.assistant.profileAnswers.monthsOperating = value;
  if (typeof saveState === "function") saveState();
  document.querySelectorAll("#aiElMonthsRow .ai-btn").forEach((btn) => {
    btn.classList.toggle("primary", Number(btn.dataset.months) === value);
  });
}
function yesNoRadio(name, current) {
  const yes = current === true, no = current === false;
  return `<div class="ai-row">
    <label class="ai-btn" style="text-align:center;${yes ? "border-color:var(--gold);" : ""}"><input type="radio" name="${name}" value="yes" ${yes ? "checked" : ""} style="margin-inline-end:6px;">${LANG === "ar" ? "نعم" : "Yes"}</label>
    <label class="ai-btn" style="text-align:center;${no ? "border-color:var(--gold);" : ""}"><input type="radio" name="${name}" value="no" ${no ? "checked" : ""} style="margin-inline-end:6px;">${LANG === "ar" ? "لا" : "No"}</label>
  </div>`;
}
async function runEligibilityCheck() {
  ensureAssistantState();
  const getRadio = (name) => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value === "yes" : undefined; };
  const answers = {
    isOmani: getRadio("aiElIsOmani"),
    registered: getRadio("aiElRegistered"),
    monthsOperating: state.assistant.profileAnswers.monthsOperating ?? 0,
    fundingNeeded: getBusinessProfile().fundingNeeded ?? undefined,
  };
  Object.assign(state.assistant.profileAnswers, answers);
  if (typeof saveState === "function") saveState();

  const box = document.getElementById("aiEligibilityResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const result = await AssistantAPI.checkEligibility(answers, LANG);
    const verdictClass = result.verdict === "likely" ? "good" : result.verdict === "unlikely" ? "bad" : "info";
    const verdictLabel = {
      likely: LANG === "ar" ? "✅ أهلية محتملة" : "✅ Likely eligible",
      maybe: LANG === "ar" ? "ℹ️ تحتاج معلومات إضافية" : "ℹ️ More information needed",
      unlikely: LANG === "ar" ? "⚠️ قد لا تكون مؤهلاً" : "⚠️ May not be eligible",
      more_info: LANG === "ar" ? "ℹ️ معلومات ناقصة" : "ℹ️ Missing information",
    }[result.verdict] || result.verdict;
    box.innerHTML = `
      <div class="verdict-badge ${verdictClass}">${verdictLabel}</div>
      <ul class="ai-reason-list">${result.reasons.map((r) => `<li>${LANG === "ar" ? r.ar : r.en}</li>`).join("")}</ul>
      <div class="ai-card"><h3>${LANG === "ar" ? "وش تقدر تسوي بعدين" : "What you can do next"}</h3>
        <ul class="ai-reason-list">${result.nextSteps.map((s) => `<li>${LANG === "ar" ? s.ar : s.en}</li>`).join("")}</ul></div>
      <div class="ai-disclaimer">${LANG === "ar" ? result.disclaimer.ar : result.disclaimer.en}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

// ------------------------------- Government Services -------------------------
AiViews.gov = async function (container) {
  container.innerHTML = `<h2 class="ai-view-title">🏛️ ${ta("navGov")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { bodies, sectorBody } = await AssistantAPI.getGovBodies();
    const highlightKey = state.sector ? sectorBody[state.sector] : null;
    const keys = Object.keys(bodies).sort((a, b) => (a === highlightKey ? -1 : b === highlightKey ? 1 : 0));
    container.innerHTML = `<h2 class="ai-view-title">🏛️ ${ta("navGov")}</h2>` + keys.map((k) => {
      const b = bodies[k];
      return `<div class="ai-match-card">
        <div class="title">${LANG === "ar" ? b.name : b.name_en}${k === highlightKey ? ` <span class="ai-level-tag required">${LANG === "ar" ? "الأنسب لك" : "Best fit"}</span>` : ""}</div>
        <div class="why">${LANG === "ar" ? b.whyAr : b.whyEn}</div>
        <div style="font-size:12px;color:var(--text-faint);margin-bottom:8px;"><b>${LANG === "ar" ? "جهّز:" : "Prepare:"}</b> ${LANG === "ar" ? b.prepareAr : b.prepareEn}</div>
        <div style="font-size:12px;color:var(--text-faint);margin-bottom:8px;"><b>${LANG === "ar" ? "بعدها:" : "After:"}</b> ${LANG === "ar" ? b.afterAr : b.afterEn}</div>
        <a class="ai-btn" href="${b.url}" target="_blank" rel="noopener">${LANG === "ar" ? "الموقع الرسمي ↗" : "Official site ↗"}</a>
      </div>`;
    }).join("");
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">🏛️ ${ta("navGov")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};
