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

const usingGateway = Boolean(GATEWAY_BASE_URL && GATEWAY_API_KEY);
const usingDirectAnthropic = !usingGateway && Boolean(ANTHROPIC_API_KEY);

if (!usingGateway && !usingDirectAnthropic) {
  console.warn(
    "\n⚠️  لا يوجد اتصال مضبوط بأي نموذج بعد — /api/chat ما راح يشتغل حتى تضيف أحد الخيارين في server/.env:\n" +
    "   الخيار الموصى به (الرسمي): GATEWAY_BASE_URL + GATEWAY_API_KEY (بوابة المعسكر المركزية)\n" +
    "   خيار مؤقت للتطوير فقط:      ANTHROPIC_API_KEY (مفتاحك الشخصي من console.anthropic.com)\n"
  );
} else if (usingDirectAnthropic) {
  console.warn(
    "\n⚠️  أنت متصل حالياً بمفتاحك الشخصي مباشرة (وضع تطوير محلي) — هذا غير مطابق لمتطلبات الحوكمة\n" +
    "   الرسمية للتحدي (البوابة المركزية إلزامية). قبل التسليم للتحكيم، اضبط GATEWAY_BASE_URL و\n" +
    "   GATEWAY_API_KEY بدلاً من ذلك.\n"
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
    if (!usingGateway && !usingDirectAnthropic) {
      return res.status(500).json({ error: "لا يوجد اتصال مضبوط بأي نموذج على السيرفر (راجع server/.env)" });
    }

    const result = usingGateway
      ? await runOpenAiAgentLoop(system, messages)
      : await runAnthropicAgentLoop(system, messages);

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
  if (!usingGateway && !usingDirectAnthropic) {
    return res.status(500).json({ error: "لا يوجد اتصال مضبوط بأي نموذج على السيرفر (راجع server/.env)" });
  }

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
      : await runAnthropicAgentLoop(system, messages, emit);
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
        model: ANTHROPIC_MODEL_NAME,
        max_tokens: 900,
        temperature: 0.4,
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
 * GET /api/rag-status — للتشخيص: هل RAG يعمل بـ embeddings حقيقية أم TF-IDF؟
 */
app.get("/api/rag-status", (req, res) => {
  res.json({ mode: rag.getMode(), chunks: rag.CHUNKS.length, storage: db.isSqlite() ? "sqlite" : "json" });
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
