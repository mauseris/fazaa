// ============================================================================
// شبكة رواد الأعمال (Entrepreneur Network) — كتالوج تجريبي حتمي (لا نموذج
// لغوي). "تواصل" يعرض معلومات الاتصال المتاحة فقط — لا يوجد نظام رسائل حقيقي
// (بنفس منطق الموردين/المؤثرين/المستقلين). مجموعات النقاش والفعاليات أدناه
// محتوى توضيحي ثابت (demo) موسوم بوضوح، وليس نشاطاً مجتمعياً حقيقياً.
// ============================================================================

AiViews.network = async function (container) {
  if (!requireIdea(container)) return;
  container.innerHTML = `<h2 class="ai-view-title">🤝 ${ta("navNetwork")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const p = getBusinessProfile();
    const cityLabel = p.city ? (LANG === "ar" ? (CITIES[p.city]?.label || p.city) : (CITIES[p.city]?.label_en || p.city)) : null;
    const [{ entrepreneurs }, { stories }] = await Promise.all([
      AssistantAPI.matchEntrepreneurs(p.sector, cityLabel, LANG),
      AssistantAPI.getSuccessStories(LANG),
    ]);
    const mentors = entrepreneurs.filter((e) => e.availableForMentoring);
    const sameCity = cityLabel ? entrepreneurs.filter((e) => e.city === cityLabel).length : 0;
    const operatingCount = entrepreneurs.filter((e) => e.operating).length;

    container.innerHTML = `<h2 class="ai-view-title">🤝 ${ta("navNetwork")}</h2>
      <div class="ai-card">
        <h3>📊 ${LANG === "ar" ? "إحصائيات الشبكة" : "Network stats"}</h3>
        <div class="row-between"><span>${LANG === "ar" ? "رواد أعمال في نفس المجال" : "Entrepreneurs in your field"}</span><b>${entrepreneurs.length}</b></div>
        ${cityLabel ? `<div class="row-between"><span>${LANG === "ar" ? "في نفس المنطقة" : "In your area"} (${escapeHtml(cityLabel)})</span><b>${sameCity}</b></div>` : ""}
        <div class="row-between"><span>${LANG === "ar" ? "يعملون فعلياً" : "Currently operating"}</span><b>${operatingCount}</b></div>
        <div class="row-between"><span>${LANG === "ar" ? "مستعدون للإرشاد" : "Available for mentoring"}</span><b>${mentors.length}</b></div>
      </div>

      <h3 style="margin-top:14px;">🌟 ${LANG === "ar" ? "رواد أعمال مشابهون لك" : "Entrepreneurs similar to you"}</h3>
      ${entrepreneurs.map(entrepreneurCardHtml).join("")}

      ${mentors.length ? `<h3 style="margin-top:14px;">🎯 ${LANG === "ar" ? "مستعدون للإرشاد" : "Available for mentorship"}</h3>
        ${mentors.slice(0, 5).map(entrepreneurCardHtml).join("")}` : ""}

      ${stories.length ? `<h3 style="margin-top:14px;">📊 ${LANG === "ar" ? "قصص نجاح ملهمة" : "Inspiring success stories"}</h3>
        ${stories.map(successStoryHtml).join("")}` : ""}

      <h3 style="margin-top:14px;">📋 ${LANG === "ar" ? "مجموعات نقاش (مثال توضيحي)" : "Discussion groups (illustrative example)"}</h3>
      ${discussionGroupsHtml()}

      <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "بيانات رواد الأعمال ومجموعات النقاش أعلاه تجريبية للعرض فقط — لا يوجد نظام رسائل أو مجتمع حقيقي متصل بها بعد." : "The entrepreneur data and discussion groups above are mock demo content — there is no real messaging system or live community behind them yet."}</div>`;
  } catch (e) { container.innerHTML = `<h2 class="ai-view-title">🤝 ${ta("navNetwork")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`; }
};

function entrepreneurCardHtml(e) {
  const statusDot = e.operating ? "🟢" : "🟠";
  return `<div class="ai-match-card">
    <div class="title">${statusDot} ${escapeHtml(e.name)} <span style="font-weight:400;font-size:11.5px;color:var(--text-faint);">— ${escapeHtml(e.business)}</span></div>
    <div class="why">${escapeHtml(e.city)} · ${escapeHtml(e.stage)}</div>
    ${e.operating ? `<div style="font-size:12px;color:var(--text-faint);margin:4px 0;">
      ${LANG === "ar" ? "الإيرادات الشهرية" : "Monthly revenue"}: <b>${escapeHtml(e.monthlyRevenue)}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "العملاء" : "Customers"}: <b>${e.customers}</b> &nbsp;|&nbsp;
      ${LANG === "ar" ? "التقييم" : "Rating"}: <b>${e.rating}/5</b>
    </div>` : ""}
    <div style="font-size:12px;color:var(--good);margin-bottom:2px;">✅ ${(e.skills || []).join(" · ")}</div>
    <div style="font-size:12px;color:var(--text-dim);">${LANG === "ar" ? "يبحث عن" : "Looking for"}: ${(e.lookingFor || []).join(" · ")}</div>
    ${e.availableForMentoring ? `<span class="ai-level-tag recommended" style="margin-top:6px;display:inline-block;">${LANG === "ar" ? "🎯 مستعد للإرشاد" : "🎯 Available for mentoring"}</span>` : ""}
    <div class="next" style="margin-top:8px;"><span style="font-size:12px;color:var(--text-faint);">${escapeHtml(e.contact)}</span>
      <span style="font-size:11px;color:var(--text-faint);">${escapeHtml(e.social)}</span></div>
  </div>`;
}

function successStoryHtml(e) {
  return `<div class="ai-card">
    <div style="font-weight:700;font-size:13px;">🌟 ${escapeHtml(e.name)} — ${escapeHtml(e.business)}</div>
    <div style="font-size:12px;color:var(--text-dim);margin:6px 0;">${escapeHtml(e.city)} · ${escapeHtml(e.stage)} · ${LANG === "ar" ? "الإيرادات" : "Revenue"}: ${escapeHtml(e.monthlyRevenue)}</div>
    <div style="font-size:12px;color:var(--text-faint);">${e.customers} ${LANG === "ar" ? "عميل" : "customers"} · ${e.followers} ${LANG === "ar" ? "متابع" : "followers"} · ${e.rating}/5</div>
  </div>`;
}

// محتوى توضيحي ثابت (demo) — راجع التنويه أعلى الصفحة. لا يمثّل نشاطاً حقيقياً.
function discussionGroupsHtml() {
  const groups = LANG === "ar" ? [
    { name: "رواد الأعمال في مسقط", members: 12, topics: ["تحديات التسويق في مسقط", "أفضل الموردين المحليين", "نصائح التغليف"] },
    { name: "مشاريع العناية بالبشرة", members: 23, topics: ["أفضل المكونات الطبيعية", "تجارب مع الموردين", "استراتيجيات التسعير"] },
    { name: "ريادة الأعمال النسائية", members: 34, topics: ["تحديات المرأة في العمل", "تمويل المشاريع", "التوازن بين العمل والحياة"] },
  ] : [
    { name: "Entrepreneurs in Muscat", members: 12, topics: ["Marketing challenges in Muscat", "Best local suppliers", "Packaging tips"] },
    { name: "Skincare Businesses", members: 23, topics: ["Best natural ingredients", "Supplier experiences", "Pricing strategies"] },
    { name: "Women in Entrepreneurship", members: 34, topics: ["Work challenges for women", "Business financing", "Work-life balance"] },
  ];
  return groups.map((g) => `<div class="ai-card">
    <div class="row-between" style="margin-bottom:6px;"><span style="font-weight:700;color:var(--text);">${escapeHtml(g.name)}</span><span style="font-size:11px;color:var(--text-faint);">${g.members} ${LANG === "ar" ? "مشارك" : "members"}</span></div>
    <div style="font-size:12px;color:var(--text-dim);">${g.topics.map(escapeHtml).join(" · ")}</div>
  </div>`).join("");
}
