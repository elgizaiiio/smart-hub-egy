

# خطة: تحديث اسم المشروع من "egy" إلى "Megsy"

## المشكلة
اسم المشروع القديم "egy" لا يزال موجود في عدة أماكن (index.html، edge functions). المطلوب تغييره إلى "Megsy" في كل مكان.

## التغييرات المطلوبة

### 1. تحديث `index.html`
- تغيير العنوان من `egy - AI Platform` إلى `Megsy - AI Platform`
- تحديث جميع الـ meta tags (description, og:title, twitter:title, author)

### 2. تحديث `supabase/functions/chat/index.ts`
- تغيير `HTTP-Referer` من `https://egy.app` إلى `https://megsyai.com`
- تغيير `X-Title` من `egy` إلى `Megsy`
- (موجود في مكانين: السطر 192 والسطر 306)

### 3. تحديث `supabase/functions/composio/index.ts`
- تغيير الـ redirect URI من `smart-hub-egy.lovable.app` إلى الدومين الصحيح

هذه التغييرات بسيطة ومباشرة -- مجرد استبدال نصوص.

