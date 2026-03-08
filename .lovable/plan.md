

# إصلاح شامل لكل الثغرات الأمنية

## المشكلة الأساسية
السياسات اللي اتعملت في الـ migration السابق اتسمت "Service role manages X" لكنها فعليا بتطبق على `{public}` -- يعني أي حد يقدر يوصلها. محتاجين نحذفها ونعمل سياسات جديدة تطبق على `service_role` فقط.

## الثغرات المتبقية (من الفحص الأمني)

### حرجة (5):
1. **oauth_tokens** -- أي حد يقدر يقرأ كل الـ access tokens
2. **oauth_codes** -- أي حد يقدر يقرأ authorization codes
3. **oauth_clients** -- أي حد يقدر يقرأ client secrets
4. **otp_codes** -- أي حد يقدر يقرأ أكواد OTP
5. **profiles UPDATE** -- المستخدم يقدر يغير الـ `plan` والـ `credits` بتاعته بنفسه

### تحذيرات (3):
6. **service_incidents** -- INSERT/UPDATE مفتوح للجميع
7. **service_status** -- INSERT مفتوح للجميع
8. **memories** -- RLS مفعل بدون أي سياسة

## خطة الإصلاح

### Migration واحد يعمل كل الآتي:

**1. OAuth tables** -- حذف السياسات الحالية وإنشاء سياسات جديدة تطبق على `service_role` فقط:
```sql
DROP POLICY "Service role manages oauth_tokens" ON oauth_tokens;
CREATE POLICY "Only service role" ON oauth_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
```
نفس الشيء لـ `oauth_codes` و `oauth_clients`.

**2. otp_codes** -- نفس المعالجة.

**3. profiles UPDATE** -- تقييد الأعمدة اللي المستخدم يقدر يعدلها:
- حذف سياسة UPDATE الحالية
- إنشاء سياسة جديدة تسمح بتعديل `display_name`, `avatar_url`, `two_factor_enabled` فقط
- إنشاء function `update_profile_safe` كـ SECURITY DEFINER

**4. service_incidents** -- حذف سياسات INSERT/UPDATE وإنشاء بديل لـ `service_role` فقط.

**5. service_status** -- نفس المعالجة.

**6. memories** -- إضافة سياسة `service_role` فقط.

### تعديل الكود
- **ProfileSettingsPage.tsx** -- استخدام الـ function الجديدة `update_profile_safe` بدل UPDATE المباشر

### إجراء يدوي مطلوب
- تفعيل **Leaked Password Protection** من Supabase Dashboard

## النتيجة المتوقعة
بعد التطبيق، الفحص الأمني يرجع **0 أخطاء حرجة** و **0 تحذيرات** (ما عدا Leaked Password اللي محتاج تفعيل يدوي).

