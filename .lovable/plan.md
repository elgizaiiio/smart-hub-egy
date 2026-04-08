

# خطة: إصلاح الأعطال + تسريع فائق للموقع بدون المساس بالتصميم

## ملخص
إصلاح 6 مشاكل حرجة: (1) الكومبيوتر لا يعمل ولا يظهر شعاره، (2) بطء شديد في الشات والباك اند، (3) Object Remover لا يرسل الماسك بشكل صحيح، (4) Cartoon تستخدم أنيميشن مختلف + أسماء قوالب ظاهرة، (5) زر View Live للكومبيوتر، (6) تسريع داخلي بدون تغيير أي تصميم.

---

## الجزء 1: إصلاح Computer Use (الكومبيوتر)

### المشكلة
الكومبيوتر لا يعمل فعلياً — الخطوات الحقيقية لا تصل للمستخدم وشعار "Megsy Computer" لا يظهر.

### الحل
**ملف `supabase/functions/chat/index.ts`:**
- الكومبيوتر يعتمد على `computerUseEnabled` و `HB_API_KEY` — إذا لم يوجد مفتاح HB نشط في `api_keys`، الأداة لا تظهر أصلاً. يجب التأكد من وجود مفتاح فعال.
- حالياً `needsTools` تشترط `!isCasualMessage` — يعني أي تحية أو رسالة قصيرة لا تُحمّل أداة الكومبيوتر. هذا صحيح.
- المشكلة الأساسية: الـ `pushStatus` يرسل أحداث status لكن لا يوجد فلترة ذكية — كل رسالة حتى "هلا" إذا لم تكن casual تُحمّل أدوات البحث والكومبيوتر وده بيبطئ الرد.

**ملف `src/components/ThinkingLoader.tsx`:**
- إضافة زر **"View Live"** بجانب "Megsy Computer" — يفتح نافذة/modal تعرض الخطوات بشكل مفصل.

### التغييرات
- فحص وجود مفاتيح Hyperbrowser نشطة في الداتابيز
- تحسين `detectComputerUse` ليكتشف أحداث أكثر دقة
- إضافة زر "View Live" في ThinkingLoader يفتح dialog مع كل الخطوات

---

## الجزء 2: تسريع فائق للشات والباك اند

### المشكلة
الشات بطيء جداً بسبب:
1. تحميل 12+ أداة Composio + أدوات بحث + أدوات ميديا حتى لو مش محتاجهم
2. استعلامات DB غير ضرورية
3. النموذج يستقبل system prompt ضخم حتى للرسائل البسيطة

### الحل — تسريع داخلي 100% بدون تغيير التصميم

**ملف `supabase/functions/chat/index.ts`:**
1. **مسار فائق السرعة (Ultra-fast):** الرسائل العادية (بدون @mentions أو أوامر أدوات) → system prompt مصغر + بدون أدوات + max_tokens: 100 + temperature: 0.3
2. **تحميل الأدوات بذكاء:** فقط حمّل الأدوات المطلوبة فعلاً:
   - `composioTools` → فقط لو المستخدم ذكر `@integrations`
   - `browserTools` → فقط لو المستخدم ذكر `browse` أو `open` أو `website` أو كلمات متصفح
   - `mediaTools` → فقط لو المستخدم ذكر `@images` أو `@videos` أو `generate`
   - `searchTools` → فقط لو `searchEnabled` والمستخدم سأل سؤال يحتاج بحث (ليس كل رسالة)
3. **إلغاء الـ second round-trip:** حالياً بعد البحث يرسل نتائج البحث في رسالة ثانية للنموذج — هذا يضاعف الوقت. بدلاً منه، أدمج نتائج البحث مباشرة في السياق الأصلي.
4. **تقليل حجم context:** حالياً يرسل كل الرسائل السابقة للنموذج — حدد آخر 10 رسائل فقط.

**ملف `src/lib/streamChat.ts`:**
- لا تغيير — الـ streaming parser يعمل بشكل صحيح.

---

## الجزء 3: إصلاح Object Remover

### المشكلة
الماسك (التحديد) لا يُرسل بشكل صحيح — المستخدم يحدد منطقة لكن AI يمسح منطقة عشوائية.

### الحل
**ملف `src/pages/tools/RemoverPage.tsx`:**
- في `getMaskDataUrl()`: الماسك يُنشئ صورة أبيض وأسود (أبيض = المنطقة المحددة). المشكلة أن الـ alpha channel فقط يُفحص (>10) لكن الـ brush يرسم بـ `rgba(239, 68, 68, 0.4)` — قيمة alpha = 102 (~0.4 * 255) وهذا يعمل.
- المشكلة الحقيقية في `callLemonImage`: يرسل `body.mask = maskUrl` لكن LemonData API تتوقع الماسك بتنسيق محدد. يجب التأكد من إرسال الماسك كـ base64 data URL بشكل صحيح وأن API الـ edit تدعم الماسك.

**ملف `supabase/functions/image-tools/index.ts`:**
- التأكد من إرسال الماسك بالتنسيق الصحيح لـ LemonData API (mask_image بدل mask في بعض APIs).

---

## الجزء 4: إصلاح Cartoon

### المشكلة
1. أنيميشن الانتظار مختلف عن بقية الأدوات (Sparkles بدل StarLoader)
2. أسماء القوالب ظاهرة

### الحل
**ملف `src/pages/tools/CartoonPage.tsx`:**
- استبدال أنيميشن `Sparkles` في مرحلة `generating` بنفس StarLoader الأزرق المستخدم في بقية الأدوات
- إخفاء أسماء/عناوين القوالب من `TemplateGrid`

---

## الجزء 5: تسريع داخلي للموقع بالكامل (بدون تغيير التصميم)

### التحسينات — كود داخلي فقط، صفر تغيير مرئي:

1. **Lazy loading للـ routes:** التأكد من أن كل صفحات الأدوات محملة lazy
2. **تقليل re-renders:** إضافة `React.memo` للمكونات الثقيلة مثل `ChatMessage`, `ThinkingLoader`
3. **Debounce للإدخال:** تقليل عدد الـ re-renders أثناء الكتابة في AnimatedInput
4. **تحسين الـ Edge Functions:** تقليل cold start عن طريق تبسيط الـ imports

---

## الملفات المطلوب تعديلها

| الملف | التغييرات |
|-------|----------|
| `supabase/functions/chat/index.ts` | تحميل أدوات ذكي، مسار فائق السرعة، تقليل context |
| `src/components/ThinkingLoader.tsx` | زر View Live + dialog للخطوات |
| `src/pages/tools/RemoverPage.tsx` | إصلاح إرسال الماسك |
| `supabase/functions/image-tools/index.ts` | إصلاح تنسيق الماسك لـ LemonData |
| `src/pages/tools/CartoonPage.tsx` | StarLoader + إخفاء أسماء القوالب |
| `src/pages/ChatPage.tsx` | تحسينات أداء (memo, cleanup) |

---

## ترتيب التنفيذ
1. تسريع الباك اند (chat/index.ts) — أكبر تأثير
2. إصلاح ThinkingLoader + View Live
3. إصلاح Object Remover
4. إصلاح Cartoon
5. تحسينات أداء عامة

