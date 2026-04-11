

# Files Page Complete Overhaul

## Problems Identified

1. **2Slides API is completely wrong** - Current code calls `https://api.2slides.com/v1/presentations` which doesn't exist. The real API is at `https://2slides.com/api/v1/slides/generate` (Fast PPT) and `https://2slides.com/api/v1/slides/create-pdf-slides` (Nano Banana Pro)
2. **Template images use ibb.co share URLs** (not direct image URLs) - they won't render. Need to use 2slides.com's own preview URLs instead
3. **HTML file generation relies on AI outputting raw HTML** which is unreliable - often returns markdown mixed with HTML, causing broken previews
4. **No job polling** - 2Slides API is async for Pro mode, requires polling `/api/v1/jobs/{jobId}` every 20-30s
5. **No deep research before file creation** - current research step is fragile and often returns empty
6. **Status feedback is minimal** - no progressive updates during generation
7. **Image search for documents uses Serper** but doesn't use stock photo APIs (no Pexels/Unsplash key available, so we'll use Serper images which is already working)

## What I'll Build

### 1. Fix `generate-slides` Edge Function (Complete Rewrite)

Use the correct 2Slides API endpoints:

**Normal Mode (Fast PPT):**
- `POST https://2slides.com/api/v1/slides/generate`
- Body: `{ themeId, userInput, responseLanguage: "Auto", mode: "sync" }`
- Returns `downloadUrl` directly

**Pro Mode (Nano Banana):**
- `POST https://2slides.com/api/v1/slides/create-pdf-slides`
- Body: `{ userInput, mode: "async" }`
- Returns `jobId` → poll `GET https://2slides.com/api/v1/jobs/{jobId}` every 20s until `status: "success"`
- Then return `downloadUrl`

### 2. Fix Template Data

Replace broken ibb.co URLs with 2slides.com's own preview images:
```
image: "https://2slides.com/login_preview/st-1763716811881-gt30ikwgk_slide1.webp"
```
These are the real hosted preview images from 2slides.com's CDN.

### 3. Redesign FilesPage.tsx (Full Rewrite)

**Hero section:** Large gradient text "CREATE ANYTHING" with animated subtitle cycling through capabilities

**Input bar:** Larger rectangular input (min-h-[100px]) with:
- Plus button for file attachments
- Send button
- Active service badge

**Service buttons:** Single horizontal scroll row below input:
- Slides, Slides Pro, Document, Resume, Report, Spreadsheet, Letter

**Template picker:** When "Slides" is selected, show templates in a horizontal scroll with real preview images from 2slides.com

**Chat area:** Clean message bubbles with:
- User messages right-aligned
- Assistant messages with markdown rendering
- Download buttons for completed files
- Preview button for HTML files
- Progressive status updates during generation

### 4. Improve File Generation Logic

**For Slides (Normal):**
1. AI enhances user's topic into detailed slide content
2. Call 2Slides API with selected themeId + enhanced content
3. Return download link + friendly summary

**For Slides Pro:**
1. Deep research via chat function with web search
2. Call 2Slides create-pdf-slides API (async)
3. Poll job status with progressive updates
4. Return download link
5. Deduct 2 credits

**For Documents/Resumes/Reports/Letters:**
1. AI generates comprehensive HTML with proper structure
2. Use existing `buildPreviewHtml` for rendering
3. Show preview + download options

**Dynamic AI response:** Instead of static "Your file is ready" messages, ask the AI to write a natural summary of what it created.

### 5. Robust Streaming & Error Handling

- Proper SSE parsing with buffer management
- Fallback to HTML slides if 2Slides API fails
- Toast notifications for errors
- Retry logic for failed API calls

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/generate-slides/index.ts` | **Rewrite** - correct API endpoints, add job polling |
| `src/pages/FilesPage.tsx` | **Rewrite** - new UI, fixed logic, real template images |

## Technical Notes

- Template preview images: `https://2slides.com/_next/image?url=/login_preview/{templateId}_slide1.webp&w=640&q=75`
- Fast PPT costs 10 credits/slide on 2Slides side (their credits, not ours)
- Nano Banana Pro costs 100 credits/slide on 2Slides (their credits) + 2 of our credits
- Job polling interval: 20 seconds, max 12 attempts (4 minutes timeout)
- No new secrets needed - `TWOSLIDES_API_KEY` already exists

