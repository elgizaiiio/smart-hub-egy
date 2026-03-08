

# خطة: نظام SMTP Mail مخصص + إشعارات داخلية

## نظرة عامة

بناء نظام إشعارات متكامل يتكون من جزئين:
1. **إشعارات داخلية (In-App)** - جرس إشعارات داخل التطبيق مع dropdown
2. **نظام SMTP Email** - Edge Function لإرسال إيميلات عبر SMTP مخصص

---

## الجزء 1: الإشعارات الداخلية

### قاعدة البيانات
- إنشاء جدول `notifications` يحتوي على:
  - `id`, `user_id`, `type` (credits, system, generation, referral), `title`, `message`, `read` (boolean), `created_at`, `metadata` (jsonb)
- RLS: المستخدم يقرأ ويحدث إشعاراته فقط
- إضافة دالة `mark_notifications_read` لتحديث حالة القراءة

### الواجهة (Frontend)
- **مكون `NotificationBell`**: أيقونة جرس في الـ Header/Sidebar مع badge لعدد الإشعارات غير المقروءة
- **مكون `NotificationDropdown`**: قائمة منسدلة تعرض آخر الإشعارات مع:
  - أيقونة حسب النوع (كريدتس، نظام، توليد، إحالة)
  - وقت الإشعار بصيغة نسبية (منذ 5 دقائق)
  - زر "تحديد الكل كمقروء"
- **صفحة `/notifications`**: عرض كامل لكل الإشعارات مع فلاتر
- **Hook `useNotifications`**: جلب الإشعارات + Realtime subscription للإشعارات الجديدة
- إضافة الجرس في `DesktopSidebar` و headers الموبايل

### إنشاء إشعارات تلقائية
- تعديل دالة `deduct_credits` في الداتابيس لإنشاء إشعار عند انخفاض الرصيد تحت 5 MC
- Edge Function helper لإنشاء إشعارات من أي مكان (توليد صور/فيديو، إحالات)

---

## الجزء 2: نظام SMTP Email

### السر المطلوب
- إضافة secrets: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`

### Edge Function: `send-email`
- Edge Function جديدة تستقبل: `to`, `subject`, `html`, `text`
- تستخدم Deno's SMTP client (`denomailer`) للإرسال
- تدعم HTML templates

### جدول `email_logs`
- تسجيل كل إيميل مرسل: `id`, `user_id`, `to_email`, `subject`, `type`, `status`, `created_at`

### أنواع الإيميلات
1. **ترحيب مستخدم جديد** - يُرسل تلقائياً عند التسجيل (trigger على profiles)
2. **تنبيه رصيد منخفض** - يُرسل عند وصول الكريدتس تحت حد معين
3. **تأكيد عمليات** - عند سحب أموال أو تغيير خطة
4. **نشرة أخبار** - إرسال يدوي (admin endpoint)

### Email Templates
- مكونات HTML templates جاهزة بتصميم Megsy AI
- كل template يستقبل متغيرات ديناميكية (اسم المستخدم، المبلغ، إلخ)

---

## الجزء 3: الربط بين النظامين

- عند إرسال إيميل مهم → إنشاء إشعار داخلي أيضاً
- إعدادات تفضيلات الإشعارات في صفحة الإعدادات (تفعيل/إلغاء كل نوع)
- جدول `notification_preferences` لحفظ تفضيلات كل مستخدم

---

## ترتيب التنفيذ

1. إنشاء جداول (`notifications`, `email_logs`, `notification_preferences`) + RLS
2. بناء مكونات الإشعارات الداخلية (Bell, Dropdown, Hook)
3. إنشاء Edge Function `send-email` مع SMTP
4. بناء HTML email templates
5. ربط الأحداث (triggers + helpers) لإرسال إشعارات + إيميلات تلقائية
6. إضافة صفحة تفضيلات الإشعارات في الإعدادات

> **ملاحظة**: ستحتاج لتوفير بيانات SMTP الخاصة بك (Host, Port, User, Password) عند التنفيذ. يمكنك استخدام أي خدمة SMTP مثل Gmail, Outlook, أو سيرفر خاص.

