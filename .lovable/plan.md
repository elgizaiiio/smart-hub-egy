

## المشكلة
القائمة كبيرة جداً وشكلها سيئ كما بالصورة. شارة "PRO ✨" تحتاج تكون "PRO · PREMIUM" بتصميم أكثر احترافية ونظافة.

## الحل

### تصغير القائمة وتنظيفها في جميع الصفحات

**تغييرات موحدة على 4 ملفات:**

1. **تصغير الحجم**: `w-72` → `w-64`، تصغير padding من `p-3` إلى `p-2`
2. **تصغير الأيقونات الدائرية**: `w-9 h-9` و `w-8 h-8` → `w-7 h-7` لكل الدوائر
3. **تقليل padding العناصر**: `py-2.5` → `py-2`، `py-3` → `py-2`
4. **تصغير نص الأقسام**: إبقاء `text-[10px]` uppercase كما هو
5. **شارة PRO · PREMIUM الجديدة**: بدل `PRO ✨` الكبيرة، شارة أنيقة صغيرة:
   - `text-[8px]` بدل `text-[9px]`
   - نص: `PRO · PREMIUM`
   - تصميم: `bg-gradient-to-r from-amber-400/15 to-amber-600/15 text-amber-400 border border-amber-400/20`
   - بدون emoji ✨ (أنظف)
   - `font-semibold tracking-widest uppercase`

### الملفات:
1. `src/pages/ChatPage.tsx` — تصغير + شارة جديدة
2. `src/pages/ImagesPage.tsx` — تصغير + شارة جديدة  
3. `src/pages/VideosPage.tsx` — تصغير + شارة جديدة
4. `src/pages/FilesPage.tsx` — تصغير + شارة جديدة

