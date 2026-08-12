// ============================================================================
// المحتوى (Content Generator) — محتوى جاهز للنشر (بايو إنستقرام، وصف منتج،
// نبذة عنا، رسالة ترحيب واتساب) يُولَّد حصراً من بيانات المشروع، بدون أي
// صندوق نص إضافي — فقط نسخ ولصق.
// ============================================================================

const CONTENT_SECTIONS = [
  ["instagramBio", { ar: "📝 بايو إنستقرام", en: "📝 Instagram Bio" }],
  ["productDescription", { ar: "📝 وصف المنتج", en: "📝 Product Description" }],
  ["aboutUs", { ar: "📝 نبذة عنا", en: "📝 About Us" }],
  ["whatsappGreeting", { ar: "📝 رسالة واتساب بزنس", en: "📝 WhatsApp Business Message" }],
];

AiViews.content = function (container) {
  if (!requireIdea(container)) return;
  ensureAssistantState();
  const existing = state.assistant.generatedContent;
  container.innerHTML = `<h2 class="ai-view-title">📝 ${ta("navContent")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "محتوى جاهز للنسخ مباشرة، مبني على مشروعك." : "Ready-to-copy content built from your business."}</p>
    <button class="ai-btn primary" onclick="runContentGeneration()">${existing ? (LANG === "ar" ? "🔁 إعادة التوليد" : "🔁 Regenerate") : (LANG === "ar" ? "✨ ولّد المحتوى" : "✨ Generate content")}</button>
    <div id="aiContentResult" style="margin-top:14px;">${existing ? renderContentSections(existing) : ""}</div>`;
};

async function runContentGeneration() {
  ensureAssistantState();
  const box = document.getElementById("aiContentResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateContent(getBusinessProfile(), LANG);
    state.assistant.generatedContent = result;
    if (typeof saveState === "function") saveState();
    box.innerHTML = renderContentSections(result);
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}

function renderContentSections(r) {
  if (r.raw) return `<div class="ai-card" style="white-space:pre-wrap;">${escapeHtml(r.raw)}</div>`;
  return CONTENT_SECTIONS.map(([key, label]) => r[key] ? `
    <div class="ai-card" style="margin-bottom:10px;" data-content-key="${key}">
      <div class="row-between"><span style="font-weight:700;">${LANG === "ar" ? label.ar : label.en}</span>
        <button class="ai-btn" onclick="copyContentSection('${key}', this)">${LANG === "ar" ? "📋 نسخ" : "📋 Copy"}</button></div>
      <div style="font-size:15px;color:var(--text-dim);white-space:pre-wrap;line-height:1.8;margin-top:6px;">${escapeHtml(r[key])}</div>
    </div>
  ` : "").join("");
}

function copyContentSection(key, btn) {
  const text = (state.assistant && state.assistant.generatedContent && state.assistant.generatedContent[key]) || "";
  navigator.clipboard?.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = LANG === "ar" ? "✓ تم النسخ" : "✓ Copied";
    setTimeout(() => { btn.textContent = old; }, 1500);
  });
}
