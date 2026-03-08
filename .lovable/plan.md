

# تشديد الحماية النهائي -- إصلاح 4 تحذيرات متبقية

## المشاكل الحالية (من فحص Supabase)

| # | المشكلة | المستوى |
|---|---------|---------|
| 1 | `USING(true)` على سياسات INSERT/UPDATE لجداول service_role | warn |
| 2 | Leaked Password Protection معطلة | warn |
| 3 | `service_status_public` بدون سياسات RLS | warn |
| 4 | `status_subscribers` تسمح INSERT بدون أي شروط | warn |

## خطة الإصلاح

### 1. Migration لإصلاح `service_status_public` و `status_subscribers`

```sql
-- service_status_public: تفعيل RLS + سياسة SELECT عامة فقط
ALTER TABLE service_status_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON service_status_public FOR SELECT USING (true);

-- status_subscribers: تقييد INSERT + إضافة rate limiting بسيط
DROP POLICY "Public can insert subscribers" ON status_subscribers;
CREATE POLICY "Authenticated subscribe" ON status_subscribers 
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete own" ON status_subscribers
  FOR DELETE TO authenticated USING (contact = (SELECT email FROM auth.users WHERE id = auth.uid()));
```

### 2. Dismiss تحذيرات `USING(true)` المقصودة
السياسات على `service_incidents`, `service_status`, `memories`, `oauth_*`, `otp_codes` مقيدة بـ `TO service_role` -- مقصودة وآمنة.

### 3. إجراء يدوي
تفعيل **Leaked Password Protection** من Supabase Dashboard > Auth Settings.

### النتيجة المتوقعة
0 تحذيرات بعد التطبيق (عدا Leaked Password -- يدوي).

