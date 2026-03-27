

# خطة التعديلات الشاملة

---

## 1. صفحتا الصور والفيديوهات - إعادة هيكلة Home Tab

### المطلوب:
- **حذف قسم Models** بالكامل من Home tab (كلا الصفحتين)
- **إضافة مربع إدخال عائم** في أسفل الصفحة مع زر بداخله يفتح قائمة نماذج (image models في صفحة الصور، video models في صفحة الفيديو)
- **حذف الإيموجي** (`🖼️` و `🎬`) من fallback واستبدالها بنص أو لا شيء
- **حذف أيقونة Coins** من بطاقات الأدوات

### التنفيذ:
- `ImagesPage.tsx`: حذف أسطر 121-150 (قسم Models)، إضافة floating input bar مع model picker sheet في الأسفل
- `VideosPage.tsx`: حذف أسطر 119-147 (قسم Models)، نفس الشيء
- عند اختيار نموذج من القائمة → يتم التوجيه إلى ImageStudioPage أو VideoStudioPage مع النموذج المحدد
- إضافة `pb-24` لمنع التداخل مع المربع العائم

---

## 2. Studio Tab - إظهار الوسائط الصحيحة فقط

### المشكلة:
- صفحة الصور تعرض كل الصور (بما فيها التي ليست صور)
- صفحة الفيديوهات تفلتر بـ `.mp4` أو `video` فقط

### التنفيذ:
- `ImagesPage.tsx` → Studio: فلترة الصور فقط (استبعاد URLs التي تحتوي `.mp4` أو `video`)
- `VideosPage.tsx` → Studio: يبقى كما هو (يفلتر الفيديوهات فقط)

---

## 3. Community Tab - تحسينات

### المطلوب:
- الفيديوهات تشغل تلقائيًا (`autoPlay muted loop playsInline`)
- إضافة زري "Copy Prompt" و "Reuse" تحت كل بطاقة (ليس overlay)
- حذف الأيقونات من الأزرار

### التنفيذ:
- كلا الصفحتين: تعديل Community section لإضافة أزرار نصية أسفل كل بطاقة
- الفيديوهات: تغيير من `controls` إلى `autoPlay muted loop playsInline`

---

## 4. التوجيه للاستوديو عند التوليد

### المطلوب:
عند الضغط على Generate في أي أداة أو نموذج → توجيه النتيجة لقسم Studio

### التنفيذ:
- كل صفحات الأدوات (`/tools/*`) بعد التوليد تحفظ النتيجة وتوجه المستخدم إلى `/images` أو `/videos` مع `state: { tab: 'studio' }`
- ImagesPage و VideosPage: قراءة `location.state?.tab` لتحديد التبويب النشط

---

## 5. صفحة الملفات - تحسين Preview + AI Agent

### 5.1 Preview يدعم كل الأنواع
- الـ iframe الحالي يعمل فقط مع HTML
- إضافة دعم: عرض الصور مباشرة، عرض PDF عبر `<object>`، عرض النص العادي

### 5.2 AI Agent لإنشاء الملفات
- تحديث system prompt في edge function `chat` لوضع `files` mode بنظام أفضل
- إضافة دعم تنزيل بصيغ متعددة: HTML, PDF, DOCX (عبر تحويل HTML)
- إضافة دعم Smart Questions (نفس نظام الشات): الـ AI يرسل `[SMART_QUESTIONS]` block والفرونت يعرضها

### 5.3 التنفيذ:
- `FilesPage.tsx`: إضافة parsing لـ `[SMART_QUESTIONS]` من رد الـ AI + عرض `SmartQuestionCard`
- تحسين preview modal لعرض أنواع ملفات مختلفة
- إضافة زر تنزيل DOCX (باستخدام html-to-docx أو تحويل بسيط)

---

## 6. صفحة الاشتراكات - حذف الأيقونات

### المطلوب:
حذف كل الأيقونات من `PricingPage.tsx` (Crown, Star, Shield, Zap, etc.)

### التنفيذ:
- حذف imports الأيقونات غير المستخدمة
- حذف الأيقونات من بطاقات الخطط وقوائم الميزات

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/ImagesPage.tsx` | حذف Models، إضافة floating input + model picker، فلترة Studio، تحسين Community |
| `src/pages/VideosPage.tsx` | نفس التغييرات |
| `src/pages/FilesPage.tsx` | Smart Questions، تحسين Preview، دعم صيغ متعددة |
| `src/pages/PricingPage.tsx` | حذف الأيقونات |
| `src/components/ToolPageLayout.tsx` | بعد التوليد → redirect للاستوديو |
| `supabase/functions/chat/index.ts` | تحسين files mode prompt |

