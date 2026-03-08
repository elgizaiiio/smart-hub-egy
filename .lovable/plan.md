

# إصلاح آخر الثغرات الأمنية

## المشاكل المتبقية (من الفحص)

1. **خطأ حرج**: سياسة UPDATE على profiles لا تزال مفتوحة -- الـ scanner لا يعترف بالـ trigger كحماية كافية
2. **تحذير**: `USING(true)` على جداول service_role (مقصودة)
3. **تحذير**: Leaked Password Protection معطلة (يدوي)

## الحل النهائي

### 1. إزالة سياسة UPDATE من profiles نهائيا
بدل محاولة تقييدها، نحذفها تماما. كل التعديلات تمر عبر `update_profile_safe` RPC فقط (SECURITY DEFINER). هذا يغلق الثغرة بشكل قاطع.

```sql
DROP POLICY "Users can update own safe fields" ON profiles;
-- No UPDATE policy = no direct UPDATE possible
```

### 2. إصلاح ProfilePage.tsx
السطر 100 لا يزال يستخدم `.from("profiles").update()` مباشرة بدل الـ RPC. نغيره لاستخدام `update_profile_safe`.

### 3. Dismiss تحذيرات service_role
السياسات على `service_incidents`, `service_status`, `memories` تستخدم `USING(true)` لكنها مقيدة بـ `TO service_role` -- مقصودة وآمنة.

### 4. إجراء يدوي
تفعيل Leaked Password Protection من Supabase Dashboard.

## النتيجة المتوقعة
0 أخطاء حرجة بعد التطبيق.

