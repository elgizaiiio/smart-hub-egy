

# خطة: إدارة OAuth Apps عبر بوت تليجرام

## الملخص
بدلاً من صفحة `/settings/apis`، سيتم إدارة تطبيقات OAuth بالكامل من بوت تليجرام الإداري. الأدمن ينشئ/يعدل/يحذف التطبيقات ويحصل على Client ID و Client Secret مباشرة في الشات.

## المكونات

### 1. جداول قاعدة البيانات (Migration)

```sql
-- جدول تطبيقات OAuth
CREATE TABLE public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,  -- المالك (الأدمن الي أنشأه)
  client_id text UNIQUE NOT NULL,
  client_secret_hash text NOT NULL,
  name text NOT NULL,
  logo_url text,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- أكواد التفويض المؤقتة (5 دقائق)
CREATE TABLE public.oauth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  client_id text NOT NULL,
  user_id uuid NOT NULL,
  redirect_uri text NOT NULL,
  scope text DEFAULT 'read',
  used boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Access Tokens
CREATE TABLE public.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text UNIQUE NOT NULL,
  client_id text NOT NULL,
  user_id uuid NOT NULL,
  scope text DEFAULT 'read',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

RLS: كل الجداول تدار عبر service role فقط (البوت والـ Edge Functions).

### 2. تحديث بوت تليجرام

اضافة قسم جديد في القائمة الرئيسية: **🔑 OAuth Apps**

التدفق في البوت:
```text
القائمة الرئيسية
  └─ 🔑 OAuth Apps
       ├─ ➕ إنشاء تطبيق جديد
       │    → إدخال اسم التطبيق
       │    → إدخال Redirect URI
       │    → يتم إنشاء client_id + client_secret
       │    → عرضهم للأدمن (مرة واحدة للـ secret)
       │
       ├─ 📋 عرض التطبيقات
       │    → قائمة بكل التطبيقات
       │    → اضغط على تطبيق لعرض التفاصيل
       │         ├─ ✏️ تعديل الاسم
       │         ├─ 🔗 تعديل Redirect URIs
       │         ├─ 🔄 إعادة توليد Secret
       │         └─ 🗑 حذف التطبيق
       │
       └─ 🔙 رجوع
```

**الملفات المتأثرة:**
- `supabase/functions/telegram-bot/index.ts` — إضافة handlers لـ OAuth Apps

### 3. Edge Functions (3 functions جديدة)

| Function | الوظيفة |
|----------|---------|
| `oauth-authorize` | ينشئ authorization code بعد موافقة المستخدم |
| `oauth-token` | يستبدل الكود بـ access token |
| `oauth-userinfo` | يرجع بيانات المستخدم بناءً على Bearer token |

### 4. صفحة Consent Screen

- `/oauth/authorize` — صفحة React بسيطة
- تعرض اسم التطبيق + الصلاحيات
- زر "Allow" و "Deny"
- لو المستخدم مش مسجل → يروح Auth ويرجع

### 5. تحديثات أخرى

- `src/App.tsx` — إضافة route `/oauth/authorize`
- `supabase/config.toml` — تسجيل Edge Functions الثلاثة
- إزالة `/settings/apis` route ومرجعه من `DesktopSettingsLayout`

## ترتيب التنفيذ

1. إنشاء الجداول (migration)
2. تحديث بوت تليجرام بقسم OAuth Apps
3. بناء Edge Functions الثلاثة
4. بناء صفحة `/oauth/authorize`
5. تحديث App.tsx و config.toml و DesktopSettingsLayout

