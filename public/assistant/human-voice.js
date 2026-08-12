// ============================================================================
// تواصل مع إنسان (Contact / Human Help) والمساعد الصوتي (Voice Assistant).
// المساعد الصوتي لا يعيد بناء التعرف الصوتي — يستخدم toggleVoiceInput()/
// المكتوبة أصلاً في index.html عبر خطاف window.onAssistantVoiceTranscript
// (راجع handleVoiceTranscript في index.html) بدل تكرار منطق Web Speech API.
// ============================================================================

// ------------------------------- Human Handoff -------------------------------
// لا صندوق نص هنا — نبني "المشكلة" من محادثتك الفعلية مع الوكيل (state.chatHistory)
// بدل أن تشرحها من جديد في صندوق منفصل، فالملخص يعكس ما ناقشته فعلاً.
AiViews.human = function (container) {
  const hasHistory = (state.chatHistory || []).length > 0;
  container.innerHTML = `<h2 class="ai-view-title">👤 ${ta("navHuman")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "بنجهّز لك ملخص جاهز من محادثتك الحالية ترسله لموظف ريادة بدل ما تعيد الشرح من الصفر." : "We'll prepare a ready summary from your current chat to send to a Riyada staff member instead of re-explaining everything."}</p>
    ${hasHistory
      ? `<div class="ai-card"><button class="ai-btn primary" onclick="generateCaseSummary()">${LANG === "ar" ? "جهّز ملخص الحالة" : "Prepare case summary"}</button></div>`
      : `<div class="ai-empty">${LANG === "ar" ? "احكيلي أولاً عن وضعك أو مشكلتك في المحادثة الرئيسية، وبعدها أقدر أجهّز لك الملخص." : "Tell me about your situation or issue in the main chat first, then I can prepare the summary."}</div>
         <button class="ai-btn primary" onclick="askInChat('')">${LANG === "ar" ? "💬 اذهب للمحادثة" : "💬 Go to the chat"}</button>`}
    <div id="aiHumanResult"></div>`;
};
async function generateCaseSummary() {
  const transcript = (state.chatHistory || [])
    .map((m) => `${m.role === "assistant" ? (LANG === "ar" ? "الوكيل" : "Agent") : (LANG === "ar" ? "المستخدم" : "User")}: ${m.content}`)
    .join("\n");
  if (!transcript) return;
  const box = document.getElementById("aiHumanResult");
  box.innerHTML = `<div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;
  try {
    const { result } = await AssistantAPI.generateCaseSummary(getBusinessProfile(), transcript, LANG);
    if (result.raw) { box.innerHTML = `<div class="ai-card" style="white-space:pre-wrap;">${escapeHtml(result.raw)}</div>`; return; }
    const summaryText = buildSummaryText(result);
    box.innerHTML = `<div class="ai-card">
      <div class="ai-section"><div class="sec-title">${LANG === "ar" ? "المشروع" : "Business"}</div><div style="font-size:13px;">${escapeHtml(result.business || "")}</div></div>
      <div class="ai-section"><div class="sec-title">${LANG === "ar" ? "المشكلة" : "Issue"}</div><div style="font-size:13px;">${escapeHtml(result.issue || "")}</div></div>
      ${listSection(result.infoCollected, LANG === "ar" ? "المعلومات المجموعة" : "Information collected")}
      ${listSection(result.documents, LANG === "ar" ? "المستندات" : "Documents")}
      ${listSection(result.questionsForStaff, LANG === "ar" ? "أسئلة لموظف ريادة" : "Questions for Riyada staff")}
      <button class="ai-btn" onclick="copyCaseSummary(this)">${LANG === "ar" ? "📋 انسخ الملخص" : "📋 Copy summary"}</button>
    </div>`;
    box.dataset.summaryText = summaryText;
  } catch (e) { box.innerHTML = `<div class="ai-error">${ta("errorGeneric")}</div>`; }
}
function buildSummaryText(r) {
  const lines = [
    `${LANG === "ar" ? "المشروع" : "Business"}: ${r.business || ""}`,
    `${LANG === "ar" ? "المشكلة" : "Issue"}: ${r.issue || ""}`,
    "", `${LANG === "ar" ? "المعلومات المجموعة" : "Information collected"}:`, ...(r.infoCollected || []).map((x) => `- ${x}`),
    "", `${LANG === "ar" ? "المستندات" : "Documents"}:`, ...(r.documents || []).map((x) => `- ${x}`),
    "", `${LANG === "ar" ? "أسئلة لموظف ريادة" : "Questions for staff"}:`, ...(r.questionsForStaff || []).map((x) => `- ${x}`),
  ];
  return lines.join("\n");
}
function copyCaseSummary(btn) {
  const box = document.getElementById("aiHumanResult");
  navigator.clipboard?.writeText(box.dataset.summaryText || "").then(() => {
    const old = btn.textContent;
    btn.textContent = LANG === "ar" ? "✓ تم النسخ" : "✓ Copied";
    setTimeout(() => { btn.textContent = old; }, 1500);
  });
}

// ------------------------------- Voice Assistant -------------------------------
AiViews.voice = function (container) {
  container.innerHTML = `<h2 class="ai-view-title">🎙️ ${ta("navVoice")}</h2>
    <p class="ai-view-sub">${LANG === "ar" ? "تكلّم بصوتك، وبنحوّله لنص ونرسله للمساعد مباشرة." : "Speak naturally — we'll transcribe it and send it straight to the assistant."}</p>
    <div class="ai-card" style="text-align:center;padding:32px 16px;">
      <button class="mic-btn" id="aiVoiceMicBtn" style="width:64px;height:64px;font-size:24px;margin:0 auto 14px auto;" onclick="startAssistantVoice()">🎤</button>
      <div id="aiVoiceStatus" style="font-size:12.5px;color:var(--text-faint);min-height:18px;"></div>
      <div id="aiVoiceTranscript" style="margin-top:14px;font-size:14px;color:var(--text);white-space:pre-wrap;"></div>
    </div>`;
};
function startAssistantVoice() {
  window.onAssistantVoiceTranscript = (text) => {
    const box = document.getElementById("aiVoiceTranscript");
    if (box) box.textContent = text;
    const status = document.getElementById("aiVoiceStatus");
    if (status) status.textContent = LANG === "ar" ? "تم — يتم إرساله للمحادثة..." : "Got it — sending to the assistant...";
    // نمرّر النص لنفس محرك المحادثة الحقيقي الموجود أصلاً بدل بناء رد منفصل هنا.
    closeAssistant();
    const composer = document.getElementById("textInput");
    if (composer) { composer.value = text; sendFree(); }
    window.onAssistantVoiceTranscript = null;
  };
  if (typeof toggleVoiceInput === "function") toggleVoiceInput();
}
