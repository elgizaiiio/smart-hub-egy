

# خطة شاملة: إصلاح مربع الإدخال + تحويل الأدوات إلى Landing Pages + إزالة Avatar Maker + تحسينات عامة

---

## ملخص المطلوب (12 تغيير رئيسي)

1. إصلاح UnifiedInputBar (حجم العناصر الداخلية + أيقونة النموذج + زر وسائط)
2. تحويل كل صفحات الأدوات إلى Landing Page أولاً (صورة خلفية + زر رفع في المنتصف)
3. إصلاح زر الرجوع في الأدوات (يرجع للصفحة الرئيسية مش Landing)
4. إزالة Avatar Maker 3D بالكامل
5. إصلاح زر "Custom Hairstyle" في Hair Changer
6. توحيد أدوات الفيديو بنفس تصميم أدوات الصور
7. إزالة الوصف من بطاقات الأدوات في Hub
8. إعادة تصميم قائمة النماذج (ModelPickerSheet)
9. إضافة تخصيص Landing Pages في بوت تليجرام
10. توحيد Header الأدوات (اسم فقط بدون تكلفة)
11. Video Swap Characters → نفس نمط Image Character Swap (قوالب)
12. أدوات الفيديو تبدأ بـ Landing Page مع أزرار

---

## التفاصيل

### 1. UnifiedInputBar.tsx - إصلاح التصميم

**المشكلة**: العناصر الداخلية كبيرة جداً، أيقونة النموذج لا تظهر (يظهر حرف M)، زر + غير واضح

**الحل**:
- تصغير العناصر الداخلية (الأزرار h-9 w-9 بدلاً من h-11 w-11)
- إصلاح أيقونة النموذج: استخدام `selectedModel.iconUrl` مع fallback أفضل ومعالجة خطأ أذكى
- تغيير زر `+` إلى أيقونة `Paperclip` أو `ImagePlus` مع label "Media"
- المربع نفسه يبقى كبير (tall) - العناصر الداخلية تصغر فقط

### 2. ToolPageLayout.tsx - Landing Page موحدة لكل الأدوات

**المشكلة**: الأدوات تبدأ مباشرة بمربع رفع بسيط

**الحل**: كل أداة تبدأ بـ Landing Page:
- صورة خلفية full-screen (من جدول `tool_landing_images`)
- Gradient overlay من الأسفل
- اسم الأداة في المنتصف
- زر "Upload Your Photo" / "Upload Video" كبير ومميز في المنتصف
- عند غياب صورة Landing → fallback gradient

**تعديل ToolPageLayout**:
- `showLanding` يكون `true` دائماً (حتى بدون صورة من DB)
- Landing يعرض gradient fallback عند عدم وجود صورة

### 3. زر الرجوع في الأدوات

**المشكلة**: بعد رفع صورة → الضغط على Back يرجع لـ Landing بدل الصفحة الرئيسية

**الحل**: في كل أداة، زر Back يفعل `navigate("/images")` أو `navigate("/videos")` حسب النوع بدلاً من `navigate(-1)` أو العودة للخطوة السابقة

### 4. إزالة Avatar Maker 3D

- حذف `src/pages/tools/AvatarMakerPage.tsx`
- إزالة import و Route من `App.tsx`
- إزالة من `ALL_TOOLS` في `ImagesPage.tsx`

### 5. Hair Changer - إصلاح زر Custom

**المشكلة**: `onCustom={() => {}}` - الزر لا يفعل شيء

**الحل**: عند الضغط على Custom → إظهار textarea لإدخال وصف الشعر المطلوب + زر Generate

### 6. Video Tools - توحيد التصميم

**الأدوات المتأثرة**: VideoSwapPage, TalkingPhotoPage, LipSyncPage, VideoUpscalePage, VideoExtenderPage, AutoCaptionPage

**التغيير**:
- كل أداة تبدأ بـ Landing Page (مثل أدوات الصور)
- بعد Landing → صفحة رفع المحتوى المطلوب
- VideoSwapPage يتحول لنمط قوالب (مثل FaceSwapPage/CharacterSwapPage)
- باقي الأدوات: Landing → رفع → إعدادات → زر Generate أصفر

### 7. إزالة الوصف من بطاقات الأدوات

في ImagesPage و VideosPage:
- إزالة `<p className="text-[10px]...">{tool.desc}</p>`
- إبقاء اسم الأداة فقط في الأسفل

### 8. إعادة تصميم ModelPickerSheet

- تصميم أنظف وأبسط
- بطاقات النماذج أكبر مع أيقونات واضحة
- إزالة التعقيد الزائد
- Bottom sheet بتصميم حديث

### 9. Telegram Bot - تخصيص Landing Pages

إضافة أو تحسين أزرار في قائمة Tools:
- لكل أداة: زر "تغيير صورة Landing" + "تغيير الوصف"
- عند الضغط: إرسال صورة → حفظ في `tool_landing_images`

### 10. توحيد Header

كل صفحات الأدوات:
- Header يعرض اسم الأداة فقط
- بدون عدد الكريدت
- `hideHeaderCost = true` يصبح الافتراضي

### 11. Character Swap (Videos) → قوالب

- تحويل VideoSwapPage لنفس نمط CharacterSwapPage/FaceSwapPage
- Landing → رفع فيديو → قوالب + Custom → Generate

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/components/UnifiedInputBar.tsx` | إصلاح أحجام العناصر + أيقونة النموذج + زر وسائط |
| `src/components/ToolPageLayout.tsx` | Landing Page دائمة + Header بدون تكلفة |
| `src/pages/ImagesPage.tsx` | إزالة avatar-maker + إزالة desc من البطاقات |
| `src/pages/VideosPage.tsx` | إزالة desc من البطاقات |
| `src/pages/tools/AvatarMakerPage.tsx` | **حذف** |
| `src/pages/tools/HairChangerPage.tsx` | إصلاح Custom + Landing |
| `src/pages/tools/FaceSwapPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/ClothesChangerPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/BgRemoverPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/CartoonPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/ColorizerPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/RetouchingPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/SketchToImagePage.tsx` | Landing + زر رجوع |
| `src/pages/tools/CharacterSwapPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/HeadshotPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/RemoverPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/RelightPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/StoryboardPage.tsx` | Landing + زر رجوع |
| `src/pages/tools/VideoSwapPage.tsx` | إعادة كتابة بنمط قوالب |
| `src/pages/tools/TalkingPhotoPage.tsx` | Landing + تصميم جديد |
| `src/pages/tools/LipSyncPage.tsx` | Landing + تصميم جديد |
| `src/pages/tools/VideoUpscalePage.tsx` | Landing + تصميم جديد |
| `src/pages/tools/VideoExtenderPage.tsx` | Landing + تصميم جديد |
| `src/pages/tools/AutoCaptionPage.tsx` | Landing + تصميم جديد |
| `src/components/ModelPickerSheet.tsx` | إعادة تصميم |
| `src/App.tsx` | إزالة AvatarMaker route + import |
| `supabase/functions/telegram-bot/index.ts` | تحسين إدارة Landing images |

---

## ترتيب التنفيذ

1. حذف Avatar Maker + تنظيف App.tsx و ImagesPage
2. إصلاح UnifiedInputBar
3. تحديث ToolPageLayout (Landing دائمة + header موحد)
4. تحديث كل أدوات الصور (12 ملف)
5. تحديث أدوات الفيديو (6 ملفات) + تحويل VideoSwap لقوالب
6. إزالة desc من بطاقات Hub
7. إعادة تصميم ModelPickerSheet
8. تحديث Telegram Bot

