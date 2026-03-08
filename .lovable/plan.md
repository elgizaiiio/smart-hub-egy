

# خطة الحماية النهائية -- إصلاح آخر 3 مشاكل أمنية

## الحالة الحالية
الفحص الأمني يُظهر **3 مشاكل متبقية**:

1. **خطأ حرج**: سياسة UPDATE على `profiles` لا تزال تسمح نظريا بتعديل `credits` و `plan` (الـ trigger يمنعها فعليا لكن السياسة نفسها مفتوحة)
2. **تحذير**: سياسات `USING(true)` على جداول service_role (مقصودة)
3. **تحذير**: Leaked Password Protection معطلة (إجراء يدوي)

## خطة الإصلاح

### Migration:
تشديد سياسة UPDATE على profiles لتقييدها بالأعمدة الآمنة فقط عبر trigger إضافي يُلزم بعدم تغيير أي عمود غير `display_name`, `avatar_url`, `two_factor_enabled`:

```sql
-- Replace the UPDATE policy with one that uses a check function
CREATE FUNCTION check_profile_update_safe(...)
-- Only allows display_name, avatar_url, two_factor_enabled changes
```

### Dismiss التحذيرات المقصودة:
- `SUPA_rls_policy_always_true` -- مطبقة على `service_role` فقط
- `PRIVILEGE_ESCALATION` -- بعد التشديد

### إجراء يدوي:
- تفعيل **Leaked Password Protection** من Supabase Dashboard

### النتيجة المتوقعة:
0 أخطاء، 0 تحذيرات (عدا Leaked Password -- يدوي)

