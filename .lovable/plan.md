

# خطة شاملة: ChatPage + 14 وكيل مخصص + 3 وكلاء جدد

---

## الجزء 1: إصلاحات ChatPage

### 1.1 مربع الإدخال المركزي
- إزالة `border` الخارجي من wrapper (`border-border/40` → لا شيء)
- تكبير المربع ليكون مربع الشكل أكثر (`min-h-[120px]`, `rounded-2xl`)
- قائمة `+` تغلق عند الضغط على أي مكان: الـ overlay الحالي `fixed inset-0 z-[45]` موجود لكن يجب جعله `bg-black/20 backdrop-blur-sm`

### 1.2 شبكة الوكلاء → 5 فقط + زر "الكل"
- عرض 5 وكلاء فقط (الأكثر استخداما) في صف أفقي واحد
- زر سادس "All Agents" يفتح `Dialog` يعرض كل الوكلاء (17 وكيل) في شبكة 3 أعمدة قابلة للسكرول
- كل وكيل بأيقونة دائرية ملونة واسم تحته (مثل الصورة المرفقة)

---

## الجزء 2: الوكلاء الجدد (3 صفحات جديدة)

### 2.1 المساعد الشخصي (`/agents/assistant`)
**ملف جديد:** `src/pages/agents/PersonalAssistantPage.tsx`
- شريط سفلي ثابت بـ 4 أزرار: ربط الحسابات، المهام، التنبيهات، المحادثة
- واجهة الربط: كروت OAuth لـ Google Calendar, Gmail, Outlook, Todoist
- واجهة المهام: قوائم مقسمة (اليوم/الأسبوع/متأخرة)
- واجهة التنبيهات: قائمة إشعارات
- واجهة المحادثة: شات مع المساعد
- إعداد أولي: اسم المساعد، أسلوب التواصل، أوقات الإزعاج
- Web Push notifications عبر Service Worker
- ذاكرة المحادثات في Supabase
- تجربة مجانية 3 أيام ثم 20 كريدت/شهر

### 2.2 وكيل المتجر (`/agents/store`)
**ملف جديد:** `src/pages/agents/StoreManagerPage.tsx`
- شريط سفلي: المخزون، الطلبات، التعليقات، التقارير
- ربط المتجر: Shopify/WooCommerce/Salla/Zid عبر API key
- لوحة تحكم: كروت (مبيعات اليوم، طلبات جديدة، مخزون منخفض)
- واجهة المخزون: قائمة منتجات مع شريط تقدم
- واجهة الطلبات: تغيير حالة + رسائل تلقائية
- واجهة التعليقات: رد مقترح من AI
- واجهة التقارير: جراف + فلاتر
- تجربة 7 أيام ثم 20 كريدت/شهر (حسب طلب المستخدم 40→20)

### 2.3 محلل المنافسين (`/agents/market-analyzer`)
**ملف جديد:** `src/pages/agents/MarketAnalyzerPage.tsx`
- نموذج إدخال: اسم النشاط، المجال، السوق، أسماء منافسين
- شاشة بحث حي مع progress
- جدول مقارنة تفاعلي
- كروت منفصلة لكل منافس
- تقرير SWOT
- زر تنزيل PDF
- 1 كريدت/تقرير

---

## الجزء 3: إعادة كتابة الوكلاء الـ 11 الموجودين

كل وكيل سيُعاد كتابته بالكامل حسب المواصفات المفصلة:

### 3.1 Slides Agent
- مربع إدخال + زر `+` لعدد الشرائح والأسلوب
- كاروسيل أفقي لقوالب SlidesCarnival
- شاشة لودينج مع progress bar ونصوص متغيرة
- FLUX.2 Klein لتوليد الصور عبر deapi.ai
- python-pptx لتجميع العرض (Edge Function)
- عرض الشرائح مع أزرار تنقل + تنزيل PPTX/PDF
- حفظ في sidebar: `slides: اسم`
- 1 كريدت/10 شرائح

### 3.2 Meeting Notes
- أول دخول: طلب ربط Google Calendar/Outlook
- كارد الاجتماع القادم بارز
- قائمة الاجتماعات (أسبوعية) مع toggle البوت
- الاجتماعات السابقة مع زر عرض الملخص
- Recall.ai للانضمام + Deepgram للتفريغ
- 5 كريدت/ساعة

### 3.3 Spreadsheets
- مربع إدخال + رفع ملف Excel/CSV
- أمثلة جاهزة (Budget, Tracker...)
- جدول تفاعلي بعد التوليد
- تعديلات بالنص الطبيعي
- openpyxl في Edge Function
- تنزيل XLSX/CSV
- حفظ: `sheet: اسم`
- 1 كريدت

### 3.4 Image Genius
- رفع صورة → 55% من ارتفاع الشاشة
- رسالة AI ترحيبية مع 3 أزرار (قوالب/تحسين/تعديل)
- شريط أدوات سفلي ثابت قابل للسكرول
- كاروسيل قوالب/تحسينات فوق الشريط
- أدوات: قص، تدوير، فلاتر (client-side Canvas)
- تحسين جودة: Real-ESRGAN عبر fal.ai
- مسح خلفية: BRIA RMBG عبر fal.ai
- شاشة تحميل بأنيميشن
- حفظ → استوديو الصور
- 1 كريدت لكل عملية AI

### 3.5 YouTube Summary
- مربع URL كبير مع أيقونة YouTube
- عرض thumbnail بعد لصق الرابط
- ملخص منظم (Key Points, Timestamps)
- شات متابعة
- حفظ: `you: اسم`
- 0.5 كريدت

### 3.6 Ad Designer
- خيارين: رفع صورة / لصق URL
- اختيار المنصة + نوع الإعلان
- AI يجلب معلومات المنتج
- توليد سكريبت + صورة/فيديو
- نقل للاستوديو المناسب

### 3.7 Podcast
- اختيار اللغة + عدد المتحدثين + الأصوات
- عرض السكريبت مع أزرار موافق/تعديل
- توليد الصوت عبر Deepgram
- مشغل صوت نظيف
- حفظ: `podcast: اسم`
- 4 كريدت

### 3.8 Book Creator
- اختيار النوع + اللغة + عدد الصفحات
- عرض الهيكل/الفهرس للموافقة
- كتابة فصل بفصل مع progress
- غلاف بـ NanoBanana Pro
- تجميع PDF عبر jsPDF
- كاروسيل معاينة الصفحات
- حفظ: `book: اسم`
- 5 كريدت (20 صفحة)

### 3.9 Social Analyzer
- مربع URL مع دعم كل المنصات
- كشف المنصة تلقائيا مع أيقونة
- تقرير منظم (نظرة عامة/تفاعل/محتوى/توصيات)
- شات تفاعلي
- حفظ: `social: اسم`
- مجاني

### 3.10 News Agent
- شريط أزرار الفئات
- أخبار كبطاقات (عنوان/مصدر/ملخص)
- بحث مخصص

### 3.11 Deep Search
- مربع كبير + اختيار مستوى (سريع/عميق/شامل)
- كارد خطة البحث
- شاشة بحث حي مع تفاصيل كل خطوة
- تقرير منظم مع مصادر
- زر تصدير PDF
- حفظ: `research: موضوع`
- 1 كريدت

---

## الجزء 4: Routing + Sidebar

### App.tsx
إضافة 3 routes جديدة:
- `/agents/assistant` → PersonalAssistantPage
- `/agents/store` → StoreManagerPage  
- `/agents/market-analyzer` → MarketAnalyzerPage

### All Agents Dialog في ChatPage
شبكة 3 أعمدة بكل الوكلاء الـ 17:
1. Meetings 2. Slides 3. Sheets 4. Image Genius 5. Ad Designer
6. YouTube Summary 7. Podcast 8. Books 9. Social Analyzer 10. News
11. Deep Search 12. Personal Assistant 13. Store Manager 14. Market Analyzer
15. Images 16. Videos 17. Code

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/ChatPage.tsx` | إزالة border، 5 وكلاء + All Agents dialog، مربع أكبر، blur أقوى |
| `src/pages/agents/PersonalAssistantPage.tsx` | **جديد** |
| `src/pages/agents/StoreManagerPage.tsx` | **جديد** |
| `src/pages/agents/MarketAnalyzerPage.tsx` | **جديد** |
| `src/pages/agents/SlidesAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/MeetingNotesPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/SpreadsheetAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/ImageGeniusPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/YoutubeSummaryPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/AdDesignerPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/PodcastAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/BookCreatorPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/SocialAnalyzerPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/NewsAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/DeepSearchPage.tsx` | إعادة كتابة كاملة |
| `src/App.tsx` | 3 routes جديدة |

---

## المفاتيح المطلوبة

| المفتاح | الاستخدام |
|---------|----------|
| `RECALL_AI_API_KEY` | Meeting Notes - انضمام البوت للاجتماعات |
| `GOOGLE_CALENDAR_CLIENT_ID` | Meeting Notes + Personal Assistant - تقويم جوجل |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | نفسه |
| `MICROSOFT_GRAPH_CLIENT_ID` | Outlook Calendar/Mail |
| `MICROSOFT_GRAPH_CLIENT_SECRET` | نفسه |
| `GMAIL_CLIENT_ID` | Personal Assistant - إدارة الإيميل |
| `GMAIL_CLIENT_SECRET` | نفسه |
| `TODOIST_API_KEY` | Personal Assistant - المهام |
| `SHOPIFY_API_KEY` | Store Manager |
| `SALLA_API_KEY` | Store Manager |
| `ZID_API_KEY` | Store Manager |
| `WOOCOMMERCE_API_KEY` | Store Manager |
| `VAPID_PUBLIC_KEY` | Web Push notifications |
| `VAPID_PRIVATE_KEY` | Web Push notifications |

**ملاحظة**: `DEEPGRAM_APIKEY` و `CANVA_CLIENT_ID/SECRET` موجودين بالفعل.

---

## ترتيب التنفيذ

1. ChatPage (إزالة border + 5 وكلاء + All Agents dialog)
2. الوكلاء الـ 3 الجدد (Personal Assistant, Store, Market)
3. إعادة كتابة الوكلاء الـ 11 الموجودين
4. إضافة Routes في App.tsx

