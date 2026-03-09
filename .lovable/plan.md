

## خطة إعادة تصميم صفحة الصور بالكامل (على طريقة Leonardo.AI)

### الوضع الحالي
صفحة `/images` حالياً عبارة عن chat-based interface بسيط: prompt bar في الأسفل + عرض الصور كمحادثة. لا يوجد sidebar إعدادات ولا خيارات متقدمة مثل الأبعاد أو الأسلوب أو عدد الصور.

### التصميم الجديد (مثل Leonardo.AI)

```text
┌─────────────────────────────────────────────────────────┐
│ Desktop Sidebar │  Prompt Bar + Generate Button          │
│ (existing)      │──────────────────────────────────────── │
│                 │ [Image] [Video] tabs                    │
│                 │──────────────────────────────────────── │
│  ┌────────────┐ │                                        │
│  │ LEFT PANEL │ │   Generated Images Grid                │
│  │            │ │   (each with prompt, model, size tags)  │
│  │ Model ▼   │ │                                        │
│  │ Style ▼   │ │                                        │
│  │ Dimensions │ │                                        │
│  │ Num Images │ │                                        │
│  │ Private ⊘ │ │                                        │
│  │            │ │                                        │
│  │ Reset      │ │                                        │
│  └────────────┘ │                                        │
└─────────────────────────────────────────────────────────┘
```

### الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/pages/ImagesPage.tsx` | **إعادة كتابة كاملة** — من chat interface إلى Leonardo-style layout |
| `src/components/ImageSettingsPanel.tsx` | **جديد** — اللوحة الجانبية اليسرى (Model, Style, Dimensions, Number, Private) |
| `src/components/ModelSelector.tsx` | تعديل طفيف لدعم فتح model picker من اللوحة الجانبية |
| `supabase/functions/generate-image/index.ts` | تعديل لدعم `num_images`, `image_size`, `style` parameters |
| `src/lib/imageModelCapabilities.ts` | إضافة أنماط الأسلوب (styles) |

### التفاصيل

**1. اللوحة الجانبية اليسرى (`ImageSettingsPanel`)**
- **Model**: dropdown يفتح ModelPickerSheet الموجود حالياً
- **Style**: dropdown بالخيارات: Cinematic, Creative, Dynamic, Fashion, None, Portrait, Stock Photo, Vibrant
- **Image Dimensions**: أزرار 2:3, 1:1, 16:9, Custom + عند الضغط على Custom يظهر popover بـ:
  - Aspect Ratio preview
  - Slider (Wide ↔ Tall)
  - Socials: Twitter/X (4:3), Instagram (4:5), TikTok (9:16)
  - Devices: Desktop (16:9), Square (1:1)
- **Number of Images**: أزرار 1, 2, 3, 4
- **Private Mode**: toggle switch
- **Reset to Defaults**: زر في الأسفل

**2. المنطقة الرئيسية**
- **Prompt bar** في الأعلى (مثل Leonardo): حقل نص + زر Generate أخضر/بنفسجي على اليمين
- **Tabs**: Image | Video (Video يوجه لـ `/videos`)
- **Generated images**: تظهر كـ grid/list. كل صورة تظهر مع:
  - الصورة نفسها
  - الـ prompt المستخدم
  - اسم الموديل + الحجم + السرعة كـ tags
  - زر menu (⋯) للتحميل والمشاركة
- يتم تجميع الصور حسب اليوم (Today, Yesterday...)

**3. تعديل Edge Function**
- إضافة parameter `num_images` لطلب عدة صور في طلب واحد (بعض موديلات fal تدعم `num_images`)
- إضافة `image_size` parameter (e.g., `{ width: 1024, height: 1024 }`)
- إضافة `style` parameter يتم إلحاقه بالـ prompt كـ suffix أو يمرر للموديلات التي تدعمه

**4. الموديلات الجديدة المطلوبة**
بناءً على ما ذكرته، سيتم إضافة هذه الموديلات الناقصة:

| الموديل | fal.ai Endpoint |
|---|---|
| Nano Banana Pro | `fal-ai/nano-banana-pro` (already mapped to megsy-v1-img) |
| Lucid Origin | `fal-ai/flux-pro/v1.1` |
| Lucid Realism | `fal-ai/flux/dev` |
| FLUX.1 Kontext | `fal-ai/flux-pro/kontext/text-to-image` |
| FLUX Dev | `fal-ai/flux/dev` |
| FLUX Schnell | `fal-ai/flux/schnell` |
| Phoenix 1.0 | `fal-ai/flux-pro/v1` |
| GPT-Image-1 | `fal-ai/gpt-image-1` |
| Seedream 4.0 | `fal-ai/bytedance/seedream/v4/text-to-image` |

سيتم تحديث `MODEL_MAP` في edge function + `modelDetails.ts` + `ModelSelector.tsx` + `imageModelCapabilities.ts`.

**5. Mobile**
- على الموبايل: اللوحة الجانبية تصبح collapsible drawer يفتح من أيقونة settings
- الـ prompt bar يبقى في الأعلى

### ملاحظات
- التصميم يتبع الـ dark theme الحالي
- كل الأنيميشن بـ framer-motion
- يبقى نظام المحادثات والحفظ كما هو
- يبقى نظام الـ credits كما هو

