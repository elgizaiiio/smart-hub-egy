

# خطة: نظام البرمجة الحقيقي + الكريدت + التكاملات

## ملخص المشروع
تحويل صفحة البرمجة من شات بسيط إلى نظام بناء حقيقي باستخدام Fly.io Machines، مع نظام كريدت شامل وتكامل GitHub و Supabase حقيقي.

---

## 1. نظام الكريدت الشامل

**الوضع الحالي:** عمود `credits` موجود في جدول `profiles` لكن لا يتم خصم منه فعليا.

**التغييرات:**
- إنشاء edge function `deduct-credits` تقبل `user_id` و `amount` و `action_type`
- إنشاء جدول `credit_transactions` لتتبع كل عملية خصم (نوع العملية، المبلغ، التاريخ)
- تعديل `generate-image/index.ts` لخصم الكريدت قبل التوليد حسب النموذج
- تعديل `generate-video/index.ts` لخصم الكريدت قبل التوليد حسب النموذج  
- تعديل صفحات الصور والفيديو لإرسال `user_id` والتحقق من الرصيد قبل الإرسال
- الشات مجاني (لا خصم)
- الكود يخصم كريدت عند البناء (build mode)

**تسعير مقترح:**
- صور: حسب النموذج (1-5 كريدت كما هو معرف في ModelSelector)
- فيديو: حسب النموذج (محدد في ModelSelector)
- كود/بناء: 5 كريدت لكل عملية build

---

## 2. نظام البرمجة الحقيقي (Fly.io Machines)

**المكونات:**

### Edge Function: `code-sandbox`
- `action: "create"` - إنشاء Fly Machine جديدة بـ Node.js + Vite template
- `action: "write-file"` - كتابة ملف في الـ machine
- `action: "read-file"` - قراءة ملف
- `action: "exec"` - تنفيذ أمر (npm install, npm run dev)
- `action: "destroy"` - إيقاف وحذف الـ machine
- تحتاج secret: `FLY_API_TOKEN`

### تدفق العمل:
1. المستخدم يكتب وصف المشروع → AI يخطط (plan mode - مجاني)
2. المستخدم يوافق → يتم خصم كريدت
3. إنشاء Fly Machine → AI يولد الكود ملف بملف
4. كل ملف يُكتب فعليا في الـ machine عبر الـ edge function
5. تشغيل `npm install && npm run dev` 
6. عرض البريفيو في تاب Preview عبر iframe يشير لعنوان الـ machine

### شجرة الملفات الخفية:
- State داخلي في `CodeWorkspace` يتتبع قائمة الملفات (`files: Map<string, string>`)
- لا يظهر للمستخدم أي واجهة لشجرة الملفات
- AI يرى الملفات ويعدلها، المستخدم يرى فقط سجل الأعمال في الشات

### تعديل `CodeWorkspace.tsx`:
- إضافة state للـ sandbox (machine ID, preview URL, files map)
- في build mode: إرسال prompts خاصة لـ AI تطلب منه إنتاج JSON لكل ملف
- تحليل رد AI واستخراج الملفات وكتابتها في الـ machine
- عرض "Writing src/App.tsx..." و "Installing dependencies..." في الشات
- تاب Preview يعرض iframe بعنوان الـ machine

---

## 3. تكامل GitHub الحقيقي

**عند الضغط على زر GitHub في القائمة:**
1. التحقق من اتصال GitHub عبر Composio
2. إذا غير متصل → توجيه لـ `/settings/integrations`
3. إذا متصل → إنشاء ريبو جديد باسم المشروع
4. رفع كل الملفات من شجرة الملفات الخفية إلى الريبو
5. عرض رابط الريبو في الشات

**يستخدم Composio actions:**
- `GITHUB_CREATE_REPO` (يحتاج إضافته للأدوات)
- `GITHUB_CREATE_FILE` أو GitHub API مباشرة عبر Composio

---

## 4. تكامل Supabase الحقيقي

**عند الضغط على زر Supabase:**
1. التحقق من اتصال Supabase عبر Composio
2. إذا غير متصل → توجيه لـ `/settings/integrations`
3. إذا متصل → إضافة Supabase client إلى المشروع المبني
4. AI يمكنه إنشاء جداول وكتابة كود يتعامل مع Supabase

---

## 5. جدول المشاريع

- إنشاء جدول `projects` في Supabase (إذا غير موجود):
  - `id`, `user_id`, `name`, `fly_machine_id`, `fly_app_name`, `preview_url`, `status`, `files_snapshot` (JSONB), `created_at`, `updated_at`
- كل مشروع يُحفظ تلقائيا مع snapshot للملفات
- يظهر في القائمة الجانبية تحت المشاريع

---

## الترتيب التنفيذي

1. إنشاء جدول `credit_transactions` + function `deduct_credits`
2. تعديل `generate-image` و `generate-video` لخصم الكريدت
3. تعديل صفحات الصور والفيديو للتحقق من الرصيد
4. طلب `FLY_API_TOKEN` secret من المستخدم
5. إنشاء edge function `code-sandbox`
6. إعادة بناء `CodeWorkspace.tsx` بالكامل مع شجرة الملفات الخفية والـ sandbox
7. تكامل GitHub عبر Composio
8. تكامل Supabase

---

## ملاحظات تقنية

- **Fly.io API**: يحتاج `FLY_API_TOKEN` كـ Supabase secret
- **Docker Image**: سنستخدم image جاهزة مثل `node:20-slim` مع Vite مثبت مسبقا
- **الأمان**: كل عملية خصم كريدت تمر عبر edge function (server-side) لمنع التلاعب
- **حفظ المشاريع**: الملفات تُحفظ كـ JSONB في Supabase لاسترجاعها لاحقا

