

# خطة شاملة: إعادة تصميم صفحتي الصور والفيديوهات + Headshot جديدة + لودر جديد + أزرار Telegram

---

## 1. إعادة تصميم صفحتي الصور والفيديوهات (تصميم موحد)

**الملفات:** `ImagesPage.tsx`, `VideosPage.tsx`

### التخطيط الجديد (من الأعلى للأسفل):

**A. بطاقة Community علوية**
- بطاقة بارزة بخلفية gradient وصورة تؤدي لتاب Community
- نص مثل "Explore Community Creations" مع زر Explore

**B. أيقونات دائرية قابلة للسكرول (Scrollable Circle Icons)**
- صف أفقي من الأيقونات الدائرية يعرض الخدمات البسيطة
- للصور: BG Remove, Upscale, Retouch, Colorize, Cartoon, Sketch
- للفيديوهات: Upscale, Auto Caption, Lip Sync, Extender
- كل أيقونة: صورة دائرية + اسم تحتها، عند الضغط ينقل للأداة

**C. بطاقات كبيرة للخدمات المهمة**
- بطاقات كبيرة (مثل الصورة المرجعية) للأدوات المهمة
- للصور: Inpaint, Clothes Changer, Headshot, Face Swap
- للفيديوهات: Swap Characters, Talking Photo
- كل بطاقة: صورة كبيرة + اسم + وصف قصير

**D. مربع الإدخال (ثابت في الأسفل)**
- تصميم مثل الصورة المرجعية: sparkles icon + placeholder "Describe your new idea..."
- بدل أيقونة sparkles: صورة النموذج المختار (عند الضغط يفتح Model Picker)
- داخل المربع: الكريدتات تظهر تحت الـ textarea
- أزرار: Wand2 للتحسين + Settings + Send (بدون أيقونة في زر Send)

**E. أزرار تنقل سفلية**
- 3 أيقونات: Home (الرئيسية) + Studio (الاستوديو) + Community (المجتمع)
- تحت مربع الإدخال مباشرة

### حذف التابات العلوية الحالية (Home/Studio/Community pills) واستبدالها بالأزرار السفلية

---

## 2. لودر التوليد الجديد (بدل الانتقال للاستوديو)

**الملف الجديد:** `src/components/OrbLoader.tsx`

عند التوليد، بدلا من نقل المستخدم للاستوديو:
- يظهر overlay كامل الشاشة بخلفية داكنة
- الكرة المتوهجة (CSS المقدم من المستخدم) في المنتصف
- نصوص متغيرة تحت الكرة: "Creating your masterpiece...", "Bringing ideas to life...", "Almost there...", "Generating creativity..."
- النقاط ".... IN PROGRESS" كما في الصورة المرجعية

عند الانتهاء:
- يختفي اللودر ويظهر صفحة النتيجة:
  - هيدر علوي مع زر رجوع فقط
  - الصورة/الفيديو الناتجة
  - مربع الإدخال تحتها (لتوليد جديد مباشرة)

**الملف:** `src/index.css` (إضافة CSS الـ loader)

---

## 3. إعادة تصميم صفحة Headshot

**الملف:** `src/pages/tools/HeadshotPage.tsx` (إعادة كتابة كاملة)

### التصميم:
- **هيدر علوي:** اسم "AI Headshot" مع زر يفتح الاستوديو (أيقونة history/clock)
- **نص كبير:** "Generate your perfect headshots"
- **زرين:** Female / Male (toggle)
- **بطاقات القوالب:** grid 2 أعمدة، كل بطاقة تعرض صورة القالب + اسمه فقط
  - القوالب الافتراضية: Business, Black & White, Wedding, Studio, Casual, Vintage
  - كل قالب له prompt مخفي
- **عند اختيار قالب:** يطلب رفع صورة الوجه
- **عند الرفع:** يبدأ التوليد باستخدام Nano Banana مع prompt القالب المخفي + الصورة
- **عند الانتهاء:** ينقل المستخدم للاستوديو

### جدول Supabase (Migration):
```sql
CREATE TABLE headshot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'both', -- male, female, both
  prompt TEXT NOT NULL,
  preview_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. أزرار Telegram Bot الجديدة

**الملف:** `supabase/functions/telegram-bot/index.ts`

### A. زر "Tools" في القائمة الرئيسية
- يعرض قائمة الأدوات (IMAGE_TOOLS + VIDEO_TOOLS)
- عند اختيار أداة: يطلب رفع صورة preview جديدة
- يحفظ في جدول موجود أو `tool_previews` في memories

### B. زر "Headshot" في القائمة الرئيسية
- إضافة/تعديل/حذف قوالب headshot
- عند الإضافة: يطلب الاسم ← الجنس ← البرومبت ← صورة preview
- يحفظ في جدول `headshot_templates`

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/ImagesPage.tsx` | إعادة تصميم كاملة |
| `src/pages/VideosPage.tsx` | إعادة تصميم كاملة |
| `src/components/OrbLoader.tsx` | **جديد** - لودر الكرة المتوهجة |
| `src/components/OrbLoader.css` | **جديد** - CSS الأنيميشن |
| `src/pages/tools/HeadshotPage.tsx` | إعادة كتابة كاملة |
| `supabase/functions/telegram-bot/index.ts` | إضافة أزرار Tools + Headshot |
| Migration SQL | جدول `headshot_templates` |

---

## ترتيب التنفيذ

1. Migration (جدول headshot_templates)
2. OrbLoader component + CSS
3. إعادة تصميم ImagesPage + VideosPage
4. إعادة تصميم HeadshotPage
5. أزرار Telegram Bot

