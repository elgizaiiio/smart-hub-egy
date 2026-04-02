

# خطة: إزالة مربع الإدخال من صفحتي الصور والفيديوهات الرئيسيتين

---

## المشكلة
صفحتي `/images` و `/videos` تحتوي حاليا على مربع إدخال + منطق توليد كامل، بينما صفحات التوليد الفعلية موجودة بالفعل (`/images/studio`, `/images/agent`, `/videos/studio`, `/videos/agent`). المطلوب إبقاء الصفحات الرئيسية كصفحات استكشاف فقط.

---

## التغييرات

### 1. `src/pages/ImagesPage.tsx`
- **حذف**: مربع الإدخال الثابت (input bar) + Model Picker popup + Settings popup + Bottom Nav
- **حذف**: كل منطق التوليد (`handleSend`, `handleEnhancePrompt`, `generating`, `resultMedia`, `OrbLoader`)
- **حذف**: states غير مستخدمة (`prompt`, `selectedModel`, `enhancing`, `modelPickerOpen`, `settingsOpen`, `aspectRatio`, `imageCount`, `quality`, `negativePrompt`, `resultMedia`, `generating`)
- **إبقاء**: Community card + Quick tools circles + Featured tools cards + Studio tab + Community tab + Image preview modal
- **إضافة**: زر "Create" بارز يوجه المستخدم لـ `/images/studio` (بدلا من مربع الإدخال)
- **تعديل**: Bottom nav يبقى فقط كـ tabs علوية أو يتحول لتنقل بسيط بدون input

### 2. `src/pages/VideosPage.tsx`
- نفس التغييرات بالضبط: حذف input bar + generation logic
- إضافة زر "Create" يوجه لـ `/videos/studio`

### 3. تعديل الـ padding
- حذف `pb-44` (الذي كان يعوض ارتفاع مربع الإدخال) واستبداله بـ `pb-6` عادي

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/ImagesPage.tsx` | حذف input bar + generation logic، إضافة زر Create |
| `src/pages/VideosPage.tsx` | نفس التغيير |

