

# إصلاح الثغرات الأمنية المتبقية

## المشاكل المكتشفة من الفحص الأمني

### 1. حرجة: profiles UPDATE لا يزال يسمح بتعديل plan و credits
رغم إننا عملنا `REVOKE/GRANT` على الأعمدة، الـ scanner لسه شايف إن المستخدم يقدر يعدل `plan` و `credits`. الحل الأقوى: إضافة **BEFORE UPDATE trigger** يمنع تعديل هذه الأعمدة من أي session مش service_role.

### 2. تحذير: withdrawal_requests -- المستخدم يقدر يعمل INSERT بـ status = 'approved'
سياسة INSERT بتتحقق من `user_id` بس، لكن المستخدم يقدر يحط `status = 'approved'` مباشرة. الحل: تعديل WITH CHECK لتفرض `status = 'pending'`.

### 3. تحذير: RLS policies with USING(true) على جداول service_role
هذه مقصودة (oauth_tokens, oauth_codes, etc.) لأنها `TO service_role` فقط. سنعمل dismiss/ignore لهذا التحذير.

### 4. تحذير: Leaked Password Protection معطلة
إجراء يدوي من Supabase Dashboard.

---

## خطة التنفيذ

### Migration واحد:

**1. Trigger لحماية profiles من تعديل plan/credits:**
```sql
CREATE FUNCTION protect_profile_columns() RETURNS trigger
-- يرفض أي تعديل لـ plan أو credits إلا من service_role
```

**2. تعديل سياسة withdrawal_requests INSERT:**
```sql
DROP POLICY ... ON withdrawal_requests;
CREATE POLICY ... WITH CHECK (auth.uid() = user_id AND status = 'pending');
```

**3. Dismiss تحذير USING(true)** لأنه مطبق على service_role فقط وهذا مقصود.

### إجراء يدوي
- تفعيل Leaked Password Protection من Supabase Dashboard

### النتيجة المتوقعة
0 أخطاء حرجة، 1 تحذير فقط (Leaked Password -- يدوي).

