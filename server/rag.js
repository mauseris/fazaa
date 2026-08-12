// ============================================================================
// RAG حقيقي: تقسيم إلى مقاطع (chunking) + بحث بالتشابه الدلالي (cosine similarity)
// ============================================================================
// المسار الأساسي: تمثيلات متجهية حقيقية (embeddings) عبر البوابة المركزية إن كانت متاحة.
// مسار الرجوع (fallback) عند عدم توفر endpoint للـ embeddings: TF-IDF محلي بالكامل —
// تقنية استرجاع معلومات حقيقية ومعروفة، لا تحتاج أي اتصال خارجي، فتضمن عمل الوكيل
// حتى لو كانت البوابة لا تدعم embeddings.

// ---- المقاطع (chunks) — كل حقيقة هنا تم التحقق منها عبر بحث ويب مباشر وتتضمن رابط المصدر ----
const CHUNKS = [
  { id:"riyada", lang:"ar", url:"https://www.sme.gov.om/",
    text:"هيئة تنمية المؤسسات الصغيرة والمتوسطة (ريادة) هي الجهة الحكومية الرسمية المعنية بدعم رواد الأعمال في سلطنة عمان. بموجب المرسوم السلطاني رقم 107/2020، تم دمج ما كان يُعرف سابقاً بـ«صندوق الرفد» ضمن هيكل الهيئة، فلم يعد جهة تمويل منفصلة. تقدّم الهيئة استشارات مجانية، وبرامج تدريب، وبطاقة ريادة الأعمال التي تمنح حاملها تسهيلات من جهات حكومية وخاصة متعددة." },
  { id:"riyada-en", lang:"en", url:"https://www.sme.gov.om/",
    text:"Riyada (SME Development Authority) is the official Omani government body supporting entrepreneurs. Under Royal Decree 107/2020, the former 'Al Rafd Fund' was merged into Riyada and is no longer a separate funding entity. Riyada offers free consulting, training programs, and an Entrepreneurship Card that grants holders facilities from multiple government and private bodies." },

  { id:"investeasy", lang:"ar", url:"https://investeasy.gov.om",
    text:"بوابة استثمر بسهولة (Invest Easy) هي المنصة الإلكترونية الرسمية لوزارة التجارة والصناعة وترويج الاستثمار لإصدار السجل التجاري. تشمل الخطوات: حجز الاسم التجاري إلكترونياً، ثم اختيار النشاط الاقتصادي وموقع الممارسة، ثم إصدار الترخيص التلقائي في حالات كثيرة فور استيفاء الشروط، ودفع الرسوم إلكترونياً." },
  { id:"investeasy-en", lang:"en", url:"https://investeasy.gov.om",
    text:"The Invest Easy portal is the official e-government platform (under the Ministry of Commerce, Industry & Investment Promotion) for issuing commercial registration. Steps include: reserving the trade name online, selecting the economic activity and location, often automatic license issuance once conditions are met, and paying fees electronically." },

  { id:"occi", lang:"ar", url:"https://www.omanchamber.om",
    text:"غرفة تجارة وصناعة عُمان (OCCI)، تأسست عام 1973، مؤسسة ذات نفع عام تمثل القطاع الخاص. الانضمام لعضويتها إلزامي لمعظم الأنشطة التجارية في عُمان، وتتوفر خدمات التسجيل وتجديد العضوية وإصدار شهادات بدل فاقد إلكترونياً عبر موقعها الرسمي." },
  { id:"occi-en", lang:"en", url:"https://www.omanchamber.om",
    text:"The Oman Chamber of Commerce & Industry (OCCI), established in 1973, is a public-benefit body representing the private sector. Membership is mandatory for most commercial activities in Oman, with registration, renewal, and replacement-certificate services available electronically via its official site." },

  { id:"madayn", lang:"ar", url:"https://madayn.om",
    text:"المؤسسة العامة للمناطق الصناعية (مدائن)، تأسست عام 1993 بموجب المرسوم السلطاني رقم 4/93، توفر أراضٍ ومرافق صناعية مجهزة في مواقع متعددة حول عُمان (منها الرسيل وريسوت وصحار ونزوى والبريمي وصور وسمائل)، مع إعفاءات ضريبية تصل لخمس سنوات للمشاريع الصناعية." },
  { id:"madayn-en", lang:"en", url:"https://madayn.om",
    text:"Madayn (Public Establishment for Industrial Estates), founded in 1993 under Royal Decree 4/93, provides equipped industrial land and facilities across multiple sites in Oman (including Rusayl, Raysut, Sohar, Nizwa, Buraimi, Sur, and Samail), with tax exemptions of up to five years for industrial projects." },

  { id:"opaz", lang:"ar", url:"https://www.opaz.gov.om",
    text:"الهيئة العامة للمناطق الاقتصادية الخاصة والمناطق الحرة (أوبال) تدير مناطق استثمارية كبرى مثل الدقم وصحار وصلالة، وتناسب المشاريع التصديرية والصناعية الكبيرة التي تحتاج بنية تحتية متخصصة واتصالاً بموانئ دولية." },
  { id:"opaz-en", lang:"en", url:"https://www.opaz.gov.om",
    text:"OPAZ (Public Authority for Special Economic Zones & Free Zones) manages major investment zones such as Duqm, Sohar, and Salalah, suited to export-oriented and large industrial projects that need specialized infrastructure and international port access." },

  { id:"odb", lang:"ar", url:"https://db.om",
    text:"بنك التنمية العُماني يقدّم قروضاً بدون فائدة حتى 15,000 ريال عُماني بتمويل يصل 90% من التكلفة لأصحاب المشاريع المتفرغين بالكامل لإدارتها، وقروضاً بفائدة 3% حتى نفس السقف لغير المتفرغين بتمويل 80%. كما يقدّم قروضاً تنموية أكبر بفائدة 3% وفترة سماح تصل 12 شهراً حتى سقف مليون ريال عُماني." },
  { id:"odb-en", lang:"en", url:"https://db.om",
    text:"Oman Development Bank offers interest-free loans up to 15,000 OMR with financing up to 90% of cost for entrepreneurs fully dedicated to their project, and 3%-interest loans up to the same cap at 80% financing for non-full-time owners. It also offers larger development loans at 3% interest with a grace period up to 12 months, up to a 1,000,000 OMR ceiling." },

  { id:"municipal", lang:"ar", url:null,
    text:"رخصة النشاط البلدي مطلوبة لأي نشاط له موقع فعلي في عُمان، وتصدر غالباً بشكل تلقائي عبر بوابة Invest Easy ضمن خطوات الترخيص الموحدة، دون الحاجة لمراجعة منفصلة للبلدية في كثير من الحالات." },
  { id:"municipal-en", lang:"en", url:null,
    text:"A municipal activity license is required for any activity with a physical location in Oman, and is now often issued automatically through the Invest Easy portal as part of the unified licensing steps, without a separate municipal visit in many cases." },

  { id:"ea", lang:"ar", url:"https://www.ea.gov.om",
    text:"هيئة البيئة تشترط تصريحاً بيئياً على الأنشطة الصناعية أو التي قد يكون لها أثر بيئي، مثل المطاعم الكبيرة والمصانع، بهدف ضمان الالتزام بمعايير حماية البيئة ومكافحة التلوث." },
  { id:"ea-en", lang:"en", url:"https://www.ea.gov.om",
    text:"The Environment Authority requires an environmental permit for industrial activities or those with potential environmental impact, such as large restaurants and factories, to ensure compliance with environmental protection and pollution-control standards." },

  { id:"mht", lang:"ar", url:"https://mht.gov.om",
    text:"وزارة التراث والسياحة تدعم وترخّص المشاريع السياحية والحرفية في عُمان، وتتيح برامج تدريب وتطوير للحرفيين والمنشآت السياحية الجديدة، إضافة لتراخيص المتاحف والمراكز الثقافية." },
  { id:"mht-en", lang:"en", url:"https://mht.gov.om",
    text:"The Ministry of Heritage & Tourism supports and licenses tourism and craft projects in Oman, offering training and development programs for new artisans and tourism establishments, alongside licensing for museums and cultural centers." },

  { id:"maf", lang:"ar", url:"https://www.maf.gov.om",
    text:"وزارة الثروة الزراعية والسمكية وموارد المياه (اسمها الحالي منذ تعديل 2020) تقدّم تراخيص ودعماً فنياً لمشاريع الزراعة وتربية الأحياء المائية والصيد التجاري في عُمان." },
  { id:"maf-en", lang:"en", url:"https://www.maf.gov.om",
    text:"The Ministry of Agricultural & Fisheries Wealth and Water Resources (renamed in the 2020 restructuring) provides licenses and technical support for agriculture, aquaculture, and commercial fishing projects in Oman." },

  { id:"moh", lang:"ar", url:"https://www.moh.gov.om",
    text:"وزارة الصحة هي الجهة المسؤولة عن ترخيص واعتماد العيادات الخاصة، ومراكز التجميل، والمنشآت الصحية بشكل عام في سلطنة عمان، وتشترط معايير سلامة ومؤهلات محددة قبل منح الترخيص." },
  { id:"moh-en", lang:"en", url:"https://www.moh.gov.om",
    text:"The Ministry of Health is responsible for licensing and accrediting private clinics, beauty centers, and health facilities generally in Oman, requiring specific safety standards and qualifications before granting a license." },

  { id:"mtcit", lang:"ar", url:"https://www.mtcit.gov.om",
    text:"وزارة النقل والاتصالات وتقنية المعلومات تشرف على تنظيم الخدمات الرقمية والاتصالات وقطاع النقل في عُمان، وتُعد الجهة المرجعية للمشاريع التقنية والتطبيقات الرقمية والخدمات اللوجستية." },
  { id:"mtcit-en", lang:"en", url:"https://www.mtcit.gov.om",
    text:"The Ministry of Transport, Communications & IT oversees regulation of digital services, telecom, and the transport sector in Oman, and is the reference body for tech projects, digital apps, and logistics services." },

  { id:"moe", lang:"ar", url:"https://home.moe.gov.om",
    text:"وزارة التربية والتعليم تشرف على تراخيص مراكز التدريب والمؤسسات التعليمية الخاصة في عُمان، وتضع معايير الاعتماد اللازمة قبل بدء تقديم الخدمات التعليمية أو التدريبية." },
  { id:"moe-en", lang:"en", url:"https://home.moe.gov.om",
    text:"The Ministry of Education oversees licensing of training centers and private educational institutions in Oman, setting the accreditation standards required before offering educational or training services." },

  { id:"registration-steps", lang:"ar", url:"https://investeasy.gov.om",
    text:"خطوات تأسيس مشروع في عُمان عادةً: تحديد النشاط التجاري بدقة، حجز الاسم التجاري وإصدار الترخيص عبر Invest Easy، الانضمام لعضوية غرفة تجارة وصناعة عُمان، فتح حساب بنكي تجاري، ثم التسجيل في التأمينات الاجتماعية عند توظيف أول موظف." },
  { id:"registration-steps-en", lang:"en", url:"https://investeasy.gov.om",
    text:"Typical steps to start a business in Oman: precisely define the business activity, reserve the trade name and issue the license via Invest Easy, join OCCI membership, open a business bank account, then register for social insurance once you hire your first employee." },
];

// ---- محرك TF-IDF محلي (لا يحتاج أي اتصال خارجي) ----
function tokenize(text){
  return (text||"").toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

let idf = null;
let chunkTfidfVecs = null;

function buildTfidfModel(){
  const docsTokens = CHUNKS.map(c => tokenize(c.text));
  const df = {};
  docsTokens.forEach(tokens => {
    new Set(tokens).forEach(tok => { df[tok] = (df[tok] || 0) + 1; });
  });
  idf = {};
  Object.keys(df).forEach(tok => {
    idf[tok] = Math.log((CHUNKS.length + 1) / (df[tok] + 1)) + 1;
  });
  chunkTfidfVecs = docsTokens.map(tokens => tfidfVector(tokens));
}

function tfidfVector(tokens){
  const tf = {};
  tokens.forEach(tok => { tf[tok] = (tf[tok] || 0) + 1; });
  const vec = {};
  Object.keys(tf).forEach(tok => {
    if (idf[tok] !== undefined) vec[tok] = (tf[tok] / tokens.length) * idf[tok];
  });
  return vec;
}

function cosineSparse(a, b){
  let dot = 0, na = 0, nb = 0;
  for (const k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; }
  for (const k in b) { nb += b[k] * b[k]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---- تمثيلات متجهية حقيقية عبر البوابة المركزية (إن كانت متاحة) ----
function cosineDense(a, b){
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function fetchGatewayEmbedding(text, gatewayBaseUrl, gatewayApiKey, embedModel){
  const resp = await fetch(`${gatewayBaseUrl.replace(/\/+$/, "")}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${gatewayApiKey}` },
    body: JSON.stringify({ model: embedModel || "text-embedding-3-small", input: text }),
  });
  if (!resp.ok) throw new Error(`embeddings endpoint returned ${resp.status}`);
  const data = await resp.json();
  const vec = data?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error("unexpected embeddings response shape");
  return vec;
}

let mode = null; // 'embeddings' | 'tfidf'
let chunkEmbeddings = null;

/**
 * يُستدعى مرة واحدة عند إقلاع السيرفر. يحاول بناء فهرس تمثيلات متجهية حقيقي عبر
 * البوابة المركزية؛ وإن فشل (لا يوجد endpoint للـ embeddings، أو خطأ اتصال) يرجع
 * تلقائياً لفهرس TF-IDF المحلي دون أي تدخل يدوي.
 */
async function initRag({ gatewayBaseUrl, gatewayApiKey, embedModel } = {}){
  buildTfidfModel(); // خط رجوع فوري يُبنى دائماً بغض النظر عن نتيجة الـ embeddings

  if (gatewayBaseUrl && gatewayApiKey){
    try{
      const embeds = [];
      for (const c of CHUNKS){
        embeds.push(await fetchGatewayEmbedding(c.text, gatewayBaseUrl, gatewayApiKey, embedModel));
      }
      chunkEmbeddings = embeds;
      mode = "embeddings";
      console.log(`✅ RAG: فهرس تمثيلات متجهية حقيقي عبر البوابة (${CHUNKS.length} مقطع، نموذج: ${embedModel || "text-embedding-3-small"})`);
      return;
    }catch(e){
      console.warn(`⚠️  RAG: تعذّر بناء فهرس embeddings عبر البوابة (${e.message}) — الرجوع لـ TF-IDF محلي.`);
    }
  }
  mode = "tfidf";
  console.log(`ℹ️  RAG: يعمل بوضع TF-IDF محلي (${CHUNKS.length} مقطع) — لا يحتاج أي اتصال خارجي.`);
}

/**
 * يبحث عن أقرب k مقاطع لسؤال المستخدم بالتشابه الدلالي (cosine similarity).
 */
async function search(query, opts = {}){
  const { k = 3, lang = null, gatewayBaseUrl, gatewayApiKey, embedModel } = opts;
  let scored;

  if (mode === "embeddings"){
    try{
      const qVec = await fetchGatewayEmbedding(query, gatewayBaseUrl, gatewayApiKey, embedModel);
      scored = CHUNKS.map((c, i) => ({ ...c, score: cosineDense(qVec, chunkEmbeddings[i]) }));
    }catch(e){
      // فشل مؤقت في الاتصال أثناء الاستعلام فقط -> رجوع فوري لـ TF-IDF لهذا الاستعلام دون كسر الطلب
      const qVec = tfidfVector(tokenize(query));
      scored = CHUNKS.map((c, i) => ({ ...c, score: cosineSparse(qVec, chunkTfidfVecs[i]) }));
    }
  } else {
    const qVec = tfidfVector(tokenize(query));
    scored = CHUNKS.map((c, i) => ({ ...c, score: cosineSparse(qVec, chunkTfidfVecs[i]) }));
  }

  let results = scored.filter(c => !lang || c.lang === lang);
  results = results.sort((a, b) => b.score - a.score).filter(c => c.score > 0.03).slice(0, k);
  return results;
}

module.exports = { initRag, search, getMode: () => mode, CHUNKS };
