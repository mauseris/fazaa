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
const places = require("./places");
const osm = require("./osmPlaces");

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

  router.get("/product-categories", (req, res) => {
    res.json({ categories: data.getProductCategories(req.query.sector || null) });
  });

  router.post("/suppliers", (req, res) => {
    const { sector, lang } = req.body || {};
    res.json({ suppliers: data.matchSuppliers(sector || null, lang || "ar") });
  });

  // سلسلة رجوع تلقائي ثلاثية المستويات — نفس فلسفة اختيار مزوّد المحادثة في
  // server.js: أفضل مصدر متاح أولاً، وأي فشل (مفتاح غير صالح، لا نتائج، خطأ
  // شبكة، قطاع بلا معنى جغرافي) ينتقل للمستوى التالي بدل كسر الميزة:
  //   1) Google Places (إن وُجد GOOGLE_MAPS_API_KEY) — أغنى بيانات (تقييمات،
  //      أوقات عمل)، لكن يحتاج فوترة.
  //   2) OpenStreetMap Overpass (server/osmPlaces.js) — مجاني بالكامل بدون
  //      مفتاح، لكن تغطية أقل كثافة للأعمال العُمانية ولا يوفر تقييمات/أوقات عمل.
  //   3) الكتالوج التجريبي المحلي (assistantData.js) — شبكة أمان أخيرة، يعمل دائماً.
  router.post("/competitors", async (req, res) => {
    const { sector, city, lang, lat, lng } = req.body || {};
    const L = lang || "ar";
    // إحداثيات دقيقة اختارها المستخدم فعلياً على الخريطة (competitors.js) بدل
    // مركز المدينة التقريبي الافتراضي — تحقق أساسي من الصحة قبل استخدامها في
    // نداءات خارجية (Google/Overpass).
    const center = (typeof lat === "number" && typeof lng === "number" &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
      ? { lat, lng } : null;

    if (cfg.GOOGLE_MAPS_API_KEY) {
      try {
        const [competitors, rentals] = await Promise.all([
          places.searchCompetitors(cfg.GOOGLE_MAPS_API_KEY, sector || null, city || null, L, center),
          places.searchNearbyAgencies(cfg.GOOGLE_MAPS_API_KEY, city || null, L, center),
        ]);
        // competitors === null يعني قطاع بلا معنى جغرافي (مثال: ecommerce) — رجوع تجريبي
        if (competitors !== null) {
          return res.json({
            source: "google",
            competitors: competitors.length ? competitors : data.matchCompetitors(sector || null, city || null, L),
            rentals: rentals.length ? rentals : data.matchRentals(city || null, L),
            rentalsSource: rentals.length ? "google" : "mock",
          });
        }
      } catch (e) {
        console.warn(`⚠️  Google Places فشل (${e.message}) — تجربة OpenStreetMap.`);
      }
    }

    try {
      const [competitors, agencies] = await Promise.all([
        osm.searchCompetitors(sector || null, city || null, L, center),
        osm.searchNearbyAgencies(city || null, L, center),
      ]);
      if (competitors !== null && competitors.length) {
        return res.json({
          source: "osm",
          competitors,
          rentals: agencies.length ? agencies : data.matchRentals(city || null, L),
          rentalsSource: agencies.length ? "osm" : "mock",
        });
      }
    } catch (e) {
      console.warn(`⚠️  OpenStreetMap Overpass فشل (${e.message}) — رجوع للكتالوج التجريبي.`);
    }

    res.json({
      source: "mock",
      competitors: data.matchCompetitors(sector || null, city || null, L),
      rentals: data.matchRentals(city || null, L),
      rentalsSource: "mock",
    });
  });

  router.post("/influencers", (req, res) => {
    const { sector, lang } = req.body || {};
    res.json({ influencers: data.matchInfluencers(sector || null, lang || "ar") });
  });

  router.post("/pricing-suggestion", (req, res) => {
    const { unitCost, sector, lang } = req.body || {};
    res.json(data.suggestPricing(unitCost || 0, sector || null, lang || "ar"));
  });

  router.post("/restocking-alerts", (req, res) => {
    const { sector, lang } = req.body || {};
    res.json({ alerts: data.getRestockingAlerts(sector || null, lang || "ar") });
  });

  router.post("/freelancers", (req, res) => {
    const { category, lang } = req.body || {};
    res.json({ freelancers: data.matchFreelancers(category || null, lang || "ar") });
  });

  router.post("/cashflow-simulation", (req, res) => {
    res.json(data.computeCashFlowSimulation((req.body || {}).inputs || {}));
  });

  router.post("/entrepreneurs", (req, res) => {
    const { sector, city, lang } = req.body || {};
    res.json({ entrepreneurs: data.matchEntrepreneurs(sector || null, city || null, lang || "ar") });
  });

  router.get("/mentors", (req, res) => {
    res.json({ mentors: data.getMentors(req.query.lang || "ar") });
  });

  router.get("/success-stories", (req, res) => {
    res.json({ stories: data.getSuccessStories(req.query.lang || "ar") });
  });

  // ---- توليدي، يستدعي النموذج مرة واحدة (بدون حلقة أدوات) ----

  router.post("/evaluate-idea", async (req, res) => {
    try {
      const { text, lang } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ error: "الفكرة مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      // تحليل SWOT كامل بدل تقييم عام — أقرب لما يحتاجه صاحب مشروع فعلياً قبل البدء.
      const system = useAr
        ? "أنت مستشار أعمال عُماني. حلّل فكرة المستخدم بواقعية عبر تحليل SWOT دون المبالغة أو ضمان النجاح. أعد الجواب حصراً كـ JSON بالمفاتيح التالية (نص عربي بسيط، جمل قصيرة): strengths (مصفوفة نقاط قوة), weaknesses (مصفوفة نقاط ضعف), opportunities (مصفوفة فرص), threats (مصفوفة تهديدات), targetMarket (فقرة عن حجم السوق والعميل المستهدف والموقع والسعر المناسب), validationQuestions (مصفوفة أسئلة على المستخدم الإجابة عنها قبل البدء), nextSteps (مصفوفة خطوات عملية قادمة). لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani business advisor. Analyze the user's idea realistically via a SWOT analysis, without hype or guaranteeing success. Reply strictly as JSON with keys: strengths (array), weaknesses (array), opportunities (array), threats (array), targetMarket (a paragraph on market size, target customer, location, and suitable price point), validationQuestions (array of questions the user should answer before starting), nextSteps (array of concrete next actions). No text outside the JSON object.";
      const raw = await callModelOnce(system, text, cfg, 3000);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/business-names", async (req, res) => {
    try {
      const { profile, lang } = req.body || {};
      if (!profile || !profile.idea) return res.status(400).json({ error: "بيانات المشروع مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify(profile);
      const system = useAr
        ? "أنت خبير تسمية علامات تجارية عُماني. بناءً على بيانات المشروع المُعطاة، ولّد ١٠ اقتراحات أسماء تجارية مناسبة. أعد الجواب حصراً كـ JSON بالمفتاح names: مصفوفة من ١٠ عناصر، كل عنصر بالمفاتيح: arabicName, englishName, transliteration, meaning (شرح مختصر لمعنى الاسم), whyItFits (سطر واحد يشرح ملاءمته لهذا المشروع تحديداً), memorabilityScore (رقم من ١ إلى ١٠), suggestedInstagramHandle, suggestedTiktokHandle. لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani brand-naming expert. Based on the given business data, generate 10 suitable business-name suggestions. Reply strictly as JSON with key names: an array of 10 items, each with keys: arabicName, englishName, transliteration, meaning (a short explanation of what the name means), whyItFits (one line on why it fits this specific business), memorabilityScore (a number 1-10), suggestedInstagramHandle, suggestedTiktokHandle. No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 3200);
      const result = safeParseJson(raw);
      if (Array.isArray(result.names)) {
        result.names = result.names.map((n) => ({
          ...n,
          domainAvailable: null, // لا يوجد اتصال حقيقي بمزوّد نطاقات — لا نؤكد التوفر أبداً
        }));
      }
      res.json({ result });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/brand-identity", async (req, res) => {
    try {
      const { profile, lang } = req.body || {};
      if (!profile || !profile.idea) return res.status(400).json({ error: "بيانات المشروع مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify(profile);
      const system = useAr
        ? "أنت مصمم هوية تجارية عُماني. بناءً على بيانات المشروع، اقترح هوية بصرية متكاملة. أعد الجواب حصراً كـ JSON بالمفاتيح: brandStyle (كلمة أو كلمتين تصف الأسلوب), brandVoice (نبرة الصوت التسويقية بجملة), colors: كائن بالمفاتيح primary, secondary, accent (كل قيمة كائن {hex, nameAr} بألوان متناسقة فعلياً وأكواد hex صحيحة), concepts: مصفوفة من ٣ عناصر لمفاهيم شعار مختلفة، كل عنصر بالمفاتيح styleAr (وصف الأسلوب البصري), iconHint (اسم أيقونة/رمز بسيط تصف الشعار مثل 'ورقة نخيل' أو 'قطرة ماء', بالإنجليزية وبكلمة أو كلمتين فقط تصف شكلاً بصرياً بسيطاً), fontStyleAr (وصف نوع الخط المناسب). لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani brand identity designer. Based on the business data, propose a complete visual identity. Reply strictly as JSON with keys: brandStyle (a word or two describing the style), brandVoice (one sentence on the marketing tone), colors: an object with keys primary, secondary, accent (each value an object {hex, name} with genuinely harmonious colors and valid hex codes), concepts: an array of 3 different logo concepts, each with keys style (visual style description), iconHint (a one-two word name of a simple icon/symbol for the logo, e.g. 'palm leaf' or 'water drop'), fontStyle (description of a suitable font style). No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 1800);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/content", async (req, res) => {
    try {
      const { profile, lang } = req.body || {};
      if (!profile || !profile.idea) return res.status(400).json({ error: "بيانات المشروع مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify(profile);
      const system = useAr
        ? "أنت كاتب محتوى تسويقي عُماني. بناءً على بيانات المشروع، اكتب محتوى جاهز للنشر مباشرة. أعد الجواب حصراً كـ JSON بالمفاتيح: instagramBio (أقل من ١٥٠ حرفاً مع إيموجي مناسبة), productDescription (فقرة قصيرة لوصف منتج/خدمة رئيسية), aboutUs (فقرة عن قصة المشروع), whatsappGreeting (رسالة ترحيب لعملاء واتساب بزنس). لغة عربية بسيطة عُمانية دافئة. لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani marketing copywriter. Based on the business data, write ready-to-publish content. Reply strictly as JSON with keys: instagramBio (under 150 characters with fitting emoji), productDescription (a short paragraph describing a flagship product/service), aboutUs (a paragraph about the business's story), whatsappGreeting (a WhatsApp Business welcome message). Warm, simple, plain language. No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 1400);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  router.post("/marketing-strategy", async (req, res) => {
    try {
      const { profile, lang } = req.body || {};
      if (!profile || !profile.idea) return res.status(400).json({ error: "بيانات المشروع مطلوبة" });
      const useAr = (lang || "ar") === "ar";
      const contextText = JSON.stringify(profile);
      const system = useAr
        ? "أنت مستشار تسويق عُماني. بناءً على بيانات المشروع، اقترح استراتيجية تسويق مبدئية. أعد الجواب حصراً كـ JSON بالمفاتيح: platforms (مصفوفة منصات مقترحة), budgetSuggestionOmr (نطاق ميزانية شهرية مقترحة كنص مثل '500-1000'), contentIdeas (مصفوفة من ٦-٨ أفكار محتوى محددة لهذا المشروع تحديداً). لا تكتب أي نص خارج كائن الـ JSON."
        : "You are an Omani marketing advisor. Based on the business data, propose an initial marketing strategy. Reply strictly as JSON with keys: platforms (array of suggested platforms), budgetSuggestionOmr (a suggested monthly budget range as text like '500-1000'), contentIdeas (array of 6-8 content ideas specific to this exact business). No text outside the JSON object.";
      const raw = await callModelOnce(system, contextText, cfg, 900);
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
      const raw = await callModelOnce(system, contextText, cfg, 1300);
      res.json({ result: safeParseJson(raw) });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || "خطأ داخلي" });
    }
  });

  return router;
}

module.exports = { createAssistantRouter };
