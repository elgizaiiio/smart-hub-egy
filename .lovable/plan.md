

# ترجمة Placeholders مع نظام الترجمة

## المشكلة
الـ placeholders في مربعات الإدخال لا تُترجم عند تغيير اللغة. يوجد نوعان:
1. **Static placeholders** - في صفحات Auth, Settings, إلخ — النظام الحالي في `translateInputAttributes` يعالجها لكن التوقيت والتكرار غير كافٍ
2. **Dynamic placeholders** - في `AnimatedInput` و `ImagesPage` و `VideosPage` — تتغير بالـ JS فلا يلتقطها نظام المرآة

## الحل

### 1. تحسين `translateInputAttributes` في `TranslationWrapper.tsx`
- إضافة MutationObserver يراقب إضافة inputs جديدة للـ DOM ويعيد ترجمة الـ placeholders
- زيادة التأخير من 2500ms لضمان ترجمة Google الفعلية
- تشغيلها بشكل دوري كل 3 ثوانٍ لأول 15 ثانية بعد تغيير اللغة

### 2. إنشاء hook `useTranslatedPlaceholders`
- Hook جديد في `src/hooks/useTranslatedPlaceholders.ts`
- يأخذ مصفوفة نصوص إنجليزية ويُرجع النسخ المترجمة
- يستخدم نفس تقنية المرآة (mirror div) لترجمة النصوص عبر Google Translate
- يستمع لحدث `languagechange-custom` لإعادة الترجمة

### 3. تحديث المكونات التي تستخدم placeholders ديناميكية
- `AnimatedInput.tsx` — استخدام `useTranslatedPlaceholders` لترجمة `DEFAULT_PLACEHOLDERS`
- `ImagesPage.tsx` — ترجمة placeholders الخاصة بالصور
- `VideosPage.tsx` — ترجمة placeholders الخاصة بالفيديو

### الملفات المتأثرة
| ملف | التغيير |
|-----|---------|
| `src/hooks/useTranslatedPlaceholders.ts` | إنشاء جديد |
| `src/components/TranslationWrapper.tsx` | تحسين MutationObserver للـ inputs الجديدة |
| `src/components/AnimatedInput.tsx` | استخدام Hook الترجمة |
| `src/pages/ImagesPage.tsx` | استخدام Hook الترجمة |
| `src/pages/VideosPage.tsx` | استخدام Hook الترجمة |

