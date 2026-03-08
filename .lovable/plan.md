

## خطة تحسين سرعة تحميل الصور والفيديوهات

### المشكلة
جميع الفيديوهات والصور تُحمّل دفعة واحدة عند فتح الصفحة، مما يبطئ التحميل بشكل كبير.

### الحل

**1. Lazy Loading للفيديوهات (تحميل عند الظهور فقط)**
- إنشاء component جديد `LazyVideo` يستخدم `IntersectionObserver`
- الفيديو لا يبدأ التحميل إلا عندما يقترب المستخدم منه أثناء السكرول
- يعرض placeholder/skeleton أثناء التحميل

**2. تطبيق `loading="lazy"` على جميع الصور**
- الصور في `HorizontalGallery` و `ShowcaseGallery` تستخدم `loading="lazy"` بالفعل جزئياً
- سنتأكد من تطبيقها على كل الصور خارج الـ viewport الأول

**3. فيديوهات Hero فقط تُحمّل فوراً**
- فيديوهات `HeroSection` (5 فيديوهات) تبقى `preload="auto"` لأنها أول شيء يراه المستخدم
- باقي الفيديوهات في `ParallaxShowcase`، `ShowcaseGallery`، `StickyFeatureTabs` تتحول لـ lazy

**4. `preload="none"` للفيديوهات البعيدة**
- فيديوهات ShowcaseGallery و ParallaxShowcase تستخدم `preload="none"` بدلاً من `"auto"`

### الملفات المتأثرة
- **جديد**: `src/components/landing/LazyVideo.tsx` — component يستخدم IntersectionObserver
- **تعديل**: `ParallaxShowcase.tsx` — استبدال `<video>` بـ `LazyVideo`
- **تعديل**: `ShowcaseGallery.tsx` — استبدال `<video>` بـ `LazyVideo`
- **تعديل**: `StickyFeatureTabs.tsx` — استبدال `<video>` بـ `LazyVideo`
- **تعديل**: `HorizontalGallery.tsx` — التأكد من `loading="lazy"` على كل الصور

### التفاصيل التقنية

```text
LazyVideo Component:
┌─────────────────────────┐
│  IntersectionObserver    │
│  rootMargin: "200px"     │  ← يبدأ التحميل قبل الظهور بـ 200px
│                          │
│  !inView → Skeleton      │
│   inView → <video>       │
│           preload="auto" │
│           autoPlay, loop │
└─────────────────────────┘
```

هذا سيقلل وقت التحميل الأولي بشكل كبير لأن الصفحة لن تحمّل إلا فيديوهات الـ Hero فقط عند الفتح.

