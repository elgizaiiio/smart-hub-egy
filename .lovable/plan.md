

# خطة تنفيذ شاملة: إعادة تصميم صفحات الصور والفيديوهات + إصلاحات الشات والقائمة الجانبية

---

## الجزء 1: إصلاحات الشات والقائمة الجانبية (سريعة)

### 1.1 صور التسوق لا تظهر
المشكلة: `images.weserv.nl` proxy لا يعمل مع بعض URLs. الحل: إضافة proxy بديل (wsrv.nl) + fallback مباشر بدون proxy. تعديل `InfoCards.tsx`.

### 1.2 مشكلة Invite Dialog
المشكلة: عند توليد الرابط يحدث عدم استقرار. الحل: إضافة `break-all` و `max-w-full` على النص + `overflow-hidden` على الحاوية في `ChatPage.tsx`.

### 1.3 القائمة الجانبية
- تغيير أيقونة `Coins` إلى `CreditCard` (أيقونة بطاقة)
- إضافة خلفية `fancy-btn` المتحركة لزر المستخدم + البطاقة (بدلاً من `bg-white/10`)
- تعديل `AppSidebar.tsx`

### 1.4 السماح بالنسخ
إضافة `select-all` و `user-select: text` عبر CSS global في `index.css` لكل الصفحات.

---

## الجزء 2: إعادة تصميم صفحة الصور (الأكبر)

### 2.1 البنية الجديدة

```text
ImagesPage.tsx
├── Tab Bar: [Home] [Studio] [Community]
├── Home Tab
│   ├── Tools Section (cards with preview image/video)
│   └── Models Section (with badges NEW/PRO)
├── Studio Tab (user's generated images)
└── Community Tab (from showcase_items table)
```

### 2.2 الأدوات (14 أداة) - كل واحدة بصفحة مستقلة

| # | اسم الأداة | النموذج | السعر MC | نوع الإدخال |
|---|-----------|---------|---------|------------|
| 1 | Inpaint | fal-ai/qwen-image-edit/inpaint | 1 | صورتان + نص |
| 2 | Clothes Changer | fal-ai/nano-banana-pro/edit | 4 | صورة + اختيار ستايل |
| 3 | Headshot | fal-ai/image-apps-v2/headshot-photo | 1 | صورة |
| 4 | Background Remover | fal-ai/bria/background/remove | 0.5 | صورة |
| 5 | Face Swap | fal-ai/flux-2/klein/9b/base/edit | 0.5 | صورتان |
| 6 | Relight | bria/fibo-edit/relight | 1 | صورة + لون + موضع |
| 7 | Image Colorizer | bria/fibo-edit/colorize | 1 | صورة |
| 8 | Character Swap | fal-ai/flux-2/klein/9b/base/edit | 0.5 | صورتان |
| 9 | Storyboard | fal-ai/flux-2-pro | 1 | نص |
| 10 | Sketch to Image | bria/fibo-edit/sketch_to_colored_image | 1 | صورة |
| 11 | Retouching | fal-ai/retoucher | 1 | صورة |
| 12 | Remover | fal-ai/qwen-image-edit-plus-lora-gallery/remove-element | 1 | صورة + نص |
| 13 | Hair Changer | fal-ai/image-apps-v2/hair-change | 1 | صورة |
| 14 | Cartoon | fal-ai/image-editing/cartoonify | 1 | صورة |
| 15 | Avatar Maker (3D) | fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d | 4 | صورة |

### 2.3 Clothes Changer - التفاصيل
- عرض 6 ستايلات (كرة القدم، Mirror Selfie، Mountain، Gamer، Business، Esports) + Blank
- ستايل كرة القدم: عرض 50+ نادي مع ألوان وملعب
- كل ستايل له برومبت مخصص
- زر Blank يفتح مربع إدخال حر مع رفع صور

### 2.4 النماذج الجديدة
- SeDream 5.0: `fal-ai/bytedance/seedream/v5/lite/text-to-image` + `/edit` - 1 MC
- Wan 2.2: `fal-ai/wan/v2.2-a14b/text-to-image` + `/image-to-image` - 1 MC
- أوسمة: NEW على الجديدة، PRO على التي تكلف 3+ MC

### 2.5 زر تحسين البرومبت
زر ✨ بجانب مربع الإدخال يستدعي Gemini Flash لتحسين البرومبت.

---

## الجزء 3: إعادة تصميم صفحة الفيديوهات

### 3.1 نفس البنية
```text
VideosPage.tsx
├── Tab Bar: [Home] [Studio] [Community]
├── Home Tab
│   ├── Tools Section (cards with preview video)
│   └── Models Section (with badges)
├── Studio Tab (user's generated videos)
└── Community Tab (from showcase_items)
```

### 3.2 الأدوات (6 أدوات)

| # | اسم الأداة | النموذج | السعر MC | إدخال | فيديو Preview |
|---|-----------|---------|---------|------|--------------|
| 1 | Swap Characters | fal-ai/pixverse/swap | 4-5.5 (×2 if >5s) | فيديو + صورة | /m_3736q2d581.mp4 |
| 2 | Upscale | fal-ai/bytedance-upscaler/upscale/video | per-sec dynamic | فيديو | /m_3736jvh701.mp4 |
| 3 | Talking Photo | fal-ai/heygen/avatar4/image-to-video | 1.5/sec | صورة + صوت/نص | /m_373603i1h1.mp4 |
| 4 | Video Extender | fal-ai/veo3.1/extend-video | 3-5/sec | فيديو | /m_3736vpf581.mp4 |
| 5 | Auto Caption | fal-ai/auto-caption | 2 flat | فيديو | /m_3736uqhii1.mp4 |
| 6 | Lip Sync | veed/lipsync | 6/min | فيديو + صوت | /m_373603i1h1.mp4 |

### 3.3 تسعير Upscale الديناميكي
- Standard: 1 MC/sec لكل الدقات
- Pro: 1/sec@1080p, 2/sec@2K, 3/sec@4K
- يتم حساب التكلفة بناءً على مدة الفيديو × السعر

---

## الجزء 4: Edge Functions الجديدة

### 4.1 `image-tools` Edge Function
واحدة جديدة تتعامل مع كل أدوات الصور (14 أداة). تستقبل `tool_id` + المعاملات وتوجه الطلب إلى fal.ai المناسب. تشمل:
- خصم الكريدت
- رفع الصورة إلى fal.ai
- إرجاع النتيجة
- تخزين في generated-media bucket

### 4.2 `video-tools` Edge Function
واحدة جديدة لأدوات الفيديو (6 أدوات). نفس النمط مع دعم:
- الحساب الديناميكي للتكلفة (مدة × سعر)
- Async polling pattern
- مضاعفة التكلفة إذا الفيديو > 5 ثواني (Swap)

### 4.3 `enhance-prompt` Edge Function
تستدعي Gemini Flash لتحسين البرومبت. بسيطة: تستقبل prompt وترجع enhanced prompt.

---

## الجزء 5: صفحات الأدوات الفردية

كل أداة لها صفحة مستقلة (React route). ملفات جديدة:

**صور:**
- `src/pages/tools/InpaintPage.tsx` - مربعا رفع + نص
- `src/pages/tools/ClothesChangerPage.tsx` - ستايلات + أندية
- `src/pages/tools/HeadshotPage.tsx` - رفع صورة فقط
- `src/pages/tools/BgRemoverPage.tsx` - رفع صورة فقط
- `src/pages/tools/FaceSwapPage.tsx` - مربعا رفع
- `src/pages/tools/RelightPage.tsx` - رفع + اختيار لون
- `src/pages/tools/ColorizerPage.tsx` - رفع صورة
- `src/pages/tools/CharacterSwapPage.tsx` - مربعا رفع
- `src/pages/tools/StoryboardPage.tsx` - نص فقط
- `src/pages/tools/SketchToImagePage.tsx` - رفع صورة
- `src/pages/tools/RetouchingPage.tsx` - رفع صورة
- `src/pages/tools/RemoverPage.tsx` - رفع + نص
- `src/pages/tools/HairChangerPage.tsx` - رفع صورة
- `src/pages/tools/CartoonPage.tsx` - رفع صورة
- `src/pages/tools/AvatarMakerPage.tsx` - رفع صورة (3D output)

**فيديوهات:**
- `src/pages/tools/VideoSwapPage.tsx` - فيديو + صورة
- `src/pages/tools/VideoUpscalePage.tsx` - فيديو + خيارات
- `src/pages/tools/TalkingPhotoPage.tsx` - صورة + صوت/نص
- `src/pages/tools/VideoExtenderPage.tsx` - فيديو
- `src/pages/tools/AutoCaptionPage.tsx` - فيديو
- `src/pages/tools/LipSyncPage.tsx` - فيديو + صوت

**مكون مشترك:**
- `src/components/ToolPageLayout.tsx` - Layout مشترك لكل الأدوات (header + back button + result display)

---

## الجزء 6: التصميم

### UI لصفحة Home
- بطاقات الأدوات: صورة/فيديو preview مع overlay gradient + اسم + سعر MC
- بطاقات النماذج: أيقونة + اسم + سعر + badges (NEW/PRO)
- Tab bar: 3 أزرار مستديرة بأسلوب TikTok (pill-style)

### UI لصفحات الأدوات
- تصميم نظيف: header مع زر رجوع + اسم الأداة
- مربعات رفع بحدود منقطة
- زر Generate كبير مع عرض التكلفة
- نتيجة تظهر أسفل مع زر تحميل

### Glassmorphism
كل الأدوات تستخدم نفس النمط: `bg-black/60 backdrop-blur-2xl rounded-2xl border-white/10`

---

## الملفات المتأثرة

| ملف | نوع التغيير |
|-----|-----------|
| `src/pages/ImagesPage.tsx` | إعادة كتابة كاملة |
| `src/pages/VideosPage.tsx` | إعادة كتابة كاملة |
| `src/pages/ChatPage.tsx` | إصلاحات صغيرة |
| `src/components/AppSidebar.tsx` | تعديل أيقونة + خلفية |
| `src/components/InfoCards.tsx` | إصلاح proxy الصور |
| `src/index.css` | إضافة user-select |
| `src/App.tsx` | إضافة routes جديدة (~20) |
| `src/components/ToolPageLayout.tsx` | **جديد** |
| `src/pages/tools/*.tsx` | **جديد** (21 صفحة) |
| `supabase/functions/image-tools/index.ts` | **جديد** |
| `supabase/functions/video-tools/index.ts` | **جديد** |
| `supabase/functions/enhance-prompt/index.ts` | **جديد** |
| `supabase/functions/generate-image/index.ts` | إضافة نماذج جديدة |

---

## ملاحظة التنفيذ

هذا طلب ضخم جداً (21 صفحة أداة + 3 edge functions + إعادة تصميم صفحتين كاملتين). سأبدأ بالإصلاحات السريعة ثم أبني البنية المشتركة (`ToolPageLayout` + Edge Functions) ثم صفحات الأدوات واحدة تلو الأخرى. كل الأدوات ستستخدم نفس الـ layout المشترك لتقليل التكرار.

