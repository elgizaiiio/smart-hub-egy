

## خطة التحسينات الثلاثة

### 1. إصلاح اختفاء صورة الملف الشخصي

**المشكلة**: صفحة `ProfileSettingsPage.tsx` لا تضيف cache-busting parameter (`?t=timestamp`) عند رفع الصورة، بينما `ProfilePage.tsx` تفعل ذلك. هذا يجعل المتصفح يعرض نسخة مخزنة مؤقتاً (cached) قديمة أو فارغة.

**الحل**:
- في `ProfileSettingsPage.tsx` سطر 63: إضافة `?t=Date.now()` بعد `publicUrl`
- في `ProfileSettingsPage.tsx` سطر 43: عند تحميل الأفاتار من قاعدة البيانات، إضافة cache-busting إذا لم يكن موجوداً
- توحيد المسار: استخدام `avatar.${ext}` بدلاً من `${Date.now()}.${ext}` لتجنب تراكم ملفات قديمة في Storage

### 2. تحسين زر التبديل Monthly/Yearly في صفحة الأسعار

**الحالي**: زر بسيط بـ `bg-secondary` و `bg-primary` بدون أي أنيميشن.

**التحسين**: تحويله إلى toggle احترافي مع:
- خلفية `bg-white/5 backdrop-blur` مع border دقيق
- مؤشر منزلق متحرك (`motion.div layoutId`) ينتقل بسلاسة بين Monthly و Yearly
- تأثير glow خفيف على الخيار النشط
- شارة "Save" متحركة تظهر بـ pulse عند Yearly

### 3. استبدال LinkedIn بـ YouTube في صفحة الصور

**التغيير**: في `ImagesPage.tsx`:
- استبدال `LinkedInIcon` بـ `YouTubeIcon` مع SVG صحيح
- تغيير `platform: "linkedin"` إلى `platform: "youtube"` 
- تحديث رابط المشاركة من LinkedIn sharing URL إلى YouTube (أو رابط upload)

