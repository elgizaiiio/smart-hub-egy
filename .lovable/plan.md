

# خطة شاملة: البرمجة + الصوت + التكاملات + التحسينات

---

## الجزء 1: تحسين صفحة البرمجة (CodeWorkspace + ProgrammingPage)

### 1.1 التأكد من عمل Claude Code
- النظام الحالي يعمل بالفعل عبر `code-generate` edge function مع Claude Sonnet 4
- تحسين: إضافة أدوات ذكية داخل البرمجة (بحث الويب، بحث في الملفات)

### 1.2 إضافة أدوات AI Agent للبرمجة
تحديث `code-generate/index.ts` ليدعم:
- **بحث الويب** عبر Serper API (موجود بالفعل كسر)
- **بحث في الملفات** المولدة
- نظام function calling مع Claude لتنفيذ الأدوات تلقائيا

### 1.3 أزرار التكامل في CodeWorkspace
القائمة الحالية (`AnimatedPlusMenu`) تحتوي GitHub + Vercel + Supabase. التحسينات:
- **GitHub**: يعمل بالفعل عبر Composio - نتأكد من صحته
- **Supabase**: إضافة زر "Connect Supabase" يطلب Project URL + Service Role Key ويحفظهم في المشروع
- تحسين UI الأزرار

### 1.4 إعادة تصميم ProgrammingPage الرئيسية
- تحسين التصميم مع عرض المشاريع السابقة بشكل أفضل
- حفظ المحادثة والملفات بالكامل (موجود بالفعل في `files_snapshot`)
- عند العودة لمشروع → إعادة بناء الـ preview (sandbox جديد)

---

## الجزء 2: إعادة تصميم صفحة الصوت

### التصميم الجديد
بدل عرض النماذج كقائمة تقنية، نعرض **خدمات جاهزة** للمستخدم:

```text
┌─────────────────────────┐
│  Clone Your Voice       │  ← يستخدم Qwen3 TTS VoiceClone
│  Record 10s → Get voice │
├─────────────────────────┤
│  Text to Speech         │  ← يستخدم Kokoro / Chatterbox
│  Type text → Listen     │
├─────────────────────────┤
│  Design AI Voice        │  ← يستخدم Qwen3 VoiceDesign
│  Custom voice creation  │
├─────────────────────────┤
│  AI Music Generator     │  ← يستخدم ACE-Step
│  Describe → Get music   │
├─────────────────────────┤
│  Voice Changer          │  ← تحويل الصوت
│  Upload → Transform     │
└─────────────────────────┘
```

كل خدمة تفتح صفحة مخصصة بمربع إدخال وإعدادات مناسبة.

---

## الجزء 3: تحسين مربع الإدخال في الصور والفيديوهات

- تكبير مربع الإدخال قليلا (زيادة padding و min-height)
- تغيير أيقونة "تحسين البرومبت" من `Sparkles` إلى `Wand2` أو `PenTool`
- تحسين تجربة المستخدم

---

## الجزء 4: التكاملات (9 خدمات)

### المفاتيح المطلوبة
سأطلب إضافة المفاتيح التالية كـ secrets:

| الخدمة | اسم السر | الوصف |
|--------|----------|-------|
| TikTok | `TIKTOK_API_KEY` | TikTok for Developers |
| Twitter/X | `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` | X Developer Portal |
| Shopify | `SHOPIFY_API_KEY`, `SHOPIFY_ACCESS_TOKEN` | Shopify Partners |
| Meta | `META_ACCESS_TOKEN` | Meta for Developers |
| Telegram | موجود بالفعل `TELEGRAM_BOT_TOKEN` | - |
| Discord | `DISCORD_BOT_TOKEN` | Discord Developer Portal |
| Slack | موجود بالفعل | - |
| Notion | `NOTION_API_KEY` | Notion Integrations |
| Zoom | `ZOOM_API_KEY`, `ZOOM_API_SECRET` | Zoom Marketplace |

### كيف تعمل التكاملات
- تحديث `chat/index.ts` بإضافة function calling tools لكل خدمة
- عند طلب المستخدم خدمة تحتاج تكامل → الذكاء الاصطناعي يعرض **بطاقة ربط** في المحادثة:
  "لاستخدام هذه الخدمة، اربط حسابك" مع زر "ربط"
- إنشاء edge functions مخصصة لكل خدمة تستخدم المفاتيح مباشرة

---

## الجزء 5: ترقية المستخدم support@megsyai.com

- تحديث خطة المستخدم عبر SQL insert tool إلى أعلى اشتراك

---

## الجزء 6: اقتراحات (100 خطة + 200 اقتراح)

سأقدم الاقتراحات بعد إتمام التنفيذ في رسالة منفصلة.

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/VoicePage.tsx` | إعادة تصميم كامل كخدمات جاهزة |
| `src/pages/CodeWorkspace.tsx` | إضافة أدوات بحث + تحسين التكاملات |
| `src/pages/ProgrammingPage.tsx` | تحسين التصميم الرئيسي |
| `src/pages/ImagesPage.tsx` | تكبير مربع الإدخال + تغيير أيقونة |
| `src/pages/VideosPage.tsx` | نفس التحسينات |
| `supabase/functions/code-generate/index.ts` | إضافة أدوات بحث |
| `supabase/functions/chat/index.ts` | إضافة tools للتكاملات الجديدة |
| `supabase/functions/integrations/index.ts` | **جديد** - edge function موحد للتكاملات |

---

## ترتيب التنفيذ

1. ترقية المستخدم (SQL)
2. تحسين مربع الإدخال في الصور/الفيديو (سريع)
3. إعادة تصميم صفحة الصوت
4. تحسين صفحة البرمجة + أدوات
5. طلب المفاتيح وإضافة التكاملات
6. تقديم الاقتراحات

