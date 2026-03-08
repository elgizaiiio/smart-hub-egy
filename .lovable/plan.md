

## تحسين بطاقة Enterprise في صفحة الأسعار

### الوضع الحالي
بطاقة Enterprise حالياً مجرد `div` بسيط بخلفية `bg-card` وحدود عادية، مع عنوان ونص قصير وزر "Contact Sales". لا تتناسب مع جودة البطاقات الثلاث فوقها.

### التحسينات المقترحة

**التصميم البصري:**
- تحويلها إلى بطاقة عرضية (full-width) بتدرج لوني فاخر (من أزرق غامق إلى بنفسجي)
- إضافة animated gradient border متحرك (rotating conic gradient)
- إضافة particles متحركة مثل باقي البطاقات
- شارة "FOR TEAMS & ORGANIZATIONS" في الأعلى
- أيقونات مميزة بجانب كل feature

**المحتوى الشامل — قائمة features كاملة:**
- Custom MC allocation
- All AI models (priority queue)
- Unlimited everything (images, videos, deploy, publish)
- Dedicated infrastructure
- SSO & SAML authentication
- Team management & roles
- Custom API rate limits
- SLA guarantee (99.9% uptime)
- Dedicated account manager
- Custom integrations & webhooks
- Data residency options
- Advanced analytics & reporting
- On-premise deployment option
- Priority 24/7 support

**التخطيط:**
- عرض الـ features في شبكة من عمودين (أو 3 أعمدة على الشاشات الكبيرة)
- نص وصفي أطول وأوضح
- زرين: "Contact Sales" (primary) + "Book a Demo" (secondary)
- تأثيرات hover وأنيميشن دخول احترافية

### الملفات المتأثرة
1. **`src/pages/PricingPage.tsx`** — إعادة بناء قسم Enterprise بالكامل
2. **`src/index.css`** — إضافة CSS للـ animated gradient border

