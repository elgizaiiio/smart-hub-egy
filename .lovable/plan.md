

# خطة: إصلاح ChatPage + إعادة بناء Slides Agent بالكامل

---

## الجزء 1: ChatPage - شبكة 8 أيقونات (4×2) + Drawer

### المشكلة الحالية
- 5 أيقونات + زر "All" بشكل `flex-wrap` غير منظم
- "All Agents" يفتح `Dialog` عادي بدل drawer من الأسفل
- الأيقونات صغيرة ولا تشبه التصميم المطلوب (Genspark style)

### التغييرات في `ChatPage.tsx`
1. **تغيير الشبكة من 5+1 إلى 4×2**: عرض 8 أيقونات في `grid-cols-4` صفين
   - الصف الأول: Meetings, Slides, Sheets, Deep Search
   - الصف الثاني: Chat, Images, Image Genius, **All Agents** (الزر الثامن)
2. **كل أيقونة**: دائرة ملونة `w-14 h-14 rounded-full` مع أيقونة بيضاء بداخلها + اسم تحتها (مثل الصورة)
3. **زر "All Agents"**: يفتح `Drawer` (من vaul) بدل `Dialog`
   - الـ Drawer يفتح من الأسفل ويأخذ ~80% من ارتفاع الشاشة
   - بداخله شبكة `grid-cols-3` قابلة للسكرول بكل الـ 17 وكيل
   - نفس شكل الأيقونات الدائرية الملونة

### الملفات
- `src/pages/ChatPage.tsx` - تعديل الشبكة + استبدال Dialog بـ Drawer

---

## الجزء 2: Slides Agent - إعادة بناء كاملة (Genspark Style)

### التصميم الجديد (حسب الصور)
الصفحة تتكون من:

**Header**: `X` للإغلاق + `...` للخيارات + عنوان "AI Slides"

**القسم العلوي**:
- عنوان "Ready to create your slides?"
- زرين: "Guided Mode" (نشط) + "Auto" dropdown لعدد الشرائح
- مربع إدخال كبير بـ placeholder متحرك + أزرار:
  - زر Enter (إرسال)
  - زر Mic
  - زر Style dropdown يعرض الأسلوب الحالي (احترافي/إبداعي) مع أيقونة
  - زر +

**القسم السفلي - Tabs**: "Explore" | "My Templates"
- **Explore**: فلاتر (Most Popular, All Topics, All Styles) + شبكة 2 أعمدة من القوالب
  - أول كارد "Create Blank Slides" مع أيقونة +
  - باقي الكروت: صور preview حقيقية لقوالب + زر "Apply"
- **My Templates**: قوالب المستخدم المحفوظة

**تفاصيل القالب**: عند الضغط على قالب يفتح صفحة تفاصيل تعرض:
  - معاينة slides من القالب
  - وصف القالب + tags (تكنولوجيا، تسويق، أعمال)
  - الأبعاد + لون الثيم
  - زر "Use This Template"

### البيانات
- القوالب تُجلب من جدول Supabase `slide_templates` (جديد)
- كل قالب: `id, name, description, thumbnail_url, preview_images, tags[], style, color, dimensions, prompt_template, display_order`
- حاليا نضيف 10-15 قالب placeholder ببيانات ثابتة (hardcoded) حتى يتم إضافة القوالب الحقيقية من بوت تليجرام

### Flow التوليد الحقيقي
1. المستخدم يكتب الموضوع + يختار الأسلوب + عدد الشرائح + (اختياريا) قالب
2. Edge Function `generate-slides` (جديد):
   - يرسل للـ AI (عبر Lovable AI Gateway) طلب توليد محتوى الشرائح كـ structured JSON
   - لكل slide: يولد image prompt ويرسله لـ `generate-image` endpoint (FLUX.2 Klein عبر deapi.ai)
   - يجمع كل شيء ويرسل النتيجة
3. **Preview**: عرض الشرائح واحدة واحدة مع أزرار تنقل (يمين/يسار)
4. **Download**: زر تنزيل PPTX (يستخدم pptxgenjs client-side)

### Edge Function: `supabase/functions/generate-slides/index.ts`
- يستقبل: `{ topic, style, slideCount, templateId? }`
- يستخدم Lovable AI Gateway لتوليد المحتوى
- يستخدم deapi.ai لتوليد صور كل slide
- يُرجع: `{ slides: [{ title, content, imageUrl, speakerNotes }] }`

### المفاتيح المطلوبة
- `DEAPI_KEY` - مطلوب لتوليد الصور عبر FLUX.2 Klein (سأطلبه من المستخدم)
- `OPENROUTER_API_KEY` - موجود بالفعل
- `LOVABLE_API_KEY` - موجود بالفعل

---

## الجزء 3: إضافة Lovable AI feedback

### في `supabase/functions/chat/index.ts`
- إضافة error handling واضح لـ 429/402 من Lovable AI Gateway
- عرض toast مناسب للمستخدم

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| `src/pages/ChatPage.tsx` | شبكة 4×2 + Drawer بدل Dialog |
| `src/pages/agents/SlidesAgentPage.tsx` | إعادة كتابة كاملة - Genspark style |
| `supabase/functions/generate-slides/index.ts` | **جديد** - Edge Function |
| `src/App.tsx` | لا تغيير (route موجود) |

---

## ترتيب التنفيذ
1. ChatPage: شبكة 4×2 أيقونات دائرية + Drawer من الأسفل
2. SlidesAgentPage: إعادة بناء UI كامل مع tabs + قوالب + معاينة
3. Edge Function generate-slides
4. طلب مفتاح DEAPI من المستخدم

