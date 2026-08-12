// ============================================================================
// طبقة بيانات المساعد الذكي (AI Business Assistant) — كتالوجات تجريبية (mock) +
// دوال حتمية (pure functions) للمطابقة/الأهلية/الحسابات. لا تعتمد على أي نموذج
// لغوي — سريعة وقابلة للاستبدال لاحقاً بواجهات ريادة الحقيقية دون تغيير الواجهة
// الأمامية (كل شيء هنا يُستدعى فقط عبر server/assistantRoutes.js).
//
// تتبع نفس اتفاقيات البيانات الموجودة فعلياً في المشروع:
//   - جداول بنيوية (قطاعات/مدن/جهات) => {label, label_en}  (مطابق لـ public/index.html)
//   - نصوص حرة/معرفية => {ar, en}                            (مطابق لـ server/rag.js)
// ============================================================================

const { SECTORS, CITIES, TEAM_FACTORS } = require("./tools");

// ---------------------------------------------------------------------------
// الجهات الحكومية — نسخة سيرفر من GOV_LINKS في الواجهة (نفس الأسماء والروابط
// الحقيقية المُتحقَّق منها)، مع إضافة سياق "لماذا / ماذا تجهز / ماذا بعد" لكل جهة
// (تُستخدم في "الجهات الحكومية" و"التنقل بين الجهات الحكومية").
// ---------------------------------------------------------------------------
const GOV_BODIES = {
  riyada: {
    name: "هيئة تنمية المؤسسات الصغيرة والمتوسطة (ريادة)", name_en: "SME Development Authority (Riyada)",
    url: "https://www.sme.gov.om/",
    whyAr: "الجهة الرسمية لدعم رواد الأعمال في عُمان — استشارات، تدريب، وبرامج تمويل.",
    whyEn: "The official body supporting entrepreneurs in Oman — consulting, training, and funding programs.",
    prepareAr: "فكرة أو مشروع واضح، الهوية المدنية", prepareEn: "A clear idea/business, civil ID",
    afterAr: "تابع بريدك للرد على طلب الاستشارة أو الالتحاق بالبرنامج", afterEn: "Watch your email for a reply about your consultation or program enrollment",
  },
  invest: {
    name: "بوابة استثمر بسهولة (Invest Easy)", name_en: "Invest Easy Portal", url: "https://investeasy.gov.om",
    whyAr: "هنا يتم تسجيل اسم مشروعك وإصدار السجل التجاري إلكترونياً.", whyEn: "This is where you reserve your trade name and issue your commercial registration online.",
    prepareAr: "الهوية المدنية، اسم مقترح للمشروع، وصف النشاط", prepareEn: "Civil ID, a proposed business name, activity description",
    afterAr: "احتفظ برقم السجل التجاري — ستحتاجه في كل خطوة لاحقة", afterEn: "Keep your commercial registration number — you'll need it for every later step",
  },
  tejarah: {
    name: "وزارة التجارة والصناعة وترويج الاستثمار", name_en: "Ministry of Commerce, Industry & Investment Promotion", url: "https://tejarah.gov.om",
    whyAr: "الجهة المشرفة على تصنيف الأنشطة التجارية والتراخيص العامة.", whyEn: "Oversees business-activity classification and general licensing.",
    prepareAr: "وصف دقيق لنشاطك التجاري", prepareEn: "A precise description of your business activity",
    afterAr: "استخدم تصنيف النشاط الصادر في بقية طلباتك", afterEn: "Use the issued activity classification in your other applications",
  },
  occi: {
    name: "غرفة تجارة وصناعة عُمان (OCCI)", name_en: "Oman Chamber of Commerce & Industry (OCCI)", url: "https://www.omanchamber.om",
    whyAr: "العضوية إلزامية لمعظم الأنشطة التجارية بعد السجل التجاري.", whyEn: "Membership is mandatory for most commercial activities after registration.",
    prepareAr: "السجل التجاري", prepareEn: "Commercial registration",
    afterAr: "جدّد العضوية سنوياً لتجنب تعليق الخدمات", afterEn: "Renew membership annually to avoid service suspension",
  },
  madayn: {
    name: "المؤسسة العامة للمناطق الصناعية (مدائن)", name_en: "Public Establishment for Industrial Estates (Madayn)", url: "https://madayn.om",
    whyAr: "أراضٍ ومرافق صناعية جاهزة للمصانع والورش الصغيرة والمتوسطة.", whyEn: "Ready industrial land and facilities for small/medium factories and workshops.",
    prepareAr: "دراسة جدوى، السجل التجاري", prepareEn: "A feasibility study, commercial registration",
    afterAr: "تابع طلب حجز الأرض/الوحدة الصناعية", afterEn: "Follow up on your land/industrial unit reservation request",
  },
  opaz: {
    name: "الهيئة العامة للمناطق الاقتصادية الخاصة والمناطق الحرة (أوبال)", name_en: "Public Authority for Special Economic Zones & Free Zones (OPAZ)", url: "https://www.opaz.gov.om",
    whyAr: "تناسب المشاريع التصديرية أو الكبيرة داخل مناطق حرة.", whyEn: "Suits export-oriented or larger businesses operating within free zones.",
    prepareAr: "خطة عمل، تقدير حجم الاستثمار", prepareEn: "A business plan, estimated investment size",
    afterAr: "راجع فريق الهيئة لتفاصيل التأسيس داخل المنطقة", afterEn: "Coordinate with the authority's team on setup details within the zone",
  },
  odb: {
    name: "بنك التنمية العُماني", name_en: "Oman Development Bank", url: "https://db.om",
    whyAr: "تمويل وقروض ميسّرة لأصحاب المشاريع الصغيرة والمتوسطة.", whyEn: "Financing and concessional loans for small and medium business owners.",
    prepareAr: "السجل التجاري، خطة عمل، تقدير التمويل المطلوب", prepareEn: "Commercial registration, a business plan, the funding amount needed",
    afterAr: "انتظر تقييم الطلب من فريق التمويل", afterEn: "Wait for the financing team to assess your application",
  },
  mht: {
    name: "وزارة التراث والسياحة", name_en: "Ministry of Heritage & Tourism", url: "https://mht.gov.om",
    whyAr: "ترخيص ودعم المشاريع السياحية والحرفية.", whyEn: "Licensing and support for tourism and craft businesses.",
    prepareAr: "وصف النشاط السياحي/الحرفي، الموقع", prepareEn: "A description of the tourism/craft activity, the location",
    afterAr: "تابع طلب الترخيص القطاعي", afterEn: "Follow up on the sector license application",
  },
  maf: {
    name: "وزارة الثروة الزراعية والسمكية وموارد المياه", name_en: "Ministry of Agricultural & Fisheries Wealth and Water Resources", url: "https://www.maf.gov.om",
    whyAr: "تراخيص ودعم فني للزراعة والثروة السمكية.", whyEn: "Licenses and technical support for agriculture and fisheries.",
    prepareAr: "موقع الأرض/النشاط، وصف النشاط الزراعي أو السمكي", prepareEn: "The land/activity location, a description of the agricultural or fishing activity",
    afterAr: "تابع طلب التصريح الزراعي أو السمكي", afterEn: "Follow up on the agricultural or fishing permit request",
  },
  moh: {
    name: "وزارة الصحة", name_en: "Ministry of Health", url: "https://www.moh.gov.om",
    whyAr: "ترخيص العيادات ومراكز التجميل والمنشآت التي تتعامل مع الغذاء أو الصحة.", whyEn: "Licenses clinics, beauty centers, and food/health-related establishments.",
    prepareAr: "شهادة صحية للعاملين، معاينة الموقع", prepareEn: "Health certificates for staff, a site inspection",
    afterAr: "تابع موعد المعاينة الصحية للموقع", afterEn: "Follow up on the site's health inspection appointment",
  },
  mtcit: {
    name: "وزارة النقل والاتصالات وتقنية المعلومات", name_en: "Ministry of Transport, Communications & IT", url: "https://www.mtcit.gov.om",
    whyAr: "تنظيم الخدمات الرقمية والاتصالات والنقل.", whyEn: "Regulates digital services, telecom, and transport.",
    prepareAr: "وصف الخدمة الرقمية أو خدمة النقل", prepareEn: "A description of the digital or transport service",
    afterAr: "راجع أي متطلبات تنظيمية إضافية لنشاطك", afterEn: "Check for any additional regulatory requirements for your activity",
  },
  moe: {
    name: "وزارة التربية والتعليم", name_en: "Ministry of Education", url: "https://home.moe.gov.om",
    whyAr: "ترخيص مراكز التدريب والمؤسسات التعليمية الخاصة.", whyEn: "Licenses training centers and private educational institutions.",
    prepareAr: "المنهج أو البرنامج التدريبي، مؤهلات الكادر", prepareEn: "The curriculum/training program, staff qualifications",
    afterAr: "تابع اعتماد المنهج والكادر التدريسي", afterEn: "Follow up on curriculum and staff accreditation",
  },
  ea: {
    name: "هيئة البيئة", name_en: "Environment Authority", url: "https://www.ea.gov.om",
    whyAr: "تصريح بيئي للأنشطة الصناعية أو ذات الأثر البيئي.", whyEn: "Environmental permit for industrial or environmentally-impactful activities.",
    prepareAr: "وصف النشاط وموقعه", prepareEn: "A description of the activity and its location",
    afterAr: "تابع نتيجة التقييم البيئي", afterEn: "Follow up on the environmental assessment result",
  },
};

const SECTOR_BODY = {
  tech: "mtcit", ecommerce: "mtcit", logistics: "mtcit",
  retail: "opaz", manufact: "madayn", agro: "maf",
  food: "moh", beauty: "moh", health: "moh",
  services: "mht", education: "moe",
};

// ---------------------------------------------------------------------------
// خارطة الطريق (My Action Plan) — 4 مراحل ثابتة + مهام تختلف فعلياً حسب القطاع.
// level: required (مدعوم بحقيقة مُتحقَّقة، مطابق لـ REG_STEPS بالواجهة) |
//        recommended | optional
// ---------------------------------------------------------------------------
const VALIDATE_COMMON = [
  { id: "validate-customers", ar: "حدد عملاءك المستهدفين بدقة", en: "Define your target customers precisely", level: "required" },
  { id: "validate-competitors", ar: "ابحث عن المنافسين القريبين منك", en: "Research nearby competitors", level: "recommended" },
  { id: "validate-demand", ar: "قدّر عدد العملاء المتوقع يومياً/شهرياً", en: "Estimate expected daily/monthly customers", level: "recommended" },
  { id: "validate-offer", ar: "حدد قائمة منتجاتك أو خدماتك الأولية", en: "Decide your initial product/service offering", level: "recommended" },
];

const PREPARE_COMMON = [
  { id: "prepare-registration", ar: "استخراج السجل التجاري عبر بوابة Invest Easy", en: "Issue commercial registration via Invest Easy", level: "required" },
  { id: "prepare-occi", ar: "الانضمام لعضوية غرفة تجارة وصناعة عُمان (OCCI)", en: "Join Oman Chamber of Commerce & Industry (OCCI)", level: "required" },
  { id: "prepare-bank", ar: "فتح حساب بنكي تجاري باسم المنشأة", en: "Open a business bank account under the company name", level: "required" },
];

const LAUNCH_PREP_COMMON = [
  { id: "launchprep-branding", ar: "جهّز هوية بصرية بسيطة (اسم، شعار، ألوان)", en: "Prepare a simple brand identity (name, logo, colors)", level: "recommended" },
  { id: "launchprep-social", ar: "أنشئ حسابات التواصل الاجتماعي لمشروعك", en: "Create social media accounts for your business", level: "recommended" },
  { id: "launchprep-marketing", ar: "خطّط لحملة تسويقية بسيطة قبل الافتتاح", en: "Plan a simple marketing push before opening", level: "optional" },
  { id: "launchprep-feedback", ar: "جهّز طريقة لجمع ملاحظات العملاء لاحقاً", en: "Prepare a way to collect customer feedback later", level: "optional" },
];

const LAUNCH_COMMON = [
  { id: "launch-first", ar: "قدّم أول منتج/خدمة فعلياً لعميل حقيقي", en: "Deliver your first product/service to a real customer", level: "required" },
  { id: "launch-campaign", ar: "أطلق حملة الافتتاح", en: "Run your opening campaign", level: "optional" },
  { id: "launch-feedback", ar: "اجمع ملاحظات العملاء الأوائل وعدّل بناءً عليها", en: "Collect early customer feedback and adjust", level: "recommended" },
];

// مهام إضافية خاصة بكل قطاع — هذا ما يجعل خارطة الطريق مختلفة فعلياً بين
// مشروع مقهى ومشروع برمجيات، كما طلب المستخدم صراحة.
const SECTOR_EXTRA_TASKS = {
  food: {
    prepare: [
      { id: "prepare-food-health", ar: "استخراج الرخصة الصحية من وزارة الصحة", en: "Obtain a health license from the Ministry of Health", level: "required" },
      { id: "prepare-food-municipal", ar: "استخراج رخصة النشاط البلدي (مطعم/مقهى)", en: "Obtain the municipal activity license (restaurant/café)", level: "required" },
      { id: "prepare-food-suppliers", ar: "تعاقد مع موردي المواد الغذائية", en: "Contract with food ingredient suppliers", level: "recommended" },
      { id: "prepare-food-equipment", ar: "جهّز معدات المطبخ والتبريد", en: "Set up kitchen and refrigeration equipment", level: "recommended" },
    ],
  },
  beauty: {
    prepare: [
      { id: "prepare-beauty-health", ar: "استخراج ترخيص وزارة الصحة لمركز التجميل", en: "Obtain a Ministry of Health license for the beauty center", level: "required" },
      { id: "prepare-beauty-staff", ar: "تأكد من شهادات ومؤهلات العاملات/العاملين", en: "Verify staff certifications and qualifications", level: "required" },
      { id: "prepare-beauty-supplies", ar: "تعاقد مع موردي مستحضرات ومعدات التجميل", en: "Contract with beauty product/equipment suppliers", level: "recommended" },
    ],
  },
  health: {
    prepare: [
      { id: "prepare-health-license", ar: "استخراج ترخيص وزارة الصحة للعيادة", en: "Obtain a Ministry of Health license for the clinic", level: "required" },
      { id: "prepare-health-staff", ar: "وثّق شهادات الكادر الطبي واعتماداتهم", en: "Document medical staff certifications and accreditations", level: "required" },
      { id: "prepare-health-equipment", ar: "جهّز الأجهزة الطبية المطلوبة", en: "Set up the required medical equipment", level: "recommended" },
    ],
  },
  tech: {
    prepare: [
      { id: "prepare-tech-domain", ar: "احجز نطاق موقعك (domain) واستضافة مناسبة", en: "Reserve your domain name and suitable hosting", level: "recommended" },
      { id: "prepare-tech-data", ar: "راجع متطلبات حماية بيانات المستخدمين", en: "Review user data-protection requirements", level: "recommended" },
      { id: "prepare-tech-mvp", ar: "جهّز نسخة أولية (MVP) قابلة للتجربة", en: "Prepare a testable minimum viable product (MVP)", level: "required" },
    ],
  },
  ecommerce: {
    prepare: [
      { id: "prepare-ecom-suppliers", ar: "أمّن مصادر توريد أو تصنيع المنتجات", en: "Secure product sourcing or manufacturing suppliers", level: "recommended" },
      { id: "prepare-ecom-payment", ar: "فعّل بوابة دفع إلكتروني موثوقة", en: "Enable a trusted online payment gateway", level: "required" },
      { id: "prepare-ecom-shipping", ar: "رتّب حل شحن وتوصيل للطلبات", en: "Arrange a shipping/delivery solution for orders", level: "recommended" },
    ],
  },
  retail: {
    prepare: [
      { id: "prepare-retail-municipal", ar: "استخراج رخصة النشاط البلدي للمحل", en: "Obtain the municipal activity license for the shop", level: "required" },
      { id: "prepare-retail-suppliers", ar: "تعاقد مع موردي البضاعة", en: "Contract with merchandise suppliers", level: "recommended" },
      { id: "prepare-retail-pos", ar: "جهّز نظام نقاط بيع (POS) وإدارة مخزون", en: "Set up a point-of-sale (POS) and inventory system", level: "recommended" },
    ],
  },
  services: {
    prepare: [
      { id: "prepare-services-portfolio", ar: "جهّز نماذج أعمال سابقة أو محفظة أعمال", en: "Prepare a portfolio of past work/samples", level: "recommended" },
      { id: "prepare-services-pricing", ar: "حدد باقات أو أسعار خدماتك", en: "Define service packages or pricing", level: "recommended" },
    ],
  },
  manufact: {
    prepare: [
      { id: "prepare-manu-env", ar: "استخراج التصريح البيئي من هيئة البيئة", en: "Obtain an environmental permit from the Environment Authority", level: "required" },
      { id: "prepare-manu-land", ar: "احجز أرضاً أو وحدة صناعية عبر مدائن", en: "Reserve industrial land/unit via Madayn", level: "recommended" },
      { id: "prepare-manu-safety", ar: "جهّز إجراءات ومعدات السلامة المهنية", en: "Set up occupational safety procedures and equipment", level: "required" },
    ],
  },
  agro: {
    prepare: [
      { id: "prepare-agro-permit", ar: "استخراج تصريح من وزارة الثروة الزراعية والسمكية", en: "Obtain a permit from the Ministry of Agriculture & Fisheries", level: "required" },
      { id: "prepare-agro-land", ar: "تأكد من حقوق الأرض أو المياه اللازمة للنشاط", en: "Confirm the land/water rights needed for the activity", level: "required" },
    ],
  },
  education: {
    prepare: [
      { id: "prepare-edu-license", ar: "استخراج ترخيص وزارة التربية والتعليم لمركز التدريب", en: "Obtain a Ministry of Education license for the training center", level: "required" },
      { id: "prepare-edu-curriculum", ar: "جهّز المنهج أو البرنامج التدريبي", en: "Prepare the curriculum/training program", level: "required" },
      { id: "prepare-edu-staff", ar: "وثّق مؤهلات الكادر التدريسي", en: "Document teaching staff qualifications", level: "recommended" },
    ],
  },
  logistics: {
    prepare: [
      { id: "prepare-log-permits", ar: "استخراج تصاريح النقل اللازمة من وزارة النقل والاتصالات", en: "Obtain required transport permits from the Ministry of Transport", level: "required" },
      { id: "prepare-log-insurance", ar: "أمّن تأميناً مناسباً للمركبات والشحنات", en: "Secure suitable insurance for vehicles/shipments", level: "required" },
      { id: "prepare-log-fleet", ar: "جهّز أسطول المركبات أو تعاقد مع ناقلين", en: "Set up your vehicle fleet or contract with carriers", level: "recommended" },
    ],
  },
};

function buildRoadmap(sectorKey) {
  const extra = SECTOR_EXTRA_TASKS[sectorKey] || {};
  return {
    sector: sectorKey || null,
    phases: [
      { id: "validate", titleAr: "الخطوة ١ — التحقق من الفكرة", titleEn: "Step 1 — Validate the idea", tasks: VALIDATE_COMMON },
      { id: "prepare", titleAr: "الخطوة ٢ — تجهيز المشروع", titleEn: "Step 2 — Prepare the business", tasks: [...PREPARE_COMMON, ...(extra.prepare || [])] },
      { id: "launchprep", titleAr: "الخطوة ٣ — التجهيز للإطلاق", titleEn: "Step 3 — Prepare to launch", tasks: [...LAUNCH_PREP_COMMON, ...(extra.launchprep || [])] },
      { id: "launch", titleAr: "الخطوة ٤ — الإطلاق", titleEn: "Step 4 — Launch", tasks: [...LAUNCH_COMMON, ...(extra.launch || [])] },
    ],
  };
}

// ---------------------------------------------------------------------------
// خدمات ريادة (Find My Services) — كتالوج تجريبي بعلامات مطابقة (tags)
// ---------------------------------------------------------------------------
const SERVICES = [
  {
    id: "riyada-consulting", fundingProgram: true,
    nameAr: "استشارات ريادة المجانية", nameEn: "Riyada free consulting",
    stages: ["idea", "registered", "operating"], sectors: "any",
    whyAr: "متاحة لأي رائد أعمال عُماني بغض النظر عن مرحلة مشروعه.", whyEn: "Available to any Omani entrepreneur regardless of business stage.",
    requiredAr: ["الهوية المدنية", "وصف مختصر للمشروع"], requiredEn: ["Civil ID", "A short business description"],
    nextAr: "احجز موعد استشارة عبر موقع ريادة", nextEn: "Book a consulting session via the Riyada website",
    url: GOV_BODIES.riyada.url,
  },
  {
    id: "invest-easy-guidance",
    nameAr: "دليل التسجيل عبر Invest Easy", nameEn: "Invest Easy registration guide",
    stages: ["idea"], sectors: "any",
    whyAr: "مشروعك لم يُسجَّل بعد — هذه أول خطوة رسمية.", whyEn: "Your business isn't registered yet — this is the first official step.",
    requiredAr: ["الهوية المدنية", "اسم مقترح للمشروع"], requiredEn: ["Civil ID", "A proposed business name"],
    nextAr: "ابدأ طلب حجز الاسم على البوابة", nextEn: "Start a name-reservation request on the portal",
    url: GOV_BODIES.invest.url,
  },
  {
    id: "occi-membership",
    nameAr: "عضوية غرفة تجارة وصناعة عُمان", nameEn: "OCCI membership",
    stages: ["registered", "operating"], sectors: "any",
    whyAr: "مشروعك مسجّل — العضوية تصبح إلزامية للمتابعة.", whyEn: "Your business is registered — membership becomes mandatory going forward.",
    requiredAr: ["السجل التجاري"], requiredEn: ["Commercial registration"],
    nextAr: "قدّم طلب العضوية عبر موقع الغرفة", nextEn: "Apply for membership via the Chamber's website",
    url: GOV_BODIES.occi.url,
  },
  {
    id: "odb-interest-free", fundingProgram: true,
    nameAr: "قرض بدون فائدة — بنك التنمية العُماني", nameEn: "Interest-free loan — Oman Development Bank",
    stages: ["registered", "operating"], sectors: "any", maxFunding: 15000,
    whyAr: "احتياجك التمويلي ضمن سقف القرض بدون فائدة (حتى 15,000 ر.ع).", whyEn: "Your funding need fits the interest-free loan ceiling (up to 15,000 OMR).",
    requiredAr: ["السجل التجاري", "خطة عمل", "تفرغ كامل لإدارة المشروع"], requiredEn: ["Commercial registration", "A business plan", "Full-time dedication to running the business"],
    nextAr: "قدّم طلب التمويل عبر بنك التنمية العُماني", nextEn: "Submit a financing application via Oman Development Bank",
    url: GOV_BODIES.odb.url,
  },
  {
    id: "odb-development-loan", fundingProgram: true,
    nameAr: "قرض تنموي بفائدة 3% — بنك التنمية العُماني", nameEn: "3% development loan — Oman Development Bank",
    stages: ["registered", "operating"], sectors: "any", minFunding: 15000,
    whyAr: "احتياجك التمويلي أكبر من سقف القرض بدون فائدة.", whyEn: "Your funding need exceeds the interest-free loan ceiling.",
    requiredAr: ["السجل التجاري", "خطة عمل مفصّلة", "ضمانات حسب حجم التمويل"], requiredEn: ["Commercial registration", "A detailed business plan", "Collateral depending on financing size"],
    nextAr: "قدّم طلب القرض التنموي عبر بنك التنمية العُماني", nextEn: "Submit a development-loan application via Oman Development Bank",
    url: GOV_BODIES.odb.url,
  },
  {
    id: "madayn-industrial",
    nameAr: "أرض/وحدة صناعية — مدائن", nameEn: "Industrial land/unit — Madayn",
    stages: ["registered", "operating"], sectors: ["manufact", "agro"],
    whyAr: "نشاطك يحتاج مساحة إنتاج أو تصنيع مجهزة.", whyEn: "Your activity needs an equipped production/manufacturing space.",
    requiredAr: ["دراسة جدوى", "السجل التجاري"], requiredEn: ["A feasibility study", "Commercial registration"],
    nextAr: "قدّم طلب حجز أرض عبر موقع مدائن", nextEn: "Submit a land-reservation request via Madayn's website",
    url: GOV_BODIES.madayn.url,
  },
  {
    id: "opaz-freezone",
    nameAr: "التأسيس داخل منطقة حرة — أوبال", nameEn: "Setting up in a free zone — OPAZ",
    stages: ["registered", "operating"], sectors: ["retail", "logistics", "manufact"],
    whyAr: "نشاطك يناسب التصدير أو العمليات الكبيرة داخل منطقة حرة.", whyEn: "Your activity suits export or larger operations within a free zone.",
    requiredAr: ["خطة عمل", "تقدير حجم الاستثمار"], requiredEn: ["A business plan", "Estimated investment size"],
    nextAr: "تواصل مع فريق أوبال لتفاصيل التأسيس", nextEn: "Contact the OPAZ team for setup details",
    url: GOV_BODIES.opaz.url,
  },
  {
    id: "mht-tourism-craft",
    nameAr: "دعم وتراخيص السياحة والحرف — وزارة التراث والسياحة", nameEn: "Tourism & craft support/licensing — Ministry of Heritage & Tourism",
    stages: ["idea", "registered", "operating"], sectors: ["services"],
    whyAr: "نشاطك ضمن الخدمات الحرفية أو السياحية.", whyEn: "Your activity falls within craft or tourism services.",
    requiredAr: ["وصف النشاط", "الموقع المقترح"], requiredEn: ["Activity description", "Proposed location"],
    nextAr: "تواصل مع الوزارة لمعرفة برامج الدعم المتاحة", nextEn: "Contact the ministry to learn about available support programs",
    url: GOV_BODIES.mht.url,
  },
  {
    id: "youth-business-support", fundingProgram: true,
    nameAr: "برنامج دعم مشاريع الشباب", nameEn: "Youth Business Support Program",
    stages: ["idea", "registered"], sectors: "any", maxFunding: 15000,
    whyAr: "مخصص لرواد الأعمال الشباب (18-35 سنة) في المراحل المبكرة.", whyEn: "Aimed at young entrepreneurs (18-35) in early stages.",
    requiredAr: ["إثبات العمر (18-35)", "خطة عمل", "الجنسية العُمانية"], requiredEn: ["Proof of age (18-35)", "A business plan", "Omani citizenship"],
    nextAr: "قدّم طلبك عبر هيئة ريادة", nextEn: "Apply via Riyada",
    url: GOV_BODIES.riyada.url,
  },
  {
    id: "women-entrepreneurship-fund", fundingProgram: true,
    nameAr: "صندوق ريادة الأعمال النسائية", nameEn: "Women Entrepreneurship Fund",
    stages: ["idea", "registered"], sectors: "any", maxFunding: 20000,
    whyAr: "دعم مخصص لأصحاب المشاريع من النساء العُمانيات.", whyEn: "Dedicated support for Omani women-owned businesses.",
    requiredAr: ["ملكية نسائية للمشروع", "خطة عمل", "الجنسية العُمانية"], requiredEn: ["Women-owned business", "A business plan", "Omani citizenship"],
    nextAr: "قدّم طلبك عبر هيئة ريادة", nextEn: "Apply via Riyada",
    url: GOV_BODIES.riyada.url,
  },
  {
    id: "digital-business-accelerator", fundingProgram: true,
    nameAr: "مسرّع الأعمال الرقمية", nameEn: "Digital Business Accelerator",
    stages: ["idea", "registered"], sectors: ["tech", "ecommerce"], maxFunding: 10000,
    whyAr: "منحة لدعم المشاريع الرقمية ذات حضور إلكتروني وإمكانية نمو.", whyEn: "A grant supporting digital businesses with an online presence and growth potential.",
    requiredAr: ["نشاط رقمي أو متجر إلكتروني", "حضور رقمي فعلي"], requiredEn: ["A digital/online business", "An actual digital presence"],
    nextAr: "قدّم طلبك عبر هيئة ريادة", nextEn: "Apply via Riyada",
    url: GOV_BODIES.riyada.url,
  },
  {
    id: "export-development-fund", fundingProgram: true,
    nameAr: "صندوق تنمية الصادرات", nameEn: "Export Development Fund",
    stages: ["registered", "operating"], sectors: "any", minFunding: 15000, maxFunding: 40000,
    whyAr: "لدعم المشاريع القادرة على التصدير خارج عُمان.", whyEn: "Supports businesses with export capacity outside Oman.",
    requiredAr: ["قدرة تصديرية", "السجل التجاري", "خطة عمل"], requiredEn: ["Export capacity", "Commercial registration", "A business plan"],
    nextAr: "قدّم طلب التمويل عبر بنك التنمية العُماني", nextEn: "Submit a financing application via Oman Development Bank",
    url: GOV_BODIES.odb.url,
  },
  {
    id: "innovation-grant", fundingProgram: true,
    nameAr: "برنامج منح الابتكار", nameEn: "Innovation Grant Program",
    stages: ["idea", "registered"], sectors: "any", maxFunding: 15000,
    whyAr: "منحة (وليست قرضاً) للأفكار المبتكرة القابلة للبحث والتطوير.", whyEn: "A grant (not a loan) for innovative, R&D-capable ideas.",
    requiredAr: ["فكرة مبتكرة موثّقة", "وصف تقني للفكرة"], requiredEn: ["A documented innovative idea", "A technical description of the idea"],
    nextAr: "قدّم طلبك عبر هيئة ريادة", nextEn: "Apply via Riyada",
    url: GOV_BODIES.riyada.url,
  },
  {
    id: "tanfidh-startup-fund", fundingProgram: true,
    nameAr: "صندوق تنفيذ لدعم الشركات الناشئة", nameEn: "Tanfidh Startup Fund",
    stages: ["idea", "registered"], sectors: "any", maxFunding: 30000,
    whyAr: "تمويل ميسّر للشركات الناشئة العُمانية حديثة التأسيس.", whyEn: "Concessional financing for newly-established Omani startups.",
    requiredAr: ["مشروع ناشئ", "دراسة جدوى", "ملكية عُمانية"], requiredEn: ["An early-stage business", "A feasibility study", "Omani ownership"],
    nextAr: "قدّم طلب التمويل عبر بنك التنمية العُماني", nextEn: "Submit a financing application via Oman Development Bank",
    url: GOV_BODIES.odb.url,
  },
  {
    id: "vision2040-strategic-fund", fundingProgram: true,
    nameAr: "صندوق رؤية عُمان 2040 الاستراتيجي", nameEn: "Oman Vision 2040 Strategic Fund",
    stages: ["registered", "operating"], sectors: ["manufact", "agro", "tech"], minFunding: 40000,
    whyAr: "تمويل أكبر للمشاريع في القطاعات الاستراتيجية طويلة الأمد.", whyEn: "Larger financing for businesses in long-term strategic sectors.",
    requiredAr: ["قطاع استراتيجي", "ملكية عُمانية", "خطة طويلة الأمد"], requiredEn: ["A strategic sector", "Omani ownership", "A long-term plan"],
    nextAr: "قدّم طلب التمويل عبر بنك التنمية العُماني", nextEn: "Submit a financing application via Oman Development Bank",
    url: GOV_BODIES.odb.url,
  },
];

function scoreProfile(item, profile) {
  let score = 0;
  const stage = profile.stage || "idea";
  if (Array.isArray(item.stages) && item.stages.includes(stage)) score += 2;
  if (item.sectors === "any") score += 1;
  else if (Array.isArray(item.sectors) && profile.sector && item.sectors.includes(profile.sector)) score += 3;
  else if (Array.isArray(item.sectors) && profile.sector) return 0; // sector-specific item that doesn't match — exclude
  if (typeof item.maxFunding === "number" && typeof profile.fundingNeeded === "number") {
    score += profile.fundingNeeded <= item.maxFunding ? 2 : -3;
  }
  if (typeof item.minFunding === "number" && typeof profile.fundingNeeded === "number") {
    score += profile.fundingNeeded >= item.minFunding ? 2 : -3;
  }
  return score;
}

function matchServices(profile = {}, lang = "ar") {
  return SERVICES
    .map((s) => ({ ...s, score: scoreProfile(s, profile) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      name: lang === "ar" ? s.nameAr : s.nameEn,
      why: lang === "ar" ? s.whyAr : s.whyEn,
      required: lang === "ar" ? s.requiredAr : s.requiredEn,
      nextAction: lang === "ar" ? s.nextAr : s.nextEn,
      url: s.url,
    }));
}

// برامج التمويل (Funding Matcher) — تعيد استخدام نفس منطق SERVICES مع فلترة على
// العناصر المُعلَّمة صراحة كبرنامج تمويل (fundingProgram: true).
const FUNDING_PROGRAMS = SERVICES.filter((s) => s.fundingProgram === true);

function matchFunding(profile = {}, lang = "ar") {
  return FUNDING_PROGRAMS
    .map((s) => ({ ...s, score: scoreProfile(s, profile) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => ({
      id: s.id,
      name: lang === "ar" ? s.nameAr : s.nameEn,
      why: lang === "ar" ? s.whyAr : s.whyEn,
      required: lang === "ar" ? s.requiredAr : s.requiredEn,
      nextAction: lang === "ar" ? s.nextAr : s.nextEn,
      url: s.url,
    }));
}

// ---------------------------------------------------------------------------
// الأهلية (Eligibility Checker) — منطق حتمي شفاف، مع تنويه إلزامي أنه تقييم
// أولي فقط وليس قراراً رسمياً (بطلب صريح من المستخدم).
// ---------------------------------------------------------------------------
const DISCLAIMER = {
  ar: "تقييم أولي من الذكاء الاصطناعي — القرار النهائي بيد ريادة.",
  en: "Preliminary AI assessment — final eligibility is determined by Riyada.",
};

function evaluateEligibility(answers = {}, lang = "ar") {
  const { isOmani, registered, monthsOperating, fundingNeeded } = answers;
  const reasons = [];
  const nextSteps = [];
  let verdict = "more_info";

  if (isOmani === undefined || registered === undefined) {
    return {
      verdict: "more_info",
      reasons: [{ ar: "نحتاج نعرف جنسيتك وحالة تسجيل مشروعك أولاً.", en: "We first need to know your nationality and whether your business is registered." }],
      nextSteps: [{ ar: "أكمل إجاباتك على الأسئلة القصيرة", en: "Finish answering the short questions" }],
      disclaimer: DISCLAIMER,
    };
  }

  if (isOmani === false) {
    verdict = "unlikely";
    reasons.push({
      ar: "أغلب برامج ريادة والتمويل الحكومي مخصصة لأصحاب المشاريع العُمانيين.",
      en: "Most Riyada and government-funding programs are reserved for Omani nationals.",
    });
    nextSteps.push({ ar: "تحقق من برامج الشراكة أو الاستثمار الأجنبي المتاحة بدلاً من ذلك", en: "Check foreign-investment/partnership programs instead" });
  } else {
    verdict = "likely";
    reasons.push({ ar: "أنت مواطن عُماني — هذا الشرط الأساسي متوفر.", en: "You're an Omani national — this baseline requirement is met." });

    if (registered === false) {
      reasons.push({ ar: "مشروعك غير مسجّل بعد — بعض البرامج تتطلب تسجيلاً رسمياً أولاً.", en: "Your business isn't registered yet — some programs require formal registration first." });
      nextSteps.push({ ar: "سجّل مشروعك عبر بوابة Invest Easy أولاً", en: "Register your business via Invest Easy first" });
      verdict = "maybe";
    } else {
      reasons.push({ ar: "مشروعك مسجّل رسمياً — يفتح لك مجموعة أوسع من البرامج.", en: "Your business is officially registered — this opens a wider set of programs." });
    }

    if (typeof fundingNeeded === "number" && fundingNeeded > 0) {
      if (fundingNeeded <= 15000) {
        reasons.push({ ar: "احتياجك التمويلي ضمن سقف القرض بدون فائدة من بنك التنمية العُماني.", en: "Your funding need fits the interest-free loan ceiling from Oman Development Bank." });
      } else {
        reasons.push({ ar: "احتياجك التمويلي يتجاوز سقف القرض بدون فائدة — يناسبك القرض التنموي بفائدة 3%.", en: "Your funding need exceeds the interest-free ceiling — the 3% development loan suits you better." });
      }
    }

    if (typeof monthsOperating === "number" && monthsOperating < 3 && registered) {
      reasons.push({ ar: "مشروعك حديث التسجيل (أقل من 3 أشهر) — بعض البرامج تفضّل مشاريع أطول عمراً.", en: "Your business was recently registered (under 3 months) — some programs prefer more established businesses." });
      if (verdict === "likely") verdict = "maybe";
    }
  }

  if (nextSteps.length === 0) {
    nextSteps.push({ ar: "تواصل مع ريادة لمعرفة أقرب برنامج مناسب لك", en: "Contact Riyada to find the closest matching program" });
  }

  return { verdict, reasons, nextSteps, disclaimer: DISCLAIMER };
}

// ---------------------------------------------------------------------------
// المستندات (My Documents)
// ---------------------------------------------------------------------------
const DOCUMENT_DEFS = {
  civil_id: {
    ar: "الهوية المدنية", en: "Civil ID",
    whatAr: "بطاقة الهوية الشخصية الصادرة من الشرطة السلطانية العُمانية.", whatEn: "The national ID card issued by the Royal Oman Police.",
    whyAr: "تثبت هويتك كمقدّم طلب.", whyEn: "Proves your identity as the applicant.",
    whereAr: "لديك بالفعل — أو مركز خدمة الشرطة السلطانية العُمانية", whereEn: "You already have it — or a Royal Oman Police service center",
    formatAr: "صورة واضحة (JPG/PDF)", formatEn: "A clear scan/photo (JPG/PDF)",
  },
  business_registration: {
    ar: "السجل التجاري", en: "Commercial registration",
    whatAr: "وثيقة تسجيل مشروعك رسمياً لدى وزارة التجارة.", whatEn: "The document officially registering your business with the Ministry of Commerce.",
    whyAr: "تثبت أن نشاطك التجاري مسجّل بشكل قانوني.", whyEn: "Proves your business is legally registered.",
    whereAr: "بوابة Invest Easy", whereEn: "The Invest Easy portal",
    formatAr: "PDF من البوابة الرسمية", formatEn: "A PDF from the official portal",
  },
  business_plan: {
    ar: "خطة العمل", en: "Business plan",
    whatAr: "مستند يشرح فكرة مشروعك، السوق، والخطة المالية.", whatEn: "A document explaining your business idea, market, and financial plan.",
    whyAr: "تحتاجها معظم برامج التمويل لتقييم مشروعك.", whyEn: "Most funding programs need it to assess your business.",
    whereAr: "يمكنك توليد مسودة عبر خاصية «خطة العمل» في المساعد الذكي", whereEn: "You can generate a draft via the \"Business Plan\" feature in the AI Assistant",
    formatAr: "PDF أو Word", formatEn: "PDF or Word",
  },
  bank_statement: {
    ar: "كشف حساب بنكي", en: "Bank statement",
    whatAr: "كشف يوضح حركة حسابك البنكي لفترة معينة.", whatEn: "A statement showing your bank account activity over a period.",
    whyAr: "يُستخدم للتحقق من الوضع المالي عند طلب التمويل.", whyEn: "Used to verify financial standing when applying for funding.",
    whereAr: "تطبيق أو فرع بنكك", whereEn: "Your bank's app or a branch",
    formatAr: "PDF رسمي من البنك", formatEn: "An official PDF from the bank",
  },
  quotation: {
    ar: "عرض سعر", en: "Price quotation",
    whatAr: "عرض سعر من مورّد للمعدات أو الخدمات التي تحتاجها.", whatEn: "A price quote from a supplier for equipment/services you need.",
    whyAr: "يوضح التكلفة الفعلية المتوقعة لتمويل بعض البنود.", whyEn: "Shows the actual expected cost for financing certain items.",
    whereAr: "تواصل مع المورّد مباشرة", whereEn: "Contact the supplier directly",
    formatAr: "PDF أو صورة موقّعة من المورّد", formatEn: "A PDF or signed image from the supplier",
  },
  municipal_license: {
    ar: "رخصة النشاط البلدي", en: "Municipal activity license",
    whatAr: "ترخيص من البلدية لمزاولة النشاط في موقع محدد.", whatEn: "A municipal license to operate the activity at a specific location.",
    whyAr: "مطلوبة لأي نشاط له موقع فعلي.", whyEn: "Required for any activity with a physical location.",
    whereAr: "تصدر غالباً تلقائياً ضمن خطوات Invest Easy", whereEn: "Usually issued automatically as part of the Invest Easy steps",
    formatAr: "PDF من البوابة", formatEn: "A PDF from the portal",
  },
  health_certificate: {
    ar: "الشهادة الصحية", en: "Health certificate",
    whatAr: "شهادة تثبت سلامة العاملين أو الموقع صحياً.", whatEn: "A certificate confirming staff or site health compliance.",
    whyAr: "إلزامية لأنشطة الغذاء والتجميل والصحة.", whyEn: "Mandatory for food, beauty, and health activities.",
    whereAr: "وزارة الصحة", whereEn: "The Ministry of Health",
    formatAr: "شهادة رسمية موقّعة", formatEn: "An official signed certificate",
  },
  lease_contract: {
    ar: "عقد الإيجار", en: "Lease contract",
    whatAr: "عقد إيجار موقع عملك.", whatEn: "The lease contract for your business location.",
    whyAr: "يثبت حقك في استخدام الموقع لنشاطك.", whyEn: "Proves your right to use the location for your business.",
    whereAr: "المؤجّر/المالك", whereEn: "The landlord/property owner",
    formatAr: "PDF موقّع من الطرفين", formatEn: "A PDF signed by both parties",
  },
};

function buildDocumentChecklist(ids = []) {
  return ids
    .filter((id) => DOCUMENT_DEFS[id])
    .map((id) => ({ id, ...DOCUMENT_DEFS[id] }));
}

// ---------------------------------------------------------------------------
// مساعد النماذج (Form Assistant) — نموذج توضيحي تجريبي لحقول "Invest Easy"
// ---------------------------------------------------------------------------
const FORM_FIELD_DEFS = [
  {
    id: "business_name", labelAr: "اسم المنشأة", labelEn: "Business name",
    explainAr: "الاسم التجاري الذي سيظهر رسمياً في سجلك التجاري.", explainEn: "The trade name that will officially appear on your commercial registration.",
  },
  {
    id: "nature_of_business", labelAr: "طبيعة النشاط", labelEn: "Nature of business",
    explainAr: "وصف واضح لما يفعله مشروعك فعلياً.", explainEn: "A clear description of what your business actually does.",
    exampleBySector: {
      food: { ar: "مثال: بيع الوجبات والمشروبات بالتجزئة", en: "Example: Retail sale of food and beverages" },
      tech: { ar: "مثال: تطوير وتشغيل تطبيقات وبرمجيات رقمية", en: "Example: Development and operation of digital apps/software" },
      beauty: { ar: "مثال: تقديم خدمات التجميل والعناية الشخصية", en: "Example: Provision of beauty and personal-care services" },
      default: { ar: "مثال: بيع منتجات العناية بالبشرة بالتجزئة", en: "Example: Retail sale of skincare products" },
    },
  },
  {
    id: "capital_amount", labelAr: "رأس المال", labelEn: "Capital amount",
    explainAr: "المبلغ الذي ستبدأ به مشروعك (ليس بالضرورة كل مدخراتك).", explainEn: "The amount you'll start your business with (not necessarily all your savings).",
  },
  {
    id: "business_address", labelAr: "عنوان النشاط", labelEn: "Business address",
    explainAr: "موقع مزاولة النشاط الفعلي، أو عنوانك إن كان العمل عن بُعد.", explainEn: "The actual location of the activity, or your address if working remotely.",
  },
  {
    id: "expected_start_date", labelAr: "تاريخ البدء المتوقع", labelEn: "Expected start date",
    explainAr: "التاريخ الذي تتوقع فيه بدء مزاولة النشاط فعلياً.", explainEn: "The date you expect to actually start operating.",
  },
];

function explainFormField(id, sector, lang = "ar") {
  const f = FORM_FIELD_DEFS.find((x) => x.id === id);
  if (!f) return null;
  const example = f.exampleBySector ? (f.exampleBySector[sector] || f.exampleBySector.default) : null;
  return {
    id: f.id,
    label: lang === "ar" ? f.labelAr : f.labelEn,
    explain: lang === "ar" ? f.explainAr : f.explainEn,
    example: example ? (lang === "ar" ? example.ar : example.en) : null,
  };
}

// ---------------------------------------------------------------------------
// طلبات تجريبية (My Applications) — بيانات تجريبية فقط (mock)، تُنشأ مرة واحدة
// وتُخزَّن في state.assistant.applications بالواجهة (لا تُخزَّن هنا).
// ---------------------------------------------------------------------------
function seedApplications(profile = {}) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "app-support-1",
      nameAr: "طلب دعم الأعمال", nameEn: "Business Support Application",
      status: "under_review",
      submittedAt: now - 3 * day,
      missingAr: null, missingEn: null,
      recommendationAr: "لا حاجة لأي إجراء منك حالياً.", recommendationEn: "No action is currently required from you.",
    },
    {
      id: "app-municipal-1",
      nameAr: "طلب رخصة النشاط البلدي", nameEn: "Municipal License Application",
      status: "action_required",
      submittedAt: now - 6 * day,
      missingAr: "عقد الإيجار", missingEn: "Lease contract",
      recommendationAr: "طلبك ينقصه مستند واحد.", recommendationEn: "Your application is missing one document.",
    },
  ];
}

// ---------------------------------------------------------------------------
// الحاسبة المالية (Financial Calculator) — حساب حتمي بحت
// ---------------------------------------------------------------------------
function computeFinancials(inputs = {}) {
  const num = (v) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : 0);
  const startupCosts = num(inputs.startupCosts);
  const rent = num(inputs.rent);
  const equipment = num(inputs.equipment);
  const salaries = num(inputs.salaries);
  const inventory = num(inputs.inventory);
  const marketing = num(inputs.marketing);
  const other = num(inputs.other);
  const expectedSales = num(inputs.expectedSales);
  const price = num(inputs.price);

  const totalStartupCost = startupCosts + equipment + inventory;
  const monthlyExpenses = rent + salaries + marketing + other;
  const estimatedRevenue = expectedSales * price;
  const estimatedProfit = estimatedRevenue - monthlyExpenses;
  const requiredSalesVolume = price > 0 ? Math.ceil(monthlyExpenses / price) : null;
  const breakEvenMonths = estimatedProfit > 0 ? Math.ceil(totalStartupCost / estimatedProfit) : null;

  return {
    totalStartupCost, monthlyExpenses, estimatedRevenue, estimatedProfit,
    requiredSalesVolume, breakEvenMonths,
    note: { ar: "هذه أرقام تقديرية للتخطيط فقط وليست ضماناً لأي نتيجة فعلية.", en: "These are estimates for planning purposes only, not a guarantee of actual results." },
  };
}

// ---------------------------------------------------------------------------
// فئات المنتجات (Suppliers & Products) — كتالوج تجريبي حسب القطاع، يُستخدم
// لعرض فئات منتجات جاهزة بدل أن يكتبها المستخدم يدوياً.
// ---------------------------------------------------------------------------
const PRODUCT_CATEGORIES_BY_SECTOR = {
  beauty: [
    { id: "face-care", ar: "العناية بالوجه", en: "Face Care" }, { id: "body-care", ar: "العناية بالجسم", en: "Body Care" },
    { id: "sunscreen", ar: "واقي شمس", en: "Sunscreen" }, { id: "cleansers", ar: "منظفات", en: "Cleansers" },
    { id: "moisturizers", ar: "مرطبات", en: "Moisturizers" }, { id: "serums", ar: "سيرومات", en: "Serums" },
    { id: "exfoliators", ar: "مقشرات", en: "Exfoliators" }, { id: "eye-care", ar: "العناية بالعين", en: "Eye Care" },
    { id: "natural-oils", ar: "زيوت طبيعية", en: "Natural Oils" }, { id: "gift-sets", ar: "مجموعات هدايا", en: "Gift Sets" },
    { id: "lip-care", ar: "العناية بالشفاه", en: "Lip Care" }, { id: "accessories", ar: "إكسسوارات تجميل", en: "Accessories" },
    { id: "mens-skincare", ar: "العناية بالبشرة للرجال", en: "Men's Skincare" }, { id: "organic-skincare", ar: "عناية عضوية معتمدة", en: "Organic Skincare" },
    { id: "spa-products", ar: "منتجات سبا", en: "Spa Products" },
  ],
  food: [
    { id: "main-dishes", ar: "الأطباق الرئيسية", en: "Main Dishes" }, { id: "appetizers", ar: "مقبلات", en: "Appetizers" },
    { id: "desserts", ar: "حلويات", en: "Desserts" }, { id: "beverages", ar: "مشروبات", en: "Beverages" },
    { id: "packaging", ar: "التغليف", en: "Packaging" }, { id: "raw-ingredients", ar: "مواد خام", en: "Raw Ingredients" },
  ],
  retail: [
    { id: "apparel", ar: "ملابس", en: "Apparel" }, { id: "accessories", ar: "إكسسوارات", en: "Accessories" },
    { id: "footwear", ar: "أحذية", en: "Footwear" }, { id: "packaging", ar: "التغليف", en: "Packaging" },
    { id: "seasonal", ar: "تشكيلة موسمية", en: "Seasonal Collection" },
  ],
  ecommerce: [
    { id: "electronics", ar: "إلكترونيات", en: "Electronics" }, { id: "home-goods", ar: "أدوات منزلية", en: "Home Goods" },
    { id: "packaging", ar: "التغليف والشحن", en: "Packaging & Shipping" }, { id: "gadgets", ar: "أدوات ذكية", en: "Gadgets" },
  ],
  tech: [
    { id: "hosting", ar: "استضافة وبنية تحتية", en: "Hosting & Infrastructure" }, { id: "design", ar: "تصميم وواجهات", en: "Design & UI" },
    { id: "dev-tools", ar: "أدوات تطوير", en: "Dev Tools" },
  ],
  services: [
    { id: "consulting", ar: "استشارات", en: "Consulting" }, { id: "packages", ar: "باقات خدمات", en: "Service Packages" },
    { id: "equipment", ar: "معدات العمل", en: "Work Equipment" },
  ],
  education: [
    { id: "curriculum", ar: "المناهج", en: "Curriculum Materials" }, { id: "supplies", ar: "أدوات تعليمية", en: "Teaching Supplies" },
  ],
  health: [
    { id: "medical-supplies", ar: "مستلزمات طبية", en: "Medical Supplies" }, { id: "equipment", ar: "معدات", en: "Equipment" },
  ],
  manufact: [
    { id: "raw-materials", ar: "مواد خام", en: "Raw Materials" }, { id: "machinery", ar: "آلات", en: "Machinery" },
    { id: "packaging", ar: "التغليف", en: "Packaging" },
  ],
  agro: [
    { id: "seeds-inputs", ar: "بذور ومدخلات زراعية", en: "Seeds & Farm Inputs" }, { id: "packaging", ar: "التغليف", en: "Packaging" },
  ],
  logistics: [
    { id: "fleet", ar: "أسطول المركبات", en: "Vehicle Fleet" }, { id: "packaging", ar: "التغليف", en: "Packaging" },
  ],
};
const DEFAULT_PRODUCT_CATEGORIES = [
  { id: "core-offering", ar: "المنتج/الخدمة الأساسية", en: "Core Product/Service" },
  { id: "packaging", ar: "التغليف", en: "Packaging" },
  { id: "marketing-materials", ar: "مواد تسويقية", en: "Marketing Materials" },
  { id: "equipment", ar: "معدات العمل", en: "Work Equipment" },
];
function getProductCategories(sector) {
  return PRODUCT_CATEGORIES_BY_SECTOR[sector] || DEFAULT_PRODUCT_CATEGORIES;
}

// ---------------------------------------------------------------------------
// الموردون (Suppliers) — كتالوج تجريبي (mock)، بيانات وهمية واقعية للعرض فقط.
// ---------------------------------------------------------------------------
const SUPPLIERS = [
  { id: "sup-beauty-1", sectors: ["beauty"], nameAr: "شركة الجمال الطبيعي التجارية", nameEn: "Natural Beauty Trading LLC",
    productsAr: ["العناية بالوجه", "العناية بالجسم", "زيوت طبيعية"], productsEn: ["Face Care", "Body Care", "Natural Oils"],
    priceMin: 3, priceMax: 8, moq: 50, deliveryDays: "3-5", shippingCost: 15, city: "muscat",
    contact: "info@naturalbeauty.om", website: "www.naturalbeauty.om" },
  { id: "sup-beauty-2", sectors: ["beauty"], nameAr: "الخليج للعناية بالبشرة بالجملة", nameEn: "Gulf Skincare Wholesale",
    productsAr: ["منظفات", "مرطبات", "سيرومات"], productsEn: ["Cleansers", "Moisturizers", "Serums"],
    priceMin: 4, priceMax: 10, moq: 100, deliveryDays: "5-7", shippingCost: 20, city: "muscat",
    contact: "sales@gulfskincare.com", website: "www.gulfskincare.com" },
  { id: "sup-beauty-3", sectors: ["beauty"], nameAr: "المنتجات العُمانية العشبية", nameEn: "Omani Herbal Products",
    productsAr: ["زيوت طبيعية", "مستخلصات عشبية"], productsEn: ["Natural Oils", "Herbal Extracts"],
    priceMin: 2, priceMax: 6, moq: 30, deliveryDays: "2-3", shippingCost: 10, city: "nizwa",
    contact: "info@omaniherbal.com", website: "www.omaniherbal.com" },
  { id: "sup-beauty-4", sectors: ["beauty"], nameAr: "العناية بالبشرة الوادي للتصنيع", nameEn: "Al Wadi Skincare Manufacturing",
    productsAr: ["كريمات الوجه", "مرطبات", "واقي شمس"], productsEn: ["Face Creams", "Moisturizers", "Sunscreen"],
    priceMin: 5, priceMax: 12, moq: 200, deliveryDays: "7-10", shippingCost: 25, city: "rustaq",
    contact: "contact@alwadiskincare.com", website: "www.alwadiskincare.com" },
  { id: "sup-beauty-5", sectors: ["beauty"], nameAr: "إمدادات الجمال العضوي", nameEn: "Organic Beauty Supply",
    productsAr: ["منظفات عضوية", "سيرومات طبيعية", "أقنعة وجه"], productsEn: ["Organic Cleansers", "Natural Serums", "Face Masks"],
    priceMin: 6, priceMax: 15, moq: 75, deliveryDays: "4-6", shippingCost: 18, city: "muscat",
    contact: "info@organicbeauty.ae", website: "www.organicbeauty.ae" },
  { id: "sup-beauty-6", sectors: ["beauty"], nameAr: "مستحضرات السلطنة الطبيعية", nameEn: "Sultanate Natural Cosmetics",
    productsAr: ["لوشن الجسم", "كريمات اليد", "مرطب الشفاه"], productsEn: ["Body Lotions", "Hand Creams", "Lip Balms"],
    priceMin: 2.5, priceMax: 7, moq: 60, deliveryDays: "3-4", shippingCost: 12, city: "sohar",
    contact: "sales@sultanatecosmetics.com", website: "www.sultanatecosmetics.com" },
  { id: "sup-beauty-7", sectors: ["beauty"], nameAr: "الخليج للتجميل بالجملة", nameEn: "GCC Beauty Wholesale",
    productsAr: ["عطور", "زيوت الجسم", "زيوت عطرية"], productsEn: ["Perfumes", "Body Oils", "Fragrance Oils"],
    priceMin: 4, priceMax: 18, moq: 25, deliveryDays: "2-4", shippingCost: 15, city: "muscat",
    contact: "info@gccbeauty.om", website: "www.gccbeauty.om" },
  { id: "sup-beauty-8", sectors: ["beauty"], nameAr: "جوهر الطبيعة", nameEn: "Nature's Essence FZE",
    productsAr: ["زيوت أساسية", "زيوت ناقلة", "زبدات طبيعية"], productsEn: ["Essential Oils", "Carrier Oils", "Butters"],
    priceMin: 3, priceMax: 9, moq: 40, deliveryDays: "5-8", shippingCost: 22, city: "muscat",
    contact: "orders@natureessence.ae", website: "www.natureessence.ae" },
  { id: "sup-beauty-9", sectors: ["beauty"], nameAr: "منتجات صلالة العشبية", nameEn: "Salalah Herbal Products",
    productsAr: ["منتجات اللبان", "صابون طبيعي", "شاي عشبي"], productsEn: ["Frankincense Products", "Natural Soaps", "Herbal Teas"],
    priceMin: 2, priceMax: 8, moq: 50, deliveryDays: "2-5", shippingCost: 14, city: "salalah",
    contact: "info@salalahherbal.om", website: "www.salalahherbal.om" },
  { id: "sup-beauty-10", sectors: ["beauty"], nameAr: "حلول الشرق الأوسط للعناية بالبشرة", nameEn: "Middle East Skincare Solutions",
    productsAr: ["سيرومات مضادة للشيخوخة", "كريمات العين", "تونر"], productsEn: ["Anti-aging Serums", "Eye Creams", "Toners"],
    priceMin: 7, priceMax: 20, moq: 30, deliveryDays: "6-9", shippingCost: 20, city: "muscat",
    contact: "sales@meskincare.com", website: "www.meskincare.com" },
  { id: "sup-beauty-11", sectors: ["beauty", "retail", "ecommerce"], nameAr: "حلول التغليف العُمانية", nameEn: "Oman Packaging Solutions",
    productsAr: ["عبوات زجاجية", "زجاجات بلاستيكية", "مضخات توزيع"], productsEn: ["Glass Jars", "Plastic Bottles", "Pump Dispensers"],
    priceMin: 0.5, priceMax: 3, moq: 100, deliveryDays: "3-6", shippingCost: 10, city: "muscat",
    contact: "info@omanpackaging.om", website: "www.omanpackaging.om" },
  { id: "sup-beauty-12", sectors: ["beauty"], nameAr: "مصنع مستحضرات التجميل العربي", nameEn: "Arabian Cosmetics Factory",
    productsAr: ["كريم أساس", "كونسيلر", "بودرة", "أحمر خدود"], productsEn: ["Foundation", "Concealer", "Powder", "Blush"],
    priceMin: 4, priceMax: 14, moq: 100, deliveryDays: "7-14", shippingCost: 30, city: "muscat",
    contact: "info@arabiancosmetics.com", website: "www.arabiancosmetics.com" },
  { id: "sup-beauty-13", sectors: ["beauty"], nameAr: "مركز مكونات التجميل", nameEn: "Beauty Ingredients Hub",
    productsAr: ["مكونات فعالة", "مواد حافظة", "مستحلبات"], productsEn: ["Active Ingredients", "Preservatives", "Emulsifiers"],
    priceMin: 1, priceMax: 8, moq: 20, deliveryDays: "4-7", shippingCost: 18, city: "muscat",
    contact: "ingredients@beautyhub.om", website: "www.beautyhub.om" },
  { id: "sup-beauty-14", sectors: ["beauty"], nameAr: "تجارة الأساسيات الطبيعية", nameEn: "Natural Essentials Trading",
    productsAr: ["جل الصبار", "زيت جوز الهند", "زبدة الشيا"], productsEn: ["Aloe Vera Gel", "Coconut Oil", "Shea Butter"],
    priceMin: 2, priceMax: 6, moq: 50, deliveryDays: "3-5", shippingCost: 12, city: "sohar",
    contact: "info@naturalessentials.om", website: "www.naturalessentials.om" },
  { id: "sup-beauty-15", sectors: ["beauty"], nameAr: "الخليج لمستحضرات التجميل الفاخرة", nameEn: "Gulf Premium Cosmetics",
    productsAr: ["كريمات وجه فاخرة", "منتجات مطعمة بالذهب"], productsEn: ["Luxury Face Creams", "Gold Infused Products"],
    priceMin: 10, priceMax: 30, moq: 10, deliveryDays: "5-8", shippingCost: 25, city: "muscat",
    contact: "premium@gulfcosmetics.ae", website: "www.gulfcosmetics.ae" },
  { id: "sup-food-1", sectors: ["food"], nameAr: "شركة التوريدات الغذائية العُمانية", nameEn: "Oman Food Supplies Co.",
    productsAr: ["مواد خام", "مشروبات"], productsEn: ["Raw Ingredients", "Beverages"],
    priceMin: 1, priceMax: 5, moq: 100, deliveryDays: "2-4", shippingCost: 12, city: "muscat",
    contact: "sales@omanfoodsupplies.om", website: "www.omanfoodsupplies.om" },
  { id: "sup-food-2", sectors: ["food"], nameAr: "مطابخ الخليج للتجهيزات", nameEn: "Gulf Kitchen Equipment",
    productsAr: ["معدات مطبخ", "تغليف"], productsEn: ["Kitchen Equipment", "Packaging"],
    priceMin: 20, priceMax: 500, moq: 1, deliveryDays: "5-10", shippingCost: 25, city: "sohar",
    contact: "info@gulfkitchen.com", website: "www.gulfkitchen.com" },
  { id: "sup-retail-1", sectors: ["retail", "ecommerce"], nameAr: "تجارة الأزياء الحديثة", nameEn: "Modern Apparel Trading",
    productsAr: ["ملابس", "إكسسوارات"], productsEn: ["Apparel", "Accessories"],
    priceMin: 3, priceMax: 15, moq: 50, deliveryDays: "4-6", shippingCost: 18, city: "muscat",
    contact: "wholesale@modernapparel.om", website: "www.modernapparel.om" },
  { id: "sup-retail-2", sectors: ["retail", "ecommerce"], nameAr: "مركز التغليف والشحن الخليجي", nameEn: "Gulf Packaging & Shipping Hub",
    productsAr: ["التغليف", "مستلزمات الشحن"], productsEn: ["Packaging", "Shipping Supplies"],
    priceMin: 1, priceMax: 4, moq: 100, deliveryDays: "2-3", shippingCost: 8, city: "muscat",
    contact: "info@gulfpackaging.com", website: "www.gulfpackaging.com" },
  { id: "sup-services-1", sectors: ["services", "tech", "education"], nameAr: "مورد المعدات المكتبية العُماني", nameEn: "Oman Office & Work Supplies",
    productsAr: ["معدات العمل", "أدوات تعليمية"], productsEn: ["Work Equipment", "Teaching Supplies"],
    priceMin: 5, priceMax: 200, moq: 1, deliveryDays: "3-5", shippingCost: 10, city: "muscat",
    contact: "sales@omanofficesupplies.om", website: "www.omanofficesupplies.om" },
];
function matchSuppliers(sector, lang = "ar") {
  const list = SUPPLIERS.filter((s) => !sector || s.sectors.includes(sector));
  return (list.length ? list : SUPPLIERS.slice(0, 3)).map((s) => ({
    id: s.id, name: lang === "ar" ? s.nameAr : s.nameEn, products: lang === "ar" ? s.productsAr : s.productsEn,
    priceMin: s.priceMin, priceMax: s.priceMax, moq: s.moq, deliveryDays: s.deliveryDays, shippingCost: s.shippingCost,
    city: s.city, contact: s.contact, website: s.website,
  }));
}

// ---------------------------------------------------------------------------
// المنافسون (Competitors & Location) — كتالوج تجريبي (mock)، مواقع ومسافات
// تقريبية للعرض فقط وليست بيانات خرائط حقيقية.
// ---------------------------------------------------------------------------
const COMPETITORS = [
  { id: "comp-beauty-1", sectors: ["beauty"], city: "muscat", nameAr: "نضرة بيوتي", nameEn: "Nudra Beauty", neighborhoodAr: "الخوير", neighborhoodEn: "Al Khuwair", distanceKm: 2.5, businessType: "physical+online", priceRange: "mid", rating: 4.2, reviews: 150, social: "@nudrabeauty", followers: "12K", website: "www.nudrabeauty.com", strengthsAr: "موقع جيد وحضور قوي في السوشال ميديا", strengthsEn: "Good location, strong social media presence", weaknessAr: "تشكيلة منتجات محدودة وأسعار أعلى", weaknessEn: "Limited product range, higher prices" },
  { id: "comp-beauty-2", sectors: ["beauty"], city: "muscat", nameAr: "جلو سكين كير", nameEn: "Glow Skincare", neighborhoodAr: "القرم", neighborhoodEn: "Qurum", distanceKm: 3.8, businessType: "online", priceRange: "premium", rating: 4.0, reviews: 95, social: "@glowskincare.om", followers: "8.5K", website: "www.glowskincare.om", strengthsAr: "تغليف مميز وهوية بصرية قوية", strengthsEn: "Premium packaging and strong visual identity", weaknessAr: "أسعار مرتفعة نسبياً", weaknessEn: "Relatively high prices" },
  { id: "comp-beauty-3", sectors: ["beauty"], city: "muscat", nameAr: "بيور بيوتي", nameEn: "Pure Beauty", neighborhoodAr: "مدينة السلطان قابوس", neighborhoodEn: "Madinat Sultan Qaboos", distanceKm: 4.2, businessType: "physical", priceRange: "budget", rating: 3.8, reviews: 60, social: "@purebeauty.om", followers: "4K", website: null, strengthsAr: "أسعار منافسة", strengthsEn: "Competitive pricing", weaknessAr: "حضور رقمي ضعيف", weaknessEn: "Weak digital presence" },
  { id: "comp-beauty-4", sectors: ["beauty"], city: "muscat", nameAr: "العناية العُمانية بالبشرة", nameEn: "Omani Skincare", neighborhoodAr: "العذيبة", neighborhoodEn: "Azaiba", distanceKm: 5.1, businessType: "physical+online", priceRange: "mid", rating: 4.4, reviews: 185, social: "@omanskincare", followers: "9K", website: "www.omanskincare.com", strengthsAr: "منتجات محلية وسمعة جيدة", strengthsEn: "Local products, good reputation", weaknessAr: "تسويق محدود وهوية تقليدية", weaknessEn: "Limited marketing, old-fashioned branding" },
  { id: "comp-beauty-5", sectors: ["beauty"], city: "muscat", nameAr: "روز بيوتي", nameEn: "Rose Beauty", neighborhoodAr: "الغبرة", neighborhoodEn: "Al Ghubra", distanceKm: 6.3, businessType: "online", priceRange: "luxury", rating: 4.8, reviews: 75, social: "@rosebeauty", followers: "6K", website: "www.rosebeauty.om", strengthsAr: "مكانة فاخرة وجودة عالية", strengthsEn: "Luxury positioning, high quality", weaknessAr: "غالية جداً وقاعدة عملاء صغيرة", weaknessEn: "Very expensive, small customer base" },
  { id: "comp-beauty-6", sectors: ["beauty"], city: "muscat", nameAr: "لمسة الطبيعة", nameEn: "Nature's Touch", neighborhoodAr: "السيب", neighborhoodEn: "Seeb", distanceKm: 7.8, businessType: "physical", priceRange: "mid", rating: 4.1, reviews: 132, social: "@naturestouch", followers: "5K", website: "www.naturestouch.om", strengthsAr: "منتجات طبيعية وموقع جيد", strengthsEn: "Natural products, good location", weaknessAr: "محل صغير وتسويق محدود", weaknessEn: "Small store, limited marketing" },
  { id: "comp-beauty-7", sectors: ["beauty"], city: "muscat", nameAr: "صنسيت بيوتي", nameEn: "Sunset Beauty", neighborhoodAr: "بوشر", neighborhoodEn: "Bowsher", distanceKm: 4.5, businessType: "physical+online", priceRange: "budget", rating: 3.5, reviews: 250, social: "@sunsetbeauty", followers: "18K", website: "www.sunsetbeauty.om", strengthsAr: "أسعار رخيصة جداً وسوق واسع", strengthsEn: "Very cheap, mass market", weaknessAr: "جودة منخفضة وخدمة عملاء ضعيفة", weaknessEn: "Low quality, poor customer service" },
  { id: "comp-beauty-8", sectors: ["beauty"], city: "muscat", nameAr: "أوربان سكين كير", nameEn: "Urban Skincare", neighborhoodAr: "الخوير", neighborhoodEn: "Al Khuwair", distanceKm: 1.8, businessType: "online", priceRange: "premium", rating: 4.3, reviews: 67, social: "@urbanskincare", followers: "7K", website: "www.urbanskincare.om", strengthsAr: "هوية عصرية وتسويق جيد", strengthsEn: "Modern branding, good marketing", weaknessAr: "أسعار مرتفعة وتشكيلة محدودة", weaknessEn: "Expensive, limited product range" },
  { id: "comp-beauty-9", sectors: ["beauty"], city: "muscat", nameAr: "ديزرت بيوتي", nameEn: "Desert Beauty", neighborhoodAr: "العنصب", neighborhoodEn: "Ansab", distanceKm: 9.2, businessType: "physical", priceRange: "budget", rating: 3.2, reviews: 180, social: "@desertbeauty", followers: "9K", website: "www.desertbeauty.om", strengthsAr: "رخيصة وموقع سهل الوصول", strengthsEn: "Cheap, accessible location", weaknessAr: "جودة منخفضة وهوية ضعيفة", weaknessEn: "Low quality, poor branding" },
  { id: "comp-beauty-10", sectors: ["beauty"], city: "muscat", nameAr: "فريش فيس", nameEn: "Fresh Face", neighborhoodAr: "مدينة السلطان قابوس", neighborhoodEn: "Madinat Al Sultan Qaboos", distanceKm: 3.5, businessType: "physical+online", priceRange: "mid", rating: 4.0, reviews: 95, social: "@freshface", followers: "6.5K", website: "www.freshface.om", strengthsAr: "منتجات جيدة ومحل جميل", strengthsEn: "Good products, nice store", weaknessAr: "حضور محدود في السوشال ميديا", weaknessEn: "Small social media presence, limited influencers" },
  { id: "comp-beauty-11", sectors: ["beauty"], city: "sohar", nameAr: "كثبان عُمان للجمال", nameEn: "Omani Dunes Beauty", neighborhoodAr: "صحار", neighborhoodEn: "Sohar", distanceKm: 12.5, businessType: "online", priceRange: "mid", rating: 4.5, reviews: 45, social: "@omandunesbeauty", followers: "5K", website: "www.omandunesbeauty.com", strengthsAr: "منتجات عُمانية أصيلة وصديقة للبيئة", strengthsEn: "Authentic Omani products, eco-friendly", weaknessAr: "بعيد جغرافياً وتوصيل محدود", weaknessEn: "Location far, limited delivery" },
  { id: "comp-beauty-12", sectors: ["beauty"], city: "muscat", nameAr: "جلامور كوزمتكس", nameEn: "Glamour Cosmetics", neighborhoodAr: "القرم", neighborhoodEn: "Qurum", distanceKm: 4.0, businessType: "physical", priceRange: "luxury", rating: 4.7, reviews: 210, social: "@glamourcosmetics", followers: "22K", website: "www.glamourcosmetics.om", strengthsAr: "منتجات راقية وقاعدة عملاء موالية", strengthsEn: "High-end products, loyal customer base", weaknessAr: "غالية جداً وفئة مستهدفة ضيقة", weaknessEn: "Very expensive, exclusive target" },
  { id: "comp-food-1", sectors: ["food"], city: "muscat", nameAr: "مطعم الذواقة", nameEn: "Al Dhawaqa Restaurant", neighborhoodAr: "الخوير", neighborhoodEn: "Al Khuwair", distanceKm: 1.8, businessType: "physical", priceRange: "mid", rating: 4.3, reviews: 320, social: "@aldhawaqa", followers: "20K", website: "www.aldhawaqa.om", strengthsAr: "موقع مركزي وقاعدة عملاء واسعة", strengthsEn: "Central location, large customer base", weaknessAr: "أوقات انتظار طويلة في الذروة", weaknessEn: "Long wait times during peak hours" },
  { id: "comp-food-2", sectors: ["food"], city: "muscat", nameAr: "كافيه المدينة", nameEn: "City Café", neighborhoodAr: "القرم", neighborhoodEn: "Qurum", distanceKm: 3.1, businessType: "physical", priceRange: "premium", rating: 4.5, reviews: 210, social: "@citycafe.om", followers: "15K", website: null, strengthsAr: "أجواء مميزة وجودة قهوة عالية", strengthsEn: "Great ambiance, high coffee quality", weaknessAr: "أسعار مرتفعة", weaknessEn: "High prices" },
  { id: "comp-retail-1", sectors: ["retail", "ecommerce"], city: "muscat", nameAr: "متجر الأناقة", nameEn: "Elegance Store", neighborhoodAr: "روي", neighborhoodEn: "Ruwi", distanceKm: 5.0, businessType: "physical+online", priceRange: "mid", rating: 4.0, reviews: 140, social: "@elegance.om", followers: "10K", website: "www.elegance.om", strengthsAr: "تشكيلة متنوعة", strengthsEn: "Wide variety of options", weaknessAr: "توصيل بطيء أحياناً", weaknessEn: "Sometimes slow delivery" },
];
function matchCompetitors(sector, city, lang = "ar") {
  let list = COMPETITORS.filter((c) => !sector || c.sectors.includes(sector));
  if (city) list = list.filter((c) => c.city === city).concat(list.filter((c) => c.city !== city));
  return list.slice(0, 12).map((c) => ({
    id: c.id, name: lang === "ar" ? c.nameAr : c.nameEn, neighborhood: lang === "ar" ? c.neighborhoodAr : c.neighborhoodEn,
    distanceKm: c.distanceKm, businessType: c.businessType, priceRange: c.priceRange, rating: c.rating, reviews: c.reviews,
    social: c.social, followers: c.followers, website: c.website,
    strengths: lang === "ar" ? c.strengthsAr : c.strengthsEn, weakness: lang === "ar" ? c.weaknessAr : c.weaknessEn,
  }));
}

// ---------------------------------------------------------------------------
// المواقع التجارية المتاحة (nearby commercial rentals) — تجريبي (mock)
// ---------------------------------------------------------------------------
const RENTALS = [
  { id: "rent-muscat-1", city: "muscat", nameAr: "مساحة تجارية - الخوير", nameEn: "Al Khuwair Commercial Space", sizeSqm: 80, rent: 400, distanceM: 200, suitableAr: ["تجزئة", "مكتب", "معرض"], suitableEn: ["Retail", "Office", "Showroom"], contact: "property@omanrealestate.com", source: "Oman Real Estate" },
  { id: "rent-muscat-2", city: "muscat", nameAr: "مركز القرم التجاري", nameEn: "Qurum Business Center", sizeSqm: 120, rent: 650, distanceM: 1200, suitableAr: ["مكتب", "تجزئة", "صالون تجميل"], suitableEn: ["Office", "Retail", "Beauty Salon"], contact: "info@qurumcenter.com", source: "Commercial Properties Oman" },
  { id: "rent-muscat-3", city: "muscat", nameAr: "مساحة تجارية - مدينة السلطان قابوس", nameEn: "Madinat Sultan Qaboos Retail Space", sizeSqm: 95, rent: 550, distanceM: 1800, suitableAr: ["تجزئة", "بوتيك", "محل تجميل"], suitableEn: ["Retail", "Boutique", "Beauty Shop"], contact: "commercial@msq.om", source: "MSQ Commercial" },
  { id: "rent-muscat-4", city: "muscat", nameAr: "مجمع الغبرة التجاري", nameEn: "Al Ghubra Commercial Complex", sizeSqm: 150, rent: 750, distanceM: 3500, suitableAr: ["تجزئة", "مكتب", "معرض"], suitableEn: ["Retail", "Office", "Showroom"], contact: "leasing@alghubra.om", source: "Al Ghubra Properties" },
  { id: "rent-muscat-5", city: "muscat", nameAr: "وحدة تجزئة - العذيبة", nameEn: "Azaiba Retail Unit", sizeSqm: 70, rent: 350, distanceM: 4000, suitableAr: ["تجزئة", "مشروع صغير", "مركز خدمات"], suitableEn: ["Retail", "Small Business", "Service Center"], contact: "info@azaibaproperties.om", source: "Azaiba Properties" },
  { id: "rent-muscat-6", city: "muscat", nameAr: "مجمع السيب للأعمال", nameEn: "Seeb Business Park", sizeSqm: 200, rent: 900, distanceM: 5500, suitableAr: ["مكتب", "مستودع", "معرض"], suitableEn: ["Office", "Warehouse", "Showroom"], contact: "leasing@seebpark.om", source: "Seeb Properties" },
  { id: "rent-muscat-7", city: "muscat", nameAr: "مركز بوشر التجاري", nameEn: "Bowsher Commercial Center", sizeSqm: 85, rent: 420, distanceM: 2800, suitableAr: ["تجزئة", "صالون تجميل", "عيادة"], suitableEn: ["Retail", "Beauty Salon", "Clinic"], contact: "info@bowshercommercial.om", source: "Bowsher Commercial" },
  { id: "rent-muscat-8", city: "muscat", nameAr: "مساحة تجزئة - العنصب", nameEn: "Ansab Retail Space", sizeSqm: 60, rent: 280, distanceM: 6200, suitableAr: ["تجزئة", "مشروع صغير"], suitableEn: ["Retail", "Small Business"], contact: "rent@ansab.om", source: "Ansab Properties" },
  { id: "rent-muscat-9", city: "muscat", nameAr: "مجمع الموالح التجاري", nameEn: "Al Mawaleh Commercial Complex", sizeSqm: 175, rent: 800, distanceM: 7000, suitableAr: ["تجزئة", "مكتب", "مطعم", "معرض"], suitableEn: ["Retail", "Office", "Restaurant", "Showroom"], contact: "leasing@almawaleh.om", source: "Al Mawaleh Properties" },
  { id: "rent-muscat-10", city: "muscat", nameAr: "وحدات تجزئة - الشاطئ", nameEn: "Al Shati Retail Units", sizeSqm: 110, rent: 580, distanceM: 2500, suitableAr: ["تجزئة", "بوتيك", "كافيه", "صالون تجميل"], suitableEn: ["Retail", "Boutique", "Cafe", "Beauty Salon"], contact: "info@alshati.om", source: "Al Shati Properties" },
  { id: "rent-muscat-11", city: "muscat", nameAr: "مساحة تجارية - الغبرة الشمالية", nameEn: "Ghubra North Commercial Space", sizeSqm: 130, rent: 620, distanceM: 4800, suitableAr: ["تجزئة", "مكتب", "معرض"], suitableEn: ["Retail", "Office", "Showroom"], contact: "leasing@ghubra-north.om", source: "Ghubra North Properties" },
  { id: "rent-muscat-12", city: "muscat", nameAr: "مركز المعبيلة للأعمال", nameEn: "Mabelah Business Center", sizeSqm: 250, rent: 1050, distanceM: 8500, suitableAr: ["مستودع", "مكتب", "معرض", "توزيع"], suitableEn: ["Warehouse", "Office", "Showroom", "Distribution"], contact: "leasing@mabelah.om", source: "Mabelah Properties" },
  { id: "rent-sohar-1", city: "sohar", nameAr: "معرض تجاري - صحار", nameEn: "Sohar Retail Unit", sizeSqm: 60, rent: 220, distanceM: 500, suitableAr: ["تجزئة", "مخزن صغير"], suitableEn: ["Retail", "Small Storage"], contact: "leasing@soharproperties.om", source: "Sohar Properties" },
  { id: "rent-nizwa-1", city: "nizwa", nameAr: "محل تجاري - نزوى", nameEn: "Nizwa Shop Unit", sizeSqm: 45, rent: 160, distanceM: 300, suitableAr: ["تجزئة", "ورشة صغيرة"], suitableEn: ["Retail", "Small Workshop"], contact: "info@nizwarealestate.om", source: "Nizwa Real Estate" },
  { id: "rent-salalah-1", city: "salalah", nameAr: "وحدة تجارية - صلالة", nameEn: "Salalah Commercial Unit", sizeSqm: 70, rent: 240, distanceM: 400, suitableAr: ["تجزئة", "مطعم صغير"], suitableEn: ["Retail", "Small Restaurant"], contact: "leasing@salalahproperties.om", source: "Salalah Properties" },
];
function matchRentals(city, lang = "ar") {
  let list = RENTALS.filter((r) => !city || r.city === city);
  if (!list.length) list = RENTALS.slice(0, 3);
  return list.map((r) => ({
    id: r.id, name: lang === "ar" ? r.nameAr : r.nameEn, sizeSqm: r.sizeSqm, rent: r.rent, distanceM: r.distanceM,
    suitableFor: lang === "ar" ? r.suitableAr : r.suitableEn, contact: r.contact, source: r.source,
  }));
}

// ---------------------------------------------------------------------------
// المؤثرون (Marketing & Influencer Finder) — كتالوج تجريبي (mock)
// ---------------------------------------------------------------------------
const INFLUENCERS = [
  { id: "inf-beauty-1", sectors: ["beauty"], name: "ندى البلوشي", platforms: ["Instagram", "TikTok"], followers: "120K", audienceAr: "نساء شابات (عُمان + الخليج)", audienceEn: "Young women (Oman + GCC)", engagementRate: 4.2, contentAr: "تجميل، عناية بالبشرة، أسلوب حياة", contentEn: "Beauty, Skincare, Lifestyle", city: "muscat", contact: "nada@influencer.om", social: "@nada_beauty", priceMin: 80, priceMax: 150, campaignAr: "مراجعات منتجات، تعليمية، سحوبات", campaignEn: "Product reviews, tutorials, giveaways" },
  { id: "inf-beauty-2", sectors: ["beauty"], name: "سارة الريامي", platforms: ["TikTok", "Snapchat"], followers: "85K", audienceAr: "مراهقات ونساء شابات (عُمان)", audienceEn: "Teenagers, young women (Oman)", engagementRate: 5.8, contentAr: "مكياج، عناية بالبشرة", contentEn: "Makeup, Skincare, Hauls", city: "seeb", contact: "sara@influencer.om", social: "@sara_skincare", priceMin: 50, priceMax: 100, campaignAr: "فتح الصناديق، يوم في حياتي، عرض المنتج", campaignEn: "Unboxing, day-in-the-life, product demos" },
  { id: "inf-beauty-3", sectors: ["beauty"], name: "مريم الحارثي", platforms: ["YouTube", "Instagram"], followers: "65K", audienceAr: "نساء (25-45)، مهتمات بالتجميل", audienceEn: "Women (25-45), beauty enthusiasts", engagementRate: 3.5, contentAr: "مراجعات معمّقة، تعليمية", contentEn: "In-depth reviews, tutorials, natural beauty", city: "muscat", contact: "maryam@influencer.om", social: "@maryam_naturalbeauty", priceMin: 120, priceMax: 200, campaignAr: "مراجعات مفصّلة، تحليل المكونات", campaignEn: "Detailed reviews, ingredient analysis" },
  { id: "inf-beauty-4", sectors: ["beauty"], name: "ليلى الكندية", platforms: ["Instagram", "TikTok"], followers: "45K", audienceAr: "نساء شابات (عُمان)", audienceEn: "Young women (Oman)", engagementRate: 4.8, contentAr: "أسلوب حياة، تجميل، موضة", contentEn: "Lifestyle, Beauty, Fashion", city: "salalah", contact: "laila@influencer.om", social: "@laila_beauty", priceMin: 30, priceMax: 60, campaignAr: "منشورات ستايل، تعاون مع العلامة", campaignEn: "Style posts, brand collab" },
  { id: "inf-beauty-5", sectors: ["beauty"], name: "أحمد الهنائي", platforms: ["Instagram", "YouTube"], followers: "30K", audienceAr: "رجال ونساء (الخليج)", audienceEn: "Men, women (GCC)", engagementRate: 2.9, contentAr: "العناية بالبشرة للرجال، العناية الشخصية", contentEn: "Skincare for men, Grooming", city: "muscat", contact: "ahmed@influencer.om", social: "@ahmed_grooming", priceMin: 40, priceMax: 80, campaignAr: "مراجعة منتج، روتين يومي", campaignEn: "Product review, daily routine" },
  { id: "inf-beauty-6", sectors: ["beauty"], name: "ريم الشيدية", platforms: ["TikTok", "Snapchat"], followers: "95K", audienceAr: "مراهقات ونساء شابات", audienceEn: "Teen girls, young women", engagementRate: 6.2, contentAr: "تعليمات مكياج، حيل تجميل", contentEn: "Makeup tutorials, Beauty hacks", city: "muscat", contact: "reem@influencer.om", social: "@reem_makeup", priceMin: 60, priceMax: 120, campaignAr: "فيديو تعليمي، تحدي مكياج", campaignEn: "Tutorial video, makeup challenge" },
  { id: "inf-beauty-7", sectors: ["beauty"], name: "هدى الرواحية", platforms: ["Instagram", "YouTube"], followers: "55K", audienceAr: "نساء (عُمان، الإمارات)", audienceEn: "Women (Oman, UAE)", engagementRate: 3.8, contentAr: "جمال طبيعي، عافية، أسلوب حياة", contentEn: "Natural beauty, wellness, lifestyle", city: "seeb", contact: "huda@influencer.om", social: "@huda_natural", priceMin: 70, priceMax: 130, campaignAr: "روتين طبيعي، مراجعة صادقة", campaignEn: "Natural routine, honest review" },
  { id: "inf-beauty-8", sectors: ["beauty"], name: "خالد البلوشي", platforms: ["Instagram", "TikTok"], followers: "25K", audienceAr: "رجال ونساء (عُمان)", audienceEn: "Men, women (Oman)", engagementRate: 3.2, contentAr: "عناية الرجال بالبشرة، عطور", contentEn: "Men's skincare, Fragrance", city: "muscat", contact: "khalid@influencer.om", social: "@khalid_scents", priceMin: 25, priceMax: 50, campaignAr: "مراجعة عطر، روتين صباحي", campaignEn: "Fragrance review, morning routine" },
  { id: "inf-beauty-9", sectors: ["beauty"], name: "منى القاسمي", platforms: ["YouTube", "Instagram"], followers: "80K", audienceAr: "نساء (الخليج، الشرق الأوسط)", audienceEn: "Women (GCC, Middle East)", engagementRate: 4.5, contentAr: "مراجعات تجميل، روتين العناية بالبشرة", contentEn: "Beauty reviews, Skincare routines", city: "muscat", contact: "mona@influencer.ae", social: "@mona_beauty", priceMin: 150, priceMax: 250, campaignAr: "مراجعة شاملة، فيديو روتين", campaignEn: "Full review, routine video" },
  { id: "inf-beauty-10", sectors: ["beauty"], name: "نورة الجابرية", platforms: ["Instagram", "TikTok"], followers: "38K", audienceAr: "نساء شابات (عُمان)", audienceEn: "Young women (Oman)", engagementRate: 5.1, contentAr: "تجميل، أسلوب حياة، موضة", contentEn: "Beauty, Lifestyle, Fashion", city: "nizwa", contact: "noura@influencer.om", social: "@noura_lifestyle", priceMin: 35, priceMax: 70, campaignAr: "قصة يومية، منشور تعريفي", campaignEn: "Daily story, intro post" },
  { id: "inf-beauty-11", sectors: ["beauty"], name: "سلطان العامري", platforms: ["Instagram", "YouTube"], followers: "20K", audienceAr: "رجال (عُمان، الخليج)", audienceEn: "Men (Oman, GCC)", engagementRate: 2.5, contentAr: "عناية الرجال، اللحية", contentEn: "Men's grooming, Beard care", city: "muscat", contact: "sultan@influencer.om", social: "@sultan_grooming", priceMin: 20, priceMax: 40, campaignAr: "روتين لحية، مراجعة منتج", campaignEn: "Beard routine, product review" },
  { id: "inf-beauty-12", sectors: ["beauty"], name: "فاطمة المزروعية", platforms: ["TikTok", "Snapchat"], followers: "120K", audienceAr: "مراهقون وشباب (عُمان)", audienceEn: "Teens, young adults (Oman)", engagementRate: 7.0, contentAr: "مكياج، عناية بالبشرة", contentEn: "Makeup, Skincare, Hauls", city: "muscat", contact: "fatima@influencer.om", social: "@fatima_glow", priceMin: 70, priceMax: 140, campaignAr: "فتح صناديق، تحدي مكياج", campaignEn: "Unboxing, makeup challenge" },
  { id: "inf-beauty-13", sectors: ["beauty"], name: "عمر الحسني", platforms: ["Instagram", "TikTok"], followers: "15K", audienceAr: "رجال ونساء (عُمان)", audienceEn: "Men, women (Oman)", engagementRate: 3.0, contentAr: "صحة، عافية، عناية بالبشرة", contentEn: "Health, wellness, skincare", city: "seeb", contact: "omar@influencer.om", social: "@omar_health", priceMin: 15, priceMax: 30, campaignAr: "منشور صحي، مراجعة منتج", campaignEn: "Wellness post, product review" },
  { id: "inf-beauty-14", sectors: ["beauty"], name: "ليان السعيدية", platforms: ["YouTube", "Instagram"], followers: "70K", audienceAr: "نساء (عُمان، الإمارات، السعودية)", audienceEn: "Women (Oman, UAE, KSA)", engagementRate: 4.0, contentAr: "تجميل فاخر، عناية بالبشرة راقية", contentEn: "Luxury beauty, High-end skincare", city: "muscat", contact: "layan@influencer.ae", social: "@layan_luxury", priceMin: 180, priceMax: 300, campaignAr: "مراجعة فاخرة، تعاون حصري", campaignEn: "Luxury review, exclusive collab" },
  { id: "inf-beauty-15", sectors: ["beauty"], name: "راشد البوسعيدي", platforms: ["Instagram", "TikTok"], followers: "42K", audienceAr: "شباب (عُمان)", audienceEn: "Young adults (Oman)", engagementRate: 4.6, contentAr: "ستايل الرجال، عناية شخصية", contentEn: "Men's style, grooming, skincare", city: "muscat", contact: "rashid@influencer.om", social: "@rashid_style", priceMin: 45, priceMax: 90, campaignAr: "منشور ستايل، روتين يومي", campaignEn: "Style post, daily routine" },
  { id: "inf-food-1", sectors: ["food"], name: "خالد الشحي", platforms: ["Instagram", "TikTok"], followers: "95K", audienceAr: "محبو الطعام (عُمان)", audienceEn: "Foodies (Oman)", engagementRate: 4.8, contentAr: "مراجعات مطاعم، وصفات", contentEn: "Restaurant reviews, recipes", city: "muscat", contact: "khalid@influencer.om", social: "@khalid_eats", priceMin: 70, priceMax: 130, campaignAr: "زيارة وتصوير، مراجعة صادقة", campaignEn: "On-site shoot, honest review" },
  { id: "inf-food-2", sectors: ["food"], name: "منى الهنائية", platforms: ["Instagram"], followers: "40K", audienceAr: "عائلات (عُمان)", audienceEn: "Families (Oman)", engagementRate: 3.9, contentAr: "طبخ منزلي، عروض عائلية", contentEn: "Home cooking, family deals", city: "muscat", contact: "muna@influencer.om", social: "@muna_kitchen", priceMin: 40, priceMax: 90, campaignAr: "منشورات ستوريز، تجربة عائلية", campaignEn: "Story posts, family experience" },
  { id: "inf-retail-1", sectors: ["retail", "ecommerce"], name: "علي البوسعيدي", platforms: ["Instagram", "TikTok"], followers: "75K", audienceAr: "شباب مهتمون بالموضة (عُمان)", audienceEn: "Fashion-conscious youth (Oman)", engagementRate: 4.1, contentAr: "إطلالات، تجارب تسوّق", contentEn: "Outfit ideas, shopping hauls", city: "muscat", contact: "ali@influencer.om", social: "@ali_style", priceMin: 60, priceMax: 120, campaignAr: "إطلالة كاملة، كود خصم", campaignEn: "Full outfit feature, discount code" },
  { id: "inf-generic-1", sectors: ["tech", "services", "education", "health", "manufact", "agro", "logistics"], name: "فاطمة الكندية", platforms: ["Instagram", "LinkedIn"], followers: "30K", audienceAr: "رواد أعمال ومهنيون (عُمان)", audienceEn: "Entrepreneurs & professionals (Oman)", engagementRate: 3.2, contentAr: "محتوى أعمال وريادة", contentEn: "Business & entrepreneurship content", city: "muscat", contact: "fatma@influencer.om", social: "@fatma_biz", priceMin: 50, priceMax: 100, campaignAr: "منشور تعريفي، مقابلة قصيرة", campaignEn: "Intro post, short interview" },
];
function matchInfluencers(sector, lang = "ar") {
  const list = INFLUENCERS.filter((i) => !sector || i.sectors.includes(sector));
  return (list.length ? list : INFLUENCERS.slice(-1)).map((i) => ({
    id: i.id, name: i.name, platforms: i.platforms, followers: i.followers,
    audience: lang === "ar" ? i.audienceAr : i.audienceEn, engagementRate: i.engagementRate,
    content: lang === "ar" ? i.contentAr : i.contentEn, city: i.city, contact: i.contact, social: i.social,
    priceMin: i.priceMin, priceMax: i.priceMax, campaign: lang === "ar" ? i.campaignAr : i.campaignEn,
  }));
}

// ---------------------------------------------------------------------------
// المستقلون (Freelancers) — كتالوج تجريبي (mock)، عام لكل القطاعات (تصميم،
// تسويق، تصوير، تطوير، محتوى، تمويل...) وليس خاصاً بقطاع واحد.
// ---------------------------------------------------------------------------
const FREELANCERS = [
  { id: "fl-1", name: "أحمد المسلمي", nameEn: "Ahmed Al Musallami", categoryAr: "تصميم الشعارات والهوية البصرية", categoryEn: "Logo Design, Brand Identity", experienceYears: 8, city: "muscat", rating: 4.8, reviews: 87, skillsAr: ["تصميم شعارات", "هوية بصرية", "تصميم للسوشال ميديا", "تصميم التغليف"], skillsEn: ["Logo Design", "Brand Identity", "Social Media Graphics", "Packaging Design"], priceMin: 15, priceMax: 25, contact: "ahmad.design@email.com", social: "@ahmad_creations" },
  { id: "fl-2", name: "سارة الخروصية", nameEn: "Sara Al Kharusi", categoryAr: "التسويق الرقمي وإدارة السوشال ميديا", categoryEn: "Digital Marketing, Social Media", experienceYears: 5, city: "seeb", rating: 4.9, reviews: 124, skillsAr: ["إدارة سوشال ميديا", "استراتيجية محتوى", "التسويق بالمؤثرين", "إعلانات رقمية"], skillsEn: ["Social Media Management", "Content Strategy", "Influencer Marketing", "Digital Advertising"], priceMin: 12, priceMax: 20, contact: "sara.marketing@email.com", social: "@sara_digital" },
  { id: "fl-3", name: "محمد العجمي", nameEn: "Mohammed Al Ajmi", categoryAr: "التصوير الفوتوغرافي وإنتاج الفيديو", categoryEn: "Photography, Video Production", experienceYears: 6, city: "muscat", rating: 4.7, reviews: 65, skillsAr: ["تصوير منتجات", "إنتاج فيديو", "تصوير عارضين", "تصوير سينمائي للمنتجات"], skillsEn: ["Product Photography", "Video Production", "Model Photography", "Product Cinematography"], priceMin: 20, priceMax: 35, contact: "mohammed.photo@email.com", social: "@mohammed_visuals" },
  { id: "fl-4", name: "ناديا الريامية", nameEn: "Nadia Al Riyami", categoryAr: "كتابة المحتوى والصياغة الإعلانية", categoryEn: "Content Writing, Copywriting", experienceYears: 4, city: "muscat", rating: 4.6, reviews: 43, skillsAr: ["صياغة إعلانية", "كتابة محتوى", "كتابة SEO", "كتابة مدونات"], skillsEn: ["Copywriting", "Content Writing", "SEO Writing", "Blog Writing"], priceMin: 10, priceMax: 18, contact: "nadia.writing@email.com", social: "@nadia_content" },
  { id: "fl-5", name: "سعود الحبسي", nameEn: "Saud Al Habsi", categoryAr: "تطوير المواقع والمتاجر الإلكترونية", categoryEn: "Web Development, E-commerce", experienceYears: 7, city: "salalah", rating: 4.8, reviews: 56, skillsAr: ["تطوير مواقع", "متاجر إلكترونية", "Shopify", "WordPress"], skillsEn: ["Website Development", "E-commerce", "Shopify", "WordPress"], priceMin: 18, priceMax: 30, contact: "saud.dev@email.com", social: "@saud_web" },
  { id: "fl-6", name: "هدى الرواحية", nameEn: "Huda Al Rawahi", categoryAr: "تصميم جرافيك ورسوم توضيحية", categoryEn: "Graphic Design, Illustration", experienceYears: 3, city: "muscat", rating: 4.4, reviews: 28, skillsAr: ["تصميم جرافيك", "رسوم توضيحية", "هوية بصرية", "تصميم سوشال ميديا"], skillsEn: ["Graphic Design", "Illustration", "Branding", "Social Media Design"], priceMin: 8, priceMax: 15, contact: "huda.design@email.com", social: "@huda_art" },
  { id: "fl-7", name: "عبدالله اللواتي", nameEn: "Abdullah Al Lawati", categoryAr: "إدارة حسابات التواصل الاجتماعي", categoryEn: "Social Media Management", experienceYears: 5, city: "seeb", rating: 4.5, reviews: 39, skillsAr: ["إدارة سوشال ميديا", "إنشاء محتوى", "إدارة المجتمع"], skillsEn: ["Social Media Management", "Content Creation", "Community Management"], priceMin: 12, priceMax: 22, contact: "abdullah.social@email.com", social: "@abdullah_social" },
  { id: "fl-8", name: "منى الكندية", nameEn: "Mona Al Kindi", categoryAr: "التصميم الداخلي وتصميم المحلات", categoryEn: "Interior Design, Retail Design", experienceYears: 6, city: "muscat", rating: 4.9, reviews: 47, skillsAr: ["تصميم داخلي", "تصميم محلات", "تصور ثلاثي الأبعاد", "تخطيط المساحات"], skillsEn: ["Interior Design", "Retail Design", "3D Visualization", "Space Planning"], priceMin: 20, priceMax: 40, contact: "mona.design@email.com", social: "@mona_interiors" },
  { id: "fl-9", name: "خالد الماجني", nameEn: "Khalid Al Majani", categoryAr: "الإعلانات الرقمية المدفوعة", categoryEn: "Digital Advertising, PPC", experienceYears: 4, city: "muscat", rating: 4.3, reviews: 34, skillsAr: ["إعلانات جوجل", "إعلانات فيسبوك", "إعلانات تيك توك", "تحليلات"], skillsEn: ["Google Ads", "Facebook Ads", "TikTok Ads", "Analytics"], priceMin: 15, priceMax: 25, contact: "khalid.ads@email.com", social: "@khalid_ads" },
  { id: "fl-10", name: "رنا الشعيلية", nameEn: "Rana Al Shuaili", categoryAr: "العلاقات العامة والإعلامية", categoryEn: "Public Relations, Media Relations", experienceYears: 7, city: "muscat", rating: 4.7, reviews: 52, skillsAr: ["علاقات عامة", "علاقات إعلامية", "إدارة الفعاليات", "إدارة الأزمات"], skillsEn: ["Public Relations", "Media Relations", "Event Management", "Crisis Communication"], priceMin: 22, priceMax: 40, contact: "rana.pr@email.com", social: "@rana_pr" },
  { id: "fl-11", name: "سلطان الحارثي", nameEn: "Sultan Al Harthy", categoryAr: "استراتيجية العلامة التجارية والاستشارات", categoryEn: "Brand Strategy, Consulting", experienceYears: 10, city: "muscat", rating: 4.9, reviews: 78, skillsAr: ["استراتيجية العلامة", "استشارات أعمال", "أبحاث السوق"], skillsEn: ["Brand Strategy", "Business Consulting", "Market Research"], priceMin: 30, priceMax: 60, contact: "sultan.consult@email.com", social: "@sultan_strategy" },
  { id: "fl-12", name: "ليلى الزكوانية", nameEn: "Layla Al Zakwani", categoryAr: "تصميم الأزياء والمنتجات", categoryEn: "Fashion Design, Product Design", experienceYears: 5, city: "seeb", rating: 4.6, reviews: 31, skillsAr: ["تصميم منتجات", "تصميم أزياء", "تصميم إكسسوارات"], skillsEn: ["Product Design", "Fashion Design", "Accessories Design"], priceMin: 18, priceMax: 30, contact: "layla.design@email.com", social: "@layla_fashion" },
  { id: "fl-13", name: "راشد البلوشي", nameEn: "Rashid Al Balushi", categoryAr: "المحاسبة والشؤون المالية", categoryEn: "Finance, Accounting", experienceYears: 8, city: "muscat", rating: 4.8, reviews: 49, skillsAr: ["محاسبة", "مسك دفاتر", "تخطيط مالي", "استشارات ضريبية"], skillsEn: ["Accounting", "Bookkeeping", "Financial Planning", "Tax Advisory"], priceMin: 20, priceMax: 35, contact: "rashid.account@email.com", social: "@rashid_finance" },
  { id: "fl-14", name: "نورة الهنائية", nameEn: "Noora Al Hinai", categoryAr: "الترجمة والتوطين اللغوي", categoryEn: "Translation, Localization", experienceYears: 6, city: "muscat", rating: 4.5, reviews: 37, skillsAr: ["ترجمة", "توطين", "مراجعة لغوية", "استشارات ثقافية"], skillsEn: ["Translation", "Localization", "Proofreading", "Cultural Consulting"], priceMin: 10, priceMax: 18, contact: "noora.translate@email.com", social: "@noora_translate" },
  { id: "fl-15", name: "يوسف البلوشي", nameEn: "Yousuf Al Bulushi", categoryAr: "تطوير الأعمال والمبيعات", categoryEn: "Business Development, Sales", experienceYears: 9, city: "salalah", rating: 4.4, reviews: 42, skillsAr: ["تطوير الأعمال", "استراتيجية المبيعات", "تطوير الشراكات"], skillsEn: ["Business Development", "Sales Strategy", "Partnership Development"], priceMin: 25, priceMax: 45, contact: "yousuf.biz@email.com", social: "@yousuf_bizdev" },
];
function matchFreelancers(category, lang = "ar") {
  const list = category ? FREELANCERS.filter((f) => (lang === "ar" ? f.categoryAr : f.categoryEn).includes(category)) : FREELANCERS;
  return (list.length ? list : FREELANCERS).map((f) => ({
    id: f.id, name: lang === "ar" ? f.name : (f.nameEn || f.name), category: lang === "ar" ? f.categoryAr : f.categoryEn,
    experienceYears: f.experienceYears, city: f.city, rating: f.rating, reviews: f.reviews,
    skills: lang === "ar" ? f.skillsAr : f.skillsEn, priceMin: f.priceMin, priceMax: f.priceMax,
    contact: f.contact, social: f.social,
  }));
}

module.exports = {
  SECTORS, CITIES, TEAM_FACTORS,
  GOV_BODIES, SECTOR_BODY,
  buildRoadmap,
  SERVICES, FUNDING_PROGRAMS, matchServices, matchFunding,
  evaluateEligibility, DISCLAIMER,
  DOCUMENT_DEFS, buildDocumentChecklist,
  FORM_FIELD_DEFS, explainFormField,
  seedApplications,
  computeFinancials,
  getProductCategories, matchSuppliers, matchCompetitors, matchRentals, matchInfluencers, matchFreelancers,
};
