

## التغييرات المطلوبة

### 1. صفحة الصور (ImagesPage) — زر Photos
- تغيير النص من "Attach Image" إلى "Photos" مع وصف "Choose from gallery"
- الزر يفتح معرض الصور على الجهاز (يعمل فعلاً عبر `accept="image/*"`)

### 2. صفحة الملفات (FilesPage) — أزرار Photos و Files
- تغيير "Image" إلى "Photos" مع وصف "Choose from gallery"
- تغيير "Document" إلى "Files" مع وصف "Browse device files"
- نفس السلوك الحالي (الأزرار تفتح file picker الجهاز)

### 3. شعار Outlook الرسمي (IntegrationsPage)
- استبدال SVG الحالي بشعار Outlook الرسمي من Simple Icons (path واحد نظيف باللون الأزرق `#0078D4`)

### الملفات:
1. `src/pages/ImagesPage.tsx` — تعديل نص الزر
2. `src/pages/FilesPage.tsx` — تعديل نصوص الأزرار  
3. `src/pages/IntegrationsPage.tsx` — استبدال OutlookIcon SVG

