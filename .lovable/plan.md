

# خطة: تحويل بطاقات الأدوات إلى خلفيات فنية متدرجة + إزالة النصوص من Landing Pages

---

## ملخص

1. استبدال صور البطاقات الحالية بخلفيات CSS فنية (تدرجات حريرية مثل الصورة المرفوعة) بألوان مختلفة لكل أداة
2. كتابة اسم الأداة داخل البطاقة بخط صغير وواضح بنفس ستايل نصوص Landing الرئيسية (uppercase، font-display، gradient text)
3. إزالة النصوص الوصفية من صفحات Landing الخاصة بالأدوات (إبقاء العنوان فقط)

---

## التفاصيل التقنية

### 1. بطاقات الأدوات - خلفيات فنية

بدلاً من تحميل صور خارجية، سنستخدم CSS gradients مع تأثيرات noise/silk لكل أداة بألوان فريدة:

```text
Inpaint          → blue-500 → indigo-700
Clothes Changer  → rose-500 → red-700  
AI Headshot      → amber-500 → orange-700
Face Swap        → violet-500 → purple-700
BG Remover       → cyan-500 → teal-700
Cartoon          → pink-500 → fuchsia-700
Colorizer        → emerald-500 → green-700
Retouch          → sky-500 → blue-700
Object Remover   → slate-500 → zinc-700
Sketch to Image  → lime-500 → emerald-700
Relight          → yellow-500 → amber-700
Character Swap   → fuchsia-500 → pink-700
Storyboard       → indigo-500 → violet-700
Hair Changer     → teal-500 → cyan-700
(أدوات الفيديو بنفس المنطق بألوان مختلفة)
```

كل بطاقة ستحتوي على:
- خلفية CSS gradient متعددة الطبقات (radial + linear) لتأثير حريري
- اسم الأداة بخط صغير (text-xs uppercase tracking-widest) بتدرج لوني مثل Landing
- بدون أي صور خارجية أو وصف

### 2. ستايل النص داخل البطاقات

نفس ستايل Landing الرئيسية:
- `uppercase tracking-tight font-bold`
- تدرج لوني على النص: `bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent`
- حجم صغير وواضح

### 3. إزالة النصوص من Tool Landing Pages

في `ToolPageLayout.tsx` > `ToolLanding` component:
- إزالة prop الـ `description` ونص الوصف
- إبقاء العنوان فقط مع زر الرفع

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/pages/ImagesPage.tsx` | استبدال منطق عرض الصور بـ CSS gradients + نص بستايل Landing |
| `src/pages/VideosPage.tsx` | نفس التغيير |
| `src/components/ToolPageLayout.tsx` | إزالة description من ToolLanding |
| أدوات الصور (14 ملف) | إزالة prop الـ description عند استدعاء ToolPageLayout |

