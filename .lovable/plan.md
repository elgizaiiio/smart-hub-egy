

# إضافة فراغ واضح تحت مربع الإدخال في كل الصفحات

## المشكلة
مربع الإدخال لاصق بالحافة السفلية للشاشة. المستخدم يريد فراغ ظاهر تحته.

## الحل
تغيير `paddingBottom` من `env(safe-area-inset-bottom, 12px)` إلى `pb-4` (16px) كحد أدنى + safe-area إضافي، وإضافة `viewport-fit=cover` في `index.html`.

## التغييرات

| الملف | التغيير |
|-------|---------|
| `index.html` | إضافة `viewport-fit=cover` في viewport meta |
| `src/pages/ChatPage.tsx` (سطر 291) | `pb-4` + `style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}` |
| `src/pages/ImagesPage.tsx` (سطر 546) | نفس التغيير |
| `src/pages/VideosPage.tsx` (سطر 524) | نفس التغيير |
| `src/pages/FilesPage.tsx` (سطر 343) | نفس التغيير |

هذا سيعطي فراغ 16px على الأقل تحت مربع الإدخال، ويزيد أكثر على أجهزة بـ home indicator.

