

## تحسين تصميم صفحة الهبوط للهاتف

### المشكلة الحالية
صفحة الهبوط تستخدم responsive classes أساسية لكن بعض الأقسام تحتاج تحسينات مخصصة للموبايل من حيث المسافات وأحجام النصوص وتوزيع العناصر.

### التعديلات المطلوبة (بدون تغيير شكل الديسكتوب)

**1. HeroSection.tsx**
- تصغير النصوص على الموبايل وتقليل المسافات العلوية
- فيديوهات الـ Hero: تقليل عددها على الموبايل لـ 3 فيديوهات فقط (إخفاء الطرفين) لأنها صغيرة جداً
- تصغير أزرار CTA على الموبايل

**2. LandingNavbar.tsx**
- تحسين القائمة المنبثقة على الموبايل بمسافات أفضل

**3. StickyFeatureTabs.tsx**
- جعل أزرار التابات قابلة للسكرول أفقياً على الموبايل بدلاً من التفاف
- تحسين مسافات المحتوى والـ preview

**4. HowItWorks.tsx**
- تحويل الشبكة لـ 2 أعمدة على الموبايل بدلاً من عمود واحد (حالياً تأخذ العرض الكامل)
- تقليل حجم النصوص العملاقة

**5. PricingPreview.tsx**
- تحسين بطاقات الأسعار على الموبايل (تصغير padding وأحجام النصوص)
- سكرول أفقي اختياري للبطاقات

**6. FAQSection.tsx**
- تصغير حجم العنوان والنصوص على الموبايل

**7. CTASection.tsx**
- تقليل padding العلوي والسفلي على الموبايل

**8. LandingFooter.tsx**
- تحسين توزيع الأعمدة والمسافات

**9. CookieConsent (CSS)**
- جعل إشعار الكوكيز يأخذ عرض الشاشة على الموبايل مع هوامش جانبية

**10. ModelsMarquee.tsx**
- تصغير أحجام النصوص والمسافات على الموبايل

### الملفات المتأثرة
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/StickyFeatureTabs.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/PricingPreview.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/components/landing/ModelsMarquee.tsx`
- `src/index.css` (cookie consent mobile styles)

### ملاحظة
جميع التعديلات ستكون عبر Tailwind responsive classes (بدون `md:` prefix = موبايل، مع `md:` = ديسكتوب) مما يضمن عدم التأثير على تصميم الكمبيوتر.

