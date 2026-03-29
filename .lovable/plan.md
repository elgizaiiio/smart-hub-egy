

# خطة شاملة: إعادة تصميم الوكلاء + Cloud + مربعات الإدخال + أيقونات

---

## 1. إعادة بناء كل وكيل بصفحة مخصصة

كل الوكلاء حاليا يستخدمون `AgentPageLayout` العام (مجرد chat). المطلوب: كل وكيل يكون له UI مخصص بمتطلباته.

### 1.1 Meeting Notes (`/agents/meetings`)
- **UI مخصص**: قسم علوي يعرض "الاجتماعات القادمة" + "آخر الملخصات"
- زر "ربط التقويم" (Google Calendar / Outlook) يظهر إذا لم يربط المستخدم
- زر "رفع تسجيل" لرفع ملف صوتي/فيديو
- مربع إدخال في الأسفل للأسئلة عن الاجتماعات
- يعرض الملخصات كبطاقات منظمة (Action Items, Decisions, Notes)

### 1.2 AI Slides (`/agents/slides`)
- **UI مخصص**: مربع إدخال كبير في الوسط "ما موضوع العرض التقديمي؟"
- بعد الإرسال: يتحول لمحادثة مع AI يولد الشرائح
- زر "قوالب Canva" لاختيار قالب
- عند الانتهاء: ينقل الملف لصفحة الملفات تلقائيا

### 1.3 Spreadsheets (`/agents/spreadsheets`)
- **UI مخصص**: مربع إدخال كبير + أمثلة جاهزة (Budget, Tracker, Inventory)
- بعد التوليد: ينقل لصفحة الملفات

### 1.4 Image Genius (`/agents/image-genius`)
- **UI مخصص بالكامل**: 
  - شاشة رفع الصورة أولا (drag & drop + زر اختيار)
  - بعد الرفع: 4 أزرار كبيرة (Templates / Enhance / Edit / Remove BG)
  - **Templates**: شبكة قوالب بصور معاينة (تُدار من بوت تليجرام)
  - **Enhance**: قوالب تحسين بصور معاينة
  - **Edit**: أدوات (قص، تدوير، فلاتر، تحسين جودة AI، مسح خلفية AI)
  - مربع إدخال حر للطلبات المخصصة
  - النتائج تُنقل لاستوديو الصور

### 1.5 Ad Designer (`/agents/ad-designer`)
- **UI مخصص**: خيارين في البداية: "رفع صورة منتج" أو "لصق رابط منتج"
- اختيار المنصة (Instagram, TikTok, Facebook, YouTube)
- اختيار نوع الإعلان (صورة، فيديو، carousel)
- مربع إدخال للتعليمات الإضافية
- النتائج تُنقل للاستوديو المناسب

### 1.6 YouTube Summary (`/agents/youtube-summary`)
- **UI مخصص**: مربع إدخال كبير مع placeholder "Paste YouTube URL"
- بعد لصق الرابط: يعرض thumbnail الفيديو + عنوانه
- يولد الملخص كبطاقات منظمة (Key Points, Timestamps, Summary)
- مربع إدخال في الأسفل للأسئلة المتابعة

### 1.7 AI Podcast (`/agents/podcast`)
- **UI مخصص**: مربع إدخال "ما موضوع البودكاست؟"
- اختيار اللغة + عدد المتحدثين
- يعرض السكريبت للمراجعة مع زر "موافقة" و "تعديل"
- بعد الموافقة: يولد الصوت عبر Deepgram
- النتائج تُنقل لصفحة الصوت

### 1.8 Book Creator (`/agents/book-creator`)
- **UI مخصص**: مربع إدخال كبير + اختيار النوع (رواية، تعليمي، أطفال)
- اختيار اللغة + عدد الصفحات التقريبي
- يعرض المحتوى أثناء التوليد صفحة بصفحة
- يولد غلاف بـ AI
- زر تحميل PDF

### 1.9 Social Analyzer (`/agents/social-analyzer`)
- **UI مخصص**: مربع إدخال "Paste profile or post URL"
- يعرض النتائج كبطاقات إحصائية (Followers, Engagement Rate, Top Posts)
- رسوم بيانية بسيطة

### 1.10 News Agent (`/agents/news`)
- **UI مخصص**: شريط أزرار الفئات (Tech, Business, Sports, Science, etc.)
- يعرض الأخبار كبطاقات (عنوان، مصدر، ملخص)
- مربع إدخال للبحث في أخبار محددة

### 1.11 Deep Search (`/agents/deep-search`)
- **UI مخصص**: مربع إدخال كبير في الوسط مع تنبيه "قد يستغرق 5+ دقائق"
- شريط تقدم يعرض مراحل البحث
- يعرض التقرير النهائي بأقسام منظمة

### 1.12 AI Personalization (في الإعدادات - موجود بالفعل)
- لا تغيير

---

## 2. ChatPage: مربع إدخال أكبر + زر + في الوسط

**تعديل `ChatPage.tsx`:**
- عندما لا توجد رسائل: مربع الإدخال يكون أكبر (مربع الشكل) مع padding أكبر
- إضافة زر `+` بجانب مربع الإدخال يفتح **قائمة للأسفل** (بدل للأعلى) لأن المربع في الوسط
- شريط الوكلاء: إضافة أيقونات حديثة من Lucide لكل وكيل:
  - Meeting Notes → `CalendarCheck`
  - AI Slides → `Presentation`
  - Spreadsheets → `Table2`
  - Image Genius → `Sparkles`
  - Ad Designer → `Megaphone`
  - YouTube Summary → `Youtube` (من lucide)
  - AI Podcast → `Podcast`
  - Book Creator → `BookOpen`
  - Social Analyzer → `BarChart3`
  - News → `Newspaper`
  - Deep Search → `SearchCheck`

---

## 3. Cloud: نقل من Sidebar للإعدادات

**تعديل:**
- `AppSidebar.tsx`: حذف `{ path: "/cloud", label: "Cloud" }` من `serviceItems`
- `SettingsPage.tsx`: إضافة زر Cloud في `menuItems` أو `quickActions`
- `MegsyCloudPage.tsx`: إعادة تصميم - عند الضغط على أي عنصر يفتحه (صورة → معاينة، فيديو → تشغيل، ملف → تنزيل، كود → فتح المشروع)

---

## 4. مربعات الإدخال في الصور والفيديوهات

**تعديل `ImagesPage.tsx` و `VideosPage.tsx`:**
- تكبير مربع الإدخال: `min-h-[56px]` → `min-h-[64px]`، `py-4` → `py-5`، `px-4` → `px-5`
- تكبير أزرار الأيقونات: `w-10 h-10` → `w-11 h-11`
- تحسين تباعد الأزرار

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/agents/MeetingNotesPage.tsx` | إعادة كتابة كاملة - UI مخصص |
| `src/pages/agents/SlidesAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/SpreadsheetAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/ImageGeniusPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/AdDesignerPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/YoutubeSummaryPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/PodcastAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/BookCreatorPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/SocialAnalyzerPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/NewsAgentPage.tsx` | إعادة كتابة كاملة |
| `src/pages/agents/DeepSearchPage.tsx` | إعادة كتابة كاملة |
| `src/pages/ChatPage.tsx` | مربع إدخال أكبر + قائمة + للأسفل + أيقونات وكلاء |
| `src/pages/MegsyCloudPage.tsx` | إعادة تصميم + تفعيل التفاعل مع العناصر |
| `src/pages/ImagesPage.tsx` | تكبير مربع الإدخال |
| `src/pages/VideosPage.tsx` | تكبير مربع الإدخال |
| `src/components/AppSidebar.tsx` | حذف Cloud من القائمة |
| `src/pages/SettingsPage.tsx` | إضافة زر Cloud |

