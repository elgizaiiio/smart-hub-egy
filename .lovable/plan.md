

# نظام API الشامل لـ Megsy

## ملخص
إنشاء 3 صفحات جديدة + ملف بيانات مركزي + تحديث الصفحة الحالية والراوتر. الصور والفيديوهات المرفوعة تُستخدم كـ showcase في Landing Page. الدومين: megsyai.com. لا ذكر لأي مصدر خارجي.

## الملفات الجديدة

### 1. `src/lib/apiModelsData.ts` — بيانات كل النماذج مركزياً
- يستورد النماذج من `ModelSelector.tsx` ويضيف وصف + فئة + تكلفة API لكل نموذج
- الفئات: Chat (5 نماذج), Image Generation (19), Image Tools (18), Video Generation (11), Video I2V (7), Avatar (4), Services (Search, Code Exec)
- كل نموذج: `{ id, name, description, credits, category, icon }`

### 2. `src/pages/ApiLandingPage.tsx` — صفحة هبوط عامة `/api`
- Hero كبير مع عنوان "Megsy API" + وصف + CTA buttons (Docs, Dashboard)
- معرض الصور والفيديوهات المرفوعة (تُنسخ لـ public/) كـ showcase لقدرات المنصة
- أقسام: Chat AI, Image Generation, Video Generation, Code Sandbox, Web Search
- قسم تسعير مبسط (Pay-as-you-go credits)
- إحصائيات: 50+ Models, 6 Categories, <2s Response Time
- صفحة عامة (بدون ProtectedRoute)

### 3. `src/pages/ApiDocsPage.tsx` — صفحة التوثيق `/api/docs`
- Base URL: `https://api.megsyai.com/v1/`
- Authentication section: Bearer token مع API key
- Endpoints مع أكواد بـ 4 لغات (cURL, Python, JavaScript, Node.js):
  - `POST /v1/chat/completions`
  - `POST /v1/images/generate`
  - `POST /v1/videos/generate`
  - `POST /v1/search`
  - `POST /v1/code/execute`
- Response formats, error codes, rate limits
- Copy button لكل code block
- Navigation جانبي

### 4. `src/pages/ApiModelsPage.tsx` — كتالوج النماذج `/api/models`
- بطاقات لكل نموذج مع: اسم، وصف، تكلفة credits، أيقونة Lucide
- فلتر بحث + تبويبات الفئات
- جدول مقارنة بسيط

## الملفات المعدلة

### `src/App.tsx`
- إضافة 3 routes عامة: `/api`, `/api/docs`, `/api/models`
- imports للصفحات الجديدة

### `src/pages/ApisPage.tsx`
- تبسيط Landing → إضافة روابط مباشرة لـ `/api/docs` و `/api/models`
- إبقاء API Keys management

## الملفات المنسوخة (public/)
- نسخ الصور الـ 4 والفيديوهات الـ 6 إلى `public/api-showcase/` لاستخدامها في Landing Page

## ملاحظات تقنية
- لا ذكر لـ fal, OpenRouter, أو أي مصدر خارجي — كل شيء باسم "Megsy"
- الأيقونات من lucide-react حسب نوع النموذج (MessageSquare, Image, Video, Wand2, etc.)
- التصميم يتبع الثيمات الحالية (dark/ocean/sunset/light)

