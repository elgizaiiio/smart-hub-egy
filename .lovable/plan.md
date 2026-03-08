

## تعديل أزرار Photos و Files في قائمة (+)

### المشكلة
- زر **Photos** حالياً يفتح الكاميرا بدلاً من معرض الصور (لأنه يستخدم نفس input الكاميرا مع `capture="environment"`)
- زر **Files** يقبل أنواع ملفات محدودة فقط

### الحل
تعديل `src/pages/ChatPage.tsx`:

1. **إضافة ref جديد** `photoInputRef` لمعرض الصور — input بدون `capture` attribute حتى يفتح المعرض مباشرة
2. **ربط زر Photos** بـ `photoInputRef` بدلاً من `imageInputRef`
3. **توسيع accept في Files** ليقبل جميع أنواع الملفات (`*/*`) مثل أي موقع عادي
4. **إبقاء Camera** كما هو مع `capture="environment"` لفتح الكاميرا
5. **بدون أي تغيير في الشكل** — نفس التصميم الحالي بدون شرح تحتهم

### التغييرات التقنية
- سطر 47: إضافة `const photoInputRef = useRef<HTMLInputElement>(null);`
- سطر 352: تغيير `imageInputRef` إلى `photoInputRef` في زر Photos
- سطر 435: تغيير accept في Files إلى `*/*`
- بعد سطر 436: إضافة input جديد `<input ref={photoInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />` (بدون capture)

