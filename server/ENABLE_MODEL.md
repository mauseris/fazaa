# تفعيل نموذج حي للوكيل (Gateway أو Anthropic)

إضافة سريعة لتمكين المسار الكامل لوكيل Tool-Calling عبر بوابة مركزية أو اتصال Anthropic مباشر.

الخطوات:

1. انسخ ملف الإعدادات:

```bash
cd server
cp .env.example .env
```

2. ضع مفاتيح النموذج في `server/.env`:
- المسار الموصى به (حوكمة): اضبط `GATEWAY_BASE_URL` و `GATEWAY_API_KEY`.
- للاختبار المحلي فقط: اضبط `ANTHROPIC_API_KEY` (غير مخصّص للتسليم الرسمي).

3. أعد تشغيل السيرفر:

```bash
npm start
```

4. تحقق:
- حالة RAG: `curl http://localhost:3000/api/rag-status`
- اختبار المحادثة: استخدم `server/post.js` أو `POST /api/chat` من عميل HTTP.

ملاحظات:
- لا ترفع مفاتيح API للمستودع. ضعها في `server/.env` محلياً فقط.
- إن أردت، أعرض لك كيف أضع مثال `.env` مع متغيّرات عيّنة (بدون مفاتيح حقيقية).