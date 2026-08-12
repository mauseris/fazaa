// ============================================================================
// خارطة رحلة المشروع (Business Journey) — يولّد النموذج خطة مراحل/مهام حقيقية
// خاصة بنوع المشروع (وليست قائمة عامة)، عبر Structured Outputs (نتيجة JSON
// موثوقة الشكل بدل تحليل نص حر هش). عند عدم توفر اتصال Anthropic حي، يرجع
// تلقائياً لقالب توضيحي محلي مُعلَّم بوضوح كـ "fallback" — العرض التوضيحي لا
// ينكسر أبداً حتى بدون اتصال، لكن لا يُقدَّم كأنه ناتج نموذج حي.
// ============================================================================

const rag = require("./rag");

// جهات رسمية مُتحقَّقة فقط (مصدرها rag.js) — تُمرَّر للنموذج كمرجع وحيد مسموح
// الاستشهاد به لمهام "verify_official"، حتى لا يخترع النموذج روابط أو جهات.
const OFFICIAL_BODIES = (() => {
  const seen = new Set();
  return rag.CHUNKS
    .filter(c => c.lang === "ar" && c.url && !seen.has(c.id) && seen.add(c.id))
    .map(c => ({ id: c.id, url: c.url, note: c.text.slice(0, 90) }));
})();

const CATEGORY_VALUES = ["verify_official", "recommended", "optional"];

const ROADMAP_JSON_SCHEMA = {
  type: "object",
  properties: {
    business_type: { type: "string", description: "اسم قصير لنوع المشروع بلغة الرد" },
    stages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "عنوان قصير للمهمة (٣-٧ كلمات)" },
                why: { type: "string", description: "سطر أو سطران: لماذا هذه المهمة مهمة الآن" },
                how: { type: "string", description: "سطران إلى ثلاثة: كيف يُنجزها المستخدم عملياً" },
                category: { type: "string", enum: CATEGORY_VALUES },
                ai_action_hint: { type: "string", description: "جملة قصيرة بصيغة المتكلم يقولها المستخدم للوكيل ليطلب مساعدة أعمق بهذه المهمة تحديداً، مثل: ساعدني أعرف الأسئلة اللي أسألها المورد" },
                resource_id: { type: "string", description: "معرّف جهة رسمية من القائمة المرجعية إن كانت المهمة تتعلق بها فعلاً، وإلا نص فارغ" },
              },
              required: ["title", "why", "how", "category", "ai_action_hint", "resource_id"],
              additionalProperties: false,
            },
          },
        },
        required: ["title", "tasks"],
        additionalProperties: false,
      },
    },
  },
  required: ["business_type", "stages"],
  additionalProperties: false,
};

// خمس مراحل ثابتة الأسماء (تطابق تسمية "رحلة مشروعك" في الواجهة) — المهام
// داخل كل مرحلة هي ما يختلف فعلياً حسب نوع المشروع، وليس عدد المراحل أو أسماؤها.
const STAGE_TITLES = {
  ar: ["فكرة المشروع", "تجهيز المشروع", "التأسيس", "التسويق", "الإطلاق"],
  en: ["Business Idea", "Prepare the Business", "Establishment", "Marketing", "Launch"],
};

function buildRoadmapSystemPrompt(isAr) {
  const bodiesList = OFFICIAL_BODIES.map(b => `${b.id}: ${b.note}`).join("\n");
  const stageTitles = STAGE_TITLES[isAr ? "ar" : "en"];
  return isAr
    ? `أنت مساعد متخصص في تصميم خرائط طريق عملية لأصحاب مشاريع صغيرة جدد في عُمان. مهمتك الوحيدة الآن: توليد خارطة طريق منظّمة (JSON) خاصة تحديداً بنوع المشروع المذكور — وليست قائمة عامة قابلة للتطبيق على أي مشروع.

القواعد:
- بالضبط ٥ مراحل، بهذا الترتيب وهذه العناوين حرفياً (لا تغيّرها ولا تدمجها ولا تحذف منها): ${stageTitles.map((t, i) => `"${t}"`).join("، ")}.
- كل مرحلة تحتوي مهام محددة وعملية خاصة بهذا النوع من المشاريع تحديداً (موردين، منتجات، تسعير، محتوى، معدات، قائمة طعام، سلامة غذائية، شحن، تغليف، MVP، تحقق من العملاء... حسب ما يناسب المشروع فعلاً)، وليست عبارات عامة مثل "خطط لمشروعك".
- لكل مهمة: "why" (لماذا هي مهمة الآن، سطر أو سطران) و"how" (كيف تُنجَز عملياً، سطران-ثلاثة).
- صنّف كل مهمة بدقة إلى واحدة من ثلاث فئات فقط: "verify_official" (مرتبطة بمتطلب رسمي/ترخيص — لا تؤكد أبداً أنها إلزامية بثقة، فقط أشر لضرورة التحقق من الجهة الرسمية)، "recommended" (ممارسة تجارية سليمة موصى بها لكن ليست رسمية)، أو "optional" (مفيدة لكن يمكن تأجيلها).
- لا تخترع أي قانون أو ترخيص أو رقم رسمي أو نسبة تمويل غير موجودة في القائمة المرجعية أدناه.
- إن كانت مهمة مرتبطة فعلاً بإحدى الجهات الرسمية التالية (ولا يوجد جهة أخرى)، ضع معرّفها في resource_id بالضبط كما هو مكتوب، وإلا اتركه نصاً فارغاً "":
${bodiesList}
- "ai_action_hint" جملة قصيرة بصيغة المتكلم (كأن المستخدم يطلبها من الوكيل) لمساعدة إضافية في هذه المهمة تحديداً.
- أجب بالعربية الفصحى البسيطة في كل الحقول النصية.`
    : `You are a specialist assistant that designs practical roadmaps for new small-business owners in Oman. Your only job right now: generate a structured roadmap (JSON) specific to the exact business type mentioned — not a generic checklist that could apply to any business.

Rules:
- Exactly 5 stages, in this order, with these exact titles (don't change, merge, or drop any): ${stageTitles.map(t => `"${t}"`).join(", ")}.
- Each stage has concrete, practical tasks specific to this exact business type (suppliers, products, pricing, content, equipment, menu, food safety, shipping, packaging, MVP, customer validation... whatever genuinely fits), not generic phrases like "plan your business".
- For each task: "why" (why it matters now, 1-2 lines) and "how" (how to actually do it, 2-3 lines).
- Classify each task into exactly one of three categories: "verify_official" (tied to an official requirement/license — never confidently assert it's mandatory, just flag that it needs checking with the official body), "recommended" (sound business practice, not official), or "optional" (useful but can be deferred).
- Never invent a law, license, official number, or funding percentage not in the reference list below.
- If a task genuinely relates to one of the following official bodies (and no other), put its id exactly as written in resource_id, otherwise leave it as an empty string "":
${bodiesList}
- "ai_action_hint" is a short first-person sentence (as if the user is asking the agent) for deeper help on this specific task.
- Answer in clear English in every text field.`;
}

async function generateRoadmapViaAnthropic({ idea, sector, lang, apiKey, model, apiVersion }) {
  const isAr = lang === "ar";
  const userMsg = isAr
    ? `فكرة/نوع المشروع: "${idea}"${sector ? ` (قطاع مقترب: ${sector})` : ""}. ولّد خارطة الطريق الآن.`
    : `Business idea/type: "${idea}"${sector ? ` (approximate sector: ${sector})` : ""}. Generate the roadmap now.`;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": apiVersion,
    },
    body: JSON.stringify({
      model,
      // سخي نسبياً: claude-sonnet-5 يفكر افتراضياً قبل الكتابة (adaptive thinking)،
      // وهذا الاستدعاء يحدث مرة واحدة فقط لكل نوع مشروع، فالتكلفة الإضافية مقبولة
      // مقابل تفادي انقطاع الـ JSON منتصف الطريق.
      max_tokens: 8000,
      system: buildRoadmapSystemPrompt(isAr),
      messages: [{ role: "user", content: userMsg }],
      output_config: { format: { type: "json_schema", schema: ROADMAP_JSON_SCHEMA } },
    }),
  });
  const data = await upstream.json();
  if (!upstream.ok) {
    const err = new Error(data?.error?.message || "خطأ من Anthropic API أثناء توليد خارطة الطريق");
    err.status = upstream.status;
    throw err;
  }
  const textBlock = (data.content || []).find(b => b.type === "text");
  if (!textBlock) throw new Error("رد غير متوقع من النموذج أثناء توليد خارطة الطريق");
  const parsed = JSON.parse(textBlock.text);
  return attachResourceLinks(parsed);
}

function attachResourceLinks(roadmap) {
  const byId = Object.fromEntries(OFFICIAL_BODIES.map(b => [b.id, b]));
  for (const stage of roadmap.stages || []) {
    for (const task of stage.tasks || []) {
      const body = task.resource_id ? byId[task.resource_id] : null;
      task.resource_url = body ? body.url : null;
      delete task.resource_id;
    }
  }
  return roadmap;
}

// ---- قالب احتياطي محلي (لا يحتاج اتصال) — مُعلَّم دائماً كـ source:"fallback" ----
const FALLBACK_TEMPLATES = {
  skincare: {
    ar: { business_type: "مشروع منتجات عناية بالبشرة", stages: [
      { title: "فكرة المشروع", tasks: [
        { title: "تحديد العميل المستهدف بدقة", why: "منتجات العناية تختلف جذرياً حسب الفئة العمرية ونوع البشرة المستهدفة.", how: "حدد الفئة العمرية والاحتياج الأساسي (ترطيب، حب شباب، شيخوخة...) بدقة.", category: "recommended", ai_action_hint: "ساعدني أحدد عميلي المستهدف بدقة لمشروع عناية بالبشرة", resource_url: null },
        { title: "دراسة المنافسين في السوق", why: "تفهم الفجوة اللي مشروعك يقدر يملأها قبل الاستثمار.", how: "راقب ٣-٥ حسابات منافسة، أسعارهم، ونوع المحتوى اللي يستخدمونه.", category: "recommended", ai_action_hint: "ساعدني أحلل منافسيني في سوق العناية بالبشرة", resource_url: null },
        { title: "تحديد فئة المنتج (طبيعي/فاخر/اقتصادي)", why: "يحدد هويتك التسعيرية والتسويقية بالكامل.", how: "قارن بين طبيعي، فاخر، اقتصادي حسب ميزانيتك وجمهورك.", category: "recommended", ai_action_hint: null, resource_url: null },
      ]},
      { title: "تجهيز المشروع", tasks: [
        { title: "اختيار اسم تجاري", why: "الاسم أساس هويتك وتسويقك لاحقاً.", how: "اختر اسماً واضحاً وسهل النطق، وتأكد أنه متاح كحساب سوشال ميديا.", category: "recommended", ai_action_hint: "ساعدني أختار اسم مناسب لمشروع عناية بالبشرة", resource_url: null },
        { title: "تحديد الموردين المحتملين", why: "التسعير والجودة يعتمدان على المورد قبل أي قرار آخر.", how: "ابحث عن ٣-٥ موردين، قارن الجودة وسعر الجملة والحد الأدنى للطلب.", category: "recommended", ai_action_hint: "ساعدني أعرف الأسئلة اللي أسألها مورد منتجات عناية بالبشرة", resource_url: null },
        { title: "إنشاء حساب سوشال ميديا للمشروع", why: "أول قناة تواصل مع عملائك المحتملين.", how: "أنشئ حساب إنستقرام مخصص للمشروع بمحتوى بصري بسيط.", category: "optional", ai_action_hint: "ساعدني أخطط أول ٥ منشورات لحساب المشروع", resource_url: null },
      ]},
      { title: "التأسيس", tasks: [
        { title: "التحقق من متطلبات بيع المنتجات التجميلية", why: "بعض منتجات العناية قد تحتاج ترخيصاً أو موافقة صحية.", how: "تحقق من متطلبات وزارة الصحة قبل البيع الفعلي.", category: "verify_official", ai_action_hint: "وش متطلبات وزارة الصحة لبيع منتجات العناية بالبشرة؟", resource_url: null },
        { title: "استخراج السجل التجاري", why: "خطوة رسمية أساسية لأي نشاط تجاري في عُمان.", how: "قدّم الطلب عبر بوابة Invest Easy.", category: "verify_official", ai_action_hint: null, resource_url: null },
        { title: "فتح حساب بنكي تجاري", why: "يفصل حسابك الشخصي عن حركة المشروع المالية.", how: "افتح حساباً باسم المنشأة بعد صدور السجل التجاري.", category: "recommended", ai_action_hint: null, resource_url: null },
      ]},
      { title: "التسويق", tasks: [
        { title: "تجهيز كتالوج مبسط للمنتجات", why: "يسهّل على العميل اتخاذ قرار الشراء.", how: "صور واضحة + وصف مختصر + السعر لكل منتج.", category: "optional", ai_action_hint: null, resource_url: null },
        { title: "بدء التسويق الأولي", why: "بدون تسويق لن يعرف أحد بمشروعك.", how: "استخدم إعلانات بسيطة أو تعاون مع صفحات محلية صغيرة.", category: "optional", ai_action_hint: "ساعدني أخطط لأول حملة تسويقية بسيطة", resource_url: null },
      ]},
      { title: "الإطلاق", tasks: [
        { title: "نشر أول منتجاتك", why: "بداية التواجد الفعلي أمام العملاء.", how: "انشر المنتجات بصور وأسعار واضحة على حساباتك.", category: "recommended", ai_action_hint: null, resource_url: null },
        { title: "جمع أول ملاحظات العملاء", why: "يوجّهك لتحسين المنتج والخدمة.", how: "اسأل أول المشترين رأيهم مباشرة أو عبر استبيان قصير.", category: "optional", ai_action_hint: null, resource_url: null },
      ]},
    ]},
    en: null, // English fallback generated on the fly by translating structure at runtime if needed
  },
};

function keywordMatchTemplateKey(idea, sector) {
  const t = `${idea || ""} ${sector || ""}`.toLowerCase();
  if (/skincare|beauty|بشرة|تجميل|عناية/.test(t)) return "skincare";
  return null;
}

function getFallbackRoadmap(idea, sector, lang) {
  const key = keywordMatchTemplateKey(idea, sector);
  const tpl = key && FALLBACK_TEMPLATES[key] ? FALLBACK_TEMPLATES[key][lang] || FALLBACK_TEMPLATES[key].ar : null;
  const isAr = lang === "ar";
  const base = tpl || {
    business_type: idea || (isAr ? "مشروعك" : "Your business"),
    stages: [
      { title: isAr ? "فكرة المشروع" : "Business Idea", tasks: [
        { title: isAr ? "تحديد عملائك المستهدفين بدقة" : "Define your target customers precisely", why: isAr ? "كل قرار لاحق (سعر، مكان، تسويق) يبنى على معرفة عميلك." : "Every later decision (price, location, marketing) builds on knowing your customer.", how: isAr ? "حدد الفئة العمرية والاحتياج الأساسي اللي مشروعك يحله." : "Define the age group and core need your business solves.", category: "recommended", ai_action_hint: isAr ? "ساعدني أحدد عميلي المستهدف بدقة" : "Help me define my target customer precisely", resource_url: null },
        { title: isAr ? "دراسة المنافسين القريبين" : "Research nearby competitors", why: isAr ? "تفهم الفجوة اللي مشروعك يقدر يملأها." : "Understand the gap your business can actually fill.", how: isAr ? "راقب ٣-٥ منافسين، أسعارهم، ونقاط قوتهم وضعفهم." : "Study 3-5 competitors, their pricing, and their strengths/weaknesses.", category: "recommended", ai_action_hint: isAr ? "ساعدني أحلل منافسيني" : "Help me analyze my competitors", resource_url: null },
        { title: isAr ? "تقدير الطلب المتوقع" : "Estimate expected demand", why: isAr ? "يمنعك من الاستثمار في فكرة بدون طلب حقيقي." : "Keeps you from investing in an idea without real demand.", how: isAr ? "قدّر عدد العملاء المحتملين يومياً أو شهرياً بواقعية." : "Realistically estimate potential daily/monthly customers.", category: "recommended", ai_action_hint: null, resource_url: null },
      ]},
      { title: isAr ? "تجهيز المشروع" : "Prepare the Business", tasks: [
        { title: isAr ? "اختيار اسم تجاري" : "Choose a business name", why: isAr ? "الاسم أساس هويتك التجارية." : "The name is the foundation of your brand identity.", how: isAr ? "اختر اسماً واضحاً وتحقق من توفره كحساب سوشال ميديا." : "Pick something clear and check it's available as a social handle.", category: "recommended", ai_action_hint: isAr ? "ساعدني أختار اسماً مناسباً لمشروعي" : "Help me choose a good name for my business", resource_url: null },
        { title: isAr ? "تحديد الموردين أو الأدوات اللازمة" : "Identify suppliers or tools you'll need", why: isAr ? "قرارات التسعير والجودة تعتمد عليهم." : "Pricing and quality decisions depend on them.", how: isAr ? "قارن ٣-٥ خيارات على الأقل من حيث السعر والجودة." : "Compare at least 3-5 options on price and quality.", category: "recommended", ai_action_hint: isAr ? "ساعدني أعرف أسئلة مهمة أسألها المورد" : "Help me know what to ask a supplier", resource_url: null },
        { title: isAr ? "تحديد السعر المبدئي" : "Set initial pricing", why: isAr ? "يحدد جمهورك وهامش ربحك." : "Determines your audience and profit margin.", how: isAr ? "احسب التكلفة الكاملة + هامش ربح معقول." : "Calculate full cost plus a reasonable margin.", category: "recommended", ai_action_hint: isAr ? "ساعدني أحسب سعر مناسب بهامش ربح جيد" : "Help me calculate a price with a good margin", resource_url: null },
      ]},
      { title: isAr ? "التأسيس" : "Establishment", tasks: [
        { title: isAr ? "التحقق من المتطلبات الرسمية لنشاطك" : "Verify official requirements for your activity", why: isAr ? "بعض الأنشطة تحتاج ترخيصاً أو تسجيلاً محدداً." : "Some activities need a specific license or registration.", how: isAr ? "راجع الجهة الرسمية المعنية قبل البدء الفعلي." : "Check with the relevant official body before you actually start.", category: "verify_official", ai_action_hint: isAr ? "وش الجهات الرسمية اللي تخص نشاطي؟" : "Which official bodies are relevant to my activity?", resource_url: null },
        { title: isAr ? "استخراج السجل التجاري" : "Issue commercial registration", why: isAr ? "خطوة رسمية أساسية لأي نشاط تجاري في عُمان." : "A core official step for any business activity in Oman.", how: isAr ? "قدّم الطلب عبر بوابة Invest Easy." : "Submit the request via the Invest Easy portal.", category: "verify_official", ai_action_hint: null, resource_url: null },
        { title: isAr ? "فتح حساب بنكي تجاري" : "Open a business bank account", why: isAr ? "يفصل حسابك الشخصي عن حركة المشروع المالية." : "Separates your personal finances from the business's.", how: isAr ? "افتح حساباً باسم المنشأة بعد صدور السجل التجاري." : "Open an account under the business name once registration is issued.", category: "recommended", ai_action_hint: null, resource_url: null },
      ]},
      { title: isAr ? "التسويق" : "Marketing", tasks: [
        { title: isAr ? "إنشاء حساب سوشال ميديا للمشروع" : "Create a social-media account for the business", why: isAr ? "أول قناة تواصل مع عملائك." : "Your first channel to reach customers.", how: isAr ? "أنشئ حساباً مخصصاً بمحتوى بصري بسيط يعكس مشروعك." : "Create a dedicated account with simple visual content.", category: "optional", ai_action_hint: null, resource_url: null },
        { title: isAr ? "بدء التسويق الأولي" : "Start initial marketing", why: isAr ? "بدون تسويق لن يعرف أحد بمشروعك." : "Without marketing, no one will know about you.", how: isAr ? "استخدم إعلانات بسيطة أو تعاون مع صفحات محلية." : "Use simple ads or collaborate with local pages.", category: "optional", ai_action_hint: isAr ? "ساعدني أخطط لحملة تسويقية بسيطة" : "Help me plan a simple marketing push", resource_url: null },
      ]},
      { title: isAr ? "الإطلاق" : "Launch", tasks: [
        { title: isAr ? "نشر أول منتجاتك أو خدماتك" : "Publish your first products/services", why: isAr ? "بداية تواجدك الفعلي أمام العملاء." : "The start of your real presence in front of customers.", how: isAr ? "انشر بصور ووصف وأسعار واضحة." : "Publish with clear photos, descriptions and prices.", category: "recommended", ai_action_hint: null, resource_url: null },
        { title: isAr ? "جمع أول ملاحظات العملاء" : "Collect your first customer feedback", why: isAr ? "يوجهك لتحسين المنتج والخدمة." : "Guides you to improve the product and service.", how: isAr ? "اسأل أول المشترين مباشرة أو عبر استبيان قصير." : "Ask your first buyers directly or via a short survey.", category: "optional", ai_action_hint: null, resource_url: null },
      ]},
    ],
  };
  return { ...base, source: "fallback" };
}

async function generateRoadmap({ idea, sector, lang, usingDirectAnthropic, apiKey, model, apiVersion }) {
  if (usingDirectAnthropic) {
    try {
      const roadmap = await generateRoadmapViaAnthropic({ idea, sector, lang, apiKey, model, apiVersion });
      return { ...roadmap, source: "ai" };
    } catch (e) {
      console.warn(`⚠️  roadmap: تعذّر التوليد عبر Anthropic (${e.message}) — رجوع لقالب توضيحي محلي.`);
    }
  }
  return getFallbackRoadmap(idea, sector, lang);
}

module.exports = { generateRoadmap, OFFICIAL_BODIES };
