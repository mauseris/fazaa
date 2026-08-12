// ============================================================================
// أدوات الوكيل الحقيقية (Tool Calling) — النموذج نفسه يقرر متى يستدعي أي أداة،
// بدل منطق ثابت بالواجهة. هذا يطابق ما ورد في مخطط المعمارية الأصلي:
// search_riyada() و identify_stage() — منفّذة هنا فعلياً وليست مجرد تسمية.
// ============================================================================

const rag = require("./rag");

const SECTORS = {
  tech:      { registration:22, municipal:35,  chamber:20, rentFactor:0.6, equipmentMid:900  },
  retail:    { registration:22, municipal:90,  chamber:35, rentFactor:1.0, equipmentMid:2200 },
  food:      { registration:22, municipal:160, chamber:45, rentFactor:1.2, equipmentMid:5200 },
  ecommerce: { registration:22, municipal:30,  chamber:20, rentFactor:0.15,equipmentMid:650  },
  services:  { registration:22, municipal:55,  chamber:25, rentFactor:0.5, equipmentMid:700  },
  manufact:  { registration:22, municipal:210, chamber:60, rentFactor:1.4, equipmentMid:7800 },
  agro:      { registration:22, municipal:70,  chamber:30, rentFactor:0.4, equipmentMid:3100 },
  education: { registration:22, municipal:45,  chamber:25, rentFactor:0.55,equipmentMid:1400 },
  beauty:    { registration:22, municipal:120, chamber:30, rentFactor:0.8, equipmentMid:2600 },
  health:    { registration:22, municipal:180, chamber:40, rentFactor:1.1, equipmentMid:6500 },
  logistics: { registration:22, municipal:95,  chamber:35, rentFactor:0.7, equipmentMid:3800 },
};

const CITIES = {
  muscat:{rentBase:520}, sohar:{rentBase:300}, nizwa:{rentBase:260}, sur:{rentBase:190},
  salalah:{rentBase:270}, ibri:{rentBase:170}, soham:{rentBase:230}, rustaq:{rentBase:180},
  buraimi:{rentBase:210}, duqm:{rentBase:240},
};

const TEAM_FACTORS = { solo:1.0, small:1.35, mid:1.8 };

function calculateCost({ sector, city, teamSize = "solo", budgetLevel = 50 }){
  const s = SECTORS[sector];
  const c = CITIES[city];
  if (!s) return { error: `unknown sector "${sector}". valid: ${Object.keys(SECTORS).join(", ")}` };
  if (!c) return { error: `unknown city "${city}". valid: ${Object.keys(CITIES).join(", ")}` };

  const teamF = TEAM_FACTORS[teamSize] || 1;
  const bf = 0.55 + (Math.max(0, Math.min(100, budgetLevel)) / 100) * 1.35;

  const registration = s.registration;
  const municipal = s.municipal;
  const chamber = s.chamber;
  const rentMonthly = Math.round(s.rentFactor * c.rentBase);
  const rentInit = Math.round(rentMonthly * 3);
  const equipment = Math.round(s.equipmentMid * bf * teamF);
  const subtotal = registration + municipal + chamber + rentInit + equipment;
  const marketing = Math.round(subtotal * 0.08);
  const total = subtotal + marketing;

  return {
    currency: "OMR",
    registration, municipal, chamber, rentMonthly, rentInit, equipment, marketing, total,
    note: "أرقام تقديرية توضيحية — لا توجد تسعيرة رسمية موحدة معلنة لكل نشاط",
  };
}

function identifyStage(message){
  const t = (message || "").toLowerCase();
  if (/سجل تجاري|رخص|تسجيل|register|licen/.test(t)) return "registration";
  if (/تمويل|قرض|ميزانية|fund|loan|budget/.test(t)) return "funding";
  if (/تسويق|عملاء|مبيعات|نمو|marketing|customer|sales|growth/.test(t)) return "growth";
  return "idea";
}

async function searchKnowledge(query, ragOpts = {}){
  const results = await rag.search(query, { k: 3, ...ragOpts });
  return results.map(r => ({ text: r.text, url: r.url, relevance: Number(r.score.toFixed(3)) }));
}

// ---- تعريف الأدوات بصيغة OpenAI (تُستخدم مع البوابة المركزية) ----
const OPENAI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "ابحث في قاعدة معرفة رسمية موثّقة عن الجهات الحكومية العُمانية وبرامج الدعم والتمويل ذات الصلة بريادة الأعمال. استخدمها دائماً قبل ذكر أي معلومة رسمية بدل التخمين.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "موضوع أو سؤال البحث" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_cost",
      description: "احسب التكلفة التقديرية لتأسيس مشروع في عُمان حسب القطاع والمدينة وحجم الفريق وسيناريو الميزانية. استخدمها دائماً بدل حساب الأرقام يدوياً أو تخمينها.",
      parameters: {
        type: "object",
        properties: {
          sector: { type: "string", enum: Object.keys(SECTORS) },
          city: { type: "string", enum: Object.keys(CITIES) },
          teamSize: { type: "string", enum: Object.keys(TEAM_FACTORS) },
          budgetLevel: { type: "number", description: "0 إلى 100، حيث 50 يمثّل سيناريو ميزانية متوسط" },
        },
        required: ["sector", "city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "identify_stage",
      description: "صنّف رسالة المستخدم إلى مرحلة رحلته الريادية: idea (فكرة)، registration (تسجيل)، funding (تمويل)، أو growth (نمو).",
      parameters: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
    },
  },
];

// ---- نفس الأدوات بصيغة Anthropic (تُستخدم في مسار التطوير المحلي المباشر) ----
const ANTHROPIC_TOOLS = OPENAI_TOOLS.map(t => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

async function executeTool(name, args, ragOpts){
  try{
    if (name === "search_knowledge") return await searchKnowledge(args.query, ragOpts);
    if (name === "calculate_cost") return calculateCost(args);
    if (name === "identify_stage") return { stage: identifyStage(args.message) };
    return { error: `unknown tool: ${name}` };
  }catch(e){
    return { error: e.message };
  }
}

module.exports = {
  OPENAI_TOOLS, ANTHROPIC_TOOLS, executeTool,
  calculateCost, identifyStage, searchKnowledge,
  SECTORS, CITIES,
};
