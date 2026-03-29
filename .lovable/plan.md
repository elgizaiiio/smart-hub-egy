

# خطة شاملة: 12 وكيل ذكاء اصطناعي + Megsy Cloud + إصلاحات + تحسينات

هذا طلب ضخم جدا يحتوي على 20+ تغيير. سأقسمه لأجزاء واضحة.

---

## الجزء 1: مربع الإدخال في وسط صفحة الشات + اقتراحات الخدمات

### التغييرات في `ChatPage.tsx`:
- عند عدم وجود رسائل: نقل مربع الإدخال (AnimatedInput) إلى وسط الصفحة عموديا بدل تثبيته في الأسفل
- عند إرسال أول رسالة: مربع الإدخال ينتقل تلقائيا للأسفل (الوضع الحالي)
- إضافة أزرار اقتراحات أسفل المربع المركزي تشمل: Photos, Videos, Code, Files + الوكلاء الـ 12

الوكلاء سيظهرون كبطاقات صغيرة قابلة للتمرير أفقيا أسفل أزرار الخدمات الأساسية.

---

## الجزء 2: الوكلاء الـ 12 (Agent Pages)

كل وكيل = صفحة جديدة بمربع إدخال + منطق خاص. سنستخدم نمط مشترك `AgentPageLayout` لتقليل التكرار.

### 2.1 وكيل ملاحظات الاجتماعات (`/agents/meetings`)
- UI: عرض جدول الاجتماعات القادمة + آخر التسجيلات + ملخصات
- التكامل: Google Calendar / Outlook عبر OAuth (سنطلب المفاتيح لاحقا)
- Zoom Bot: استخدام `ZOOM_CLIENT_ID` + `ZOOM_CLIENT_SECRET` للانضمام
- Edge function: `meeting-agent/index.ts` - يلخص التسجيلات عبر AI
- **ملاحظة**: الانضمام التلقائي للاجتماعات يحتاج خدمة خارجية (Recall.ai أو مشابه). حاليا سنبني الواجهة + التلخيص اليدوي (رفع تسجيل)

### 2.2 وكيل الشرائح (`/agents/slides`)
- UI: مربع إدخال + معاينة شرائح
- يستخدم AI لتوليد محتوى الشرائح + نماذج صور (Nano Banana) للصور
- تكامل Canva عبر `CANVA_CLIENT_ID` + `CANVA_CLIENT_SECRET` لجلب قوالب
- عند الإنشاء: نقل المحادثة لصفحة الملفات
- Edge function: `slides-agent/index.ts`

### 2.3 وكيل جداول البيانات (`/agents/spreadsheets`)
- UI: مربع إدخال + معاينة جدول
- توليد CSV/XLSX بالذكاء الاصطناعي
- عند الإنشاء: نقل لصفحة الملفات

### 2.4 عبقري الصور (`/agents/image-genius`)
- UI: رفع صورة شخصية + أزرار (قوالب / تحسين / تعديل)
- **القوالب**: تُضاف من بوت تليجرام (name + prompt + صورة معاينة) - نبني الهيكل + واجهة إدارة
- **تحسين**: قوالب تحسين (name + صورة + prompt) من تليجرام
- **تعديل**: قص، تدوير، فلاتر، تحسين جودة AI، مسح خلفية AI
- نموذج أساسي: Nano Banana. تحسين الجودة + قص الخلفية = نماذج رخيصة عبر fal.ai
- النتائج تُنقل لاستوديو الصور

### 2.5 مصمم الإعلانات (`/agents/ad-designer`)
- رفع صورة منتج أو رابط
- AI يجلب معلومات المنتج (fetch + search)
- ينشئ سكريبت إعلان + يولد صورة/فيديو
- النتائج تُنقل للاستوديو المناسب

### 2.6 ملخص يوتيوب (`/agents/youtube-summary`)
- إدخال رابط فيديو يوتيوب
- جلب transcript عبر YouTube API (مجاني/أوبن سورس)
- AI يلخص ويرد بشكل شات تفاعلي

### 2.7 بودكاست AI (`/agents/podcast`)
- أدوات بحث + fetch لإنشاء سكريبت
- عرض السكريبت للموافقة/التعديل
- توليد صوت عبر Deepgram (`DEEPGRAM_APIKEY`)
- النتائج تُنقل لصفحة الصوت

### 2.8 كتب وقصص (`/agents/book-creator`)
- إدخال المحتوى → AI يولد كتاب 20+ صفحة
- غلاف بـ Nano Banana Pro
- تحويل لـ PDF مرتب
- أدوات بحث + fetch مدمجة

### 2.9 تحليل سوشيال ميديا (`/agents/social-analyzer`)
- إدخال رابط حساب أو منشور
- جلب المعلومات عبر أوبن سورس APIs
- تحليل وعرض النتائج

### 2.10 وكيل الأخبار (`/agents/news`)
- المستخدم يحدد المجال
- جلب أخبار عبر أوبن سورس (NewsAPI / RSS)
- عرض بلغة المستخدم

### 2.11 البحث والتلخيص (`/agents/deep-search`)
- بحث عميق من مصادر متعددة
- تقرير شامل (قد يستغرق 5+ دقائق)
- أدوات بحث + fetch متعددة

### 2.12 وكيل التخصيص (في الإعدادات، ليس صفحة منفصلة)
- ضمن `/settings/customization` أو صفحة جديدة `/settings/ai-personalization`

---

## الجزء 3: صفحة Megsy Cloud (`/cloud`)

- صفحة جديدة تجمع كل ما أنشأه المستخدم عبر الموقع
- أقسام: صور، فيديوهات، ملفات، أصوات، مشاريع برمجة، محادثات
- جلب البيانات من جداول: `model_media`, `conversations`, `projects`, `messages`
- إضافة route في `App.tsx` + رابط في الـ sidebar

---

## الجزء 4: إصلاح البريفيو في صفحة البرمجة

### المشكلة: البريفيو الداخلي (iframe + Babel) لا يعمل بشكل موثوق
### الحل: النشر على Vercel ثم عرض iframe

- تعديل `CodeWorkspace.tsx`:
  - بعد توليد الملفات → استدعاء `vercel-deploy` edge function
  - عرض الـ URL الناتج في iframe
  - `VERCEL_TOKEN` موجود بالفعل كسر
- تعديل `vercel-deploy/index.ts` ليقبل الملفات مباشرة ويرفعها

---

## الجزء 5: تكبير مربع الإدخال في الصور والفيديوهات

- `ImagesPage.tsx` و `VideosPage.tsx`: زيادة `min-h-[52px]` و padding
- تحسين تنسيق الأزرار (model picker + settings + enhance)

---

## الجزء 6: تخصيص AI في الإعدادات

### صفحة جديدة أو إضافة لـ `CustomizationPage.tsx`:
- خانات: "ما الاسم الذي يناديك به"، "مهنتك"، "وصف عنك"، "صفات AI المطلوبة"، "تعليمات مخصصة"
- زر حفظ → يحفظ في `user_memory_entries` أو جدول جديد `ai_personalization`
- يُرسل كـ system prompt إضافي مع كل محادثة

---

## الجزء 7: أفاتار فيديو في صفحة الفيديوهات

- إضافة أداة "Avatar Video" في `VIDEO_TOOLS`
- نموذج: `veed/avatars/text-to-video` على fal.ai
- التكلفة: 5 كريدت/دقيقة
- الأفاتارات تُضاف من بوت تليجرام (avatar_id) - نبني الهيكل

---

## الجزء 8: محادثة تجريبية عند الدخول لأول مرة

- عند أول دخول (لا توجد محادثات سابقة):
  - إنشاء محادثة تلقائية
  - رسالة مستخدم: "Explain what is Megsy AI"
  - رسالة AI: شرح شامل لكل خدمات المنصة
  - تحفظ كمحادثة عادية

---

## الجزء 9: إضافة route لـ Megsy Cloud + sidebar

- `App.tsx`: إضافة `/cloud` route
- `DesktopSidebar.tsx` + `AppSidebar.tsx`: إضافة رابط Cloud

---

## الملفات الجديدة

| ملف | الوصف |
|-----|-------|
| `src/pages/MegsyCloudPage.tsx` | صفحة Cloud الشاملة |
| `src/pages/agents/MeetingNotesPage.tsx` | وكيل الاجتماعات |
| `src/pages/agents/SlidesAgentPage.tsx` | وكيل الشرائح |
| `src/pages/agents/SpreadsheetAgentPage.tsx` | وكيل جداول البيانات |
| `src/pages/agents/ImageGeniusPage.tsx` | عبقري الصور |
| `src/pages/agents/AdDesignerPage.tsx` | مصمم الإعلانات |
| `src/pages/agents/YoutubeSummaryPage.tsx` | ملخص يوتيوب |
| `src/pages/agents/PodcastAgentPage.tsx` | بودكاست AI |
| `src/pages/agents/BookCreatorPage.tsx` | كتب وقصص |
| `src/pages/agents/SocialAnalyzerPage.tsx` | تحليل سوشيال |
| `src/pages/agents/NewsAgentPage.tsx` | وكيل الأخبار |
| `src/pages/agents/DeepSearchPage.tsx` | البحث والتلخيص |
| `src/pages/AIPersonalizationPage.tsx` | تخصيص AI |
| `supabase/functions/agent-router/index.ts` | Edge function موحد لكل الوكلاء |

## الملفات المعدلة

| ملف | التغيير |
|-----|---------|
| `src/App.tsx` | إضافة 14 route جديد |
| `src/pages/ChatPage.tsx` | مربع إدخال مركزي + اقتراحات + محادثة أولى |
| `src/pages/ImagesPage.tsx` | تكبير مربع الإدخال |
| `src/pages/VideosPage.tsx` | تكبير مربع الإدخال + أداة أفاتار |
| `src/pages/CodeWorkspace.tsx` | نشر Vercel + iframe |
| `src/pages/SettingsPage.tsx` | زر تخصيص AI |
| `src/components/DesktopSidebar.tsx` | رابط Cloud |
| `src/components/AppSidebar.tsx` | رابط Cloud |
| `src/lib/videoToolsData.ts` | إضافة Avatar Video tool |

## Migration مطلوب

```sql
CREATE TABLE ai_personalization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  call_name text,
  profession text,
  about text,
  ai_traits text,
  custom_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_personalization ENABLE ROW LEVEL SECURITY;
```

---

## ملاحظة مهمة

هذا طلب يحتوي على 30+ ملف جديد/معدل. سأبدأ بالأجزاء الأساسية (ChatPage centered input + Cloud page + agents routing) ثم أبني الوكلاء واحدا تلو الآخر. كل وكيل يستخدم نفس الـ layout المشترك لتقليل الحجم.

