// ============================================================================
// شبكة رواد الأعمال (Entrepreneur Network) — دليل تجريبي لرواد أعمال في نفس
// قطاعك للتواصل وتبادل الخبرات. لا يوجد أي نص حر — عرض + زر "تواصل" فقط.
// ============================================================================

AiViews.network = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">🤝 ${LANG === "ar" ? "شبكة رواد الأعمال" : "Entrepreneur Network"}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { entrepreneurs } = await AssistantAPI.matchEntrepreneurs(state.sector || null, LANG);
    container.innerHTML = `<h2 class="ai-view-title">🤝 ${LANG === "ar" ? "شبكة رواد الأعمال" : "Entrepreneur Network"}</h2>
      <p class="ai-view-sub">${LANG === "ar" ? "رواد أعمال آخرون في قطاعك يمكنك التواصل معهم." : "Other entrepreneurs in your sector you can connect with."}</p>
      ${entrepreneurs.map(entrepreneurCardHtml).join("")}
      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "دليل تجريبي للعرض فقط." : "Mock directory for demo purposes only."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">🤝 ${LANG === "ar" ? "شبكة رواد الأعمال" : "Entrepreneur Network"}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function entrepreneurCardHtml(e) {
  return `<div class="ai-match-card" data-connect="${e.id}">
    <div class="title">${escapeHtml(e.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${escapeHtml(e.business)}</span></div>
    <div class="why">${LANG === "ar" ? "يبحث عن" : "Looking for"}: ${escapeHtml(e.lookingFor)}</div>
    <div style="font-size:12px;color:var(--text-faint);margin:4px 0;">${LANG === "ar" ? "سنوات النشاط" : "Years active"}: ${e.yearsActive} &nbsp;|&nbsp; ${escapeHtml(e.social)}</div>
    <div class="next" id="connectResult-${e.id}">
      <button class="ai-btn primary" onclick="connectWithEntrepreneur('${e.id}', '${escapeHtml(e.contact)}')">${LANG === "ar" ? "🤝 تواصل" : "🤝 Connect"}</button>
    </div>
  </div>`;
}

function connectWithEntrepreneur(id, contact) {
  const box = document.getElementById(`connectResult-${id}`);
  if (box) box.innerHTML = `<span style="font-size:12px;color:var(--good);">✓ ${LANG === "ar" ? "بريد التواصل" : "Contact email"}: ${escapeHtml(contact)}</span>`;
}
