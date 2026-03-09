

## Plan: Artlist-Style Desktop Redesign + Telegram Showcase Management

### What We're Building

**Part 1: Desktop ImagesPage Redesign (Artlist-style)**

The current desktop layout has a left settings sidebar + top prompt bar. We'll transform it to match Artlist's AI Toolkit:

- **Full-screen masonry gallery** of showcase media as the background (fetched from a new `showcase_items` table)
- **Floating bottom input bar** with:
  - Left: attachment icons (image upload, video toggle, settings)
  - Center: text input ("Describe the image you want to create")
  - Right: Generate button
  - Bottom row of **clickable chips**: Model name, Aspect Ratio, Quality, Number of Images, Negative Prompt -- each opens a popover/dropdown when clicked
- **Clicking a gallery item** opens a detail modal showing the media full-size + prompt + settings (Model, Aspect ratio, Duration, File type) + Download + Recreate buttons
- Remove the left sidebar settings panel on desktop (keep mobile drawer as-is)
- Generated images appear in a lightbox/overlay on top of the gallery

**Part 2: New Database Table**

Create `showcase_items` table:
- `id` (uuid, PK)
- `media_url` (text) -- URL to the image/video
- `media_type` (text) -- 'image' or 'video'
- `prompt` (text) -- the generation prompt
- `model_id` (text) -- which model was used
- `model_name` (text) -- display name
- `aspect_ratio` (text) -- e.g. "16:9", "9:16"
- `quality` (text) -- e.g. "2K", "4K"
- `duration` (text, nullable) -- for videos, e.g. "8 sec"
- `style` (text, nullable)
- `display_order` (integer)
- `created_at` (timestamptz)

**Part 3: Telegram Bot -- Showcase Management**

Add a new menu option "🎨 Showcase" to the main menu that allows:
1. **Add showcase item**: Sequential flow asking for:
   - Upload image/video
   - Enter prompt text
   - Select model (from existing model lists)
   - Enter aspect ratio
   - Enter quality
   - Enter duration (for videos)
2. **View/Delete showcase items**: List current items with delete option
3. Items are uploaded to `model-media` storage bucket and saved to `showcase_items` table

### Technical Details

**Files to modify:**
1. `src/pages/ImagesPage.tsx` -- Complete desktop layout redesign
2. `src/components/ImageSettingsPanel.tsx` -- Extract chip-based settings bar component
3. New: `src/components/ShowcaseGrid.tsx` -- Masonry gallery component fetching from `showcase_items`
4. New: `src/components/ShowcaseDetailModal.tsx` -- Detail modal for clicked gallery items
5. New: `src/components/BottomInputBar.tsx` -- Floating bottom bar with chips
6. `supabase/functions/telegram-bot/index.ts` -- Add showcase management section
7. New migration for `showcase_items` table

**Desktop layout structure:**
```text
┌─────────────────────────────────────────┐
│  Masonry Gallery (showcase_items)       │
│  ┌──┐ ┌────────┐ ┌──────┐ ┌──┐ ┌────┐ │
│  │  │ │        │ │Video │ │  │ │    │ │
│  │  │ │        │ │      │ │  │ │    │ │
│  ├──┤ │        │ ├──────┤ │  │ ├────┤ │
│  │  │ └────────┘ │Video │ │  │ │    │ │
│  │  │            │      │ │  │ │    │ │
│  └──┘            └──────┘ └──┘ └────┘ │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📎 Describe the image...    Generate│ │
│  │ [Model] [16:9] [2K] [1 Image]       │ │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Mobile:** Keeps existing layout unchanged (sidebar drawer + top input bar).

