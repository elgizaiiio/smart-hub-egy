

# خطة التنفيذ

## 1. صفحة الفواتير (BillingPage)
- حذف "Powered by" (سطر 58) وإبقاء "Megsy" فقط
- حذف "Free" من badge الخطة أو إخفاؤه

## 2. أزرار صفحة الإعدادات بألوان مميزة (FancyButton)
- جعل زر **Theme** بتنسيق fancy بلون مختلف (مثلاً أزرق/بنفسجي)
- جعل زر **Connect** بتنسيق fancy بلون مختلف (مثلاً أخضر)
- زر **Referrals** يبقى كما هو (fancy بلونه الحالي)
- تطبيق ذلك بإضافة CSS classes مختلفة لكل fancy-btn (مثل `--hue` variable)

## 3. صفحة الملفات - زر + وعرض التكاملات
- عرض أول 2 تكاملات فقط مع زر "Show more" يوجه لصفحة Integrations
- استبدال emoji icons (`📁📝📧💻`) بأيقونات SVG حقيقية (نفس الموجودة في IntegrationsPage)

## 4. صفحة Integrations - إصلاح الأيقونات
- أيقونات SVG موجودة بالفعل وتبدو صحيحة (Slack, Gmail, Drive, etc.)
- سأراجع وأصلح أي أيقونات خاطئة (خاصة Outlook, Google Calendar, Teams)

## 5. أيقونة Megsy في الشات بلا خلفية
- في `ModelSelector.tsx` (سطر 106-111): إزالة خلفية div المربع وجعل الحرف M يظهر بدون حاويه

## 6. أيقونة DeepSeek - إصلاح
- الأيقونة الحالية: دائرة زرقاء مع عدسة بحث (غير صحيحة)
- استبدالها بشعار DeepSeek الحقيقي (حوت/دولفين أزرق)

## 7. أيقونة Grok - إصلاح  
- الأيقونة الحالية: مربع أسود مكتوب عليه "xAI" (غير دقيقة)
- استبدالها بشعار Grok الحقيقي (رمز ✗ المميز لـ xAI)

## 8. التأكد من عمل التكاملات بشكل حقيقي
- مراجعة أن Composio edge function تتعامل مع كل الإجراءات بشكل صحيح
- التأكد من أن التكاملات في صفحة الملفات تربط فعلاً بصفحة Integrations (هذا موجود بالفعل)

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `BillingPage.tsx` | حذف "Powered by" و "Free" |
| `SettingsPage.tsx` | جعل Theme و Connect أزرار fancy بألوان مختلفة |
| `FilesPage.tsx` | Show more + أيقونات SVG حقيقية |
| `ModelSelector.tsx` | إصلاح أيقونات Megsy, DeepSeek, Grok |
| `index.css` | إضافة CSS variants للألوان المختلفة لـ fancy-btn |

