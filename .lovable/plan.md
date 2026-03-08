

## تحسين زر اختيار النموذج في الصور والفيديوهات + مراجعة التجاوب

### التغييرات

**`src/components/ModelSelector.tsx`** — زر Images/Videos (سطر 220-226):
- تكبير الحجم: `py-2 px-5` بدل `py-1.5 px-4`، خط `text-sm font-semibold` بدل `text-xs font-medium`
- زوايا أنعم: `rounded-2xl`
- تأثيرات بصرية: `shadow-sm backdrop-blur-sm`
- تفاعل: `transition-all duration-200 active:scale-95`
- إضافة أيقونة `Sparkles` صغيرة (من lucide-react) قبل اسم النموذج
- تجاوب: `max-w-[200px] truncate` لمنع كسر النص على الشاشات الصغيرة

**`src/pages/ImagesPage.tsx`** (سطر 473) و **`src/pages/VideosPage.tsx`** (سطر 456):
- تحديث colorClass ليشمل shadow مناسب: `shadow-pink-500/25` للصور و `shadow-violet-500/25` للفيديوهات

### النتيجة
زر أكبر، أوضح، أنيق مع أيقونة Sparkles، تأثير ضغط سلس، ومتجاوب تماماً مع جميع الأجهزة.

