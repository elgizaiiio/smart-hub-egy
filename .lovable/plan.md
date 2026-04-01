# خطة: نظام LemonData للمفاتيح + إدارة من Telegram

---

## الفكرة

استبدال/إضافة LemonData (`api.lemondata.cc/v1`) كمزود رئيسي للشات والصور والملفات، مع نظام إدارة 500+ مفتاح ذكي يعمل بنفس منطق `deapi_keys` الموجود حاليا.

## LemonData API

- OpenAI-compatible: `https://api.lemondata.cc/v1/chat/completions`
- يدعم 300+ نموذج (GPT-5, Claude 4.5, Gemini 3, Grok, Qwen3, FLUX, Kling, Veo 3, Sora 2...)
- Categories: Chat, Image, Video, Audio, Vision, Code, Embedding
- Streaming SSE مدعوم

---

## التغييرات

### 1. جدول جديد: `lemondata_keys`

```sql
CREATE TABLE public.lemondata_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  label text,
  is_active boolean DEFAULT true,
  is_blocked boolean DEFAULT false,
  block_reason text,
  usage_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  last_used_at timestamptz,
  last_error_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lemondata_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.lemondata_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### 2. جدول: `bot_admins`

```sql
CREATE TABLE public.bot_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id bigint UNIQUE NOT NULL,
  added_by bigint,
  created_at timestamptz DEFAULT now()
);
-- مع RLS service_role only
```

### 3. تحديث `supabase/functions/chat/index.ts`

**التغيير الرئيسي:** بدلا من OpenRouter كمزود رئيسي، نستخدم LemonData مع key rotation:

```text
المنطق الجديد:
1. جلب مفتاح نشط من lemondata_keys (random, غير محظور)
2. إرسال الطلب إلى api.lemondata.cc/v1/chat/completions
3. إذا فشل (401/403) → حظر المفتاح + إعادة المحاولة بمفتاح آخر
4. إذا فشل (429) → تأخير + مفتاح آخر
5. بعد 3 محاولات فاشلة → رسالة خطأ
```

- كل النماذج الأخرى تذهب عبر LemonData بدل OpenRouter
- الـ model ID يُرسل كما هو (LemonData يدعم نفس الأسماء)

### 4. تحديث `supabase/functions/telegram-bot/index.ts`

**إضافات:**

**A. زر "unlimited" في القائمة الرئيسية:**

- عرض عدد المفاتيح النشطة / المحظورة / الكلي
- إضافة مفتاح جديد (إرسال نص المفتاح)
- عرض قائمة المفاتيح مع حالتها (Active ✅ / Blocked 🚫)
- تبديل حالة مفتاح (block/unblock)
- حذف مفتاح
- عرض النماذج المتاحة (جلبها من `api.lemondata.cc/v1/models`)

**B. أمر `/1` لإضافة أدمن:**

- عند كتابة `/1` يطلب البوت Telegram Chat ID للأدمن الجديد
- يضيفه في جدول `bot_admins`
- التحقق من الأدمن قبل السماح بأي أوامر

**C. عرض النماذج المتاحة:**

- زر يعرض كل النماذج من LemonData مقسمة حسب الفئة (Chat, Image, Video, Audio)

### 5. الملفات المتأثرة


| ملف                                        | التغيير                                        |
| ------------------------------------------ | ---------------------------------------------- |
| Migration SQL                              | جدول `lemondata_keys` + `bot_admins`           |
| `supabase/functions/chat/index.ts`         | استبدال OpenRouter بـ LemonData + key rotation |
| `supabase/functions/telegram-bot/index.ts` | إضافة زر unlimited + أمر /1 + إدارة المفاتيح   |


---

## ترتيب التنفيذ

1. إنشاء الجداول (migration)
2. تحديث chat edge function للـ LemonData
3. إضافة إدارة المفاتيح في Telegram bot