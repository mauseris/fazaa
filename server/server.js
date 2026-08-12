require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");
const rag = require("./rag");
const tools = require("./tools");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

/**
 * ==========================================================================
 *  الاتصال بالنموذج — عبر البوابة المركزية الإلزامية (LiteLLM / OpenRouter)
 * ==========================================================================
 * راجع server/.env.example للتفاصيل الكاملة. باختصار: لا يُسلَّم أي مشارك مفتاحاً
 * مباشراً للنماذج؛ الاتصال الرسمي عبر بوابة واحدة بمفتاح افتراضي (Virtual Key).
 */
const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL;
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || "gpt-4o-mini";
const EMBED_MODEL_NAME = process.env.EMBED_MODEL_NAME || "text-embedding-3-small";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL_NAME = process.env.ANTHROPIC_MODEL_NAME || "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * خيار ثالث (تطوير محلي/تعليمي فقط): Hugging Face Inference Providers — نفس صيغة
 * OpenAI المتوافقة، عبر endpoint موحّد (https://router.huggingface.co/v1/chat/completions)
 * يوجّه الطلب تلقائياً لأحد مزوّدي الاستضافة الفعليين للنموذج (مثل Novita أو Nscale).
 * راجع server/.env.example — بعض النماذج (مثل Llama) مقيّدة (gated) وتحتاج موافقة مسبقة.
 */
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const HF_ROUTER_BASE_URL = "https://router.huggingface.co/v1";

const usingGateway = Boolean(GATEWAY_BASE_URL && GATEWAY_API_KEY);
const usingDirectAnthropic = !usingGateway && Boolean(ANTHROPIC_API_KEY);
const usingHuggingFace = !usingGateway && !usingDirectAnthropic && Boolean(HF_API_TOKEN);

if (!usingGateway && !usingDirectAnthropic && !usingHuggingFace) {
  console.warn(
    "\n⚠️  لا يوجد اتصال مضبوط بأي نموذج بعد — /api/chat ما راح يشتغل حتى تضيف أحد الخيارات في server/.env:\n" +
    "   الخيار الموصى به (الرسمي):   GATEWAY_BASE_URL + GATEWAY_API_KEY (بوابة المعسكر المركزية)\n" +
    "   خيار مؤقت للتطوير فقط:        ANTHROPIC_API_KEY (مفتاحك الشخصي من console.anthropic.com)\n" +
    "   خيار مؤقت آخر للتطوير فقط:    HF_API_TOKEN (مفتاحك من huggingface.co/settings/tokens)\n"
  );
} else if (usingDirectAnthropic) {
  console.log(
    `\n✅ متصل مباشرة بـ Anthropic (وضع تطوير محلي) — النموذج: ${ANTHROPIC_MODEL_NAME}\n` +
    "   ملاحظة: هذا مسار تطوير محلي بمفتاح شخصي. إذا احتجتم لاحقاً البوابة المركزية للفريق،\n" +
    "   اضبط GATEWAY_BASE_URL و GATEWAY_API_KEY وسيتحول الاتصال إليها تلقائياً.\n"
  );
} else if (usingHuggingFace) {
  console.warn(
    "\n⚠️  أنت متصل حالياً بـ Hugging Face Inference Providers مباشرة (وضع تطوير محلي/تعليمي) —\n" +
    `   النموذج: ${HF_MODEL}. هذا غير مطابق لمتطلبات الحوكمة الرسمية للتحدي (البوابة المركزية\n` +
    "   إلزامية). قبل التسليم للتحكيم، اضبط GATEWAY_BASE_URL و GATEWAY_API_KEY بدلاً من ذلك.\n" +
    "   ملاحظة: النماذج المقيّدة (gated) مثل Llama تحتاج موافقة مسبقة على حسابك في HF، وإلا ترجع\n" +
    "   الاستدعاءات خطأ 403.\n"
  );
} else {
  console.log(`\n✅ متصل بالبوابة المركزية: ${GATEWAY_BASE_URL} (النموذج: ${MODEL_NAME})\n`);
}

const ragOpts = { gatewayBaseUrl: GATEWAY_BASE_URL, gatewayApiKey: GATEWAY_API_KEY, embedModel: EMBED_MODEL_NAME };
const MAX_TOOL_ROUNDS = 4;

/**
 * POST /api/chat
 * body: { system?: string, messages: [{role, content}, ...] }  (أو message: string للتوافق القديم)
 * response: { text: string, tools: [{name, args, result}, ...] }
 *
 * هذا الـ endpoint هو "عقل" الوكيل — ويشغّل حلقة استدعاء أدوات حقيقية (agent loop):
 * النموذج نفسه يقرر متى يحتاج يبحث في قاعدة المعرفة (search_knowledge) أو يحسب
 * تكلفة (calculate_cost) أو يصنّف مرحلة المستخدم (identify_stage)، بدل منطق ثابت
 * بالواجهة. يدعم مسارين: البوابة المركزية (صيغة OpenAI) أو Anthropic مباشرة (تطوير محلي).
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { system, message, messages: incomingMessages } = req.body || {};
    const messages = Array.isArray(incomingMessages) && incomingMessages.length
      ? incomingMessages
      : (message ? [{ role: "user", content: message }] : null);

    if (!messages) return res.status(400).json({ error: "message أو messages مطلوب" });

    // Prefer external models when configured; otherwise use a lightweight
    // local synchronous fallback for development and smoke-testing.
    const result = usingGateway
      ? await runOpenAiAgentLoop(system, messages)
      : usingDirectAnthropic
        ? await runAnthropicAgentLoop(system, messages)
        : usingHuggingFace
          ? await runHuggingFaceAgentLoop(system, messages)
          : await runLocalFallback(system, messages);

    res.json(result);
  } catch (e) {
    console.error("chat endpoint error:", e);
    res.status(e.status || 500).json({ error: e.message || "خطأ داخلي في السيرفر" });
  }
});

/**
 * POST /api/chat/stream — نفس عقل الوكيل أعلاه، لكن يبثّ الأحداث لحظياً عبر SSE:
 * tool_start / tool_result أثناء تنفيذ حلقة الأدوات الحقيقية، ثم text عند اكتمال
 * الرد النهائي، ثم done. هذا يسمح للواجهة بعرض "🔧 يبحث..." وقت حدوثه فعلياً،
 * بدل انتظار الرد كاملاً كما في /api/chat.
 */
app.post("/api/chat/stream", async (req, res) => {
  const { system, message, messages: incomingMessages } = req.body || {};
  const messages = Array.isArray(incomingMessages) && incomingMessages.length
    ? incomingMessages
    : (message ? [{ role: "user", content: message }] : null);

  if (!messages) return res.status(400).json({ error: "message أو messages مطلوب" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const emit = (evt) => res.write(`data: ${JSON.stringify(evt)}\n\n`);

  try {
    const result = usingGateway
      ? await runOpenAiAgentLoop(system, messages, emit)
      : usingDirectAnthropic
        ? await runAnthropicAgentLoop(system, messages, emit)
        : await runHuggingFaceAgentLoop(system, messages, emit);
    emit({ type: "text", text: result.text });
    emit({ type: "done", tools: result.tools });
  } catch (e) {
    console.error("chat stream endpoint error:", e);
    emit({ type: "error", error: e.message || "خطأ داخلي في السيرفر" });
  } finally {
    res.end();
  }
});

// ---------------------------------------------------------------------------
// حلقة الوكيل عبر البوابة المركزية (صيغة OpenAI متوافقة)
// onEvent(evt) اختياري: يُستدعى لحظياً بأحداث تقدّم الوكيل (tool_start/tool_result)
// لتغذية بث SSE في /api/chat/stream دون التأثير على مسار /api/chat غير المتدفق.
// ---------------------------------------------------------------------------
async function runOpenAiAgentLoop(system, userMessages, onEvent) {
  const emit = onEvent || (() => {});
  let messages = system ? [{ role: "system", content: system }, ...userMessages] : [...userMessages];
  const toolLog = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const upstream = await fetch(`${GATEWAY_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GATEWAY_API_KEY}` },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: 900,
        temperature: 0.4,
        messages,
        tools: tools.OPENAI_TOOLS,
        tool_choice: "auto",
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const err = new Error(data?.error?.message || data?.error || "خطأ من البوابة المركزية");
      err.status = upstream.status;
      throw err;
    }

    const msg = data?.choices?.[0]?.message;
    if (!msg) throw new Error("رد غير متوقع من البوابة المركزية");

    if (msg.tool_calls && msg.tool_calls.length) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch (e) { /* ignore parse error, use {} */ }
        emit({ type: "tool_start", name: tc.function.name, args });
        const result = await tools.executeTool(tc.function.name, args, ragOpts);
        toolLog.push({ name: tc.function.name, args, result });
        emit({ type: "tool_result", name: tc.function.name, args, result });
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue; // النموذج يرى نتائج الأدوات ويقرر الخطوة التالية
    }

    const text = (msg.content || "").trim();
    if (!text) throw new Error("رد فارغ من البوابة المركزية");
    return { text, tools: toolLog };
  }
  throw new Error("تجاوز الوكيل الحد الأقصى لجولات استدعاء الأدوات");
}

// ---------------------------------------------------------------------------
// حلقة الوكيل عبر Anthropic مباشرة (مسار تطوير محلي مؤقت فقط)
// ---------------------------------------------------------------------------
async function runAnthropicAgentLoop(system, userMessages, onEvent) {
  const emit = onEvent || (() => {});
  let messages = [...userMessages];
  const toolLog = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        // لا نرسل temperature: نماذج Sonnet 5 / Opus 5 وما بعدها ترفضها (400) —
        // التحكم بالأسلوب الآن عبر الصياغة داخل system بدل معاملات العينة.
        model: ANTHROPIC_MODEL_NAME,
        max_tokens: 900,
        system: system || undefined,
        messages,
        tools: tools.ANTHROPIC_TOOLS,
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const err = new Error(data?.error?.message || "خطأ من Anthropic API");
      err.status = upstream.status;
      throw err;
    }

    if (data.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: data.content });
      const toolResults = [];
      for (const block of data.content) {
        if (block.type === "tool_use") {
          emit({ type: "tool_start", name: block.name, args: block.input });
          const result = await tools.executeTool(block.name, block.input, ragOpts);
          toolLog.push({ name: block.name, args: block.input, result });
          emit({ type: "tool_result", name: block.name, args: block.input, result });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!text) throw new Error("رد فارغ من Anthropic API");
    return { text, tools: toolLog };
  }
  throw new Error("تجاوز الوكيل الحد الأقصى لجولات استدعاء الأدوات");
}

// ---------------------------------------------------------------------------
// حلقة الوكيل عبر Hugging Face Inference Providers (مسار تطوير محلي/تعليمي ثالث)
// نفس صيغة OpenAI المتوافقة (router.huggingface.co)، لكن دعم tool calling غير مضمون
// لكل نموذج/مزوّد — لا يوجد توثيق رسمي يؤكده لنماذج مثل Llama-3.1-8B-Instruct. لذلك
// نكتشف ذلك فعلياً (مرة واحدة لكل تشغيل سيرفر) بدل افتراض النجاح أو فشله سلفاً:
//   1) أول محاولة تُرسَل مع الأدوات. إن رفضها الـ endpoint صراحة بخطأ متعلق بـ tools،
//      نُسجّل ذلك ونعيد المحاولة بدون أدوات لبقية التشغيل.
//   2) إن نجحت الاستجابة لكن جاءت كنص خام يحاكي شكل استدعاء أداة (بدل tool_calls
//      منظّم) — وهو عرَض معروف لنماذج صغيرة لا تلتزم فعلياً بصيغة tool calling رغم
//      قبول الحقل شكلياً — نعاملها كدليل عدم دعم حقيقي، ولا نُرجع ذلك النص المكسور
//      للمستخدم كما هو، بل نعيد المحاولة بدون أدوات.
// ---------------------------------------------------------------------------
let hfToolsSupported = null; // null = لم يُختبر بعد فعلياً هذا التشغيل

function hfErrorLooksToolRelated(message) {
  const m = (message || "").toString().toLowerCase();
  return /tool|function.?calling/.test(m) &&
    /(not support|unsupported|cannot|can.?t|invalid|not allow|not implement)/.test(m);
}

// عرَض معروف: نموذج يخرج JSON خام لاستدعاء أداة كنص عادي بدل حقل tool_calls المنظّم.
function looksLikeLeakedToolCallText(text) {
  const t = (text || "").trim();
  if (!t.startsWith("{") && !t.startsWith("[")) return false;
  const toolNames = tools.OPENAI_TOOLS.map(t => t.function.name);
  const mentionsToolName = toolNames.some(n => t.includes(`"${n}"`));
  const looksLikeCallShape = /"(arguments|parameters)"\s*:/.test(t);
  return mentionsToolName && looksLikeCallShape;
}

async function callHfChatCompletions(messages, includeTools) {
  const body = { model: HF_MODEL, max_tokens: 900, temperature: 0.4, messages };
  if (includeTools) {
    body.tools = tools.OPENAI_TOOLS;
    body.tool_choice = "auto";
  }
  const upstream = await fetch(`${HF_ROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_API_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => ({}));
  return { upstream, data };
}

function throwHfError(data, status) {
  const err = new Error((data?.error?.message || data?.error) || "خطأ من Hugging Face Inference Providers");
  err.status = status;
  throw err;
}

async function runHuggingFaceAgentLoop(system, userMessages, onEvent) {
  const emit = onEvent || (() => {});
  let messages = system ? [{ role: "system", content: system }, ...userMessages] : [...userMessages];
  const toolLog = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const wantTools = hfToolsSupported !== false;
    let { upstream, data } = await callHfChatCompletions(messages, wantTools);

    if (!upstream.ok) {
      const errMsg = data?.error?.message || data?.error;
      if (wantTools && hfToolsSupported === null && hfErrorLooksToolRelated(errMsg)) {
        hfToolsSupported = false;
        console.warn(
          `⚠️  Hugging Face (${HF_MODEL}): الـ endpoint رفض tool calling صراحة (${errMsg}) — ` +
          `رجوع لوضع محادثة عادي بدون أدوات لبقية هذا التشغيل.`
        );
        ({ upstream, data } = await callHfChatCompletions(messages, false));
      }
      if (!upstream.ok) throwHfError(data, upstream.status);
    }

    const msg = data?.choices?.[0]?.message;
    if (!msg) throw new Error("رد غير متوقع من Hugging Face Inference Providers");

    if (msg.tool_calls && msg.tool_calls.length) {
      if (hfToolsSupported === null) hfToolsSupported = true; // استدعاء أداة منظّم فعلي = دعم حقيقي مؤكد
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch (e) { /* ignore parse error, use {} */ }
        emit({ type: "tool_start", name: tc.function.name, args });
        const result = await tools.executeTool(tc.function.name, args, ragOpts);
        toolLog.push({ name: tc.function.name, args, result });
        emit({ type: "tool_result", name: tc.function.name, args, result });
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    const text = (msg.content || "").trim();
    if (!text) throw new Error("رد فارغ من Hugging Face Inference Providers");

    if (wantTools && hfToolsSupported === null && looksLikeLeakedToolCallText(text)) {
      hfToolsSupported = false;
      console.warn(
        `⚠️  Hugging Face (${HF_MODEL}): النموذج أخرج نص استدعاء أداة خام بدل tool_calls منظّم — ` +
        `رجوع لوضع محادثة عادي بدون أدوات لبقية هذا التشغيل (النص الخام لن يُستخدم كما هو).`
      );
      const retry = await callHfChatCompletions(messages, false);
      if (!retry.upstream.ok) throwHfError(retry.data, retry.upstream.status);
      const retryText = (retry.data?.choices?.[0]?.message?.content || "").trim();
      if (!retryText) throw new Error("رد فارغ من Hugging Face Inference Providers");
      return { text: retryText, tools: toolLog };
    }

    if (wantTools && hfToolsSupported === null) hfToolsSupported = true; // رد نصي طبيعي سليم = الـ endpoint يقبل الصيغة فعلياً
    return { text, tools: toolLog };
  }
  throw new Error("تجاوز الوكيل الحد الأقصى لجولات استدعاء الأدوات");
}

// Lightweight local fallback that uses the tools and RAG synchronously to craft
// a deterministic reply when no external LLM is configured. This is intended
// for development and smoke-testing only.
async function runLocalFallback(system, userMessages) {
  const user = (userMessages && userMessages.length) ? userMessages[userMessages.length-1].content : '';
  const toolsUsed = [];
  // Simple keyword-based routing: if user mentions 'riyada' or 'what is riyada', use RAG
  if (/riyada|رفد|support|what is riyada/i.test(user)) {
    const results = await rag.search(user, { k: 2 });
    toolsUsed.push({ name: 'search_knowledge', args: { query: user }, result: results });
    const summary = results.map(r => r.text).join('\n\n');
    return { text: `Local RAG summary:\n\n${summary}`, tools: toolsUsed };
  }

  // If user asks for cost, call calculate_cost tool with safe defaults
  if (/cost|calculate|تكلفة|تكاليف/i.test(user)) {
    const args = { sector: 'tech', city: 'muscat', teamSize: 'solo', budgetLevel: 50 };
    const cost = await require('./tools').calculateCost(args);
    toolsUsed.push({ name: 'calculate_cost', args, result: cost });
    return { text: `Estimated cost (demo): ${cost.total} OMR — breakdown: registration ${cost.registration}, equipment ${cost.equipment}.`, tools: toolsUsed };
  }

  // Default helpful reply using RAG if possible
  const results = await rag.search(user, { k: 2 });
  if (results && results.length) {
    toolsUsed.push({ name: 'search_knowledge', args: { query: user }, result: results });
    return { text: results.map(r => r.text).join('\n\n'), tools: toolsUsed };
  }

  return { text: "Local fallback: I don't have a live LLM configured. Provide GATEWAY_API_KEY or ANTHROPIC_API_KEY to enable full agent responses.", tools: toolsUsed };
}

/**
 * تخزين الجلسة (SQLite مع رجوع تلقائي لـ JSON) — بديل window.storage
 */
app.get("/api/state/:sessionId", (req, res) => {
  const value = db.get(req.params.sessionId);
  if (value === undefined) return res.status(404).json({ error: "لا يوجد" });
  res.json({ value });
});
app.post("/api/state/:sessionId", (req, res) => {
  const { value } = req.body || {};
  db.set(req.params.sessionId, value);
  res.json({ ok: true });
});
app.delete("/api/state/:sessionId", (req, res) => {
  db.remove(req.params.sessionId);
  res.json({ ok: true });
});

/**
 * GET /api/rag-status — للتشخيص: هل RAG يعمل بـ embeddings حقيقية أم TF-IDF؟ وما وضع
 * الاتصال بالنموذج المُفعّل فعلياً على السيرفر حالياً (gateway/anthropic-dev/huggingface-dev/none)؟
 */
app.get("/api/rag-status", (req, res) => {
  const chatMode = usingGateway ? "gateway"
    : usingDirectAnthropic ? "anthropic-dev"
    : usingHuggingFace ? "huggingface-dev"
    : "none";
  const chatModel = usingGateway ? MODEL_NAME
    : usingDirectAnthropic ? ANTHROPIC_MODEL_NAME
    : usingHuggingFace ? HF_MODEL
    : null;
  res.json({
    mode: rag.getMode(),
    chunks: rag.CHUNKS.length,
    storage: db.isSqlite() ? "sqlite" : "json",
    chatMode,
    chatModel,
    ...(usingHuggingFace ? { hfToolCallingSupported: hfToolsSupported } : {}),
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

(async () => {
  db.init();
  await rag.initRag(ragOpts);
  app.listen(PORT, () => {
    console.log(`\n🚀 فزعة يعمل الآن على → http://localhost:${PORT}\n`);
  });
})();
