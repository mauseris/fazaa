// ============================================================================
// المستقلون (Freelancers) — كتالوج تجريبي حتمي على السيرفر (لا يستدعي نموذجاً
// لغوياً)، عام لكل القطاعات: تصميم، تسويق، تصوير، تطوير، محتوى، تمويل...
// ============================================================================

AiViews.freelancers = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">🧑‍💻 ${ta("navFreelancers")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { freelancers } = await AssistantAPI.matchFreelancers(null, LANG);
    container.innerHTML = `<h2 class="ai-view-title">🧑‍💻 ${ta("navFreelancers")}</h2>
      ${freelancers.map(freelancerCardHtml).join("")}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات مستقلين تجريبية للعرض فقط." : "Mock freelancer data for demo purposes only."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">🧑‍💻 ${ta("navFreelancers")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function freelancerCardHtml(f) {
  const omr = LANG === "ar" ? "ر.ع/ساعة" : "OMR/hr";
  return `<div class="ai-match-card">
    <div class="title">${escapeHtml(f.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${escapeHtml(f.category)}</span></div>
    <div class="why">${(f.skills || []).join(" · ")}</div>
    <div style="font-size:12px;color:var(--text-faint);margin:6px 0;">
      ${LANG === "ar" ? "الخبرة" : "Experience"}: <b>${f.experienceYears} ${LANG === "ar" ? "سنوات" : "yrs"}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "التقييم" : "Rating"}: <b>${f.rating}/5</b> (${f.reviews}) &nbsp;|&nbsp;
      ${LANG === "ar" ? "السعر" : "Rate"}: <b>${f.priceMin}-${f.priceMax} ${omr}</b>
    </div>
    <div class="next"><span style="font-size:12px;color:var(--text-faint);">${escapeHtml(f.contact || "")}</span>
      <span style="font-size:11px;color:var(--text-faint);">${escapeHtml(f.social || "")}</span></div>
  </div>`;
}
