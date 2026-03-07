

## شرح Sprites.dev

**Sprites** هي خدمة من Fly.io توفر بيئات Linux معزولة (sandboxes) لتشغيل أي كود بشكل آمن. كل Sprite هو "كمبيوتر صغير" مستمر يحتفظ بالملفات والحالة بين التشغيلات.

### المميزات الرئيسية:
- **بيئة Linux كاملة** مع عزل على مستوى العتاد (Firecracker VMs)
- **تخزين مستمر** - الملفات تبقى حتى بعد إيقاف الـ Sprite
- **Checkpoints** - حفظ واستعادة حالة البيئة
- **رابط HTTP عام** لكل Sprite (يستمع على المنفذ 8080)
- **REST API بسيط** - إنشاء، تنفيذ أوامر، كتابة ملفات، حذف
- **$30 رصيد تجريبي مجاني**

### API الرئيسي:
```text
POST   /v1/sprites              → إنشاء sprite
POST   /v1/sprites/{name}/exec  → تنفيذ أمر
PUT    /v1/sprites/{name}/files → كتابة ملفات
DELETE /v1/sprites/{name}       → حذف sprite
```

كل sprite يحصل على رابط: `https://{sprite-name}.sprites.dev/`

---

## المفتاح المطلوب منك

مفتاح واحد فقط: **SPRITES_TOKEN**

للحصول عليه:
1. اذهب إلى [sprites.dev](https://sprites.dev/)
2. سجل دخول عبر Fly.io
3. أنشئ Token جديد من صفحة التوكنات (كما في الصورة التي أرسلتها)
4. انسخ الـ Token (يظهر مرة واحدة فقط)

---

## خطة الدمج - استبدال Fly Machines بـ Sprites

حالياً مشروعك يستخدم `code-sandbox` edge function التي تتصل بـ Fly Machines API مباشرة. سنستبدلها بـ Sprites API الأبسط والأقوى.

### التغييرات المطلوبة:

**1. إضافة Secret جديد**
- إضافة `SPRITES_TOKEN` كـ Supabase secret

**2. إنشاء Edge Function جديدة `sprites-sandbox/index.ts`**
- تستبدل `code-sandbox` بالكامل
- تدعم: `create` (إنشاء sprite)، `exec` (تنفيذ أوامر)، `write-file` (كتابة ملفات)، `destroy` (حذف)، `status` (حالة)
- كل الطلبات تمر عبر `https://api.sprites.dev/v1/` مع `Authorization: Bearer SPRITES_TOKEN`
- الـ preview URL يكون `https://{sprite-name}.sprites.dev/`

**3. تحديث `CodeWorkspace.tsx`**
- تغيير `callSandbox` لاستخدام الـ edge function الجديدة
- تبسيط منطق الإنشاء (Sprites أبسط من Fly Machines)
- تحديث الـ preview URL ليستخدم رابط Sprite
- إزالة منطق Simulation Mode (Sprites أكثر استقراراً)

### الفوائد:
- API أبسط بكثير من Fly Machines
- بيئة مستمرة (لا تحتاج إعادة إنشاء)
- Checkpoints للحفظ والاستعادة
- رابط عام تلقائي لكل sandbox
- $30 مجاناً للبداية

