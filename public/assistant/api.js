// ============================================================================
// طبقة خدمة (service layer) للمساعد الذكي — كل نداء لخادم /api/assistant/* يمر
// من هنا حصراً. هذا هو المكان الوحيد الذي يعرف شكل الـ endpoints؛ عند ربط
// واجهات ريادة الحقيقية لاحقاً، يكفي تعديل هذا الملف دون لمس أي واجهة عرض.
// ============================================================================

const AssistantAPI = (function () {
  async function req(path, opts) {
    const res = await fetch(`/api/assistant${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `assistant API error: ${path}`);
    return data;
  }
  const get = (path) => req(path);
  const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body || {}) });

  return {
    getRoadmap: (sector) => get(`/roadmap?sector=${encodeURIComponent(sector || "")}`),
    matchServices: (profile, lang) => post("/match-services", { profile, lang }),
    matchFunding: (profile, lang) => post("/match-funding", { profile, lang }),
    checkEligibility: (answers, lang) => post("/eligibility", { answers, lang }),
    getDocuments: (ids) => get(`/documents?ids=${encodeURIComponent((ids || []).join(","))}`),
    getGovBodies: () => get("/gov-bodies"),
    getFormFields: () => get("/form-fields"),
    getFormField: (id, sector, lang) => get(`/form-field?id=${encodeURIComponent(id)}&sector=${encodeURIComponent(sector || "")}&lang=${lang || "ar"}`),
    computeFinancials: (inputs) => post("/financial-calc", { inputs }),
    getSampleApplications: (sector) => get(`/applications/sample?sector=${encodeURIComponent(sector || "")}`),
    evaluateIdea: (text, lang) => post("/evaluate-idea", { text, lang }),
    generateBusinessPlan: (profile, answers, lang) => post("/business-plan", { profile, answers, lang }),
    explainTerm: (term, lang) => post("/explain", { term, lang }),
    generateCaseSummary: (profile, issue, lang) => post("/case-summary", { profile, issue, lang }),
    getProductCategories: (sector) => get(`/product-categories?sector=${encodeURIComponent(sector || "")}`),
    matchSuppliers: (sector, lang) => post("/suppliers", { sector, lang }),
    matchCompetitors: (sector, city, lang) => post("/competitors", { sector, city, lang }),
    matchInfluencers: (sector, lang) => post("/influencers", { sector, lang }),
    generateBusinessNames: (profile, lang) => post("/business-names", { profile, lang }),
    generateBrandIdentity: (profile, lang) => post("/brand-identity", { profile, lang }),
    generateContent: (profile, lang) => post("/content", { profile, lang }),
    generateMarketingStrategy: (profile, lang) => post("/marketing-strategy", { profile, lang }),
  };
})();
