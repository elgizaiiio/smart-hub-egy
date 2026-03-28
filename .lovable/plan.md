

# خطة إصلاح صفحة البرمجة: بريفيو داخلي + توليد مباشر

---

## المشكلة الحالية (الصورة)
خطأ JSON parsing: `Expected ',' or '}' after property value in JSON at position 5774`. السبب: Claude يولد JSON كبير جدا مع نصوص عربية وأحيانا يقطع الـ stream قبل الانتهاء، أو يضيف أحرف غير صالحة داخل الـ JSON.

---

## التغييرات

### 1. إصلاح JSON Parsing (Edge Function)
**ملف:** `supabase/functions/code-generate/index.ts`

- تغيير prompt البناء ليولد الملفات واحد تلو الآخر بدل JSON واحد ضخم
- استخدام format أبسط: كل ملف يبدأ بـ `===FILE: path===` وينتهي بـ `===END===`
- هذا يمنع أخطاء JSON تماما لأننا لا نعتمد على JSON بعد الآن

### 2. حذف Sprites/E2B Sandbox بالكامل + بريفيو داخلي
**ملف:** `src/pages/CodeWorkspace.tsx`

- حذف كل كود `callSandbox`, `provisionSandbox`, `writeFilesToSandbox`, `waitForPreviewReady`
- حذف كود retry sandbox
- **بناء نظام بريفيو داخلي** يعمل بـ iframe + blob URL:
  - تجميع كل ملفات React/JSX في HTML واحد
  - تحميل React + ReactDOM + Babel standalone من CDN
  - تحويل JSX إلى JS في المتصفح عبر Babel
  - تحميل Tailwind CSS من CDN
  - عرض في iframe بـ `sandbox="allow-scripts"`
- هذا يعني: **لا حاجة لسيرفر خارجي** - كل شيء يعمل محليا في المتصفح

### 3. حذف نظام الخطة - توليد مباشر
**ملف:** `src/pages/CodeWorkspace.tsx`

- حذف `mode` state و "Approve Plan" button
- عند إرسال المستخدم prompt → يبدأ التوليد مباشرة (action: "build")
- حذف `handleApprove` كوظيفة منفصلة - دمجها مع `handleSend`
- تبسيط الـ flow: **prompt → AI generates → parse → preview**

### 4. تبسيط Build Steps
```text
AI Generation → Parsing files → Rendering preview
```
(3 خطوات فقط بدل 6)

### 5. ميزات داخلية (لا تظهر للمستخدم)
- **Auto-retry**: إذا فشل الـ parsing، يعيد الطلب تلقائيا مرة واحدة
- **Streaming file parser**: يبدأ عرض الملفات أثناء التوليد بدل الانتظار حتى النهاية
- **Error recovery**: إذا فشل ملف واحد، يتخطاه ويكمل الباقي
- **Console capture**: يلتقط أخطاء الـ iframe console ويعرضها للمستخدم كرسالة
- **Cache templates**: يحفظ VITE_TEMPLATE محليا بدل إعادة بنائه كل مرة

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `supabase/functions/code-generate/index.ts` | تغيير format الخرج من JSON إلى file markers |
| `src/pages/CodeWorkspace.tsx` | إعادة كتابة شاملة: حذف sandbox، بريفيو داخلي، توليد مباشر |

