

## تحسين قائمة (+) — إضافة شرح للـ Modes وتحسين أيقونة Integrations

### التغييرات

**`src/pages/ChatPage.tsx`**:

1. **إضافة شرح تحت Learning و Shopping**:
   - Learning: `"Learn step by step"`
   - Shopping: `"Find best deals"`

2. **تقريب نص Web Search من الأيقونة**: تقليل الـ gap بين النصوص

3. **تغيير أيقونة Integrations**: استبدال `Zap` بأيقونة `Puzzle` (lucide-react) — أيقونة احترافية تعبر عن التكامل والربط بين الخدمات، بدلاً من البرق التقليدي

### الملف المتأثر
- `src/pages/ChatPage.tsx` — سطور 3 (imports) و 394-424 (modes + integrations)

