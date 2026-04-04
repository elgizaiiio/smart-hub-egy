

# خطة شاملة: إصلاح البحث + تحسين الشات + تحديث Studio + إصلاح الأدوات

---

## 1. إصلاح البحث في الشات (صور + نتائج)

**المشكلة**: البحث يتوقف ولا يعيد صور.

**السبب المحتمل**: في `streamChat.ts`، عند حدوث خطأ في parsing JSON (سطر 86-88)، يعيد النص للـ buffer مما يسبب loop لا نهائي. أيضاً في `chat/index.ts` الصور ترسل كـ event خاص لكن قد لا يتم قراءته بشكل صحيح.

**الحل**:
- إصلاح error handling في `streamChat.ts` لتجنب إعادة النص للـ buffer بشكل متكرر
- التأكد من أن `onImages` يُستدعى بشكل صحيح
- إضافة timeout للـ search calls في `chat/index.ts` (10 ثوانٍ)

---

## 2. تحسين ردود AI (عدم تكرار "أنا ميغسي")

**المشكلة**: النموذج يكرر أنه Megsy في كل رسالة.

**الحل**: تعديل system prompt في `chat/index.ts`:
- نقل تعريف الهوية لجملة واحدة فقط: "Your name is Megsy. Only mention this if directly asked."
- إزالة التكرار في القواعد
- إضافة قاعدة: "Never introduce yourself unless the user asks who you are"

---

## 3. نظام الذاكرة المحسّن

**الحل**: تعديل `chat/index.ts` لإضافة سياق المستخدم:
- قبل إرسال الرسائل للـ AI، جلب بيانات المستخدم من `profiles` و `ai_personalization`
- جلب آخر 3 محادثات (عناوين فقط) من `conversations`
- إضافة هذه المعلومات في system prompt كـ "User Context"
- جلب `memories` المخزنة سابقاً

---

## 4. Inpaint - مربع الإدخال دائم

**المشكلة**: مربع الإدخال يختفي في بعض المراحل.

**الحل**: في `InpaintPage.tsx`، جعل الـ bottom input bar يظهر في كل المراحل (edit + result) وليس فقط في edit.

---

## 5. Studio - إزالة حفظ المحادثات + تحسين UX

**التغييرات في `ImageStudioPage.tsx` و `VideoStudioPage.tsx`**:
- إزالة `loadExistingConversation` - كل زيارة تبدأ من جديد
- إزالة الخلفية الخضراء من رسائل المستخدم (تغيير `bg-primary/15` إلى `bg-accent/30`)
- عند الضغط على صورة: بدلاً من فتح modal، عرض الصورة كبيرة مع input bar ثابت بالأسفل للتعديل
- إصلاح Regenerate: تخزين آخر prompt واستخدامه عند الضغط على إعادة التوليد

---

## 6. نظام ذاكرة للصور والفيديوهات

**الحل**: إضافة في `ImageStudioPage.tsx` و `VideoStudioPage.tsx`:
- حفظ آخر prompt ناجح + النموذج المستخدم في `localStorage`
- عرض "آخر إبداعاتك" كـ suggestions عند فتح الصفحة فارغة

---

## 7. إصلاح مشكلة الرفع المزدوج في الأدوات

**المشكلة**: في Clothes Changer, Headshot, Face Swap, Cartoon, Character Swap, Hair Changer, Colorizer, BG Remover - عند الضغط على رفع صورة في Landing، ينتقل لصفحة أخرى ليرفع مرة ثانية.

**الحل**: تعديل كل أداة بحيث:
- Landing page button يفتح file picker مباشرة
- عند اختيار الملف، يتم تخطي أي مرحلة upload إضافية وينتقل مباشرة للخطوة التالية (templates/styles/processing)
- الأدوات التي تستخدم `ToolPageLayout` مع `onFileSelected` تعمل بالفعل بشكل صحيح (مثل BG Remover)
- الأدوات ذات الـ custom flow (FaceSwap, ClothesChanger, etc.) تحتاج تعديل:
  - `FaceSwapPage`: Landing → click → file picker → مباشرة لـ templates (بدون upload step)
  - `ClothesChangerPage`: نفس الشيء → مباشرة لـ styles
  - `HeadshotPage`, `CartoonPage`, `HairChangerPage`, `ColorizerPage`, `CharacterSwapPage`: نفس المنطق

---

## 8. صفحة Preview بعد التوليد في كل الأدوات

**الحل**: تعديل `ResultView` في `ToolPageLayout.tsx`:
- إضافة مربع إدخال (input bar) أسفل النتيجة للتعديل
- 3 أزرار: إعادة الإنشاء، تنزيل، إنشاء صورة جديدة
- Input bar يسمح بكتابة تعديلات وإرسالها

**التصميم**:
```text
┌─────────────────────┐
│     Generated       │
│      Image          │
│                     │
├─────────────────────┤
│ [Regenerate] [Download] [New] │
├─────────────────────┤
│ [Input bar for edits...]      │
└─────────────────────┘
```

---

## 9. تسريع تحميل Studio

**الحل**: بما أننا نزيل حفظ المحادثات، لن يكون هناك تحميل بيانات عند الدخول. الصفحة ستبدأ فارغة فوراً.

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/lib/streamChat.ts` | إصلاح parsing loop |
| `supabase/functions/chat/index.ts` | إصلاح بحث + تحسين system prompt + ذاكرة المستخدم |
| `src/pages/ImageStudioPage.tsx` | إزالة persistence، إصلاح UX، regenerate |
| `src/pages/VideoStudioPage.tsx` | نفس التغييرات |
| `src/pages/tools/InpaintPage.tsx` | input bar دائم |
| `src/components/ToolPageLayout.tsx` | ResultView + input bar |
| `src/pages/tools/FaceSwapPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/ClothesChangerPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/HeadshotPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/CartoonPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/HairChangerPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/ColorizerPage.tsx` | إصلاح رفع مزدوج |
| `src/pages/tools/CharacterSwapPage.tsx` | إصلاح رفع مزدوج |

---

## ترتيب التنفيذ

1. إصلاح `streamChat.ts` + search في `chat/index.ts`
2. تحسين system prompt + ذاكرة المستخدم
3. تعديل Studio pages (إزالة persistence + UX)
4. إصلاح Inpaint input bar
5. إصلاح الرفع المزدوج في 7 أدوات
6. تحديث ResultView مع input bar

