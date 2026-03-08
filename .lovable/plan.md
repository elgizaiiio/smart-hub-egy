

# تغييرات الألوان + إصلاح الفراغ الأبيض

## 1. زر Referrals في صفحة Settings → ذهبي
**ملف:** `src/pages/SettingsPage.tsx` — سطر 158
- تغيير `fancy-btn-green` → `fancy-btn-gold`

## 2. CSS: تغيير `fancy-btn-green` للذهبي أو إبقاؤه وإضافة gold فقط
**ملف:** `src/index.css` — سطور 438-446
- تغيير ألوان `fancy-btn-green` من الأخضر إلى الذهبي (`#FFD700` → `#FFA500`)
- أو استخدام `fancy-btn-gold` الموجود بالفعل (تم إضافته سابقاً)

## 3. إصلاح الفراغ الأبيض تحت مربع الإدخال في ChatPage
**ملف:** `src/pages/ChatPage.tsx` — سطر 291
- تغيير `pb-3 md:pb-5` إلى استخدام `safe-area-inset-bottom`:
```
style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)", backgroundColor: "#0A0A0A" }}
```

أو الأفضل: إضافة class في CSS واستخدام `bg-background` مع safe area padding على الـ container الرئيسي للـ chat page.

**ملف:** `src/pages/ChatPage.tsx` — الـ wrapper div الرئيسي
- التأكد أن الخلفية `bg-background` تغطي كامل المساحة بما فيها المنطقة السفلية

### الملفات المتأثرة
| ملف | التغيير |
|-----|---------|
| `src/pages/SettingsPage.tsx` | `fancy-btn-green` → `fancy-btn-gold` |
| `src/pages/ChatPage.tsx` | إضافة safe-area padding + خلفية للمنطقة السفلية |
| `src/index.css` | تحديث أو حذف `fancy-btn-green` إذا لم يُستخدم في مكان آخر |

