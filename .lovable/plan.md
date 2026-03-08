

## إعادة ترتيب صفحة Integrations حسب الأهمية

### الترتيب الجديد للفئات (من الأهم للأقل)

1. **Essential** — GitHub, Gmail, Google Drive, Slack, Notion
2. **Productivity** — Google Calendar, Outlook, Microsoft Teams, Zoom
3. **Development** — Supabase, Figma
4. **Social & Marketing** — YouTube, Instagram, Facebook, LinkedIn, Discord
5. **Business** — HubSpot

### التغييرات
- **`src/pages/IntegrationsPage.tsx`**: إعادة تصنيف وترتيب مصفوفة `integrations` بفئات جديدة تعكس الأهمية
- ترتيب الفئات يدوياً بدلاً من استخدام `new Set` (الذي يعتمد على ترتيب الظهور)

