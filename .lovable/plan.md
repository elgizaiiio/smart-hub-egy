

# خطة التنفيذ

## 1. حذف زر الإحالة المكرر من ReferralsPage
في `ReferralsPage.tsx` سطر 172-175، يوجد زر "Request Withdrawal" باستخدام FancyButton. هذا هو الزر المكرر. سيتم حذفه (الإحالة موجودة بالفعل في SettingsPage).

## 2. إصلاح "Bad Gateway" في Preview
المشكلة: الـ Preview في CodeWorkspace يعرض iframe لـ Sprites sandbox. الـ Bad Gateway يحدث لأن الـ sandbox إما:
- لم يتم إنشاؤه بعد
- انتهت صلاحيته (Sprites sandboxes مؤقتة)

**الحل**: إضافة fallback UI أفضل عند فشل تحميل الـ iframe مع retry button، وإضافة `onError` handler للـ iframe.

## 3. تحسين سجل البناء (Build Log) ليشبه الصورة المرجعية
الصورة المرجعية تشبه واجهة Lovable: عناصر بأيقونات checkmark، عناوين واضحة، وأقسام قابلة للطي.

**التغييرات في `CodeWorkspace.tsx`**:
- استبدال سجل الـ `log` messages الحالي (نص بسيط مع spinner) بمكون `BuildTimeline`
- كل خطوة بناء تظهر كـ timeline item بأيقونة ✓ (مكتمل) أو spinner (جاري) أو ○ (انتظار)
- تجميع الخطوات: "AI Generation" → "Parsing Files" → "Creating Sandbox" → "Writing Files" → "Installing" → "Building"
- إضافة "Hide/Show details" toggle
- زر "Preview" أزرق بارز عند اكتمال البناء

## 4. تحسين AI Agent في صفحة البرمجة
- **Chat Mode لا يتفعل تلقائياً**: حالياً الوضع الافتراضي `plan` وهو صحيح. المشكلة أن بعد الـ approve يتحول لـ `build` ولا يرجع. سأضيف زر واضح للتبديل بين الأوضاع
- **تحسين الـ system prompt**: جعل الوكيل أكثر ذكاءً في التخطيط - يسأل أسئلة توضيحية قبل البناء
- **إضافة ذاكرة المحادثة**: حفظ سياق المشروع بين الرسائل باستخدام جدول `memories` الموجود

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `ReferralsPage.tsx` | حذف زر Withdrawal المكرر |
| `CodeWorkspace.tsx` | تحسين سجل البناء ليشبه timeline + تحسين AI agent + إصلاح preview fallback |

