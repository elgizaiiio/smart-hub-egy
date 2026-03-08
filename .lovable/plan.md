

# إضافة فراغ آمن تحت مربع الإدخال في كل الصفحات

## المشكلة
الفراغ تحت مربع الإدخال يظهر بلون مختلف عن خلفية الموقع على أجهزة iPhone/Android. يجب تطبيق `padding-bottom: env(safe-area-inset-bottom)` مع `background-color` مطابق للخلفية في كل الصفحات التي تحتوي على مربع إدخال.

## التغييرات

### 1. `src/pages/ChatPage.tsx` (سطر 291)
- موجود بالفعل ✓ — لا تغيير

### 2. `src/pages/ImagesPage.tsx` (سطر 546)
- تغيير `<div className="shrink-0 px-3 pb-3 pt-1">` إلى:
  `<div className="shrink-0 px-3 pt-1 bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>`

### 3. `src/pages/VideosPage.tsx` (سطر 524)
- نفس التغيير: إضافة `bg-background` + `style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}`

### 4. `src/pages/FilesPage.tsx` (سطر 343)
- تغيير `<div className="sticky bottom-0 z-20 shrink-0 px-3 pb-3 pt-1 bg-background/80 backdrop-blur-md">` إلى:
  `<div className="sticky bottom-0 z-20 shrink-0 px-3 pt-1 bg-background" style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>`

### الملفات المتأثرة
| ملف | التغيير |
|-----|---------|
| `src/pages/ImagesPage.tsx` | إضافة safe-area + bg-background |
| `src/pages/VideosPage.tsx` | إضافة safe-area + bg-background |
| `src/pages/FilesPage.tsx` | إضافة safe-area + bg-background |

