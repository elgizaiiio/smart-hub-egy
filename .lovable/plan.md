

# خطة تطبيق iOS 26 Liquid Glass الحقيقي — النسخة النهائية

## المشكلة الحالية
الـ CSS classes موجودة بالفعل (`liquid-glass`, `liquid-glass-card`, `liquid-glass-menu`, etc.) لكن **لا تبدو مثل iOS 26** لأن:
- قيم الـ blur مرتفعة جداً (100px) مما يسبب أداء ضعيف وشكل باهت
- الـ specular highlights تستخدم `hsl(var(...))` التي لا تظهر على الخلفيات الداكنة
- لا يوجد refraction/displacement فعلي — فقط blur عادي
- ألوان الزجاج على الثيم الداكن تحتاج `rgba(255,255,255,0.08-0.15)` وليس HSL variables

## ما سأفعله

### 1. إعادة كتابة نظام CSS بالكامل بناءً على الأكواد الحقيقية
**مصادر الكود:**
- `kevinbism/liquid-glass-effect`: `background: rgba(255,255,255,0.15); backdrop-filter: blur(2px) saturate(180%); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 8px 32px rgba(31,38,135,0.2), inset 0 4px 20px rgba(255,255,255,0.3);`
- `therobbiedavis.com` tutorial: `background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0