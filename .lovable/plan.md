

## تحسين صفحة البرمجة (ProgrammingPage)

### التحسينات المطلوبة

**1. تصميم بصري احترافي:**
- إضافة gradient خفيف في الخلفية (radial gradient) لإعطاء عمق
- أيقونة Code كبيرة متحركة فوق العنوان مع glow effect
- تحسين textarea ليكون أكبر وأوضح مع backdrop-blur وحدود متوهجة عند التركيز (focus glow)
- زر الإرسال أكبر مع أنيميشن hover

**2. Templates أكثر تنوعاً واحترافية:**
- إضافة أيقونات مختلفة لكل template (Globe, ShoppingCart, BarChart3, Smartphone, Gamepad2, Layout)
- توسيع القائمة لـ 6 templates مع وصف قصير لكل واحد
- تصميم البطاقات كـ cards صغيرة بدلاً من chips مسطحة

**3. Projects Grid محسّن:**
- hover effects أقوى مع glow
- تحسين المسافات والأبعاد
- إضافة زر "New Project" في أعلى القسم

**4. Responsive كامل:**
- تحسين المسافات على الموبايل (padding, gap)
- Templates في عمودين على الموبايل بدلاً من wrap عشوائي
- Projects grid يتكيف: 1 عمود على الموبايل الصغير، 2 على الموبايل، 3 على التابلت والديسكتوب
- safe-area-inset-bottom للـ textarea

### الملفات المتأثرة
- **`src/pages/ProgrammingPage.tsx`** — إعادة بناء الواجهة بالكامل

