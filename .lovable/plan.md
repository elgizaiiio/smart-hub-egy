

# Fix: OAuth consent screen skips login for authenticated users

## المشكلة
صفحة `/oauth/authorize` بتتحقق من الجلسة صح، لكن لو المستخدم مش مسجل وبيروح `/auth?redirect=...`، صفحة AuthPage بتتجاهل الـ `redirect` parameter وبتوديه `/chat` بدل ما ترجعه لصفحة الموافقة.

## التعديلات

### 1. `src/pages/AuthPage.tsx`
- قراءة `redirect` query param من الـ URL
- بعد تسجيل الدخول الناجح (في كل الحالات: password login, 2FA verify, create account, Google OAuth)، لو فيه `redirect` param → `window.location.href = redirect` بدل `navigate("/chat")`
- للـ Google OAuth: تمرير الـ redirect URL في `redirectTo` option

### 2. `src/pages/OAuthAuthorizePage.tsx`
- الكود الحالي شغال صح بالفعل — لو فيه session بيعرض صفحة الموافقة مباشرة بدون تسجيل دخول
- مفيش تعديلات مطلوبة هنا

## ملخص
تعديل ملف واحد فقط (`AuthPage.tsx`) — إضافة دعم `redirect` query param عشان يرجع المستخدم لصفحة OAuth بعد التسجيل.

