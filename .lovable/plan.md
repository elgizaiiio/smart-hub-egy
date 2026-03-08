

# خطة: تحويل صفحة البرمجة لبناء مشاريع Full-Stack + نشر على Vercel

## الوضع الحالي
- الوكيل يولد مشاريع React+Vite بسيطة فقط (frontend)
- يستخدم Sprites.dev كـ sandbox للمعاينة
- لا يوجد دعم لـ Vercel أو أي منصة نشر

## التغييرات المطلوبة

### 1. تحسين AI Agent لبناء Full-Stack
**الملف**: `src/pages/CodeWorkspace.tsx`

- تحديث الـ system prompt ليطلب من الوكيل بناء مشاريع Next.js كاملة (Next.js هو الأفضل لـ Vercel)
- تغيير الـ template من Vite إلى Next.js (مع API routes, pages, database)
- تحسين الـ build prompt ليشمل:
  - Database schema (Supabase أو SQLite)
  - API routes (`/api/*`)
  - Frontend pages مع SSR
  - Authentication إذا مطلوب
  - Styling (Tailwind CSS)

### 2. إضافة Edge Function للنشر على Vercel
**ملف جديد**: `supabase/functions/vercel-deploy/index.ts`

- يستخدم [Vercel API](https://vercel.com/docs/rest-api) لإنشاء deployment
- يرفع الملفات عبر `/v13/deployments` endpoint
- يرجع رابط النشر المباشر (`.vercel.app`)

**يحتاج secret جديد**: `VERCEL_TOKEN` - المستخدم يحصل عليه من https://vercel.com/account/tokens

### 3. إضافة زر "Deploy to Vercel" في الواجهة
**الملف**: `src/pages/CodeWorkspace.tsx`

- إضافة زر في قائمة Plus menu بجانب GitHub
- عند الضغط: يرفع كل الملفات ويعرض رابط النشر في المحادثة
- أيقونة Vercel (مثلث) أو أيقونة Globe

### 4. تحديث Template المشروع
**الملف**: `src/pages/CodeWorkspace.tsx`

- استبدال `VITE_TEMPLATE` بـ `NEXTJS_TEMPLATE` يشمل:
  - `package.json` مع next, react, tailwindcss
  - `next.config.js`
  - `app/layout.tsx`, `app/page.tsx`
  - `app/api/` للـ API routes
  - `tailwind.config.ts`

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/CodeWorkspace.tsx` | تحديث template + prompts + زر Deploy |
| `supabase/functions/vercel-deploy/index.ts` | **جديد** - Edge function للنشر |
| `supabase/config.toml` | إضافة function جديدة |

## المتطلبات
- **VERCEL_TOKEN**: يجب إضافته كـ secret في Supabase. المستخدم يحصل عليه من إعدادات حسابه على Vercel

