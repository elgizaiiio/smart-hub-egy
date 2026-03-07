

# Megsy Platform - Comprehensive Update Plan

This is a very large set of changes spanning UI fixes, functional improvements, new pages, and backend updates. I'll organize them by priority and group related changes.

---

## Group 1: Remove BiDi + Fix Text Direction

**Files**: `ChatMessage.tsx`, `ImagesPage.tsx`, `VideosPage.tsx`, `FilesPage.tsx`
- Remove all `dir="auto"` attributes and `style={{ unicodeBidi: "plaintext" }}` from all components

---

## Group 2: Chat Page Fixes

**File**: `ChatPage.tsx`
- Remove search badge/indicator after enabling search (no visible badge, search just works silently in the conversation)
- Only allow one mode at a time (search OR learning OR shopping) - selecting one disables others
- Make header transparent (no background/border) so content passes through
- Show "Searching for X..." / "Searching megsyai.com..." / "Thinking..." status text next to the ThinkingLoader star during search+thinking
- Pass search query context to the ThinkingLoader component to display search status
- Change "MC" to "Credits" everywhere

**File**: `ChatMessage.tsx`
- Remove BiDi attributes
- Ensure search images display properly (they should already work from the `images` prop)

**File**: `ThinkingLoader.tsx`
- Add optional `searchQuery` prop to display "Searching for X..." text next to the animation

---

## Group 3: Chat System Prompt Fix

**File**: `supabase/functions/chat/index.ts`
- Rewrite system prompt: "You are Megsy, a friendly AI assistant. Match the user's language and dialect. Be concise for simple questions, detailed for complex ones. Treat the user like a friend. Adapt to their mood. Never use emoji in responses."

---

## Group 4: Search Images Fix

**File**: `supabase/functions/search/index.ts`
- Already does parallel web+image search. Ensure minimum 2 images returned. Add fallback to knowledge graph images.

**File**: `ChatPage.tsx`
- Pass `searchImages` to assistant message so they display in `ChatMessage`
- Currently saves images to DB but doesn't pass to the live message state during streaming - fix this

---

## Group 5: Model Selector Center Fix (Images/Videos)

**File**: `ModelSelector.tsx`
- Fix `centerDropdown` mode: instead of `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, use a proper dropdown that appears below the button, centered. Use `fixed` positioning calculated from button ref position.

---

## Group 6: Mobile Responsive Fix (All Pages)

**Files**: All pages
- Ensure `h-screen` with no overflow needed. Use `h-[100dvh]` instead of `h-screen` for mobile viewport compatibility
- Reduce padding on mobile, ensure content fits without scroll
- Images/Videos showcase: reduce max-height on mobile
- Settings pages: reduce spacing

---

## Group 7: Files Page Improvements

**File**: `FilesPage.tsx`
- AI describes what it created instead of static text ("I created a document about X. You can preview it now. We could also add Y and Z.")
- Use streaming for file generation to show the AI's description message
- Add to `+` menu: Web Search toggle, Camera/Photos/Files attach buttons, Agents section (Email, Drive integrations)
- Files cost: 2 credits per generation

**File**: `supabase/functions/chat/index.ts`
- Add a file-generation system prompt variant: "You are Megsy, a document creation assistant. Create comprehensive, detailed documents. Output complete HTML with proper CSS styling."

---

## Group 8: Plus Menu Redesign (Chat Page)

**File**: `ChatPage.tsx`
- Redesign `+` menu to match the uploaded screenshot:
  - Top row: Camera, Photos, Files (3 boxes in a grid)
  - Web search toggle with switch
  - Model selector below
  - Modes section
- Remove More Models button (already done)
- Remove search badge after enabling (search integrates silently)

---

## Group 9: Sidebar Fixes

**File**: `AppSidebar.tsx`
- Change "MC" to "Credits"
- Fix user avatar: use actual avatar_url from profile if available, otherwise show initial letter
- Fix user name: already loads from auth, ensure it shows correctly (not "User")
- Load avatar_url from profiles table alongside credits

---

## Group 10: Settings Pages

**File**: `SettingsPage.tsx`
- Fix user avatar same as sidebar
- Change "MC" to "Credits"
- Add Language page route
- Add Integrations page route

**File**: `ProfileSettingsPage.tsx`
- Change "MC" to "Credits"
- Remove borders from cards (no background or borders per user request)

**File**: `CustomizationPage.tsx`
- Remove borders from theme cards (borderless design)

**File**: `BillingPage.tsx`
- Change "MC" to "Credits"
- Improve visual design of the card and history

---

## Group 11: Language Page (New)

**File**: `src/pages/LanguagePage.tsx` (NEW)
- Use `i18next` with `react-i18next` for lightweight, professional translation
- Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- Support: English, Arabic, Spanish, French, German, Chinese, Japanese, Korean, Portuguese, Russian, Turkish, Hindi, Italian, Dutch, Polish, Swedish, etc.
- Create `src/i18n/` directory with translation files
- Note: For MVP, we'll use i18next with built-in translations for UI labels only. Full page translation would require a translation API.

---

## Group 12: Integrations Page (New)

**File**: `src/pages/IntegrationsPage.tsx` (NEW)
- Show available integrations: Gmail, Google Drive, Supabase, GitHub, Facebook, Instagram, LinkedIn, Composio
- Each with connect/disconnect button
- Route: `/settings/integrations`

---

## Group 13: fal.ai Model Pricing

Based on research:
- Flux Pro 1.1: $0.05/image → 2 credits ($0.20) = 300% markup
- Flux Kontext: $0.05 → 2 credits
- Ideogram 3: ~$0.08 → 3 credits
- HiDream I1: ~$0.07 → 3 credits  
- Kling Video Pro (5s): $0.49 → 15 credits ($1.50)
- MiniMax Video: $0.08 → 6 credits
- Luma Dream Machine: ~$0.10 → 8 credits
- WAN 2.1: ~$0.05 → 5 credits
- Tools (upscale, bg-remove): $0.02-0.05 → 1-2 credits

**File**: `ModelSelector.tsx`
- Update credit values for all image and video models with real pricing (100%+ markup)
- Credit price = $0.10, so 1 credit = $0.10

---

## Group 14: Programming Page (CodeWorkspace)

**File**: `CodeWorkspace.tsx`
- Remove GitHub/Supabase from header, move to `+` menu
- Add Chat Mode toggle in `+` menu (plan mode vs build mode)
- Replace sidebar button with back button
- Remove icons from Chat/Preview tab buttons
- Remove header in Preview tab
- Make AI respond conversationally ("I understand you want to build X. I'll create Y and Z for you...")
- Remove emoji from AI messages
- Use streaming with Lovable AI gateway for code generation

**File**: `ProgrammingPage.tsx`
- Keep as-is (entry point)

---

## Group 15: Referrals Page Redesign

**File**: `ReferralsPage.tsx`
- Redesign with better visual hierarchy, larger stats, invite illustration area

---

## Group 16: Auth Page Fix

**File**: `AuthPage.tsx`
- Fix password step: show "Create a password" for new users, "Enter your password" for existing users
- The current `signInWithOtp` check should work but may need error message matching adjustment

---

## Group 17: All Text to English

- Ensure all UI text throughout the site is in English
- Remove any Arabic text from components

---

## Technical Details

### New Dependencies Needed:
- `i18next`, `react-i18next`, `i18next-browser-languagedetector` (for language page)

### Files to Create:
- `src/pages/LanguagePage.tsx`
- `src/pages/IntegrationsPage.tsx`
- `src/i18n/index.ts` + translation files

### Files to Edit:
- `src/pages/ChatPage.tsx` - Plus menu redesign, header fix, search status, modes exclusivity
- `src/pages/ImagesPage.tsx` - Remove BiDi, mobile fixes
- `src/pages/VideosPage.tsx` - Remove BiDi, mobile fixes
- `src/pages/FilesPage.tsx` - AI description, plus menu, remove BiDi
- `src/pages/CodeWorkspace.tsx` - Major overhaul with streaming AI, plan mode
- `src/pages/SettingsPage.tsx` - Avatar fix, routes
- `src/pages/ProfileSettingsPage.tsx` - Borderless cards, credits label
- `src/pages/CustomizationPage.tsx` - Borderless theme cards
- `src/pages/BillingPage.tsx` - Credits label, design improvements
- `src/pages/ReferralsPage.tsx` - Redesign
- `src/pages/PricingPage.tsx` - Credits label
- `src/pages/AuthPage.tsx` - Password step fix
- `src/components/ChatMessage.tsx` - Remove BiDi, search images
- `src/components/AppSidebar.tsx` - Avatar, credits label
- `src/components/ModelSelector.tsx` - Center fix, real pricing
- `src/components/ThinkingLoader.tsx` - Search status text
- `src/index.css` - Remove BiDi CSS if any
- `src/App.tsx` - New routes
- `supabase/functions/chat/index.ts` - System prompt fix, no emoji

### Edge Function Updates:
- `chat/index.ts` - Better system prompt
- `search/index.ts` - Ensure images returned
- `generate-image/index.ts` - Verify endpoints
- `generate-video/index.ts` - Verify endpoints

### Implementation Priority:
1. BiDi removal + mobile responsive (quick fixes)
2. Chat page (plus menu, search, modes, header)
3. Model selector center fix
4. Files page improvements
5. Search images fix
6. Settings pages + new pages
7. CodeWorkspace overhaul
8. fal.ai pricing update
9. Language/Integrations pages

