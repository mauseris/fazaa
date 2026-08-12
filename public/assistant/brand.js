// ============================================================================
// الهوية والشعار (Brand Identity & Logo Generator) — لا يوجد صندوق نص هنا؛
// النموذج يقترح أسلوباً وألواناً ومفاهيم شعار بناءً على بيانات المشروع فقط.
// لا يوجد اتصال بمولّد صور حقيقي، فنعرض "مفاهيم" الشعار كبطاقات CSS بسيطة
// (لون + أيقونة + وصف) بدل صور مولَّدة، ومُعلَّمة بوضوح كمفاهيم توضيحية.
// ============================================================================

const ICON_HINT_MAP = [
  [/leaf|ورقة|نخيل|palm/i, "🌿"], [/drop|قطرة|water|ماء/i, "💧"], [/star|نجمة/i, "⭐"],
  [/sun|شمس/i, "☀️"], [/flower|زهرة|وردة/i, "🌸"], [/wave|موجة/i, "🌊"],
  [/mountain|جبل/i, "⛰️"], [/diamond|ماسة|elegant/i, "💎"], [/circle|دائرة/i, "⚪"],
  [/heart|قلب/i, "🧡"], [/spark|بريق/i, "✨"], [/shield|درع/i, "🛡️"],
];
function iconForHint(hint) {
  const h = hint || "";
  for (const [re, emoji] of ICON_HINT_MAP) if (re.test(h)) return emoji;
  return "✦";
}

AiViews.brand = function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const existing = state.assistant.brandIdentity;
  container.innerHTML = `<h2 class="ai-view-title">🎨 ${ta("navBrand")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "هوية بصرية ومفاهيم شعار مبنية على مشروعك — مفاهيم توضيحية وليست تصاميم نهائية." : "A visual identity and logo concepts built from your business — illustrative concepts, not final artwork."}</p>
    <button class="ai-btn primary" onclick="runBrandGeneration()">${existing ? (LANG === "ar" ? "🔁 إعادة التوليد" : "🔁 Regenerate") : (LANG === "ar" ? "✨ ولّد الهوية" : "✨ Generate identity")}</button>
    <div id="aiBrandResult" style="margin-top:14px;">${existing ? renderBrandResult(existing) : ""}</div>`;
};

async function runBrandGeneration() {
  ensureAssistantState();
  const box = document.getElementById("aiBrandResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateBrandIdentity(getBusinessProfile(), LANG);
    if (result.raw) { box.innerHTML = `<div class="ai-card" style="white-space:pre-wrap;">${escapeHtml(result.raw)}</div>`; return; }
    state.assistant.brandIdentity = result;
    if (typeof saveState === "function") saveState();
    box.innerHTML = renderBrandResult(result);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderBrandResult(r) {
  const businessName = (state.assistant && state.assistant.businessName) || state.idea || "";
  const colors = r.colors || {};
  const swatch = (c, label) => c ? `
    <div style="text-align:center;">
      <div style="width:44px;height:44px;border-radius:10px;background:${escapeHtml(c.hex || "#ccc")};border:1px solid var(--line);margin:0 auto 4px;"></div>
      <div style="font-size:10.5px;color:var(--text-faint);">${escapeHtml(c.name || c.nameAr || "")}</div>
      <div style="font-size:10px;color:var(--text-faint);font-family:'IBM Plex Mono';">${escapeHtml(c.hex || "")}</div>
    </div>` : "";
  return `
    <div class="ai-card">
      <div class="row-between"><span style="font-weight:800;">${LANG === "ar" ? "الأسلوب" : "Style"}</span><b>${escapeHtml(r.brandStyle || "")}</b></div>
      <div style="font-size:12.5px;color:var(--text-dim);margin-top:4px;">${escapeHtml(r.brandVoice || "")}</div>
      <div style="display:flex;gap:16px;margin-top:12px;">
        ${swatch(colors.primary)}${swatch(colors.secondary)}${swatch(colors.accent)}
      </div>
    </div>
    ${(r.concepts || []).map((c, i) => `
      <div class="ai-card" style="margin-top:10px;">
        <div class="row-between" style="margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(135deg, ${escapeHtml((colors.primary && colors.primary.hex) || "#ccc")}, ${escapeHtml((colors.accent && colors.accent.hex) || "#eee")});">
              ${iconForHint(c.iconHint)}
            </div>
            <div>
              <div style="font-weight:800;font-size:14px;">${escapeHtml(businessName || (LANG === "ar" ? "مفهوم " + (i + 1) : "Concept " + (i + 1)))}</div>
              <div style="font-size:11px;color:var(--text-faint);">${LANG === "ar" ? "مفهوم" : "Concept"} ${i + 1}</div>
            </div>
          </div>
        </div>
        <div style="font-size:12.5px;color:var(--text-dim);"><b>${LANG === "ar" ? "الأسلوب:" : "Style:"}</b> ${escapeHtml(c.style || c.styleAr || "")}</div>
        <div style="font-size:12.5px;color:var(--text-dim);"><b>${LANG === "ar" ? "الخط المقترح:" : "Suggested font:"}</b> ${escapeHtml(c.fontStyle || c.fontStyleAr || "")}</div>
      </div>
    `).join("")}
    <div class="ai-disclaimer">⚠️ ${LANG === "ar" ? "مفاهيم بصرية توضيحية من الذكاء الاصطناعي — ليست ملفات شعار نهائية جاهزة للاستخدام." : "AI-generated illustrative visual concepts — not final, ready-to-use logo files."}</div>
  `;
}
