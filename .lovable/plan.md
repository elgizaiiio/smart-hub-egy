

## إضافة إشعار الكوكيز

### ما سيتم بناؤه
إشعار كوكيز يظهر أسفل يسار الشاشة عند أول زيارة للموقع، بنفس التصميم المطلوب (من Uiverse.io). يختفي عند الضغط على Accept أو Decline ولا يظهر مرة أخرى.

### الملفات

**1. ملف جديد: `src/components/CookieConsent.tsx`**
- يستخدم `localStorage` لتتبع ما إذا تم القبول/الرفض
- يظهر بعد 1.5 ثانية من فتح الموقع بأنيميشن `framer-motion`
- يحتوي على أيقونة كوكيز SVG + عنوان + وصف + زرين (Accept / Decline)
- عند الضغط على أي زر يُحفظ الاختيار في `localStorage` ويختفي

**2. تعديل: `src/index.css`**
- إضافة CSS المطلوب في نهاية الملف مع تعديل بسيط:
  - `.cookie-card` بدلاً من `.card` (لتجنب التعارض)
  - إضافة `position: fixed; bottom: 20px; left: 20px; z-index: 9999;`

**3. تعديل: `src/App.tsx`**
- استيراد `CookieConsent` وإضافته داخل `BrowserRouter` بجانب `Toaster`

### التفاصيل التقنية
- CSS المرفق يُطبق كما هو مع تغيير `.card` إلى `.cookie-card` وإضافة `fixed positioning`
- `localStorage` key: `megsy_cookies_accepted`
- رابط "Learn more" يوجه إلى `/privacy`

