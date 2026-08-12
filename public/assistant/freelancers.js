// ============================================================================
// المستقلون (Freelancer Connection) — دليل تجريبي لمستقلين تخدم المشاريع
// الناشئة. التصفية عبر أزرار فئات (نقر فقط)، بدون أي نص حر.
// ============================================================================

const FREELANCER_SKILLS = [
  { id: "design", ar: "تصميم", en: "Design" }, { id: "dev", ar: "برمجة", en: "Development" },
  { id: "marketing", ar: "تسويق", en: "Marketing" }, { id: "accounting", ar: "محاسبة", en: "Accounting" },
  { id: "legal", ar: "قانوني", en: "Legal" },
];
let freelancerSkillFilter = null;

AiViews.freelancers = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">🤝 ${LANG === "ar" ? "المستقلون" : "Freelancers"}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "مستقلون يخدمون المشاريع الناشئة — اختر تخصصاً." : "Freelancers that serve new businesses — pick a specialty."}</p>
    <div class="ai-row" style="flex-wrap:wrap;">
      <button class="ai-btn${!freelancerSkillFilter ? " primary" : ""}" onclick="filterFreelancers(null)">${LANG === "ar" ? "الكل" : "All"}</button>
      ${FREELANCER_SKILLS.map((s) => `<button class="ai-btn${freelancerSkillFilter === s.id ? " primary" : ""}" onclick="filterFreelancers('${s.id}')">${LANG === "ar" ? s.ar : s.en}</button>`).join("")}
    </div>
    <div id="aiFreelancersResult" style="margin-top:14px;"><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div></div>`;
  await loadFreelancers();
};

async function filterFreelancers(skill) {
  freelancerSkillFilter = skill;
  switchAiView("freelancers");
}

async function loadFreelancers() {
  const box = document.getElementById("aiFreelancersResult");
  try {
    const { freelancers } = await AssistantAPI.matchFreelancers(freelancerSkillFilter, LANG);
    box.innerHTML = freelancers.map(freelancerCardHtml).join("") +
      `<div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "دليل تجريبي للعرض فقط." : "Mock directory for demo purposes only."}</div>`;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function freelancerCardHtml(f) {
  const omr = LANG === "ar" ? "ر.ع" : "OMR";
  const unitLabel = f.unit === "hour" ? (LANG === "ar" ? "/ساعة" : "/hr") : (LANG === "ar" ? "/شهر" : "/mo");
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(f.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${escapeHtml(f.category)}</span></div>
    <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "السعر" : "Rate"}: <b>${f.rateMin}-${f.rateMax} ${omr}${unitLabel}</b> &nbsp;|&nbsp; ⭐ ${f.rating}
    </div>
    <div class="next"><span style="font-size:12px;color:var(--text-faint);">${escapeHtml(f.contact)}</span></div>
  </div>`;
}
