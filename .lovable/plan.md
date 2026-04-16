

# خطة تطبيق iOS 26 Liquid Glass الحقيقي — مستوحاة من المستودعات المرجعية

## ما تعلمته من المستودعات

### من `liquid_glass_widgets` (Flutter):
- **37 عنصر زجاجي** مع blur حقيقي + specular highlights + spring/jelly animations
- **GlassThemeData**: `thickness: 30-50`, `blur: 12-18`, `specularSharpness: soft/medium/sharp`
- **GlassSegmentedControl**: مؤشر متحرك مع refraction حقيقي
- **GlassMenu/GlassActionSheet**: قوائم عائمة بتأثير زجاجي كامل
- **Spring physics**: ارتداد طبيعي عند الضغط + jelly deformation

### من `adaptive_platform_ui` (Flutter):
- **Native UIButton**: spring animations + haptic feedback
- **Native UISegmentedControl**: تأثير Liquid Glass على المؤشر
- **Native UIToolbar/UITabBar**: blur effects + minimize behavior
- **Context menus**: قوائم ضبابية مع preview + native animations

### من `GlassExplorer` (iOS Swift):
- خصائص Glass الداخلية: `specular highlight angle`, `displacement`, `refraction depth`
- تأثير العدسة الحقيقي: per-pixel refraction مع chromatic aberration

### من CSS/Web implementations:
- **SVG displacement mapping** + `feDisplacementMap` + `feTurbulence` للتشوه الزجاجي الحقيقي
- **Specular layer**: `::before` pseudo-element بتدرج أبيض رفيع
- **Multi-layer shadows**: 3-4 طبقات ظل خفيفة بدل ظل واحد ثقيل
- **CSS tokens**: `--lg-bg-color`, `--lg-highlight`, `--lg-specular`

---

## التنفيذ

### 1. نظام التصميم الجديد (`src/index.css`)

إضافة SVG filter مدمج في HTML + CSS classes محدّثة:

**SVG Liquid Glass Filter** (يُضاف في `index.html`):
```html
<svg style="display:none">
  <filter id="liquid-glass-distort">
    <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" seed="92" result="noise"/>
    <feGaussianBlur in="noise" stdDeviation="2" result="blurred"/>
    <feDisplacementMap in="SourceGraphic" in2="blurred" scale="6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

**CSS Classes المحدّثة** — كل class سيحصل على:
- **Specular highlight**: `::before` مع `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)`
- **Multi-layer shadows**: 4 طبقات ظل (inner top light + inner bottom dark + medium spread + soft glow)
- **Higher blur**: `blur(100px) saturate(2.5)` للـ milk glass
- **Rounded corners**: CSS variable `--glass-radius: 28px`
- **Active state**: `scale(0.94)` مع `transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot)

إضافة classes جديدة:
- `.liquid-glass-card` — بطاقات كبيرة مع specular + shadow lift
- `.liquid-glass-menu` — قوائم عائمة مع `filter: url(#liquid-glass-distort)` + stagger
- `.liquid-glass-input` — مربعات إدخال بحواف لمعان
- `.liquid-glass-segment` — segmented control بخلفية زجاجية
- `.ios-spring-bounce` — `@keyframes` مع overshoot طبيعي

### 2. تحديث صفحة الشات (`ChatPage.tsx` + `AnimatedInput.tsx` + `ChatMessage.tsx`)

- الهيدر: `liquid-glass-subtle` + `rounded-[28px]` margin
- أزرار القائمة: `liquid-glass-button` + `rounded-2xl` + `active:scale-[0.94]`
- DropdownMenu: `liquid-glass-menu` + `rounded-[22px]`
- حالة الشاشة الفارغة: أزرار Photos/Files/Videos → `liquid-glass-card` + stagger animation
- قائمة +: `liquid-glass-milk` + `rounded-[28px]` + عناصر `liquid-glass-card`
- مربع الإدخال: `liquid-glass-input` + specular highlight
- زر الإرسال: `rounded-2xl` + spring press
- فقاعات الرسائل: `liquid-glass-subtle` + `rounded-[22px]`
- أزرار النسخ/الإعجاب: `liquid-glass-button` + `rounded-xl`

### 3. تحديث صفحة الملفات (`FilesPage.tsx`)

- Plan|Work toggle: `liquid-glass-segment` + `layoutId` spring indicator
- مربع الإدخال الخارجي والداخلي: `liquid-glass-input` + `rounded-[28px]`
- أزرار الخدمات: `liquid-glass-card` + `whileTap={{ scale: 0.94 }}`
- بطاقات Recent: `liquid-glass-card` + `rounded-[22px]` + hover lift
- قائمة +: `liquid-glass-menu` + stagger entry
- بطاقة Thumbnail: `liquid-glass-card` + `rounded-[22px]`
- زر Preview العائم: `liquid-glass-pill` + spring press

### 4. تحديث FilePreviewPanel + ResearchFlow

- أزرار عائمة: `liquid-glass-card` + spring animation
- خطوات البحث: specular highlight على النجمة النشطة
- تحسين mobile viewport

### 5. إضافة SVG filter في `index.html`

- فلتر SVG مخفي للـ displacement mapping
- يستخدمه `.liquid-glass-menu` وعناصر أخرى

### 6. إصلاح منطق Plan/Work + الأسئلة الذكية + Conversational Editing

(كما في الخطة السابقة المعتمدة — بدون تغيير)

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `index.html` | إضافة SVG filter مخفي |
| `src/index.css` | نظام iOS 26 كامل مع specular + displacement + spring |
| `src/pages/ChatPage.tsx` | تحديث كل العناصر بالـ classes الجديدة |
| `src/pages/FilesPage.tsx` | تحديث UI + Plan/Work + منطق التوليد |
| `src/components/AnimatedInput.tsx` | تصميم زجاجي + spring press |
| `src/components/ChatMessage.tsx` | فقاعات وأزرار iOS 26 |
| `src/components/files/FilePreviewPanel.tsx` | أزرار + mobile fix |
| `src/components/files/ResearchFlow.tsx` | تحسين animations |

---

## الفرق الجوهري عن النسخة الحالية

| العنصر | الحالي | الجديد |
|--------|--------|--------|
| Blur | `60px` | `100px` + `saturate(2.5)` |
| Specular | خط واحد `inset 0 0.5px` | `::before` gradient overlay + inner glow |
| Distortion | لا يوجد | SVG `feDisplacementMap` على القوائم |
| Press | `scale(0.97)` CSS | `scale(0.94)` مع spring overshoot curve |
| Corners | `rounded-3xl` (~24px) | `rounded-[28px]` |
| Shadows | 2 طبقات | 4 طبقات (inner top + inner bottom + medium + soft) |
| Menu animation | بدون | Stagger + scale + opacity + spring |

