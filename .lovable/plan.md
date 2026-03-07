

# Comprehensive UI Overhaul Plan

This is a large multi-file change touching 10+ files across the project. Here is the breakdown:

---

## 1. Model Picker Sheet Redesign (`src/components/ModelPickerSheet.tsx`)
- Remove star ratings from cards completely
- Redesign cards with cleaner layout: rounded thumbnails, model name, credits, description only
- Detail view: show media from `model_media` table (same image/video uploaded via Telegram bot), remove star rating, cleaner info layout
- Modernize overall grid aesthetic with better spacing and hover effects

## 2. Chat Branding - Selected Model Display (`src/pages/ChatPage.tsx`)
- Show selected model chip next to the payment/upgrade button in the header area (visible when conversation starts)
- Add small X button on the chip to deselect/reset to default
- Add real logos (SVG) for chat models: Gemini, GPT, Grok, DeepSeek (inline SVG components)

## 3. Pricing Page Overhaul (`src/pages/PricingPage.tsx`)
- Rename "Business" to "Elite", badge "Best Value" to "Premium"
- Update credits:
  - Monthly: Starter=250, Pro=500, Elite=1500
  - Yearly: Starter=2500, Pro=5000, Elite=15000
- Starter card: dark bg `#1A1A2E`, border `#333355`, subtle dark button `#2A2A4A`
- Pro card: purple `#7C3AED` at 10% opacity bg, purple border, "MOST POPULAR" purple badge, full purple button, visually larger
- Elite card: gold `#FFD700` at 10% opacity bg, gold border, "PREMIUM 👑" gold badge, gold gradient button `#FFD700 → #FFA500`

## 4. Transparent Input Box (`src/components/AnimatedInput.tsx`)
- Remove solid `bg-secondary/60` background
- Apply `bg-transparent backdrop-blur-md border border-border/30` (Claude AI style)
- Apply consistently across all pages that use custom input (ImagesPage, VideosPage, FilesPage, ProgrammingPage, ChatPage)

## 5. Sticky Header + Input Behavior
**Group 1 (sticky header + sticky bottom input):** ChatPage, FilesPage, ProgrammingPage
- Header: `sticky top-0 z-20`
- Input: `sticky bottom-0` (always visible)

**Group 2 (sticky header only, input above keyboard on focus):** ImagesPage, VideosPage
- Header: `sticky top-0 z-20`
- Input: normal flow at bottom, no sticky (shows above keyboard naturally on mobile when focused)

## 6. Referrals Page Update (`src/pages/ReferralsPage.tsx`)
- Change accent to gold `#FFD700` for referral-specific elements (icon, step circles, commission text)
- Add tagline: "20% Forever — No Limits — No Expiry"
- Add subtitle: "Every subscriber you refer = 20% every month — Forever"

## 7. Sidebar Redesign (`src/components/AppSidebar.tsx`)
- Reorder services: Chat, Images, Videos, Code, Files
- Add "Referrals" link with gold `💰` icon between Files and Settings separator
- Make "Recent" section sticky within the scrollable area (header "Recent" stays pinned)
- Add section dividers and mode-specific icons for each service
- Professional styling with subtle hover effects

## 8. Send Button Loading State (`src/components/AnimatedInput.tsx` + page-level inputs)
- Loading/cancel button color: `#7C3AED` (purple) instead of destructive red
- Add slow pulse animation: `animate-pulse` with custom slower timing
- Ensure it adapts to theme

## 9. Placeholder Updates
- **Chat** (`AnimatedInput.tsx` default): Replace with 4 items cycling: "What's on your mind?", "Ask anything...", "Let's figure it out...", "Try me!"
- **Images** (`ImagesPage.tsx`): Replace PLACEHOLDERS with: "Describe your image...", "Logo design...", "Anime character...", "A sunset landscape..."
- **Videos** (`VideosPage.tsx`): Replace with: "Describe the scene you want to create...", "A cinematic video of a sunset over the ocean...", "A sports car speeding on the highway...", "A man walking through a misty forest..."
- **Files** (`FilesPage.tsx`): Replace FILE_PLACEHOLDERS with: "Write a professional business proposal...", "Create a detailed report about...", "Create a structured presentation about...", "Summarize this document for me..."

## 10. Integration Icons (`src/pages/IntegrationsPage.tsx`)
- Replace Lucide icons for Slack, Outlook, Discord, Google Drive, Google Calendar, HubSpot with real brand SVG icons (inline components)

---

## Files to modify:
1. `src/components/ModelPickerSheet.tsx` - Redesign + remove stars + detail media
2. `src/pages/ChatPage.tsx` - Model branding chip + model logos
3. `src/pages/PricingPage.tsx` - Full redesign with themed cards
4. `src/components/AnimatedInput.tsx` - Transparent bg + purple loading + new placeholders
5. `src/pages/ImagesPage.tsx` - New placeholders + transparent input + header behavior
6. `src/pages/VideosPage.tsx` - New placeholders + transparent input + header behavior
7. `src/pages/FilesPage.tsx` - New placeholders + sticky input
8. `src/pages/ProgrammingPage.tsx` - Sticky input
9. `src/components/AppSidebar.tsx` - Reorder + Referrals link + sticky Recent + icons
10. `src/pages/ReferralsPage.tsx` - Gold theme + new taglines
11. `src/pages/IntegrationsPage.tsx` - Real brand SVG icons

