// ============================================================================
// مسارات المساعد الذكي الكامل (AI Business Assistant) — طبقة API منفصلة عن
// حلقة الوكيل الأصلية في server.js (لا تلمسها، لتفادي أي كسر لمسار محادثة يعمل
// فعلياً). القسم الحتمي (roadmap/services/funding/eligibility/documents/
// financial-calc/applications) لا يستدعي أي نموذج لغوي إطلاقاً — سريع ومضمون.
// القسم التوليدي (evaluate-idea/business-plan/explain/case-summary) يستدعي
// النموذج المُفعّل حالياً على السيرفر عبر نداء واحد بسيط (بدون حلقة أدوات).
// ============================================================================

const express = require("express");
const data = require("./assistantData");

// نسخة "نداء واحد" من نفس منطق اختيار المزوّد الموجود في server.js — مكرَّرة
// هنا عمداً بدل استيراد حلقة الوكيل الأصلية، حتى لا نلمس مساراً يعمل فعلياً
// وتم إصلاحه للتو (راجع server.js: runAnthropicAgentLoop/runOpenAiAgentLoop).
async function callModelOnce(system, userText, cfg, maxTokens = 900) {
  if (cfg.usingGateway) {
    const upstream = await fetch(`${cfg.GATEWAY_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.GATEWAY_API_KEY}` },
      body: JSON.stringify({
        model: cfg.MODEL_NAME,
        max_tokens: maxTokens,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, { role: "user", content: userText }],
      }),
    });
    const resData = await upstream.json();
    if (!upstream.ok) {
      const err = new Error(resData?.error?.message || resData?.error || "خطأ من البوابة المركزية");
      err.status = upstream.status;
      throw err;
    }
    const text = (resData?.choices?.[0]?.message?.content || "").trim();
    if (!text) throw new Error("رد فارغ من البوابة المركزية");
    return text;
  }

  if (cfg.usingDirectAnthropic) {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.ANTHROPIC_API_KEY,
        "anthropic-version": cfg.ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: cfg.ANTHROPIC_MODEL_NAME,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userText }],
      }),
    });
    const resData = await upstream.json();
    if (!upstream.ok) {
      const err = new Error(resData?.error?.message || "خطأ من Anthropic API");
      err.status = upstream.status;
      throw err;
    }
    const text = (resData.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) throw new Error("رد فارغ من Anthropic API");
    return text;
  }

  if (cfg.usingHuggingFace) {
    const upstream = await fetch(`${cfg.HF_ROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.HF_API_TOKEN}` },
      body: JSON.stringify({
        model: cfg.HF_MODEL,
        max_tokens: maxTokens,
        temperature: 0.4,
        messages: [{ role: "system", content: system }, { role: "user", content: userText }],
      }),
    });
    const resData = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const err = new Error(resData?.error?.message || resData?.error || "خطأ من Hugging Face Inference Providers");
      err.status = upstream.status;
      throw err;
    }
    const text = (resData?.choices?.[0]?.message?.content || "").trim();
    if (!text) throw new Error("رد فارغ من Hugging Face Inference Providers");
    return text;
  }

  const err = new Error("لا يوجد اتصال مضبوط بأي نموذج على السيرفر (راجع server/.env)");
  err.status = 500;
  throw err;
}

// يحاول استخراج أول كائن JSON صالح من رد النموذج (قد يحيطه النموذج بنص أو ```json).
// عند الفشل، يعيد النص الخام تحت مفتاح raw بدل تعطّل الطلب بالكامل — تدهور
// لطيف (graceful degradation) بدل رسالة خطأ للمستخدم.
function safeParseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (e) { /* fall through */ }
  }
  return { raw: text };
}

function createAssistantRouter(cfg) {
  const router = express.Router();

  // ---- حتمي، بدون نموذج لغوي ----

  router.get("/roadmap", (req, res) => {
    res.json(data.buildRoadmap(req.query.sector || null));
  });

  router.post("/match-services", (req, res) => {
    const { profile, lang } = req.body || {};
    res.json({ matches: data.matchServices(profile || {}, lang || "ar") });
  });

  router.post("/match-funding", (req, res) => {
    const { profile, lang } = req.body || {};
    res.json({ matches: data.matchFunding(profile || {}, lang || "ar") });
  });

  router.post("/eligibility", (req, res) => {
    const { answers, lang } = req.body || {};
    res.json(data.evaluateEligibility(answers || {}, lang || "ar"));
  });

  router.get("/documents", (req, res) => {
    const ids = (req.query.ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    res.json({ documents: data.buildDocumentChecklist(ids) });
  });

  router.get("/gov-bodies", (req, res) => {
    res.json({ bodies: data.GOV_BODIES, sectorBody: data.SECTOR_BODY });
  });

  router.get("/form-field", (req, res) => {
    const { id, sector, lang } = req.query;
    const field = data.explainFormField(id, sector, lang || "ar");
    if (!field) return res.status(404).json({ error: "حقل غير معروف" });
    res.json(field);
  });

  router.get("/form-fields", (req, res) => {
    res.json({ fields: data.FORM_FIELD_DEFS.map((f) => ({ id: f.id, labelAr: f.labelAr, labelEn: f.labelEn })) });
  });

  router.post("/financial-calc", (req, res) => {
    res.json(data.computeFinancials((req.body || {}).inputs || {}));
  });

  router.get("/applications/sample", (req, res) => {
    res.json({ applications: data.seedApplications({ sector: req.query.sector || null }) });
  });

  // ---- توليدي، يستدعي النموذج مرة واحدة (بدون حلقة أدوات) ----

  router.post("/evaluate-idea", async (req, res) => {
    try {
      const { text, lang } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ error: "الفكرة مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const system = useAr
        ? "أنت مستشار أعمال عُماني. قيّم فكرة المستخدم بواقعية دون المبالغة أو ضمان النجاح. أعد الجواب حصراً كـ JSON بالمفاتيح التالية (نص عربي بسيط، جمل قصيرة): targetCustomers, demand, competition, requirements (مصفوفة نصوص), risks (مصفوفة نصوص), costs, questions (مصفوفة أسئلة على المستخدم الإجابة عليها قبل البدء). لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani business advisor. Evaluate the user's idea realistically, without hype or guaranteeing success. Reply strictly as JSON with keys: targetCustomers, demand, competition, requirements (array), risks (array), costs, questions (array). No text outside the JSON object.";
      const raw = await callModelOnce(system, text, cfg, 1200);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/business-plan", async (req, res) => {
    try {
      const { profile, answers, lang } = req.body || {};
      if (!profile && !answers) return res.status(400).json({ error: "بيانات المشروع مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify({ profile: profile || {}, answers: answers || {} });
      const system = useAr
        ? "أنت مستشار أعمال عُماني. بناءً على بيانات المشروع المُعطاة، اكتب مسودة خطة عمل أولية بسيطة. أعد الجواب حصراً كـ JSON بالمفاتيح: description, problem, solution, targetCustomers, productsServices, competitors, marketing, operations, suppliers, staffing, startupCosts, expectedRevenue, risks, growthPlan — كل قيمة فقرة نصية عربية قصيرة وبسيطة. لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani business advisor. Based on the given business data, draft a simple initial business plan. Reply strictly as JSON with keys: description, problem, solution, targetCustomers, productsServices, competitors, marketing, operations, suppliers, staffing, startupCosts, expectedRevenue, risks, growthPlan — each value a short plain-language paragraph. No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 1800);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/explain", async (req, res) => {
    try {
      const { term, lang } = req.body || {};
      if (!term || !term.trim()) return res.status(400).json({ error: "النص مطلوب" });
      const useAr = (lang || "ar") === "ar";
      const system = useAr
        ? "اشرح المصطلح أو الجملة الحكومية/التجارية التالية بعربية بسيطة عُمانية يفهمها شخص لم يتعامل مع جهات حكومية من قبل. لا تغيّر الاسم الرسمي نفسه، فقط اشرح معناه في جملتين أو ثلاث. لا تخترع تفاصيل غير مؤكدة."
        : "Explain the following government/business term or sentence in simple plain English for someone who has never dealt with government platforms before. Keep the official name as-is, just explain its meaning in 2-3 short sentences. Don't invent unverified details.";
      const raw = await callModelOnce(system, term, cfg, 400);
      res.json({ explanation: raw });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/case-summary", async (req, res) => {
    try {
      const { profile, issue, lang } = req.body || {};
      if (!issue || !issue.trim()) return res.status(400).json({ error: "وصف المشكلة مطلوب" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify({ profile: profile || {}, issue });
      const system = useAr
        ? "بناءً على بيانات المشروع ووصف المشكلة المُعطاة، جهّز ملخص حالة منظّم ليرسله المستخدم لموظف ريادة بدل إعادة شرح كل شيء من الصفر. أعد الجواب حصراً كـ JSON بالمفاتيح: business (وصف مختصر للمشروع), issue (المشكلة بجملة واحدة), infoCollected (مصفوفة نقاط عن ما هو معروف عن المشروع), documents (مصفوفة أسماء مستندات ذات صلة إن وُجدت), questionsForStaff (مصفوفة أسئلة محددة يحتاج الموظف الإجابة عليها). لا تكتب أي نص خارج كائن الـ JSON."
        : "Based on the given business data and issue description, prepare a structured case summary for the user to send a Riyada staff member instead of re-explaining everything. Reply strictly as JSON with keys: business (short business description), issue (one-sentence issue), infoCollected (array of known facts about the business), documents (array of relevant document names, if any), questionsForStaff (array of specific questions staff need to answer). No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 900);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  return router;
}

module.exports = { createAssistantRouter };
