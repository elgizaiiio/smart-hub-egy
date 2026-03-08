

## إنشاء صفحة Contact

### الملفات المطلوبة

**1. إنشاء `src/pages/ContactPage.tsx`**
- صفحة مستقلة بتصميم dark احترافي متوافق مع Landing Page
- تحتوي على:
  - Navbar (LandingNavbar) + Footer (LandingFooter)
  - عنوان كبير "Get in Touch" مع gradient text
  - وصف قصير
  - فورم اتصال يتضمن: Name, Email, Subject (select), Message
  - معلومات اتصال جانبية: Email (support@megsyai.com), Social links
  - تصميم grid: الفورم على اليسار والمعلومات على اليمين (يتحول لعمود واحد على الموبايل)
  - أزرار إرسال بـ FancyButton
  - Framer Motion animations للدخول
  - Validation باستخدام zod + react-hook-form
  - عند الإرسال: toast نجاح (بدون backend فعلي حالياً)

**2. تعديل `src/App.tsx`**
- إضافة route جديد: `/contact` → `<ContactPage />`
- Route عام (بدون ProtectedRoute)

**3. تعديل `src/components/landing/LandingFooter.tsx`**
- تحديث رابط Contact من `mailto:` إلى `/contact`

**4. تعديل `src/components/landing/LandingNavbar.tsx`**
- إضافة رابط "Contact" في النافبار

### التصميم
- خلفية سوداء مع كروت بـ `bg-white/5 backdrop-blur border-white/10`
- حقول إدخال شفافة بستايل Claude-style
- Subject dropdown بخيارات: General, Support, Partnership, Enterprise, Bug Report
- تجاوب كامل مع الموبايل

