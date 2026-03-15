

# Plan: Comprehensive Platform Fixes & Enhancements

This is a very large request with 40+ items. I will break it into **4 phases**, each implementable in one message. Given the scope, I recommend approving phase by phase.

---

## Phase 1: Critical Fixes & Core UX (Priority)

### 1. Image/Video Grid Sizing
- Standardize showcase grid cards to fixed max dimensions (e.g., `max-h-64` on mobile) so they don't take over the screen
- Use `aspect-square` or `aspect-video` constraints

### 2. Mobile Viewport Overflow Fix
- Add `overflow-x-hidden` to all app pages' root containers
- Ensure `max-w-full` on all content sections

### 3. Keyboard Stability
- Add `position: fixed` or use `visualViewport` API to keep input bars pinned when keyboard opens
- Prevent content shift by using `window.visualViewport.height` for layout

### 4. Model Icon Fallback on Page Load
- Fix the model icon showing a blank div on initial load by ensuring `FALLBACK_LOGOS` covers the default model

### 5. Like Button Bounce Animation
- Add `framer-motion` spring animation on like/dislike click: scale 1 -> 1.4 -> 1

### 6. ThinkingLoader: Single Star
- Change from 3 stars to 1 star with smooth floating animation in chat/files/code

### 7. Transparent Headers
- Remove backgrounds/borders from top header bars in Chat, Images, Videos, Files pages

### 8. Chat Input Text: "Ask Megsy ?"
- Change AnimatedInput placeholder to "Ask Megsy ?"

### 9. Remove DeepSeek Model
- Remove from `modelDetails.ts` and `chat/index.ts` system prompt

### 10. Remove BookOpen Icon from Deep Research
- In ChatPage plus menu, remove the icon next to "Deep Research"

### 11. Fix Content Copy Protection
- Mobile: long-press shows "Copy" button popup (not native menu)
- Desktop: allow normal text selection/copy (remove `user-select: none` for desktop)
- Allow paste in input fields (already works but verify)

### 12. Star Color Fix in Chat
- Keep the star icon always blue (primary), don't change on interaction

### 13. Fix "ميجزي" to "ميغسي"
- Search and replace all Arabic name occurrences

### 14. Textarea Auto-expand
- Make all input textareas expand with content up to a max height

---

## Phase 2: Chat & Files Fixes

### 1. Camera Button Fix
- Change camera input to `capture="environment"` with `accept="image/*"` (already correct, but ensure Camera button opens camera, not gallery)
- Separate Camera button: `<input capture="environment">` vs Photos button: `<input accept="image/*">` without capture

### 2. File/Image Attachments Fix in Chat
- Show attached images above input bar cleanly
- Show above user message bubble after sending
- Actually send image data to AI model (currently only sends as `image_url` type in messages)

### 3. Files Page: Previous Conversation File Recovery
- Save `htmlContent` in messages table (add column or use `images` field as JSON)
- Restore Preview/Download buttons when loading old conversations

### 4. Files Page: Memory System
- Store file conversation context in messages, use full history when generating

### 5. Files Page: Realistic AI Responses
- Update system prompt to vary responses, not repeat same phrases

### 6. Files Page: Download Fix
- Replace print-based PDF with proper Blob download

### 7. Files Page: Integrations Menu
- Show only 1 integration (Google Drive) with "Show more" button
- Remove fake integration icons

### 8. Files Page: Image/File Attachments Actually Reaching AI
- Send file data as multimodal content to the AI model
- For images: send as `image_url` type
- For documents: extract text and include in prompt

### 9. Files Page: 3 Suggestions Only
- Reduce SUGGESTIONS array to 3 items, clean layout

### 10. Search Integration in Files
- Add web search toggle to Files page

### 11. Deep Research Fix
- Debug why no response appears after deep research completes (likely tool call handling issue in streaming)

### 12. Chat System Prompt Model Names
- Megsy V1 = "Megsy by Megsy AI"
- Gemini = "Google by Google"  
- GPT = "GPT by OpenAI"
- Grok = "Grok by xAI" (not "Grok company")

### 13. AI Response Length Balance
- Update system prompt: sometimes concise, sometimes detailed based on question complexity

---

## Phase 3: Media Generation & Storage

### 1. Generation Loading Animation
- Replace ThinkingLoader with a generation-specific placeholder card
- Blurred gradient animation with moving colors inside a card-shaped container
- Real-time counter showing elapsed seconds
- No icons or emoji

### 2. Redirect to Studio After Generation
- After image/video generation starts, navigate to `/image-studio` or `/video-studio`
- Pass generation state via location.state or context

### 3. Sidebar: Studio Link
- Replace recent conversations with a "Studio" button in sidebar for images/videos modes

### 4. Fix Video Generation
- Debug `generate-video` edge function - check fal.ai polling and response parsing
- Check edge function logs for errors

### 5. Image/Video Storage in Supabase
- Create `generated-media` storage bucket
- Upload generated images/videos to Supabase storage
- Provide proper download URLs instead of external fal.ai URLs

### 6. Image Preview Component
- Create a reusable image lightbox/preview component for chat, images, and files pages

### 7. deapi.ai Integration for Megsy Models
- Create `api_keys` table for storing multiple API keys
- Add Telegram bot command to manage keys
- Rotate through 50+ keys for Megsy Imagine/Video
- Set cost to 1 MC for Megsy models via deapi

---

## Phase 4: Business & Misc

### 1. Chat Feature Gating
- Model switching: available for Starter+ plans
- Learning/Shopping modes: Starter+ plans
- Integrations + Connectors: Pro+ plans
- Show lock icon with "Upgrade" for free users
- Hide gated items after subscription

### 2. Pricing Page: Enterprise Card
- Make Enterprise card same style as others
- Add feature list (no icons/emoji)
- Button leads to `/enterprise` form page
- Enterprise form: company name, size, needs, contact info
- Submit sends to admin via Telegram bot and email

### 3. Settings About Page
- Replace external link with internal page
- Show buttons to: About (external), Egypt page, Models, Security, Blog, Changelog, Careers

### 4. Telegram Bot: Light/Dark Model Icons
- Store 2 icon variants per model in storage
- Bot sends appropriate variant based on theme

### 5. Long-press Copy on Mobile
- Show custom "Copy" popup on long-press for message text
- Block image long-press copy/save entirely

### 6. Shopping Mode with Real Search
- Integrate with web search to find real products
- Ask clarifying questions (like ChatGPT reference screenshots)
- Show product results with images and links

---

## Files to Create/Edit (Phase 1 estimate)
| Action | File |
|--------|------|
| Edit | `src/pages/ImagesPage.tsx` - grid sizing, loading animation, transparent header |
| Edit | `src/pages/VideosPage.tsx` - same fixes |
| Edit | `src/pages/ChatPage.tsx` - placeholder, star color, deep research icon, header, copy |
| Edit | `src/pages/FilesPage.tsx` - suggestions, header, memory |
| Edit | `src/components/ThinkingLoader.tsx` - single star animation |
| Edit | `src/components/ChatMessage.tsx` - like bounce, long-press copy |
| Edit | `src/components/AnimatedInput.tsx` - placeholder text, auto-expand |
| Edit | `src/index.css` - desktop copy allowed, mobile protection |
| Edit | `src/lib/modelDetails.ts` - remove DeepSeek |
| Edit | `supabase/functions/chat/index.ts` - model names, response length |

I recommend starting with **Phase 1** (critical fixes and core UX). Shall I proceed?

