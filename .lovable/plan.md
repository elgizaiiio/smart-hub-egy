

# خطة شاملة: إعادة تصميم جميع أدوات الصور والفيديوهات + تحسينات الـ Hub + Telegram

---

## ملخص المطلوب

1. إضافة مربع إدخال أعلى صفحتي Images/Videos Hub مع نصوص متغيرة وزر Generate كبير
2. إعادة تصميم 12+ أداة بنمط موحد (صفحة ترحيب → رفع صورة → قوالب/معالجة → نتيجة)
3. إضافة إدارة قوالب لكل أداة من Telegram Bot
4. تحديث bottom nav icons
5. إصلاح inpaint input bar

---

## التصميم الموحد للأدوات

### A. صفحة Landing لكل أداة (جديد)
كل أداة تبدأ بصفحة ترحيبية:
- صورة خلفية (من جدول `tool_images` يُتحكم بها من Telegram)
- اسم الأداة ونص وصف
- زر "Upload Your Photo" / "Start Now"
- تصميم مشابه لصورة FaceSwap المرجعية

### B. أنماط الأدوات (3 أنماط رئيسية)

**النمط 1: رفع → معالجة تلقائية → نتيجة**
(BG Remover, Colorizer, Retouch, Sketch to Image)
- Landing → رفع صورة → تبدأ المعالجة فوراً → صفحة نتيجة

**النمط 2: رفع → قوالب/إدخال → توليد → نتيجة**
(Clothes Changer, Headshot, Face Swap, Cartoon, Character Swap, Hair Changer)
- Landing → رفع صورة → عرض قوالب + بطاقة "Custom" في الأعلى → زر توليد أصفر عائم بالسعر → loading (نجمة) → صفحة نتيجة

**النمط 3: Inpaint/Remover (canvas editing)**
(Inpaint, Object Remover)
- نفس تصميم Inpaint الحالي مع إصلاح input bar

### C. صفحة النتيجة الموحدة
- Header مع زر رجوع
- الصورة/الفيديو
- مربع إدخال أسفل (لتعديل إضافي)
- حفظ تلقائي في Studio

---

## التغييرات بالتفصيل

### 1. ImagesPage.tsx + VideosPage.tsx - إضافة مربع إدخال علوي
- مربع إدخال بخلفية gradient (مثل الصورة المرجعية - ألوان وردية/بنفسجية)
- نصوص placeholder متغيرة ("Turn your ideas into art...", "Create stunning visuals...", etc.)
- زر model picker (أيقونة النموذج)
- زر `+` لإرفاق صور
- زر "Generate" كبير (ليس سهم - مكتوب عليه Generate)
- عند الضغط Generate: navigate إلى `/images/studio` أو `/videos/studio` مع إرسال prompt + صورة تلقائياً عبر location.state

### 2. Bottom Nav - تحديث الأيقونات
- إزالة خلفية الأيقونة النشطة (بدون rounded bg)
- استخدام أيقونات حديثة: `LayoutGrid` (Home), `Sparkles` (Studio), `Globe` (Community)
- الأيقونة النشطة بلون primary فقط بدون خلفية

### 3. ToolPageLayout.tsx - إعادة كتابة كاملة
سيصبح component موحد يدعم:
- **مرحلة Landing**: صورة خلفية + نصوص + زر البدء
- **مرحلة القوالب**: grid قوالب + بطاقة Custom
- **مرحلة النتيجة**: header + صورة + input bar للتعديل
- **زر توليد أصفر عائم** مع السعر بداخله
- **Loading**: نجمة متوهجة (مثل ChatPage)

### 4. الأدوات المحدثة

| الأداة | النمط | التغيير |
|--------|-------|---------|
| Clothes Changer | 2 (قوالب) | Landing → رفع صورة → قوالب + Custom → زر أصفر → نتيجة |
| AI Headshot | 2 (قوالب) | Landing → gender toggle → قوالب → رفع صورة → زر أصفر (لا توليد تلقائي) → نتيجة |
| Face Swap | 2 (قوالب) | Landing كخلفية → رفع صورتك → قوالب + Custom (رفع صورة ثانية) → زر أصفر → نتيجة |
| BG Remover | 1 (تلقائي) | Landing → رفع → معالجة فورية → نتيجة |
| Cartoon | 2 (قوالب) | Landing → رفع → قوالب + input prompt → زر أصفر → نتيجة |
| Colorizer | 1 (تلقائي) | Landing → رفع → معالجة فورية → نتيجة |
| Retouch | 1 (تلقائي) | Landing → رفع → معالجة فورية → نتيجة |
| Object Remover | 3 (inpaint) | مثل Inpaint بالضبط |
| Sketch to Image | 1 (تلقائي) | Landing → رفع → معالجة فورية → نتيجة |
| Character Swap | 2 (قوالب) | مثل Face Swap |
| Hair Changer | 2 (قوالب) | Landing → رفع → قوالب + Custom → زر أصفر → نتيجة |
| Video Upscale | خاص | Landing → رفع → إعدادات أنيقة → زر أصفر عائم |
| Talking Photo | خاص | Landing → 3 مربعات رفع (صورة + صوت أو نص) → زر أصفر |
| Lip Sync | خاص | Landing → مربعين (فيديو + صوت) → زر أصفر |

### 5. Community Tab - تبسيط
- عرض الصور/الفيديوهات بدون أزرار
- عند الضغط: صفحة جديدة (header + صورة + زر Reuse + Share)

### 6. Inpaint - إصلاح input bar
- التأكد من ظهور مربع الإدخال في مرحلة edit

### 7. Telegram Bot - قوالب لكل أداة

**جدول جديد**: `tool_templates`
```sql
create table tool_templates (
  id uuid primary key default gen_random_uuid(),
  tool_id text not null,
  name text not null,
  prompt text,
  preview_url text,
  gender text default 'both',
  display_order int default 0,
  is_active boolean default true
);
```

**جدول جديد**: `tool_landing_images`
```sql
create table tool_landing_images (
  tool_id text primary key,
  image_url text,
  updated_at timestamptz default now()
);
```

**إضافات Telegram Bot**:
- عند الضغط على أداة في tools_menu: عرض خيارين (تغيير صورة Landing + إدارة القوالب)
- إدارة القوالب: إضافة/تعديل/حذف (اسم + صورة + prompt + gender)
- الأدوات التي لها قوالب: Clothes Changer, Headshot, Face Swap, Cartoon, Character Swap, Hair Changer

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| Migration SQL | جداول `tool_templates` + `tool_landing_images` |
| `src/components/ToolPageLayout.tsx` | إعادة كتابة كاملة مع Landing + قوالب + نتيجة |
| `src/pages/ImagesPage.tsx` | إضافة مربع إدخال علوي + تحديث bottom nav |
| `src/pages/VideosPage.tsx` | نفس التغيير |
| `src/pages/tools/ClothesChangerPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/HeadshotPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/FaceSwapPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/BgRemoverPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/CartoonPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/ColorizerPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/RetouchingPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/RemoverPage.tsx` | تحويل لنمط Inpaint |
| `src/pages/tools/SketchToImagePage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/CharacterSwapPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/HairChangerPage.tsx` | إعادة كتابة بالنمط الجديد |
| `src/pages/tools/VideoUpscalePage.tsx` | تحديث التصميم |
| `src/pages/tools/TalkingPhotoPage.tsx` | تحديث التصميم |
| `src/pages/tools/LipSyncPage.tsx` | تحديث التصميم |
| `src/pages/tools/InpaintPage.tsx` | إصلاح input bar |
| `supabase/functions/telegram-bot/index.ts` | إضافة إدارة قوالب + landing images |

---

## ترتيب التنفيذ

1. Migration (جداول tool_templates + tool_landing_images)
2. ToolPageLayout الموحد الجديد
3. تحديث ImagesPage + VideosPage (مربع إدخال + bottom nav)
4. إعادة كتابة الأدوات (12+ ملف)
5. إصلاح Inpaint
6. تحديث Telegram Bot
7. Community tab

