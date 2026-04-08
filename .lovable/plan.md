

# خطة تنفيذ شاملة — 18 مشكلة وميزة جديدة

## نظرة عامة
هذه الخطة تغطي كل المشاكل المطلوب إصلاحها مقسمة إلى 7 مراحل. التنفيذ سيتم بالترتيب حسب الأولوية والتأثير.

---

## المرحلة 1: إصلاح الشات — الأخطاء الحرجة (P0)

### 1.1 تحليل الصور والملفات في الشات لا يعمل
- **المشكلة**: الصور المرفقة تُرسل كـ `image_url` لكن النموذج الحالي (Gemini Flash Lite) لا يدعم الرؤية بشكل جيد
- **الحل**: عند اكتشاف مرفقات صور، تبديل النموذج تلقائياً إلى `moonshotai/kimi-k2.5:nitro` (يدعم الرؤية + ذكاء عالي)
- **الملف**: `supabase/functions/chat/index.ts` — إضافة شرط `hasImages` → override model

### 1.2 استخدام kimi-k2.5:nitro للمهام المعقدة
- **المشكلة**: النموذج الحالي بسيط جداً للمهام المعقدة
- **الحل**: إضافة `detectComplexity()` في chat function:
  - المهام البسيطة/العادية → `gemini-2.5-flash-lite` (سريع ورخيص)
  - المهام المعقدة (بحث عميق، تحليل صور، برمجة، مقارنات) → `moonshotai/kimi-k2.5:nitro`
  - Deep Research → `moonshotai/kimi-k2.5:nitro`
  - Shopping → `moonshotai/kimi-k2.5:nitro`
- **الملف**: `supabase/functions/chat/index.ts`

### 1.3 اللينكات تظهر بشكل سيء
- **المشكلة**: الروابط الخام تظهر كنص كامل بدلاً من كلمات قابلة للنقر
- **الحل**: في `ChatMessage.tsx` → مكون `a` في ReactMarkdown يعمل بالفعل لكن المشكلة أن الـ AI يكتب روابط خام بدون markdown formatting
- **الإصلاح**: إضافة post-processing في ChatMessage لتحويل الروابط الخام `https://...` إلى `[domain](url)` قبل عرضها
- **الملف**: `src/components/ChatMessage.tsx`

### 1.4 الكومبيوتر والشعار مش بيظهر
- **المشكلة**: `ThinkingLoader` يظهر "Megsy Computer" فقط عند اكتشاف browser keywords في statusHistory، لكن المشكلة أن الـ tool calls لا تُفعّل BROWSE_WEBSITE بشكل صحيح
- **الحل**: تحسين شروط `needsBrowserIntent` في chat function لتشمل Shopping mode دائماً + التأكد من تمرير `statusHistory` بشكل صحيح
- **الملفات**: `supabase/functions/chat/index.ts`, `src/pages/ChatPage.tsx`

### 1.5 الأسئلة الذكية والمربعات لا تظهر
- **المشكلة**: الـ system prompt يطلب من AI إرسال JSON blocks لكن لا يحدث
- **الحل**: تعزيز system prompt بتعليمات أوضح + إضافة `tool` خاص بـ `ASK_SMART_QUESTIONS` لضمان ظهور الأسئلة
- **الملف**: `supabase/functions/chat/index.ts`

---

## المرحلة 2: إصلاح Deep Research والتسوق

### 2.1 Deep Research يعرض بيانات خام
- **المشكلة**: البحث العميق يعرض نتائج خام ومعلومات لا يجب عرضها
- **الحل**: تحسين system prompt للـ Deep Research ليقوم بـ:
  - عرض الصور المرتبطة فقط
  - تقديم تحليل عميق منظم بدلاً من إلقاء البيانات الخام
  - استخدام `moonshotai/kimi-k2.5:nitro` للتحليل
- **الملف**: `supabase/functions/chat/index.ts` — تحديث `buildSystemPrompt` للـ deep research

### 2.2 Shopping يعطي نتائج سيئة
- **المشكلة**: لا يستخدم الكومبيوتر، أسعار بالدولار بدل العملة المحلية
- **الحل**:
  - تفعيل `BROWSE_WEBSITE` تلقائياً في Shopping mode
  - إضافة اكتشاف الموقع الجغرافي في shopping prompt ("مصر" → بحث بالعربي + EGP)
  - استخدام `moonshotai/kimi-k2.5:nitro` للتسوق
- **الملف**: `supabase/functions/chat/index.ts`

---

## المرحلة 3: المكالمة الصوتية (Voice Call)

### 3.1 إصلاح Voice Call
- **المشكلة الحالية**: المدخل (STT) من Deepgram ✅ + الرد النصي من chat function ✅ + الـ TTS من `generate-voice` (LemonData) — هذا الأخير بطيء أو معطل
- **الحل**: تحويل TTS إلى OpenRouter model سريع ورخيص:
  - استخدام `openai/tts-1` عبر OpenRouter بدلاً من LemonData
  - أو استخدام Deepgram TTS (لأنه موجود فعلاً ومتاح)
- **الملفات**: `supabase/functions/generate-voice/index.ts`, `src/pages/voice/VoiceCallPage.tsx`

---

## المرحلة 4: أدوات الصوت

### 4.1 أدوات الصوت تظل تحمّل بلا نهاية
- **المشكلة**: `generate-voice` يستخدم LemonData للـ TTS وقد يفشل أو يتأخر بدون timeout واضح
- **الحل**: 
  - إضافة timeout 30 ثانية مع رسالة خطأ واضحة
  - تحويل نماذج الصوت لـ OpenRouter (أرخص وأسرع)
  - إضافة fallback: OpenRouter → LemonData
- **الملف**: `supabase/functions/generate-voice/index.ts`

### 4.2 زر التسجيل في المتصفح لكل أدوات الصوت
- **المشكلة**: بعض أدوات الصوت لا تدعم التسجيل من المتصفح
- **الحل**: إضافة مكون `AudioRecorder` مشترك يستخدم `MediaRecorder API` في:
  - TTSPage, VoiceChangerPage, CloneVoicePage, VoiceTranslatePage, NoiseRemoverPage
- **الملفات**: إنشاء `src/components/AudioRecorder.tsx` + تحديث صفحات الصوت

---

## المرحلة 5: صفحة الملفات

### 5.1 استخدام kimi-k2.5:nitro في الملفات
- **الملف**: `src/pages/FilesPage.tsx` — تغيير النموذج من `gemini-2.5-flash-lite` إلى `moonshotai/kimi-k2.5:nitro`

### 5.2 إعادة تصميم عرض Slides
- **المشكلة**: عرض Slides حالياً بشكل بحث قبيح
- **الحل**: تحويله لتصميم مشابه لسجل البرمجة (timeline/history cards) مع:
  - بطاقات أنيقة لكل عرض تقديمي
  - أيقونات gradient
  - تاريخ الإنشاء
  - زر Preview وDownload
- **الملف**: `src/pages/FilesPage.tsx`

### 5.3 تحسين Preview
- **المشكلة**: البريفيو مقرف
- **الحل**: إعادة تصميم Preview modal ليكون أنيق مع:
  - شريط أدوات نظيف
  - عرض بملء الشاشة بشكل افتراضي
  - أزرار تحميل واضحة
- **الملف**: `src/pages/FilesPage.tsx`

### 5.4 MagicSlides Integration
- **المشكلة**: يجب استخدام MagicSlides API بدلاً من HTML slides
- **الحل**: إنشاء edge function `generate-slides` تقوم بـ:
  1. البحث والمحتوى من خلالنا (chat function)
  2. إرسال المحتوى المنظم لـ MagicSlides API
  3. نظام تدوير مفاتيح ذكي (جدول `api_keys` مع service = "magicslides")
- **الملفات**: إنشاء `supabase/functions/generate-slides/index.ts`, تحديث `FilesPage.tsx`
- **ملاحظة**: يحتاج مفتاح API من المستخدم أولاً — سأبني البنية التحتية وأضيف placeholder

---

## المرحلة 6: تحسينات عامة

### 6.1 رسائل خطأ واضحة بدون أسماء مزودين
- **المشكلة**: رسائل الخطأ تكشف أسماء مزودي الخدمة (LemonData, OpenRouter, Deepgram)
- **الحل**: استبدال كل رسائل الخطأ في:
  - Edge functions: إخفاء أسماء المزودين في console.error فقط، وإرجاع رسائل عامة للمستخدم
  - Frontend: رسائل toast عامة مثل "حدث خطأ، حاول مرة أخرى"
- **الملفات**: كل edge functions + صفحات الواجهة

### 6.2 عدم طلب المدخل مرتين
- **المشكلة**: إذا رفع المستخدم صورة في Landing page، يُطلب منه مرة أخرى داخل الأداة
- **الحل**: تمرير الملف المرفق عبر URL params أو state عند التنقل من Landing إلى الأداة
- **الملفات**: صفحات أدوات الصور والفيديو والصوت

### 6.3 بطء Image Studio
- **المشكلة**: يأخذ دقائق لتحميل المحتوى
- **الحل**: إضافة timeout + loading states + lazy loading للصور + pagination
- **الملف**: `src/pages/ImageStudioPage.tsx`

---

## المرحلة 7: باقي الملفات (CSS + JS)
- **المشكلة**: Resume, Spreadsheet, Document تُنشأ كـ HTML
- **الحل**: إبقاء HTML مع تحسين CSS والـ JavaScript المضمن لجعلها تفاعلية وجميلة — هذا هو الأسلوب الحالي وهو الأنسب

---

## ترتيب التنفيذ

```text
المرحلة 1 (P0): إصلاح الشات — تحليل الصور، kimi model، لينكات، كومبيوتر، أسئلة ذكية
المرحلة 2 (P0): Deep Research + Shopping
المرحلة 3 (P1): Voice Call
المرحلة 4 (P1): أدوات الصوت + تسجيل المتصفح
المرحلة 5 (P1): الملفات — model + slides تصميم + preview + MagicSlides
المرحلة 6 (P2): رسائل خطأ + عدم تكرار المدخل + Image Studio
المرحلة 7 (P3): تحسين CSS/JS للملفات
```

## التفاصيل التقنية

### النماذج المستخدمة بعد التحديث:
| الاستخدام | النموذج | المزود |
|-----------|---------|--------|
| شات عادي / casual | `google/gemini-2.5-flash-lite-preview-09-2025` | OpenRouter |
| مهام معقدة / تحليل صور / deep research / shopping | `moonshotai/kimi-k2.5:nitro` | OpenRouter |
| ملفات (FilesPage) | `moonshotai/kimi-k2.5:nitro` | OpenRouter |
| مكالمة صوتية (chat) | `google/gemini-2.5-flash-lite-preview-09-2025` | OpenRouter |
| TTS (الصوت) | OpenRouter TTS أو LemonData fallback | OpenRouter → LemonData |

### الملفات المتأثرة:
```text
supabase/functions/chat/index.ts              — model routing + shopping + deep research + smart questions + error messages
supabase/functions/generate-voice/index.ts     — OpenRouter TTS + timeout
supabase/functions/generate-slides/index.ts    — جديد — MagicSlides integration
src/pages/ChatPage.tsx                        — computer use badge + error messages
src/pages/FilesPage.tsx                       — kimi model + slides redesign + preview
src/pages/voice/VoiceCallPage.tsx             — TTS fix
src/components/ChatMessage.tsx                — link formatting
src/components/AudioRecorder.tsx              — جديد — browser recording
src/components/ThinkingLoader.tsx             — computer use detection
src/lib/streamChat.ts                        — error messages
صفحات أدوات الصوت المتعددة                    — إضافة AudioRecorder
```

