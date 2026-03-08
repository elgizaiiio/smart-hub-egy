

## الخطة: تحسين تصميم قوائم (+) في جميع الصفحات + تكبير شعار Grok + شارة Pro/Premium للـ Integrations

### الملفات المستهدفة (5 ملفات)

#### 1. `src/components/ModelSelector.tsx`
- تكبير شعار Grok و DeepSeek من `w-4 h-4` إلى `w-5 h-5`

#### 2. `src/pages/ChatPage.tsx` — قائمة (+)
إعادة تصميم القائمة بالكامل:
- أيقونات ملونة داخل دوائر خلفية ناعمة (أخضر للكاميرا، أزرق للصور، بنفسجي للملفات)
- فواصل أنيقة + عناوين أقسام uppercase صغيرة (ATTACH, TOOLS, MODEL, MODES)
- وصف فرعي صغير تحت كل عنصر (مثل "Search the web" تحت Web Search)
- Integrations: شارة gradient ذهبية `Pro / Premium` بدلاً من النص البسيط الحالي
- أنيميشن spring بدلاً من tween
- `rounded-2xl` و padding محسّن

#### 3. `src/pages/ImagesPage.tsx` — قائمة (+)
نفس التصميم الموحد:
- أيقونة Attach ملونة (بنفسجي) مع وصف فرعي
- قسم "PUBLISH TO" بنفس الستايل الجديد
- أيقونات السوشال داخل دوائر ملونة
- شارة `Pro / Premium` ذهبية على الـ publish options

#### 4. `src/pages/VideosPage.tsx` — قائمة (+)
نفس التصميم بالضبط كـ ImagesPage

#### 5. `src/pages/FilesPage.tsx` — قائمة (+)
نفس التصميم الموحد:
- Web Search + Attach بأيقونات ملونة + وصف فرعي
- Integrations (Google Drive, Notion) بشارة `Pro / Premium` ذهبية

### تصميم شارة Pro / Premium الموحدة
```text
┌─────────────────────────────────┐
│  ⚡ Integrations                │
│  Connect your apps     PRO ✨   │  ← شارة ذهبية gradient
└─────────────────────────────────┘
```
الشارة: `bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30` مع أيقونة ⚡ أو Crown

### التصميم الموحد لكل قائمة
```text
┌────────────────────────────────┐
│  ATTACH                        │
│  🟢 Camera                     │
│     Take a photo               │
│  🔵 Photos                     │
│     From gallery               │
│  🟣 Files                      │
│     PDF, TXT, CSV...           │
│ ─────────────────────────────  │
│  TOOLS                         │
│  🔵 Web Search          [ON]   │
│     Search the web             │
│ ─────────────────────────────  │
│  MODEL                         │
│  [Megsy V1 ▾]                  │
│ ─────────────────────────────  │
│  MODES                         │
│  📚 Learning Mode              │
│  🛒 Shopping Mode              │
│ ─────────────────────────────  │
│  ⚡ Integrations    PRO ✨     │
│     Connect your apps          │
└────────────────────────────────┘
```

