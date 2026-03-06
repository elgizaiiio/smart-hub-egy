

# Megsy Platform - Comprehensive Fixes & Improvements

## Issues to Fix

### 1. Chat Page - "Unlock Pro" text change
- Change "Unlock Megsy Pro" → "Unlock Pro" and remove the Sparkles icon from FancyButton

### 2. Images/Videos/Files Pages - Chat-like conversation flow
Currently these pages show a static generate → result flow. Need to convert them to a chat-like interface where:
- User message appears as a bubble (like ChatPage)
- ThinkingLoader animation shows while generating
- Result appears inline in the conversation (image/video/file preview)
- Users can continue the conversation to iterate

### 3. Files Page - PDF as primary download format
- Change primary download from HTML to PDF (using browser print-to-PDF or html2pdf approach)
- Keep HTML preview but offer PDF download button prominently

### 4. Images/Videos - Model selector positioning
Currently the ModelSelector dropdown uses `centerDropdown` which positions it as `fixed top-1/2 left-1/2` but it doesn't appear properly. Fix: ensure the dropdown renders as a modal overlay properly centered with a backdrop.

### 5. Social media icons - Replace emoji with real SVG icons
Replace 📘 📸 💼 emojis in "Publish to" sections with actual Facebook, Instagram, LinkedIn SVG icons from lucide-react (or inline SVGs).

### 6. RTL/BiDi text mixing fix
Arabic text mixed with English breaks layout. Add `dir="auto"` to message containers and use CSS `unicode-bidi: plaintext` on prose content.

### 7. Web Search - Force 2 images
Update search edge function to request images from Serper API explicitly, and ensure at least 2 images are always returned. Update ChatMessage to always display images when search is enabled.

### 8. Verify fal.ai model endpoints
Review `generate-image` and `generate-video` edge functions to ensure all model IDs map correctly to real fal.ai endpoints.

---

## Technical Plan

### Files to Edit:

**`src/components/FancyButton.tsx`** - Remove Sparkles icon

**`src/pages/ChatPage.tsx`** - Change "Unlock Megsy Pro" → "Unlock Pro"

**`src/pages/ImagesPage.tsx`** - Convert to chat-like conversation flow with messages array, ThinkingLoader, and inline image results. Fix model selector to render as centered modal. Replace emoji social icons with real SVGs.

**`src/pages/VideosPage.tsx`** - Same chat-like conversion. Fix model selector. Replace emoji icons.

**`src/pages/FilesPage.tsx`** - Convert to chat-like flow with ThinkingLoader. Add PDF download as primary format. Show file preview inline in conversation.

**`src/components/ModelSelector.tsx`** - Fix centerDropdown positioning to use a proper modal overlay with backdrop

**`src/components/ChatMessage.tsx`** - Add `dir="auto"` and `unicode-bidi: plaintext` for BiDi text support

**`src/index.css`** - Add BiDi CSS rules for prose-chat

**`supabase/functions/search/index.ts`** - Add `gl` and `type: "images"` params to ensure images are returned. Make a separate images API call to Serper.

**`supabase/functions/generate-image/index.ts`** - Verify all fal.ai endpoint mappings are correct

**`supabase/functions/generate-video/index.ts`** - Verify all fal.ai endpoint mappings are correct

### Key Architecture Changes:

**Images/Videos/Files → Chat-like flow:**
```text
State: messages[] array (like ChatPage)
User sends prompt → user message bubble appears
→ ThinkingLoader shows
→ API call (fal.ai for images/videos, Lovable AI for files)
→ Result appears as assistant message with embedded media
→ User can send follow-up messages
```

**ModelSelector center fix:**
```text
Current: fixed positioning but doesn't show properly
Fix: Use a Dialog/modal pattern with proper z-index and backdrop
```

**Search images fix:**
```text
Current: Serper returns images but they may be empty
Fix: Make separate /images API call to Serper
Always attach at least 2 images to search results
```

