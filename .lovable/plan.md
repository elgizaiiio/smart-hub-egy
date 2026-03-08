

# تغيير ألوان صفحة الإحالة إلى ذهبي

## التغييرات

### 1. `src/pages/ReferralsPage.tsx`
- سطر 215: `text-green-500` → inline style `color: #FFD700`
- سطر 250: `text-green-500` → inline style `color: #FFD700`
- سطر 183: إضافة class `fancy-btn-gold` لزر Request Withdrawal

### 2. `src/index.css`
- إضافة variant جديد `fancy-btn-gold` بعد `fancy-btn-green` (سطر 446):
```css
.fancy-btn-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500) !important;
}
.fancy-btn-gold::after {
  background: linear-gradient(135deg, #FFD700, #FFA500) !important;
}
.fancy-btn-gold .fold {
  background: linear-gradient(135deg, rgba(255,215,0,0.8), rgba(255,165,0,0.5)) !important;
}
```

### 3. `src/components/FancyButton.tsx`
- لا تغيير — الـ class يُمرر عبر `className` prop

### الملفات المتأثرة
| ملف | التغيير |
|-----|---------|
| `src/pages/ReferralsPage.tsx` | ألوان الحالة + class الزر |
| `src/index.css` | إضافة `fancy-btn-gold` variant |

