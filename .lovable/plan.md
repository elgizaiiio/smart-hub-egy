

# إخفاء شريط Google Translate بالكامل

الـ CSS الحالي في `TranslationWrapper.tsx` يخفي معظم عناصر Google Translate لكن الشريط العلوي (banner frame) لا يزال يظهر لأن Google Translate يضيف `style="top: 40px"` على `body` ويعرض iframe في أعلى الصفحة.

## التعديل المطلوب

**`src/components/TranslationWrapper.tsx`** - تحسين CSS الإخفاء:
- إضافة `iframe.goog-te-banner-frame` بـ `display: none !important; height: 0 !important; visibility: hidden !important`
- إضافة `body { top: 0 !important; margin-top: 0 !important; }` 
- إضافة `#goog-gt-tt, .goog-te-menu-value` للإخفاء
- إضافة `MutationObserver` لمراقبة `body` وإزالة أي `top` style يضيفه Google Translate ديناميكياً
- إضافة `!important` على كل القيم لضمان الأولوية

المشكلة الأساسية: Google Translate يضيف inline style على `body` بعد تحميل الترجمة، فالـ CSS وحده لا يكفي - نحتاج MutationObserver يمسح الـ `top` من body كل ما يتغير.

