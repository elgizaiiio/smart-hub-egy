

## تحسين صفحة الملفات لتصميم عالمي واحترافي

### التغييرات على `src/pages/FilesPage.tsx`

**1. تحسين العنوان والوصف:**
- إضافة أيقونة `FileText` كبيرة متوهجة فوق العنوان مع تأثير gradient خفيف
- تكبير العنوان على الديسكتوب (`text-3xl md:text-4xl`) مع gradient text
- تحسين الوصف بحجم أكبر قليلاً وتباعد أفضل

**2. تحسين أزرار الاقتراحات:**
- تحويلها من أزرار نصية مسطحة إلى كروت صغيرة بأيقونات مميزة لكل اقتراح
- كل اقتراح يحصل على أيقونة مناسبة (FileText للتقارير، Presentation للعروض، FileSearch للتلخيص، ImageIcon للتحويل، Table للجداول، FilePlus للـ PDF)
- تصميم grid متجاوب: `grid-cols-2` على الموبايل و `sm:grid-cols-3` على الأكبر
- كل كارت يحتوي على أيقونة ملونة + النص بتنسيق أنيق مع hover effects
- إضافة `backdrop-blur` و `border` خفيف مع `hover:shadow-md` و `hover:border-primary/30`

**3. إبقاء جميع الاقتراحات الستة كما هي:**
- Write a professional report
- Create a presentation
- Summarize this document
- Convert image to PDF
- Create a spreadsheet
- Generate a PDF

**4. تحسين التجاوب:**
- Grid يتكيف من عمودين على الموبايل إلى 3 أعمدة على الشاشات الأكبر
- تباعد مناسب `gap-3` بين الكروت
- `max-w-xl` للحاوية لضمان عدم تمددها على الشاشات الكبيرة

### النتيجة
صفحة ملفات بتصميم عالمي مشابه لأفضل تطبيقات AI، مع كل الاقتراحات الستة معروضة بشكل كروت أنيقة بأيقونات ملونة وتأثيرات hover احترافية.

