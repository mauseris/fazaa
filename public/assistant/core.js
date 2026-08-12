// ============================================================================
// نواة المساعد الذكي الكامل (AI Business Assistant): i18n، فتح/إغلاق الطبقة،
// القائمة الجانبية (16 ميزة)، ولوحة التحكم الرئيسية. يعتمد على المتغيرات
// والدوال العامة الموجودة أصلاً في index.html (state, LANG, t, el, saveState,
// applyStaticTranslations) دون تعديلها — كل شيء هنا إضافي بحت.
//
// كل وحدة ميزة (profile-roadmap.js, discovery.js, ...) تسجّل دالة العرض الخاصة
// بها في AiViews[viewId] = function(container){...}. هذا الملف لا يعرف تفاصيل
// أي ميزة على حدة، فقط كيف يستضيفها.
// ============================================================================

const AiViews = {}; // viewId -> render(container)

const AI_UI = {
  ar: {
    openBtn: "المساعد الذكي الكامل",
    headerTitle: "المساعد الذكي لريادة الأعمال",
    headerSub: "قل لي وش تبي تسوي، وأنا بمشي معك خطوة بخطوة.",
    home: "🏠", close: "إغلاق",
    navStart: "ابدأ مشروعي", navRoadmap: "خطتي التنفيذية", navServices: "دوّر على خدماتي",
    navEligibility: "فحص الأهلية", navDocuments: "مستنداتي", navForms: "مساعد التعبئة",
    navApplications: "طلباتي", navReminders: "التذكيرات", navIdea: "تحليل الفكرة",
    navPlan: "خطة العمل", navFinancial: "الحاسبة المالية", navFunding: "دوّر على تمويل",
    navExplain: "اشرح هذا", navGov: "الجهات الحكومية", navHuman: "تواصل مع إنسان", navVoice: "المساعد الصوتي",
    navNames: "اسم المشروع", navBrand: "الهوية والشعار", navSuppliers: "الموردون",
    navCompetitors: "المنافسون والموقع", navMarketing: "التسويق", navContent: "المحتوى",
    navSimulation: "محاكاة مالية", navCashflow: "التدفق النقدي", navRestocking: "إعادة التخزين",
    navPricing: "التسعير الديناميكي", navNetwork: "شبكة رواد الأعمال", navFreelancers: "المستقلون",
    dashGreetingMorning: "صباح الخير 👋", dashGreetingEvening: "مساء الخير 👋",
    dashNoBusiness: "لم تبدأ مشروعك بعد", dashJourney: "مسار مشروعك",
    dashNextAction: "الخطوة التالية", dashRecommended: "مقترح لك",
    dashAskPlaceholder: "اسألني: وش أسوي بعدين؟", dashAskSend: "💬 اسأل في المحادثة",
    naStart: "ابدأ بإخباري عن فكرة مشروعك من «ابدأ مشروعي»", naFinishProfile: "أكمل بيانات مشروعك (القطاع/الموقع/الفريق) من «ابدأ مشروعي»",
    naAllGood: "كل شيء تمام حالياً — استكشف الميزات المقترحة أدناه",
    loading: "...جاري التحميل", errorGeneric: "تعذّر التحميل، حاول مرة أخرى",
    businessNameLabel: "اسم مشروعك", editBusinessName: "تعديل",
  },
  en: {
    openBtn: "AI Business Assistant",
    headerTitle: "AI Business Assistant",
    headerSub: "Tell me what you want to do. I'll guide you step by step.",
    home: "🏠", close: "Close",
    navStart: "Start My Business", navRoadmap: "My Action Plan", navServices: "Find My Services",
    navEligibility: "Eligibility Checker", navDocuments: "My Documents", navForms: "Form Assistant",
    navApplications: "My Applications", navReminders: "Reminders", navIdea: "Idea Analysis",
    navPlan: "Business Plan", navFinancial: "Financial Calculator", navFunding: "Funding Matcher",
    navExplain: "Explain This", navGov: "Government Services", navHuman: "Contact / Human Help", navVoice: "Voice Assistant",
    navNames: "Business Name", navBrand: "Brand & Logo", navSuppliers: "Suppliers",
    navCompetitors: "Competitors & Location", navMarketing: "Marketing", navContent: "Content",
    navSimulation: "Cash Flow Simulation", navCashflow: "Cash Flow", navRestocking: "Predictive Restocking",
    navPricing: "Dynamic Pricing", navNetwork: "Entrepreneur Network", navFreelancers: "Freelancers",
    dashGreetingMorning: "Good morning 👋", dashGreetingEvening: "Good evening 👋",
    dashNoBusiness: "You haven't started your business yet", dashJourney: "Business journey",
    dashNextAction: "Next action", dashRecommended: "Recommended",
    dashAskPlaceholder: "Ask AI: what should I do next?", dashAskSend: "💬 Ask in the chat",
    naStart: "Start by telling me about your business idea in \"Start My Business\"", naFinishProfile: "Finish your business profile (sector/location/team) in \"Start My Business\"",
    naAllGood: "Everything looks good right now — explore the recommended features below",
    loading: "Loading…", errorGeneric: "Couldn't load — try again",
    businessNameLabel: "Your business name", editBusinessName: "Edit",
  },
};
function ta(key) { return AI_UI[LANG][key] ?? key; }

const NAV_ITEMS = [
  { id: "start", icon: "🧠", key: "navStart" },
  { id: "roadmap", icon: "🗺️", key: "navRoadmap" },
  { id: "services", icon: "🎯", key: "navServices" },
  { id: "eligibility", icon: "✅", key: "navEligibility" },
  { id: "documents", icon: "📄", key: "navDocuments" },
  { id: "forms", icon: "📝", key: "navForms" },
  { id: "applications", icon: "📤", key: "navApplications" },
  { id: "reminders", icon: "🔔", key: "navReminders" },
  { id: "idea", icon: "💡", key: "navIdea" },
  { id: "plan", icon: "📊", key: "navPlan" },
  { id: "financial", icon: "💰", key: "navFinancial" },
  { id: "funding", icon: "💵", key: "navFunding" },
  { id: "explain", icon: "❓", key: "navExplain" },
  { id: "gov", icon: "🏛️", key: "navGov" },
  { id: "human", icon: "👤", key: "navHuman" },
  { id: "voice", icon: "🎙️", key: "navVoice" },
  { id: "names", icon: "🏷️", key: "navNames" },
  { id: "brand", icon: "🎨", key: "navBrand" },
  { id: "suppliers", icon: "🏪", key: "navSuppliers" },
  { id: "competitors", icon: "📍", key: "navCompetitors" },
  { id: "marketing", icon: "📣", key: "navMarketing" },
  { id: "content", icon: "📝", key: "navContent" },
  { id: "simulation", icon: "📈", key: "navSimulation" },
  { id: "cashflow", icon: "💰", key: "navCashflow" },
  { id: "restocking", icon: "📦", key: "navRestocking" },
  { id: "pricing", icon: "🎯", key: "navPricing" },
  { id: "network", icon: "🤝", key: "navNetwork" },
  { id: "freelancers", icon: "🤝", key: "navFreelancers" },
];

let aiCurrentView = "dashboard";

function getBusinessProfile() {
  const a = state.assistant || {};
  const pa = a.profileAnswers || {};
  return {
    idea: state.idea || null,
    sector: state.sector || null,
    city: state.city || null,
    teamSize: state.team || null,
    stage: pa.registered ? "registered" : (state.idea ? "idea" : "idea"),
    fundingNeeded: typeof pa.fundingNeeded === "number" ? pa.fundingNeeded : (state.userBudget || null),
    isOmani: pa.isOmani,
    registered: pa.registered,
    monthsOperating: pa.monthsOperating,
  };
}

function ensureAssistantState() {
  if (!state.assistant) {
    state.assistant = {
      businessName: "", roadmapDone: {}, documents: {}, applications: [],
      reminders: [], businessPlan: {}, ideaEvaluations: [], financialInputs: {},
      profileAnswers: {}, generatedNames: [], brandIdentity: null, generatedContent: null,
      cashflowLog: [], dismissedRestockAlerts: {}, marketingStrategy: null,
    };
  }
  return state.assistant;
}

function openAssistant() {
  ensureAssistantState();
  document.getElementById("assistantOverlay").classList.add("show");
  renderAiHeader();
  renderAiNav();
  switchAiView("dashboard");
}
function closeAssistant() {
  document.getElementById("assistantOverlay").classList.remove("show");
}

function renderAiHeader() {
  document.getElementById("aiHeaderTitle").textContent = ta("headerTitle");
  document.getElementById("aiHeaderSub").textContent = ta("headerSub");
  document.getElementById("aiHomeBtn").title = ta("home");
  document.getElementById("aiCloseBtn").textContent = ta("close");
  computeProgress().then((pct) => {
    document.getElementById("aiProgressFill").style.width = pct + "%";
    document.getElementById("aiProgressFill").className = "gauge-fill " + (pct >= 66 ? "good" : pct >= 33 ? "warn" : "bad");
    document.getElementById("aiProgressPct").textContent = pct + "%";
  });
}

function renderAiNav() {
  const nav = document.getElementById("aiNav");
  nav.innerHTML = NAV_ITEMS.map((item) => `
    <button class="ai-nav-item${item.id === aiCurrentView ? " active" : ""}" data-view="${item.id}" title="${ta(item.key)}" onclick="switchAiView('${item.id}')">
      <span class="ic">${item.icon}</span><span class="lbl">${ta(item.key)}</span>
    </button>
  `).join("");
}

function switchAiView(viewId) {
  if (viewId === "start") {
    // "ابدأ مشروعي" يفوّض مباشرة للمحادثة الأصلية الموجودة فعلياً بدل بناء
    // مسار إعداد موازٍ — هذا هو نفس تدفق state.step الحالي (idea->sector->...).
    closeAssistant();
    document.getElementById("textInput")?.focus();
    return;
  }
  aiCurrentView = viewId;
  renderAiNav();
  const container = document.getElementById("aiContent");
  container.innerHTML = "";
  if (viewId === "dashboard") { renderDashboard(container); return; }
  const renderer = AiViews[viewId];
  if (typeof renderer === "function") {
    renderer(container);
  } else {
    container.innerHTML = `<div class="ai-empty">${ta("loading")}</div>`;
  }
}

async function computeProgress() {
  if (!state.sector) return 0;
  try {
    const rm = await AssistantAPI.getRoadmap(state.sector);
    const allTasks = rm.phases.flatMap((p) => p.tasks);
    const done = (state.assistant && state.assistant.roadmapDone) || {};
    const doneCount = allTasks.filter((t) => done[t.id]).length;
    return allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
  } catch (e) { return 0; }
}

async function computeNextAction() {
  if (!state.idea) return ta("naStart");
  if (!state.sector || !state.city || !state.team) return ta("naFinishProfile");
  try {
    const rm = await AssistantAPI.getRoadmap(state.sector);
    const done = (state.assistant && state.assistant.roadmapDone) || {};
    for (const phase of rm.phases) {
      for (const task of phase.tasks) {
        if (task.level === "required" && !done[task.id]) return LANG === "ar" ? task.ar : task.en;
      }
    }
  } catch (e) { /* ignore, fall through */ }
  const apps = (state.assistant && state.assistant.applications) || [];
  const actionApp = apps.find((a) => a.status === "action_required");
  if (actionApp) {
    const name = LANG === "ar" ? actionApp.nameAr : actionApp.nameEn;
    const missing = LANG === "ar" ? actionApp.missingAr : actionApp.missingEn;
    return `${name} — ${missing}`;
  }
  return ta("naAllGood");
}

const QUICK_ACTIONS = ["start", "roadmap", "names", "brand", "idea", "suppliers", "competitors", "marketing", "content", "financial", "funding", "documents", "applications"];

async function renderDashboard(container) {
  const hour = new Date().getHours();
  const greeting = hour < 17 ? ta("dashGreetingMorning") : ta("dashGreetingEvening");
  const businessName = (state.assistant && state.assistant.businessName) || state.idea || "";

  container.innerHTML = `
    <div class="ai-dash-greeting">${greeting}</div>
    <div class="ai-dash-business">${businessName ? `"${escapeHtml(businessName)}"` : ta("dashNoBusiness")} <a href="#" onclick="editBusinessName();return false;" style="color:var(--text-faint); font-size:11px;">✎ ${ta("editBusinessName")}</a></div>
    <div class="ai-next-action"><div class="lbl">${ta("dashNextAction")}</div><div class="txt" id="aiDashNextAction">${ta("loading")}</div></div>
    <div class="ai-quick-grid">${QUICK_ACTIONS.map((id) => {
      const item = NAV_ITEMS.find((n) => n.id === id);
      return `<button class="ai-quick-btn" onclick="switchAiView('${id}')"><span class="ic">${item.icon}</span><span>${ta(item.key)}</span></button>`;
    }).join("")}</div>
    <div class="ai-card">
      <h3>💬 ${ta("dashAskPlaceholder")}</h3>
      <button class="ai-btn primary" onclick="aiAskAndClose()">${ta("dashAskSend")}</button>
    </div>
  `;
  computeNextAction().then((txt) => {
    const el = document.getElementById("aiDashNextAction");
    if (el) el.textContent = txt;
  });
}

function editBusinessName() {
  ensureAssistantState();
  const current = state.assistant.businessName || state.idea || "";
  const next = window.prompt(ta("businessNameLabel"), current);
  if (next === null) return;
  state.assistant.businessName = next.trim();
  if (typeof saveState === "function") saveState();
  renderDashboard(document.getElementById("aiContent"));
}

// يفتح المحادثة الرئيسية مباشرة بدل صندوق نص منفصل داخل لوحة التحكم — كل نص
// يكتبه المستخدم يمر حصراً عبر composer الحقيقي (#textInput).
function aiAskAndClose() {
  closeAssistant();
  document.getElementById("textInput")?.focus();
}

// يمنع أي ميزة تعتمد على فكرة المشروع (اسم/هوية/محتوى/منافسون...) من العمل
// قبل معرفتها من المحادثة — بدل صندوق نص بديل، نوجّه المستخدم للمحادثة الرئيسية.
function requireIdea(container) {
  if (state.idea) return true;
  container.innerHTML = `<div class="ai-empty">${LANG === "ar" ? "احكيلي عن فكرة مشروعك في المحادثة الرئيسية أولاً، وبعدها تكتمل هذي الميزة تلقائياً." : "Tell me about your business idea in the main chat first, then this feature fills in automatically."}</div>
    <button class="ai-btn primary" onclick="switchAiView('start')">${ta("navStart")}</button>`;
  return false;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// إعادة رسم الطبقة عند تبديل اللغة (تُستدعى من applyLangChange الحالية عبر hook أدناه)
function refreshAssistantOnLangChange() {
  if (!document.getElementById("assistantOverlay")?.classList.contains("show")) return;
  renderAiHeader();
  renderAiNav();
  switchAiView(aiCurrentView === "start" ? "dashboard" : aiCurrentView);
}
